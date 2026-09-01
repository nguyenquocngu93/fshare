// UHDMovies direct HTTP provider for TorrShelf.
// Dependency-free adaptation of the MIT-licensed Nuvio/Sootio UHDMovies flow.
// See WEB-SCRAPERS-NOTICE.md.

const DOMAIN_SOURCE = "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json";
const FALLBACK_DOMAIN = "https://uhdmovies.autos";
const USER_AGENT = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/134 Mobile Safari/537.36";
const cache = new Map();
const cached = (key) => { const item = cache.get(key);if (!item || item.expiresAt <= Date.now()) { cache.delete(key);return null; }return item.value; };
const remember = (key, value, ttl) => { cache.set(key, { value, expiresAt: Date.now() + ttl });return value; };
function decodeHtml(value = "") { const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", ndash: "–", mdash: "—" };return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => { if (entity[0] === "#") { const hex = entity[1]?.toLowerCase() === "x", code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);return Number.isFinite(code) ? String.fromCodePoint(code) : ""; }return named[entity.toLowerCase()] ?? match; }); }
const cleanText = (value = "") => decodeHtml(String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const attr = (tag, name) => decodeHtml(String(tag).match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] || "");
function absoluteUrl(value, base) { try { const url = new URL(decodeHtml(value), base);return ["http:", "https:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; } }
function anchors(html, base) { return [...String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({ href: absoluteUrl(attr(match[1], "href"), base), text: cleanText(match[2]) })).filter((item) => item.href); }
const normalize = (value = "") => String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\b(?:download|dual audio|hindi|english|full movie|imax|audio)\b/gi, " ").replace(/\[[^\]]*]|\{[^}]*}/g, " ").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
function scoreTitle(candidate, target) { const a = normalize(candidate), b = normalize(target);if (!a || !b) return 0;if (a === b) return 10_000;if (a.startsWith(b) || b.startsWith(a)) return 8_000 - Math.abs(a.length - b.length);if (a.includes(b) || b.includes(a)) return 6_000 - Math.abs(a.length - b.length);const words = b.split(" ").filter((word) => word.length > 2), hits = words.filter((word) => a.split(" ").includes(word)).length;return words.length ? Math.round(hits / words.length * 4_000) : 0; }

async function fetchResponse(url, options = {}, timeout = 35_000, fetchImpl = fetch) { const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeout);try { const response = await fetchImpl(url, { redirect: "follow", ...options, signal: controller.signal, headers: { "User-Agent": USER_AGENT, ...(options.headers || {}) } });if (!response.ok) throw new Error(`${new URL(url).hostname} trả HTTP ${response.status}`);return response; } finally { clearTimeout(timer); } }
async function fetchText(url, options = {}, timeout = 35_000, fetchImpl = fetch) { const response = await fetchResponse(url, options, timeout, fetchImpl), length = Number(response.headers?.get?.("content-length")) || 0;if (length > 4_000_000) { try { await response.body?.cancel(); } catch {}throw new Error("Trang UHDMovies quá lớn"); }return { text: await response.text(), url: response.url || String(url) }; }
async function fetchJson(url, options = {}, timeout = 20_000, fetchImpl = fetch) { const response = await fetchResponse(url, { ...options, headers: { Accept: "application/json", ...(options.headers || {}) } }, timeout, fetchImpl);return response.json(); }
async function getDomain(fetchImpl) { const hit = cached("domain");if (hit) return hit;try { const data = await fetchJson(DOMAIN_SOURCE, {}, 15_000, fetchImpl), url = new URL(String(data?.UHDMovies || FALLBACK_DOMAIN));return remember("domain", url.origin, 30 * 60_000); } catch { return remember("domain", FALLBACK_DOMAIN, 5 * 60_000); } }

export function parseUHDMoviesSearch(html, baseUrl) {
  const results = [];
  for (const link of anchors(html, baseUrl)) {
    if (!/\/download-/i.test(new URL(link.href).pathname)) continue;
    const tagMatch = String(html).match(new RegExp(`<a\\b[^>]*href=["']${link.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*title=["']([^"']+)["']`, "i")), title = decodeHtml(tagMatch?.[1] || link.text);
    if (title) results.push({ title, url: link.href, year: Number(title.match(/\b(?:19|20)\d{2}\b/)?.[0]) || 0, type: /season|series|S\d{1,2}/i.test(title) ? "series" : "movie" });
  }
  return [...new Map(results.map((item) => [item.url, item])).values()];
}
export function selectUHDMoviesResult(results, { title, year = 0, type = "movie", season = 0 } = {}) { const ranked = (results || []).filter((item) => item.type === (type === "movie" ? "movie" : "series")).filter((item) => !year || !item.year || Math.abs(item.year - Number(year)) <= 1).map((item) => { let score = scoreTitle(item.title.replace(/\b(?:19|20)\d{2}\b/g, " "), title);if (type !== "movie" && season) { const range = item.title.match(/Season\s*(\d+)\s*[–-]\s*(\d+)/i);if (range && season >= Number(range[1]) && season <= Number(range[2])) score += 3_000;else if (new RegExp(`Season\\s*0*${season}\\b`, "i").test(item.title)) score += 3_000; }return { item, score }; }).sort((a, b) => b.score - a.score);return ranked[0]?.score >= 1_500 ? ranked[0].item : null; }

export function parseUHDMoviesSidLinks(html, baseUrl, { type = "movie", season = 0, episode = 0 } = {}) {
  const sidHost = /(?:cloud|tech)\.[^/]+/i, results = [];
  if (type === "movie") {
    for (const link of anchors(html, baseUrl)) if (sidHost.test(new URL(link.href).hostname) && /[?&]sid=/i.test(link.href)) results.push({ ...link, priority: /G-Drive/i.test(link.text) ? 100 : /2160|4K/i.test(link.text) ? 80 : /1080/i.test(link.text) ? 60 : 10 });
  } else {
    for (const paragraph of String(html).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
      const text = cleanText(paragraph[1]);if (!new RegExp(`(?:\\bS0*${Number(season)}\\b|\\bSeason\\s*0*${Number(season)}\\b)`, "i").test(text)) continue;
      for (const link of anchors(paragraph[1], baseUrl)) if (sidHost.test(new URL(link.href).hostname) && /[?&]sid=/i.test(link.href) && new RegExp(`^Episode\\s*0*${Number(episode)}$`, "i").test(link.text)) results.push({ ...link, priority: 80 });
    }
  }
  return [...new Map(results.sort((a, b) => b.priority - a.priority).map((item) => [item.href, item])).values()];
}

function parseForm(html, field) { const form = String(html).match(/<form\b[^>]*id=["']landing["'][^>]*>/i)?.[0] || "", action = attr(form, "action"), value = String(html).match(new RegExp(`name=["']${field}["']\\s+value=["']([^"']*)`, "i"))?.[1] || String(html).match(new RegExp(`value=["']([^"']*)["']\\s+name=["']${field}["']`, "i"))?.[1] || "";return { action, value: decodeHtml(value) }; }
async function resolveSid(sidUrl, fetchImpl) {
  const hit = cached(`sid:${sidUrl}`);if (hit) return hit;const step0 = await fetchText(sidUrl, {}, 25_000, fetchImpl), first = parseForm(step0.text, "_wp_http");if (!first.action || !first.value) return "";
  const step1 = await fetchText(absoluteUrl(first.action, step0.url), { method: "POST", headers: { Referer: sidUrl, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ _wp_http: first.value }) }, 25_000, fetchImpl), second = parseForm(step1.text, "_wp_http2"), token = String(step1.text).match(/name=["']token["']\s+value=["']([^"']*)/i)?.[1] || "";if (!second.action || !second.value || !token) return "";
  const step2 = await fetchText(absoluteUrl(second.action, step1.url), { method: "POST", headers: { Referer: step1.url, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ _wp_http2: second.value, token: decodeHtml(token) }) }, 25_000, fetchImpl), cookie = step2.text.match(/s_343\('([^']+)',\s*'([^']+)'/), link = step2.text.match(/c\.setAttribute\("href",\s*"([^"]+)"\)/)?.[1];if (!cookie || !link) return "";
  const final = await fetchText(absoluteUrl(link, step2.url), { headers: { Referer: step2.url, Cookie: `${cookie[1]}=${cookie[2]}` } }, 25_000, fetchImpl), refresh = final.text.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["']([^"']+)/i)?.[1] || "", drive = absoluteUrl(refresh.match(/url=(.*)$/i)?.[1]?.replace(/["']/g, "") || "", final.url);return drive ? remember(`sid:${sidUrl}`, drive, 30 * 60_000) : "";
}
function allowedDirect(value) { try { const host = new URL(value).hostname;return /(^|\.)googleusercontent\.com$/i.test(host) || /\.workers\.dev$/i.test(host) || /\.r2\.dev$/i.test(host); } catch { return false; } }
async function resolveDrive(driveUrl, fetchImpl) {
  const first = await fetchText(driveUrl, {}, 25_000, fetchImpl), redirect = first.text.match(/window\.location\.replace\(["']([^"']+)/i)?.[1], filePageUrl = redirect ? absoluteUrl(redirect, first.url) : first.url, page = redirect ? await fetchText(filePageUrl, {}, 25_000, fetchImpl) : first, title = cleanText(page.text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""), size = cleanText(page.text.match(/Size\s*:\s*([0-9.,]+\s*[KMGT]B)/i)?.[1] || ""), instant = anchors(page.text, page.url).find((link) => /Instant Download/i.test(link.text));if (!instant) return null;if (allowedDirect(instant.href)) return { url: instant.href, title, size };
  let response;try { response = await fetchResponse(instant.href, { headers: { Referer: page.url } }, 30_000, fetchImpl); } catch { return null; }const finalUrl = response.url || instant.href;try { await response.body?.cancel(); } catch {}let direct = "";try { const parsed = new URL(finalUrl);direct = parsed.searchParams.get("url") || (allowedDirect(finalUrl) ? finalUrl : ""); } catch {}return direct && allowedDirect(direct) ? { url: direct, title, size } : null;
}

export async function getUHDMoviesStreams({ title, year = 0, type = "movie", season = 0, episode = 0, maxResults = 8, hiddenQualities = [] } = {}, fetchImpl = fetch) {
  const key = JSON.stringify({ title, year, type, season, episode, maxResults, hiddenQualities }), hit = cached(`streams:${key}`);if (hit) return hit;const domain = await getDomain(fetchImpl), search = await fetchText(`${domain}/search/${encodeURIComponent(title.replace(/:/g, ""))}`, {}, 30_000, fetchImpl), selected = selectUHDMoviesResult(parseUHDMoviesSearch(search.text, domain), { title, year, type, season });if (!selected) return remember(`streams:${key}`, [], 2 * 60_000);const page = await fetchText(selected.url, {}, 35_000, fetchImpl), sidLinks = parseUHDMoviesSidLinks(page.text, page.url, { type, season, episode }).slice(0, Math.min(6, Math.max(1, Number(maxResults) || 8))), resolved = await Promise.allSettled(sidLinks.map(async (link) => { const drive = await resolveSid(link.href, fetchImpl);return drive ? resolveDrive(drive, fetchImpl) : null; })), seen = new Set(), streams = [];
  for (const result of resolved) { if (result.status !== "fulfilled" || !result.value?.url || seen.has(result.value.url)) continue;const item = result.value;if (type === "movie" && year && !new RegExp(`\\b${Number(year)}\\b`).test(item.title)) continue;if (type !== "movie" && !new RegExp(`\\bS0*${Number(season)}E0*${Number(episode)}\\b`, "i").test(item.title)) continue;const quality = item.title.match(/\b(?:2160p|1080p|720p|480p)\b/i)?.[0] || "", descriptor = `${quality} ${item.title}`;if ((hiddenQualities || []).some((hidden) => hidden === "4K" ? /\b(?:4K|2160p|UHD)\b/i.test(descriptor) : descriptor.toLowerCase().includes(String(hidden).toLowerCase()))) continue;seen.add(item.url);streams.push({ name: "UHDMovies · Direct", title: `${item.title || title}\n${[item.size, quality, "HTTP"].filter(Boolean).join(" · ")}`, url: item.url, headers: {}, behaviorHints: { notWebReady: true, bingeGroup: `uhdmovies-${season || 0}-${episode || 0}` } }); }
  return remember(`streams:${key}`, streams.slice(0, Math.min(20, Math.max(1, Number(maxResults) || 8))), 5 * 60_000);
}
