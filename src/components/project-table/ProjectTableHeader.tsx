
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table';

interface ProjectTableHeaderProps {
  dynamicColumns: any[];
  handleDeleteColumn: (columnId: string) => void;
}

const ProjectTableHeader: React.FC<ProjectTableHeaderProps> = ({ 
  dynamicColumns,
  handleDeleteColumn
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">Select</TableHead>
          <TableHead>Group No</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Project Category</TableHead>
          <TableHead>Domain</TableHead>
          <TableHead>Faculty Mentor</TableHead>
          <TableHead>Industry Mentor</TableHead>
          <TableHead>Session</TableHead>
          <TableHead>Year</TableHead>
          <TableHead>Semester</TableHead>
          <TableHead>Faculty Coordinator</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Progress Form</TableHead>
          <TableHead>Presentation</TableHead>
          <TableHead>Report</TableHead>
          <TableHead>Initial Evaluation</TableHead>
          <TableHead>Progress Evaluation</TableHead>
          <TableHead>Final Evaluation</TableHead>
          {dynamicColumns.map((column) => (
            <TableHead key={column.id} className="relative min-w-[150px]">
              {column.name}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteColumn(column.id)}
                className="absolute top-1 right-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </TableHead>
          ))}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
    </Table>
  );
};

export default ProjectTableHeader;
