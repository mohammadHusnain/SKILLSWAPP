'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, User, BookOpen, Book } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SessionStatusBadge from './SessionStatusBadge';
import { useRouter } from 'next/navigation';

const SessionCard = ({ session, userRole, onAction }) => {
  const router = useRouter();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
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

  const getOtherUserInfo = () => {
    // This will be populated from the session data when we fetch it with user details
    return {
      name: 'User',
      avatar: null,
    };
  };

  const canAccept = userRole === 'learner' && session.status === 'pending';
  const canReject = userRole === 'learner' && session.status === 'pending';
  const canComplete = session.status === 'accepted';
  const canCancel = session.status !== 'completed' && session.status !== 'cancelled';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(`/dashboard/sessions/${session._id}`)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">
                {userRole === 'teacher' ? (
                  <span>Teaching: <span className="text-blue-500">{session.skill_taught}</span></span>
                ) : (
                  <span>Learning: <span className="text-purple-500">{session.skill_learned}</span></span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {userRole === 'teacher' ? (
                  <>
                    <Book className="w-4 h-4" />
                    <span>Teaching {session.skill_taught} to learner</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Learning {session.skill_learned} from teacher</span>
                  </>
                )}
              </div>
            </div>
            <SessionStatusBadge status={session.status} />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{formatDate(session.scheduled_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{formatTime(session.scheduled_time)}</span>
              <span className="text-muted-foreground">({session.duration_minutes} min)</span>
            </div>
            {session.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {session.notes}
              </p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-2">
          {canAccept && (
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600"
              onClick={(e) => {
                e.stopPropagation();
                onAction('accept', session._id);
              }}
            >
              Accept
            </Button>
          )}
          {canReject && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onAction('reject', session._id);
              }}
            >
              Reject
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                onAction('complete', session._id);
              }}
            >
              Mark Complete
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onAction('cancel', session._id);
              }}
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/sessions/${session._id}`);
            }}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default SessionCard;

