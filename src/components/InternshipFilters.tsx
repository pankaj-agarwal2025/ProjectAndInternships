
import React, { useState, useEffect } from 'react';
import { Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInternshipDynamicColumns } from '@/lib/supabase';

// Programs and Faculty Coordinator options
const programOptions = [
  'BSc CS', 'BSc DS', 'BSc Cyber', 'BCA', 'BCA AI/DS', 
  'BTech CSE', 'BTech FSD', 'BTech UI/UX', 'BTech AI/ML'
];

const facultyCoordinatorOptions = [
  'Dr. Pankaj', 'Dr. Anshu', 'Dr. Meenu', 'Dr. Swati'
];

// Month options
const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
];

interface InternshipFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

const InternshipFilters: React.FC<InternshipFiltersProps> = ({ onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({
    roll_no: '',
    name: '',
    program: '',
    domain: '',
    faculty_coordinator: '',
    organization_name: '',
    year: '',
    semester: '',
    session: '',
    starting_month: ''
  });
  const [dynamicColumns, setDynamicColumns] = useState<any[]>([]);
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDynamicColumns();
  }, []);

  const fetchDynamicColumns = async () => {
    const columns = await getInternshipDynamicColumns();
    setDynamicColumns(columns);

    // Initialize dynamic filters
    const initialDynamicFilters: Record<string, string> = {};
    columns.forEach(column => {
      initialDynamicFilters[column.id] = '';
    });
    setDynamicFilters(initialDynamicFilters);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDynamicFilterChange = (columnId: string, value: string) => {
    setDynamicFilters(prev => ({ ...prev, [columnId]: value }));
  };

  const applyFilters = () => {
    // Combine regular filters and dynamic filters
    const combinedFilters = { ...filters };
    
    // Remove empty filters
    Object.keys(combinedFilters).forEach(key => {
      if (!combinedFilters[key]) {
        delete combinedFilters[key];
      }
    });
    
    onFilterChange(combinedFilters);
  };

  const resetFilters = () => {
    // Reset regular filters
    const resetRegularFilters: Record<string, string> = {};
    Object.keys(filters).forEach(key => {
      resetRegularFilters[key] = '';
    });
    
    // Reset dynamic filters
    const resetDynamicFilters: Record<string, string> = {};
    dynamicColumns.forEach(column => {
      resetDynamicFilters[column.id] = '';
    });
    
    setFilters(resetRegularFilters);
    setDynamicFilters(resetDynamicFilters);
    onFilterChange({});
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </h3>
          <Button 
            variant="ghost" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        
        {isExpanded ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rollNo">Roll No</Label>
                <Input
                  id="rollNo"
                  placeholder="Filter by roll number"
                  value={filters.roll_no}
                  onChange={(e) => handleFilterChange('roll_no', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Filter by name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Select 
                  value={filters.program} 
                  onValueChange={(value) => handleFilterChange('program', value)}
                >
                  <SelectTrigger id="program">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="Filter by domain"
                  value={filters.domain}
                  onChange={(e) => handleFilterChange('domain', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facultyCoordinator">Faculty Coordinator</Label>
                <Select 
                  value={filters.faculty_coordinator} 
                  onValueChange={(value) => handleFilterChange('faculty_coordinator', value)}
                >
                  <SelectTrigger id="facultyCoordinator">
                    <SelectValue placeholder="Select faculty coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Coordinators</SelectItem>
                    {facultyCoordinatorOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  placeholder="Filter by organization"
                  value={filters.organization_name}
                  onChange={(e) => handleFilterChange('organization_name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  placeholder="Filter by year"
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  placeholder="Filter by semester"
                  value={filters.semester}
                  onChange={(e) => handleFilterChange('semester', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session">Session</Label>
                <Input
                  id="session"
                  placeholder="Filter by session"
                  value={filters.session}
                  onChange={(e) => handleFilterChange('session', e.target.value)}
                />
              </div>
              
              {/* Month filter for starting date */}
              <div className="space-y-2">
                <Label htmlFor="starting-month" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Starting Month
                </Label>
                <Select
                  value={filters.starting_month}
                  onValueChange={(value) => handleFilterChange('starting_month', value)}
                >
                  <SelectTrigger id="starting-month">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Dynamic column filters */}
              {dynamicColumns.map(column => (
                <div key={column.id} className="space-y-2">
                  <Label htmlFor={`dynamic-${column.id}`}>{column.name}</Label>
                  <Input
                    id={`dynamic-${column.id}`}
                    placeholder={`Filter by ${column.name.toLowerCase()}`}
                    value={dynamicFilters[column.id] || ''}
                    onChange={(e) => handleDynamicFilterChange(column.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Input
              className="w-full sm:w-auto sm:flex-1"
              placeholder="Search by name, roll no, or any field..."
              value={filters.name}
              onChange={(e) => {
                handleFilterChange('name', e.target.value);
                applyFilters();
              }}
            />
            
            <Select 
              value={filters.faculty_coordinator} 
              onValueChange={(value) => {
                handleFilterChange('faculty_coordinator', value);
                applyFilters();
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Faculty Coordinator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Coordinators</SelectItem>
                {facultyCoordinatorOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Month filter for collapsed view */}
            <Select
              value={filters.starting_month}
              onValueChange={(value) => {
                handleFilterChange('starting_month', value);
                applyFilters();
              }}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Starting Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={resetFilters} className="shrink-0">
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InternshipFilters;
