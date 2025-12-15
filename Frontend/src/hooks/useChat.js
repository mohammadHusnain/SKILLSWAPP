'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, tokenManager } from '@/lib/api';

const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
const WS_URL = rawWsUrl.replace(/\/ws\/?$/, '').replace(/\/$/, '');

export function useChat(conversationId = null) {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const sentMessageIdsRef = useRef(new Set());
  const heartbeatIntervalRef = useRef(null);

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

  // useChatSocket implementation integrated
  const connectWebSocket = useCallback((convId) => {
    if (!tokenManager.isAuthenticated() || !convId) return;

    // Prevent duplicate connections or reconnection loops
    if (wsRef.current) {
        // If already connected to the same conversation, do nothing
        if (wsRef.current.url.includes(convId) && wsRef.current.readyState === WebSocket.OPEN) {
            return;
        }
        wsRef.current.close();
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Connect to WebSocket with deterministic URL
    const ws = new WebSocket(`${WS_URL}/ws/chat/${convId}/?token=${token}`);
    wsRef.current = ws;

    // Heartbeat for this specific connection (managed via ref declared at top level)


    ws.onopen = () => {
      console.log('WebSocket connected for chat');
      setWsConnected(true);
      
      // Clear any existing heartbeat
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // 30 seconds

      // Authenticate if needed (backend handles URL auth, but explicit auth doesn't hurt)
      // ws.send(JSON.stringify({ type: 'authenticate', token: token }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'pong') {
            // Heartbeat response, ignore
            return;
        }

        if (data.type === 'authenticated') {
           console.log('WebSocket authenticated');
           // Request missed messages once authenticated
           ws.send(JSON.stringify({
             type: 'get_missed_messages',
             conversation_id: convId
           }));
        } else if (data.type === 'message' || data.type === 'chat_message') {
           // Handle new message
           const message = data.message;
           setMessages(prev => {
             const existingIds = new Set(prev.map(m => m._id || m.id));
             if (!existingIds.has(message._id || message.id)) {
               return [...prev, message];
             }
             return prev;
           });

           // Update conversations list with last message
           setConversations(prev => {
             const updatedConvs = prev.map(c => {
               if ((c._id || c.id) === (message.conversation_id || convId)) {
                 return {
                   ...c,
                   last_message: message.text,
                   updated_at: message.timestamp,
                   unread_counts: c.unread_counts // You might want to increment this if it's not the current user's message
                 };
               }
               return c;
             });
             // Sort by updated_at desc
             return updatedConvs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
           });

        } else if (data.type === 'message_sent') {
            // Confirmation of own message
            const message = data.message;
            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m._id || m.id));
                // Add if not exists (optimistic updates might have added it)
                if (!existingIds.has(message._id || message.id)) {
                    return [...prev, message];
                }
                return prev;
            });

            // Update conversations list with last message
            setConversations(prev => {
              const updatedConvs = prev.map(c => {
                if ((c._id || c.id) === (message.conversation_id || convId)) {
                  return {
                    ...c,
                    last_message: message.text,
                    updated_at: message.timestamp
                  };
                }
                return c;
              });
              // Sort by updated_at desc
              return updatedConvs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            });
        }
        // ... (keep other event handlers like typing, presence, etc.)
        else if (data.type === 'typing') {
           setTypingUsers(prev => ({
             ...prev,
             [data.user_id]: data.is_typing
           }));
           if (data.is_typing) {
             setTimeout(() => {
               setTypingUsers(prev => {
                 const updated = { ...prev };
                 delete updated[data.user_id];
                 return updated;
               });
             }, 3000);
           }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Do NOT setWsConnected(false) here immediately, wait for close
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason);
      setWsConnected(false);
      
      // Only clear ref if it matches this socket
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

      // Auto-reconnect if not closed cleanly (1000) and if we still have a selected conversation
      if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
             if (tokenManager.isAuthenticated()) {
                 // Verify we still want this conversation
                 connectWebSocket(convId);
             }
          }, 3000);
      }
    };
  }, []);

  // Effect to manage connection lifecycle based on selectedConversation
  useEffect(() => {
     if (selectedConversation) {
         const convId = selectedConversation._id || selectedConversation.id;
         connectWebSocket(convId);
     }
     
     return () => {
         if (wsRef.current) {
             wsRef.current.close();
             wsRef.current = null;
         }
     };
  }, [selectedConversation, connectWebSocket]);

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

