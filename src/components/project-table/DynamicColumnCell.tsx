
import React, { useState } from 'react';
import { FileText, ExternalLink, File, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/lib/supabase';

interface DynamicColumnCellProps {
  projectId: string;
  column: any;
  dynamicColumnValues: Record<string, any[]>;
  isEditing: boolean;
}

const DynamicColumnCell: React.FC<DynamicColumnCellProps> = ({
  projectId,
  column,
  dynamicColumnValues,
  isEditing
}) => {
  const [fileForUpload, setFileForUpload] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const value = dynamicColumnValues[projectId]?.find(
    v => v.dynamic_columns?.id === column.id
  );

  const handleUploadFile = async () => {
    if (!fileForUpload) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const fileName = `${projectId}/${column.id}/${fileForUpload.name}`;
      const fileUrl = await uploadFile(fileForUpload, 'projects', fileName);
      
      if (fileUrl) {
        if (value) {
          // Update existing value
          await supabase
            .from('dynamic_column_values')
            .update({ value: fileUrl })
            .eq('id', value.id);
        } else {
          // Add new value
          await supabase
            .from('dynamic_column_values')
            .insert({
              column_id: column.id,
              project_id: projectId,
              value: fileUrl
            });
        }
        
        toast({
          title: 'Success',
          description: 'File uploaded successfully!',
        });
        
        // Refresh page to show updated file
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFileForUpload(null);
      setIsSaving(false);
    }
  };

  if (isEditing) {
    if (column.type === 'pdf') {
      return (
        <div className="flex flex-col space-y-2">
          <Input 
            id={`dynamic-input-${column.id}-${projectId}`}
            type="text"
            defaultValue={value?.value || ''}
          />
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => {
              document.getElementById(`file-upload-${column.id}-${projectId}`)?.click();
            }}>
              <File className="h-4 w-4 mr-1" /> Choose File
            </Button>
            <input
              id={`file-upload-${column.id}-${projectId}`}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileForUpload(e.target.files[0]);
                  handleUploadFile();
                }
              }}
            />
            <Button 
              size="sm" 
              variant="outline"
            >
              <LinkIcon className="h-4 w-4 mr-1" /> Add Link
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <Input
          id={`dynamic-input-${column.id}-${projectId}`}
          type={column.type === 'number' ? 'number' : 'text'}
          defaultValue={value?.value || ''}
        />
      );
    }
  }
  
  if (column.type === 'pdf' && value?.value) {
    return (
      <a 
        href={value.value} 
        target="_blank" 
        rel="noreferrer" 
        className="text-blue-500 hover:underline flex items-center"
      >
        <FileText className="h-4 w-4 mr-1" />
        View Document
        <ExternalLink className="h-3 w-3 ml-1" />
      </a>
    );
  }
  
  return value?.value || '';
};

export default DynamicColumnCell;
