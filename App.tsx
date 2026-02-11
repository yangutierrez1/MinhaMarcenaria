import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Board from './components/Board';
import Inventory from './components/Inventory';
import BudgetTool from './components/BudgetTool';
import Clients from './components/Clients';
import Pendencies from './components/Pendencies';
import TaskBoard from './components/TaskBoard';
import Finance from './components/Finance';
import Agenda from './components/Agenda';
import Auth from './components/Auth';
import Modal from './components/ui/Modal';
import Button from './components/ui/Button';
import { Project, Material, Client, Budget, BibleVerse, ManualTask, ManualPendency, FixedExpense, Debt, ManualRevenue, TaskStatus, AgendaEvent, BrandConfig } from './types';
import { STATUS_COLUMNS, INITIAL_MATERIALS, INITIAL_CLIENTS, INITIAL_PROJECTS } from './constants';
import { getDailyVerse } from './services/geminiService';
import { api } from './services/api';
import { Bell, User, Quote, Edit3, Save, Image as ImageIcon, Type, Upload, Trash2, Loader2, Menu } from 'lucide-react';

const tabMeta: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Painel de Controle', subtitle: 'Visão geral' },
  budgets: { title: 'Orçamentos', subtitle: 'Propostas comerciais' },
  projects: { title: 'Projetos', subtitle: 'Produção' },
  tasks: { title: 'Tarefas', subtitle: 'Dia a dia' },
  pendencies: { title: 'Pendências', subtitle: 'Anotações rápidas' },
  inventory: { title: 'Estoque', subtitle: 'Controle de materiais' },
  finance: { title: 'Financeiro', subtitle: 'Saúde financeira' },
  clients: { title: 'Clientes', subtitle: 'Base de contatos' },
  agenda: { title: 'Agenda', subtitle: 'Compromissos' },
};

// --- HELPER DE COMPRESSÃO DE IMAGEM OTIMIZADO (WebP + 400px) ---
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // Tamanho ideal para logos
        const MAX_HEIGHT = 400;
        
        let width = img.width;
        let height = img.height;

        // Cálculo das novas dimensões mantendo o aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.drawImage(img, 0, 0, width, height);
           
           // Converte para WebP (mais leve) com 80% de qualidade
           // Mantém como DataURL (Base64) para compatibilidade com o banco atual
           resolve(canvas.toDataURL('image/webp', 0.8)); 
        } else {
           reject(new Error("Falha ao processar contexto da imagem"));
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Brand Configuration State
  const [brandConfig, setBrandConfig] = useState<BrandConfig>({
    logoUrl: '',
    name: 'My Home',
    slogan: 'Marcenaria',
    userName: 'Mestre'
  });

  // Modal State for Editing Brand
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [tempBrandConfig, setTempBrandConfig] = useState<BrandConfig>(brandConfig);

  const [verse, setVerse] = useState<BibleVerse | null>(null);
  
  // Dados Principais
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Dados Secundários
  const [manualPendencies, setManualPendencies] = useState<ManualPendency[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [manualRevenues, setManualRevenues] = useState<ManualRevenue[]>([]);
  const [manualTasks, setManualTasks] = useState<ManualTask[]>([]);
  
  const [monthlyGoal, setMonthlyGoal] = useState(30000);

  // --- AUTH CHECK ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const initData = async () => {
      if (!session) return; 

      setIsLoading(true);
      try {
        const data = await api.loadAll();
        setProjects(data.projects);
        setMaterials(data.materials);
        setClients(data.clients);
        setBudgets(data.budgets);
        setManualTasks(data.tasks);
        setManualPendencies(data.pendencies);
        setFixedExpenses(data.fixedExpenses);
        setDebts(data.debts);
        setManualRevenues(data.revenues);
        setEvents(data.events);

        // Load Brand Settings from DB
        if (data.brandSettings && data.brandSettings.length > 0) {
            setBrandConfig(data.brandSettings[0]);
        } else {
            // Default initialization if nothing in DB
             setBrandConfig({
                logoUrl: '',
                name: 'My Home',
                slogan: 'Marcenaria',
                userName: session?.user?.email?.split('@')[0] || 'Visitante'
             });
        }

        // Load Verse
        const dailyVerse = await getDailyVerse();
        if (dailyVerse) setVerse(dailyVerse);
        
      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, [session]);

  const handleOpenBrandModal = () => {
    setTempBrandConfig(brandConfig);
    setIsBrandModalOpen(true);
  };

  const handleSaveBrandConfig = async () => {
    const previousConfig = brandConfig;
    
    // Optimistic Update
    setBrandConfig(tempBrandConfig);
    setIsBrandModalOpen(false);

    try {
        let result;
        // Save to Database
        if (brandConfig.id) {
            // Update existing
            result = await api.brandSettings.update(brandConfig.id, tempBrandConfig);
        } else {
            // Create new (Check if one exists first just in case to avoid duplicates if reload was weird)
            const existing = await api.brandSettings.getAll();
            if (existing && existing.length > 0) {
                result = await api.brandSettings.update(existing[0].id!, tempBrandConfig);
            } else {
                result = await api.brandSettings.create(tempBrandConfig);
            }
        }
        
        // Update with true server data (ensures ID is set)
        if (result) {
            setBrandConfig(result);
        }
    } catch (error) {
        console.error("Failed to save brand config:", error);
        alert("Erro ao salvar configurações. A imagem pode ser muito grande, tente uma menor.");
        // Revert optimistic update on failure
        setBrandConfig(previousConfig);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      try {
        // Usa o helper otimizado para redimensionar (WebP, 400px)
        const resizedBase64 = await resizeImage(file);
        setTempBrandConfig(prev => ({ ...prev, logoUrl: resizedBase64 }));
      } catch (error) {
        console.error("Error processing image", error);
        alert("Erro ao processar a imagem. Tente outro arquivo.");
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProjects([]);
    setMaterials([]);
    setClients([]);
    setBudgets([]);
    // Limpa estados...
  };

  // --- TASKS HANDLERS ---
  const handleToggleManualTask = async (id: string) => {
    const task = manualTasks.find(t => t.id === id);
    if (!task) return;
    const updated = { ...task, completed: !task.completed };
    setManualTasks(prev => prev.map(t => t.id === id ? updated : t));
    await api.tasks.update(id, { completed: updated.completed });
  };

  const handleDeleteManualTask = async (id: string) => {
    setManualTasks(prev => prev.filter(t => t.id !== id));
    await api.tasks.delete(id);
  };

  const handleUpdateManualTask = async (id: string, updates: Partial<ManualTask>) => {
    setManualTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await api.tasks.update(id, updates);
  };

  const handleAddManualTask = async (task: Omit<ManualTask, 'id' | 'completed'>) => {
    const newTask = { ...task, id: Math.random().toString(36).substr(2, 9), completed: false };
    setManualTasks(prev => [...prev, newTask]);
    await api.tasks.create(newTask);
  };

  // --- PROJECTS HANDLERS ---
  const handleToggleProjectSubtask = async (projectId: string, subtaskTitle: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedSubtasks = project.subtasks.map(s => 
      s.title === subtaskTitle ? { ...s, completed: !s.completed } : s
    );

    const currentPhaseTasks = updatedSubtasks.filter(s => s.phase === project.status);
    const allDoneInCurrentPhase = currentPhaseTasks.length > 0 && currentPhaseTasks.every(s => s.completed);

    let nextStatus = project.status;
    if (allDoneInCurrentPhase) {
      const currentIndex = STATUS_COLUMNS.indexOf(project.status as any);
      if (currentIndex !== -1 && currentIndex < STATUS_COLUMNS.length - 1) {
        nextStatus = STATUS_COLUMNS[currentIndex + 1] as TaskStatus;
      }
    }

    const updates = { subtasks: updatedSubtasks, status: nextStatus };
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    await api.projects.update(projectId, updates);
  };

  const handleMoveProjectBack = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const currentIndex = STATUS_COLUMNS.indexOf(project.status as any);
    if (currentIndex > 0) {
      const prevStatus = STATUS_COLUMNS[currentIndex - 1] as TaskStatus;
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: prevStatus } : p));
      await api.projects.update(projectId, { status: prevStatus });
    }
  };

  const handleDeleteProject = async (id: string) => {
    // 1. Revert Stock
    const projectToDelete = projects.find(p => p.id === id);
    if (projectToDelete && projectToDelete.materials && projectToDelete.materials.length > 0) {
      const stockUpdates = materials.map(stockMat => {
        const usedMat = projectToDelete.materials.find(m => m.materialId === stockMat.id);
        if (usedMat) {
           const newQty = stockMat.quantity + usedMat.quantity;
           api.materials.update(stockMat.id, { quantity: newQty }); // Async fire and forget
           return { ...stockMat, quantity: newQty };
        }
        return stockMat;
      });
      setMaterials(stockUpdates);
    }

    // 2. Delete Project
    setProjects(prev => prev.filter(p => p.id !== id));
    await api.projects.delete(id);
    
    // 3. Delete Related Events
    const relatedEvents = events.filter(e => e.projectId === id);
    setEvents(prev => prev.filter(e => e.projectId !== id));
    relatedEvents.forEach(e => api.events.delete(e.id));
  };

  const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        if (updates.deadline && updates.deadline !== p.deadline) {
           const relatedEvent = events.find(e => e.projectId === id && e.type === 'Entrega');
           if (relatedEvent) {
             api.events.update(relatedEvent.id, { date: updates.deadline });
             setEvents(curr => curr.map(e => e.id === relatedEvent.id ? { ...e, date: updates.deadline! } : e));
           }
        }
        if (updates.isPaid === true && !p.isPaid) {
            const relatedEvent = events.find(e => e.projectId === id && e.type === 'Entrega');
            if (relatedEvent) {
               api.events.update(relatedEvent.id, { status: 'Concluído' });
               setEvents(curr => curr.map(e => e.id === relatedEvent.id ? { ...e, status: 'Concluído' } : e));
            }
        }
        return { ...p, ...updates };
      }
      return p;
    }));
    await api.projects.update(id, updates);
  };

  const handleSetAdvance = async (projectId: string, value: number | undefined) => {
    const updates = { 
      advanceValue: value, 
      isAdvancePaid: value !== undefined && value > 0 
    };
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    await api.projects.update(projectId, updates);
  };

  // --- EVENTS HANDLERS ---
  const syncProjectToAgenda = async (project: Project) => {
    const newEvent: AgendaEvent = {
        id: Math.random().toString(36).substr(2, 9),
        title: `ENTREGA: ${project.name}`,
        description: `Finalização e entrega do projeto para o cliente.`,
        date: project.deadline,
        type: 'Entrega',
        status: 'Agendado',
        responsible: brandConfig.userName,
        projectId: project.id,
        clientId: project.clientId
    };
    setEvents(prev => [...prev, newEvent]);
    await api.events.create(newEvent);
  };

  const handleAddEvent = async (event: Omit<AgendaEvent, 'id'>) => {
    const newEvent = { ...event, id: Math.random().toString(36).substr(2, 9) };
    setEvents(prev => [...prev, newEvent]);
    await api.events.create(newEvent);
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    await api.events.delete(id);
  };

  const handleUpdateEvent = async (id: string, updates: Partial<AgendaEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    await api.events.update(id, updates);
  };

  // --- PENDENCIES HANDLERS ---
  const handleAddManualPendency = async (text: string) => {
    const newPendency: ManualPendency = { id: Math.random().toString(36).substr(2, 9), text, completed: false, createdAt: new Date().toISOString() };
    setManualPendencies(prev => [newPendency, ...prev]);
    await api.pendencies.create(newPendency);
  };

  const handleToggleManualPendency = async (id: string) => {
    const pendency = manualPendencies.find(p => p.id === id);
    if (!pendency) return;
    const updated = { ...pendency, completed: !pendency.completed };
    setManualPendencies(prev => prev.map(p => p.id === id ? updated : p));
    await api.pendencies.update(id, { completed: updated.completed });
  };

  const handleDeleteManualPendency = async (id: string) => {
    setManualPendencies(prev => prev.filter(p => p.id !== id));
    await api.pendencies.delete(id);
  };

  // --- FINANCE / REVENUE HANDLERS ---
  const handleAddManualRevenue = async (revenue: Omit<ManualRevenue, 'id'>) => {
    const newRevenue = { ...revenue, id: Math.random().toString(36).substr(2, 9) };
    setManualRevenues(prev => [...prev, newRevenue]);
    await api.revenues.create(newRevenue);
  };

  const handleDeleteManualRevenue = async (id: string) => {
    setManualRevenues(prev => prev.filter(r => r.id !== id));
    await api.revenues.delete(id);
  };

  // --- MATERIALS / STOCK / DEBTS HANDLERS ---
  const handleAddMaterialFromInventory = async (material: Omit<Material, 'id'>, createExpense: boolean, dueDate?: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newMaterial = { ...material, id: newId };
    
    setMaterials(prev => [...prev, newMaterial]);
    await api.materials.create(newMaterial);

    if (createExpense) {
      const totalValue = material.price * material.quantity;
      const newDebt: Debt = {
        id: Math.random().toString(36).substr(2, 9),
        supplier: material.supplier,
        description: `Compra Estoque: ${material.name}`,
        value: totalValue,
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        status: 'Pendente',
        materials: [{ materialId: newId, quantity: material.quantity }]
      };
      setDebts(prev => [...prev, newDebt]);
      await api.debts.create(newDebt);
    }
  };

  const handleAddStock = async (id: string, quantityToAdd: number, newPrice: number, createExpense: boolean, dueDate?: string) => {
    const material = materials.find(m => m.id === id);
    if (!material) return;

    const updates = { 
      quantity: material.quantity + quantityToAdd,
      price: newPrice > 0 ? newPrice : material.price
    };
    
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    await api.materials.update(id, updates);

    if (createExpense) {
      const totalValue = newPrice * quantityToAdd;
      const newDebt: Debt = {
        id: Math.random().toString(36).substr(2, 9),
        supplier: material.supplier,
        description: `Reposição Estoque: ${material.name}`,
        value: totalValue,
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        status: 'Pendente',
        materials: [{ materialId: id, quantity: quantityToAdd }]
      };
      setDebts(prev => [...prev, newDebt]);
      await api.debts.create(newDebt);
    }
  };

  const handleUpdateMaterial = async (id: string, updates: Partial<Material>) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    await api.materials.update(id, updates);
  };

  const handleDeleteMaterial = async (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    await api.materials.delete(id);
  };

  const handleAddDebt = async (debtData: any) => {
    const newId = Math.random().toString(36).substr(2, 9);
    
    if (debtData.manualMaterials && debtData.manualMaterials.length > 0) {
      const updatedMaterials = [...materials];
      
      for (const manualItem of debtData.manualMaterials) {
        const existingIndex = updatedMaterials.findIndex(m => 
          (manualItem.materialId && m.id === manualItem.materialId) || 
          (m.name.toLowerCase() === manualItem.name.toLowerCase())
        );
        
        if (existingIndex !== -1) {
          const mat = updatedMaterials[existingIndex];
          const updates = {
            quantity: mat.quantity + manualItem.quantity,
            price: manualItem.unitPrice || mat.price,
            category: manualItem.category || mat.category
          };
          updatedMaterials[existingIndex] = { ...mat, ...updates };
          await api.materials.update(mat.id, updates);
        } else {
          const newMat: Material = {
            id: Math.random().toString(36).substr(2, 9),
            name: manualItem.name,
            quantity: manualItem.quantity,
            price: manualItem.unitPrice || 0,
            unit: 'un',
            category: manualItem.category || 'Geral',
            supplier: debtData.supplier || 'Diverso'
          };
          updatedMaterials.push(newMat);
          await api.materials.create(newMat);
        }
      }
      setMaterials(updatedMaterials);
    }
    
    const newDebt = { ...debtData, id: newId };
    delete newDebt.manualMaterials; // Clean up before saving
    setDebts(prev => [...prev, newDebt]);
    await api.debts.create(newDebt);
  };

  const handleUpdateDebt = async (id: string, updates: Partial<Debt>) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    await api.debts.update(id, updates);
  };

  const handleDeleteDebt = async (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    await api.debts.delete(id);
  };

  const handleToggleDebtStatus = async (id: string) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    const newStatus = debt.status === 'Pago' ? 'Pendente' : 'Pago';
    setDebts(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    await api.debts.update(id, { status: newStatus });
  };

  // --- FIXED EXPENSES HANDLERS ---
  const handleAddFixedExpense = async (expense: Omit<FixedExpense, 'id'>) => {
    const newExpense = { ...expense, id: Math.random().toString(36).substr(2, 9) };
    setFixedExpenses(prev => [...prev, newExpense]);
    await api.fixedExpenses.create(newExpense);
  };

  const handleUpdateFixedExpense = async (id: string, updates: Partial<FixedExpense>) => {
    setFixedExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    await api.fixedExpenses.update(id, updates);
  };

  const handleDeleteFixedExpense = async (id: string) => {
    setFixedExpenses(prev => prev.filter(e => e.id !== id));
    await api.fixedExpenses.delete(id);
  };

  const handleToggleExpenseStatus = async (id: string, monthYear?: string) => {
    const expense = fixedExpenses.find(e => e.id === id);
    if (!expense) return;

    let updates = {};
    if (expense.isRecurring && monthYear) {
      const paidMonths = expense.paidMonths || [];
      const isPaidThisMonth = paidMonths.includes(monthYear);
      updates = {
        paidMonths: isPaidThisMonth 
          ? paidMonths.filter(m => m !== monthYear)
          : [...paidMonths, monthYear]
      };
    } else {
      updates = { status: expense.status === 'Pago' ? 'Pendente' : 'Pago' };
    }
    
    setFixedExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    await api.fixedExpenses.update(id, updates);
  };

  // --- BUDGETS / APPROVAL HANDLERS ---
  const handleApproveBudget = async (budgetData: any) => {
    try {
      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        clientId: budgetData.clientId,
        name: budgetData.title,
        // Proteção contra 'environments' indefinido para evitar erro no .map().join()
        description: (budgetData.environments || []).map((e: any) => e.type).join(', ') || 'Projeto Personalizado',
        status: 'Preparação',
        priority: 'Média',
        deadline: budgetData.deadline,
        materials: budgetData.materials || [],
        subtasks: budgetData.subtasks || [],
        value: budgetData.finalPrice,
        isPaid: false,
        isAdvancePaid: false,
        advanceValue: 0
      };

      setProjects(prev => [...prev, newProject]);
      await api.projects.create(newProject);
      syncProjectToAgenda(newProject);

      if (budgetData.materials && budgetData.materials.length > 0) {
        const matUpdates = materials.map(stockMat => {
          const itemToDeduct = budgetData.materials.find((m: any) => m.materialId === stockMat.id);
          if (itemToDeduct) {
            const newQty = Math.max(0, stockMat.quantity - itemToDeduct.quantity);
            api.materials.update(stockMat.id, { quantity: newQty }); // Fire & Forget
            return { ...stockMat, quantity: newQty };
          }
          return stockMat;
        });
        setMaterials(matUpdates);
      }

      if (budgetData.id) {
        setBudgets(prev => prev.map(b => b.id === budgetData.id ? { ...b, status: 'Aprovado' } : b));
        await api.budgets.update(budgetData.id, { status: 'Aprovado' });
      } else {
        const newBudget: Budget = {
          ...budgetData,
          id: Math.random().toString(36).substr(2, 9),
          status: 'Aprovado',
          createdAt: new Date().toISOString(),
          travelCost: 0
        };
        setBudgets(prev => [...prev, newBudget]);
        await api.budgets.create(newBudget);
      }
      setActiveTab('projects');
    } catch (error) {
      console.error("Falha ao aprovar orçamento:", error);
      alert("Ocorreu um erro ao aprovar o projeto. Verifique os dados e tente novamente.");
    }
  };

  const handleSaveBudget = async (budgetData: any) => {
    if (budgetData.id) {
      const updates = { ...budgetData, status: 'Pendente' };
      setBudgets(prev => prev.map(b => b.id === budgetData.id ? { ...b, ...updates } : b));
      await api.budgets.update(budgetData.id, updates);
    } else {
      const newBudget: Budget = {
        ...budgetData,
        id: Math.random().toString(36).substr(2, 9),
        status: 'Pendente',
        createdAt: new Date().toISOString(),
        travelCost: 0
      };
      setBudgets(prev => [...prev, newBudget]);
      await api.budgets.create(newBudget);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    await api.budgets.delete(id);
  };

  // --- CLIENTS HANDLERS ---
  const handleAddClient = async (client: Omit<Client, 'id' | 'projectHistory'>) => {
    const newClient = { ...client, id: Math.random().toString(36).substr(2, 9), projectHistory: [] };
    setClients(prev => [...prev, newClient]);
    await api.clients.create(newClient);
  };

  const handleUpdateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await api.clients.update(id, updates);
  };

  const handleDeleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await api.clients.delete(id);
  };

  // --- AUTH LOADING STATE ---
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBE2] flex items-center justify-center wood-texture">
         <Loader2 size={64} className="text-[#2D4739] animate-spin" />
      </div>
    );
  }

  // --- IF NOT LOGGED IN, SHOW AUTH ---
  if (!session) {
    return <Auth />;
  }

  // --- RENDER MAIN APP ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 opacity-50 animate-pulse">
           <Loader2 size={48} className="animate-spin text-[#2D4739] mb-4" />
           <p className="text-[#2D4739] font-black uppercase tracking-widest">Sincronizando com Supabase...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard projects={projects} materials={materials} budgets={budgets} manualTasks={manualTasks} manualPendencies={manualPendencies} userName={brandConfig.userName} onNavigate={setActiveTab} />;
      case 'tasks': return <TaskBoard manualTasks={manualTasks} projects={projects} onToggleManual={handleToggleManualTask} onToggleProjectSubtask={handleToggleProjectSubtask} onAddTask={handleAddManualTask} onUpdateTask={handleUpdateManualTask} onDeleteTask={handleDeleteManualTask} />;
      case 'projects': return <Board projects={projects} setProjects={setProjects} clients={clients} onMarkAsPaid={(id) => handleUpdateProject(id, { isPaid: true })} onDeleteProject={handleDeleteProject} onToggleSubtask={handleToggleProjectSubtask} onSetAdvance={handleSetAdvance} onMoveBack={handleMoveProjectBack} onUpdateProject={handleUpdateProject} />;
      case 'budgets': return <BudgetTool materials={materials} clients={clients} budgets={budgets} onApprove={handleApproveBudget} onSavePending={handleSaveBudget} onDeleteBudget={handleDeleteBudget} />;
      case 'agenda': return <Agenda events={events} projects={projects} clients={clients} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent} />;
      case 'inventory': return <Inventory materials={materials} onAddMaterial={(m, createExpense, dueDate) => handleAddMaterialFromInventory(m, createExpense, dueDate)} onAddStock={handleAddStock} onUpdateMaterial={handleUpdateMaterial} onDeleteMaterial={handleDeleteMaterial} />;
      case 'finance': return <Finance projects={projects} materials={materials} budgets={budgets} fixedExpenses={fixedExpenses} debts={debts} manualRevenues={manualRevenues} onAddFixedExpense={handleAddFixedExpense} onDeleteFixedExpense={handleDeleteFixedExpense} onToggleExpenseStatus={handleToggleExpenseStatus} onUpdateFixedExpense={handleUpdateFixedExpense} onToggleDebtStatus={handleToggleDebtStatus} onUpdateDebt={handleUpdateDebt} onAddDebt={handleAddDebt} onDeleteDebt={handleDeleteDebt} onAddManualRevenue={handleAddManualRevenue} onDeleteManualRevenue={handleDeleteManualRevenue} onDeleteProject={handleDeleteProject} onUpdateProject={handleUpdateProject} onNavigate={setActiveTab} monthlyGoal={monthlyGoal} setMonthlyGoal={setMonthlyGoal} />;
      case 'clients': return <Clients clients={clients} projects={projects} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} onNavigate={setActiveTab} />;
      case 'pendencies': return <Pendencies pendencies={manualPendencies} onAddPendency={handleAddManualPendency} onTogglePendency={handleToggleManualPendency} onDeletePendency={handleDeleteManualPendency} />;
      default: return <Dashboard projects={projects} materials={materials} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBE2] flex wood-texture relative overflow-x-hidden">
      
      {/* Sidebar Responsiva com Menu Gaveta */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        brand={brandConfig} 
        onEditBrand={handleOpenBrandModal} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 w-full lg:ml-64 px-6 md:px-10 pt-8 pb-32 min-h-screen min-w-0 transition-all duration-300">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 w-full">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Botão de Menu para Mobile */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-3 bg-white rounded-xl shadow-md border border-[#2D473911] text-[#2D4739] hover:bg-[#2D4739] hover:text-[#FDFBE2] transition-colors"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex-shrink-0 min-w-0">
              <h1 className="text-3xl md:text-4xl font-black text-[#2D4739] tracking-tighter uppercase truncate leading-tight">{tabMeta[activeTab]?.title}</h1>
              <p className="text-[#2D473988] font-bold text-xs md:text-sm mt-1 truncate">{tabMeta[activeTab]?.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto md:flex-1 justify-end">
             <div className="hidden md:flex justify-center flex-1 min-w-0 max-w-lg">
                <div className="w-full bg-white/40 border border-[#2D473911] rounded-[2rem] p-5 shadow-sm">
                  {verse && (
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Quote size={12} className="text-[#6B8E23]" />
                        <span className="text-[9px] font-black text-[#6B8E23] uppercase tracking-[0.2em]">Inspiração</span>
                      </div>
                      <p className="text-[#2D4739] font-black italic text-xs leading-snug mb-1 line-clamp-2">"{verse.text}"</p>
                      <span className="text-[9px] font-black text-[#2D473988] uppercase tracking-wider">— {verse.reference}</span>
                    </div>
                  )}
                </div>
             </div>

             <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                <button className="relative p-3 text-[#2D4739] bg-white rounded-2xl shadow-md border border-[#2D473911] hover:scale-105 transition-all">
                  <Bell size={20} />
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-[#FDFBE2]"></span>
                </button>
                <div className="flex items-center gap-4 group cursor-pointer" onClick={handleOpenBrandModal}>
                  <div className="text-right hidden xl:block">
                    <p className="text-sm font-black text-[#2D4739] transition-colors">{brandConfig.name}</p>
                    <p className="text-[10px] font-black text-[#6B8E23] uppercase tracking-widest mt-0.5 opacity-60">{brandConfig.slogan}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#2D4739] flex items-center justify-center text-[#FDFBE2] shadow-xl overflow-hidden ring-2 ring-white/20">
                    {brandConfig.logoUrl ? (
                      <img src={brandConfig.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                </div>
             </div>
          </div>
        </header>
        <section className="animate-fade-in w-full">{renderContent()}</section>
      </main>

      {/* MODAL DE EDIÇÃO DA MARCA / PERFIL */}
      <Modal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        title="Personalizar Marcenaria"
        subtitle="Identidade Visual e Perfil"
        icon={<Edit3 size={24} />}
        footer={
           <>
              <Button variant="ghost" onClick={() => setIsBrandModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveBrandConfig} icon={<Save size={18} />}>Salvar Alterações</Button>
           </>
        }
      >
         <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest flex items-center gap-2"><Type size={12}/> Nome da Marcenaria</label>
                  <input 
                     type="text" 
                     value={tempBrandConfig.name} 
                     onChange={e => setTempBrandConfig({...tempBrandConfig, name: e.target.value})} 
                     className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none focus:border-[#6B8E23] transition-all" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest flex items-center gap-2"><Type size={12}/> Slogan / Subtítulo</label>
                  <input 
                     type="text" 
                     value={tempBrandConfig.slogan} 
                     onChange={e => setTempBrandConfig({...tempBrandConfig, slogan: e.target.value})} 
                     className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none focus:border-[#6B8E23] transition-all" 
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest flex items-center gap-2"><User size={12}/> Seu Nome (Usuário Principal)</label>
               <input 
                  type="text" 
                  value={tempBrandConfig.userName} 
                  onChange={e => setTempBrandConfig({...tempBrandConfig, userName: e.target.value})} 
                  className="w-full p-4 bg-white rounded-2xl border border-[#2D473911] font-black text-[#2D4739] outline-none focus:border-[#6B8E23] transition-all" 
               />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-[#2D473944] uppercase tracking-widest flex items-center gap-2"><ImageIcon size={12}/> Logo da Marcenaria</label>
               
               <div className="flex items-center gap-6">
                  {tempBrandConfig.logoUrl ? (
                    <div className="w-20 h-20 rounded-2xl bg-[#2D4739] border border-[#2D473911] overflow-hidden flex-shrink-0 relative group">
                        <img src={tempBrandConfig.logoUrl} alt="Logo Preview" className="w-full h-full object-contain bg-white" />
                        <button 
                           onClick={() => setTempBrandConfig(prev => ({ ...prev, logoUrl: '' }))}
                           className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                           <Trash2 size={20} />
                        </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-[#FDFBE2] border-2 border-dashed border-[#2D473922] flex items-center justify-center text-[#2D473944]">
                       <ImageIcon size={24} />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                      <label className={`flex items-center gap-3 w-full p-4 bg-white rounded-2xl border border-[#2D473911] cursor-pointer hover:border-[#6B8E23] transition-all group ${isProcessingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                         <div className="p-2 bg-[#FDFBE2] text-[#2D4739] rounded-xl group-hover:bg-[#2D4739] group-hover:text-[#FDFBE2] transition-colors">
                            {isProcessingImage ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-[#2D4739] uppercase tracking-wider">{isProcessingImage ? 'Processando...' : 'Escolher Arquivo'}</p>
                            <p className="text-[9px] font-bold text-[#2D473966] truncate">JPG, PNG ou GIF (Max 1MB)</p>
                         </div>
                         <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={isProcessingImage} />
                      </label>
                      <p className="text-[9px] text-[#2D473944] font-bold">A imagem será redimensionada automaticamente.</p>
                  </div>
               </div>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default App;