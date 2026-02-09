
import React from 'react';
import { 
  LayoutDashboard, 
  Trello, 
  FolderKanban, 
  Calculator, 
  Package, 
  Users, 
  Settings,
  Leaf
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tarefas', icon: Trello },
    { id: 'projects', label: 'Projetos', icon: FolderKanban },
    { id: 'budgets', label: 'Orçamentos', icon: Calculator },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'clients', label: 'Clientes', icon: Users },
  ];

  return (
    <aside className="w-64 h-screen bg-[#1A2E24] text-slate-300 flex flex-col fixed left-0 top-0 shadow-2xl z-40">
      <div className="p-8 pb-10 flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="w-16 h-16 bg-[#2D4739] rounded-2xl flex items-center justify-center shadow-lg border border-[#ffffff11] relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 flex flex-col">
               {[...Array(5)].map((_, i) => <div key={i} className="h-4 border-b border-white" />)}
             </div>
             <div className="z-10 text-white flex flex-col items-center">
                <Leaf size={32} className="rotate-45" />
             </div>
          </div>
          <div className="absolute -top-1 -left-2 text-[#FDFBE2] z-20">
             <Leaf size={20} className="-rotate-12 fill-current" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-[#FDFBE2] tracking-tighter uppercase leading-none">My Home</h2>
          <p className="text-[10px] font-bold text-[#6B8E23] tracking-[0.3em] uppercase mt-1">Marcenaria</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
              activeTab === item.id 
                ? 'bg-[#2D4739] text-[#FDFBE2] shadow-xl' 
                : 'hover:bg-[#ffffff08] hover:text-white'
            }`}
          >
            {activeTab === item.id && (
              <div className="absolute left-0 w-1 h-6 bg-[#6B8E23] rounded-r-full" />
            )}
            <item.icon size={20} className={activeTab === item.id ? 'text-[#6B8E23]' : 'text-slate-500 group-hover:text-[#6B8E23]'} />
            <span className="font-bold text-sm tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-[#ffffff08]">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#ffffff08] transition-colors group">
          <Settings size={20} className="text-slate-500 group-hover:text-white" />
          <span className="font-bold text-sm">Configurações</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
