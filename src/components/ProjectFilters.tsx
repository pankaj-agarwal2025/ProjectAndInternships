import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

const ProjectFilters = ({ onFilterChange }: ProjectFiltersProps) => {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleGroupChange = (value: string) => {
    setFilters({ ...filters, group_no: value });
  };

  const handleDomainChange = (value: string) => {
    setFilters({ ...filters, domain: value });
  };

  const handleYearChange = (value: string) => {
    setFilters({ ...filters, year: value });
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
        <Label htmlFor="domain">Domain</Label>
        <Select onValueChange={handleDomainChange}>
          <SelectTrigger id="domain">
            <SelectValue placeholder="Select domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Web Development">Web Development</SelectItem>
            <SelectItem value="Mobile App Development">Mobile App Development</SelectItem>
            <SelectItem value="Data Science">Data Science</SelectItem>
            <SelectItem value="Machine Learning">Machine Learning</SelectItem>
            <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
            <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
            <SelectItem value="Others">Others</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="year">Year</Label>
        <Select onValueChange={handleYearChange}>
          <SelectTrigger id="year">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2021">2021</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProjectFilters;
