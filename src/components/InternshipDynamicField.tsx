
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Link as LinkIcon, ExternalLink, Check, X } from 'lucide-react';
import { updateInternshipDynamicColumnValue } from '@/lib/supabase';
import { InternshipDynamicColumnValue } from '@/lib/supabase';

interface InternshipDynamicFieldProps {
  value: InternshipDynamicColumnValue;
  isEditing: boolean;
  columnType: string;
  onChange: (valueId: string, newValue: string) => Promise<void>;
}

const InternshipDynamicField: React.FC<InternshipDynamicFieldProps> = ({
  value,
  isEditing,
  columnType,
  onChange
}) => {
  const [inputValue, setInputValue] = useState(value.value || '');
  const [isEditable, setIsEditable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onChange(value.id, inputValue);
      setIsEditable(false);
      toast({
        title: 'Success',
        description: 'Value updated successfully',
      });
    } catch (error) {
      console.error('Failed to update value:', error);
      toast({
        title: 'Error',
        description: 'Failed to update value',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    if (columnType === 'pdf') {
      return isEditable ? (
        <div className="flex flex-col gap-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter URL or link"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleSave} 
              disabled={isSubmitting}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsEditable(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {inputValue ? (
            <a href={inputValue} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              View
            </a>
          ) : (
            <span className="text-gray-400">No link</span>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setIsEditable(true)}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    
    return (
      <Input
        type="text"
        id={`dynamic-input-${value.column_id}`}
        defaultValue={value.value || ''}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={() => onChange(value.id, inputValue)}
      />
    );
  }

  if (columnType === 'pdf' && value.value) {
    return (
      <a 
        href={value.value} 
        target="_blank" 
        rel="noreferrer" 
        className="text-blue-500 hover:underline flex items-center"
      >
        <FileText className="h-4 w-4 mr-1" />
        View
        <ExternalLink className="h-3 w-3 ml-1" />
      </a>
    );
  }

  return <span>{value.value || ''}</span>;
};

export default InternshipDynamicField;
