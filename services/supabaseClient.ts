import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY;

let client;

if (SUPABASE_URL && SUPABASE_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.warn('⚠️ Supabase não configurado. Entrando em modo Offline/Mock com LocalStorage.');
  
  // --- MOCK STORAGE IMPLEMENTATION ---
  const STORAGE_KEY = 'myhome_mock_db_v1';
  
  const loadDb = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      projects: [],
      materials: [],
      clients: [],
      budgets: [],
      tasks: [],
      pendencies: [],
      fixed_expenses: [],
      debts: [],
      revenues: [],
      events: [],
      brand_settings: []
    };
  };

  const saveDb = (db: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  };

  // --- MOCK AUTH IMPLEMENTATION ---
  let currentSession: any = null;
  const authListeners: any[] = [];

  // Tenta carregar sessão do storage (persistência simples)
  const savedSession = localStorage.getItem('myhome_mock_session');
  if (savedSession) {
    currentSession = JSON.parse(savedSession);
  }

  const mockAuth = {
    getSession: () => Promise.resolve({ data: { session: currentSession }, error: null }),
    onAuthStateChange: (callback: any) => {
      authListeners.push(callback);
      if (currentSession) {
        callback('SIGNED_IN', currentSession);
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async ({ email }: any) => {
      const user = { id: 'mock-user-id', email: email || 'demo@myhome.com' };
      const session = { access_token: 'mock-token', user };
      currentSession = session;
      localStorage.setItem('myhome_mock_session', JSON.stringify(session));
      authListeners.forEach(cb => cb('SIGNED_IN', session));
      return { data: { session, user }, error: null };
    },
    signUp: async ({ email }: any) => {
      return mockAuth.signInWithPassword({ email });
    },
    signOut: async () => {
      currentSession = null;
      localStorage.removeItem('myhome_mock_session');
      authListeners.forEach(cb => cb('SIGNED_OUT', null));
      return { error: null };
    },
    getUser: async () => ({ data: { user: currentSession?.user || null } })
  };

  // --- MOCK DB QUERY BUILDER ---
  const createMockChain = (table: string) => {
    const db = loadDb();
    const queryData = db[table] || [];
    const error: any = null;

    return {
      select: () => {
        // Return a promise that resolves to the data
        return Promise.resolve({ data: queryData, error });
      },
      insert: (payload: any) => {
        const newItem = { ...payload, id: Math.random().toString(36).substr(2, 9) };
        db[table] = [...(db[table] || []), newItem];
        saveDb(db);
        
        // Mock the return of .insert() to allow .select().single() chaining
        const responsePromise: any = Promise.resolve({ data: null, error: null });
        
        responsePromise.select = () => {
             const selectPromise: any = Promise.resolve({ data: [newItem], error: null });
             selectPromise.single = () => Promise.resolve({ data: newItem, error: null });
             return selectPromise;
        };

        return responsePromise;
      },
      update: (updates: any) => {
        return {
          eq: (field: string, value: any) => {
            const index = db[table].findIndex((item: any) => item[field] === value);
            let updatedItem = null;
            if (index !== -1) {
              db[table][index] = { ...db[table][index], ...updates };
              updatedItem = db[table][index];
              saveDb(db);
            }
            
            // Mock the return of .update().eq() to allow .select().single() chaining
            const responsePromise: any = Promise.resolve({ data: null, error: updatedItem ? null : 'Not found' });
            
            responsePromise.select = () => {
                 const selectPromise: any = Promise.resolve({ data: updatedItem ? [updatedItem] : [], error: updatedItem ? null : 'Not found' });
                 selectPromise.single = () => Promise.resolve({ data: updatedItem, error: updatedItem ? null : 'Not found' });
                 return selectPromise;
            };

            return responsePromise;
          }
        };
      },
      delete: () => {
        return {
          eq: (field: string, value: any) => {
            db[table] = db[table].filter((item: any) => item[field] !== value);
            saveDb(db);
            return Promise.resolve({ error });
          }
        };
      }
    };
  };

  client = {
    from: (table: string) => createMockChain(table),
    auth: mockAuth
  } as any;
}

export const supabase = client;