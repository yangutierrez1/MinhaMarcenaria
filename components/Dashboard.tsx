
import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  ChevronLeft,
  ChevronRight,
  Trello,
  Calculator,
  CheckCircle2,
  CalendarDays,
  X,
  Info,
  AlertCircle,
  ClipboardList,
  PlayCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  Circle,
  DollarSign,
  PlusCircle,
  Zap,
  Hammer
} from 'lucide-react';
import { Project, Material, Budget, ManualPendency, ManualTask } from '../types';

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
  manualTasks = [],
  manualPendencies = [],
  userName = 'Mestre', 
  onNavigate 
}) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => !p.isPaid);
    const waitingBudgets = budgets.filter(b => b.status === 'Pendente');
    const delayed = activeProjects.filter(p => new Date(p.deadline) < new Date());
    const totalPotentialValue = activeProjects.reduce((sum, p) => sum + p.value, 0);
    
    return {
      budgetsCount: waitingBudgets.length,
      productionCount: projects.filter(p => p.status !== 'Entrega' && !p.isPaid).length,
      delayedCount: delayed.length,
      pendenciesCount: manualPendencies.filter(p => !p.completed).length,
      potentialRevenue: totalPotentialValue
    };
  }, [projects, budgets, manualPendencies]);

  const combinedTasks = useMemo(() => {
    const pSubtasks = projects
      .filter(p => !p.isPaid)
      .flatMap(p => 
        p.subtasks
          .filter(s => !s.completed && s.phase === p.status)
          .map(s => ({ id: `p-${p.id}-${s.title}`, title: s.title, subtitle: p.name, type: 'project' as const }))
      );

    const mTasks = manualTasks
      .filter(t => !t.completed)
      .map(t => ({ id: t.id, title: t.title, subtitle: 'Rotina Oficina', type: 'manual' as const }));

    return [...mTasks, ...pSubtasks].slice(0, 10);
  }, [projects, manualTasks]);

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          icon={<Calculator size={28} />} 
          label="Orçamentos Abertos" 
          value={stats.budgetsCount.toString()} 
          subText="Novas oportunidades" 
          accentColor="#6B8E23"
          onClick={() => onNavigate('budgets')}
        />
        <StatCard 
          icon={<Hammer size={28} />} 
          label="Em Produção" 
          value={stats.productionCount.toString()} 
          subText="Projetos na oficina" 
          accentColor="#2D4739"
          onClick={() => onNavigate('projects')}
        />
        <StatCard 
          icon={<AlertCircle size={28} />} 
          label="Atrasos / Alertas" 
          value={stats.delayedCount.toString()} 
          subText="Verifique os prazos" 
          accentColor="#dc2626"
          onClick={() => onNavigate('projects')}
        />
        <StatCard 
          icon={<DollarSign size={28} />} 
          label="Capital em Produção" 
          value={`R$ ${(stats.potentialRevenue / 1000).toFixed(1)}k`} 
          subText="Valor total de ativos" 
          accentColor="#6B8E23"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <section className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-[#2D473911] space-y-8 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[#2D473966] flex items-center gap-3">
              <Zap size={16} className="text-[#6B8E23]" /> Ações Rápidas
            </h3>
          </div>
          <div className="grid gap-4">
             <QuickActionButton icon={<PlusCircle size={24} />} label="Novo Orçamento" color="#6B8E23" onClick={() => onNavigate('budgets')} />
             <QuickActionButton icon={<Trello size={24} />} label="Painel de Tarefas" color="#2D4739" onClick={() => onNavigate('tasks')} />
             <QuickActionButton icon={<ClipboardList size={24} />} label="Anotação Rápida" color="#2D4739" onClick={() => onNavigate('pendencies')} />
          </div>
          <div className="pt-10 border-t border-[#2D473908] flex-1">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-[#2D473944] mb-6">Lembretes Urgentes</h4>
             <div className="space-y-4">
                {manualPendencies.filter(p => !p.completed).slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-4 bg-[#FDFBE2] p-4 rounded-2xl border border-[#2D473908]">
                    <Circle size={12} className="text-[#6B8E23]" />
                    <span className="text-xs font-bold text-[#2D4739AA] truncate">{p.text}</span>
                  </div>
                ))}
                {manualPendencies.filter(p => !p.completed).length === 0 && (
                   <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#2D473922] py-4">Nenhuma pendência rápida</p>
                )}
             </div>
          </div>
        </section>

        <section className="lg:col-span-2 bg-white rounded-[3.5rem] p-10 shadow-2xl border border-[#2D473911] space-y-10 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[#2D473966] flex items-center gap-3">
              <Trello size={16} className="text-[#6B8E23]" /> O Que Fazer Hoje?
            </h3>
            <button onClick={() => onNavigate('tasks')} className="text-[10px] font-black uppercase tracking-widest text-[#6B8E23] flex items-center gap-2 hover:underline">Ver todas <ArrowRight size={14} /></button>
          </div>
          
          <div className="overflow-y-auto custom-scrollbar flex-1 pr-4 space-y-4 max-h-[600px]">
            {combinedTasks.length > 0 ? combinedTasks.map(t => (
              <div key={t.id} className="group flex items-center gap-6 p-6 rounded-[2.5rem] bg-[#FDFBE2]/30 border border-[#2D473908] hover:border-[#6B8E23] transition-all cursor-pointer">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#2D473922] group-hover:text-[#6B8E23] transition-all border border-[#2D473911] shadow-sm">
                  {t.type === 'project' ? <Hammer size={24} /> : <Zap size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[#2D4739] text-base truncate">{t.title}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D473944] mt-1">{t.subtitle}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={20} className="text-[#6B8E23]" />
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                <CheckCircle2 size={80} className="text-[#6B8E23] mb-6" />
                <p className="text-xl font-black uppercase tracking-[0.4em]">Tudo Finalizado!</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="bg-[#2D4739] rounded-[4rem] p-14 shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6B8E23] opacity-10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 relative z-10">
          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Cronograma de Entregas</h3>
             <h4 className="text-5xl font-black text-[#FDFBE2] tracking-tighter uppercase">Visão Estratégica</h4>
          </div>
          <div className="flex gap-4">
            <button className="px-10 py-4 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10">Fevereiro</button>
            <button className="px-10 py-4 bg-[#6B8E23] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Hoje</button>
          </div>
        </div>
        <Calendar projects={projects} onProjectClick={setSelectedProject} />
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-[#1A2E24]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#FDFBE2] w-full max-w-2xl rounded-[3.5rem] shadow-2xl border border-white/20 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-[#2D473911] flex justify-between items-center bg-white/50 flex-shrink-0">
               <div className="flex items-center gap-6">
                  <div className="p-5 bg-[#2D4739] text-[#FDFBE2] rounded-[2rem] shadow-2xl"><Hammer size={32} /></div>
                  <div>
                    <h3 className="text-3xl font-black text-[#2D4739] leading-none tracking-tighter uppercase">{selectedProject.name}</h3>
                    <p className="text-xs font-black text-[#6B8E23] uppercase tracking-widest mt-2">{selectedProject.status}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedProject(null)} className="p-4 hover:bg-[#2D473911] rounded-2xl transition-all"><X size={32} /></button>
            </div>
            
            <div className="p-12 space-y-10 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-8">
                <div className="p-8 bg-white/80 rounded-[2.5rem] border border-[#2D473911] shadow-sm">
                  <p className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest mb-3">Entrega Prometida</p>
                  <p className="text-3xl font-black text-[#2D4739] tracking-tighter">{new Date(selectedProject.deadline).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="p-8 bg-white/80 rounded-[2.5rem] border border-[#2D473911] shadow-sm">
                  <p className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest mb-3">Valor do Projeto</p>
                  <p className="text-3xl font-black text-[#6B8E23] tracking-tighter">R$ {selectedProject.value.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="space-y-6">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2D473944] border-b border-[#2D473911] pb-4">Progresso Checklist</h4>
                 <div className="grid gap-4">
                    {selectedProject.subtasks.slice(0, 5).map((s, i) => (
                      <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border ${s.completed ? 'bg-[#2D473908] border-transparent opacity-50' : 'bg-white border-[#2D473908]'}`}>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${s.completed ? 'bg-[#6B8E23] border-[#6B8E23]' : 'border-[#2D473911]'}`}>{s.completed && <CheckCircle2 size={14} className="text-white" />}</div>
                        <span className={`text-sm font-bold ${s.completed ? 'line-through text-[#2D473944]' : 'text-[#2D4739]'}`}>{s.title}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
            <div className="p-10 bg-white/50 border-t border-[#2D473911] flex justify-end flex-shrink-0">
              <button onClick={() => { setSelectedProject(null); onNavigate('projects'); }} className="px-14 py-5 bg-[#2D4739] text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3">Gerenciar no Painel <ArrowRight size={18} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, subText: string, accentColor: string, onClick?: () => void }> = ({ icon, label, value, subText, accentColor, onClick }) => (
  <div onClick={onClick} className={`bg-white p-10 rounded-[3.5rem] shadow-2xl border border-[#2D473911] hover:-translate-y-2 transition-all group relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}>
    <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:scale-150 transition-transform"><TrendingUp size={150} /></div>
    <div className="flex justify-between items-start mb-10">
      <div className="p-5 bg-[#FDFBE2] rounded-2xl shadow-inner border border-[#2D473908] text-[#2D4739]">{icon}</div>
      <ArrowRight size={24} className="text-[#2D473911] group-hover:text-[#6B8E23] transition-colors" />
    </div>
    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2D473944] mb-2">{label}</h4>
    <p className="text-5xl font-black text-[#2D4739] tracking-tighter mb-3">{value}</p>
    <p className="text-[10px] font-bold text-[#2D473988] uppercase tracking-widest">{subText}</p>
    <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[#2D473908]"><div className="h-full bg-current opacity-40" style={{ width: '100%', backgroundColor: accentColor }}></div></div>
  </div>
);

const QuickActionButton: React.FC<{ icon: React.ReactNode, label: string, color: string, onClick: () => void }> = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-6 p-6 rounded-[2.5rem] bg-[#FDFBE2]/30 border border-[#2D473908] hover:border-[#6B8E23] hover:bg-white transition-all shadow-sm group">
    <div className="p-4 bg-white rounded-2xl shadow-sm text-[#2D4739] group-hover:scale-110 transition-transform" style={{ color: color }}>{icon}</div>
    <span className="text-xs font-black uppercase tracking-[0.3em] text-[#2D4739]">{label}</span>
  </button>
);

const Calendar: React.FC<{ projects: Project[], onProjectClick: (p: Project) => void }> = ({ projects, onProjectClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isToday = (day: number) => {
    const t = new Date();
    return t.getDate() === day && t.getMonth() === month && t.getFullYear() === year;
  };

  const getDayProjects = (day: number) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return projects.filter(p => p.deadline === dateStr && !p.isPaid);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-10 text-white/40 font-black uppercase text-[10px] tracking-[1em] px-10">
        <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
      </div>
      <div className="grid grid-cols-7 gap-6">
        {days.map((d, i) => (
          <div key={i} className={`min-h-[140px] p-6 rounded-[2.5rem] border-2 border-white/5 transition-all ${d ? 'bg-white/5 hover:bg-white/10 cursor-default' : 'opacity-0'}`}>
            {d && (
              <>
                <div className="flex justify-between items-start mb-4">
                  <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-lg ${isToday(d) ? 'bg-[#6B8E23] text-white shadow-xl' : 'text-white/40'}`}>{d}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getDayProjects(d).map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => onProjectClick(p)}
                      className={`w-4 h-4 rounded-full ${p.priority === 'Urgente' ? 'bg-red-500' : 'bg-[#6B8E23]'} border-2 border-[#2D4739] hover:scale-150 transition-all shadow-xl`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
