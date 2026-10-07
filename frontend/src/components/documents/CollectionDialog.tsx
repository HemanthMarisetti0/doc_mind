import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Collection } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useCreateCollection, useUpdateCollection } from '@/hooks/mutations';

/** Create a collection, or edit one when `collection` is passed. */
export function CollectionDialog({
  open,
  onClose,
  collection,
}: {
  open: boolean;
  onClose: () => void;
  collection?: Collection;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const create = useCreateCollection();
  const update = useUpdateCollection();

  useEffect(() => {
    if (!open) return;
    setName(collection?.name ?? '');
    setDescription(collection?.description ?? '');
  }, [open, collection]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = { name: name.trim(), description: description.trim() || undefined };
    if (collection) update.mutate({ id: collection.id, ...body }, { onSuccess: onClose });
    else create.mutate(body, { onSuccess: onClose });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={collection ? 'Edit collection' : 'New collection'}
      description="Group related documents so you can chat with them together."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name">
          <Input
            autoFocus
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HR Policies"
          />
        </Field>
        <Field label="Description">
          <Textarea
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's in this collection? (optional)"
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending} disabled={!name.trim()}>
            {collection ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
