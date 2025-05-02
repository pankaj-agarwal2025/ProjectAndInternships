
import { useState } from 'react';
import { uploadFile } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface UseFileUploadProps {
  bucketName: string;
  entityId: string;
  fieldName: string;
  onUploadComplete?: (url: string) => void;
}

export function useFileUpload({ bucketName, entityId, fieldName, onUploadComplete }: UseFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(10);

    try {
      // Create a unique file name to avoid conflicts
      const fileName = `${entityId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      
      // Upload the file to Supabase storage
      setProgress(30);
      const fileUrl = await uploadFile(file, bucketName, fileName);
      
      if (!fileUrl) {
        throw new Error('Failed to get file URL after upload');
      }
      
      setProgress(100);
      toast({
        title: 'Upload successful',
        description: 'File has been uploaded successfully.',
      });
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(fileUrl);
      }
      
      return fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    isUploading,
    progress,
    handleFileChange,
  };
}

export default useFileUpload;
