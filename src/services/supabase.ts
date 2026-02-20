
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Missing Supabase environment variables! Please check your .env file.');
    // Prevent crash by throwing a clear error or handling it.
    // For now, let's allow the app to load but Supabase calls will fail.
}

export const supabase = createClient(
    supabaseUrl || 'https://cmworeyixahfymfttazw.supabase.co',
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtd29yZXlpeGFoZnltZnR0YXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDI0NTAsImV4cCI6MjA4NTY3ODQ1MH0.vBMGiRObJH90eR86V9n-iefycSB1y400GO8db19CrC4'
);
