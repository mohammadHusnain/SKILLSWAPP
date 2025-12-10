'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SessionDetail from '@/components/sessions/SessionDetail';
import { sessionsAPI, tokenManager } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const SessionDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const sessionId = params.sessionId;
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (sessionId) {
      fetchSession();
    }
  }, [router, sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await sessionsAPI.getSessionDetail(sessionId);
      setSession(data);
      
      // Determine user role - this would need current user ID from context/API
      // For now, we'll check if user is teacher or learner
      // In real implementation, compare with current user ID
      const currentUserId = ''; // Should get from auth context
      if (data.teacher_id === currentUserId) {
        setUserRole('teacher');
      } else if (data.learner_id === currentUserId) {
        setUserRole('learner');
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err.message || 'Failed to fetch session');
      toast({
        title: 'Error',
        description: 'Failed to load session details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, sessionId) => {
    try {
      switch (action) {
        case 'accept':
          await sessionsAPI.acceptSession(sessionId);
          toast({
            title: 'Success',
            description: 'Session accepted successfully!',
          });
          break;
        case 'reject':
          await sessionsAPI.rejectSession(sessionId);
          toast({
            title: 'Success',
            description: 'Session rejected.',
          });
          break;
        case 'complete':
          await sessionsAPI.completeSession(sessionId);
          toast({
            title: 'Success',
            description: 'Session marked as completed!',
          });
          break;
        case 'cancel':
          await sessionsAPI.cancelSession(sessionId);
          toast({
            title: 'Success',
            description: 'Session cancelled.',
          });
          break;
        default:
          break;
      }
      fetchSession();
    } catch (err) {
      console.error(`Error ${action}ing session:`, err);
      toast({
        title: 'Error',
        description: err.message || `Failed to ${action} session`,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !session) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/sessions')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Button>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-500">
            {error || 'Session not found'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/sessions')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sessions
        </Button>

        <SessionDetail
          session={session}
          userRole={userRole || 'teacher'}
          onAction={handleAction}
        />
      </div>
    </DashboardLayout>
  );
};

export default SessionDetailPage;

