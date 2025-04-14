
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Calendar as CalendarIcon,
  Trash2,
  FileText,
  ArrowLeft,
  ArrowRight,
  Save,
  Download,
  Edit,
  Plus,
  X,
  Link,
  File,
  FilePdf,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  getInternshipDynamicColumns, 
  getInternshipDynamicColumnValues, 
  deleteInternshipDynamicColumn,
  updateInternshipDynamicColumnValue
} from '@/lib/supabase';
import InternshipColumnModal from './InternshipColumnModal';
import InternshipDynamicField from './InternshipDynamicField';
import { InternshipDynamicColumn, InternshipDynamicColumnValue } from '@/lib/supabase';

interface InternshipTableProps {
  filters: Record<string, any>;
}

const InternshipTable: React.FC<InternshipTableProps> = ({ filters }) => {
  const [internships, setInternships] = useState<any[]>([]);
  const [selectedInternships, setSelectedInternships] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editInternshipId, setEditInternshipId] = useState<string | null>(null);
  const [editedInternship, setEditedInternship] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicColumns, setDynamicColumns] = useState<InternshipDynamicColumn[]>([]);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [dynamicColumnValues, setDynamicColumnValues] = useState<Record<string, InternshipDynamicColumnValue[]>>({});
  const [isColumnDeleteAlertOpen, setIsColumnDeleteAlertOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInternships();
    fetchDynamicColumns();
  }, [filters]);

  const fetchInternships = async () => {
    try {
      let query = supabase
        .from('internships')
        .select('*');

      if (filters.roll_no) {
        query = query.like('roll_no', `%${filters.roll_no}%`);
      }
      if (filters.domain) {
        query = query.like('domain', `%${filters.domain}%`);
      }
      if (filters.year) {
        query = query.like('year', `%${filters.year}%`);
      }
      if (filters.searchTerm) {
        query = query.like('name', `%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching internships:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch internships. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        setInternships(data);
        await fetchDynamicColumnValues(data);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while fetching internships.',
        variant: 'destructive',
      });
    }
  };

  const fetchDynamicColumns = async () => {
    try {
      const columns = await getInternshipDynamicColumns();
      setDynamicColumns(columns);
    } catch (error) {
      console.error('Error fetching dynamic columns:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dynamic columns. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const fetchDynamicColumnValues = async (internshipsData: any[]) => {
    try {
      const values: Record<string, InternshipDynamicColumnValue[]> = {};
      
      for (const internship of internshipsData) {
        const { data, error } = await supabase
          .from('internship_dynamic_column_values')
          .select('*, internship_dynamic_columns:column_id(*)')
          .eq('internship_id', internship.id);
          
        if (error) {
          throw error;
        }
        
        values[internship.id] = data || [];
      }
      
      setDynamicColumnValues(values);
    } catch (error) {
      console.error('Error fetching dynamic column values:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dynamic column values.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectInternship = (internshipId: string) => {
    setSelectedInternships((prevSelected) =>
      prevSelected.includes(internshipId)
        ? prevSelected.filter((id) => id !== internshipId)
        : [...prevSelected, internshipId]
    );
  };

  const handleEditInternship = (internship: any) => {
    setEditInternshipId(internship.id);
    setEditedInternship(internship);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedInternship((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    if (date) {
      setEditedInternship((prev: any) => ({
        ...prev,
        [field]: format(date, 'yyyy-MM-dd'),
      }));
    }
  };

  const handleSaveInternship = async () => {
    if (!editInternshipId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('internships')
        .update(editedInternship)
        .eq('id', editInternshipId);

      if (error) throw error;

      fetchInternships();
      setEditInternshipId(null);
      setEditedInternship({});
      toast({
        title: 'Success',
        description: 'Internship updated successfully!',
      });
    } catch (error) {
      console.error('Error updating internship:', error);
      toast({
        title: 'Error',
        description: 'Failed to update internship. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInternships = () => {
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteInternships = async () => {
    setIsSaving(true);
    try {
      for (const internshipId of selectedInternships) {
        // First, delete dynamic column values associated with the internship
        const { error: valuesError } = await supabase
          .from('internship_dynamic_column_values')
          .delete()
          .eq('internship_id', internshipId);
        
        if (valuesError) throw valuesError;
        
        // Then delete the internship
        const { error } = await supabase
          .from('internships')
          .delete()
          .eq('id', internshipId);
          
        if (error) throw error;
      }
      
      fetchInternships();
      setSelectedInternships([]);
      toast({
        title: 'Success',
        description: 'Internships deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting internships:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete internships. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setIsDeleteAlertOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
  };

  const handleUpdateDynamicValue = async (valueId: string, newValue: string) => {
    try {
      const result = await updateInternshipDynamicColumnValue(valueId, newValue);
      if (!result) {
        throw new Error('Failed to update dynamic column value');
      }
      
      // Update local state to reflect the change
      const updatedValues = { ...dynamicColumnValues };
      
      for (const internshipId in updatedValues) {
        updatedValues[internshipId] = updatedValues[internshipId].map(value => {
          if (value.id === valueId) {
            return { ...value, value: newValue };
          }
          return value;
        });
      }
      
      setDynamicColumnValues(updatedValues);
      
      return;
    } catch (error) {
      console.error('Error updating dynamic value:', error);
      throw error;
    }
  };

  const handleAddDynamicValue = async (internshipId: string, columnId: string, value: string) => {
    try {
      const { data, error } = await supabase
        .from('internship_dynamic_column_values')
        .insert({ 
          internship_id: internshipId, 
          column_id: columnId, 
          value 
        })
        .select('*, internship_dynamic_columns:column_id(*)');
        
      if (error) throw error;
      
      // Update local state
      setDynamicColumnValues(prev => ({
        ...prev,
        [internshipId]: [...(prev[internshipId] || []), data[0]]
      }));
      
      return;
    } catch (error) {
      console.error('Error adding dynamic value:', error);
      throw error;
    }
  };

  const handleDynamicValueChange = async (internshipId: string, columnId: string, newValue: string) => {
    try {
      // Check if a value already exists for this internship and column
      const existingValue = dynamicColumnValues[internshipId]?.find(
        v => v.column_id === columnId
      );
      
      if (existingValue) {
        // Update existing value
        await handleUpdateDynamicValue(existingValue.id, newValue);
      } else {
        // Add new value
        await handleAddDynamicValue(internshipId, columnId, newValue);
      }
      
      toast({
        title: 'Success',
        description: 'Column value updated successfully.',
      });
    } catch (error) {
      console.error('Error managing dynamic value:', error);
      toast({
        title: 'Error',
        description: 'Failed to update column value.',
        variant: 'destructive',
      });
    }
  };

  const confirmDeleteColumn = async () => {
    if (columnToDelete) {
      try {
        const result = await deleteInternshipDynamicColumn(columnToDelete);
        
        if (result) {
          fetchDynamicColumns();
          
          // Update local state to remove all references to this column
          const updatedValues = { ...dynamicColumnValues };
          for (const internshipId in updatedValues) {
            updatedValues[internshipId] = updatedValues[internshipId].filter(
              value => value.column_id !== columnToDelete
            );
          }
          
          setDynamicColumnValues(updatedValues);
          
          toast({
            title: 'Success',
            description: 'Column deleted successfully.',
          });
        } else {
          throw new Error('Failed to delete column');
        }
      } catch (error) {
        console.error('Error deleting column:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete column. Please try again.',
          variant: 'destructive',
        });
      }
    }
    
    setIsColumnDeleteAlertOpen(false);
    setColumnToDelete(null);
  };

  const handleDeleteColumn = (columnId: string) => {
    setColumnToDelete(columnId);
    setIsColumnDeleteAlertOpen(true);
  };

  const getDynamicColumnValueForInternship = (internshipId: string, columnId: string) => {
    return dynamicColumnValues[internshipId]?.find(
      value => value.column_id === columnId
    );
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    
    // Add filter information at the top
    let filterText = 'Filter Information:\n';
    if (Object.keys(filters).length === 0) {
      filterText += 'No filters applied. Showing all internships.';
    } else {
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          filterText += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
        } else {
          filterText += `${key.charAt(0).toUpperCase() + key.slice(1)}: All\n`;
        }
      }
    }
    
    doc.setFontSize(10);
    doc.text(filterText, 14, 15);
    
    // Create column headers for the table (standard + dynamic columns)
    const standardColumns = [
      'Roll No',
      'Name',
      'Email',
      'Program',
      'Phone No',
      'Position',
      'Domain',
      'Organization Name',
      'Starting Date',
      'Ending Date',
      'Session',
      'Year',
      'Semester',
      'Faculty Coordinator',
    ];
    
    const allColumns = [
      ...standardColumns,
      ...dynamicColumns.map(column => column.name)
    ];
    
    // Create data rows
    const rows = internships.map(internship => {
      const standardData = [
        internship.roll_no || '',
        internship.name || '',
        internship.email || '',
        internship.program || '',
        internship.phone_no || '',
        internship.position || '',
        internship.domain || '',
        internship.organization_name || '',
        internship.starting_date || '',
        internship.ending_date || '',
        internship.session || '',
        internship.year || '',
        internship.semester || '',
        internship.faculty_coordinator || '',
      ];
      
      const dynamicData = dynamicColumns.map(column => {
        const value = getDynamicColumnValueForInternship(internship.id, column.id);
        return value ? value.value : '';
      });
      
      return [...standardData, ...dynamicData];
    });
    
    // Start the table a bit lower to make room for filter info
    autoTable(doc, {
      startY: 30,
      head: [allColumns],
      body: rows,
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    doc.save('internships.pdf');
  };

  const generateExcel = () => {
    // Create column headers (standard + dynamic)
    const standardHeaders = {
      'Roll No': 'roll_no',
      'Name': 'name',
      'Email': 'email',
      'Program': 'program',
      'Phone No': 'phone_no',
      'Position': 'position',
      'Domain': 'domain',
      'Organization Name': 'organization_name',
      'Starting Date': 'starting_date',
      'Ending Date': 'ending_date',
      'Session': 'session',
      'Year': 'year',
      'Semester': 'semester',
      'Faculty Coordinator': 'faculty_coordinator',
    };
    
    // Prepare data for Excel
    const data = internships.map(internship => {
      // Start with standard fields
      const row: Record<string, any> = {};
      
      // Add standard fields
      for (const [header, field] of Object.entries(standardHeaders)) {
        row[header] = internship[field] || '';
      }
      
      // Add dynamic columns
      for (const column of dynamicColumns) {
        const value = getDynamicColumnValueForInternship(internship.id, column.id);
        row[column.name] = value ? value.value : '';
      }
      
      return row;
    });
    
    // Generate Excel file
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Internships');
    XLSX.writeFile(wb, 'internships.xlsx');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generatePdf}
            className="mr-2"
          >
            <FilePdf className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
          <Button variant="outline" size="sm" onClick={generateExcel}>
            <Download className="mr-2 h-4 w-4" />
            Generate Excel
          </Button>
        </div>
        <div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteInternships}
            disabled={selectedInternships.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Select</TableHead>
              <TableHead>Roll No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Phone No</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Organization Name</TableHead>
              <TableHead>Starting Date</TableHead>
              <TableHead>Ending Date</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Faculty Coordinator</TableHead>
              {dynamicColumns.map((column) => (
                <TableHead key={column.id} className="relative">
                  {column.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteColumn(column.id)}
                    className="absolute top-1 right-1 h-5 w-5"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {internships.map((internship) => (
              <TableRow key={internship.id}>
                <TableCell className="w-[50px]">
                  <Input
                    type="checkbox"
                    checked={selectedInternships.includes(internship.id)}
                    onChange={() => handleSelectInternship(internship.id)}
                  />
                </TableCell>
                <TableCell>{internship.roll_no}</TableCell>
                <TableCell>{internship.name}</TableCell>
                <TableCell>{internship.email}</TableCell>
                <TableCell>{internship.program}</TableCell>
                <TableCell>{internship.phone_no}</TableCell>
                <TableCell>{internship.position}</TableCell>
                <TableCell>{internship.domain}</TableCell>
                <TableCell>{internship.organization_name}</TableCell>
                <TableCell>{internship.starting_date}</TableCell>
                <TableCell>{internship.ending_date}</TableCell>
                <TableCell>{internship.session}</TableCell>
                <TableCell>{internship.year}</TableCell>
                <TableCell>{internship.semester}</TableCell>
                <TableCell>{internship.faculty_coordinator}</TableCell>
                
                {dynamicColumns.map((column) => {
                  const valueObj = getDynamicColumnValueForInternship(internship.id, column.id);
                  
                  return (
                    <TableCell key={`${internship.id}-${column.id}`}>
                      {valueObj ? (
                        <InternshipDynamicField
                          value={valueObj}
                          isEditing={editInternshipId === internship.id}
                          columnType={column.type}
                          onChange={handleUpdateDynamicValue}
                        />
                      ) : (
                        editInternshipId === internship.id && (
                          <Input
                            type="text"
                            placeholder={`Enter ${column.name}`}
                            onChange={(e) => 
                              handleDynamicValueChange(internship.id, column.id, e.target.value)
                            }
                          />
                        )
                      )}
                    </TableCell>
                  );
                })}
                
                <TableCell className="text-right">
                  {editInternshipId === internship.id ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveInternship}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Save className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditInternshipId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditInternship(internship)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete
              selected internships?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteInternships}
              disabled={isSaving}
            >
              {isSaving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editInternshipId !== null} onOpenChange={(open) => !open && setEditInternshipId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Internship</DialogTitle>
            <DialogDescription>
              Make changes to the internship details here. Click save when you're
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="roll_no" className="text-right">
                Roll No
              </label>
              <Input
                type="text"
                id="roll_no"
                name="roll_no"
                value={editedInternship?.roll_no || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Name
              </label>
              <Input
                type="text"
                id="name"
                name="name"
                value={editedInternship?.name || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">
                Email
              </label>
              <Input
                type="text"
                id="email"
                name="email"
                value={editedInternship?.email || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="program" className="text-right">
                Program
              </label>
              <Input
                type="text"
                id="program"
                name="program"
                value={editedInternship?.program || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="phone_no" className="text-right">
                Phone No
              </label>
              <Input
                type="text"
                id="phone_no"
                name="phone_no"
                value={editedInternship?.phone_no || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="position" className="text-right">
                Position
              </label>
              <Input
                type="text"
                id="position"
                name="position"
                value={editedInternship?.position || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="domain" className="text-right">
                Domain
              </label>
              <Input
                type="text"
                id="domain"
                name="domain"
                value={editedInternship?.domain || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="organization_name" className="text-right">
                Organization Name
              </label>
              <Input
                type="text"
                id="organization_name"
                name="organization_name"
                value={editedInternship?.organization_name || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="starting_date" className="text-right">
                Starting Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={
                      'w-[280px] justify-start text-left font-normal' +
                      (editedInternship?.starting_date ? ' text-foreground' : ' text-muted-foreground')
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedInternship?.starting_date ? (
                      format(new Date(editedInternship.starting_date), 'yyyy-MM-dd')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={editedInternship?.starting_date ? new Date(editedInternship.starting_date) : undefined}
                    onSelect={(date) => handleDateChange('starting_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="ending_date" className="text-right">
                Ending Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={
                      'w-[280px] justify-start text-left font-normal' +
                      (editedInternship?.ending_date ? ' text-foreground' : ' text-muted-foreground')
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedInternship?.ending_date ? (
                      format(new Date(editedInternship.ending_date), 'yyyy-MM-dd')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={editedInternship?.ending_date ? new Date(editedInternship.ending_date) : undefined}
                    onSelect={(date) => handleDateChange('ending_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="session" className="text-right">
                Session
              </label>
              <Input
                type="text"
                id="session"
                name="session"
                value={editedInternship?.session || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="year" className="text-right">
                Year
              </label>
              <Input
                type="text"
                id="year"
                name="year"
                value={editedInternship?.year || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="semester" className="text-right">
                Semester
              </label>
              <Input
                type="text"
                id="semester"
                name="semester"
                value={editedInternship?.semester || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="faculty_coordinator" className="text-right">
                Faculty Coordinator
              </label>
              <Input
                type="text"
                id="faculty_coordinator"
                name="faculty_coordinator"
                value={editedInternship?.faculty_coordinator || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" onClick={handleSaveInternship} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isColumnDeleteAlertOpen} onOpenChange={setIsColumnDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete this column?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsColumnDeleteAlertOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteColumn}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-end mt-4">
        <Button onClick={() => setShowAddColumnModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dynamic Column
        </Button>
      </div>

      <InternshipColumnModal 
        isOpen={showAddColumnModal} 
        onClose={() => setShowAddColumnModal(false)}
        onColumnAdded={() => fetchDynamicColumns()}
      />
    </div>
  );
};

export default InternshipTable;
