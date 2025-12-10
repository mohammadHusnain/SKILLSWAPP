'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
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
              <h2 className="text-2xl font-bold gradient-text">Privacy Policy</h2>
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
                  <h3 className="text-lg font-semibold text-text mb-3">1. Information We Collect</h3>
                  <p>
                    SkillSwap collects information you provide directly to us, such as when you create an account, 
                    update your profile, participate in skill exchanges, or contact us for support. This may include:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Account information (name, email, profile details)</li>
                    <li>Skill information and learning preferences</li>
                    <li>Communication data and feedback</li>
                    <li>Payment information (processed securely through third-party providers)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">2. How We Use Your Information</h3>
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Provide and improve our AI-powered matching services</li>
                    <li>Facilitate skill exchanges and mentorship connections</li>
                    <li>Send important updates about your account and our services</li>
                    <li>Analyze usage patterns to enhance user experience</li>
                    <li>Ensure platform security and prevent fraud</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">3. Information Sharing</h3>
                  <p>
                    We do not sell, trade, or rent your personal information to third parties. We may share 
                    information only in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>With your consent for specific purposes</li>
                    <li>With service providers who assist in platform operations</li>
                    <li>To comply with legal obligations or protect our rights</li>
                    <li>In connection with a business transfer or merger</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">4. Data Security</h3>
                  <p>
                    We implement appropriate technical and organizational measures to protect your personal 
                    information against unauthorized access, alteration, disclosure, or destruction. This includes 
                    encryption, secure servers, and regular security audits.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">5. Your Rights</h3>
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Access and update your personal information</li>
                    <li>Request deletion of your account and data</li>
                    <li>Opt out of marketing communications</li>
                    <li>Request data portability</li>
                    <li>Withdraw consent for data processing</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">6. Cookies and Tracking</h3>
                  <p>
                    We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
                    and provide personalized content. You can control cookie preferences through your browser settings.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">7. International Transfers</h3>
                  <p>
                    Your information may be transferred to and processed in countries other than your own. 
                    We ensure appropriate safeguards are in place to protect your data in accordance with 
                    applicable privacy laws.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">8. Children's Privacy</h3>
                  <p>
                    SkillSwap is not intended for children under 13. We do not knowingly collect personal 
                    information from children under 13. If we become aware of such collection, we will 
                    take steps to delete the information.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">9. Changes to This Policy</h3>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any material 
                    changes by posting the new policy on our website and updating the "Last Updated" date.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">10. Contact Us</h3>
                  <p>
                    If you have any questions about this Privacy Policy or our data practices, please contact us at:
                  </p>
                  <div className="mt-2 p-4 glass rounded-lg">
                    <p><strong>Email:</strong> privacy@skillswap.com</p>
                    <p><strong>Address:</strong> SkillSwap Corp, Privacy Department</p>
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

export default PrivacyPolicyModal;
