
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, Student } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Download, Trash2, Plus } from 'lucide-react';
import ProjectTableHeader from './ProjectTableHeader';
import ProjectTableContent from './ProjectTableContent';
import DeleteProjectsAlert from './alerts/DeleteProjectsAlert';
import DeleteColumnAlert from './alerts/DeleteColumnAlert';
import AddColumnModal from './modals/AddColumnModal';
import LinkEditModal from './modals/LinkEditModal';
import EvaluationModal from './modals/EvaluationModal';
import StudentModal from './modals/StudentModal';
import { getDynamicColumns, getDynamicColumnValues, deleteDynamicColumn } from '@/lib/supabase';
import { generateProjectPDF } from '@/components/ProjectExportPDF';
import * as XLSX from 'xlsx';

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
  const [dynamicColumnValues, setDynamicColumnValues] = useState<Record<string, any[]>>({});
  const [isColumnDeleteAlertOpen, setIsColumnDeleteAlertOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const [fileForUpload, setFileForUpload] = useState<File | null>(null);
  const [fileUrlField, setFileUrlField] = useState('');
  const [isLinkEditable, setIsLinkEditable] = useState(false);
  const [editLinkURL, setEditLinkURL] = useState('');
  const [editLinkColumnId, setEditLinkColumnId] = useState('');
  const [editLinkProjectId, setEditLinkProjectId] = useState('');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [currentEvaluationProject, setCurrentEvaluationProject] = useState<Project | null>(null);
  const [evaluationType, setEvaluationType] = useState<'initial' | 'progress' | 'final'>('initial');
  const { toast } = useToast();

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
      
      if (filters.project_category) {
        query = query.eq('project_category', filters.project_category);
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

  const handleShowEvaluation = (project: Project, type: 'initial' | 'progress' | 'final') => {
    setCurrentEvaluationProject(project);
    setEvaluationType(type);
    setShowEvaluationModal(true);
  };

  const handleDeleteProjects = () => {
    setIsDeleteAlertOpen(true);
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

  const generatePdf = () => {
    generateProjectPDF(projects, filters);
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
        <ProjectTableHeader dynamicColumns={dynamicColumns} handleDeleteColumn={handleDeleteColumn} />
        <ProjectTableContent 
          projects={projects}
          selectedProjects={selectedProjects}
          handleSelectProject={handleSelectProject}
          editRowId={editRowId}
          editedProject={editedProject}
          handleInputChange={(e) => {
            const { name, value } = e.target;
            setEditedProject((prev) => ({ ...prev, [name]: value }));
          }}
          handleSaveRowEdit={async () => {
            if (!editRowId) return;
            setIsSaving(true);
            try {
              if (editedProject) {
                await supabase
                  .from('projects')
                  .update(editedProject)
                  .eq('id', editRowId);
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
          }}
          setEditRowId={setEditRowId}
          isSaving={isSaving}
          handleViewStudents={handleViewStudents}
          dynamicColumns={dynamicColumns}
          dynamicColumnValues={dynamicColumnValues}
          handleShowEvaluation={handleShowEvaluation}
          handleEditRow={handleEditRow}
        />
      </div>

      <DeleteProjectsAlert 
        isOpen={isDeleteAlertOpen} 
        setIsOpen={setIsDeleteAlertOpen}
        selectedProjects={selectedProjects}
        setSelectedProjects={setSelectedProjects}
        fetchProjects={fetchProjects}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
      />

      <DeleteColumnAlert 
        isOpen={isColumnDeleteAlertOpen}
        setIsOpen={setIsColumnDeleteAlertOpen}
        confirmDelete={confirmDeleteColumn}
      />

      <StudentModal 
        isOpen={showStudentModal}
        setIsOpen={setShowStudentModal}
        students={students}
        projectGroupNo={projects.find(p => p.id === selectedGroupId)?.group_no || ''}
      />

      <AddColumnModal 
        isOpen={showAddColumnModal}
        setIsOpen={setShowAddColumnModal}
        fetchDynamicColumns={fetchDynamicColumns}
      />

      <LinkEditModal 
        isOpen={isLinkEditable}
        setIsOpen={setIsLinkEditable}
        linkURL={editLinkURL}
        setLinkURL={setEditLinkURL}
        columnId={editLinkColumnId}
        projectId={editLinkProjectId}
        dynamicColumns={dynamicColumns}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        fetchProjects={fetchProjects}
      />

      <EvaluationModal 
        isOpen={showEvaluationModal}
        setIsOpen={setShowEvaluationModal}
        project={currentEvaluationProject}
        evaluationType={evaluationType}
        editedProject={editedProject}
        setEditedProject={setEditedProject}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        fetchProjects={fetchProjects}
      />

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
