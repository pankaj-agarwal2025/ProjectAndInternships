
import React, { useRef, useState } from 'react';
import { useExcelImport } from '@/hooks/useExcelImport';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { importExcelFile, isImporting, importProgress, importError } = useExcelImport({ 
    tableName: 'projects',
    minStudents: 1,
    maxStudents: 4
  });
  const { toast } = useToast();
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: 'Invalid file format',
          description: 'Please upload an Excel file (.xlsx or .xls)',
          variant: 'destructive',
        });
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  const handleImportClick = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select an Excel file to import.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const result = await importExcelFile(selectedFile);
      
      if (result.success) {
        toast({
          title: 'Import successful',
          description: result.message,
        });
        
        // Refresh the projects list
        window.dispatchEvent(new Event('refresh-projects-data'));
        
        // Close the modal after a short delay
        setTimeout(() => {
          onClose();
          // Reset the file input and selected file
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 1500);
      } else {
        toast({
          title: 'Import failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during import:', error);
      toast({
        title: 'Import error',
        description: 'An unexpected error occurred during import.',
        variant: 'destructive',
      });
    }
  };
  
  const handleClose = () => {
    if (!isImporting) {
      onClose();
      // Reset the file input and selected file
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Projects from Excel</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Upload an Excel file (.xlsx or .xls)
              </p>
              <p className="text-xs text-gray-500 mb-4">
                The Excel file should contain columns: Group No, Title, Domain, etc.
              </p>
              
              <div className="flex flex-col gap-4 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isImporting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select File
                </Button>
                
                {selectedFile && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium break-all">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(selectedFile.size / 1024)} KB
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {importError && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                <p className="text-sm font-medium">Error</p>
                <p className="text-xs">{importError}</p>
              </div>
            )}
            
            {isImporting && (
              <div className="space-y-2">
                <Progress value={importProgress} className="w-full h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  Importing... {importProgress}%
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="font-medium">Format Guidelines:</h3>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>The first row should contain column headers.</li>
                <li>Required columns: "Group No", "Title".</li>
                <li>Student columns should be named: "Student 1 Roll No", "Student 1 Name", etc.</li>
                <li>Each project must have at least one student.</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImportClick} disabled={!selectedFile || isImporting}>
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExcelModal;
