import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ onFilterChange }) => {
  const [groupNo, setGroupNo] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [session, setSession] = useState<string>('');
  const [facultyCoordinator, setFacultyCoordinator] = useState<string>('');
  const [projectCategory, setProjectCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
  const [availableSessions, setAvailableSessions] = useState<string[]>([]);
  const [availableCoordinators, setAvailableCoordinators] = useState<string[]>([]);

  useEffect(() => {
    // Fetch available filter values from the database
    const fetchFilterOptions = async () => {
      try {
        // Fetch domains
        const { data: domains } = await supabase
          .from('projects')
          .select('domain')
          .not('domain', 'is', null);

        if (domains) {
          const uniqueDomains = [...new Set(domains.map(item => item.domain))].filter(Boolean);
          setAvailableDomains(uniqueDomains as string[]);
        }

        // Fetch years
        const { data: years } = await supabase
          .from('projects')
          .select('year')
          .not('year', 'is', null);

        if (years) {
          const uniqueYears = [...new Set(years.map(item => item.year))].filter(Boolean);
          setAvailableYears(uniqueYears as string[]);
        }

        // Fetch semesters
        const { data: semesters } = await supabase
          .from('projects')
          .select('semester')
          .not('semester', 'is', null);

        if (semesters) {
          const uniqueSemesters = [...new Set(semesters.map(item => item.semester))].filter(Boolean);
          setAvailableSemesters(uniqueSemesters as string[]);
        }

        // Fetch sessions
        const { data: sessions } = await supabase
          .from('projects')
          .select('session')
          .not('session', 'is', null);

        if (sessions) {
          const uniqueSessions = [...new Set(sessions.map(item => item.session))].filter(Boolean);
          setAvailableSessions(uniqueSessions as string[]);
        }

        // Fetch faculty coordinators
        const { data: coordinators } = await supabase
          .from('projects')
          .select('faculty_coordinator')
          .not('faculty_coordinator', 'is', null);

        if (coordinators) {
          const uniqueCoordinators = [...new Set(coordinators.map(item => item.faculty_coordinator))].filter(Boolean);
          setAvailableCoordinators(uniqueCoordinators as string[]);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterApply = () => {
    onFilterChange({
      group_no: groupNo,
      domain: domain === 'all_domains' ? '' : domain,
      year: year === 'all_years' ? '' : year,
      semester: semester === 'all_semesters' ? '' : semester,
      session: session === 'all_sessions' ? '' : session,
      faculty_coordinator: facultyCoordinator === 'all_coordinators' ? '' : facultyCoordinator,
      project_category: projectCategory === 'all_categories' ? '' : projectCategory,
      searchTerm,
    });
  };

  const handleClearFilters = () => {
    setGroupNo('');
    setDomain('');
    setYear('');
    setSemester('');
    setSession('');
    setFacultyCoordinator('');
    setProjectCategory('');
    setSearchTerm('');

    onFilterChange({});
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by title or group number..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label htmlFor="groupNo">Group Number</Label>
          <Input
            id="groupNo"
            value={groupNo}
            onChange={(e) => setGroupNo(e.target.value)}
            placeholder="Enter group no."
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="domain">Domain</Label>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger>
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_domains">All domains</SelectItem>
              {availableDomains.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="projectCategory">Project Category</Label>
          <Select value={projectCategory} onValueChange={setProjectCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_categories">All categories</SelectItem>
              <SelectItem value="Industry Based">Industry Based</SelectItem>
              <SelectItem value="Research Based">Research Based</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="year">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_years">All years</SelectItem>
              {availableYears.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="semester">Semester</Label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_semesters">All semesters</SelectItem>
              {availableSemesters.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="session">Session</Label>
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger>
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_sessions">All sessions</SelectItem>
              {availableSessions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="facultyCoordinator">Faculty Coordinator</Label>
          <Select value={facultyCoordinator} onValueChange={setFacultyCoordinator}>
            <SelectTrigger>
              <SelectValue placeholder="Select faculty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_coordinators">All coordinators</SelectItem>
              {availableCoordinators.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:col-span-1 lg:col-span-2 flex items-end space-x-2">
          <Button onClick={handleFilterApply} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectFilters;
