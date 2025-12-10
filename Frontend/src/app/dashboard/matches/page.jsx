'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Heart,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Filter,
  Search,
  TrendingUp,
  MessageCircle,
  RefreshCw,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StarRating from '@/components/ui/StarRating';
import { useRouter } from 'next/navigation';
import { matchingAPI, tokenManager, api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const MatchesPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, new: 0, active: 0 });

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Fetch matches from API
  const fetchMatches = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const response = await matchingAPI.getMatches({
        limit: 50,
        offset: 0
      });
      
      setMatches(response.matches || []);
      setStats(response.stats || { total: 0, new: 0, active: 0 });
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err.message || 'Failed to fetch matches');
      if (showLoading) {
        toast({
          title: 'Error',
          description: 'Failed to load matches. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    fetchMatches(true); // Show loading on initial load
    
    const interval = setInterval(() => {
      fetchMatches(false); // Don't show loading on refresh
    }, 30 * 1000); // 30 seconds for real-time updates
    
    return () => clearInterval(interval);
  }, []);

  // Filter matches
  const filteredMatches = matches.filter(match => {
    const profile = match.matched_user_profile || {};
    const name = profile.name || '';
    const skillsTeaching = profile.skills_offered || [];
    const skillsWanted = profile.skills_wanted || [];
    
    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skillsTeaching.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
      skillsWanted.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedFilter === 'online') {
      // Check if user is online (last_seen within 15 minutes)
      const lastSeen = profile.last_seen;
      if (!lastSeen) return false;
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMinutes = (now - lastSeenDate) / (1000 * 60);
      return matchesSearch && diffMinutes < 15;
    }
    
    if (selectedFilter === 'high-score') {
      return matchesSearch && match.match_score >= 90;
    }
    
    return matchesSearch;
  });

  const getMatchColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getMatchBg = (score) => {
    if (score >= 90) return 'bg-green-500/20 border-green-500/30';
    if (score >= 80) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-orange-500/20 border-orange-500/30';
  };

  const handleExpressInterest = async (matchedUserId) => {
    try {
      console.log('Expressing interest for user:', matchedUserId);
      const result = await matchingAPI.expressInterest(matchedUserId);
      console.log('Express interest result:', result);
      toast({
        title: 'Success',
        description: 'Interest sent successfully!',
      });
      // Refresh matches to update interest status
      fetchMatches();
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
    }
  };

  const handleStartConversation = async (matchedUserId) => {
    try {
      // Create or get conversation
      const response = await api.post('/messages/conversations/create/', {
        recipient_id: matchedUserId
      });
      
      const conversation = response.data.conversation;
      
      // Navigate to messages page with conversation selected
      router.push(`/dashboard/messages?conversation=${conversation._id || conversation.id}`);
      
      toast({
        title: 'Conversation Started',
        description: 'You can now start messaging!',
      });
    } catch (err) {
      console.error('Error starting conversation:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };

  const isUserOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now - lastSeenDate) / (1000 * 60);
    return diffMinutes < 15;
  };

  if (loading && matches.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Skill Matches</h1>
            <p className="text-text-muted">Find compatible partners for skill exchange</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                placeholder="Search matches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" onClick={() => fetchMatches(true)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" className="border-accent text-accent">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          {[
            { label: 'All Matches', value: 'all' },
            { label: 'Online Now', value: 'online' },
            { label: 'High Score (90+)', value: 'high-score' },
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setSelectedFilter(filter.value)}
              className={`
                px-6 py-2 rounded-full font-medium transition-all whitespace-nowrap
                ${selectedFilter === filter.value
                  ? 'bg-accent text-white'
                  : 'glass text-text-muted hover:text-accent hover:bg-accent/10'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <span className="text-3xl font-bold text-text">{stats.total}</span>
            </div>
            <p className="text-text-muted text-sm">Total Matches</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-3xl font-bold text-text">{stats.new}</span>
            </div>
            <p className="text-text-muted text-sm">New Matches</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-3xl font-bold text-text">{stats.active}</span>
            </div>
            <p className="text-text-muted text-sm">Active Conversations</p>
          </motion.div>
        </div>

        {/* Error State */}
        {error && (
          <div className="glass rounded-xl p-6 bg-red-500/20 border-red-500/30">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMatches.length === 0 && (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-text-muted text-lg">No matches found</p>
            <p className="text-text-muted text-sm mt-2">
              {searchTerm ? 'Try adjusting your search or filters' : 'Complete your profile to see matches'}
            </p>
          </div>
        )}

        {/* Matches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMatches.map((match, index) => {
            const profile = match.matched_user_profile || {};
            const online = isUserOnline(profile.last_seen);
            
            return (
              <motion.div
                key={match.matched_user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 hover:glow-hover transition-all group relative overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-accent" />
                        </div>
                        {online && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text">{profile.name || 'Unknown'}</h3>
                        <div className="flex items-center space-x-2 text-sm text-text-muted">
                          <MapPin className="w-3 h-3" />
                          <span>{profile.location?.city ? `${profile.location.city}, ${profile.location.country}` : 'Location not set'}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full border ${getMatchBg(match.match_score)}`}>
                      <span className={`text-sm font-bold ${getMatchColor(match.match_score)}`}>
                        {Math.round(match.match_score)}%
                      </span>
                    </div>
                  </div>

                  {/* Match Compatibility Star Rating */}
                  <div className="mb-4 space-y-2">
                    <div>
                      <p className="text-xs text-text-muted mb-1">Match Compatibility</p>
                      <StarRating 
                        rating={match.match_score} 
                        isPercentage={true}
                        size="w-4 h-4"
                        showNumber={true}
                      />
                    </div>
                    {/* Average Rating (if available) */}
                    {profile.rating && profile.rating > 0 && (
                      <div>
                        <p className="text-xs text-text-muted mb-1">Average Rating</p>
                        <StarRating 
                          rating={profile.rating} 
                          isPercentage={false}
                          size="w-4 h-4"
                          showNumber={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* Skills Teaching */}
                  <div className="mb-4">
                    <p className="text-sm text-text-muted mb-2">Can Teach</p>
                    <div className="flex flex-wrap gap-2">
                      {(profile.skills_offered || []).slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-pink-500/20 text-pink-600 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {(profile.skills_offered || []).length > 3 && (
                        <span className="px-3 py-1 bg-gray-500/20 text-gray-500 rounded-full text-xs font-medium">
                          +{(profile.skills_offered || []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills Wanted */}
                  <div className="mb-4">
                    <p className="text-sm text-text-muted mb-2">Wants to Learn</p>
                    <div className="flex flex-wrap gap-2">
                      {(profile.skills_wanted || []).slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-purple-500/20 text-purple-600 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {(profile.skills_wanted || []).length > 3 && (
                        <span className="px-3 py-1 bg-gray-500/20 text-gray-500 rounded-full text-xs font-medium">
                          +{(profile.skills_wanted || []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="flex items-center space-x-2 text-sm text-text-muted mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{profile.availability?.join(', ') || 'Not specified'}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      className="flex-1 bg-accent hover:bg-accent-dark text-white"
                      onClick={() => router.push(`/dashboard/matches/${match.matched_user_id}`)}
                    >
                      View Profile
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    {match.interest_status === 'accepted' || match.interest_status === 'mutual' ? (
                      <>
                        <Button
                          variant="outline"
                          className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                          onClick={() => router.push(`/dashboard/sessions/create?learner_id=${match.matched_user_id}`)}
                          title="Create Session"
                        >
                          <BookOpen className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                          onClick={() => handleStartConversation(match.matched_user_id)}
                          title="Start Conversation"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        className={`border-accent text-accent hover:bg-accent hover:text-white ${
                          match.interest_status === 'pending' ? 'opacity-50' : ''
                        }`}
                        onClick={() => handleExpressInterest(match.matched_user_id)}
                        disabled={match.interest_status === 'pending'}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MatchesPage;
