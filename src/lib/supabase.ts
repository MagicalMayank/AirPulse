import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log if Supabase is configured
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Missing environment variables:', {
        url: supabaseUrl ? '✓ set' : '✗ missing VITE_SUPABASE_URL',
        key: supabaseAnonKey ? '✓ set' : '✗ missing VITE_SUPABASE_ANON_KEY'
    });
}

console.log('[Supabase] Client initialized for:', supabaseUrl);

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
