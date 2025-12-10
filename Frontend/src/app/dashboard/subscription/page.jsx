'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { paymentAPI, tokenManager } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { 
  Check, 
  Sparkles, 
  Zap, 
  Crown, 
  Star, 
  Shield, 
  Search, 
  MessageSquare, 
  Bell,
  Infinity,
  TrendingUp,
  Gift
} from 'lucide-react';

export default function SubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const data = await paymentAPI.getSubscriptionStatus();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/dashboard/subscription/create');
  };

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const baseUrl = window.location.origin;
      const { url } = await paymentAPI.getCustomerPortalLink(
        `${baseUrl}/dashboard/subscription`
      );
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast({
        title: 'Error',
        description: 'Failed to open customer portal',
        variant: 'destructive',
      });
      setIsLoadingPortal(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  const isPremium = subscription?.is_premium;
  const periodEnd = subscription?.subscription?.current_period_end;

  const freeFeatures = [
    { icon: Check, text: '10 matches per month', color: 'text-green-400' },
    { icon: Check, text: 'Basic profile features', color: 'text-green-400' },
    { icon: Check, text: 'Messaging with matches', color: 'text-green-400' },
  ];

  const premiumFeatures = [
    { icon: Infinity, text: 'Unlimited matches', color: 'text-yellow-400' },
    { icon: TrendingUp, text: 'Priority recommendations', color: 'text-yellow-400' },
    { icon: Crown, text: 'Featured profile badge', color: 'text-yellow-400' },
    { icon: Search, text: 'Advanced search filters', color: 'text-yellow-400' },
    { icon: MessageSquare, text: 'Read receipts in messaging', color: 'text-yellow-400' },
    { icon: Shield, text: 'Ad-free experience', color: 'text-yellow-400' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen pb-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-12"
        >
          <div className="relative overflow-hidden rounded-2xl glass p-8 md:p-12 border border-white/10">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-8 h-8 text-accent" />
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
                  Subscription Plans
                </h1>
              </div>
              <p className="text-lg text-text-muted max-w-2xl">
                Choose the perfect plan to unlock your full potential and connect with amazing skill partners
              </p>
            </div>
          </div>
        </motion.div>

        {/* Current Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Card className="glass border-white/10 overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${isPremium ? 'from-yellow-500/20 to-orange-500/20' : 'from-blue-500/20 to-purple-500/20'}`} />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {isPremium ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Crown className="w-6 h-6 text-yellow-400" />
                      </motion.div>
                    ) : (
                      <Gift className="w-6 h-6 text-blue-400" />
                    )}
                    <CardTitle className="text-2xl">
                      {isPremium ? 'Premium Member' : 'Free Plan'}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {isPremium 
                      ? 'You have an active Premium subscription with all features unlocked'
                      : 'You are currently on the Free plan with basic features'
                    }
                  </CardDescription>
                  {periodEnd && (
                    <p className="text-sm text-text-muted mt-2">
                      {isPremium ? 'Renews on' : 'Expires on'}: {new Date(periodEnd * 1000).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  )}
                </div>
                {isPremium && (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={isLoadingPortal}
                    variant="outline"
                    className="glass border-white/20 hover:border-accent/50 transition-all"
                  >
                    {isLoadingPortal ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                      />
                    ) : null}
                    Manage Subscription
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-8 mb-12"
        >
          {/* Free Plan Card */}
          <motion.div variants={itemVariants}>
            <Card className="glass border-white/10 h-full flex flex-col hover:border-accent/30 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">Free Plan</CardTitle>
                  <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                    <span className="text-2xl font-bold text-blue-400">$0</span>
                    <span className="text-sm text-text-muted">/month</span>
                  </div>
                </div>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 flex-grow flex flex-col">
                <ul className="space-y-4 mb-6 flex-grow">
                  {freeFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className={`mt-0.5 ${feature.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-text-muted">{feature.text}</span>
                      </motion.li>
                    );
                  })}
                </ul>
                {isPremium && (
                  <div className="mt-auto pt-4 border-t border-white/10">
                    <p className="text-sm text-center text-text-muted">
                      You're currently on Premium
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Premium Plan Card */}
          <motion.div variants={itemVariants}>
            <Card className={`glass border-2 h-full flex flex-col relative overflow-hidden transition-all duration-300 group ${
              isPremium 
                ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' 
                : 'border-accent/50 hover:border-accent hover:shadow-lg hover:shadow-accent/20'
            }`}>
              {/* Premium Badge */}
              {isPremium && (
                <div className="absolute top-4 right-4 z-20">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 flex items-center gap-2"
                  >
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-400">Active</span>
                  </motion.div>
                </div>
              )}

              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <CardTitle className="text-2xl">Premium Plan</CardTitle>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <span className="text-2xl font-bold text-yellow-400">$9.99</span>
                    <span className="text-sm text-text-muted">/month</span>
                  </div>
                </div>
                <CardDescription>Unlock unlimited possibilities</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 flex-grow flex flex-col">
                <ul className="space-y-4 mb-6 flex-grow">
                  {premiumFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className={`mt-0.5 ${feature.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-text-muted">{feature.text}</span>
                      </motion.li>
                    );
                  })}
                </ul>
                {!isPremium && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-auto"
                  >
                    <Button
                      onClick={handleUpgrade}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-yellow-500/30"
                      size="lg"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Feature Comparison Section */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <Card className="glass border-white/10 overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-accent" />
                  <CardTitle className="text-2xl">Why Upgrade to Premium?</CardTitle>
                </div>
                <CardDescription>
                  Experience the full power of SkillSwap with Premium features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { icon: Infinity, title: 'Unlimited Access', desc: 'No limits on matches and connections' },
                    { icon: TrendingUp, title: 'Priority Matching', desc: 'Get matched with top-rated users first' },
                    { icon: Shield, title: 'Premium Support', desc: '24/7 priority customer support' },
                  ].map((benefit, index) => {
                    const Icon = benefit.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="p-4 rounded-lg glass border border-white/10 hover:border-accent/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6 text-accent" />
                        </div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-sm text-text-muted">{benefit.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* CTA Section */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <Card className="glass border-accent/30 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-accent/10" />
              <CardContent className="relative z-10 py-12">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <Sparkles className="w-12 h-12 text-accent" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-3">Ready to unlock Premium?</h2>
                <p className="text-text-muted mb-6 max-w-md mx-auto">
                  Join thousands of users who are already experiencing the full power of SkillSwap
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleUpgrade}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-yellow-500/30 px-8 py-6 text-lg"
                    size="lg"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Start Premium Journey - $9.99/month
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
