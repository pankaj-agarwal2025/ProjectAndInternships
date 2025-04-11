
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Faculty } from '@/lib/supabase';
import { 
  Home, 
  LogOut, 
  User, 
  Menu,
  BookOpen,
  Briefcase,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  faculty: Faculty;
}

const Navbar: React.FC<NavbarProps> = ({ faculty }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  const handleLogout = () => {
    sessionStorage.removeItem('faculty');
    navigate('/');
  };
  
  const navItems = [
    { name: 'Home', path: '/home', icon: <Home size={18} /> },
    { name: 'Project Portal', path: '/project-portal', icon: <BookOpen size={18} /> },
    { name: 'Internship Portal', path: '/internship-portal', icon: <Briefcase size={18} /> },
  ];
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        {/* Desktop Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/home" className="flex items-center gap-2">
              <motion.img 
                whileHover={{ rotate: 5 }}
                src="/public/lovable-uploads/b33b909d-7859-40ab-a23f-ac4754a64fca.png" 
                alt="K.R. Mangalam University Logo" 
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-xl font-bold text-primary hidden sm:block">K.R. Mangalam University</h1>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <Button 
                key={item.path}
                variant={location.pathname === item.path ? "default" : "ghost"} 
                asChild
                className={`flex items-center gap-1 ${location.pathname === item.path ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
              >
                <Link to={item.path}>
                  {item.icon}
                  <span className="ml-1">{item.name}</span>
                </Link>
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100">
                  <Avatar className="h-8 w-8 bg-primary/10">
                    <AvatarFallback className="text-primary font-medium">
                      {faculty.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start text-sm">
                    <span className="font-medium">{faculty.name}</span>
                    <span className="text-xs text-muted-foreground">Faculty</span>
                  </div>
                  <ChevronDown size={16} className="text-gray-500 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2 border-b md:hidden">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {faculty.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{faculty.name}</span>
                    <span className="text-xs text-muted-foreground">Faculty</span>
                  </div>
                </div>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut size={16} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              <Menu size={20} />
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mt-3 pb-2 space-y-2 border-t pt-2"
          >
            {navItems.map(item => (
              <Button 
                key={item.path}
                variant={location.pathname === item.path ? "default" : "ghost"} 
                asChild
                className="w-full justify-start text-left"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to={item.path} className="flex items-center gap-2">
                  {item.icon}
                  {item.name}
                </Link>
              </Button>
            ))}
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
