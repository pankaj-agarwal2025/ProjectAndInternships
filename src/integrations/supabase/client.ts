
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ihxuclygrdbdsppjmrpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeHVjbHlncmRiZHNwcGptcnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzODg5NDEsImV4cCI6MjA1OTk2NDk0MX0.94-dWkWOjh4hAENGAGtlQD0E-hQNNu0IBldk9H4lkQ0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
});

// Export common query functions if needed
export const getUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user;
};
