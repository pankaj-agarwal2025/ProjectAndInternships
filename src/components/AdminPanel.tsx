
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, UserPlus, Loader2, Trash2, Users } from 'lucide-react';
import { Faculty } from '@/lib/supabase';

interface AdminPanelProps {
  currentFaculty: Faculty;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentFaculty }) => {
  const [teachers, setTeachers] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showTeachersList, setShowTeachersList] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    username: '',
    password: '',
    name: '',
    role: 'teacher'
  });
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Faculty | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (showTeachersList) {
      fetchTeachers();
    }
  }, [showTeachersList]);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch teachers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    // Validate input
    if (!newTeacher.username || !newTeacher.password || !newTeacher.name) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingTeacher(true);
    try {
      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('faculties')
        .select('id')
        .eq('username', newTeacher.username)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        toast({
          title: 'Username Already Exists',
          description: 'Please choose a different username.',
          variant: 'destructive',
        });
        setIsAddingTeacher(false);
        return;
      }

      // Add new teacher
      const { error } = await supabase
        .from('faculties')
        .insert(newTeacher);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'New teacher added successfully.',
      });
      
      // Reset form and close modal
      setNewTeacher({
        username: '',
        password: '',
        name: '',
        role: 'teacher'
      });
      setShowAddTeacherModal(false);
      
      // Refresh teacher list if it's showing
      if (showTeachersList) {
        fetchTeachers();
      }
    } catch (error) {
      console.error('Error adding new teacher:', error);
      toast({
        title: 'Error',
        description: 'Failed to add new teacher. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingTeacher(false);
    }
  };

  const handleDeleteTeacher = (teacher: Faculty) => {
    setTeacherToDelete(teacher);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    
    try {
      const { error } = await supabase
        .from('faculties')
        .delete()
        .eq('id', teacherToDelete.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: `Teacher "${teacherToDelete.name}" has been deleted.`,
      });
      
      // Refresh teacher list
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete teacher. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTeacherToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const filteredTeachers = teachers.filter(
    teacher => 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if current faculty is admin
  if (currentFaculty?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Access Denied</h2>
        <p>You do not have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowTeachersList(!showTeachersList)}
          >
            <Users className="mr-2 h-4 w-4" />
            {showTeachersList ? 'Hide Teachers' : 'View Teachers'}
          </Button>
          <Button onClick={() => setShowAddTeacherModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Teacher
          </Button>
        </div>
      </div>

      {showTeachersList && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          <h3 className="text-lg font-medium">Manage Teachers</h3>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search teachers..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No teachers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <TableCell>{teacher.name}</TableCell>
                        <TableCell>{teacher.username}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            teacher.role === 'admin' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {teacher.role || 'teacher'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteTeacher(teacher)}
                            disabled={teacher.id === currentFaculty.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Add Teacher Modal */}
      <Dialog open={showAddTeacherModal} onOpenChange={setShowAddTeacherModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>
              Enter the details for the new teacher account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name
              </Label>
              <Input 
                id="name" 
                className="col-span-3"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input 
                id="username" 
                className="col-span-3"
                value={newTeacher.username}
                onChange={(e) => setNewTeacher(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input 
                id="password" 
                type="password"
                className="col-span-3"
                value={newTeacher.password}
                onChange={(e) => setNewTeacher(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTeacherModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTeacher} disabled={isAddingTeacher}>
              {isAddingTeacher ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : 'Add Teacher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Teacher Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the teacher account for "{teacherToDelete?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTeacher}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;
