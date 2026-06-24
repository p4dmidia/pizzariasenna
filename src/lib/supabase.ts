import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oxgdhvloolgnjqcvvrud.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Z2Rodmxvb2xnbmpxY3Z2cnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NDM1OTQsImV4cCI6MjA5NzQxOTU5NH0.DZzZTiG61GDj8YROTh_FkczCaBt_4CRBpVliN6WeF1U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
