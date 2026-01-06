
import { supabase } from './supabaseClient';

export const settingsService = {
  /**
   * Lấy trạng thái cấu hình đăng ký người dùng và màu sắc
   */
  getSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('site_stats')
        .select('registration_enabled, theme_color')
        .eq('id', 1)
        .maybeSingle();
      
      if (error) {
        console.error('Lỗi lấy cấu hình:', error.message);
        return { registration_enabled: false, theme_color: '#1e3a8a' }; // Mặc định xanh blue-900
      }
      
      return {
        registration_enabled: data ? !!data.registration_enabled : false,
        theme_color: data?.theme_color || '#1e3a8a'
      };
    } catch (err) {
      console.error('Lỗi ngoại lệ getSettings:', err);
      return { registration_enabled: false, theme_color: '#1e3a8a' };
    }
  },

  /**
   * Lấy trạng thái đăng ký (tương thích ngược)
   */
  getRegistrationStatus: async (): Promise<boolean> => {
    const settings = await settingsService.getSettings();
    return settings.registration_enabled;
  },

  /**
   * Cập nhật trạng thái cho phép đăng ký
   */
  updateRegistrationStatus: async (enabled: boolean): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('site_stats')
        .update({ registration_enabled: enabled })
        .eq('id', 1)
        .select();

      if (error) return false;

      if (!data || data.length === 0) {
        await supabase.from('site_stats').insert({ id: 1, registration_enabled: enabled, view_count: 0 });
      }
      return true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Cập nhật màu chủ đạo của trang web
   */
  updateThemeColor: async (color: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('site_stats')
        .update({ theme_color: color })
        .eq('id', 1)
        .select();

      if (error) {
        console.error('Lỗi cập nhật màu sắc:', error.message);
        return false;
      }

      if (!data || data.length === 0) {
        await supabase.from('site_stats').insert({ id: 1, theme_color: color, view_count: 0 });
      }
      return true;
    } catch (err) {
      console.error('Lỗi ngoại lệ updateThemeColor:', err);
      return false;
    }
  }
};
