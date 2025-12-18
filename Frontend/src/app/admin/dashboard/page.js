'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, GitCompareArrows, TrendingUp, ArrowRight, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminService } from '@/lib/adminApi';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const data = await adminService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const dashboardStats = [
    { 
      label: 'Total Profiles', 
      value: stats?.total_profiles || 0, 
      icon: Users, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10', 
      link: '/admin/users' 
    },
    { 
      label: 'Active Profiles', 
      value: stats?.active_profiles || 0, 
      icon: Shield, 
      color: 'text-green-500', 
      bg: 'bg-green-500/10', 
      link: '/admin/users' 
    },
    { 
      label: 'Total Matches', 
      value: stats?.total_matches || 0, 
      icon: GitCompareArrows, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10', 
      link: '/admin/matches' 
    },
  ];

  const quickModules = [
    {
      title: 'Profile Management',
      description: 'View, manage, and moderate platform profiles',
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-cyan-500',
      stats: `${stats?.total_profiles || 0} registered profiles`
    },
    {
      title: 'Match Analytics',
      description: 'Monitor skill matching and profile connections',
      icon: GitCompareArrows,
      href: '/admin/matches',
      color: 'from-purple-500 to-indigo-500',
      stats: `${stats?.total_matches || 0} total matches`
    },
    {
      title: 'Platform Insights',
      description: 'View trends and platform statistics',
      icon: BarChart3,
      href: '/admin/dashboard',
      color: 'from-green-500 to-emerald-500',
      stats: 'Real-time analytics'
    },
  ];

  return (
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
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent-dark rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text">
                  SkillSwap Admin
                </h1>
                <p className="text-text-muted">
                  Profile-driven intelligence and management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-accent/10 border border-accent/20 rounded-lg w-fit">
              <Shield className="w-5 h-5 text-accent" />
              <span className="text-accent font-semibold">Administrator Access</span>
            </div>
          </div>
          <Button
            onClick={() => router.push('/admin/users')}
            className="bg-accent hover:bg-accent-dark text-white"
          >
            Manage Profiles
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => {
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

      {/* Top Skills Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Offered Skills */}
        {stats?.top_offered_skills && stats.top_offered_skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-text mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Most Offered Skills
            </h3>
            <div className="space-y-4">
              {stats.top_offered_skills.map((skillData, index) => {
                const percentage = stats.top_offered_skills.length > 0 
                  ? (skillData.count / stats.top_offered_skills[0].count) * 100 
                  : 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-text font-medium capitalize">{skillData.skill}</span>
                      <span className="text-text-muted text-sm">{skillData.count} profiles</span>
                    </div>
                    <div className="w-full bg-blue-500/10 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.8 + (index * 0.1), duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Most Wanted Skills */}
        {stats?.top_wanted_skills && stats.top_wanted_skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-text mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
              Most Wanted Skills
            </h3>
            <div className="space-y-4">
              {stats.top_wanted_skills.map((skillData, index) => {
                const percentage = stats.top_wanted_skills.length > 0 
                  ? (skillData.count / stats.top_wanted_skills[0].count) * 100 
                  : 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-text font-medium capitalize">{skillData.skill}</span>
                      <span className="text-text-muted text-sm">{skillData.count} profiles</span>
                    </div>
                    <div className="w-full bg-purple-500/10 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.9 + (index * 0.1), duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Platform Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="glass rounded-xl p-6"
      >
        <h3 className="text-xl font-bold text-text mb-6">Platform Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-600">System Online</span>
            </div>
            <p className="text-xs text-text-muted">All services operational</p>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">Profiles Synced</span>
            </div>
            <p className="text-xs text-text-muted">MongoDB collection reachable</p>
          </div>
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-600">Matching Engine</span>
            </div>
            <p className="text-xs text-text-muted">Profile-to-profile logic active</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboardPage;
