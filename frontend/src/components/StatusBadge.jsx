const STYLES = {
  draft: 'text-text-secondary border-border',
  ready: 'text-accent-amber border-accent-amber/30 bg-accent-amber/5',
  scheduled: 'text-accent-pink border-accent-pink/30 bg-accent-pink/5',
  pending: 'text-accent-pink border-accent-pink/30 bg-accent-pink/5',
  processing: 'text-accent-amber border-accent-amber/30 bg-accent-amber/5',
  posted: 'text-success border-success/30 bg-success/5',
  failed: 'text-danger border-danger/30 bg-danger/5',
  canceled: 'text-text-muted border-border',
  connected: 'text-success border-success/30 bg-success/5',
  expired: 'text-danger border-danger/30 bg-danger/5',
  revoked: 'text-text-muted border-border',
  error: 'text-danger border-danger/30 bg-danger/5',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'text-text-secondary border-border';
  const isLive = status === 'posted' || status === 'connected';
  return (
    <span className={`badge ${style}`}>
      {isLive && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />}
      <span className="capitalize">{status}</span>
    </span>
  );
}
