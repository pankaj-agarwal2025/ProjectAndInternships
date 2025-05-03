
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface PdfFieldCellProps {
  projectId: string;
  field: string;
  value: string | null;
  label: string;
  isEditing: boolean;
}

const PdfFieldCell: React.FC<PdfFieldCellProps> = ({ projectId, field, value, label, isEditing }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a simulated progress indicator
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Create steps: 10%, 30%, 60%, 90%
          if (prev < 10) return 10;
          if (prev < 30) return 30;
          if (prev < 60) return 60;
          if (prev < 90) return 90;
          return prev;
        });
      }, 500);

      // Check if storage bucket exists, if not create it
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(bucket => bucket.name === 'project_files')) {
        await supabase.storage.createBucket('project_files', { public: true });
      }

      // Create a unique filename to prevent collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}_${field}.${fileExt}`;
      
      // Upload file to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('project_files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('project_files')
        .getPublicUrl(fileName);
        
      if (!publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      
      // Update the project with the file URL
      const { error: updateError } = await supabase
        .from('projects')
        .update({ [field]: publicUrlData.publicUrl })
        .eq('id', projectId);
      
      if (updateError) {
        throw updateError;
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: 'Upload successful',
        description: `${label} has been uploaded successfully.`,
      });
      
      // Refresh the page after a short delay to show the updated data
      setTimeout(() => {
        window.dispatchEvent(new Event('refresh-projects-data'));
      }, 1000);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset the input
      e.target.value = '';
    }
  };
  
  if (isEditing) {
    return (
      <div>
        <label
          htmlFor={`${field}-${projectId}`}
          className="cursor-pointer inline-flex items-center px-2 py-1 text-xs bg-primary text-white rounded"
        >
          <Upload className="mr-1 h-3 w-3" />
          Upload {label}
        </label>
        <input
          id={`${field}-${projectId}`}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
      </div>
    );
  }

  return (
    <div>
      {isUploading ? (
        <div className="w-full flex flex-col">
          <div className="text-xs text-gray-500 mb-1">Uploading... {uploadProgress}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      ) : value ? (
        <div className="flex items-center gap-1">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 hover:underline"
          >
            <FileText className="mr-1 h-3 w-3" />
            View
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
          <label
            htmlFor={`${field}-${projectId}`}
            className="cursor-pointer ml-2 inline-flex items-center text-xs text-gray-600 hover:underline"
          >
            <Upload className="mr-1 h-3 w-3" />
            Replace
          </label>
          <input
            id={`${field}-${projectId}`}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      ) : (
        <div>
          <label
            htmlFor={`${field}-${projectId}`}
            className="cursor-pointer inline-flex items-center px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
          >
            <Upload className="mr-1 h-3 w-3" />
            Upload {label}
          </label>
          <input
            id={`${field}-${projectId}`}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      )}
    </div>
  );
};

export default PdfFieldCell;
