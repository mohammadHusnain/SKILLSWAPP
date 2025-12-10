'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  MapPin,
  Clock,
  Star,
  Edit,
  Save,
  Plus,
  X,
  Check,
  Camera,
  Globe,
  Loader2,
  FileText,
  Download,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { profileAPI, matchingAPI, tokenManager } from '@/lib/api';

const ProfilePage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    avatar: '',
    resume: '',
    resume_filename: '',
    skills_offered: [],
    skills_wanted: [],
    location: { city: '', country: '' },
    availability: [],
    timezone: 'UTC',
    rating: 0.0,
    total_matches: 0,
    total_teaching_sessions: 0,
    total_learning_sessions: 0
  });

  const [newSkill, setNewSkill] = useState({ offered: '', wanted: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  // Check authentication
  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await profileAPI.getProfile();
        
        // Fetch matches count to get accurate total matches
        let totalMatches = 0;
        try {
          const matchesResponse = await matchingAPI.getMatches({
            limit: 1000,
            offset: 0,
            min_score: 0
          });
          totalMatches = matchesResponse.stats?.total || 0;
        } catch (matchError) {
          console.error('Error fetching matches count:', matchError);
          // Fallback to profile data if matches API fails
          totalMatches = data.total_matches || 0;
        }
        
        // Transform API response to match frontend state structure
        setProfile({
          name: data.name || '',
          bio: data.bio || '',
          avatar: data.avatar_url || '',
          resume: data.resume_url || '',
          resume_filename: '', // Will be extracted from resume data
          skills_offered: data.skills_offered || [],
          skills_wanted: data.skills_wanted || [],
          location: {
            city: data.location?.city || '',
            country: data.location?.country || ''
          },
          availability: data.availability || [],
          timezone: data.timezone || 'UTC',
          rating: data.rating || 0.0,
          total_matches: totalMatches,
          total_teaching_sessions: data.total_teaching_sessions || 0,
          total_learning_sessions: data.total_learning_sessions || 0
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [toast]);

  const handleAddSkill = (type) => {
    if (newSkill[type].trim()) {
      setProfile({
        ...profile,
        [`skills_${type}`]: [...profile[`skills_${type}`], newSkill[type].trim()]
      });
      setNewSkill({ ...newSkill, [type]: '' });
    }
  };

  const handleRemoveSkill = (type, skill) => {
    setProfile({
      ...profile,
      [`skills_${type}`]: profile[`skills_${type}`].filter(s => s !== skill)
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a JPEG, PNG, GIF, or WebP image',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setAvatarPreview(base64String);
      setProfile({
        ...profile,
        avatar: base64String
      });
    };
    reader.readAsDataURL(file);
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-word'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a PDF, DOC, or DOCX file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Resume must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setResumeFile(file);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setProfile({
        ...profile,
        resume: base64String,
        resume_filename: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleResumeRemove = () => {
    setResumeFile(null);
    setProfile({
      ...profile,
      resume: '',
      resume_filename: ''
    });
  };

  const handleResumeDownload = () => {
    if (!profile.resume) return;
    
    // Create a download link
    const link = document.createElement('a');
    link.href = profile.resume;
    link.download = profile.resume_filename || 'resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Prepare profile data for API - only send fields that have values
      const profileData = {
        name: profile.name || '',
        bio: profile.bio || '',
        skills_offered: profile.skills_offered.length > 0 ? profile.skills_offered : [],
        skills_wanted: profile.skills_wanted.length > 0 ? profile.skills_wanted : [],
        location: profile.location.city && profile.location.country ? profile.location : {},
        availability: profile.availability,
        timezone: profile.timezone || 'UTC'
      };

      // Only include avatar_url if it has a value
      if (profile.avatar) {
        profileData.avatar_url = profile.avatar;
      }

      // Only include resume_url if it has a value
      if (profile.resume) {
        profileData.resume_url = profile.resume;
      }

      await profileAPI.updateProfile(profileData);

      setIsEditing(false);
      
      // Dispatch event to update topbar profile picture immediately
      window.dispatchEvent(new Event('profileUpdated'));
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Profile Management</h1>
            <p className="text-text-muted">Manage your profile and skill preferences</p>
          </div>
          <Button
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={isSaving}
            className="bg-accent hover:bg-accent-dark text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        {/* Profile Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{(profile.rating || 0).toFixed(1)}</p>
                <p className="text-sm text-text-muted">Rating</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{profile.total_matches}</p>
                <p className="text-sm text-text-muted">Total Matches</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{profile.total_teaching_sessions}</p>
                <p className="text-sm text-text-muted">Sessions Completed</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-8"
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <div className="relative">
                {profile.avatar || avatarPreview ? (
                  <img
                    src={avatarPreview || profile.avatar}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-accent/30"
                  />
                ) : (
                  <div className="w-32 h-32 bg-accent/20 rounded-full flex items-center justify-center border-4 border-accent/30">
                    <User className="w-16 h-16 text-accent" />
                  </div>
                )}
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-accent rounded-full flex items-center justify-center hover:bg-accent-dark transition-colors cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="mt-4 text-center">
                {isEditing ? (
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="text-center font-bold text-lg"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-text">{profile.name}</h2>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-6">
              {/* Basic Info */}
              <div>
                <Label className="text-text-muted mb-2 block">Bio</Label>
                {isEditing ? (
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full min-h-[100px]"
                  />
                ) : (
                  <p className="text-text">{profile.bio || 'No bio added yet.'}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-text-muted mb-2 block">Location</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="City"
                        value={profile.location.city}
                        onChange={(e) => setProfile({
                          ...profile,
                          location: { ...profile.location, city: e.target.value }
                        })}
                      />
                      <Input
                        placeholder="Country"
                        value={profile.location.country}
                        onChange={(e) => setProfile({
                          ...profile,
                          location: { ...profile.location, country: e.target.value }
                        })}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      <span className="text-text">
                        {profile.location.city && profile.location.country
                          ? `${profile.location.city}, ${profile.location.country}`
                          : 'Not specified'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-text-muted mb-2 block">Availability</Label>
                  {isEditing ? (
                    <Input
                      value={profile.availability.join(', ')}
                      onChange={(e) => setProfile({
                        ...profile,
                        availability: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      placeholder="Weekdays, Morning"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="text-text">
                        {profile.availability.length > 0 ? profile.availability.join(', ') : 'Not specified'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-text-muted mb-2 block">Timezone</Label>
                  {isEditing ? (
                    <Input
                      value={profile.timezone}
                      onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-accent" />
                      <span className="text-text">{profile.timezone}</span>
                    </div>
                  )}
                </div>

                {/* Resume Upload */}
                <div className="w-full">
                  <Label className="text-text-muted mb-2 block">Resume</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {profile.resume ? (
                        <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-accent" />
                            <span className="text-text font-medium">
                              {profile.resume_filename || 'Resume uploaded'}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={handleResumeDownload}
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={handleResumeRemove}
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-accent/30 rounded-lg cursor-pointer hover:border-accent transition-colors">
                          <FileText className="w-8 h-8 text-accent mb-2" />
                          <span className="text-text font-medium">Upload Resume</span>
                          <span className="text-sm text-text-muted">PDF, DOC, or DOCX (max 10MB)</span>
                          <input
                            type="file"
                            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleResumeChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {profile.resume ? (
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-accent" />
                          <span className="text-text font-medium">
                            {profile.resume_filename || 'Resume uploaded'}
                          </span>
                          <Button
                            onClick={handleResumeDownload}
                            variant="outline"
                            size="sm"
                            className="ml-2"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-text-muted">No resume uploaded</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skills Offered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-text mb-4">Skills I Can Teach</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {profile.skills_offered.length > 0 ? (
              profile.skills_offered.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-accent/20 px-4 py-2 rounded-full"
                >
                  <span className="text-text font-medium">{skill}</span>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveSkill('offered', skill)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-text-muted">No skills added yet.</p>
            )}
          </div>
          {isEditing && (
            <div className="flex space-x-2">
              <Input
                placeholder="Add a skill you can teach..."
                value={newSkill.offered}
                onChange={(e) => setNewSkill({ ...newSkill, offered: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill('offered')}
              />
              <Button onClick={() => handleAddSkill('offered')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>

        {/* Skills Wanted */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-text mb-4">Skills I Want to Learn</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {profile.skills_wanted.length > 0 ? (
              profile.skills_wanted.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-full"
                >
                  <span className="text-text font-medium">{skill}</span>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveSkill('wanted', skill)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-text-muted">No skills added yet.</p>
            )}
          </div>
          {isEditing && (
            <div className="flex space-x-2">
              <Input
                placeholder="Add a skill you want to learn..."
                value={newSkill.wanted}
                onChange={(e) => setNewSkill({ ...newSkill, wanted: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill('wanted')}
              />
              <Button onClick={() => handleAddSkill('wanted')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
