import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ManualTask, Project, Priority } from '../types';
import ConfirmDeleteModal from './ui/ConfirmDeleteModal';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Zap, 
  Target, 
  Hammer, 
  Plus, 
  MoreHorizontal,
  Clock,
  Briefcase,
  X,
  Check,
  User,
  Tag,
  Paperclip,
  UserPlus,
  Archive,
  History,
  Edit2,
  Trash2,
  Copy
} from 'lucide-react';

interface TaskBoardProps {
  manualTasks: ManualTask[];
  projects: Project[];
  onToggleManual: (id: string) => void;
  onToggleProjectSubtask: (projectId: string, subtaskTitle: string) => void;
  onAddTask: (task: Omit<ManualTask, 'id' | 'completed'>) => void;
  onUpdateTask: (id: string, updates: Partial<ManualTask>) => void;
  onDeleteTask: (id: string) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ 
  manualTasks, 
  projects, 
  onToggleManual, 
  onToggleProjectSubtask,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'Routine' | 'Complex'>('Routine');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  // Menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Delete Confirmation State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Média');
  const [deadline, setDeadline] = useState('');
  const [hasDeadline, setHasDeadline] = useState(true);
  
  const [responsibleInput, setResponsibleInput] = useState('');
  const [responsibles, setResponsibles] = useState<string[]>([]);
  
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to get priority badge color
  const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
      case 'Urgente': return 'bg-red-600 text-white shadow-lg shadow-red-900/20';
      case 'Alta': return 'bg-[#6B8E23] text-white';
      case 'Média': return 'bg-amber-500 text-white'; // Diferente de baixa
      case 'Baixa': return 'bg-slate-400 text-white opacity-80'; // Diferente de média
      default: return 'bg-white/20 text-white';
    }
  };

  // Filtros para as tarefas Ativas (Superiores)
  const routineTasksPending = manualTasks.filter(t => t.category === 'Routine' && !t.completed);
  const complexTasksPending = manualTasks.filter(t => t.category === 'Complex' && !t.completed);
  
  // Filtro de Projetos: Mostrar APENAS tarefas da fase ATUAL do projeto
  // Corrected status comparison: 'Entrega' represents the final phase of production.
  const projectTasksPending = projects
    .filter(p => p.status !== 'Entrega')
    .flatMap(p => p.subtasks
      .filter(s => !s.completed && s.phase === p.status) // Filtro crucial: fase === status
      .map(s => ({ ...s, projectName: p.name, projectId: p.id, priority: p.priority, deadline: p.deadline }))
    );

  // Filtros para as tarefas Finalizadas (Inferiores)
  const routineTasksDone = manualTasks.filter(t => t.category === 'Routine' && t.completed);
  const complexTasksDone = manualTasks.filter(t => t.category === 'Complex' && t.completed);
  
  // Mostrar apenas tarefas concluídas que pertenciam à fase atual ou fases anteriores
  const projectTasksDone = projects
    .flatMap(p => p.subtasks
      .filter(s => s.completed)
      .map(s => ({ ...s, projectName: p.name, projectId: p.id, priority: p.priority, deadline: p.deadline }))
    );

  const openAddTaskModal = (category: 'Routine' | 'Complex') => {
    setModalType(category);
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setPriority('Média');
    setDeadline(new Date().toISOString().split('T')[0]);
    setHasDeadline(category === 'Complex');
    setResponsibleInput('');
    setResponsibles([]);
    setTags([]);
    setIsModalOpen(true);
  };

  const openEditTaskModal = (task: ManualTask) => {
    setModalType(task.category);
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setDeadline(task.deadline || new Date().toISOString().split('T')[0]);
    setHasDeadline(!!task.deadline);
    setResponsibles(task.responsibles || []);
    setTags(task.tags || []);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDuplicateTask = (task: ManualTask) => {
    const taskToCopy = { ...task };
    delete (taskToCopy as any).id;
    delete (taskToCopy as any).completed;
    
    onAddTask({
      ...taskToCopy,
      title: `${taskToCopy.title} (Cópia)`
    });
    setActiveMenuId(null);
  };

  const handleSaveTask = () => {
    if (!title.trim()) return alert("Por favor, informe o título da tarefa.");
    
    const taskData = {
      title,
      description,
      category: modalType,
      priority,
      deadline: (modalType === 'Complex' && hasDeadline) ? deadline : undefined,
      responsibles: responsibles.length > 0 ? responsibles : undefined,
      tags: tags.length > 0 ? tags : undefined
    };

    if (editingTaskId) {
      onUpdateTask(editingTaskId, taskData);
    } else {
      onAddTask(taskData);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setActiveMenuId(null);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      onDeleteTask(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const addResponsible = () => {
    if (responsibleInput.trim() && !responsibles.includes(responsibleInput.trim())) {
      setResponsibles([...responsibles, responsibleInput.trim()]);
      setResponsibleInput('');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const renderCardMenu = (task: ManualTask) => (
    <div className="absolute right-6 top-14 z-[60] bg-[#FDFBE2] border border-[#2D473911] shadow-2xl rounded-2xl py-2 min-w-[160px] animate-in zoom-in-95 duration-200" ref={menuRef}>
      <button 
        onClick={() => openEditTaskModal(task)}
        className="w-full text-left px-5 py-3 hover:bg-[#2D473908] flex items-center gap-3 text-[#2D4739] transition-all"
      >
        <Edit2 size={16} className="text-[#6B8E23]" />
        <span className="text-xs font-black uppercase tracking-widest">Editar</span>
      </button>
      <button 
        onClick={() => handleDuplicateTask(task)}
        className="w-full text-left px-5 py-3 hover:bg-[#2D473908] flex items-center gap-3 text-[#2D4739] transition-all"
      >
        <Copy size={16} className="text-[#2D473944]" />
        <span className="text-xs font-black uppercase tracking-widest">Duplicar</span>
      </button>
      <div className="h-px bg-[#2D473908] my-1 mx-2" />
      <button 
        onClick={() => handleDelete(task.id)}
        className="w-full text-left px-5 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600 transition-all"
      >
        <Trash2 size={16} />
        <span className="text-xs font-black uppercase tracking-widest">Excluir</span>
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-700 pb-20">
      
      {/* SEÇÃO 1: TAREFAS ATIVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        {/* COLUNA 1: PROJETOS INTERNOS PENDENTES */}
        <section className="bg-[#2D4739] rounded-[3rem] p-8 flex flex-col h-[650px] shadow-2xl shadow-[#2D473944]">
          <div className="flex justify-between items-center text-[#FDFBE2] mb-8 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 text-white rounded-2xl">
                <Target size={20} />
              </div>
              <h2 className="font-black uppercase text-xs tracking-[0.3em] opacity-80">Projetos Internos</h2>
            </div>
            <button onClick={() => openAddTaskModal('Complex')} className="p-2 hover:bg-white/20 rounded-xl text-white/40 transition-all">
              <Plus size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
            {complexTasksPending.map(task => (
              <div key={task.id} className="relative bg-white/10 border border-white/10 p-6 rounded-[2.5rem] space-y-4 group hover:bg-white/15 transition-all">
                <div className="flex justify-between items-start">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                    {task.priority}
                  </span>
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                    className="p-2 text-white/40 hover:text-white transition-colors"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                
                {activeMenuId === task.id && renderCardMenu(task)}

                <div>
                  <h4 className="text-white font-black text-lg leading-tight tracking-tight">{task.title}</h4>
                  {task.responsibles && task.responsibles.length > 0 && (
                     <div className="flex flex-wrap gap-1 mt-2">
                       {task.responsibles.map(r => (
                         <span key={r} className="text-[9px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                           <User size={8} /> {r}
                         </span>
                       ))}
                     </div>
                  )}
                </div>
                <p className="text-white/60 text-xs leading-relaxed line-clamp-2">{task.description}</p>
                <div className="pt-4 flex items-center justify-between border-t border-white/10">
                  <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
                    <Calendar size={12} />
                    <span>{task.deadline || 'Sem prazo'}</span>
                  </div>
                  <button onClick={() => onToggleManual(task.id)} className="px-4 py-2 bg-white text-[#2D4739] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95">Finalizar</button>
                </div>
              </div>
            ))}
            {complexTasksPending.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <Target size={48} className="text-white mb-4" />
                <p className="text-white text-xs font-black uppercase tracking-widest">Tudo em dia!</p>
              </div>
            )}
          </div>
        </section>

        {/* COLUNA 3: ROTINA DIÁRIA PENDENTE */}
        <section className="bg-white/40 rounded-[3rem] border-2 border-[#2D473908] p-8 flex flex-col h-[650px]">
          <div className="flex justify-between items-center mb-8 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#6B8E2311] text-[#6B8E23] rounded-2xl">
                <Zap size={20} />
              </div>
              <h2 className="font-black text-[#2D4739] uppercase text-xs tracking-[0.3em]">Rotina Diária</h2>
            </div>
            <button onClick={() => openAddTaskModal('Routine')} className="p-2 hover:bg-[#2D4739] hover:text-white rounded-xl text-[#2D473944] transition-all">
              <Plus size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {routineTasksPending.map(task => (
              <div 
                key={task.id} 
                className="relative flex flex-col gap-2 p-5 rounded-[1.75rem] border-2 bg-white border-[#2D473911] hover:border-[#6B8E23] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <button onClick={() => onToggleManual(task.id)} className="cursor-pointer group">
                    <Circle className="text-[#2D473922] group-hover:text-[#6B8E23]" size={22} />
                  </button>
                  <div className="flex-1 cursor-pointer" onClick={() => onToggleManual(task.id)}>
                    <p className="text-sm font-black text-[#2D4739] tracking-tight">{task.title}</p>
                  </div>
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                    className="p-1 text-[#2D473922] hover:text-[#2D4739] transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                {activeMenuId === task.id && renderCardMenu(task)}

                {task.responsibles && task.responsibles.length > 0 && (
                  <div className="pl-9 flex flex-wrap gap-1">
                    {task.responsibles.map(r => (
                      <span key={r} className="text-[8px] font-black uppercase tracking-widest text-[#2D473944] bg-[#2D473908] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <User size={8} /> {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {routineTasksPending.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <Zap size={48} className="text-[#6B8E23] mb-4" />
                <p className="text-[#2D4739] text-xs font-black uppercase tracking-widest">Tudo limpo!</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* DIVISOR DE SEÇÃO */}
      <div className="flex items-center gap-6 opacity-30 px-4">
        <div className="flex-1 h-px bg-[#2D4739] shadow-sm"></div>
        <div className="flex items-center gap-3 text-[#2D4739]">
          <Archive size={20} />
          <span className="text-xs font-black uppercase tracking-[0.5em]">Atividades Finalizadas</span>
        </div>
        <div className="flex-1 h-px bg-[#2D4739] shadow-sm"></div>
      </div>

      {/* SEÇÃO 2: TAREFAS FINALIZADAS (CONCLUÍDAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start opacity-60 hover:opacity-100 transition-opacity duration-500">
        
        {/* COLUNA 1: PROJETOS INTERNOS CONCLUÍDOS */}
        <section className="bg-white/20 border-2 border-dashed border-[#2D473911] rounded-[3rem] p-8 space-y-6 min-h-[300px]">
          <div className="flex items-center gap-3 text-[#2D473944]">
            <History size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Arquivo Interno</h3>
          </div>
          <div className="space-y-4">
            {complexTasksDone.map(task => (
              <div key={task.id} className="relative bg-white/40 p-5 rounded-[2rem] border border-[#2D473908] flex items-center justify-between group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#2D473966] line-through truncate tracking-tight">{task.title}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#2D473922] mt-1">Concluído</p>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                      className="p-2 text-[#2D473922] hover:text-[#2D4739]"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    <button onClick={() => onToggleManual(task.id)} className="p-2 text-[#6B8E23] hover:bg-white rounded-xl transition-all">
                      <CheckCircle2 size={20} />
                    </button>
                </div>
                {activeMenuId === task.id && renderCardMenu(task)}
              </div>
            ))}
            {complexTasksDone.length === 0 && (
              <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-[#2D473911] py-10 italic">Nenhuma tarefa arquivada</p>
            )}
          </div>
        </section>

        {/* COLUNA 3: ROTINA DIÁRIA CONCLUÍDA */}
        <section className="bg-white/20 border-2 border-dashed border-[#2D473911] rounded-[3rem] p-8 space-y-6 min-h-[300px]">
          <div className="flex items-center gap-3 text-[#2D473944]">
            <History size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Checklist do Dia</h3>
          </div>
          <div className="space-y-4">
            {routineTasksDone.map(task => (
              <div key={task.id} className="relative bg-white/40 p-5 rounded-[2rem] border border-[#2D473908] flex items-center justify-between group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#2D473966] line-through truncate tracking-tight">{task.title}</p>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                      className="p-2 text-[#2D473922] hover:text-[#2D4739]"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    <button onClick={() => onToggleManual(task.id)} className="p-2 text-[#6B8E23] hover:bg-white rounded-xl transition-all">
                      <CheckCircle2 size={20} />
                    </button>
                </div>
                {activeMenuId === task.id && renderCardMenu(task)}
              </div>
            ))}
            {routineTasksDone.length === 0 && (
              <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-[#2D473911] py-10 italic">Lista limpa</p>
            )}
          </div>
        </section>
      </div>

      {/* MODAL ADICIONAR/EDITAR TAREFA */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1A2E24]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#FDFBE2] w-full max-w-xl rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 md:p-8 border-b border-[#2D473911] flex justify-between items-center bg-white/50 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl shadow-xl ${modalType === 'Routine' ? 'bg-[#6B8E23] text-white' : 'bg-[#2D4739] text-[#FDFBE2]'}`}>
                  {editingTaskId ? <Edit2 size={24} /> : (modalType === 'Routine' ? <Zap size={24} /> : <Target size={24} />)}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-[#2D4739] leading-tight uppercase tracking-tight">
                    {editingTaskId ? 'Editar Tarefa' : (modalType === 'Routine' ? 'Nova Rotina' : 'Novo Projeto')}
                  </h3>
                  <p className="text-xs font-black text-[#6B8E23] uppercase tracking-widest mt-1">Gestão da Marcenaria</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-[#2D473911] rounded-2xl text-[#2D4739] transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-3">
                <label className="text-xs font-black text-[#2D4739AA] uppercase tracking-[0.2em]">Título da Tarefa</label>
                <input 
                  type="text" 
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] focus:ring-4 focus:ring-[#2D473908] outline-none"
                  placeholder="O que precisa ser feito?"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-[#2D4739AA] uppercase tracking-[0.2em]">Descrição Detalhada</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-bold text-[#2D4739AA] focus:ring-4 focus:ring-[#2D473908] outline-none resize-none"
                  placeholder="Ex: Instruções de montagem, medidas críticas ou materiais específicos."
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-[#2D4739AA] uppercase tracking-[0.2em] flex items-center gap-2">
                  <User size={14} className="text-[#6B8E23]" /> Responsáveis (Funcionários)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={responsibleInput}
                    onChange={(e) => setResponsibleInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addResponsible()}
                    className="flex-1 p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none"
                    placeholder="Nome do funcionário..."
                  />
                  <button 
                    onClick={addResponsible}
                    className="p-4 bg-[#6B8E2311] text-[#6B8E23] rounded-2xl hover:bg-[#6B8E2322] transition-all"
                  >
                    <UserPlus size={24} />
                  </button>
                </div>
                {responsibles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in duration-300">
                    {responsibles.map(r => (
                      <span key={r} className="px-3 py-1.5 bg-[#6B8E23] text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#6B8E2322]">
                        <User size={12} />
                        {r}
                        <button onClick={() => setResponsibles(responsibles.filter(res => res !== r))} className="hover:text-white/70"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-[#2D4739AA] uppercase tracking-[0.2em]">Prioridade</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none cursor-pointer appearance-none"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center h-[18px]">
                      <label className="text-xs font-black text-[#2D4739AA] uppercase tracking-[0.2em] flex items-center gap-2">
                        <Clock size={14} className="text-[#6B8E23]" /> Prazo
                      </label>
                      <button 
                        onClick={() => setHasDeadline(!hasDeadline)}
                        className="flex items-center gap-2 group"
                      >
                        <div className={`w-8 h-4 rounded-full transition-all relative ${hasDeadline ? 'bg-[#6B8E23]' : 'bg-[#2D473922]'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${hasDeadline ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                      </button>
                   </div>
                   {hasDeadline ? (
                      <div className="relative">
                        <input 
                          type="date" 
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none relative z-10"
                          onClick={(e) => {
                            // Tenta abrir o picker nativo programaticamente se suportado, para garantir comportamento
                            if ('showPicker' in HTMLInputElement.prototype) {
                              try { e.currentTarget.showPicker(); } catch { /* ignore */ }
                            }
                          }}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2D473944] z-0 pointer-events-none">
                           <Calendar size={20} />
                        </div>
                      </div>
                   ) : (
                      <div className="w-full p-4 bg-white/40 rounded-2xl border border-dashed border-[#2D473911] text-center h-[58px] flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase text-[#2D473944] tracking-widest">Sem data definida</span>
                      </div>
                   )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-[#2D4739AA] uppercase tracking-[0.2em] flex items-center gap-2">
                  <Tag size={14} className="text-[#6B8E23]" /> Tags / Categorias
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none"
                    placeholder="Urgente, Showroom, Marcenaria..."
                  />
                  <button 
                    onClick={addTag}
                    className="p-4 bg-[#2D473911] text-[#2D4739] rounded-2xl hover:bg-[#2D473922] transition-all"
                  >
                    <Plus size={24} />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(t => (
                      <span key={t} className="px-3 py-1.5 bg-[#2D4739] text-[#FDFBE2] rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        {t}
                        <button onClick={() => setTags(tags.filter(tg => tg !== t))}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 p-6 bg-white/40 rounded-3xl border border-[#2D473908]">
                 <button className="w-full flex items-center justify-center gap-3 text-xs font-black text-[#2D473966] uppercase tracking-[0.3em] hover:text-[#2D4739] transition-colors py-2">
                    <Paperclip size={18} /> Adicionar Anexos / Fotos
                 </button>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-white/50 border-t border-[#2D473911] flex justify-end gap-4 flex-shrink-0">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 bg-[#2D473911] text-[#2D4739] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#2D473922] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveTask}
                  className={`px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${
                    modalType === 'Routine' ? 'bg-[#6B8E23] text-white hover:bg-[#5a7a1c]' : 'bg-[#2D4739] text-[#FDFBE2] hover:bg-[#1A2E24]'
                  }`}
                >
                  <Check size={18} /> {editingTaskId ? 'Salvar Alterações' : 'Salvar Tarefa'}
                </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Excluir Tarefa?"
        description="Tem certeza que deseja remover esta tarefa permanentemente?"
        variant="danger"
        confirmText="Excluir"
      />
    </div>
  );
};

export default TaskBoard;