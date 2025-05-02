
-- Create buckets for project and internship files
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('project_files', 'project_files', true),
  ('internship_files', 'internship_files', true);

-- Set policies to allow users to read project files
CREATE POLICY "Allow public read access to project_files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project_files');

-- Set policies to allow authenticated users to upload project files
CREATE POLICY "Allow authenticated users to upload project_files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'project_files' AND auth.role() = 'authenticated');

-- Set policies to allow users to read internship files
CREATE POLICY "Allow public read access to internship_files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'internship_files');

-- Set policies to allow authenticated users to upload internship files
CREATE POLICY "Allow authenticated users to upload internship_files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'internship_files' AND auth.role() = 'authenticated');
