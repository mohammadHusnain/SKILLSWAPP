'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SessionCard from '@/components/sessions/SessionCard';
import { sessionsAPI, tokenManager } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const LearningSessionsPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchSessions();
  }, [router, statusFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await sessionsAPI.getLearningSessions(params);
      
      setSessions(response.sessions || []);
    } catch (err) {
      console.error('Error fetching learning sessions:', err);
      setError(err.message || 'Failed to fetch sessions');
      toast({
        title: 'Error',
        description: 'Failed to load learning sessions. Please try again.',
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
      fetchSessions();
    } catch (err) {
      console.error(`Error ${action}ing session:`, err);
      toast({
        title: 'Error',
        description: err.message || `Failed to ${action} session`,
        variant: 'destructive',
      });
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (statusFilter === 'all') return true;
    return session.status === statusFilter;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8" />
              Learning Sessions
            </h1>
            <p className="text-muted-foreground mt-1">
              Sessions where you're learning skills
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {['all', 'pending', 'accepted', 'completed', 'cancelled'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-500">
            {error}
          </div>
        )}

        {filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No learning sessions found</p>
            <p className="text-muted-foreground mt-2">
              {statusFilter === 'all'
                ? 'You don\'t have any learning sessions yet.'
                : `No ${statusFilter} learning sessions found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                userRole="learner"
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LearningSessionsPage;

