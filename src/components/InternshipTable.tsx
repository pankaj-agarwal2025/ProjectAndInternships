
import React, { useState, useEffect } from 'react';
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
import { Calendar as CalendarIcon, Trash2, FileText, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

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

// Component to display dynamic column values
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
  return <span>{value || 'Click to add'}</span>;
};

const InternshipTable: React.FC<InternshipTableProps> = ({ filters }) => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [editableCell, setEditableCell] = useState<{ id: string, field: string } | null>(null);
  const [newValue, setNewValue] = useState<string>('');
  const [dynamicColumns, setDynamicColumns] = useState<DynamicColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [fileUploading, setFileUploading] = useState<{ id: string, field: string } | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
      
      // Apply filters if they exist
      if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching internships:', error);
        throw error;
      }
      
      if (data) {
        // Format dates for display (dd-mm-yyyy)
        const formattedData = data.map(internship => ({
          ...internship,
          starting_date: internship.starting_date ? formatDateForDisplay(internship.starting_date) : '',
          ending_date: internship.ending_date ? formatDateForDisplay(internship.ending_date) : ''
        }));
        
        setInternships(formattedData);
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
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  };
  
  const formatDateForDB = (dateString: string) => {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  };
  
  const handleEdit = (id: string, field: string, value: string) => {
    setEditableCell({ id, field });
    setNewValue(value);
  };
  
  const handleSave = async () => {
    if (!editableCell) return;
    
    try {
      const { id, field } = editableCell;
      
      // For date fields, convert from dd-mm-yyyy to yyyy-mm-dd for database
      let valueToSave = newValue;
      if (field === 'starting_date' || field === 'ending_date') {
        valueToSave = formatDateForDB(newValue);
      }
      
      const updateData: Record<string, any> = {
        [field]: valueToSave,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('internships')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating internship:', error);
        throw error;
      }
      
      // Update local state
      setInternships(internships.map(internship => 
        internship.id === id 
          ? { ...internship, [field]: newValue } 
          : internship
      ));
      
      toast({
        title: 'Success',
        description: 'Internship updated successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update internship',
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
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this internship record?')) return;
    
    try {
      const { error } = await supabase
        .from('internships')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting internship:', error);
        throw error;
      }
      
      // Update local state
      setInternships(internships.filter(internship => internship.id !== id));
      
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
    }
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
      // Check if a value already exists
      const { data: existingValue, error: fetchError } = await supabase
        .from('internship_dynamic_column_values')
        .select('*')
        .eq('internship_id', internshipId)
        .eq('column_id', columnId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error('Error fetching dynamic column value:', fetchError);
        throw fetchError;
      }
      
      if (existingValue) {
        // Update existing value
        const { error } = await supabase
          .from('internship_dynamic_column_values')
          .update({ value })
          .eq('id', existingValue.id);
        
        if (error) {
          console.error('Error updating dynamic column value:', error);
          throw error;
        }
      } else {
        // Insert new value
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
      // Upload file to Supabase storage
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
        // Get public URL
        const { data: publicURLData } = supabase.storage
          .from('documents')
          .getPublicUrl(data.path);
        
        // Update internship with file URL
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
        
        // Update local state
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
        // Format dates for display
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
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(
        internships.map(internship => {
          const exportData: Record<string, any> = { ...internship };
          
          // Remove unnecessary fields
          delete exportData.id;
          delete exportData.created_at;
          delete exportData.updated_at;
          
          return exportData;
        })
      );
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Internships');
      
      // Export to file
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
  
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target || !e.target.result) return;
        
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Insert into database
        for (const row of jsonData) {
          const internshipData: Record<string, any> = {};
          
          // Map Excel columns to database columns
          Object.entries(row).forEach(([key, value]) => {
            // Handle date fields
            if (key === 'starting_date' || key === 'ending_date') {
              if (typeof value === 'string') {
                // If date is in dd-mm-yyyy format, convert to yyyy-mm-dd
                if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
                  internshipData[key] = formatDateForDB(value);
                } else {
                  internshipData[key] = value;
                }
              } else if (value instanceof Date) {
                internshipData[key] = value.toISOString().split('T')[0];
              } else {
                internshipData[key] = value;
              }
            } else {
              internshipData[key] = value;
            }
          });
          
          // Insert into database
          await supabase.from('internships').insert(internshipData);
        }
        
        toast({
          title: 'Success',
          description: `${jsonData.length} records imported successfully`,
        });
        
        // Refresh data
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
  
  // Page navigation
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
    if (editableCell && editableCell.id === internship.id && editableCell.field === field) {
      // Different input types based on the field
      if (field === 'faculty_coordinator') {
        return (
          <div className="flex items-center">
            <select
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full p-1 border rounded"
            >
              <option value="">Select Coordinator</option>
              {facultyCoordinators.map((coord) => (
                <option key={coord} value={coord}>
                  {coord}
                </option>
              ))}
            </select>
            <Button size="sm" variant="ghost" onClick={handleSave} className="ml-1">✓</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="ml-1">✕</Button>
          </div>
        );
      } else if (field === 'program') {
        return (
          <div className="flex items-center">
            <select
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full p-1 border rounded"
            >
              <option value="">Select Program</option>
              {programOptions.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
            <Button size="sm" variant="ghost" onClick={handleSave} className="ml-1">✓</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="ml-1">✕</Button>
          </div>
        );
      } else if (field === 'starting_date' || field === 'ending_date') {
        return (
          <div className="flex items-center">
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
                  selected={newValue ? new Date(formatDateForDB(newValue)) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setNewValue(format(date, 'dd-MM-yyyy'));
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="ghost" onClick={handleSave} className="ml-1">✓</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="ml-1">✕</Button>
          </div>
        );
      } else {
        return (
          <div className="flex items-center">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full p-1"
            />
            <Button size="sm" variant="ghost" onClick={handleSave} className="ml-1">✓</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="ml-1">✕</Button>
          </div>
        );
      }
    } else {
      // File upload fields
      if (field === 'offer_letter_url' || field === 'noc_url' || field === 'ppo_url') {
        return (
          <div className="flex items-center justify-between">
            {internship[field] ? (
              <a href={internship[field]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                <FileText size={16} className="mr-1" />
                View
              </a>
            ) : (
              <span className="text-gray-400">No file</span>
            )}
            <label className="cursor-pointer text-secondary hover:text-secondary-dark ml-2">
              {fileUploading && fileUploading.id === internship.id && fileUploading.field === field ? (
                <span>Uploading...</span>
              ) : (
                <span>Upload</span>
              )}
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e, internship.id, field)}
              />
            </label>
          </div>
        );
      }
      
      // For dates, show calendar picker
      if (field === 'starting_date' || field === 'ending_date') {
        return (
          <div
            className="cursor-pointer hover:bg-gray-100 p-1 rounded"
            onClick={() => handleEdit(internship.id, field, internship[field] || '')}
          >
            {internship[field] || 'Click to add'}
          </div>
        );
      }
      
      // For regular fields
      return (
        <div
          className="cursor-pointer hover:bg-gray-100 p-1 rounded"
          onClick={() => handleEdit(internship.id, field, internship[field] || '')}
        >
          {internship[field] || 'Click to add'}
        </div>
      );
    }
  };
  
  if (loading) {
    return <div className="p-8 text-center">Loading internship data...</div>;
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <Button onClick={handleAddInternship} className="bg-primary hover:bg-primary/90">
            Add New Internship
          </Button>
          <div>
            <label htmlFor="import-excel" className="cursor-pointer">
              <Button variant="outline" className="mr-2">
                Import Excel
              </Button>
              <input
                id="import-excel"
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleImportExcel}
              />
            </label>
            <Button variant="outline" onClick={exportToExcel}>
              Export Excel
            </Button>
          </div>
        </div>
        <div>
          <Button 
            variant={showAddColumn ? "default" : "outline"} 
            onClick={() => setShowAddColumn(!showAddColumn)}
          >
            {showAddColumn ? 'Cancel' : 'Add Column'}
          </Button>
        </div>
      </div>
      
      {showAddColumn && (
        <div className="mb-6 p-4 border rounded-md bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Add New Column</h3>
          <div className="flex flex-wrap gap-4">
            <div className="grow">
              <label className="block text-sm font-medium mb-1">Column Name</label>
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter column name"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={newColumnType}
                onChange={(e) => setNewColumnType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="file">File</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddColumn}>Add Column</Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead>Roll No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Starting Date</TableHead>
              <TableHead>Ending Date</TableHead>
              <TableHead>Duration (days)</TableHead>
              <TableHead>Faculty Coordinator</TableHead>
              <TableHead>Offer Letter</TableHead>
              <TableHead>NOC</TableHead>
              <TableHead>PPO</TableHead>
              {dynamicColumns.map((column) => (
                <TableHead key={column.id}>{column.name}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentInternships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15 + dynamicColumns.length} className="text-center py-8">
                  No internships found. Click "Add New Internship" to create one.
                </TableCell>
              </TableRow>
            ) : (
              currentInternships.map((internship) => (
                <TableRow key={internship.id} className="hover:bg-gray-50">
                  <TableCell>{renderCell(internship, 'roll_no', 'Roll No')}</TableCell>
                  <TableCell>{renderCell(internship, 'name', 'Name')}</TableCell>
                  <TableCell>{renderCell(internship, 'email', 'Email')}</TableCell>
                  <TableCell>{renderCell(internship, 'phone_no', 'Phone')}</TableCell>
                  <TableCell>{renderCell(internship, 'organization_name', 'Organization')}</TableCell>
                  <TableCell>{renderCell(internship, 'position', 'Position')}</TableCell>
                  <TableCell>{renderCell(internship, 'program', 'Program')}</TableCell>
                  <TableCell>{renderCell(internship, 'session', 'Session')}</TableCell>
                  <TableCell>{renderCell(internship, 'starting_date', 'Starting Date')}</TableCell>
                  <TableCell>{renderCell(internship, 'ending_date', 'Ending Date')}</TableCell>
                  <TableCell>{internship.internship_duration || '-'}</TableCell>
                  <TableCell>{renderCell(internship, 'faculty_coordinator', 'Faculty Coordinator')}</TableCell>
                  <TableCell>{renderCell(internship, 'offer_letter_url', 'Offer Letter')}</TableCell>
                  <TableCell>{renderCell(internship, 'noc_url', 'NOC')}</TableCell>
                  <TableCell>{renderCell(internship, 'ppo_url', 'PPO')}</TableCell>
                  
                  {/* Dynamic columns */}
                  {dynamicColumns.map((column) => (
                    <TableCell key={column.id}>
                      {
                        (() => {
                          if (editableCell && editableCell.id === internship.id && editableCell.field === column.id) {
                            return (
                              <div className="flex items-center">
                                <Input
                                  value={newValue}
                                  onChange={(e) => setNewValue(e.target.value)}
                                  className="w-full p-1"
                                />
                                <Button size="sm" variant="ghost" onClick={handleSave} className="ml-1">✓</Button>
                                <Button size="sm" variant="ghost" onClick={handleCancel} className="ml-1">✕</Button>
                              </div>
                            );
                          } else {
                            return (
                              <div
                                className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                onClick={() => {
                                  setEditableCell({ id: internship.id, field: column.id });
                                  // Fetch existing value
                                  supabase
                                    .from('internship_dynamic_column_values')
                                    .select('value')
                                    .eq('internship_id', internship.id)
                                    .eq('column_id', column.id)
                                    .single()
                                    .then(({ data, error }) => {
                                      if (error && error.code !== 'PGRST116') {
                                        console.error('Error fetching dynamic column value:', error);
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to fetch dynamic column value',
                                          variant: 'destructive',
                                        });
                                      } else {
                                        setNewValue(data ? data.value : '');
                                      }
                                    });
                                }}
                              >
                                <DynamicColumnValue 
                                  internshipId={internship.id} 
                                  columnId={column.id}
                                />
                              </div>
                            );
                          }
                        })()
                      }
                    </TableCell>
                  ))}
                  
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(internship.id)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination controls */}
      {internships.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-sm text-gray-700">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, internships.length)} of {internships.length} entries
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show 5 pages at most centered around the current page
                let pageNum = currentPage;
                if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                // Ensure pageNum is within valid range
                if (pageNum > 0 && pageNum <= totalPages) {
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => paginate(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                }
                return null;
              })}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              Next
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipTable;
