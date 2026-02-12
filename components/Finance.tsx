import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project, Material, Budget, FixedExpense, Debt, ManualRevenue } from '../types';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Save, X, 
  AlertTriangle,
  Banknote, Receipt, Truck, Calendar,
  ChevronLeft, ChevronRight, ShoppingBag, Search, Tag, ArrowDownRight,
  Check, Clock, Wallet, History, ArrowUpRight, Layers, RotateCcw,
  Edit2, FileText, LayoutDashboard, Landmark, Archive, ShoppingCart
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as ReTooltip
} from 'recharts';
import ConfirmDeleteModal from './ui/ConfirmDeleteModal';

interface FinanceProps {
  projects: Project[];
  materials: Material[];
  budgets: Budget[];
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  manualRevenues: ManualRevenue[];
  onAddFixedExpense: (expense: Omit<FixedExpense, 'id'>) => void;
  onDeleteFixedExpense: (id: string) => void;
  onToggleExpenseStatus: (id: string, monthYear?: string) => void;
  onUpdateFixedExpense: (id: string, updates: Partial<FixedExpense>) => void;
  onToggleDebtStatus: (id: string) => void;
  onUpdateDebt: (id: string, updates: Partial<Debt>) => void;
  onAddDebt: (debt: any) => void;
  onDeleteDebt: (id: string) => void;
  onAddManualRevenue: (revenue: Omit<ManualRevenue, 'id'>) => void;
  onDeleteManualRevenue: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onNavigate: (tab: string) => void;
  monthlyGoal: number;
  setMonthlyGoal: (goal: number) => void;
}

const DEFAULT_CATEGORIES = [
  'Parafuso', 'Bucha', 'Silicone', 'Cola de fita', 
  'Energia', 'Manutenção de maquinas', 'Combustivel', 
  'Produtos de limpeza', 'Ferramentas'
];

const cleanDescription = (desc: string) => desc.replace(/\|\|_OP_SPEND_::.*/, '').trim();

const KPICard: React.FC<{ icon: React.ReactNode, label: string, value: string, sub: string, color: string }> = ({ icon, label, value, sub, color }) => (
  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-[#2D473911] hover:-translate-y-1 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:scale-150 transition-transform" style={{ color: color }}>{icon}</div>
    <div className="flex justify-between items-start mb-6">
      <div className="p-4 rounded-2xl shadow-inner border border-[#2D473908]" style={{ backgroundColor: `${color}11`, color: color }}>{icon}</div>
    </div>
    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2D473944] mb-1">{label}</h4>
    <p className="text-3xl font-black text-[#2D4739] tracking-tighter mb-2">{value}</p>
    <p className="text-[9px] font-bold text-[#2D473988] uppercase tracking-widest">{sub}</p>
    <div className="absolute bottom-0 left-0 h-1 w-full bg-[#2D473908]">
      <div className="h-full opacity-60" style={{ width: '100%', backgroundColor: color }}></div>
    </div>
  </div>
);

const SubTabBtn: React.FC<{ active: boolean, label: string, onClick: () => void, icon: React.ReactNode }> = ({ active, label, onClick, icon }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-[#2D4739] text-white shadow-lg scale-105' : 'text-[#2D473944] hover:bg-white'}`}
  >
    {icon} {label}
  </button>
);

const Finance: React.FC<FinanceProps> = ({ 
  projects, materials, fixedExpenses, debts, manualRevenues,
  onAddFixedExpense, onDeleteFixedExpense, onToggleExpenseStatus, onUpdateFixedExpense,
  onToggleDebtStatus, onUpdateDebt, onAddDebt, onDeleteDebt, onAddManualRevenue, 
  onDeleteManualRevenue, onUpdateProject, onNavigate, monthlyGoal, setMonthlyGoal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'receivables' | 'expenses' | 'operational-fund' | 'history'>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'expense' | 'revenue' | 'stock' | 'project-revenue' | 'op-fund-spend'>('expense');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: 'danger' | 'success';
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'danger'
  });
  
  const dateRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formDesc, setFormDesc] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formClient, setFormClient] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  
  // Operational Fund Spend State
  const [opFundCategory, setOpFundCategory] = useState(DEFAULT_CATEGORIES[0]);
  
  // Stock Entry States (Kept for compatibility if needed elsewhere, but mostly unused in this modal now)
  const [isNewMaterial, setIsNewMaterial] = useState(true);
  const [stockItemName, setStockItemName] = useState('');
  const [stockSelectedMaterialId, setStockSelectedMaterialId] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [stockUnitPrice, setStockUnitPrice] = useState('');
  const [stockCategory, setStockCategory] = useState('Madeira');

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const handlePrevMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  const handleNextMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));

  const currentMonthYear = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;

  // Cálculo de Totais Acumulados (Todo o Período)
  const allTimeTotals = useMemo(() => {
    // 1. Entradas de Projetos (Pagos ou Sinais Pagos)
    const projectsReceived = projects.reduce((sum, p) => {
      if (p.isPaid) return sum + p.value;
      if (p.isAdvancePaid) return sum + (p.advanceValue || 0);
      return sum;
    }, 0);

    // 2. Receitas Manuais
    const manualReceived = manualRevenues.reduce((sum, r) => sum + r.value, 0);

    // 3. Despesas Fixas Pagas (Recorrentes somam por mês pago, Avulsas somam se pagas)
    const expensesPaid = fixedExpenses.reduce((sum, e) => {
      if (e.isRecurring) {
        return sum + (e.value * (e.paidMonths?.length || 0));
      }
      return e.status === 'Pago' ? sum + e.value : sum;
    }, 0);

    // 4. Dívidas/Materiais Pagos
    const debtsPaid = debts.reduce((sum, d) => d.status === 'Pago' ? sum + d.value : sum, 0);

    const totalIn = projectsReceived + manualReceived;
    const totalOut = expensesPaid + debtsPaid;

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut
    };
  }, [projects, manualRevenues, fixedExpenses, debts]);

  const filteredData = useMemo(() => {
    const m = selectedDate.getMonth();
    const y = selectedDate.getFullYear();
    
    const checkDate = (dateStr?: string) => {
      if (!dateStr) return false;
      const [yearStr, monthStr] = dateStr.split('-'); 
      return (parseInt(monthStr) - 1) === m && parseInt(yearStr) === y;
    };

    const currentViewIndex = y * 12 + m;

    return {
      projects: projects.filter(p => checkDate(p.deadline)),
      allPendingProjects: projects.filter(p => !p.isPaid),
      fixedExpenses: fixedExpenses.filter(e => {
        if (!e.dueDate) return false;
        const [eYear, eMonth] = e.dueDate.split('-').map(Number);
        const expenseStartIndex = eYear * 12 + (eMonth - 1);

        if (e.isRecurring) {
          return currentViewIndex >= expenseStartIndex;
        } else {
          return currentViewIndex === expenseStartIndex;
        }
      }),
      manualRevenues: manualRevenues.filter(r => checkDate(r.date)),
      debts: debts.filter(d => checkDate(d.dueDate))
    };
  }, [selectedDate, projects, fixedExpenses, manualRevenues, debts]);

  const totals = useMemo(() => {
    const projectInvoiced = filteredData.projects.reduce((sum, p) => sum + p.value, 0);
    const manualInvoiced = filteredData.manualRevenues.reduce((sum, r) => sum + r.value, 0);
    const totalInvoiced = projectInvoiced + manualInvoiced;
    
    const projectReceived = filteredData.projects.reduce((sum, p) => p.isPaid ? sum + p.value : sum + (p.advanceValue || 0), 0);
    const totalReceived = projectReceived + manualInvoiced;
    
    const totalPendingAllTime = projects.filter(p => !p.isPaid).reduce((sum, p) => sum + (p.value - (p.advanceValue || 0)), 0);

    const totalFixed = filteredData.fixedExpenses.reduce((sum, e) => {
      const isPaidThisMonth = e.isRecurring 
        ? e.paidMonths?.includes(currentMonthYear)
        : e.status === 'Pago';
      return !isPaidThisMonth ? sum + e.value : sum;
    }, 0);

    const totalDebts = filteredData.debts.reduce((sum, d) => d.status !== 'Pago' ? sum + d.value : sum, 0);
    const totalOut = totalFixed + totalDebts;

    const netProfit = totalReceived - totalOut;
    const margin = totalInvoiced > 0 ? (netProfit / totalInvoiced) * 100 : 0;
    const inventoryValue = materials.reduce((sum, m) => sum + (m.price * m.quantity), 0);

    return { 
      invoiced: totalInvoiced || 0, 
      received: totalReceived || 0, 
      pending: totalPendingAllTime || 0, 
      totalOut: totalOut || 0, 
      net: netProfit || 0, 
      margin: margin || 0, 
      inventory: inventoryValue || 0,
      fixed: totalFixed || 0,
      debts: totalDebts || 0
    };
  }, [filteredData, materials, currentMonthYear, projects]);

  const chartData = [
    { name: 'Entrada Real', valor: totals.received, fill: '#6B8E23' },
    { name: 'Compromissos', valor: totals.totalOut, fill: '#E11D48' }
  ];

  const handleDeleteEntry = () => {
    if (!editingId) return;
    
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Lançamento?',
      description: 'Tem certeza que deseja excluir este lançamento financeiro? Esta ação não pode ser desfeita e afetará o saldo.',
      variant: 'danger',
      confirmText: 'Excluir',
      onConfirm: () => {
        if (modalType === 'expense') onDeleteFixedExpense(editingId);
        if (modalType === 'stock') onDeleteDebt(editingId);
        if (modalType === 'revenue') onDeleteManualRevenue(editingId);
        if (modalType === 'op-fund-spend') onDeleteFixedExpense(editingId);
        
        setIsModalOpen(false);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddEntry = () => {
    const val = parseFloat(formValue);
    
    if (modalType === 'stock') {
      if (editingId) {
        onUpdateDebt(editingId, {
          supplier: formSupplier,
          description: formDesc,
          value: val,
          dueDate: formDate
        });
      } else {
        if (isNaN(val) || val <= 0) return alert("Informe um valor válido.");

        onAddDebt({ 
          supplier: formSupplier || 'Diverso', 
          description: formDesc || 'Compra de Material', 
          value: val, 
          dueDate: formDate, 
          status: 'Pendente',
          manualMaterials: [] // Empty materials list as we are not registering items anymore
        });
      }
    } else if (modalType === 'project-revenue') {
      if (editingId && !isNaN(val)) {
        onUpdateProject(editingId, { value: val });
      }
    } else if (modalType === 'op-fund-spend') {
        if (isNaN(val) || val <= 0) return alert("Informe um valor válido.");
        
        // Salva como uma despesa fixa, mas com marcador especial na descrição
        // Usamos 'Outros' como categoria base do sistema, mas a descrição carrega a categoria do insumo
        const taggedDesc = `${formDesc || 'Compra de Insumo'} ||_OP_SPEND_::${opFundCategory}`;
        
        onAddFixedExpense({ 
            description: taggedDesc, 
            value: val, 
            dueDate: formDate, 
            category: 'Outros', // Categoria genérica do sistema
            status: 'Pago', // Assume pago pois é retirada do caixa operacional
            isRecurring: false,
            paidMonths: []
        });
    } else {
      if (isNaN(val)) return;
      if (modalType === 'expense') {
        if (editingId) {
          onUpdateFixedExpense(editingId, {
            description: formDesc,
            value: val,
            dueDate: formDate,
            isRecurring: isRecurring
          });
        } else {
          onAddFixedExpense({ 
            description: formDesc, 
            value: val, 
            dueDate: formDate, 
            category: 'Outros', 
            status: 'Pendente', 
            isRecurring: isRecurring,
            paidMonths: []
          });
        }
      } else if (modalType === 'revenue') {
        onAddManualRevenue({ description: formDesc, value: val, date: formDate, clientName: formClient, paymentMethod: 'Pix' });
      }
    }
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormDesc(''); setFormValue(''); setFormClient(''); setFormSupplier('');
    setStockItemName(''); setStockSelectedMaterialId(''); setStockQty(''); setStockUnitPrice('');
    setStockCategory('Madeira');
    setIsNewMaterial(true);
    setIsRecurring(false);
    setEditingId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setOpFundCategory(DEFAULT_CATEGORIES[0]);
  };

  const handleEditFixed = (e: FixedExpense) => {
    setModalType('expense');
    setEditingId(e.id);
    setFormDesc(cleanDescription(e.description));
    setFormValue(e.value.toString());
    setFormDate(e.dueDate);
    setIsRecurring(!!e.isRecurring);
    setIsModalOpen(true);
  };

  const handleEditDebt = (d: Debt) => {
    setModalType('stock');
    setEditingId(d.id);
    setFormSupplier(d.supplier);
    setFormDesc(d.description);
    setFormValue(d.value.toString());
    setFormDate(d.dueDate);
    setIsModalOpen(true);
  };

  const handleEditProjectRevenue = (id: string, currentValue: number, desc: string) => {
    setModalType('project-revenue');
    setEditingId(id);
    setFormDesc(desc);
    setFormValue(currentValue.toString());
    setIsModalOpen(true);
  };

  // Render Functions
  const renderOverview = () => (
    <div className="space-y-10 animate-fade-in">
      {/* CARD DE TOTAL ACUMULADO (ALL TIME) */}
      <div className="bg-[#2D4739] rounded-[3.5rem] p-10 shadow-2xl border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-[#FDFBE2]">
         <div className="absolute top-0 right-0 w-96 h-96 bg-[#6B8E23] opacity-20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
         <div className="z-10 flex-1">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm shadow-inner"><Landmark size={24} /></div>
                <h3 className="text-xs font-black uppercase tracking-[0.4em] opacity-80">Caixa Geral Acumulado</h3>
             </div>
             <div className="space-y-2">
                <p className="text-6xl font-black tracking-tighter">R$ {allTimeTotals.balance.toLocaleString('pt-BR')}</p>
                <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest opacity-60">
                   <span className="flex items-center gap-1"><ArrowUpRight size={12} className="text-[#6B8E23]" /> Entradas: R$ {allTimeTotals.totalIn.toLocaleString('pt-BR')}</span>
                   <span className="w-1 h-1 rounded-full bg-white/40 mt-1.5"></span>
                   <span className="flex items-center gap-1"><ArrowDownRight size={12} className="text-red-400" /> Saídas: R$ {allTimeTotals.totalOut.toLocaleString('pt-BR')}</span>
                </div>
             </div>
         </div>
         <div className="z-10 hidden md:block opacity-10">
            <Wallet size={140} />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard icon={<DollarSign size={24} />} label="Faturamento Previsto" value={`R$ ${totals.invoiced.toLocaleString('pt-BR')}`} sub="Contratos e vendas (Mês)" color="#2D4739" />
        <KPICard icon={<Banknote size={24} />} label="Recebimento Efetivo" value={`R$ ${totals.received.toLocaleString('pt-BR')}`} sub="Entradas do Mês" color="#6B8E23" />
        <KPICard icon={<TrendingDown size={24} />} label="Saldo à Pagar" value={`R$ ${totals.totalOut.toLocaleString('pt-BR')}`} sub="Boletos em aberto (Mês)" color="#E11D48" />
        <KPICard icon={<TrendingUp size={24} />} label="Resultado do Mês" value={`R$ ${totals.net.toLocaleString('pt-BR')}`} sub="Lucro líquido mensal" color={totals.net >= 0 ? "#059669" : "#E11D48"} />
      </div>

      <div className="w-full">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-[#2D473911] space-y-8">
           <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-[#2D4739] uppercase tracking-tighter">Fluxo de Caixa Mensal</h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#6B8E23]" /><span className="text-[10px] font-black uppercase text-[#2D473966]">Recebido</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#E11D48]" /><span className="text-[10px] font-black uppercase text-[#2D473966]">Pendente</span></div>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D473911" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <ReTooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} 
                  />
                  <Bar dataKey="valor" radius={[15, 15, 15, 15]} barSize={80} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => {
    // Explicit typing for transactions array to avoid implicit any[] error
    const transactions: any[] = [];

    filteredData.projects.forEach((p: any) => {
      if (p.isPaid) {
        transactions.push({ id: `p-${p.id}`, desc: `Projeto: ${p.name}`, val: p.value, type: 'in', date: p.deadline, cat: 'Projeto' });
      } else if (p.isAdvancePaid && p.advanceValue) {
        transactions.push({ id: `p-adv-${p.id}`, desc: `Sinal: ${p.name}`, val: p.advanceValue, type: 'in', date: p.deadline, cat: 'Projeto' });
      }
    });

    filteredData.manualRevenues.forEach((r: any) => {
      transactions.push({ id: `mr-${r.id}`, desc: r.description, val: r.value, type: 'in', date: r.date, cat: 'Avulso' });
    });

    filteredData.fixedExpenses.forEach((e: any) => {
      const isPaid = e.isRecurring ? e.paidMonths?.includes(currentMonthYear) : e.status === 'Pago';
      // Limpa a descrição para exibir sem tags
      const cleanDesc = cleanDescription(e.description);
      
      // Detecta se é compra de insumo operacional
      const isOpSpend = e.description.includes('||_OP_SPEND_::');
      const categoryLabel = isOpSpend ? 'Insumos (Caixa)' : e.category;

      if (isPaid) {
        transactions.push({ id: `fe-${e.id}`, desc: cleanDesc, val: e.value, type: 'out', date: e.dueDate, cat: categoryLabel });
      }
    });

    filteredData.debts.forEach((d: any) => {
      if (d.status === 'Pago') {
        transactions.push({ id: `d-${d.id}`, desc: d.description, val: d.value, type: 'out', date: d.dueDate, cat: 'Material' });
      }
    });

    transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalIn = transactions.filter((t: any) => t.type === 'in').reduce((sum: number, t: any) => sum + t.val, 0);
    const totalOut = transactions.filter((t: any) => t.type === 'out').reduce((sum: number, t: any) => sum + t.val, 0);
    const balance = totalIn - totalOut;

    return (
      <div className="space-y-10 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="bg-[#6B8E23] p-8 rounded-[3rem] text-[#FDFBE2] shadow-xl flex items-center justify-between relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10"><ArrowUpRight size={120} /></div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Entradas</p>
                 <p className="text-4xl font-black tracking-tighter mt-1">R$ {totalIn.toLocaleString('pt-BR')}</p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl"><TrendingUp size={24} /></div>
           </div>
           <div className="bg-red-600 p-8 rounded-[3rem] text-white shadow-xl flex items-center justify-between relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10"><ArrowDownRight size={120} /></div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Saídas</p>
                 <p className="text-4xl font-black tracking-tighter mt-1">R$ {totalOut.toLocaleString('pt-BR')}</p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl"><TrendingDown size={24} /></div>
           </div>
           <div className={`p-8 rounded-[3rem] shadow-xl flex items-center justify-between border-2 ${balance >= 0 ? 'bg-white border-[#6B8E2322]' : 'bg-white border-red-100'}`}>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#2D473966]">Saldo do Período</p>
                 <p className={`text-4xl font-black tracking-tighter mt-1 ${balance >= 0 ? 'text-[#2D4739]' : 'text-red-600'}`}>
                    R$ {balance.toLocaleString('pt-BR')}
                 </p>
              </div>
              <div className={`p-4 rounded-2xl ${balance >= 0 ? 'bg-[#2D473911] text-[#2D4739]' : 'bg-red-50 text-red-600'}`}>
                 <Wallet size={24} />
              </div>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-[#2D473911] space-y-10 min-h-[500px]">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-[#FDFBE2] rounded-xl text-[#2D4739]"><FileText size={20} /></div>
                 <div>
                    <h3 className="text-xl font-black text-[#2D4739] uppercase tracking-tighter">Extrato Detalhado</h3>
                    <p className="text-[10px] font-bold text-[#2D473966] uppercase">Movimentações efetivadas</p>
                 </div>
              </div>
              <button onClick={() => window.print()} className="p-3 hover:bg-[#2D473908] text-[#2D473944] hover:text-[#2D4739] rounded-xl transition-all" title="Imprimir Relatório">
                 <Receipt size={20} />
              </button>
           </div>

           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-[#2D473908]">
                       <th className="py-4 pl-4 text-[10px] font-black uppercase text-[#2D473944] tracking-widest w-[150px]">Data</th>
                       <th className="py-4 text-[10px] font-black uppercase text-[#2D473944] tracking-widest">Descrição / Origem</th>
                       <th className="py-4 text-[10px] font-black uppercase text-[#2D473944] tracking-widest">Categoria</th>
                       <th className="py-4 pr-4 text-[10px] font-black uppercase text-[#2D473944] tracking-widest text-right">Valor</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#2D473905]">
                    {transactions.map((t: any) => (
                       <tr key={t.id} className="group hover:bg-[#FDFBE2]/30 transition-all">
                          <td className="py-5 pl-4">
                             <span className="text-xs font-bold text-[#2D473966]">{new Date(t.date).toLocaleDateString()}</span>
                          </td>
                          <td className="py-5">
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${t.type === 'in' ? 'bg-[#6B8E2311] text-[#6B8E23]' : 'bg-red-50 text-red-500'}`}>
                                   {t.type === 'in' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                </div>
                                <span className="text-sm font-black text-[#2D4739]">{t.desc}</span>
                             </div>
                          </td>
                          <td className="py-5">
                             <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#2D473908] text-[#2D473966]">
                                {t.cat}
                             </span>
                          </td>
                          <td className="py-5 pr-4 text-right">
                             <span className={`text-sm font-black ${t.type === 'in' ? 'text-[#6B8E23]' : 'text-red-600'}`}>
                                {t.type === 'in' ? '+' : '-'} R$ {t.val.toLocaleString('pt-BR')}
                             </span>
                          </td>
                       </tr>
                    ))}
                    {transactions.length === 0 && (
                       <tr>
                          <td colSpan={4} className="py-20 text-center text-[#2D473922] font-black uppercase tracking-widest text-xs">
                             Nenhuma movimentação neste período
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  };

  const renderOperationalFund = () => {
    const fundTotals: Record<string, number> = {};
    const fundSpent: Record<string, number> = {};
    
    // Inicializa com as categorias padrão zeradas
    DEFAULT_CATEGORIES.forEach(c => {
       fundTotals[c] = 0;
       fundSpent[c] = 0;
    });

    // 1. Calcular Entradas (Via Orçamentos)
    projects.forEach(project => {
       const opsMatch = (project.description || '').match(/\|\|_OPS_::(.*)/);
       if (opsMatch && opsMatch[1]) {
          try {
             const costs = JSON.parse(opsMatch[1]);
             if (Array.isArray(costs)) {
                costs.forEach((c: {name: string, value: number}) => {
                   if (fundTotals[c.name] !== undefined) {
                      fundTotals[c.name] += c.value;
                   } else {
                      fundTotals[c.name] = c.value;
                   }
                });
             }
          } catch(e) { /* ignore */ }
       }
    });

    // 2. Calcular Saídas (Via Fixed Expenses marcadas)
    // Filtramos TODAS as despesas fixas (não apenas do mês selecionado) para ter o saldo real acumulado
    fixedExpenses.forEach(e => {
        const match = e.description.match(/\|\|_OP_SPEND_::(.*)/);
        if (match && match[1]) {
            const cat = match[1];
            // Soma se estiver marcada como paga (ou pendente se quisermos ver o comprometido, vamos usar tudo registrado)
            // Geralmente compra de insumo é a vista, então consideramos o valor
            if (fundSpent[cat] !== undefined) {
                fundSpent[cat] += e.value;
            } else {
                // Caso seja uma categoria antiga ou custom
                fundSpent[cat] = e.value;
            }
        }
    });

    return (
      <div className="space-y-10 animate-fade-in">
         <div className="bg-[#2D4739] p-10 rounded-[3rem] shadow-xl border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#6B8E23] opacity-20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10 flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <Archive size={24} className="text-[#FDFBE2]" />
                    <h3 className="text-xl font-black text-[#FDFBE2] uppercase tracking-tighter">Caixa de Insumos & Operacional</h3>
                </div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest max-w-lg">
                   Valores acumulados cobrados em todos os orçamentos aprovados para cobrir custos fixos e insumos. Gerencie aqui as compras de reposição.
                </p>
            </div>
            <div className="relative z-10">
                <button 
                    onClick={() => { resetForm(); setModalType('op-fund-spend'); setIsModalOpen(true); }}
                    className="px-8 py-4 bg-[#6B8E23] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 transition-all flex items-center gap-3"
                >
                    <ShoppingCart size={18} /> Registrar Compra de Insumo
                </button>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(fundTotals).map((name) => {
               const totalIn = fundTotals[name] || 0;
               const totalOut = fundSpent[name] || 0;
               const balance = totalIn - totalOut;

               return (
                   <div key={name} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-[#2D473911] flex flex-col justify-between hover:border-[#6B8E23] transition-all group">
                      <div className="flex justify-between items-start mb-4">
                         <span className="text-xs font-black uppercase tracking-widest text-[#2D473966]">{name}</span>
                         <div className={`p-2 rounded-xl transition-colors ${balance < 0 ? 'bg-red-50 text-red-500' : 'bg-[#FDFBE2] text-[#6B8E23] group-hover:bg-[#6B8E23] group-hover:text-white'}`}>
                            <DollarSign size={16} />
                         </div>
                      </div>
                      
                      <div className="space-y-1">
                          <p className={`text-3xl font-black tracking-tighter ${balance < 0 ? 'text-red-500' : 'text-[#2D4739]'}`}>
                              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[9px] font-bold text-[#2D473944] uppercase tracking-wide">Saldo Disponível</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#2D473905] grid grid-cols-2 gap-4">
                         <div>
                             <p className="text-[8px] font-black uppercase text-[#6B8E23] mb-0.5">Entradas</p>
                             <p className="text-xs font-bold text-[#2D4739]">R$ {totalIn.toLocaleString('pt-BR')}</p>
                         </div>
                         <div>
                             <p className="text-[8px] font-black uppercase text-red-400 mb-0.5">Gastos</p>
                             <p className="text-xs font-bold text-[#2D4739]">R$ {totalOut.toLocaleString('pt-BR')}</p>
                         </div>
                      </div>
                   </div>
               );
            })}
         </div>
      </div>
    );
  };

  const renderReceivables = () => {
    const relevantProjects = projects.filter(p => {
       if (!p.isPaid) return true;
       const d = new Date(p.deadline);
       return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });

    const projectReceivables = relevantProjects.map(p => ({
      id: p.id,
      description: `Projeto: ${p.name}`,
      value: p.value,
      status: p.isPaid ? 'Pago' : (p.isAdvancePaid ? 'Parcial' : 'Pendente'),
      date: p.deadline,
      type: 'Projeto',
      client: p.clientId,
      originalProject: p
    }));

    const manualReceivables = filteredData.manualRevenues.map(r => ({
      id: r.id,
      description: r.description,
      value: r.value,
      status: 'Pago',
      date: r.date,
      type: 'Venda/Serviço',
      client: r.clientName
    }));

    const allReceivables = [...projectReceivables, ...manualReceivables].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="space-y-10 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-[#6B8E2322] flex items-center justify-between group hover:border-[#6B8E2366] transition-all">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#2D473966]">Recebido no Período</p>
              <p className="text-4xl font-black text-[#6B8E23] tracking-tighter">R$ {totals.received.toLocaleString('pt-BR')}</p>
            </div>
            <div className="p-5 bg-[#6B8E2311] text-[#6B8E23] rounded-3xl group-hover:scale-110 transition-transform"><Banknote size={40} /></div>
          </div>
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-[#2D473911] flex items-center justify-between group hover:border-[#2D473922] transition-all">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#2D473966]">Faturamento Pendente (Total)</p>
              <p className="text-4xl font-black text-[#2D4739] tracking-tighter">R$ {totals.pending.toLocaleString('pt-BR')}</p>
            </div>
            <div className="p-5 bg-[#FDFBE2] text-[#2D4739] rounded-3xl group-hover:scale-110 transition-transform"><Clock size={40} /></div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-[#2D473911] space-y-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#FDFBE2] rounded-xl text-[#2D4739]"><History size={20} /></div>
              <h3 className="text-xl font-black text-[#2D4739] uppercase tracking-tighter">Fluxo de Entradas & Contas a Receber</h3>
            </div>
            <button onClick={() => { resetForm(); setModalType('revenue'); setIsModalOpen(true); }} className="px-8 py-4 bg-[#2D4739] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
              <Plus size={18} /> Registrar Receita Avulsa
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2D473908]">
                  <th className="py-6 text-[10px] font-black uppercase text-[#2D473944] tracking-widest">Data</th>
                  <th className="py-6 text-[10px] font-black uppercase text-[#2D473944] tracking-widest">Descrição</th>
                  <th className="py-6 text-[10px] font-black uppercase text-[#2D473944] tracking-widest">Tipo</th>
                  <th className="py-6 text-[10px] font-black uppercase text-[#2D473944] tracking-widest">Status</th>
                  <th className="py-6 text-[10px] font-black uppercase text-[#2D473944] tracking-widest text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D473905]">
                {allReceivables.map(item => (
                  <tr key={item.id} className="group hover:bg-[#FDFBE2]/30 transition-all">
                    <td className="py-6 font-bold text-xs text-[#2D473966]">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="py-6">
                      <p className="text-sm font-black text-[#2D4739]">{item.description}</p>
                      {item.status === 'Parcial' && <p className="text-[8px] font-black uppercase text-[#6B8E23] mt-0.5">Sinal Recebido</p>}
                    </td>
                    <td className="py-6"><span className="text-[10px] font-black uppercase text-[#2D473944]">{item.type}</span></td>
                    <td className="py-6">
                      <div className="flex items-center gap-2">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'Pago' ? 'bg-[#6B8E2322] text-[#6B8E23]' : 'bg-[#2D473911] text-[#2D4739]'}`}>
                           {item.status}
                         </span>
                         {item.type === 'Projeto' && item.status !== 'Pago' && (
                            <button 
                              onClick={() => {
                                 setConfirmConfig({
                                    isOpen: true,
                                    title: 'Confirmar Recebimento?',
                                    description: 'Deseja marcar este projeto como totalmente pago? O valor será contabilizado no caixa.',
                                    variant: 'success',
                                    confirmText: 'Confirmar',
                                    onConfirm: () => {
                                        onUpdateProject(item.id, { isPaid: true });
                                        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                                    }
                                 });
                              }}
                              className="p-1.5 bg-[#6B8E23] text-white rounded-lg hover:scale-110 transition-all shadow-md"
                              title="Confirmar Pagamento Total"
                            >
                               <Check size={12} />
                            </button>
                         )}
                      </div>
                    </td>
                    <td className="py-6 text-right font-black text-[#2D4739]">
                      <div className="flex justify-end items-center gap-3">
                        <span>R$ {item.value.toLocaleString('pt-BR')}</span>
                        {item.type === 'Projeto' && (
                          <button 
                            onClick={() => handleEditProjectRevenue(
                              // @ts-ignore
                              item.originalProject?.id || item.id, 
                              // @ts-ignore
                              item.originalProject?.value || item.value,
                              item.description
                            )} 
                            className="p-2 text-[#2D473944] hover:text-[#6B8E23] transition-all bg-white rounded-lg shadow-sm border border-[#2D473908]"
                            title="Editar valor total do projeto"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderExpenses = () => (
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-red-100 flex items-center justify-between group hover:border-red-300 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#2D473966]">Contas Operacionais</p>
            <p className="text-4xl font-black text-[#E11D48] tracking-tighter">R$ {totals.fixed.toLocaleString('pt-BR')}</p>
          </div>
          <div className="p-5 bg-red-50 text-red-600 rounded-3xl group-hover:scale-110 transition-transform"><Receipt size={40} /></div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-[#2D473911] flex items-center justify-between group hover:border-[#2D473922] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#2D473966]">Boletos Fornecedores</p>
            <p className="text-4xl font-black text-[#2D4739] tracking-tighter">R$ {totals.debts.toLocaleString('pt-BR')}</p>
          </div>
          <div className="p-5 bg-[#FDFBE2] text-[#2D4739] rounded-3xl group-hover:scale-110 transition-transform"><Truck size={40} /></div>
        </div>
        <div className="bg-[#2D4739] p-10 rounded-[3rem] shadow-xl border border-white/10 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Saldo à Liquidar</p>
            <p className="text-4xl font-black text-white tracking-tighter">R$ {totals.totalOut.toLocaleString('pt-BR')}</p>
          </div>
          <div className="p-5 bg-white/5 text-[#6B8E23] rounded-3xl group-hover:scale-110 transition-transform"><Wallet size={40} /></div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-[#2D473911] space-y-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-600"><AlertTriangle size={20} /></div>
            <h3 className="text-xl font-black text-[#2D4739] uppercase tracking-tighter">Contas à Pagar (Pendentes)</h3>
          </div>
          <button onClick={() => { resetForm(); setModalType('expense'); setIsModalOpen(true); }} className="px-8 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
            <Plus size={18} /> Nova Despesa Operacional
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.fixedExpenses.map(e => {
            const isPaidThisMonth = e.isRecurring 
              ? e.paidMonths?.includes(currentMonthYear)
              : e.status === 'Pago';
            
            // Não exibir compras de insumos aqui para não poluir, a menos que queira
            // Se for insumo, mostramos de forma diferente ou filtramos
            // Por enquanto, mostramos tudo mas com descrição limpa
            const cleanDesc = cleanDescription(e.description);
            const isOpSpend = e.description.includes('||_OP_SPEND_::');

            return (
              <div key={e.id} className={`p-8 rounded-[3rem] shadow-lg space-y-4 transition-all group flex flex-col justify-between border-2 ${isPaidThisMonth ? 'bg-[#6B8E2308] border-[#6B8E2322]' : 'bg-white border-[#2D473908] hover:border-red-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${isPaidThisMonth ? 'bg-[#6B8E23] text-white' : 'bg-red-50 text-red-600'}`}>{isOpSpend ? 'Insumo' : e.category}</span>
                    {e.isRecurring && (
                      <span className="bg-[#2D4739] text-[#FDFBE2] p-1.5 rounded-lg flex items-center gap-1 text-[8px] font-black uppercase">
                        <RotateCcw size={10} /> MENSAL
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditFixed(e)} className="p-2 text-[#2D473911] hover:text-[#6B8E23] transition-all"><Edit2 size={16} /></button>
                  </div>
                </div>
                <div>
                  <h5 className={`text-lg font-black truncate uppercase leading-tight ${isPaidThisMonth ? 'text-[#2D473966] line-through' : 'text-[#2D4739]'}`}>{cleanDesc}</h5>
                  <p className="text-[10px] font-bold text-[#2D473944] uppercase tracking-widest mt-1 flex items-center gap-2">
                    <Calendar size={10} /> Venc: {new Date(e.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-[#2D473905]">
                  <p className={`text-xl font-black ${isPaidThisMonth ? 'text-[#2D473944]' : 'text-red-600'}`}>R$ {e.value.toLocaleString('pt-BR')}</p>
                  <button 
                    onClick={() => onToggleExpenseStatus(e.id, e.isRecurring ? currentMonthYear : undefined)} 
                    className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isPaidThisMonth ? 'bg-[#2D473911] text-[#2D4739]' : 'bg-[#2D4739] text-white hover:bg-black shadow-lg'}`}
                  >
                    {isPaidThisMonth ? <Check size={14} /> : 'Dar Baixa'}
                  </button>
                </div>
              </div>
            );
          })}

          {filteredData.debts.map(d => (
            <div key={d.id} className={`p-8 rounded-[3rem] shadow-lg space-y-4 transition-all group flex flex-col justify-between border-2 ${d.status === 'Pago' ? 'bg-[#6B8E2308] border-[#6B8E2322]' : 'bg-white border-[#6B8E2311] hover:border-[#6B8E23]'}`}>
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${d.status === 'Pago' ? 'bg-[#6B8E23] text-white' : 'bg-[#2D473908] text-[#2D4739]'}`}>Material</span>
                <div className="flex gap-2">
                  <button onClick={() => handleEditDebt(d)} className="p-2 text-[#2D473911] hover:text-[#6B8E23] transition-all"><Edit2 size={16} /></button>
                </div>
              </div>
              <div>
                <h5 className={`text-lg font-black truncate uppercase leading-tight ${d.status === 'Pago' ? 'text-[#2D473966] line-through' : 'text-[#2D4739]'}`}>{d.description}</h5>
                <p className="text-[9px] font-black text-[#6B8E23] uppercase tracking-[0.2em] mb-1">{d.supplier}</p>
                <p className="text-[10px] font-bold text-[#2D473944] uppercase tracking-widest mt-1 flex items-center gap-2">
                  <Calendar size={10} /> Venc: {new Date(d.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-[#2D473905]">
                <p className={`text-xl font-black ${d.status === 'Pago' ? 'text-[#2D473944]' : 'text-[#2D4739]'}`}>R$ {d.value.toLocaleString('pt-BR')}</p>
                <button 
                  onClick={() => onToggleDebtStatus(d.id)} 
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${d.status === 'Pago' ? 'bg-[#2D473911] text-[#2D4739]' : 'bg-[#6B8E23] text-white hover:bg-[#5a7a1c] shadow-lg'}`}
                >
                  {d.status === 'Pago' ? <Check size={14} /> : 'Pagar Agora'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Subtabs */}
        <div className="flex flex-wrap gap-2 bg-white/40 p-2 rounded-[2rem] border border-[#2D473908] w-fit">
          <SubTabBtn active={activeSubTab === 'overview'} label="Visão Geral" onClick={() => setActiveSubTab('overview')} icon={<LayoutDashboard size={14} />} />
          <SubTabBtn active={activeSubTab === 'receivables'} label="Entradas" onClick={() => setActiveSubTab('receivables')} icon={<TrendingUp size={14} />} />
          <SubTabBtn active={activeSubTab === 'expenses'} label="Saídas" onClick={() => setActiveSubTab('expenses')} icon={<TrendingDown size={14} />} />
          <SubTabBtn active={activeSubTab === 'operational-fund'} label="Caixa Operacional" onClick={() => setActiveSubTab('operational-fund')} icon={<Archive size={14} />} />
          <SubTabBtn active={activeSubTab === 'history'} label="Extrato" onClick={() => setActiveSubTab('history')} icon={<History size={14} />} />
        </div>

        {/* MONTH SELECTOR - FILTRO MENSAL */}
        <div className="flex items-center gap-6 bg-white p-2 pr-6 rounded-full shadow-lg border border-[#2D473908]">
           <button onClick={handlePrevMonth} className="p-3 bg-[#FDFBE2] text-[#2D4739] rounded-full hover:bg-[#2D4739] hover:text-[#FDFBE2] transition-colors">
              <ChevronLeft size={20} />
           </button>
           <div className="text-center min-w-[140px]">
              <span className="block text-xs font-black uppercase tracking-widest text-[#2D473944] mb-0.5">Competência</span>
              <span className="block text-lg font-black text-[#2D4739] uppercase tracking-tighter">
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </span>
           </div>
           <button onClick={handleNextMonth} className="p-3 bg-[#FDFBE2] text-[#2D4739] rounded-full hover:bg-[#2D4739] hover:text-[#FDFBE2] transition-colors">
              <ChevronRight size={20} />
           </button>
        </div>
      </div>

      {activeSubTab === 'overview' && renderOverview()}
      {activeSubTab === 'receivables' && renderReceivables()}
      {activeSubTab === 'expenses' && renderExpenses()}
      {activeSubTab === 'operational-fund' && renderOperationalFund()}
      {activeSubTab === 'history' && renderHistory()}
      
      {/* Universal Finance Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1A2E24]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#FDFBE2] w-full max-w-xl rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 md:p-8 border-b border-[#2D473911] flex justify-between items-center bg-white/50 flex-shrink-0">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-[#2D4739] text-[#FDFBE2] rounded-2xl shadow-xl">
                    {modalType === 'expense' && <TrendingDown size={24} />}
                    {modalType === 'revenue' && <TrendingUp size={24} />}
                    {modalType === 'stock' && <ShoppingBag size={24} />}
                    {modalType === 'project-revenue' && <DollarSign size={24} />}
                    {modalType === 'op-fund-spend' && <ShoppingCart size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#2D4739] uppercase tracking-tighter">
                      {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
                    </h3>
                    <p className="text-xs font-black text-[#6B8E23] uppercase tracking-widest mt-1">
                      {modalType === 'expense' && 'Despesa / Custo Fixo'}
                      {modalType === 'revenue' && 'Receita Extra'}
                      {modalType === 'stock' && 'Compra de Material'}
                      {modalType === 'project-revenue' && 'Ajuste de Projeto'}
                      {modalType === 'op-fund-spend' && 'Retirada de Caixa Operacional'}
                    </p>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-[#2D473911] rounded-2xl transition-all"><X size={24} /></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
               
               {/* FORMULARIO DE DESPESA OU RECEITA OU ESTOQUE */}
               <div className="space-y-4">
                  
                  {modalType === 'op-fund-spend' && (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Insumo / Categoria</label>
                        <select 
                           value={opFundCategory} 
                           onChange={e => setOpFundCategory(e.target.value)} 
                           className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none"
                        >
                           {DEFAULT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                     </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Descrição</label>
                    <input 
                      type="text" 
                      value={formDesc} 
                      onChange={e => setFormDesc(e.target.value)} 
                      className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none" 
                      placeholder={
                          modalType === 'stock' ? 'Obs: Compra de urgência' : 
                          modalType === 'op-fund-spend' ? 'Ex: 10 caixas de parafuso 4x40' : 
                          'Ex: Conta de Luz'
                      }
                    />
                  </div>

                  {(modalType === 'expense' || modalType === 'revenue' || modalType === 'stock' || modalType === 'op-fund-spend') && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Valor (R$)</label>
                      <input 
                        type="number" 
                        value={formValue} 
                        onChange={e => setFormValue(e.target.value)} 
                        className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] text-xl outline-none" 
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {modalType === 'stock' && (
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Fornecedor</label>
                       <input type="text" value={formSupplier} onChange={e => setFormSupplier(e.target.value)} className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black outline-none" />
                     </div>
                  )}

                  {(modalType === 'expense' || modalType === 'revenue' || modalType === 'stock' || modalType === 'op-fund-spend') && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">
                        {modalType === 'revenue' ? 'Data do Recebimento' : 'Data de Vencimento / Compra'}
                      </label>
                      <div className="relative group">
                          <input 
                            type="date" 
                            ref={dateRef}
                            value={formDate} 
                            onChange={e => setFormDate(e.target.value)} 
                            className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black outline-none relative z-10 bg-transparent"
                            onClick={(e) => {
                              if ('showPicker' in HTMLInputElement.prototype) {
                                try { e.currentTarget.showPicker(); } catch (err) {}
                              }
                            }}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2D473944] z-0">
                             <Calendar size={20} />
                          </div>
                      </div>
                    </div>
                  )}

                  {modalType === 'revenue' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Cliente (Opcional)</label>
                      <input type="text" value={formClient} onChange={e => setFormClient(e.target.value)} className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black outline-none" />
                    </div>
                  )}

                  {modalType === 'expense' && (
                    <div className="flex items-center gap-3 p-4 bg-[#FDFBE2] rounded-2xl border border-[#2D473911] mt-2">
                       <button 
                          onClick={() => setIsRecurring(!isRecurring)} 
                          className={`w-12 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-[#6B8E23]' : 'bg-[#2D473922]'}`}
                       >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isRecurring ? 'left-7' : 'left-1'}`} />
                       </button>
                       <span className="text-xs font-black text-[#2D4739] uppercase tracking-wide">Despesa Mensal Recorrente</span>
                    </div>
                  )}
               </div>
            </div>

            <div className="p-6 md:p-8 bg-white/50 border-t border-[#2D473911] flex justify-end gap-4 flex-shrink-0">
               {editingId && (
                 <button onClick={handleDeleteEntry} className="px-6 py-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                    <Trash2 size={16} /> Excluir
                 </button>
               )}
               <div className="flex gap-4">
                 <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-[#2D473911] text-[#2D4739] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2D473922] transition-all">Cancelar</button>
                 <button onClick={handleAddEntry} className="px-12 py-4 bg-[#2D4739] text-[#FDFBE2] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all">
                   <Save size={18} /> Salvar
                 </button>
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

export default Finance;