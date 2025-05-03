
import { useEffect } from 'react';

export function useProjectRefreshListener(callback: () => void) {
  useEffect(() => {
    // Create event listener for refreshing project data
    const handleRefreshData = () => {
      console.log('Refreshing project data...');
      callback();
    };
    
    window.addEventListener('refresh-projects-data', handleRefreshData);
    
    return () => {
      window.removeEventListener('refresh-projects-data', handleRefreshData);
    };
  }, [callback]);
}
