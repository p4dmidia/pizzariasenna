import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://woodjqkhvaqenaxznngc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb2RqcWtodmFxZW5heHpubmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODE2NjYsImV4cCI6MjA4ODc1NzY2Nn0.jTzuSPhx4QS21EOZL8HeUoxw_pjClt27lzyrbV6Gcc0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
