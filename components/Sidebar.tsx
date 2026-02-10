import React from 'react';
import { 
  LayoutDashboard, 
  Trello, 
  FolderKanban, 
  Calculator, 
  Package, 
  Users, 
  Leaf,
  Edit3,
  DollarSign,
  CalendarDays,
  X,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  brand: {
    logoUrl: string;
    name: string;
    slogan: string;
  };
  onEditBrand: () => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, brand, onEditBrand, isOpen, onClose, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'budgets', label: 'Orçamentos', icon: Calculator },
    { id: 'projects', label: 'Projetos', icon: FolderKanban },
    { id: 'tasks', label: 'Tarefas', icon: Trello },
    { id: 'pendencies', label: 'Pendências', icon: ClipboardList }, // Added locally for icon usage, assumed imported above
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    onClose(); // Fecha o menu no mobile ao clicar
  };

  return (
    <>
      {/* Overlay Escuro para Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Principal */}
      <aside 
        className={`w-72 lg:w-64 h-screen bg-[#1A2E24] text-[#FDFBE2] flex flex-col fixed left-0 top-0 shadow-2xl z-50 border-r border-[#ffffff08] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Botão Fechar Mobile */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white lg:hidden"
        >
          <X size={24} />
        </button>

        <div className="p-8 pb-6 flex flex-col items-center gap-4 relative group mt-6 lg:mt-0">
          
          <button 
            onClick={onEditBrand}
            className="absolute top-4 right-4 p-2 bg-[#6B8E23] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 z-50 hidden lg:block"
            title="Editar Marca"
          >
            <Edit3 size={14} />
          </button>

          <div className="relative cursor-pointer" onClick={onEditBrand}>
            <div className="w-20 h-20 bg-[#2D4739] rounded-[1.75rem] flex items-center justify-center shadow-2xl border border-[#ffffff11] relative overflow-hidden transition-all duration-500 group-hover:rotate-6">
               {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                  <>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 flex flex-col">
                      {[...Array(6)].map((_, i) => <div key={i} className="h-4 border-b border-white" />)}
                    </div>
                    <div className="z-10 text-white flex flex-col items-center">
                        <Leaf size={40} className="rotate-45" />
                    </div>
                  </>
               )}
            </div>
            {!brand.logoUrl && (
              <div className="absolute -top-2 -left-3 text-[#6B8E23] z-20 animate-bounce">
                <Leaf size={24} className="-rotate-12 fill-current" />
              </div>
            )}
          </div>
          
          <div className="w-full flex flex-col items-center cursor-pointer" onClick={onEditBrand}>
            <h2 className="text-xl lg:text-2xl font-black text-[#FDFBE2] tracking-tighter uppercase leading-none break-words px-2 text-center w-full">
              {brand.name}
            </h2>
            <div className="w-full flex justify-center">
              <p className="text-[10px] lg:text-xs font-black text-[#6B8E23] tracking-[0.4em] uppercase mt-1.5 mr-[-0.4em] text-center w-full">
                {brand.slogan}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto custom-scrollbar pb-20 lg:pb-0">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative ${
                activeTab === item.id 
                  ? 'bg-[#2D4739] text-[#FDFBE2] shadow-2xl ring-1 ring-white/10' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeTab === item.id && (
                <div className="absolute left-0 w-1.5 h-8 bg-[#6B8E23] rounded-r-full shadow-[0_0_15px_#6B8E23]" />
              )}
              <div className="flex-shrink-0">
                <item.icon size={22} className={activeTab === item.id ? 'text-[#6B8E23]' : 'text-white/30 group-hover:text-[#6B8E23]'} />
              </div>
              <span className="font-black text-sm tracking-wide whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Botão Sair */}
        <div className="p-4 border-t border-[#ffffff08]">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
          >
            <LogOut size={22} className="group-hover:text-red-400" />
            <span className="font-black text-sm tracking-wide">Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// Assuming ClipboardList is needed, adding import if missing in context or using a placeholder
import { ClipboardList } from 'lucide-react'; 

export default Sidebar;