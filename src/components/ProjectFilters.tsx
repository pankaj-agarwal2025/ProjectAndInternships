
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getProjects } from '@/lib/supabase';
import { Plus, Filter } from 'lucide-react';

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
  
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [customFilters, setCustomFilters] = useState<Array<{name: string, value: string}>>([]);
  const [newFilterName, setNewFilterName] = useState('');
  
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
    
    // Add custom filters
    customFilters.forEach(filter => {
      if (filter.value) {
        filters[filter.name] = filter.value;
      }
    });
    
    onFilterChange(filters);
  };
  
  const handleClearFilters = () => {
    setSession('');
    setYear('');
    setSemester('');
    setFacultyCoordinator('');
    setCustomFilters([]);
    onFilterChange({});
  };
  
  const handleAddCustomFilter = () => {
    if (newFilterName.trim()) {
      setCustomFilters([...customFilters, {name: newFilterName.trim(), value: ''}]);
      setNewFilterName('');
      setShowAddFilter(false);
    }
  };
  
  const handleCustomFilterChange = (index: number, value: string) => {
    const updatedFilters = [...customFilters];
    updatedFilters[index].value = value;
    setCustomFilters(updatedFilters);
  };
  
  const handleRemoveCustomFilter = (index: number) => {
    const updatedFilters = [...customFilters];
    updatedFilters.splice(index, 1);
    setCustomFilters(updatedFilters);
  };
  
  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAddFilter(!showAddFilter)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Filter
          </Button>
        </div>
        
        {showAddFilter && (
          <div className="mb-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter filter name"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={handleAddCustomFilter}>Add</Button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="session">Session</Label>
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger id="session">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
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
                <SelectItem value="all">All Years</SelectItem>
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
                <SelectItem value="all">All Semesters</SelectItem>
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
                <SelectItem value="all">All Coordinators</SelectItem>
                {facultyCoordinators.map((fc) => (
                  <SelectItem key={fc} value={fc}>{fc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Custom filters */}
        {customFilters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {customFilters.map((filter, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`custom-filter-${index}`}>{filter.name}</Label>
                <div className="flex gap-2">
                  <input
                    id={`custom-filter-${index}`}
                    type="text"
                    value={filter.value}
                    onChange={(e) => handleCustomFilterChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Filter by ${filter.name.toLowerCase()}`}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveCustomFilter(index)}
                    className="text-red-500"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
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
