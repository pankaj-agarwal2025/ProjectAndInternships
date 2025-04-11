
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DownloadIcon, FileIcon, Pencil, Save, X } from 'lucide-react';
import { getProjects, getStudentsByGroupId, updateProject, updateStudent, getDynamicColumns, getDynamicColumnValues, addDynamicColumnValue } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

interface ProjectTableProps {
  filters: Record<string, any>;
}

interface ProjectWithStudents {
  project: any;
  students: any[];
  dynamicColumnValues: any[];
}

const ProjectTable: React.FC<ProjectTableProps> = ({ filters }) => {
  const [data, setData] = useState<ProjectWithStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingCell, setEditingCell] = useState<{row: number, col: string, student?: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dynamicColumns, setDynamicColumns] = useState<any[]>([]);
  const { toast } = useToast();
  
  // Standard columns
  const projectColumns = [
    { id: 'group_no', name: 'Group No', editable: true },
    { id: 'title', name: 'Title', editable: true },
    { id: 'domain', name: 'Domain', editable: true },
    { id: 'faculty_mentor', name: 'Faculty Mentor', editable: true },
    { id: 'industry_mentor', name: 'Industry Mentor', editable: true },
    { id: 'session', name: 'Session', editable: true },
    { id: 'year', name: 'Year', editable: true },
    { id: 'semester', name: 'Semester', editable: true },
    { id: 'faculty_coordinator', name: 'Faculty Coordinator', editable: true },
    { id: 'progress_form_url', name: 'Progress Form', editable: true, fileType: true },
    { id: 'presentation_url', name: 'Presentation', editable: true, fileType: true },
    { id: 'report_url', name: 'Report', editable: true, fileType: true },
  ];
  
  const studentColumns = [
    { id: 'roll_no', name: 'Roll No', editable: true },
    { id: 'name', name: 'Name', editable: true },
    { id: 'email', name: 'Email', editable: true },
    { id: 'program', name: 'Program', editable: true },
  ];
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Fetch dynamic columns
        const columns = await getDynamicColumns();
        setDynamicColumns(columns);
        
        // Fetch projects with filters
        const projects = await getProjects(filters);
        
        // Fetch students and dynamic column values for each project
        const projectsWithData = await Promise.all(
          projects.map(async (project) => {
            const students = await getStudentsByGroupId(project.id);
            const dynamicColumnValues = await getDynamicColumnValues(project.id);
            
            return {
              project,
              students,
              dynamicColumnValues,
            };
          })
        );
        
        setData(projectsWithData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Data Loading Error',
          description: 'Failed to load projects data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [filters, toast]);
  
  const handleCellEdit = (rowIndex: number, colId: string, studentIndex?: number) => {
    const project = data[rowIndex];
    
    let initialValue = '';
    if (studentIndex !== undefined) {
      initialValue = project.students[studentIndex]?.[colId] || '';
    } else if (colId.startsWith('dynamic_')) {
      const dynamicColId = colId.replace('dynamic_', '');
      const valueObj = project.dynamicColumnValues.find(v => v.column_id === dynamicColId);
      initialValue = valueObj?.value || '';
    } else {
      initialValue = project.project[colId] || '';
    }
    
    setEditingCell({ row: rowIndex, col: colId, student: studentIndex });
    setEditValue(initialValue);
  };
  
  const handleSaveEdit = async () => {
    if (!editingCell) return;
    
    const { row, col, student } = editingCell;
    const projectData = data[row];
    
    try {
      if (student !== undefined) {
        // Update student data
        const studentId = projectData.students[student].id;
        await updateStudent(studentId, { [col]: editValue });
        
        // Update local state
        const updatedData = [...data];
        updatedData[row].students[student][col] = editValue;
        setData(updatedData);
      } else if (col.startsWith('dynamic_')) {
        // Update dynamic column value
        const dynamicColId = col.replace('dynamic_', '');
        const projectId = projectData.project.id;
        const existingValue = projectData.dynamicColumnValues.find(v => v.column_id === dynamicColId);
        
        if (existingValue) {
          // Update existing value (not implemented yet in backend)
          // For now, we'll just update the local state
          const updatedData = [...data];
          const valueIndex = updatedData[row].dynamicColumnValues.findIndex(v => v.column_id === dynamicColId);
          if (valueIndex !== -1) {
            updatedData[row].dynamicColumnValues[valueIndex].value = editValue;
          }
          setData(updatedData);
        } else {
          // Add new value
          const newValue = await addDynamicColumnValue(dynamicColId, projectId, editValue);
          
          // Update local state
          const updatedData = [...data];
          updatedData[row].dynamicColumnValues.push({
            column_id: dynamicColId,
            project_id: projectId,
            value: editValue,
            dynamic_columns: dynamicColumns.find(c => c.id === dynamicColId),
          });
          setData(updatedData);
        }
      } else {
        // Update project data
        const projectId = projectData.project.id;
        await updateProject(projectId, { [col]: editValue });
        
        // Update local state
        const updatedData = [...data];
        updatedData[row].project[col] = editValue;
        setData(updatedData);
      }
      
      toast({
        title: 'Update Successful',
        description: 'The data has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating data:', error);
      toast({
        title: 'Update Error',
        description: 'Failed to update the data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setEditingCell(null);
      setEditValue('');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };
  
  const renderCellContent = (rowIndex: number, colId: string, studentIndex?: number) => {
    const project = data[rowIndex];
    
    // Check if this cell is being edited
    if (
      editingCell?.row === rowIndex &&
      editingCell.col === colId &&
      editingCell.student === studentIndex
    ) {
      return (
        <div className="flex items-center">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 mr-1"
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={handleSaveEdit}
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={handleCancelEdit}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    
    // Regular cell display
    let value: string | React.ReactNode = '';
    let isEditable = false;
    let isFileType = false;
    
    if (studentIndex !== undefined) {
      // Student column
      const studentColumn = studentColumns.find(c => c.id === colId);
      if (studentColumn) {
        value = project.students[studentIndex]?.[colId] || '';
        isEditable = studentColumn.editable;
      }
    } else if (colId.startsWith('dynamic_')) {
      // Dynamic column
      const dynamicColId = colId.replace('dynamic_', '');
      const valueObj = project.dynamicColumnValues.find(v => v.column_id === dynamicColId);
      value = valueObj?.value || '';
      isEditable = true;
    } else {
      // Project column
      const projectColumn = projectColumns.find(c => c.id === colId);
      if (projectColumn) {
        value = project.project[colId] || '';
        isEditable = projectColumn.editable;
        isFileType = projectColumn.fileType;
      }
    }
    
    // Special rendering for file type cells
    if (isFileType && value) {
      value = (
        <a
          href={value.toString()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-primary hover:text-primary-dark"
        >
          <FileIcon className="h-4 w-4 mr-1" />
          View File
        </a>
      );
    }
    
    return (
      <div className="flex items-center justify-between">
        <div className="max-w-[200px] truncate">{value}</div>
        {isEditable && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 ml-2 opacity-0 group-hover:opacity-100"
            onClick={() => handleCellEdit(rowIndex, colId, studentIndex)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };
  
  const handleExportToExcel = () => {
    // Create a workbook
    const wb = XLSX.utils.book_new();
    
    // Format the data for export
    const exportData = data.flatMap((item, index) => {
      const projectData = item.project;
      
      return item.students.map((student, studentIndex) => {
        const row: Record<string, any> = {
          // Project data (only show for first student in group)
          'Group No': projectData.group_no,
          'Title': projectData.title,
          'Domain': projectData.domain,
          'Faculty Mentor': projectData.faculty_mentor,
          'Industry Mentor': projectData.industry_mentor,
          'Session': projectData.session,
          'Year': projectData.year,
          'Semester': projectData.semester,
          'Faculty Coordinator': projectData.faculty_coordinator,
          
          // Student data
          'Roll No': student.roll_no,
          'Name': student.name,
          'Email': student.email,
          'Program': student.program,
        };
        
        // Add dynamic columns
        dynamicColumns.forEach(col => {
          const valueObj = item.dynamicColumnValues.find(v => v.column_id === col.id);
          row[col.name] = valueObj?.value || '';
        });
        
        return row;
      });
    });
    
    // Create worksheet and add to workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    
    // Save workbook
    XLSX.writeFile(wb, 'project_data.xlsx');
  };
  
  // Pagination logic
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, data.length);
  const paginatedData = data.slice(startIndex, endIndex);
  
  // Pagination controls
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">Loading project data...</div>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>No projects found. Please try different filters or add a new project.</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span>Show</span>
          <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
            <SelectTrigger className="w-16">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>
        
        <Button variant="outline" onClick={handleExportToExcel}>
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Group column */}
              <TableHead>Group Data</TableHead>
              
              {/* Student columns */}
              <TableHead>Student Data</TableHead>
              
              {/* Dynamic columns */}
              {dynamicColumns.length > 0 && (
                <TableHead>Additional Parameters</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, rowIndex) => (
              <TableRow key={item.project.id} className="group">
                {/* Group data cell */}
                <TableCell className="p-2 align-top">
                  <div className="space-y-3">
                    {projectColumns.map(col => (
                      <div key={col.id} className="flex">
                        <div className="font-medium w-40 text-sm">{col.name}:</div>
                        <div className="flex-1">
                          {renderCellContent(rowIndex + startIndex, col.id)}
                        </div>
                      </div>
                    ))}
                  </div>
                </TableCell>
                
                {/* Student data cell */}
                <TableCell className="p-2 align-top">
                  <div className="space-y-6">
                    {item.students.map((student, studentIndex) => (
                      <div key={student.id} className="pb-4 border-b last:border-0">
                        <div className="font-medium text-sm mb-2">Student {studentIndex + 1}</div>
                        <div className="space-y-3">
                          {studentColumns.map(col => (
                            <div key={col.id} className="flex">
                              <div className="font-medium w-40 text-sm">{col.name}:</div>
                              <div className="flex-1">
                                {renderCellContent(
                                  rowIndex + startIndex,
                                  col.id,
                                  studentIndex
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TableCell>
                
                {/* Dynamic columns cell */}
                {dynamicColumns.length > 0 && (
                  <TableCell className="p-2 align-top">
                    <div className="space-y-3">
                      {dynamicColumns.map(col => (
                        <div key={col.id} className="flex">
                          <div className="font-medium w-40 text-sm">{col.name}:</div>
                          <div className="flex-1">
                            {renderCellContent(rowIndex + startIndex, `dynamic_${col.id}`)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            Showing {startIndex + 1} to {endIndex} of {data.length} entries
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default ProjectTable;
