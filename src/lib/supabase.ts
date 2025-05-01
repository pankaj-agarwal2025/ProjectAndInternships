
import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ihxuclygrdbdsppjmrpf.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeHVjbHlncmRiZHNwcGptcnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzODg5NDEsImV4cCI6MjA1OTk2NDk0MX0.94-dWkWOjh4hAENGAGtlQD0E-hQNNu0IBldk9H4lkQ0';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

// Type definitions
export interface Student {
  id: string;
  group_id: string;
  name: string;
  roll_no: string;
  email: string;
  program: string;
}

export interface Project {
  id: string;
  created_at: string;
  group_no: string;
  title: string;
  domain: string;
  faculty_mentor?: string;
  industry_mentor?: string;
  session?: string;
  year?: string;
  semester?: string;
  faculty_coordinator?: string;
  progress_form_url?: string;
  presentation_url?: string;
  report_url?: string;
  initial_evaluation?: string;
  progress_evaluation?: string;
  final_evaluation?: string;
  students?: Student[];
  project_category?: string;
  // Evaluation fields
  initial_clarity_objectives?: number;
  initial_background_feasibility?: number;
  initial_usability_applications?: number;
  initial_innovation_novelty?: number;
  initial_total?: number;
  progress_data_extraction?: number;
  progress_methodology?: number;
  progress_implementation?: number;
  progress_code_optimization?: number;
  progress_user_interface?: number;
  progress_total?: number;
  final_implementation?: number;
  final_results?: number;
  final_research_paper?: number;
  final_project_completion?: number;
  final_total?: number;
}

export interface ProjectData {
  group_no: string;
  title: string;
  domain?: string;
  faculty_mentor?: string;
  industry_mentor?: string;
  session?: string;
  year?: string;
  semester?: string;
  faculty_coordinator?: string;
  project_category?: string;
  students?: any[];
}

export interface InternshipData {
  roll_no: string;
  name: string;
  email?: string;
  phone_no?: string;
  domain?: string;
  session?: string;
  year?: string;
  semester?: string;
  program?: string;
  organization_name?: string;
  position?: string;
  starting_date?: string;
  ending_date?: string;
}

export interface Faculty {
  id: string;
  username: string;
  password: string;
  name: string;
  role?: string;
}

// Setup database tables if they don't exist
export const setupDatabase = async () => {
  try {
    // Check if the faculties table exists
    const { count, error } = await supabase
      .from('faculties')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error checking faculties table:', error);
      await createTables();
    }

    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
};

const createTables = async () => {
  try {
    // Create faculties table
    await supabase.query(`
      CREATE TABLE IF NOT EXISTS faculties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'teacher'
      );
    `);

    // Create projects table
    await supabase.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        group_no TEXT NOT NULL,
        title TEXT NOT NULL,
        domain TEXT,
        faculty_mentor TEXT,
        industry_mentor TEXT,
        session TEXT,
        year TEXT,
        semester TEXT,
        faculty_coordinator TEXT,
        progress_form_url TEXT,
        presentation_url TEXT,
        report_url TEXT,
        initial_evaluation TEXT,
        progress_evaluation TEXT,
        final_evaluation TEXT,
        project_category TEXT,
        initial_clarity_objectives NUMERIC,
        initial_background_feasibility NUMERIC,
        initial_usability_applications NUMERIC,
        initial_innovation_novelty NUMERIC,
        initial_total NUMERIC,
        progress_data_extraction NUMERIC,
        progress_methodology NUMERIC,
        progress_implementation NUMERIC,
        progress_code_optimization NUMERIC,
        progress_user_interface NUMERIC,
        progress_total NUMERIC,
        final_implementation NUMERIC,
        final_results NUMERIC,
        final_research_paper NUMERIC,
        final_project_completion NUMERIC,
        final_total NUMERIC
      );
    `);

    // Create students table
    await supabase.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES projects(id),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        roll_no TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        program TEXT
      );
    `);

    // Create dynamic columns table
    await supabase.query(`
      CREATE TABLE IF NOT EXISTS dynamic_columns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        name TEXT NOT NULL,
        type TEXT NOT NULL
      );
    `);

    // Create dynamic column values table
    await supabase.query(`
      CREATE TABLE IF NOT EXISTS dynamic_column_values (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        column_id UUID,
        project_id UUID,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        value TEXT
      );
    `);

    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

// Dynamic columns functions
export const addDynamicColumn = async (name: string, type: string) => {
  const { data, error } = await supabase
    .from('dynamic_columns')
    .insert({ name, type })
    .select();

  if (error) {
    console.error('Error adding dynamic column:', error);
    throw error;
  }

  return data?.[0];
};

export const getDynamicColumns = async () => {
  const { data, error } = await supabase
    .from('dynamic_columns')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching dynamic columns:', error);
    throw error;
  }

  return data || [];
};

export const deleteDynamicColumn = async (columnId: string) => {
  // First delete all values associated with this column
  await supabase
    .from('dynamic_column_values')
    .delete()
    .eq('column_id', columnId);

  // Then delete the column itself
  const { error } = await supabase
    .from('dynamic_columns')
    .delete()
    .eq('id', columnId);

  if (error) {
    console.error('Error deleting dynamic column:', error);
    throw error;
  }

  return true;
};

export const addDynamicColumnValue = async (columnId: string, projectId: string, value: string) => {
  const { data, error } = await supabase
    .from('dynamic_column_values')
    .insert({
      column_id: columnId,
      project_id: projectId,
      value: value
    })
    .select();

  if (error) {
    console.error('Error adding dynamic column value:', error);
    throw error;
  }

  return data?.[0];
};

export const getDynamicColumnValues = async (projectId: string) => {
  const { data, error } = await supabase
    .from('dynamic_column_values')
    .select(`
      *,
      dynamic_columns (
        id,
        name,
        type
      )
    `)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching dynamic column values:', error);
    throw error;
  }

  return data || [];
};

export const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data?.path || path);

  return urlData?.publicUrl;
};
