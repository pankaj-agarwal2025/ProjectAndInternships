
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container px-4 py-16 mx-auto flex flex-col items-center justify-center min-h-screen text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-primary">
            Project-Internship Management Portal
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
            A comprehensive solution for faculty members to manage, track, and evaluate 
            student projects and internships at K.R. Mangalam University.
          </p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8"
          >
            <Link to="/login">
              <Button className="text-lg px-8 py-6 bg-secondary hover:bg-secondary-dark">
                Login
              </Button>
            </Link>
          </motion.div>
          
          <div className="pt-10 text-sm text-gray-500 dark:text-gray-400">
            <p>Exclusively for faculty members of K.R. Mangalam University</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
