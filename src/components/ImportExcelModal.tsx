
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload } from 'lucide-react';
import ImportFilters from './excel-import/ImportFilters';
import useExcelImport from '@/hooks/useExcelImport';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportExcelModal: React.FC<ImportExcelModalProps> = ({ isOpen, onClose }) => {
  const [minStudents, setMinStudents] = useState(1);
  const [maxStudents, setMaxStudents] = useState(4);
  const [facultyData, setFacultyData] = useState<any>(null);
  const [excelData, setExcelData] = useState<any[]>([]);

  React.useEffect(() => {
    const storedFaculty = sessionStorage.getItem('faculty');
    if (storedFaculty) {
      setFacultyData(JSON.parse(storedFaculty));
    }
  }, []);

  const {
    isLoading,
    previewData,
    handleFileChange,
    handleImport,
    hasData,
    file,
    isImporting,
    importProgress
  } = useExcelImport({
    onDataReady: setExcelData,
    facultyCoordinator: facultyData?.name || '',
    onClose
  });

  const handleClose = () => {
    setMinStudents(1);
    setMaxStudents(4);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Projects from Excel</DialogTitle>
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
              Excel file should contain columns: Group No, Roll No, Name, Email, Program, Title, Domain, Faculty Mentor, Industry Mentor, and optional file URLs. 
              <br />
              For evaluations, include: initial_clarity_objectives, initial_background_feasibility, initial_usability_applications, initial_innovation_novelty, progress_data_extraction, progress_methodology, progress_implementation, progress_code_optimization, progress_user_interface, final_implementation, final_results, final_research_paper, final_project_completion.
            </p>
          </div>
          
          <ImportFilters
            minStudents={minStudents}
            maxStudents={maxStudents}
            onMinStudentsChange={setMinStudents}
            onMaxStudentsChange={setMaxStudents}
          />
          
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
            <Button variant="outline" onClick={handleClose}>
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

export default ImportExcelModal;
