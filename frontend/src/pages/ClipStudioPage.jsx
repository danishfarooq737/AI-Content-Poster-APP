import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Scissors, Loader2, AlertTriangle, CheckCircle2, Clock, Film } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import { contentService } from '../services/contentService';

const STATUS_META = {
  queued: { label: 'Queued', color: 'text-text-secondary', icon: Clock },
  processing: { label: 'Clipping in progress...', color: 'text-accent-amber', icon: Loader2 },
  ready: { label: 'Ready', color: 'text-success', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-danger', icon: AlertTriangle },
};

export default function ClipStudioPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [configured, setConfigured] = useState(true);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const pollRef = useRef(null);
  const navigate = useNavigate();

  const loadJobs = () => {
    contentService
      .listClipJobs()
      .then((res) => setJobs(res.data.jobs))
      .catch(() => toast.error('Could not load your clip jobs.'))
      .finally(() => setLoadingJobs(false));
  };

  useEffect(() => {
    contentService
      .clipSupported()
      .then((res) => setConfigured(res.data.configured))
      .catch(() => setConfigured(false))
      .finally(() => setCheckingConfig(false));

    loadJobs();

    // Poll while any job is still in progress, so the UI updates itself
    // without a manual refresh once the background worker finishes clipping.
    pollRef.current = setInterval(() => {
      setJobs((current) => {
        const hasActive = current.some((j) => j.status === 'queued' || j.status === 'processing');
        if (hasActive) loadJobs();
        return current;
      });
    }, 6000);

    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await contentService.startClip(values.videoUrl);
      toast.success('Clip job started - check back in a few minutes');
      reset();
      loadJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start clipping.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Clip Studio</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Paste a link to a long-form video and AI (via Vizard.ai) will find and cut the best short, vertical
          clips automatically. Finished clips land in your Library, ready to schedule and auto-post.
        </p>
      </div>

      {!checkingConfig && !configured && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Vizard.ai isn&apos;t configured on this server yet. Add <code className="font-mono">VIZARD_API_KEY</code> to
            .env to enable clipping.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card mb-8">
        <label className="label" htmlFor="videoUrl">
          Source video URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="videoUrl"
            className="input flex-1"
            placeholder="https://www.youtube.com/watch?v=..."
            {...register('videoUrl', { required: 'Paste a video link to clip' })}
          />
          <button type="submit" disabled={submitting || !configured} className="btn-primary sm:w-auto">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
            {submitting ? 'Starting...' : 'Clip it'}
          </button>
        </div>
        {errors.videoUrl && <p className="mt-1.5 text-xs text-danger">{errors.videoUrl.message}</p>}
        <p className="mt-2 text-xs text-text-secondary">The source video must be publicly viewable at this URL.</p>
      </form>

      <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Your clip jobs</h2>
      {loadingJobs ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No clip jobs yet"
          description="Paste a video link above to generate your first set of clips."
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => {
            const meta = STATUS_META[job.status] || STATUS_META.queued;
            const Icon = meta.icon;
            return (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                className="card"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm text-text-primary" title={job.sourceVideoUrl}>
                    {job.sourceVideoUrl}
                  </p>
                  <span className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${meta.color}`}>
                    <Icon className={`h-3.5 w-3.5 ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                    {meta.label}
                  </span>
                </div>
                {job.status === 'failed' && job.error && (
                  <p className="mt-2 text-xs text-danger">{job.error}</p>
                )}
                {job.status === 'ready' && job.resultContentIds?.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <span className="text-xs text-text-secondary">
                      {job.resultContentIds.length} clip{job.resultContentIds.length > 1 ? 's' : ''} ready
                    </span>
                    <button onClick={() => navigate('/app/library')} className="btn-secondary ml-auto py-1.5 text-xs">
                      View in Library
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
