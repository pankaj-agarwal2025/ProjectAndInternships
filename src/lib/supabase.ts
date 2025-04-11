
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gjhwggkmrqwskexdnmif.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqaHdnZ2ttcnF3c2tleGRubWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MTEyMzcsImV4cCI6MjA1OTQ4NzIzN30.IhfTFlQ_keri5dobHKlM3M-9BCeHxz8Xwo7iAGyb1SA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Faculty {
  id: string;
  username: string;
  password: string;
  name: string;
}

export interface Project {
  id: string;
  group_no: string;
  title: string;
  domain: string;
  faculty_mentor: string;
  industry_mentor: string;
  session: string;
  year: string;
  semester: string;
  faculty_coordinator: string;
  progress_form_url?: string;
  presentation_url?: string;
  report_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  group_id: string;
  roll_no: string;
  name: string;
  email: string;
  program: string;
}

// Function to create the necessary tables in Supabase if they don't exist
export async function setupDatabase() {
  try {
    // Check if the tables exist
    const { data: faculties, error: facultiesError } = await supabase
      .from('faculties')
      .select('id')
      .limit(1);
    
    if (facultiesError) {
      console.error('Error checking faculties table:', facultiesError);
    }
    
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (projectsError) {
      console.error('Error checking projects table:', projectsError);
    }
    
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .limit(1);
    
    if (studentsError) {
      console.error('Error checking students table:', studentsError);
    }
    
    const { data: dynamicColumns, error: dynamicColumnsError } = await supabase
      .from('dynamic_columns')
      .select('id')
      .limit(1);
    
    if (dynamicColumnsError) {
      console.error('Error checking dynamic_columns table:', dynamicColumnsError);
    }

    // Add default faculty users
    if (faculties?.length === 0 || !faculties) {
      const defaultFaculties = [
        { username: 'dr.pankaj', password: 'password', name: 'Dr. Pankaj' },
        { username: 'dr.anshu', password: 'password', name: 'Dr. Anshu' },
        { username: 'dr.meenu', password: 'password', name: 'Dr. Meenu' },
        { username: 'dr.swati', password: 'password', name: 'Dr. Swati' },
      ];
      
      for (const faculty of defaultFaculties) {
        await supabase.from('faculties').insert(faculty);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
}

// Faculty login
export async function loginFaculty(username: string, password: string) {
  try {
    const { data, error } = await supabase
      .from('faculties')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    
    if (error) {
      console.error('Login error:', error);
      return null;
    }
    
    return data as Faculty;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Get all projects with filtering options
export async function getProjects(filters?: Record<string, any>) {
  try {
    let query = supabase.from('projects').select('*');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          query = query.eq(key, value);
        }
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
    
    return data as Project[];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

// Get students for a specific project group
export async function getStudentsByGroupId(groupId: string) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('group_id', groupId);
    
    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }
    
    return data as Student[];
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

// Add a new project and its students
export async function addProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>, students: Omit<Student, 'id' | 'group_id'>[]) {
  try {
    // Insert project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (projectError) {
      console.error('Error adding project:', projectError);
      return null;
    }
    
    // Insert students with the new project ID
    const studentsWithGroupId = students.map(student => ({
      ...student,
      group_id: projectData.id
    }));
    
    const { error: studentsError } = await supabase
      .from('students')
      .insert(studentsWithGroupId);
    
    if (studentsError) {
      console.error('Error adding students:', studentsError);
      return null;
    }
    
    return projectData;
  } catch (error) {
    console.error('Error adding project and students:', error);
    return null;
  }
}

// Update a project
export async function updateProject(id: string, updates: Partial<Project>) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating project:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
}

// Update a student
export async function updateStudent(id: string, updates: Partial<Student>) {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating student:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating student:', error);
    return null;
  }
}

// Delete a project and its students
export async function deleteProject(id: string) {
  try {
    // Delete students first
    const { error: studentsError } = await supabase
      .from('students')
      .delete()
      .eq('group_id', id);
    
    if (studentsError) {
      console.error('Error deleting students:', studentsError);
      return false;
    }
    
    // Delete project
    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (projectError) {
      console.error('Error deleting project:', projectError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting project and students:', error);
    return false;
  }
}

// Upload file to Supabase storage
export async function uploadFile(file: File, bucket: string, path: string) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }
    
    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

// Add a dynamic column
export async function addDynamicColumn(name: string, type: string) {
  try {
    const { data, error } = await supabase
      .from('dynamic_columns')
      .insert({ name, type })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding dynamic column:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error adding dynamic column:', error);
    return null;
  }
}

// Get all dynamic columns
export async function getDynamicColumns() {
  try {
    const { data, error } = await supabase
      .from('dynamic_columns')
      .select('*');
    
    if (error) {
      console.error('Error fetching dynamic columns:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching dynamic columns:', error);
    return [];
  }
}

// Add a dynamic column value
export async function addDynamicColumnValue(columnId: string, projectId: string, value: any) {
  try {
    const { data, error } = await supabase
      .from('dynamic_column_values')
      .insert({ column_id: columnId, project_id: projectId, value })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding dynamic column value:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error adding dynamic column value:', error);
    return null;
  }
}

// Get dynamic column values for a project
export async function getDynamicColumnValues(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('dynamic_column_values')
      .select('*, dynamic_columns(*)')
      .eq('project_id', projectId);
    
    if (error) {
      console.error('Error fetching dynamic column values:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching dynamic column values:', error);
    return [];
  }
}
