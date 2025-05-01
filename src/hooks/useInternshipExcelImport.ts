
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { processInternshipsExcel } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface UseInternshipExcelImportProps {
  facultyCoordinator: string;
  onClose: () => void;
}

const useInternshipExcelImport = ({ facultyCoordinator, onClose }: UseInternshipExcelImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      
      // Preview the Excel data
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const binaryString = evt.target?.result;
          const workbook = XLSX.read(binaryString, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          setPreviewData(jsonData.slice(0, 5)); // Show only first 5 rows as preview
        } catch (error) {
          console.error('Error reading Excel file:', error);
          toast({
            title: 'Error',
            description: 'Failed to read Excel file. Please ensure it is a valid Excel file.',
            variant: 'destructive',
          });
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const processExcelData = (jsonData: any[]) => {
    // Convert Excel data to structured internship data
    const internships = jsonData.map(row => ({
      roll_no: row['Roll No'] || '',
      name: row['Name'] || '',
      email: row['Email'],
      phone_no: row['Phone No'],
      domain: row['Domain'],
      session: row['Session'],
      year: row['Year'],
      semester: row['Semester'],
      program: row['Program'],
      organization_name: row['Organization Name'] || '',
      position: row['Position'] || '',
      starting_date: row['Starting Date'],
      ending_date: row['Ending Date'],
      faculty_coordinator: facultyCoordinator
    }));
    
    return internships;
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
        title: 'Missing Faculty Information',
        description: 'Faculty information is required for import.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const binaryString = evt.target?.result;
          const workbook = XLSX.read(binaryString, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Process the data
          const processedData = processExcelData(jsonData);
          
          // Save to database
          await processInternshipsExcel(processedData, facultyCoordinator);
          
          toast({
            title: 'Import Successful',
            description: `Successfully imported ${processedData.length} internships.`,
          });
          
          onClose();
        } catch (error) {
          console.error('Error processing Excel data:', error);
          toast({
            title: 'Import Error',
            description: 'Failed to process Excel data. Please check the file format.',
            variant: 'destructive',
          });
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'Import Error',
        description: 'Failed to read the Excel file.',
        variant: 'destructive',
      });
      setIsImporting(false);
    }
  };

  return {
    file,
    previewData,
    isImporting,
    handleFileChange,
    handleImport
  };
};

export default useInternshipExcelImport;
