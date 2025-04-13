import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { addDynamicColumn, getDynamicColumns, addDynamicColumnValue, getDynamicColumnValues, deleteDynamicColumn } from '@/lib/supabase';

interface ProjectTableProps {
  filters: Record<string, any>;
}

interface Project {
  id: string;
  group_no: string;
  title: string;
  domain: string;
  faculty_mentor: string;
  industry_mentor: string;
  session: string;
  year: string;
  semester: string;
  faculty_coordinator: string;
  progress_form_url?: string;
  presentation_url?: string;
  report_url?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface Student {
  id: string;
  group_id: string;
  roll_no: string;
  name: string;
  email: string;
  program: string;
}

interface DynamicColumn {
  id: string;
  name: string;
  type: string;
}

const DynamicColumnValue = ({ projectId, columnId }: { projectId: string, columnId: string }) => {
  const [value, setValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('dynamic_column_values')
          .select('value')
          .eq('project_id', projectId)
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
  }, [projectId, columnId]);

  if (isLoading) return <span className="text-gray-400">Loading...</span>;
  return <span>{value || '-'}</span>;
};

const ProjectTable: React.FC<ProjectTableProps> = ({ filters }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editableCell, setEditableCell] = useState<{ id: string, field: string } | null>(null);
  const [editedCells, setEditedCells] = useState<Record<string, Record<string, any>>>({});
  const [newValue, setNewValue] = useState<string>('');
  const [dynamicColumns, setDynamicColumns] = useState<DynamicColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteColumnConfirmOpen, setDeleteColumnConfirmOpen] = useState(false);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const { toast } = useToast();

  const totalPages = Math.ceil(projects.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = projects.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    fetchProjects();
    fetchDynamicColumns();
  }, [filters]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let query = supabase.from('projects').select('*');

      if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && key !== 'searchTerm' && !key.startsWith('dynamic_')) {
            query = query.eq(key, value);
          }
        });

        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          query = query.or(`group_no.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      setProjects(data || []);
      setEditedCells({});
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDynamicColumns = async () => {
    try {
      const columns = await getDynamicColumns();
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

  const handleEdit = (id: string, field: string, value: string) => {
    setEditableCell({ id, field });
    setNewValue(value);
  };

  const handleSave = async () => {
    if (!editableCell) return;

    try {
      const { id, field } = editableCell;

      const { error } = await supabase
        .from('projects')
        .update({ [field]: newValue })
        .eq('id', id);

      if (error) {
        console.error('Error updating project:', error);
        throw error;
      }

      setProjects(projects.map(project =>
        project.id === id
          ? { ...project, [field]: newValue }
          : project
      ));

      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project',
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
        .from('projects')
        .delete()
        .eq('id', deleteId);

      if (error) {
        console.error('Error deleting project:', error);
        throw error;
      }

      setProjects(projects.filter(project => project.id !== deleteId));

      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
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
      const { data, error } = await addDynamicColumn(newColumnName, newColumnType);

      if (error) {
        console.error('Error adding column:', error);
        throw error;
      }

      if (data) {
        setDynamicColumns([...dynamicColumns, data]);

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
      await deleteDynamicColumn(deleteColumnId);

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

  const handleDynamicColumnValueChange = async (projectId: string, columnId: string, value: string) => {
    try {
      const { data: existingValue, error: fetchError } = await supabase
        .from('dynamic_column_values')
        .select('*')
        .eq('project_id', projectId)
        .eq('column_id', columnId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching dynamic column value:', fetchError);
        throw fetchError;
      }

      if (existingValue) {
        const { error } = await supabase
          .from('dynamic_column_values')
          .update({ value })
          .eq('id', existingValue.id);

        if (error) {
          console.error('Error updating dynamic column value:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('dynamic_column_values')
          .insert({
            project_id: projectId,
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

  const handleAddProject = async () => {
    // Implement the logic to add a new project
    try {
      // Insert a new project with default values
      const { data, error } = await supabase
        .from('projects')
        .insert({
          group_no: '',
          title: '',
          domain: '',
          faculty_mentor: '',
          industry_mentor: '',
          session: '',
          year: '',
          semester: '',
          faculty_coordinator: '',
        })
        .select();

      if (error) {
        console.error('Error adding project:', error);
        throw error;
      }

      if (data && data.length > 0) {
        // Add the new project to the state
        setProjects([data[0], ...projects]);

        toast({
          title: 'Success',
          description: 'New project added',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add project',
        variant: 'destructive',
      });
    }
  };

  const exportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        projects.map(project => {
          const exportData: Record<string, any> = { ...project };

          delete exportData.id;
          delete exportData.created_at;
          delete exportData.updated_at;

          return exportData;
        })
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');

      XLSX.writeFile(workbook, 'projects_data.xlsx');

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

      doc.setFontSize(18);
      doc.text('Project Data Report', 14, 20);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);

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

      const headers = ['Group No', 'Title', 'Domain', 'Faculty Mentor', 'Industry Mentor', 'Session', 'Year', 'Semester'];

      dynamicColumns.forEach(column => {
        headers.push(column.name);
      });

      const data = projects.map(project => {
        const row = [
          project.group_no || '',
          project.title || '',
          project.domain || '',
          project.faculty_mentor || '',
          project.industry_mentor || '',
          project.session || '',
          project.year || '',
          project.semester || ''
        ];

        dynamicColumns.forEach(column => {
          const dynamicValue = document.querySelector(`[data-dynamic-value="${project.id}-${column.id}"]`)?.textContent || '';
          row.push(dynamicValue);
        });

        return row;
      });

      autoTable(doc, {
        startY: Object.keys(filters).length > 0 ? 50 : 35,
        head: [headers],
        body: data,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      doc.save('project_report.pdf');

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

  const renderCell = (project: Project, field: string) => {
    const isEditing = editableCell && editableCell.id === project.id && editableCell.field === field;

    if (isEditing) {
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
    } else {
      return (
        <div className="flex items-center justify-between group">
          <span>{project[field] || '-'}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
            onClick={() => handleEdit(project.id, field, project[field] || '')}
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
        <div className="animate-pulse">Loading project data...</div>
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
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>

          <Button
            variant="default"
            className="flex items-center"
            onClick={handleAddProject}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>

      {currentProjects.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Actions</TableHead>
                <TableHead>Group No</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Faculty Mentor</TableHead>
                <TableHead>Industry Mentor</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Semester</TableHead>
                {dynamicColumns.map((column) => (
                  <TableHead key={column.id} className="relative">
                    <div className="flex items-center justify-between pr-8">
                      <span>{column.name}</span>
                      <Button
                        variant="ghost"
                        className="h-6 w-6 p-0 absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteColumn(column.id)}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-green-600"
                        onClick={() => handleEdit(project.id, 'title', project.title || '')}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600"
                        onClick={() => confirmDelete(project.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{renderCell(project, 'group_no')}</TableCell>
                  <TableCell>{renderCell(project, 'title')}</TableCell>
                  <TableCell>{renderCell(project, 'domain')}</TableCell>
                  <TableCell>{renderCell(project, 'faculty_mentor')}</TableCell>
                  <TableCell>{renderCell(project, 'industry_mentor')}</TableCell>
                  <TableCell>{renderCell(project, 'session')}</TableCell>
                  <TableCell>{renderCell(project, 'year')}</TableCell>
                  <TableCell>{renderCell(project, 'semester')}</TableCell>
                  {dynamicColumns.map((column) => (
                    <TableCell key={column.id}>
                      <div className="flex items-center justify-between group">
                        <DynamicColumnValue
                          projectId={project.id}
                          columnId={column.id}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            const value = document.querySelector(`[data-dynamic-value="${project.id}-${column.id}"]`)?.textContent || '';
                            handleDynamicColumnValueChange(project.id, column.id, value);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p>No projects found. Use the "Add Project" button to create a new entry.</p>
        </div>
      )}

      {projects.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t">
          <div>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, projects.length)} of {projects.length} entries
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
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
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
              This will permanently delete this column and all of its data across all projects. This action cannot be undone.
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
              Add a new column to track additional project information.
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
                placeholder="e.g., Project Status"
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
                </SelectContent>
              </Select>
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

export default ProjectTable;
