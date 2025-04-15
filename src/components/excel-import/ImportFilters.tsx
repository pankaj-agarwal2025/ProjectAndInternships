
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImportFiltersProps {
  minStudents: number;
  maxStudents: number;
  onMinStudentsChange: (value: number) => void;
  onMaxStudentsChange: (value: number) => void;
}

const ImportFilters: React.FC<ImportFiltersProps> = ({
  minStudents,
  maxStudents,
  onMinStudentsChange,
  onMaxStudentsChange,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="min-students">Minimum Students per Group</Label>
        <Input
          id="min-students"
          type="number"
          min={1}
          max={10}
          value={minStudents}
          onChange={(e) => onMinStudentsChange(Number(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="max-students">Maximum Students per Group</Label>
        <Input
          id="max-students"
          type="number"
          min={minStudents}
          max={10}
          value={maxStudents}
          onChange={(e) => onMaxStudentsChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default ImportFilters;
