
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { getInternshipDynamicColumns } from '@/lib/supabase';

interface InternshipFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

const InternshipFilters: React.FC<InternshipFiltersProps> = ({ onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [domain, setDomain] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [session, setSession] = useState('');
  const [organization, setOrganization] = useState('');
  const [program, setProgram] = useState('');
  const [month, setMonth] = useState('');
  const [facultyCoordinator, setFacultyCoordinator] = useState('');
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string>>({});
  const [dynamicColumns, setDynamicColumns] = useState<any[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableCoordinators, setAvailableCoordinators] = useState<string[]>([]);

  useEffect(() => {
    fetchDynamicColumns();
    fetchAvailableMonths();
    fetchAvailableCoordinators();
  }, []);

  useEffect(() => {
    const filters = {
      searchTerm: searchTerm || '',
      domain: domain || '',
      year: year || '',
      semester: semester || '',
      session: session || '',
      organization_name: organization || '',
      program: program === 'all_programs' ? '' : program,
      month: month === 'all_months' ? '' : month,
      faculty_coordinator: facultyCoordinator === 'all_coordinators' ? '' : facultyCoordinator,
      ...dynamicFilters,
    };
    onFilterChange(filters);
  }, [searchTerm, domain, year, semester, session, organization, program, month, facultyCoordinator, dynamicFilters, onFilterChange]);

  const fetchDynamicColumns = async () => {
    try {
      const columns = await getInternshipDynamicColumns();
      setDynamicColumns(columns);
    } catch (error) {
      console.error('Error fetching dynamic columns:', error);
    }
  };

  const fetchAvailableMonths = async () => {
    try {
      const { data } = await supabase
        .from('internships')
        .select('starting_date');
      
      if (data) {
        const months = data
          .filter(item => item.starting_date)
          .map(item => {
            const date = new Date(item.starting_date);
            return date.toLocaleString('default', { month: 'long' });
          });
        
        setAvailableMonths([...new Set(months)]);
      }
    } catch (error) {
      console.error('Error fetching available months:', error);
    }
  };

  const fetchAvailableCoordinators = async () => {
    try {
      const { data } = await supabase
        .from('internships')
        .select('faculty_coordinator')
        .not('faculty_coordinator', 'is', null);
      
      if (data) {
        const coordinators = data
          .map(item => item.faculty_coordinator)
          .filter(Boolean);
        
        setAvailableCoordinators([...new Set(coordinators)]);
      }
    } catch (error) {
      console.error('Error fetching available coordinators:', error);
    }
  };

  const handleDynamicFilterChange = (columnId: string, value: string) => {
    setDynamicFilters((prev) => ({
      ...prev,
      [columnId]: value,
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDomain('');
    setYear('');
    setSemester('');
    setSession('');
    setOrganization('');
    setProgram('');
    setMonth('');
    setFacultyCoordinator('');
    setDynamicFilters({});
  };

  return (
    <Card>
      <div className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search by name, roll no, organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="whitespace-nowrap"
          >
            {isFiltersOpen ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          {(searchTerm || domain || year || semester || session || organization || program || month || facultyCoordinator || Object.keys(dynamicFilters).length > 0) && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="whitespace-nowrap"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
        
        {isFiltersOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., Web Development"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g., Microsoft"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger id="program">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_programs">All Programs</SelectItem>
                  <SelectItem value="BSc CS">BSc CS</SelectItem>
                  <SelectItem value="BSc DS">BSc DS</SelectItem>
                  <SelectItem value="BSc Cyber">BSc Cyber</SelectItem>
                  <SelectItem value="BCA">BCA</SelectItem>
                  <SelectItem value="BCA AI/DS">BCA AI/DS</SelectItem>
                  <SelectItem value="BTech CSE">BTech CSE</SelectItem>
                  <SelectItem value="BTech FSD">BTech FSD</SelectItem>
                  <SelectItem value="BTech UI/UX">BTech UI/UX</SelectItem>
                  <SelectItem value="BTech AI/ML">BTech AI/ML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2025"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger id="semester">
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_semesters">All Semesters</SelectItem>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                  <SelectItem value="3">Semester 3</SelectItem>
                  <SelectItem value="4">Semester 4</SelectItem>
                  <SelectItem value="5">Semester 5</SelectItem>
                  <SelectItem value="6">Semester 6</SelectItem>
                  <SelectItem value="7">Semester 7</SelectItem>
                  <SelectItem value="8">Semester 8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Input
                id="session"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="e.g., 2024-25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Starting Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_months">All Months</SelectItem>
                  {availableMonths.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facultyCoordinator">Faculty Coordinator</Label>
              <Select value={facultyCoordinator} onValueChange={setFacultyCoordinator}>
                <SelectTrigger id="facultyCoordinator">
                  <SelectValue placeholder="All Coordinators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_coordinators">All Coordinators</SelectItem>
                  {availableCoordinators.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Dynamic columns filters */}
            {dynamicColumns.map((column) => (
              <div key={column.id} className="space-y-2">
                <Label htmlFor={`dynamic-${column.id}`}>{column.name}</Label>
                <Input
                  id={`dynamic-${column.id}`}
                  value={dynamicFilters[column.id] || ''}
                  onChange={(e) => handleDynamicFilterChange(column.id, e.target.value)}
                  placeholder={`Filter by ${column.name.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default InternshipFilters;
