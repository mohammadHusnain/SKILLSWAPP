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
import { Loader2, RefreshCw, Calendar, Clock, User as UserIcon, BookOpen } from "lucide-react";
import Link from "next/link";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    switch(s) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'cancelled': 
      case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold tracking-tight text-text">Session Monitoring</h1>
           <p className="text-text-muted">Track and oversee interaction sessions between platform profiles.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions} disabled={isLoading} className="border-accent/20 text-text hover:bg-accent/10">
           <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
           Refresh
        </Button>
      </div>

      <Card className="glass border-accent/20">
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-text">
              <BookOpen className="w-5 h-5 text-accent" /> Recent Activity
           </CardTitle>
           <CardDescription className="text-text-muted">Overview of recent scheduled learning sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="w-8 h-8 animate-spin text-accent" />
             </div>
          ) : sessions.length === 0 ? (
             <div className="text-center py-12 text-text-muted">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                No sessions found in system records.
             </div>
          ) : (
            <div className="border rounded-xl border-accent/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-accent/20 bg-accent/5">
                  <TableHead className="text-text-muted">Skill & Topic</TableHead>
                  <TableHead className="text-text-muted">Teacher Profile</TableHead>
                  <TableHead className="text-text-muted">Learner Profile</TableHead>
                  <TableHead className="text-text-muted">Schedule</TableHead>
                  <TableHead className="text-text-muted">Duration</TableHead>
                  <TableHead className="text-right text-text-muted">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} className="border-accent/20 hover:bg-accent/5">
                    <TableCell>
                       <div className="font-bold text-text capitalize">{session.skill || "Skill Swap"}</div>
                       <div className="text-[10px] text-text-muted font-mono uppercase">ID: {session.id?.substring(0, 8)}</div>
                    </TableCell>
                    <TableCell>
                        <Link href={`/admin/users/${session.teacher_id}`} className="flex items-center gap-2 group">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 group-hover:bg-blue-200 transition-colors">
                            <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-text group-hover:text-blue-600 transition-colors underline-offset-4 hover:underline">{session.teacher_name}</span>
                        </Link>
                    </TableCell>
                    <TableCell>
                        <Link href={`/admin/users/${session.learner_id}`} className="flex items-center gap-2 group">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center border border-green-200 group-hover:bg-green-200 transition-colors">
                            <UserIcon className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-text group-hover:text-green-600 transition-colors underline-offset-4 hover:underline">{session.learner_name}</span>
                        </Link>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col text-sm text-text font-medium">
                            <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-accent" /> {session.date || "TBD"}</div>
                            <div className="text-text-muted text-xs flex items-center gap-1.5"><Clock className="w-3 h-3" /> {session.time || "No time"}</div>
                        </div>
                    </TableCell>
                     <TableCell>
                        <Badge variant="outline" className="text-xs border-accent/10 bg-accent/5 text-text-muted px-2 py-0">
                           {session.duration} min
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Badge variant="outline" className={`capitalize font-bold px-2.5 py-0.5 ${getStatusColor(session.status)}`}>
                           {session.status}
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
