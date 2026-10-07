import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';

export function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <Logo withText={false} />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-ink-soft">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="text-sm font-medium text-brand hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
