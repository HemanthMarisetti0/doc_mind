import { useQuery } from '@tanstack/react-query';
import { FileText, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { API_URL } from '@/api/client';
import { authApi } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get('error')) toast.error('Google sign-in failed. Please try again.');
  }, [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { accessToken, user } = await authApi.login(form);
      await signIn(accessToken, user);
      navigate((location.state as { from?: string } | null)?.from ?? '/dashboard', { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to chat with your documents."
      footer={
        <>
          New to DocMind?{' '}
          <Link to="/register" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </Field>
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { accessToken, user } = await authApi.register(form);
      await signIn(accessToken, user);
      toast.success('Welcome to DocMind!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Upload documents and get cited answers in seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name">
          <Input
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ada Lovelace"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </Field>
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

function GoogleButton() {
  const { data } = useQuery({ queryKey: ['providers'], queryFn: authApi.providers });
  if (!data?.google) return null;
  return (
    <>
      <a
        href={`${API_URL}/auth/google`}
        className="focus-ring flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-surface text-sm font-medium hover:bg-subtle"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        Continue with Google
      </a>
      <div className="my-5 flex items-center gap-3 text-xs text-ink-faint">
        <div className="h-px flex-1 bg-line" />
        or
        <div className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mb-8 mt-1.5 text-sm text-ink-soft">{subtitle}</p>
          <GoogleButton />
          {children}
          <p className="mt-6 text-center text-sm text-ink-soft">{footer}</p>
        </div>
      </div>
      <ShowcasePanel />
    </div>
  );
}

/** Decorative preview of the product on the auth screens. */
function ShowcasePanel() {
  return (
    <div className="relative hidden overflow-hidden bg-brand lg:flex lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="relative w-full max-w-md px-8">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
          Ask your documents anything.
        </h2>
        <p className="mt-3 text-white/75">
          DocMind reads your PDFs, Word files and notes, then answers with citations you can trust.
        </p>

        <div className="mt-10 space-y-3 rounded-2xl bg-white/95 p-5 text-sm text-zinc-800 shadow-2xl">
          <div className="ml-auto w-fit rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2 text-white">
            How many remote days do we get?
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p>
                Employees can work remotely up to <b>3 days per week</b>, with manager approval for more.{' '}
                <span className="rounded bg-indigo-100 px-1 text-xs font-semibold text-indigo-700">1</span>
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-600">
                <FileText className="h-3.5 w-3.5" />
                Employee Handbook.pdf · Page 42
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
