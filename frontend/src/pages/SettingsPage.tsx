import { useMutation } from '@tanstack/react-query';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import { usersApi } from '@/api/endpoints';
import { Avatar, Page } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/format';

export function SettingsPage() {
  const { user, setUser, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name ?? '');

  const save = useMutation({
    mutationFn: () => usersApi.update({ name: name.trim() }),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success('Profile updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  if (!user) return null;

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Settings" description="Manage your profile and preferences." />

      <Section title="Profile" description="How you appear in DocMind.">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} url={user.avatarUrl} size={56} />
            <div>
              <div className="font-medium">{user.email}</div>
              <div className="text-sm text-ink-faint">
                Signed in with {user.provider === 'GOOGLE' ? 'Google' : 'email & password'}
              </div>
            </div>
          </div>
          <Field label="Display name">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
          </Field>
          <Button type="submit" loading={save.isPending} disabled={!name.trim() || name.trim() === user.name}>
            Save changes
          </Button>
        </form>
      </Section>

      <Section title="Appearance" description="Choose a theme for this device.">
        <div className="grid grid-cols-2 gap-3 sm:w-80">
          {(
            [
              ['light', 'Light', Sun],
              ['dark', 'Dark', Moon],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'focus-ring flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium',
                theme === value ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line hover:bg-subtle',
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
          <Monitor className="h-3.5 w-3.5" /> Defaults to your system setting until you choose.
        </p>
      </Section>

      <Section title="Session" description="Sign out of DocMind on this device.">
        <Button variant="secondary" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </Section>
    </Page>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="mb-6 rounded-2xl border border-line bg-surface p-6">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-5 mt-0.5 text-sm text-ink-soft">{description}</p>
      {children}
    </section>
  );
}
