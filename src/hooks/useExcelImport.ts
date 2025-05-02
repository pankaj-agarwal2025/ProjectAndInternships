
import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/use-toast';
import { processProjectsExcel, processInternshipsExcel } from '@/lib/supabase';

interface UseExcelImportProps {
  onDataReady: (data: any[]) => void;
  validateRow?: (row: any) => boolean;
  transformRow?: (row: any) => any;
  facultyCoordinator?: string;
  onClose?: () => void;
}

export function useExcelImport({ onDataReady, validateRow, transformRow, facultyCoordinator, onClose }: UseExcelImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to json
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Validate and transform data if needed
        const processedData = jsonData
          .filter(row => !validateRow || validateRow(row))
          .map(row => transformRow ? transformRow(row) : row);
        
        // Set preview data
        setPreviewData(processedData.slice(0, 5));
        
        // Pass data to parent
        onDataReady(processedData);
        
        toast({
          title: 'Excel file loaded',
          description: `${processedData.length} rows found for preview.`,
        });
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast({
          title: 'Error',
          description: 'Failed to parse Excel file. Please check the format.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to read Excel file.',
        variant: 'destructive',
      });
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  }, [onDataReady, toast, validateRow, transformRow]);

  const handleImport = useCallback(async () => {
    if (!file || !facultyCoordinator) {
      toast({
        title: 'No file selected or faculty coordinator missing',
        description: 'Please select an Excel file and ensure faculty coordinator is set.',
        variant: 'destructive',
      });
      return false;
    }
    
    setIsImporting(true);
    setImportProgress(10);
    
    try {
      // Process the data based on the current path
      const isProjectData = window.location.pathname.includes('project');
      
      if (isProjectData) {
        await processProjectsExcel(previewData, facultyCoordinator);
      } else {
        await processInternshipsExcel(previewData, facultyCoordinator);
      }
      
      setImportProgress(100);
      
      toast({
        title: 'Import Successful',
        description: `Data has been successfully imported.`,
      });
      
      // Close the modal after successful import
      if (onClose) {
        setTimeout(() => {
          onClose();
          setFile(null);
          setPreviewData([]);
          setImportProgress(0);
        }, 1500);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred while importing data. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsImporting(false);
    }
  }, [file, previewData, facultyCoordinator, toast, onClose]);

  return {
    isLoading,
    previewData,
    handleFileChange,
    handleImport,
    hasData: previewData.length > 0,
    file,
    isImporting,
    importProgress
  };
}

export default useExcelImport;
