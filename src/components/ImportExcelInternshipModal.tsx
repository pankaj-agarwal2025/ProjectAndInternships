
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload } from 'lucide-react';
import useInternshipExcelImport from '@/hooks/useInternshipExcelImport';

interface ImportExcelInternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportExcelInternshipModal: React.FC<ImportExcelInternshipModalProps> = ({ isOpen, onClose }) => {
  const [facultyData, setFacultyData] = useState<any>(null);

  useEffect(() => {
    const storedFaculty = sessionStorage.getItem('faculty');
    if (storedFaculty) {
      setFacultyData(JSON.parse(storedFaculty));
    }
  }, []);

  const {
    file,
    isImporting,
    importProgress,
    previewData,
    handleFileChange,
    handleImport,
  } = useInternshipExcelImport({
    facultyCoordinator: facultyData?.name || '',
    onClose,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Internships from Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 max-h-[70vh] overflow-y-auto py-2">
          <div className="space-y-2">
            <Label htmlFor="excel-file">Upload Excel File</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Excel file should contain columns: Roll No, Name, Email, Phone No, Domain, Session, Year, Semester, Program, Organization Name, Position, Starting Date, Ending Date, Stipend.
            </p>
          </div>
          
          {isImporting && (
            <div className="space-y-2">
              <Label>Import Progress</Label>
              <Progress value={importProgress} className="h-2" />
            </div>
          )}
          
          {previewData && previewData.length > 0 && (
            <div className="space-y-2">
              <Label>Data Preview (First 5 rows)</Label>
              <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                <pre className="text-xs">{JSON.stringify(previewData, null, 2)}</pre>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={isImporting || !file || !facultyData?.name}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExcelInternshipModal;
