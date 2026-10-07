import { CheckCircle2, FileUp, Loader2, UploadCloud, X, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useUploadDocument } from '@/hooks/mutations';
import { useCollections } from '@/hooks/queries';
import { ACCEPTED_FILES, MAX_FILE_MB, cn, formatBytes } from '@/lib/format';

type ItemState = 'pending' | 'uploading' | 'done' | 'error';
interface Item {
  file: File;
  state: ItemState;
  error?: string;
}

const EXTENSIONS = ACCEPTED_FILES.split(',');

function validate(file: File) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!EXTENSIONS.includes(ext)) return 'Only PDF, DOCX and TXT files are supported';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Larger than ${MAX_FILE_MB} MB`;
  if (file.size === 0) return 'File is empty';
  return undefined;
}

export function UploadDialog({
  open,
  onClose,
  defaultCollectionId,
}: {
  open: boolean;
  onClose: () => void;
  defaultCollectionId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [collectionId, setCollectionId] = useState(defaultCollectionId ?? '');
  const { data: collections } = useCollections();
  const upload = useUploadDocument();

  const busy = items.some((i) => i.state === 'uploading');
  const pending = items.filter((i) => i.state === 'pending');
  const finished = items.length > 0 && items.every((i) => i.state === 'done' || i.state === 'error');

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).map((file): Item => {
      const error = validate(file);
      return { file, state: error ? 'error' : 'pending', error };
    });
    setItems((prev) => [...prev, ...next]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  async function uploadAll() {
    for (const item of pending) {
      setItems((prev) => prev.map((i) => (i.file === item.file ? { ...i, state: 'uploading' } : i)));
      try {
        await upload.mutateAsync({ file: item.file, collectionId: collectionId || undefined });
        setItems((prev) => prev.map((i) => (i.file === item.file ? { ...i, state: 'done' } : i)));
      } catch (err) {
        setItems((prev) =>
          prev.map((i) =>
            i.file === item.file ? { ...i, state: 'error', error: (err as Error).message } : i,
          ),
        );
      }
    }
  }

  function close() {
    if (busy) return;
    setItems([]);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Upload documents"
      description="PDF, DOCX or TXT up to 15 MB. Files are processed in the background."
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragging ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/50 hover:bg-subtle',
        )}
      >
        <UploadCloud className="mb-3 h-8 w-8 text-brand" />
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-ink-faint">PDF · DOCX · TXT</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILES}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="mt-4 max-h-52 space-y-2 overflow-y-auto">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm">
              <FileUp className="h-4 w-4 shrink-0 text-ink-faint" />
              <div className="min-w-0 flex-1">
                <div className="truncate">{item.file.name}</div>
                <div className={cn('text-xs', item.error ? 'text-red-500' : 'text-ink-faint')}>
                  {item.error ?? formatBytes(item.file.size)}
                </div>
              </div>
              {item.state === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-brand" />}
              {item.state === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              {item.state === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
              {item.state === 'pending' && (
                <button
                  onClick={() => setItems((prev) => prev.filter((i) => i !== item))}
                  className="text-ink-faint hover:text-ink"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Field label="Collection">
          <Select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} disabled={busy}>
            <option value="">No collection</option>
            {collections?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={close} disabled={busy}>
          {finished ? 'Done' : 'Cancel'}
        </Button>
        {!finished && (
          <Button onClick={uploadAll} loading={busy} disabled={!pending.length}>
            Upload {pending.length > 0 && `(${pending.length})`}
          </Button>
        )}
      </div>
    </Modal>
  );
}
