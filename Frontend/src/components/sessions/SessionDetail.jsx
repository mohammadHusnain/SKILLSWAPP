'use client';

import { Calendar, Clock, User, BookOpen, Book, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SessionStatusBadge from './SessionStatusBadge';

const SessionDetail = ({ session, userRole, onAction }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${mins} minute${mins > 1 ? 's' : ''}`;
    }
  };

  const canAccept = userRole === 'learner' && session.status === 'pending';
  const canReject = userRole === 'learner' && session.status === 'pending';
  const canComplete = session.status === 'accepted';
  const canCancel = session.status !== 'completed' && session.status !== 'cancelled';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                {userRole === 'teacher' ? (
                  <span>Teaching: <span className="text-blue-500">{session.skill_taught}</span></span>
                ) : (
                  <span>Learning: <span className="text-purple-500">{session.skill_learned}</span></span>
                )}
              </CardTitle>
              <SessionStatusBadge status={session.status} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Scheduled Date</p>
                <p className="text-sm text-muted-foreground">{formatDate(session.scheduled_date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(session.scheduled_time)} ({formatDuration(session.duration_minutes)})
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {userRole === 'teacher' ? (
                <Book className="w-5 h-5 text-muted-foreground mt-0.5" />
              ) : (
                <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {userRole === 'teacher' ? 'Skill Teaching' : 'Skill Learning'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userRole === 'teacher' ? session.skill_taught : session.skill_learned}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {userRole === 'teacher' ? (
                <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
              ) : (
                <Book className="w-5 h-5 text-muted-foreground mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {userRole === 'teacher' ? 'They\'re Learning' : 'They\'re Teaching'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userRole === 'teacher' ? session.skill_learned : session.skill_taught}
                </p>
              </div>
            </div>
          </div>

          {session.notes && (
            <div className="flex items-start gap-3 pt-4 border-t">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{session.notes}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            {canAccept && (
              <Button
                className="bg-green-500 hover:bg-green-600"
                onClick={() => onAction('accept', session._id)}
              >
                Accept Session
              </Button>
            )}
            {canReject && (
              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500/10"
                onClick={() => onAction('reject', session._id)}
              >
                Reject Session
              </Button>
            )}
            {canComplete && (
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => onAction('complete', session._id)}
              >
                Mark as Completed
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                onClick={() => onAction('cancel', session._id)}
              >
                Cancel Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionDetail;

