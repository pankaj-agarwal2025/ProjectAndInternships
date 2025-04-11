
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import InternshipTable from '@/components/InternshipTable';
import InternshipFilters from '@/components/InternshipFilters';
import { Faculty, setupDatabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const InternshipPortal = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    const facultyData = sessionStorage.getItem('faculty');
    
    if (!facultyData) {
      navigate('/login');
      return;
    }
    
    setFaculty(JSON.parse(facultyData));
    
    // Setup database if needed
    setupDatabase()
      .then(() => {
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
  }, [navigate, toast]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  if (!faculty || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
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
        </div>
        
        <InternshipFilters onFilterChange={handleFilterChange} />
        
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <InternshipTable filters={filters} />
        </div>
      </div>
    </div>
  );
};

export default InternshipPortal;
