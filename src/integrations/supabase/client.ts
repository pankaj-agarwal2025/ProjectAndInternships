
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ihxuclygrdbdsppjmrpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqaHdnZ2ttcnF3c2tleGRubWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MTEyMzcsImV4cCI6MjA1OTQ4NzIzN30.IhfTFlQ_keri5dobHKlM3M-9BCeHxz8Xwo7iAGyb1SA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
