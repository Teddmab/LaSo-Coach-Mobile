/**
 * TikTok : détection, miniature et identifiant vidéo (oEmbed + URL canonique).
 */

type TikTokOembedJson = {
  thumbnail_url?: string;
  html?: string;
  author_url?: string;
};

const oembedJsonCache = new Map<string, TikTokOembedJson | null>();

export function isTikTokUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return /tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|m\.tiktok\.com/i.test(url.trim());
}

/** ID numérique présent dans les URL du type .../video/7123456789012345678 */
export function extractTikTokVideoIdFromUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  const m = url.trim().match(/\/video\/(\d{8,})/);
  return m?.[1] ?? null;
}

function parseVideoIdFromOembed(data: TikTokOembedJson): string | null {
  const fromAuthor = data.author_url?.match(/\/video\/(\d{8,})/)?.[1];
  if (fromAuthor) return fromAuthor;

  const html = data.html;
  if (html) {
    const cite = html.match(/cite="([^"]+)"/)?.[1];
    if (cite) {
      const fromCite = cite.match(/\/video\/(\d{8,})/)?.[1];
      if (fromCite) return fromCite;
    }
    const dataVid = html.match(/data-video-id="(\d{8,})"/)?.[1];
    if (dataVid) return dataVid;
  }
  return null;
}

async function fetchTikTokOembedJson(trimmed: string): Promise<TikTokOembedJson | null> {
  if (oembedJsonCache.has(trimmed)) {
    return oembedJsonCache.get(trimmed) ?? null;
  }
  try {
    const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(trimmed)}`;
    const res = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      oembedJsonCache.set(trimmed, null);
      return null;
    }
    const data = (await res.json()) as TikTokOembedJson;
    oembedJsonCache.set(trimmed, data);
    return data;
  } catch {
    oembedJsonCache.set(trimmed, null);
    return null;
  }
}

export type TikTokOembedData = {
  thumbnailUrl: string | null;
  videoId: string | null;
};

/**
 * Résout miniature + id vidéo (pour embed in-app). Une seule requête oEmbed, mise en cache.
 */
export async function getTikTokOembedData(contentUrl: string): Promise<TikTokOembedData> {
  const trimmed = contentUrl.trim();
  if (!trimmed || !isTikTokUrl(trimmed)) {
    return { thumbnailUrl: null, videoId: null };
  }
  const fromUrl = extractTikTokVideoIdFromUrl(trimmed);
  const json = await fetchTikTokOembedJson(trimmed);
  const thumb = typeof json?.thumbnail_url === 'string' ? json.thumbnail_url : null;
  const fromEmbed = json ? parseVideoIdFromOembed(json) : null;
  return {
    thumbnailUrl: thumb,
    videoId: fromUrl ?? fromEmbed ?? null,
  };
}

export async function getTikTokThumbnailUrl(contentUrl: string): Promise<string | null> {
  const { thumbnailUrl } = await getTikTokOembedData(contentUrl);
  return thumbnailUrl;
}

/** URL de la page embed TikTok (lecture in-app via WebView). */
export function getTikTokEmbedPageUrl(videoId: string): string {
  return `https://www.tiktok.com/embed/v2/${videoId}`;
}
