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
import { addDynamicColumn, getDynamicColumns, addDynamicColumnValue, getDynamicColumnValues, deleteDynamicColumn } from '@/lib/supabase';

interface InternshipTableProps {
  filters: Record<string, any>;
}

const InternshipTable: React.FC<InternshipTableProps> = ({ filters }) => {
  const [internships, setInternships] = useState([]);
  const [selectedInternships, setSelectedInternships] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editInternshipId, setEditInternshipId] = useState<string | null>(null);
  const [editedInternship, setEditedInternship] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicColumns, setDynamicColumns] = useState([]);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [dynamicColumnValues, setDynamicColumnValues] = useState({});
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
        const values = {};
        for (const internship of data) {
          const dynamicValues = await getDynamicColumnValues(internship.id);
          values[internship.id] = dynamicValues;
        }
        setDynamicColumnValues(values);
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
      const columns = await getDynamicColumns();
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
    setEditedInternship((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setEditedInternship((prev) => ({
        ...prev,
        starting_date: format(date, 'yyyy-MM-dd'),
      }));
    }
  };

  const handleSaveInternship = async () => {
    if (!editInternshipId) return;

    setIsSaving(true);
    try {
      if (editedInternship) {
        await supabase
          .from('internships')
          .update(editedInternship)
          .eq('id', editInternshipId);

        if (dynamicColumnValues[editInternshipId]) {
          for (const dynamicValue of dynamicColumnValues[editInternshipId]) {
            const inputId = `dynamic-input-${dynamicValue.column_id}`;
            const inputElement = document.getElementById(inputId) as HTMLInputElement;
            if (inputElement) {
              const newValue = inputElement.value;
              await supabase
                .from('dynamic_column_values')
                .update({ value: newValue })
                .eq('id', dynamicValue.id);
            }
          }
        }

        fetchInternships();
        setEditInternshipId(null);
        setEditedInternship({});
        toast({
          title: 'Success',
          description: 'Internship updated successfully!',
        });
      } else {
        console.error('Edited internship is undefined.');
        toast({
          title: 'Error',
          description: 'Failed to update internship. Edited internship is undefined.',
          variant: 'destructive',
        });
      }
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
        await supabase.from('internships').delete().eq('id', internshipId);
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

  const generatePdf = () => {
    const doc = new jsPDF();

    const columns = [
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

    const rows = internships.map((internship) => [
      internship.roll_no,
      internship.name,
      internship.email,
      internship.program,
      internship.phone_no,
      internship.position,
      internship.domain,
      internship.organization_name,
      internship.starting_date,
      internship.ending_date,
      internship.session,
      internship.year,
      internship.semester,
      internship.faculty_coordinator,
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
    });

    doc.save('internships.pdf');
  };

  const generateExcel = () => {
    const data = internships.map((internship) => ({
      'Roll No': internship.roll_no,
      'Name': internship.name,
      'Email': internship.email,
      'Program': internship.program,
      'Phone No': internship.phone_no,
      'Position': internship.position,
      'Domain': internship.domain,
      'Organization Name': internship.organization_name,
      'Starting Date': internship.starting_date,
      'Ending Date': internship.ending_date,
      'Session': internship.session,
      'Year': internship.year,
      'Semester': internship.semester,
      'Faculty Coordinator': internship.faculty_coordinator,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Internships');
    XLSX.writeFile(wb, 'internships.xlsx');
  };

  const handleAddColumn = async () => {
    try {
      await addDynamicColumn(newColumnName, newColumnType);
      fetchDynamicColumns();
      setShowAddColumnModal(false);
      setNewColumnName('');
      setNewColumnType('text');
      toast({
        title: 'Success',
        description: 'Dynamic column added successfully!',
      });
    } catch (error) {
      console.error('Error adding dynamic column:', error);
      toast({
        title: 'Error',
        description: 'Failed to add dynamic column. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDynamicValueChange = async (internshipId: string, columnId: string, value: any) => {
    const existingValue = dynamicColumnValues[internshipId]?.find(item => item.dynamic_columns.id === columnId);

    if (existingValue) {
      try {
        await supabase
          .from('dynamic_column_values')
          .update({ value: value })
          .eq('id', existingValue.id);

        setDynamicColumnValues(prevValues => {
          const updatedProjectValues = prevValues[internshipId].map(item => {
            if (item.dynamic_columns.id === columnId) {
              return { ...item, value: value };
            }
            return item;
          });

          return {
            ...prevValues,
            [internshipId]: updatedProjectValues,
          };
        });

        toast({
          title: 'Success',
          description: 'Dynamic column value updated successfully!',
        });
      } catch (error) {
        console.error('Error updating dynamic column value:', error);
        toast({
          title: 'Error',
          description: 'Failed to update dynamic column value. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      try {
        await addDynamicColumnValue(columnId, internshipId, value);

        const updatedDynamicValues = await getDynamicColumnValues(internshipId);

        setDynamicColumnValues(prevValues => ({
          ...prevValues,
          [internshipId]: updatedDynamicValues,
        }));

        toast({
          title: 'Success',
          description: 'Dynamic column value added successfully!',
        });
      } catch (error) {
        console.error('Error adding dynamic column value:', error);
        toast({
          title: 'Error',
          description: 'Failed to add dynamic column value. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const confirmDeleteColumn = () => {
    if (columnToDelete) {
      deleteColumn(columnToDelete);
    }
    setIsColumnDeleteAlertOpen(false);
  };

  const cancelDeleteColumn = () => {
    setIsColumnDeleteAlertOpen(false);
    setColumnToDelete(null);
  };

  const handleDeleteColumn = (columnId: string) => {
    setColumnToDelete(columnId);
    setIsColumnDeleteAlertOpen(true);
  };

  const deleteColumn = async (columnId: string) => {
    try {
      await deleteDynamicColumn(columnId);
      fetchDynamicColumns();
      setDynamicColumnValues(prevValues => {
        const updatedValues = {};
        for (const internshipId in prevValues) {
          updatedValues[internshipId] = prevValues[internshipId].filter(item => item.column_id !== columnId);
        }
        return updatedValues;
      });
      toast({
        title: 'Success',
        description: 'Dynamic column deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting dynamic column:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dynamic column. Please try again.',
        variant: 'destructive',
      });
    }
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
            <FileText className="mr-2 h-4 w-4" />
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
                  className="absolute top-1 right-1"
                >
                  <X className="h-4 w-4" />
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
                const dynamicValue = dynamicColumnValues[internship.id]?.find(item => item.dynamic_columns.id === column.id);
                const value = dynamicValue ? dynamicValue.value : '';

                return (
                  <TableCell key={`${internship.id}-${column.id}`}>
                    {editInternshipId === internship.id ? (
                      <Input
                        type="text"
                        id={`dynamic-input-${column.id}`}
                        defaultValue={value}
                        onChange={(e) => handleDynamicValueChange(internship.id, column.id, e.target.value)}
                      />
                    ) : (
                      value
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

      <Dialog open={editInternshipId !== null} onOpenChange={() => setEditInternshipId(null)}>
        <DialogContent>
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
                    onSelect={handleDateChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('2020-01-01')
                    }
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
                    onSelect={handleDateChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('2020-01-01')
                    }
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

      <div className="flex justify-end mt-4">
        <Button onClick={() => setShowAddColumnModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dynamic Column
        </Button>
      </div>

      <Dialog open={showAddColumnModal} onOpenChange={setShowAddColumnModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dynamic Column</DialogTitle>
            <DialogDescription>
              Add a new column to the internship table.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="column_name" className="text-right">
                Column Name
              </label>
              <Input
                type="text"
                id="column_name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="column_type" className="text-right">
                Column Type
              </label>
              <Select onValueChange={(value) => setNewColumnType(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={handleAddColumn}>
              Add Column
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
            <AlertDialogCancel onClick={cancelDeleteColumn}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteColumn}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InternshipTable;
