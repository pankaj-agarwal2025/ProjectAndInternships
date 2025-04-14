
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { processInternshipsExcel } from '@/lib/supabase';
import { FileSpreadsheet, Upload } from 'lucide-react';

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

  React.useEffect(() => {
    const storedFaculty = sessionStorage.getItem('faculty');
    if (storedFaculty) {
      setFacultyData(JSON.parse(storedFaculty));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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
          
          // Convert array of arrays to array of objects
          const jsonData = XLSX.utils.sheet_to_json(ws);

          if (jsonData.length === 0) {
            throw new Error('Excel file is empty or has invalid format');
          }

          // Process and insert data into the database
          const result = await processInternshipsExcel(jsonData, facultyData.name);

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Internships from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file with internship data. The file should have columns for name, email, roll number, etc.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="excel-file" className="text-right">
              Excel File
            </Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4 animate-spin" />
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
