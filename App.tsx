
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScheduleEvent } from './types';
import { eventService } from './services/eventService';
import { authService } from './services/authService';
import { statsService } from './services/statsService';
import { settingsService } from './services/settingsService';
import { CATEGORY_COLORS } from './constants';
import EventCard from './components/EventCard';
import AiAssistant from './components/AiAssistant';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import Dialog from './components/Dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Building2, 
  Settings, 
  LogOut, 
  Loader2,
  Printer,
  Calendar as CalendarIcon,
  Filter,
  Bell,
  CheckCircle2,
  BellOff,
  Eye
} from 'lucide-react';

const App: React.FC = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [referenceDate, setReferenceDate] = useState(new Date()); 
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notificationsStatus, setNotificationsStatus] = useState<NotificationPermission>('default');
  const [viewCount, setViewCount] = useState(0);
  const [themeColor, setThemeColor] = useState('#1e3a8a');

  // State cho Custom Dialog
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getEvents();
      setEvents(data || []);
    } catch (err) {
      console.error("Refresh Data Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const initSettings = async () => {
      const settings = await settingsService.getSettings();
      setThemeColor(settings.theme_color);
      
      const count = await statsService.incrementViewCount();
      setViewCount(count);
    };
    initSettings();

    // Listen for theme changes from Admin Dashboard
    const handleThemeChange = (e: any) => {
      if (e.detail) setThemeColor(e.detail);
    };
    window.addEventListener('theme-changed', handleThemeChange);

    const interval = setInterval(refreshData, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, [refreshData]);

  useEffect(() => {
    const checkStatus = async () => {
      const authStatus = await authService.isAuthenticated();
      setIsLoggedIn(authStatus);
      if ('Notification' in window) {
        setNotificationsStatus(Notification.permission);
      }
    };
    checkStatus();

    const { data: { subscription } } = authService.onAuthStateChange((status) => {
      setIsLoggedIn(status);
      if (!status) {
        setIsAdminOpen(false);
        setIsLoginOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDialogConfig({
      isOpen: true,
      type: 'info',
      title: 'Hướng dẫn in lịch',
      message: 'Vui lòng nhấn Ctrl + P (Windows) hoặc Command + P (Mac) để thực hiện in lịch công tác tuần này.'
    });
  };

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Xác nhận đăng xuất',
      message: 'Bạn có chắc chắn muốn thoát khỏi hệ thống quản trị lịch công tác?',
      onConfirm: async () => {
        try {
          await authService.logout();
          setIsAdminOpen(false);
          setIsLoginOpen(false);
          
          const isRemembered = localStorage.getItem('remember_me') === 'true';
          if (!isRemembered) {
            localStorage.removeItem('remembered_email');
            localStorage.removeItem('remembered_password');
          }
        } catch (err) {
          console.error("Logout Error:", err);
          setIsLoggedIn(false);
        }
      }
    });
  };

  const handleRequestNotifications = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!('Notification' in window)) {
      setDialogConfig({
        isOpen: true,
        type: 'warning',
        title: 'Không hỗ trợ',
        message: 'Trình duyệt của bạn hiện không hỗ trợ tính năng thông báo đẩy.'
      });
      return;
    }

    if (Notification.permission === 'denied') {
      setDialogConfig({
        isOpen: true,
        type: 'warning',
        title: 'Quyền bị chặn',
        message: 'Bạn đã chặn thông báo. Vui lòng vào cài đặt trình duyệt để cho phép nhận thông báo từ SmartSchedule.'
      });
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationsStatus(permission);
    
    if (permission === 'granted') {
      setDialogConfig({
        isOpen: true,
        type: 'success',
        title: 'Thành công',
        message: 'Thông báo đã được kích hoạt. Bạn sẽ nhận được nhắc nhở khi có lịch công tác mới.'
      });
    }
  };

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    setIsAdminOpen(true);
    refreshData();
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const weekRange = useMemo(() => {
    const monday = getMonday(referenceDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday,
      end: sunday,
      formattedStart: monday.toLocaleDateString('vi-VN'),
      formattedEnd: sunday.toLocaleDateString('vi-VN'),
      weekNumber: Math.ceil((((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)
    };
  }, [referenceDate]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekRange.start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekRange]);

  const filteredEvents = useMemo(() => {
    const startStr = formatDateLocal(weekRange.start);
    const endStr = formatDateLocal(weekRange.end);
    return events.filter(event => {
      const eventDateStr = event.date.split('T')[0];
      const isWithinWeek = eventDateStr >= startStr && eventDateStr <= endStr;
      if (!isWithinWeek) return false;
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (event.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(event.category) : true;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, selectedCategories, weekRange]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, typeof events> = {};
    weekDays.forEach(day => {
      groups[formatDateLocal(day)] = [];
    });
    filteredEvents.forEach(event => {
      const dateKey = event.date.split('T')[0];
      if (groups[dateKey]) groups[dateKey].push(event);
    });
    return groups;
  }, [filteredEvents, weekDays]);

  const sortedDates = Object.keys(groupedEvents).sort();

  // Inject dynamic styles based on themeColor
  const themeStyles = `
    :root {
      --primary-theme: ${themeColor};
    }
    .bg-theme-primary { background-color: var(--primary-theme) !important; }
    .text-theme-primary { color: var(--primary-theme) !important; }
    .border-theme-primary { border-color: var(--primary-theme) !important; }
    .hover\\:bg-theme-primary:hover { background-color: var(--primary-theme) !important; opacity: 0.9; }
    
    /* Overrides for specific UI elements */
    .bg-blue-900 { background-color: var(--primary-theme) !important; }
    .bg-blue-600 { background-color: var(--primary-theme) !important; }
    .text-blue-600 { color: var(--primary-theme) !important; }
    .text-blue-800 { color: var(--primary-theme) !important; }
    .border-blue-600 { border-color: var(--primary-theme) !important; }
    .ring-blue-500:focus { --tw-ring-color: var(--primary-theme) !important; }
    .shadow-blue-200 { --tw-shadow-color: var(--primary-theme) !important; }
  `;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-12">
      <style>{themeStyles}</style>
      
      <header className="bg-theme-primary text-white shadow-md sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16 gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Building2 className="w-7 h-7 text-white/70" />
            <h1 className="text-lg font-bold uppercase hidden sm:block tracking-tighter">SmartSchedule</h1>
          </div>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm nội dung công tác..."
              className="w-full bg-white rounded-lg py-2 pl-9 pr-9 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-theme-primary transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleRequestNotifications} 
              className={`p-2 rounded-lg transition-all ${notificationsStatus === 'granted' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white/70'}`}
              title="Thông báo"
            >
              {notificationsStatus === 'denied' ? <BellOff className="w-4 h-4 pointer-events-none" /> : <Bell className="w-4 h-4 pointer-events-none" />}
            </button>
            
            <button 
              type="button"
              onClick={handlePrint} 
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/70 shadow-sm"
              title="In lịch"
            >
              <Printer className="w-4 h-4 pointer-events-none" />
            </button>

            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isLoggedIn ? setIsAdminOpen(true) : setIsLoginOpen(true);
              }} 
              className={`p-2 rounded-lg transition-colors ${isAdminOpen ? 'bg-white text-theme-primary shadow-inner' : 'bg-white/10 hover:bg-white/20 text-white/70'}`}
              title="Quản trị"
            >
              <Settings className="w-4 h-4 pointer-events-none" />
            </button>

            {isLoggedIn && (
              <button 
                type="button"
                onClick={handleLogout} 
                className="p-2 bg-red-600/20 hover:bg-red-600 rounded-lg transition-colors border border-red-500/30 group shadow-sm"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4 text-red-400 group-hover:text-white pointer-events-none" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 space-y-6 print-hide">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-theme-primary" /> Lịch tuần
            </h3>
            <div className="grid grid-cols-7 lg:grid-cols-1 gap-2">
              {weekDays.map(day => {
                const dateKey = formatDateLocal(day);
                const isToday = dateKey === formatDateLocal(new Date());
                const count = events.filter(e => e.date === dateKey).length;
                return (
                  <button 
                    key={dateKey}
                    type="button"
                    onClick={() => document.getElementById(`date-${dateKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isToday ? 'bg-theme-primary text-white border-theme-primary shadow-lg' : 'bg-slate-50 border-slate-100 hover:border-theme-primary'}`}
                  >
                    <div className="text-left">
                      <p className={`text-[10px] font-bold uppercase ${isToday ? 'text-white/70' : 'text-slate-400'}`}>{day.toLocaleDateString('vi-VN', { weekday: 'short' })}</p>
                      <p className="text-sm font-black">{day.getDate()}</p>
                    </div>
                    {count > 0 && <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black ${isToday ? 'bg-white text-theme-primary' : 'bg-slate-200 text-slate-700'}`}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" /> Bộ lọc
            </h3>
            <div className="space-y-2">
              {Object.keys(CATEGORY_COLORS).map(cat => (
                <button 
                  key={cat} 
                  type="button"
                  onClick={() => toggleCategory(cat)} 
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedCategories.includes(cat) ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS].split(' ')[0]}`} />
                    <span className="text-xs font-bold uppercase tracking-tight">{cat}</span>
                  </div>
                  {selectedCategories.includes(cat) && <CheckCircle2 className="w-4 h-4 text-emerald-600 pointer-events-none" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9">
          <div className="bg-white border border-slate-200 rounded-t-2xl shadow-sm p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <button type="button" onClick={() => setReferenceDate(new Date(referenceDate.setDate(referenceDate.getDate() - 7)))} className="print-hide flex items-center gap-2 text-theme-primary font-bold hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all"><ChevronLeft className="w-4 h-4"/> Tuần trước</button>
            <div className="text-center">
              <span className="text-xs font-black text-theme-primary uppercase">Tuần {weekRange.weekNumber} / {weekRange.start.getFullYear()}</span>
              <h2 className="text-2xl font-black">{weekRange.formattedStart} — {weekRange.formattedEnd}</h2>
            </div>
            <button type="button" onClick={() => setReferenceDate(new Date(referenceDate.setDate(referenceDate.getDate() + 7)))} className="print-hide flex items-center gap-2 text-theme-primary font-bold hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all">Tuần sau <ChevronRight className="w-4 h-4"/></button>
          </div>

          <div className="bg-white border border-slate-200 border-t-0 rounded-b-2xl shadow-sm overflow-hidden min-h-[600px] relative mb-8">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 print-hide">
                <Loader2 className="w-12 h-12 text-theme-primary animate-spin" />
              </div>
            )}
            {sortedDates.map(date => (
              <div key={date} id={`date-${date}`} className="border-b last:border-0 border-slate-100 scroll-mt-20">
                <div className="bg-slate-50/50 border-y border-slate-200 px-6 py-6 text-center">
                  <h3 className="text-xl font-black text-red-600 uppercase">{new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                </div>
                <div className="divide-y divide-slate-100 bg-white">
                  {groupedEvents[date].length > 0 ? (
                    groupedEvents[date].sort((a,b) => a.start_time.localeCompare(b.start_time)).map(event => <EventCard key={event.id} event={event} />)
                  ) : (
                    <div className="py-12 text-center text-slate-300 italic text-sm">Chưa cập nhật nội dung công tác</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-12 pb-8 print:hidden">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3"
            >
              <div className="bg-slate-100 p-2 rounded-xl">
                <Eye className="w-4 h-4 text-theme-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">Tổng lượt xem</p>
                <p className="text-lg font-black text-slate-900 leading-none">
                  {viewCount > 0 ? viewCount.toLocaleString() : <Loader2 className="w-4 h-4 animate-spin inline text-slate-300" />}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      <div className="ai-assistant print-hide">
        <AiAssistant />
      </div>
      
      <AnimatePresence>
        {isLoginOpen && <AdminLogin onClose={() => setIsLoginOpen(false)} onLoginSuccess={handleLoginSuccess} />}
        {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} onDataChange={refreshData} onLogout={handleLogout} />}
        {dialogConfig.isOpen && (
          <Dialog
            isOpen={dialogConfig.isOpen}
            type={dialogConfig.type}
            title={dialogConfig.title}
            message={dialogConfig.message}
            onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
            onConfirm={dialogConfig.onConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
