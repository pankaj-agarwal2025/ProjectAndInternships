
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

interface UseExcelImportProps {
  tableName: 'projects' | 'internships';
  minStudents?: number;
  maxStudents?: number;
}

interface StudentRecord {
  roll_no: string;
  name: string;
  email?: string;
  program?: string;
}

export function useExcelImport({ tableName, minStudents = 1, maxStudents = 4 }: UseExcelImportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);

  const processExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          resolve(json);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          reject(new Error('Failed to parse Excel file. Please check the format.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read Excel file.'));
      };
      
      reader.readAsBinaryString(file);
    });
  };

  const importExcelFile = async (file: File) => {
    setIsImporting(true);
    setImportProgress(10);
    setImportError(null);
    
    try {
      // Process the Excel file
      const records = await processExcelFile(file);
      setImportProgress(30);
      
      if (records.length === 0) {
        throw new Error('No records found in the Excel file.');
      }
      
      // Define the total operations for progress calculation
      const totalOperations = records.length;
      let completedOperations = 0;
      
      // Process each record based on the table name
      for (const record of records) {
        if (tableName === 'projects') {
          await importProjectRecord(record);
        } else if (tableName === 'internships') {
          await importInternshipRecord(record);
        }
        
        completedOperations++;
        setImportProgress(30 + Math.floor((completedOperations / totalOperations) * 60));
      }
      
      setImportProgress(100);
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
      }, 1500);
      
      return { success: true, message: `Successfully imported ${records.length} records.` };
    } catch (error: any) {
      console.error('Import error:', error);
      setImportError(error.message || 'An unexpected error occurred during import.');
      setIsImporting(false);
      setImportProgress(0);
      return { success: false, message: error.message || 'Import failed.' };
    }
  };

  const importProjectRecord = async (record: any) => {
    // Extract student data from the record
    const students: StudentRecord[] = [];
    
    for (let i = 1; i <= maxStudents; i++) {
      const rollNo = record[`Student ${i} Roll No`];
      const name = record[`Student ${i} Name`];
      
      if (rollNo && name) {
        students.push({
          roll_no: String(rollNo),
          name: String(name),
          email: record[`Student ${i} Email`] ? String(record[`Student ${i} Email`]) : undefined,
          program: record[`Student ${i} Program`] ? String(record[`Student ${i} Program`]) : undefined
        });
      }
    }
    
    // Check if we have at least the minimum number of students
    if (students.length < minStudents) {
      throw new Error(`Each project must have at least ${minStudents} student(s).`);
    }
    
    // Prepare project data
    const projectData = {
      group_no: String(record['Group No']),
      title: String(record['Title']),
      domain: record['Domain'] ? String(record['Domain']) : null,
      faculty_mentor: record['Faculty Mentor'] ? String(record['Faculty Mentor']) : null,
      industry_mentor: record['Industry Mentor'] ? String(record['Industry Mentor']) : null,
      session: record['Session'] ? String(record['Session']) : null,
      year: record['Year'] ? String(record['Year']) : null,
      semester: record['Semester'] ? String(record['Semester']) : null,
      faculty_coordinator: record['Faculty Coordinator'] ? String(record['Faculty Coordinator']) : null,
      project_category: record['Project Category'] ? String(record['Project Category']) : null
    };
    
    // Insert the project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();
      
    if (projectError) {
      throw projectError;
    }
    
    // Insert the students
    if (students.length > 0) {
      const studentsWithGroupId = students.map(student => ({
        ...student,
        group_id: projectData.id
      }));
      
      const { error: studentsError } = await supabase
        .from('students')
        .insert(studentsWithGroupId);
        
      if (studentsError) {
        throw studentsError;
      }
    }
  };

  const importInternshipRecord = async (record: any) => {
    // Prepare internship data
    const internshipData = {
      roll_no: String(record['Roll No']),
      name: String(record['Name']),
      email: record['Email'] ? String(record['Email']) : null,
      phone_no: record['Phone No'] ? String(record['Phone No']) : null,
      domain: record['Domain'] ? String(record['Domain']) : null,
      organization_name: record['Organization'] ? String(record['Organization']) : null,
      position: record['Position'] ? String(record['Position']) : null,
      stipend: record['Stipend'] ? String(record['Stipend']) : null,
      starting_date: record['Starting Date'] ? String(record['Starting Date']) : null,
      ending_date: record['Ending Date'] ? String(record['Ending Date']) : null,
      session: record['Session'] ? String(record['Session']) : null,
      year: record['Year'] ? String(record['Year']) : null,
      semester: record['Semester'] ? String(record['Semester']) : null,
      program: record['Program'] ? String(record['Program']) : null,
      faculty_coordinator: record['Faculty Coordinator'] ? String(record['Faculty Coordinator']) : null
    };
    
    // Insert the internship
    const { error } = await supabase
      .from('internships')
      .insert(internshipData);
      
    if (error) {
      throw error;
    }
  };

  return {
    importExcelFile,
    isImporting,
    importProgress,
    importError
  };
}
