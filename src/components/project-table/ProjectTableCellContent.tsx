
import React from 'react';

interface ProjectTableCellContentProps {
  value: any;
}

const ProjectTableCellContent: React.FC<ProjectTableCellContentProps> = ({ value }) => {
  if (value === null || value === undefined) {
    return <></>;
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return <>None</>;
    
    if (typeof value[0] === 'object' && 'name' in value[0]) {
      return (
        <ul className="list-disc list-inside">
          {value.map((item: any, idx: number) => (
            <li key={idx}>{item.name}</li>
          ))}
        </ul>
      );
    }
    
    return <>{value.join(', ')}</>;
  }
  
  return <>{String(value)}</>;
};

export default ProjectTableCellContent;
