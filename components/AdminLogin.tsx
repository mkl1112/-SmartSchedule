
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/authService';
import { settingsService } from '../services/settingsService';
import { Lock, Mail, X, LogIn, AlertCircle, Loader2, UserPlus, User, CheckSquare, Square, CheckCircle2, ChevronLeft, Save, Info } from 'lucide-react';

interface AdminLoginProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistrationEnabled, setIsRegistrationEnabled] = useState(false);

  useEffect(() => {
    const checkSettings = async () => {
      const enabled = await settingsService.getRegistrationStatus();
      setIsRegistrationEnabled(enabled);
    };
    checkSettings();

    const savedEmail = localStorage.getItem('remembered_email');
    const savedPassword = localStorage.getItem('remembered_password');
    const isRemembered = localStorage.getItem('remember_me') === 'true';

    if (isRemembered && savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (mode === 'login') {
        const success = await authService.login(email, password);
        if (success) {
          if (rememberMe) {
            localStorage.setItem('remembered_email', email);
            localStorage.setItem('remembered_password', password);
            localStorage.setItem('remember_me', 'true');
          } else {
            localStorage.removeItem('remembered_email');
            localStorage.removeItem('remembered_password');
            localStorage.setItem('remember_me', 'false');
          }
          onLoginSuccess();
        }
      } else if (mode === 'signup') {
        if (!isRegistrationEnabled) {
          throw new Error("Chức năng đăng ký hiện đang bị khóa bởi quản trị viên.");
        }
        const success = await authService.signUp(email, password, fullName);
        if (success) {
          setSuccessMsg('Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.');
          setMode('login');
        }
      } else if (mode === 'reset') {
        await authService.resetPassword(email);
        setSuccessMsg('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi xử lý yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-[2.5rem] w-full max-w-md shadow-[0_32px_64px_rgba(0,0,0,0.3)] overflow-hidden relative z-10"
      >
        <div className="bg-blue-900 p-8 sm:p-10 text-white text-center relative overflow-hidden">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24"
          />
          <button 
            type="button"
            onMouseDown={(e) => { e.stopPropagation(); onClose(); }} 
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-white text-blue-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10"
          >
            {mode === 'login' ? <Lock className="w-8 h-8" /> : mode === 'signup' ? <UserPlus className="w-8 h-8" /> : <Mail className="w-8 h-8" />}
          </motion.div>
          <h2 className="text-2xl font-black uppercase tracking-tight relative z-10">
            {mode === 'login' ? 'Đăng nhập hệ thống' : mode === 'signup' ? 'Tạo tài khoản mới' : 'Khôi phục mật khẩu'}
          </h2>
          <p className="text-blue-300 text-[10px] font-black mt-3 uppercase tracking-[0.2em] relative z-10">SmartSchedule Authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-5 bg-slate-50/30">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 overflow-hidden"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 overflow-hidden"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'signup' && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-blue-800 leading-relaxed">Lưu ý: Tài khoản đăng ký mới sẽ được cấp quyền <span className="underline">Xem báo cáo</span> mặc định.</p>
            </div>
          )}

          <div className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm font-bold outline-none"
                    placeholder="Nhập tên của bạn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email quản trị</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm font-bold outline-none"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm font-bold outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-between items-center pt-1 px-1">
                <button 
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  {rememberMe ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                  Ghi nhớ
                </button>
                <button 
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center gap-2 transition-all disabled:bg-slate-300 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'login' ? <LogIn className="w-5 h-5" /> : mode === 'signup' ? <UserPlus className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {mode === 'login' ? 'ĐĂNG NHẬP NGAY' : mode === 'signup' ? 'ĐĂNG KÝ TÀI KHOẢN' : 'GỬI YÊU CẦU ĐẶT LẠI'}
          </motion.button>

          <div className="text-center pt-2">
            {mode === 'reset' ? (
              <button 
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại đăng nhập
              </button>
            ) : (
              isRegistrationEnabled && (
                <button 
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-all"
                >
                  {mode === 'login' ? 'Người dùng mới? Đăng ký tại đây' : 'Đã có tài khoản? Quay lại đăng nhập'}
                </button>
              )
            )}
          </div>
        </form>
        
        <div className="py-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Hệ thống bảo mật tối cao 256-bit</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
