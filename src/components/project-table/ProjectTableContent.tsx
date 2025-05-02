
import React from 'react';
import { Project } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import ProjectTableRow from './ProjectTableRow';

interface ProjectTableContentProps {
  projects: Project[];
  selectedProjects: string[];
  handleSelectProject: (projectId: string) => void;
  editRowId: string | null;
  editedProject: Partial<Project>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveRowEdit: () => Promise<void>;
  setEditRowId: (id: string | null) => void;
  isSaving: boolean;
  handleViewStudents: (projectId: string) => void;
  dynamicColumns: any[];
  dynamicColumnValues: Record<string, any[]>;
  handleShowEvaluation: (project: Project, type: 'initial' | 'progress' | 'final') => void;
  handleEditRow: (project: Project) => void;
}

const ProjectTableContent: React.FC<ProjectTableContentProps> = ({
  projects,
  selectedProjects,
  handleSelectProject,
  editRowId,
  editedProject,
  handleInputChange,
  handleSaveRowEdit,
  setEditRowId,
  isSaving,
  handleViewStudents,
  dynamicColumns,
  dynamicColumnValues,
  handleShowEvaluation,
  handleEditRow
}) => {
  return (
    <Table>
      <TableBody>
        {projects.length === 0 ? (
          <TableRow>
            <TableCell colSpan={19 + dynamicColumns.length} className="text-center py-8">
              No projects found. Try adjusting your filters or adding new projects.
            </TableCell>
          </TableRow>
        ) : (
          projects.map((project) => (
            <ProjectTableRow
              key={project.id}
              project={project}
              isSelected={selectedProjects.includes(project.id)}
              onSelectProject={handleSelectProject}
              isEditing={editRowId === project.id}
              editedProject={editRowId === project.id ? editedProject : project}
              onInputChange={handleInputChange}
              onSave={handleSaveRowEdit}
              onCancelEdit={() => setEditRowId(null)}
              isSaving={isSaving}
              onViewStudents={handleViewStudents}
              dynamicColumns={dynamicColumns}
              dynamicColumnValues={dynamicColumnValues}
              onShowEvaluation={handleShowEvaluation}
              onEdit={() => handleEditRow(project)}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default ProjectTableContent;
