
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DownloadIcon, FileIcon, Pencil, Save, X, Trash2, FileUp, AlertTriangle } from 'lucide-react';
import { getProjects, getStudentsByGroupId, updateProject, updateStudent, getDynamicColumns, getDynamicColumnValues, addDynamicColumnValue, deleteProject } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { jsPDF } from 'jspdf';
// @ts-ignore - Missing types for jspdf-autotable
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [fileUploading, setFileUploading] = useState<{row: number, col: string} | null>(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, rowIndex: number, colId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setFileUploading({ row: rowIndex, col: colId });
    
    try {
      const projectId = data[rowIndex].project.id;
      const fileName = `${colId}_${projectId}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      
      // Upload file to storage
      const { data: fileData, error: uploadError } = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          contentType: file.type,
        }),
      }).then(res => res.json());
      
      if (uploadError) throw new Error(uploadError.message);
      
      // Upload the file to the presigned URL
      await fetch(fileData.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });
      
      // Update the project with the file URL
      const fileUrl = fileData.publicUrl;
      await updateProject(projectId, { [colId]: fileUrl });
      
      // Update local state
      const updatedData = [...data];
      updatedData[rowIndex].project[colId] = fileUrl;
      setData(updatedData);
      
      toast({
        title: 'File Upload Successful',
        description: 'The file has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload the file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFileUploading(null);
    }
  };
  
  const handleURLInput = async (rowIndex: number, colId: string) => {
    setEditingCell({ row: rowIndex, col: colId });
    setEditValue(data[rowIndex].project[colId] || '');
  };
  
  const handleDeleteProject = (projectId: string) => {
    setDeleteProjectId(projectId);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDeleteProject = async () => {
    if (!deleteProjectId) return;
    
    try {
      await deleteProject(deleteProjectId);
      
      // Remove from local state
      setData(data.filter(item => item.project.id !== deleteProjectId));
      
      toast({
        title: 'Project Deleted',
        description: 'The project has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Delete Error',
        description: 'Failed to delete the project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteProjectId(null);
    }
  };
  
  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a column name.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Add dynamic column to database
      const { data: newColumn, error } = await fetch('/api/add-dynamic-column', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newColumnName,
          type: newColumnType,
        }),
      }).then(res => res.json());
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setDynamicColumns([...dynamicColumns, newColumn]);
      
      toast({
        title: 'Column Added',
        description: `The column "${newColumnName}" has been added successfully.`,
      });
      
      // Reset form
      setNewColumnName('');
      setNewColumnType('text');
      setShowAddColumnModal(false);
    } catch (error) {
      console.error('Error adding column:', error);
      toast({
        title: 'Add Column Error',
        description: 'Failed to add the column. Please try again.',
        variant: 'destructive',
      });
    }
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
      return (
        <div className="flex items-center">
          <a
            href={value.toString()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-primary hover:text-primary-dark mr-2"
          >
            <FileIcon className="h-4 w-4 mr-1" />
            View
          </a>
          
          <div className="relative flex items-center">
            <input
              type="file"
              id={`file-${rowIndex}-${colId}`}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              onChange={(e) => handleFileUpload(e, rowIndex, colId)}
              disabled={!!fileUploading}
            />
            <label
              htmlFor={`file-${rowIndex}-${colId}`}
              className={`text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 cursor-pointer ${
                fileUploading?.row === rowIndex && fileUploading?.col === colId
                  ? 'opacity-50 cursor-wait'
                  : ''
              }`}
            >
              {fileUploading?.row === rowIndex && fileUploading?.col === colId
                ? 'Uploading...'
                : 'Upload'}
            </label>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 ml-1"
            onClick={() => handleURLInput(rowIndex, colId)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      );
    }
    
    if (isFileType && !value) {
      return (
        <div className="flex items-center">
          <div className="relative flex items-center mr-2">
            <input
              type="file"
              id={`file-${rowIndex}-${colId}`}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              onChange={(e) => handleFileUpload(e, rowIndex, colId)}
              disabled={!!fileUploading}
            />
            <label
              htmlFor={`file-${rowIndex}-${colId}`}
              className={`text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 cursor-pointer ${
                fileUploading?.row === rowIndex && fileUploading?.col === colId
                  ? 'opacity-50 cursor-wait'
                  : ''
              }`}
            >
              {fileUploading?.row === rowIndex && fileUploading?.col === colId
                ? 'Uploading...'
                : 'Upload File'}
            </label>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => handleURLInput(rowIndex, colId)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
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
          // Project data
          'Group No': projectData.group_no,
          'Title': projectData.title,
          'Domain': projectData.domain,
          'Faculty Mentor': projectData.faculty_mentor,
          'Industry Mentor': projectData.industry_mentor,
          'Session': projectData.session,
          'Year': projectData.year,
          'Semester': projectData.semester,
          'Faculty Coordinator': projectData.faculty_coordinator,
          'Progress Form': projectData.progress_form_url || '',
          'Presentation': projectData.presentation_url || '',
          'Report': projectData.report_url || '',
          
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
  
  const handleExportToPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      
      // Add title and date
      doc.setFontSize(18);
      doc.text('Project Data Report', 14, 20);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);
      
      // Add filter information if any
      if (Object.keys(filters).length > 0) {
        doc.setFontSize(12);
        doc.text('Applied Filters:', 14, 34);
        let yPos = 40;
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            const filterName = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            doc.setFontSize(10);
            doc.text(`${filterName}: ${value}`, 14, yPos);
            yPos += 6;
          }
        });
      }
      
      // Format data for the table
      const tableData = data.map(item => {
        const project = item.project;
        const students = item.students.map(s => `${s.name} (${s.roll_no})`).join(', ');
        
        return [
          project.group_no,
          project.title,
          students,
          project.program || '',
          project.domain,
          project.faculty_mentor,
          project.session,
          project.year
        ];
      });
      
      // Generate table with autoTable
      (doc as any).autoTable({
        startY: Object.keys(filters).length > 0 ? 50 : 35,
        head: [['Group No', 'Title', 'Students', 'Program', 'Domain', 'Faculty Mentor', 'Session', 'Year']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Save the PDF
      doc.save('project_report.pdf');
      
      toast({
        title: 'Success',
        description: 'PDF exported successfully',
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        variant: 'destructive',
      });
    }
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
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowAddColumnModal(true)}>
            + Add Column
          </Button>
          <Button variant="outline" onClick={handleExportToExcel}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportToPDF}
            data-export-pdf-button
          >
            <FileIcon className="h-4 w-4 mr-2" />
            Export to PDF
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Actions column */}
              <TableHead className="w-20">Actions</TableHead>
              
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
                {/* Actions column */}
                <TableCell className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 hover:bg-red-100"
                    onClick={() => handleDeleteProject(item.project.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </TableCell>
                
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project Group</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the entire project group and all associated student data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={confirmDeleteProject}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add Column Modal */}
      <Dialog open={showAddColumnModal} onOpenChange={setShowAddColumnModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Column</DialogTitle>
            <DialogDescription>
              Add a new column to track additional project information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="column-name" className="text-sm font-medium">
                Column Name
              </label>
              <Input
                id="column-name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="e.g., Project Status"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="column-type" className="text-sm font-medium">
                Column Type
              </label>
              <Select
                value={newColumnType}
                onValueChange={setNewColumnType}
              >
                <SelectTrigger id="column-type">
                  <SelectValue placeholder="Select a column type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Yes/No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowAddColumnModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddColumn}>
              Add Column
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectTable;
