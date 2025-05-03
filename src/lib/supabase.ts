
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Type definitions
export interface Faculty {
  id: string;
  created_at: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'teacher';
}

export interface Project {
  id: string;
  created_at: string;
  updated_at: string;
  group_no: string;
  title: string;
  domain?: string;
  faculty_mentor?: string;
  industry_mentor?: string;
  session?: string;
  year?: string;
  semester?: string;
  faculty_coordinator?: string;
  progress_form_url?: string;
  presentation_url?: string;
  report_url?: string;
  project_category?: string;
  initial_evaluation?: string;
  progress_evaluation?: string;
  final_evaluation?: string;
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
  students?: Student[];
}

export interface Student {
  id: string;
  group_id: string;
  created_at: string;
  roll_no: string;
  name: string;
  email?: string;
  program?: string;
}

export interface Internship {
  id: string;
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
  internship_duration?: number;
  offer_letter_url?: string;
  noc_url?: string;
  ppo_url?: string;
  faculty_coordinator?: string;
  created_at: string;
  updated_at: string;
  stipend?: string;
}

// Initialize the database with required tables if needed
export const setupDatabase = async () => {
  try {
    // Check if the tables already exist
    const { data: existingTables, error: tablesError } = await supabase
      .from('faculties')
      .select('id')
      .limit(1);

    // If there's an error or no tables, we'll assume we need to set up the database
    if (tablesError) {
      console.log('Setting up database tables...');
      // In a real application, you might want to create tables here
      // For now, we'll just return as the tables should be created through migrations
    }

    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
};

// Add a project and associated students
export const addProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'students'>, students: Omit<Student, 'id' | 'created_at' | 'group_id'>[]) => {
  try {
    // Insert the project first to get its ID
    const { data: projectResult, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select('id')
      .single();

    if (projectError || !projectResult) {
      console.error('Error adding project:', projectError);
      throw projectError || new Error('Failed to add project');
    }

    const projectId = projectResult.id;

    // Prepare student data with the project ID
    const studentsWithProjectId = students.map(student => ({
      ...student,
      group_id: projectId
    }));

    // Insert all students
    const { error: studentsError } = await supabase
      .from('students')
      .insert(studentsWithProjectId);

    if (studentsError) {
      console.error('Error adding students:', studentsError);
      throw studentsError;
    }

    return true;
  } catch (error) {
    console.error('Error in addProject:', error);
    throw error as Error;
  }
};

// Find this function in the file and fix the TypeScript error by using type assertion
export const deleteDynamicColumn = async (columnId: string) => {
  try {
    // First delete any values associated with this column
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
  } catch (error) {
    console.error('Error in deleteDynamicColumn:', error);
    throw error as Error;
  }
};

// Add the necessary functions for dynamic columns
export const getDynamicColumns = async () => {
  try {
    const { data, error } = await supabase
      .from('dynamic_columns')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching dynamic columns:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getDynamicColumns:', error);
    throw error as Error;
  }
};

export const addDynamicColumn = async (name: string, type: string) => {
  try {
    const { data, error } = await supabase
      .from('dynamic_columns')
      .insert({ name, type })
      .select();
    
    if (error) {
      console.error('Error adding dynamic column:', error);
      throw error;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error in addDynamicColumn:', error);
    throw error as Error;
  }
};

export const getDynamicColumnValues = async (projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('dynamic_column_values')
      .select('*, dynamic_columns(*)')
      .eq('project_id', projectId);
    
    if (error) {
      console.error('Error fetching dynamic column values:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getDynamicColumnValues:', error);
    throw error as Error;
  }
};

// Find the following function elsewhere in the file and apply the same fix
export const addDynamicColumnValue = async (columnId: string, projectId: string, value: string) => {
  try {
    // Check if value already exists
    const { data: existing } = await supabase
      .from('dynamic_column_values')
      .select('id')
      .eq('column_id', columnId)
      .eq('project_id', projectId)
      .single();
    
    if (existing) {
      const { error } = await supabase
        .from('dynamic_column_values')
        .update({ value })
        .eq('id', existing.id);
      
      if (error) {
        console.error('Error updating dynamic column value:', error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from('dynamic_column_values')
        .insert({ column_id: columnId, project_id: projectId, value });
      
      if (error) {
        console.error('Error inserting dynamic column value:', error);
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in addDynamicColumnValue:', error);
    throw error as Error;
  }
};

// Functions for internship dynamic columns
export const getInternshipDynamicColumns = async () => {
  try {
    const { data, error } = await supabase
      .from('internship_dynamic_columns')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching internship dynamic columns:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getInternshipDynamicColumns:', error);
    throw error as Error;
  }
};

export const addInternshipDynamicColumn = async (name: string, type: string) => {
  try {
    const { data, error } = await supabase
      .from('internship_dynamic_columns')
      .insert({ name, type })
      .select();
    
    if (error) {
      console.error('Error adding internship dynamic column:', error);
      throw error;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error in addInternshipDynamicColumn:', error);
    throw error as Error;
  }
};

export const deleteInternshipDynamicColumn = async (columnId: string) => {
  try {
    // First delete any values associated with this column
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
  } catch (error) {
    console.error('Error in deleteInternshipDynamicColumn:', error);
    throw error as Error;
  }
};

export const getInternshipDynamicColumnValues = async (internshipId: string) => {
  try {
    const { data, error } = await supabase
      .from('internship_dynamic_column_values')
      .select('*, internship_dynamic_columns(*)')
      .eq('internship_id', internshipId);
    
    if (error) {
      console.error('Error fetching internship dynamic column values:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getInternshipDynamicColumnValues:', error);
    throw error as Error;
  }
};

export const addInternshipDynamicColumnValue = async (columnId: string, internshipId: string, value: string) => {
  try {
    // Check if value already exists
    const { data: existing } = await supabase
      .from('internship_dynamic_column_values')
      .select('id')
      .eq('column_id', columnId)
      .eq('internship_id', internshipId)
      .single();
    
    if (existing) {
      const { error } = await supabase
        .from('internship_dynamic_column_values')
        .update({ value })
        .eq('id', existing.id);
      
      if (error) {
        console.error('Error updating internship dynamic column value:', error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from('internship_dynamic_column_values')
        .insert({ column_id: columnId, internship_id: internshipId, value });
      
      if (error) {
        console.error('Error inserting internship dynamic column value:', error);
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in addInternshipDynamicColumnValue:', error);
    throw error as Error;
  }
};

// File upload utility
export const uploadFile = async (file: File, bucketName: string, filePath: string) => {
  try {
    console.log(`Uploading file to ${bucketName}/${filePath}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    // Get the public URL for the uploaded file
    const { data: publicUrl } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    console.log('File uploaded successfully, public URL:', publicUrl.publicUrl);
    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error as Error;
  }
};

// Excel processing functions
export const processProjectsExcel = async (data: any[], facultyCoordinator: string) => {
  try {
    // Process each row in the Excel data
    for (const row of data) {
      // Check if project with this group_no already exists
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('group_no', row.group_no)
        .single();

      // Project data to insert or update
      const projectData = {
        group_no: row.group_no,
        title: row.title,
        domain: row.domain,
        faculty_mentor: row.faculty_mentor,
        industry_mentor: row.industry_mentor,
        session: row.session,
        year: row.year,
        semester: row.semester,
        faculty_coordinator: facultyCoordinator,
        progress_form_url: row.progress_form_url,
        presentation_url: row.presentation_url,
        report_url: row.report_url,
        project_category: row.project_category,
        initial_evaluation: row.initial_evaluation,
        progress_evaluation: row.progress_evaluation,
        final_evaluation: row.final_evaluation
      };

      let projectId;

      if (existingProject) {
        // Update existing project
        const { error: updateError } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', existingProject.id);

        if (updateError) {
          throw updateError;
        }

        projectId = existingProject.id;
      } else {
        // Insert new project
        const { data: newProject, error: insertError } = await supabase
          .from('projects')
          .insert(projectData)
          .select('id');

        if (insertError || !newProject) {
          throw insertError || new Error('Failed to create project');
        }

        projectId = newProject[0].id;
      }

      // Process students if they exist in the data
      const students = [];
      for (let i = 1; i <= 4; i++) {
        if (row[`student${i}_roll_no`] && row[`student${i}_name`]) {
          students.push({
            roll_no: row[`student${i}_roll_no`],
            name: row[`student${i}_name`],
            email: row[`student${i}_email`],
            program: row[`student${i}_program`],
            group_id: projectId
          });
        }
      }

      if (students.length > 0) {
        // First, delete existing students for this project
        await supabase
          .from('students')
          .delete()
          .eq('group_id', projectId);

        // Then insert the new students
        const { error: studentsError } = await supabase
          .from('students')
          .insert(students);

        if (studentsError) {
          throw studentsError;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error processing projects Excel:', error);
    throw error as Error;
  }
};

export const processInternshipsExcel = async (data: any[], facultyCoordinator: string) => {
  try {
    // Process each row in the Excel data
    const processedRows = [];
    
    for (const row of data) {
      // Check if internship with this roll_no already exists
      const { data: existingInternship } = await supabase
        .from('internships')
        .select('id')
        .eq('roll_no', row.roll_no)
        .single();
      
      // Format the dates if they exist
      let startingDate = row.starting_date;
      let endingDate = row.ending_date;
      
      if (startingDate && typeof startingDate === 'string') {
        startingDate = new Date(startingDate).toISOString().split('T')[0];
      }
      
      if (endingDate && typeof endingDate === 'string') {
        endingDate = new Date(endingDate).toISOString().split('T')[0];
      }
      
      // Internship data to insert or update
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
        starting_date: startingDate,
        ending_date: endingDate,
        offer_letter_url: row.offer_letter_url,
        noc_url: row.noc_url,
        ppo_url: row.ppo_url,
        faculty_coordinator: facultyCoordinator,
        stipend: row.stipend
      };
      
      if (existingInternship) {
        // Update existing internship
        const { error: updateError } = await supabase
          .from('internships')
          .update(internshipData)
          .eq('id', existingInternship.id);
        
        if (updateError) {
          throw updateError;
        }
        
        processedRows.push({ ...internshipData, id: existingInternship.id });
      } else {
        // Insert new internship
        const { data: newInternship, error: insertError } = await supabase
          .from('internships')
          .insert(internshipData)
          .select();
        
        if (insertError || !newInternship) {
          throw insertError || new Error('Failed to create internship');
        }
        
        processedRows.push(newInternship[0]);
      }
    }
    
    return processedRows;
  } catch (error) {
    console.error('Error processing internships Excel:', error);
    throw error as Error;
  }
};
