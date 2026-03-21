import { SubtitleFile } from "@/types";

export function calculateSimilarity(s1: string, s2: string): number {
  const words1 = s1.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const words2 = s2.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);

  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
}

export function findBestSubtitle(videoName: string, subtitleFiles: SubtitleFile[]): { bestSubtitle: SubtitleFile | null; score: number } {
  const baseVideoName = videoName.replace(/\.[^/.]+$/, ""); // Remove extension
  
  let bestScore = -1;
  let bestSubtitle: SubtitleFile | null = null;

  for (const sub of subtitleFiles) {
    const baseSubName = sub.name.replace(/\.[^/.]+$/, "");
    const score = calculateSimilarity(baseVideoName, baseSubName);
    if (score > bestScore) {
      bestScore = score;
      bestSubtitle = sub;
    }
  }

  return { bestSubtitle, score: bestScore };
}
