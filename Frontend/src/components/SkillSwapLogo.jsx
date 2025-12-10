'use client';

import { motion } from 'framer-motion';

const SkillSwapLogo = ({ className = "h-8 w-8", animated = true }) => {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={animated ? { scale: 1.05 } : {}}
      transition={{ duration: 0.2 }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3a86ff" />
            <stop offset="100%" stopColor="#5ba0ff" />
          </linearGradient>
          <linearGradient id="logoGradientSecondary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5ba0ff" />
            <stop offset="100%" stopColor="#3a86ff" />
          </linearGradient>
        </defs>
        
        {/* Main interconnected circles representing skill exchange */}
        <motion.circle
          cx="30"
          cy="30"
          r="12"
          fill="url(#logoGradient)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />
        
        <motion.circle
          cx="70"
          cy="30"
          r="12"
          fill="url(#logoGradientSecondary)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
        
        <motion.circle
          cx="50"
          cy="70"
          r="12"
          fill="url(#logoGradient)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />
        
        {/* Connection lines representing collaboration */}
        <motion.line
          x1="42"
          y1="30"
          x2="58"
          y2="30"
          stroke="url(#logoGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />
        
        <motion.line
          x1="30"
          y1="42"
          x2="50"
          y2="58"
          stroke="url(#logoGradientSecondary)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        
        <motion.line
          x1="70"
          y1="42"
          x2="50"
          y2="58"
          stroke="url(#logoGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        />
        
        {/* Central hub representing the platform */}
        <motion.circle
          cx="50"
          cy="50"
          r="6"
          fill="url(#logoGradientSecondary)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        />
        
        {/* Subtle glow effect */}
        <motion.circle
          cx="50"
          cy="50"
          r="25"
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="0.5"
          opacity="0.3"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 1, delay: 0.8 }}
        />
      </svg>
      
      {/* Glow effect overlay */}
      <div className="absolute inset-0 bg-accent/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

export default SkillSwapLogo;
