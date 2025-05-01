
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Faculty, setupDatabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import AdminPanel from '@/components/AdminPanel';
import Footer from '@/components/footer';
import { BookOpen, Users, LogOut } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    const facultyData = sessionStorage.getItem('faculty');

    if (!facultyData) {
      navigate('/login');
      return;
    }

    try {
      const parsedData = JSON.parse(facultyData);
      setFaculty(parsedData);

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
    } catch (error) {
      console.error('Error parsing faculty data:', error);
      navigate('/login');
    }
  }, [navigate, toast]);

  const handleLogout = () => {
    sessionStorage.removeItem('faculty');
    navigate('/login');
  };

  if (isLoading) {
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Welcome, {faculty?.name}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Access tools to manage projects and internships
            </p>
          </div>

          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {faculty?.role === 'admin' && (
          <div className="mb-10">
            <AdminPanel currentFaculty={faculty} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Portal</CardTitle>
              <CardDescription>
                Manage student projects, groups, and evaluations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="pl-2 text-gray-600 dark:text-gray-300 space-y-2">
                <div>Organize students into project groups</div>
                <div>Track project progress and submissions</div>
                <div>Evaluate project phases and provide feedback</div>
                <div>Export project data for reporting</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/project-portal')}>
                <BookOpen className="mr-2 h-4 w-4" />
                Go to Project Portal
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internship Portal</CardTitle>
              <CardDescription>
                Track internships and student placements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="pl-2 text-gray-600 dark:text-gray-300 space-y-2">
                <div>Track internship placements and organizations</div>
                <div>Manage internship documentation</div>
                <div>Monitor internship duration and positions</div>
                <div>Generate reports and analytics</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/internship-portal')}>
                <Users className="mr-2 h-4 w-4" />
                Go to Internship Portal
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>


    </div>
  );
};

export default Home;
