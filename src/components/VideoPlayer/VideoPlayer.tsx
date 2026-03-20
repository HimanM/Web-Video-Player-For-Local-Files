'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, VideoFile, FolderNode, SubtitleFile, PlaybackState } from '@/types';
import { crawlDirectory, getAllVideos, getAllSubtitles } from '@/lib/file-system';
import { findBestSubtitle } from '@/lib/subtitle-utils';
import { 
  savePlaybackPosition, 
  markAsWatched, 
  saveCurrentPlaybackState, 
  getCurrentPlaybackState,
  saveRootHandle,
  getRootHandle,
  clearRootHandle,
  clearAllHistory
} from '@/lib/storage-utils';
import Sidebar from './Sidebar';
import Playlist from './Playlist';
import VideoControls from './VideoControls';
import SubtitleSelector from './SubtitleSelector';
import ConfirmationModal from './ConfirmationModal';
import { cn } from '@/lib/utils';
import { FolderOpen, RotateCcw, MonitorPlay } from 'lucide-react';

export default function VideoPlayer() {
  const [state, setState] = useState<AppState>({
    rootHandle: null,
    currentFolder: null,
    currentVideo: null,
    subtitles: [],
    selectedSubtitle: null,
    isSidebarOpen: true,
    autoPlay: true,
    showWatched: true,
  });

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [isResumable, setIsResumable] = useState<PlaybackState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const pendingSeekTime = useRef<number | null>(null);

  useEffect(() => {
    const lastState = getCurrentPlaybackState();
    if (lastState && lastState.currentFolderPath) {
      setIsResumable(lastState);
    }
    setIsLoaded(true);
  }, []);

  const handleOpenFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      await saveRootHandle(handle);
      const rootNode = await crawlDirectory(handle);
      setState(prev => ({
        ...prev,
        rootHandle: handle,
        currentFolder: rootNode,
      }));

      // Check if we should resume a video
      if (isResumable && isResumable.currentVideoPath) {
        const allVideos = getAllVideos(rootNode);
        const videoToResume = allVideos.find(v => v.path === isResumable.currentVideoPath);
        if (videoToResume) {
          const folderPath = videoToResume.path.split('/').slice(0, -1).join('/');
          const findFolder = (node: FolderNode, path: string): FolderNode | undefined => {
            if (node.path === path) return node;
            for (const child of node.children) {
              if ('children' in child) {
                const found = findFolder(child, path);
                if (found) return found;
              }
            }
            return undefined;
          };
          const containingFolder = findFolder(rootNode, folderPath) || rootNode;
          
          playVideo({
            ...videoToResume,
            currentTime: isResumable.currentTime
          }, containingFolder);
        }
      }
      setIsResumable(null);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Folder selection aborted by user');
        return;
      }
      console.error('Failed to open directory', err);
    }
  };

  const handleAutoResume = async () => {
    try {
      const handle = await getRootHandle();
      if (!handle) {
        handleOpenFolder();
        return;
      }

      // Verify permission
      const permission = await handle.requestPermission({ mode: 'read' });
      if (permission !== 'granted') {
        // If permission denied, we might need a manual trigger or just fallback to picker
        handleOpenFolder();
        return;
      }

      const rootNode = await crawlDirectory(handle);
      setState(prev => ({
        ...prev,
        rootHandle: handle,
        currentFolder: rootNode,
      }));

      // Find the specific video to resume
      if (isResumable && isResumable.currentVideoPath) {
        const allVideos = getAllVideos(rootNode);
        const videoToResume = allVideos.find(v => v.path === isResumable.currentVideoPath);
        if (videoToResume) {
          const folderPath = videoToResume.path.split('/').slice(0, -1).join('/');
          const findFolder = (node: FolderNode, path: string): FolderNode | undefined => {
            if (node.path === path) return node;
            for (const child of node.children) {
              if ('children' in child) {
                const found = findFolder(child, path);
                if (found) return found;
              }
            }
            return undefined;
          };
          const containingFolder = findFolder(rootNode, folderPath) || rootNode;
          
          playVideo({
            ...videoToResume,
            currentTime: isResumable.currentTime
          }, containingFolder);
        }
      }
      setIsResumable(null);
    } catch (err) {
      console.error('Failed to auto-resume folder', err);
      handleOpenFolder();
    }
  };

  const handleRemoveFolder = async () => {
    await clearRootHandle();
    setState(prev => ({
      ...prev,
      rootHandle: null,
      currentFolder: null,
      currentVideo: null
    }));
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
  };

  const handleClearHistory = () => {
    setShowConfirmClear(true);
  };

  const confirmClearHistory = async () => {
    await clearAllHistory();
    setShowConfirmClear(false);
    window.location.reload();
  };

  const playVideo = useCallback(async (video: VideoFile, folder?: FolderNode) => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    if (subtitleUrl) {
      URL.revokeObjectURL(subtitleUrl);
    }

    const file = await video.handle.getFile();
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    
    const subsToSearch = folder ? getAllSubtitles(folder) : (state.currentFolder ? getAllSubtitles(state.currentFolder) : []);
    const { bestSubtitle } = findBestSubtitle(video.name, subsToSearch);
    
    let subUrl = null;
    if (bestSubtitle) {
      const subFile = await bestSubtitle.handle.getFile();
      subUrl = URL.createObjectURL(subFile);
    }

    setState(prev => ({
      ...prev,
      currentVideo: video,
      subtitles: subsToSearch,
      selectedSubtitle: bestSubtitle,
    }));
    setSubtitleUrl(subUrl);
    pendingSeekTime.current = video.currentTime || null;

    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(console.error);
    }

    saveCurrentPlaybackState({
      currentVideoPath: video.path,
      currentFolderPath: folder?.path || state.currentFolder?.path || null,
      currentTime: video.currentTime || 0,
      lastUpdated: Date.now(),
    });
  }, [videoUrl, subtitleUrl, state.currentFolder]);

  const handleSubtitleSelect = async (sub: SubtitleFile | null) => {
    if (subtitleUrl) {
      URL.revokeObjectURL(subtitleUrl);
    }
    
    if (sub) {
      const subFile = await sub.handle.getFile();
      const url = URL.createObjectURL(subFile);
      setSubtitleUrl(url);
    } else {
      setSubtitleUrl(null);
    }
    
    setState(prev => ({ ...prev, selectedSubtitle: sub }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && state.currentVideo) {
        const time = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        if (time > 0) {
          savePlaybackPosition(state.currentVideo.path, time);
          
          if (duration && (time / duration) > 0.9) {
            markAsWatched(state.currentVideo.path);
          }
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [state.currentVideo]);

  const onVideoEnded = () => {
    if (state.autoPlay && state.currentFolder) {
      const videos = getAllVideos(state.currentFolder);
      const currentIndex = videos.findIndex(v => v.path === state.currentVideo?.path);
      if (currentIndex !== -1 && currentIndex < videos.length - 1) {
        playVideo(videos[currentIndex + 1]);
      }
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="flex h-screen w-full transition-colors duration-300 bg-background text-foreground font-sans antialiased">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={state.isSidebarOpen} 
        rootNode={state.currentFolder}
        currentVideo={state.currentVideo}
        onSelectVideo={playVideo}
        onOpenFolder={handleOpenFolder}
        onToggle={() => setState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }))}
        onRemoveFolder={handleRemoveFolder}
        onClearHistory={handleClearHistory}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {state.currentVideo ? (
          <div className="flex-1 flex flex-col min-h-0 bg-black relative group">
            <video 
              ref={videoRef}
              src={videoUrl || undefined}
              className="w-full h-full object-contain"
              onEnded={onVideoEnded}
              onLoadedMetadata={() => {
                if (pendingSeekTime.current !== null && videoRef.current) {
                  videoRef.current.currentTime = pendingSeekTime.current;
                  pendingSeekTime.current = null;
                }
              }}
              controls={false}
              autoPlay
            >
              {subtitleUrl && (
                <track 
                  kind="subtitles" 
                  src={subtitleUrl} 
                  srcLang="en" 
                  label="English" 
                  default 
                />
              )}
            </video>
            
            <VideoControls 
              videoRef={videoRef}
              currentVideo={state.currentVideo}
              onNext={onVideoEnded}
              onPrev={() => {
                if (state.currentFolder) {
                  const videos = getAllVideos(state.currentFolder);
                  const currentIndex = videos.findIndex(v => v.path === state.currentVideo?.path);
                  if (currentIndex > 0) playVideo(videos[currentIndex - 1]);
                }
              }}
              onToggleSubtitles={() => setShowSubtitleModal(true)}
              selectedSubtitle={state.selectedSubtitle}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-md">
              <div className="w-20 h-20 bg-muted/50 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto border border-border shadow-2xl">
                <MonitorPlay size={40} className="text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-muted-foreground">Open a folder to start your cinematic journey.</p>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleOpenFolder}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]"
                >
                  <FolderOpen size={20} />
                  Open Local Folder
                </button>
                
                {isResumable && (
                  <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <button 
                      onClick={handleAutoResume}
                      className="flex items-center justify-center gap-2 w-full py-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-semibold transition-all border border-border shadow-sm active:scale-[0.98] group"
                    >
                      <RotateCcw size={20} className="text-primary group-hover:rotate-[-45deg] transition-transform duration-300" />
                      Resume Playback
                    </button>
                    
                    <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-left">
                       <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1.5 opacity-70">CONTINUE WATCHING</p>
                       <p className="text-sm font-medium text-foreground leading-relaxed break-words line-clamp-3">
                         {isResumable.currentVideoPath?.split('/').pop()?.replace(/\.[^/.]+$/, "")}
                       </p>
                       <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                         Saved at {Math.floor(isResumable.currentTime / 60)}m {Math.floor(isResumable.currentTime % 60)}s
                       </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {showSubtitleModal && (
        <SubtitleSelector 
          subtitles={state.subtitles}
          videoName={state.currentVideo?.name || ''}
          selectedSubtitle={state.selectedSubtitle}
          onSelect={handleSubtitleSelect}
          onClose={() => setShowSubtitleModal(false)}
        />
      )}

      <ConfirmationModal 
        isOpen={showConfirmClear}
        title="Clear All History?"
        message="This will remove all saved playback positions, watched status, and recently opened folders. This action cannot be undone."
        confirmText="Yes, Clear All"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmClearHistory}
        onCancel={() => setShowConfirmClear(false)}
      />
    </div>
  );
}
