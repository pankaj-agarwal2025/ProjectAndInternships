
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Briefcase, LogOut, User, GraduationCap, Menu } from 'lucide-react';
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
      description: [
        'Organize students into project groups',
        'Track project progress and submissions',
        'Evaluate project phases and provide feedback',
        'Export project data for reporting',
      ],
      link: '/project-portal',
      color: 'bg-primary/10',
      borderColor: 'border-primary/20',
      textColor: 'text-primary',
      icon: <BookOpen className="h-8 w-8" />,
      hoverEffect: 'hover:shadow-[0_0_15px_rgba(0,96,170,0.3)]',
      buttonClass: 'bg-primary hover:bg-primary-dark'
    },
    {
      title: 'Internship Portal',
      description: ['Track internship placements and organizations',
        'Manage internship documentation',
        'Monitor internship duration and positions',
        'Generate reports and analytics'],
      link: '/internship-portal',
      color: 'bg-secondary/10',
      borderColor: 'border-secondary/20',
      textColor: 'text-secondary',
      icon: <Briefcase className="h-8 w-8" />,
      hoverEffect: 'hover:shadow-[0_0_15px_rgba(227,30,36,0.3)]',
      buttonClass: 'bg-secondary hover:bg-secondary-dark',
      disabled: false
    }
  ];

  if (!faculty) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-md border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src="public/lovable-uploads/b33b909d-7859-40ab-a23f-ac4754a64fca.png"
              alt="K.R. Mangalam University Logo"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-xl font-bold text-primary">K.R. Mangalam University</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <User size={18} />
              <span className="hidden md:inline">{faculty.name}</span>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut size={16} />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-12 flex-grow">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2"
            >
              Welcome, {faculty.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-600 dark:text-gray-300"
            >
              Project-Internship Management Portal
            </motion.p>
          </div>

          {/* Portal cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {portalCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.2 }}
              >
                <Card className={`h-full shadow-md ${card.hoverEffect} transition-all duration-300 border-2 ${card.borderColor} ${card.disabled ? 'opacity-70' : ''}`}>
                  <CardHeader className={`${card.color} p-6`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-2xl font-bold ${card.textColor}`}>{card.title}</CardTitle>
                      <span className={card.textColor}>{card.icon}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardDescription className="text-base mt-2 space-y-1 text-muted-foreground">
                      {Array.isArray(card.description) ? (
                        card.description.map((line, idx) => (
                          <p key={idx}>{line}</p>
                        ))
                      ) : (
                        <p>{card.description}</p>
                      )}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    {card.disabled ? (
                      <Button disabled className="w-full bg-gray-300">
                        Coming Soon
                      </Button>
                    ) : (
                      <Button className={`w-full ${card.buttonClass} shadow-sm hover:shadow-md transition-all`} asChild>
                        <Link to={card.link} className="flex items-center justify-center gap-2">
                          {index === 0 ? <BookOpen size={18} /> : <Briefcase size={18} />}
                          Access Portal
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      {/* <footer className="bg-white dark:bg-gray-800 border-t py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} K.R. Mangalam University. All rights reserved.</p>
        </div>
      </footer> */}
    </div>
  );
};

export default Home;
