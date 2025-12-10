'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tokenManager } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    const session = searchParams.get('session_id');
    if (session) {
      setSessionId(session);
    }
  }, [searchParams]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Thank you for your payment. Your subscription is now active.
            </p>
            
            {sessionId && (
              <p className="text-center text-sm text-gray-500">
                Session ID: {sessionId.substring(0, 20)}...
              </p>
            )}

            <Button
              onClick={() => router.push('/dashboard/subscription')}
              className="w-full"
            >
              Go to Subscription Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


