'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  Check,
  Trash2,
  MessageSquare,
  CreditCard,
  Heart,
  X,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useNotifications } from '@/hooks/useNotifications';
import { tokenManager, api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const notificationIcons = {
  new_message: MessageSquare,
  payment_success: CreditCard,
  payment_received: CreditCard,
  subscription_updated: CreditCard,
  session_request: Heart,
  session_accept: Heart,
  session_reject: Heart,
};

const notificationColors = {
  new_message: 'bg-blue-500/20 text-blue-500',
  payment_success: 'bg-green-500/20 text-green-500',
  payment_received: 'bg-green-500/20 text-green-500',
  subscription_updated: 'bg-purple-500/20 text-purple-500',
  session_request: 'bg-pink-500/20 text-pink-500',
  session_accept: 'bg-green-500/20 text-green-500',
  session_reject: 'bg-red-500/20 text-red-500',
};

const NotificationsPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick,
    refreshNotifications
  } = useNotifications();

  const handleStartChat = async (e, recipientId) => {
    e.stopPropagation(); // Prevent notification click
    try {
      // Create or get conversation
      const response = await api.post('/messages/conversations/create/', {
        recipient_id: recipientId
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

  if (!tokenManager.isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'read') return notif.is_read;
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Notifications</h1>
              <p className="text-text-muted">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                className="bg-accent hover:bg-accent-dark text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-accent/20' : ''}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
              className={filter === 'unread' ? 'bg-accent/20' : ''}
            >
              Unread ({notifications.filter(n => !n.is_read).length})
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('read')}
              className={filter === 'read' ? 'bg-accent/20' : ''}
            >
              Read
            </Button>
          </div>
        </motion.div>

        {/* Notifications List */}
        {loading ? (
          <div className="glass rounded-xl p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            <p className="text-text-muted mt-4">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-12 text-center"
          >
            <Bell className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
            <p className="text-text-muted text-lg">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filteredNotifications.map((notification, index) => {
              const Icon = notificationIcons[notification.type] || Bell;
              const colorClass = notificationColors[notification.type] || 'bg-accent/20 text-accent';

              return (
                <motion.div
                  key={notification._id || notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    glass rounded-xl p-4 cursor-pointer transition-all
                    ${!notification.is_read ? 'border-l-4 border-accent' : ''}
                    hover:bg-accent/10
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`font-bold text-text ${!notification.is_read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-text-muted hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id || notification.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-text-muted flex-1">{notification.body}</p>
                        {notification.type === 'session_request' && notification.related_id && (
                          <Button
                            variant="default"
                            size="sm"
                            className="ml-3 bg-accent hover:bg-accent-dark text-white"
                            onClick={(e) => handleStartChat(e, notification.related_id)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                          {formatDate(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id || notification.id);
                            }}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;

