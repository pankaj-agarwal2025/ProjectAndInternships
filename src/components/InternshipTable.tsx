import React, { useState, useEffect, useRef } from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInMonths, differenceInDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  Trash2, 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  Save,
  Download,
  FileUp,
  X,
  Edit,
  Plus,
  FilePdf
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getInternshipDynamicColumns, deleteInternshipDynamicColumn } from '@/lib/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface InternshipTableProps {
  filters: Record<string, any>;
}

interface Internship {
  id: string;
  roll_no: string;
  name: string;
  email: string;
  phone_no: string;
  domain: string;
  session: string;
  year: string;
  semester: string;
  program: string;
  organization_name: string;
  starting_date: string;
  ending_date: string;
  internship_duration: number;
  position: string;
  offer_letter_url: string;
  noc_url: string;
  ppo_url: string;
  faculty_coordinator: string;
  [key: string]: any;
}

interface DynamicColumn {
  id: string;
  name: string;
  type: string;
}

const DynamicColumnValue = ({ internshipId, columnId }: { internshipId: string, columnId: string }) => {
  const [value, setValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('internship_dynamic_column_values')
          .select('value')
          .eq('internship_id', internshipId)
          .eq('column_id', columnId)
          .single();
        
        setIsLoading(false);
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching dynamic column value:', error);
          return;
        }
        
        setValue(data?.value || '');
        setEditValue(data?.value || '');
      } catch (err) {
        console.error('Error in DynamicColumnValue:', err);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [internshipId, columnId]);

  const handleSave = async () => {
    try {
      const { data: existingValue, error: fetchError } = await supabase
        .from('internship_dynamic_column_values')
        .select('*')
        .eq('internship_id', internshipId)
        .eq('column_id', columnId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching dynamic column value:', fetchError);
        throw fetchError;
      }
      
      if (existingValue) {
        const { error } = await supabase
          .from('internship_dynamic_column_values')
          .update({ value: editValue })
          .eq('id', existingValue.id);
        
        if (error) {
          console.error('Error updating dynamic column value:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('internship_dynamic_column_values')
          .insert({
            internship_id: internshipId,
            column_id: columnId,
            value: editValue,
          });
        
        if (error) {
          console.error('Error inserting dynamic column value:', error);
          throw error;
        }
      }
      
      setValue(editValue);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Value updated successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update value',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <span className="text-gray-400">Loading...</span>;
  
  if (isEditing) {
    return (
      <div className="flex items-center space-x-1">
        <Input 
          value={editValue} 
          onChange={(e) => setEditValue(e.target.value)} 
          className="h-8 text-sm"
          autoFocus
        />
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
          <Save className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between group">
      <span data-dynamic-value={`${internshipId}-${columnId}`}>{value || '-'}</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
        onClick={() => setIsEditing(true)}
      >
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  );
};

const InternshipTable: React.FC<InternshipTableProps> = ({ filters }) => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [editableCell, setEditableCell] = useState<{ id: string, field: string } | null>(null);
  const [editedCells, setEditedCells] = useState<Record<string, Record<string, any>>>({});
  const [newValue, setNewValue] = useState<string>('');
  const [dynamicColumns, setDynamicColumns] = useState<DynamicColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [fileUploading, setFileUploading] = useState<{ id: string, field: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteColumnConfirmOpen, setDeleteColumnConfirmOpen] = useState(false);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const programOptions = [
    'BSc (CS)', 'BSc (DS)', 'BSc (Cyber)', 'BCA', 'BCA AI/DS', 
    'BTech CSE', 'BTech FSD', 'BTech UI/UX', 'BTech AI/ML'
  ];
  
  const facultyCoordinators = ['Dr. Pankaj', 'Dr. Anshu', 'Dr. Meenu', 'Dr. Swati'];
  
  const totalPages = Math.ceil(internships.length / itemsPerPage);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInternships = internships.slice(indexOfFirstItem, indexOfLastItem);
  
  useEffect(() => {
    fetchInternships();
    fetchDynamicColumns();
  }, [filters]);
  
  const fetchInternships = async () => {
    setLoading(true);
    try {
      let query = supabase.from('internships').select('*');
      
      if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && key !== 'starting_month' && key !== 'searchTerm' && !key.startsWith('dynamic_')) {
            query = query.eq(key, value);
          }
        });
        
        if (filters.starting_month) {
          query = query.ilike('starting_date', `%-${filters.starting_month}-%`);
        }
        
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          query = query.or(`roll_no.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,organization_name.ilike.%${searchTerm}%`);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching internships:', error);
        throw error;
      }
      
      if (data) {
        const formattedData = data.map(internship => ({
          ...internship,
          starting_date: internship.starting_date ? formatDateForDisplay(internship.starting_date) : '',
          ending_date: internship.ending_date ? formatDateForDisplay(internship.ending_date) : ''
        }));
        
        setInternships(formattedData);
        setEditedCells({});
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch internships',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDynamicColumns = async () => {
    try {
      const columns = await getInternshipDynamicColumns();
      setDynamicColumns(columns);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dynamic columns',
        variant: 'destructive',
      });
    }
  };
  
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString; // Return original if error
    }
  };
  
  const formatDateForDB = (dateString: string) => {
    if (!dateString) return null;
    try {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Error formatting date for DB:", e);
      return dateString; // Return original if error
    }
  };
  
  const handleEdit = (id: string, field: string, value: string) => {
    setEditedCells(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
    setEditableCell({ id, field });
    setNewValue(value);
  };
  
  const handleSaveAll = async () => {
    try {
      for (const [id, fields] of Object.entries(editedCells)) {
        const updateData: Record<string, any> = {
          ...fields,
          updated_at: new Date().toISOString()
        };
        
        if (updateData.starting_date) {
          updateData.starting_date = formatDateForDB(updateData.starting_date);
        }
        if (updateData.ending_date) {
          updateData.ending_date = formatDateForDB(updateData.ending_date);
        }
        
        if (updateData.starting_date && updateData.ending_date) {
          const startDate = new Date(updateData.starting_date);
          const endDate = new Date(updateData.ending_date);
          const monthsDiff = differenceInMonths(endDate, startDate);
          const daysDiff = differenceInDays(endDate, startDate) % 30;
          updateData.internship_duration = monthsDiff;
        }
        
        const { error } = await supabase
          .from('internships')
          .update(updateData)
          .eq('id', id);
        
        if (error) {
          console.error(`Error updating internship ${id}:`, error);
          toast({
            title: 'Error',
            description: `Failed to update internship: ${error.message}`,
            variant: 'destructive',
          });
          return;
        }
      }
      
      fetchInternships();
      
      toast({
        title: 'Success',
        description: 'All changes saved successfully',
      });
      
      setEditedCells({});
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    }
  };
  
  const handleSaveRow = async (id: string) => {
    if (!editedCells[id]) return;
    
    try {
      const updateData: Record<string, any> = {
        ...editedCells[id],
        updated_at: new Date().toISOString()
      };
      
      if (updateData.starting_date) {
        updateData.starting_date = formatDateForDB(updateData.starting_date);
      }
      if (updateData.ending_date) {
        updateData.ending_date = formatDateForDB(updateData.ending_date);
      }
      
      if (updateData.starting_date && updateData.ending_date) {
        const startDate = new Date(updateData.starting_date);
        const endDate = new Date(updateData.ending_date);
        const monthsDiff = differenceInMonths(endDate, startDate);
        const daysDiff = differenceInDays(endDate, startDate) % 30;
        updateData.internship_duration = monthsDiff;
      }
      
      const { error } = await supabase
        .from('internships')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        console.error(`Error updating internship ${id}:`, error);
        toast({
          title: 'Error',
          description: `Failed to update internship: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }
      
      await fetchInternships();
      
      toast({
        title: 'Success',
        description: 'Changes saved successfully',
      });
      
      const newEditedCells = { ...editedCells };
      delete newEditedCells[id];
      setEditedCells(newEditedCells);
      
      if (editableCell?.id === id) {
        setEditableCell(null);
        setNewValue('');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    }
  };
  
  const handleSave = async () => {
    if (!editableCell) return;
    
    try {
      const { id, field } = editableCell;
      
      setEditedCells(prev => ({
        ...prev,
        [id]: { ...prev[id], [field]: newValue }
      }));
      
      setInternships(internships.map(internship => 
        internship.id === id 
          ? { ...internship, [field]: newValue } 
          : internship
      ));
      
      toast({
        title: 'Cell Updated',
        description: 'Click "Save" in the Actions column to save changes',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update cell',
        variant: 'destructive',
      });
    } finally {
      setEditableCell(null);
      setNewValue('');
    }
  };
  
  const handleCancel = () => {
    setEditableCell(null);
    setNewValue('');
  };
  
  const handleCancelRowEdits = (id: string) => {
    const newEditedCells = { ...editedCells };
    delete newEditedCells[id];
    setEditedCells(newEditedCells);
    
    if (editableCell?.id === id) {
      setEditableCell(null);
      setNewValue('');
    }
    
    fetchInternships();
  };
  
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase
        .from('internships')
        .delete()
        .eq('id', deleteId);
      
      if (error) {
        console.error('Error deleting internship:', error);
        throw error;
      }
      
      setInternships(internships.filter(internship => internship.id !== deleteId));
      
      toast({
        title: 'Success',
        description: 'Internship deleted successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete internship',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
      setDeleteConfirmOpen(false);
    }
  };
  
  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };
  
  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast({
        title: 'Error',
        description: 'Column name cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('internship_dynamic_columns')
        .insert({
          name: newColumnName,
          type: newColumnType,
        })
        .select();
      
      if (error) {
        console.error('Error adding column:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setDynamicColumns([...dynamicColumns, data[0]]);
        
        toast({
          title: 'Success',
          description: 'Column added successfully',
        });
        
        setNewColumnName('');
        setNewColumnType('text');
        setShowAddColumn(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add column',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteColumn = (columnId: string) => {
    setDeleteColumnId(columnId);
    setDeleteColumnConfirmOpen(true);
  };
  
  const confirmDeleteColumn = async () => {
    if (!deleteColumnId) return;
    
    try {
      await deleteInternshipDynamicColumn(deleteColumnId);
      
      setDynamicColumns(dynamicColumns.filter(col => col.id !== deleteColumnId));
      
      toast({
        title: 'Success',
        description: 'Column deleted successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete column',
        variant: 'destructive',
      });
    } finally {
      setDeleteColumnId(null);
      setDeleteColumnConfirmOpen(false);
    }
  };
  
  const handleDynamicColumnValueChange = async (internshipId: string, columnId: string, value: string) => {
    try {
      const { data: existingValue, error: fetchError } = await supabase
        .from('internship_dynamic_column_values')
        .select('*')
        .eq('internship_id', internshipId)
        .eq('column_id', columnId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching dynamic column value:', fetchError);
        throw fetchError;
      }
      
      if (existingValue) {
        const { error } = await supabase
          .from('internship_dynamic_column_values')
          .update({ value })
          .eq('id', existingValue.id);
        
        if (error) {
          console.error('Error updating dynamic column value:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('internship_dynamic_column_values')
          .insert({
            internship_id: internshipId,
            column_id: columnId,
            value,
          });
        
        if (error) {
          console.error('Error inserting dynamic column value:', error);
          throw error;
        }
      }
      
      toast({
        title: 'Success',
        description: 'Value updated successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update value',
        variant: 'destructive',
      });
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string, field: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setFileUploading({ id, field });
    const file = e.target.files[0];
    
    try {
      const fileName = `${field}_${id}_${new Date().getTime()}`;
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
      
      if (data) {
        const { data: publicURLData } = supabase.storage
          .from('documents')
          .getPublicUrl(data.path);
        
        setEditedCells(prev => ({
          ...prev,
          [id]: { ...prev[id], [field]: publicURLData.publicUrl }
        }));
        
        setInternships(internships.map(internship => 
          internship.id === id 
            ? { ...internship, [field]: publicURLData.publicUrl } 
            : internship
        ));
        
        toast({
          title: 'Success',
          description: 'File uploaded successfully. Click "Save" to save changes.',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setFileUploading(null);
    }
  };
  
  const handleURLInput = (id: string, field: string) => {
    handleEdit(id, field, internships.find(i => i.id === id)?.[field] || '');
  };
  
  const handleAddInternship = async () => {
    try {
      const { data, error } = await supabase
        .from('internships')
        .insert({
          roll_no: '',
          name: '',
          email: '',
          phone_no: '',
          domain: '',
          session: '',
          year: '',
          semester: '',
          program: '',
          organization_name: '',
          position: '',
          faculty_coordinator: '',
        })
        .select();
      
      if (error) {
        console.error('Error adding internship:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const newInternship = {
          ...data[0],
          starting_date: data[0].starting_date ? formatDateForDisplay(data[0].starting_date) : '',
          ending_date: data[0].ending_date ? formatDateForDisplay(data[0].ending_date) : ''
        };
        
        setInternships([newInternship, ...internships]);
        
        toast({
          title: 'Success',
          description: 'New internship added',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add internship',
        variant: 'destructive',
      });
    }
  };
  
  const exportToExcel = async () => {
    try {
      // Prepare data with dynamic column values
      const exportData = [];
      
      for (const internship of internships) {
        const rowData: Record<string, any> = { ...internship };
        
        // Remove internal fields
        delete rowData.id;
        delete rowData.created_at;
        delete rowData.updated_at;
        
        // Format dates consistently
        if (rowData.starting_date) {
          const [day, month, year] = rowData.starting_date.split('-').map(part => parseInt(part, 10));
          rowData.starting_date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
        
        if (rowData.ending_date) {
          const [day, month, year] = rowData.ending_date.split('-').map(part => parseInt(part, 10));
          rowData.ending_date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
        
        // Add dynamic column values
        for (const column of dynamicColumns) {
          try {
            const { data } = await supabase
              .from('internship_dynamic_column_values')
              .select('value')
              .eq('internship_id', internship.id)
              .eq('column_id', column.id)
              .single();
            
            rowData[column.name] = data?.value || '';
          } catch (error) {
            rowData[column.name] = '';
          }
        }
        
        exportData.push(rowData);
      }
      
      // Create and export the workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Internships');
      
      XLSX.writeFile(workbook, 'internships_data.xlsx');
      
      toast({
        title: 'Success',
        description: 'Data exported to Excel',
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };
  
  const exportToPDF = async () => {
    try {
      const doc = new jsPDF('landscape');
      
      // Add title and date
      doc.setFontSize(18);
      doc.text('Internship Data Report', 14, 20);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);
      
      // Add filter information if any
      if (Object.keys(filters).length > 0) {
        doc.setFontSize(12);
        doc.text('Applied Filters:', 14, 34);
        let yPos = 40;
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value && key !== 'searchTerm' && !key.startsWith('dynamic_')) {
            const filterName = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            doc.setFontSize(10);
            doc.text(`${filterName}: ${value}`, 14, yPos);
            yPos += 6;
          } else if (value && key === 'searchTerm') {
            doc.setFontSize(10);
            doc.text(`Search Term: ${value}`, 14, yPos);
            yPos += 6;
          } else if (value && key.startsWith('dynamic_')) {
            const columnId = key.replace('dynamic_', '');
            const column = dynamicColumns.find(c => c.id === columnId);
            if (column) {
              doc.setFontSize(10);
              doc.text(`${column.name}: ${value}`, 14, yPos);
              yPos += 6;
            }
          }
        });
      }
      
      // Get table headers
      const headers = ['Roll No', 'Name', 'Organization', 'Position', 'Program', 'Starting Date', 'Ending Date', 'Duration'];
      
      // Add dynamic column headers
      dynamicColumns.forEach(column => {
        headers.push(column.name);
      });

      // Helper function to convert React elements to strings for PDF
      const getDurationString = (internship: Internship) => {
        if (!internship.starting_date || !internship.ending_date) {
          return 'Ongoing';
        }
        
        try {
          const startDate = new Date(formatDateForDB(internship.starting_date) || '');
          const endDate = new Date(formatDateForDB(internship.ending_date) || '');
          
          const monthsDiff = differenceInMonths(endDate, startDate);
          const remainingDays = differenceInDays(endDate, startDate) % 30;
          
          return `${monthsDiff} month${monthsDiff !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
        } catch (error) {
          console.error("Error calculating duration:", error);
          return internship.internship_duration ? `${internship.internship_duration} months` : '-';
        }
      };
      
      // Create table data
      const getTableData = async () => {
        const rows = [];
        
        for (const internship of internships) {
          const row = [
            internship.roll_no || '',
            internship.name || '',
            internship.organization_name || '',
            internship.position || '',
            internship.program || '',
            internship.starting_date || '',
            internship.ending_date || '',
            getDurationString(internship)
          ];
          
          // Add dynamic column values
          for (const column of dynamicColumns) {
            try {
              const { data } = await supabase
                .from('internship_dynamic_column_values')
                .select('value')
                .eq('internship_id', internship.id)
                .eq('column_id', column.id)
                .single();
              
              row.push(data?.value || '');
            } catch (error) {
              row.push('');
            }
          }
          
          rows.push(row);
        }
        
        return rows;
      };
      
      const tableData = await getTableData();
      
      // Generate table with autoTable
      autoTable(doc, {
        startY: Object.keys(filters).length > 0 ? 50 : 35,
        head: [headers],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Save the PDF
      doc.save('internship_report.pdf');
      
      toast({
        title: 'Success',
        description: 'PDF exported successfully',
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        variant: 'destructive',
      });
    }
  };
  
  const getDurationText = (internship: Internship) => {
    if (!internship.starting_date || !internship.ending_date) {
      return <span className="text-blue-500 font-medium">Ongoing</span>;
    }
    
    try {
      const startDate = new Date(formatDateForDB(internship.starting_date) || '');
      const endDate = new Date(formatDateForDB(internship.ending_date) || '');
      
      const monthsDiff = differenceInMonths(endDate, startDate);
      const remainingDays = differenceInDays(endDate, startDate) % 30;
      
      return `${monthsDiff} month${monthsDiff !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
    } catch (error) {
      console.error("Error calculating duration:", error);
      return internship.internship_duration ? `${internship.internship_duration} months` : '-';
    }
  };
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  const renderCell = (internship: Internship, field: string, displayField: string) => {
    const isEditing = editableCell && editableCell.id === internship.id && editableCell.field === field;
    const hasChanges = editedCells[internship.id]?.[field] !== undefined;
    const valueToShow = hasChanges ? editedCells[internship.id][field] : internship[field];
    
    if (isEditing) {
      if (field === 'faculty_coordinator') {
        return (
          <div className="flex items-center border border-blue-300 bg-blue-50 rounded p-1">
            <select
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full p-1 bg-transparent focus:outline-none"
            >
              <option value="">Select Coordinator</option>
              {facultyCoordinators.map((coord) => (
                <option key={coord} value={coord}>
                  {coord}
                </option>
              ))}
            </select>
            <Button size="sm" variant="ghost" onClick={handleSave} className="ml-1 text-green-600">✓</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="ml-1 text-red-600">✕</Button>
          </div>
        );
      } else if (field === 'program') {
        return (
          <div className="flex items-center border border-blue-300 bg-blue-50 rounded p-1">
            <select
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full p-1 bg-transparent focus:outline-none"
            >
              <option value="">Select Program</option>
              {programOptions.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
            <Button size="sm" variant="ghost" onClick={handleSave} className="ml-1 text-green-600">✓</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="ml-1 text-red-600">✕</Button>
          </div>
        );
      } else if (field === 'starting_date' || field === 'ending_date') {
        return (
          <div className="flex items-center border border-blue-300 bg-blue-50 rounded p-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start text-left">
                  {newValue || 'Pick a date'}
                  <CalendarIcon className="ml-auto h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newValue ? new Date(formatDateForDB(newValue) || '') : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setNewValue(format(date, 'dd-MM-yyyy'));
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="ghost" onClick={handleSave} className="ml-1 text-green-600">✓</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="ml-1 text-red-600">✕</Button>
          </div>
        );
      } else if (field === 'offer_letter_url' || field === 'noc_url' || field === 'ppo_url') {
        return (
          <div className="flex items-center border border-blue-300 bg-blue-50 rounded p-1">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full p-1 border-none bg-transparent focus:outline-none"
              placeholder="Enter URL"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSave} className="ml-1 text-green-600">✓</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="ml-1 text-red-600">✕</Button>
          </div>
        );
      } else {
        return (
          <div className="flex items-center border border-blue-300 bg-blue-50 rounded p-1">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full p-1 border-none bg-transparent focus:outline-none"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSave} className="ml-1 text-green-600">✓</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="ml-1 text-red-600">✕</Button>
          </div>
        );
      }
    } else {
      if (field === 'offer_letter_url' || field === 'noc_url' || field === 'ppo_url') {
        return (
          <div className="flex flex-col space-y-2">
            {valueToShow && (
              <a
                href={valueToShow}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-primary hover:text-primary-dark"
              >
                <FileText className="h-4 w-4 mr-1" />
                View Document
              </a>
            )}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="file"
                  id={`file-${internship.id}-${field}`}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  onChange={(e) => handleFileUpload(e, internship.id, field)}
                  disabled={!!fileUploading}
                />
                <label
                  htmlFor={`file-${internship.id}-${field}`}
                  className={`text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 cursor-pointer ${
                    fileUploading?.id === internship.id && fileUploading?.field === field
                      ? 'opacity-50 cursor-wait'
                      : ''
                  }`}
                >
                  {fileUploading?.id === internship.id && fileUploading?.field === field
                    ? 'Uploading...'
                    : 'Upload File'}
                </label>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0"
                onClick={() => handleURLInput(internship.id, field)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      }
      
      if (field === 'internship_duration') {
        return getDurationText(internship);
      }
      
      return (
        <div className="flex items-center justify-between group">
          <span className={hasChanges ? 'font-medium text-blue-600' : ''}>
            {valueToShow || '-'}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
            onClick={() => handleEdit(internship.id, field, valueToShow || '')}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      );
    }
  };
  
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">Loading internship data...</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span>Show</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
            <SelectTrigger className="w-16">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="ml-auto flex items-center"
            onClick={() => setShowAddColumn(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Column
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={exportToExcel}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={exportToPDF}
            data-export-pdf
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          
          <Button 
            variant="default" 
            className="flex items-center"
            onClick={handleAddInternship}
            data-add-internship
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Internship
          </Button>
        </div>
      </div>
      
      {currentInternships.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Actions</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Starting Date</TableHead>
                <TableHead>Ending Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Offer Letter</TableHead>
                <TableHead>NOC</TableHead>
                <TableHead>PPO</TableHead>
                {dynamicColumns.map((column) => (
                  <TableHead key={column.id} className="relative group">
                    <div className="flex items-center justify-between pr-8">
                      <span>{column.name}</span>
                      <Button
                        variant="ghost"
                        className="h-6 w-6 p-0 absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteColumn(column.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentInternships.map((internship) => {
                const hasEdits = !!editedCells[internship.id];
                
                return (
                  <TableRow key={internship.id} className={hasEdits ? 'bg-blue-50' : ''}>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {hasEdits ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600"
                              onClick={() => handleSaveRow(internship.id)}
                              title="Save changes"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => handleCancelRowEdits(internship.id)}
                              title="Cancel changes"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600"
                            onClick={() => handleEdit(internship.id, 'name', internship.name || '')}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => confirmDelete(internship.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{renderCell(internship, 'roll_no', 'Roll No')}</TableCell>
                    <TableCell>{renderCell(internship, 'name', 'Name')}</TableCell>
                    <TableCell>{renderCell(internship, 'organization_name', 'Organization')}</TableCell>
                    <TableCell>{renderCell(internship, 'position', 'Position')}</TableCell>
                    <TableCell>{renderCell(internship, 'program', 'Program')}</TableCell>
                    <TableCell>{renderCell(internship, 'domain', 'Domain')}</TableCell>
                    <TableCell>{renderCell(internship, 'starting_date', 'Starting Date')}</TableCell>
                    <TableCell>{renderCell(internship, 'ending_date', 'Ending Date')}</TableCell>
                    <TableCell>{renderCell(internship, 'internship_duration', 'Duration')}</TableCell>
                    <TableCell>{renderCell(internship, 'offer_letter_url', 'Offer Letter')}</TableCell>
                    <TableCell>{renderCell(internship, 'noc_url', 'NOC')}</TableCell>
                    <TableCell>{renderCell(internship, 'ppo_url', 'PPO')}</TableCell>
                    
                    {dynamicColumns.map((column) => (
                      <TableCell key={column.id}>
                        <DynamicColumnValue 
                          internshipId={internship.id} 
                          columnId={column.id} 
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p>No internships found. Use the "Add Internship" button to create a new entry.</p>
        </div>
      )}
      
      {internships.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t">
          <div>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, internships.length)} of {internships.length} entries
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 1}
              className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => paginate(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Internship</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this internship? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={deleteColumnConfirmOpen} onOpenChange={setDeleteColumnConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this column and all of its data across all internships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={confirmDeleteColumn}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Column</DialogTitle>
            <DialogDescription>
              Add a new column to track additional internship information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="column-name" className="text-sm font-medium">
                Column Name
              </label>
              <Input
                id="column-name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="e.g., Internship Status"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="column-type" className="text-sm font-medium">
                Column Type
              </label>
              <Select
                value={newColumnType}
                onValueChange={setNewColumnType}
              >
                <SelectTrigger id="column-type">
                  <SelectValue placeholder="Select a column type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Yes/No</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                </SelectContent>
              </Select>
              {newColumnType === 'pdf' && (
                <p className="text-xs text-gray-500 mt-1">
                  <FilePdf className="inline-block h-3 w-3 mr-1" />
                  PDF columns allow users to upload and view PDF documents.
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowAddColumn(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddColumn}>
              Add Column
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternshipTable;
