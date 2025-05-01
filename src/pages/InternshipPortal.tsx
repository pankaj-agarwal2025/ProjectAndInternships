
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import InternshipTable from '@/components/InternshipTable';
import InternshipFilters from '@/components/InternshipFilters';
import ImportExcelInternshipModal from '@/components/ImportExcelInternshipModal';
import { Faculty, setupDatabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, FileText, FilePlus2 } from 'lucide-react';

const InternshipPortal = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showImportExcelModal, setShowImportExcelModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("InternshipPortal component mounted");
    // Check if user is logged in
    const facultyData = sessionStorage.getItem('faculty');
    
    if (!facultyData) {
      console.log("No faculty data found, redirecting to login");
      navigate('/login');
      return;
    }
    
    try {
      console.log("Setting faculty data:", facultyData);
      setFaculty(JSON.parse(facultyData));
      
      // Setup database if needed
      setupDatabase()
        .then(() => {
          console.log("Database setup complete");
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error setting up database:', error);
          toast({
            title: 'Database Error',
            description: 'Failed to set up database. Please try again later.',
            variant: 'destructive',
          });
          setIsLoading(false);
        });
    } catch (error) {
      console.error("Error parsing faculty data:", error);
      toast({
        title: 'Error',
        description: 'An error occurred while loading your profile.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  }, [navigate, toast]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const handleAddNewInternship = () => {
    // Dispatch a custom event that InternshipTable can listen for
    const event = new CustomEvent('add-new-internship');
    document.dispatchEvent(event);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Session Expired</h2>
          <p className="text-gray-600 mb-4">Your session has expired or you are not logged in.</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar faculty={faculty} />
      
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Internship Portal</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage and track student internships
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="bg-secondary hover:bg-secondary/80 flex items-center"
              onClick={() => setShowImportExcelModal(true)}
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              Upload Excel
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 flex items-center"
              onClick={handleAddNewInternship}
              data-testid="add-new-internship"
            >
              <PlusCircle size={18} className="mr-2" />
              Add New Internship
            </Button>
          </div>
        </div>
        
        <InternshipFilters onFilterChange={handleFilterChange} />
        
        <div id="internship-table-container" className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <InternshipTable filters={filters} />
        </div>
      </div>
      
      <ImportExcelInternshipModal 
        isOpen={showImportExcelModal} 
        onClose={() => setShowImportExcelModal(false)}
      />
    </div>
    
   
  );
  
};

export default InternshipPortal;
