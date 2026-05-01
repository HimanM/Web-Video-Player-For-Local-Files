'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { VideoFile, SubtitleFile } from '@/types';
import { cn, formatTime } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  Captions,
  Settings,
  X,
  Layout
} from 'lucide-react';

interface VideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentVideo: VideoFile | null;
  isTheaterMode: boolean;
  showControls: boolean;
  onToggleTheater: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleSubtitles: () => void;
  selectedSubtitle: SubtitleFile | null;
}

export default function VideoControls({
  videoRef,
  currentVideo,
  isTheaterMode,
  showControls,
  onToggleTheater,
  onNext,
  onPrev,
  onToggleSubtitles,
  selectedSubtitle
}: VideoControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [videoRef]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Re-apply playback speed when a new video loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      video.playbackRate = playbackSpeed;
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [playbackSpeed, videoRef, currentVideo]);

  return (
    <div 
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 transition-all duration-500",
        showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}
    >
      {/* Settings Menu */}
      {showSettings && (
        <div className="absolute bottom-24 right-6 z-50 w-64 bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 text-foreground pointer-events-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Settings</h3>
            <button onClick={(e) => { e.stopPropagation(); setShowSettings(false); }} className="p-1 hover:bg-accent rounded-lg transition-colors text-foreground">
               <X size={16} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Playback Speed</span>
              <select 
                className="bg-muted border border-border rounded px-2 py-1 text-xs outline-none text-foreground"
                value={playbackSpeed}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPlaybackSpeed(val);
                  if (videoRef.current) videoRef.current.playbackRate = val;
                }}
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">Normal</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Auto-play next</span>
              <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Gradient Overlay - Apple Hyperglass Theme */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-white/10 dark:bg-black/20 backdrop-blur-2xl border-t border-white/20 dark:border-white/10 -z-10" />

      <div className="px-6 pb-8 space-y-6 pointer-events-auto">
        {/* Progress Bar & Time Display */}
        <div className="flex items-center gap-6 group/progress bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
          <div className="text-sm font-bold font-mono text-white min-w-[60px] text-right tabular-nums">
            {formatTime(currentTime)}
          </div>
          <div className="flex-1 relative flex items-center">
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-white/30 rounded-full appearance-none cursor-pointer accent-blue-500 hover:h-3 transition-all"
            />
          </div>
          <div className="text-sm font-bold font-mono text-white min-w-[60px] tabular-nums">
            {formatTime(duration)}
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={onPrev} className="text-zinc-400 hover:text-white transition-colors">
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
            </button>
            <button onClick={onNext} className="text-zinc-400 hover:text-white transition-colors">
              <SkipForward size={24} fill="currentColor" />
            </button>
            
            <div className="flex items-center gap-3 group/volume ml-4">
              <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input 
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white transition-all opacity-0 group-hover/volume:opacity-100"
              />
            </div>
            
            {!isTheaterMode && (
              <div className="hidden xl:block ml-4">
                 <h2 className="text-sm font-semibold truncate max-w-[200px] text-white/90">
                   {currentVideo?.name}
                 </h2>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onToggleSubtitles}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium",
                selectedSubtitle 
                  ? "bg-blue-600/20 border-blue-500/30 text-blue-400" 
                  : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800"
              )}
            >
              <Captions size={16} />
              <span className="hidden sm:inline text-white/90">
                {selectedSubtitle ? selectedSubtitle.name.split('.').pop()?.toUpperCase() : 'Subtitles'}
              </span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onToggleTheater(); }}
              className={cn("text-zinc-400 hover:text-white transition-colors p-1 rounded-md", isTheaterMode && "text-primary bg-primary/10")}
              title={isTheaterMode ? "Default View" : "Theater Mode"}
            >
              <Layout size={20} />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className={cn("text-zinc-400 hover:text-white transition-colors p-1 rounded-md", showSettings && "text-blue-400")}
            >
              <Settings size={20} />
            </button>
            
            <button 
              onClick={toggleFullscreen}
              className="text-zinc-400 hover:text-white transition-colors p-1 rounded-md"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
