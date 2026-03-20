export interface VideoFile {
  name: string;
  handle: FileSystemFileHandle;
  path: string;
  extension: string;
  watched: boolean;
  progress: number; // Percentage 0-100
  duration?: number;
  currentTime?: number;
}

export interface FolderNode {
  name: string;
  handle: FileSystemDirectoryHandle;
  path: string;
  children: (FolderNode | VideoFile)[];
  videoCount: number;
}

export interface SubtitleFile {
  name: string;
  handle: FileSystemFileHandle;
  path: string;
  similarity?: number;
}

export interface PlaybackState {
  currentVideoPath: string | null;
  currentFolderPath: string | null;
  currentTime: number;
  lastUpdated: number;
}

export interface AppState {
  rootHandle: FileSystemDirectoryHandle | null;
  currentFolder: FolderNode | null;
  currentVideo: VideoFile | null;
  subtitles: SubtitleFile[];
  selectedSubtitle: SubtitleFile | null;
  isSidebarOpen: boolean;
  theme: 'dark' | 'light';
  autoPlay: boolean;
  showWatched: boolean;
}
