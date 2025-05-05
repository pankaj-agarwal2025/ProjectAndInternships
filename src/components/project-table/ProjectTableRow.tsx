
import React from 'react';
import { Project, Student } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Save, Users } from 'lucide-react';
import {
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProjectTableCellContent from './ProjectTableCellContent';
import EvaluationCell from './EvaluationCell';
import PdfFieldCell from './PdfFieldCell';
import DynamicColumnCell from './DynamicColumnCell';

interface ProjectTableRowProps {
  project: Project;
  isSelected: boolean;
  onSelectProject: (projectId: string) => void;
  isEditing: boolean;
  editedProject: Partial<Project>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => Promise<void>;
  onCancelEdit: () => void;
  isSaving: boolean;
  onViewStudents: (projectId: string) => void;
  dynamicColumns: any[];
  dynamicColumnValues: Record<string, any[]>;
  onShowEvaluation: (project: Project, type: 'initial' | 'progress' | 'final') => void;
  onEdit: () => void;
}

const ProjectTableRow: React.FC<ProjectTableRowProps> = ({
  project,
  isSelected,
  onSelectProject,
  isEditing,
  editedProject,
  onInputChange,
  onSave,
  onCancelEdit,
  isSaving,
  onViewStudents,
  dynamicColumns,
  dynamicColumnValues,
  onShowEvaluation,
  onEdit
}) => {
  const renderProjectCategory = () => {
    if (isEditing) {
      return (
        <Select
          defaultValue={project.project_category || ''}
          onValueChange={(value) => {
            const event = {
              target: {
                name: 'project_category',
                value
              }
            } as React.ChangeEvent<HTMLInputElement>;
            onInputChange(event);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Industry Based">Industry Based</SelectItem>
            <SelectItem value="Research Based">Research Based</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    return project.project_category || '—';
  };

  const renderStudentsList = () => {
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
          onClick={() => onViewStudents(project.id)}
          className="ml-1"
        >
          <Users className="h-4 w-4 mr-1" />
          View
        </Button>
      </div>
    );
  };
  
  return (
    <TableRow className="border-b border-gray-100 hover:bg-gray-50">
      <TableCell className="w-[50px]">
        <Input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelectProject(project.id)}
        />
      </TableCell>
      
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            name="group_no"
            value={editedProject.group_no || ''}
            onChange={onInputChange}
          />
        ) : (
          project.group_no
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            name="title"
            value={editedProject.title || ''}
            onChange={onInputChange}
          />
        ) : (
          project.title
        )}
      </TableCell>

      <TableCell>
        {renderProjectCategory()}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            name="domain"
            value={editedProject.domain || ''}
            onChange={onInputChange}
          />
        ) : (
          project.domain
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            name="faculty_mentor"
            value={editedProject.faculty_mentor || ''}
            onChange={onInputChange}
          />
        ) : (
          project.faculty_mentor
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            name="industry_mentor"
            value={editedProject.industry_mentor || ''}
            onChange={onInputChange}
          />
        ) : (
          project.industry_mentor
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            name="session"
            value={editedProject.session || ''}
            onChange={onInputChange}
          />
        ) : (
          project.session
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            name="year"
            value={editedProject.year || ''}
            onChange={onInputChange}
          />
        ) : (
          project.year
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            name="semester"
            value={editedProject.semester || ''}
            onChange={onInputChange}
          />
        ) : (
          project.semester
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            name="faculty_coordinator"
            value={editedProject.faculty_coordinator || ''}
            onChange={onInputChange}
          />
        ) : (
          project.faculty_coordinator
        )}
      </TableCell>

      <TableCell>
        {renderStudentsList()}
      </TableCell>

      <TableCell>
        <PdfFieldCell 
          projectId={project.id}
          field="progress_form_url"
          value={project.progress_form_url}
          label="Progress Form"
          isEditing={isEditing}
        />
      </TableCell>

      <TableCell>
        <PdfFieldCell 
          projectId={project.id}
          field="presentation_url"
          value={project.presentation_url}
          label="Presentation"
          isEditing={isEditing}
        />
      </TableCell>

      <TableCell>
        <PdfFieldCell 
          projectId={project.id}
          field="report_url"
          value={project.report_url}
          label="Report"
          isEditing={isEditing}
        />
      </TableCell>

      <TableCell>
        <EvaluationCell 
          project={project}
          type="initial"
          isEditing={isEditing}
          onShowEvaluation={() => onShowEvaluation(project, 'initial')}
        />
      </TableCell>

      <TableCell>
        <EvaluationCell 
          project={project}
          type="progress"
          isEditing={isEditing}
          onShowEvaluation={() => onShowEvaluation(project, 'progress')}
        />
      </TableCell>

      <TableCell>
        <EvaluationCell 
          project={project}
          type="final"
          isEditing={isEditing}
          onShowEvaluation={() => onShowEvaluation(project, 'final')}
        />
      </TableCell>
      
      {/* Dynamic columns */}
      {dynamicColumns.map((column) => (
        <TableCell key={`${project.id}-${column.id}`}>
          <DynamicColumnCell 
            projectId={project.id}
            column={column}
            dynamicColumnValues={dynamicColumnValues}
            isEditing={isEditing}
          />
        </TableCell>
      ))}
      
      <TableCell className="text-right">
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              onClick={onSave}
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
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Row
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default ProjectTableRow;
