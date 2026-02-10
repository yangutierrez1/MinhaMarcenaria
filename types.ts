
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type TaskStatus = 'Preparação' | 'Corte' | 'Montagem' | 'Entrega';
export type TaskCategory = 'Routine' | 'Complex' | 'Project';

export type EventType = 'Produção' | 'Entrega' | 'Reunião' | 'Visita Técnica' | 'Compra' | 'Manutenção' | 'Pessoal';
export type EventStatus = 'Agendado' | 'Confirmado' | 'Concluído' | 'Cancelado' | 'Atrasado';

export interface BrandConfig {
  id?: string;
  logoUrl: string;
  name: string;
  slogan: string;
  userName: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: EventType;
  status: EventStatus;
  responsible: string;
  location?: string;
  projectId?: string;
  clientId?: string;
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  category: string;
  supplier: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  projectHistory: string[];
}

export interface ProjectSubtask {
  title: string;
  completed: boolean;
  phase: TaskStatus;
  id?: string;
}

export interface Project {
  id: string;
  clientId: string;
  budgetId?: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  deadline: string;
  materials: { materialId: string; quantity: number }[];
  subtasks: ProjectSubtask[];
  value: number;
  isPaid?: boolean;
  isAdvancePaid?: boolean;
  advanceValue?: number;
  paymentMethod?: 'Pix' | 'Dinheiro' | 'Cartão' | 'Transferência';
  paymentDate?: string;
}

export interface BudgetEnvironmentInfo {
  type: string;
  description: string;
}

export interface Budget {
  id: string;
  clientId: string;
  title: string;
  deadline: string;
  environments: BudgetEnvironmentInfo[];
  materials: { materialId: string; quantity: number }[];
  laborCost: number;
  travelCost: number;
  profitMargin: number;
  status: 'Pendente' | 'Aprovado' | 'Recusado';
  totalCost: number;
  finalPrice: number;
  createdAt: string;
}

export interface FixedExpense {
  id: string;
  description: string;
  value: number;
  dueDate: string;
  category: 'Aluguel' | 'Energia' | 'Internet' | 'Marketing' | 'Ferramentas' | 'Outros';
  status: 'Pago' | 'Pendente';
  isRecurring?: boolean; // Se a conta se repete todo mês
  paidMonths?: string[]; // Lista de meses pagos no formato "YYYY-MM"
}

export interface Debt {
  id: string;
  supplier: string;
  description: string;
  value: number;
  dueDate: string;
  status: 'Pendente' | 'Atrasado' | 'Pago';
  materials?: { materialId: string; quantity: number }[];
}

export interface ManualRevenue {
  id: string;
  description: string;
  value: number;
  date: string;
  clientName?: string;
  paymentMethod: string;
}

export interface FinancialPrediction {
  estimatedRevenue: number;
  estimatedProfit: number;
  riskAlerts: string[];
  suggestions: string[];
}

export interface BibleVerse {
  text: string;
  reference: string;
  meaning: string;
}

export interface ManualTask {
  id: string;
  title: string;
  description: string;
  category: 'Routine' | 'Complex';
  priority: Priority;
  completed: boolean;
  deadline?: string;
  responsibles?: string[];
  tags?: string[];
}

export interface ManualPendency {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}