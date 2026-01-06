
import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

export const authService = {
  login: async (email: string, password: string) => {
    const formattedEmail = email.includes('@') ? email : `${email}@example.com`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formattedEmail,
      password: password,
    });
    
    if (error) throw error;

    if (data.user) {
      await authService.ensureProfileExists(data.user);
    }

    return data.user !== null;
  },

  signUp: async (email: string, password: string, fullName: string) => {
    const formattedEmail = email.includes('@') ? email : `${email}@example.com`;
    
    const { data, error } = await supabase.auth.signUp({
      email: formattedEmail,
      password: password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      // Khi đăng ký mới, vai trò mặc định luôn là 'reporter'
      await authService.ensureProfileExists(data.user, 'reporter');
    }

    return data.user !== null;
  },

  resetPassword: async (email: string) => {
    const formattedEmail = email.includes('@') ? email : `${email}@example.com`;
    const { error } = await supabase.auth.resetPasswordForEmail(formattedEmail, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
    return true;
  },

  ensureProfileExists: async (user: any, defaultRole: string = 'admin') => {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();
    
    if (!existingProfile) {
      await supabase.from('profiles').insert([
        { 
          id: user.id, 
          email: user.email, 
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          role: defaultRole 
        }
      ]);
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    } catch (err) {
      console.error('Lỗi khi thực hiện đăng xuất phía service:', err);
      localStorage.clear();
    }
  },

  getCurrentProfile: async (): Promise<UserProfile | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) return null;

    // Trả về profile kèm theo thông tin xác minh email từ auth session
    return {
      ...data,
      isEmailConfirmed: !!session.user.email_confirmed_at
    } as any;
  },

  getAllProfiles: async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
    return data || [];
  },

  isAuthenticated: async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
  },

  onAuthStateChange: (callback: (isLoggedIn: boolean) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        callback(false);
      } else {
        callback(session !== null);
      }
    });
  }
};
