import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kypwbfwieaozwhpawuvc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cHdiZndpZWFvendocGF3dXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTU5OTQsImV4cCI6MjA5OTIzMTk5NH0.e4eEHlZwfNrpwVGYhLVWLfhuaAph7d4jM3WbhHSM0cU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: settings } = await supabase
    .from('system_settings')
    .select('*');

  console.log("All system_settings:", JSON.stringify(settings, null, 2));
}

test();
