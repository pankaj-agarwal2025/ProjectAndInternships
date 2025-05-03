
import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TableWrapperProps {
  headerContent: React.ReactNode;
  bodyContent: React.ReactNode;
  className?: string;
  showPagination?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

/**
 * TableWrapper component that synchronizes horizontal scrolling between header and body
 */
const TableWrapper: React.FC<TableWrapperProps> = ({
  headerContent,
  bodyContent,
  className,
  showPagination = true,
  totalItems = 0,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange
}) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Synchronize horizontal scrolling between header and body
  useEffect(() => {
    const headerElement = headerRef.current;
    const bodyElement = bodyRef.current;
    
    if (!headerElement || !bodyElement) return;
    
    const handleHeaderScroll = () => {
      if (bodyElement) {
        bodyElement.scrollLeft = headerElement.scrollLeft;
      }
    };
    
    const handleBodyScroll = () => {
      if (headerElement) {
        headerElement.scrollLeft = bodyElement.scrollLeft;
      }
    };
    
    headerElement.addEventListener('scroll', handleHeaderScroll);
    bodyElement.addEventListener('scroll', handleBodyScroll);
    
    return () => {
      headerElement.removeEventListener('scroll', handleHeaderScroll);
      bodyElement.removeEventListener('scroll', handleBodyScroll);
    };
  }, []);
  
  return (
    <div className={`flex flex-col ${className || ''}`}>
      {/* Table header with horizontal scroll */}
      <div 
        ref={headerRef}
        className="overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {headerContent}
      </div>
      
      {/* Table body with horizontal scroll */}
      <div 
        ref={bodyRef}
        className="overflow-x-auto max-h-[calc(100vh-350px)] overflow-y-auto"
      >
        {bodyContent}
      </div>
      
      {/* Pagination */}
      {showPagination && totalItems > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{' '}
                of <span className="font-medium">{totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => onPageChange?.(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                  let pageNumber: number;
                  
                  if (totalPages <= 5) {
                    // Show all pages if 5 or fewer
                    pageNumber = index + 1;
                  } else if (currentPage <= 3) {
                    // Near the start
                    pageNumber = index + 1;
                    if (index === 4) pageNumber = totalPages;
                  } else if (currentPage >= totalPages - 2) {
                    // Near the end
                    if (index === 0) pageNumber = 1;
                    else pageNumber = totalPages - (4 - index);
                  } else {
                    // In the middle
                    pageNumber = currentPage - 2 + index;
                    if (index === 0) pageNumber = 1;
                    if (index === 4) pageNumber = totalPages;
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => onPageChange?.(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNumber === currentPage
                          ? 'bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange?.(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableWrapper;
