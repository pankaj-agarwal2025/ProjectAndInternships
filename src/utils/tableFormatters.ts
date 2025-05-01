
import React from 'react';
import { Student } from '@/lib/supabase';

/**
 * Formats a Student array into a displayable string for table cells
 */
export const formatStudentList = (students: Student[] | undefined): React.ReactNode => {
  if (!students || !Array.isArray(students) || students.length === 0) {
    return <span className="text-gray-400">No students</span>;
  }
  
  return (
    <ul className="list-disc pl-5 space-y-1">
      {students.map((student, index) => (
        <li key={index} className="text-sm">
          {student.name} ({student.roll_no})
        </li>
      ))}
    </ul>
  );
};

/**
 * Converts a Student array to a simple comma-separated string for exports
 */
export const studentListToString = (students: Student[] | undefined): string => {
  if (!students || !Array.isArray(students) || students.length === 0) {
    return '';
  }
  
  return students
    .map(student => `${student.name} (${student.roll_no})`)
    .join(', ');
};
