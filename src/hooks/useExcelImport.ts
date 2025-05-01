
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ExcelImportOptions {
  facultyCoordinator: string;
  onClose: () => void;
}

interface Student {
  roll_no: string;
  name: string;
  email?: string;
  program?: string;
}

interface ProjectData {
  group_no: string;
  title: string;
  domain?: string;
  faculty_mentor?: string;
  industry_mentor?: string;
  session?: string;
  year?: string;
  semester?: string;
  project_category?: string;
  students: Student[];
  [key: string]: any;
}

export const useExcelImport = ({ facultyCoordinator, onClose }: ExcelImportOptions) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = async (excelFile: File) => {
    try {
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setPreviewData(jsonData.slice(0, 5)); // Preview first 5 rows
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast({
        title: 'Error',
        description: 'Failed to parse Excel file. Please check the format.',
        variant: 'destructive',
      });
    }
  };

  const normalizeKey = (key: string): string => {
    // Convert camelCase or PascalCase to snake_case
    const normalized = key
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .trim();
    
    // Handle specific mappings
    const keyMappings: Record<string, string> = {
      'roll_number': 'roll_no',
      'roll_no_': 'roll_no',
      'student_name': 'name',
      'faculty_guide': 'faculty_mentor',
      'industry_guide': 'industry_mentor',
      'category': 'project_category',
    };
    
    return keyMappings[normalized] || normalized;
  };

  const groupDataByProject = (data: any[]): ProjectData[] => {
    const projectsMap = new Map<string, ProjectData>();
    
    for (const row of data) {
      const normalizedRow: Record<string, any> = {};
      
      // Normalize keys
      Object.keys(row).forEach(key => {
        const normalizedKey = normalizeKey(key);
        normalizedRow[normalizedKey] = row[key];
      });
      
      // Extract project data (required fields)
      const project: Partial<ProjectData> = {
        group_no: String(normalizedRow.group_no || ''),
        title: String(normalizedRow.title || ''),
        domain: normalizedRow.domain || undefined,
        faculty_mentor: normalizedRow.faculty_mentor || undefined,
        industry_mentor: normalizedRow.industry_mentor || undefined,
        session: normalizedRow.session || undefined,
        year: normalizedRow.year || undefined,
        semester: normalizedRow.semester || undefined,
        project_category: normalizedRow.project_category || undefined,
        faculty_coordinator: facultyCoordinator,
      };
      
      // Extract evaluation fields if present
      const evaluationFields = [
        'initial_clarity_objectives', 'initial_background_feasibility', 'initial_usability_applications', 'initial_innovation_novelty',
        'progress_data_extraction', 'progress_methodology', 'progress_implementation', 'progress_code_optimization', 'progress_user_interface',
        'final_implementation', 'final_results', 'final_research_paper', 'final_project_completion'
      ];
      
      evaluationFields.forEach(field => {
        if (normalizedRow[field] !== undefined) {
          project[field] = normalizedRow[field];
        }
      });
      
      // Extract document URLs if present
      if (normalizedRow.progress_form_url) project.progress_form_url = normalizedRow.progress_form_url;
      if (normalizedRow.presentation_url) project.presentation_url = normalizedRow.presentation_url;
      if (normalizedRow.report_url) project.report_url = normalizedRow.report_url;
      
      // Extract student data
      const student: Student = {
        roll_no: String(normalizedRow.roll_no || ''),
        name: String(normalizedRow.name || ''),
        email: normalizedRow.email || undefined,
        program: normalizedRow.program || undefined,
      };
      
      // Skip if no roll number or name
      if (!student.roll_no || !student.name) continue;
      
      // Find or create project entry
      const projectKey = `${project.group_no}-${project.year}-${project.semester}`;
      
      if (!projectsMap.has(projectKey)) {
        projectsMap.set(projectKey, {
          ...project,
          students: [],
        });
      }
      
      // Add student to project
      const existingProject = projectsMap.get(projectKey);
      if (existingProject) {
        existingProject.students.push(student);
      }
    }
    
    return [...projectsMap.values()];
  };

  const handleImport = async () => {
    if (!file || !facultyCoordinator) {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and ensure faculty coordinator is available.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      // Parse Excel data
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Group data by projects
      const projects = groupDataByProject(jsonData);
      
      // Process each project - check if it exists and update or create new
      const results = [];
      
      for (const project of projects) {
        // Skip invalid projects (no group number or title)
        if (!project.group_no || !project.title) continue;
        
        // Check if project exists based on criteria
        const { data: existingProjects, error: queryError } = await supabase
          .from('projects')
          .select('id, students(id, roll_no, name)')
          .eq('group_no', project.group_no)
          .eq('year', project.year || '')
          .eq('semester', project.semester || '');
          
        if (queryError) {
          console.error('Error checking existing project:', queryError);
          continue;
        }
        
        // Check if we have at least one student with matching name
        let existingProjectId = null;
        let studentMatches = false;
        
        if (existingProjects && existingProjects.length > 0) {
          for (const existingProject of existingProjects) {
            if (existingProject.students && existingProject.students.length > 0) {
              // Check if any student in the existing project matches a student in the new data
              for (const existingStudent of existingProject.students) {
                if (project.students.some(s => 
                  s.roll_no === existingStudent.roll_no || 
                  s.name.toLowerCase() === existingStudent.name.toLowerCase())
                ) {
                  existingProjectId = existingProject.id;
                  studentMatches = true;
                  break;
                }
              }
              if (studentMatches) break;
            }
          }
        }
        
        if (existingProjectId) {
          // Update existing project with new data
          const projectUpdates: Record<string, any> = {};
          
          // Only include fields that have values to avoid overwriting with null
          Object.keys(project).forEach(key => {
            if (project[key] !== undefined && key !== 'students') {
              projectUpdates[key] = project[key];
            }
          });
          
          if (Object.keys(projectUpdates).length > 0) {
            const { error: updateError } = await supabase
              .from('projects')
              .update(projectUpdates)
              .eq('id', existingProjectId);
              
            if (updateError) {
              console.error('Error updating project:', updateError);
              continue;
            }
          }
          
          // Update or add students
          for (const student of project.students) {
            if (!student.roll_no || !student.name) continue;
            
            // Check if student exists
            const { data: existingStudents, error: studentQueryError } = await supabase
              .from('students')
              .select('id')
              .eq('group_id', existingProjectId)
              .eq('roll_no', student.roll_no);
              
            if (studentQueryError) {
              console.error('Error checking existing student:', studentQueryError);
              continue;
            }
            
            if (existingStudents && existingStudents.length > 0) {
              // Update existing student
              const studentUpdates: Record<string, any> = {};
              Object.keys(student).forEach(key => {
                if (student[key] !== undefined) {
                  studentUpdates[key] = student[key];
                }
              });
              
              if (Object.keys(studentUpdates).length > 0) {
                await supabase
                  .from('students')
                  .update(studentUpdates)
                  .eq('id', existingStudents[0].id);
              }
            } else {
              // Add new student to existing project
              await supabase
                .from('students')
                .insert({
                  ...student,
                  group_id: existingProjectId
                });
            }
          }
          
          results.push({
            action: 'updated',
            group_no: project.group_no
          });
        } else {
          // Insert new project
          const { data: newProject, error: insertError } = await supabase
            .from('projects')
            .insert({
              group_no: project.group_no,
              title: project.title,
              domain: project.domain,
              faculty_mentor: project.faculty_mentor,
              industry_mentor: project.industry_mentor,
              session: project.session,
              year: project.year,
              semester: project.semester,
              faculty_coordinator: facultyCoordinator,
              project_category: project.project_category,
              progress_form_url: project.progress_form_url,
              presentation_url: project.presentation_url,
              report_url: project.report_url,
              initial_clarity_objectives: project.initial_clarity_objectives,
              initial_background_feasibility: project.initial_background_feasibility,
              initial_usability_applications: project.initial_usability_applications,
              initial_innovation_novelty: project.initial_innovation_novelty,
              progress_data_extraction: project.progress_data_extraction,
              progress_methodology: project.progress_methodology,
              progress_implementation: project.progress_implementation,
              progress_code_optimization: project.progress_code_optimization,
              progress_user_interface: project.progress_user_interface,
              final_implementation: project.final_implementation,
              final_results: project.final_results,
              final_research_paper: project.final_research_paper,
              final_project_completion: project.final_project_completion
            })
            .select();
            
          if (insertError) {
            console.error('Error inserting new project:', insertError);
            continue;
          }
          
          // Insert students for new project
          if (newProject && newProject.length > 0) {
            for (const student of project.students) {
              if (!student.roll_no || !student.name) continue;
              
              await supabase
                .from('students')
                .insert({
                  ...student,
                  group_id: newProject[0].id
                });
            }
            
            results.push({
              action: 'inserted',
              group_no: project.group_no
            });
          }
        }
      }
      
      toast({
        title: 'Import Successful',
        description: `Processed ${results.length} projects (${results.filter(r => r.action === 'inserted').length} new, ${results.filter(r => r.action === 'updated').length} updated)`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error importing Excel data:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred while importing the data. Please check the Excel format.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return {
    file,
    isImporting,
    previewData,
    handleFileChange,
    handleImport,
  };
};
