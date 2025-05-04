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

  // Define column name mappings for flexibility
  const columnMappings: Record<string, string[]> = {
    'roll_no': ['roll_no', 'roll no', 'rollno', 'student id', 'id', 'student roll no'],
    'name': ['name', 'student name', 'full name'],
    'email': ['email', 'email address', 'student email'],
    'phone_no': ['phone_no', 'phone no', 'mobile', 'contact', 'phone number'],
    'domain': ['domain', 'field', 'area'],
    'organization_name': ['organization_name', 'organization name', 'company', 'company name', 'org name'],
    'position': ['position', 'title', 'role'],
    'stipend': ['stipend', 'salary', 'payment'],
    'starting_date': ['starting_date', 'starting date', 'start date', 'from date'],
    'ending_date': ['ending_date', 'ending date', 'end date', 'to date'],
    'session': ['session'],
    'year': ['year'],
    'semester': ['semester'],
    'program': ['program', 'course', 'degree']
  };

  // Helper function to normalize column names
  const normalizeColumnName = (name: string): string => {
    return name.toString().trim().toLowerCase().replace(/\s+/g, '_');
  };

  // Helper function to find the standardized key for a given column name
  const findStandardKey = (columnName: string): string | null => {
    const normalized = normalizeColumnName(columnName);
    
    for (const [standardKey, variations] of Object.entries(columnMappings)) {
      if (variations.some(v => normalizeColumnName(v) === normalized)) {
        return standardKey;
      }
    }
    
    return null;
  };

  // Helper function to map Excel data to our expected format
  const mapRowData = (row: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {};
    
    // Go through each original column in the row
    for (const [originalColumn, value] of Object.entries(row)) {
      const standardKey = findStandardKey(originalColumn);
      if (standardKey) {
        result[standardKey] = value;
      } else {
        // Keep original column name if no mapping found
        result[normalizeColumnName(originalColumn)] = value;
      }
    }
    
    // Ensure required fields are present
    if (!result.roll_no && result.id) result.roll_no = result.id;
    if (!result.name && result.student_name) result.name = result.student_name;
    
    return result;
  };

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
      
      // Map the data using our flexible column mappings
      const mappedData = jsonData.map(mapRowData);
      
      // Check if we have the required columns after mapping
      const hasRequiredFields = mappedData.some(row => row.roll_no && row.name);
      
      if (!hasRequiredFields) {
        toast({
          title: 'Data format issue',
          description: 'The Excel file must contain columns that can be mapped to "roll_no" and "name". Common variations like "Roll No", "Student ID", "Full Name", etc. are accepted.',
          variant: 'destructive'
        });
        setFile(null);
        return;
      }
      
      // Only show first 5 rows for preview
      setPreviewData(mappedData.slice(0, 5));
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
      
      // Map the data using our flexible column mappings
      const mappedData = jsonData.map(mapRowData);
      
      // Filter out rows without required fields
      const filteredData = mappedData.filter((row) => {
        return row.roll_no && row.name;
      });
      
      if (filteredData.length === 0) {
        throw new Error('No valid data found. Each row must have information that can be mapped to roll number and name.');
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
