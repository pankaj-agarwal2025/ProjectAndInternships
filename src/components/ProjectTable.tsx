
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
  File,
  Link as LinkIcon,
  ExternalLink,
  Users,
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
  addDynamicColumn, 
  getDynamicColumns, 
  addDynamicColumnValue, 
  getDynamicColumnValues, 
  deleteDynamicColumn, 
  uploadFile 
} from '@/lib/supabase';
import { Project, Student } from '@/lib/supabase';

interface ProjectTableProps {
  filters: Record<string, any>;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ filters }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editedProject, setEditedProject] = useState<Partial<Project>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [studentUpdates, setStudentUpdates] = useState<{ [id: string]: Partial<Student> }>({});
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
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
  const [editLinkProjectId, setEditLinkProjectId] = useState('');
  const { toast } = useToast();

  // Added three new evaluation columns
  const evaluationColumns = [
    { id: 'initial_evaluation', name: 'Initial Evaluation' },
    { id: 'progress_evaluation', name: 'Progress Evaluation' },
    { id: 'final_evaluation', name: 'Final Evaluation' }
  ];

  useEffect(() => {
    fetchProjects();
    fetchDynamicColumns();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      let query = supabase
        .from('projects')
        .select('*, students(*)')

      if (filters.group_no) {
        query = query.like('group_no', `%${filters.group_no}%`);
      }
      
      if (filters.domain) {
        query = query.like('domain', `%${filters.domain}%`);
      }
      
      if (filters.year) {
        query = query.like('year', `%${filters.year}%`);
      }
      
      if (filters.semester) {
        query = query.like('semester', `%${filters.semester}%`);
      }
      
      if (filters.session) {
        query = query.like('session', `%${filters.session}%`);
      }
      
      if (filters.faculty_coordinator) {
        query = query.like('faculty_coordinator', `%${filters.faculty_coordinator}%`);
      }
      
      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,group_no.ilike.%${filters.searchTerm}%`);
      }

      const { data: projectsData, error } = await query;

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch projects. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (projectsData) {
        setProjects(projectsData);
        const values: Record<string, any[]> = {};
        for (const project of projectsData) {
          const dynamicValues = await getDynamicColumnValues(project.id);
          values[project.id] = dynamicValues;
        }
        setDynamicColumnValues(values);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while fetching projects.',
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

  const handleSelectProject = (projectId: string) => {
    setSelectedProjects((prevSelected) =>
      prevSelected.includes(projectId)
        ? prevSelected.filter((id) => id !== projectId)
        : [...prevSelected, projectId]
    );
  };

  const handleEditRow = (project: Project) => {
    setEditRowId(project.id);
    setEditedProject(project);
  };

  const handleEditProject = (project: Project) => {
    setEditProjectId(project.id);
    setEditedProject(project);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedProject((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setEditedProject((prev) => ({
        ...prev,
        session: format(date, 'yyyy-MM-dd'),
      }));
    }
  };

  const handleSaveRowEdit = async () => {
    if (!editRowId) return;

    setIsSaving(true);
    try {
      if (editedProject) {
        // Update the project first
        await supabase
          .from('projects')
          .update(editedProject)
          .eq('id', editRowId);

        // Then update any dynamic column values
        if (dynamicColumnValues[editRowId]) {
          for (const dynamicValue of dynamicColumnValues[editRowId]) {
            const inputId = `dynamic-input-${dynamicValue.column_id}-${editRowId}`;
            const inputElement = document.getElementById(inputId) as HTMLInputElement;
            if (inputElement) {
              const newValue = inputElement.value;
              if (newValue !== dynamicValue.value) {
                await handleDynamicValueChange(editRowId, dynamicValue.dynamic_columns.id, newValue);
              }
            }
          }
        }

        // Update the PDF fields
        const pdfFields = ['progress_form_url', 'presentation_url', 'report_url', 'initial_evaluation', 'progress_evaluation', 'final_evaluation'];
        for (const field of pdfFields) {
          const inputId = `${field}-${editRowId}`;
          const inputElement = document.getElementById(inputId) as HTMLInputElement;
          if (inputElement && inputElement.value !== (editedProject as any)[field]) {
            await supabase
              .from('projects')
              .update({ [field]: inputElement.value })
              .eq('id', editRowId);
          }
        }

        fetchProjects();
        setEditRowId(null);
        setEditedProject({});
        toast({
          title: 'Success',
          description: 'Project updated successfully!',
        });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewStudents = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project && project.students) {
      setStudents(project.students);
      setStudentUpdates({});
      setSelectedGroupId(projectId);
      setShowStudentModal(true);
    } else {
      toast({
        title: 'No Students',
        description: 'There are no students associated with this project.',
        variant: 'default',
      });
    }
  };

  const handleSaveProject = async () => {
    if (!editProjectId) return;

    setIsSaving(true);
    try {
      if (editedProject) {
        await supabase
          .from('projects')
          .update(editedProject)
          .eq('id', editProjectId);

        fetchProjects();
        setEditProjectId(null);
        setEditedProject({});
        toast({
          title: 'Success',
          description: 'Project updated successfully!',
        });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProjects = () => {
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteProjects = async () => {
    setIsSaving(true);
    try {
      for (const projectId of selectedProjects) {
        // First delete any dynamic column values associated with this project
        await supabase
          .from('dynamic_column_values')
          .delete()
          .eq('project_id', projectId);
        
        // Then delete any students associated with this project
        await supabase
          .from('students')
          .delete()
          .eq('group_id', projectId);
        
        // Finally delete the project
        await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);
      }
      fetchProjects();
      setSelectedProjects([]);
      toast({
        title: 'Success',
        description: 'Projects deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete projects. Please try again.',
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

  const handleDynamicValueChange = async (projectId: string, columnId: string, newValue: string) => {
    try {
      const existingValue = dynamicColumnValues[projectId]?.find(
        v => v.dynamic_columns.id === columnId
      );
      
      if (existingValue) {
        await supabase
          .from('dynamic_column_values')
          .update({ value: newValue })
          .eq('id', existingValue.id);
          
        // Update local state
        const updatedValues = { ...dynamicColumnValues };
        updatedValues[projectId] = updatedValues[projectId].map(item => {
          if (item.id === existingValue.id) {
            return { ...item, value: newValue };
          }
          return item;
        });
        setDynamicColumnValues(updatedValues);
      } else {
        const result = await addDynamicColumnValue(columnId, projectId, newValue);
        if (result) {
          // Refresh dynamic values for this project
          const values = await getDynamicColumnValues(projectId);
          setDynamicColumnValues(prev => ({
            ...prev,
            [projectId]: values
          }));
        }
      }
    } catch (error) {
      console.error('Error updating dynamic value:', error);
      throw error;
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
      await deleteDynamicColumn(columnToDelete);
      fetchDynamicColumns();
      const updatedValues = { ...dynamicColumnValues };
      Object.keys(updatedValues).forEach(projectId => {
        updatedValues[projectId] = updatedValues[projectId].filter(
          item => item.dynamic_columns.id !== columnToDelete
        );
      });
      setDynamicColumnValues(updatedValues);
      
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
    } finally {
      setIsColumnDeleteAlertOpen(false);
      setColumnToDelete(null);
    }
  };

  const handleUploadFile = async (projectId: string, fieldName: string) => {
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
      const fileName = `${projectId}/${fieldName}/${fileForUpload.name}`;
      const fileUrl = await uploadFile(fileForUpload, 'projects', fileName);
      
      if (fileUrl) {
        if (dynamicColumns.some(col => col.id === fieldName)) {
          // It's a dynamic column
          await handleDynamicValueChange(projectId, fieldName, fileUrl);
        } else {
          // It's a built-in field
          await supabase
            .from('projects')
            .update({ [fieldName]: fileUrl })
            .eq('id', projectId);
        }
        
        fetchProjects();
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
    if (!editLinkURL || !editLinkProjectId || !editLinkColumnId) return;
    
    try {
      setIsSaving(true);
      
      if (dynamicColumns.some(col => col.id === editLinkColumnId)) {
        await handleDynamicValueChange(editLinkProjectId, editLinkColumnId, editLinkURL);
      } else {
        await supabase
          .from('projects')
          .update({ [editLinkColumnId]: editLinkURL })
          .eq('id', editLinkProjectId);
      }
      
      setIsLinkEditable(false);
      setEditLinkURL('');
      setEditLinkColumnId('');
      setEditLinkProjectId('');
      
      fetchProjects();
      
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

  const generatePdf = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text("Project Portal Report", 14, 10);
    
    // Add filter information at the top
    let filterText = 'Filter Information:\n';
    if (Object.keys(filters).length === 0) {
      filterText += 'No filters applied. Showing all projects.';
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
    
    // Create standard column headers
    const standardColumns = [
      'Group No',
      'Title',
      'Domain',
      'Faculty Mentor',
      'Industry Mentor',
      'Session',
      'Year',
      'Semester',
      'Faculty Coordinator',
      'Progress Form',
      'Presentation',
      'Report',
      'Initial Evaluation',
      'Progress Evaluation',
      'Final Evaluation'
    ];
    
    // Add dynamic column headers
    const allColumns = [
      ...standardColumns,
      ...dynamicColumns.map(column => column.name)
    ];
    
    // Create data rows
    const rows = projects.map(project => {
      const standardData = [
        project.group_no || '',
        project.title || '',
        project.domain || '',
        project.faculty_mentor || '',
        project.industry_mentor || '',
        project.session || '',
        project.year || '',
        project.semester || '',
        project.faculty_coordinator || '',
        project.progress_form_url ? 'Available' : 'Not Available',
        project.presentation_url ? 'Available' : 'Not Available',
        project.report_url ? 'Available' : 'Not Available',
        project.initial_evaluation || '',
        project.progress_evaluation || '',
        project.final_evaluation || ''
      ];
      
      const dynamicData = dynamicColumns.map(column => {
        const value = dynamicColumnValues[project.id]?.find(
          v => v.dynamic_columns?.id === column.id
        );
        return value ? value.value : '';
      });
      
      return [...standardData, ...dynamicData];
    });
    
    // Generate the table starting at y-position 40 to leave room for the title and filters
    autoTable(doc, {
      startY: 40,
      head: [allColumns],
      body: rows,
      didDrawPage: (data) => {
        // Header on each page
        doc.setFontSize(10);
        doc.text("Project Portal Report - " + new Date().toLocaleDateString(), data.settings.margin.left, 10);
      }
    });
    
    doc.save('projects.pdf');
  };

  const generateExcel = () => {
    // Create just the column structure for export
    const standardHeaders = {
      'Group No': 'group_no',
      'Title': 'title',
      'Domain': 'domain',
      'Faculty Mentor': 'faculty_mentor',
      'Industry Mentor': 'industry_mentor',
      'Session': 'session',
      'Year': 'year',
      'Semester': 'semester',
      'Faculty Coordinator': 'faculty_coordinator',
      'Progress Form': 'progress_form_url',
      'Presentation': 'presentation_url',
      'Report': 'report_url',
      'Initial Evaluation': 'initial_evaluation',
      'Progress Evaluation': 'progress_evaluation',
      'Final Evaluation': 'final_evaluation',
      // Add student-related columns
      'Student 1 Roll No': 'student1_roll_no',
      'Student 1 Name': 'student1_name',
      'Student 1 Email': 'student1_email',
      'Student 1 Program': 'student1_program',
      'Student 2 Roll No': 'student2_roll_no',
      'Student 2 Name': 'student2_name',
      'Student 2 Email': 'student2_email',
      'Student 2 Program': 'student2_program',
      'Student 3 Roll No': 'student3_roll_no',
      'Student 3 Name': 'student3_name',
      'Student 3 Email': 'student3_email',
      'Student 3 Program': 'student3_program',
      'Student 4 Roll No': 'student4_roll_no',
      'Student 4 Name': 'student4_name',
      'Student 4 Email': 'student4_email',
      'Student 4 Program': 'student4_program',
    };
    
    // Add dynamic column headers
    const headers: Record<string, string> = { ...standardHeaders };
    for (const column of dynamicColumns) {
      headers[column.name] = column.id;
    }
    
    // Create an empty row with just the column headers
    const headerRow: Record<string, string> = {};
    Object.keys(headers).forEach(key => {
      headerRow[key] = '';
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([headerRow]);
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    XLSX.writeFile(wb, 'projects_template.xlsx');
  };

  const renderPdfField = (projectId: string, field: string, value: string, label: string) => {
    if (editRowId === projectId) {
      return (
        <div className="flex flex-col space-y-2">
          <Input 
            id={`${field}-${projectId}`}
            type="text"
            defaultValue={value || ''}
          />
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => {
              setFileUrlField(field);
              document.getElementById(`file-upload-${field}-${projectId}`)?.click();
            }}>
              <File className="h-4 w-4 mr-1" /> Choose File
            </Button>
            <input
              id={`file-upload-${field}-${projectId}`}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileForUpload(e.target.files[0]);
                  handleUploadFile(projectId, field);
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
                setEditLinkProjectId(projectId);
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
        View {label}
        <ExternalLink className="h-3 w-3 ml-1" />
      </a>
    ) : 'Not available';
  };

  const renderDynamicColumnField = (projectId: string, column: any) => {
    const value = dynamicColumnValues[projectId]?.find(
      v => v.dynamic_columns?.id === column.id
    );
    
    if (editRowId === projectId) {
      if (column.type === 'pdf') {
        return (
          <div className="flex flex-col space-y-2">
            <Input 
              id={`dynamic-input-${column.id}-${projectId}`}
              type="text"
              defaultValue={value?.value || ''}
            />
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => {
                setFileUrlField(column.id);
                document.getElementById(`file-upload-${column.id}-${projectId}`)?.click();
              }}>
                <File className="h-4 w-4 mr-1" /> Choose File
              </Button>
              <input
                id={`file-upload-${column.id}-${projectId}`}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFileForUpload(e.target.files[0]);
                    handleUploadFile(projectId, column.id);
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
                  setEditLinkProjectId(projectId);
                }}
              >
                <LinkIcon className="h-4 w-4 mr-1" /> Add Link
              </Button>
            </div>
          </div>
        );
      } else {
        return (
          <Input
            id={`dynamic-input-${column.id}-${projectId}`}
            type={column.type === 'number' ? 'number' : 'text'}
            defaultValue={value?.value || ''}
          />
        );
      }
    }
    
    if (column.type === 'pdf' && value?.value) {
      return (
        <a 
          href={value.value} 
          target="_blank" 
          rel="noreferrer" 
          className="text-blue-500 hover:underline flex items-center"
        >
          <FileText className="h-4 w-4 mr-1" />
          View Document
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      );
    }
    
    return value?.value || '';
  };

  // Function to render student data
  const renderStudentsList = (project: Project) => {
    const studentsList = project.students || [];
    if (studentsList.length === 0) {
      return <span className="text-gray-500 italic">No students</span>;
    }

    return (
      <div className="flex items-center">
        <span>{studentsList.length} student(s)</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewStudents(project.id)}
          className="ml-1"
        >
          <Users className="h-4 w-4 mr-1" />
          View
        </Button>
      </div>
    );
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
            onClick={handleDeleteProjects}
            disabled={selectedProjects.length === 0}
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
              <TableHead>Group No</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Faculty Mentor</TableHead>
              <TableHead>Industry Mentor</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Faculty Coordinator</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Progress Form</TableHead>
              <TableHead>Presentation</TableHead>
              <TableHead>Report</TableHead>
              <TableHead>Initial Evaluation</TableHead>
              <TableHead>Progress Evaluation</TableHead>
              <TableHead>Final Evaluation</TableHead>
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
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={18 + dynamicColumns.length} className="text-center py-8">
                  No projects found. Try adjusting your filters or adding new projects.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <TableCell className="w-[50px]">
                    <Input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={() => handleSelectProject(project.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="group_no"
                        value={editedProject.group_no || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      project.group_no
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="title"
                        value={editedProject.title || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      project.title
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="domain"
                        value={editedProject.domain || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      project.domain
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="faculty_mentor"
                        value={editedProject.faculty_mentor || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      project.faculty_mentor
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="industry_mentor"
                        value={editedProject.industry_mentor || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      project.industry_mentor
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="session"
                        value={editedProject.session || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      project.session
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="year"
                        value={editedProject.year || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      project.year
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="semester"
                        value={editedProject.semester || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      project.semester
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="faculty_coordinator"
                        value={editedProject.faculty_coordinator || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      project.faculty_coordinator
                    )}
                  </TableCell>
                  <TableCell>
                    {renderStudentsList(project)}
                  </TableCell>
                  <TableCell>
                    {renderPdfField(project.id, 'progress_form_url', project.progress_form_url, 'Progress Form')}
                  </TableCell>
                  <TableCell>
                    {renderPdfField(project.id, 'presentation_url', project.presentation_url, 'Presentation')}
                  </TableCell>
                  <TableCell>
                    {renderPdfField(project.id, 'report_url', project.report_url, 'Report')}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="initial_evaluation"
                        id={`initial_evaluation-${project.id}`}
                        defaultValue={project.initial_evaluation || ''}
                      />
                    ) : (
                      project.initial_evaluation || 'Not evaluated'
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="progress_evaluation"
                        id={`progress_evaluation-${project.id}`}
                        defaultValue={project.progress_evaluation || ''}
                      />
                    ) : (
                      project.progress_evaluation || 'Not evaluated'
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        type="text"
                        name="final_evaluation"
                        id={`final_evaluation-${project.id}`}
                        defaultValue={project.final_evaluation || ''}
                      />
                    ) : (
                      project.final_evaluation || 'Not evaluated'
                    )}
                  </TableCell>
                  {dynamicColumns.map((column) => (
                    <TableCell key={`${project.id}-${column.id}`}>
                      {renderDynamicColumnField(project.id, column)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {editRowId === project.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveRowEdit}
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
                        onClick={() => handleEditRow(project)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Row
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete
              selected projects?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProjects}
              disabled={isSaving}
            >
              {isSaving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Students for Group {projects.find(p => p.id === selectedGroupId)?.group_no}</DialogTitle>
            <DialogDescription>
              Here are the students associated with this project.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Program</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No students found for this project.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell>{student.roll_no}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.program}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowStudentModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddColumnModal} onOpenChange={setShowAddColumnModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dynamic Column</DialogTitle>
            <DialogDescription>
              Add a new column to track additional project information.
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
            <AlertDialogCancel onClick={() => setIsColumnDeleteAlertOpen(false)}>
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

export default ProjectTable;
