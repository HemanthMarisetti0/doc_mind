import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { conversationsApi } from '@/api/endpoints';
import type { ConversationDetail, Message } from '@/api/types';
import { keys } from './queries';

interface Vars {
  conversationId: string;
  content: string;
}

const MUTATION_KEY = ['send-message'];

/**
 * Sends a chat message with an optimistic user bubble. Pending state lives in the
 * React Query cache so it survives the /chat → /chat/:id navigation.
 */
export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: ({ conversationId, content }: Vars) => conversationsApi.send(conversationId, content),
    onMutate: ({ conversationId, content }) => {
      const tempId = `temp-${Date.now()}`;
      const temp: Message = {
        id: tempId,
        conversationId,
        role: 'USER',
        content,
        sources: null,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<ConversationDetail>(keys.conversation(conversationId), (old) =>
        old ? { ...old, messages: [...old.messages, temp] } : old,
      );
      return { tempId };
    },
    onSuccess: ({ userMessage, assistantMessage }, { conversationId }, ctx) => {
      qc.setQueryData<ConversationDetail>(keys.conversation(conversationId), (old) =>
        old
          ? {
              ...old,
              messages: [
                ...old.messages.filter((m) => m.id !== ctx?.tempId),
                userMessage,
                assistantMessage,
              ],
            }
          : old,
      );
      qc.invalidateQueries({ queryKey: keys.conversation(conversationId) });
      qc.invalidateQueries({ queryKey: keys.conversations });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
    onError: (err: Error, { conversationId }, ctx) => {
      qc.setQueryData<ConversationDetail>(keys.conversation(conversationId), (old) =>
        old ? { ...old, messages: old.messages.filter((m) => m.id !== ctx?.tempId) } : old,
      );
      toast.error(err.message);
    },
  });
}

/** True while a message to this conversation is waiting for the AI's answer. */
export function useIsAnswering(conversationId?: string) {
  const pending = useMutationState({
    filters: { mutationKey: MUTATION_KEY, status: 'pending' },
    select: (m) => (m.state.variables as Vars | undefined)?.conversationId,
  });
  return Boolean(conversationId && pending.includes(conversationId));
}
