'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { messageAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const StartChatModal = ({ isOpen, onClose, onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      // Reset state when modal closes
      setUsers([]);
      setFilteredUsers([]);
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await messageAPI.getChatUsers();
      setUsers(response.users || []);
      setFilteredUsers(response.users || []);
      
      if (response.message) {
        setError(response.message);
      }
    } catch (err) {
      console.error('Error fetching chat users:', err);
      setError('Failed to load users. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    onSelectUser(user);
    onClose();
  };

  const getMatchColor = (percentage) => {
    if (percentage >= 80) return 'text-green-500 bg-green-500/20';
    if (percentage >= 50) return 'text-yellow-500 bg-yellow-500/20';
    return 'text-orange-500 bg-orange-500/20';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative glass rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text">Start a New Chat</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-text hover:text-accent"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-text-muted text-lg">{error}</p>
                <p className="text-text-muted text-sm mt-2">
                  {error.includes('profile') && 'Please complete your profile to start chatting'}
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                <p className="text-text-muted text-lg">
                  {searchQuery ? 'No users found' : 'No users available'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-xl p-4 hover:bg-accent/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-accent" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-text font-bold truncate">{user.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getMatchColor(user.match_percentage)}`}>
                              {user.match_percentage}% match
                            </span>
                            {user.has_existing_conversation && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-500">
                                Continue Chat
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSelectUser(user)}
                        className="bg-accent hover:bg-accent-dark text-white"
                        size="sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {user.has_existing_conversation ? 'Continue' : 'Start Chat'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StartChatModal;

