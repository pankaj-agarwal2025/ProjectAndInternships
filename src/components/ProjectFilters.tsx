
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getProjects } from '@/lib/supabase';

interface ProjectFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ onFilterChange }) => {
  const [session, setSession] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [facultyCoordinator, setFacultyCoordinator] = useState<string>('');
  
  const [sessions, setSessions] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [facultyCoordinators, setFacultyCoordinators] = useState<string[]>([
    'dr.pankaj', 'dr.anshu', 'dr.meenu', 'dr.swati'
  ]);
  
  useEffect(() => {
    // Fetch unique values for filters
    const fetchFilterOptions = async () => {
      const projects = await getProjects();
      
      const uniqueSessions = [...new Set(projects.map(p => p.session))].filter(Boolean) as string[];
      const uniqueYears = [...new Set(projects.map(p => p.year))].filter(Boolean) as string[];
      const uniqueSemesters = [...new Set(projects.map(p => p.semester))].filter(Boolean) as string[];
      
      setSessions(uniqueSessions);
      setYears(uniqueYears);
      setSemesters(uniqueSemesters);
    };
    
    fetchFilterOptions();
  }, []);
  
  const handleApplyFilters = () => {
    const filters: Record<string, any> = {};
    
    if (session) filters.session = session;
    if (year) filters.year = year;
    if (semester) filters.semester = semester;
    if (facultyCoordinator) filters.faculty_coordinator = facultyCoordinator;
    
    onFilterChange(filters);
  };
  
  const handleClearFilters = () => {
    setSession('');
    setYear('');
    setSemester('');
    setFacultyCoordinator('');
    onFilterChange({});
  };
  
  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="session">Session</Label>
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger id="session">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sessions</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger id="semester">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Semesters</SelectItem>
                {semesters.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="faculty-coordinator">Faculty Coordinator</Label>
            <Select value={facultyCoordinator} onValueChange={setFacultyCoordinator}>
              <SelectTrigger id="faculty-coordinator">
                <SelectValue placeholder="Select coordinator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Coordinators</SelectItem>
                {facultyCoordinators.map((fc) => (
                  <SelectItem key={fc} value={fc}>{fc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
          <Button onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFilters;
