'use client';

import { motion } from 'framer-motion';
import { 
  Zap, 
  MessageCircle, 
  Users, 
  Award, 
  ShieldCheck, 
  Cloud 
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Zap,
      title: 'AI Matchmaking',
      description: 'Our intelligent algorithm connects learners and mentors based on skills, interests, and learning goals for optimal pairing.',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: MessageCircle,
      title: 'Secure Messaging',
      description: 'Built-in chat system with end-to-end encryption ensures safe and private communication between users.',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Real-Time Collaboration',
      description: 'Interactive whiteboard, screen sharing, and live coding sessions for seamless learning experiences.',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: Award,
      title: 'Gamified Progress',
      description: 'Earn badges, complete challenges, and track your learning journey with our engaging progress system.',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: ShieldCheck,
      title: 'Verified Profiles',
      description: 'Comprehensive verification system ensures authentic skills and creates a trusted learning environment.',
      color: 'from-red-400 to-rose-500'
    },
    {
      icon: Cloud,
      title: 'Cloud Synced',
      description: 'Access your learning materials, progress, and connections from anywhere with our cloud-based platform.',
      color: 'from-indigo-400 to-blue-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  return (
    <section id="features" className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-secondary/30" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent-light/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-text mb-4">
            Why Choose{' '}
            <span className="gradient-text">SkillSwap</span>?
          </h2>
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: '80px' }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="h-1 bg-gradient-to-r from-accent to-accent-light rounded-full mx-auto"
          />
          <p className="text-lg text-text-muted mt-6 max-w-2xl mx-auto">
            Discover the features that make SkillSwap the ultimate platform for skill exchange and collaborative learning.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ 
                  y: -10,
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
              >
                <div className="relative h-full p-6 glass rounded-2xl border border-white/10 hover:border-accent/50 transition-all duration-300 overflow-hidden">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-accent/20 to-accent-light/20 flex items-center justify-center group-hover:glow transition-all duration-300"
                    >
                      <IconComponent className="h-8 w-8 text-accent" />
                    </motion.div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-text mb-3 group-hover:text-accent transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-text-muted leading-relaxed group-hover:text-text transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Hover border effect */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-accent/30 transition-all duration-300" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-accent to-accent-light text-white font-semibold rounded-lg transition-all duration-300 glow-hover"
          >
            Explore All Features
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
