
import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface InternshipDynamicFieldProps {
  value: {
    id: string;
    column_id: string;
    value: string;
  };
  isEditing: boolean;
  columnType: string;
  onChange: (id: string, value: string) => Promise<void>;
}

const InternshipDynamicField: React.FC<InternshipDynamicFieldProps> = ({
  value,
  isEditing,
  columnType,
  onChange
}) => {
  if (isEditing) {
    return (
      <Input
        type={columnType === 'number' ? 'number' : 'text'}
        defaultValue={value.value}
        onChange={(e) => onChange(value.id, e.target.value)}
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

  return <span>{value.value}</span>;
};

export default InternshipDynamicField;
