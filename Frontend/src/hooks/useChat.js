'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, tokenManager } from '@/lib/api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function useChat(conversationId = null) {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const sentMessageIdsRef = useRef(new Set());

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/messages/conversations/');
      const convs = response.data.conversations || [];
      setConversations(convs);
      return convs;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (convId, limit = 50) => {
    try {
      const response = await api.get(`/messages/conversations/${convId}/messages/?limit=${limit}`);
      const msgs = response.data.messages || [];
      setMessages(msgs);
      return msgs;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback((convId) => {
    if (!tokenManager.isAuthenticated() || !convId) {
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

    // Connect to WebSocket
    const ws = new WebSocket(`${WS_URL}/ws/chat/${convId}/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for chat');
      setWsConnected(true);
      
      // Authenticate if needed
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
          // Request missed messages
          ws.send(JSON.stringify({
            type: 'get_missed_messages',
            conversation_id: convId
          }));
        } else if (data.type === 'message' || data.type === 'message_sent') {
          // New message received (from other user) or confirmation (from self)
          const message = data.message;
          const msgId = message._id || message.id;
          
          // Deduplicate
          if (!sentMessageIdsRef.current.has(msgId)) {
            sentMessageIdsRef.current.add(msgId);
            setMessages(prev => {
              // Check if message already exists
              const existingIds = new Set(prev.map(m => m._id || m.id));
              if (!existingIds.has(msgId)) {
                return [...prev, message];
              }
              return prev;
            });
          }
        } else if (data.type === 'messages' || data.type === 'missed_messages') {
          // Batch of messages (missed messages)
          const msgs = data.messages || [];
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m._id || m.id));
            const newMessages = msgs.filter(m => {
              const id = m._id || m.id;
              if (!existingIds.has(id) && !sentMessageIdsRef.current.has(id)) {
                sentMessageIdsRef.current.add(id);
                return true;
              }
              return false;
            });
            return [...prev, ...newMessages];
          });
        } else if (data.type === 'typing') {
          // Typing indicator
          setTypingUsers(prev => ({
            ...prev,
            [data.user_id]: data.is_typing
          }));
          
          // Clear typing after 3 seconds
          if (data.is_typing) {
            setTimeout(() => {
              setTypingUsers(prev => {
                const updated = { ...prev };
                delete updated[data.user_id];
                return updated;
              });
            }, 3000);
          }
        } else if (data.type === 'presence') {
          // User online/offline status
          // Update conversation online status if needed
        } else if (data.type === 'message_edited') {
          // Message was edited
          const message = data.message;
          const msgId = message._id || message.id;
          setMessages(prev => prev.map(m => {
            const id = m._id || m.id;
            if (id === msgId) {
              return { ...m, ...message, is_edited: true };
            }
            return m;
          }));
        } else if (data.type === 'message_deleted') {
          // Message was deleted
          const message = data.message;
          const msgId = message._id || message.id;
          setMessages(prev => prev.map(m => {
            const id = m._id || m.id;
            if (id === msgId) {
              return { ...m, ...message, is_deleted: true };
            }
            return m;
          }));
        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.error);
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
        if (tokenManager.isAuthenticated() && convId) {
          connectWebSocket(convId);
        }
      }, 3000);
    };
  }, []);

  // Send message via WebSocket
  const sendMessage = useCallback((text, attachments = []) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    if (!selectedConversation) {
      console.error('No conversation selected');
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        conversation_id: selectedConversation._id || selectedConversation.id,
        text: text,
        attachments: attachments
      }));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [selectedConversation]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!selectedConversation) {
      return;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        conversation_id: selectedConversation._id || selectedConversation.id,
        is_typing: isTyping
      }));
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [selectedConversation]);

  // Edit message via WebSocket
  const editMessage = useCallback((messageId, newText) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    if (!selectedConversation) {
      console.error('No conversation selected');
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'edit_message',
        message_id: messageId,
        text: newText
      }));
      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    }
  }, [selectedConversation]);

  // Delete message via WebSocket
  const deleteMessage = useCallback((messageId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    if (!selectedConversation) {
      console.error('No conversation selected');
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'delete_message',
        message_id: messageId
      }));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }, [selectedConversation]);

  // Select conversation
  const selectConversation = useCallback(async (conversation) => {
    setSelectedConversation(conversation);
    const convId = conversation._id || conversation.id;
    
    // Fetch messages
    await fetchMessages(convId);
    
    // Connect WebSocket
    connectWebSocket(convId);
    
    // Mark messages as read
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'read_receipt',
        conversation_id: convId
      }));
    }
  }, [fetchMessages, connectWebSocket]);

  // Initialize: fetch conversations
  useEffect(() => {
    if (tokenManager.isAuthenticated()) {
      fetchConversations();
    }
  }, [fetchConversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    conversations,
    messages,
    selectedConversation,
    wsConnected,
    typingUsers,
    fetchConversations,
    fetchMessages,
    sendMessage,
    sendTyping,
    editMessage,
    deleteMessage,
    selectConversation,
    setSelectedConversation
  };
}

