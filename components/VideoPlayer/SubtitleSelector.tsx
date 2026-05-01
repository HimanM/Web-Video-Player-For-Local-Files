'use client';

import React, { useMemo, useState } from 'react';
import { SubtitleFile, SubtitleSettings } from '@/types';
import { calculateSimilarity } from '@/lib/subtitle-utils';
import { cn } from '@/lib/utils';
import { X, Check, FileText, AlertCircle, Settings2 } from 'lucide-react';

interface SubtitleSelectorProps {
  subtitles: SubtitleFile[];
  videoName: string;
  selectedSubtitle: SubtitleFile | null;
  onSelect: (sub: SubtitleFile | null) => void;
  onClose: () => void;
  subtitleSettings: SubtitleSettings;
  onUpdateSettings: (settings: SubtitleSettings) => void;
}

export default function SubtitleSelector({
  subtitles,
  videoName,
  selectedSubtitle,
  onSelect,
  onClose,
  subtitleSettings,
  onUpdateSettings
}: SubtitleSelectorProps) {
  const [activeTab, setActiveTab] = useState<'select' | 'settings'>('select');

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
        className="w-full max-w-lg bg-card border border-border rounded-[18px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-1 rounded-full bg-muted p-1 border border-border">
            <button
              onClick={() => setActiveTab('select')}
              className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-colors", activeTab === 'select' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Select
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn("flex px-4 py-1.5 rounded-full text-sm font-medium transition-colors items-center gap-1.5", activeTab === 'settings' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <Settings2 size={16} /> Options
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full transition-colors text-foreground">
            <X size={20} />
          </button>
        </div>

        {activeTab === 'select' && (
          <>
            <div className="p-4 bg-primary/5 border-b border-primary/10">
              <p className="text-[11px] uppercase tracking-wider text-primary font-bold mb-1">Target Video</p>
              <p className="text-sm font-medium truncate opacity-80 text-foreground">{videoName}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
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

              <div className="h-2" />
              <p className="px-1 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Suggested Matches</p>
              
              {scoredSubtitles.length > 0 ? scoredSubtitles.map((sub) => {
                const isSelected = selectedSubtitle?.path === sub.path;
                const score = Math.round((sub.similarity || 0) * 100);
                
                return (
                  <button 
                    key={sub.path}
                    onClick={() => { onSelect(sub); onClose(); }}
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-[11px] transition-all border group",
                      isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-muted border-transparent"
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
               Matching based on filename similarity
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Font Size</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: '1rem', label: 'Small' },
                  { value: '1.25rem', label: 'Normal' },
                  { value: '1.75rem', label: 'Large' },
                  { value: '2.5rem', label: 'Huge' },
                ].map((size) => (
                  <button
                    key={size.value}
                    onClick={() => onUpdateSettings({ ...subtitleSettings, size: size.value })}
                    className={cn(
                      "px-3 py-2 text-sm rounded-[8px] transition-colors border",
                      subtitleSettings.size === size.value ? "bg-primary/10 border-primary text-primary font-medium" : "bg-card border-border hover:bg-muted"
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Text Color</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: '#ffffff', label: 'White' },
                  { value: '#fde047', label: 'Yellow' },
                  { value: '#4ade80', label: 'Green' },
                  { value: '#60a5fa', label: 'Blue' },
                ].map((color) => (
                  <button
                    key={color.value}
                    onClick={() => onUpdateSettings({ ...subtitleSettings, color: color.value })}
                    className={cn(
                      "px-3 py-2 text-sm rounded-[8px] transition-colors border flex items-center justify-center gap-2",
                      subtitleSettings.color === color.value ? "bg-primary/10 border-primary font-medium" : "bg-card border-border hover:bg-muted"
                    )}
                  >
                    <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: color.value }} />
                    <span className={subtitleSettings.color === color.value ? "text-primary" : "text-foreground"}>{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background Color</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'transparent', label: 'Transparent' },
                  { value: 'rgba(0, 0, 0, 0.4)', label: 'Dim (40%)' },
                  { value: 'rgba(0, 0, 0, 0.75)', label: 'Dark (75%)' },
                  { value: 'rgba(0, 0, 0, 1)', label: 'Solid Black' },
                ].map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => onUpdateSettings({ ...subtitleSettings, backgroundColor: bg.value })}
                    className={cn(
                      "px-3 py-2 text-sm rounded-[8px] transition-colors border",
                      subtitleSettings.backgroundColor === bg.value ? "bg-primary/10 border-primary text-primary font-medium" : "bg-card border-border hover:bg-muted"
                    )}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Font Family</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'var(--font-sans), sans-serif', label: 'Sans Serif' },
                  { value: 'var(--font-geist-mono), monospace', label: 'Monospace' },
                  { value: 'Georgia, serif', label: 'Serif' },
                ].map((font) => (
                  <button
                    key={font.value}
                    onClick={() => onUpdateSettings({ ...subtitleSettings, fontFamily: font.value })}
                    className={cn(
                      "px-3 py-2 text-sm rounded-[8px] transition-colors border",
                      subtitleSettings.fontFamily === font.value ? "bg-primary/10 border-primary text-primary font-medium" : "bg-card border-border hover:bg-muted"
                    )}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-black/80 rounded-xl p-6 text-center mt-4">
              <span 
                style={{ 
                  color: subtitleSettings.color, 
                  backgroundColor: subtitleSettings.backgroundColor,
                  fontFamily: subtitleSettings.fontFamily,
                  fontSize: subtitleSettings.size === '2.5rem' ? '1.5rem' : subtitleSettings.size, // Cap size for preview
                }}
                className="px-2 leading-relaxed shadow-sm block w-max mx-auto"
              >
                Preview Subtitle Text
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
