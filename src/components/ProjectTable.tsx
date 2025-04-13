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
} from "@/components/ui/dialog"
import { addDynamicColumn, getDynamicColumns, addDynamicColumnValue, getDynamicColumnValues, deleteDynamicColumn } from '@/lib/supabase';
import { Project, Student } from '@/lib/supabase';

interface ProjectTableProps {
  filters: Record<string, any>;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ filters }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
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
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
    fetchDynamicColumns();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .like('group_no', `%${filters.group_no || ''}%`)
        .like('domain', `%${filters.domain || ''}%`)
        .like('year', `%${filters.year || ''}%`)
        .like('title', `%${filters.searchTerm || ''}%`);

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
        // Fetch dynamic column values for each project
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

  const handleSaveProject = async () => {
    if (!editProjectId) return;

    setIsSaving(true);
    try {
      // Ensure that editedProject is not undefined and has the necessary properties
      if (editedProject) {
        await supabase
          .from('projects')
          .update(editedProject)
          .eq('id', editProjectId);

        // Update dynamic column values
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

        fetchProjects(); // Refresh projects
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
        await supabase.from('projects').delete().eq('id', projectId);
      }
      fetchProjects(); // Refresh projects
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

  const generatePdf = () => {
    const doc = new jsPDF();

    // Define the columns for the table
    const columns = [
      'Group No',
      'Title',
      'Domain',
      'Faculty Mentor',
      'Industry Mentor',
      'Session',
      'Year',
      'Semester',
      'Faculty Coordinator',
    ];

    // Map the project data to the table rows
    const rows = projects.map((project) => [
      project.group_no,
      project.title,
      project.domain,
      project.faculty_mentor,
      project.industry_mentor,
      project.session,
      project.year,
      project.semester,
      project.faculty_coordinator,
    ]);

    // Add the table to the PDF
    autoTable(doc, {
      head: [columns],
      body: rows,
    });

    // Save or open the PDF
    doc.save('projects.pdf');
  };

  const generateExcel = () => {
    // Convert project data to array of objects
    const data = projects.map((project) => ({
      'Group No': project.group_no,
      'Title': project.title,
      'Domain': project.domain,
      'Faculty Mentor': project.faculty_mentor,
      'Industry Mentor': project.industry_mentor,
      'Session': project.session,
      'Year': project.year,
      'Semester': project.semester,
      'Faculty Coordinator': project.faculty_coordinator,
    }));

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    // Convert the data to a worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    // Generate the Excel file
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
        // Initialize studentUpdates with current student data
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
      fetchProjects(); // Refresh projects
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
    // Find the existing value for this project and column
    const existingValue = dynamicColumnValues[projectId]?.find(item => item.dynamic_columns.id === columnId);

    if (existingValue) {
      // Update the existing value
      try {
        await supabase
          .from('dynamic_column_values')
          .update({ value: value })
          .eq('id', existingValue.id);

        // Update the local state
        setDynamicColumnValues(prevValues => {
          const updatedProjectValues = prevValues[projectId].map(item => {
            if (item.dynamic_columns.id === columnId) {
              return { ...item, value: value };
            }
            return item;
          });

          return {
            ...prevValues,
            [projectId]: updatedProjectValues,
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
      // Add a new value
      try {
        await addDynamicColumnValue(columnId, projectId, value);

        // Fetch the updated dynamic column values for the project
        const updatedDynamicValues = await getDynamicColumnValues(projectId);

        // Update the local state
        setDynamicColumnValues(prevValues => ({
          ...prevValues,
          [projectId]: updatedDynamicValues,
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
      // Update dynamicColumnValues state to remove the deleted column
      setDynamicColumnValues(prevValues => {
        const updatedValues = {};
        for (const projectId in prevValues) {
          updatedValues[projectId] = prevValues[projectId].filter(item => item.column_id !== columnId);
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
            onClick={handleDeleteProjects}
            disabled={selectedProjects.length === 0}
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
            <TableHead>Group No</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Faculty Mentor</TableHead>
            <TableHead>Industry Mentor</TableHead>
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
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="w-[50px]">
                <Input
                  type="checkbox"
                  checked={selectedProjects.includes(project.id)}
                  onChange={() => handleSelectProject(project.id)}
                />
              </TableCell>
              <TableCell>{project.group_no}</TableCell>
              <TableCell>{project.title}</TableCell>
              <TableCell>{project.domain}</TableCell>
              <TableCell>{project.faculty_mentor}</TableCell>
              <TableCell>{project.industry_mentor}</TableCell>
              <TableCell>{project.session}</TableCell>
              <TableCell>{project.year}</TableCell>
              <TableCell>{project.semester}</TableCell>
              <TableCell>{project.faculty_coordinator}</TableCell>
              {dynamicColumns.map((column) => {
                // Find the dynamic value for this project and column
                const dynamicValue = dynamicColumnValues[project.id]?.find(item => item.dynamic_columns.id === column.id);
                const value = dynamicValue ? dynamicValue.value : '';

                return (
                  <TableCell key={`${project.id}-${column.id}`}>
                    {editProjectId === project.id ? (
                      <Input
                        type="text"
                        id={`dynamic-input-${column.id}`}
                        defaultValue={value}
                        onChange={(e) => handleDynamicValueChange(project.id, column.id, e.target.value)}
                      />
                    ) : (
                      value
                    )}
                  </TableCell>
                );
              })}
              <TableCell className="text-right">
                {editProjectId === project.id ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveProject}
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
                      onClick={() => setEditProjectId(null)}
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
                      onClick={() => handleEditProject(project)}
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

export default ProjectTable;
