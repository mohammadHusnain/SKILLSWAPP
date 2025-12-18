'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GitCompareArrows,
  Calendar,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminTokenManager } from '@/lib/adminApi';
import { useTheme } from '@/contexts/ThemeContext';
import SkillSwapLogo from '@/components/SkillSwapLogo';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Matches', href: '/admin/matches', icon: GitCompareArrows },
    { name: 'Sessions', href: '/admin/sessions', icon: Calendar },
  ];

  const handleLogout = () => {
    adminTokenManager.removeToken();
    router.push('/login');
  };

  const isActive = (href) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
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
            <span className="text-xl font-bold gradient-text">SkillSwap Admin</span>
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
              <div>
                <span className="text-xl font-bold gradient-text block">SkillSwap</span>
                <span className="text-xs text-text-muted">Admin Panel</span>
              </div>
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
                onClick={() => setShowLogoutDialog(true)}
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
                {navigation.find(item => isActive(item.href))?.name || 'Admin Dashboard'}
              </h1>
              <p className="text-sm text-text-muted">Manage and monitor SkillSwap platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-accent/10 border border-accent/20 rounded-lg">
                <Shield className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">Admin</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="glass border-accent/20">
          <DialogHeader>
            <DialogTitle className="text-text">Confirm Logout</DialogTitle>
            <DialogDescription className="text-text-muted">
              Are you sure you want to logout from the admin panel? You'll need to login again to access admin features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowLogoutDialog(false)}
              className="border-accent/20 text-text hover:bg-accent/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLayout;
