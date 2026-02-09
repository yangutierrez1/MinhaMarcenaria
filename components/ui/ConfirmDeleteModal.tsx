import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'success';
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#1A2E24]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#FDFBE2] w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white/20 p-8 md:p-10 animate-in zoom-in-95 duration-200 flex flex-col text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        <div className={`w-20 h-20 mx-auto mb-6 rounded-[2rem] flex items-center justify-center shadow-inner ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-[#6B8E2322] text-[#6B8E23]'}`}>
          {variant === 'danger' ? <AlertTriangle size={36} /> : <CheckCircle2 size={36} />}
        </div>

        <h2 className="text-xl font-black text-[#2D4739] mb-3 uppercase leading-tight">
          {title}
        </h2>

        <p className="text-xs font-bold text-[#2D473988] mb-8 leading-relaxed">
          {description}
        </p>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-[#2D473908] text-[#2D4739] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#2D473911] transition-all"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={`flex-1 py-4 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 transition-all ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#6B8E23] hover:bg-[#5a7a1c]'}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ConfirmDeleteModal;