import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
  error: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-3" style={{ maxWidth: '400px' }} dir="rtl">
        {toasts.map(t => {
          const Icon = icons[t.type];
          const c = colors[t.type];
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text,
                animation: 'slideUp 0.3s ease',
              }}
            >
              <Icon size={20} />
              <span className="flex-1 text-sm font-semibold">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export default ToastProvider;
