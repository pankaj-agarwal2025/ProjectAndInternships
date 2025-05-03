
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { processInternshipsExcel } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export function useInternshipExcelImport({ facultyCoordinator, onClose }: { facultyCoordinator: string; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    try {
      // Read the Excel file to preview
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON with default values for empty cells
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: null,  // Set default value for empty cells
        raw: false     // Convert to appropriate types
      });
      
      // Validate required fields
      const validData = jsonData.filter((row: any) => {
        return row['roll_no'] && row['name'];
      });
      
      if (validData.length === 0) {
        toast({
          title: 'Invalid data',
          description: 'Excel file must have columns: "roll_no" and "name"',
          variant: 'destructive'
        });
        setFile(null);
        return;
      }
      
      // Only show first 5 rows for preview
      setPreviewData(validData.slice(0, 5));
    } catch (error) {
      console.error('Error previewing Excel:', error);
      toast({
        title: 'Preview Failed',
        description: error instanceof Error ? error.message : 'An error occurred previewing the file.',
        variant: 'destructive',
      });
      setFile(null);
    }
  };
  
  const handleImport = async () => {
    if (!file || !facultyCoordinator) {
      toast({
        title: 'Import Failed',
        description: 'Missing required information for import.',
        variant: 'destructive',
      });
      return false;
    }
    
    setIsImporting(true);
    setImportProgress(10);
    
    try {
      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      setImportProgress(30);
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON with null for empty cells
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: null,
        raw: false
      });
      
      setImportProgress(50);
      
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('No data found in the Excel file.');
      }
      
      // Filter out rows without required fields
      const filteredData = jsonData.filter((row: any) => {
        return row.roll_no && row.name;
      });
      
      if (filteredData.length === 0) {
        throw new Error('No valid data found. Each row must have at least roll_no and name.');
      }
      
      // Process the data
      console.log('Processing Excel data for internships:', filteredData);
      
      setImportProgress(70);
      
      // Send to server
      const result = await processInternshipsExcel(filteredData, facultyCoordinator);
      
      setImportProgress(100);
      
      if (result) {
        toast({
          title: 'Import Complete',
          description: `Successfully processed ${filteredData.length} internships from Excel.`,
        });
        onClose();
        // Trigger refresh of data
        window.dispatchEvent(new CustomEvent('refresh-internship-data'));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'An error occurred during import.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    file,
    isImporting,
    importProgress,
    previewData,
    handleFileChange,
    handleImport,
  };
}

export default useInternshipExcelImport;
