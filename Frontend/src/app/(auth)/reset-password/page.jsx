'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';
import SkillSwapLogo from '@/components/SkillSwapLogo';
import { useTheme } from '@/contexts/ThemeContext';

// Validation schema
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .refine((val) => {
      const hasLetter = /[a-zA-Z]/.test(val);
      const hasNumber = /[0-9]/.test(val);
      return hasLetter && hasNumber;
    }, 'Password must contain at least one letter and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { theme } = useTheme();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast({
        title: "Invalid Link",
        description: "No reset token found. Please request a new password reset.",
        variant: "destructive",
      });
      setTimeout(() => {
        router.push('/forgot-password');
      }, 3000);
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, router, toast]);

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Invalid reset token. Please request a new password reset.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await authAPI.confirmPasswordReset(token, data.password, data.confirmPassword);
      
      setIsSuccess(true);
      toast({
        title: "Password Reset Successful!",
        description: "Your password has been reset successfully. Redirecting to login...",
        variant: "default",
      });
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/login?from=reset');
      }, 2000);
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      const errorMessage = error?.message || error?.data?.error || 'Failed to reset password. Please try again.';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl p-8 shadow-xl text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
            <p className="text-text">Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-8 shadow-xl text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text mb-2">Password Reset Successful!</h1>
            <p className="text-text-muted mb-6">
              Your password has been reset successfully. Redirecting to login...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 shadow-xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <SkillSwapLogo className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-bold text-text mb-2">
              Reset Password
            </h1>
            <p className="text-text-muted">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="password" className="text-text">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  {...form.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200 pr-10"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-text">Confirm Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  {...form.register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200 pr-10"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {form.formState.errors.confirmPassword.message}
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
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Reset Password</span>
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-text-muted hover:text-text flex items-center justify-center space-x-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

