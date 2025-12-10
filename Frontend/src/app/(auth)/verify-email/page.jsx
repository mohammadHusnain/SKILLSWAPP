'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';
import SkillSwapLogo from '@/components/SkillSwapLogo';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const VerifyEmailPage = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { theme } = useTheme();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setIsError(true);
      setErrorMessage('No verification token found in the link.');
      setIsVerifying(false);
    } else {
      setToken(tokenParam);
      verifyEmail(tokenParam);
    }
  }, [searchParams]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      await authAPI.verifyEmail(verificationToken);
      setIsSuccess(true);
      setIsVerifying(false);
      
      toast({
        title: "Email Verified!",
        description: "Your email has been verified successfully. Redirecting to login...",
        variant: "default",
      });
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/login?from=verified');
      }, 2000);
      
    } catch (error: any) {
      console.error('Email verification error:', error);
      setIsError(true);
      setIsVerifying(false);
      
      const errorMsg = error?.message || error?.data?.error || 'Failed to verify email. The link may be invalid or expired.';
      setErrorMessage(errorMsg);
      
      toast({
        title: "Verification Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    
    try {
      await authAPI.resendVerification(resendEmail);
      
      toast({
        title: "Verification Email Sent!",
        description: `We've sent a new verification email to ${resendEmail}`,
        variant: "default",
      });
      
      setResendEmail('');
    } catch (error: any) {
      console.error('Resend verification error:', error);
      
      const errorMsg = error?.message || error?.data?.error || 'Failed to resend verification email.';
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-8 shadow-xl text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <SkillSwapLogo className="h-12 w-12" />
            </div>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
            <h1 className="text-2xl font-bold text-text mb-2">Verifying Email...</h1>
            <p className="text-text-muted">
              Please wait while we verify your email address.
            </p>
          </motion.div>
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
            <div className="flex items-center justify-center mb-4">
              <SkillSwapLogo className="h-12 w-12" />
            </div>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text mb-2">Email Verified!</h1>
            <p className="text-text-muted mb-6">
              Your email has been verified successfully. Redirecting to login...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-8 shadow-xl"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <SkillSwapLogo className="h-12 w-12" />
              </div>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-text mb-2">Verification Failed</h1>
              <p className="text-text-muted">
                {errorMessage}
              </p>
            </div>

            {/* Resend Verification Section */}
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-start space-x-3 mb-4">
                  <Mail className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-400">
                    <p className="font-medium">Need a new verification email?</p>
                    <p>Enter your email address below and we'll send you a new verification link.</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="resendEmail" className="text-text text-sm">Email Address</Label>
                    <Input
                      id="resendEmail"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Resend Verification Email</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="space-y-4">
              <div className="text-center">
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
              
              <div className="text-center">
                <Link href="/register">
                  <Button
                    variant="ghost"
                    className="text-text-muted hover:text-text text-sm"
                  >
                    Create a new account
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
};

export default VerifyEmailPage;

