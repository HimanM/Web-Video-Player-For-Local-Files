'use client';

import React, { useState } from 'react';
import { FolderNode, VideoFile } from '@/types';
import { cn } from '@/lib/utils';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileVideo, 
  CheckCircle2 
} from 'lucide-react';

interface FolderTreeProps {
  node: FolderNode;
  currentVideo: VideoFile | null;
  onSelectVideo: (video: VideoFile, folder?: FolderNode) => void;
  depth?: number;
}

export default function FolderTree({ 
  node, 
  currentVideo, 
  onSelectVideo, 
  depth = 0 
}: FolderTreeProps) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="select-none">
      {/* Folder Row */}
      <div 
        onClick={toggleExpand}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group",
          "hover:bg-muted"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="text-muted-foreground group-hover:text-foreground">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <Folder 
          size={16} 
          className={cn(
            "shrink-0",
            isExpanded ? "text-primary" : "text-muted-foreground"
          )} 
        />
        <span className="text-sm font-medium truncate flex-1 text-foreground">{node.name}</span>
        {node.videoCount > 0 && (
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full border border-border">
            {node.videoCount}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded && (
        <div className="mt-0.5">
          {node.children.map((child) => {
            if ('children' in child) {
              return (
                <FolderTree 
                  key={child.path} 
                  node={child} 
                  currentVideo={currentVideo}
                  onSelectVideo={onSelectVideo}
                  depth={depth + 1}
                />
              );
            } else if ('handle' in child && !('type' in child)) {
              const video = child as VideoFile;
              const isSelected = currentVideo?.path === video.path;
              
              return (
                <div 
                  key={video.path}
                  onClick={() => onSelectVideo(video, node)}
                  className={cn(
                    "flex items-center gap-2 py-1.5 rounded-lg cursor-pointer transition-all group mx-1",
                    isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
                >
                  <FileVideo size={14} className={cn("shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm truncate flex-1">{video.name}</span>
                  {video.watched && (
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
