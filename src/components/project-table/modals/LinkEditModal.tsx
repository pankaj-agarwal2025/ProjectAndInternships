
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
import { Save } from 'lucide-react';

interface LinkEditModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  linkURL: string;
  setLinkURL: (url: string) => void;
  columnId: string;
  projectId: string;
  dynamicColumns: any[];
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  fetchProjects: () => Promise<void>;
}

const LinkEditModal: React.FC<LinkEditModalProps> = ({
  isOpen,
  setIsOpen,
  linkURL,
  setLinkURL,
  columnId,
  projectId,
  dynamicColumns,
  isSaving,
  setIsSaving,
  fetchProjects
}) => {
  const { toast } = useToast();

  const handleSaveLink = async () => {
    if (!linkURL || !projectId || !columnId) return;
    
    try {
      setIsSaving(true);
      
      if (dynamicColumns.some(col => col.id === columnId)) {
        // It's a dynamic column
        const { data: existingValue } = await supabase
          .from('dynamic_column_values')
          .select('id')
          .eq('column_id', columnId)
          .eq('project_id', projectId)
          .single();
          
        if (existingValue) {
          // Update existing value
          await supabase
            .from('dynamic_column_values')
            .update({ value: linkURL })
            .eq('id', existingValue.id);
        } else {
          // Add new value
          await supabase
            .from('dynamic_column_values')
            .insert({
              column_id: columnId,
              project_id: projectId,
              value: linkURL
            });
        }
      } else {
        // It's a built-in field
        await supabase
          .from('projects')
          .update({ [columnId]: linkURL })
          .eq('id', projectId);
      }
      
      setIsOpen(false);
      setLinkURL('');
      
      fetchProjects();
      
      toast({
        title: 'Success',
        description: 'Link saved successfully!',
      });
    } catch (error) {
      console.error('Error saving link:', error);
      toast({
        title: 'Error',
        description: 'Failed to save link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add or Edit Link</DialogTitle>
          <DialogDescription>
            Enter the URL for the document or resource
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="link_url" className="text-right">
              URL
            </label>
            <Input
              type="text"
              id="link_url"
              value={linkURL}
              onChange={(e) => setLinkURL(e.target.value)}
              className="col-span-3"
              placeholder="https://example.com/document.pdf"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSaveLink} disabled={isSaving}>
            {isSaving ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Link
              </>
            )}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkEditModal;
