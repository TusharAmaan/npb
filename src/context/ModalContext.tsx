import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Trash2,
} from 'lucide-react';

export type ModalVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
}

export interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  variant?: ModalVariant;
}

interface ModalState {
  isOpen: boolean;
  type: 'confirm' | 'alert';
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: ModalVariant;
  resolve: (value: boolean) => void;
}

export interface ModalContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  alert: (options: AlertOptions | string) => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts: ConfirmOptions =
        typeof options === 'string' ? { message: options } : options;

      setModalState({
        isOpen: true,
        type: 'confirm',
        title: opts.title || 'Please Confirm',
        message: opts.message,
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        variant: opts.variant || 'danger',
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      const opts: AlertOptions =
        typeof options === 'string' ? { message: options } : options;

      setModalState({
        isOpen: true,
        type: 'alert',
        title: opts.title || (opts.variant === 'success' ? 'Success' : 'Notice'),
        message: opts.message,
        confirmText: opts.confirmText || 'OK',
        cancelText: '',
        variant: opts.variant || 'info',
        resolve: () => resolve(),
      });
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (modalState) {
      modalState.resolve(result);
      setModalState(null);
    }
  };

  // Keyboard shortcut (Escape to cancel, Enter to confirm)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalState) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleClose(true);
      }
    };

    if (modalState) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalState]);

  const renderIcon = () => {
    if (!modalState) return null;
    const { variant, type } = modalState;

    if (variant === 'danger') {
      return (
        <div className="w-12 h-12 rounded-2xl bg-light-red/10 border border-light-red/20 text-light-red flex items-center justify-center flex-shrink-0 shadow-sm shadow-light-red/10">
          {type === 'confirm' ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>
      );
    }
    if (variant === 'warning') {
      return (
        <div className="w-12 h-12 rounded-2xl bg-radiant-yellow/10 border border-radiant-yellow/20 text-amber-500 dark:text-radiant-yellow flex items-center justify-center flex-shrink-0 shadow-sm">
          <AlertCircle className="w-6 h-6" />
        </div>
      );
    }
    if (variant === 'success') {
      return (
        <div className="w-12 h-12 rounded-2xl bg-weird-green/10 border border-weird-green/20 text-emerald-600 dark:text-weird-green flex items-center justify-center flex-shrink-0 shadow-sm">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-2xl bg-light-indigo/10 border border-light-indigo/20 text-light-indigo dark:text-neon-blue flex items-center justify-center flex-shrink-0 shadow-sm">
        <Info className="w-6 h-6" />
      </div>
    );
  };

  const getConfirmButtonStyles = () => {
    if (!modalState) return '';
    const { variant } = modalState;
    if (variant === 'danger') {
      return 'bg-light-red hover:bg-red-600 text-white shadow-md shadow-light-red/30';
    }
    if (variant === 'warning') {
      return 'bg-radiant-yellow hover:bg-amber-400 text-slate-950 shadow-md shadow-radiant-yellow/30';
    }
    if (variant === 'success') {
      return 'bg-weird-green hover:bg-wintergreen text-slate-950 shadow-md shadow-weird-green/30';
    }
    return 'bg-light-indigo hover:bg-light-slate-blue text-white shadow-md shadow-light-indigo/30';
  };

  return (
    <ModalContext.Provider value={{ confirm, alert }}>
      {children}

      {/* Custom Modal Prompt Dialog */}
      {modalState && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => handleClose(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header & Icon */}
            <div className="flex items-start gap-4">
              {renderIcon()}
              <div className="flex-1 pr-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {modalState.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {modalState.message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {modalState.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {modalState.cancelText}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => handleClose(true)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-transform active:scale-95 ${getConfirmButtonStyles()}`}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
