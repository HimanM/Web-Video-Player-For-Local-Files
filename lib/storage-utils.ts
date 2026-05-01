import { PlaybackState } from "@/types";
import { get, set, del, clear } from 'idb-keyval';

const STORAGE_KEYS = {
  PLAYBACK_STATE: 'vp_playback_state',
  WATCHED_VIDEOS: 'vp_watched_videos',
  PROGRESS: 'vp_progress', // Key: path, Value: timestamp
  ROOT_HANDLE: 'vp_root_handle',
};

export function savePlaybackPosition(path: string, time: number) {
  if (!path) return;
  const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS) || '{}');
  progress[path] = time;
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
}

export function getPlaybackPosition(path: string): number {
  if (!path) return 0;
  const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS) || '{}');
  return progress[path] || 0;
}

export function saveCurrentPlaybackState(state: PlaybackState) {
  localStorage.setItem(STORAGE_KEYS.PLAYBACK_STATE, JSON.stringify(state));
}

export function getCurrentPlaybackState(): PlaybackState | null {
  const state = localStorage.getItem(STORAGE_KEYS.PLAYBACK_STATE);
  return state ? JSON.parse(state) : null;
}

export function markAsWatched(path: string) {
  const watched = new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCHED_VIDEOS) || '[]'));
  watched.add(path);
  localStorage.setItem(STORAGE_KEYS.WATCHED_VIDEOS, JSON.stringify([...watched]));
}

export function isWatched(path: string): boolean {
  const watched = new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCHED_VIDEOS) || '[]'));
  return watched.has(path);
}

export function getWatchedList(): string[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCHED_VIDEOS) || '[]');
}

// IndexedDB for Handles
export async function saveRootHandle(handle: FileSystemDirectoryHandle) {
  await set(STORAGE_KEYS.ROOT_HANDLE, handle);
}

export async function getRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  return await get(STORAGE_KEYS.ROOT_HANDLE) || null;
}

export async function clearRootHandle() {
  await del(STORAGE_KEYS.ROOT_HANDLE);
}

export async function clearAllHistory() {
  localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  localStorage.removeItem(STORAGE_KEYS.WATCHED_VIDEOS);
  localStorage.removeItem(STORAGE_KEYS.PLAYBACK_STATE);
  await clear();
}
