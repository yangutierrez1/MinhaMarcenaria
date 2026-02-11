import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Hammer, 
  Package, 
  Users, 
  Calculator,
  Activity,
  Clock,
  Truck,
  ArrowRight,
  TrendingDown,
  Briefcase
} from 'lucide-react';
import { Project, Material, Budget, ManualPendency, ManualTask } from '../types';
import { formatBRL } from '../utils/format';

interface DashboardProps {
  projects: Project[];
  materials: Material[];
  budgets?: Budget[];
  manualTasks?: ManualTask[];
  manualPendencies?: ManualPendency[];
  userName?: string;
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  projects, 
  materials, 
  budgets = [], 
  userName = 'Mestre', 
  onNavigate 
}) => {
  
  // --- CÁLCULOS ---
  const kpis = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // 1. Financeiro
    const activeProjects = projects.filter(p => !p.isPaid);
    const completedProjects = projects.filter(p => p.isPaid);
    
    // Receita Já Realizada no Mês (Projetos Pagos + Adiantamentos)
    const realizedRevenue = projects.reduce((acc, p) => {
      // Simplificação: Considera valor total se pago, ou adiantamento se houver
      if (p.isPaid) {
          const d = new Date(p.deadline); // Usando data de entrega como base para o caixa
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) return acc + p.value;
      } else if (p.isAdvancePaid && p.advanceValue) {
          // Adiantamentos contam como entrada (sem data específica no modelo, assumindo corrente)
          return acc + p.advanceValue;
      }
      return acc;
    }, 0);

    // Receita Potencial (O que falta receber dos projetos ativos)
    const potentialRevenue = activeProjects.reduce((acc, p) => {
       const paidPart = p.isAdvancePaid ? (p.advanceValue || 0) : 0;
       return acc + (p.value - paidPart);
    }, 0);

    // 2. Estoque
    const stockValue = materials.reduce((acc, m) => acc + (m.price * m.quantity), 0);

    // 3. Pipeline
    const pipeline = {
      prep: activeProjects.filter(p => p.status === 'Preparação').length,
      cut: activeProjects.filter(p => p.status === 'Corte').length,
      assembly: activeProjects.filter(p => p.status === 'Montagem').length,
      delivery: activeProjects.filter(p => p.status === 'Entrega').length,
    };

    // 4. Funil de Vendas (Orçamentos)
    const pendingBudgetsCount = budgets.filter(b => b.status === 'Pendente').length;
    const pendingBudgetsValue = budgets.filter(b => b.status === 'Pendente').reduce((acc, b) => acc + b.finalPrice, 0);

    // 5. Atividades Recentes
    const activities = [
        ...projects.slice(-2).map(p => ({ 
            id: p.id, type: 'project', text: `Iniciado: ${p.name}`, date: 'Produção', icon: <Hammer size={14}/>, color: 'text-blue-600 bg-blue-100' 
        })),
        ...budgets.slice(-2).map(b => ({ 
            id: b.id, type: 'budget', text: `Orçamento: ${b.title}`, date: 'Comercial', icon: <Calculator size={14}/>, color: 'text-amber-600 bg-amber-100' 
        })),
        ...completedProjects.slice(-1).map(p => ({ 
            id: p.id, type: 'money', text: `Entregue: ${p.name}`, date: 'Finalizado', icon: <TrendingUp size={14}/>, color: 'text-green-600 bg-green-100' 
        }))
    ].slice(0, 4);

    return {
      realizedRevenue,
      potentialRevenue,
      projectedTotal: realizedRevenue + potentialRevenue,
      activeCount: activeProjects.length,
      stockValue,
      pendingBudgetsCount,
      pendingBudgetsValue,
      pipeline,
      activities
    };
  }, [projects, materials, budgets]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-[#2D4739] tracking-tighter uppercase leading-none">
            Visão Geral
          </h2>
          <p className="text-sm font-black text-[#2D473966] uppercase tracking-[0.2em] mt-2">
            Bem-vindo, {userName}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm border border-[#2D473908]">
            <Hammer size={16} className="text-[#6B8E23]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#2D473988]">
                {kpis.activeCount} Projetos em Andamento
            </span>
        </div>
      </div>

      {/* BLOCO 1: FINANCEIRO E ESTOQUE (LAYOUT ASSIMÉTRICO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card Principal: Realizado vs Potencial */}
        <div className="lg:col-span-2 bg-[#2D4739] p-8 rounded-[3rem] shadow-2xl text-[#FDFBE2] relative overflow-hidden flex flex-col justify-between min-h-[280px] border border-white/5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#6B8E23] rounded-full blur-[80px] opacity-20 -mr-20 -mt-20"></div>
            
            <div className="relative z-10 flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-3 mb-2 opacity-80">
                    <Wallet size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Fluxo de Caixa</span>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                    R$ {formatBRL(kpis.realizedRevenue)}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">Entradas Confirmadas (Mês Atual)</p>
               </div>
               <button onClick={() => onNavigate('finance')} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                  <ArrowRight size={20} />
               </button>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-8 pt-8 border-t border-white/10 mt-8">
                <div onClick={() => onNavigate('projects')} className="cursor-pointer group">
                   <p className="text-[9px] font-black uppercase tracking-widest text-[#6B8E23] mb-1">À Receber (Projetos)</p>
                   <p className="text-2xl font-bold group-hover:text-[#6B8E23] transition-colors">R$ {formatBRL(kpis.potentialRevenue)}</p>
                </div>
                <div className="opacity-50">
                   <p className="text-[9px] font-black uppercase tracking-widest mb-1">Total Previsto</p>
                   <p className="text-2xl font-bold">R$ {formatBRL(kpis.projectedTotal)}</p>
                </div>
            </div>
        </div>

        {/* Coluna Lateral: Estoque e Orçamentos */}
        <div className="flex flex-col gap-6">
            
            {/* Card Estoque */}
            <div onClick={() => onNavigate('inventory')} className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-[#2D473911] flex-1 flex flex-col justify-center cursor-pointer group hover:border-[#6B8E23] transition-all">
               <div className="flex justify-between items-center mb-2">
                  <Package size={24} className="text-[#2D4739] opacity-20 group-hover:text-[#6B8E23] group-hover:opacity-100 transition-all" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#2D473944]">Patrimônio</span>
               </div>
               <p className="text-2xl font-black text-[#2D4739]">R$ {formatBRL(kpis.stockValue)}</p>
               <p className="text-[9px] font-bold text-[#2D473966] uppercase tracking-wide">Em materiais</p>
            </div>

            {/* Card Funil de Vendas */}
            <div onClick={() => onNavigate('budgets')} className="bg-[#FDFBE2] p-6 rounded-[2.5rem] shadow-lg border border-[#2D473908] flex-1 flex flex-col justify-center cursor-pointer group hover:bg-[#FDFBE2]/80 transition-all">
               <div className="flex justify-between items-center mb-2">
                  <Briefcase size={24} className="text-[#6B8E23]" />
                  <div className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-[#2D4739] shadow-sm">
                     {kpis.pendingBudgetsCount} Pendentes
                  </div>
               </div>
               <p className="text-2xl font-black text-[#2D4739]">R$ {formatBRL(kpis.pendingBudgetsValue)}</p>
               <p className="text-[9px] font-bold text-[#6B8E23] uppercase tracking-wide">Em negociação</p>
            </div>

        </div>
      </div>

      {/* BLOCO 2: FLUXO DE PRODUÇÃO VISUAL */}
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[3rem] border border-[#2D473911] shadow-xl">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-lg font-black text-[#2D4739] uppercase tracking-tight flex items-center gap-3">
             <Activity size={20} className="text-[#6B8E23]" /> Linha de Produção
           </h3>
           <button onClick={() => onNavigate('projects')} className="text-[10px] font-black uppercase tracking-widest text-[#2D473966] hover:text-[#2D4739] flex items-center gap-1">
             Ver Quadro <ArrowRight size={12} />
           </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <ProductionStep label="Preparação" count={kpis.pipeline.prep} color="bg-slate-100 text-slate-600" step="01" />
           <ProductionStep label="Corte" count={kpis.pipeline.cut} color="bg-orange-50 text-orange-600" step="02" icon={<Hammer size={14}/>} />
           <ProductionStep label="Montagem" count={kpis.pipeline.assembly} color="bg-blue-50 text-blue-600" step="03" icon={<Package size={14}/>} />
           <ProductionStep label="Entrega" count={kpis.pipeline.delivery} color="bg-green-50 text-green-700" step="04" icon={<Truck size={14}/>} />
        </div>
      </div>

      {/* BLOCO 3: TIMELINE & AÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         
         {/* Timeline */}
         <div className="bg-white p-8 rounded-[3rem] border border-[#2D473911] shadow-xl flex flex-col h-full">
            <h3 className="text-lg font-black text-[#2D4739] uppercase tracking-tight flex items-center gap-3 mb-6">
               <Clock size={20} className="text-[#6B8E23]" /> Acontecimentos
            </h3>
            
            <div className="flex-1 space-y-4 relative">
               <div className="absolute left-6 top-4 bottom-4 w-px bg-[#2D473908]"></div>
               {kpis.activities.map((act, i) => (
                   <div key={i} className="flex items-center gap-4 relative z-10 group">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-sm transition-transform group-hover:scale-110 ${act.color}`}>
                           {act.icon}
                       </div>
                       <div className="flex-1 p-4 bg-[#FDFBE2]/30 rounded-2xl border border-[#2D473905] group-hover:bg-white group-hover:border-[#2D473911] transition-all">
                           <p className="text-xs font-black text-[#2D4739] truncate">{act.text}</p>
                           <p className="text-[9px] font-bold text-[#2D473944] uppercase tracking-widest">{act.date}</p>
                       </div>
                   </div>
               ))}
               {kpis.activities.length === 0 && (
                   <div className="py-8 text-center opacity-40">
                       <p className="text-xs font-black uppercase text-[#2D4739]">Nenhuma atividade recente</p>
                   </div>
               )}
            </div>
         </div>

         {/* Ações Rápidas (Grid Expandido) */}
         <div className="flex flex-col gap-6">
            <div className="bg-[#2D4739] p-8 rounded-[3rem] shadow-xl border border-white/10 h-full flex flex-col">
               <h3 className="text-lg font-black text-[#FDFBE2] uppercase tracking-tight mb-6 flex items-center gap-2">
                  <Activity size={20} /> Ações Rápidas
               </h3>
               <div className="grid grid-cols-2 gap-4 flex-1">
                  <QuickAction 
                      icon={<Calculator size={24} />} 
                      label="Novo Orçamento" 
                      sub="Criar Proposta"
                      onClick={() => onNavigate('budgets')} 
                      color="bg-[#6B8E23] text-white hover:bg-[#5a7a1c]"
                  />
                  <QuickAction 
                      icon={<Users size={24} />} 
                      label="Novo Cliente" 
                      sub="Cadastrar"
                      onClick={() => onNavigate('clients')} 
                      color="bg-white/10 text-[#FDFBE2] hover:bg-white/20"
                  />
                  <QuickAction 
                      icon={<Package size={24} />} 
                      label="Entrada Estoque" 
                      sub="Registrar Compra"
                      onClick={() => onNavigate('inventory')} 
                      color="bg-white/10 text-[#FDFBE2] hover:bg-white/20"
                  />
                  <QuickAction 
                      icon={<TrendingDown size={24} />} 
                      label="Lançar Despesa" 
                      sub="Financeiro"
                      onClick={() => onNavigate('finance')} 
                      color="bg-red-500/20 text-red-100 hover:bg-red-500/30 border border-red-500/10"
                  />
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

// Componente: Passo da Produção
const ProductionStep: React.FC<{ label: string, count: number, color: string, icon?: React.ReactNode, step: string }> = ({ label, count, color, icon, step }) => (
  <div className={`p-4 rounded-[2rem] flex flex-col items-center justify-center text-center gap-2 transition-all hover:scale-105 border-2 border-transparent hover:border-current relative overflow-hidden group ${color}`}>
     <span className="absolute top-2 right-3 text-[40px] font-black opacity-10 select-none group-hover:opacity-20 transition-opacity">{step}</span>
     <div className="opacity-80 relative z-10">{icon}</div>
     <div className="relative z-10">
       <span className="text-3xl font-black block leading-none">{count}</span>
       <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{label}</span>
     </div>
  </div>
);

// Componente: Botão de Ação Rápida
const QuickAction: React.FC<{ icon: React.ReactNode, label: string, sub: string, onClick: () => void, color: string }> = ({ icon, label, sub, onClick, color }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-start justify-center gap-1 p-5 rounded-[2rem] shadow-lg transition-all active:scale-95 ${color}`}
  >
    <div className="mb-2">{icon}</div>
    <span className="text-xs font-black uppercase tracking-wide text-left leading-tight">{label}</span>
    <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{sub}</span>
  </button>
);

export default Dashboard;