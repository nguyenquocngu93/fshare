// MoviesDrive HTTP scraper for TorrShelf.
// Dependency-free implementation informed by tapframe/NuvioStreamsAddon (MIT).
// See WEB-SCRAPERS-NOTICE.md.

import { resolveHubCloudStreams } from "./4khdhub.mjs";

const DOMAIN_SOURCE = "https://raw.githubusercontent.com/SaurabhKaperwan/Utils/refs/heads/main/urls.json";
const FALLBACK_DOMAIN = "https://new2.moviesdrive.christmas";
const USER_AGENT = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/134 Mobile Safari/537.36";
const cache = new Map();
const cached = (key) => { const item = cache.get(key);if (!item || item.expiresAt <= Date.now()) { cache.delete(key);return null; }return item.value; };
const remember = (key, value, ttl) => { cache.set(key, { value, expiresAt: Date.now() + ttl });return value; };

function decodeHtml(value = "") {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === "#") { const hex = entity[1]?.toLowerCase() === "x", code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);return Number.isFinite(code) ? String.fromCodePoint(code) : ""; }
    return named[entity.toLowerCase()] ?? match;
  });
}
const cleanText = (value = "") => decodeHtml(String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const attr = (tag, name) => decodeHtml(String(tag).match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] || "");
const normalizeTitle = (value = "") => String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\b(?:download|dual audio|hindi|english|web series|full movie|imax)\b/gi, " ").replace(/\[[^\]]*]|\{[^}]*}|\([^)]*(?:audio|sub|dub)[^)]*\)/gi, " ").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();

function titleScore(candidate, target) {
  const a = normalizeTitle(candidate), b = normalizeTitle(target);if (!a || !b) return 0;if (a === b) return 10_000;if (a.startsWith(b) || b.startsWith(a)) return 8_000 - Math.abs(a.length - b.length);if (a.includes(b) || b.includes(a)) return 6_000 - Math.abs(a.length - b.length);
  const words = b.split(" ").filter((word) => word.length > 2), hits = words.filter((word) => a.split(" ").includes(word)).length;return words.length ? Math.round(hits / words.length * 4_000) : 0;
}
function absoluteUrl(value, base) { try { const url = new URL(decodeHtml(value), base);return ["http:", "https:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; } }
function anchors(html, base) { return [...String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({ href: absoluteUrl(attr(match[1], "href"), base), text: cleanText(match[2]), html: match[0] })).filter((item) => item.href); }

async function fetchResponse(url, options = {}, timeout = 25_000, fetchImpl = fetch) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeout);
  try { const response = await fetchImpl(url, { redirect: "follow", ...options, signal: controller.signal, headers: { "User-Agent": USER_AGENT, ...(options.headers || {}) } });if (!response.ok) throw new Error(`${new URL(url).hostname} trả HTTP ${response.status}`);return response; }
  finally { clearTimeout(timer); }
}
async function fetchText(url, options = {}, timeout = 25_000, fetchImpl = fetch) { const response = await fetchResponse(url, options, timeout, fetchImpl), length = Number(response.headers?.get?.("content-length")) || 0;if (length > 3_000_000) { try { await response.body?.cancel(); } catch {}throw new Error("Trang MoviesDrive quá lớn"); }return { text: await response.text(), url: response.url || String(url) }; }
async function fetchJson(url, options = {}, timeout = 25_000, fetchImpl = fetch) { const response = await fetchResponse(url, { ...options, headers: { Accept: "application/json", ...(options.headers || {}) } }, timeout, fetchImpl);return response.json(); }

async function getDomain(fetchImpl) {
  const hit = cached("domain");if (hit) return hit;
  try { const data = await fetchJson(DOMAIN_SOURCE, {}, 15_000, fetchImpl), url = new URL(String(data?.moviesdrive || FALLBACK_DOMAIN));if (!["http:", "https:"].includes(url.protocol)) throw new Error();return remember("domain", url.origin, 30 * 60_000); }
  catch { return remember("domain", FALLBACK_DOMAIN, 5 * 60_000); }
}

export function parseMoviesDriveSearch(payload, baseUrl) {
  return (payload?.hits || []).map((hit) => hit?.document || {}).map((doc) => ({ title: cleanText(doc.post_title), year: Number(String(doc.post_title || "").match(/\b(?:19|20)\d{2}\b/)?.[0]) || 0, imdbId: String(doc.imdb_id || "").trim(), url: absoluteUrl(doc.permalink, baseUrl), categories: Array.isArray(doc.category) ? doc.category : [] })).filter((item) => item.title && item.url);
}
export function selectMoviesDriveResult(results, { title, year = 0, type = "movie", season = 0 } = {}) {
  const ranked = (results || []).filter((item) => !year || !item.year || Math.abs(item.year - Number(year)) <= 1).filter((item) => type === "movie" ? !/season|series/i.test(`${item.title} ${item.categories.join(" ")}`) : /season|series|web/i.test(`${item.title} ${item.categories.join(" ")}`)).map((item) => {
    let score = titleScore(item.title.replace(/\b(?:19|20)\d{2}\b/g, " "), title);if (type !== "movie" && season && new RegExp(`(?:season\\s*0*${season}\\b|\\bS0*${season}(?:E|\\b))`, "i").test(item.title)) score += 2_000;return { item, score };
  }).sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 1_500 ? ranked[0].item : null;
}

export function parseMoviesDriveDownloadLinks(html, baseUrl, { type = "movie", season = 0, episode = 0 } = {}) {
  const all = anchors(html, baseUrl).filter((item) => {
    const host = new URL(item.href).hostname;
    return /graph\.moviesdrives-com\.workers\.dev$/i.test(host) || /^hubcloud\./i.test(host);
  }).filter((item) => !/\.zip(?:\b|$)|\bzip\b/i.test(`${item.href} ${item.text}`));
  if (type === "movie") return [...new Map(all.map((item) => [item.href, item])).values()];
  const episodePattern = new RegExp(`(?:S0*${Number(season)}[^a-z0-9]*E(?:pisode)?[^a-z0-9]*0*${Number(episode)}\\b|S0*${Number(season)}E0*${Number(episode)}\\b|Episode[^a-z0-9]*0*${Number(episode)}\\b)`, "i"), results = all.filter((item) => episodePattern.test(decodeURIComponent(item.href)));
  let currentSeason = 0, currentQuality = "";
  for (const heading of String(html).matchAll(/<h5\b[^>]*>([\s\S]*?)<\/h5>/gi)) {
    const text = cleanText(heading[1]), seasonMatch = text.match(/\bSeason\s*0*(\d+)\b/i), qualityMatch = text.match(/\b(?:2160p|4K|1080p|720p|480p)\b/i);
    if (seasonMatch) currentSeason = Number(seasonMatch[1]);
    if (qualityMatch) currentQuality = /4K/i.test(qualityMatch[0]) ? "2160p" : qualityMatch[0];
    if (currentSeason !== Number(season) || !/Single Episode/i.test(text)) continue;
    for (const link of anchors(heading[1], baseUrl)) {
      if (/^mdrive\.lol$/i.test(new URL(link.href).hostname) && /\/archive\/\d+/i.test(link.href)) results.push({ ...link, quality: currentQuality, targetEpisode: Number(episode) });
    }
  }
  return [...new Map(results.map((item) => [item.href, item])).values()];
}

async function resolveDownloadPage(item, fetchImpl) {
  const host = new URL(item.href).hostname;
  if (/^hubcloud\./i.test(host)) return [{ url: item.href, title: item.text, quality: item.quality || item.text.match(/\b(?:2160p|1080p|720p|480p)\b/i)?.[0] || "", size: item.text.match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)\b/i)?.[0] || "" }];
  const page = await fetchText(item.href, {}, 25_000, fetchImpl), pageTitle = cleanText(page.text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s*[–-]\s*Telegraph.*$/i, ""), links = anchors(page.text, page.url).filter((link) => /^hubcloud\./i.test(new URL(link.href).hostname) && /\/drive\//i.test(link.href));
  if (/^mdrive\.lol$/i.test(host) && item.targetEpisode) {
    const selected = links[Number(item.targetEpisode) - 1];
    return selected ? [{ url: selected.href, title: pageTitle || item.text, quality: item.quality || pageTitle.match(/\b(?:2160p|1080p|720p|480p)\b/i)?.[0] || "", size: pageTitle.match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)\b/i)?.[0] || "" }] : [];
  }
  return links.slice(0, 2).map((link) => ({ url: link.href, title: pageTitle || item.text, quality: item.quality || `${pageTitle} ${item.href}`.match(/\b(?:2160p|1080p|720p|480p)\b/i)?.[0] || "", size: `${pageTitle} ${item.href}`.match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)\b/i)?.[0] || "" }));
}

export async function getMoviesDriveStreams({ title, year = 0, type = "movie", season = 0, episode = 0, maxResults = 10, hiddenQualities = [] } = {}, fetchImpl = fetch) {
  const key = JSON.stringify({ title, year, type, season, episode, maxResults, hiddenQualities }), hit = cached(`streams:${key}`);if (hit) return hit;const domain = await getDomain(fetchImpl), query = type === "movie" ? `${title} ${year || ""}`.trim() : title;
  const payload = await fetchJson(`${domain}/search.php?q=${encodeURIComponent(query)}&page=1`, { headers: { Referer: `${domain}/search.html?q=${encodeURIComponent(query)}` } }, 25_000, fetchImpl), selected = selectMoviesDriveResult(parseMoviesDriveSearch(payload, domain), { title, year, type, season });if (!selected) return remember(`streams:${key}`, [], 2 * 60_000);
  const page = await fetchText(selected.url, { headers: { Referer: `${domain}/` } }, 30_000, fetchImpl), downloadLinks = parseMoviesDriveDownloadLinks(page.text, domain, { type, season, episode }).slice(0, Math.min(12, Math.max(1, Number(maxResults) || 10))), intermediate = await Promise.allSettled(downloadLinks.map((item) => resolveDownloadPage(item, fetchImpl))), hubItems = intermediate.flatMap((result) => result.status === "fulfilled" ? result.value : []), resolved = await Promise.allSettled(hubItems.map((item) => resolveHubCloudStreams(item.url, item, fetchImpl))), seen = new Set(), streams = [];
  for (const result of resolved) { if (result.status !== "fulfilled") continue;for (const link of result.value) { const descriptor = `${link.title} ${link.quality}`;if (!link.url || seen.has(link.url) || (hiddenQualities || []).some((quality) => quality === "4K" ? /\b(?:4K|2160p|UHD)\b/i.test(descriptor) : descriptor.toLowerCase().includes(String(quality).toLowerCase()))) continue;seen.add(link.url);streams.push({ name: `MoviesDrive · ${link.source}`, title: `${link.title || title}\n${[link.size, link.quality, link.seekable ? "HTTP · SEEK" : "HTTP · NO SEEK"].filter(Boolean).join(" · ")}`, url: link.url, headers: link.headers || {}, rangeProxy: Boolean(link.seekable), behaviorHints: { notWebReady: true, bingeGroup: `moviesdrive-${season || 0}-${episode || 0}` } }); } }
  const seekableStreams = streams.filter((stream) => stream.rangeProxy), preferred = seekableStreams.length ? seekableStreams : streams;
  return remember(`streams:${key}`, preferred.slice(0, Math.min(30, Math.max(1, Number(maxResults) || 10))), 5 * 60_000);
}
