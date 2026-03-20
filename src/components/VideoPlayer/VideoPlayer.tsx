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
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showFloatingInfo, setShowFloatingInfo] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const pendingSeekTime = useRef<number | null>(null);
  const infoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFloatingInfo = useCallback((duration: number = 3000) => {
    setShowFloatingInfo(true);
    if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
    infoTimerRef.current = setTimeout(() => {
      setShowFloatingInfo(false);
    }, duration);
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 2000);
  }, []);

  useEffect(() => {
    const lastState = getCurrentPlaybackState();
    if (lastState && lastState.currentFolderPath) {
      setTimeout(() => {
        setIsResumable(lastState);
        setIsLoaded(true);
      }, 0);
    } else {
      setTimeout(() => {
        setIsLoaded(true);
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (state.currentVideo) {
      // Use a small timeout or microtask to avoid synchronous setState in effect error if needed, 
      // but let's see if wrapping it in a conditional or something else helps.
      // Actually, the error says "Calling setState synchronously within an effect body".
      // We can use a timeout to make it asynchronous.
      const timer = setTimeout(() => {
        triggerFloatingInfo(5000);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [state.currentVideo, triggerFloatingInfo]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        triggerFloatingInfo(4000);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [triggerFloatingInfo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setShowFloatingInfo(false);
      resetControlsTimer();
    };
    const handlePause = () => {
      triggerFloatingInfo(3000);
      setShowControls(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [triggerFloatingInfo, resetControlsTimer]);

  const handleOpenFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      await saveRootHandle(handle);
      const rootNode = await crawlDirectory(handle);
      setState(prev => ({ ...prev, rootHandle: handle, currentFolder: rootNode }));

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
          playVideo({ ...videoToResume, currentTime: isResumable.currentTime }, containingFolder);
        }
      }
      setIsResumable(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Failed to open directory', err);
    }
  };

  const handleAutoResume = async () => {
    try {
      const handle = await getRootHandle();
      if (!handle) { handleOpenFolder(); return; }
      const permission = await handle.requestPermission({ mode: 'read' });
      if (permission !== 'granted') { handleOpenFolder(); return; }
      const rootNode = await crawlDirectory(handle);
      setState(prev => ({ ...prev, rootHandle: handle, currentFolder: rootNode }));
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
          playVideo({ ...videoToResume, currentTime: isResumable.currentTime }, containingFolder);
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
    setState(prev => ({ ...prev, rootHandle: null, currentFolder: null, currentVideo: null }));
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
  };

  const handleClearHistory = () => setShowConfirmClear(true);
  const confirmClearHistory = async () => {
    await clearAllHistory();
    setShowConfirmClear(false);
    window.location.reload();
  };

  const playVideo = useCallback(async (video: VideoFile, folder?: FolderNode) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (subtitleUrl) URL.revokeObjectURL(subtitleUrl);
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
    setState(prev => ({ ...prev, currentVideo: video, subtitles: subsToSearch, selectedSubtitle: bestSubtitle }));
    setSubtitleUrl(subUrl);
    pendingSeekTime.current = video.currentTime || null;
    saveCurrentPlaybackState({
      currentVideoPath: video.path,
      currentFolderPath: folder?.path || state.currentFolder?.path || null,
      currentTime: video.currentTime || 0,
      lastUpdated: Date.now(),
    });
  }, [videoUrl, subtitleUrl, state.currentFolder]);

  const handleSubtitleSelect = async (sub: SubtitleFile | null) => {
    if (subtitleUrl) URL.revokeObjectURL(subtitleUrl);
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
          // Save individual video progress
          savePlaybackPosition(state.currentVideo.path, time);
          
          // Save global resume state for the landing page
          saveCurrentPlaybackState({
            currentVideoPath: state.currentVideo.path,
            currentFolderPath: state.currentFolder?.path || null,
            currentTime: time,
            lastUpdated: Date.now(),
          });

          if (duration && (time / duration) > 0.9) {
            markAsWatched(state.currentVideo.path);
          }
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [state.currentVideo, state.currentFolder]);

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

      <main className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden custom-scrollbar bg-background">
        {state.currentVideo ? (
          <div className={cn(
            "flex flex-col w-full transition-all duration-500 ease-in-out h-full",
            isTheaterMode ? "max-w-full" : "max-w-[1400px] mx-auto p-4 lg:p-6"
          )}>
            <div 
              className={cn(
                "relative bg-black shadow-2xl transition-all duration-500 ease-in-out group flex-shrink-0",
                isTheaterMode ? "w-full h-[calc(100vh-120px)] min-h-[400px]" : "aspect-video w-full rounded-3xl overflow-hidden"
              )}
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
              onMouseMove={resetControlsTimer}
            >
              {/* Floating Info Overlay - Active in Theater Mode OR Fullscreen */}
              {(isTheaterMode || (typeof document !== 'undefined' && !!document.fullscreenElement)) && (
                <div className={cn(
                  "absolute top-8 left-8 z-30 transition-all duration-500 pointer-events-none",
                  showFloatingInfo ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
                )}>
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl max-w-md">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm">{state.currentVideo.extension}</span>
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{state.currentVideo.watched ? "Watched" : "Now Playing"}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white leading-tight mb-1 line-clamp-2">{state.currentVideo.name.replace(/\.[^/.]+$/, "")}</h2>
                    <p className="text-[10px] text-white/30 font-mono truncate">{state.currentVideo.path}</p>
                  </div>
                </div>
              )}

              <video 
                ref={videoRef}
                src={videoUrl || undefined}
                className="w-full h-full object-contain"
                onEnded={onVideoEnded}
                onLoadedData={() => {
                  if (pendingSeekTime.current !== null && videoRef.current) {
                    videoRef.current.currentTime = pendingSeekTime.current;
                    pendingSeekTime.current = null;
                  }
                }}
                controls={false}
                autoPlay
              >
                {subtitleUrl && <track kind="subtitles" src={subtitleUrl} srcLang="en" label="English" default />}
              </video>
              
              <VideoControls 
                videoRef={videoRef}
                currentVideo={state.currentVideo}
                isTheaterMode={isTheaterMode}
                showControls={showControls}
                onToggleTheater={() => {
                  setIsTheaterMode(!isTheaterMode);
                  if (!isTheaterMode) triggerFloatingInfo(4000);
                }}
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

            {/* Video Info Section - Visible in Default Mode */}
            {!isTheaterMode && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700 overflow-hidden flex-shrink-0">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground leading-tight truncate">{state.currentVideo.name.replace(/\.[^/.]+$/, "")}</h1>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                    <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-md font-bold uppercase text-[9px] tracking-widest shadow-md">{state.currentVideo.extension}</span>
                    <span className="opacity-60 truncate max-w-xl font-mono text-[10px]">{state.currentVideo.path}</span>
                  </div>
                </div>
                <div className="h-px bg-border w-full opacity-50" />
                <div className="flex items-center gap-8 text-sm text-muted-foreground">
                   <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest font-black text-primary mb-0.5">Status</span>
                      <span className="text-foreground font-bold">{state.currentVideo.watched ? "Completed" : "In Progress"}</span>
                   </div>
                   <div className="w-px h-8 bg-border" />
                   <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest font-black text-primary mb-0.5">Location</span>
                      <span className="text-foreground font-bold truncate max-w-[250px]">{state.currentVideo.path.split('/').slice(-2, -1)[0] || "Root Directory"}</span>
                   </div>
                </div>
              </div>
            )}
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
                <button onClick={handleOpenFolder} className="flex items-center justify-center gap-2 w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]">
                  <FolderOpen size={20} /> Open Local Folder
                </button>
                {isResumable && (
                  <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <button onClick={handleAutoResume} className="flex items-center justify-center gap-2 w-full py-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-semibold transition-all border border-border shadow-sm active:scale-[0.98] group">
                      <RotateCcw size={20} className="text-primary group-hover:rotate-[-45deg] transition-transform duration-300" /> Resume Playback
                    </button>
                    <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-left">
                       <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1.5 opacity-70">CONTINUE WATCHING</p>
                       <p className="text-sm font-medium text-foreground leading-relaxed break-words line-clamp-3">{isResumable.currentVideoPath?.split('/').pop()?.replace(/\.[^/.]+$/, "")}</p>
                       <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Saved at {Math.floor(isResumable.currentTime / 60)}m {Math.floor(isResumable.currentTime % 60)}s</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {showSubtitleModal && <SubtitleSelector subtitles={state.subtitles} videoName={state.currentVideo?.name || ''} selectedSubtitle={state.selectedSubtitle} onSelect={handleSubtitleSelect} onClose={() => setShowSubtitleModal(false)} />}
      <ConfirmationModal isOpen={showConfirmClear} title="Clear All History?" message="This will remove all saved playback positions, watched status, and recently opened folders. This action cannot be undone." confirmText="Yes, Clear All" cancelText="Cancel" type="danger" onConfirm={confirmClearHistory} onCancel={() => setShowConfirmClear(false)} />
    </div>
  );
}
