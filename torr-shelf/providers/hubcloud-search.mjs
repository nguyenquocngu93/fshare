// HubCloud's public file-search index as an experimental TorrShelf HTTP provider.

import { resolveHubCloudStreams } from "./4khdhub.mjs";

const ENDPOINT = "https://hubcloud.cx/drive/search-recover.php";
// Public access token embedded by HDHub4u's search-recover pages. Provider failure is isolated
// and a future release can refresh this token dynamically if HubCloud rotates it.
const ACCESS_TOKEN = "V0ZKJYdtFl608Rlhl2i32dwjDkAyhT5dQmChWHA5isaxHlh0";
const cache = new Map();
const cached = (key) => { const item = cache.get(key);if (!item || item.expiresAt <= Date.now()) { cache.delete(key);return null; }return item.value; };
const remember = (key, value, ttl) => { cache.set(key, { value, expiresAt: Date.now() + ttl });return value; };
const normalize = (value = "") => String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
function exactTitle(fileName, title) { const file = normalize(fileName), words = normalize(title).split(" ").filter((word) => word.length > 1);return words.length > 0 && words.every((word) => file.split(" ").includes(word)); }
async function search(query, fetchImpl) {
  const url = new URL(ENDPOINT);url.searchParams.set("api", "search");url.searchParams.set("q", query);url.searchParams.set("page", "1");url.searchParams.set("from_ac", ACCESS_TOKEN);
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 25_000);
  try { const response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" } });if (!response.ok) throw new Error(`HubCloud Search trả HTTP ${response.status}`);const payload = await response.json();return (payload?.hits || []).map((hit) => ({ url: String(hit.url || ""), title: String(hit.file_name || ""), size: String(hit.size || ""), quality: String(hit.file_name || "").match(/\b(?:2160p|1080p|720p|480p)\b/i)?.[0] || "", mimeType: String(hit.mimeType || "") })); }
  finally { clearTimeout(timer); }
}

export async function getHubCloudSearchStreams({ title, year = 0, type = "movie", season = 0, episode = 0, maxResults = 10, hiddenQualities = [] } = {}, fetchImpl = fetch) {
  const key = JSON.stringify({ title, year, type, season, episode, maxResults, hiddenQualities }), hit = cached(key);if (hit) return hit;
  const episodeKey = `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`, qualities = hiddenQualities.includes("4K") ? ["1080p", "720p"] : ["2160p", "1080p", "720p"], queries = qualities.map((quality) => type === "movie" ? `${title} ${year || ""} ${quality}`.trim() : `${title} ${episodeKey} ${quality}`), settled = await Promise.allSettled(queries.map((query) => search(query, fetchImpl))), unique = new Map();
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const item of result.value) {
      if (!item.url || !/\.(?:mkv|mp4|avi|mov|m4v)(?:\b|$)/i.test(item.title) || !exactTitle(item.title, title)) continue;
      if (type === "movie" && year && !new RegExp(`\\b${Number(year)}\\b`).test(item.title)) continue;
      if (type !== "movie" && !new RegExp(`\\bS0*${Number(season)}E0*${Number(episode)}\\b`, "i").test(item.title)) continue;
      if ((hiddenQualities || []).some((quality) => quality === "4K" ? /\b(?:4K|2160p|UHD)\b/i.test(`${item.quality} ${item.title}`) : `${item.quality} ${item.title}`.toLowerCase().includes(String(quality).toLowerCase()))) continue;
      unique.set(item.url, item);
    }
  }
  const candidates = [...unique.values()].slice(0, Math.min(12, Math.max(1, Number(maxResults) || 10))), resolved = await Promise.allSettled(candidates.map((item) => resolveHubCloudStreams(item.url, item, fetchImpl))), streams = [], seen = new Set();
  for (const result of resolved) { if (result.status !== "fulfilled") continue;for (const link of result.value) { if (!link.url || seen.has(link.url)) continue;seen.add(link.url);streams.push({ name: `HubCloud Search · ${link.source}`, title: `${link.title || title}\n${[link.size, link.quality, link.seekable ? "HTTP · SEEK" : "HTTP · NO SEEK"].filter(Boolean).join(" · ")}`, url: link.url, headers: link.headers || {}, rangeProxy: Boolean(link.seekable), behaviorHints: { notWebReady: true, bingeGroup: `hubcloud-search-${season || 0}-${episode || 0}` } }); } }
  const seekableStreams = streams.filter((stream) => stream.rangeProxy), preferred = seekableStreams.length ? seekableStreams : streams;
  return remember(key, preferred.slice(0, Math.min(30, Math.max(1, Number(maxResults) || 10))), 5 * 60_000);
}
