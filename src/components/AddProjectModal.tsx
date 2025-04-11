
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addProject } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { X, Plus } from 'lucide-react';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Programs list
const programs = [
  'BSc CS', 'BSc DS', 'BSc Cyber', 'BCA', 'BCA AI/DS',
  'BTech CSE', 'BTech FSD', 'BTech UI/UX', 'BTech AI/ML'
];

// Faculty coordinators list
const facultyCoordinators = [
  'dr.pankaj', 'dr.anshu', 'dr.meenu', 'dr.swati'
];

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose }) => {
  const [minStudents, setMinStudents] = useState(1);
  const [maxStudents, setMaxStudents] = useState(4);
  const [students, setStudents] = useState([
    { roll_no: '', name: '', email: '', program: '' }
  ]);
  
  // Project fields
  const [groupNo, setGroupNo] = useState('');
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [facultyMentor, setFacultyMentor] = useState('');
  const [industryMentor, setIndustryMentor] = useState('');
  const [session, setSession] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [facultyCoordinator, setFacultyCoordinator] = useState('');
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleStudentChange = (index: number, field: string, value: string) => {
    const updatedStudents = [...students];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setStudents(updatedStudents);
  };
  
  const handleAddStudent = () => {
    if (students.length < maxStudents) {
      setStudents([...students, { roll_no: '', name: '', email: '', program: '' }]);
    }
  };
  
  const handleRemoveStudent = (index: number) => {
    if (students.length > minStudents) {
      const updatedStudents = [...students];
      updatedStudents.splice(index, 1);
      setStudents(updatedStudents);
    }
  };
  
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Validate project fields
    if (!groupNo || !title || !domain || !session || !year || !semester || !facultyCoordinator) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill out all required project fields.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate student fields
    const isStudentDataComplete = students.every(
      student => student.roll_no && student.name && student.email && student.program
    );
    
    if (!isStudentDataComplete) {
      toast({
        title: 'Missing Student Data',
        description: 'Please fill out all student fields for each student.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const projectData = {
        group_no: groupNo,
        title,
        domain,
        faculty_mentor: facultyMentor,
        industry_mentor: industryMentor,
        session,
        year,
        semester,
        faculty_coordinator: facultyCoordinator,
      };
      
      const result = await addProject(projectData, students);
      
      if (result) {
        toast({
          title: 'Project Added',
          description: 'The project and students have been added successfully.',
        });
        
        // Reset form and close modal
        resetForm();
        onClose();
      } else {
        throw new Error('Failed to add project');
      }
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: 'Error',
        description: 'Failed to add the project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setStep(1);
    setMinStudents(1);
    setMaxStudents(4);
    setStudents([{ roll_no: '', name: '', email: '', program: '' }]);
    setGroupNo('');
    setTitle('');
    setDomain('');
    setFacultyMentor('');
    setIndustryMentor('');
    setSession('');
    setYear('');
    setSemester('');
    setFacultyCoordinator('');
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-students">Minimum Students per Group</Label>
                <Input
                  id="min-students"
                  type="number"
                  min={1}
                  max={10}
                  value={minStudents}
                  onChange={(e) => setMinStudents(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-students">Maximum Students per Group</Label>
                <Input
                  id="max-students"
                  type="number"
                  min={minStudents}
                  max={10}
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(Number(e.target.value))}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div className="space-y-2">
                <Label htmlFor="group-no">Group No</Label>
                <Input
                  id="group-no"
                  value={groupNo}
                  onChange={(e) => setGroupNo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty-mentor">Faculty Mentor</Label>
                <Input
                  id="faculty-mentor"
                  value={facultyMentor}
                  onChange={(e) => setFacultyMentor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry-mentor">Industry Mentor</Label>
                <Input
                  id="industry-mentor"
                  value={industryMentor}
                  onChange={(e) => setIndustryMentor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session">Session</Label>
                <Input
                  id="session"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty-coordinator">Faculty Coordinator</Label>
                <Select value={facultyCoordinator} onValueChange={setFacultyCoordinator}>
                  <SelectTrigger id="faculty-coordinator">
                    <SelectValue placeholder="Select coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultyCoordinators.map((fc) => (
                      <SelectItem key={fc} value={fc}>{fc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep(2)}>
                Next: Add Students
              </Button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-6">
              {students.map((student, index) => (
                <div key={index} className="p-4 border rounded-md space-y-4 relative">
                  <div className="absolute right-2 top-2">
                    {students.length > minStudents && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => handleRemoveStudent(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <h3 className="font-medium">Student {index + 1}</h3>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`roll-no-${index}`}>Roll No</Label>
                      <Input
                        id={`roll-no-${index}`}
                        value={student.roll_no}
                        onChange={(e) => handleStudentChange(index, 'roll_no', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`name-${index}`}>Name</Label>
                      <Input
                        id={`name-${index}`}
                        value={student.name}
                        onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`email-${index}`}>Email</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={student.email}
                        onChange={(e) => handleStudentChange(index, 'email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`program-${index}`}>Program</Label>
                      <Select 
                        value={student.program} 
                        onValueChange={(value) => handleStudentChange(index, 'program', value)}
                      >
                        <SelectTrigger id={`program-${index}`}>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((program) => (
                            <SelectItem key={program} value={program}>{program}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              
              {students.length < maxStudents && (
                <Button 
                  variant="outline" 
                  onClick={handleAddStudent}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              )}
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Project'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectModal;
