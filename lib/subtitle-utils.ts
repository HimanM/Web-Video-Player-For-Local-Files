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

export function findBestSubtitle<T extends { name: string }>(videoName: string, subtitleFiles: T[]) {
  const baseVideoName = videoName.replace(/\.[^/.]+$/, ""); // Remove extension
  
  let bestScore = -1;
  let bestSubtitle: T | null = null;

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

export function srtToVtt(srtContent: string): string {
  let vtt = 'WEBVTT\n\n';
  // Fast and simple conversion: replace timestamp commas with dots
  vtt += srtContent
    .replace(/\r\n|\r/g, '\n') // Normalize newlines
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2'); 
  return vtt;
}

export async function getSubtitleUrl(file: File): Promise<string> {
  const extension = file.name.slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
  
  if (extension === 'srt') {
    const text = await file.text();
    const vttText = srtToVtt(text);
    const blob = new Blob([vttText], { type: 'text/vtt' });
    return URL.createObjectURL(blob);
  }
  
  // If we already have a vtt file or any other format we hope the browser supports
  return URL.createObjectURL(file);
}
