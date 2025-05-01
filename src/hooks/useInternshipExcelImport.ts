
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { processInternshipsExcel } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export function useInternshipExcelImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const { toast } = useToast();

  const handleExcelImport = async (file: File, facultyCoordinator: string) => {
    if (!file) return;
    
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
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setImportProgress(50);
      
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('No data found in the Excel file.');
      }
      
      // Process the data
      console.log('Processing Excel data for internships:', jsonData);
      
      setImportProgress(70);
      
      // Send to server
      const result = await processInternshipsExcel(jsonData, facultyCoordinator);
      
      setImportProgress(100);
      
      if (result) {
        toast({
          title: 'Import Complete',
          description: `Successfully processed ${jsonData.length} internships from Excel.`,
        });
        return true;
      }
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
    handleExcelImport,
    isImporting,
    importProgress
  };
}

export default useInternshipExcelImport;
