
import React, { useRef, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
} from "@/components/ui/table";

interface TableWrapperProps {
  headerContent: React.ReactNode;
  bodyContent: React.ReactNode;
  showPagination?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

const TableWrapper: React.FC<TableWrapperProps> = ({
  headerContent,
  bodyContent,
  showPagination = false,
  totalItems = 0,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange = () => {},
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const headerContainerRef = useRef<HTMLDivElement>(null);
  
  // Synchronize header and content scrolling
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const headerContainer = headerContainerRef.current;
    
    if (!tableContainer || !headerContainer) return;
    
    const handleScroll = () => {
      headerContainer.scrollLeft = tableContainer.scrollLeft;
    };
    
    tableContainer.addEventListener('scroll', handleScroll);
    
    return () => {
      tableContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <div className="flex flex-col">
      <div 
        className="overflow-hidden"
        ref={headerContainerRef}
      >
        <Table>
          <TableHeader>
            {headerContent}
          </TableHeader>
        </Table>
      </div>
      
      <div 
        className="overflow-auto max-h-[70vh]" 
        ref={tableContainerRef}
      >
        <Table>
          <TableBody>
            {bodyContent}
          </TableBody>
        </Table>
      </div>
      
      {showPagination && totalItems > 0 && (
        <div className="flex justify-end mt-4 space-x-2">
          <button
            className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-primary text-white rounded">{currentPage}</span>
          {currentPage < Math.ceil(totalItems / itemsPerPage) && (
            <span className="px-4 py-2 bg-gray-100 rounded cursor-pointer" onClick={() => onPageChange(currentPage + 1)}>
              {currentPage + 1}
            </span>
          )}
          <button
            className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TableWrapper;
