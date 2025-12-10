'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Heart,
  Star,
  MapPin,
  Clock,
  ArrowLeft,
  MessageCircle,
  TrendingUp,
  Calendar,
  Globe,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StarRating from '@/components/ui/StarRating';
import { matchingAPI, tokenManager } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const MatchDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [expressingInterest, setExpressingInterest] = useState(false);

  const matchUserId = params?.id || params?.userId;

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    const fetchMatchDetail = async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);
        
        if (!matchUserId) {
          setError('User ID is missing');
          setLoading(false);
          return;
        }
        
        const response = await matchingAPI.getMatchDetail(matchUserId);
        setMatchData(response);
      } catch (err) {
        console.error('Error fetching match detail:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch match details');
        if (showLoading) {
          toast({
            title: 'Error',
            description: 'Failed to load match details.',
            variant: 'destructive',
          });
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    };

    if (matchUserId) {
      fetchMatchDetail(true); // Show loading on initial load
      
      // Poll for real-time updates every 30 seconds
      const interval = setInterval(() => {
        fetchMatchDetail(false); // Don't show loading on refresh
      }, 30 * 1000); // 30 seconds
      
      return () => clearInterval(interval);
    } else {
      setError('Invalid user ID');
      setLoading(false);
    }
  }, [matchUserId, toast]);

  const handleExpressInterest = async () => {
    try {
      setExpressingInterest(true);
      console.log('Expressing interest for user:', matchUserId);
      const result = await matchingAPI.expressInterest(matchUserId);
      console.log('Express interest result:', result);
      toast({
        title: 'Success',
        description: 'Interest sent successfully!',
      });
      // Refresh match data to update interest status
      const response = await matchingAPI.getMatchDetail(matchUserId);
      setMatchData(response);
    } catch (err) {
      console.error('Error expressing interest:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        data: err.response?.data,
        status: err.status
      });
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send interest. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setExpressingInterest(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-muted">Loading match details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !matchData) {
    return (
      <DashboardLayout>
        <div className="glass rounded-xl p-12 text-center">
            <p className="text-red-500 text-lg mb-4">{error || 'Match not found'}</p>
            <Button onClick={() => router.push('/dashboard/matches')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Matches
            </Button>
          </div>
      </DashboardLayout>
    );
  }

  const profile = matchData.matched_user_profile || {};
  const breakdown = matchData.breakdown || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/matches')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Matches
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text">{profile.name || 'Unknown'}</h1>
              <div className="flex items-center space-x-2 text-text-muted mt-1">
                <MapPin className="w-4 h-4" />
                <span>{profile.location?.city ? `${profile.location.city}, ${profile.location.country}` : 'Location not set'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">{Math.round(matchData.match_score)}%</div>
              <div className="text-sm text-text-muted mb-2">Match Score</div>
              <StarRating 
                rating={matchData.match_score} 
                isPercentage={true}
                size="w-5 h-5"
                showNumber={false}
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleExpressInterest}
                disabled={matchData.interest_status !== 'none' || expressingInterest}
                className="border-accent text-accent hover:bg-accent hover:text-white"
              >
                <Heart className="w-4 h-4 mr-2" />
                {matchData.interest_status === 'pending' ? 'Interest Expressed' : 
                 matchData.interest_status === 'accepted' ? 'Connected' : 
                 'Express Interest'}
              </Button>
              {matchData.interest_status === 'accepted' && (
                <Button
                  className="bg-accent hover:bg-accent-dark text-white"
                  onClick={() => router.push(`/dashboard/messages?user=${matchUserId}`)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Match Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-text mb-4">Match Score Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Skills</span>
                <span className="text-sm font-bold text-green-500">{breakdown.skills_score || 0}/60</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${((breakdown.skills_score || 0) / 60) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Availability</span>
                <span className="text-sm font-bold text-blue-500">{breakdown.availability_score || 0}/15</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${((breakdown.availability_score || 0) / 15) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Location</span>
                <span className="text-sm font-bold text-purple-500">{breakdown.location_score || 0}/10</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${((breakdown.location_score || 0) / 10) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Rating</span>
                <span className="text-sm font-bold text-yellow-500">{breakdown.rating_score || 0}/15</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${((breakdown.rating_score || 0) / 15) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6 space-y-6"
          >
            <div>
              <h3 className="text-xl font-bold text-text mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-pink-500" />
                Skills I Can Teach
              </h3>
              <div className="flex flex-wrap gap-2">
                {(profile.skills_offered || []).map((skill, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-pink-500/20 text-pink-600 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-text mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
                Skills I Want to Learn
              </h3>
              <div className="flex flex-wrap gap-2">
                {(profile.skills_wanted || []).map((skill, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-purple-500/20 text-purple-600 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Bio */}
            {profile.bio && (
              <div className="glass rounded-xl p-6">
                <h3 className="text-xl font-bold text-text mb-4">About</h3>
                <p className="text-text-muted">{profile.bio}</p>
              </div>
            )}

            {/* Ratings */}
            <div className="glass rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-text mb-4">Ratings</h3>
              
              {/* Match Compatibility Rating */}
              <div>
                <p className="text-sm text-text-muted mb-2">Match Compatibility</p>
                <StarRating 
                  rating={matchData.match_score} 
                  isPercentage={true}
                  size="w-5 h-5"
                  showNumber={true}
                />
              </div>
              
              {/* Average Rating (if available) */}
              {profile.rating && profile.rating > 0 && (
                <div>
                  <p className="text-sm text-text-muted mb-2">Average Rating</p>
                  <StarRating 
                    rating={profile.rating} 
                    isPercentage={false}
                    size="w-5 h-5"
                    showNumber={true}
                  />
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-text mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                Availability
              </h3>
              <div className="flex flex-wrap gap-2">
                {(profile.availability || []).map((period, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded-full text-sm font-medium"
                  >
                    {period}
                  </span>
                ))}
              </div>
            </div>

            {/* Timezone */}
            {profile.timezone && (
              <div className="glass rounded-xl p-6">
                <h3 className="text-xl font-bold text-text mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-green-500" />
                  Timezone
                </h3>
                <p className="text-text">{profile.timezone}</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MatchDetailPage;

