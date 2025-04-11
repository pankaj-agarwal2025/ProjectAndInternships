
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=2274&auto=format&fit=crop")',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-indigo-800/85 to-purple-900/90"></div>
      </div>
      
      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-10 max-w-4xl text-center"
        >
          {/* Logo and University Name */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src="public/lovable-uploads/b33b909d-7859-40ab-a23f-ac4754a64fca.png" 
              alt="K.R. Mangalam University Logo" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-lg"
            />
            <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-white/90">K.R. Mangalam University</h2>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-xl">
            Project & Internship <span className="text-yellow-300 italic">Management Portal</span>
          </h1>
          
          {/* Description */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto leading-relaxed"
          >
            A comprehensive platform for faculty members to manage, track, and evaluate 
            student projects and internships in one streamlined interface.
          </motion.p>
          
          {/* Login Button */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12"
          >
            <Link to="/login">
              <Button className="text-lg px-10 py-7 bg-secondary hover:bg-secondary/90 transition-all shadow-lg hover:shadow-xl rounded-xl flex items-center gap-3 group">
                <GraduationCap size={26} />
                Faculty Login
                <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
          
          {/* Footer Text */}
          <div className="pt-8 text-base text-gray-200/90">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              className="flex items-center justify-center gap-2"
            >
              <BookOpen size={18} />
              Exclusively for faculty members of K.R. Mangalam University
            </motion.p>
          </div>
        </motion.div>
        
        {/* Bottom Accent */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-red-500 to-primary"></div>
      </div>
      
      {/* Animated Particles */}
      <div className="absolute inset-0 z-0 opacity-30">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Landing;
