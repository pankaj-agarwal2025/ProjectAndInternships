
import React from 'react';
import { Project } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Edit, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ProjectTableCellContent from './ProjectTableCellContent';

interface EvaluationCellProps {
  project: Project;
  type: 'initial' | 'progress' | 'final';
  isEditing: boolean;
  onShowEvaluation: () => void;
}

const getEvaluationFields = (
  type: 'initial' | 'progress' | 'final'
) => {
  switch (type) {
    case 'initial':
      return [
        { id: 'initial_clarity_objectives', name: 'Clarity of Objectives', maxMarks: 5 },
        { id: 'initial_background_feasibility', name: 'Background & Feasibility Study', maxMarks: 5 },
        { id: 'initial_usability_applications', name: 'Usability/Applications', maxMarks: 5 },
        { id: 'initial_innovation_novelty', name: 'Innovation/Novelty', maxMarks: 5 },
      ];
    case 'progress':
      return [
        { id: 'progress_data_extraction', name: 'Data Extraction & Processing', maxMarks: 5 },
        { id: 'progress_methodology', name: 'Methodology', maxMarks: 5 },
        { id: 'progress_implementation', name: 'Implementation', maxMarks: 15 },
        { id: 'progress_code_optimization', name: 'Code Optimization', maxMarks: 10 },
        { id: 'progress_user_interface', name: 'User Interface', maxMarks: 5 },
      ];
    case 'final':
      return [
        { id: 'final_implementation', name: 'Implementation', maxMarks: 10 },
        { id: 'final_results', name: 'Results', maxMarks: 10 },
        { id: 'final_research_paper', name: 'Research Paper & Report', maxMarks: 10 },
        { id: 'final_project_completion', name: 'Project Completion and Validation', maxMarks: 10 },
      ];
  }
};

const EvaluationCell: React.FC<EvaluationCellProps> = ({
  project,
  type,
  isEditing,
  onShowEvaluation
}) => {
  const totalField = `${type}_total`;
  // Use type assertion to get totalValue from project
  const totalValue = project[totalField as keyof Project];
  
  const fields = getEvaluationFields(type);
  const maxTotal = type === 'initial' ? 20 : 40;
  
  const tooltipContent = (
    <div className="p-2">
      <h4 className="font-bold mb-2">{type.charAt(0).toUpperCase() + type.slice(1)} Evaluation</h4>
      <ul className="space-y-1">
        {fields?.map(field => {
          const fieldValue = project[field.id as keyof Project];
          return (
            <li key={field.id} className="flex justify-between">
              <span>{field.name}</span>
              <span>
                <ProjectTableCellContent value={fieldValue} />/{field.maxMarks}
              </span>
            </li>
          );
        })}
        <li className="font-bold border-t pt-1 mt-1">
          <span>Total</span>
          <span>
            <ProjectTableCellContent value={totalValue} />/{maxTotal}
          </span>
        </li>
      </ul>
    </div>
  );

  if (isEditing) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onShowEvaluation}
      >
        <Edit className="h-3 w-3 mr-1" />
        Edit {totalValue || 0}/{maxTotal}
      </Button>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onShowEvaluation}
          >
            {String(totalValue || 0)}/{maxTotal} <Info className="h-3 w-3 ml-1" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="w-64">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EvaluationCell;
