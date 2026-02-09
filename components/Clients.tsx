import React, { useState, useMemo } from 'react';
import { Client, Project } from '../types';
import { UserPlus, Search, Edit2, Trash2, PhoneCall, Mail, History, Briefcase, Calendar, DollarSign, ArrowRight, Check, MapPin } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import ConfirmDeleteModal from './ui/ConfirmDeleteModal';
import { formatBRL } from '../utils/format';
import { useCrud } from '../hooks/useCrud';

interface ClientsProps {
  clients: Client[];
  projects: Project[];
  onAddClient: (client: Omit<Client, 'id' | 'projectHistory'>) => void;
  onUpdateClient: (id: string, updates: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  onNavigate: (tab: string) => void;
}

const INITIAL_CLIENT_DATA = {
  name: '',
  phone: '',
  email: '',
  address: ''
};

const Clients: React.FC<ClientsProps> = ({ clients, projects, onAddClient, onUpdateClient, onDeleteClient, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientFolder, setSelectedClientFolder] = useState<Client | null>(null);
  
  // Estado para o modal de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Hook genérico para gerenciar estado do formulário (Novo/Editar)
  const { 
    isOpen, 
    editingId, 
    formData, 
    openNew, 
    openEdit, 
    close, 
    updateField 
  } = useCrud(INITIAL_CLIENT_DATA);

  const filteredClients = useMemo(() => {
    return clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [clients, searchTerm]);

  const handleSave = () => {
    if (!formData.name.trim()) return alert("O nome do cliente é obrigatório.");
    
    if (editingId) {
      onUpdateClient(editingId, formData);
    } else {
      onAddClient(formData);
    }
    close();
  };

  const initiateDelete = () => {
    if (editingId) {
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (editingId) {
      onDeleteClient(editingId);
      setIsDeleteModalOpen(false);
      close();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    
    let formatted = "";
    if (v.length > 0) {
      formatted = `(${v.slice(0, 2)}`;
      if (v.length > 2) formatted += `) ${v.slice(2, 3)}`;
      if (v.length > 3) formatted += `.${v.slice(3, 7)}`;
      if (v.length > 7) formatted += `-${v.slice(7)}`;
    }
    
    updateField('phone', formatted);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header com Busca e Botão Novo */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2D473944] group-focus-within:text-[#6B8E23] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar cliente por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-[#2D473911] rounded-2xl font-black text-[#2D4739] shadow-sm outline-none placeholder:text-[#2D473922] focus:border-[#6B8E23] transition-all"
          />
        </div>
        <Button onClick={openNew} variant="primary" icon={<UserPlus size={20} />}>
          Novo Cliente
        </Button>
      </div>

      {/* Grid de Cartões de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-8 rounded-[3rem] border border-[#2D473911] shadow-2xl shadow-[#2D473908] hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-[1.75rem] bg-[#FDFBE2] border border-[#2D473911] flex items-center justify-center text-[#2D4739] font-black text-2xl uppercase shadow-sm transition-transform group-hover:rotate-6">
                {client.name.charAt(0)}
              </div>
              <button 
                onClick={() => openEdit(client.id, {
                  name: client.name,
                  phone: client.phone,
                  email: client.email,
                  address: client.address
                })} 
                className="p-3 bg-white border border-[#2D473911] text-[#2D473966] hover:text-[#6B8E23] rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Edit2 size={18} />
              </button>
            </div>
            
            <h3 className="text-xl font-black text-[#2D4739] mb-6 tracking-tighter leading-tight line-clamp-2">
              {client.name}
            </h3>
            
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-4 bg-[#FDFBE2]/40 p-3 rounded-2xl border border-[#2D473908]">
                <PhoneCall size={14} className="text-[#6B8E23] flex-shrink-0" />
                <span className="text-xs font-black text-[#2D4739AA] uppercase tracking-wider truncate">
                  {client.phone || "Não informado"}
                </span>
              </div>
              <div className="flex items-center gap-4 bg-[#FDFBE2]/40 p-3 rounded-2xl border border-[#2D473908]">
                <Mail size={14} className="text-[#6B8E23] flex-shrink-0" />
                <span className="text-xs font-black text-[#2D4739AA] uppercase tracking-wider truncate">
                  {client.email || "Sem e-mail"}
                </span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-[#2D473908] flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest flex items-center gap-1">
                  <History size={10} /> Projetos
                </span>
                <span className="text-xl font-black text-[#2D4739]">
                  {projects.filter(p => p.clientId === client.id).length}
                </span>
              </div>
              <Button variant="ghost" onClick={() => setSelectedClientFolder(client)} className="text-[10px] px-4">
                Ver Histórico
              </Button>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-40">
            <UserPlus size={64} className="text-[#2D4739] mb-4" />
            <p className="text-[#2D4739] font-black uppercase tracking-widest">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>

      {/* Modal CRUD (Novo / Editar) */}
      <Modal
        isOpen={isOpen}
        onClose={close}
        title={editingId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
        subtitle="Dados de contato e endereço"
        icon={<UserPlus size={24} />}
        footer={
           <>
             {editingId && (
               <Button variant="danger" icon={<Trash2 size={16} />} onClick={initiateDelete}>
                 Excluir
               </Button>
             )}
             <Button variant="ghost" onClick={close}>Cancelar</Button>
             <Button variant="primary" onClick={handleSave}>Salvar Cliente</Button>
           </>
        }
      >
         <div className="space-y-6">
           <div className="space-y-2">
             <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Nome Completo</label>
             <input 
                type="text" 
                value={formData.name} 
                onChange={e => updateField('name', e.target.value)} 
                className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none focus:border-[#6B8E23] transition-all" 
                placeholder="Ex: João da Silva"
                autoFocus
             />
           </div>
           
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest flex items-center gap-2"><PhoneCall size={12}/> Telefone / Whatsapp</label>
               <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={handlePhoneChange}
                  className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none focus:border-[#6B8E23] transition-all"
                  placeholder="(00) 0.0000-0000" 
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest flex items-center gap-2"><Mail size={12}/> E-mail</label>
               <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => updateField('email', e.target.value)} 
                  className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none focus:border-[#6B8E23] transition-all"
                  placeholder="cliente@email.com" 
               />
             </div>
           </div>
           
           <div className="space-y-2">
             <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> Endereço Completo</label>
             <textarea 
                value={formData.address} 
                onChange={e => updateField('address', e.target.value)} 
                className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none min-h-[100px] resize-none focus:border-[#6B8E23] transition-all"
                placeholder="Rua, Número, Bairro, Complemento..." 
             />
           </div>
         </div>
      </Modal>

      {/* Modal Pasta do Cliente (Histórico) */}
      <Modal
        isOpen={!!selectedClientFolder}
        onClose={() => setSelectedClientFolder(null)}
        title={selectedClientFolder?.name || ''}
        subtitle="Histórico de Projetos e Pedidos"
        maxWidth="max-w-4xl"
        icon={<Briefcase size={28} />}
        footer={<Button onClick={() => setSelectedClientFolder(null)}>Fechar Pasta</Button>}
      >
          {selectedClientFolder && (
             <div className="space-y-6">
                {projects.filter(p => p.clientId === selectedClientFolder.id).length === 0 ? (
                  <div className="text-center py-10 opacity-50 border-2 border-dashed border-[#2D473911] rounded-3xl">
                    <p className="text-sm font-black uppercase text-[#2D4739]">Nenhum projeto registrado para este cliente.</p>
                  </div>
                ) : (
                  projects.filter(p => p.clientId === selectedClientFolder.id).map(p => (
                     <div key={p.id} className="bg-white p-6 md:p-8 rounded-[3rem] border border-[#2D473911] shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 hover:border-[#6B8E23] transition-colors group">
                        <div className="space-y-4 flex-1 w-full">
                           <div className="flex items-center gap-3">
                             <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${p.status === 'Entrega' ? 'bg-[#6B8E23] text-white' : 'bg-[#2D473908] text-[#2D4739]'}`}>
                               {p.status}
                             </span>
                             {p.isPaid && (
                               <span className="text-[9px] font-black uppercase tracking-widest text-[#6B8E23] flex items-center gap-1">
                                 <Check size={10} /> Quitado
                               </span>
                             )}
                           </div>
                           <h4 className="text-2xl font-black text-[#2D4739] tracking-tighter truncate group-hover:text-[#6B8E23] transition-colors">{p.name}</h4>
                           <div className="flex flex-wrap items-center gap-6 text-[#2D473966]">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><Calendar size={14} /> {new Date(p.deadline).toLocaleDateString()}</div>
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><DollarSign size={14} /> R$ {formatBRL(p.value)}</div>
                           </div>
                        </div>
                        <button 
                          onClick={() => { setSelectedClientFolder(null); onNavigate('projects'); }} 
                          className="w-14 h-14 rounded-2xl bg-[#FDFBE2] text-[#2D4739] flex items-center justify-center hover:bg-[#2D4739] hover:text-[#FDFBE2] shadow-sm transition-all border border-[#2D473911]"
                          title="Ir para Projeto"
                        >
                          <ArrowRight size={24} />
                        </button>
                     </div>
                  ))
                )}
             </div>
          )}
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Cliente?"
        description="Tem certeza que deseja remover este cliente? O histórico de projetos associado será perdido permanentemente."
        variant="danger"
        confirmText="Excluir Cliente"
      />
    </div>
  );
};

export default Clients;