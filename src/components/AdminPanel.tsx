
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
import { UsersRound, UserPlus, Trash2, Eye } from 'lucide-react';

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculties.length === 0 ? (
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFaculty(faculty.id)}
                            disabled={faculty.id === currentFaculty.id}
                            title={faculty.id === currentFaculty.id ? "Cannot delete your own account" : "Delete faculty"}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
