
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Faculty } from '@/lib/supabase';

interface NavbarProps {
  faculty: Faculty;
}

const Navbar: React.FC<NavbarProps> = ({ faculty }) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    sessionStorage.removeItem('faculty');
    navigate('/');
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary">K.R. Mangalam University</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/home">Home</Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
