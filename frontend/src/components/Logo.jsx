import { Radio } from 'lucide-react';

export default function Logo({ size = 'default' }) {
  const isSmall = size === 'small';
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-pink to-accent-amber">
        <Radio className="h-4 w-4 text-bg" strokeWidth={2.5} />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success animate-pulse-dot ring-2 ring-bg" />
      </div>
      {!isSmall && (
        <span className="font-display text-lg font-semibold tracking-tight text-text-primary">
          Viral<span className="text-accent-pink">Post</span>
        </span>
      )}
    </div>
  );
}
