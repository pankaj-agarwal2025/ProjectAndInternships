
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/lib/supabase';

interface EvaluationModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  project: Project | null;
  evaluationType: 'initial' | 'progress' | 'final';
  editedProject: Partial<Project>;
  setEditedProject: (project: Partial<Project>) => void;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  fetchProjects: () => Promise<void>;
}

const getEvaluationFields = (type: 'initial' | 'progress' | 'final') => {
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

const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  setIsOpen,
  project,
  evaluationType,
  editedProject,
  setEditedProject,
  isSaving,
  setIsSaving,
  fetchProjects
}) => {
  const { toast } = useToast();
  const fields = getEvaluationFields(evaluationType);
  const maxTotal = evaluationType === 'initial' ? 20 : 40;

  const handleSaveEvaluation = async () => {
    if (!project) return;
    
    setIsSaving(true);
    try {
      // Create a copy of editedProject without the students array to avoid type errors
      const projectToUpdate = { ...editedProject };
      if ('students' in projectToUpdate) {
        delete projectToUpdate.students;
      }
      
      await supabase
        .from('projects')
        .update(projectToUpdate)
        .eq('id', project.id);
      
      fetchProjects();
      setIsOpen(false);
      setEditedProject({});
      
      toast({
        title: 'Success',
        description: `${evaluationType.charAt(0).toUpperCase() + evaluationType.slice(1)} evaluation updated successfully!`,
      });
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update evaluation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotal = (): number => {
    if (!fields) return 0;
    
    return fields.reduce((sum, field) => {
      const value = Number(editedProject[field.id as keyof typeof editedProject] || 0);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  };

  const total = calculateTotal();
  
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
          {fields?.map(field => (
            <div key={field.id} className="grid grid-cols-2 items-center gap-4">
              <label htmlFor={field.id} className="text-right font-medium text-sm">
                {field.name} ({field.maxMarks})
              </label>
              <Input
                id={field.id}
                type="number"
                min="0"
                max={field.maxMarks}
                value={editedProject[field.id as keyof typeof editedProject] || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseFloat(e.target.value);
                  setEditedProject(prev => ({ ...prev, [field.id]: value }));
                }}
              />
            </div>
          ))}
          
          <div className="grid grid-cols-2 items-center gap-4 pt-2 border-t">
            <span className="text-right font-bold">
              Total
            </span>
            <span className="font-bold">
              {total}/{maxTotal}
            </span>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveEvaluation} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Evaluation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationModal;
