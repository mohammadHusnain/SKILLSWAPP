'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SessionForm from '@/components/sessions/SessionForm';
import { sessionsAPI, tokenManager, matchingAPI, profileAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const CreateSessionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [learnerId, setLearnerId] = useState(null);
  const [learnerName, setLearnerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [availableLearners, setAvailableLearners] = useState([]);
  const [selectedLearner, setSelectedLearner] = useState('');

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Check if learner_id is provided in query params (from matches page)
    const learnerIdParam = searchParams?.get('learner_id');
    if (learnerIdParam) {
      setLearnerId(learnerIdParam);
      setSelectedLearner(learnerIdParam);
      fetchLearnerName(learnerIdParam);
    } else {
      // Fetch available learners (users with accepted matches)
      fetchAvailableLearners();
    }
  }, [router, searchParams]);

  const fetchLearnerName = async (userId) => {
    try {
      const profile = await profileAPI.searchProfiles([], 1);
      // Find the user in the results or fetch their profile directly
      // For now, we'll try to get it from matches
      const matches = await matchingAPI.getMatches();
      const match = matches.matches?.find(m => m.matched_user_id === userId);
      if (match?.matched_user_profile) {
        setLearnerName(match.matched_user_profile.name || 'User');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching learner name:', err);
      setLearnerName('User');
      setLoading(false);
    }
  };

  const fetchAvailableLearners = async () => {
    try {
      setLoading(true);
      // Get matches with accepted interest
      const matches = await matchingAPI.getMatches();
      const acceptedMatches = matches.matches?.filter(
        m => m.interest_status === 'accepted'
      ) || [];
      
      setAvailableLearners(acceptedMatches.map(m => ({
        id: m.matched_user_id,
        name: m.matched_user_profile?.name || 'User',
        profile: m.matched_user_profile,
      })));
    } catch (err) {
      console.error('Error fetching available learners:', err);
      toast({
        title: 'Error',
        description: 'Failed to load available learners.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      // Ensure learner_id is set
      const finalLearnerId = selectedLearner || learnerId || formData.learner_id;
      
      if (!finalLearnerId) {
        toast({
          title: 'Error',
          description: 'Please select a learner',
          variant: 'destructive',
        });
        return;
      }

      const sessionData = {
        ...formData,
        learner_id: finalLearnerId,
      };

      console.log('Creating session with data:', sessionData);
      const response = await sessionsAPI.createSession(sessionData);
      console.log('Session created:', response);
      
      toast({
        title: 'Success',
        description: 'Session created successfully!',
      });
      
      // Navigate to sessions page - it will auto-refresh
      router.push('/dashboard/sessions');
    } catch (err) {
      console.error('Error creating session:', err);
      toast({
        title: 'Error',
        description: err.message || err.data?.error || 'Failed to create session',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/sessions');
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
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/sessions')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sessions
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Session</CardTitle>
          </CardHeader>
          <CardContent>
            {!learnerId && availableLearners.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">
                  Select Learner *
                </label>
                <select
                  value={selectedLearner}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSelectedLearner(newValue);
                    const learner = availableLearners.find(l => l.id === newValue);
                    if (learner) {
                      setLearnerName(learner.name);
                      setLearnerId(learner.id);
                    } else {
                      setLearnerName('');
                      setLearnerId(null);
                    }
                  }}
                  className="w-full p-2 border rounded-md bg-background"
                  required
                >
                  <option value="">Select a learner...</option>
                  {availableLearners.map((learner) => (
                    <option key={learner.id} value={learner.id}>
                      {learner.name}
                    </option>
                  ))}
                </select>
                {!selectedLearner && (
                  <p className="text-sm text-red-500 mt-1">Please select a learner</p>
                )}
              </div>
            )}

            <SessionForm
              learnerId={learnerId || selectedLearner}
              learnerName={learnerName}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateSessionPage;

