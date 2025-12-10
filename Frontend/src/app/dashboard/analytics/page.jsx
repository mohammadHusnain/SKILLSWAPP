'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Heart,
  MessageSquare,
  Star,
  Activity,
  Target,
  Award
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { tokenManager } from '@/lib/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsPage = () => {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  const stats = [
    { label: 'Total Matches', value: 12, change: '+3', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20' },
    { label: 'Messages Sent', value: 145, change: '+28', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/20' },
    { label: 'Average Rating', value: '4.8', change: '+0.2', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
    { label: 'Profile Views', value: 89, change: '+15', icon: Users, color: 'text-green-500', bg: 'bg-green-500/20' },
  ];

  const monthlyActivity = [
    { month: 'Jan', teaching: 5, learning: 3 },
    { month: 'Feb', teaching: 8, learning: 6 },
    { month: 'Mar', teaching: 12, learning: 9 },
    { month: 'Apr', teaching: 15, learning: 11 },
    { month: 'May', teaching: 10, learning: 8 },
    { month: 'Jun', teaching: 18, learning: 14 },
  ];

  const skillDistribution = [
    { name: 'JavaScript', value: 35, color: '#3a86ff' },
    { name: 'React', value: 25, color: '#ff6b9d' },
    { name: 'Python', value: 20, color: '#ffa726' },
    { name: 'Node.js', value: 20, color: '#ab47bc' },
  ];

  const matchProgress = [
    { name: 'Matched', value: 12 },
    { name: 'In Conversation', value: 8 },
    { name: 'Scheduled Sessions', value: 5 },
    { name: 'Completed', value: 3 },
  ];

  const COLORS = ['#3a86ff', '#ff6b9d', '#ffa726', '#ab47bc'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Analytics Dashboard</h1>
            <p className="text-text-muted">Track your progress and platform insights</p>
          </div>
          <div className="flex items-center space-x-2">
            {['week', 'month', 'year'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === range
                    ? 'bg-accent text-white'
                    : 'glass text-text-muted hover:text-accent hover:bg-accent/10'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

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
                className="glass rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <span className="text-green-500 font-semibold text-sm">{stat.change}</span>
                </div>
                <h3 className="text-3xl font-bold text-text mb-1">{stat.value}</h3>
                <p className="text-text-muted text-sm">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-text mb-6">Monthly Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2541" />
                <XAxis dataKey="month" stroke="#a8b2d1" />
                <YAxis stroke="#a8b2d1" />
                <Tooltip contentStyle={{ background: '#1c2541', border: '1px solid #3a86ff' }} />
                <Legend />
                <Bar dataKey="teaching" fill="#3a86ff" name="Teaching Sessions" />
                <Bar dataKey="learning" fill="#ff6b9d" name="Learning Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Skill Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-text mb-6">Skills You Teach</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={skillDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {skillDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1c2541', border: '1px solid #3a86ff' }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Match Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-text mb-6">Match Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={matchProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2541" />
              <XAxis dataKey="name" stroke="#a8b2d1" />
              <YAxis stroke="#a8b2d1" />
              <Tooltip contentStyle={{ background: '#1c2541', border: '1px solid #3a86ff' }} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3a86ff" strokeWidth={3} name="Matches" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">45</p>
                <p className="text-sm text-text-muted">Teaching Sessions</p>
              </div>
            </div>
            <div className="w-full bg-accent/20 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">32</p>
                <p className="text-sm text-text-muted">Learning Sessions</p>
              </div>
            </div>
            <div className="w-full bg-accent/20 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '53%' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">77</p>
                <p className="text-sm text-text-muted">Total Sessions</p>
              </div>
            </div>
            <div className="w-full bg-accent/20 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '64%' }} />
            </div>
          </motion.div>
        </div>

        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-text mb-6">Recent Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'First Match Made', description: 'Connected with Sarah Johnson', icon: Heart, color: 'pink' },
              { title: 'Teaching Streak', description: '5 consecutive teaching sessions', icon: Activity, color: 'purple' },
              { title: 'Perfect Rating', description: 'Earned 5-star rating from Maria', icon: Star, color: 'yellow' },
              { title: 'Skill Master', description: 'Mastered 3 new skills', icon: Target, color: 'green' },
            ].map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-4 p-4 rounded-lg bg-${achievement.color}-500/10 border border-${achievement.color}-500/20 hover:bg-${achievement.color}-500/20 transition-colors`}
                >
                  <div className={`w-12 h-12 bg-${achievement.color}-500/20 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${achievement.color}-500`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-text font-bold">{achievement.title}</h4>
                    <p className="text-sm text-text-muted">{achievement.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;

