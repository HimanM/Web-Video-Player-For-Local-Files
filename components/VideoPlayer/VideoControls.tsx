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
        "absolute inset-x-4 md:inset-x-8 max-w-4xl mx-auto bottom-6 md:bottom-8 z-10 transition-all duration-300 ease-out",
        showControls ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-[0.98] pointer-events-none"
      )}
    >
      <div className="bg-white/20 dark:bg-black/30 backdrop-blur-3xl border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] rounded-3xl p-4 md:p-5 pointer-events-auto flex flex-col gap-3 relative">
      
      {/* Settings Menu */}
      {showSettings && (
        <div className="absolute bottom-[calc(100%+16px)] right-0 z-50 w-64 bg-white/20 dark:bg-black/30 backdrop-blur-3xl border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200 text-black dark:text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60">Settings</h3>
            <button onClick={(e) => { e.stopPropagation(); setShowSettings(false); }} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors">
               <X size={14} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Playback Speed</span>
              <select 
                className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 text-xs outline-none font-medium shadow-sm transition-colors cursor-pointer"
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
              <span className="text-sm font-medium">Auto-play next</span>
              <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4 rounded cursor-pointer" />
            </div>
          </div>
        </div>
      )}

        {/* Progress Bar & Time Display */}
        <div className="flex items-center gap-4 px-2">
          <div className="text-xs font-bold font-mono text-black/80 dark:text-white/90 min-w-[50px] text-right tabular-nums">
            {formatTime(currentTime)}
          </div>
          <div className="flex-1 relative flex items-center group/scrubber h-6 cursor-pointer">
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-black/10 dark:bg-white/20 rounded-full appearance-none cursor-pointer accent-black dark:accent-white hover:h-2 transition-all relative z-10"
            />
          </div>
          <div className="text-xs font-bold font-mono text-black/80 dark:text-white/90 min-w-[50px] tabular-nums">
            {formatTime(duration)}
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={onPrev} className="text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
            </button>
            <button onClick={onNext} className="text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">
              <SkipForward size={24} fill="currentColor" />
            </button>
            
            <div className="flex items-center gap-3 group/volume ml-4">
              <button onClick={toggleMute} className="text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input 
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-24 h-1 bg-black/10 dark:bg-white/20 rounded-full appearance-none cursor-pointer accent-black dark:accent-white transition-all opacity-0 group-hover/volume:opacity-100"
              />
            </div>
            
            {!isTheaterMode && (
              <div className="hidden xl:block ml-4">
                 <h2 className="text-sm font-semibold truncate max-w-[200px] text-black/90 dark:text-white/90">
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
                  ? "bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400" 
                  : "bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/20 hover:text-black dark:hover:text-white"
              )}
            >
              <Captions size={16} />
              <span className="hidden sm:inline">
                {selectedSubtitle ? selectedSubtitle.name.split('.').pop()?.toUpperCase() : 'Subtitles'}
              </span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onToggleTheater(); }}
              className={cn("text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors p-1 rounded-md", isTheaterMode && "text-blue-600 dark:text-blue-400")}
              title={isTheaterMode ? "Default View" : "Theater Mode"}
            >
              <Layout size={20} />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className={cn("text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors p-1 rounded-md", showSettings && "text-blue-600 dark:text-blue-400")}
            >
              <Settings size={20} />
            </button>
            
            <button 
              onClick={toggleFullscreen}
              className="text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors p-1 rounded-md"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
