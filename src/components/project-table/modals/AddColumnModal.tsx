
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { addDynamicColumn } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddColumnModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  fetchDynamicColumns: () => Promise<void>;
}

const AddColumnModal: React.FC<AddColumnModalProps> = ({ isOpen, setIsOpen, fetchDynamicColumns }) => {
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const { toast } = useToast();
  
  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast({
        title: 'Error',
        description: 'Column name is required.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await addDynamicColumn(newColumnName, newColumnType || 'text');
      fetchDynamicColumns();
      setIsOpen(false);
      setNewColumnName('');
      setNewColumnType('text');
      toast({
        title: 'Success',
        description: 'Dynamic column added successfully!',
      });
    } catch (error) {
      console.error('Error adding dynamic column:', error);
      toast({
        title: 'Error',
        description: 'Failed to add dynamic column. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Dynamic Column</DialogTitle>
          <DialogDescription>
            Add a new column to track additional project information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="column_name" className="text-right">
              Column Name
            </label>
            <Input
              type="text"
              id="column_name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="column_type" className="text-right">
              Column Type
            </label>
            <Select value={newColumnType} onValueChange={(value) => setNewColumnType(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="pdf">PDF/Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleAddColumn}>
            Add Column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddColumnModal;
