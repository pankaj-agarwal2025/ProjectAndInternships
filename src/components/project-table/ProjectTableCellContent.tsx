
import React from 'react';
import { Student } from '@/lib/supabase';

interface ProjectTableCellContentProps {
  value: string | number | boolean | null | Student[] | undefined;
  placeholder?: string;
}

const ProjectTableCellContent: React.FC<ProjectTableCellContentProps> = ({ 
  value, 
  placeholder = '—' 
}) => {
  if (value === undefined || value === null || value === '') {
    return <span className="text-gray-400">{placeholder}</span>;
  }
  
  // Handle Student arrays
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'roll_no' in value[0]) {
    return <span>{value.length} student(s)</span>;
  }
  
  return <span>{String(value)}</span>;
};

export default ProjectTableCellContent;
