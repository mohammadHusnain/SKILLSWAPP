'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, tokenManager } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
const WS_URL = rawWsUrl.replace(/\/ws\/?$/, '').replace(/\/$/, '');

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
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

  // Connect to WebSocket with strict singleton pattern
  const connectWebSocket = useCallback(() => {
    if (!tokenManager.isAuthenticated()) return;

    // Prevent duplicate connections
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Connect to WebSocket
    const ws = new WebSocket(`${WS_URL}/ws/chat/notifications/?token=${token}`);
    wsRef.current = ws;

    // Heartbeat for this specific connection (managed via ref declared at top level)


    ws.onopen = () => {
      console.log('WebSocket connected for notifications');
      setWsConnected(true);
      
      // Clear any existing heartbeat
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // 30 seconds
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'pong') {
            return;
        }

        if (data.type === 'authenticated') {
           // Request missed notifications
           ws.send(JSON.stringify({
             type: 'notifications_sync',
             unread_only: true,
             limit: 50
           }));
        } else if (data.type === 'notification' || data.type === 'notification_received') {
          // New notification received
          const notification = data.notification || data; // handle both structures
          if (notification) {
              setNotifications(prev => [notification, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              toast({
                title: notification.title,
                description: notification.body,
                variant: 'default',
                duration: 5000
              });
          }
        }
        // ... (handle missed notifications sync)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Wait for close
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason);
      setWsConnected(false);
      
      // Only clear ref if it matches this socket
      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

      // Simple reconnect logic with backoff or just manual
      // Auto-reconnect if not 1000
      if (!reconnectTimeoutRef.current && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            if (tokenManager.isAuthenticated()) {
              connectWebSocket();
            }
          }, 3000);
      }
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
    };

    if (tokenManager.isAuthenticated()) {
      initialize();
      connectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
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

