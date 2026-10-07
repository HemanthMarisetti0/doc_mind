import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Conversation } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useDeleteConversation } from '@/hooks/mutations';
import { useConversations } from '@/hooks/queries';
import { cn } from '@/lib/format';

const DAY = 86_400_000;

/** Bucket conversations like ChatGPT's sidebar: Today, Previous 7 days, Older. */
function group(conversations: Conversation[]) {
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Previous 7 days', items: [] },
    { label: 'Older', items: [] },
  ];
  for (const c of conversations) {
    const t = new Date(c.updatedAt).getTime();
    groups[t >= startOfToday ? 0 : t >= startOfToday - 7 * DAY ? 1 : 2].items.push(c);
  }
  return groups.filter((g) => g.items.length);
}

export function ConversationList({ activeId }: { activeId?: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useConversations();
  const remove = useDeleteConversation();
  const [toDelete, setToDelete] = useState<Conversation | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button className="w-full" onClick={() => navigate('/chat')}>
          <MessageSquarePlus className="h-4 w-4" /> New conversation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="mb-2 h-9" />)}
        {data?.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-ink-faint">Your conversations will appear here.</p>
        )}
        {data &&
          group(data).map((g) => (
            <div key={g.label} className="mb-4">
              <div className="px-2 pb-1 text-xs font-medium text-ink-faint">{g.label}</div>
              {g.items.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    'group flex items-center rounded-lg',
                    c.id === activeId ? 'bg-brand-soft' : 'hover:bg-subtle',
                  )}
                >
                  <Link
                    to={`/chat/${c.id}`}
                    className={cn(
                      'min-w-0 flex-1 truncate px-2.5 py-2 text-sm',
                      c.id === activeId ? 'font-medium text-brand-ink' : 'text-ink-soft',
                    )}
                    title={c.title}
                  >
                    {c.title}
                  </Link>
                  <button
                    onClick={() => setToDelete(c)}
                    className="mr-1 rounded-md p-1.5 text-ink-faint opacity-0 hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ))}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete conversation?"
        description={`"${toDelete?.title}" and all its messages will be removed.`}
        loading={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() =>
          toDelete &&
          remove.mutate(toDelete.id, {
            onSuccess: () => {
              if (toDelete.id === activeId) navigate('/chat');
              setToDelete(null);
            },
          })
        }
      />
    </div>
  );
}
