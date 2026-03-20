'use client';

import React, { useState, useMemo } from 'react';
import { FolderNode, VideoFile } from '@/types';
import { getAllVideos } from '@/lib/file-system';
import { cn } from '@/lib/utils';
import { 
  SortAsc, 
  SortDesc, 
  Search, 
  PlayCircle, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

interface PlaylistProps {
  node: FolderNode;
  currentVideo: VideoFile | null;
  onSelectVideo: (video: VideoFile, folder?: FolderNode) => void;
}

export default function Playlist({ 
  node, 
  currentVideo, 
  onSelectVideo 
}: PlaylistProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const videos = useMemo(() => {
    let all = getAllVideos(node);
    
    // Sort
    all.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    // Filter
    if (searchQuery) {
      all = all.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return all;
  }, [node, sortOrder, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-muted/30 rounded-xl border border-border overflow-hidden">
      {/* Playlist Controls */}
      <div className="p-3 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
           <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Queue ({videos.length})</h3>
           <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
            title={sortOrder === 'asc' ? "Sort Z-A" : "Sort A-Z"}
          >
            {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
          </button>
        </div>
        
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search playlist..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
          />
        </div>
      </div>

      {/* Playlist Items */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
        {videos.map((video) => {
          const isSelected = currentVideo?.path === video.path;
          
          return (
            <div 
              key={video.path}
              onClick={() => onSelectVideo(video, node)}
              className={cn(
                "group flex flex-col gap-1 p-3 rounded-xl cursor-pointer transition-all",
                isSelected 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-muted border border-transparent"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors font-bold",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-border"
                )}>
                  {isSelected ? <PlayCircle size={18} /> : <span className="text-[10px] uppercase">{video.extension}</span>}
                </div>
                
                <div className="flex-1 min-w-0">
                   <div className={cn(
                     "text-sm font-medium truncate",
                     isSelected ? "text-primary" : "text-foreground"
                   )}>
                    {video.name}
                   </div>
                   <div className="flex items-center gap-2 mt-1">
                      {video.watched && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                          <CheckCircle2 size={10} />
                          Watched
                        </span>
                      )}
                      {video.currentTime && video.currentTime > 0 && !video.watched && (
                        <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                           <Clock size={10} />
                           In Progress
                        </span>
                      )}
                   </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {videos.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 opacity-40">
            <Search size={24} className="mb-2" />
            <p className="text-sm">No videos found</p>
          </div>
        )}
      </div>
    </div>
  );
}
