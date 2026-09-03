import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen">
      {/* Left: form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10">
            <Logo />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <h1 className="font-display text-2xl font-semibold text-text-primary">{title}</h1>
            <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </motion.div>
          <div className="mt-10 flex justify-center gap-4 text-xs text-text-muted">
            <Link to="/privacy" className="hover:text-text-secondary hover:underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-text-secondary hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Right: broadcast-console visual */}
      <div className="relative hidden w-1/2 overflow-hidden bg-bg-surface lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,61,129,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,176,32,0.12),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-center px-16">
          <div className="mb-6 flex items-center gap-2 text-xs font-mono text-accent-pink">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-pink animate-pulse-dot" />
            ON AIR
          </div>
          <h2 className="max-w-md font-display text-3xl font-semibold leading-tight text-text-primary">
            Turn one idea into a week of scheduled content.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-text-secondary">
            AI-generated hooks, scripts and captions — queued across TikTok, YouTube and Instagram from a single
            broadcast calendar.
          </p>
          <div className="mt-10 grid max-w-sm grid-cols-3 gap-3">
            {['tiktok', 'youtube', 'instagram'].map((p) => (
              <div key={p} className="rounded-lg border border-border bg-bg/60 px-3 py-3 text-center backdrop-blur">
                <span className="text-xs font-mono capitalize text-text-secondary">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
