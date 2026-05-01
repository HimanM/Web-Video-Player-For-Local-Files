import { FolderNode, VideoFile, SubtitleFile } from "@/types";
import { getExtension } from "./utils";
import { isWatched, getPlaybackPosition } from "./storage-utils";

const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'webm', 'mov', 'm4v'];
const SUBTITLE_EXTENSIONS = ['srt', 'vtt'];

export async function crawlDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  path: string = ""
): Promise<FolderNode> {
  const node: FolderNode = {
    name: directoryHandle.name,
    handle: directoryHandle,
    path: path || directoryHandle.name,
    children: [],
    videoCount: 0,
  };

  for await (const entry of (directoryHandle as any).values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;
    
    if (entry.kind === 'directory') {
      const childFolder = await crawlDirectory(entry as FileSystemDirectoryHandle, entryPath);
      if (childFolder.videoCount > 0 || childFolder.children.length > 0) {
        node.children.push(childFolder);
        node.videoCount += childFolder.videoCount;
      }
    } else {
      const ext = getExtension(entry.name);
      if (VIDEO_EXTENSIONS.includes(ext)) {
        const videoFile: VideoFile = {
          name: entry.name,
          handle: entry as FileSystemFileHandle,
          path: entryPath,
          extension: ext,
          watched: isWatched(entryPath),
          progress: 0, // Will be updated when playing
          currentTime: getPlaybackPosition(entryPath)
        };
        node.children.push(videoFile);
        node.videoCount++;
      } else if (SUBTITLE_EXTENSIONS.includes(ext)) {
        const subFile: SubtitleFile = {
          name: entry.name,
          handle: entry as FileSystemFileHandle,
          path: entryPath,
          type: 'subtitle'
        };
        // We'll store subtitles separately in the state or just keep them in children for now
        node.children.push(subFile);
      }
    }
  }

  // Sort children: Folders first, then files alphabetically
  node.children.sort((a, b) => {
    const isFolderA = 'children' in a;
    const isFolderB = 'children' in b;
    if (isFolderA && !isFolderB) return -1;
    if (!isFolderA && isFolderB) return 1;
    return a.name.localeCompare(b.name);
  });

  return node;
}

export function getAllVideos(node: FolderNode): VideoFile[] {
  let videos: VideoFile[] = [];
  for (const child of node.children) {
    if ('children' in child) {
      videos = [...videos, ...getAllVideos(child as FolderNode)];
    } else if ('handle' in child && !('type' in child)) {
      videos.push(child as VideoFile);
    }
  }
  return videos;
}

export function getAllSubtitles(node: FolderNode): SubtitleFile[] {
  let subs: SubtitleFile[] = [];
  for (const child of node.children) {
    if ('children' in child) {
      subs = [...subs, ...getAllSubtitles(child as FolderNode)];
    } else if ('type' in child && child.type === 'subtitle') {
      subs.push(child as SubtitleFile);
    }
  }
  return subs;
}
