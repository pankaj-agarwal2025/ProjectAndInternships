
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EvaluationModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  project: Project | null;
  evaluationType: 'initial' | 'progress' | 'final';
  editedProject: Partial<Project>;
  setEditedProject: React.Dispatch<React.SetStateAction<Partial<Project>>>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  fetchProjects: () => Promise<void>;
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

const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  setIsOpen,
  project,
  evaluationType,
  editedProject: parentEditedProject,
  setEditedProject: parentSetEditedProject,
  isSaving: parentIsSaving,
  setIsSaving: parentSetIsSaving,
  fetchProjects,
}) => {
  const [localEditedProject, setLocalEditedProject] = useState<Partial<Project>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (project) {
      setLocalEditedProject(project);
    }
  }, [project, isOpen]);

  const totalField = `${evaluationType}_total`;
  const fields = getEvaluationFields(evaluationType);
  const maxTotal = evaluationType === 'initial' ? 20 : 40;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let numValue: number | null = value === '' ? null : Number(value);
    
    // Find the field to get its max marks
    const field = fields?.find(f => f.id === name);
    if (field && typeof numValue === 'number' && numValue > field.maxMarks) {
      numValue = field.maxMarks;
    }

    setLocalEditedProject(prev => ({ ...prev, [name]: numValue }));
  };

  const calculateTotal = () => {
    if (!fields) return 0;
    return fields.reduce((acc, field) => {
      const value = localEditedProject[field.id as keyof Project];
      return acc + (typeof value === 'number' ? value : 0);
    }, 0);
  };

  const handleSave = async () => {
    if (!project) return;
    
    setIsSaving(true);
    try {
      const totalValue = calculateTotal();
      const updatedProject: Record<string, any> = {
        ...Object.fromEntries(
          Object.entries(localEditedProject).filter(([key, value]) => 
            fields?.some(field => field.id === key) && value !== undefined
          )
        ),
        [totalField]: totalValue
      };
      
      console.log('Saving evaluation with data:', updatedProject);
      
      const { error } = await supabase
        .from('projects')
        .update(updatedProject)
        .eq('id', project.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Evaluation saved successfully!',
      });
      
      fetchProjects();
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save evaluation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {evaluationType.charAt(0).toUpperCase() + evaluationType.slice(1)} Evaluation
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] rounded-md border p-4">
          <div className="space-y-4 py-4">
            {fields?.map(field => {
              const fieldValue = localEditedProject[field.id as keyof Project];
              return (
                <div key={field.id} className="grid grid-cols-2 items-center gap-4">
                  <label htmlFor={field.id} className="text-sm font-medium">
                    {field.name} (Max: {field.maxMarks})
                  </label>
                  <Input
                    id={field.id}
                    name={field.id}
                    type="number"
                    value={typeof fieldValue === 'number' ? fieldValue : ''}
                    onChange={handleInputChange}
                    min={0}
                    max={field.maxMarks}
                    className="col-span-1"
                  />
                </div>
              );
            })}
            
            <div className="grid grid-cols-2 items-center gap-4 pt-4 border-t">
              <span className="text-sm font-bold">Total</span>
              <span className="font-bold">
                {calculateTotal()}/{maxTotal}
              </span>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Evaluation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationModal;
