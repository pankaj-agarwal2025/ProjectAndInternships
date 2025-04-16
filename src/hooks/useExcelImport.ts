
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
            const data = evt.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
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
      reader.readAsBinaryString(selectedFile);
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
            const data = evt.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];
            
            console.log("Full Excel data:", jsonData);
            
            // Normalize column names to handle different header styles
            const normalizedData = jsonData.map(row => {
              const normalizedRow: Record<string, any> = {};
              
              // Map for common column name variations
              const columnMappings: Record<string, string[]> = {
                'Group No': ['Group No', 'Group', 'GroupNo', 'Group Number'],
                'Roll No': ['Roll No', 'RollNo', 'Roll Number', 'Student Roll No'],
                'Name': ['Name', 'Student Name', 'Full Name'],
                'Email': ['Email', 'Student Email', 'Email Address'],
                'Program': ['Program', 'Course'],
                'Title': ['Title', 'Project Title'],
                'Domain': ['Domain', 'Field', 'Area'],
                'Faculty Mentor': ['Faculty Mentor', 'Mentor'],
                'Industry Mentor': ['Industry Mentor', 'External Mentor'],
                'Session': ['Session'],
                'Year': ['Year'],
                'Semester': ['Semester'],
                'Progress Form': ['Progress Form', 'Progress Form URL'],
                'Presentation': ['Presentation', 'Presentation URL'],
                'Report': ['Report', 'Report URL'],
              };
              
              // Transform the input row to normalized column names
              Object.entries(columnMappings).forEach(([normalizedKey, variations]) => {
                for (const variation of variations) {
                  if (Object.prototype.hasOwnProperty.call(row, variation)) {
                    normalizedRow[normalizedKey] = row[variation];
                    break;
                  }
                }
              });
              
              return normalizedRow;
            });
            
            console.log("Normalized data:", normalizedData);
            
            // Group students by group number
            const groupedData: Record<string, any[]> = {};
            
            for (const row of normalizedData) {
              if (!row['Group No']) {
                console.error('Row missing Group No:', row);
                continue;
              }
              
              const groupNo = String(row['Group No']).trim();
              
              if (!groupedData[groupNo]) {
                groupedData[groupNo] = [];
              }
              
              groupedData[groupNo].push(row);
            }
            
            console.log("Grouped data:", groupedData);
            
            // Import each group
            let successCount = 0;
            let errorCount = 0;
            
            for (const [groupNo, rows] of Object.entries(groupedData)) {
              try {
                if (rows.length < 1) {
                  console.warn(`Group ${groupNo} has no students.`);
                  errorCount++;
                  continue;
                }
                
                const firstRow = rows[0];
                
                const projectData = {
                  group_no: groupNo,
                  title: String(firstRow['Title'] || ''),
                  domain: String(firstRow['Domain'] || ''),
                  faculty_mentor: String(firstRow['Faculty Mentor'] || ''),
                  industry_mentor: String(firstRow['Industry Mentor'] || ''),
                  session: String(firstRow['Session'] || ''),
                  year: String(firstRow['Year'] || ''),
                  semester: String(firstRow['Semester'] || ''),
                  faculty_coordinator: facultyCoordinator,
                  progress_form_url: String(firstRow['Progress Form'] || ''),
                  presentation_url: String(firstRow['Presentation'] || ''),
                  report_url: String(firstRow['Report'] || ''),
                };
                
                // Ensure each student has the required fields
                const students = rows.map(row => {
                  // Ensure Roll No exists and is not empty
                  const rollNo = String(row['Roll No'] || '').trim();
                  if (!rollNo) {
                    console.warn(`Missing Roll No in group ${groupNo}`, row);
                  }
                  
                  return {
                    roll_no: rollNo,
                    name: String(row['Name'] || '').trim(),
                    email: String(row['Email'] || '').trim(),
                    program: String(row['Program'] || '').trim(),
                  };
                }).filter(student => student.roll_no); // Filter out students without roll numbers
                
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
                console.error(`Error importing group ${groupNo}:`, error);
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
      
      reader.readAsBinaryString(file);
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
