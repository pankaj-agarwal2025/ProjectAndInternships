
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Trash2, 
  FileText, 
  Edit, 
  Plus, 
  Save, 
  File, 
  Link as LinkIcon, 
  ExternalLink,
  Download,
  Upload,
  X
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  getInternshipDynamicColumns, 
  deleteInternshipDynamicColumn, 
  addInternshipDynamicColumn,
  getInternshipDynamicColumnValues, 
  addInternshipDynamicColumnValue,
  uploadFile,
  Internship
} from '@/lib/supabase';

interface InternshipTableProps {
  filters: Record<string, any>;
}

const InternshipTable: React.FC<InternshipTableProps> = ({ filters }) => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternships, setSelectedInternships] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editInternshipId, setEditInternshipId] = useState<string | null>(null);
  const [editedInternship, setEditedInternship] = useState<Partial<Internship>>({});
  const [isAddInternshipModalOpen, setIsAddInternshipModalOpen] = useState(false);
  const [newInternship, setNewInternship] = useState<Partial<Internship>>({
    roll_no: '',
    name: '',
    email: '',
    phone_no: '',
    domain: '',
    organization_name: '',
    position: '',
    stipend: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicColumns, setDynamicColumns] = useState<any[]>([]);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [dynamicColumnValues, setDynamicColumnValues] = useState<Record<string, any[]>>({});
  const [isColumnDeleteAlertOpen, setIsColumnDeleteAlertOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const [fileForUpload, setFileForUpload] = useState<File | null>(null);
  const [fileUrlField, setFileUrlField] = useState('');
  const [isLinkEditable, setIsLinkEditable] = useState(false);
  const [editLinkURL, setEditLinkURL] = useState('');
  const [editLinkColumnId, setEditLinkColumnId] = useState('');
  const [editLinkInternshipId, setEditLinkInternshipId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadField, setUploadField] = useState<string | null>(null);
  const [uploadInternshipId, setUploadInternshipId] = useState<string | null>(null);
  const { toast } = useToast();

  // Add event listener for adding a new internship
  useEffect(() => {
    const handleAddNewInternship = () => setIsAddInternshipModalOpen(true);
    document.addEventListener('add-new-internship', handleAddNewInternship);
    
    return () => {
      document.removeEventListener('add-new-internship', handleAddNewInternship);
    };
  }, []);

  useEffect(() => {
    fetchInternships();
    fetchDynamicColumns();
  }, [filters]);

  const fetchInternships = async () => {
    try {
      let query = supabase
        .from('internships')
        .select('*');

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,roll_no.ilike.%${filters.searchTerm}%,organization_name.ilike.%${filters.searchTerm}%`);
      }
      
      if (filters.domain) {
        query = query.ilike('domain', `%${filters.domain}%`);
      }
      
      if (filters.year) {
        query = query.eq('year', filters.year);
      }
      
      if (filters.semester) {
        query = query.eq('semester', filters.semester);
      }
      
      if (filters.session) {
        query = query.ilike('session', `%${filters.session}%`);
      }
      
      if (filters.organization_name) {
        query = query.ilike('organization_name', `%${filters.organization_name}%`);
      }
      
      if (filters.program) {
        query = query.eq('program', filters.program);
      }
      
      // Apply month filter
      if (filters.month) {
        // Get all records and then filter by month using JavaScript
        // This is a workaround since we can't filter by month directly in the query
        const { data: allInternships } = await query;
        if (allInternships) {
          const filteredInternships = allInternships.filter(internship => {
            if (internship.starting_date) {
              const date = new Date(internship.starting_date);
              const month = date.toLocaleString('default', { month: 'long' });
              return month === filters.month;
            }
            return false;
          });
          setInternships(filteredInternships);
          
          // Fetch dynamic column values for the filtered internships
          const values: Record<string, any[]> = {};
          for (const internship of filteredInternships) {
            const dynamicValues = await getInternshipDynamicColumnValues(internship.id);
            values[internship.id] = dynamicValues;
          }
          setDynamicColumnValues(values);
          return;
        }
      }
      
      // Apply faculty coordinator filter
      if (filters.faculty_coordinator) {
        query = query.eq('faculty_coordinator', filters.faculty_coordinator);
      }

      const { data: internshipsData, error } = await query;

      if (error) {
        console.error('Error fetching internships:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch internships. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (internshipsData) {
        setInternships(internshipsData);
        const values: Record<string, any[]> = {};
        for (const internship of internshipsData) {
          const dynamicValues = await getInternshipDynamicColumnValues(internship.id);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, internshipId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileForUpload(file);
      setUploadField(fieldName);
      setUploadInternshipId(internshipId);
      handleFileUpload(file, fieldName, internshipId);
    }
  };

  const handleFileUpload = async (file: File, fieldName: string, internshipId: string) => {
    setIsUploading(true);
    try {
      const fileName = `${internshipId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const fileUrl = await uploadFile(file, 'internship_files', fileName);
      
      if (!fileUrl) {
        throw new Error('Failed to get file URL after upload');
      }
      
      // Update the internship with the new file URL
      const { error: updateError } = await supabase
        .from('internships')
        .update({ [fieldName]: fileUrl })
        .eq('id', internshipId);
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: 'Upload successful',
        description: 'File has been uploaded successfully.',
      });
      
      // Refresh the data
      fetchInternships();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setFileForUpload(null);
      setUploadField(null);
      setUploadInternshipId(null);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const { error } = await supabase
        .from('internships')
        .delete()
        .in('id', selectedInternships);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: `${selectedInternships.length} internships deleted successfully.`,
      });
      
      setSelectedInternships([]);
      fetchInternships();
    } catch (error) {
      console.error('Error deleting internships:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete internships. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  const toggleSelectInternship = (id: string) => {
    setSelectedInternships(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedInternships.length === internships.length) {
      setSelectedInternships([]);
    } else {
      setSelectedInternships(internships.map(i => i.id));
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Internship Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Define table columns
    const columns = [
      { header: 'Roll No', dataKey: 'roll_no' },
      { header: 'Name', dataKey: 'name' },
      { header: 'Organization', dataKey: 'organization_name' },
      { header: 'Position', dataKey: 'position' },
      { header: 'Stipend', dataKey: 'stipend' },
      { header: 'Duration', dataKey: 'internship_duration' },
    ];
    
    // Prepare data for table
    const data = internships.map(internship => ({
      roll_no: internship.roll_no || '',
      name: internship.name || '',
      organization_name: internship.organization_name || '',
      position: internship.position || '',
      stipend: internship.stipend || '',
      internship_duration: internship.internship_duration ? `${internship.internship_duration} days` : ''
    }));
    
    // Create table
    autoTable(doc, {
      columns: columns.map(col => ({ header: col.header, dataKey: col.dataKey })),
      body: data,
      startY: 40,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    // Save the PDF
    doc.save('internship-report.pdf');
  };

  const exportExcel = () => {
    // Prepare data for export
    const data = internships.map(internship => ({
      'Roll No': internship.roll_no,
      'Name': internship.name,
      'Email': internship.email,
      'Phone No': internship.phone_no,
      'Domain': internship.domain,
      'Organization': internship.organization_name,
      'Position': internship.position,
      'Stipend': internship.stipend,
      'Starting Date': internship.starting_date,
      'Ending Date': internship.ending_date,
      'Duration (Days)': internship.internship_duration,
      'Session': internship.session,
      'Year': internship.year,
      'Semester': internship.semester,
      'Program': internship.program,
      'Faculty Coordinator': internship.faculty_coordinator
    }));
    
    // Create a worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Create workbook and add the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Internships');
    
    // Generate and download the Excel file
    XLSX.writeFile(wb, 'internships-export.xlsx');
  };

  // Table rendering
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generatePDF}
            className="mr-2"
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
        <div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteAlertOpen(true)}
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
              <TableHead className="w-[50px]">
                <input 
                  type="checkbox" 
                  onChange={selectAll}
                  checked={selectedInternships.length === internships.length && internships.length > 0}
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead>Roll No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Stipend</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {internships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No internships found. Try adjusting your filters or adding new internships.
                </TableCell>
              </TableRow>
            ) : (
              internships.map(internship => (
                <TableRow key={internship.id}>
                  <TableCell>
                    <input 
                      type="checkbox" 
                      checked={selectedInternships.includes(internship.id)}
                      onChange={() => toggleSelectInternship(internship.id)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell>{internship.roll_no}</TableCell>
                  <TableCell>{internship.name}</TableCell>
                  <TableCell>{internship.organization_name}</TableCell>
                  <TableCell>{internship.position}</TableCell>
                  <TableCell>{internship.stipend}</TableCell>
                  <TableCell>
                    {internship.internship_duration ? `${internship.internship_duration} days` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`offer-letter-${internship.id}`}
                          className={`text-xs px-2 py-1 rounded cursor-pointer flex items-center gap-1 ${
                            internship.offer_letter_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Upload className="h-3 w-3" />
                          Offer Letter
                        </label>
                        <input
                          type="file"
                          id={`offer-letter-${internship.id}`}
                          className="hidden"
                          accept="application/pdf"
                          onChange={(e) => handleFileChange(e, 'offer_letter_url', internship.id)}
                        />
                        {internship.offer_letter_url && (
                          <a
                            href={internship.offer_letter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`noc-${internship.id}`}
                          className={`text-xs px-2 py-1 rounded cursor-pointer flex items-center gap-1 ${
                            internship.noc_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Upload className="h-3 w-3" />
                          NOC
                        </label>
                        <input
                          type="file"
                          id={`noc-${internship.id}`}
                          className="hidden"
                          accept="application/pdf"
                          onChange={(e) => handleFileChange(e, 'noc_url', internship.id)}
                        />
                        {internship.noc_url && (
                          <a
                            href={internship.noc_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`ppo-${internship.id}`}
                          className={`text-xs px-2 py-1 rounded cursor-pointer flex items-center gap-1 ${
                            internship.ppo_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Upload className="h-3 w-3" />
                          PPO
                        </label>
                        <input
                          type="file"
                          id={`ppo-${internship.id}`}
                          className="hidden"
                          accept="application/pdf"
                          onChange={(e) => handleFileChange(e, 'ppo_url', internship.id)}
                        />
                        {internship.ppo_url && (
                          <a
                            href={internship.ppo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setEditInternshipId(internship.id);
                          setEditedInternship({...internship});
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedInternships([internship.id]);
                          setIsDeleteAlertOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={() => setShowAddColumnModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dynamic Column
        </Button>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete
              {selectedInternships.length === 1 ? ' this internship?' : ` these ${selectedInternships.length} internships?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InternshipTable;
