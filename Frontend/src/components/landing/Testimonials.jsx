'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      content: 'SkillSwap transformed my learning journey. I went from beginner to confident developer in just 6 months through their AI-matched mentors.',
      rating: 5
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Designer',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      content: 'The real-time collaboration features are incredible. I can teach design principles while students practice live - it\'s like magic!',
      rating: 5
    },
    {
      name: 'Emily Johnson',
      role: 'Data Scientist',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      content: 'As a mentor, I love how SkillSwap connects me with passionate learners. The platform makes teaching rewarding and efficient.',
      rating: 5
    },
    {
      name: 'David Kim',
      role: 'Musician',
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      content: 'Learning guitar through SkillSwap was amazing. My mentor was perfectly matched to my learning style and goals.',
      rating: 5
    }
  ];

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToTestimonial = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Spring animation for smooth transitions
  const slideProps = useSpring({
    transform: `translateX(-${currentIndex * 100}%)`,
    config: { tension: 300, friction: 30 }
  });

  return (
    <section id="testimonials" className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-primary/50" />
      
      {/* Floating quote marks */}
      <div className="absolute top-20 left-20 opacity-10">
        <Quote className="h-32 w-32 text-accent" />
      </div>
      <div className="absolute bottom-20 right-20 opacity-10 rotate-180">
        <Quote className="h-32 w-32 text-accent" />
      </div>

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
            What Our{' '}
            <span className="gradient-text">Users Say</span>
          </h2>
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: '80px' }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="h-1 bg-gradient-to-r from-accent to-accent-light rounded-full mx-auto"
          />
        </motion.div>

        {/* Testimonials carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main testimonial */}
          <div className="relative overflow-hidden rounded-2xl glass p-8 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                {/* Quote icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent/20 to-accent-light/20 flex items-center justify-center"
                >
                  <Quote className="h-8 w-8 text-accent" />
                </motion.div>

                {/* Content */}
                <blockquote className="text-lg lg:text-xl text-text-muted mb-8 leading-relaxed italic">
                  "{testimonials[currentIndex].content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-center space-x-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent/30">
                    <img
                      src={testimonials[currentIndex].avatar}
                      alt={testimonials[currentIndex].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="text-left">
                    <div className="font-semibold text-text text-lg">
                      {testimonials[currentIndex].name}
                    </div>
                    <div className="text-text-muted">
                      {testimonials[currentIndex].role}
                    </div>
                    {/* Rating stars */}
                    <div className="flex space-x-1 mt-1">
                      {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="w-4 h-4 text-yellow-400"
                        >
                          ★
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass flex items-center justify-center text-accent hover:bg-accent/10 transition-colors duration-200"
            >
              <ChevronLeft className="h-6 w-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass flex items-center justify-center text-accent hover:bg-accent/10 transition-colors duration-200"
            >
              <ChevronRight className="h-6 w-6" />
            </motion.button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center space-x-3 mt-8">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-accent scale-125'
                    : 'bg-text-muted hover:bg-accent/50'
                }`}
              />
            ))}
          </div>

          {/* Auto-play indicator */}
          <div className="text-center mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`text-sm px-4 py-2 rounded-full transition-colors duration-200 ${
                isAutoPlaying
                  ? 'bg-accent/20 text-accent'
                  : 'bg-text-muted/20 text-text-muted'
              }`}
            >
              {isAutoPlaying ? 'Auto-playing' : 'Paused'}
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
