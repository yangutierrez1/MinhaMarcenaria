// Fix: Removed non-existent Task export from types import
import { Material, Client, Project, Budget, ManualTask, ManualPendency, FixedExpense, Debt, ManualRevenue, AgendaEvent } from './types';

// --- DATA HELPERS ---
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

// --- INITIAL DATA ---

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_MATERIALS: Material[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_TASKS: ManualTask[] = [];

export const INITIAL_PENDENCIES: ManualPendency[] = [];

export const INITIAL_FIXED_EXPENSES: FixedExpense[] = [];

export const INITIAL_DEBTS: Debt[] = [];

export const INITIAL_REVENUES: ManualRevenue[] = [];

export const INITIAL_EVENTS: AgendaEvent[] = [];

export const STATUS_COLUMNS = ['Preparação', 'Corte', 'Montagem', 'Entrega'] as const;

export const PRIORITY_COLORS: Record<string, string> = {
  'Baixa': 'bg-blue-100/50 text-blue-700 border border-blue-200',
  'Média': 'bg-yellow-100/50 text-yellow-700 border border-yellow-200',
  'Alta': 'bg-[#2D4739] text-white',
  'Urgente': 'bg-red-600 text-white shadow-lg shadow-red-200',
};