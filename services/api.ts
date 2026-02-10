import { supabase } from './supabaseClient';
import { Project, Material, Client, Budget, ManualTask, ManualPendency, FixedExpense, Debt, ManualRevenue, AgendaEvent, BrandConfig } from '../types';

// Helper para garantir que campos JSON não venham nulos do banco
const sanitizeItem = (item: any) => {
  if (!item) return item;
  
  // Lista de campos que devem ser sempre arrays no frontend para evitar erros de .map()
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

// Helper genérico para CRUD com segurança de user_id
const createCrud = <T>(table: string) => ({
  getAll: async () => {
    // O select usa RLS (Row Level Security) do Supabase para filtrar automaticamente pelo usuário logado
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    return (data || []).map(sanitizeItem) as T[];
  },
  
  create: async (item: T) => {
    // Garante que o user_id esteja presente no payload de inserção
    const { data: { user } } = await supabase.auth.getUser();
    
    // Se houver usuário logado, injetamos o user_id, senão tentamos inserir sem (vai falhar se o banco exigir, o que é correto)
    const payload = user ? { ...item, user_id: user.id } : item;
    
    const { data, error } = await supabase.from(table).insert(payload).select().single();
    if (error) throw error;
    return sanitizeItem(data) as T;
  },
  
  update: async (id: string, updates: Partial<T>) => {
    // RLS garante que só podemos atualizar registros que nos pertencem
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return sanitizeItem(data) as T;
  },
  
  delete: async (id: string) => {
    // RLS garante que só podemos deletar registros que nos pertencem
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
  brandSettings: createCrud<BrandConfig>('brand_settings'),
  
  // Função para carregar tudo de uma vez (Dashboard load)
  loadAll: async () => {
    const [
      projects, materials, clients, budgets, tasks, 
      pendencies, fixedExpenses, debts, revenues, events, brandSettings
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
      api.events.getAll(),
      api.brandSettings.getAll().catch(() => []) // Fallback se a tabela não existir ainda
    ]);
    
    return {
      projects, materials, clients, budgets, tasks, 
      pendencies, fixedExpenses, debts, revenues, events, brandSettings
    };
  }
};