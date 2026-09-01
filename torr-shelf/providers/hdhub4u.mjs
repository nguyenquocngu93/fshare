// HDHub4u HTTP scraper for TorrShelf.
// Dependency-free implementation informed by tapframe/NuvioStreamsAddon (MIT).
// See WEB-SCRAPERS-NOTICE.md.

import { resolveHubCloudStreams } from "./4khdhub.mjs";

const DOMAIN_SOURCE = "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json";
const FALLBACK_DOMAIN = "https://new1.hdhub4u.af";
const SEARCH_API = "https://search.pingora.fyi/collections/post/documents/search";
const USER_AGENT = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/134 Mobile Safari/537.36";
const cache = new Map();
const cached = (key) => { const item = cache.get(key);if (!item || item.expiresAt <= Date.now()) { cache.delete(key);return null; }return item.value; };
const remember = (key, value, ttl) => { cache.set(key, { value, expiresAt: Date.now() + ttl });return value; };

function decodeHtml(value = "") {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", ndash: "–", mdash: "—" };
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => { if (entity[0] === "#") { const hex = entity[1]?.toLowerCase() === "x", code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);return Number.isFinite(code) ? String.fromCodePoint(code) : ""; }return named[entity.toLowerCase()] ?? match; });
}
const cleanText = (value = "") => decodeHtml(String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const attr = (tag, name) => decodeHtml(String(tag).match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] || "");
const normalizeTitle = (value = "") => String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\b(?:download|full movie|dual audio|hindi|english|bluray|web dl|webrip|x264|hevc|esubs|appletv|series)\b/gi, " ").replace(/\[[^\]]*]|\([^)]*(?:audio|dd\d|org)[^)]*\)/gi, " ").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
function titleScore(candidate, target) { const a = normalizeTitle(candidate), b = normalizeTitle(target);if (!a || !b) return 0;if (a === b) return 10_000;if (a.startsWith(b) || b.startsWith(a)) return 8_000 - Math.abs(a.length - b.length);if (a.includes(b) || b.includes(a)) return 6_000 - Math.abs(a.length - b.length);const words = b.split(" ").filter((word) => word.length > 2), hits = words.filter((word) => a.split(" ").includes(word)).length;return words.length ? Math.round(hits / words.length * 4_000) : 0; }
function absoluteUrl(value, base) { try { const url = new URL(decodeHtml(value), base);return ["http:", "https:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; } }
function anchors(html, base) { return [...String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({ href: absoluteUrl(attr(match[1], "href"), base), text: cleanText(match[2]), html: match[0] })).filter((item) => item.href); }

async function fetchResponse(url, options = {}, timeout = 30_000, fetchImpl = fetch) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeout);
  try { const response = await fetchImpl(url, { redirect: "follow", ...options, signal: controller.signal, headers: { "User-Agent": USER_AGENT, ...(options.headers || {}) } });if (!response.ok) throw new Error(`${new URL(url).hostname} trả HTTP ${response.status}`);return response; }
  finally { clearTimeout(timer); }
}
async function fetchText(url, options = {}, timeout = 30_000, fetchImpl = fetch) { const response = await fetchResponse(url, options, timeout, fetchImpl), length = Number(response.headers?.get?.("content-length")) || 0;if (length > 4_000_000) { try { await response.body?.cancel(); } catch {}throw new Error("Trang HDHub4u quá lớn"); }return { text: await response.text(), url: response.url || String(url) }; }
async function fetchJson(url, options = {}, timeout = 30_000, fetchImpl = fetch) { const response = await fetchResponse(url, { ...options, headers: { Accept: "application/json", ...(options.headers || {}) } }, timeout, fetchImpl);return response.json(); }

async function getDomain(fetchImpl) {
  const hit = cached("domain");if (hit) return hit;
  try { const data = await fetchJson(DOMAIN_SOURCE, {}, 15_000, fetchImpl), url = new URL(String(data?.HDHUB4u || FALLBACK_DOMAIN));if (!["http:", "https:"].includes(url.protocol)) throw new Error();return remember("domain", url.origin, 30 * 60_000); }
  catch { return remember("domain", FALLBACK_DOMAIN, 5 * 60_000); }
}

export function parseHDHub4uSearch(payload) {
  return (payload?.hits || []).map((hit) => hit?.document || {}).map((doc) => ({ title: cleanText(doc.post_title), year: Number(String(doc.post_title || "").match(/\b(?:19|20)\d{2}\b/)?.[0]) || 0, imdbId: String(doc.imdb_id || "").trim(), permalink: String(doc.permalink || "").trim(), categories: Array.isArray(doc.category) ? doc.category : [] })).filter((item) => item.title && item.permalink);
}
export function selectHDHub4uResult(results, { title, year = 0, type = "movie", season = 0, imdbId = "" } = {}) {
  const ranked = (results || []).filter((item) => !year || !item.year || Math.abs(item.year - Number(year)) <= 1).filter((item) => type === "movie" ? !/season|series/i.test(`${item.title} ${item.categories.join(" ")}`) : /season|series/i.test(`${item.title} ${item.categories.join(" ")}`)).map((item) => { let score = titleScore(item.title.replace(/\b(?:19|20)\d{2}\b/g, " "), title);if (imdbId && item.imdbId === imdbId) score += 20_000;if (type !== "movie" && season && new RegExp(`(?:season\\s*0*${season}\\b|\\bS0*${season}(?:E|\\b))`, "i").test(item.title)) score += 3_000;return { item, score }; }).sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 1_500 ? ranked[0].item : null;
}

function rewritePermalink(permalink, domain) { try { const url = new URL(permalink, domain);return new URL(url.pathname + url.search, domain).toString(); } catch { return ""; } }

export function parseHDHub4uEpisodeLinks(html, baseUrl, episode) {
  const source = String(html), marker = new RegExp(`(?:EPiSODE|Episode)\\s*0*${Number(episode)}\\b`, "i"), match = marker.exec(source);if (!match) return [];
  const h3 = source.lastIndexOf("<h3", match.index), h4 = source.lastIndexOf("<h4", match.index), start = Math.max(0, h3, h4), tail = source.slice(match.index + match[0].length), next = tail.search(/(?:EPiSODE|Episode)\s*\d+\b/i), end = next >= 0 ? match.index + match[0].length + next : Math.min(source.length, start + 20_000), block = source.slice(start, end), results = [];
  for (const heading of block.matchAll(/<h[34]\b[^>]*>([\s\S]*?)<\/h[34]>/gi)) {
    const text = cleanText(heading[1]), quality = text.match(/\b(?:2160p|4K|1080p|720p|480p)\b/i)?.[0] || "";
    for (const link of anchors(heading[1], baseUrl)) {
      const host = new URL(link.href).hostname;
      if (/^hubdrive\./i.test(host) || /^hubcloud\./i.test(host) || /(^|\.)greenmountmotors\.com$/i.test(host)) results.push({ url: link.href, quality: /4K/i.test(quality) ? "2160p" : quality, title: text });
    }
  }
  return [...new Map(results.map((item) => [item.url, item])).values()];
}

function parseSearchRecover(html, baseUrl) {
  return anchors(html, baseUrl).map((item) => { try { const url = new URL(item.href);return /search-recover\.php$/i.test(url.pathname) ? { endpoint: `${url.origin}${url.pathname}`, token: url.searchParams.get("from_ac") || "" } : null; } catch { return null; } }).find((item) => item?.token) || null;
}
async function queryHubCloudSearch(access, query, fetchImpl) { const url = new URL(access.endpoint);url.searchParams.set("api", "search");url.searchParams.set("q", query);url.searchParams.set("page", "1");url.searchParams.set("from_ac", access.token);const payload = await fetchJson(url, {}, 25_000, fetchImpl);return (payload?.hits || []).map((hit) => ({ url: absoluteUrl(hit.url, access.endpoint), title: cleanText(hit.file_name), quality: String(hit.file_name || "").match(/\b(?:2160p|1080p|720p|480p)\b/i)?.[0] || "", size: cleanText(hit.size), mimeType: String(hit.mimeType || "") })).filter((item) => item.url && !/\.zip(?:\b|$)/i.test(item.title) && /video|matrosk|mp4|mkv/i.test(`${item.mimeType} ${item.title}`)); }
async function resolveHubDrive(item, fetchImpl) { const page = await fetchText(item.url, {}, 25_000, fetchImpl), cloud = anchors(page.text, page.url).find((link) => /^hubcloud\./i.test(new URL(link.href).hostname) && /HubCloud/i.test(link.text));return cloud ? [{ ...item, url: cloud.href, title: cleanText(page.text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || item.title) }] : []; }
const decode64 = (value) => Buffer.from(String(value || ""), "base64").toString("utf8");
const rot13 = (value) => String(value).replace(/[a-z]/gi, (character) => String.fromCharCode(character.charCodeAt(0) + (character.toLowerCase() < "n" ? 13 : -13)));
async function resolveGreenmount(item, fetchImpl) {
  const page = await fetchText(item.url, {}, 25_000, fetchImpl), pieces = [...page.text.matchAll(/s\('o','([A-Za-z0-9+/=]+)'|ck\('_wp_http_\d+','([^']+)'/g)].map((match) => match[1] || match[2]).filter(Boolean), combined = pieces.join("");if (!combined) return [];
  let resolved = "";
  try { const payload = JSON.parse(decode64(rot13(decode64(decode64(combined)))));resolved = decode64(payload.o || "").trim(); } catch { return []; }
  if (!resolved) return [];
  const host = new URL(resolved).hostname;
  if (/^hubdrive\./i.test(host) || /^hubcloud\./i.test(host)) return [{ ...item, url: resolved }];
  if (!/(^|\.)hblinks\./i.test(host)) return [];
  const linksPage = await fetchText(resolved, {}, 25_000, fetchImpl), title = cleanText(linksPage.text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || item.title), links = anchors(linksPage.text, linksPage.url).filter((link) => /^hubdrive\./i.test(new URL(link.href).hostname) || /^hubcloud\./i.test(new URL(link.href).hostname));
  return [...new Map(links.map((link) => [link.href, { ...item, url: link.href, title }])).values()].slice(0, 6);
}
async function expandHDHubItem(item, fetchImpl, depth = 0) {
  if (!item?.url || depth > 3) return [];const host = new URL(item.url).hostname;
  if (/^hubcloud\./i.test(host)) return [item];
  if (/^hubdrive\./i.test(host)) return resolveHubDrive(item, fetchImpl);
  if (/(^|\.)greenmountmotors\.com$/i.test(host)) { const links = await resolveGreenmount(item, fetchImpl), settled = await Promise.allSettled(links.map((link) => expandHDHubItem(link, fetchImpl, depth + 1)));return settled.flatMap((result) => result.status === "fulfilled" ? result.value : []); }
  return [];
}

export async function getHDHub4uStreams({ title, year = 0, type = "movie", season = 0, episode = 0, imdbId = "", maxResults = 10, hiddenQualities = [] } = {}, fetchImpl = fetch) {
  const key = JSON.stringify({ title, year, type, season, episode, imdbId, maxResults, hiddenQualities }), hit = cached(`streams:${key}`);if (hit) return hit;const domain = await getDomain(fetchImpl), searchUrl = new URL(SEARCH_API), today = new Date().toISOString().slice(0, 10);searchUrl.searchParams.set("q", title);searchUrl.searchParams.set("query_by", "post_title,category,stars,director,imdb_id");searchUrl.searchParams.set("query_by_weights", "4,2,2,2,4");searchUrl.searchParams.set("sort_by", "sort_by_date:desc");searchUrl.searchParams.set("limit", "15");searchUrl.searchParams.set("highlight_fields", "none");searchUrl.searchParams.set("use_cache", "true");searchUrl.searchParams.set("page", "1");searchUrl.searchParams.set("analytics_tag", today);
  const search = await fetchJson(searchUrl, { headers: { Origin: domain, Referer: `${domain}/search.html?q=${encodeURIComponent(title)}` } }, 25_000, fetchImpl), selected = selectHDHub4uResult(parseHDHub4uSearch(search), { title, year, type, season, imdbId });if (!selected) return remember(`streams:${key}`, [], 2 * 60_000);const pageUrl = rewritePermalink(selected.permalink, domain), page = await fetchText(pageUrl, { headers: { Cookie: "xla=s4t", Referer: `${domain}/` } }, 35_000, fetchImpl);let hubItems = [];
  if (type === "movie") {
    const access = parseSearchRecover(page.text, page.url);
    if (access) { const qualities = hiddenQualities.includes("4K") ? ["1080p"] : ["2160p", "1080p"], batches = await Promise.allSettled(qualities.map((quality) => queryHubCloudSearch(access, `${title} ${year || ""} ${quality}`.trim(), fetchImpl)));hubItems = batches.flatMap((result) => result.status === "fulfilled" ? result.value.slice(0, 2) : []); }
    if (!hubItems.length) hubItems = anchors(page.text, page.url).filter((item) => /^hubcloud\./i.test(new URL(item.href).hostname) && /\/drive\//i.test(item.href)).slice(0, 4).map((item) => ({ url: item.href, title: item.text, quality: item.text.match(/\b(?:2160p|1080p|720p|480p)\b/i)?.[0] || "", size: "" }));
  } else {
    const episodeItems = parseHDHub4uEpisodeLinks(page.text, page.url, episode).slice(0, 6), expanded = await Promise.allSettled(episodeItems.map((item) => expandHDHubItem(item, fetchImpl)));hubItems = expanded.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  }
  const strictEpisode = type === "movie" ? null : new RegExp(`\\bS0*${Number(season)}E0*${Number(episode)}\\b`, "i"), filtered = hubItems.filter((item) => !strictEpisode || strictEpisode.test(item.title) || parseHDHub4uEpisodeLinks(page.text, page.url, episode).some((entry) => entry.url === item.url)).filter((item) => !(hiddenQualities || []).some((quality) => quality === "4K" ? /\b(?:4K|2160p|UHD)\b/i.test(`${item.quality} ${item.title}`) : `${item.quality} ${item.title}`.toLowerCase().includes(String(quality).toLowerCase()))).slice(0, Math.min(12, Math.max(1, Number(maxResults) || 10))), resolved = await Promise.allSettled(filtered.map((item) => resolveHubCloudStreams(item.url, item, fetchImpl))), streams = [], seen = new Set();
  for (const result of resolved) { if (result.status !== "fulfilled") continue;for (const link of result.value) { if (!link.url || seen.has(link.url)) continue;seen.add(link.url);streams.push({ name: `HDHub4u · ${link.source}`, title: `${link.title || title}\n${[link.size, link.quality, link.seekable ? "HTTP · SEEK" : "HTTP · NO SEEK"].filter(Boolean).join(" · ")}`, url: link.url, headers: link.headers || {}, rangeProxy: Boolean(link.seekable), behaviorHints: { notWebReady: true, bingeGroup: `hdhub4u-${season || 0}-${episode || 0}` } }); } }
  const seekableStreams = streams.filter((stream) => stream.rangeProxy), preferred = seekableStreams.length ? seekableStreams : streams;
  return remember(`streams:${key}`, preferred.slice(0, Math.min(30, Math.max(1, Number(maxResults) || 10))), 5 * 60_000);
}
