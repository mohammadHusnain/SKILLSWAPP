'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Settings, Shield, Heart, MessageSquare, BarChart3, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tokenManager, profileAPI, api, matchingAPI, messageAPI, notificationsAPI } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { formatDistanceToNow } from 'date-fns';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    matchesCount: 0,
    conversationsCount: 0,
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Calculate profile completion percentage
  const calculateProfileCompletion = (profileData) => {
    if (!profileData) return 0;

    const fields = [
      profileData.name?.trim() || '',
      profileData.bio?.trim() || '',
      profileData.avatar_url?.trim() || '',
      profileData.skills_offered?.length > 0 ? 1 : 0,
      profileData.skills_wanted?.length > 0 ? 1 : 0,
      profileData.location?.city?.trim() || profileData.location?.country?.trim() ? 1 : 0,
    ];

    const completedFields = fields.filter(field => field !== '' && field !== 0).length;
    const totalFields = 6;
    return Math.round((completedFields / totalFields) * 100);
  };

  // Fetch dashboard data function
  const fetchDashboardData = useCallback(async () => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }

    try {
      setIsLoading(true);

      // Fetch all required data in parallel
      const [
        userResponse, 
        profileResponse, 
        matchesResponse, 
        conversationsResponse, 
        notificationsResponse
      ] = await Promise.allSettled([
        api.get('/auth/user/'),
        profileAPI.getProfile().catch(() => null),
        matchingAPI.getMatches({ limit: 1 }), // Just to get total count
        messageAPI.getConversations(),
        notificationsAPI.getNotifications(5)  // Recent 5 notifications
      ]);

      // Set user data
      if (userResponse.status === 'fulfilled') {
        setUser(userResponse.value.data);
      }

      // Set profile data and calculate completion
      if (profileResponse.status === 'fulfilled' && profileResponse.value) {
        setProfile(profileResponse.value);
        setProfileCompletion(calculateProfileCompletion(profileResponse.value));
      } else {
        setProfile(null);
        setProfileCompletion(0);
      }

      // Update Dashboard Stats
      setDashboardStats({
        matchesCount: matchesResponse.status === 'fulfilled' ? (matchesResponse.value.pagination?.total || matchesResponse.value.total || matchesResponse.value.matches?.length || 0) : 0,
        conversationsCount: conversationsResponse.status === 'fulfilled' ? (conversationsResponse.value.conversations?.length || 0) : 0,
        recentActivity: notificationsResponse.status === 'fulfilled' ? (notificationsResponse.value.notifications || []) : []
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setUser({ name: 'User', is_verified: false });
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch data on mount and when pathname changes to dashboard (navigation back to dashboard)
  useEffect(() => {
    // Only refetch when we're on the dashboard overview page
    if (pathname === '/dashboard') {
      fetchDashboardData();
    }
  }, [pathname, fetchDashboardData]);

  // Refetch data when window gains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      // Only refetch if we're on the dashboard page
      if (pathname === '/dashboard') {
        fetchDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [pathname, fetchDashboardData]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  // Get user display name and avatar
  const userDisplayName = user?.name || profile?.name || 'User';
  const userAvatar = profile?.avatar_url || user?.avatar_url || '';
  const isEmailVerified = user?.is_verified || false;
  const skillsTeachingCount = profile?.skills_offered?.length || 0;

  const stats = [
    { label: 'Potential Matches', value: dashboardStats.matchesCount.toString(), icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10', link: '/dashboard/matches' },
    { label: 'Active Conversations', value: dashboardStats.conversationsCount.toString(), icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10', link: '/dashboard/messages' },
    { label: 'Profile Completion', value: `${profileCompletion}%`, icon: User, color: 'text-green-500', bg: 'bg-green-500/10', link: '/dashboard/profile' },
    { label: 'Skills Teaching', value: skillsTeachingCount.toString(), icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10', link: '/dashboard/profile' },
  ];

  const quickModules = [
    {
      title: 'Profile Management',
      description: 'Complete your profile, add skills, and set your availability',
      icon: User,
      href: '/dashboard/profile',
      color: 'from-blue-500 to-cyan-500',
      stats: `Profile ${profileCompletion}% complete`
    },
    {
      title: 'Skill Matching',
      description: 'Find compatible partners for skill exchange',
      icon: Heart,
      href: '/dashboard/matches',
      color: 'from-pink-500 to-rose-500',
      stats: `${dashboardStats.matchesCount} potential matches`
    },
    {
      title: 'Messaging',
      description: 'Connect and communicate with your matches',
      icon: MessageSquare,
      href: '/dashboard/messages',
      color: 'from-purple-500 to-indigo-500',
      stats: `${dashboardStats.conversationsCount} active conversations`
    },
    {
      title: 'Analytics',
      description: 'Track your progress and platform insights',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'from-green-500 to-emerald-500',
      stats: 'View stats'
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-4 mb-4">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt={userDisplayName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-accent"
                  />
                ) : (
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-accent" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-text">
                    Welcome back, {userDisplayName}!
                  </h1>
                  <p className="text-text-muted">
                    Your personalized skill exchange dashboard
                  </p>
                </div>
              </div>
              {isEmailVerified && (
                <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg w-fit">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-semibold">Email Verified</span>
                </div>
              )}
            </div>
            <Button
              onClick={() => router.push('/dashboard/profile')}
              className="bg-accent hover:bg-accent-dark text-white"
            >
              {profileCompletion < 100 ? 'Complete Profile' : 'Update Profile'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(stat.link)}
                className="glass rounded-xl p-6 cursor-pointer hover:glow-hover transition-all group"
              >
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-text mb-1">{stat.value}</h3>
                <p className="text-text-muted text-sm">{stat.label}</p>
                <div className="mt-4 flex items-center text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">View details</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quickModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 0.4) * 0.1 }}
                onClick={() => router.push(module.href)}
                className="glass rounded-xl p-6 cursor-pointer hover:glow-hover transition-all group relative overflow-hidden"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                <div className="relative">
                  <div className="flex items-start space-x-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-text mb-2">{module.title}</h3>
                      <p className="text-text-muted text-sm mb-4">{module.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-accent font-medium">{module.stats}</span>
                        <ArrowRight className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-text mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {dashboardStats.recentActivity.length > 0 ? (
              dashboardStats.recentActivity.map((activity, index) => (
                <div key={activity.id || index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-accent/5 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${activity.is_read ? 'bg-text-muted' : 'bg-accent'}`} />
                  <div className="flex-1">
                    <p className="text-text">{activity.message || activity.text}</p>
                    <p className="text-sm text-text-muted">
                      {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }) : 'Recently'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-muted">
                <p>No recent activity found.</p>
                <p className="text-sm">Start exchanging skills to see updates here!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;



