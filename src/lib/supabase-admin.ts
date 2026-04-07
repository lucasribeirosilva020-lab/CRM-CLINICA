import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ ERRO CRÍTICO: SUPABASE_URL ou SERVICE_ROLE_KEY não configurados no .env!');
}

// Client com service role key (Bypass RLS)
export const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey) 
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null as any;
