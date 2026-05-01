import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [
    h > 0 ? h : null,
    m.toString().padStart(h > 0 ? 2 : 1, '0'),
    s.toString().padStart(2, '0'),
  ]
    .filter(Boolean)
    .join(':');
}

export function getExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}
