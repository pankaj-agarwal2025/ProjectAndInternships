
import React, { useState } from 'react';
import { FileText, ExternalLink, File, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { uploadFile } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PdfFieldCellProps {
  projectId: string;
  field: string;
  value: string | undefined;
  label: string;
  isEditing: boolean;
}

const PdfFieldCell: React.FC<PdfFieldCellProps> = ({ 
  projectId, 
  field, 
  value, 
  label,
  isEditing 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const fileName = `${projectId}/${field}/${file.name.replace(/\s+/g, '_')}`;
      const fileUrl = await uploadFile(file, 'projects', fileName);
      
      if (fileUrl) {
        // Update the project with the new file URL
        await supabase
          .from('projects')
          .update({ [field]: fileUrl })
          .eq('id', projectId);
        
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
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col space-y-2">
        <Input 
          id={`${field}-${projectId}`}
          type="text"
          defaultValue={value || ''}
        />
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              document.getElementById(`file-upload-${field}-${projectId}`)?.click();
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              'Uploading...'
            ) : (
              <>
                <File className="h-4 w-4 mr-1" /> Choose File
              </>
            )}
          </Button>
          <input
            id={`file-upload-${field}-${projectId}`}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
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
  }
  
  return value ? (
    <a 
      href={value} 
      target="_blank" 
      rel="noreferrer" 
      className="text-blue-500 hover:underline flex items-center"
    >
      <FileText className="h-4 w-4 mr-1" />
      View {label}
      <ExternalLink className="h-3 w-3 ml-1" />
    </a>
  ) : 'Not available';
};

export default PdfFieldCell;
