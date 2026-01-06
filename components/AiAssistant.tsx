
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeSchedule } from '../services/geminiService';
import { MOCK_EVENTS } from '../constants';
import { Sparkles, Send, Loader2, X } from 'lucide-react';

const AiAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const result = await analyzeSchedule(MOCK_EVENTS, query);
    setResponse(result || "Không có kết quả.");
    setLoading(false);
  };

  return (
    <>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50 flex items-center gap-2"
      >
        <Sparkles className="w-6 h-6" />
        <span className="hidden md:inline font-bold text-sm tracking-tight">HỖ TRỢ AI</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 w-96 max-w-[90vw] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-blue-100 z-50 flex flex-col overflow-hidden"
          >
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-sm uppercase tracking-tight">Trợ lý Thông minh</h2>
                  <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Đang trực tuyến</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto max-h-[400px] min-h-[300px] bg-slate-50/50">
              {response ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Câu hỏi của bạn:</p>
                  <div className="bg-white rounded-2xl p-4 text-slate-800 text-sm font-bold shadow-sm border border-slate-100 mb-4">
                    {query}
                  </div>
                  <p className="text-[10px] font-black text-blue-600 mb-2 uppercase tracking-widest">Trợ lý trả lời:</p>
                  <div className="bg-blue-600 text-white rounded-2xl p-4 text-sm leading-relaxed shadow-lg shadow-blue-100 font-medium">
                    {response}
                  </div>
                  <button 
                    onClick={() => { setResponse(null); setQuery(''); }} 
                    className="mt-4 w-full py-2 text-blue-600 text-xs font-black uppercase tracking-widest hover:bg-blue-50 rounded-xl transition-all border border-blue-100"
                  >
                    Đặt câu hỏi mới
                  </button>
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                  >
                    <Sparkles className="w-16 h-16 text-blue-200 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-slate-500 text-sm font-medium px-6">Tôi có thể giúp bạn tìm lịch họp, người phụ trách hoặc địa điểm công tác tuần này.</p>
                </div>
              )}
            </div>

            <form onSubmit={handleAsk} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hỏi về lịch công tác..."
                className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                disabled={loading}
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit" 
                disabled={loading || !query.trim()}
                className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-lg shadow-blue-200"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiAssistant;
