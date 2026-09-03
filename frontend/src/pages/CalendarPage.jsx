import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import { CalendarClock, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { scheduleService } from '../services/scheduleService';

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Upcoming' },
  { value: 'posted', label: 'Posted' },
  { value: 'failed', label: 'Failed' },
];

export default function CalendarPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');

  const load = () => {
    setLoading(true);
    scheduleService
      .list(tab ? { status: tab } : {})
      .then((res) => setSchedules(res.data.schedules))
      .catch(() => toast.error('Could not load your schedule.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this scheduled post?')) return;
    try {
      await scheduleService.cancel(id);
      toast.success('Canceled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Broadcast Calendar</h1>
        <p className="mt-1 text-sm text-text-secondary">Everything queued, live, or wrapped up.</p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-bg-surface p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value ? 'bg-bg-raised text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nothing here yet"
          description="Schedule content from your Library to see it on the calendar."
          action={
            <Link to="/app/library" className="btn-primary">
              <Sparkles className="h-4 w-4" />
              Go to Library
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {schedules.map((s, i) => (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
              className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-bg-raised py-2">
                  <span className="font-mono text-xs text-text-secondary">
                    {format(new Date(s.scheduledFor), 'MMM')}
                  </span>
                  <span className="font-display text-lg font-semibold text-text-primary">
                    {format(new Date(s.scheduledFor), 'd')}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">{s.content?.title || 'Untitled'}</p>
                  <p className="text-xs capitalize text-text-secondary">
                    {s.platform?.provider} · {format(new Date(s.scheduledFor), 'h:mm a')}
                  </p>
                  {s.errorMessage && <p className="mt-1 text-xs text-danger">{s.errorMessage}</p>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={s.status} />
                {s.status === 'pending' && !isPast(new Date(s.scheduledFor)) && (
                  <button onClick={() => handleCancel(s._id)} className="btn-ghost p-2 hover:text-danger" aria-label="Cancel">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
