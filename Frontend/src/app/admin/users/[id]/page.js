"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService } from "@/lib/adminApi";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Trash2, Calendar, Shield, MapPin, User as UserIcon, Globe, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Edit, Save, X } from "lucide-react";

export default function ProfileDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    timezone: "",
    skills_offered: "",
    skills_wanted: "",
    rating: 0
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await adminService.getUserDetails(id);
      setData(res);
      if (res?.profile) {
        setEditForm({
          name: res.profile.name || "",
          bio: res.profile.bio || "",
          timezone: res.profile.timezone || "",
          skills_offered: res.profile.skills_offered?.join(", ") || "",
          skills_wanted: res.profile.skills_wanted?.join(", ") || "",
          rating: res.profile.rating || 0
        });
      }
    } catch (err) {
      setError("Failed to fetch profile details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await adminService.deleteUser(id);
      toast({ title: "Profile deleted successfully" });
      router.push("/admin/users");
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Failed to delete profile", 
        description: err.message 
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await adminService.updateUser(id, editForm);
      toast({ title: "Profile updated successfully" });
      setIsEditing(false);
      fetchData(); // Refresh data
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Failed to update profile", 
        description: err.message 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 glass rounded-2xl border-accent/20 mx-auto max-w-md">
        <h3 className="text-xl font-bold text-destructive mb-2">Error Loading Profile</h3>
        <p className="text-text-muted mb-6">{error || "Profile not found"}</p>
        <Button variant="outline" onClick={() => router.back()} className="border-accent/20">
          <ArrowLeft className="w-4 h-4 mr-2" /> 
          Go Back
        </Button>
      </div>
    );
  }

  const { profile } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-accent/10">
          <ArrowLeft className="w-5 h-5 text-text" />
        </Button>
        <div>
           <h1 className="text-2xl font-bold tracking-tight text-text">Profile Details</h1>
           <p className="text-text-muted">In-depth view of skills, matching logic, and profile metrics</p>
        </div>
        <div className="ml-auto flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2 border-accent/20 hover:bg-accent/10">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="gap-2 shadow-lg shadow-destructive/20">
                 <Trash2 className="w-4 h-4" />
                 Remove Profile
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isUpdating} className="gap-2 border-accent/20">
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating} className="gap-2 bg-accent hover:bg-accent-dark">
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
          {/* Header Card / Identity */}
          <Card className="md:col-span-3 glass border-accent/20 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20" />
            <CardContent className="relative pt-0 pb-6 px-8">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12">
                <div className="w-32 h-32 rounded-3xl bg-card border-4 border-background shadow-xl flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-accent" />
                  )}
                </div>
                <div className="flex-1 text-center md:text-left pb-2">
                  {isEditing ? (
                    <div className="space-y-2 max-w-sm mx-auto md:mx-0">
                      <Label htmlFor="name" className="text-xs text-text-muted">Display Name</Label>
                      <Input 
                        id="name"
                        value={editForm.name} 
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="bg-card/50 border-accent/20 focus:border-accent"
                      />
                    </div>
                  ) : (
                    <h2 className="text-3xl font-bold text-text mb-1">{profile.name}</h2>
                  )}
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-text-muted text-sm mt-2">
                    {isEditing ? (
                      <div className="w-full md:w-auto">
                        <Label htmlFor="timezone" className="text-xs text-text-muted">Timezone</Label>
                        <Input 
                          id="timezone"
                          value={editForm.timezone} 
                          onChange={(e) => setEditForm({...editForm, timezone: e.target.value})}
                          className="bg-card/50 border-accent/20 focus:border-accent h-8 text-xs"
                        />
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {profile.timezone}</span>
                    )}
                    
                    {profile.location?.city && (
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {profile.location.city}, {profile.location.country}</span>
                    )}
                    
                    {isEditing ? (
                      <div className="w-full md:w-auto">
                        <Label htmlFor="rating" className="text-xs text-text-muted">Rating</Label>
                        <Input 
                          id="rating"
                          type="number"
                          step="0.1"
                          value={editForm.rating} 
                          onChange={(e) => setEditForm({...editForm, rating: parseFloat(e.target.value)})}
                          className="bg-card/50 border-accent/20 focus:border-accent h-8 text-xs w-24"
                        />
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 font-semibold text-accent"><Star className="w-4 h-4 fill-accent" /> {profile.rating || 0} Rating</span>
                    )}
                  </div>
                </div>
                <div className="pb-2">
                  <Badge variant="outline" className="text-xs border-accent/20 px-3 py-1 bg-accent/5">
                    ID: {profile.id}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About & Bio */}
          <Card className="md:col-span-2 glass border-accent/20">
            <CardHeader>
              <CardTitle className="text-lg">About Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm">Biography</Label>
                    <Textarea 
                      id="bio"
                      value={editForm.bio} 
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="min-h-[120px] bg-card/50 border-accent/20 focus:border-accent"
                    />
                  </div>
                ) : (
                  <p className="text-text-muted leading-relaxed">
                    {profile.bio || "No biography provided for this profile."}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-accent/10">
                <div>
                  <h4 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                    Skills Offered
                  </h4>
                  {isEditing ? (
                    <Input 
                      value={editForm.skills_offered} 
                      onChange={(e) => setEditForm({...editForm, skills_offered: e.target.value})}
                      placeholder="React, Node.js, Python..."
                      className="bg-card/50 border-accent/20 focus:border-accent text-sm"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills_offered?.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-3">
                          {skill}
                        </Badge>
                      ))}
                      {(!profile.skills_offered || profile.skills_offered.length === 0) && (
                        <span className="text-sm text-text-muted italic">No skills listed</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-green-500 rounded-full" />
                    Skills Wanted
                  </h4>
                  {isEditing ? (
                    <Input 
                      value={editForm.skills_wanted} 
                      onChange={(e) => setEditForm({...editForm, skills_wanted: e.target.value})}
                      placeholder="UI Design, Marketing, SEO..."
                      className="bg-card/50 border-accent/20 focus:border-accent text-sm"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills_wanted?.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-none px-3">
                          {skill}
                        </Badge>
                      ))}
                      {(!profile.skills_wanted || profile.skills_wanted.length === 0) && (
                        <span className="text-sm text-text-muted italic">No skills listed</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="glass border-accent/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  Meta Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div>
                    <div className="text-sm font-medium text-text-muted mb-1 flex items-center gap-1.5">
                       <Calendar className="w-4 h-4" /> Profile Created
                    </div>
                    <div className="text-sm font-semibold">
                       {profile.created_at ? format(new Date(profile.created_at), "PPP p") : "Unknown"}
                    </div>
                 </div>
                 
                 <div>
                    <div className="text-sm font-medium text-text-muted mb-1">Availability</div>
                    {isEditing ? (
                      <Input 
                        value={editForm.availability} 
                        onChange={(e) => setEditForm({...editForm, availability: e.target.value})}
                        placeholder="Monday, Wednesday, Friday"
                        className="bg-card/50 border-accent/20 focus:border-accent text-xs"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {profile.availability?.length > 0 ? (
                          profile.availability.map((day, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] border-accent/20">{day}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-text-muted">No availability set</span>
                        )}
                      </div>
                    )}
                 </div>
              </CardContent>
            </Card>

            <Card className="glass border-accent/20">
               <CardHeader>
                  <CardTitle className="text-lg">Platform Engagement</CardTitle>
               </CardHeader>
               <CardContent className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-accent/5 rounded-xl border border-accent/10 flex flex-col items-center">
                     <div className="text-2xl font-bold text-accent">{profile?.stats?.matches || 0}</div>
                     <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Matches</div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex flex-col items-center">
                     <div className="text-2xl font-bold text-primary">{profile?.stats?.sessions || 0}</div>
                     <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Sessions</div>
                  </div>
               </CardContent>
            </Card>
          </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass border-accent/20">
          <DialogHeader>
            <DialogTitle className="text-text">Permanently Remove Profile?</DialogTitle>
            <DialogDescription className="text-text-muted">
              This action will hard-delete the profile for <strong>{profile.name}</strong> and all associated historical matches. This is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting} className="border-accent/20">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
               {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Delete Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
