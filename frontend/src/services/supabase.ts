import { createClient } from '@supabase/supabase-js';
import { Database } from '@shared/types/database.types';

// Vite uses import.meta.env instead of process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log(supabaseUrl, supabaseKey);
    throw new Error('Missing Supabase URL or Key.');
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase;
