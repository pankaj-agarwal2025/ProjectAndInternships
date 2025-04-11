
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Faculty } from '@/lib/supabase';

const Home = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = React.useState<Faculty | null>(null);
  
  useEffect(() => {
    // Check if user is logged in
    const facultyData = sessionStorage.getItem('faculty');
    
    if (!facultyData) {
      navigate('/login');
      return;
    }
    
    setFaculty(JSON.parse(facultyData));
  }, [navigate]);
  
  const handleLogout = () => {
    sessionStorage.removeItem('faculty');
    navigate('/');
  };
  
  const portalCards = [
    {
      title: 'Project Portal',
      description: 'Manage student projects, track progress, upload documents, and view reports.',
      link: '/project-portal',
      color: 'bg-primary/10',
      borderColor: 'border-primary/20',
      textColor: 'text-primary',
      icon: '📊'
    },
    {
      title: 'Internship Portal',
      description: 'Manage student internships, track details, upload offer letters, and generate reports.',
      link: '/internship-portal',
      color: 'bg-secondary/10',
      borderColor: 'border-secondary/20',
      textColor: 'text-secondary',
      icon: '🏢',
      disabled: false
    }
  ];
  
  if (!faculty) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with navigation */}
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
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Welcome, {faculty.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Project-Internship Management Portal
            </p>
          </div>
          
          {/* Portal cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {portalCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`h-full shadow-md hover:shadow-lg transition-shadow border-2 ${card.borderColor} ${card.disabled ? 'opacity-70' : ''}`}>
                  <CardHeader className={`${card.color} p-6`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-2xl font-bold ${card.textColor}`}>{card.title}</CardTitle>
                      <span className="text-4xl">{card.icon}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardDescription className="text-base mt-2">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    {card.disabled ? (
                      <Button disabled className="w-full bg-gray-300">
                        Coming Soon
                      </Button>
                    ) : (
                      <Button className={`w-full ${index === 0 ? 'bg-primary hover:bg-primary-dark' : 'bg-secondary hover:bg-secondary-dark'}`} asChild>
                        <Link to={card.link}>Access Portal</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
