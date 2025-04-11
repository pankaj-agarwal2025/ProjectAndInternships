
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
  Briefcase
} from 'lucide-react';

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
          <div className="flex items-center gap-2">
            <img 
              src="/public/lovable-uploads/b33b909d-7859-40ab-a23f-ac4754a64fca.png" 
              alt="K.R. Mangalam University Logo" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-xl font-bold text-primary hidden sm:block">K.R. Mangalam University</h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <Button 
                key={item.path}
                variant={location.pathname === item.path ? "default" : "ghost"} 
                asChild
                className="flex items-center gap-1"
              >
                <Link to={item.path}>
                  {item.icon}
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-gray-600 dark:text-gray-300 mr-2">
              <User size={18} />
              <span>{faculty.name}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Logout</span>
            </Button>
            
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
          <div className="md:hidden mt-3 pb-2 space-y-2 border-t pt-2">
            <div className="flex items-center mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
              <User size={16} className="mr-2 text-gray-500" />
              <span className="text-sm font-medium">{faculty.name}</span>
            </div>
            
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
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
