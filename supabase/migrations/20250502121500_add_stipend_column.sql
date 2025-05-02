
-- Add stipend column to internships table
ALTER TABLE public.internships 
ADD COLUMN IF NOT EXISTS stipend text;
