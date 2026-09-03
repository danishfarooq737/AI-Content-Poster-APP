import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CalendarClock, CheckCircle2, AlertCircle, Share2, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import StatCard from '../components/StatCard';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { dashboardService } from '../services/adminService';
import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let mounted = true;
    dashboardService
      .get()
      .then((res) => mounted && setData(res.data))
      .catch(() => mounted && setError('Could not load your dashboard right now.'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Here&apos;s what&apos;s on air and what&apos;s coming up.</p>
        </div>
        <Link to="/app/clip-studio" className="btn-primary">
          <Scissors className="h-4 w-4" />
          Clip a video
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard index={0} label="Drafts" value={data.stats.draftCount} icon={FileText} />
          <StatCard index={1} label="Scheduled" value={data.stats.scheduledCount} icon={CalendarClock} accent />
          <StatCard index={2} label="Posted" value={data.stats.postedCount} icon={CheckCircle2} />
          <StatCard index={3} label="Failed" value={data.stats.failedCount} icon={AlertCircle} />
          <StatCard index={4} label="Accounts" value={data.stats.connectedPlatforms} icon={Share2} />
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Up next</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : data.upcoming?.length ? (
          <div className="card divide-y divide-border p-0">
            {data.upcoming.map((s) => (
              <div key={s._id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {s.content?.title || 'Untitled content'}
                  </p>
                  <p className="text-xs text-text-secondary capitalize">
                    {s.platform?.provider} · {s.platform?.displayName || 'Connected account'}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-text-secondary">
                  {format(new Date(s.scheduledFor), 'MMM d, h:mm a')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarClock}
            title="Nothing scheduled yet"
            description="Clip a video, then schedule the result to a connected account."
            action={
              <Link to="/app/clip-studio" className="btn-primary">
                <Scissors className="h-4 w-4" />
                Go to Clip Studio
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
