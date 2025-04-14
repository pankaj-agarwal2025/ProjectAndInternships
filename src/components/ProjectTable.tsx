
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
  FilePlus,
  File,
  Link,
  ExternalLink,
  Check
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
import { addDynamicColumn, getDynamicColumns, addDynamicColumnValue, getDynamicColumnValues, deleteDynamicColumn, uploadFile } from '@/lib/supabase';
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
  const [dynamicColumns, setDynamicColumns] = useState([]);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [dynamicColumnValues, setDynamicColumnValues] = useState({});
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
        const values = {};
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
          if (inputElement && inputElement.value !== editedProject[field]) {
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

  const handleSaveProject = async () => {
    if (!editProjectId) return;

    setIsSaving(true);
    try {
      if (editedProject) {
        await supabase
          .from('projects')
          .update(editedProject)
          .eq('id', editProjectId);

        if (dynamicColumnValues[editProjectId]) {
          for (const dynamicValue of dynamicColumnValues[editProjectId]) {
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

        fetchProjects();
        setEditProjectId(null);
        setEditedProject({});
        toast({
          title: 'Success',
          description: 'Project updated successfully!',
        });
      } else {
        console.error('Edited project is undefined.');
        toast({
          title: 'Error',
          description: 'Failed to update project. Edited project is undefined.',
          variant: 'destructive',
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
      await handleDynamicValueChange(editLinkProjectId, editLinkColumnId, editLinkURL);
      
      setIsLinkEditable(false);
      setEditLinkURL('');
      setEditLinkColumnId('');
      setEditLinkProjectId('');
      
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
    // Create worksheet with just the column headers if requested
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
      'Final Evaluation': 'final_evaluation'
    };
    
    // Create headers including dynamic columns
    const headers = { ...standardHeaders };
    for (const column of dynamicColumns) {
      headers[column.name] = column.id;
    }
    
    // Export just structure or full data based on preference
    let data: any[] = [];
    
    // Export with data (default)
    data = projects.map(project => {
      const row: Record<string, any> = {};
      
      // Add standard fields
      for (const [header, field] of Object.entries(standardHeaders)) {
        row[header] = project[field] || '';
      }
      
      // Add dynamic columns
      for (const column of dynamicColumns) {
        const value = dynamicColumnValues[project.id]?.find(
          v => v.dynamic_columns?.id === column.id
        );
        row[column.name] = value ? value.value : '';
      }
      
      return row;
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data.length > 0 ? data : [headers]);
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    XLSX.writeFile(wb, 'projects.xlsx');
  };

  const handleShowStudentModal = async (groupId: string) => {
    setSelectedGroupId(groupId);
    try {
      const fetchedStudents = await supabase
        .from('students')
        .select('*')
        .eq('group_id', groupId);

      if (fetchedStudents && fetchedStudents.data) {
        setStudents(fetchedStudents.data);
        const initialUpdates = {};
        fetchedStudents.data.forEach(student => {
          initialUpdates[student.id] = {};
        });
        setStudentUpdates(initialUpdates);
      } else {
        setStudents([]);
        setStudentUpdates({});
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students. Please try again.',
        variant: 'destructive',
      });
    }
    setShowStudentModal(true);
  };

  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setSelectedGroupId(null);
    setStudents([]);
    setStudentUpdates({});
  };

  const handleStudentInputChange = (studentId: string, field: string, value: any) => {
    setStudentUpdates(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSaveStudentChanges = async () => {
    setIsSaving(true);
    try {
      for (const studentId in studentUpdates) {
        if (Object.keys(studentUpdates[studentId]).length > 0) {
          await supabase
            .from('students')
            .update(studentUpdates[studentId])
            .eq('id', studentId);
        }
      }
      toast({
        title: 'Success',
        description: 'Student details updated successfully!',
      });
      handleCloseStudentModal();
      fetchProjects();
    } catch (error) {
      console.error('Error updating student details:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName) {
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

  const handleDynamicValueChange = async (projectId: string, columnId: string, value: any) => {
    try {
      const existingValue = dynamicColumnValues[projectId]?.find(item => 
        item.dynamic_columns && item.dynamic_columns.id === columnId
      );

      if (existingValue) {
        await supabase
          .from('dynamic_column_values')
          .update({ value: value })
          .eq('id', existingValue.id);

        setDynamicColumnValues(prevValues => {
          const updatedProjectValues = prevValues[projectId]?.map(item => {
            if (item.dynamic_columns && item.dynamic_columns.id === columnId) {
              return { ...item, value: value };
            }
            return item;
          }) || [];

          return {
            ...prevValues,
            [projectId]: updatedProjectValues,
          };
        });

      } else {
        await addDynamicColumnValue(columnId, projectId, value);
        const updatedDynamicValues = await getDynamicColumnValues(projectId);

        setDynamicColumnValues(prevValues => ({
          ...prevValues,
          [projectId]: updatedDynamicValues,
        }));
      }
    } catch (error) {
      console.error('Error updating dynamic column value:', error);
      toast({
        title: 'Error',
        description: 'Failed to update dynamic column value. Please try again.',
        variant: 'destructive',
      });
      throw error;
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
        for (const projectId in prevValues) {
          updatedValues[projectId] = prevValues[projectId].filter(item => 
            !item.dynamic_columns || item.dynamic_columns.id !== columnId
          );
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

  // Helper function to get value for PDF fields
  const getPdfFieldDisplay = (projectId: string, field: string, value: string) => {
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
            <Button size="sm" variant="outline">
              <Link className="h-4 w-4 mr-1" /> Add Link
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

  // Helper function to get dynamic column value
  const getDynamicColumnValue = (projectId: string, columnId: string) => {
    return dynamicColumnValues[projectId]?.find(
      v => v.dynamic_columns && v.dynamic_columns.id === columnId
    )?.value || '';
  };
  
  // Function to render PDF/Link field for dynamic columns
  const renderDynamicPdfField = (projectId: string, column, value: string) => {
    if (editRowId === projectId && column.type === 'pdf') {
      return (
        <div className="flex flex-col space-y-2">
          <Input 
            id={`dynamic-input-${column.id}-${projectId}`}
            type="text"
            defaultValue={value || ''}
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
                setEditLinkURL(value || '');
                setEditLinkColumnId(column.id);
                setEditLinkProjectId(projectId);
              }}
            >
              <Link className="h-4 w-4 mr-1" /> Add Link
            </Button>
          </div>
        </div>
      );
    } else if (column.type === 'pdf' && value) {
      return (
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
      );
    } else if (editRowId === projectId) {
      return (
        <Input
          id={`dynamic-input-${column.id}-${projectId}`}
          type={column.type === 'number' ? 'number' : 'text'}
          defaultValue={value || ''}
        />
      );
    }
    
    return value || '';
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
            {projects.map((project) => (
              <React.Fragment key={project.id}>
                <TableRow className="border-b-2 border-gray-300">
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
                    {getPdfFieldDisplay(project.id, 'progress_form_url', project.progress_form_url)}
                  </TableCell>
                  <TableCell>
                    {getPdfFieldDisplay(project.id, 'presentation_url', project.presentation_url)}
                  </TableCell>
                  <TableCell>
                    {getPdfFieldDisplay(project.id, 'report_url', project.report_url)}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        id={`initial_evaluation-${project.id}`}
                        type="text"
                        defaultValue={project.initial_evaluation || ''}
                      />
                    ) : (
                      project.initial_evaluation || ''
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        id={`progress_evaluation-${project.id}`}
                        type="text"
                        defaultValue={project.progress_evaluation || ''}
                      />
                    ) : (
                      project.progress_evaluation || ''
                    )}
                  </TableCell>
                  <TableCell>
                    {editRowId === project.id ? (
                      <Input
                        id={`final_evaluation-${project.id}`}
                        type="text"
                        defaultValue={project.final_evaluation || ''}
                      />
                    ) : (
                      project.final_evaluation || ''
                    )}
                  </TableCell>
                  {dynamicColumns.map((column) => (
                    <TableCell key={`${project.id}-${column.id}`}>
                      {renderDynamicPdfField(
                        project.id, 
                        column,
                        getDynamicColumnValue(project.id, column.id)
                      )}
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleShowStudentModal(project.id)}
                        >
                          View Students
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRow(project)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Row
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                {project.students && project.students.length > 0 && (
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={16 + dynamicColumns.length + 1}>
                      <div className="p-2">
                        <h4 className="font-medium mb-2">Students:</h4>
                        <div className="grid grid-cols-4 gap-4">
                          {project.students.map((student) => (
                            <div key={student.id} className="border p-2 rounded">
                              <div><strong>Name:</strong> {student.name}</div>
                              <div><strong>Roll No:</strong> {student.roll_no}</div>
                              <div><strong>Email:</strong> {student.email || 'N/A'}</div>
                              <div><strong>Program:</strong> {student.program || 'N/A'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
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

      <Dialog open={editProjectId !== null} onOpenChange={() => setEditProjectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Make changes to the project details here. Click save when you're
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="group_no" className="text-right">
                Group No
              </label>
              <Input
                type="text"
                id="group_no"
                name="group_no"
                value={editedProject?.group_no || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="title" className="text-right">
                Title
              </label>
              <Input
                type="text"
                id="title"
                name="title"
                value={editedProject?.title || ''}
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
                value={editedProject?.domain || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="faculty_mentor" className="text-right">
                Faculty Mentor
              </label>
              <Input
                type="text"
                id="faculty_mentor"
                name="faculty_mentor"
                value={editedProject?.faculty_mentor || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="industry_mentor" className="text-right">
                Industry Mentor
              </label>
              <Input
                type="text"
                id="industry_mentor"
                name="industry_mentor"
                value={editedProject?.industry_mentor || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="session" className="text-right">
                Session
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={
                      'w-[280px] justify-start text-left font-normal' +
                      (editedProject?.session ? ' text-foreground' : ' text-muted-foreground')
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedProject?.session ? (
                      format(new Date(editedProject.session), 'yyyy-MM-dd')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={editedProject?.session ? new Date(editedProject.session) : undefined}
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
              <label htmlFor="year" className="text-right">
                Year
              </label>
              <Input
                type="text"
                id="year"
                name="year"
                value={editedProject?.year || ''}
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
                value={editedProject?.semester || ''}
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
                value={editedProject?.faculty_coordinator || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" onClick={handleSaveProject} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              View and edit student details for the selected group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {students.map((student) => (
              <div key={student.id} className="grid grid-cols-4 items-center gap-4">
                <label htmlFor={`roll_no_${student.id}`} className="text-right">
                  Roll No
                </label>
                <Input
                  type="text"
                  id={`roll_no_${student.id}`}
                  defaultValue={student.roll_no}
                  onChange={(e) => handleStudentInputChange(student.id, 'roll_no', e.target.value)}
                  className="col-span-3"
                />
                <label htmlFor={`name_${student.id}`} className="text-right">
                  Name
                </label>
                <Input
                  type="text"
                  id={`name_${student.id}`}
                  defaultValue={student.name}
                  onChange={(e) => handleStudentInputChange(student.id, 'name', e.target.value)}
                  className="col-span-3"
                />
                <label htmlFor={`email_${student.id}`} className="text-right">
                  Email
                </label>
                <Input
                  type="email"
                  id={`email_${student.id}`}
                  defaultValue={student.email}
                  onChange={(e) => handleStudentInputChange(student.id, 'email', e.target.value)}
                  className="col-span-3"
                />
                <label htmlFor={`program_${student.id}`} className="text-right">
                  Program
                </label>
                <Input
                  type="text"
                  id={`program_${student.id}`}
                  defaultValue={student.program}
                  onChange={(e) => handleStudentInputChange(student.id, 'program', e.target.value)}
                  className="col-span-3"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={handleSaveStudentChanges} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
            <Button type="button" variant="ghost" onClick={handleCloseStudentModal}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddColumnModal} onOpenChange={setShowAddColumnModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dynamic Column</DialogTitle>
            <DialogDescription>
              Add a new column to the project table.
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

export default ProjectTable;
