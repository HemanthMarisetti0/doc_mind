import clsx from 'clsx';
import type { ClassValue } from 'clsx';

export const cn = (...values: ClassValue[]) => clsx(values);

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

export function timeAgo(date: string) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export function fileKind(mimeType: string): 'pdf' | 'docx' | 'txt' {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('wordprocessingml')) return 'docx';
  return 'txt';
}

export const ACCEPTED_FILES = '.pdf,.docx,.txt';
export const MAX_FILE_MB = 15;
