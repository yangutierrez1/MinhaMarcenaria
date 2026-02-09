import { supabase } from './supabaseClient';
import { Project, Material, Client, Budget, ManualTask, ManualPendency, FixedExpense, Debt, ManualRevenue, AgendaEvent } from '../types';

// Helper para garantir que campos JSON não venham nulos
const sanitizeItem = (item: any) => {
  if (!item) return item;
  
  // Lista de campos que devem ser sempre arrays no frontend
  const arrayFields = [
    'subtasks', 
    'materials', 
    'environments', 
    'responsibles', 
    'tags', 
    'paidMonths', 
    'projectHistory',
    'manualMaterials'
  ];

  arrayFields.forEach(field => {
    // Se o campo existir no objeto mas for null, converte para []
    if (field in item && item[field] === null) {
      item[field] = [];
    }
  });

  return item;
};

// Helper genérico para CRUD
const createCrud = <T>(table: string) => ({
  getAll: async () => {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    // Sanitiza cada item retornado
    return (data || []).map(sanitizeItem) as T[];
  },
  create: async (item: T) => {
    const { data, error } = await supabase.from(table).insert(item).select().single();
    if (error) throw error;
    return sanitizeItem(data) as T;
  },
  update: async (id: string, updates: Partial<T>) => {
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return sanitizeItem(data) as T;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }
});

export const api = {
  projects: createCrud<Project>('projects'),
  materials: createCrud<Material>('materials'),
  clients: createCrud<Client>('clients'),
  budgets: createCrud<Budget>('budgets'),
  tasks: createCrud<ManualTask>('tasks'),
  pendencies: createCrud<ManualPendency>('pendencies'),
  fixedExpenses: createCrud<FixedExpense>('fixed_expenses'),
  debts: createCrud<Debt>('debts'),
  revenues: createCrud<ManualRevenue>('revenues'),
  events: createCrud<AgendaEvent>('events'),
  
  // Função para carregar tudo de uma vez (Dashboard load)
  loadAll: async () => {
    const [
      projects, materials, clients, budgets, tasks, 
      pendencies, fixedExpenses, debts, revenues, events
    ] = await Promise.all([
      api.projects.getAll(),
      api.materials.getAll(),
      api.clients.getAll(),
      api.budgets.getAll(),
      api.tasks.getAll(),
      api.pendencies.getAll(),
      api.fixedExpenses.getAll(),
      api.debts.getAll(),
      api.revenues.getAll(),
      api.events.getAll()
    ]);
    
    return {
      projects, materials, clients, budgets, tasks, 
      pendencies, fixedExpenses, debts, revenues, events
    };
  }
};