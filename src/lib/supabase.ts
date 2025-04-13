import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ihxuclygrdbdsppjmrpf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeHVjbHlncmRiZHNwcGptcnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzODg5NDEsImV4cCI6MjA1OTk2NDk0MX0.94-dWkWOjh4hAENGAGtlQD0E-hQNNu0IBldk9H4lkQ0';

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

export interface Internship {
  id: string;
  roll_no: string;
  name: string;
  email: string;
  phone_no: string;
  domain: string;
  session: string;
  year: string;
  semester: string;
  program: string;
  organization_name: string;
  starting_date: string;
  ending_date: string;
  internship_duration: number;
  position: string;
  offer_letter_url?: string;
  noc_url?: string;
  ppo_url?: string;
  faculty_coordinator: string;
  created_at: string;
  updated_at: string;
}

export interface InternshipDynamicColumn {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

export interface InternshipDynamicColumnValue {
  id: string;
  column_id: string;
  internship_id: string;
  value: string;
  created_at: string;
  internship_dynamic_columns?: InternshipDynamicColumn;
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

    const { data: internships, error: internshipsError } = await supabase
      .from('internships')
      .select('id')
      .limit(1);
    
    if (internshipsError) {
      console.error('Error checking internships table:', internshipsError);
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

// Internship Portal Functions

// Get all internships with filtering options
export async function getInternships(filters?: Record<string, any>) {
  try {
    let query = supabase.from('internships').select('*');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          query = query.eq(key, value);
        }
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching internships:', error);
      return [];
    }
    
    return data as Internship[];
  } catch (error) {
    console.error('Error fetching internships:', error);
    return [];
  }
}

// Add a new internship
export async function addInternship(internship: Omit<Internship, 'id' | 'created_at' | 'updated_at' | 'internship_duration'>) {
  try {
    const { data, error } = await supabase
      .from('internships')
      .insert(internship)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding internship:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error adding internship:', error);
    return null;
  }
}

// Update an internship
export async function updateInternship(id: string, updates: Partial<Internship>) {
  try {
    const { data, error } = await supabase
      .from('internships')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating internship:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating internship:', error);
    return null;
  }
}

// Delete an internship
export async function deleteInternship(id: string) {
  try {
    const { error } = await supabase
      .from('internships')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting internship:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting internship:', error);
    return false;
  }
}

// Add a dynamic column for internships
export async function addInternshipDynamicColumn(name: string, type: string) {
  try {
    const { data, error } = await supabase
      .from('internship_dynamic_columns')
      .insert({ name, type })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding internship dynamic column:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error adding internship dynamic column:', error);
    return null;
  }
}

// Get all dynamic columns for internships
export async function getInternshipDynamicColumns(): Promise<InternshipDynamicColumn[]> {
  try {
    const { data, error } = await supabase
      .from('internship_dynamic_columns')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching internship dynamic columns:', error);
    return [];
  }
}

// Add a dynamic column value for internships
export async function addInternshipDynamicColumnValue(
  columnId: string,
  internshipId: string,
  value: string
): Promise<InternshipDynamicColumnValue | null> {
  try {
    const { data, error } = await supabase
      .from('internship_dynamic_column_values')
      .insert({ column_id: columnId, internship_id: internshipId, value })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error adding internship dynamic column value:', error);
    return null;
  }
}

// Get dynamic column values for an internship
export async function getInternshipDynamicColumnValues(internshipId: string): Promise<InternshipDynamicColumnValue[]> {
  try {
    const { data, error } = await supabase
      .from('internship_dynamic_column_values')
      .select('*, internship_dynamic_columns:column_id(*)')
      .eq('internship_id', internshipId);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching internship dynamic column values:', error);
    return [];
  }
}

// Format date for display (DD-MM-YYYY)
export function formatDateForDisplay(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
}

// Parse display date to ISO format (YYYY-MM-DD)
export function parseDisplayDate(displayDate: string) {
  if (!displayDate) return '';
  const [day, month, year] = displayDate.split('-').map(part => parseInt(part, 10));
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Process Excel data for internships
export async function processInternshipsExcel(excelData: any[], facultyCoordinator: string) {
  try {
    const processedData = excelData.map(row => {
      // Convert display dates to ISO format
      let startDate = row.starting_date;
      let endDate = row.ending_date;
      
      if (typeof startDate === 'string' && startDate.includes('-')) {
        startDate = parseDisplayDate(startDate);
      }
      
      if (typeof endDate === 'string' && endDate.includes('-')) {
        endDate = parseDisplayDate(endDate);
      }
      
      return {
        roll_no: row.roll_no || '',
        name: row.name || '',
        email: row.email || '',
        phone_no: row.phone_no || '',
        domain: row.domain || '',
        session: row.session || '',
        year: row.year || '',
        semester: row.semester || '',
        program: row.program || '',
        organization_name: row.organization_name || '',
        starting_date: startDate,
        ending_date: endDate,
        position: row.position || '',
        offer_letter_url: row.offer_letter_url || '',
        noc_url: row.noc_url || '',
        ppo_url: row.ppo_url || '',
        faculty_coordinator: facultyCoordinator
      };
    });
    
    // Insert processed data into database
    const { data, error } = await supabase
      .from('internships')
      .insert(processedData)
      .select();
    
    if (error) {
      console.error('Error inserting excel data:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error processing excel data:', error);
    return null;
  }
}

// Function to delete a dynamic column
export const deleteDynamicColumn = async (columnId: string) => {
  try {
    // Delete values first
    const { error: valueError } = await supabase
      .from('dynamic_column_values')
      .delete()
      .eq('column_id', columnId);
    
    if (valueError) {
      console.error('Error deleting dynamic column values:', valueError);
      throw valueError;
    }
    
    // Then delete the column
    const { error } = await supabase
      .from('dynamic_columns')
      .delete()
      .eq('id', columnId);
    
    if (error) {
      console.error('Error deleting dynamic column:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteDynamicColumn:', error);
    throw error;
  }
};

// Function to delete an internship dynamic column
export const deleteInternshipDynamicColumn = async (columnId: string) => {
  try {
    // First, delete any values associated with this column
    const { error: valuesError } = await supabase
      .from('internship_dynamic_column_values')
      .delete()
      .eq('column_id', columnId);

    if (valuesError) {
      throw valuesError;
    }

    // Then delete the column itself
    const { error } = await supabase
      .from('internship_dynamic_columns')
      .delete()
      .eq('id', columnId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting internship dynamic column:', error);
    return false;
  }
};

export const updateInternshipDynamicColumnValue = async (
  valueId: string,
  value: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('internship_dynamic_column_values')
      .update({ value })
      .eq('id', valueId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating internship dynamic column value:', error);
    return false;
  }
};
