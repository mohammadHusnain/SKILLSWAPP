'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentAPI, tokenManager } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState('loading'); // loading, error

  useEffect(() => {
    // Check authentication
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Create checkout session and redirect
    createCheckout();
  }, [router]);

  const createCheckout = async () => {
    try {
      setStatus('loading');
      
      const baseUrl = window.location.origin;
      
      // Call backend to create Stripe checkout session
      const { url } = await paymentAPI.createPremiumCheckout(
        `${baseUrl}/dashboard/payments/success`,
        `${baseUrl}/dashboard/payments/cancel`
      );

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setStatus('error');
      
      const errorMessage = error?.message || error?.data?.message || 'Failed to start checkout process';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      // Redirect back to subscription page after 3 seconds
      setTimeout(() => {
        router.push('/dashboard/subscription');
      }, 3000);
    }
  };

  if (status === 'error') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-full">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Checkout Error</CardTitle>
              <CardDescription>
                There was an error starting the checkout process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                Redirecting you back to the subscription page...
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <CardTitle className="text-2xl">Preparing Checkout</CardTitle>
            <CardDescription>
              Please wait while we redirect you to Stripe Checkout...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Your browser will redirect automatically. If you are not redirected, please click the button below.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

