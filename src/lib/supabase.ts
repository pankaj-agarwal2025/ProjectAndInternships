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

export interface Internship {
  id: string;
  created_at: string;
  updated_at: string;
  starting_date?: string;
  ending_date?: string;
  internship_duration?: number;
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
  offer_letter_url?: string;
  noc_url?: string;
  ppo_url?: string;
  faculty_coordinator?: string;
  stipend?: string;
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
    // Create faculties table using SQL via rpc
    const { error: facultiesError } = await supabase.rpc('create_faculties_table');
    
    if (facultiesError) {
      console.error('Error creating faculties table:', facultiesError);
    }

    // Create projects table using SQL via rpc
    const { error: projectsError } = await supabase.rpc('create_projects_table');
    
    if (projectsError) {
      console.error('Error creating projects table:', projectsError);
    }

    // Create students table using SQL via rpc
    const { error: studentsError } = await supabase.rpc('create_students_table');
    
    if (studentsError) {
      console.error('Error creating students table:', studentsError);
    }

    // Create dynamic columns table using SQL via rpc
    const { error: dynamicColumnsError } = await supabase.rpc('create_dynamic_columns_table');
    
    if (dynamicColumnsError) {
      console.error('Error creating dynamic columns table:', dynamicColumnsError);
    }

    // Create dynamic column values table using SQL via rpc
    const { error: dynamicColumnValuesError } = await supabase.rpc('create_dynamic_column_values_table');
    
    if (dynamicColumnValuesError) {
      console.error('Error creating dynamic column values table:', dynamicColumnValuesError);
    }

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

// Add function for project management
export const addProject = async (projectData: ProjectData, students: any[]) => {
  try {
    // First, insert the project
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select();

    if (projectError) {
      console.error('Error adding project:', projectError);
      throw projectError;
    }

    if (!newProject || newProject.length === 0) {
      throw new Error('No project data returned after insert');
    }

    const projectId = newProject[0].id;

    // Then, insert each student with the project ID
    for (const student of students) {
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          group_id: projectId,
          roll_no: student.roll_no,
          name: student.name,
          email: student.email,
          program: student.program
        });

      if (studentError) {
        console.error('Error adding student:', studentError);
        throw studentError;
      }
    }

    return newProject[0];
  } catch (error) {
    console.error('Error in addProject:', error);
    throw error;
  }
};

// Internship dynamic columns functions
export const getInternshipDynamicColumns = async () => {
  const { data, error } = await supabase
    .from('internship_dynamic_columns')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching internship dynamic columns:', error);
    throw error;
  }

  return data || [];
};

export const addInternshipDynamicColumn = async (name: string, type: string) => {
  const { data, error } = await supabase
    .from('internship_dynamic_columns')
    .insert({ name, type })
    .select();

  if (error) {
    console.error('Error adding internship dynamic column:', error);
    throw error;
  }

  return data?.[0];
};

export const deleteInternshipDynamicColumn = async (columnId: string) => {
  // First delete all values associated with this column
  await supabase
    .from('internship_dynamic_column_values')
    .delete()
    .eq('column_id', columnId);

  // Then delete the column itself
  const { error } = await supabase
    .from('internship_dynamic_columns')
    .delete()
    .eq('id', columnId);

  if (error) {
    console.error('Error deleting internship dynamic column:', error);
    throw error;
  }

  return true;
};

export const getInternshipDynamicColumnValues = async (internshipId: string) => {
  const { data, error } = await supabase
    .from('internship_dynamic_column_values')
    .select(`
      *,
      internship_dynamic_columns (
        id,
        name,
        type
      )
    `)
    .eq('internship_id', internshipId);

  if (error) {
    console.error('Error fetching internship dynamic column values:', error);
    throw error;
  }

  return data || [];
};

export const addInternshipDynamicColumnValue = async (columnId: string, internshipId: string, value: string) => {
  const { data, error } = await supabase
    .from('internship_dynamic_column_values')
    .insert({
      column_id: columnId,
      internship_id: internshipId,
      value: value
    })
    .select();

  if (error) {
    console.error('Error adding internship dynamic column value:', error);
    throw error;
  }

  return data?.[0];
};

// Excel processing functions
export const processProjectsExcel = async (excelData: any[], facultyCoordinator: string) => {
  try {
    // Logic to process Excel data and update/create projects
    // For each row in Excel
    for (const row of excelData) {
      // Check if this project already exists
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('*, students(*)')
        .eq('group_no', row.group_no)
        .eq('year', row.year || '')
        .eq('semester', row.semester || '');
        
      if (existingProjects && existingProjects.length > 0) {
        // Update existing project with new data
        const projectId = existingProjects[0].id;
        
        // Only update fields that are present in the Excel
        const updateData: Partial<Project> = {};
        for (const key in row) {
          if (row[key] !== undefined && row[key] !== null && key !== 'students') {
            updateData[key as keyof Project] = row[key];
          }
        }
        
        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', projectId);
            
          if (error) {
            console.error('Error updating project:', error);
            throw error;
          }
        }
        
        // Handle students if present
        if (row.students && Array.isArray(row.students)) {
          for (const student of row.students) {
            const { data: existingStudent } = await supabase
              .from('students')
              .select('*')
              .eq('group_id', projectId)
              .eq('roll_no', student.roll_no);
              
            if (existingStudent && existingStudent.length > 0) {
              // Update student
              const { error } = await supabase
                .from('students')
                .update({
                  name: student.name,
                  email: student.email,
                  program: student.program
                })
                .eq('id', existingStudent[0].id);
                
              if (error) {
                console.error('Error updating student:', error);
                throw error;
              }
            } else {
              // Add new student to existing project
              const { error: studentError } = await supabase
                .from('students')
                .insert({
                  group_id: projectId,
                  roll_no: student.roll_no,
                  name: student.name,
                  email: student.email,
                  program: student.program
                });
                
              if (studentError) {
                console.error('Error adding student:', studentError);
                throw studentError;
              }
            }
          }
        }
      } else {
        // Create new project
        const projectData = {
          group_no: row.group_no,
          title: row.title || 'Untitled Project',
          domain: row.domain,
          faculty_mentor: row.faculty_mentor,
          industry_mentor: row.industry_mentor,
          session: row.session,
          year: row.year,
          semester: row.semester,
          faculty_coordinator: facultyCoordinator,
          project_category: row.project_category
        };
        
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select();
          
        if (error) {
          console.error('Error creating project:', error);
          throw error;
        }
          
        if (newProject && newProject.length > 0) {
          const projectId = newProject[0].id;
          
          // Add students if present
          if (row.students && Array.isArray(row.students)) {
            for (const student of row.students) {
              const { error: studentError } = await supabase
                .from('students')
                .insert({
                  group_id: projectId,
                  roll_no: student.roll_no,
                  name: student.name,
                  email: student.email,
                  program: student.program
                });
                
              if (studentError) {
                console.error('Error adding student:', studentError);
                throw studentError;
              }
            }
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error processing Excel data:', error);
    throw error;
  }
};

export const processInternshipsExcel = async (excelData: any[], facultyCoordinator: string) => {
  try {
    // For each row in Excel
    for (const row of excelData) {
      // Check if this internship already exists
      const { data: existingInternships } = await supabase
        .from('internships')
        .select('*')
        .eq('roll_no', row.roll_no)
        .eq('organization_name', row.organization_name || '')
        .eq('position', row.position || '');
        
      if (existingInternships && existingInternships.length > 0) {
        // Update existing internship with new data
        const internshipId = existingInternships[0].id;
        
        // Only update fields that are present in the Excel
        const updateData: Partial<Internship> = {};
        for (const key in row) {
          if (row[key] !== undefined && row[key] !== null) {
            updateData[key as keyof Internship] = row[key];
          }
        }
        
        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('internships')
            .update(updateData)
            .eq('id', internshipId);
            
          if (error) {
            console.error('Error updating internship:', error);
            throw error;
          }
        }
      } else {
        // Create new internship
        const internshipData = {
          roll_no: row.roll_no,
          name: row.name,
          email: row.email,
          phone_no: row.phone_no,
          domain: row.domain,
          session: row.session,
          year: row.year,
          semester: row.semester,
          program: row.program,
          organization_name: row.organization_name,
          position: row.position,
          starting_date: row.starting_date,
          ending_date: row.ending_date,
          stipend: row.stipend,
          faculty_coordinator: facultyCoordinator
        };
        
        const { error } = await supabase
          .from('internships')
          .insert(internshipData);
          
        if (error) {
          console.error('Error creating internship:', error);
          throw error;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error processing internships Excel data:', error);
    throw error;
  }
};
