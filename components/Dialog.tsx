
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  type?: 'info' | 'success' | 'warning' | 'confirm';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  type = 'info',
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy bỏ'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl relative z-10 border border-slate-200"
          >
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                {type === 'success' && <div className="p-3 bg-emerald-100 rounded-2xl"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>}
                {type === 'warning' && <div className="p-3 bg-red-100 rounded-2xl"><AlertCircle className="w-8 h-8 text-red-600" /></div>}
                {type === 'confirm' && <div className="p-3 bg-blue-100 rounded-2xl"><HelpCircle className="w-8 h-8 text-blue-600" /></div>}
                {type === 'info' && <div className="p-3 bg-slate-100 rounded-2xl"><AlertCircle className="w-8 h-8 text-slate-600" /></div>}
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">{title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{message}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              {type === 'confirm' ? (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => { onConfirm?.(); onClose(); }}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    {confirmText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors"
                >
                  Đóng
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Dialog;
