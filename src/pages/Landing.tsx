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
          backgroundImage: 'url("/lovable-uploads/2b5366a7-4406-492a-bb07-04dd88fe5ea0.png")',
          backgroundSize: 'cover'
        }}
      />
      <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>

      {/* Header with Logo */}
      <header className="relative z-10 flex justify-between items-center p-4">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/b33b909d-7859-40ab-a23f-ac4754a64fca.png" 
            alt="K.R. Mangalam University Logo" 
            className="w-10 h-10 md:w-12 md:h-12 mr-2 object-contain"
          />
          <span className="text-white text-base md:text-lg font-bold">K.R. Mangalam University</span>
        </div>
        <Link to="/login">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
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
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-lg">
            Project & Internship <br/>Management
          </h1>
          
          {/* Description */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed"
          >
            A comprehensive portal for faculty members to efficiently track and manage student projects and internships.
          </motion.p>
          
          {/* Get Started Button */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-10"
          >
            <Link to="/login">
              <Button className="text-lg px-10 py-6 bg-blue-500 hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl rounded-full flex items-center gap-3 group">
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
