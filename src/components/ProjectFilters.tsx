
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface ProjectFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

const ProjectFilters = ({ onFilterChange }: ProjectFiltersProps) => {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [years, setYears] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [facultyCoordinators, setFacultyCoordinators] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);

  // Fetch distinct values for select filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      // Fetch distinct years
      const { data: yearData } = await supabase
        .from('projects')
        .select('year')
        .not('year', 'is', null);
      
      if (yearData) {
        const uniqueYears = Array.from(new Set(yearData.map(item => item.year))).filter(Boolean);
        setYears(uniqueYears);
      }
      
      // Fetch distinct semesters
      const { data: semesterData } = await supabase
        .from('projects')
        .select('semester')
        .not('semester', 'is', null);
      
      if (semesterData) {
        const uniqueSemesters = Array.from(new Set(semesterData.map(item => item.semester))).filter(Boolean);
        setSemesters(uniqueSemesters);
      }
      
      // Fetch distinct sessions
      const { data: sessionData } = await supabase
        .from('projects')
        .select('session')
        .not('session', 'is', null);
      
      if (sessionData) {
        const uniqueSessions = Array.from(new Set(sessionData.map(item => item.session))).filter(Boolean);
        setSessions(uniqueSessions);
      }
      
      // Fetch distinct faculty coordinators
      const { data: facultyData } = await supabase
        .from('projects')
        .select('faculty_coordinator')
        .not('faculty_coordinator', 'is', null);
      
      if (facultyData) {
        const uniqueFaculty = Array.from(new Set(facultyData.map(item => item.faculty_coordinator))).filter(Boolean);
        setFacultyCoordinators(uniqueFaculty);
      }
      
      // Fetch distinct programs
      const { data: studentData } = await supabase
        .from('students')
        .select('program')
        .not('program', 'is', null);
      
      if (studentData) {
        const uniquePrograms = Array.from(new Set(studentData.map(item => item.program))).filter(Boolean);
        setPrograms(uniquePrograms);
      }
    };
    
    fetchFilterOptions();
  }, []);

  const handleGroupChange = (value: string) => {
    setFilters({ ...filters, group_no: value });
  };

  const handleYearChange = (value: string) => {
    setFilters({ ...filters, year: value === 'all_years' ? '' : value });
  };

  const handleSemesterChange = (value: string) => {
    setFilters({ ...filters, semester: value === 'all_semesters' ? '' : value });
  };

  const handleSessionChange = (value: string) => {
    setFilters({ ...filters, session: value === 'all_sessions' ? '' : value });
  };

  const handleFacultyCoordinatorChange = (value: string) => {
    setFilters({ ...filters, faculty_coordinator: value === 'all_faculty' ? '' : value });
  };

  const handleProgramChange = (value: string) => {
    setFilters({ ...filters, program: value === 'all_programs' ? '' : value });
  };

  const handleSearchTermChange = (value: string) => {
    setFilters({ ...filters, searchTerm: value });
  };

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="grid gap-2">
        <Label htmlFor="searchTerm">Search</Label>
        <Input
          id="searchTerm"
          placeholder="Search projects..."
          onChange={(e) => handleSearchTermChange(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="group">Group No</Label>
        <Input
          id="group"
          placeholder="Filter by group no..."
          onChange={(e) => handleGroupChange(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="year">Year</Label>
        <Select onValueChange={handleYearChange}>
          <SelectTrigger id="year">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_years">All Years</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="semester">Semester</Label>
        <Select onValueChange={handleSemesterChange}>
          <SelectTrigger id="semester">
            <SelectValue placeholder="Select semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_semesters">All Semesters</SelectItem>
            {semesters.map((semester) => (
              <SelectItem key={semester} value={semester}>{semester}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="session">Session</Label>
        <Select onValueChange={handleSessionChange}>
          <SelectTrigger id="session">
            <SelectValue placeholder="Select session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_sessions">All Sessions</SelectItem>
            {sessions.map((session) => (
              <SelectItem key={session} value={session}>{session}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="faculty_coordinator">Faculty Coordinator</Label>
        <Select onValueChange={handleFacultyCoordinatorChange}>
          <SelectTrigger id="faculty_coordinator">
            <SelectValue placeholder="Select coordinator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_faculty">All Faculty</SelectItem>
            {facultyCoordinators.map((faculty) => (
              <SelectItem key={faculty} value={faculty}>{faculty}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="program">Program</Label>
        <Select onValueChange={handleProgramChange}>
          <SelectTrigger id="program">
            <SelectValue placeholder="Select program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_programs">All Programs</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program} value={program}>{program}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProjectFilters;
