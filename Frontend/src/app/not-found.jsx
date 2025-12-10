'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SkillSwapLogo from '@/components/SkillSwapLogo';
import { tokenManager } from '@/lib/api';

const NotFoundPage = () => {
  const router = useRouter();
  const isAuthenticated = tokenManager.isAuthenticated();

  const handleGoHome = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 md:p-12 text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <SkillSwapLogo className="h-16 w-16 text-accent" />
          </motion.div>

          {/* 404 Number */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-9xl md:text-[12rem] font-bold gradient-text mb-4 leading-none"
          >
            404
          </motion.h1>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-4xl font-bold text-text mb-4"
          >
            Page Not Found
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-text-muted mb-8"
          >
            Oops! The page you're looking for doesn't exist. 
            It might have been moved or deleted.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="bg-accent hover:bg-accent-dark text-white"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              {isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
            </Button>
            
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="glass border-accent text-accent hover:bg-accent/10"
              size="lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
            
            <Button
              onClick={() => window.location.reload()}
              variant="ghost"
              className="text-text-muted hover:text-accent hover:bg-accent/10"
              size="lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh
            </Button>
          </motion.div>

          {/* Additional Help */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 pt-8 border-t border-accent/20"
          >
            <p className="text-sm text-text-muted">
              Need help? Visit our{' '}
              <button
                onClick={() => router.push('/')}
                className="text-accent hover:text-accent-light underline"
              >
                home page
              </button>
              {' '}or{' '}
              <button
                onClick={() => router.push('/')}
                className="text-accent hover:text-accent-light underline"
              >
                contact support
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;

