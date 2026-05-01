'use client';

import React, { useState } from 'react';
import { FolderNode, VideoFile } from '@/types';
import { cn } from '@/lib/utils';
import { 
  FolderOpen, 
  ChevronLeft, 
  ChevronRight, 
  Library,
  Settings,
  Sun,
  Moon,
  X,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { useTheme } from 'next-themes';
import FolderTree from './FolderTree';
import Playlist from './Playlist';

interface SidebarProps {
  isOpen: boolean;
  rootNode: FolderNode | null;
  currentVideo: VideoFile | null;
  onSelectVideo: (video: VideoFile, folder?: FolderNode) => void;
  onOpenFolder: () => void;
  onToggle: () => void;
  onRemoveFolder: () => void;
  onClearHistory: () => void;
}

export default function Sidebar({ 
  isOpen, 
  rootNode, 
  currentVideo, 
  onSelectVideo, 
  onOpenFolder, 
  onToggle,
  onRemoveFolder,
  onClearHistory
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'folders' | 'playlist'>('folders');
  const [showSettings, setShowSettings] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn(
      "relative h-full border-r border-border transition-all duration-500 ease-in-out flex flex-col z-20",
      isOpen ? "w-80" : "w-16",
      "bg-card/80 backdrop-blur-xl"
    )}>
      {/* Sidebar Settings Popup */}
      {showSettings && (
        <div className={cn(
          "absolute bg-card border border-border rounded-2xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-4",
          isOpen ? "bottom-16 left-4 right-4" : "bottom-16 left-16 w-64"
        )}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">App Settings</h3>
            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
               <X size={14} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Appearance</span>
              <div className="flex bg-muted p-1 rounded-lg border border-border">
                <button 
                  onClick={() => setTheme('light')}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all", theme === 'light' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <Sun size={14} /> Light
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all", theme === 'dark' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <Moon size={14} /> Dark
                </button>
              </div>
            </div>
            
            <div className="h-px bg-border" />
            
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Data Management</span>
              <button 
                onClick={() => { onRemoveFolder(); setShowSettings(false); }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-semibold"
              >
                <Trash2 size={16} />
                Remove Folder
              </button>
              
              <button 
                onClick={() => { onClearHistory(); setShowSettings(false); }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-amber-500 hover:bg-amber-500/10 rounded-xl transition-colors font-semibold"
              >
                <RotateCcw size={16} />
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {isOpen ? (
          <div className="flex items-center gap-2 font-semibold text-lg overflow-hidden whitespace-nowrap">
            <Library size={20} className="text-primary shrink-0" />
            <span className="truncate">Media Library</span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <Library size={20} className="text-primary" />
          </div>
        )}
        {isOpen && (
          <button 
            onClick={onToggle}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {!isOpen && (
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
           <button onClick={onToggle} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
          <button onClick={onOpenFolder} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <FolderOpen size={20} />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={cn("p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground", showSettings && "text-primary")}
          >
            <Settings size={20} />
          </button>
        </div>
      )}

      {isOpen && (
        <>
          {/* Action Bar */}
          <div className="p-4 space-y-4">
            <button 
              onClick={onOpenFolder}
              className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted border border-border rounded-xl transition-all group"
            >
              <FolderOpen size={18} className="text-muted-foreground group-hover:text-primary" />
              <span className="text-sm font-medium text-foreground">Open Folder</span>
            </button>

            {/* Tabs */}
            <div className="flex p-1 bg-muted rounded-lg border border-border">
              <button 
                onClick={() => setActiveTab('folders')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                  activeTab === 'folders' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Folders
              </button>
              <button 
                onClick={() => setActiveTab('playlist')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                  activeTab === 'playlist' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Playlist
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
            {rootNode ? (
              activeTab === 'folders' ? (
                <div className="space-y-1">
                  <FolderTree 
                    node={rootNode} 
                    currentVideo={currentVideo}
                    onSelectVideo={onSelectVideo}
                  />
                </div>
              ) : (
                <Playlist 
                  node={rootNode}
                  currentVideo={currentVideo}
                  onSelectVideo={onSelectVideo}
                />
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2 opacity-50">
                <FolderOpen size={32} />
                <p className="text-sm">No folder loaded</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex items-center justify-between text-muted-foreground">
             <div className="text-[10px] font-medium tracking-widest uppercase opacity-30">
                v1.2.0
             </div>
             <button 
                onClick={() => setShowSettings(!showSettings)}
                className={cn("p-1.5 hover:bg-muted rounded-lg transition-colors", showSettings && "text-primary")}
                title="Settings"
             >
                <Settings size={18} />
             </button>
          </div>
        </>
      )}
    </div>
  );
}
