'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const TermsOfServiceModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-4xl max-h-[90vh] glass rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold gradient-text">Terms of Service</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-text-muted hover:text-accent transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </motion.button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6 text-text-muted leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">1. Acceptance of Terms</h3>
                  <p>
                    By accessing and using SkillSwap, you accept and agree to be bound by the terms and 
                    provision of this agreement. If you do not agree to abide by the above, please do not 
                    use this service.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">2. Description of Service</h3>
                  <p>
                    SkillSwap is an AI-powered platform that connects learners with expert mentors for 
                    skill exchange and collaborative learning. Our service includes:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>AI-driven matching between learners and mentors</li>
                    <li>Real-time collaboration tools and communication features</li>
                    <li>Skill assessment and progress tracking</li>
                    <li>Community features and networking opportunities</li>
                    <li>Educational content and resources</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">3. User Accounts</h3>
                  <p>
                    To access certain features of our service, you must create an account. You are responsible for:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Providing accurate and complete information</li>
                    <li>Maintaining the security of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized use</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">4. User Conduct</h3>
                  <p>You agree to use SkillSwap responsibly and in accordance with these terms. You will not:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on intellectual property rights</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Share inappropriate, offensive, or harmful content</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Use the service for commercial purposes without permission</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">5. Skill Exchange Guidelines</h3>
                  <p>
                    When participating in skill exchanges, you agree to:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Provide accurate information about your skills and expertise</li>
                    <li>Respect scheduled sessions and commitments</li>
                    <li>Maintain professional and respectful communication</li>
                    <li>Provide constructive feedback and support</li>
                    <li>Report any inappropriate behavior or content</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">6. Intellectual Property</h3>
                  <p>
                    The SkillSwap platform, including its design, functionality, and content, is protected 
                    by intellectual property laws. You retain ownership of content you create, but grant us 
                    a license to use it in connection with our services.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">7. Payment Terms</h3>
                  <p>
                    Some features may require payment. Payment terms include:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Fees are charged in advance and are non-refundable</li>
                    <li>Prices may change with 30 days notice</li>
                    <li>You are responsible for all applicable taxes</li>
                    <li>Payment processing is handled by secure third-party providers</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">8. Privacy and Data Protection</h3>
                  <p>
                    Your privacy is important to us. Please review our Privacy Policy to understand how we 
                    collect, use, and protect your information. By using our service, you consent to our 
                    data practices as described in the Privacy Policy.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">9. Service Availability</h3>
                  <p>
                    We strive to provide continuous service availability, but we do not guarantee uninterrupted 
                    access. We may temporarily suspend service for maintenance, updates, or technical issues.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">10. Limitation of Liability</h3>
                  <p>
                    SkillSwap is provided "as is" without warranties of any kind. We are not liable for any 
                    indirect, incidental, special, or consequential damages arising from your use of our service.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">11. Termination</h3>
                  <p>
                    We may terminate or suspend your account at any time for violations of these terms. 
                    You may also terminate your account at any time by contacting us.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">12. Changes to Terms</h3>
                  <p>
                    We may update these Terms of Service from time to time. We will notify users of material 
                    changes through our platform or by email. Continued use of the service constitutes 
                    acceptance of the updated terms.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">13. Governing Law</h3>
                  <p>
                    These terms are governed by the laws of the jurisdiction where SkillSwap Corp is incorporated, 
                    without regard to conflict of law principles.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">14. Contact Information</h3>
                  <p>
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <div className="mt-2 p-4 glass rounded-lg">
                    <p><strong>Email:</strong> legal@skillswap.com</p>
                    <p><strong>Address:</strong> SkillSwap Corp, Legal Department</p>
                    <p><strong>Last Updated:</strong> January 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TermsOfServiceModal;
