'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Brain, Users, Zap } from 'lucide-react';

const About = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.3, 1, 1, 0.3]);

  return (
    <section ref={sectionRef} id="about" className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-primary/30" />
      
      {/* Floating icons */}
      <motion.div
        style={{ y }}
        className="absolute top-20 left-10 opacity-20"
      >
        <Brain className="h-16 w-16 text-accent float" />
      </motion.div>
      
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
        className="absolute top-40 right-20 opacity-20"
      >
        <Users className="h-12 w-12 text-accent float" style={{ animationDelay: '2s' }} />
      </motion.div>
      
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [80, -80]) }}
        className="absolute bottom-20 left-1/4 opacity-20"
      >
        <Zap className="h-14 w-14 text-accent float" style={{ animationDelay: '4s' }} />
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left side - Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* AI-Generated Learning Image */}
            <div className="relative w-full h-96 lg:h-[500px] rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10">
              <Image
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
                alt="Online learning and mentorship"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-secondary/10" />
              
              {/* Overlay elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute top-4 right-4 w-8 h-8 border-2 border-accent rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute bottom-4 left-4 w-6 h-6 bg-accent rounded-full"
              />
            </div>
            
            {/* Floating stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 glow"
            >
              <div className="text-2xl font-bold gradient-text">AI-Powered</div>
              <div className="text-sm text-text-muted">Matching System</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 glow"
            >
              <div className="text-2xl font-bold gradient-text">Global</div>
              <div className="text-sm text-text-muted">Community</div>
            </motion.div>
          </motion.div>

          {/* Right side - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6 relative z-10 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
          >
            <div className="space-y-4">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-3xl lg:text-4xl font-bold text-text"
              >
                What is{' '}
                <span className="gradient-text">SkillSwap</span>?
              </motion.h2>
              
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                whileInView={{ opacity: 1, width: '60px' }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="h-1 bg-gradient-to-r from-accent to-accent-light rounded-full"
              />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg text-text leading-relaxed font-medium"
            >
              SkillSwap is a revolutionary AI-driven skill exchange platform that connects 
              learners and experts worldwide. Our intelligent matching system analyzes your 
              skills, interests, and learning goals to pair you with the perfect mentors 
              and students.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-lg text-text leading-relaxed font-medium"
            >
              Whether you want to master a new programming language, learn a musical instrument, 
              or share your expertise in design, SkillSwap creates meaningful connections 
              that foster growth and collaboration in an innovative ecosystem.
            </motion.p>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-text font-medium">AI-Powered Matching</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-text font-medium">Real-Time Collaboration</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-text font-medium">Secure Environment</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-text font-medium">Global Community</span>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
              className="pt-6"
            >
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-accent hover:bg-accent-light text-white font-semibold rounded-lg transition-colors duration-300 glow-hover"
                >
                  Join Our Community
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
