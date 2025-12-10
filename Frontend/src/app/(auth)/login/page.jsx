'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { authAPI, tokenManager } from '@/lib/api';
import SkillSwapLogo from '@/components/SkillSwapLogo';
import { useTheme } from '@/contexts/ThemeContext';

// Validation schema
const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password is required'),
});

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { theme } = useTheme();

  // Check if user came from registration, logout, verification, or password reset
  const fromRegister = searchParams.get('from') === 'register';
  const fromLogout = searchParams.get('from') === 'logout';
  const fromVerified = searchParams.get('from') === 'verified';
  const fromReset = searchParams.get('from') === 'reset';

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Clear form fields when coming from registration or logout
  useEffect(() => {
    if (fromRegister || fromLogout || fromVerified || fromReset) {
      form.reset({
        email: '',
        password: '',
      });
    }
    
    // Show welcome message if coming from registration
    if (fromRegister) {
      toast({
        title: "Welcome to SkillSwap!",
        description: "Your account has been created successfully. Please login to continue.",
        variant: "default",
        duration: 3000, // Show for 3 seconds
      });
    }
    
    // Show success message if coming from email verification
    if (fromVerified) {
      toast({
        title: "Email Verified!",
        description: "Your email has been verified successfully. You can now login.",
        variant: "default",
        duration: 4000, // Show for 4 seconds
      });
    }
    
    // Show success message if coming from password reset
    if (fromReset) {
      toast({
        title: "Password Reset Successful!",
        description: "Your password has been reset successfully. Please login with your new password.",
        variant: "default",
        duration: 4000, // Show for 4 seconds
      });
    }
  }, [fromRegister, fromLogout, fromVerified, fromReset, form, toast]);


  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(data);
      
      // Store access token using token manager
      tokenManager.setToken(response.access_token);
      
      toast({
        title: "Login Successful!",
        description: `Welcome back, ${response.user.name}!`,
        variant: "default",
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      
      let title = "Login Failed";
      let description = "An unexpected error occurred. Please try again.";
      
      if (error.status === 400) {
        // Handle serializer validation errors
        if (error.data?.email) {
          title = "Invalid Email";
          description = "Please enter a valid email address";
        } else if (error.data?.password) {
          title = "Invalid Password";
          description = error.data.password[0] || "Please enter your password";
        } else if (error.data?.error) {
          // Handle custom 400 errors (email not found)
          if (error.data.error.includes('Email address not found')) {
            title = "Sign Up Required";
            description = "Please Sign Up first to login";
          }
        } else {
          title = "Validation Error";
          description = "Please fill in all required fields correctly";
        }
      } else if (error.status === 401) {
        // Incorrect password
        title = "Authentication Failed";
        description = "Incorrect password. Please try again";
      } else if (error.status === 403) {
        // Email not verified or account not active
        if (error.data?.requires_verification || error.data?.error?.includes('not verified')) {
          title = "Email Not Verified";
          description = "Please verify your email address before logging in. Check your inbox for the verification link.";
        } else {
          title = "Access Denied";
          description = error.data?.error || "Your account is not active. Please contact support.";
        }
      } else if (error.message?.includes('Network error')) {
        title = "Connection Error";
        description = "Unable to connect. Please check your internet connection";
      }
      
      toast({
        title,
        description,
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
              {fromRegister ? "Welcome to SkillSwap!" : fromVerified ? "Email Verified!" : fromReset ? "Password Reset!" : "Welcome Back"}
            </h1>
            <p className="text-text-muted">
              {fromVerified ? "Your email has been verified. Please sign in to continue." : 
               fromReset ? "Your password has been reset. Please sign in with your new password." :
               "Sign in to your SkillSwap account"}
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-accent to-accent-light rounded-full mx-auto mt-2" />
            {(fromVerified || fromReset) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-400 font-medium">
                  {fromVerified ? "Email verification successful!" : "Password reset successful!"}
                </span>
              </motion.div>
            )}
          </div>


          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-text">Email Address</Label>
                <div className="relative mt-1">
                  <Input
                    id="email"
                    {...form.register('email')}
                    className="focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                    placeholder="Enter your email"
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

              <div>
                <Label htmlFor="password" className="text-text">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    {...form.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
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
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-accent glass border-accent/30 rounded focus:ring-accent focus:ring-2"
                />
                <Label htmlFor="remember" className="text-sm text-text">
                  Remember me
                </Label>
              </div>
              <Link href="/forgot-password" className="text-sm text-accent hover:text-accent-light transition-colors duration-200">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-accent/30 hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-accent/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 glass text-text-muted">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center space-x-2 py-3 glass border-accent/20 hover:bg-accent/10"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-text">Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center space-x-2 py-3 glass border-accent/20 hover:bg-accent/10"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-text">Facebook</span>
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-text-muted text-sm">
                Don't have an account?{' '}
                <Link href="/register" className="text-accent hover:text-accent-light transition-colors duration-200">
                  Sign up for free
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

export default LoginPage;
