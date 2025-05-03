
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { addProject } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
  
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
        const parsedData = XLSX.utils.sheet_to_json(worksheet, {
          defval: null, // Use null as default for empty cells
          raw: false    // Convert to type appropriate to the data
        });
        
        console.log("Parsed Excel data:", parsedData);
        
        // Validate required fields - Group No, Title
        const validData = parsedData.filter((row: any) => {
          return row['Group No'] && row['Title'];
        });
        
        if (validData.length === 0) {
          toast({
            title: 'Invalid data',
            description: 'Excel file must have columns: "Group No" and "Title"',
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }
        
        setPreviewData(validData.slice(0, 5)); // Show first 5 rows as preview
        onDataReady(validData);
        setHasData(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast({
          title: 'Error',
          description: 'Failed to parse Excel file. Please check the format.',
          variant: 'destructive'
        });
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
            domain: row['Domain'] || null,
            faculty_mentor: row['Faculty Mentor'] || null,
            industry_mentor: row['Industry Mentor'] || null,
            session: row['Session'] || null,
            year: row['Year'] || null,
            semester: row['Semester'] || null,
            faculty_coordinator: facultyCoordinator,
            project_category: row['Project Category'] || null,
            progress_form_url: row['Progress Form'] || null,
            presentation_url: row['Presentation'] || null,
            report_url: row['Report'] || null,
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
      
      // Add student if Roll No AND Name exist (these are required)
      if (row['Roll No'] && row['Name']) {
        groups[groupNo].students.push({
          roll_no: row['Roll No'],
          name: row['Name'],
          email: row['Email'] || null,
          program: row['Program'] || null,
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
    if (!hasData || !file) {
      toast({
        title: 'No data',
        description: 'Please upload an Excel file first.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      console.log("Importing Excel data...");
      const groups = groupStudentsByGroup(previewData);
      console.log("Grouped data:", groups);
      
      const totalGroups = groups.length;
      if (totalGroups === 0) {
        throw new Error('No valid groups found in the Excel file.');
      }
      
      let processedGroups = 0;
      let failedGroups = 0;
      
      for (const group of groups) {
        try {
          console.log("Adding project:", group.project, "with students:", group.students);
          await addProject(group.project, group.students);
          processedGroups++;
        } catch (error) {
          console.error('Error adding project:', error, 'Project data:', group);
          failedGroups++;
        }
        setImportProgress(Math.round((processedGroups / totalGroups) * 100));
      }
      
      if (failedGroups > 0) {
        toast({
          title: 'Partial import success',
          description: `Successfully imported ${processedGroups} groups. ${failedGroups} groups failed.`,
          variant: 'warning'
        });
      } else {
        toast({
          title: 'Import success',
          description: `Successfully imported all ${processedGroups} groups.`,
          variant: 'default'
        });
      }
      
      setIsImporting(false);
      setFile(null);
      setPreviewData([]);
      setHasData(false);
      onClose();
      
      // Trigger refresh of data
      window.dispatchEvent(new CustomEvent('refresh-project-data'));
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import data.',
        variant: 'destructive'
      });
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
