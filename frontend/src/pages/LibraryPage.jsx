import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Library, Trash2, CalendarPlus, Pencil, Scissors, Music2, Youtube, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { contentService } from '../services/contentService';
import { platformService } from '../services/platformService';
import { scheduleService } from '../services/scheduleService';

export default function LibraryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [scheduleItem, setScheduleItem] = useState(null);

  const load = () => {
    setLoading(true);
    contentService
      .list(statusFilter ? { status: statusFilter } : {})
      .then((res) => setItems(res.data))
      .catch(() => toast.error('Could not load your content library.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content permanently?')) return;
    try {
      await contentService.remove(id);
      toast.success('Deleted');
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Content Library</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Every clip Vizard has produced, with titles, captions and hashtags already written for you.
          </p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="scheduled">Scheduled</option>
          <option value="posted">Posted</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No content yet"
          description="Clip your first video to see the results here."
          action={
            <Link to="/app/clip-studio" className="btn-primary">
              <Scissors className="h-4 w-4" />
              Open Clip Studio
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
              className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <h3 className="truncate font-medium text-text-primary">{item.title || item.topic}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="line-clamp-1 text-sm text-text-secondary">
                  {item.platformMeta?.tiktok?.caption || item.topic}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => setEditItem(item)} className="btn-ghost p-2" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                {item.status !== 'scheduled' && item.status !== 'posted' && (
                  <button onClick={() => setScheduleItem(item)} className="btn-ghost p-2" aria-label="Schedule">
                    <CalendarPlus className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => handleDelete(item._id)} className="btn-ghost p-2 hover:text-danger" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <EditModal item={editItem} onClose={() => setEditItem(null)} onSaved={load} />
      <ScheduleModal item={scheduleItem} onClose={() => setScheduleItem(null)} onScheduled={load} />
    </div>
  );
}

// Everything here is auto-filled by AI when the clip finishes - this modal is
// only for optionally tweaking what was already generated, never required.
function EditModal({ item, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [tiktokCaption, setTiktokCaption] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [ytDescription, setYtDescription] = useState('');
  const [ytTags, setYtTags] = useState('');
  const [igCaption, setIgCaption] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setTiktokCaption(item.platformMeta?.tiktok?.caption || '');
      setYtTitle(item.platformMeta?.youtube?.title || '');
      setYtDescription(item.platformMeta?.youtube?.description || '');
      setYtTags((item.platformMeta?.youtube?.tags || []).join(', '));
      setIgCaption(item.platformMeta?.instagram?.caption || '');
    }
  }, [item]);

  const save = async () => {
    setSaving(true);
    try {
      await contentService.update(item._id, {
        title,
        platformMeta: {
          tiktok: { caption: tiktokCaption },
          youtube: {
            title: ytTitle,
            description: ytDescription,
            tags: ytTags.split(',').map((t) => t.trim()).filter(Boolean),
          },
          instagram: { caption: igCaption },
        },
      });
      toast.success('Saved');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Modal open={!!item} onClose={onClose} title="Edit content" maxWidth="max-w-2xl">
      <div className="space-y-5">
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Music2 className="h-4 w-4" /> TikTok
          </p>
          <label className="label">Caption (title + hashtags)</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={tiktokCaption}
            onChange={(e) => setTiktokCaption(e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Youtube className="h-4 w-4" /> YouTube
          </p>
          <label className="label">Title</label>
          <input className="input mb-3" value={ytTitle} onChange={(e) => setYtTitle(e.target.value)} />
          <label className="label">Description</label>
          <textarea
            className="input mb-3 resize-none"
            rows={3}
            value={ytDescription}
            onChange={(e) => setYtDescription(e.target.value)}
          />
          <label className="label">Tags (comma separated)</label>
          <input className="input" value={ytTags} onChange={(e) => setYtTags(e.target.value)} />
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Instagram className="h-4 w-4" /> Instagram
          </p>
          <label className="label">Caption (title + hashtags)</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={igCaption}
            onChange={(e) => setIgCaption(e.target.value)}
          />
        </div>

        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </Modal>
  );
}

function ScheduleModal({ item, onClose, onScheduled }) {
  const [platforms, setPlatforms] = useState([]);
  const [platformId, setPlatformId] = useState('');
  const [when, setWhen] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      platformService
        .list()
        .then((res) => setPlatforms(res.data.platforms))
        .catch(() => toast.error('Could not load connected accounts.'));
    }
  }, [item]);

  const submit = async () => {
    if (!platformId || !when) {
      toast.error('Choose an account and a time.');
      return;
    }
    setSaving(true);
    try {
      await scheduleService.create({ contentId: item._id, platformId, scheduledFor: new Date(when).toISOString() });
      toast.success('Scheduled!');
      onScheduled();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scheduling failed');
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Modal open={!!item} onClose={onClose} title="Schedule post">
      {platforms.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No connected accounts"
          description="Connect a TikTok, YouTube or Instagram account before scheduling."
          action={
            <Link to="/app/accounts" className="btn-primary" onClick={onClose}>
              Connect an account
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <div>
            <label className="label">Post to</label>
            <select className="input" value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
              <option value="">Select an account</option>
              {platforms.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.provider} — {p.displayName || p.providerAccountId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date &amp; time</label>
            <input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <button onClick={submit} disabled={saving} className="btn-primary w-full">
            {saving ? 'Scheduling...' : 'Confirm schedule'}
          </button>
        </div>
      )}
    </Modal>
  );
}
