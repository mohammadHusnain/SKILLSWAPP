'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Send,
  Search,
  MoreVertical,
  Image as ImageIcon,
  Paperclip,
  Phone,
  Video,
  Loader2,
  MessageSquare,
  Download,
  Eye,
  FileText,
  X,
  Edit2,
  Trash2,
  Check,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { tokenManager, api, messageAPI } from '@/lib/api';
import { useChat } from '@/hooks/useChat';
import StartChatModal from '@/components/messages/StartChatModal';
import { useToast } from '@/components/ui/use-toast';

const MessagesPage = () => {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [participantNames, setParticipantNames] = useState({});
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const { toast } = useToast();
  
  const {
    conversations,
    messages,
    selectedConversation,
    wsConnected,
    typingUsers,
    fetchConversations,
    sendMessage,
    sendTyping,
    editMessage,
    deleteMessage,
    selectConversation
  } = useChat();

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    // Get current user ID
    const fetchCurrentUser = async () => {
      try {
        const mongoUser = await api.get('/profile/');
        if (mongoUser.data && mongoUser.data.user_id) {
          setCurrentUserId(mongoUser.data.user_id);
        } else if (mongoUser.data && mongoUser.data._id) {
          setCurrentUserId(mongoUser.data._id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, [router]);

  // Check for conversation query parameter when conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const conversationId = params.get('conversation');
      if (conversationId) {
        const conv = conversations.find(c => 
          String(c._id) === conversationId || String(c.id) === conversationId
        );
        if (conv && (!selectedConversation || String(selectedConversation._id || selectedConversation.id) !== conversationId)) {
          selectConversation(conv);
        }
      }
    }
  }, [conversations, selectConversation, selectedConversation]);

  // Fetch participant names for conversations
  useEffect(() => {
    const fetchParticipantNames = async () => {
      const names = {};
      
      for (const conv of conversations) {
        if (!conv.participants) continue;
        
        for (const participantId of conv.participants) {
          const pid = String(participantId);
          if (pid === currentUserId || names[pid]) continue;
          
          try {
            // Try to get profile by user_id
            const profileResponse = await api.get(`/profile/${pid}/`);
            if (profileResponse.data && profileResponse.data.name) {
              names[pid] = profileResponse.data.name;
            } else {
              names[pid] = 'Unknown User';
            }
          } catch (error) {
            // If profile not found, use fallback
            names[pid] = 'Unknown User';
          }
        }
      }
      
      setParticipantNames(names);
    };
    
    if (conversations.length > 0 && currentUserId) {
      fetchParticipantNames();
    }
  }, [conversations, currentUserId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || !selectedConversation) {
      return;
    }
    
    // Send message with attachments
    const attachmentUrls = attachments.map(att => att.url);
    sendMessage(message.trim(), attachmentUrls);
    setMessage('');
    setAttachments([]);
  };

  const handleStartChat = async (user) => {
    try {
      // Create or get conversation
      const response = await api.post('/messages/conversations/create/', {
        recipient_id: user.user_id
      });
      
      const conversation = response.data.conversation;
      
      // Select the conversation
      await selectConversation(conversation);
      
      toast({
        title: 'Chat Started',
        description: `You can now chat with ${user.name}`,
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to start chat',
        variant: 'destructive',
      });
    }
  };

  const handleFilesUploaded = (uploadedFiles) => {
    setAttachments(prev => [...prev, ...uploadedFiles]);
  };

  const handleRemoveAttachment = (removedFile) => {
    setAttachments(prev => prev.filter(f => f.url !== removedFile.url));
  };

  const handleTyping = (isTyping) => {
    if (selectedConversation) {
      sendTyping(isTyping);
    }
  };

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

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants) return null;
    // Find the participant that is not the current user
    const otherParticipant = conversation.participants.find(
      p => String(p) !== String(currentUserId)
    );
    return otherParticipant || conversation.participants[0];
  };

  const getConversationName = (conversation) => {
    const otherParticipant = getOtherParticipant(conversation);
    if (!otherParticipant) return 'Unknown User';
    
    const participantId = String(otherParticipant);
    // Return cached name or fallback
    return participantNames[participantId] || `User ${participantId.substring(0, 8)}`;
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const isCurrentUserMessage = (message) => {
    if (!currentUserId || !message.sender_id) return false;
    return message.sender_id === currentUserId || String(message.sender_id) === String(currentUserId);
  };

  const handleEditMessage = (message) => {
    setEditingMessageId(message._id || message.id);
    setEditText(message.text || '');
  };

  const handleSaveEdit = () => {
    if (!editText.trim() || !editingMessageId) return;
    
    const success = editMessage(editingMessageId, editText.trim());
    if (success) {
      setEditingMessageId(null);
      setEditText('');
      toast({
        title: 'Message Updated',
        description: 'Your message has been updated',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleDeleteClick = (messageId) => {
    setDeletingMessageId(messageId);
  };

  const handleConfirmDelete = () => {
    if (!deletingMessageId) return;
    
    const success = deleteMessage(deletingMessageId);
    if (success) {
      setDeletingMessageId(null);
      toast({
        title: 'Message Deleted',
        description: 'Your message has been deleted',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const handleCancelDelete = () => {
    setDeletingMessageId(null);
  };

  return (
    <DashboardLayout>
      <div className="flex gap-6 h-[calc(100vh-180px)]">
        {/* Conversations List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-80 glass rounded-xl p-4 flex flex-col"
        >
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-text">Messages</h2>
              <Button
                onClick={() => setShowStartChatModal(true)}
                className="bg-accent hover:bg-accent-dark text-white"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Chat
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start a conversation from a match!</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isSelected = selectedConversation && 
                  (selectedConversation._id === conversation._id || 
                   selectedConversation.id === conversation.id);
                
                return (
                  <button
                    key={conversation._id || conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`
                      w-full p-4 rounded-xl transition-all text-left
                      ${isSelected
                        ? 'bg-accent/20 border border-accent/30'
                        : 'hover:bg-accent/10'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                          <User className="w-7 h-7 text-accent" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-text font-bold truncate">
                            {getConversationName(conversation)}
                          </h3>
                          {conversation.updated_at && (
                            <span className="text-xs text-text-muted">
                              {formatDate(conversation.updated_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-muted truncate">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                        {conversation.unread_counts && Object.values(conversation.unread_counts).some(count => count > 0) && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-accent rounded-full text-white text-xs">
                            {Object.values(conversation.unread_counts).reduce((a, b) => a + b, 0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Chat Window */}
        {selectedConversation ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 glass rounded-xl flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-accent/20">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-accent" />
                  </div>
                  {wsConnected && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary" />
                  )}
                </div>
                <div>
                  <h3 className="text-text font-bold">{getConversationName(selectedConversation)}</h3>
                  <p className="text-sm text-text-muted">
                    {wsConnected ? 'Online' : 'Connecting...'}
                    {Object.keys(typingUsers).length > 0 && typingUsers[Object.keys(typingUsers)[0]] && (
                      <span className="ml-2 italic">typing...</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="text-text hover:text-accent">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-text hover:text-accent">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-text hover:text-accent">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isCurrentUser = isCurrentUserMessage(msg);
                  const msgId = msg._id || msg.id;
                  const isEditing = editingMessageId === msgId;
                  const isDeleted = msg.is_deleted || msg.text === '[Message deleted]';
                  
                  return (
                    <motion.div
                      key={msgId || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`flex items-end space-x-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-accent" />
                        </div>
                        <div className={`rounded-2xl px-4 py-2 relative ${
                          isCurrentUser
                            ? 'bg-accent text-white'
                            : 'glass text-text'
                        }`}>
                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveEdit();
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  }
                                }}
                                className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSaveEdit}
                                className="h-8 w-8 text-white hover:bg-white/20"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                className="h-8 w-8 text-white hover:bg-white/20"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              {isDeleted ? (
                                <p className="text-sm italic opacity-70">{msg.text || '[Message deleted]'}</p>
                              ) : (
                                <>
                                  {msg.text && <p className="text-sm">{msg.text}</p>}
                                  {msg.is_edited && (
                                    <span className={`text-xs ${isCurrentUser ? 'text-white/60' : 'text-text-muted'}`}>
                                      (edited)
                                    </span>
                                  )}
                                </>
                              )}
                              {isCurrentUser && !isDeleted && (
                                <div className="absolute -right-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditMessage(msg)}
                                    className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/20"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(msgId)}
                                    className="h-7 w-7 text-white/70 hover:text-red-300 hover:bg-white/20"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map((attachment, attIndex) => {
                                const isImage = attachment.startsWith('/media/messages/') && 
                                  /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment);
                                const isPdf = attachment.endsWith('.pdf');
                                const isWord = /\.(doc|docx)$/i.test(attachment);
                                
                                return (
                                  <div
                                    key={attIndex}
                                    className={`flex items-center space-x-2 p-2 rounded-lg ${
                                      isCurrentUser ? 'bg-white/20' : 'bg-accent/10'
                                    }`}
                                  >
                                    {isImage ? (
                                      <>
                                        <img
                                          src={attachment}
                                          alt="Attachment"
                                          className="w-16 h-16 object-cover rounded cursor-pointer"
                                          onClick={() => window.open(attachment, '_blank')}
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => window.open(attachment, '_blank')}
                                          className="h-8 w-8"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-10 h-10 bg-accent/20 rounded flex items-center justify-center">
                                          {(isPdf || isWord) ? (
                                            <FileText className="w-5 h-5 text-accent" />
                                          ) : (
                                            <Paperclip className="w-5 h-5 text-accent" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs truncate">
                                            {attachment.split('/').pop()}
                                          </p>
                                        </div>
                                      </>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open(attachment, '_blank')}
                                      className="h-8 w-8"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <p className={`text-xs mt-1 ${
                            isCurrentUser ? 'text-white/70' : 'text-text-muted'
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                      </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-accent/20">
              {/* File Preview */}
              {attachments.length > 0 && (
                <div className="mb-2 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-2 bg-accent/10 rounded-lg"
                    >
                      {file.type && file.type.startsWith('image/') && file.url ? (
                        <img
                          src={file.url}
                          alt={file.filename}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-accent/20 rounded flex items-center justify-center">
                          <FileText className="w-6 h-6 text-accent" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text font-medium truncate">{file.filename}</p>
                        <p className="text-xs text-text-muted">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttachment(file)}
                        className="h-8 w-8 text-text-muted hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-end space-x-2">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const files = Array.from(e.target.files);
                      for (const file of files) {
                        try {
                          const response = await messageAPI.uploadFile(file);
                          handleFilesUploaded([{
                            url: response.file_url,
                            filename: file.name,
                            type: file.type,
                            size: file.size,
                          }]);
                        } catch (error) {
                          toast({
                            title: 'Upload Failed',
                            description: `Failed to upload ${file.name}`,
                            variant: 'destructive',
                          });
                        }
                      }
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                  id="file-upload-input"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-text hover:text-accent"
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping(true);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                        handleTyping(false);
                      }
                    }}
                    onBlur={() => handleTyping(false)}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  className="bg-accent hover:bg-accent-dark text-white"
                  disabled={(!message.trim() && attachments.length === 0) || !wsConnected}
                >
                  {wsConnected ? (
                    <Send className="w-5 h-5" />
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 glass rounded-xl flex items-center justify-center"
          >
            <div className="text-center text-text-muted">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Start Chat Modal */}
      <StartChatModal
        isOpen={showStartChatModal}
        onClose={() => setShowStartChatModal(false)}
        onSelectUser={handleStartChat}
      />

      {/* Delete Confirmation Dialog */}
      {deletingMessageId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-bold text-text mb-2">Delete Message</h3>
            <p className="text-text-muted mb-6">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={handleCancelDelete}
                className="text-text hover:text-text-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MessagesPage;
