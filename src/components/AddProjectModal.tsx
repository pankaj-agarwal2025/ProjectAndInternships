
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState({
    group_no: '',
    title: '',
    domain: '',
    faculty_mentor: '',
    industry_mentor: '',
    session: '',
    year: '',
    semester: '',
    faculty_coordinator: '',
    project_category: '',
  });
  
  const [studentsData, setStudentsData] = useState([
    { roll_no: '', name: '', email: '', program: '' },
    { roll_no: '', name: '', email: '', program: '' },
  ]);
  
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleStudentChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedStudents = [...studentsData];
    updatedStudents[index] = { ...updatedStudents[index], [name]: value };
    setStudentsData(updatedStudents);
  };

  const addStudentField = () => {
    if (studentsData.length < 4) {
      setStudentsData([...studentsData, { roll_no: '', name: '', email: '', program: '' }]);
    }
  };

  const removeStudentField = (index: number) => {
    if (studentsData.length > 1) {
      const updatedStudents = [...studentsData];
      updatedStudents.splice(index, 1);
      setStudentsData(updatedStudents);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.group_no || !formData.title) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Insert project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert(formData)
        .select()
        .single();

      if (projectError) throw projectError;

      // Insert students
      const validStudents = studentsData.filter(student => student.roll_no && student.name);
      if (validStudents.length > 0) {
        const studentsWithGroupId = validStudents.map(student => ({
          ...student,
          group_id: projectData.id
        }));

        const { error: studentsError } = await supabase
          .from('students')
          .insert(studentsWithGroupId);

        if (studentsError) throw studentsError;
      }

      toast({
        title: 'Success',
        description: 'Project added successfully!'
      });
      
      // Dispatch event to refresh the project list
      window.dispatchEvent(new Event('refresh-projects-data'));
      
      // Close modal and reset form
      onClose();
      setFormData({
        group_no: '',
        title: '',
        domain: '',
        faculty_mentor: '',
        industry_mentor: '',
        session: '',
        year: '',
        semester: '',
        faculty_coordinator: '',
        project_category: '',
      });
      setStudentsData([
        { roll_no: '', name: '', email: '', program: '' },
        { roll_no: '', name: '', email: '', program: '' },
      ]);
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: 'Error',
        description: 'Failed to add project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="group_no" className="text-sm font-medium">Group No*</label>
                <Input
                  id="group_no"
                  name="group_no"
                  value={formData.group_no}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="project_category" className="text-sm font-medium">Project Category</label>
                <Select 
                  value={formData.project_category} 
                  onValueChange={(value) => handleSelectChange('project_category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Industry Based">Industry Based</SelectItem>
                    <SelectItem value="Research Based">Research Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="title" className="text-sm font-medium">Project Title*</label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="domain" className="text-sm font-medium">Domain</label>
                <Input
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="faculty_coordinator" className="text-sm font-medium">Faculty Coordinator</label>
                <Input
                  id="faculty_coordinator"
                  name="faculty_coordinator"
                  value={formData.faculty_coordinator}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="faculty_mentor" className="text-sm font-medium">Faculty Mentor</label>
                <Input
                  id="faculty_mentor"
                  name="faculty_mentor"
                  value={formData.faculty_mentor}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="industry_mentor" className="text-sm font-medium">Industry Mentor</label>
                <Input
                  id="industry_mentor"
                  name="industry_mentor"
                  value={formData.industry_mentor}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="session" className="text-sm font-medium">Session</label>
                <Input
                  id="session"
                  name="session"
                  value={formData.session}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="year" className="text-sm font-medium">Year</label>
                <Input
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="semester" className="text-sm font-medium">Semester</label>
                <Input
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Student Details</h3>
              
              {studentsData.map((student, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b last:border-b-0">
                  <div className="space-y-2">
                    <label htmlFor={`student_roll_${index}`} className="text-sm font-medium">Roll No*</label>
                    <Input
                      id={`student_roll_${index}`}
                      name="roll_no"
                      value={student.roll_no}
                      onChange={(e) => handleStudentChange(index, e)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor={`student_name_${index}`} className="text-sm font-medium">Name*</label>
                    <Input
                      id={`student_name_${index}`}
                      name="name"
                      value={student.name}
                      onChange={(e) => handleStudentChange(index, e)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor={`student_email_${index}`} className="text-sm font-medium">Email</label>
                    <Input
                      id={`student_email_${index}`}
                      name="email"
                      type="email"
                      value={student.email}
                      onChange={(e) => handleStudentChange(index, e)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor={`student_program_${index}`} className="text-sm font-medium">Program</label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`student_program_${index}`}
                        name="program"
                        value={student.program}
                        onChange={(e) => handleStudentChange(index, e)}
                      />
                      {studentsData.length > 1 && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon"
                          onClick={() => removeStudentField(index)}
                        >
                          -
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {studentsData.length < 4 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addStudentField}
                  className="mt-2"
                >
                  Add Student
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Adding...' : 'Add Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectModal;
