import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageLoader } from '@/components/ui/Feedback';
import { useAuth } from '@/context/AuthContext';

/** Landing page after Google OAuth; the API puts the JWT in the URL fragment. */
export function AuthCallbackPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    window.history.replaceState(null, '', window.location.pathname);
    if (!token) {
      navigate('/login?error=google', { replace: true });
      return;
    }
    signIn(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => {
        toast.error('Sign-in failed');
        navigate('/login', { replace: true });
      });
  }, [navigate, signIn]);

  return <PageLoader />;
}
