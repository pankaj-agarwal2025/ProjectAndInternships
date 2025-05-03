
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { addProject } from '@/lib/supabase';

export interface UseExcelImportProps {
  onDataReady: (data: any[]) => void;
  facultyCoordinator: string;
  onClose: () => void;
  // Adding minStudents and maxStudents props
  minStudents?: number;
  maxStudents?: number;
}

const useExcelImport = ({
  onDataReady,
  facultyCoordinator,
  onClose,
  minStudents = 1,
  maxStudents = 4
}: UseExcelImportProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [hasData, setHasData] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target || !event.target.result) {
        setIsLoading(false);
        return;
      }
      
      try {
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet);
        
        setPreviewData(parsedData.slice(0, 5)); // Show first 5 rows as preview
        onDataReady(parsedData);
        setHasData(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setIsLoading(false);
      }
    };
    
    reader.readAsArrayBuffer(selectedFile);
  };
  
  // Logic to group students by their group number
  const groupStudentsByGroup = (data: any[]) => {
    const groups: Record<string, any> = {};
    
    data.forEach((row) => {
      const groupNo = row['Group No'] || '';
      
      if (!groups[groupNo]) {
        groups[groupNo] = {
          project: {
            group_no: groupNo,
            title: row['Title'] || '',
            domain: row['Domain'] || '',
            faculty_mentor: row['Faculty Mentor'] || '',
            industry_mentor: row['Industry Mentor'] || '',
            session: row['Session'] || '',
            year: row['Year'] || '',
            semester: row['Semester'] || '',
            faculty_coordinator: facultyCoordinator,
            project_category: row['Project Category'] || '',
            progress_form_url: row['Progress Form'] || '',
            presentation_url: row['Presentation'] || '',
            report_url: row['Report'] || '',
            initial_clarity_objectives: row['initial_clarity_objectives'] || null,
            initial_background_feasibility: row['initial_background_feasibility'] || null,
            initial_usability_applications: row['initial_usability_applications'] || null,
            initial_innovation_novelty: row['initial_innovation_novelty'] || null,
            progress_data_extraction: row['progress_data_extraction'] || null,
            progress_methodology: row['progress_methodology'] || null,
            progress_implementation: row['progress_implementation'] || null,
            progress_code_optimization: row['progress_code_optimization'] || null,
            progress_user_interface: row['progress_user_interface'] || null,
            final_implementation: row['final_implementation'] || null,
            final_results: row['final_results'] || null,
            final_research_paper: row['final_research_paper'] || null,
            final_project_completion: row['final_project_completion'] || null,
          },
          students: []
        };
      }
      
      // Add student if Roll No, Name, etc. exist
      if (row['Roll No'] && row['Name']) {
        groups[groupNo].students.push({
          roll_no: row['Roll No'],
          name: row['Name'],
          email: row['Email'] || '',
          program: row['Program'] || '',
        });
      }
    });
    
    // Filter groups based on min and max students
    return Object.values(groups).filter(group => {
      const studentCount = group.students.length;
      return studentCount >= minStudents && studentCount <= maxStudents;
    });
  };
  
  const handleImport = async () => {
    if (!hasData) return;
    
    setIsImporting(true);
    
    try {
      const groups = groupStudentsByGroup(previewData);
      const totalGroups = groups.length;
      let processedGroups = 0;
      
      for (const group of groups) {
        await addProject(group.project, group.students);
        processedGroups++;
        setImportProgress((processedGroups / totalGroups) * 100);
      }
      
      setIsImporting(false);
      setFile(null);
      setPreviewData([]);
      setHasData(false);
      onClose();
    } catch (error) {
      console.error('Error importing data:', error);
      setIsImporting(false);
    }
  };
  
  return {
    isLoading,
    previewData,
    handleFileChange,
    handleImport,
    hasData,
    file,
    isImporting,
    importProgress
  };
};

export default useExcelImport;
