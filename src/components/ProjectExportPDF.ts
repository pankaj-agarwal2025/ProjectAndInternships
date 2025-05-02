
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatNullable } from '@/utils/tableFormatters';
import { Project } from '@/lib/supabase';

export const generateProjectPDF = (projects: Project[], filters: Record<string, any> = {}) => {
  // Create new PDF in landscape orientation
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set font
  doc.setFont('helvetica');
  
  // Add title
  doc.setFontSize(20);
  const title = 'Project Portal Report';
  const pageWidth = doc.internal.pageSize.getWidth();
  const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize() / doc.internal.scaleFactor;
  const titleX = (pageWidth - titleWidth) / 2;
  
  doc.text(title, titleX, 15);
  
  // Add filters information
  doc.setFontSize(12);
  doc.text('Filter Information:', 14, 25);
  
  let filterText = 'No filters applied. Showing all projects.';
  if (Object.keys(filters).some(key => filters[key])) {
    filterText = 'Applied filters: ' + 
      Object.entries(filters)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key.replace('_', ' ')}: ${value}`)
        .join(', ');
  }
  
  doc.text(filterText, 14, 30);
  
  // Prepare table data
  const tableData = projects.map(project => [
    project.group_no || '',
    project.title || '',
    project.domain || '',
    project.faculty_mentor || '',
    project.industry_mentor || '',
    project.session || '',
    project.year || '',
    project.semester || '',
    project.faculty_coordinator || '',
    formatNullable(project.initial_total),
    formatNullable(project.progress_total),
    formatNullable(project.final_total)
  ]);
  
  // Create table
  autoTable(doc, {
    startY: 35,
    head: [[
      'Group No',
      'Title',
      'Domain',
      'Faculty Mentor',
      'Industry Mentor',
      'Session',
      'Year',
      'Semester',
      'Faculty Coordinator',
      'Initial Evaluation',
      'Progress Evaluation',
      'Final Evaluation'
    ]],
    body: tableData,
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold',
      cellPadding: 3
    },
    bodyStyles: {
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 22 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 },
      6: { cellWidth: 15 },
      7: { cellWidth: 15 },
      8: { cellWidth: 30 },
      9: { cellWidth: 20, halign: 'center' },
      10: { cellWidth: 20, halign: 'center' },
      11: { cellWidth: 20, halign: 'center' }
    },
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    styles: {
      overflow: 'linebreak',
      fontSize: 9,
      cellWidth: 'wrap'
    },
    willDrawCell: function(data) {
      // Ensure text wrapping works properly
      if (data.section === 'body') {
        const cell = data.cell;
        if (cell.text) {
          cell.text = cell.text.map(text => 
            typeof text === 'string' ? text.replace(/(.{25})/g, "$1 ").trim() : text
          );
        }
      }
    }
  });
  
  // Save the PDF
  doc.save('project-report.pdf');
};
