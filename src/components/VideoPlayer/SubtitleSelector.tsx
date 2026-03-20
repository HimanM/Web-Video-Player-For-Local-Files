'use client';

import React, { useMemo } from 'react';
import { SubtitleFile } from '@/types';
import { calculateSimilarity } from '@/lib/subtitle-utils';
import { cn } from '@/lib/utils';
import { X, Check, FileText, AlertCircle } from 'lucide-react';

interface SubtitleSelectorProps {
  subtitles: SubtitleFile[];
  videoName: string;
  selectedSubtitle: SubtitleFile | null;
  onSelect: (sub: SubtitleFile | null) => void;
  onClose: () => void;
}

export default function SubtitleSelector({
  subtitles,
  videoName,
  selectedSubtitle,
  onSelect,
  onClose
}: SubtitleSelectorProps) {
  const scoredSubtitles = useMemo(() => {
    const baseVideoName = videoName.replace(/\.[^/.]+$/, "");
    return subtitles.map(sub => ({
      ...sub,
      similarity: calculateSimilarity(baseVideoName, sub.name.replace(/\.[^/.]+$/, ""))
    })).sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  }, [subtitles, videoName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            <h2 className="font-semibold text-foreground">Subtitle Selection</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-primary/5 border-b border-primary/10">
          <p className="text-[11px] uppercase tracking-wider text-primary font-bold mb-1">Target Video</p>
          <p className="text-sm font-medium truncate opacity-80 text-foreground">{videoName}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <button 
            onClick={() => { onSelect(null); onClose(); }}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl transition-all border",
              !selectedSubtitle ? "bg-muted border-border" : "hover:bg-muted border-transparent"
            )}
          >
            <span className="text-sm font-medium text-foreground">None (Disable Subtitles)</span>
            {!selectedSubtitle && <Check size={16} className="text-primary" />}
          </button>

          <div className="h-4" />
          <p className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Suggested Matches</p>
          
          {scoredSubtitles.length > 0 ? scoredSubtitles.map((sub) => {
            const isSelected = selectedSubtitle?.path === sub.path;
            const score = Math.round((sub.similarity || 0) * 100);
            
            return (
              <button 
                key={sub.path}
                onClick={() => { onSelect(sub); onClose(); }}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-xl transition-all border group",
                  isSelected ? "bg-primary/10 border-primary/20" : "hover:bg-muted border-transparent"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold",
                  score > 70 ? "bg-emerald-500/10 text-emerald-500" : 
                  score > 40 ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
                )}>
                  <span>{score}%</span>
                  <span className="opacity-60 text-[8px]">MATCH</span>
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>{sub.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{sub.path}</p>
                </div>

                {isSelected && <Check size={18} className="text-primary shrink-0" />}
              </button>
            );
          }) : (
            <div className="p-8 text-center opacity-40">
              <AlertCircle size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No subtitle files detected in this folder.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/30 text-[11px] text-muted-foreground text-center">
          Matching based on filename similarity. Close to save selection.
        </div>
      </div>
    </div>
  );
}
