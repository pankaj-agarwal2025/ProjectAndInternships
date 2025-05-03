
import React from 'react';
import { Student } from '@/lib/supabase';

interface ProjectTableCellContentProps {
  value: any;
}

const ProjectTableCellContent: React.FC<ProjectTableCellContentProps> = ({ value }) => {
  if (value === null || value === undefined) {
    return <></>;
  }
  
  // Handle Student array objects specifically
  if (Array.isArray(value) && value.length > 0) {
    // Check if it's an array of Student objects
    if (typeof value[0] === 'object' && 'name' in value[0]) {
      return (
        <ul className="list-disc list-inside">
          {value.map((item: Student, idx: number) => (
            <li key={idx}>{item.name}</li>
          ))}
        </ul>
      );
    }
    
    return <>{value.join(', ')}</>;
  }
  
  // Convert to string for proper displaying
  return <>{String(value)}</>;
};

export default ProjectTableCellContent;
