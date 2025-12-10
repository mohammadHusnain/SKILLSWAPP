'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Particle Field Component using CSS
const ParticleField = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create CSS particles
    const particles = [];
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 bg-accent rounded-full opacity-40 particle-float';
      
      // Random positioning
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      
      // Random animation delay
      particle.style.animationDelay = Math.random() * 5 + 's';
      particle.style.animationDuration = (3 + Math.random() * 4) + 's';
      
      containerRef.current.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 20%, rgba(58, 134, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(91, 160, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(58, 134, 255, 0.05) 0%, transparent 50%)
        `
      }}
    />
  );
};

const Hero = () => {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonsRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    if (!heroRef.current) return;

    // GSAP timeline for entrance animations
    const tl = gsap.timeline();
    
    tl.fromTo(titleRef.current.children, 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out' }
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.4'
    )
    .fromTo(buttonsRef.current.children,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
      '-=0.2'
    )
    .fromTo(statsRef.current.children,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
      '-=0.2'
    );

    // Parallax effect on scroll
    gsap.to(heroRef.current.querySelector('.image-container'), {
      y: -100,
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });

  }, []);

  const scrollToAbout = () => {
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section ref={heroRef} id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary-dark" />
      
      {/* Particle field */}
      <ParticleField />

      {/* AI-Generated Collaboration Image */}
      <div className="image-container absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block" style={{ top: '60%' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative w-80 h-80 lg:w-[450px] lg:h-[450px] rounded-2xl overflow-hidden glass"
        >
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
            alt="Team collaboration and skill sharing"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
          
          {/* Floating elements overlay */}
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
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center lg:text-left">
        <div className="max-w-3xl lg:max-w-2xl">
          {/* Main headline */}
          <div ref={titleRef} className="mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight">
              <span className="text-text">Empower Your Skills.</span>
              <br />
              <span className="gradient-text">Connect. Collaborate.</span>
              <br />
              <span className="gradient-text">Grow.</span>
            </h1>
          </div>

          {/* Subtext */}
          <div ref={subtitleRef} className="mb-8">
            <p className="text-lg sm:text-xl lg:text-xl text-text-muted max-w-2xl mx-auto lg:mx-0">
              AI-powered skill-sharing platform connecting learners and experts globally. 
              Discover, teach, and master new skills in an innovative ecosystem.
            </p>
          </div>

          {/* CTA Buttons */}
          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-16">
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(58, 134, 255, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-accent hover:bg-accent-light text-white text-lg font-semibold rounded-lg transition-all duration-300 glow-hover"
              >
                Get Started
              </motion.button>
            </Link>
            
            <motion.button
              onClick={scrollToAbout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-accent text-accent hover:bg-accent hover:text-white text-lg font-semibold rounded-lg transition-all duration-300"
            >
              Learn More
            </motion.button>
          </div>

          {/* Stats */}
          <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto lg:mx-0">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">5K+</div>
              <div className="text-text-muted">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">100+</div>
              <div className="text-text-muted">Skills Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">10+</div>
              <div className="text-text-muted">Countries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-accent rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-accent rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
