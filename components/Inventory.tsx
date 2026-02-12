import React, { useState, useEffect } from 'react';
import { Material } from '../types';
import { Plus, Edit2, Trash2, Save, Package, Coins, Search, Layers, DollarSign, Store, Calculator, Calendar, Tag, ChevronDown, ListPlus, XCircle } from 'lucide-react';
import { formatBRL, parseCurrencyInput } from '../utils/format';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface InventoryProps {
  materials: Material[];
  onAddMaterial: (material: Omit<Material, 'id'>, createExpense: boolean, dueDate?: string, customTotalValue?: number) => void;
  onAddBatchMaterials?: (materials: Omit<Material, 'id'>[], createExpense: boolean, dueDate?: string, customTotalValue?: number) => void;
  onAddStock: (id: string, quantityToAdd: number, newPrice: number, createExpense: boolean, dueDate?: string, customTotalValue?: number) => void;
  onUpdateMaterial: (id: string, updates: Partial<Material>) => void;
  onDeleteMaterial: (id: string) => void;
}

const MATERIAL_TYPES = [
  'MDF / Chapas',
  'Madeira Maciça',
  'Ferragens',
  'Fitas de Borda',
  'Químicos / Colas',
  'Acessórios',
  'Ferramentas',
  'Vidros / Espelhos',
  'Elétrica / LED',
  'Outros'
];

const Inventory: React.FC<InventoryProps> = ({ materials, onAddMaterial, onAddBatchMaterials, onAddStock, onUpdateMaterial, onDeleteMaterial }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNewMaterial, setIsNewMaterial] = useState(true);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');

  // Form States
  const [name, setName] = useState('');
  const [supplier, setSupplier] = useState('');
  const [category, setCategory] = useState('MDF / Chapas');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [priceInput, setPriceInput] = useState('0,00');
  const [unit, setUnit] = useState('Chapa');
  
  // Batch State (Restored)
  const [pendingMaterials, setPendingMaterials] = useState<Omit<Material, 'id'>[]>([]);
  
  const [registerInFinance, setRegisterInFinance] = useState(false);
  const [financeDueDate, setFinanceDueDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for Finance Override
  const [customFinanceValue, setCustomFinanceValue] = useState('0,00');
  const [userEditedFinance, setUserEditedFinance] = useState(false);

  const totalValue = materials.reduce((sum, m) => sum + (m.price * m.quantity), 0);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseCurrencyInput(e.target.value);
    setPrice(val);
    setPriceInput(formatBRL(val));
  };

  const handleCustomFinanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserEditedFinance(true);
    const val = parseCurrencyInput(e.target.value);
    setCustomFinanceValue(formatBRL(val));
  };

  const openAddModal = () => {
    setEditingId(null);
    setIsNewMaterial(true);
    setSelectedMaterialId('');
    resetForm();
    setRegisterInFinance(false);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setName(''); setSupplier(''); setCategory('MDF / Chapas'); setQuantity(0); setPrice(0); setUnit('Chapa');
    setPriceInput('0,00');
    setPendingMaterials([]);
    setCustomFinanceValue('0,00');
    setUserEditedFinance(false);
  };

  const openEditModal = (material: Material) => {
    setEditingId(material.id);
    setIsNewMaterial(true);
    setName(material.name); setSupplier(material.supplier); setCategory(material.category); setQuantity(material.quantity); setPrice(material.price); setUnit(material.unit);
    setPriceInput(formatBRL(material.price));
    setPendingMaterials([]); // Não permitir lote na edição
    setIsModalOpen(true);
  };

  const handleExistingMaterialSelect = (id: string) => {
    setSelectedMaterialId(id);
    const mat = materials.find(m => m.id === id);
    if (mat) {
      setName(mat.name);
      setSupplier(mat.supplier);
      setCategory(mat.category);
      setUnit(mat.unit);
      setPrice(mat.price);
      setPriceInput(formatBRL(mat.price));
      setQuantity(0);
    }
  };

  const handleDelete = () => {
    if (editingId) {
      onDeleteMaterial(editingId);
      setIsModalOpen(false);
    }
  };

  const handleAddToBatch = () => {
    if (!name.trim()) return alert("Nome do material é obrigatório.");
    if (quantity <= 0) return alert("Quantidade deve ser maior que zero.");

    const newItem = { name, supplier, category, quantity, price, unit };
    setPendingMaterials(prev => [...prev, newItem]);

    // Limpar campos específicos para facilitar entrada rápida, mantendo fornecedor e categoria
    setName('');
    setQuantity(0);
    setPrice(0);
    setPriceInput('0,00');
    // Mantém supplier e category para agilizar
  };

  const handleRemoveFromBatch = (index: number) => {
    setPendingMaterials(prev => prev.filter((_, i) => i !== index));
  };

  // Cálculo do total do lote para exibir no financeiro
  const batchTotal = pendingMaterials.reduce((acc, m) => acc + (m.price * m.quantity), 0) + (isNewMaterial && name ? price * quantity : 0);

  // Sincroniza o valor total calculado com o input financeiro, se o usuário não o tiver editado
  useEffect(() => {
    if (!userEditedFinance && isModalOpen) {
      setCustomFinanceValue(formatBRL(batchTotal));
    }
  }, [batchTotal, userEditedFinance, isModalOpen]);

  const handleSave = () => {
    const finalFinanceValue = userEditedFinance ? parseCurrencyInput(customFinanceValue) : undefined;

    if (editingId) {
       // Edição simples
       if (!name.trim()) return alert("Nome é obrigatório.");
       const data = { name, supplier, category, quantity, price, unit };
       onUpdateMaterial(editingId, data);
    } else if (isNewMaterial) {
       // Novo Cadastro (Lote ou Simples)
       if (pendingMaterials.length > 0) {
          // Prepara a lista para salvar em lote
          const itemsToSave = [...pendingMaterials];
          
          // Se houver um item preenchido nos inputs mas não adicionado à lista, adiciona ele também
          if (name.trim() && quantity > 0) {
             itemsToSave.push({ name, supplier, category, quantity, price, unit });
          }

          if (onAddBatchMaterials) {
            // Usa a função de lote (Agrupa valor financeiro)
            onAddBatchMaterials(itemsToSave, registerInFinance, financeDueDate, finalFinanceValue);
          } else {
            // Fallback para função individual (Legado ou se prop não existir)
            itemsToSave.forEach(m => {
              onAddMaterial(m, registerInFinance, financeDueDate);
            });
          }
       } else {
          // Salvar Simples (Um item apenas)
          if (!name.trim()) return alert("Nome é obrigatório.");
          const data = { name, supplier, category, quantity, price, unit };
          onAddMaterial(data, registerInFinance, financeDueDate, finalFinanceValue);
       }
    } else {
       // Adicionar Estoque em Item Existente
       if (!selectedMaterialId) return alert("Selecione um material.");
       if (quantity <= 0) return alert("A quantidade deve ser maior que zero.");
       onAddStock(selectedMaterialId, quantity, price, registerInFinance, financeDueDate, finalFinanceValue);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#2D4739] p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl border border-white/5">
           <div className="space-y-1">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Valor Total em Estoque</p>
             <p className="text-3xl font-black tracking-tighter">R$ {formatBRL(totalValue)}</p>
           </div>
           <Coins size={40} className="text-[#6B8E23] opacity-30" />
        </div>
        <Button onClick={openAddModal} variant="secondary" className="h-full rounded-[3rem]" fullWidth icon={<Plus size={24} />}>
           Movimentar Estoque
        </Button>
      </div>

      <div className="card-base">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#FDFBE2]/50 border-b border-[#2D473911]">
              <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-[#2D473944]">Material / Fornecedor</th>
              <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-[#2D473944]">Saldo Atual</th>
              <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-[#2D473944]">Custo Unit.</th>
              <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-[#2D473944] text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D473908]">
            {materials.map(m => (
              <tr key={m.id} className="group hover:bg-[#FDFBE2]/30 transition-all">
                <td className="px-12 py-10">
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-[#2D4739] leading-none tracking-tighter">{m.name}</span>
                    <span className="text-[10px] font-bold text-[#6B8E23] uppercase tracking-widest mt-2">{m.category} • {m.supplier}</span>
                  </div>
                </td>
                <td className="px-12 py-10">
                   <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-[#6B8E23]" />
                      <span className="text-xl font-black text-[#2D4739]">{m.quantity} {m.unit}</span>
                   </div>
                </td>
                <td className="px-12 py-10">
                  <span className="text-lg font-black text-[#2D473988] tracking-tighter">R$ {formatBRL(m.price)}</span>
                </td>
                <td className="px-12 py-10 text-right">
                   <button onClick={() => openEditModal(m)} className="p-4 bg-[#FDFBE2] text-[#2D473966] hover:text-[#2D4739] rounded-2xl shadow-sm border border-[#2D473911] transition-all"><Edit2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Material' : 'Gerenciar Estoque'}
        icon={<Package size={24} />}
        footer={
           <>
              {editingId && <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDelete}>Excluir</Button>}
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" icon={<Save size={18} />} onClick={handleSave}>
                {pendingMaterials.length > 0 
                  ? `Salvar ${pendingMaterials.length + (name ? 1 : 0)} Itens` 
                  : 'Salvar'}
              </Button>
           </>
        }
      >
          {!editingId && (
            <div className="bg-[#FDFBE2] p-1.5 rounded-[1.25rem] flex gap-2 border border-[#2D473908] mb-8 shadow-inner">
              <button onClick={() => { setIsNewMaterial(true); resetForm(); }} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isNewMaterial ? 'bg-[#2D4739] text-white shadow-lg' : 'text-[#2D473944] hover:bg-white/50'}`}><Plus size={14} /> Novo Insumo</button>
              <button onClick={() => { setIsNewMaterial(false); resetForm(); }} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!isNewMaterial ? 'bg-[#2D4739] text-white shadow-lg' : 'text-[#2D473944] hover:bg-white/50'}`}><Layers size={14} /> Item Existente</button>
            </div>
          )}

          {!isNewMaterial && !editingId && (
            <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
              <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Selecionar Material</label>
              <div className="relative group">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D473944] group-focus-within:text-[#6B8E23] transition-colors" />
                <select value={selectedMaterialId} onChange={(e) => handleExistingMaterialSelect(e.target.value)} className="w-full p-4 pl-12 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none cursor-pointer appearance-none">
                    <option value="">Escolha um item...</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.quantity} {m.unit})</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2D473944] pointer-events-none">
                    <ChevronDown size={16} />
                </div>
              </div>
            </div>
          )}

          {(isNewMaterial || selectedMaterialId || editingId) && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {isNewMaterial && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Nome do Material</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="w-full p-4 bg-[#2D4739] text-[#FDFBE2] rounded-xl placeholder:text-[#FDFBE2]/30 outline-none focus:ring-2 focus:ring-[#6B8E23] transition-all font-bold" 
                      placeholder="Ex: MDF Rovere 18mm" 
                    />
                  </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Tipo de Material</label>
                   <div className="relative group">
                      <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)} 
                        className="w-full p-4 bg-white text-[#2D4739] rounded-xl outline-none focus:ring-2 focus:ring-[#6B8E23] transition-all appearance-none cursor-pointer font-bold border border-[#2D473911]"
                      >
                         {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2D4739] pointer-events-none">
                          <ChevronDown size={16} />
                      </div>
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Fornecedor / Loja</label>
                   <input 
                      type="text" 
                      value={supplier} 
                      onChange={e => setSupplier(e.target.value)} 
                      className="w-full p-4 bg-[#2D4739] text-[#FDFBE2] rounded-xl placeholder:text-[#FDFBE2]/30 outline-none focus:ring-2 focus:ring-[#6B8E23] transition-all font-bold" 
                      placeholder="Ex: Leo Madeiras" 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">{isNewMaterial || editingId ? 'Quantidade Atual' : 'Qtd a Adicionar'}</label>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={e => setQuantity(Number(e.target.value))} 
                    className="w-full p-4 bg-[#2D4739] text-[#FDFBE2] rounded-xl placeholder:text-[#FDFBE2]/30 outline-none focus:ring-2 focus:ring-[#6B8E23] transition-all font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Custo por Unidade (R$)</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FDFBE2]/50 font-black text-sm">R$</div>
                    <input 
                      type="text" 
                      value={priceInput} 
                      onChange={handlePriceChange} 
                      className="w-full pl-12 pr-4 py-4 bg-[#2D4739] text-[#FDFBE2] rounded-xl placeholder:text-[#FDFBE2]/30 outline-none focus:ring-2 focus:ring-[#6B8E23] transition-all font-bold" 
                    />
                  </div>
                </div>
              </div>

              {/* BOTAO ADICIONAR AO LOTE (Apenas modo Novo) */}
              {!editingId && isNewMaterial && (
                <div className="flex justify-end">
                   <button 
                      onClick={handleAddToBatch}
                      className="px-6 py-3 bg-[#FDFBE2] text-[#2D4739] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#2D473911] hover:bg-[#2D4739] hover:text-[#FDFBE2] transition-all flex items-center gap-2"
                   >
                      <ListPlus size={16} /> Adicionar à Lista (+1)
                   </button>
                </div>
              )}

              {/* LISTA DE ITENS PENDENTES (LOTE) */}
              {pendingMaterials.length > 0 && (
                <div className="bg-white/50 p-4 rounded-2xl border border-[#2D473911] space-y-3">
                   <p className="text-[9px] font-black uppercase tracking-widest text-[#2D473966]">Itens na Lista ({pendingMaterials.length})</p>
                   <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {pendingMaterials.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#2D473905]">
                           <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-[#2D4739] truncate">{m.name}</p>
                              <p className="text-[9px] text-[#2D473966]">{m.quantity} {m.unit} • {formatBRL(m.price)}</p>
                           </div>
                           <button onClick={() => handleRemoveFromBatch(idx)} className="text-red-400 hover:text-red-600 p-1">
                              <XCircle size={16} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {!editingId && (
                <div className="p-6 bg-white rounded-3xl border border-[#2D473911] shadow-xl shadow-[#2D473905] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#6B8E23] opacity-[0.03] rounded-bl-full group-hover:scale-150 transition-transform duration-500"></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl text-white transition-colors duration-300 ${registerInFinance ? 'bg-[#6B8E23] shadow-lg shadow-[#6B8E2344]' : 'bg-[#2D473922] text-[#2D4739]'}`}>
                              <DollarSign size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#2D4739] uppercase tracking-tight">Registrar Compra</p>
                            <p className="text-[9px] font-bold text-[#2D473966] uppercase tracking-wider mt-0.5">Lançar no Financeiro (Todos os itens)</p>
                          </div>
                      </div>
                      <button onClick={() => setRegisterInFinance(!registerInFinance)} className={`w-14 h-8 rounded-full transition-all duration-300 relative border-2 ${registerInFinance ? 'bg-[#6B8E23] border-[#6B8E23]' : 'bg-transparent border-[#2D473922]'}`}>
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${registerInFinance ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    
                    {registerInFinance && (
                      <div className="mt-6 pt-6 border-t border-[#2D473908] animate-in slide-in-from-top-4 duration-300">
                          <div className="space-y-3 mb-6">
                              <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest flex items-center gap-2"><Calendar size={12} /> Vencimento do Boleto / Pagamento</label>
                              <input type="date" value={financeDueDate} onChange={e => setFinanceDueDate(e.target.value)} className="w-full p-4 bg-white rounded-xl border border-[#2D473911] font-black text-[#2D4739] outline-none" />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest flex items-center gap-2">Valor Final da Nota (Total)</label>
                            <div className="relative group">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D473944] font-black text-sm">R$</div>
                              <input 
                                type="text" 
                                value={customFinanceValue} 
                                onChange={handleCustomFinanceChange} 
                                className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-[#2D473911] font-black text-[#2D4739] outline-none focus:border-[#6B8E23] transition-all" 
                              />
                            </div>
                            {userEditedFinance && (
                               <p className="text-[9px] text-[#6B8E23] font-bold text-right cursor-pointer hover:underline" onClick={() => { setUserEditedFinance(false); setCustomFinanceValue(formatBRL(batchTotal)); }}>
                                  Resetar para valor calculado (R$ {formatBRL(batchTotal)})
                               </p>
                            )}
                          </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
      </Modal>
    </div>
  );
};

export default Inventory;