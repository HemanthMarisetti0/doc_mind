import { useQueryClient } from '@tanstack/react-query';
import { FileText, FolderClosed, Library, PanelLeft, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { conversationsApi } from '@/api/endpoints';
import type { ChatScope, Conversation, ConversationDetail } from '@/api/types';
import { Composer } from '@/components/chat/Composer';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageBubble, ThinkingIndicator } from '@/components/chat/MessageBubble';
import { ScopePicker } from '@/components/chat/ScopePicker';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { keys, useConversation, useDocuments } from '@/hooks/queries';
import { useIsAnswering, useSendMessage } from '@/hooks/useSendMessage';

const SUGGESTIONS = [
  'Summarize the key points',
  'What are the most important dates or deadlines?',
  'List the main policies or rules mentioned',
];

export function ChatPage() {
  const { id } = useParams();
  const [panelOpen, setPanelOpen] = useState(false);
  useEffect(() => setPanelOpen(false), [id]);

  return (
    <div className="flex h-full">
      <aside className="hidden w-72 shrink-0 border-r border-line bg-surface/60 md:block">
        <ConversationList activeId={id} />
      </aside>
      {panelOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPanelOpen(false)} />
          <aside className="relative h-full w-72 border-r border-line bg-surface">
            <ConversationList activeId={id} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {id ? (
          <ConversationView key={id} id={id} onOpenPanel={() => setPanelOpen(true)} />
        ) : (
          <NewChat onOpenPanel={() => setPanelOpen(true)} />
        )}
      </div>
    </div>
  );
}

function NewChat({ onOpenPanel }: { onOpenPanel: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const send = useSendMessage();
  const { data: documents } = useDocuments();
  const [scope, setScope] = useState<ChatScope>(() => {
    const documentId = params.get('documentId');
    const collectionId = params.get('collectionId');
    return documentId ? { documentId } : collectionId ? { collectionId } : {};
  });

  const hasReadyDocs = documents?.some((d) => d.status === 'READY');

  async function start(content: string) {
    if (scope.collectionId === '' || scope.documentId === '') {
      toast.error('Pick a collection or document first');
      return false;
    }
    try {
      const conversation = await conversationsApi.create(scope);
      qc.setQueryData<ConversationDetail>(keys.conversation(conversation.id), {
        ...conversation,
        messages: [],
      });
      qc.invalidateQueries({ queryKey: keys.conversations });
      navigate(`/chat/${conversation.id}`);
      send.mutate({ conversationId: conversation.id, content });
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    }
  }

  return (
    <>
      <MobileBar onOpenPanel={onOpenPanel} title="New conversation" />
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          What would you like to know?
        </h1>
        <p className="mt-2 max-w-md text-center text-sm text-ink-soft">
          DocMind searches your documents, then answers with citations to the exact pages it used.
        </p>

        <div className="mt-8">
          <ScopePicker scope={scope} onChange={setScope} />
        </div>

        {documents && !hasReadyDocs && (
          <p className="mt-6 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            You have no processed documents yet.{' '}
            <Link to="/documents" className="font-medium underline">
              Upload one first
            </Link>
            .
          </p>
        )}

        <div className="mt-8 w-full max-w-2xl">
          <Composer onSend={start} disabled={send.isPending} autoFocus />
          <Suggestions onPick={start} />
        </div>
      </div>
    </>
  );
}

function ConversationView({ id, onOpenPanel }: { id: string; onOpenPanel: () => void }) {
  const { data, isLoading, error, refetch } = useConversation(id);
  const send = useSendMessage();
  const answering = useIsAnswering(id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [data?.messages.length, answering]);

  async function onSend(content: string) {
    try {
      await send.mutateAsync({ conversationId: id, content });
      return true;
    } catch {
      return false;
    }
  }

  if (isLoading)
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  if (error || !data)
    return (
      <div className="p-6">
        <ErrorState message={error?.message ?? 'Conversation not found'} onRetry={() => refetch()} />
      </div>
    );

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur">
        <button
          onClick={onOpenPanel}
          className="rounded-lg p-1.5 text-ink-soft hover:bg-subtle md:hidden"
          aria-label="Conversations"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate font-medium">{data.title}</h1>
        <ScopeChip conversation={data} />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
          {data.messages.length === 0 && !answering && (
            <div className="py-10 text-center text-sm text-ink-soft">
              Ask a question to get started.
              <Suggestions onPick={onSend} />
            </div>
          )}
          {data.messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {answering && <ThinkingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 bg-gradient-to-t from-canvas via-canvas to-transparent px-4 pb-4 pt-2">
        <div className="mx-auto max-w-3xl">
          <Composer onSend={onSend} disabled={answering} autoFocus />
          <p className="mt-2 text-center text-xs text-ink-faint">
            Answers are generated from your documents and may contain mistakes. Check the sources.
          </p>
        </div>
      </div>
    </>
  );
}

function ScopeChip({ conversation }: { conversation: Conversation }) {
  const { document, collection } = conversation;
  const [Icon, label, to] = document
    ? [FileText, document.name, `/documents/${document.id}`]
    : collection
      ? [FolderClosed, collection.name, `/collections/${collection.id}`]
      : [Library, 'All documents', '/documents'];
  return (
    <Link
      to={to}
      className="flex max-w-[45%] items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft hover:border-brand/40 hover:text-brand"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function Suggestions({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function MobileBar({ onOpenPanel, title }: { onOpenPanel: () => void; title: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 md:hidden">
      <button onClick={onOpenPanel} className="rounded-lg p-1.5 text-ink-soft hover:bg-subtle" aria-label="Conversations">
        <PanelLeft className="h-5 w-5" />
      </button>
      <span className="font-medium">{title}</span>
    </header>
  );
}
