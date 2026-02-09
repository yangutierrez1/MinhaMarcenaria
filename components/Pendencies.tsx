import React, { useState } from 'react';
import { ManualPendency } from '../types';
import ConfirmDeleteModal from './ui/ConfirmDeleteModal';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle,
  StickyNote,
  MessageSquarePlus
} from 'lucide-react';

interface PendenciesProps {
  pendencies: ManualPendency[];
  onAddPendency: (text: string) => void;
  onTogglePendency: (id: string) => void;
  onDeletePendency: (id: string) => void;
}

const Pendencies: React.FC<PendenciesProps> = ({ pendencies, onAddPendency, onTogglePendency, onDeletePendency }) => {
  const [inputText, setInputText] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleAdd = () => {
    if (inputText.trim()) {
      onAddPendency(inputText.trim());
      setInputText('');
    }
  };

  const initiateDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      onDeletePendency(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const pendingList = pendencies.filter(p => !p.completed);
  const completedList = pendencies.filter(p => p.completed);

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* Input de Adição Rápida */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-[#2D473911] space-y-8">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-[#6B8E2311] text-[#6B8E23] rounded-2xl shadow-sm">
            <MessageSquarePlus size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#2D4739] tracking-tighter uppercase leading-none">Anotação Rápida</h2>
            <p className="text-[10px] font-black text-[#2D473966] uppercase tracking-[0.3em] mt-2">Registre o que não pode esquecer na oficina</p>
          </div>
        </div>

        <div className="flex gap-4">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ex: Comprar lixas grão 80, Ligar para fornecedor de verniz..."
            className="flex-1 p-6 bg-[#FDFBE2]/30 border-2 border-[#2D473911] rounded-[2rem] font-black text-[#2D4739] text-lg placeholder:text-[#2D473933] focus:border-[#6B8E23] outline-none transition-all shadow-inner"
          />
          <button 
            onClick={handleAdd}
            className="px-10 bg-[#2D4739] text-[#FDFBE2] rounded-[2rem] hover:bg-[#1A2E24] transition-all shadow-xl active:scale-95 flex items-center gap-3"
          >
            <Plus size={24} />
            <span className="font-black text-xs uppercase tracking-widest hidden md:inline">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Lista de Pendências Ativas */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-6">
          <div className="w-12 h-12 bg-[#2D4739] text-[#FDFBE2] rounded-2xl flex items-center justify-center shadow-lg">
            <ClipboardList size={22} />
          </div>
          <h3 className="text-xs font-black text-[#2D4739] uppercase tracking-[0.4em]">Lista de Pendências ({pendingList.length})</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingList.length > 0 ? pendingList.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-[#2D473911] shadow-xl shadow-[#2D473908] flex items-center justify-between group hover:border-[#6B8E23] transition-all">
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <button 
                  onClick={() => onTogglePendency(p.id)}
                  className="w-10 h-10 rounded-2xl border-2 border-[#2D473911] flex items-center justify-center text-[#2D473911] hover:border-[#6B8E23] hover:text-[#6B8E23] transition-all bg-[#FDFBE2]/30 flex-shrink-0"
                >
                  <Circle size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-black text-[#2D4739] tracking-tight truncate">{p.text}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#2D473944] mt-1">
                    Criado em {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => initiateDelete(p.id)}
                className="ml-4 p-3 text-[#2D473922] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                title="Excluir"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )) : (
            <div className="col-span-full py-20 bg-white/30 border-2 border-dashed border-[#2D473911] rounded-[3rem] text-center flex flex-col items-center justify-center opacity-30">
              <StickyNote size={64} className="mb-4" />
              <p className="text-lg font-black uppercase tracking-[0.3em]">Nada pendente por aqui.</p>
            </div>
          )}
        </div>
      </section>

      {/* Histórico / Finalizadas */}
      {completedList.length > 0 && (
        <section className="space-y-6 pt-10">
          <div className="flex items-center gap-4 px-6 opacity-40">
            <h3 className="text-[10px] font-black text-[#2D4739] uppercase tracking-[0.4em]">Finalizadas recentemente</h3>
            <div className="flex-1 h-px bg-[#2D4739] opacity-10"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 opacity-60 hover:opacity-100 transition-opacity duration-500">
            {completedList.map(p => (
              <div key={p.id} className="bg-white/50 p-5 rounded-[2rem] border border-[#2D473908] flex items-center justify-between group hover:bg-white transition-all">
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <button 
                    onClick={() => onTogglePendency(p.id)}
                    className="w-8 h-8 rounded-xl bg-[#6B8E23] text-white flex items-center justify-center shadow-lg flex-shrink-0"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <p className="text-base font-black text-[#2D473966] line-through truncate tracking-tight">{p.text}</p>
                </div>
                <button 
                  onClick={() => initiateDelete(p.id)}
                  className="ml-2 p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Excluir Pendência?"
        description="Tem certeza que deseja remover esta anotação permanentemente? Esta ação não pode ser desfeita."
        variant="danger"
        confirmText="Excluir"
      />
    </div>
  );
};

export default Pendencies;