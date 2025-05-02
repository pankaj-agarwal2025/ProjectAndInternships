
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeleteProjectsAlertProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedProjects: string[];
  setSelectedProjects: (selectedProjects: string[]) => void;
  fetchProjects: () => Promise<void>;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
}

const DeleteProjectsAlert: React.FC<DeleteProjectsAlertProps> = ({ 
  isOpen, 
  setIsOpen,
  selectedProjects,
  setSelectedProjects,
  fetchProjects,
  isSaving,
  setIsSaving
}) => {
  const { toast } = useToast();

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
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Are you sure you want to delete
            selected projects?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)}>
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
  );
};

export default DeleteProjectsAlert;
