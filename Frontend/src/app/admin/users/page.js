"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/lib/adminApi";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Eye, RefreshCw, AlertCircle, User as UserIcon, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProfiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers(page); // API returns profiles now
      setProfiles(data.users || []); // Data key is still 'users' for now as per backend changes
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error(err);
      setError("Failed to load profiles. Please check your connection or permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await adminService.deleteUser(deleteId); // service deletes profile
      toast({
        title: "Profile deleted",
        description: "The profile and its matches have been permanently removed.",
      });
      fetchProfiles();
    } catch (err) {
       toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to delete profile.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold tracking-tight text-text">Profile Management</h1>
           <p className="text-text-muted">View, manage, and monitor all platform profiles.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchProfiles} disabled={isLoading} className="border-accent/20 text-text hover:bg-accent/10">
           <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
           Refresh
        </Button>
      </div>

       {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="glass border-accent/20">
        <CardHeader>
           <CardTitle className="text-text">All Profiles</CardTitle>
           <CardDescription className="text-text-muted">Manage user profiles and skill data</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="w-8 h-8 animate-spin text-accent" />
             </div>
          ) : profiles.length === 0 ? (
             <div className="text-center py-8 text-text-muted">
                No profiles found.
             </div>
          ) : (
            <div className="border rounded-md border-accent/20">
            <Table>
              <TableHeader>
                <TableRow className="border-accent/20 hover:bg-accent/5">
                  <TableHead className="text-text-muted">Profile</TableHead>
                  <TableHead className="text-text-muted">Skills Offered</TableHead>
                  <TableHead className="text-text-muted">Skills Wanted</TableHead>
                  <TableHead className="text-text-muted">Metrics</TableHead>
                  <TableHead className="text-text-muted">Created</TableHead>
                  <TableHead className="text-right text-text-muted">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id} className="border-accent/20 hover:bg-accent/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 overflow-hidden">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-accent" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-text">{profile.name}</div>
                          <div className="text-xs text-text-muted">{profile.timezone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {profile.skills_offered && profile.skills_offered.length > 0 ? (
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {profile.skills_offered.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] bg-blue-100 text-blue-700">
                              {skill}
                            </Badge>
                          ))}
                          {profile.skills_offered.length > 3 && (
                            <Badge variant="outline" className="text-[10px] border-accent/20">
                              +{profile.skills_offered.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">No skills</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.skills_wanted && profile.skills_wanted.length > 0 ? (
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {profile.skills_wanted.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] bg-green-100 text-green-700">
                              {skill}
                            </Badge>
                          ))}
                          {profile.skills_wanted.length > 3 && (
                            <Badge variant="outline" className="text-[10px] border-accent/20">
                              +{profile.skills_wanted.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">No skills</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-col">
                         <div className="flex items-center gap-2">
                           <span className="text-xs font-semibold">Rating:</span>
                           <Badge variant="outline" className="text-xs border-accent/20 text-accent">{profile.rating || 0}</Badge>
                         </div>
                         {!profile.profile_completed && <Badge variant="outline" className="w-fit text-xs border-orange-500 text-orange-500">Incomplete</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-text">
                      {profile.created_at ? format(new Date(profile.created_at), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" title="View Details">
                          <Link href={`/admin/users/${profile.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50" title="Edit Profile">
                          <Link href={`/admin/users/${profile.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(profile.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
             <div className="flex items-center justify-end space-x-2 py-4">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="border-accent/20 text-text hover:bg-accent/10"
                >
                  Previous
                </Button>
                <div className="text-sm font-medium text-text">Page {page} of {totalPages}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                  className="border-accent/20 text-text hover:bg-accent/10"
                >
                  Next
                </Button>
             </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="glass border-accent/20">
          <DialogHeader>
            <DialogTitle className="text-text">Remove Profile?</DialogTitle>
            <DialogDescription className="text-text-muted">
              This action cannot be undone. This will permanently delete the profile
              and remove all associated matching data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting} className="border-accent/20 text-text hover:bg-accent/10">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
               {isDeleting && <Loader2 className="items-center mr-2 h-4 w-4 animate-spin" />}
               Remove Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
