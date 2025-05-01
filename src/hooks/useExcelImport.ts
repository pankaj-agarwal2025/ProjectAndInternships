
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { ProjectData, InternshipData } from '@/lib/supabase';

interface ExcelRow {
  [key: string]: any;
}

interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  errors?: string[];
}

const mapExcelToProject = (row: ExcelRow): ProjectData => {
  // Map Excel columns to project fields
  const project: ProjectData = {
    group_no: row['Group No'] || '',
    title: row['Title'] || '',
    domain: row['Domain'] || undefined,
    faculty_mentor: row['Faculty Mentor'] || undefined,
    industry_mentor: row['Industry Mentor'] || undefined,
    session: row['Session'] || undefined,
    year: row['Year'] || undefined,
    semester: row['Semester'] || undefined,
    faculty_coordinator: row['Faculty Coordinator'] || undefined,
    project_category: row['Project Category'] || undefined,
    students: []
  };

  // Map student data
  for (let i = 1; i <= 4; i++) {
    const rollNo = row[`Student ${i} Roll No`];
    const name = row[`Student ${i} Name`];
    
    if (rollNo && name) {
      project.students?.push({
        roll_no: rollNo,
        name: name,
        email: row[`Student ${i} Email`] || undefined,
        program: row[`Student ${i} Program`] || undefined
      });
    }
  }

  return project;
};

const mapExcelToInternship = (row: ExcelRow): InternshipData => {
  // Map Excel columns to internship fields
  return {
    roll_no: row['Roll No'] || '',
    name: row['Name'] || '',
    email: row['Email'] || undefined,
    phone_no: row['Phone No'] || undefined,
    domain: row['Domain'] || undefined,
    session: row['Session'] || undefined,
    year: row['Year'] || undefined,
    semester: row['Semester'] || undefined,
    program: row['Program'] || undefined,
    organization_name: row['Organization Name'] || undefined,
    position: row['Position'] || undefined,
    starting_date: row['Starting Date'] || undefined,
    ending_date: row['Ending Date'] || undefined
  };
};

const useExcelImport = () => {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const importProjectMutation = useMutation({
    mutationFn: async (file: File) => {
      const result: ImportResult = {
        success: false,
        total: 0,
        inserted: 0,
        updated: 0,
        errors: []
      };

      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

        result.total = rows.length;

        for (const row of rows) {
          try {
            const projectData = mapExcelToProject(row);

            // Skip if required fields are missing
            if (!projectData.group_no || !projectData.title) {
              result.errors?.push(`Missing required fields (Group No or Title) in row: ${JSON.stringify(row)}`);
              continue;
            }

            // Check if this project exists already (for update)
            const { data: existingProjects } = await supabase
              .from('projects')
              .select('id, group_no, year, semester')
              .eq('group_no', projectData.group_no)
              .eq('year', projectData.year || '')
              .eq('semester', projectData.semester || '');

            let projectId;
            
            if (existingProjects && existingProjects.length > 0) {
              // Update existing project
              const existingProject = existingProjects[0];
              projectId = existingProject.id;
              
              // Only update non-null fields
              const updateData: Record<string, any> = {};
              Object.entries(projectData).forEach(([key, value]) => {
                if (value !== undefined && key !== 'students') {
                  updateData[key] = value;
                }
              });
              
              if (Object.keys(updateData).length > 0) {
                await supabase
                  .from('projects')
                  .update(updateData)
                  .eq('id', projectId);
              }
              
              result.updated++;
            } else {
              // Insert new project
              const { data: newProject, error } = await supabase
                .from('projects')
                .insert({
                  group_no: projectData.group_no,
                  title: projectData.title,
                  domain: projectData.domain,
                  faculty_mentor: projectData.faculty_mentor,
                  industry_mentor: projectData.industry_mentor,
                  session: projectData.session,
                  year: projectData.year,
                  semester: projectData.semester,
                  faculty_coordinator: projectData.faculty_coordinator,
                  project_category: projectData.project_category
                })
                .select('id')
                .single();

              if (error) throw error;
              
              projectId = newProject.id;
              result.inserted++;
            }

            // Handle students
            if (projectId && projectData.students && projectData.students.length > 0) {
              // First check if students exist for this project
              const { data: existingStudents } = await supabase
                .from('students')
                .select('id, roll_no, name')
                .eq('group_id', projectId);
                
              for (const student of projectData.students) {
                const existingStudent = existingStudents?.find(s => 
                  s.roll_no === student.roll_no || s.name === student.name
                );
                
                if (existingStudent) {
                  // Update existing student
                  const updateData: Record<string, any> = {};
                  Object.entries(student).forEach(([key, value]) => {
                    if (value !== undefined) {
                      updateData[key] = value;
                    }
                  });
                  
                  if (Object.keys(updateData).length > 0) {
                    await supabase
                      .from('students')
                      .update(updateData)
                      .eq('id', existingStudent.id);
                  }
                } else {
                  // Insert new student
                  await supabase
                    .from('students')
                    .insert({
                      group_id: projectId,
                      roll_no: student.roll_no,
                      name: student.name,
                      email: student.email,
                      program: student.program
                    });
                }
              }
            }
          } catch (error) {
            console.error('Error processing row:', error);
            result.errors?.push(`Error processing row: ${JSON.stringify(row)} - ${String(error)}`);
          }
        }

        result.success = true;
      } catch (error) {
        console.error('Error importing Excel file:', error);
        result.errors?.push(`Error importing file: ${String(error)}`);
      }

      setImportResult(result);
      return result;
    }
  });

  const importInternshipMutation = useMutation({
    mutationFn: async (file: File) => {
      const result: ImportResult = {
        success: false,
        total: 0,
        inserted: 0,
        updated: 0,
        errors: []
      };

      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

        result.total = rows.length;

        for (const row of rows) {
          try {
            const internshipData = mapExcelToInternship(row);

            // Skip if required fields are missing
            if (!internshipData.roll_no || !internshipData.name) {
              result.errors?.push(`Missing required fields (Roll No or Name) in row: ${JSON.stringify(row)}`);
              continue;
            }

            // Check if this internship exists already (for update)
            const { data: existingInternships } = await supabase
              .from('internships')
              .select('id, roll_no, name, organization_name, position')
              .eq('roll_no', internshipData.roll_no)
              .eq('name', internshipData.name || '')
              .eq('organization_name', internshipData.organization_name || '')
              .eq('position', internshipData.position || '');

            if (existingInternships && existingInternships.length > 0) {
              // Update existing internship
              const existingInternship = existingInternships[0];
              
              // Only update non-null fields
              const updateData: Record<string, any> = {};
              Object.entries(internshipData).forEach(([key, value]) => {
                if (value !== undefined) {
                  updateData[key] = value;
                }
              });
              
              if (Object.keys(updateData).length > 0) {
                await supabase
                  .from('internships')
                  .update(updateData)
                  .eq('id', existingInternship.id);
              }
              
              result.updated++;
            } else {
              // Insert new internship
              await supabase
                .from('internships')
                .insert(internshipData);
                
              result.inserted++;
            }
          } catch (error) {
            console.error('Error processing row:', error);
            result.errors?.push(`Error processing row: ${JSON.stringify(row)} - ${String(error)}`);
          }
        }

        result.success = true;
      } catch (error) {
        console.error('Error importing Excel file:', error);
        result.errors?.push(`Error importing file: ${String(error)}`);
      }

      setImportResult(result);
      return result;
    }
  });

  return {
    importResult,
    importProjectMutation,
    importInternshipMutation,
    resetResult: () => setImportResult(null)
  };
};

export default useExcelImport;
