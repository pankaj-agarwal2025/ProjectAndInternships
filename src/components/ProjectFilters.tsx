
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { X, Filter, Plus } from 'lucide-react';

interface ProjectFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<Record<string, any>>({
    group_no: '',
    year: '',
    semester: '',
    session: '',
    faculty_coordinator: '',
    program: '',
    searchTerm: '',
  });

  const [additionalFilters, setAdditionalFilters] = useState<string[]>([]);
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  const handleFilterChange = (
    name: string,
    value: string | number | boolean
  ) => {
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('searchTerm', e.target.value);
  };

  const handleReset = () => {
    const resetFilters = {
      group_no: '',
      year: '',
      semester: '',
      session: '',
      faculty_coordinator: '',
      program: '',
      searchTerm: '',
    };
    
    additionalFilters.forEach(filter => {
      resetFilters[filter] = '';
    });
    
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const handleAddFilter = () => {
    if (newFilterName.trim() && !additionalFilters.includes(newFilterName.trim())) {
      const filterId = newFilterName.trim().toLowerCase().replace(/\s+/g, '_');
      setAdditionalFilters([...additionalFilters, filterId]);
      setFilters({ ...filters, [filterId]: '' });
      setNewFilterName('');
      setShowAddFilter(false);
    }
  };

  const handleRemoveFilter = (filterId: string) => {
    const updatedAdditionalFilters = additionalFilters.filter(id => id !== filterId);
    const updatedFilters = { ...filters };
    delete updatedFilters[filterId];
    
    setAdditionalFilters(updatedAdditionalFilters);
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const formatFilterName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <Input
            id="searchTerm"
            type="text"
            placeholder="Search by title or group no..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="group_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Group No
          </label>
          <Input
            id="group_no"
            type="text"
            placeholder="Group No"
            value={filters.group_no}
            onChange={(e) => handleFilterChange('group_no', e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Year
          </label>
          <Input
            id="year"
            type="text"
            placeholder="Year"
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Semester
          </label>
          <Select
            value={filters.semester}
            onValueChange={(value) => handleFilterChange('semester', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
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
        
        <div className="w-full md:w-auto">
          <label htmlFor="session" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Session
          </label>
          <Input
            id="session"
            type="text"
            placeholder="Session"
            value={filters.session}
            onChange={(e) => handleFilterChange('session', e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="faculty_coordinator" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Faculty Coordinator
          </label>
          <Input
            id="faculty_coordinator"
            type="text"
            placeholder="Faculty Coordinator"
            value={filters.faculty_coordinator}
            onChange={(e) => handleFilterChange('faculty_coordinator', e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="program" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Program
          </label>
          <Input
            id="program"
            type="text"
            placeholder="Program"
            value={filters.program}
            onChange={(e) => handleFilterChange('program', e.target.value)}
          />
        </div>
        
        {additionalFilters.map(filterId => (
          <div key={filterId} className="w-full md:w-auto relative">
            <label htmlFor={filterId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {formatFilterName(filterId)}
            </label>
            <div className="flex">
              <Input
                id={filterId}
                type="text"
                placeholder={formatFilterName(filterId)}
                value={filters[filterId] || ''}
                onChange={(e) => handleFilterChange(filterId, e.target.value)}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-6"
                onClick={() => handleRemoveFilter(filterId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-wrap justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
          {showAddFilter ? (
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Filter name"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                className="w-40"
              />
              <Button size="sm" onClick={handleAddFilter}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddFilter(false)}>Cancel</Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddFilter(true)}
              className="flex items-center"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Filter
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="flex items-center"
          >
            <X className="mr-1 h-4 w-4" />
            Reset Filters
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onFilterChange(filters)}
            className="flex items-center"
          >
            <Filter className="mr-1 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectFilters;
