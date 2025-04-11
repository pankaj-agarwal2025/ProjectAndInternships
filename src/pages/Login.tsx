
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { X, Lock, User, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setErrorMessage('Please enter both username and password');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Directly query the faculties table to check credentials
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();
      
      if (error || !data) {
        console.error('Login error:', error);
        setErrorMessage('Invalid username or password. Please try again.');
        setErrorVisible(true);
        setTimeout(() => setErrorVisible(false), 5000);
        
        toast({
          title: 'Login Failed',
          description: 'Invalid username or password. Please try again.',
          variant: 'destructive',
        });
      } else {
        // Store faculty info in session storage
        sessionStorage.setItem('faculty', JSON.stringify(data));
        
        toast({
          title: 'Login Successful',
          description: `Welcome, ${data.name}!`,
        });
        
        navigate('/home');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An error occurred during login. Please try again.');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
      
      toast({
        title: 'Login Error',
        description: 'An error occurred during login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-indigo-900 p-4">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
           style={{ 
             backgroundImage: 'url("https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop")', 
             backgroundSize: 'cover',
             backgroundPosition: 'center'
           }}></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-white/20">
          <CardHeader className="space-y-4 pb-2">
            <div className="flex justify-center mb-2">
              <img 
                src="public/lovable-uploads/b33b909d-7859-40ab-a23f-ac4754a64fca.png" 
                alt="K.R. Mangalam University Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-primary">
              Faculty Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    <User size={18} />
                  </div>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    <Lock size={18} />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark transition-all" 
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 flex justify-center">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 w-full">
              Access restricted to faculty members of K.R. Mangalam University.
              <br />
              For assistance, please contact the IT department.
            </p>
          </CardFooter>
        </Card>
      </motion.div>
      
      {/* Error Toast */}
      {errorVisible && (
        <div className="fixed bottom-4 right-4 bg-destructive text-white p-4 rounded-md shadow-lg flex items-center gap-3 max-w-sm animate-fade-in">
          <AlertTriangle size={20} />
          <div className="flex-1">
            <h4 className="font-semibold">Login Failed</h4>
            <p className="text-sm">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorVisible(false)} className="text-white">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
