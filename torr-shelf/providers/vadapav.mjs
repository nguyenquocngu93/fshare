// Native Vadapav HTTP provider for TorrShelf (uses Vadapav's public Stremio endpoint).

const BASE_URL = "https://stremio.vadapav.mov";
const cache = new Map();
const cached = (key) => { const item = cache.get(key);if (!item || item.expiresAt <= Date.now()) { cache.delete(key);return null; }return item.value; };
const remember = (key, value, ttl) => { cache.set(key, { value, expiresAt: Date.now() + ttl });return value; };

export async function getVadapavStreams({ type = "movie", id = "", maxResults = 20, hiddenQualities = [] } = {}, fetchImpl = fetch) {
  const mediaType = type === "movie" ? "movie" : "series", key = `${mediaType}:${id}:${JSON.stringify(hiddenQualities)}`, hit = cached(key);if (hit) return hit;
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetchImpl(`${BASE_URL}/stream/${mediaType}/${encodeURIComponent(id)}.json`, { signal: controller.signal, headers: { Accept: "application/json", "User-Agent": "TorrShelf/1.6" } });
    if (!response.ok) throw new Error(`Vadapav trả HTTP ${response.status}`);
    const payload = await response.json(), streams = (payload?.streams || []).filter((stream) => {
      try { const url = new URL(String(stream?.url || ""));if (!["http:", "https:"].includes(url.protocol)) return false; } catch { return false; }
      const text = `${stream.name || ""} ${stream.title || ""}`;
      return !(hiddenQualities || []).some((quality) => quality === "4K" ? /\b(?:4K|2160p|UHD)\b/i.test(text) : text.toLowerCase().includes(String(quality).toLowerCase()));
    }).slice(0, Math.min(40, Math.max(1, Number(maxResults) || 20))).map((stream) => ({ ...stream, name: String(stream.name || "Vadapav").replace(/^vadapav\.mov/i, "Vadapav"), headers: stream.headers || {}, behaviorHints: { ...(stream.behaviorHints || {}), notWebReady: true } }));
    return remember(key, streams, 5 * 60_000);
  } finally { clearTimeout(timer); }
}
