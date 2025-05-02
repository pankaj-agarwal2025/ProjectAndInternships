
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatNullable } from '@/utils/tableFormatters';
import { Internship } from '@/lib/supabase';

export const generateInternshipPDF = (internships: Internship[], filters: Record<string, any> = {}) => {
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
  const title = 'Internship Portal Report';
  const pageWidth = doc.internal.pageSize.getWidth();
  const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize() / doc.internal.scaleFactor;
  const titleX = (pageWidth - titleWidth) / 2;
  
  doc.text(title, titleX, 15);
  
  // Add filters information
  doc.setFontSize(12);
  doc.text('Filter Information:', 14, 25);
  
  let filterText = 'No filters applied. Showing all internships.';
  if (Object.keys(filters).some(key => filters[key])) {
    filterText = 'Applied filters: ' + 
      Object.entries(filters)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key.replace('_', ' ')}: ${value}`)
        .join(', ');
  }
  
  doc.text(filterText, 14, 30);
  
  // Prepare table data
  const tableData = internships.map(internship => [
    internship.roll_no || '',
    internship.name || '',
    internship.organization_name || '',
    internship.position || '',
    formatDate(internship.starting_date),
    formatDate(internship.ending_date),
    internship.stipend || 'N/A',
    internship.internship_duration ? `${internship.internship_duration} days` : 'N/A',
    internship.domain || '',
    internship.program || '',
    internship.faculty_coordinator || ''
  ]);
  
  // Create table
  autoTable(doc, {
    startY: 35,
    head: [[
      'Roll No',
      'Name',
      'Organization',
      'Position',
      'Starting Date',
      'Ending Date',
      'Stipend',
      'Duration',
      'Domain',
      'Program',
      'Faculty Coordinator'
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
      0: { cellWidth: 20 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 22 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 15, halign: 'right' },
      7: { cellWidth: 15, halign: 'center' },
      8: { cellWidth: 22 },
      9: { cellWidth: 20 },
      10: { cellWidth: 30 }
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
  doc.save('internship-report.pdf');
};
