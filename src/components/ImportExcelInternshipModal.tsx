
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { processInternshipsExcel } from '@/lib/supabase';
import { Loader2, Upload } from 'lucide-react';

interface ImportExcelInternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportExcelInternshipModal: React.FC<ImportExcelInternshipModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const [facultyData, setFacultyData] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  React.useEffect(() => {
    const storedFaculty = sessionStorage.getItem('faculty');
    if (storedFaculty) {
      setFacultyData(JSON.parse(storedFaculty));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Preview Excel data
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          try {
            const data = new Uint8Array(evt.target.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get the first worksheet
            const wsname = workbook.SheetNames[0];
            const ws = workbook.Sheets[wsname];
            
            // Convert array of arrays to array of objects
            const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });
            setPreviewData(jsonData.slice(0, 5)); // Preview first 5 rows
            console.log("Excel data preview:", jsonData.slice(0, 5));
          } catch (error) {
            console.error("Error previewing Excel file:", error);
            toast({
              title: 'Error',
              description: 'Failed to parse Excel file. Please check the format.',
              variant: 'destructive',
            });
          }
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select an Excel file to upload.',
        variant: 'destructive',
      });
      return;
    }

    if (!facultyData) {
      toast({
        title: 'Error',
        description: 'Faculty information not found. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const wsname = workbook.SheetNames[0];
          const ws = workbook.Sheets[wsname];
          
          // Convert array of arrays to array of objects with default empty values for missing cells
          const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });
          console.log("Excel data parsed:", jsonData);

          if (jsonData.length === 0) {
            throw new Error('Excel file is empty or has invalid format');
          }

          // Normalize column names to handle different header styles
          const normalizedData = jsonData.map(row => {
            const normalizedRow: Record<string, any> = {};
            
            // Map for common column name variations
            const columnMappings: Record<string, string[]> = {
              'roll_no': ['roll_no', 'Roll No', 'RollNo', 'Roll Number', 'Student Roll No', 'Roll_No'],
              'name': ['name', 'Name', 'Student Name', 'Full Name', 'Student_Name'],
              'email': ['email', 'Email', 'Student Email', 'Email Address', 'Student_Email'],
              'phone_no': ['phone_no', 'Phone No', 'Phone', 'Contact', 'Mobile', 'Phone_No'],
              'domain': ['domain', 'Domain', 'Field', 'Area'],
              'session': ['session', 'Session'],
              'year': ['year', 'Year'],
              'semester': ['semester', 'Semester'],
              'program': ['program', 'Program', 'Course'],
              'organization_name': ['organization_name', 'Organization', 'Organization Name', 'Company', 'Company Name', 'Organization_Name'],
              'starting_date': ['starting_date', 'Starting Date', 'Start Date', 'From Date', 'Starting_Date'],
              'ending_date': ['ending_date', 'Ending Date', 'End Date', 'To Date', 'Ending_Date'],
              'position': ['position', 'Position', 'Role', 'Designation'],
              'offer_letter_url': ['offer_letter_url', 'Offer Letter', 'Offer', 'Offer_Letter'],
              'noc_url': ['noc_url', 'NOC', 'No Objection Certificate'],
              'ppo_url': ['ppo_url', 'PPO', 'Pre Placement Offer'],
            };
            
            // Transform the input row to normalized column names
            Object.entries(columnMappings).forEach(([normalizedKey, variations]) => {
              for (const variation of variations) {
                if (Object.prototype.hasOwnProperty.call(row, variation)) {
                  normalizedRow[normalizedKey] = row[variation];
                  break;
                }
              }
              // If no match found, provide default value
              if (!Object.prototype.hasOwnProperty.call(normalizedRow, normalizedKey)) {
                normalizedRow[normalizedKey] = '';
              }
            });
            
            return normalizedRow;
          });

          console.log("Normalized data:", normalizedData);

          // Process and insert data into the database
          const result = await processInternshipsExcel(normalizedData, facultyData.name);

          if (result) {
            toast({
              title: 'Success',
              description: `Successfully imported ${result.length} internship records.`,
            });
            onClose();
            // Refresh the internship table
            window.location.reload();
          } else {
            throw new Error('Failed to process Excel data');
          }
        } catch (error) {
          console.error('Error processing Excel file:', error);
          toast({
            title: 'Error',
            description: 'Failed to process Excel file. Please check the format and try again.',
            variant: 'destructive',
          });
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to read the Excel file.',
          variant: 'destructive',
        });
        setIsUploading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Internships from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file with internship data. The file should have columns for name, email, roll number, etc.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center gap-4">
            <Label htmlFor="excel-file">
              Excel File
            </Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
            <p className="text-xs text-gray-500">
              Required columns: Roll No, Name, Email, Program, Organization Name. Other columns are optional.
            </p>
          </div>
          
          {previewData && previewData.length > 0 && (
            <div className="space-y-2">
              <Label>Data Preview (First 5 rows)</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                <pre className="text-xs">{JSON.stringify(previewData, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !file || !facultyData?.name}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExcelInternshipModal;
