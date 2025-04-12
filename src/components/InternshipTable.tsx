
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
  FileUp
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { jsPDF } from 'jspdf';
// @ts-ignore - Missing types for jspdf-autotable
import autoTable from 'jspdf-autotable';

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
      } catch (err) {
        console.error('Error in DynamicColumnValue:', err);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [internshipId, columnId]);

  if (isLoading) return <span className="text-gray-400">Loading...</span>;
  return <span>{value || '-'}</span>;
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
  const { toast } = useToast();
  
  // Program options
  const programOptions = [
    'BSc (CS)', 'BSc (DS)', 'BSc (Cyber)', 'BCA', 'BCA AI/DS', 
    'BTech CSE', 'BTech FSD', 'BTech UI/UX', 'BTech AI/ML'
  ];
  
  // Faculty coordinator options
  const facultyCoordinators = ['Dr. Pankaj', 'Dr. Anshu', 'Dr. Meenu', 'Dr. Swati'];
  
  // Calculate total pages
  const totalPages = Math.ceil(internships.length / itemsPerPage);
  
  // Get current items for pagination
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
          if (value && key !== 'starting_month') {
            query = query.eq(key, value);
          }
        });
        
        if (filters.starting_month) {
          query = query.ilike('starting_date', `%-${filters.starting_month}-%`);
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
      const { data, error } = await supabase
        .from('internship_dynamic_columns')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching dynamic columns:', error);
        throw error;
      }
      
      if (data) {
        setDynamicColumns(data);
      }
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
      return dateString;
    }
  };
  
  const formatDateForDB = (dateString: string) => {
    if (!dateString) return null;
    try {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Error formatting date for DB:", e);
      return dateString;
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
        description: 'Remember to click "Save All Changes" to persist to database',
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
        
        const { error: updateError } = await supabase
          .from('internships')
          .update({
            [field]: publicURLData.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        
        if (updateError) {
          console.error('Error updating internship with file URL:', updateError);
          throw updateError;
        }
        
        setInternships(internships.map(internship => 
          internship.id === id 
            ? { ...internship, [field]: publicURLData.publicUrl } 
            : internship
        ));
        
        toast({
          title: 'Success',
          description: 'File uploaded successfully',
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
  
  const exportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        internships.map(internship => {
          const exportData: Record<string, any> = { ...internship };
          
          delete exportData.id;
          delete exportData.created_at;
          delete exportData.updated_at;
          
          if (exportData.starting_date) {
            const [day, month, year] = exportData.starting_date.split('-');
            exportData.starting_date = `${year}-${month}-${day}`;
          }
          
          if (exportData.ending_date) {
            const [day, month, year] = exportData.ending_date.split('-');
            exportData.ending_date = `${year}-${month}-${day}`;
          }
          
          if (!exportData.ending_date) {
            exportData.internship_duration = 'Ongoing';
          }
          
          return exportData;
        })
      );
      
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
  
  const exportToPDF = () => {
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
          if (value) {
            const filterName = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            doc.setFontSize(10);
            doc.text(`${filterName}: ${value}`, 14, yPos);
            yPos += 6;
          }
        });
      }
      
      // Get table headers
      const headers = ['Roll No', 'Name', 'Organization', 'Position', 'Program', 'Starting Date', 'Ending Date', 'Duration'];
      
      // Create table data
      const data = internships.map(internship => [
        internship.roll_no || '',
        internship.name || '',
        internship.organization_name || '',
        internship.position || '',
        internship.program || '',
        internship.starting_date || '',
        internship.ending_date || '',
        internship.ending_date ? (internship.internship_duration || '') : 'Ongoing'
      ]);
      
      // Generate table
      (doc as any).autoTable({
        startY: Object.keys(filters).length > 0 ? 50 : 35,
        head: [headers],
        body: data,
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
  
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target || !e.target.result) return;
        
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        let updated = 0;
        let inserted = 0;
        let errors = 0;
        
        for (const row of jsonData) {
          try {
            const internshipData: Record<string, any> = {};
            
            Object.entries(row).forEach(([key, value]) => {
              const dbKey = key.toLowerCase().replace(/\s+/g, '_');
              
              if (typeof value === 'string') {
                internshipData[dbKey] = value;
              } else if (value instanceof Date) {
                internshipData[dbKey] = value.toISOString().split('T')[0];
              } else {
                internshipData[dbKey] = value;
              }
              
              if (dbKey === 'starting_date' || dbKey === 'ending_date') {
                if (typeof value === 'string') {
                  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
                    const [day, month, year] = value.split('-');
                    internshipData[dbKey] = `${year}-${month}-${day}`;
                  } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    internshipData[dbKey] = value;
                  } else if (/^\d+$/.test(value.toString())) {
                    const excelSerialDate = parseInt(value.toString());
                    const jsDate = new Date(Math.floor((excelSerialDate - 25569) * 86400 * 1000));
                    internshipData[dbKey] = jsDate.toISOString().split('T')[0];
                  }
                } else if (typeof value === 'number') {
                  const jsDate = new Date(Math.floor((value - 25569) * 86400 * 1000));
                  internshipData[dbKey] = jsDate.toISOString().split('T')[0];
                }
              }
            });
            
            if (internshipData.roll_no && internshipData.organization_name) {
              const { data: existingData, error: queryError } = await supabase
                .from('internships')
                .select('id')
                .eq('roll_no', internshipData.roll_no)
                .eq('organization_name', internshipData.organization_name);
              
              if (queryError) throw queryError;
              
              if (existingData && existingData.length > 0) {
                const { error: updateError } = await supabase
                  .from('internships')
                  .update(internshipData)
                  .eq('id', existingData[0].id);
                
                if (updateError) throw updateError;
                updated++;
              } else {
                const { error: insertError } = await supabase
                  .from('internships')
                  .insert(internshipData);
                
                if (insertError) throw insertError;
                inserted++;
              }
            } else {
              const { error: insertError } = await supabase
                .from('internships')
                .insert(internshipData);
              
              if (insertError) throw insertError;
              inserted++;
            }
          } catch (rowError) {
            console.error('Error processing row:', rowError, row);
            errors++;
          }
        }
        
        toast({
          title: 'Import Complete',
          description: `${inserted} records added, ${updated} records updated, ${errors} errors encountered.`,
        });
        
        fetchInternships();
      } catch (error) {
        console.error('Error importing Excel:', error);
        toast({
          title: 'Error',
          description: 'Failed to import data',
          variant: 'destructive',
        });
      }
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  const getInternshipDuration = (internship: Internship) => {
    if (!internship.ending_date) {
      return <span className="text-blue-500 font-medium">Ongoing</span>;
    }
    return internship.internship_duration || '-';
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
      // Different input types based on the field
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
      // File upload fields
      if (field === 'offer_letter_url' || field === 'noc_url' || field === 'ppo_url') {
        return (
          <div className="flex items-center space-x-2">
            {valueToShow ? (
              <a 
                href={valueToShow} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 flex items-center"
              >
                <FileText size={16} className="mr-1" />
                View
              </a>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  id={`file-upload-${internship.id}-${field}`}
                  className="sr-only"
                  onChange={(e) => handleFileUpload(e, internship.id, field)}
                  accept=".pdf,.doc,.docx"
                />
                <label
                  htmlFor={`file-upload-${internship.id}-${field}`}
                  className={`cursor-pointer text-gray-500 hover:text-blue-500 flex items-center ${
                    fileUploading && fileUploading.id === internship.id && fileUploading.field === field
                      ? 'opacity-50 pointer-events-none'
                      : ''
                  }`}
                >
                  <FileUp size={16} className="mr-1" />
                  {fileUploading && fileUploading.id === internship.id && fileUploading.field === field
                    ? 'Uploading...'
                    : 'Upload'}
                </label>
              </div>
            )}
          </div>
        );
      }
      
      if (field === 'internship_duration') {
        return <div>{getInternshipDuration(internship)}</div>;
      }
      
      if (field !== 'id' && 
          field !== 'offer_letter_url' && 
          field !== 'noc_url' && 
          field !== 'ppo_url' && 
          field !== 'created_at' && 
          field !== 'updated_at') {
        return (
          <div
            onClick={() => handleEdit(internship.id, field, valueToShow || '')}
            className={`cursor-pointer min-h-[20px] ${
              hasChanges ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
            }`}
          >
            {valueToShow || '-'}
          </div>
        );
      }
      
      return <div>{valueToShow || '-'}</div>;
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4 p-4">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddInternship}
            data-add-internship
          >
            + Add New Row
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddColumn(!showAddColumn)}
          >
            + Add Column
          </Button>
        </div>
        
        <div className="flex space-x-2">
          {Object.keys(editedCells).length > 0 && (
            <Button
              size="sm"
              className="flex items-center"
              onClick={handleSaveAll}
            >
              <Save className="mr-1 h-4 w-4" />
              Save All Changes
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={exportToExcel}
          >
            <Download className="mr-1 h-4 w-4" />
            Export Excel
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={exportToPDF}
          >
            <FileText className="mr-1 h-4 w-4" />
            Export PDF
          </Button>
          
          <div className="relative">
            <input
              type="file"
              id="excel-import"
              className="sr-only"
              onChange={handleImportExcel}
              accept=".xlsx,.xls"
            />
            <label
              htmlFor="excel-import"
              className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              <FileUp className="mr-1 h-4 w-4" />
              Import Excel
            </label>
          </div>
        </div>
      </div>
      
      {showAddColumn && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 mb-4 rounded-md border">
          <div className="text-sm font-medium mb-2">Add New Column</div>
          <div className="flex space-x-2">
            <Input
              placeholder="Column Name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="w-60"
            />
            <select
              value={newColumnType}
              onChange={(e) => setNewColumnType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
            </select>
            <Button onClick={handleAddColumn}>Add</Button>
            <Button variant="ghost" onClick={() => setShowAddColumn(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      ) : internships.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No internship data found. Add a new internship or import from Excel.
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Actions</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Starting Date</TableHead>
                  <TableHead>Ending Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Faculty Coordinator</TableHead>
                  <TableHead>Offer Letter</TableHead>
                  <TableHead>NOC</TableHead>
                  <TableHead>PPO</TableHead>
                  
                  {dynamicColumns.map((column) => (
                    <TableHead key={column.id}>{column.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentInternships.map((internship) => (
                  <TableRow key={internship.id}>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(internship.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{renderCell(internship, 'roll_no', 'Roll No')}</TableCell>
                    <TableCell>{renderCell(internship, 'name', 'Name')}</TableCell>
                    <TableCell>{renderCell(internship, 'email', 'Email')}</TableCell>
                    <TableCell>{renderCell(internship, 'phone_no', 'Phone')}</TableCell>
                    <TableCell>{renderCell(internship, 'domain', 'Domain')}</TableCell>
                    <TableCell>{renderCell(internship, 'session', 'Session')}</TableCell>
                    <TableCell>{renderCell(internship, 'year', 'Year')}</TableCell>
                    <TableCell>{renderCell(internship, 'semester', 'Semester')}</TableCell>
                    <TableCell>{renderCell(internship, 'program', 'Program')}</TableCell>
                    <TableCell>{renderCell(internship, 'organization_name', 'Organization')}</TableCell>
                    <TableCell>{renderCell(internship, 'position', 'Position')}</TableCell>
                    <TableCell>{renderCell(internship, 'starting_date', 'Starting Date')}</TableCell>
                    <TableCell>{renderCell(internship, 'ending_date', 'Ending Date')}</TableCell>
                    <TableCell>{renderCell(internship, 'internship_duration', 'Duration')}</TableCell>
                    <TableCell>{renderCell(internship, 'faculty_coordinator', 'Faculty Coordinator')}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
          
          {internships.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to{' '}
                {Math.min(indexOfLastItem, internships.length)} of{' '}
                {internships.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <ArrowLeft size={16} />
                </Button>
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => paginate(i + 1)}
                      className="w-8 h-8 p-0"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this row?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InternshipTable;
