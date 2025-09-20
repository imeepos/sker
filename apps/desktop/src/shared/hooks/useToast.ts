import { useState, useCallback } from 'react';
import type { ToastType, ToastProps } from '../components/ui/Toast';

interface ShowToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback(({ type, title, message, duration }: ShowToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    const newToast: ToastProps = {
      id,
      type,
      title,
      message,
      duration,
      onClose: (toastId: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== toastId));
      },
    };

    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // 便捷方法
  const success = useCallback((title: string, message?: string, duration?: number) => {
    return showToast({ type: 'success', title, message, duration });
  }, [showToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return showToast({ type: 'error', title, message, duration });
  }, [showToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return showToast({ type: 'info', title, message, duration });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return showToast({ type: 'warning', title, message, duration });
  }, [showToast]);

  return {
    toasts,
    showToast,
    closeToast,
    clearAll,
    success,
    error,
    info,
    warning,
  };
}