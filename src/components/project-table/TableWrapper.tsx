
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
  
  // We don't need separate refs for header and content anymore as we're using a single scrollable container
  
  return (
    <div className="flex flex-col">
      {/* Using a single container for both header and body with overflow property */}
      <div 
        className="overflow-auto max-h-[70vh]" 
        ref={tableContainerRef}
      >
        <Table>
          <TableHeader>
            {headerContent}
          </TableHeader>
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
