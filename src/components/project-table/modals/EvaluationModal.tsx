
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Project } from '@/lib/supabase';
import ProjectTableCellContent from '../ProjectTableCellContent';

interface EvaluationField {
  id: string;
  name: string;
  maxMarks: number;
}

interface EvaluationModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  project: Project | null;
  evaluationType: 'initial' | 'progress' | 'final';
  editedProject: Partial<Project>;
  setEditedProject: React.Dispatch<React.SetStateAction<Partial<Project>>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  fetchProjects: () => Promise<void>;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  setIsOpen,
  project,
  evaluationType,
  editedProject,
  setEditedProject,
  isSaving,
  setIsSaving,
  fetchProjects,
}) => {
  // Initial evaluation fields
  const initialEvaluationFields: EvaluationField[] = [
    { id: 'initial_clarity_objectives', name: 'Clarity of Objectives', maxMarks: 5 },
    { id: 'initial_background_feasibility', name: 'Background & Feasibility Study', maxMarks: 5 },
    { id: 'initial_usability_applications', name: 'Usability/Applications', maxMarks: 5 },
    { id: 'initial_innovation_novelty', name: 'Innovation/Novelty', maxMarks: 5 },
  ];
  
  // Progress evaluation fields
  const progressEvaluationFields: EvaluationField[] = [
    { id: 'progress_data_extraction', name: 'Data Extraction & Processing', maxMarks: 5 },
    { id: 'progress_methodology', name: 'Methodology', maxMarks: 5 },
    { id: 'progress_implementation', name: 'Implementation', maxMarks: 15 },
    { id: 'progress_code_optimization', name: 'Code Optimization', maxMarks: 10 },
    { id: 'progress_user_interface', name: 'User Interface', maxMarks: 5 },
  ];
  
  // Final evaluation fields
  const finalEvaluationFields: EvaluationField[] = [
    { id: 'final_implementation', name: 'Implementation', maxMarks: 10 },
    { id: 'final_results', name: 'Results', maxMarks: 10 },
    { id: 'final_research_paper', name: 'Research Paper & Report', maxMarks: 10 },
    { id: 'final_project_completion', name: 'Project Completion and Validation', maxMarks: 10 },
  ];
  
  const getEvaluationFields = (): EvaluationField[] => {
    switch (evaluationType) {
      case 'initial':
        return initialEvaluationFields;
      case 'progress':
        return progressEvaluationFields;
      case 'final':
        return finalEvaluationFields;
      default:
        return [];
    }
  };
  
  const getMaxTotal = (): number => {
    return evaluationType === 'initial' ? 20 : 40;
  };
  
  const handleInputChange = (fieldId: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setEditedProject((prev) => ({ ...prev, [fieldId]: numValue }));
  };
  
  const calculateTotal = (): number => {
    const fields = getEvaluationFields();
    return fields.reduce((sum, field) => {
      const value = typeof editedProject[field.id as keyof typeof editedProject] === 'number' 
        ? (editedProject[field.id as keyof typeof editedProject] as number) 
        : 0;
      return sum + value;
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {evaluationType.charAt(0).toUpperCase() + evaluationType.slice(1)} Evaluation
          </DialogTitle>
          <DialogDescription>
            Enter marks for each category (Project: {project?.title})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {getEvaluationFields().map(field => (
            <div key={field.id} className="grid grid-cols-2 items-center gap-4">
              <label htmlFor={field.id} className="text-right font-medium text-sm">
                {field.name} ({field.maxMarks})
              </label>
              <Input
                id={field.id}
                type="number"
                min="0"
                max={field.maxMarks}
                value={
                  editedProject[field.id as keyof typeof editedProject] !== undefined &&
                  editedProject[field.id as keyof typeof editedProject] !== null
                    ? String(editedProject[field.id as keyof typeof editedProject])
                    : ''
                }
                onChange={(e) => handleInputChange(field.id, e.target.value)}
              />
            </div>
          ))}
          
          <div className="grid grid-cols-2 items-center gap-4 pt-2 border-t">
            <span className="text-right font-bold">Total</span>
            <span className="font-bold">
              {calculateTotal()}/{getMaxTotal()}
            </span>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => fetchProjects()} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Evaluation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationModal;
