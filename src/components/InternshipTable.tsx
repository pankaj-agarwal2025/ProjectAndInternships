
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

  // Create a placeholder component. This will be fully implemented later.
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {}} // Will implement generatePDF function later
            className="mr-2"
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => {}}> {/* Will implement exportExcel function later */}
            <Download className="mr-2 h-4 w-4" />
            Export Template
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

      {/* Table will be implemented here */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Select</TableHead>
              <TableHead>Roll No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                {internships.length === 0 ? (
                  'No internships found. Try adjusting your filters or adding new internships.'
                ) : (
                  'Loading internships...'
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={() => setShowAddColumnModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dynamic Column
        </Button>
      </div>

      {/* Add the placeholder dialogs and alerts for the full implementation */}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InternshipTable;
