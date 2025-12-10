'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, tokenManager } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        skip: '0',
        unread_only: unreadOnly.toString()
      });
      const response = await api.get(`/notifications/?${params}`);
      setNotifications(response.data.notifications || []);
      return response.data.notifications || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread-count/');
      setUnreadCount(response.data.unread_count || 0);
      return response.data.unread_count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read/`);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}/`);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      // Update unread count if notification was unread
      const notification = notifications.find(n => n._id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Handle notification click - navigate to related content
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === 'new_message' && notification.related_id) {
      router.push(`/dashboard/messages?conversation=${notification.related_id}`);
    } else if (notification.type === 'session_request' || notification.type === 'session_accept') {
      router.push(`/dashboard/matches/${notification.related_id}`);
    } else if (notification.type === 'payment_success' || notification.type === 'payment_received') {
      router.push('/dashboard/payments');
    } else {
      // Default to notifications page
      router.push('/dashboard/notifications');
    }
  }, [router, markAsRead]);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!tokenManager.isAuthenticated()) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Connect to WebSocket (using chat consumer, which handles notifications)
    // We'll use a dummy conversation_id since we're only interested in notifications
    // The consumer will join the notification group on authentication
    // Using 'notifications' as conversation_id - consumer will handle it gracefully
    const ws = new WebSocket(`${WS_URL}/ws/chat/notifications/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for notifications');
      setWsConnected(true);
      
      // Authenticate
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: token
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'authenticated') {
          console.log('WebSocket authenticated');
          // Request missed notifications
          ws.send(JSON.stringify({
            type: 'notifications_sync',
            unread_only: true,
            limit: 50
          }));
        } else if (data.type === 'notification') {
          // New notification received
          const notification = data.notification;
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast
          toast({
            title: notification.title,
            description: notification.body,
            variant: 'default',
            duration: 5000
          });
        } else if (data.type === 'missed_notifications') {
          // Missed notifications on reconnect
          const missed = data.notifications || [];
          if (missed.length > 0) {
            setNotifications(prev => [...missed, ...prev]);
            setUnreadCount(prev => prev + missed.length);
          }
        } else if (data.type === 'notifications_sync') {
          // Sync response
          const synced = data.notifications || [];
          setNotifications(prev => {
            // Merge with existing, avoiding duplicates
            const existingIds = new Set(prev.map(n => n.id));
            const newNotifications = synced.filter(n => !existingIds.has(n.id));
            return [...newNotifications, ...prev];
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (tokenManager.isAuthenticated()) {
          connectWebSocket();
        }
      }, 3000);
    };
  }, [toast]);

  // Initialize: fetch notifications and connect WebSocket
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([
        fetchNotifications(),
        fetchUnreadCount()
      ]);
      setLoading(false);
      
      // Connect WebSocket
      connectWebSocket();
    };

    if (tokenManager.isAuthenticated()) {
      initialize();
    }

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchNotifications, fetchUnreadCount, connectWebSocket]);

  return {
    notifications,
    unreadCount,
    loading,
    wsConnected,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick,
    refreshNotifications: () => fetchNotifications()
  };
}

