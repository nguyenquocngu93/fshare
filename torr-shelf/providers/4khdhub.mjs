// 4KHDHub HTTP scraper for TorrShelf.
// Dependency-free adaptation of the provider flow documented by the MIT-licensed
// tapframe/NuvioStreamsAddon project. See 4KHDHUB-NOTICE.md.

const BASE_URL = "https://4khdhub.one";
const USER_AGENT = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/134 Mobile Safari/537.36";
const cache = new Map();

const cached = (key) => {
  const item = cache.get(key);
  if (!item || item.expiresAt <= Date.now()) { cache.delete(key);return null; }
  return item.value;
};
const remember = (key, value, ttlMs) => { cache.set(key, { value, expiresAt: Date.now() + ttlMs });return value; };

function decodeHtml(value = "") {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_match, entity) => {
    if (entity[0] === "#") {
      const hex = entity[1]?.toLowerCase() === "x", number = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(number) ? String.fromCodePoint(number) : "";
    }
    return named[entity.toLowerCase()] ?? _match;
  });
}

const cleanText = (value = "") => decodeHtml(String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const attr = (tag = "", name = "") => decodeHtml(tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] || "");
const classText = (html, className) => cleanText(html.match(new RegExp(`<[^>]+class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i"))?.[1] || "");
const absoluteUrl = (value, base = BASE_URL) => { try { const url = new URL(decodeHtml(value), base);return ["http:", "https:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; } };

function normalizeTitle(value = "") {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\[[^\]]*]/g, " ").replace(/\b(?:imax|marvel\s+phase\s+\d+)\b/gi, " ").replace(/&/g, " and ").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
}

function levenshtein(a, b) {
  if (a === b) return 0;if (!a.length) return b.length;if (!b.length) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    previous = current;
  }
  return previous[b.length];
}

function findClassBlocks(html, className) {
  const starts = [...String(html).matchAll(new RegExp(`<[^>]+class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, "gi"))].map((match) => match.index);
  return starts.map((start, index) => String(html).slice(start, starts[index + 1] ?? String(html).length));
}

function anchors(html) {
  return [...String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({ href: absoluteUrl(attr(match[1], "href")), text: cleanText(match[2]) })).filter((item) => item.href);
}

export function parse4KHDHubSearch(html) {
  const results = [];
  for (const match of String(html).matchAll(/<a\b([^>]*class=["'][^"']*\bmovie-card\b[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = absoluteUrl(attr(match[1], "href")), body = match[2], title = classText(body, "movie-card-title"), meta = classText(body, "movie-card-meta");
    if (!href || !title) continue;
    const formats = [...body.matchAll(/<[^>]+class=["'][^"']*\bmovie-card-format\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi)].map((entry) => cleanText(entry[1])).filter(Boolean);
    results.push({ href, title, year: Number(meta.match(/\b(?:19|20)\d{2}\b/)?.[0]) || 0, formats, type: /-series-/i.test(href) || formats.some((item) => /series/i.test(item)) ? "series" : "movie" });
  }
  return results;
}

export function select4KHDHubCard(cards, { title, year = 0, type = "movie" } = {}) {
  const target = normalizeTitle(title);if (!target) return null;const expectedType = type === "movie" ? "movie" : "series";
  const ranked = (cards || []).filter((card) => card.type === expectedType).filter((card) => !year || !card.year || Math.abs(Number(card.year) - Number(year)) <= 1).map((card) => {
    const candidate = normalizeTitle(card.title);let score = 0;
    if (candidate === target) score = 10_000;
    else if (candidate.startsWith(target) || target.startsWith(candidate)) score = 8_000 - Math.abs(candidate.length - target.length);
    else if (candidate.includes(target) || target.includes(candidate)) score = 6_000 - Math.abs(candidate.length - target.length);
    else score = 1_000 - levenshtein(candidate, target) * 20;
    return { card, score };
  }).sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 800 ? ranked[0].card : null;
}

export function parse4KHDHubItems(html, { type = "movie", season = 0, episode = 0 } = {}) {
  const className = type === "movie" ? "download-item" : "episode-download-item", blocks = findClassBlocks(html, className), exactEpisode = new RegExp(`\\bS0*${Number(season)}E0*${Number(episode)}\\b`, "i");
  return blocks.map((block) => {
    const title = classText(block, type === "movie" ? "file-title" : "episode-file-title") || cleanText(block).slice(0, 500), text = cleanText(block), size = text.match(/\b\d+(?:\.\d+)?\s*(?:TB|GB|MB)\b/i)?.[0] || "", qualityMatch = `${title} ${text}`.match(/\b(2160p|4K|1080p|720p|480p)\b/i), hubCloud = anchors(block).find((link) => /HubCloud/i.test(link.text));
    return { title, size, quality: qualityMatch ? (/4K/i.test(qualityMatch[1]) ? "2160p" : qualityMatch[1]) : "", hubCloudUrl: hubCloud?.href || "", text };
  }).filter((item) => item.hubCloudUrl && !/\.zip(?:\b|$)/i.test(item.title)).filter((item) => type === "movie" || exactEpisode.test(item.title));
}

async function fetchResponse(url, options = {}, timeoutMs = 20_000, fetchImpl = fetch) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { redirect: "follow", ...options, signal: controller.signal, headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml", ...(options.headers || {}) } });
    if (!response.ok) throw new Error(`${new URL(url).hostname} trả HTTP ${response.status}`);
    return response;
  } finally { clearTimeout(timer); }
}

async function fetchText(url, options = {}, timeoutMs = 20_000, fetchImpl = fetch) {
  const response = await fetchResponse(url, options, timeoutMs, fetchImpl), length = Number(response.headers?.get?.("content-length")) || 0;
  if (length > 3_000_000) { try { await response.body?.cancel(); } catch {}throw new Error("Trang scraper quá lớn"); }
  return { text: await response.text(), url: response.url || String(url) };
}

function allowedHubCloud(value) { try { return /^hubcloud\./i.test(new URL(value).hostname); } catch { return false; } }
function allowedFinalPage(value) { try { return /(?:^|\.)(?:gamerxyt\.com|sportverse\.cc|hubrouting\.site)$/i.test(new URL(value).hostname); } catch { return false; } }
function allowedDirect(value) { try { const host = new URL(value).hostname;return /(^|\.)googleusercontent\.com$/i.test(host) || /(^|\.)pixeldrain\.(?:com|dev)$/i.test(host) || /\.workers\.dev$/i.test(host) || /\.r2\.dev$/i.test(host); } catch { return false; } }

async function resolveServerHref(href, referer, fetchImpl) {
  if (allowedDirect(href)) return href;
  let response;
  try { response = await fetchResponse(href, { headers: { Referer: referer } }, 25_000, fetchImpl); }
  catch { return ""; }
  const finalUrl = response.url || href;try { await response.body?.cancel(); } catch {}
  try {
    const parsed = new URL(finalUrl), linked = parsed.searchParams.get("link");
    if (linked && allowedDirect(linked)) return linked;
    if (allowedDirect(finalUrl)) return finalUrl;
  } catch {}
  return "";
}

async function probeRange(url, headers, fetchImpl) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response;
    try { response = await fetchResponse(url, { headers: { ...headers, Range: "bytes=0-1", "Accept-Encoding": "identity" } }, 20_000, fetchImpl); }
    catch { if (!attempt) { await new Promise((resolve) => setTimeout(resolve, 300));continue; }return false; }
    const seekable = response.status === 206 && /^bytes\s+0-1\//i.test(response.headers?.get?.("content-range") || "");
    try { await response.body?.cancel(); } catch {}
    if (seekable) return true;
    if (!attempt) await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}
function pixelServerUrl(href) {
  try { const original = new URL(href), match = original.pathname.match(/\/(?:u|api\/file)\/([^/?]+)/i);if (!match) return null;const direct = new URL(`/api/file/${match[1]}`, original.origin);direct.searchParams.set("download", "");return { url: direct.toString(), headers: { Referer: original.toString() } }; } catch { return null; }
}

export async function resolveHubCloudStreams(url, meta = {}, fetchImpl = fetch) {
  if (!allowedHubCloud(url)) return [];
  const cacheKey = `hub:${url}`, hit = cached(cacheKey);if (hit) return hit;
  const first = await fetchText(url, { headers: { Referer: url } }, 25_000, fetchImpl), finalPageUrl = absoluteUrl(first.text.match(/var\s+url\s*=\s*["']([^"']+)["']/i)?.[1] || "", first.url);
  if (!finalPageUrl || !allowedFinalPage(finalPageUrl)) return remember(cacheKey, [], 60_000);
  const cookieName = first.text.match(/stck\(\s*["'](\w+)["']\s*,/)?.[1] || "", finalHeaders = { Referer: first.url, ...(cookieName ? { Cookie: `${cookieName}=s4t` } : {}) }, finalPage = await fetchText(finalPageUrl, { headers: finalHeaders }, 25_000, fetchImpl), finalTitle = cleanText(finalPage.text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""), allLinks = anchors(finalPage.text), jobs = [];
  for (const link of allLinks) {
    if (/\.zip(?:\b|$)/i.test(link.href)) continue;
    if (/PixelServer/i.test(link.text)) {
      const pixel = pixelServerUrl(link.href);if (pixel) jobs.push((async () => ({ source: "PixelServer", url: pixel.url, headers: pixel.headers, seekable: await probeRange(pixel.url, pixel.headers, fetchImpl) }))());
    } else if (/FSLv2/i.test(link.text)) jobs.push((async () => ({ source: "FSLv2", url: link.href, headers: {}, seekable: await probeRange(link.href, {}, fetchImpl) }))());
    else if (/FSL/i.test(link.text)) jobs.push((async () => ({ source: "FSL", url: link.href, headers: {}, seekable: await probeRange(link.href, {}, fetchImpl) }))());
    else if (/Download File/i.test(link.text)) jobs.push((async () => ({ source: "Direct", url: link.href, headers: {}, seekable: await probeRange(link.href, {}, fetchImpl) }))());
    else if (/10Gbps/i.test(link.text)) jobs.push((async () => ({ source: "10Gbps", url: await resolveServerHref(link.href, finalPageUrl, fetchImpl), headers: {}, seekable: false }))());
  }
  const settled = await Promise.allSettled(jobs.slice(0, 8)), unique = new Map();settled.forEach((result) => { if (result.status === "fulfilled" && result.value.url) unique.set(result.value.url, { ...result.value, title: finalTitle || meta.title, size: meta.size, quality: meta.quality }); });
  const values = [...unique.values()], seekable = values.filter((item) => item.seekable);
  return remember(cacheKey, seekable.length ? seekable : values, 5 * 60_000);
}

export async function get4KHDHubStreams({ title, year = 0, type = "movie", season = 0, episode = 0, maxResults = 12, hiddenQualities = [] } = {}, fetchImpl = fetch) {
  const mediaType = type === "movie" ? "movie" : "series", key = JSON.stringify({ title, year, mediaType, season, episode, maxResults, hiddenQualities }), hit = cached(`streams:${key}`);if (hit) return hit;
  const search = await fetchText(`${BASE_URL}/?s=${encodeURIComponent(`${title} ${year || ""}`.trim())}`, {}, 25_000, fetchImpl), card = select4KHDHubCard(parse4KHDHubSearch(search.text), { title, year, type: mediaType });
  if (!card) return remember(`streams:${key}`, [], 2 * 60_000);
  const page = await fetchText(card.href, {}, 30_000, fetchImpl), items = parse4KHDHubItems(page.text, { type: mediaType, season, episode }).slice(0, Math.min(20, Math.max(1, Number(maxResults) || 12))), resolved = await Promise.allSettled(items.map((item) => resolveHubCloudStreams(item.hubCloudUrl, item, fetchImpl))), streams = [], seen = new Set();
  for (const result of resolved) {
    if (result.status !== "fulfilled") continue;
    for (const link of result.value) {
      if (!link.url || seen.has(link.url)) continue;const qualityText = `${link.quality} ${link.title}`;
      if ((hiddenQualities || []).some((quality) => quality === "4K" ? /\b(?:4K|2160p|UHD)\b/i.test(qualityText) : qualityText.toLowerCase().includes(String(quality).toLowerCase()))) continue;
      seen.add(link.url);streams.push({ name: `4KHDHub · ${link.source}`, title: `${link.title || title}\n${[link.size, link.quality, link.seekable ? "HTTP · SEEK" : "HTTP · NO SEEK"].filter(Boolean).join(" · ")}`, url: link.url, headers: link.headers || {}, rangeProxy: Boolean(link.seekable), behaviorHints: { notWebReady: true, bingeGroup: `4khdhub-${season || 0}-${episode || 0}` } });
    }
  }
  const seekableStreams = streams.filter((stream) => stream.rangeProxy), preferred = seekableStreams.length ? seekableStreams : streams;
  return remember(`streams:${key}`, preferred.slice(0, Math.min(30, Math.max(1, Number(maxResults) || 12))), 5 * 60_000);
}
