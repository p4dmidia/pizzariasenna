import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kypwbfwieaozwhpawuvc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cHdiZndpZWFvendocGF3dXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTU5OTQsImV4cCI6MjA5OTIzMTk5NH0.e4eEHlZwfNrpwVGYhLVWLfhuaAph7d4jM3WbhHSM0cU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

