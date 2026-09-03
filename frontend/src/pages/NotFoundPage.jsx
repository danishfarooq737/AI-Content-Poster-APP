import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-surface">
        <Compass className="h-5 w-5 text-text-secondary" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-text-primary">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to safety
      </Link>
    </div>
  );
}
