
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Faculty } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { UsersRound, UserPlus, Trash2, Eye, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import TableWrapper from './project-table/TableWrapper';

interface AdminPanelProps {
  currentFaculty: Faculty;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentFaculty }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [showTeachers, setShowTeachers] = useState(false);
  const { toast } = useToast();
  
  // Edit faculty states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  useEffect(() => {
    if (showTeachers) {
      fetchFaculties();
    }
  }, [showTeachers]);

  const fetchFaculties = async () => {
    try {
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .order('created_at');

      if (error) {
        throw error;
      }

      if (data) {
        setFaculties(data);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch faculty data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !username || !password) {
      toast({
        title: 'Missing fields',
        description: 'Please fill out all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if username already exists
      const { data: existingFaculty, error: checkError } = await supabase
        .from('faculties')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingFaculty) {
        toast({
          title: 'Username exists',
          description: 'This username is already taken. Please choose another one.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Add new faculty
      const { error: insertError } = await supabase
        .from('faculties')
        .insert({
          name: name.trim(),
          username: username.trim(),
          password: password,
          role: 'teacher'
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: 'Faculty added',
        description: 'The new faculty member has been added successfully.',
      });

      // Reset form
      setName('');
      setUsername('');
      setPassword('');
      
      // Refresh faculty list if visible
      if (showTeachers) {
        fetchFaculties();
      }

    } catch (error) {
      console.error('Error adding faculty:', error);
      toast({
        title: 'Error',
        description: 'Failed to add faculty member. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (faculty: Faculty) => {
    setEditFaculty(faculty);
    setEditName(faculty.name);
    setEditUsername(faculty.username);
    setEditPassword(''); // Don't populate password for security reasons
    setEditModalOpen(true);
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFaculty || !editName || !editUsername) {
      toast({
        title: 'Missing fields',
        description: 'Please fill out all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if the updated username conflicts with another faculty
      if (editUsername !== editFaculty.username) {
        const { data: existingFaculty, error: checkError } = await supabase
          .from('faculties')
          .select('id')
          .eq('username', editUsername.trim())
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        if (existingFaculty && existingFaculty.id !== editFaculty.id) {
          toast({
            title: 'Username exists',
            description: 'This username is already taken. Please choose another one.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare update data
      const updateData: { name: string; username: string; password?: string } = {
        name: editName.trim(),
        username: editUsername.trim(),
      };
      
      // Only include password if it was changed
      if (editPassword) {
        updateData.password = editPassword;
      }

      // Update faculty
      const { error: updateError } = await supabase
        .from('faculties')
        .update(updateData)
        .eq('id', editFaculty.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Faculty updated',
        description: 'The faculty member has been updated successfully.',
      });

      // Close modal
      setEditModalOpen(false);
      
      // Refresh faculty list
      fetchFaculties();

    } catch (error) {
      console.error('Error updating faculty:', error);
      toast({
        title: 'Error',
        description: 'Failed to update faculty member. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    // Don't allow deletion of the current faculty
    if (id === currentFaculty.id) {
      toast({
        title: 'Cannot delete',
        description: 'You cannot delete your own account.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('faculties')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Faculty deleted',
        description: 'The faculty member has been deleted successfully.',
      });

      // Refresh faculty list
      fetchFaculties();

    } catch (error) {
      console.error('Error deleting faculty:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete faculty member. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-6 w-6" />
            Add New Teacher
          </CardTitle>
          <CardDescription>
            Create login credentials for a new faculty member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFaculty} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Faculty'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UsersRound className="mr-2 h-6 w-6" />
            Manage Teachers
          </CardTitle>
          <CardDescription>
            View and manage existing faculty members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="mb-4"
            onClick={() => setShowTeachers(!showTeachers)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showTeachers ? 'Hide Teachers List' : 'View Teachers List'}
          </Button>
          
          {showTeachers && (
            <div className="border rounded-md">
              <TableWrapper
                headerContent={
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                }
                bodyContent={
                  faculties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No faculty members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    faculties.map((faculty) => (
                      <TableRow key={faculty.id}>
                        <TableCell>{faculty.name}</TableCell>
                        <TableCell>{faculty.username}</TableCell>
                        <TableCell>
                          <span className={`capitalize ${faculty.role === 'admin' ? 'text-primary font-medium' : ''}`}>
                            {faculty.role || 'teacher'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(faculty)}
                              title="Edit faculty"
                            >
                              <Pencil className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteFaculty(faculty.id)}
                              disabled={faculty.id === currentFaculty.id}
                              title={faculty.id === currentFaculty.id ? "Cannot delete your own account" : "Delete faculty"}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Faculty Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Faculty</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateFaculty} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Dr. Jane Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="janedoe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">
                Password (leave blank to keep current password)
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Faculty'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
