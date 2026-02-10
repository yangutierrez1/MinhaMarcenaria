import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// Create client only if keys exist to prevent runtime error "supabaseUrl is required"
// If keys are missing, we export a mock to prevent crash on import, calls will fail safely.

let client;

if (SUPABASE_URL && SUPABASE_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.warn('Supabase credentials missing! Check your .env file.');
  client = {
    from: () => ({
       select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }), order: () => ({}) }),
       insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
       update: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
       delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase not configured' } }) }),
    }),
  } as any;
}

export const supabase = client;