
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/use-toast';
import { processProjectsExcel } from '@/lib/supabase';

export interface UseExcelImportProps {
  onDataReady: (data: any[]) => void;
  facultyCoordinator: string;
  onClose: () => void;
}

const useExcelImport = ({ onDataReady, facultyCoordinator, onClose }: UseExcelImportProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsLoading(true);
    setFile(selectedFile);
    
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const binaryStr = evt.target?.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (data.length === 0) {
          toast({
            title: 'Error',
            description: 'The Excel file is empty or has no valid data.',
            variant: 'destructive',
          });
          setIsLoading(false);
          setHasData(false);
          return;
        }
        
        // Show preview of first 5 rows
        const preview = data.slice(0, 5);
        setPreviewData(preview);
        setHasData(true);
        onDataReady(data);
        
        toast({
          title: 'File loaded',
          description: `Loaded ${data.length} rows from Excel file.`,
        });
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast({
          title: 'Error',
          description: 'Failed to parse the Excel file. Please check the file format.',
          variant: 'destructive',
        });
        setHasData(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to read the Excel file.',
        variant: 'destructive',
      });
      setIsLoading(false);
      setHasData(false);
    };
    
    reader.readAsBinaryString(selectedFile);
  };

  const handleImport = async () => {
    if (!hasData || !file) {
      toast({
        title: 'Error',
        description: 'No data to import.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!facultyCoordinator) {
      toast({
        title: 'Error',
        description: 'Faculty coordinator information is missing.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsImporting(true);
    setImportProgress(10);
    
    try {
      // Process Excel data
      setImportProgress(30);
      
      const reader = new FileReader();
      
      reader.onload = async (evt) => {
        try {
          const binaryStr = evt.target?.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          setImportProgress(50);
          
          // Process and insert data
          await processProjectsExcel(data, facultyCoordinator);
          
          setImportProgress(100);
          
          toast({
            title: 'Import successful',
            description: `Successfully imported ${data.length} projects.`,
          });
          
          // Trigger data refresh in parent component
          window.dispatchEvent(new CustomEvent('refresh-project-data'));
          
          // Close modal
          onClose();
        } catch (error) {
          console.error('Error processing Excel data:', error);
          toast({
            title: 'Import failed',
            description: 'Failed to import data. Please check the Excel file format.',
            variant: 'destructive',
          });
        } finally {
          setIsImporting(false);
          setImportProgress(0);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to read the Excel file.',
          variant: 'destructive',
        });
        setIsImporting(false);
        setImportProgress(0);
      };
      
      reader.readAsBinaryString(file);
      
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: 'Import failed',
        description: 'Failed to import data. Please try again.',
        variant: 'destructive',
      });
      setIsImporting(false);
      setImportProgress(0);
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
