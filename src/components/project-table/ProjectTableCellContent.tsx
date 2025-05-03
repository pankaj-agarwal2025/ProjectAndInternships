
import React from 'react';
import { Student } from '@/lib/supabase';

interface ProjectTableCellContentProps {
  value: string | number | Student[] | null | undefined;
}

const ProjectTableCellContent: React.FC<ProjectTableCellContentProps> = ({ value }) => {
  if (value === null || value === undefined) {
    return <>—</>;
  }

  // Handle Student arrays
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'roll_no' in value[0]) {
    return <>{value.length} student(s)</>;
  }

  // Handle regular values
  return <>{String(value)}</>;
};

export default ProjectTableCellContent;
