'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, Info, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';
import SkillSwapLogo from '@/components/SkillSwapLogo';
import { useTheme } from '@/contexts/ThemeContext';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
});

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      await authAPI.requestPasswordReset(data.email);
      
      toast({
        title: "Reset Instructions Sent!",
        description: `We've sent password reset instructions to ${data.email}`,
        variant: "default",
      });
      
      // Redirect to login page after successful submission
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Forgot password error:', error);
      
      const errorMessage = error?.message || error?.data?.error || 'Failed to send reset instructions. Please try again.';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <SkillSwapLogo className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-bold text-text mb-2">
              Forgot Password?
            </h1>
            <p className="text-text-muted">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-text">Email Address</Label>
              <div className="relative mt-1">
                <Input
                  id="email"
                  {...form.register('email')}
                  className="focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                  placeholder="Enter your email address"
                  type="email"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              </div>
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-accent/30 hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending Instructions...</span>
                </>
              ) : (
                <span>Send Reset Instructions</span>
              )}
            </Button>
          </form>

          {/* Help Section */}
          <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-400">
                <p className="font-medium">Need Help?</p>
                <p>If you're having trouble accessing your account, contact our support team for assistance.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-text-muted text-sm">
                Remember your password?{' '}
                <Link href="/login" className="text-accent hover:text-accent-light transition-colors duration-200">
                  Sign in here
                </Link>
              </p>
            </div>
            
            <div className="text-center">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="text-text-muted hover:text-text flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
