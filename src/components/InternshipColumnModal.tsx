
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InternshipColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onColumnAdded: () => void;
}

const InternshipColumnModal: React.FC<InternshipColumnModalProps> = ({ 
  isOpen, 
  onClose,
  onColumnAdded
}) => {
  const [columnName, setColumnName] = useState('');
  const [columnType, setColumnType] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddColumn = async () => {
    if (!columnName) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a column name',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('internship_dynamic_columns')
        .insert({
          name: columnName,
          type: columnType,
        })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Column has been added successfully',
      });
      
      onColumnAdded();
      handleClose();
    } catch (error) {
      console.error('Error adding column:', error);
      toast({
        title: 'Error',
        description: 'Failed to add column. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setColumnName('');
    setColumnType('text');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Column</DialogTitle>
          <DialogDescription>
            Create a new column for the internships table.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="column-name" className="text-right">
              Column Name
            </Label>
            <Input
              id="column-name"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="col-span-3"
              placeholder="Enter column name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="column-type" className="text-right">
              Column Type
            </Label>
            <Select
              value={columnType}
              onValueChange={setColumnType}
            >
              <SelectTrigger id="column-type" className="col-span-3">
                <SelectValue placeholder="Select column type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="pdf">PDF/Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAddColumn} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Column'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InternshipColumnModal;
