
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-cover bg-center relative flex items-center" 
         style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop")', 
                backgroundSize: 'cover' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 to-indigo-900/90 backdrop-blur-sm"></div>
      
      <div className="container px-4 py-16 mx-auto flex flex-col items-center justify-center min-h-screen text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 max-w-3xl"
        >
          <div className="flex justify-center mb-6">
            <img 
              src="public/lovable-uploads/b33b909d-7859-40ab-a23f-ac4754a64fca.png" 
              alt="K.R. Mangalam University Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
            Project & Internship Management Portal
          </h1>
          
          <p className="text-lg md:text-xl text-gray-100 drop-shadow">
            A comprehensive solution for faculty members to manage, track, and evaluate 
            student projects and internships at K.R. Mangalam University.
          </p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-12"
          >
            <Link to="/login">
              <Button className="text-lg px-8 py-6 bg-secondary hover:bg-secondary-dark transition-all shadow-lg hover:shadow-xl rounded-xl flex items-center gap-2">
                <GraduationCap size={24} />
                Faculty Login
              </Button>
            </Link>
          </motion.div>
          
          <div className="pt-10 text-sm text-gray-200">
            <p className="flex items-center justify-center gap-2">
              <BookOpen size={16} />
              Exclusively for faculty members of K.R. Mangalam University
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
