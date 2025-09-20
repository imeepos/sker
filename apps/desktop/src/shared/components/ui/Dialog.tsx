import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  // 按ESC键关闭对话框
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // 锁定页面滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* 对话框内容 */}
      <div 
        className={cn(
          'relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        {/* 头部 */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* 内容区 */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}