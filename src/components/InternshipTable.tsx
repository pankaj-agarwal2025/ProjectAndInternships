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
import { format, differenceInDays, differenceInMonths } from 'date-fns';
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
  Link as LinkIcon,
  File,
  ExternalLink,
  Check,
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
} from "@/components/ui/alert-dialog"
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  getInternshipDynamicColumns, 
  deleteInternshipDynamicColumn, 
  addInternshipDynamicColumn, 
  getInternshipDynamicColumnValues,
  addInternshipDynamicColumnValue,
  uploadFile,
  Internship
} from '@/lib/supabase';
import InternshipDynamicField from './InternshipDynamicField';

interface InternshipTableProps {
  filters: Record<string, any>;
}

const InternshipTable: React.FC<InternshipTableProps> = ({ filters }) => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternships, setSelectedInternships] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dynamicColumns, setDynamicColumns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [editInternshipId, setEditInternshipId] = useState<string | null>(null);
  const [editedInternship, setEditedInternship] = useState<Partial<Internship>>({});
  const [dynamicColumnValues, setDynamicColumnValues] = useState<Record<string, any[]>>({});
  const [isColumnDeleteAlertOpen, setIsColumnDeleteAlertOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [fileForUpload, setFileForUpload] = useState<File | null>(null);
  const [fileUrlField, setFileUrlField] = useState('');
  const [isLinkEditable, setIsLinkEditable] = useState(false);
  const [editLinkURL, setEditLinkURL] = useState('');
  const [editLinkColumnId, setEditLinkColumnId] = useState('');
  const [editLinkInternshipId, setEditLinkInternshipId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchInternships();
    fetchDynamicColumns();

    const handleAddNewInternship = () => {
      handleAddInternship();
    };

    document.addEventListener('add-new-internship', handleAddNewInternship);

    return () => {
      document.removeEventListener('add-new-internship', handleAddNewInternship);
    };
  }, [filters, page, perPage]);

  const fetchInternships = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('internships')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters.roll_no) {
        query = query.ilike('roll_no', `%${filters.roll_no}%`);
      }
      
      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }
      
      if (filters.domain) {
        query = query.ilike('domain', `%${filters.domain}%`);
      }
      
      if (filters.organization_name) {
        query = query.ilike('organization_name', `%${filters.organization_name}%`);
      }
      
      if (filters.year) {
        query = query.ilike('year', `%${filters.year}%`);
      }
      
      if (filters.faculty_coordinator) {
        query = query.ilike('faculty_coordinator', `%${filters.faculty_coordinator}%`);
      }
      
      const { count, error: countError } = await supabase
        .from('internships')
        .select('id', { count: 'exact' });
      
      if (countError) {
        throw countError;
      }
      
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      
      query = query.range(from, to);
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setInternships(data || []);
      setTotalPages(Math.ceil((count as number) / perPage));
      
      const values: Record<string, any[]> = {};
      for (const internship of data || []) {
        const dynamicValues = await getInternshipDynamicColumnValues(internship.id);
        values[internship.id] = dynamicValues;
      }
      setDynamicColumnValues(values);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching internships:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch internships. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSelectInternship = (internshipId: string) => {
    setSelectedInternships((prevSelected) =>
      prevSelected.includes(internshipId)
        ? prevSelected.filter((id) => id !== internshipId)
        : [...prevSelected, internshipId]
    );
  };

  const handleEditInternship = (internship: Internship) => {
    setEditInternshipId(internship.id);
    setEditedInternship({ ...internship });
  };

  const handleEditRow = (internship: Internship) => {
    setEditRowId(internship.id);
    setEditedInternship({ ...internship });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedInternship((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    if (date) {
      setEditedInternship((prev) => ({
        ...prev,
        [field]: format(date, 'yyyy-MM-dd'),
      }));
    }
  };

  const handleSaveRow = async () => {
    if (!editRowId) return;

    setIsSaving(true);
    try {
      await supabase
        .from('internships')
        .update(editedInternship)
        .eq('id', editRowId);

      if (dynamicColumnValues[editRowId]) {
        for (const dynamicValue of dynamicColumnValues[editRowId]) {
          const inputId = `dynamic-input-${dynamicValue.column_id}-${editRowId}`;
          const inputElement = document.getElementById(inputId) as HTMLInputElement;
          if (inputElement && inputElement.value !== dynamicValue.value) {
            await handleUpdateDynamicValue(dynamicValue.id, inputElement.value);
          }
        }
      }

      const pdfFields = ['offer_letter_url', 'noc_url', 'ppo_url'];
      for (const field of pdfFields) {
        const inputId = `${field}-${editRowId}`;
        const inputElement = document.getElementById(inputId) as HTMLInputElement;
        if (inputElement && inputElement.value !== (editedInternship as any)[field]) {
          await supabase
            .from('internships')
            .update({ [field]: inputElement.value })
            .eq('id', editRowId);
        }
      }

      fetchInternships();
      setEditRowId(null);
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

  const handleSaveInternship = async () => {
    if (!editInternshipId) return;

    setIsSaving(true);
    try {
      await supabase
        .from('internships')
        .update(editedInternship)
        .eq('id', editInternshipId);

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
        await supabase
          .from('internship_dynamic_column_values')
          .delete()
          .eq('internship_id', internshipId);
        
        await supabase
          .from('internships')
          .delete()
          .eq('id', internshipId);
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
      const { error } = await supabase
        .from('internship_dynamic_column_values')
        .update({ value: newValue })
        .eq('id', valueId);
      
      if (error) {
        throw error;
      }
      
      const updatedValues = { ...dynamicColumnValues };
      
      for (const internshipId in updatedValues) {
        updatedValues[internshipId] = updatedValues[internshipId].map(item => {
          if (item.id === valueId) {
            return { ...item, value: newValue };
          }
          return item;
        });
      }
      
      setDynamicColumnValues(updatedValues);
    } catch (error) {
      console.error('Error updating dynamic value:', error);
      throw new Error('Failed to update dynamic column value');
    }
  };

  const handleAddDynamicValue = async (internshipId: string, columnId: string, value: string) => {
    try {
      const { data, error } = await supabase
        .from('internship_dynamic_column_values')
        .insert([
          { internship_id: internshipId, column_id: columnId, value: value }
        ])
        .select();
        
      if (error) throw error;
      
      setDynamicColumnValues(prev => ({
        ...prev,
        [internshipId]: [...(prev[internshipId] || []), data[0]]
      }));
    } catch (error) {
      console.error('Error adding dynamic value:', error);
      throw new Error('Failed to add dynamic column value');
    }
  };

  const handleDynamicValueChange = async (internshipId: string, columnId: string, newValue: string) => {
    try {
      const existingValue = dynamicColumnValues[internshipId]?.find(
        v => v.column_id === columnId
      );
      
      if (existingValue) {
        await handleUpdateDynamicValue(existingValue.id, newValue);
      } else {
        await handleAddDynamicValue(internshipId, columnId, newValue);
      }
      
      toast({
        title: 'Success',
        description: 'Value updated successfully!',
      });
    } catch (error) {
      console.error('Error updating value:', error);
      toast({
        title: 'Error',
        description: 'Failed to update value. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast({
        title: 'Error',
        description: 'Column name is required.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await addInternshipDynamicColumn(newColumnName, newColumnType);
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

  const handleDeleteColumn = (columnId: string) => {
    setColumnToDelete(columnId);
    setIsColumnDeleteAlertOpen(true);
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) {
      setIsColumnDeleteAlertOpen(false);
      return;
    }
    
    try {
      const result = await deleteInternshipDynamicColumn(columnToDelete);
      
      if (result) {
        fetchDynamicColumns();
        
        const updatedValues = { ...dynamicColumnValues };
        for (const internshipId in updatedValues) {
          updatedValues[internshipId] = updatedValues[internshipId].filter(
            item => item.column_id !== columnToDelete
          );
        }
        
        setDynamicColumnValues(updatedValues);
        
        toast({
          title: 'Success',
          description: 'Dynamic column deleted successfully!',
        });
      } else {
        throw new Error('Failed to delete column');
      }
    } catch (error) {
      console.error('Error deleting dynamic column:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dynamic column. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsColumnDeleteAlertOpen(false);
      setColumnToDelete(null);
    }
  };

  const cancelDeleteColumn = () => {
    setIsColumnDeleteAlertOpen(false);
    setColumnToDelete(null);
  };

  const getDynamicColumnValueForInternship = (internshipId: string, columnId: string) => {
    return dynamicColumnValues[internshipId]?.find(
      v => v.internship_dynamic_columns?.id === columnId
    );
  };

  const calculateInternshipDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'N/A';
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid dates';
      
      if (end < start) return 'End date before start date';
      
      const months = differenceInMonths(end, start);
      const remainingDays = differenceInDays(end, new Date(start.getFullYear(), start.getMonth() + months, start.getDate()));
      
      return `${months} month${months !== 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'Error calculating';
    }
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Internship Portal Report", 14, 10);
    
    let filterText = 'Filter Information:\n';
    if (Object.keys(filters).length === 0) {
      filterText += 'No filters applied. Showing all internships.';
    } else {
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          const formattedKey = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          filterText += `${formattedKey}: ${value}\n`;
        }
      }
    }
    
    doc.setFontSize(10);
    doc.text(filterText, 14, 20);
    
    const standardColumns = [
      'Roll No',
      'Name',
      'Email',
      'Phone No',
      'Domain',
      'Organization',
      'Position',
      'Start Date',
      'End Date',
      'Duration',
      'Session',
      'Year',
      'Semester',
      'Program',
      'Offer Letter',
      'NOC',
      'PPO',
      'Faculty Coordinator',
    ];
    
    const allColumns = [
      ...standardColumns,
      ...dynamicColumns.map(column => column.name)
    ];
    
    const rows = internships.map(internship => {
      const standardData = [
        internship.roll_no || '',
        internship.name || '',
        internship.email || '',
        internship.phone_no || '',
        internship.domain || '',
        internship.organization_name || '',
        internship.position || '',
        internship.starting_date || '',
        internship.ending_date || '',
        calculateInternshipDuration(internship.starting_date, internship.ending_date),
        internship.session || '',
        internship.year || '',
        internship.semester || '',
        internship.program || '',
        internship.offer_letter_url ? 'Available' : 'Not Available',
        internship.noc_url ? 'Available' : 'Not Available',
        internship.ppo_url ? 'Available' : 'Not Available',
        internship.faculty_coordinator || '',
      ];
      
      const dynamicData = dynamicColumns.map(column => {
        const value = getDynamicColumnValueForInternship(internship.id, column.id);
        return value ? value.value : '';
      });
      
      return [...standardData, ...dynamicData];
    });
    
    autoTable(doc, {
      startY: 40,
      head: [allColumns],
      body: rows,
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.text("Internship Portal Report - " + new Date().toLocaleDateString(), data.settings.margin.left, 10);
      }
    });
    
    doc.save('internships.pdf');
  };

  const generateExcel = () => {
    const standardHeaders = {
      'Roll No': 'roll_no',
      'Name': 'name',
      'Email': 'email',
      'Phone No': 'phone_no',
      'Domain': 'domain',
      'Organization': 'organization_name',
      'Position': 'position',
      'Start Date': 'starting_date',
      'End Date': 'ending_date',
      'Duration': 'duration',
      'Session': 'session',
      'Year': 'year',
      'Semester': 'semester',
      'Program': 'program',
      'Offer Letter': 'offer_letter_url',
      'NOC': 'noc_url',
      'PPO': 'ppo_url',
      'Faculty Coordinator': 'faculty_coordinator',
    };
    
    const headers: Record<string, string> = { ...standardHeaders };
    for (const column of dynamicColumns) {
      headers[column.name] = column.id;
    }
    
    const headerRow: Record<string, string> = {};
    Object.keys(headers).forEach(key => {
      headerRow[key] = '';
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([headerRow]);
    XLSX.utils.book_append_sheet(wb, ws, 'Internships');
    XLSX.writeFile(wb, 'internships_template.xlsx');
  };

  const handleUploadFile = async (internshipId: string, fieldName: string) => {
    if (!fileForUpload) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const fileName = `${internshipId}/${fieldName}/${fileForUpload.name}`;
      const fileUrl = await uploadFile(fileForUpload, 'internships', fileName);
      
      if (fileUrl) {
        const isDynamicColumn = dynamicColumns.some(col => col.id === fieldName);
        
        if (isDynamicColumn) {
          await handleDynamicValueChange(internshipId, fieldName, fileUrl);
        } else {
          await supabase
            .from('internships')
            .update({ [fieldName]: fileUrl })
            .eq('id', internshipId);
        }
        
        fetchInternships();
        toast({
          title: 'Success',
          description: 'File uploaded successfully!',
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFileForUpload(null);
      setFileUrlField('');
      setIsSaving(false);
    }
  };

  const handleSaveLink = async () => {
    if (!editLinkURL || !editLinkInternshipId || !editLinkColumnId) return;
    
    try {
      setIsSaving(true);
      
      const isDynamicColumn = dynamicColumns.some(col => col.id === editLinkColumnId);
      
      if (isDynamicColumn) {
        await handleDynamicValueChange(editLinkInternshipId, editLinkColumnId, editLinkURL);
      } else {
        await supabase
          .from('internships')
          .update({ [editLinkColumnId]: editLinkURL })
          .eq('id', editLinkInternshipId);
      }
      
      setIsLinkEditable(false);
      setEditLinkURL('');
      setEditLinkColumnId('');
      setEditLinkInternshipId('');
      
      fetchInternships();
      
      toast({
        title: 'Success',
        description: 'Link saved successfully!',
      });
    } catch (error) {
      console.error('Error saving link:', error);
      toast({
        title: 'Error',
        description: 'Failed to save link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPdfFieldDisplay = (internshipId: string, field: string, value: string) => {
    if (editRowId === internshipId) {
      return (
        <div className="flex flex-col space-y-2">
          <Input 
            id={`${field}-${internshipId}`}
            type="text"
            defaultValue={value || ''}
          />
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => {
              setFileUrlField(field);
              document.getElementById(`file-upload-${field}-${internshipId}`)?.click();
            }}>
              <File className="h-4 w-4 mr-1" /> Choose File
            </Button>
            <input
              id={`file-upload-${field}-${internshipId}`}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileForUpload(e.target.files[0]);
                  handleUploadFile(internshipId, field);
                }
              }}
            />
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsLinkEditable(true);
                setEditLinkURL(value || '');
                setEditLinkColumnId(field);
                setEditLinkInternshipId(internshipId);
              }}
            >
              <LinkIcon className="h-4 w-4 mr-1" /> Add Link
            </Button>
          </div>
        </div>
      );
    }
    
    return value ? (
      <a 
        href={value} 
        target="_blank" 
        rel="noreferrer" 
        className="text-blue-500 hover:underline flex items-center"
      >
        <FileText className="h-4 w-4 mr-1" />
        View
        <ExternalLink className="h-3 w-3 ml-1" />
      </a>
    ) : 'Not available';
  };

  const renderDynamicPdfField = (internshipId: string, column: any, value: any) => {
    if (editRowId === internshipId && column.type === 'pdf') {
      return (
        <div className="flex flex-col space-y-2">
          <Input 
            id={`dynamic-input-${column.id}-${internshipId}`}
            type="text"
            defaultValue={value?.value || ''}
          />
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => {
              setFileUrlField(column.id);
              document.getElementById(`file-upload-${column.id}-${internshipId}`)?.click();
            }}>
              <File className="h-4 w-4 mr-1" /> Choose File
            </Button>
            <input
              id={`file-upload-${column.id}-${internshipId}`}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileForUpload(e.target.files[0]);
                  handleUploadFile(internshipId, column.id);
                }
              }}
            />
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsLinkEditable(true);
                setEditLinkURL(value?.value || '');
                setEditLinkColumnId(column.id);
                setEditLinkInternshipId(internshipId);
              }}
            >
              <LinkIcon className="h-4 w-4 mr-1" /> Add Link
            </Button>
          </div>
        </div>
      );
    } else if (column.type === 'pdf') {
      return (
        <InternshipDynamicField
          value={value || { id: '', column_id: column.id, value: '' }}
          isEditing={false}
          columnType={column.type}
          onChange={handleUpdateDynamicValue}
        />
      );
    } else if (editRowId === internshipId) {
      return (
        <Input
          id={`dynamic-input-${column.id}-${internshipId}`}
          type={column.type === 'number' ? 'number' : 'text'}
          defaultValue={value?.value || ''}
        />
      );
    }
    
    return value?.value || '';
  };

  const renderTableRow = (internship: any) => (
    <TableRow key={internship.id} id={`internship-row-${internship.id}`} className="border-b hover:bg-gray-50">
      <TableCell className="w-[50px]">
        <Input
          type="checkbox"
          checked={selectedInternships.includes(internship.id)}
          onChange={() => handleSelectInternship(internship.id)}
        />
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="text"
            name="roll_no"
            value={editedInternship.roll_no || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.roll_no
        )}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="text"
            name="name"
            value={editedInternship.name || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.name
        )}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="email"
            name="email"
            value={editedInternship.email || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.email
        )}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="text"
            name="phone_no"
            value={editedInternship.phone_no || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.phone_no
        )}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="text"
            name="domain"
            value={editedInternship.domain || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.domain
        )}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="text"
            name="organization_name"
            value={editedInternship.organization_name || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.organization_name
        )}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="text"
            name="position"
            value={editedInternship.position || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.position
        )}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="date"
            name="starting_date"
            value={editedInternship.starting_date || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.starting_date
        )}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="date"
            name="ending_date"
            value={editedInternship.ending_date || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.ending_date
        )}
      </TableCell>
      <TableCell>
        {calculateInternshipDuration(internship.starting_date, internship.ending_date)}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="text"
            name="session"
            value={editedInternship.session || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.session
        )}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="text"
            name="year"
            value={editedInternship.year || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.year
        )}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="text"
            name="semester"
            value={editedInternship.semester || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.semester
        )}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="text"
            name="program"
            value={editedInternship.program || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.program
        )}
      </TableCell>
      <TableCell>
        {getPdfFieldDisplay(internship.id, 'offer_letter_url', internship.offer_letter_url)}
      </TableCell>
      <TableCell>
        {getPdfFieldDisplay(internship.id, 'noc_url', internship.noc_url)}
      </TableCell>
      <TableCell>
        {getPdfFieldDisplay(internship.id, 'ppo_url', internship.ppo_url)}
      </TableCell>
      <TableCell>
        {editRowId === internship.id ? (
          <Input
            type="text"
            name="faculty_coordinator"
            value={editedInternship.faculty_coordinator || ''}
            onChange={handleInputChange}
          />
        ) : (
          internship.faculty_coordinator
        )}
      </TableCell>
      {dynamicColumns.map((column) => {
        const dynamicValue = getDynamicColumnValueForInternship(internship.id, column.id);
        return (
          <TableCell key={`${internship.id}-${column.id}`}>
            {renderDynamicPdfField(internship.id, column, dynamicValue)}
          </TableCell>
        );
      })}
      <TableCell className="text-right">
        {editRowId === internship.id ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              onClick={handleSaveRow}
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
              onClick={() => setEditRowId(null)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditRow(internship)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Row
          </Button>
        )}
      </TableCell>
    </TableRow>
  );

  const handleAddInternship = async () => {
    try {
      const facultyData = sessionStorage.getItem('faculty');
      const faculty = facultyData ? JSON.parse(facultyData) : null;
      
      const { data, error } = await supabase
        .from('internships')
        .insert([{
          roll_no: 'NEW',
          name: 'New Internship',
          faculty_coordinator: faculty ? faculty.name : '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      await fetchInternships();
      
      if (data) {
        setEditRowId(data.id);
        setEditedInternship(data);
        
        setTimeout(() => {
          const row = document.getElementById(`internship-row-${data.id}`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        toast({
          title: 'Success',
          description: 'New internship added. Please fill in the details.',
        });
      }
    } catch (error) {
      console.error('Error adding internship:', error);
      toast({
        title: 'Error',
        description: 'Failed to add new internship. Please try again.',
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
            Export Template
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
              <TableHead>Phone No</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Offer Letter</TableHead>
              <TableHead>NOC</TableHead>
              <TableHead>PPO</TableHead>
              <TableHead>Faculty Coordinator</TableHead>
              {dynamicColumns.map((column) => (
                <TableHead key={column.id} className="relative min-w-[150px]">
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={20 + dynamicColumns.length} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : internships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={20 + dynamicColumns.length} className="text-center py-8">
                  No internships found. Try adjusting your filters or adding new internships.
                </TableCell>
              </TableRow>
            ) : (
              internships.map(renderTableRow)
            )}
          </TableBody>
        </Table>
      </div>

      {internships.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || isLoading}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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

      <Dialog open={showAddColumnModal} onOpenChange={setShowAddColumnModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dynamic Column</DialogTitle>
            <DialogDescription>
              Add a new column to track additional internship information.
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
                  <SelectItem value="pdf">PDF/Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddColumn}>
              Add Column
            </Button>
          </DialogFooter>
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

      <Dialog open={isLinkEditable} onOpenChange={setIsLinkEditable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add or Edit Link</DialogTitle>
            <DialogDescription>
              Enter the URL for the document or resource
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="link_url" className="text-right">
                URL
              </label>
              <Input
                type="text"
                id="link_url"
                value={editLinkURL}
                onChange={(e) => setEditLinkURL(e.target.value)}
                className="col-span-3"
                placeholder="https://example.com/document.pdf"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSaveLink} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Link
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsLinkEditable(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end mt-4">
        <Button onClick={() => setShowAddColumnModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dynamic Column
        </Button>
      </div>
    </div>
  );
};

export default InternshipTable;
