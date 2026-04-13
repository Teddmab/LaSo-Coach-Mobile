/**
 * Extrait l’identifiant vidéo YouTube (11 caractères) depuis une URL ou une chaîne brute.
 * Couvre watch, embed, youtu.be, shorts, et le paramètre v=.
 */
export function extractYouTubeVideoId(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const shorts = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?|#|\/|$)/);
  if (shorts?.[1]) {
    return shorts[1];
  }

  const vParam = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})(?:&|#|$)/);
  if (vParam?.[1]) {
    return vParam[1];
  }

  const youtuBe = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|#|$)/);
  if (youtuBe?.[1]) {
    return youtuBe[1];
  }

  const embed = trimmed.match(/(?:embed\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (embed?.[1]) {
    return embed[1];
  }

  const regExp = /^.*(youtube\.com\/(?:v\/|watch\?v=))([a-zA-Z0-9_-]{11}).*/;
  const match = trimmed.match(regExp);
  if (match?.[2]?.length === 11) {
    return match[2];
  }

  return null;
}

export function isLikelyYouTubeUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return /youtu\.be|youtube\.com|youtube-nocookie\.com/i.test(url.trim());
}

export function youtubeThumbnailFromVideoId(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
