import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AgendaEvent, Project, Client, EventType, EventStatus } from '../types';
import ConfirmDeleteModal from './ui/ConfirmDeleteModal';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  User, 
  Hammer, 
  Truck, 
  Handshake, 
  Search, 
  Wrench, 
  X, 
  Check, 
  Trash2,
  Zap,
  CalendarDays,
  ArrowRight
} from 'lucide-react';

interface AgendaProps {
  events: AgendaEvent[];
  projects: Project[];
  clients: Client[];
  onAddEvent: (event: Omit<AgendaEvent, 'id'>) => void;
  onUpdateEvent: (id: string, updates: Partial<AgendaEvent>) => void;
  onDeleteEvent: (id: string) => void;
}

const typeColors: Record<EventType, string> = {
  'Produção': 'bg-[#2D4739] text-white',
  'Entrega': 'bg-[#6B8E23] text-white',
  'Reunião': 'bg-amber-500 text-white',
  'Visita Técnica': 'bg-blue-600 text-white',
  'Compra': 'bg-indigo-600 text-white',
  'Manutenção': 'bg-red-600 text-white',
  'Pessoal': 'bg-pink-600 text-white'
};

const typeIcons: Record<EventType, React.ReactNode> = {
  'Produção': <Hammer size={12} />,
  'Entrega': <Truck size={12} />,
  'Reunião': <Handshake size={12} />,
  'Visita Técnica': <Search size={12} />,
  'Compra': <Zap size={12} />,
  'Manutenção': <Wrench size={12} />,
  'Pessoal': <User size={12} />
};

const Agenda: React.FC<AgendaProps> = ({ events, projects, clients, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDayViewDate, setSelectedDayViewDate] = useState<string | null>(null); // 'YYYY-MM-DD'
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('09:00');
  const [formType, setFormType] = useState<EventType>('Produção');
  const [formResponsible, setFormResponsible] = useState('Mestre');
  const [formLocation, setFormLocation] = useState('');

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    
    return days;
  }, [year, month]);

  const getEventsForDay = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const getEventsForDateString = (dateStr: string) => {
    return events
      .filter(e => e.date === dateStr)
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleOpenEventModal = (event?: AgendaEvent, preSelectedDate?: string) => {
    if (event) {
      setSelectedEvent(event);
      setFormTitle(event.title);
      setFormDesc(event.description);
      setFormDate(event.date);
      setFormTime(event.time || '09:00');
      setFormType(event.type);
      setFormResponsible(event.responsible);
      setFormLocation(event.location || '');
    } else {
      setSelectedEvent(null);
      setFormTitle('');
      setFormDesc('');
      setFormDate(preSelectedDate || new Date().toISOString().split('T')[0]);
      setFormTime('09:00');
      setFormType('Produção');
      setFormResponsible('Mestre');
      setFormLocation('');
    }
    setIsEventModalOpen(true);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDayViewDate(dateStr);
  };

  const handleSave = () => {
    const data = {
      title: formTitle,
      description: formDesc,
      date: formDate,
      time: formTime,
      type: formType,
      status: 'Agendado' as EventStatus,
      responsible: formResponsible,
      location: formLocation
    };

    if (selectedEvent) {
      onUpdateEvent(selectedEvent.id, data);
    } else {
      onAddEvent(data);
    }
    setIsEventModalOpen(false);
  };

  const handleDelete = () => {
    if (selectedEvent) {
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (selectedEvent) {
      onDeleteEvent(selectedEvent.id);
      setIsDeleteModalOpen(false);
      setIsEventModalOpen(false);
    }
  };

  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [events]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-fade-in pb-20">
      
      {/* Sidebar de Resumo */}
      <div className="lg:col-span-1 space-y-8">
        <section className="bg-white p-8 rounded-[3rem] shadow-xl border border-[#2D473911] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2D473944]">Próximos Compromissos</h3>
            <span className="w-6 h-6 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-[10px] font-black">{events.length}</span>
          </div>
          
          <div className="space-y-4">
            {upcomingEvents.map(e => (
              <div key={e.id} onClick={() => handleOpenEventModal(e)} className="group cursor-pointer p-4 rounded-2xl bg-[#FDFBE2]/30 border border-[#2D473908] hover:border-[#6B8E23] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-1.5 rounded-lg ${typeColors[e.type]}`}>{typeIcons[e.type]}</div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{e.type}</span>
                </div>
                <p className="text-xs font-black text-[#2D4739] truncate">{e.title}</p>
                <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-[#2D473944]">
                  <Clock size={10} /> {new Date(e.date).toLocaleDateString('pt-BR')} {e.time && `às ${e.time}`}
                </div>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-center py-10 text-[9px] font-black uppercase opacity-20 italic">Nada agendado</p>
            )}
          </div>
        </section>
      </div>

      {/* Calendário Principal */}
      <div className="lg:col-span-3 space-y-8">
        <section className="bg-white rounded-[4rem] shadow-2xl border border-[#2D473911] overflow-hidden flex flex-col min-h-[750px]">
          <div className="p-10 flex justify-between items-center bg-[#FDFBE2]/50 border-b border-[#2D473908]">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-[#2D4739] text-white rounded-[2rem] shadow-xl">
                <Calendar size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#2D4739] uppercase tracking-tighter leading-none">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2 mt-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#6B8E2311] text-[#6B8E23] rounded-full text-[9px] font-black uppercase tracking-widest">
                    <Check size={10} /> {events.filter(e => e.status === 'Concluído').length} Concluídos
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex bg-[#2D473908] p-1 rounded-2xl border border-[#2D473911]">
                <button onClick={handlePrevMonth} className="p-3 hover:bg-white rounded-xl transition-all"><ChevronLeft size={20} /></button>
                <button onClick={() => setCurrentDate(new Date())} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white rounded-xl">Hoje</button>
                <button onClick={handleNextMonth} className="p-3 hover:bg-white rounded-xl transition-all"><ChevronRight size={20} /></button>
              </div>
              <button onClick={() => handleOpenEventModal()} className="px-8 py-4 bg-[#2D4739] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-3">
                <Plus size={18} /> Nova Atividade
              </button>
            </div>
          </div>

          <div className="flex-1 p-8">
            {/* Cabeçalho dias da semana */}
            <div className="grid grid-cols-7 mb-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-[#2D473944]">
              <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
            </div>

            {/* Grid do Calendário */}
            <div className="grid grid-cols-7 gap-4 flex-1">
              {calendarDays.map((day, i) => {
                const dayEvents = getEventsForDay(day);
                const isToday = day && day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                
                return (
                  <div 
                    key={i} 
                    onClick={() => day && handleDayClick(day)}
                    className={`min-h-[140px] p-4 rounded-3xl border transition-all ${day ? 'bg-white border-[#2D473908] hover:border-[#6B8E2344] hover:shadow-lg cursor-pointer' : 'opacity-0'} ${isToday ? 'border-[#6B8E23] bg-[#6B8E2308] ring-2 ring-[#6B8E2322]' : ''}`}
                  >
                    {day && (
                      <>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-sm ${isToday ? 'bg-[#6B8E23] text-white shadow-lg' : 'text-[#2D473944]'}`}>{day}</span>
                        </div>
                        <div className="space-y-1.5 overflow-y-auto custom-scrollbar max-h-[90px] pr-1">
                          {dayEvents.map(e => (
                            <div 
                              key={e.id} 
                              onClick={(evt) => {
                                evt.stopPropagation();
                                handleOpenEventModal(e);
                              }}
                              className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase truncate cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5 ${typeColors[e.type]}`}
                            >
                              {typeIcons[e.type]}
                              <span className="truncate">{e.title}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Modal de Detalhes do Dia */}
      <Modal
        isOpen={!!selectedDayViewDate}
        onClose={() => setSelectedDayViewDate(null)}
        title={selectedDayViewDate ? new Date(selectedDayViewDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
        subtitle="Agenda do Dia"
        icon={<CalendarDays size={24} />}
        footer={
           <Button 
              fullWidth 
              variant="primary" 
              icon={<Plus size={18} />} 
              onClick={() => {
                const date = selectedDayViewDate;
                setSelectedDayViewDate(null);
                handleOpenEventModal(undefined, date || undefined);
              }}
           >
              Adicionar Tarefa neste Dia
           </Button>
        }
      >
         <div className="space-y-4">
            {selectedDayViewDate && getEventsForDateString(selectedDayViewDate).length > 0 ? (
              getEventsForDateString(selectedDayViewDate).map(e => (
                 <div 
                    key={e.id} 
                    onClick={() => {
                       setSelectedDayViewDate(null);
                       handleOpenEventModal(e);
                    }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-[#2D473911] hover:border-[#6B8E23] hover:bg-[#FDFBE2]/30 transition-all cursor-pointer group"
                 >
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-[#2D473908] rounded-xl text-[#2D4739]">
                       <span className="text-xs font-black">{e.time || '--:--'}</span>
                       <Clock size={12} className="opacity-40" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${typeColors[e.type]}`}>
                             {typeIcons[e.type]} {e.type}
                          </span>
                       </div>
                       <h4 className="font-black text-[#2D4739] truncate">{e.title}</h4>
                       {e.location && (
                          <div className="flex items-center gap-1 text-[10px] text-[#2D473966] mt-0.5">
                             <MapPin size={10} /> {e.location}
                          </div>
                       )}
                    </div>
                    <div className="p-2 text-[#2D473922] group-hover:text-[#6B8E23] transition-colors">
                       <ArrowRight size={20} />
                    </div>
                 </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-[#2D473944] border-2 border-dashed border-[#2D473911] rounded-3xl">
                 <Calendar size={48} className="mb-4 opacity-20" />
                 <p className="font-black uppercase tracking-widest text-xs">Agenda livre neste dia</p>
              </div>
            )}
         </div>
      </Modal>

      {/* Modal de Formulário de Evento (Novo/Editar) */}
      {isEventModalOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1A2E24]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#FDFBE2] w-full max-w-xl rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-white/20 animate-in zoom-in-95 flex flex-col max-h-[80vh] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 md:p-8 border-b border-[#2D473911] flex justify-between items-center bg-white/50 flex-shrink-0">
               <div className="flex items-center gap-6">
                  <div className={`p-4 md:p-5 rounded-[2rem] shadow-2xl ${typeColors[formType]}`}>
                    {typeIcons[formType]}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-[#2D4739] leading-none tracking-tighter uppercase">
                      {selectedEvent ? 'Editar Atividade' : 'Nova Atividade'}
                    </h3>
                    <p className="text-xs font-black text-[#6B8E23] uppercase tracking-widest mt-2">Gestão de Agenda</p>
                  </div>
               </div>
               <button onClick={() => setIsEventModalOpen(false)} className="p-4 hover:bg-[#2D473911] rounded-2xl transition-all"><X size={28} /></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar flex-1">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Título do Compromisso</label>
                 <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full p-5 bg-white rounded-2xl border-2 border-[#2D473908] font-black text-lg outline-none focus:border-[#6B8E23]" placeholder="Ex: Entrega Cozinha Americana" />
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Tipo de Atividade</label>
                   <select value={formType} onChange={e => setFormType(e.target.value as EventType)} className="w-full p-5 bg-white rounded-2xl border-2 border-[#2D473908] font-black outline-none bg-white">
                      {Object.keys(typeColors).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Responsável</label>
                   <input type="text" value={formResponsible} onChange={e => setFormResponsible(e.target.value)} className="w-full p-5 bg-white rounded-2xl border-2 border-[#2D473908] font-black outline-none" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Data</label>
                   <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="relative w-full p-5 bg-white rounded-2xl border-2 border-[#2D473908] font-black outline-none" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Hora</label>
                   <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="relative w-full p-5 bg-white rounded-2xl border-2 border-[#2D473908] font-black outline-none" />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest">Local / Observações</label>
                 <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)} className="w-full p-5 bg-white rounded-2xl border-2 border-[#2D473908] font-black outline-none" placeholder="Endereço ou detalhes rápidos..." />
               </div>
            </div>

            <div className="p-6 md:p-8 bg-white/50 border-t border-[#2D473911] flex justify-between flex-shrink-0 items-center">
              {selectedEvent ? (
                <button onClick={handleDelete} className="px-6 py-4 bg-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-200 transition-all">
                  <Trash2 size={16} /> Excluir
                </button>
              ) : <div></div>}
              <div className="flex gap-4">
                <button onClick={() => setIsEventModalOpen(false)} className="px-8 py-4 bg-[#2D473908] text-[#2D4739] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2D473911] transition-all">Cancelar</button>
                <button onClick={handleSave} className="px-12 py-4 bg-[#2D4739] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
                  <Check size={18} /> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Compromisso?"
        description="Tem certeza que deseja remover este compromisso da sua agenda? Esta ação não pode ser desfeita."
        variant="danger"
        confirmText="Excluir"
      />
    </div>
  );
};

export default Agenda;