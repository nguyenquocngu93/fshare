// Native adaptation of the functional search logic from Hybr089 (package declares MIT).
// UI, logs, bundled dependencies and the embedded TMDB key are intentionally not copied.

export const JACRED_DOMAINS = Object.freeze({
  "jac.red": "https://jac.red/api/v1.0/torrents",
  "jac-red.ru": "https://jac-red.ru/api/v1.0/torrents",
  "jr.maxvol.pro": "https://jr.maxvol.pro/api/v1.0/torrents",
  "ru.jacred.pro": "https://ru.jacred.pro/api/v1.0/torrents",
  "jacred.stream": "https://jacred.stream/api/v1.0/torrents",
});

const DEFAULT_TORRENTIO = "https://torrentio.strem.fun/providers=yts,eztv,rarbg,1337x,kickasstorrents,torrentgalaxy,magnetdl,horriblesubs,nyaasi,tokyotosho,anidex,nekobt,rutor,rutracker,torrent9,ilcorsaronero,mejortorrent,wolfmax4k,cinecalidad,besttorrents|sort=size|language=russian,ukrainian|qualityfilter=480p/manifest.json";

export const DEFAULT_NATIVE_PROVIDER_CONFIG = Object.freeze({
  enabled: true,
  torrentioEnabled: true,
  jacredEnabled: true,
  knabenEnabled: true,
  magnetzEnabled: true,
  fourKhdHubEnabled: false,
  moviesDriveEnabled: false,
  hdHub4uEnabled: false,
  vadapavEnabled: false,
  uhdMoviesEnabled: false,
  hubCloudSearchEnabled: false,
  jacredDomain: "jac.red",
  torrentioManifestUrl: DEFAULT_TORRENTIO,
  commonSortBy: "size",
  commonQualityFilter: [],
  maxResults: 30,
  sizeMinGB: 0,
  sizeMaxGB: 1000,
  preferPack: true,
  animeMode: false,
});

const bool = (value, fallback) => value == null ? fallback : Boolean(value);
const number = (value, fallback, min, max) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

function removeTorrentioProvider(manifestUrl, provider) {
  try {
    const parsed = new URL(manifestUrl);
    parsed.pathname = parsed.pathname.replace(/providers=([^|/]+)/i, (_match, list) => {
      const providers = list.split(",").filter((item) => item.toLowerCase() !== provider.toLowerCase());
      return `providers=${providers.join(",")}`;
    });
    return parsed.toString();
  } catch {
    return manifestUrl;
  }
}

export function sanitizeNativeProviderConfig(value = {}) {
  const input = value && typeof value === "object" ? value : {};
  const sort = ["size", "seeds", "date"].includes(input.commonSortBy) ? input.commonSortBy : "size";
  const quality = Array.isArray(input.commonQualityFilter)
    ? [...new Set(input.commonQualityFilter.map((item) => String(item || "").trim()).filter((item) => ["480p", "720p", "1080p", "4K"].includes(item)))]
    : [];
  let torrentioManifestUrl = String(input.torrentioManifestUrl || DEFAULT_TORRENTIO).trim();
  try {
    const parsed = new URL(torrentioManifestUrl.replace(/^stremio:\/\//i, "https://"));
    if (!["http:", "https:"].includes(parsed.protocol) || !/\/manifest\.json$/i.test(parsed.pathname)) throw new Error();
    torrentioManifestUrl = removeTorrentioProvider(parsed.toString(), "thepiratebay");
  } catch {
    torrentioManifestUrl = DEFAULT_TORRENTIO;
  }
  return {
    enabled: bool(input.enabled, true),
    torrentioEnabled: bool(input.torrentioEnabled, true),
    jacredEnabled: bool(input.jacredEnabled, true),
    knabenEnabled: bool(input.knabenEnabled, true),
    magnetzEnabled: bool(input.magnetzEnabled, true),
    fourKhdHubEnabled: bool(input.fourKhdHubEnabled, false),
    moviesDriveEnabled: bool(input.moviesDriveEnabled, false),
    hdHub4uEnabled: bool(input.hdHub4uEnabled, false),
    vadapavEnabled: bool(input.vadapavEnabled, false),
    uhdMoviesEnabled: bool(input.uhdMoviesEnabled, false),
    hubCloudSearchEnabled: bool(input.hubCloudSearchEnabled, false),
    jacredDomain: JACRED_DOMAINS[input.jacredDomain] ? input.jacredDomain : "jac.red",
    torrentioManifestUrl,
    commonSortBy: sort,
    commonQualityFilter: quality,
    maxResults: Math.round(number(input.maxResults, 30, 5, 200)),
    sizeMinGB: number(input.sizeMinGB, 0, 0, 1000),
    sizeMaxGB: number(input.sizeMaxGB, 1000, 0, 1000),
    preferPack: bool(input.preferPack, true),
    animeMode: bool(input.animeMode, false),
  };
}

export function parseSizeGb(value) {
  if (typeof value === "number") return value > 10000 ? value / 1024 ** 3 : value;
  const text = String(value || "").replace(",", ".");
  const amount = Number.parseFloat(text) || 0;
  const upper = text.toUpperCase();
  if (upper.includes("TB") || upper.includes("ТБ")) return amount * 1024;
  if (upper.includes("GB") || upper.includes("ГБ")) return amount;
  if (upper.includes("MB") || upper.includes("МБ")) return amount / 1024;
  if (upper.includes("KB") || upper.includes("КБ")) return amount / 1024 ** 2;
  return amount > 100 ? amount / 1024 : amount;
}

export function isQualityHidden(title, quality, hidden = []) {
  const text = `${title || ""} ${quality || ""}`.toLowerCase();
  return hidden.some((item) => item === "4K"
    ? /\b(?:4k|2160p|uhd)\b/i.test(text)
    : text.includes(String(item).toLowerCase()));
}

export function isJacredSeasonMatch(title, { type = "movie", season = 0, seasons = [], animeMode = false } = {}) {
  if (type === "movie" || !season) return true;
  const declaredSeasons = (Array.isArray(seasons) ? seasons : []).map(Number).filter((value) => value >= 0);
  if (declaredSeasons.length) return declaredSeasons.includes(Number(season));
  const text = String(title || "");
  const complete = /S\d{1,2}[-~]S?\d{1,2}|(?:Season|сезон[ы]?|mùa|phần)[\s:._-]*\d+\s*[-~]\s*\d+|Complete|Полный|Все\s*сезон[ы]?|trọn\s*bộ|toàn\s*bộ|1-\d+\s*сезон/i.test(text);
  if (complete) return true;
  const padded = String(season).padStart(2, "0");
  const exactSeason = new RegExp(`S0*${season}(?:[^\\d]|$)|(?:Season|сезон|mùa|phần)[\\s:._-]*0*${season}(?:[^\\d]|$)|0*${season}[\\s:._-]*сезон`, "i");
  const hasSeason = /S\d{1,2}(?:[^\d]|$)|(?:Season|сезон|mùa|phần)[\s:._-]*\d|\d+[\s:._-]*сезон/i.test(text);
  if (hasSeason) return exactSeason.test(text) || text.includes(`[S${padded}]`);
  if (type === "anime" || animeMode) {
    if (/фильм|Movie|Gekijouban/i.test(text)) return false;
    // Anime packs often omit Sxx and use ranges such as "1-14 серии".
    return true;
  }
  return false;
}

export function normalizeJacredResults(lists = [], type = "movie") {
  const unique = new Map();
  for (const item of lists.flat()) {
    const magnet = String(item?.magnet || "").trim();
    if (!magnet.startsWith("magnet:")) continue;
    const types = Array.isArray(item.types) ? item.types : [];
    const seasons = Array.isArray(item.seasons) ? item.seasons : [];
    if (type === "movie" && (types.includes("series") || types.includes("anime") || seasons.length)) continue;
    if (type !== "movie" && types.includes("movie") && !seasons.length) continue;
    const hash = magnet.match(/btih:([a-f0-9]{40})/i)?.[1]?.toLowerCase();
    const key = hash || magnet;
    const qualityNumber = Number(item.quality) || 0;
    const quality = qualityNumber === 2160 ? "4K" : qualityNumber ? `${qualityNumber}p` : "";
    const voices = Array.isArray(item.voice) ? item.voice : Array.isArray(item.voices) ? item.voices : [];
    const numericSize = Number(item.size) || 0;
    const candidate = {
      provider: "Jacred",
      title: String(item.title || "").replace(/\\u[\dA-F]{4}/gi, (match) => String.fromCharCode(Number.parseInt(match.slice(2), 16))).trim(),
      magnet,
      infoHash: hash || "",
      sizeGB: parseSizeGb(numericSize > 0 ? numericSize : item.sizeName),
      seeds: Number(item.sid || item.seeds || item.seeders) || 0,
      date: item.createdTime || item.createTime ? new Date(item.createdTime || item.createTime).getTime() : 0,
      tracker: String(item.tracker || "Jacred"),
      quality,
      videoType: String(item.videotype || ""),
      audio: voices.filter(Boolean).join("/"),
      year: Number.parseInt(item.relased || item.released || item.related || "0", 10) || 0,
      seasons: seasons.map(Number).filter((value) => value >= 0),
      types: types.map((value) => String(value)),
      pack: type !== "movie",
      sourceKind: "jacred",
    };
    const existing = unique.get(key);
    if (!existing) unique.set(key, candidate);
    else unique.set(key, {
      ...(candidate.sizeGB > existing.sizeGB ? candidate : existing),
      seeds: Math.max(existing.seeds, candidate.seeds),
      seasons: [...new Set([...(existing.seasons || []), ...candidate.seasons])],
      types: [...new Set([...(existing.types || []), ...candidate.types])],
    });
  }
  return [...unique.values()];
}

export function buildTorrentioEndpoint(manifestUrl, type, id) {
  const url = new URL(String(manifestUrl).replace(/^stremio:\/\//i, "https://"));
  url.pathname = url.pathname.replace(/\/manifest\.json$/i, "").replace(/\/$/, "")
    + `/stream/${encodeURIComponent(type === "anime" ? "series" : type)}/${encodeURIComponent(id)}.json`;
  return url.toString();
}

export function sortAndLimitNativeResults(results, config) {
  const min = config.sizeMinGB || 0, max = config.sizeMaxGB ?? 1000;
  const filtered = results.filter((item) => item.sizeGB >= min
    && (max >= 1000 || item.sizeGB <= max)
    && !isQualityHidden(item.title, item.quality, config.commonQualityFilter));
  if (config.commonSortBy === "seeds") filtered.sort((a, b) => (b.seeds || 0) - (a.seeds || 0));
  else if (config.commonSortBy === "date") filtered.sort((a, b) => (b.date || 0) - (a.date || 0));
  else filtered.sort((a, b) => (b.sizeGB || 0) - (a.sizeGB || 0));
  return filtered.slice(0, config.maxResults);
}
