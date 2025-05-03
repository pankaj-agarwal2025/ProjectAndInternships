
import React, { useState } from 'react';
import { FileText, ExternalLink, File, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const [linkUrl, setLinkUrl] = useState(value || '');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const { toast } = useToast();
  
  const { handleFileChange, isUploading, progress } = useFileUpload({
    bucketName: 'projects',
    entityId: projectId,
    fieldName: field,
    onUploadComplete: async (url) => {
      try {
        await supabase
          .from('projects')
          .update({ [field]: url })
          .eq('id', projectId);
        
        toast({
          title: 'Success',
          description: 'File uploaded successfully!',
        });
        
        // Refresh page to show updated file
        window.location.reload();
      } catch (error) {
        console.error('Error updating project after upload:', error);
        toast({
          title: 'Error',
          description: 'Failed to update project with new file URL.',
          variant: 'destructive',
        });
      }
    }
  });

  const handleSaveLink = async () => {
    setIsSaving(true);
    try {
      await supabase
        .from('projects')
        .update({ [field]: linkUrl })
        .eq('id', projectId);
      
      toast({
        title: 'Success',
        description: 'Link saved successfully!',
      });
      
      setIsAddingLink(false);
      // Refresh page to show updated link
      window.location.reload();
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

  if (isEditing) {
    return (
      <div className="flex flex-col space-y-2">
        {isAddingLink ? (
          <div className="flex items-center space-x-2">
            <Input 
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL"
              className="flex-1"
            />
            <Button 
              size="sm" 
              variant="outline"
              disabled={isSaving} 
              onClick={handleSaveLink}
            >
              Save
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setIsAddingLink(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <Input 
              id={`${field}-${projectId}`}
              type="text"
              value={value || ''}
              disabled={true}
            />
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  document.getElementById(`file-upload-${field}-${projectId}`)?.click();
                }}
                disabled={isUploading}
              >
                {isUploading ? (
                  progress > 0 ? `Uploading ${progress}%` : 'Uploading...'
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
                onClick={() => setIsAddingLink(true)}
              >
                <LinkIcon className="h-4 w-4 mr-1" /> Add Link
              </Button>
            </div>
          </>
        )}
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
