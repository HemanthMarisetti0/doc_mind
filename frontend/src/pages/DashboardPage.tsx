import { ArrowRight, FileText, FolderClosed, MessageSquare, Sparkles, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '@/components/layout/AppLayout';
import { UploadDialog } from '@/components/documents/UploadDialog';
import { FileIcon, StatusBadge } from '@/components/ui/Badges';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { useAuth } from '@/context/AuthContext';
import { useConversations, useDocuments, useStats } from '@/hooks/queries';
import { timeAgo } from '@/lib/format';

export function DashboardPage() {
  const { user } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const stats = useStats();
  const documents = useDocuments();
  const conversations = useConversations();

  const recentDocs = documents.data?.slice(0, 5) ?? [];
  const recentChats = conversations.data?.slice(0, 5) ?? [];
  const firstName = user?.name.split(' ')[0];

  return (
    <Page>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-ink-faint">{greeting()}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/chat">
            <Button variant="secondary">
              <MessageSquare className="h-4 w-4" /> New chat
            </Button>
          </Link>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={FileText}
          label="Documents"
          value={stats.data?.documents}
          detail={stats.data && `${stats.data.readyDocuments} ready · ${stats.data.chunks} chunks indexed`}
          to="/documents"
        />
        <StatCard icon={FolderClosed} label="Collections" value={stats.data?.collections} to="/collections" />
        <StatCard icon={MessageSquare} label="Conversations" value={stats.data?.conversations} to="/chat" />
      </div>

      {documents.data?.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Sparkles}
            title="Start by uploading a document"
            description="DocMind will extract the text, index it with embeddings and let you ask questions about it."
            action={
              <Button onClick={() => setUploadOpen(true)}>
                <Upload className="h-4 w-4" /> Upload your first document
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Panel title="Recent documents" to="/documents" loading={documents.isLoading}>
            {recentDocs.map((doc) => (
              <Link
                key={doc.id}
                to={`/documents/${doc.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-subtle"
              >
                <FileIcon mimeType={doc.mimeType} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{doc.name}</div>
                  <div className="text-xs text-ink-faint">{timeAgo(doc.createdAt)}</div>
                </div>
                <StatusBadge status={doc.status} />
              </Link>
            ))}
          </Panel>

          <Panel title="Recent conversations" to="/chat" loading={conversations.isLoading}>
            {recentChats.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-ink-faint">No conversations yet.</p>
            )}
            {recentChats.map((c) => (
              <Link
                key={c.id}
                to={`/chat/${c.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-subtle"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.title}</div>
                  <div className="truncate text-xs text-ink-faint">
                    {c.document?.name ?? c.collection?.name ?? 'All documents'} · {timeAgo(c.updatedAt)}
                  </div>
                </div>
              </Link>
            ))}
          </Panel>
        </div>
      )}

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </Page>
  );
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  to,
}: {
  icon: LucideIcon;
  label: string;
  value?: number;
  detail?: string | false;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        <Icon className="h-4 w-4 text-ink-faint transition-colors group-hover:text-brand" />
      </div>
      {value === undefined ? (
        <Skeleton className="mt-3 h-9 w-16" />
      ) : (
        <div className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{value}</div>
      )}
      {detail && <div className="mt-1 text-xs text-ink-faint">{detail}</div>}
    </Link>
  );
}

function Panel({
  title,
  to,
  loading,
  children,
}: {
  title: string;
  to: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="font-semibold">{title}</h2>
        <Link to={to} className="flex items-center gap-1 text-sm text-ink-soft hover:text-brand">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-1">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="mx-3 my-2 h-12" />)
          : children}
      </div>
    </section>
  );
}
