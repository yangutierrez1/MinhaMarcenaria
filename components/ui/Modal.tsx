import React, { useEffect } from 'react';
    import { createPortal } from 'react-dom';
    import { X } from 'lucide-react';
    
    interface ModalProps {
      isOpen: boolean;
      onClose: () => void;
      title: string;
      subtitle?: string;
      icon?: React.ReactNode;
      footer?: React.ReactNode;
      children: React.ReactNode;
      maxWidth?: string;
    }
    
    const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, subtitle, icon, footer, children, maxWidth = 'max-w-2xl' }) => {
      useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
      }, [isOpen]);
    
      if (!isOpen) return null;
    
      return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A2E24]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`bg-[#FDFBE2] w-full ${maxWidth} rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-white/20 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-[#2D473911] flex justify-between items-center bg-white/50 flex-shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                {icon && (
                  <div className="p-4 rounded-2xl bg-[#2D4739] text-[#FDFBE2] shadow-lg flex-shrink-0">
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-xl md:text-2xl font-black text-[#2D4739] leading-tight uppercase tracking-tight truncate">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs font-black text-[#6B8E23] uppercase tracking-widest mt-1 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-[#2D473911] rounded-2xl text-[#2D4739] transition-all flex-shrink-0">
                <X size={24} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar flex-1">
              {children}
            </div>
    
            {/* Footer */}
            {footer && (
              <div className="p-6 md:p-8 bg-white/50 border-t border-[#2D473911] flex justify-end gap-4 flex-shrink-0 flex-wrap">
                {footer}
              </div>
            )}
          </div>
        </div>,
        document.body
      );
    };
    
    export default Modal;