import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY;

let client;

if (SUPABASE_URL && SUPABASE_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.warn('⚠️ Supabase não configurado. Entrando em modo Offline/Mock.');
  
  // Mock robusto para permitir navegação sem backend
  const mockSelect = () => ({
    select: () => mockSelect(),
    insert: () => Promise.resolve({ data: {}, error: null }),
    update: () => Promise.resolve({ data: {}, error: null }),
    delete: () => Promise.resolve({ error: null }),
    eq: () => mockSelect(),
    single: () => Promise.resolve({ data: null, error: null }),
    order: () => Promise.resolve({ data: [], error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }) // Retorna lista vazia por padrão
  });

  client = {
    from: () => mockSelect(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ error: { message: 'Backend não conectado. Use o Modo Demonstração.' } }),
      signUp: () => Promise.resolve({ error: { message: 'Backend não conectado. Use o Modo Demonstração.' } }),
      signOut: () => Promise.resolve({ error: null }),
    }
  } as any;
}

export const supabase = client;