import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addProject } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import { Loader2, Upload } from 'lucide-react';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportExcelModal: React.FC<ImportExcelModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [session, setSession] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [facultyCoordinator, setFacultyCoordinator] = useState('');
  const [minStudents, setMinStudents] = useState(1);
  const [maxStudents, setMaxStudents] = useState(4);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const { toast } = useToast();
  
  // Faculty coordinators list
  const facultyCoordinators = [
    'dr.pankaj', 'dr.anshu', 'dr.meenu', 'dr.swati'
  ];
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Preview Excel data
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          setPreviewData(jsonData.slice(0, 5)); // Preview first 5 rows
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };
  
  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select an Excel file to import.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!session || !year || !semester || !facultyCoordinator) {
      toast({
        title: 'Missing Filters',
        description: 'Please fill in all filter fields.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (evt) => {
        if (evt.target?.result) {
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
          
          // Process the data
          // Group students by group number
          const groupedData: Record<string, any[]> = {};
          
          for (const row of jsonData) {
            const groupNo = row['Group No'] || '';
            
            if (!groupNo) {
              console.error('Row missing Group No:', row);
              continue;
            }
            
            if (!groupedData[groupNo]) {
              groupedData[groupNo] = [];
            }
            
            groupedData[groupNo].push(row);
          }
          
          // Import each group
          let successCount = 0;
          let errorCount = 0;
          
          for (const [groupNo, rows] of Object.entries(groupedData)) {
            try {
              if (rows.length < minStudents || rows.length > maxStudents) {
                console.warn(`Group ${groupNo} has ${rows.length} students, outside the range of ${minStudents}-${maxStudents}.`);
                errorCount++;
                continue;
              }
              
              // Extract group data from first row
              const firstRow = rows[0];
              
              const projectData = {
                group_no: groupNo,
                title: firstRow['Title'] || '',
                domain: firstRow['Domain'] || '',
                faculty_mentor: firstRow['Faculty Mentor'] || '',
                industry_mentor: firstRow['Industry Mentor'] || '',
                session: session,
                year: year,
                semester: semester,
                faculty_coordinator: facultyCoordinator,
                progress_form_url: firstRow['Progress Form'] || '',
                presentation_url: firstRow['Presentation'] || '',
                report_url: firstRow['Report'] || '',
              };
              
              // Extract student data
              const students = rows.map(row => ({
                roll_no: row['Roll No'] || '',
                name: row['Name'] || '',
                email: row['Email'] || '',
                program: row['Program'] || '',
              }));
              
              // Add the project
              const result = await addProject(projectData, students);
              
              if (result) {
                successCount++;
              } else {
                errorCount++;
              }
            } catch (error) {
              console.error(`Error importing group ${groupNo}:`, error);
              errorCount++;
            }
          }
          
          // Show results
          if (successCount > 0) {
            toast({
              title: 'Import Successful',
              description: `Successfully imported ${successCount} groups.${errorCount > 0 ? ` Failed to import ${errorCount} groups.` : ''}`,
            });
            onClose();
          } else {
            toast({
              title: 'Import Failed',
              description: 'Failed to import any groups. Please check the Excel format and try again.',
              variant: 'destructive',
            });
          }
        }
      };
      
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Error',
        description: 'An error occurred during import. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleClose = () => {
    setFile(null);
    setPreviewData(null);
    setSession('');
    setYear('');
    setSemester('');
    setFacultyCoordinator('');
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
        
        <div className="space-y-6">
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
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-students">Minimum Students per Group</Label>
              <Input
                id="min-students"
                type="number"
                min={1}
                max={10}
                value={minStudents}
                onChange={(e) => setMinStudents(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-students">Maximum Students per Group</Label>
              <Input
                id="max-students"
                type="number"
                min={minStudents}
                max={10}
                value={maxStudents}
                onChange={(e) => setMaxStudents(Number(e.target.value))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="import-session">Session</Label>
              <Input
                id="import-session"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-year">Year</Label>
              <Input
                id="import-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-semester">Semester</Label>
              <Input
                id="import-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-faculty-coordinator">Faculty Coordinator</Label>
              <Select value={facultyCoordinator} onValueChange={setFacultyCoordinator}>
                <SelectTrigger id="import-faculty-coordinator">
                  <SelectValue placeholder="Select coordinator" />
                </SelectTrigger>
                <SelectContent>
                  {facultyCoordinators.map((fc) => (
                    <SelectItem key={fc} value={fc}>{fc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {previewData && previewData.length > 0 && (
            <div className="space-y-2">
              <Label>Data Preview (First 5 rows)</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
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
              disabled={isImporting || !file || !session || !year || !semester || !facultyCoordinator}
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
