
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleEvent, UserProfile } from '../types';
import { eventService } from '../services/eventService';
import { authService } from '../services/authService';
import { settingsService } from '../services/settingsService';
import { parseEventFromText } from '../services/geminiService';
import Dialog from './Dialog';
import { 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Sparkles, 
  Loader2, 
  FileText, 
  Calendar, 
  Users, 
  PlusCircle,
  LogOut,
  BarChart3,
  Download,
  Settings as SettingsIcon,
  ShieldAlert,
  Clock,
  MapPin,
  AlignLeft,
  ShieldCheck,
  Palette,
  Check
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onDataChange: () => void;
  onLogout: (e?: React.MouseEvent) => void;
}

interface DashboardUser extends UserProfile {
  isEmailConfirmed?: boolean;
}

const THEME_PRESETS = [
  { name: 'Xanh Chính phủ', color: '#1e3a8a' },
  { name: 'Đỏ Đô', color: '#991b1b' },
  { name: 'Xanh Lá Đậm', color: '#064e3b' },
  { name: 'Tím Than', color: '#4c1d95' },
  { name: 'Đen Sang Trọng', color: '#0f172a' },
  { name: 'Nâu Đất', color: '#451a03' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onDataChange, onLogout }) => {
  const [currentUser, setCurrentUser] = useState<DashboardUser | null>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'reports' | 'config'>('events');
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editingEvent, setEditingEvent] = useState<Partial<ScheduleEvent> | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [isRegEnabled, setIsRegEnabled] = useState(false);
  const [themeColor, setThemeColor] = useState('#1e3a8a');
  const [isConfigSaving, setIsConfigSaving] = useState(false);

  const [reportFromDate, setReportFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportToDate, setReportToDate] = useState(new Date().toISOString().split('T')[0]);

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const profile = await authService.getCurrentProfile();
      setCurrentUser(profile);
      if (profile?.role === 'reporter') {
        setActiveTab('reports');
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [activeTab, currentUser]);

  const loadInitialData = async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      if (activeTab === 'events' || activeTab === 'reports') {
        const data = await eventService.getEvents();
        setEvents(data);
      } 
      if (activeTab === 'users' && currentUser.role === 'admin') {
        const userData = await authService.getAllProfiles();
        setUsers(userData);
      }
      if (activeTab === 'config' && currentUser.role === 'admin') {
        const settings = await settingsService.getSettings();
        setIsRegEnabled(settings.registration_enabled);
        setThemeColor(settings.theme_color);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleToggleRegistration = async () => {
    if (isConfigSaving) return;
    setIsConfigSaving(true);
    const targetStatus = !isRegEnabled;
    const success = await settingsService.updateRegistrationStatus(targetStatus);
    if (success) {
      setIsRegEnabled(targetStatus);
    } else {
      setDialogConfig({
        isOpen: true,
        type: 'warning',
        title: 'Lỗi Database (400)',
        message: 'Không thể lưu cài đặt. Lỗi này thường do chính sách RLS trên Supabase chưa cho phép UPDATE.'
      });
    }
    setIsConfigSaving(false);
  };

  const handleUpdateThemeColor = async (color: string) => {
    setThemeColor(color);
    setIsConfigSaving(true);
    const success = await settingsService.updateThemeColor(color);
    if (success) {
      // Trigger update global theme
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: color }));
    } else {
      setDialogConfig({
        isOpen: true,
        type: 'warning',
        title: 'Lỗi lưu màu sắc',
        message: 'Không thể cập nhật màu sắc vào database.'
      });
    }
    setIsConfigSaving(false);
  };

  const reportEvents = useMemo(() => {
    return events.filter(e => {
      const eDate = e.date.split('T')[0];
      return eDate >= reportFromDate && eDate <= reportToDate;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  }, [events, reportFromDate, reportToDate]);

  const exportToExcel = () => {
    if (reportEvents.length === 0) return;
    const headers = ['Ngày', 'Thời gian', 'Nội dung công tác', 'Địa điểm', 'Phân loại', 'Ghi chú'];
    const rows = reportEvents.map(e => [
      new Date(e.date).toLocaleDateString('vi-VN'),
      `${e.start_time}${e.end_time ? ' - ' + e.end_time : ''}`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${(e.location || '').replace(/"/g, '""')}"`,
      e.category,
      `"${(e.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `Bao_cao_lich_cong_tac.csv`);
    link.click();
  };

  const handleAddNew = () => {
    if (currentUser?.role !== 'admin') return;
    setEditingEvent({
      title: '',
      date: new Date().toISOString().split('T')[0],
      start_time: '08:00',
      end_time: '11:00',
      category: 'Họp',
      location: '',
      description: '',
      participants: []
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || currentUser?.role !== 'admin') return;
    setIsSaving(true);
    try {
      await eventService.saveEvent(editingEvent);
      await loadInitialData();
      setEditingEvent(null);
      setAiInput('');
      onDataChange();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (currentUser?.role !== 'admin') return;
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa lịch này?',
      onConfirm: async () => {
        try {
          await eventService.deleteEvent(id);
          await loadInitialData();
          onDataChange();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleAiAssist = async () => {
    if (!aiInput.trim() || currentUser?.role !== 'admin') return;
    setIsAiLoading(true);
    try {
      const parsed = await parseEventFromText(aiInput);
      if (parsed) setEditingEvent({ ...parsed, id: editingEvent?.id });
    } catch {
      console.error("AI parse error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isReporter = currentUser?.role === 'reporter';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] w-full max-w-[96vw] h-full max-h-[94vh] overflow-hidden flex flex-col shadow-2xl relative z-10 border border-slate-200">
        <div className="border-b bg-white sticky top-0 z-20">
          <div className="p-4 sm:p-6 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-black uppercase tracking-tight">QUẢN LÝ LỊCH</h2>
                {isReporter && <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 uppercase border border-slate-200"><ShieldCheck className="w-3 h-3" /> Reporter</span>}
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-4 mt-4">
                {isAdmin && (
                  <button onClick={() => setActiveTab('events')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${activeTab === 'events' ? 'bg-black text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <Calendar className="w-4 h-4" /> QUẢN LÝ LỊCH
                  </button>
                )}
                <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${activeTab === 'reports' ? 'bg-black text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <BarChart3 className="w-4 h-4" /> BÁO CÁO
                </button>
                {isAdmin && (
                  <>
                    <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${activeTab === 'users' ? 'bg-black text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
                      <Users className="w-4 h-4" /> QUẢN TRỊ VIÊN
                    </button>
                    <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${activeTab === 'config' ? 'bg-black text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
                      <SettingsIcon className="w-4 h-4" /> CẤU HÌNH
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 hover:bg-black hover:text-white rounded-xl text-xs font-black transition-all shadow-sm group uppercase">
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Đăng xuất</span>
              </button>
              <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X className="w-6 h-6" /></button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-black">
          {activeTab === 'events' && isAdmin ? (
            <div className="flex flex-col xl:flex-row gap-10 xl:gap-16">
              <div className="flex-1 space-y-8">
                <AnimatePresence mode="wait">
                  {!editingEvent ? (
                    <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 sm:p-20 text-center flex flex-col items-center justify-center min-h-[400px]">
                      <Calendar className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                      <h3 className="text-xl font-bold text-slate-400 mb-6 uppercase tracking-widest">Sẵn sàng khởi tạo lịch trình mới</h3>
                      <button onClick={handleAddNew} className="bg-black text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 mx-auto hover:bg-slate-800 transition-all shadow-xl shadow-black/10"><PlusCircle className="w-6 h-6" /> TẠO LỊCH MỚI NGAY</button>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl pb-10">
                       <div className="flex justify-between items-center">
                        <h3 className="font-black text-black uppercase tracking-tight text-lg">{editingEvent.id ? 'Sửa lịch công tác' : 'Thêm lịch mới'}</h3>
                        <button type="button" onClick={() => setEditingEvent(null)} className="text-xs font-black text-slate-400 hover:text-red-500 uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-lg">Hủy bỏ</button>
                      </div>
                      
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-black" />
                          <span className="text-[10px] font-black text-black uppercase tracking-widest">Trợ lý AI Nhập liệu</span>
                        </div>
                        <textarea className="w-full p-4 text-sm border border-slate-300 bg-white rounded-2xl h-24 outline-none focus:ring-2 focus:ring-black transition-all font-medium" placeholder="Ví dụ: Họp giao ban lúc 8h sáng ngày 20/5 tại phòng họp 1, thành phần gồm Lãnh đạo sở..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} />
                        <button type="button" onClick={handleAiAssist} disabled={isAiLoading} className="mt-4 w-full bg-white text-black border-2 border-black hover:bg-black hover:text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
                          {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} TỰ ĐỘNG PHÂN TÍCH VÀ ĐIỀN FORM
                        </button>
                      </div>

                      <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Nội dung công tác</label>
                          <input className="w-full p-4 border border-slate-300 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none" value={editingEvent.title || ''} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} required placeholder="Nhập tiêu đề cuộc họp/công tác..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Ngày tháng</label>
                            <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input type="date" className="w-full p-4 pl-12 border border-slate-300 rounded-2xl text-sm font-bold outline-none" value={editingEvent.date || ''} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} required />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Phân loại</label>
                            <select className="w-full p-4 border border-slate-300 rounded-2xl text-sm font-bold outline-none appearance-none bg-white" value={editingEvent.category || 'Họp'} onChange={e => setEditingEvent({...editingEvent, category: e.target.value as any})}>
                                <option value="Họp">Họp</option>
                                <option value="Công tác">Công tác</option>
                                <option value="Tiếp dân">Tiếp dân</option>
                                <option value="Khác">Khác</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Giờ bắt đầu</label>
                            <div className="relative">
                              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input type="time" className="w-full p-4 pl-12 border border-slate-300 rounded-2xl text-sm font-bold outline-none" value={editingEvent.start_time || ''} onChange={e => setEditingEvent({...editingEvent, start_time: e.target.value})} required />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Giờ kết thúc</label>
                            <div className="relative">
                              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input type="time" className="w-full p-4 pl-12 border border-slate-300 rounded-2xl text-sm font-bold outline-none" value={editingEvent.end_time || ''} onChange={e => setEditingEvent({...editingEvent, end_time: e.target.value})} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Địa điểm</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input className="w-full p-4 pl-12 border border-slate-300 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none" value={editingEvent.location || ''} onChange={e => setEditingEvent({...editingEvent, location: e.target.value})} placeholder="Phòng họp số 1, Trụ sở UBND..." />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Thành phần tham dự</label>
                          <div className="relative">
                            <Users className="absolute left-4 top-5 w-4 h-4 text-slate-400" />
                            <textarea className="w-full p-4 pl-12 border border-slate-300 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none min-h-[80px]" value={editingEvent.participants?.join(', ') || ''} onChange={e => setEditingEvent({...editingEvent, participants: e.target.value.split(',').map(p => p.trim())})} placeholder="Lãnh đạo UBND, Sở Kế hoạch... (Phân cách bằng dấu phẩy)" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Ghi chú / Nội dung chi tiết</label>
                          <div className="relative">
                            <AlignLeft className="absolute left-4 top-5 w-4 h-4 text-slate-400" />
                            <textarea className="w-full p-4 pl-12 border border-slate-300 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none min-h-[100px]" value={editingEvent.description || ''} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} placeholder="Các lưu ý chi tiết cho nội dung công tác..." />
                          </div>
                        </div>

                        <button type="submit" disabled={isSaving} className="w-full bg-black text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 transition-all active:scale-95 disabled:bg-slate-300">
                          {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />} LƯU DỮ LIỆU
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="xl:w-[450px] border-t xl:border-t-0 xl:border-l border-slate-100 pt-8 xl:pt-0 xl:pl-10">
                <h3 className="font-black text-black flex items-center gap-2 uppercase tracking-tight mb-6"><FileText className="w-5 h-5 text-black" /> DANH SÁCH LỊCH</h3>
                <div className="space-y-4">
                  {events.length > 0 ? events.slice(0, 15).map(event => (
                    <div key={event.id} className="p-5 border border-slate-200 rounded-3xl bg-white hover:border-black transition-all group relative shadow-sm">
                      <p className="font-black text-sm text-black leading-snug mb-3 pr-14">{event.title}</p>
                      <div className="flex gap-4">
                        <span className="text-[10px] font-black px-2 py-1 bg-slate-50 text-slate-700 rounded-lg border border-slate-100">{new Date(event.date).toLocaleDateString('vi-VN')}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{event.start_time}</span>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setEditingEvent(event)} className="p-2 text-black hover:bg-slate-100 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(event.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 text-slate-300 font-bold uppercase text-xs">Chưa có dữ liệu</div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'reports' ? (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row items-end gap-6">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Từ ngày</label>
                  <input type="date" className="w-full bg-white border border-slate-300 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-black" value={reportFromDate} onChange={(e) => setReportFromDate(e.target.value)} />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Đến ngày</label>
                  <input type="date" className="w-full bg-white border border-slate-300 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-black" value={reportToDate} onChange={(e) => setReportToDate(e.target.value)} />
                </div>
                <button onClick={exportToExcel} className="bg-black hover:bg-slate-800 text-white font-black py-4 px-8 rounded-2xl shadow-xl flex items-center gap-3 transition-all"><Download className="w-5 h-5" /> XUẤT BÁO CÁO</button>
              </div>
              <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-5 text-[10px] font-black text-black uppercase tracking-widest">Thời gian</th>
                        <th className="p-5 text-[10px] font-black text-black uppercase tracking-widest">Nội dung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportEvents.map(e => (
                        <tr key={e.id} className="border-b border-slate-100">
                          <td className="p-5">
                            <p className="font-black text-black text-sm">{new Date(e.date).toLocaleDateString('vi-VN')}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase">{e.start_time}</p>
                          </td>
                          <td className="p-5">
                            <p className="font-bold text-black text-sm">{e.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{e.location}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </div>
          ) : activeTab === 'config' && isAdmin ? (
            <div className="max-w-2xl mx-auto space-y-8 pb-20">
              <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-slate-100 p-4 rounded-3xl">
                    <SettingsIcon className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-black uppercase tracking-tight">Cấu hình Hệ thống</h3>
                    <p className="text-sm text-slate-500 font-medium">Tùy chỉnh các tham số và giao diện</p>
                  </div>
                </div>

                <div className="space-y-10">
                  {/* Cấu hình Đăng ký */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <ShieldCheck className="w-4 h-4 text-slate-400" />
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bảo mật & Truy cập</h4>
                    </div>
                    <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <div className="flex-1">
                        <h4 className="font-black text-black uppercase text-xs tracking-widest mb-1">Trạng thái đăng ký</h4>
                        <p className="text-xs text-slate-500 font-medium pr-4">Bật để cho phép khách tự tạo tài khoản Reporter. Tắt để khóa chức năng này.</p>
                      </div>
                      <button 
                        onClick={handleToggleRegistration}
                        disabled={isConfigSaving}
                        className={`p-1 rounded-full transition-all duration-300 w-16 h-9 flex items-center ${isRegEnabled ? 'bg-black justify-end' : 'bg-slate-300 justify-start'}`}
                      >
                        <motion.div layout className="w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center">
                          {isConfigSaving ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : null}
                        </motion.div>
                      </button>
                    </div>
                  </div>

                  {/* Cấu hình Màu sắc */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <Palette className="w-4 h-4 text-slate-400" />
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Giao diện (Theme Color)</h4>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-xs text-slate-500 font-medium mb-6">Chọn màu chủ đạo cho toàn bộ trang web (Header, Buttons, Icons...)</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {THEME_PRESETS.map((preset) => (
                          <button
                            key={preset.color}
                            onClick={() => handleUpdateThemeColor(preset.color)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${themeColor === preset.color ? 'bg-white border-black' : 'bg-white/50 border-transparent hover:border-slate-300'}`}
                          >
                            <div className="w-6 h-6 rounded-lg shadow-sm" style={{ backgroundColor: preset.color }} />
                            <div className="flex-1 text-left">
                              <p className="text-[10px] font-black uppercase text-slate-700 leading-none">{preset.name}</p>
                            </div>
                            {themeColor === preset.color && <Check className="w-3 h-3 text-black" />}
                          </button>
                        ))}
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tùy chỉnh mã màu HEX</p>
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-md flex-shrink-0" style={{ backgroundColor: themeColor }} />
                          <input 
                            type="text" 
                            className="flex-1 bg-white border border-slate-300 rounded-2xl px-5 font-bold text-sm outline-none focus:ring-2 focus:ring-black"
                            value={themeColor}
                            onChange={(e) => handleUpdateThemeColor(e.target.value)}
                            placeholder="#000000"
                          />
                          <input 
                            type="color"
                            className="w-12 h-12 p-0 border-none bg-transparent cursor-pointer rounded-2xl"
                            value={themeColor}
                            onChange={(e) => handleUpdateThemeColor(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 border border-black p-6 rounded-[2rem] flex items-start gap-4 text-white">
                    <ShieldAlert className="w-6 h-6 text-slate-300 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest mb-1">Hướng dẫn sửa lỗi 400</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">Nếu trạng thái không thay đổi, bạn cần cấp quyền cho Supabase bằng cách chạy đoạn mã sau trong <strong>SQL Editor</strong>:</p>
                      <pre className="bg-black text-slate-300 p-3 rounded-xl text-[10px] overflow-x-auto font-mono">
                        {`ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON site_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'users' && isAdmin ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <div key={user.id} className="bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-black text-black text-lg">{user.full_name || 'Admin'}</p>
                    <span className="text-sm text-slate-500 font-medium">{user.email}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full border ${user.role === 'admin' ? 'bg-black text-white' : 'bg-slate-100 text-black border-slate-200'}`}>{user.role}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <ShieldCheck className="w-20 h-20 mb-4 opacity-10" />
               <p className="text-sm font-bold uppercase tracking-widest">Bạn không có quyền truy cập</p>
            </div>
          )}
        </div>
        <AnimatePresence>
          {dialogConfig.isOpen && (
            <Dialog isOpen={dialogConfig.isOpen} type={dialogConfig.type} title={dialogConfig.title} message={dialogConfig.message} onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))} onConfirm={dialogConfig.onConfirm} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
