'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tokenManager } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function PaymentCancelPage() {
  const router = useRouter();

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Your payment was cancelled. No charges were made.
            </p>

            <div className="flex gap-4">
              <Button
                onClick={() => router.push('/dashboard/subscription')}
                variant="outline"
                className="flex-1"
              >
                Back to Subscription
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


