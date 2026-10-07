/** A citation attached to an assistant answer and persisted in Message.sources. */
export interface SourceCitation {
  index: number;
  documentId: string;
  documentName: string;
  pageNumber: number | null;
  chunkIndex: number;
  snippet: string;
  similarity: number;
}

/** Collect the [n] markers the model used so we only return sources it actually cited. */
export function citedIndexes(answer: string): Set<number> {
  const used = new Set<number>();
  for (const match of answer.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)) {
    match[1].split(',').forEach((n) => used.add(Number(n.trim())));
  }
  return used;
}
