'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Send contact form data to backend
      const response = await authAPI.sendContactForm(formData);
      
      // Show success message
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-secondary/30" />
      
      {/* Floating elements */}
      <div className="absolute top-20 right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-32 h-32 bg-accent-light/10 rounded-full blur-3xl" />

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
            Get in{' '}
            <span className="gradient-text">Touch</span>
          </h2>
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: '80px' }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="h-1 bg-gradient-to-r from-accent to-accent-light rounded-full mx-auto"
          />
          <p className="text-lg text-text-muted mt-6 max-w-2xl mx-auto">
            Have questions about SkillSwap? Want to share feedback or suggestions? 
            We'd love to hear from you!
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 lg:p-12"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name field */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-secondary/50 border border-white/10 rounded-lg text-text placeholder-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-300 hover:border-accent/50"
                  placeholder="Enter your full name"
                />
              </motion.div>

              {/* Email field */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-secondary/50 border border-white/10 rounded-lg text-text placeholder-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-300 hover:border-accent/50"
                  placeholder="Enter your email address"
                />
              </motion.div>

              {/* Message field */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <label htmlFor="message" className="block text-sm font-medium text-text mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-secondary/50 border border-white/10 rounded-lg text-text placeholder-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-300 hover:border-accent/50 resize-none"
                  placeholder="Tell us what's on your mind..."
                />
              </motion.div>

              {/* Submit button */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="pt-4"
              >
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-8 py-4 bg-gradient-to-r from-accent to-accent-light text-white font-semibold rounded-lg transition-all duration-300 glow-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </motion.button>
              </motion.div>

              {/* Status messages */}
              <AnimatePresence>
                {submitStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 rounded-lg flex items-center space-x-3 ${
                      submitStatus === 'success'
                        ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                        : 'bg-red-500/20 border border-red-500/30 text-red-400'
                    }`}
                  >
                    {submitStatus === 'success' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <span>
                      {submitStatus === 'success'
                        ? 'Message sent successfully! We\'ll get back to you soon.'
                        : 'Failed to send message. Please try again.'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Additional contact info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-text-muted mb-4">
              Or reach out to us directly:
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-8">
              <a href="mailto:hello@skillswap.com" className="text-accent hover:text-accent-light transition-colors duration-200">
                hello@skillswap.com
              </a>
              <a href="tel:+1234567890" className="text-accent hover:text-accent-light transition-colors duration-200">
                +1 (234) 567-890
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
