import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ihxuclygrdbdsppjmrpf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeHVjbHlncmRiZHNwcGptcnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzODg5NDEsImV4cCI6MjA1OTk2NDk0MX0.94-dWkWOjh4hAENGAGtlQD0E-hQNNu0IBldk9H4lkQ0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Faculty {
  id: string;
  username: string;
  password: string;
  name: string;
  role?: string;
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
  initial_evaluation?: string;
  progress_evaluation?: string;
  final_evaluation?: string;
  created_at: string;
  updated_at: string;
  students?: Student[];
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

export async function setupDatabase() {
  try {
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

    if (projects && projects.length > 0) {
      const { data: projectData, error: projectDataError } = await supabase
        .from('projects')
        .select('initial_evaluation, progress_evaluation, final_evaluation')
        .eq('id', projects[0].id)
        .single();
      
      if (projectDataError) {
        console.error('Error checking evaluation columns:', projectDataError);
        
        await supabase.rpc('add_column_if_not_exists', {
          table_name: 'projects',
          column_name: 'initial_evaluation',
          column_type: 'text'
        });
        
        await supabase.rpc('add_column_if_not_exists', {
          table_name: 'projects',
          column_name: 'progress_evaluation',
          column_type: 'text'
        });
        
        await supabase.rpc('add_column_if_not_exists', {
          table_name: 'projects',
          column_name: 'final_evaluation',
          column_type: 'text'
        });
        
        console.log('Added evaluation columns to projects table');
      }
    }

    if (faculties?.length === 0 || !faculties) {
      const defaultFaculties = [
        { username: 'dr.pankaj', password: 'password', name: 'Dr. Pankaj' },
        { username: 'dr.anshu', password: 'password', name: 'Dr. Anshu', role: 'admin' },
        { username: 'dr.meenu', password: 'password', name: 'Dr. Meenu', role: 'admin' },
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

export async function addProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>, students: Omit<Student, 'id' | 'group_id'>[]) {
  try {
    console.log("Adding project with data:", project);
    console.log("Students to add:", students);
    
    if (!project.group_no || project.group_no.trim() === '') {
      console.error('Project is missing a group number');
      return null;
    }
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (projectError) {
      console.error('Error adding project:', projectError);
      return null;
    }
    
    const validStudents = students.filter(student => student.roll_no && student.roll_no.trim() !== '');
    
    if (validStudents.length === 0) {
      console.warn('No valid students to add for project:', projectData.id);
      return projectData;
    }
    
    const studentsWithGroupId = validStudents.map(student => ({
      ...student,
      group_id: projectData.id
    }));
    
    console.log("Adding students with group ID:", studentsWithGroupId);
    
    const { error: studentsError } = await supabase
      .from('students')
      .insert(studentsWithGroupId);
    
    if (studentsError) {
      console.error('Error adding students:', studentsError);
      console.warn('Project created but students could not be added');
      return projectData;
    }
    
    return projectData;
  } catch (error) {
    console.error('Error adding project and students:', error);
    return null;
  }
}

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

export async function deleteProject(id: string) {
  try {
    const { error: studentsError } = await supabase
      .from('students')
      .delete()
      .eq('group_id', id);
    
    if (studentsError) {
      console.error('Error deleting students:', studentsError);
      return false;
    }
    
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

export async function uploadFile(file: File, bucket: string, path: string) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets.some(b => b.name === bucket)) {
      await supabase.storage.createBucket(bucket, {
        public: true
      });
    }
    
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
    
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

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

export function formatDateForDisplay(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
}

export function parseDisplayDate(displayDate: string) {
  if (!displayDate) return '';
  const [day, month, year] = displayDate.split('-').map(part => parseInt(part, 10));
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export async function processInternshipsExcel(excelData: any[], facultyCoordinator: string) {
  try {
    console.log('Processing Excel data:', excelData);
    
    const processedData = excelData.filter(row => row.roll_no || row['Roll No']).map(row => {
      let startDate = row.starting_date || row['Starting Date'] || '';
      let endDate = row.ending_date || row['Ending Date'] || '';
      
      if (typeof startDate === 'string' && startDate.includes('-')) {
        const parts = startDate.split('-');
        if (parts.length === 3) {
          startDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      } else if (typeof startDate === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + startDate * 24 * 60 * 60 * 1000);
        startDate = date.toISOString().split('T')[0];
      }
      
      if (typeof endDate === 'string' && endDate.includes('-')) {
        const parts = endDate.split('-');
        if (parts.length === 3) {
          endDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      } else if (typeof endDate === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + endDate * 24 * 60 * 60 * 1000);
        endDate = date.toISOString().split('T')[0];
      }
      
      const internshipData = {
        roll_no: String(row.roll_no || row['Roll No'] || '').trim(),
        name: String(row.name || row['Name'] || '').trim(),
        email: String(row.email || row['Email'] || '').trim(),
        phone_no: String(row.phone_no || row['Phone No'] || row['Phone'] || '').trim(),
        domain: String(row.domain || row['Domain'] || '').trim(),
        session: String(row.session || row['Session'] || '').trim(),
        year: String(row.year || row['Year'] || '').trim(),
        semester: String(row.semester || row['Semester'] || '').trim(),
        program: String(row.program || row['Program'] || '').trim(),
        organization_name: String(row.organization_name || row['Organization'] || row['Organization Name'] || '').trim(),
        starting_date: startDate,
        ending_date: endDate,
        position: String(row.position || row['Position'] || '').trim(),
        offer_letter_url: String(row.offer_letter_url || row['Offer Letter'] || '').trim(),
        noc_url: String(row.noc_url || row['NOC'] || '').trim(),
        ppo_url: String(row.ppo_url || row['PPO'] || '').trim(),
        faculty_coordinator: facultyCoordinator
      };
      
      return internshipData;
    });
    
    console.log('Processed internship data:', processedData);
    
    if (processedData.length === 0) {
      console.error('No valid internship records found in Excel file');
      return null;
    }
    
    // Process each internship - check if exists first
    const results = [];
    
    for (const internship of processedData) {
      if (!internship.roll_no || !internship.name) continue;
      
      // Check if the internship already exists based on criteria
      const { data: existingInternships, error: queryError } = await supabase
        .from('internships')
        .select('id')
        .eq('roll_no', internship.roll_no)
        .eq('name', internship.name)
        .eq('organization_name', internship.organization_name || '')
        .eq('position', internship.position || '');
        
      if (queryError) {
        console.error('Error checking existing internship:', queryError);
        continue;
      }
      
      if (existingInternships && existingInternships.length > 0) {
        // Update existing internship
        const internshipId = existingInternships[0].id;
        const updates: Record<string, any> = {};
        
        // Only include fields that have values
        Object.entries(internship).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            updates[key] = value;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('internships')
            .update(updates)
            .eq('id', internshipId);
            
          if (updateError) {
            console.error('Error updating internship:', updateError);
            continue;
          }
          
          results.push({
            action: 'updated',
            roll_no: internship.roll_no
          });
        }
      } else {
        // Insert new internship
        const { data: newInternship, error: insertError } = await supabase
          .from('internships')
          .insert(internship)
          .select();
          
        if (insertError) {
          console.error('Error inserting internship:', insertError);
          continue;
        }
        
        if (newInternship) {
          results.push({
            action: 'inserted',
            roll_no: internship.roll_no
          });
        }
      }
    }
    
    return {
      success: true,
      total: results.length,
      inserted: results.filter(r => r.action === 'inserted').length,
      updated: results.filter(r => r.action === 'updated').length
    };
  } catch (error) {
    console.error('Error processing excel data:', error);
    return null;
  }
}

export const deleteDynamicColumn = async (columnId: string) => {
  try {
    const { error: valueError } = await supabase
      .from('dynamic_column_values')
      .delete()
      .eq('column_id', columnId);
    
    if (valueError) {
      console.error('Error deleting dynamic column values:', valueError);
      throw valueError;
    }
    
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

export const deleteInternshipDynamicColumn = async (columnId: string) => {
  try {
    const { error: valuesError } = await supabase
      .from('internship_dynamic_column_values')
      .delete()
      .eq('column_id', columnId);

    if (valuesError) {
      throw valuesError;
    }

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
