
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ 
          backgroundImage: 'url("public/lovable-uploads/4dfe6fdf-a947-4949-8c4e-7043d7209ad0.png")',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-indigo-800/65 to-purple-900/70"></div>
      </div>
      
      {/* Header with Logo */}
      <header className="relative z-10 flex justify-between items-center p-4">
        <div className="flex items-center">
          <img 
            src="public/lovable-uploads/b33b909d-7859-40ab-a23f-ac4754a64fca.png" 
            alt="K.R. Mangalam University Logo" 
            className="w-8 h-8 md:w-10 md:h-10 mr-2 object-contain"
          />
          <span className="text-white text-sm md:text-base font-semibold">K.R. Mangalam University</span>
        </div>
        <Link to="/login">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Login
          </Button>
        </Link>
      </header>
      
      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-8 max-w-4xl text-center"
        >
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-blue-400 tracking-tight drop-shadow-lg">
            Project & Internship <br/>Management
          </h1>
          
          {/* Description */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto leading-relaxed"
          >
            Project & Internship Management Portal for faculty members to 
            efficiently track and manage student progress.
          </motion.p>
          
          {/* Get Started Button */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8"
          >
            <Link to="/login">
              <Button className="text-lg px-10 py-6 bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl rounded-md flex items-center gap-3">
                <GraduationCap size={24} />
                Get Started
                <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
