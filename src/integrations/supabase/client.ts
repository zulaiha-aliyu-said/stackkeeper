import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wfbrmywecdrtidcbnxoe.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmYnJteXdlY2RydGlkY2JueG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzEwNTYsImV4cCI6MjA4NTg0NzA1Nn0.Nd2Zep47PS-2UauasYJIhFKSIq-YkW_Y-HwVc9GzMd4';

export const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!supabaseConfigured) {
  console.warn(
    'Supabase environment variables are not set. Backend features will be unavailable. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY secrets.'
  );
}

export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
