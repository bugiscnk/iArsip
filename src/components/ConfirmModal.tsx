import { X, AlertTriangle, Trash2, LogOut, FileEdit } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  type = 'info'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getAccentColors = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-rose-50 text-rose-600',
          icon: <Trash2 className="w-6 h-6" />,
          btnConfirm: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500/30'
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600',
          icon: <AlertTriangle className="w-6 h-6" />,
          btnConfirm: 'bg-amber-600 hover:bg-amber-500 text-white focus:ring-amber-500/30'
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-indigo-50 text-indigo-600',
          icon: <LogOut className="w-6 h-6" />,
          btnConfirm: 'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500/30'
        };
    }
  };

  const colors = getAccentColors();

  return (
    <div 
      id="custom-confirm-modal-backdrop" 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div 
        id="custom-confirm-modal-content"
        className="relative w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 space-y-6 animate-in fade-in-50 zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          id="confirm-modal-close-btn"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Icon */}
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${colors.iconBg}`}>
            {colors.icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-sans font-extrabold text-slate-900 tracking-tight leading-tight">
              {title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="confirm-modal-cancel-btn"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition focus:outline-none cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            id="confirm-modal-confirm-btn"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-xl shadow-xs transition focus:outline-none focus:ring-2 cursor-pointer ${colors.btnConfirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
