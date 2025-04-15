
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
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          setPreviewData(jsonData.slice(0, 5)); // Preview first 5 rows
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
    
    setIsImporting(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (evt) => {
        if (evt.target?.result) {
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
          
          // Process the data
          // Group students by group number
          const groupedData: Record<string, any[]> = {};
          
          for (const row of jsonData) {
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
          
          // Import each group
          let successCount = 0;
          let errorCount = 0;
          
          for (const [groupNo, rows] of Object.entries(groupedData)) {
            try {
              if (rows.length < 1 || rows.length > 4) {
                console.warn(`Group ${groupNo} has ${rows.length} students, outside the range of 1-4.`);
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
              
              const students = rows.map(row => ({
                roll_no: String(row['Roll No'] || row['Student Roll No'] || '').trim(),
                name: String(row['Name'] || row['Student Name'] || '').trim(),
                email: String(row['Email'] || row['Student Email'] || '').trim(),
                program: String(row['Program'] || row['Student Program'] || '').trim(),
              }));
              
              const result = await addProject(projectData, students);
              
              if (result) {
                successCount++;
              } else {
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
          } else {
            toast({
              title: 'Import Failed',
              description: 'Failed to import any groups. Please check the Excel format and try again.',
              variant: 'destructive',
            });
          }
        }
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
