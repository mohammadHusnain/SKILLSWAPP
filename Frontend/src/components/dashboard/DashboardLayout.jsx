'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  Heart,
  MessageSquare,
  BarChart3,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Bell,
  CreditCard,
  Edit,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { tokenManager, profileAPI } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import SkillSwapLogo from '@/components/SkillSwapLogo';
import { useNotifications } from '@/hooks/useNotifications';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState({ avatar_url: '', name: '' });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const prevPathnameRef = useRef('');
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Matches', href: '/dashboard/matches', icon: Heart },
    { name: 'Sessions', href: '/dashboard/sessions', icon: BookOpen },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Subscription', href: '/dashboard/subscription', icon: CreditCard },
  ];

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const data = await profileAPI.getProfile();
        setProfile({
          avatar_url: data.avatar_url || '',
          name: data.name || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Gracefully handle error - user will see fallback icon
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (tokenManager.isAuthenticated()) {
      fetchProfile();
    }
  }, []);

  // Listen for profile update events from profile page
  useEffect(() => {
    const handleProfileUpdate = async () => {
      if (tokenManager.isAuthenticated()) {
        try {
          const data = await profileAPI.getProfile();
          setProfile({
            avatar_url: data.avatar_url || '',
            name: data.name || '',
          });
        } catch (error) {
          console.error('Error refreshing profile after update:', error);
        }
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  // Refetch profile when navigating away from profile page (fallback)
  useEffect(() => {
    const fetchProfile = async () => {
      if (tokenManager.isAuthenticated()) {
        try {
          const data = await profileAPI.getProfile();
          setProfile({
            avatar_url: data.avatar_url || '',
            name: data.name || '',
          });
        } catch (error) {
          console.error('Error refreshing profile:', error);
        }
      }
    };

    // Only refetch if we're navigating away from profile page
    if (prevPathnameRef.current === '/dashboard/profile' && pathname !== '/dashboard/profile') {
      fetchProfile();
    }
    prevPathnameRef.current = pathname;
  }, [pathname]);

  const handleLogout = () => {
    tokenManager.clearAuth();
    router.push('/login?from=logout');
  };

  const handleEditProfile = () => {
    router.push('/dashboard/profile');
  };

  const handleNotificationsClick = () => {
    router.push('/dashboard/notifications');
  };

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary-dark">
      {/* Mobile header */}
      <header className="glass border-b border-accent/20 lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <SkillSwapLogo className="h-8 w-8" />
            <span className="text-xl font-bold gradient-text">SkillSwap</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="text-text hover:text-accent"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              variant="ghost"
              size="icon"
              className="text-text hover:text-accent"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            transition-transform duration-300 ease-in-out
            w-64 glass border-r border-accent/20
            lg:translate-x-0
          `}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="hidden lg:flex items-center space-x-3 p-6 border-b border-accent/20">
              <SkillSwapLogo className="h-8 w-8" />
              <span className="text-xl font-bold gradient-text">SkillSwap</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => {
                        router.push(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                        transition-all duration-200
                        ${active
                          ? 'bg-accent/20 text-accent border border-accent/30'
                          : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  </motion.div>
                );
              })}
            </nav>

            {/* User actions */}
            <div className="p-4 space-y-2 border-t border-accent/20">
              <Button
                onClick={toggleTheme}
                variant="ghost"
                className="w-full justify-start text-text-muted hover:text-accent hover:bg-accent/10"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-5 h-5 mr-3" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5 mr-3" />
                    Dark Mode
                  </>
                )}
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop header */}
          <header className="hidden lg:flex glass border-b border-accent/20 px-8 py-4 items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text">
                {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h1>
              <p className="text-sm text-text-muted">Welcome back to SkillSwap</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-text hover:text-accent relative"
                onClick={handleNotificationsClick}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-text hover:text-accent rounded-full"
                  >
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.name || 'Profile'} 
                        className="w-8 h-8 rounded-full object-cover border-2 border-accent/30"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent/30">
                        <User className="w-5 h-5 text-accent" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-accent/20 min-w-[180px] bg-popover/95 backdrop-blur-md">
                  <DropdownMenuItem 
                    onClick={handleEditProfile}
                    className="cursor-pointer focus:bg-accent/20 text-text"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-accent/20" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

