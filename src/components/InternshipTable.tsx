
import React, { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import * as XLSX from 'xlsx';
import { Download, Edit, Trash2, Plus, File, Upload, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { supabase, Internship, getInternships, addInternship, updateInternship, deleteInternship, uploadFile, addInternshipDynamicColumn, getInternshipDynamicColumns, addInternshipDynamicColumnValue, getInternshipDynamicColumnValues, formatDateForDisplay, parseDisplayDate } from '@/lib/supabase';

// Programs and Faculty Coordinator options
const programOptions = [
  'BSc CS', 'BSc DS', 'BSc Cyber', 'BCA', 'BCA AI/DS', 
  'BTech CSE', 'BTech FSD', 'BTech UI/UX', 'BTech AI/ML'
];

const facultyCoordinatorOptions = [
  'Dr. Pankaj', 'Dr. Anshu', 'Dr. Meenu', 'Dr. Swati'
];

interface InternshipTableProps {
  filters: Record<string, any>;
}

const InternshipTable: React.FC<InternshipTableProps> = ({ filters }) => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
  const [isNewColumnDialogOpen, setIsNewColumnDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [dynamicColumns, setDynamicColumns] = useState<any[]>([]);
  const [dynamicColumnValues, setDynamicColumnValues] = useState<Record<string, Record<string, any>>>({});
  const [newInternship, setNewInternship] = useState<Partial<Internship>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importFilters, setImportFilters] = useState<Record<string, string>>({
    faculty_coordinator: ''
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Calendar state for date pickers
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [displayStartDate, setDisplayStartDate] = useState('');
  const [displayEndDate, setDisplayEndDate] = useState('');

  // Load internships and dynamic columns
  useEffect(() => {
    fetchInternships();
    fetchDynamicColumns();
  }, [filters, currentPage, itemsPerPage]);

  const fetchInternships = async () => {
    setLoading(true);
    const fetchedInternships = await getInternships(filters);
    
    // Pagination calculation
    setTotalPages(Math.ceil(fetchedInternships.length / itemsPerPage));
    
    // Get current page data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedInternships = fetchedInternships.slice(startIndex, startIndex + itemsPerPage);
    
    setInternships(paginatedInternships);
    
    // Fetch dynamic column values for each internship
    const valuesByInternship: Record<string, Record<string, any>> = {};
    
    for (const internship of paginatedInternships) {
      const values = await getInternshipDynamicColumnValues(internship.id);
      const valueMap: Record<string, any> = {};
      
      values.forEach(value => {
        valueMap[value.column_id] = value.value;
      });
      
      valuesByInternship[internship.id] = valueMap;
    }
    
    setDynamicColumnValues(valuesByInternship);
    setLoading(false);
  };

  const fetchDynamicColumns = async () => {
    const columns = await getInternshipDynamicColumns();
    setDynamicColumns(columns);
  };

  // Handle editing internship
  const handleEdit = (internship: Internship) => {
    setEditingInternship(internship);
    setDisplayStartDate(formatDateForDisplay(internship.starting_date));
    setDisplayEndDate(formatDateForDisplay(internship.ending_date));
  };

  // Handle saving edits
  const handleSaveEdit = async () => {
    if (!editingInternship) return;
    
    try {
      // Prepare updates with properly formatted dates
      const updates: Partial<Internship> = {
        ...editingInternship
      };
      
      // Convert display dates back to ISO format
      if (displayStartDate) {
        updates.starting_date = parseDisplayDate(displayStartDate);
      }
      
      if (displayEndDate) {
        updates.ending_date = parseDisplayDate(displayEndDate);
      }
      
      const updatedInternship = await updateInternship(editingInternship.id, updates);
      
      if (updatedInternship) {
        // Update dynamic column values
        if (dynamicColumns.length > 0) {
          const internshipValues = dynamicColumnValues[editingInternship.id] || {};
          
          for (const column of dynamicColumns) {
            const value = internshipValues[column.id];
            if (value !== undefined) {
              await addInternshipDynamicColumnValue(column.id, editingInternship.id, value);
            }
          }
        }
        
        toast({
          title: 'Internship Updated',
          description: 'The internship has been successfully updated.',
        });
        
        fetchInternships();
      }
    } catch (error) {
      console.error('Error saving internship:', error);
      toast({
        title: 'Update Failed',
        description: 'There was an error updating the internship.',
        variant: 'destructive',
      });
    }
    
    setEditingInternship(null);
  };

  // Handle deleting internship
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this internship?')) {
      const success = await deleteInternship(id);
      
      if (success) {
        toast({
          title: 'Internship Deleted',
          description: 'The internship has been successfully deleted.',
        });
        
        fetchInternships();
      } else {
        toast({
          title: 'Delete Failed',
          description: 'There was an error deleting the internship.',
          variant: 'destructive',
        });
      }
    }
  };

  // Handle adding new dynamic column
  const handleAddColumn = async () => {
    if (!newColumnName) {
      toast({
        title: 'Error',
        description: 'Please provide a column name.',
        variant: 'destructive',
      });
      return;
    }
    
    const column = await addInternshipDynamicColumn(newColumnName, newColumnType);
    
    if (column) {
      toast({
        title: 'Column Added',
        description: `The column "${newColumnName}" has been added successfully.`,
      });
      
      fetchDynamicColumns();
      setNewColumnName('');
      setNewColumnType('text');
      setIsNewColumnDialogOpen(false);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to add new column.',
        variant: 'destructive',
      });
    }
  };

  // Handle file upload for a specific internship
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, internshipId: string, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const filePath = `internships/${internshipId}/${fieldName}/${file.name}`;
      const fileUrl = await uploadFile(file, 'documents', filePath);
      
      if (fileUrl) {
        const updates: Partial<Record<string, string>> = {};
        updates[`${fieldName}_url`] = fileUrl;
        
        const success = await updateInternship(internshipId, updates as Partial<Internship>);
        
        if (success) {
          toast({
            title: 'File Uploaded',
            description: 'The file has been uploaded successfully.',
          });
          
          fetchInternships();
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading the file.',
        variant: 'destructive',
      });
    }
  };

  // Handle Excel file import
  const handleExcelImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!importFilters.faculty_coordinator) {
      toast({
        title: 'Error',
        description: 'Please select a Faculty Coordinator for the imported data.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        // Process and insert data
        const result = await supabase.from('internships').insert(
          jsonData.map((row: any) => ({
            roll_no: row['Roll No'] || '',
            name: row['Name'] || '',
            email: row['Email'] || '',
            phone_no: row['Phone No'] || '',
            domain: row['Domain'] || '',
            session: row['Session'] || '',
            year: row['Year'] || '',
            semester: row['Semester'] || '',
            program: row['Program'] || '',
            organization_name: row['Organization Name'] || '',
            starting_date: row['Starting Date'] || null,
            ending_date: row['Ending Date'] || null,
            position: row['Position'] || '',
            faculty_coordinator: importFilters.faculty_coordinator
          }))
        );
        
        if (result.error) {
          throw result.error;
        }
        
        toast({
          title: 'Import Successful',
          description: `${jsonData.length} records have been imported.`,
        });
        
        setIsImportDialogOpen(false);
        setSelectedFile(null);
        fetchInternships();
      };
      
      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error('Error importing Excel file:', error);
      toast({
        title: 'Import Failed',
        description: 'There was an error importing the Excel file.',
        variant: 'destructive',
      });
    }
  };

  // Handle Excel export
  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = internships.map(internship => {
        const rowData: Record<string, any> = {
          'Roll No': internship.roll_no,
          'Name': internship.name,
          'Email': internship.email,
          'Phone No': internship.phone_no,
          'Domain': internship.domain,
          'Program': internship.program,
          'Session': internship.session,
          'Year': internship.year,
          'Semester': internship.semester,
          'Organization Name': internship.organization_name,
          'Starting Date': formatDateForDisplay(internship.starting_date),
          'Ending Date': formatDateForDisplay(internship.ending_date),
          'Internship Duration': internship.internship_duration,
          'Position': internship.position,
          'Faculty Coordinator': internship.faculty_coordinator
        };
        
        // Add dynamic columns
        dynamicColumns.forEach(column => {
          const values = dynamicColumnValues[internship.id] || {};
          rowData[column.name] = values[column.id] || '';
        });
        
        return rowData;
      });
      
      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Internships');
      
      // Generate Excel file
      XLSX.writeFile(workbook, 'InternshipData.xlsx');
      
      toast({
        title: 'Export Successful',
        description: 'The internship data has been exported to Excel.',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting the data to Excel.',
        variant: 'destructive',
      });
    }
  };

  // Handle adding new internship
  const handleAddInternship = async () => {
    try {
      if (!newInternship.roll_no || !newInternship.name) {
        toast({
          title: 'Error',
          description: 'Roll No and Name are required fields.',
          variant: 'destructive',
        });
        return;
      }
      
      // Convert dates to ISO format
      let startDateISO = '';
      let endDateISO = '';
      
      if (displayStartDate) {
        startDateISO = parseDisplayDate(displayStartDate);
      }
      
      if (displayEndDate) {
        endDateISO = parseDisplayDate(displayEndDate);
      }
      
      const internshipData = {
        ...newInternship,
        starting_date: startDateISO,
        ending_date: endDateISO
      };
      
      const addedInternship = await addInternship(internshipData as Omit<Internship, 'id' | 'created_at' | 'updated_at' | 'internship_duration'>);
      
      if (addedInternship) {
        toast({
          title: 'Internship Added',
          description: 'The internship has been added successfully.',
        });
        
        setIsAddDialogOpen(false);
        setNewInternship({});
        setDisplayStartDate('');
        setDisplayEndDate('');
        fetchInternships();
      } else {
        throw new Error('Failed to add internship');
      }
    } catch (error) {
      console.error('Error adding internship:', error);
      toast({
        title: 'Error',
        description: 'Failed to add new internship.',
        variant: 'destructive',
      });
    }
  };

  // Handle editing cell value
  const handleCellEdit = (internshipId: string, field: string, value: string) => {
    setInternships(prevInternships => 
      prevInternships.map(internship => 
        internship.id === internshipId ? { ...internship, [field]: value } : internship
      )
    );
  };

  // Handle editing dynamic column value
  const handleDynamicCellEdit = (internshipId: string, columnId: string, value: string) => {
    setDynamicColumnValues(prev => ({
      ...prev,
      [internshipId]: {
        ...(prev[internshipId] || {}),
        [columnId]: value
      }
    }));
  };

  // Format date for display
  const displayDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return formatDateForDisplay(dateString);
    } catch (error) {
      return dateString;
    }
  };

  // Generate page buttons
  const pageButtons = [];
  for (let i = 1; i <= totalPages; i++) {
    pageButtons.push(
      <PaginationItem key={i}>
        <PaginationLink
          onClick={() => setCurrentPage(i)}
          isActive={currentPage === i}
        >
          {i}
        </PaginationLink>
      </PaginationItem>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Internships</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage student internship data
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => setIsNewColumnDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Column
          </Button>
          
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </Button>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Internship
          </Button>
        </div>
      </div>
      
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone No</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Duration (Days)</TableHead>
              <TableHead>Faculty Coordinator</TableHead>
              <TableHead>Offer Letter</TableHead>
              <TableHead>NOC</TableHead>
              <TableHead>PPO</TableHead>
              {dynamicColumns.map(column => (
                <TableHead key={column.id}>{column.name}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={20 + dynamicColumns.length} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Loading internship data...</p>
                </TableCell>
              </TableRow>
            ) : internships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={20 + dynamicColumns.length} className="text-center py-10">
                  <p>No internships found. Add a new internship or import from Excel.</p>
                </TableCell>
              </TableRow>
            ) : (
              internships.map(internship => (
                <TableRow key={internship.id}>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        value={editingInternship.roll_no} 
                        onChange={e => setEditingInternship({...editingInternship, roll_no: e.target.value})}
                      />
                    ) : (
                      internship.roll_no
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        value={editingInternship.name} 
                        onChange={e => setEditingInternship({...editingInternship, name: e.target.value})}
                      />
                    ) : (
                      internship.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        value={editingInternship.email || ''} 
                        onChange={e => setEditingInternship({...editingInternship, email: e.target.value})}
                      />
                    ) : (
                      internship.email
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        value={editingInternship.phone_no || ''} 
                        onChange={e => setEditingInternship({...editingInternship, phone_no: e.target.value})}
                      />
                    ) : (
                      internship.phone_no
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Select 
                        value={editingInternship.program || ''} 
                        onValueChange={value => setEditingInternship({...editingInternship, program: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          {programOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      internship.program
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        value={editingInternship.domain || ''} 
                        onChange={e => setEditingInternship({...editingInternship, domain: e.target.value})}
                      />
                    ) : (
                      internship.domain
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        value={editingInternship.session || ''} 
                        onChange={e => setEditingInternship({...editingInternship, session: e.target.value})}
                      />
                    ) : (
                      internship.session
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        value={editingInternship.year || ''} 
                        onChange={e => setEditingInternship({...editingInternship, year: e.target.value})}
                      />
                    ) : (
                      internship.year
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        value={editingInternship.semester || ''} 
                        onChange={e => setEditingInternship({...editingInternship, semester: e.target.value})}
                      />
                    ) : (
                      internship.semester
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        value={editingInternship.organization_name || ''} 
                        onChange={e => setEditingInternship({...editingInternship, organization_name: e.target.value})}
                      />
                    ) : (
                      internship.organization_name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        value={editingInternship.position || ''} 
                        onChange={e => setEditingInternship({...editingInternship, position: e.target.value})}
                      />
                    ) : (
                      internship.position
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {displayStartDate || 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={displayStartDate ? new Date(parseDisplayDate(displayStartDate)) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formatted = format(date, 'dd-MM-yyyy');
                                setDisplayStartDate(formatted);
                              }
                              setIsStartDateOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      displayDate(internship.starting_date)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {displayEndDate || 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={displayEndDate ? new Date(parseDisplayDate(displayEndDate)) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formatted = format(date, 'dd-MM-yyyy');
                                setDisplayEndDate(formatted);
                              }
                              setIsEndDateOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      displayDate(internship.ending_date)
                    )}
                  </TableCell>
                  <TableCell>{internship.internship_duration}</TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Select 
                        value={editingInternship.faculty_coordinator || ''} 
                        onValueChange={value => setEditingInternship({...editingInternship, faculty_coordinator: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select coordinator" />
                        </SelectTrigger>
                        <SelectContent>
                          {facultyCoordinatorOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      internship.faculty_coordinator
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        type="file" 
                        accept=".pdf" 
                        onChange={(e) => handleFileUpload(e, internship.id, 'offer_letter')}
                      />
                    ) : internship.offer_letter_url ? (
                      <a href={internship.offer_letter_url} target="_blank" rel="noopener noreferrer">
                        <File className="h-5 w-5 text-blue-500" />
                      </a>
                    ) : (
                      <Input 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, internship.id, 'offer_letter')}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        type="file" 
                        accept=".pdf" 
                        onChange={(e) => handleFileUpload(e, internship.id, 'noc')}
                      />
                    ) : internship.noc_url ? (
                      <a href={internship.noc_url} target="_blank" rel="noopener noreferrer">
                        <File className="h-5 w-5 text-blue-500" />
                      </a>
                    ) : (
                      <Input 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, internship.id, 'noc')}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {editingInternship?.id === internship.id ? (
                      <Input 
                        type="file" 
                        accept=".pdf" 
                        onChange={(e) => handleFileUpload(e, internship.id, 'ppo')}
                      />
                    ) : internship.ppo_url ? (
                      <a href={internship.ppo_url} target="_blank" rel="noopener noreferrer">
                        <File className="h-5 w-5 text-blue-500" />
                      </a>
                    ) : (
                      <Input 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, internship.id, 'ppo')}
                      />
                    )}
                  </TableCell>
                  
                  {/* Dynamic columns */}
                  {dynamicColumns.map(column => {
                    const columnValues = dynamicColumnValues[internship.id] || {};
                    const cellValue = columnValues[column.id] || '';
                    
                    return (
                      <TableCell key={`${internship.id}-${column.id}`}>
                        {editingInternship?.id === internship.id ? (
                          column.type === 'file' ? (
                            <Input 
                              type="file" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleDynamicCellEdit(internship.id, column.id, 'Uploading...');
                                  uploadFile(file, 'documents', `internships/${internship.id}/dynamic/${column.id}/${file.name}`)
                                    .then(url => {
                                      if (url) {
                                        handleDynamicCellEdit(internship.id, column.id, url);
                                        addInternshipDynamicColumnValue(column.id, internship.id, url);
                                      }
                                    });
                                }
                              }}
                            />
                          ) : (
                            <Input 
                              value={cellValue} 
                              onChange={(e) => handleDynamicCellEdit(internship.id, column.id, e.target.value)}
                            />
                          )
                        ) : column.type === 'file' && cellValue ? (
                          <a href={cellValue} target="_blank" rel="noopener noreferrer">
                            <File className="h-5 w-5 text-blue-500" />
                          </a>
                        ) : (
                          cellValue
                        )}
                      </TableCell>
                    );
                  })}
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      {editingInternship?.id === internship.id ? (
                        <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(internship)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleDelete(internship.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      
      {/* Pagination */}
      {internships.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Rows per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {pageButtons}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      {/* Add new column dialog */}
      <Dialog open={isNewColumnDialogOpen} onOpenChange={setIsNewColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
            <DialogDescription>
              Add a new column to track additional internship information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="columnName">Column Name</Label>
              <Input
                id="columnName"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter column name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="columnType">Column Type</Label>
              <Select value={newColumnType} onValueChange={setNewColumnType}>
                <SelectTrigger id="columnType">
                  <SelectValue placeholder="Select column type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewColumnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddColumn}>Add Column</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Excel dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Excel Data</DialogTitle>
            <DialogDescription>
              Upload an Excel file with internship data to import.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="excelFile">Excel File</Label>
              <Input
                id="excelFile"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="facultyCoordinator">Faculty Coordinator</Label>
              <Select 
                value={importFilters.faculty_coordinator}
                onValueChange={(value) => setImportFilters({...importFilters, faculty_coordinator: value})}
              >
                <SelectTrigger id="facultyCoordinator">
                  <SelectValue placeholder="Select faculty coordinator" />
                </SelectTrigger>
                <SelectContent>
                  {facultyCoordinatorOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExcelImport}>Import Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add new internship dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Internship</DialogTitle>
            <DialogDescription>
              Enter the details for the new internship.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rollNo">Roll No *</Label>
              <Input
                id="rollNo"
                value={newInternship.roll_no || ''}
                onChange={(e) => setNewInternship({...newInternship, roll_no: e.target.value})}
                placeholder="Enter roll number"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newInternship.name || ''}
                onChange={(e) => setNewInternship({...newInternship, name: e.target.value})}
                placeholder="Enter student name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={newInternship.email || ''}
                onChange={(e) => setNewInternship({...newInternship, email: e.target.value})}
                placeholder="Enter email address"
                type="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNo">Phone No</Label>
              <Input
                id="phoneNo"
                value={newInternship.phone_no || ''}
                onChange={(e) => setNewInternship({...newInternship, phone_no: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Select 
                value={newInternship.program || ''}
                onValueChange={(value) => setNewInternship({...newInternship, program: value})}
              >
                <SelectTrigger id="program">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={newInternship.domain || ''}
                onChange={(e) => setNewInternship({...newInternship, domain: e.target.value})}
                placeholder="Enter domain"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Input
                id="session"
                value={newInternship.session || ''}
                onChange={(e) => setNewInternship({...newInternship, session: e.target.value})}
                placeholder="Enter session"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={newInternship.year || ''}
                onChange={(e) => setNewInternship({...newInternship, year: e.target.value})}
                placeholder="Enter year"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                value={newInternship.semester || ''}
                onChange={(e) => setNewInternship({...newInternship, semester: e.target.value})}
                placeholder="Enter semester"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization">Organization Name</Label>
              <Input
                id="organization"
                value={newInternship.organization_name || ''}
                onChange={(e) => setNewInternship({...newInternship, organization_name: e.target.value})}
                placeholder="Enter organization name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={newInternship.position || ''}
                onChange={(e) => setNewInternship({...newInternship, position: e.target.value})}
                placeholder="Enter position"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {displayStartDate || 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={displayStartDate ? new Date(parseDisplayDate(displayStartDate)) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const formatted = format(date, 'dd-MM-yyyy');
                        setDisplayStartDate(formatted);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {displayEndDate || 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={displayEndDate ? new Date(parseDisplayDate(displayEndDate)) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const formatted = format(date, 'dd-MM-yyyy');
                        setDisplayEndDate(formatted);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="facultyCoordinator">Faculty Coordinator</Label>
              <Select 
                value={newInternship.faculty_coordinator || ''}
                onValueChange={(value) => setNewInternship({...newInternship, faculty_coordinator: value})}
              >
                <SelectTrigger id="facultyCoordinator">
                  <SelectValue placeholder="Select faculty coordinator" />
                </SelectTrigger>
                <SelectContent>
                  {facultyCoordinatorOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddInternship}>Add Internship</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternshipTable;
