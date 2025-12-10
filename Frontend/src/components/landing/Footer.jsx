'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaLinkedin, 
  FaGithub, 
  FaTwitter, 
  FaInstagram 
} from 'react-icons/fa';
import SkillSwapLogo from '../SkillSwapLogo';
import PrivacyPolicyModal from '../modals/PrivacyPolicyModal';
import TermsOfServiceModal from '../modals/TermsOfServiceModal';

const Footer = () => {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'Contact', href: '#contact' }
  ];

  const socialLinks = [
    { 
      name: 'LinkedIn', 
      icon: FaLinkedin, 
      href: 'https://linkedin.com/company/skillswap',
      color: 'hover:text-blue-400'
    },
    { 
      name: 'GitHub', 
      icon: FaGithub, 
      href: 'https://github.com/skillswap',
      color: 'hover:text-gray-300'
    },
    { 
      name: 'Twitter', 
      icon: FaTwitter, 
      href: 'https://twitter.com/skillswap',
      color: 'hover:text-blue-400'
    },
    { 
      name: 'Instagram', 
      icon: FaInstagram, 
      href: 'https://instagram.com/skillswap',
      color: 'hover:text-pink-400'
    }
  ];

  const scrollToSection = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-gradient-to-b from-secondary/50 to-primary py-16 lg:py-20 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent" />
      
      {/* Floating particles */}
      <div className="absolute top-10 left-20 w-2 h-2 bg-accent rounded-full opacity-60 float" />
      <div className="absolute top-20 right-32 w-1 h-1 bg-accent-light rounded-full opacity-40 float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-1/3 w-1.5 h-1.5 bg-accent rounded-full opacity-50 float" style={{ animationDelay: '4s' }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Left - Logo and description */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <SkillSwapLogo className="h-8 w-8" />
              <span className="text-2xl font-bold gradient-text">
                SKILLSWAP
              </span>
            </div>
            
            {/* Description */}
            <p className="text-text-muted leading-relaxed max-w-sm">
              Empowering global skill exchange through AI-driven connections. 
              Learn, teach, and grow in our innovative collaborative ecosystem.
            </p>
          </motion.div>

          {/* Center - Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-text">Quick Links</h3>
            <nav className="space-y-3">
              {quickLinks.map((link) => (
                <motion.button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  whileHover={{ x: 10 }}
                  className="block text-text-muted hover:text-accent transition-colors duration-200 text-left"
                >
                  {link.name}
                </motion.button>
              ))}
            </nav>
          </motion.div>

          {/* Right - Social links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-text">Follow Us</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ 
                      scale: 1.2,
                      y: -5,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-12 h-12 rounded-lg glass flex items-center justify-center text-text-muted ${social.color} transition-all duration-300 hover:glow`}
                    aria-label={social.name}
                  >
                    <IconComponent className="h-6 w-6" />
                  </motion.a>
                );
              })}
            </div>
            
            {/* Newsletter signup */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-text">Stay Updated</h4>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-secondary/50 border border-white/10 rounded-lg text-text placeholder-text-muted focus:border-accent focus:outline-none transition-colors duration-200 text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom border */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 pt-8 border-t border-white/10"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-text-muted text-sm text-center sm:text-left">
              Empowering global skill exchange through AI-driven connections
            </div>
            <div className="flex space-x-6 text-sm text-text-muted">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPrivacyModalOpen(true)}
                className="hover:text-accent transition-colors duration-200"
              >
                Privacy Policy
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsTermsModalOpen(true)}
                className="hover:text-accent transition-colors duration-200"
              >
                Terms of Service
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Modals */}
      <PrivacyPolicyModal 
        isOpen={isPrivacyModalOpen} 
        onClose={() => setIsPrivacyModalOpen(false)} 
      />
      <TermsOfServiceModal 
        isOpen={isTermsModalOpen} 
        onClose={() => setIsTermsModalOpen(false)} 
      />
    </footer>
  );
};

export default Footer;
