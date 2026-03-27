import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Material, Client, Budget, TaskStatus, ProjectSubtask, BudgetEnvironmentInfo } from '../types';
import { Calculator, Plus, Trash2, CheckCircle2, Clock, ListChecks, Layout, Save, ArrowRight, AlertTriangle, ChevronDown, Coins, TrendingUp, Package, Edit2, Calendar as CalendarIcon, Zap, DollarSign } from 'lucide-react';

interface BudgetToolProps {
  materials: Material[];
  clients: Client[];
  budgets: Budget[];
  onApprove: (data: any) => void;
  onSavePending: (data: any) => void;
  onDeleteBudget: (id: string) => void;
}

const DEFAULT_OVERHEADS = [
  { name: 'Parafuso', value: 10 },
  { name: 'Bucha', value: 12 },
  { name: 'Silicone', value: 15 },
  { name: 'Cola de fita', value: 15 },
  { name: 'Energia', value: 28 },
  { name: 'Manutenção de maquinas', value: 40 },
  { name: 'Combustivel', value: 50 },
  { name: 'Produtos de limpeza', value: 15 },
  { name: 'Ferramentas', value: 25 },
];

const BudgetTool: React.FC<BudgetToolProps> = ({ materials, clients, budgets, onApprove, onSavePending, onDeleteBudget }) => {
  const [selectedClient, setSelectedClient] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [deadline, setDeadline] = useState(() => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [budgetToDelete, setBudgetToDelete] = useState<{id: string, title: string} | null>(null);
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const [laborInput, setLaborInput] = useState('0,00');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [addedEnvironments, setAddedEnvironments] = useState<BudgetEnvironmentInfo[]>([]);
  const [tempEnvType, setTempEnvType] = useState('Cozinha');
  const [selectedMaterials, setSelectedMaterials] = useState<{ id: string, qty: number }[]>([]);
  const [laborCost, setLaborCost] = useState(0);
  
  // Alterado: profitMargin removido do state, finalPrice adicionado ao state
  const [manualFinalPrice, setManualFinalPrice] = useState(0); 
  const [finalPriceInput, setFinalPriceInput] = useState('0,00');

  const [activeConfigPhase, setActiveConfigPhase] = useState<TaskStatus>('Preparação');
  const [newTaskInput, setNewTaskInput] = useState('');
  
  // State for Operational Costs
  const [operationalCosts, setOperationalCosts] = useState<{name: string, value: number}[]>(DEFAULT_OVERHEADS);

  const dateInputRef = useRef<HTMLInputElement>(null);

  const [phaseTasks, setPhaseTasks] = useState<Record<TaskStatus, string[]>>({
    'Preparação': ['Conferência de Medidas no Local', 'Plano de Corte Otimizado', 'Desenho Técnico Finalizado'],
    'Corte': ['Corte das Chapas de MDF', 'Identificação de Peças', 'Laminação de Bordas'],
    'Montagem': ['Furação de Ferragens', 'Montagem das Caixas', 'Instalação de Trilhos'],
    'Entrega': ['Limpeza Fina', 'Instalação de Puxadores', 'Transporte e Logística']
  });

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleLaborChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue === '') {
      setLaborInput('0,00');
      setLaborCost(0);
      return;
    }
    const floatValue = parseFloat(cleanValue) / 100;
    setLaborCost(floatValue);
    setLaborInput(formatCurrency(floatValue));
  };

  const materialsCost = useMemo(() => {
    return selectedMaterials.reduce((sum, item) => {
      const mat = materials.find(m => m.id === item.id);
      return sum + (mat ? mat.price * item.qty : 0);
    }, 0);
  }, [selectedMaterials, materials]);

  const overheadTotal = useMemo(() => {
    return operationalCosts.reduce((sum, item) => sum + item.value, 0);
  }, [operationalCosts]);

  // Cálculos Derivados
  const totalBaseCost = materialsCost + laborCost + overheadTotal;
  
  // Lucro e Margem calculados com base no Preço Manual definido pelo usuário
  const estimatedProfit = manualFinalPrice - totalBaseCost;
  const currentMargin = totalBaseCost > 0 ? ((estimatedProfit / totalBaseCost) * 100) : 0;

  const pendingBudgetsList = useMemo(() => budgets.filter(b => b.status === 'Pendente'), [budgets]);

  // Handler para input manual do preço final
  const handleFinalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
        setFinalPriceInput('0,00');
        setManualFinalPrice(0);
        return;
    }
    const floatValue = parseFloat(rawValue) / 100;
    setManualFinalPrice(floatValue);
    setFinalPriceInput(formatCurrency(floatValue));
  };

  const resetForm = () => {
    setSelectedClient('');
    setProjectTitle('');
    setDeadline(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setAddedEnvironments([]);
    setSelectedMaterials([]);
    setLaborCost(0);
    setLaborInput('0,00');
    setManualFinalPrice(0);
    setFinalPriceInput('0,00');
    setEditingBudgetId(null);
    setOperationalCosts(DEFAULT_OVERHEADS);
  };

  const handleAddEnvironment = () => setAddedEnvironments(prev => [...prev, { type: tempEnvType, description: '' }]);
  const removeEnvironment = (index: number) => setAddedEnvironments(prev => prev.filter((_, i) => i !== index));
  
  const handleAddMaterial = (id: string) => {
    const mat = materials.find(m => m.id === id);
    if (mat && mat.quantity <= 0) {
      if (!confirm("Este material está com estoque zerado. Deseja adicionar mesmo assim?")) return;
    }
    setSelectedMaterials(prev => [...prev, { id, qty: 1 }]);
    setIsMaterialDropdownOpen(false);
  };

  const handleRemoveMaterial = (index: number) => setSelectedMaterials(prev => prev.filter((_, i) => i !== index));

  const handleAddTask = () => {
    if (newTaskInput.trim()) {
      setPhaseTasks(prev => ({ ...prev, [activeConfigPhase]: [...prev[activeConfigPhase], newTaskInput.trim()] }));
      setNewTaskInput('');
    }
  };

  const handleRemoveTask = (index: number) => setPhaseTasks(prev => ({ ...prev, [activeConfigPhase]: prev[activeConfigPhase].filter((_, i) => i !== index) }));

  const getAllSubtasks = (): ProjectSubtask[] => {
    const all: ProjectSubtask[] = [];
    (Object.keys(phaseTasks) as TaskStatus[]).forEach(phase => {
      phaseTasks[phase].forEach(taskTitle => {
        all.push({ title: taskTitle, completed: false, phase });
      });
    });
    return all;
  };

  const handleSaveInternal = () => {
    if (!selectedClient || !projectTitle.trim()) return alert("Preencha o cliente e o título.");
    if (manualFinalPrice <= 0) return alert("Defina o valor final do projeto.");

    const payload = {
      id: editingBudgetId,
      clientId: selectedClient,
      title: projectTitle,
      deadline,
      finalPrice: manualFinalPrice,
      materials: selectedMaterials.map(m => ({ materialId: m.id, quantity: m.qty })),
      environments: addedEnvironments,
      laborCost,
      travelCost: 0,
      profitMargin: currentMargin, // Salva a margem calculada para registro
      totalCost: totalBaseCost,
      subtasks: getAllSubtasks(),
      status: 'Pendente' as const,
      operationalCosts 
    };
    onSavePending(payload);
    resetForm();
  };

  const handleApproveInternal = () => {
    if (!selectedClient || !projectTitle.trim()) {
       alert("Por favor, preencha o Título do Projeto e selecione um Cliente antes de aprovar.");
       return;
    }
    if (manualFinalPrice <= 0) return alert("Defina o valor final do projeto.");
    
    // 1. Gera tarefas automáticas de corte para MDFs
    const automatedCuttingTasks: ProjectSubtask[] = [];
    
    selectedMaterials.forEach(item => {
        const mat = materials.find(m => m.id === item.id);
        if (mat && (mat.category === 'MDF / Chapas' || mat.unit === 'Chapa')) {
            const sheetCount = Math.ceil(item.qty); 
            for (let i = 1; i <= sheetCount; i++) {
                automatedCuttingTasks.push({
                    title: `Corte chapa "${mat.name}" ${i}`,
                    completed: false,
                    phase: 'Corte'
                });
            }
        }
    });

    const manualSubtasks = getAllSubtasks();
    const finalSubtasks = [...manualSubtasks, ...automatedCuttingTasks];

    const payload = {
      id: editingBudgetId,
      clientId: selectedClient,
      title: projectTitle,
      deadline,
      finalPrice: manualFinalPrice,
      materials: selectedMaterials.map(m => ({ materialId: m.id, quantity: m.qty })),
      environments: addedEnvironments,
      laborCost,
      travelCost: 0,
      profitMargin: currentMargin,
      totalCost: totalBaseCost,
      subtasks: finalSubtasks,
      operationalCosts
    };
    
    onApprove(payload);
    resetForm();
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setProjectTitle(budget.title);
    setSelectedClient(budget.clientId);
    setDeadline(budget.deadline);
    setAddedEnvironments(budget.environments || []);
    setSelectedMaterials(budget.materials.map(m => ({ id: m.materialId, qty: m.quantity })));
    setLaborCost(budget.laborCost);
    setLaborInput(formatCurrency(budget.laborCost));
    
    // Configura o preço manual
    setManualFinalPrice(budget.finalPrice);
    setFinalPriceInput(formatCurrency(budget.finalPrice));
    
    // Tenta recuperar os custos operacionais
    // @ts-ignore
    if (budget.operationalCosts) {
       // @ts-ignore
       setOperationalCosts(budget.operationalCosts);
    } else {
       // @ts-ignore
       const opsMatch = (budget.description || '').match(/\|\|_OPS_::(.*)/);
       if (opsMatch && opsMatch[1]) {
          try {
             setOperationalCosts(JSON.parse(opsMatch[1]));
          } catch {
             setOperationalCosts(DEFAULT_OVERHEADS);
          }
       } else {
          setOperationalCosts(DEFAULT_OVERHEADS);
       }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBudget = (id: string, title: string) => {
     setBudgetToDelete({id, title});
  };

  const environmentOptions = ["Cozinha", "Banheiro", "Dormitório", "Closet", "Sala", "Escritório", "Gourmet", "Lavanderia", "Comercial"];

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-10 rounded-[3rem] shadow-2xl border border-[#2D473911] space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#6B8E2311] text-[#6B8E23] rounded-2xl"><Calculator size={28} /></div>
              <div>
                <h2 className="text-2xl font-black text-[#2D4739] uppercase tracking-tighter">
                  {editingBudgetId ? 'Editar Proposta' : 'Nova Proposta Comercial'}
                </h2>
                <p className="text-[10px] font-black text-[#2D473966] uppercase tracking-[0.2em] mt-1">Calcule com precisão e feche mais negócios</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#2D473966] uppercase tracking-widest">Título do Projeto</label>
                <input 
                  type="text" 
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-[#2D473908] font-black text-[#2D4739] outline-none bg-[#FDFBE2]/30 focus:bg-white focus:border-[#6B8E23] transition-all"
                  placeholder="Ex: Mobiliário Completo - Ap. 402"
                />
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-[#6B8E23] uppercase tracking-[0.2em] flex items-center gap-2">
                  <CalendarIcon size={14} /> Data Prevista para Entrega
                </label>
                <div className="relative group">
                   <input 
                    type="date" 
                    ref={dateInputRef}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-[#6B8E2322] font-black text-[#2D4739] outline-none bg-white focus:border-[#6B8E23] transition-all cursor-pointer shadow-sm relative z-10"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B8E23] z-0">
                    <CalendarIcon size={20} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#2D473966] uppercase tracking-widest">Cliente Responsável</label>
              <select 
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-[#2D473908] font-black text-[#2D4739] outline-none bg-white cursor-pointer hover:border-[#6B8E23] transition-all"
              >
                <option value="">Selecione um cliente cadastrado...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* SEÇÃO DE CUSTOS OPERACIONAIS (INSUMOS) */}
            <div className="bg-[#FDFBE2]/30 p-6 rounded-[2rem] border border-[#2D473908] space-y-4">
               <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-[#2D473966] uppercase tracking-widest flex items-center gap-2">
                     <Zap size={14} /> Insumos & Custos Operacionais (Padrão)
                  </label>
                  <span className="text-xs font-black text-[#2D4739]">Total: R$ {overheadTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {operationalCosts.map((item, idx) => (
                     <div key={idx} className="bg-white p-3 rounded-xl border border-[#2D473905] flex items-center justify-between shadow-sm">
                        <span className="text-[9px] font-bold text-[#2D4739AA] uppercase tracking-wide truncate mr-2">{item.name}</span>
                        <div className="flex items-center gap-1">
                           <span className="text-[8px] text-[#2D473944] font-bold">R$</span>
                           <input 
                              type="number" 
                              value={item.value} 
                              onChange={(e) => {
                                 const val = parseFloat(e.target.value) || 0;
                                 const newCosts = [...operationalCosts];
                                 newCosts[idx].value = val;
                                 setOperationalCosts(newCosts);
                              }}
                              className="w-12 text-right font-black text-[#2D4739] text-xs outline-none bg-transparent border-b border-transparent focus:border-[#6B8E23] transition-all"
                           />
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-[#6B8E23] uppercase tracking-[0.2em] flex items-center gap-2"><Layout size={14} /> Ambientes e Mobiliários</label>
              </div>
              <div className="flex gap-4">
                <select value={tempEnvType} onChange={(e) => setTempEnvType(e.target.value)} className="flex-1 p-4 rounded-2xl border-2 border-[#2D473908] font-black text-[#2D4739] bg-white">
                  {environmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button onClick={handleAddEnvironment} className="px-8 bg-[#6B8E23] text-white rounded-2xl hover:bg-[#5a7a1c] transition-all shadow-lg font-black text-[10px] uppercase">Incluir</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {addedEnvironments.map((env, i) => (
                  <div key={i} className="bg-[#2D4739] text-[#FDFBE2] px-6 py-3 rounded-2xl flex items-center gap-4 border border-white/10 shadow-lg animate-fade-in">
                    <span className="text-[10px] font-black uppercase tracking-widest">{env.type}</span>
                    <button onClick={() => removeEnvironment(i)} className="p-1 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 pt-4 relative">
              <label className="text-[10px] font-black text-[#6B8E23] uppercase tracking-[0.2em] flex items-center gap-2"><Package size={14} /> Materiais e Ferragens</label>
              <div className="relative">
                <button onClick={() => setIsMaterialDropdownOpen(!isMaterialDropdownOpen)} className="w-full p-5 rounded-2xl border-2 border-[#2D473908] font-black text-[#2D4739] bg-white flex justify-between items-center hover:border-[#6B8E23] transition-all">
                  <span>{selectedMaterials.length > 0 ? `${selectedMaterials.length} itens no cálculo` : 'Selecionar do estoque...'}</span>
                  <ChevronDown size={20} className={isMaterialDropdownOpen ? 'rotate-180 transition-transform' : ''} />
                </button>
                {isMaterialDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-[#2D473911] rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                    {materials.map(m => (
                      <button 
                        key={m.id} 
                        onClick={() => handleAddMaterial(m.id)} 
                        className={`w-full p-5 text-left font-black text-[#2D4739] hover:bg-[#FDFBE2] flex justify-between items-center ${m.quantity <= 0 ? 'opacity-40' : ''}`}
                      >
                        <div>
                          <p>{m.name}</p>
                          <p className="text-[8px] uppercase tracking-widest text-[#2D473944]">Estoque: {m.quantity} {m.unit}</p>
                        </div>
                        <span className="text-xs text-[#6B8E23]">R$ {m.price}/{m.unit}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedMaterials.map((sm, i) => {
                  const mat = materials.find(m => m.id === sm.id);
                  return (
                    <div key={i} className="flex items-center gap-4 bg-[#FDFBE2]/50 p-5 rounded-2xl border border-[#2D473908] animate-fade-in">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-[#2D4739] text-xs truncate">{mat?.name}</p>
                      </div>
                      <input 
                        type="number" 
                        value={sm.qty} 
                        onChange={(e) => setSelectedMaterials(prev => prev.map((it, idx) => idx === i ? { ...it, qty: parseFloat(e.target.value) || 0 } : it))} 
                        className="w-14 p-2 bg-white border border-[#2D473911] rounded-xl text-center font-black text-xs" 
                      />
                      <button onClick={() => handleRemoveMaterial(i)} className="p-2 text-red-300 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#2D473908]">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#2D473966] uppercase tracking-widest flex items-center gap-2"><Coins size={14} /> Mão de Obra de Produção</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#2D473944]">R$</span>
                   <input type="text" value={laborInput} onChange={(e) => handleLaborChange(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-[#2D473908] font-black focus:border-[#6B8E23] outline-none" />
                </div>
              </div>
              {/* CAMPO DE MARGEM PERCENTUAL REMOVIDO E SUBSTITUIDO PELO CUSTO TOTAL VISUAL */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#2D473966] uppercase tracking-widest flex items-center gap-2"><DollarSign size={14} /> Custo Total de Produção</label>
                <div className="relative">
                  <div className="w-full p-4 bg-gray-100 rounded-2xl border-2 border-transparent font-black text-[#2D4739] opacity-70">
                     R$ {totalBaseCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-10 rounded-[3rem] shadow-2xl border border-[#2D473911] space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#2D473911] text-[#2D4739] rounded-2xl"><ListChecks size={24} /></div>
              <div>
                <h2 className="text-xl font-black text-[#2D4739] uppercase tracking-tighter">Plano de Execução</h2>
                <p className="text-[10px] font-black text-[#2D473966] uppercase tracking-[0.2em] mt-1">Checklist personalizado que virará o projeto</p>
              </div>
            </div>

            <div className="flex gap-2 bg-[#2D473908] p-2 rounded-[1.75rem]">
              {["Preparação", "Corte", "Montagem", "Entrega"].map(p => (
                <button 
                  key={p} 
                  onClick={() => setActiveConfigPhase(p as TaskStatus)} 
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.25rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeConfigPhase === p ? 'bg-[#2D4739] text-[#FDFBE2] shadow-xl scale-105' : 'text-[#2D473944] hover:bg-white'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newTaskInput} 
                  onChange={(e) => setNewTaskInput(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()} 
                  placeholder="Nova tarefa para esta fase..." 
                  className="flex-1 p-5 rounded-2xl border-2 border-[#2D473908] font-black text-[#2D4739] bg-[#FDFBE2]/20 focus:bg-white outline-none transition-all" 
                />
                <button onClick={handleAddTask} className="p-5 bg-[#2D4739] text-white rounded-2xl hover:bg-[#1A2E24] shadow-xl"><Plus size={24} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {phaseTasks[activeConfigPhase].map((task, i) => (
                  <div key={i} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-[#2D473908] group hover:border-[#6B8E2333] transition-all">
                    <span className="text-xs font-bold text-[#2D4739AA]">{task}</span>
                    <button onClick={() => handleRemoveTask(i)} className="text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-[#2D4739] p-10 rounded-[4rem] text-white shadow-[0_40px_80px_rgba(45,71,57,0.3)] space-y-10 sticky top-10 border border-white/5 overflow-hidden group/card">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B8E23] opacity-10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            
            <div className="space-y-2 relative group">
               <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Valor Final do Projeto</h3>
                  <Edit2 size={12} className="opacity-20 group-hover:opacity-100 transition-opacity" />
               </div>
               <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl md:text-5xl font-black tracking-tighter opacity-50 select-none pointer-events-none">R$</span>
                  <input 
                    type="text" 
                    value={finalPriceInput}
                    onChange={handleFinalPriceChange}
                    className={`w-full bg-transparent text-4xl md:text-5xl font-black tracking-tighter text-white outline-none pl-[2.2ch] placeholder-white/50 border-b border-transparent hover:border-white/20 focus:border-white/40 transition-all`}
                  />
               </div>
               
               <div className="flex flex-col gap-1 mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3 text-[#6B8E23] font-black text-[10px] uppercase tracking-[0.2em]">
                   <div className="p-1.5 bg-[#6B8E2322] rounded-lg"><TrendingUp size={14} /></div>
                   <span>Lucro Estimado: R$ {estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex items-center gap-3 text-white/60 font-bold text-[9px] uppercase tracking-[0.2em] ml-1">
                   <span>Margem Calculada: {currentMargin.toFixed(1)}%</span>
                 </div>
               </div>
            </div>

            <div className="space-y-4 pt-4 relative">
              <button 
                type="button"
                onClick={handleApproveInternal} 
                className="w-full py-7 bg-[#6B8E23] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:bg-[#5a7a1c] transition-all flex items-center justify-center gap-3 active:scale-95 group border-2 border-transparent hover:border-white/20"
              >
                <CheckCircle2 size={24} className="group-hover:scale-125 transition-transform" /> Aprovar e Iniciar Projeto
              </button>
              <button 
                type="button"
                onClick={handleSaveInternal} 
                className="w-full py-7 bg-white/5 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-3 border border-white/10 active:scale-95"
              >
                <Save size={20} /> {editingBudgetId ? 'Atualizar Orçamento' : 'Salvar como Pendente'}
              </button>
              {editingBudgetId && (
                 <button 
                    type="button"
                    onClick={() => handleDeleteBudget(editingBudgetId, projectTitle)}
                    className="w-full py-4 text-red-400 font-black uppercase tracking-[0.3em] text-[10px] hover:text-red-300 transition-all flex items-center justify-center gap-2 opacity-60 hover:opacity-100"
                 >
                    <Trash2 size={14} /> Excluir Proposta
                 </button>
              )}
            </div>

            <div className="space-y-6 pt-10 border-t border-white/10 relative">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
                  <Clock size={16} /> Em Negociação ({pendingBudgetsList.length})
                </h4>
                <div className="w-6 h-6 bg-[#6B8E23] rounded-full flex items-center justify-center text-[10px] font-black">{pendingBudgetsList.length}</div>
              </div>
              <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {pendingBudgetsList.map(b => (
                  <div key={b.id} className={`bg-white/5 p-6 rounded-[2.5rem] border transition-all relative group ${editingBudgetId === b.id ? 'border-[#6B8E23] bg-white/10 ring-1 ring-[#6B8E23]' : 'border-white/5 hover:bg-white/10'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-black truncate text-[#FDFBE2]">{b.title}</p>
                        <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mt-1">Entrega: {new Date(b.deadline).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditBudget(b)} className="p-2 text-[#6B8E23] hover:bg-white/10 rounded-xl transition-all"><Edit2 size={16} /></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-6">
                      <p className="text-xs font-black text-[#6B8E23] tracking-wider">R$ {b.finalPrice.toLocaleString('pt-BR')}</p>
                      <button 
                        onClick={() => {
                           // 🔥 Limpa o form antes de aprovar da lista também, caso tenha algo pendente
                           resetForm();
                           onApprove({ ...b, budgetId: b.id });
                        }}
                        className="p-3 bg-[#6B8E23] rounded-2xl text-white hover:scale-110 transition-all shadow-xl"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {budgetToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-[#1A2E24]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#FDFBE2] p-10 rounded-[3rem] shadow-2xl max-w-sm w-full space-y-6 text-center border border-white/20 animate-in zoom-in-95 flex flex-col">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-black text-[#2D4739] uppercase">Excluir Proposta?</h3>
            <p className="text-xs text-[#2D4739AA] font-bold">Deseja remover permanentemente o orçamento "{budgetToDelete.title}"?</p>
            <div className="flex gap-4 pt-4 mt-auto">
              <button onClick={() => setBudgetToDelete(null)} className="flex-1 py-4 bg-[#2D473908] text-[#2D4739] rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
              <button onClick={() => { onDeleteBudget(budgetToDelete.id); setBudgetToDelete(null); if(editingBudgetId === budgetToDelete.id) resetForm(); }} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetTool;