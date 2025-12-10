'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Book, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SessionCard from '@/components/sessions/SessionCard';
import { sessionsAPI, tokenManager, profileAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const SessionsPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch current user ID on mount
  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const fetchCurrentUser = async () => {
      try {
        const profile = await profileAPI.getProfile();
        if (profile.user_id) {
          setCurrentUserId(profile.user_id);
        } else if (profile._id) {
          setCurrentUserId(profile._id);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    
    fetchCurrentUser();
  }, [router]);

  // Refresh sessions when page becomes visible (e.g., returning from create page)
  useEffect(() => {
    const handleFocus = () => {
      if (pathname === '/dashboard/sessions') {
        fetchSessions();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [pathname]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await sessionsAPI.getSessions(params);
      
      setSessions(response.sessions || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Failed to fetch sessions');
      toast({
        title: 'Error',
        description: 'Failed to load sessions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch sessions when status filter changes or when pathname is sessions page
  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      return;
    }
    if (pathname === '/dashboard/sessions') {
      fetchSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, pathname]);

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

  const getUserRole = (session) => {
    if (!currentUserId || !session) return 'teacher'; // Default fallback
    
    // Compare current user ID with teacher_id and learner_id
    const teacherId = String(session.teacher_id || '');
    const learnerId = String(session.learner_id || '');
    const currentId = String(currentUserId);
    
    if (teacherId === currentId) {
      return 'teacher';
    } else if (learnerId === currentId) {
      return 'learner';
    }
    
    return 'teacher'; // Default fallback
  };

  const filteredSessions = sessions.filter(session => {
    if (statusFilter === 'all') return true;
    return session.status === statusFilter;
  });

  const stats = {
    total: sessions.length,
    pending: sessions.filter(s => s.status === 'pending').length,
    accepted: sessions.filter(s => s.status === 'accepted').length,
    completed: sessions.filter(s => s.status === 'completed').length,
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sessions</h1>
            <p className="text-muted-foreground mt-1">
              Manage your teaching and learning sessions
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard/sessions/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Session
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-lg p-4"
          >
            <p className="text-sm text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border rounded-lg p-4"
          >
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border rounded-lg p-4"
          >
            <p className="text-sm text-muted-foreground">Accepted</p>
            <p className="text-2xl font-bold text-blue-500">{stats.accepted}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border rounded-lg p-4"
          >
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
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

        {/* Sessions List */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-500">
            {error}
          </div>
        )}

        {filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No sessions found</p>
            <p className="text-muted-foreground mt-2">
              {statusFilter === 'all'
                ? 'Create your first session to get started!'
                : `No ${statusFilter} sessions found.`}
            </p>
            {statusFilter === 'all' && (
              <Button
                className="mt-4"
                onClick={() => router.push('/dashboard/sessions/create')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Session
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session, index) => (
              <SessionCard
                key={session._id}
                session={session}
                userRole={getUserRole(session)}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SessionsPage;

