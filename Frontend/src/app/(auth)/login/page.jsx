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
