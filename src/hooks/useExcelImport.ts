
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { addProject } from '@/lib/supabase';

interface ExcelImportHookProps {
  facultyCoordinator: string;
  onClose: () => void;
}

export const useExcelImport = ({ facultyCoordinator, onClose }: ExcelImportHookProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Preview Excel data
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          try {
            const data = new Uint8Array(evt.target.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            setPreviewData(jsonData.slice(0, 5)); // Preview first 5 rows
            console.log("Excel preview data:", jsonData.slice(0, 5));
          } catch (error) {
            console.error("Error previewing Excel data:", error);
            toast({
              title: 'Error Previewing File',
              description: 'Failed to read the Excel file. Please check the format.',
              variant: 'destructive',
            });
          }
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select an Excel file to import.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!facultyCoordinator) {
      toast({
        title: 'Missing Information',
        description: 'Faculty coordinator information is required.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (evt) => {
        if (evt.target?.result) {
          try {
            const data = new Uint8Array(evt.target.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];
            
            console.log("Full Excel data:", jsonData);
            
            if (jsonData.length === 0) {
              throw new Error('Excel file is empty or has invalid format');
            }
            
            // Import each group
            let successCount = 0;
            let errorCount = 0;
            
            // Process each row as a separate project/group
            for (const row of jsonData) {
              try {
                console.log("Processing row:", row);
                
                // Extract group_no (convert to string if it's a number)
                const groupNo = String(row['Group No'] || '').trim();
                
                if (!groupNo) {
                  console.warn('Row missing Group No:', row);
                  errorCount++;
                  continue;
                }
                
                // Basic project data
                const projectData = {
                  group_no: groupNo,
                  title: String(row['Title'] || ''),
                  domain: String(row['Domain'] || ''),
                  faculty_mentor: String(row['Faculty Mentor'] || ''),
                  industry_mentor: String(row['Industry Mentor'] || ''),
                  session: String(row['Session'] || ''),
                  year: String(row['Year'] || ''),
                  semester: String(row['Semester'] || ''),
                  faculty_coordinator: facultyCoordinator,
                  progress_form_url: String(row['Progress Form'] || ''),
                  presentation_url: String(row['Presentation'] || ''),
                  report_url: String(row['Report'] || ''),
                  initial_evaluation: String(row['Initial Evaluation'] || ''),
                  progress_evaluation: String(row['Progress Evaluation'] || ''),
                  final_evaluation: String(row['Final Evaluation'] || '')
                };
                
                // Collect student data from the row
                const students = [];
                
                // Process up to 4 students per row
                for (let i = 1; i <= 4; i++) {
                  const rollNo = String(row[`Student ${i} Roll No`] || '').trim();
                  const name = String(row[`Student ${i} Name`] || '').trim();
                  const email = String(row[`Student ${i} Email`] || '').trim();
                  const program = String(row[`Student ${i} Program`] || '').trim();
                  
                  // Only add student if at least roll number is provided
                  if (rollNo) {
                    students.push({
                      roll_no: rollNo,
                      name: name,
                      email: email,
                      program: program
                    });
                  }
                }
                
                console.log(`Importing group ${groupNo} with ${students.length} students:`, { projectData, students });
                
                if (students.length === 0) {
                  console.warn(`Group ${groupNo} has no valid students with roll numbers.`);
                  errorCount++;
                  continue;
                }
                
                const result = await addProject(projectData, students);
                
                if (result) {
                  console.log(`Successfully imported group ${groupNo}:`, result);
                  successCount++;
                } else {
                  console.error(`Failed to import group ${groupNo}`);
                  errorCount++;
                }
              } catch (error) {
                console.error(`Error importing row:`, error);
                errorCount++;
              }
            }
            
            // Show results
            if (successCount > 0) {
              toast({
                title: 'Import Successful',
                description: `Successfully imported ${successCount} groups.${errorCount > 0 ? ` Failed to import ${errorCount} groups.` : ''}`,
              });
              onClose();
              // Refresh the page to show new data
              window.location.reload();
            } else {
              toast({
                title: 'Import Failed',
                description: 'Failed to import any groups. Please check the Excel format and try again.',
                variant: 'destructive',
              });
            }
          } catch (error) {
            console.error('Excel import error:', error);
            toast({
              title: 'Import Error',
              description: 'An error occurred during import. Please check the Excel format and try again.',
              variant: 'destructive',
            });
          }
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        toast({
          title: 'File Error',
          description: 'Failed to read the Excel file.',
          variant: 'destructive',
        });
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Error',
        description: 'An error occurred during import. Please try again.',
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
