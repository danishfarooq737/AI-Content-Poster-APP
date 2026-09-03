export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent-pink" />
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}
