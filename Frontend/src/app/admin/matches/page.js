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
import { Loader2, RefreshCw, GitCompareArrows, User as UserIcon } from "lucide-react";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatches, setTotalMatches] = useState(0);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getMatches(page, 10);
      setMatches(data.matches || []);
      setTotalPages(data.pages || 1);
      setTotalMatches(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold tracking-tight text-text">Profile Matches</h1>
           <p className="text-text-muted">Overview of all profile-to-profile matches. Total: {totalMatches}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setPage(1); fetchMatches(); }} disabled={isLoading} className="border-accent/20 text-text hover:bg-accent/10">
           <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
           Refresh
        </Button>
      </div>

      <Card className="glass border-accent/20">
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-text">
              <GitCompareArrows className="w-5 h-5" /> All System Matches
           </CardTitle>
           <CardDescription className="text-text-muted">Matches based on mutual intersection of skills (Page {page} of {totalPages})</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="w-8 h-8 animate-spin text-accent" />
             </div>
          ) : matches.length === 0 ? (
             <div className="text-center py-8 text-text-muted">
                No matches found.
             </div>
          ) : (
            <>
            <div className="border rounded-md border-accent/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-accent/20 bg-accent/5">
                  <TableHead className="text-text-muted">Profile A ↔ Profile B</TableHead>
                  <TableHead className="text-text-muted">Common Skills</TableHead>
                  <TableHead className="text-text-muted">Mutual Score</TableHead>
                  <TableHead className="text-right text-text-muted">Matched At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.id} className="border-accent/20 hover:bg-accent/5">
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="font-medium text-sm text-text">{match.profile_name || 'Profile 1'}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-3 border-l-2 border-accent/20 pl-4 py-1">
                          <Badge variant="outline" className="text-[10px] py-0">Mutual Match</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="font-medium text-sm text-text">{match.matched_profile_name || 'Profile 2'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {match.common_skills && match.common_skills.length > 0 ? (
                        <div className="flex gap-1 flex-wrap max-w-[250px]">
                          {match.common_skills.slice(0, 4).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] bg-purple-100 text-purple-700 capitalize">
                              {skill}
                            </Badge>
                          ))}
                          {match.common_skills.length > 4 && (
                            <Badge variant="outline" className="text-[10px] border-accent/20">
                              +{match.common_skills.length - 4}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className={match.score > 80 ? "border-green-500 text-green-500 font-bold" : match.score > 50 ? "border-blue-500 text-blue-500" : "border-accent/20"}>
                          {match.score}%
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right text-text-muted text-sm">
                      {match.created_at ? format(new Date(match.created_at), "MMM d, HH:mm") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
