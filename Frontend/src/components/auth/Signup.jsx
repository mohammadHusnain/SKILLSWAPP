'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';
import SkillSwapLogo from '@/components/SkillSwapLogo';

// Validation schema
const signupSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters'),
  phoneNumber: z.string()
    .regex(/^\d{11}$/, 'Phone number must be exactly 11 digits'),
  address: z.string()
    .min(10, 'Address must be at least 10 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Password strength checker
const getPasswordStrength = (password) => {
  if (!password || password.length === 0) {
    return { strength: 'weak', score: 0, color: 'bg-red-500' };
  }
  
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Za-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;
  
  if (score <= 2) return { strength: 'weak', score, color: 'bg-red-500' };
  if (score <= 4) return { strength: 'medium', score, color: 'bg-yellow-500' };
  return { strength: 'strong', score, color: 'bg-green-500' };
};

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  // Single form
  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      address: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Register user with all data
      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        address: data.address,
        email: data.email,
        password: data.password,
        password_confirm: data.confirmPassword,
      };

      const response = await authAPI.register(registrationData);
      
      console.log('Registration successful:', response.data);
      
      // Show success toast notification
      toast({
        title: "🎉 User Registered Successfully!",
        description: `Welcome to SkillSwap, ${data.firstName}! You can now login with your credentials.`,
        variant: "default",
        duration: 4000, // Show for 4 seconds
      });
      
      console.log('Success toast triggered');
      
      // Wait 1 second to let user see the success message, then redirect
      setTimeout(() => {
        console.log('Redirecting to login page...');
        // Redirect to login page with registration parameter
        router.push('/login?from=register');
      }, 1000);
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle validation errors
      if (error.data && typeof error.data === 'object') {
        // Display field-specific errors
        Object.keys(error.data).forEach(field => {
          if (form.getFieldState(field)) {
            form.setError(field, { message: error.data[field][0] });
          }
        });
      }
      
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const password = form.watch('password');
  const passwordStrength = getPasswordStrength(password || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary-dark flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent-light/10 rounded-full blur-3xl" />
        
        {/* Floating particles */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-32 right-32 opacity-20"
        >
          <div className="w-16 h-16 border-2 border-accent rounded-full" />
        </motion.div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 hover:shadow-2xl hover:shadow-accent/20 transition-all duration-300 hover:-translate-y-1"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <SkillSwapLogo className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Join SkillSwap
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-accent to-accent-light rounded-full mx-auto" />
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-text">First Name</Label>
                  <Input
                    id="firstName"
                    {...form.register('firstName')}
                    className="mt-1"
                    placeholder="John"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-text">Last Name</Label>
                  <Input
                    id="lastName"
                    {...form.register('lastName')}
                    className="mt-1"
                    placeholder="Doe"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="text-text">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  {...form.register('phoneNumber')}
                  className="mt-1 focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                  placeholder="12345678901"
                  type="tel"
                  maxLength={11}
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {form.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address" className="text-text">Address</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  className="mt-1"
                  placeholder="123 Main St, City, State 12345"
                />
                {form.formState.errors.address && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-text">Email Address</Label>
                <Input
                  id="email"
                  {...form.register('email')}
                  className="mt-1 focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                  placeholder="john.doe@example.com"
                  type="email"
                />
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
                    placeholder="Create a strong password"
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
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted capitalize">
                        {passwordStrength.strength}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      Password must be at least 8 characters with letters and numbers
                    </p>
                  </div>
                )}
                
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
                    placeholder="Confirm your password"
                    className="focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
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
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-accent/30 hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing Up...</span>
                </>
              ) : (
                <>
                  <span>Sign Up</span>
                  <Check className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-text-muted text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-accent hover:text-accent-light transition-colors duration-200">
                Sign in
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
