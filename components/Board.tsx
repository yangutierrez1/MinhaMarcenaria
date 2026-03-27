import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project, Client } from '../types';
import { STATUS_COLUMNS } from '../constants';
import { 
  CheckSquare, 
  User, 
  Archive, 
  Trash2, 
  Check, 
  Edit2, 
  X, 
  Wallet,
  Briefcase,
  Calendar as CalendarIcon,
  DollarSign,
  RotateCcw,
  History,
  CheckCircle2,
  Plus
} from 'lucide-react';

interface BoardProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  clients: Client[];
  onMarkAsPaid: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onToggleSubtask: (projectId: string, subtaskTitle: string) => void;
  onSetAdvance: (projectId: string, value: number | undefined) => void;
  onMoveBack: (projectId: string) => void;
  onUpdateProject?: (id: string, updates: Partial<Project>) => void;
}

const Board: React.FC<BoardProps> = ({ projects, setProjects, clients, onMarkAsPaid, onDeleteProject, onToggleSubtask, onSetAdvance, onMoveBack, onUpdateProject }) => {
  const [editingAdvanceId, setEditingAdvanceId] = useState<string | null>(null);
  const [tempAdvanceValue, setTempAdvanceValue] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // 🔥 ESTADOS DO MODAL DE EXCLUSÃO
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskPhase, setNewSubtaskPhase] = useState<any>('Preparação');

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não identificado';
  };

  const formatToBRL = (num: number) => {
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleStartEditingAdvance = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingAdvanceId(project.id);
    const initialValue = project.advanceValue || 0;
    setTempAdvanceValue(formatToBRL(initialValue));
  };

  const handleAdvanceChange = (e: React.ChangeEvent<HTMLInputElement>, maxAllowed: number) => {
    const digits = e.target.value.replace(/\D/g, '');
    let numValue = Number(digits) / 100;
    if (numValue > maxAllowed) numValue = maxAllowed;
    setTempAdvanceValue(formatToBRL(numValue));
  };

  const handleSaveAdvance = (e: React.MouseEvent | React.KeyboardEvent, projectId: string) => {
    if ('stopPropagation' in e) e.stopPropagation();
    const numericString = tempAdvanceValue.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(numericString);
    onSetAdvance(projectId, isNaN(val) ? undefined : val);
    setEditingAdvanceId(null);
  };

  const handleUpdateDeadline = (newDate: string) => {
    if (selectedProject) {
      if (onUpdateProject) {
        onUpdateProject(selectedProject.id, { deadline: newDate });
      } else {
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, deadline: newDate } : p));
      }
      setSelectedProject(prev => prev ? { ...prev, deadline: newDate } : null);
      setIsEditingDeadline(false);
    }
  };

  // 🔥 NOVO HANDLE DELETE (abre modal)
  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  const handleReopenProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onUpdateProject) {
      onUpdateProject(id, { isPaid: false });
    }
  };

  const handleAddSubtask = () => {
    if (!selectedProject || !newSubtaskTitle.trim()) return;

    const newSubtask = {
      title: newSubtaskTitle.trim(),
      completed: false,
      phase: newSubtaskPhase,
    };

    const updatedSubtasks = [...selectedProject.subtasks, newSubtask];

    if (onUpdateProject) {
      onUpdateProject(selectedProject.id, { subtasks: updatedSubtasks });
    } else {
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, subtasks: updatedSubtasks } : p));
    }

    setSelectedProject(prev => prev ? { ...prev, subtasks: updatedSubtasks } : null);
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  const activeProjects = projects.filter(p => !p.isPaid);
  const finishedAndPaidProjects = projects.filter(p => p.isPaid);
  
  const closeModal = () => {
    setSelectedProject(null);
    setIsEditingDeadline(false);
  };

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-700 space-y-16 pb-20">
      
      {/* --- BOARD COLUMNS --- */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-6">
        {STATUS_COLUMNS.map(column => (
          <div key={column} className="flex flex-col bg-white/30 rounded-[3rem] border-2 border-[#2D473911] shadow-sm h-[calc(100vh-320px)] min-h-[500px]">
            <div className="p-8 pb-6 flex justify-between items-center bg-white/10 rounded-t-[3rem] backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${column === 'Entrega' ? 'bg-[#6B8E23]' : 'bg-[#2D4739]'} shadow-lg`} />
                <h3 className="font-black text-[#2D4739] uppercase text-[10px] tracking-[0.3em]">{column}</h3>
                <span className="bg-[#2D4739] px-3 py-1 rounded-full text-[10px] font-black text-[#FDFBE2] ml-2">
                  {activeProjects.filter(p => p.status === column).length}
                </span>
              </div>
            </div>

            <div className="flex-1 p-6 pt-2 space-y-4 overflow-y-auto custom-scrollbar h-full">
              {activeProjects.filter(p => p.status === column).map(project => {
                const currentPhaseTasks = project.subtasks.filter(s => s.phase === column);
                const completedInPhase = currentPhaseTasks.filter(s => s.completed).length;
                const totalInPhase = currentPhaseTasks.length;
                const isPhaseComplete = totalInPhase > 0 && completedInPhase === totalInPhase;
                const advance = project.advanceValue || 0;
                const balanceDue = project.value - advance;
                const canMoveBack = STATUS_COLUMNS.indexOf(project.status as any) > 0;

                return (
                  <div 
                    key={project.id} 
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      setSelectedProject(project);
                    }}
                    className="bg-white p-6 rounded-[2rem] shadow-xl border border-[#2D473911] transition-all group cursor-pointer hover:border-[#6B8E23] hover:shadow-2xl relative"
                  >
                    <div className="flex justify-between items-start mb-4 relative z-20">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#FDFBE2] px-3 py-1 rounded-full border border-[#2D473911] min-w-0">
                          <User size={10} className="text-[#6B8E23] flex-shrink-0" />
                          <span className="text-[8px] font-black uppercase text-[#2D4739] truncate max-w-[100px]">{getClientName(project.clientId)}</span>
                        </div>

                        {canMoveBack && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onMoveBack(project.id); }}
                            className="p-1.5 bg-[#2D473908] text-[#2D473944] hover:text-[#6B8E23] hover:bg-[#6B8E2311] rounded-lg transition-all flex-shrink-0"
                            title="Voltar Etapa"
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}
                      </div>

                      <button 
                        type="button"
                        onClick={(e) => handleDelete(project.id, e)}
                        className="relative z-50 p-2 bg-white text-[#2D473944] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-[#2D473908]"
                        title="Excluir Projeto"
                      >
                        <Trash2 size={16} className="pointer-events-none" />
                      </button>
                    </div>

                    <h4 className="text-lg font-black text-[#2D4739] mb-3 leading-tight tracking-tight">{project.name}</h4>

                    {column !== 'Entrega' && (
                      <div className="mb-4">
                        {editingAdvanceId === project.id ? (
                          <div className="flex gap-2 animate-in slide-in-from-top-1 duration-200">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#6B8E23]">R$</span>
                                <input 
                                  type="text" 
                                  autoFocus 
                                  value={tempAdvanceValue} 
                                  onChange={(e) => handleAdvanceChange(e, project.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveAdvance(e, project.id)}
                                  className="w-full pl-8 pr-3 py-2.5 bg-[#FDFBE2] border-2 border-[#6B8E23] rounded-xl font-black text-[11px] outline-none text-[#2D4739]" 
                                  onClick={(e) => e.stopPropagation()} 
                                  placeholder="0,00"
                                />
                            </div>
                            <button onClick={(e) => handleSaveAdvance(e, project.id)} className="px-4 bg-[#6B8E23] text-white rounded-xl shadow-lg hover:scale-105 transition-all"><Check size={16} /></button>
                          </div>
                        ) : (
                          <button onClick={(e) => handleStartEditingAdvance(e, project)} className={`w-full py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-2 ${project.isAdvancePaid ? 'bg-[#6B8E23] text-white border-[#6B8E23] shadow-md' : 'bg-white text-[#2D473966] border-[#2D473911] hover:border-[#6B8E2322]'}`}>
                            <DollarSign size={12} className={project.isAdvancePaid ? 'text-white' : 'text-[#6B8E23]'} />
                            {project.isAdvancePaid ? `Sinal: R$ ${project.advanceValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Registrar Sinal'}
                          </button>
                        )}
                      </div>
                    )}

                    {column === 'Entrega' && isPhaseComplete ? (
                      <div className="mb-6 space-y-3">
                        <div className="p-4 bg-[#2D4739] rounded-xl text-white space-y-2 shadow-lg">
                           <div className="flex justify-between items-center">
                             <div className="flex flex-col">
                               <span className="text-[7px] font-black text-[#6B8E23] uppercase">Saldo Final</span>
                               <span className="text-base font-black tracking-tight">R$ {balanceDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <Wallet size={18} className="text-[#6B8E23] opacity-40" />
                           </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onMarkAsPaid(project.id); }} className="w-full py-3 bg-[#6B8E23] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all">Concluir Entrega</button>
                      </div>
                    ) : (
                      <div className="mb-6 space-y-2">
                        <div className="grid gap-1.5">
                          {currentPhaseTasks.map((task, idx) => (
                            <button key={idx} onClick={(e) => { e.stopPropagation(); onToggleSubtask(project.id, task.title); }} className="flex items-center gap-2.5 text-left group/task">
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${task.completed ? 'bg-[#6B8E23] border-[#6B8E23]' : 'border-[#2D473922] group-hover/task:border-[#6B8E2366]'}`}>{task.completed && <Check size={10} className="text-white" />}</div>
                              <span className={`text-[10px] font-bold ${task.completed ? 'text-[#2D473944] line-through' : 'text-[#2D4739]'}`}>{task.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9px] font-black text-[#2D473988] uppercase pt-4 border-t border-[#2D473908]">
                      <div className="flex items-center gap-2"><CalendarIcon size={14} className="text-[#6B8E23]" /><span>{new Date(project.deadline).toLocaleDateString()}</span></div>
                      <div className="flex items-center gap-2"><CheckSquare size={14} className="text-[#6B8E23]" /><span>{completedInPhase}/{totalInPhase}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* --- DIVISOR --- */}
      <div className="flex items-center gap-6 opacity-30 px-4">
        <div className="flex-1 h-px bg-[#2D4739] shadow-sm"></div>
        <div className="flex items-center gap-3 text-[#2D4739]">
          <Archive size={20} />
          <span className="text-xs font-black uppercase tracking-[0.5em]">Histórico de Projetos Concluídos</span>
        </div>
        <div className="flex-1 h-px bg-[#2D4739] shadow-sm"></div>
      </div>

      {/* --- HISTÓRICO DE ENTREGAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {finishedAndPaidProjects.map(project => (
           <div 
             key={project.id} 
             onClick={() => setSelectedProject(project)}
             className="bg-white/50 p-6 rounded-[2.5rem] border border-[#2D473908] hover:bg-white hover:border-[#6B8E23] transition-all cursor-pointer group flex flex-col justify-between min-h-[180px]"
           >
              <div>
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 bg-[#6B8E2311] px-3 py-1 rounded-full border border-[#6B8E2322]">
                       <CheckCircle2 size={12} className="text-[#6B8E23]" />
                       <span className="text-[9px] font-black uppercase text-[#6B8E23]">Entregue</span>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={(e) => handleReopenProject(e, project.id)}
                         className="p-2 text-[#2D473944] hover:text-[#2D4739] hover:bg-[#2D473911] rounded-xl transition-all"
                         title="Reabrir Projeto"
                       >
                         <RotateCcw size={16} />
                       </button>
                       <button 
                         onClick={(e) => handleDelete(project.id, e)}
                         className="p-2 text-[#2D473944] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                         title="Excluir Definitivamente"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                 </div>
                 <h4 className="text-base font-black text-[#2D4739] mb-1 leading-tight tracking-tight opacity-60 line-through decoration-[#6B8E23]">{project.name}</h4>
                 <p className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest flex items-center gap-1.5"><User size={10} /> {getClientName(project.clientId)}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-[#2D473908] flex justify-between items-center">
                 <p className="text-xs font-black text-[#6B8E23]">R$ {formatToBRL(project.value)}</p>
                 <div className="flex items-center gap-1 text-[9px] font-bold text-[#2D473944] uppercase">
                    <History size={10} /> {new Date(project.deadline).toLocaleDateString()}
                 </div>
              </div>
           </div>
        ))}
        {finishedAndPaidProjects.length === 0 && (
           <div className="col-span-full py-16 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-[#2D473911] rounded-[3rem]">
              <History size={48} className="text-[#2D4739] mb-4" />
              <p className="text-[#2D4739] text-xs font-black uppercase tracking-widest">Nenhum projeto finalizado ainda</p>
           </div>
        )}
      </div>

      {/* 🔥 MODAL DE EXCLUSÃO */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#FDFBE2] w-full max-w-sm rounded-3xl shadow-2xl border border-[#2D473911] p-8 animate-in zoom-in-95 duration-200">
            
            <h2 className="text-xl font-black text-[#2D4739] mb-4 text-center">
              Confirmar Exclusão
            </h2>

            <p className="text-sm font-bold text-[#2D473988] text-center mb-6">
              Tem certeza que deseja excluir este projeto?  
              O estoque será devolvido automaticamente.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (deleteTarget) onDeleteProject(deleteTarget);
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                  if (selectedProject?.id === deleteTarget) setSelectedProject(null);
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-wider hover:bg-red-700 transition-all"
              >
                Excluir
              </button>

              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-3 bg-[#2D4739] text-[#FDFBE2] rounded-xl font-black uppercase tracking-wider hover:scale-105 transition-all"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 🔥 MODAL DE DETALHES DO PROJETO */} 
 {selectedProject && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1A2E24]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#FDFBE2] w-full max-w-2xl rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 md:p-8 border-b border-[#2D473911] flex justify-between items-center bg-white/50 flex-shrink-0">
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="p-4 rounded-[1.5rem] bg-[#2D4739] text-[#FDFBE2] shadow-xl flex-shrink-0">
                  <Briefcase size={28} />
                </div>
                <div className="min-w-0 space-y-1">
                  <h3 className="text-xl md:text-2xl font-black text-[#2D4739] leading-none tracking-tighter truncate">
                    {selectedProject.name}
                  </h3>
                  <p className="text-[10px] font-black text-[#6B8E23] uppercase tracking-[0.25em] truncate">
                    {getClientName(selectedProject.clientId)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-3 hover:bg-[#2D473911] rounded-2xl transition-all flex-shrink-0 ml-3"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="p-6 bg-white/80 rounded-[2.5rem] border border-[#2D473911] shadow-sm relative group">
                  <p className="text-[10px] font-black text-[#2D473988] uppercase tracking-[0.3em] mb-2">
                    Data de Entrega
                  </p>
                  <div className="flex items-center justify-between">
                    {isEditingDeadline ? (
                      <div className="flex gap-2 w-full animate-in slide-in-from-top-2 duration-200">
                        <input 
                          type="date" 
                          ref={dateInputRef}
                          autoFocus
                          defaultValue={selectedProject.deadline}
                          onBlur={(e) => handleUpdateDeadline(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateDeadline(e.currentTarget.value)}
                          className="flex-1 bg-white border-2 border-[#6B8E23] rounded-xl p-2 font-black text-[#2D4739] outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-xl font-black text-[#2D4739] tracking-tighter">
                          {new Date(selectedProject.deadline).toLocaleDateString('pt-BR')}
                        </p>
                        {!selectedProject.isPaid && (
                          <button
                            onClick={() => setIsEditingDeadline(true)}
                            className="p-2 text-[#6B8E23] hover:bg-[#6B8E2311] rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-white/80 rounded-[2.5rem] border border-[#2D473911] shadow-sm">
                  <p className="text-[10px] font-black text-[#2D473988] uppercase tracking-[0.3em] mb-2">
                    Prioridade
                  </p>
                  <p
                    className={`text-xl font-black uppercase ${
                      selectedProject.priority === 'Urgente'
                        ? 'text-red-600'
                        : 'text-[#6B8E23]'
                    }`}
                  >
                    {selectedProject.priority}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#2D473911] pb-3">
                  <h4 className="text-[10px] font-black text-[#6B8E23] uppercase tracking-[0.4em]">
                    Checklist de Produção
                  </h4>
                  {!selectedProject.isPaid && (
                    <button
                      onClick={() => setIsAddingSubtask(true)}
                      className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#2D4739] hover:text-[#6B8E23] transition-colors"
                    >
                      <Plus size={12} /> Adicionar
                    </button>
                  )}
                </div>
                
                {isAddingSubtask && (
                  <div className="bg-white p-4 rounded-[1.5rem] border-2 border-[#6B8E23] shadow-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        autoFocus
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Nome da tarefa..."
                        className="w-full bg-[#FDFBE2] border border-[#2D473911] rounded-xl p-3 text-sm font-black text-[#2D4739] outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={newSubtaskPhase}
                          onChange={(e) => setNewSubtaskPhase(e.target.value as any)}
                          className="flex-1 bg-[#FDFBE2] border border-[#2D473911] rounded-xl p-3 text-xs font-black text-[#2D4739] outline-none uppercase tracking-widest"
                        >
                          {STATUS_COLUMNS.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddSubtask}
                          className="px-6 py-3 bg-[#6B8E23] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#55701c] transition-colors"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingSubtask(false);
                            setNewSubtaskTitle('');
                          }}
                          className="p-3 text-[#2D473944] hover:text-[#2D4739] hover:bg-[#2D473911] rounded-xl transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-3">
                  {selectedProject.subtasks.map((task, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-4 p-4 rounded-[1.5rem] border-2 ${
                        task.completed
                          ? 'bg-[#2D473908] border-transparent opacity-60'
                          : 'bg-white border-[#2D473911]'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                          task.completed
                            ? 'bg-[#6B8E23] border-[#6B8E23]'
                            : 'border-[#2D473933]'
                        }`}
                      >
                        {task.completed && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <span
                          className={`text-sm font-black ${
                            task.completed
                              ? 'text-[#2D473966] line-through'
                              : 'text-[#2D4739]'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="block text-[7px] font-black uppercase text-[#2D473944]">
                          {task.phase}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-white/40 border-t border-[#2D473911] flex justify-between items-center flex-shrink-0">
              <button 
                onClick={() => {
                  if (selectedProject) {
                    setDeleteTarget(selectedProject.id);
                    setShowDeleteModal(true);
                  }
                }} 
                className="px-6 py-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                <Trash2 size={16} /> Excluir
              </button>
              <button
                onClick={closeModal}
                className="px-10 py-3 md:px-14 md:py-4 bg-[#2D4739] text-[#FDFBE2] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Board;