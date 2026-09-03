import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// The backend's /api/platforms/:provider/callback route handles the actual
// token exchange server-side and redirects here on completion.
export default function OAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success('Account connected!');
    } else if (params.get('error')) {
      toast.error(decodeURIComponent(params.get('error')));
    }
    navigate('/app/accounts', { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-accent-pink" />
        <p className="text-sm text-text-secondary">Finishing connection...</p>
      </div>
    </div>
  );
}
