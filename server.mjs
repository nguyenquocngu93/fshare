import { createHash } from "node:crypto";
import { setDefaultResultOrder } from "node:dns";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC_DIR = join(ROOT, "public");
const GIB = 1024 ** 3;
const MAGNETZ_API = "https://magnetz.eu";
const KNABEN_API = "https://api.knaben.org/v1";
const TMDB_API = "https://api.themoviedb.org/3";
const TMDB_IMAGE_API = "https://image.tmdb.org/t/p";

export function loadEnvFile(path = join(ROOT, ".env")) {
  if (!existsSync(path)) return;
  const parsed = new Map();
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed.set(key, value);
  }
  for (const [key, value] of parsed) {
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const DNS_RESULT_ORDER = ["ipv4first", "verbatim"].includes(process.env.DNS_RESULT_ORDER)
  ? process.env.DNS_RESULT_ORDER
  : "ipv4first";
try {
  setDefaultResultOrder(DNS_RESULT_ORDER);
} catch {
  // Older/alternative Node builds may not expose this setting.
}

export function isRunningInContainer() {
  if (existsSync("/.dockerenv")) return true;
  try {
    const cgroup = readFileSync("/proc/1/cgroup", "utf8");
    return /docker|containerd|kubepods|podman/i.test(cgroup);
  } catch {
    return false;
  }
}

export function resolveLocalServiceUrl(value, runningInContainer = isRunningInContainer()) {
  const original = String(value || "").trim();
  const url = new URL(original);
  let autoCorrected = false;
  if (!runningInContainer && url.hostname.toLowerCase() === "host.docker.internal") {
    url.hostname = "127.0.0.1";
    autoCorrected = true;
  }
  return { url, original, autoCorrected };
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".zip": "application/zip",
};

function integer(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function number(value, fallback, min, max) {
  const parsed = Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function bool(value, fallback = false) {
  if (value == null) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function cleanText(value, maxLength = 500) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeHash(value) {
  const hash = String(value ?? "").trim().toUpperCase();
  return /^[A-F0-9]{40}$/.test(hash) ? hash : "";
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value <= 0) return "Không rõ";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const amount = value / 1024 ** index;
  return `${amount >= 10 || index === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[index]}`;
}

function resultReference(result) {
  return createHash("sha256")
    .update(
      [result.source, result.providerId, result.infoHash, result.size, result.link].join("\n"),
    )
    .digest("base64url")
    .slice(0, 22);
}

export function normalizeMagnetz(item) {
  const size = Number(item?.size) || 0;
  const result = {
    source: "magnetz",
    sources: ["magnetz"],
    providerId: cleanText(item?.sqid, 80),
    title: cleanText(item?.name, 500),
    size,
    humanSize: item?.human_size || formatBytes(size),
    seeders: Number(item?.seeders) || 0,
    leechers: Number(item?.leechers) || 0,
    infoHash: normalizeHash(item?.info_hash),
    link: typeof item?.magnet_link === "string" ? item.magnet_link : "",
    category: cleanText(item?.release?.type || "Magnet", 80),
    origin: "Magnetz",
    detailsUrl: typeof item?.web_url === "string" ? item.web_url : "",
    verified: Boolean(item?.is_verified),
    health: Number(item?.health) || 0,
    date: item?.created_at || "",
    largestFile: cleanText(item?.largest_file, 500),
  };
  return result.title && result.providerId ? result : null;
}

export function normalizeKnaben(item) {
  const size = Number(item?.bytes) || 0;
  const link = item?.magnetUrl || item?.link || "";
  const result = {
    source: "knaben",
    sources: ["knaben"],
    providerId: cleanText(item?.id || item?.hash, 100),
    title: cleanText(item?.title, 500),
    size,
    humanSize: formatBytes(size),
    seeders: Number(item?.seeders) || 0,
    leechers: Number(item?.peers) || 0,
    infoHash: normalizeHash(item?.hash),
    link: typeof link === "string" ? link : "",
    category: cleanText(item?.category || "Torrent", 100),
    origin: cleanText(item?.cachedOrigin || item?.tracker || "Knaben", 100),
    detailsUrl: typeof item?.details === "string" ? item.details : "",
    verified: false,
    health: 0,
    date: item?.lastSeen || item?.date || "",
    largestFile: "",
    virusScore: Number(item?.virusDetection) || 0,
  };
  return result.title && result.providerId && result.link ? result : null;
}

export function normalizeTmdb(item, fallbackMediaType = "movie") {
  const mediaType = item?.media_type === "tv" || fallbackMediaType === "tv" ? "tv" : "movie";
  const title = cleanText(item?.title || item?.name, 300);
  const originalTitle = cleanText(item?.original_title || item?.original_name || title, 300);
  const date = cleanText(item?.release_date || item?.first_air_date, 20);
  const year = /^\d{4}/.test(date) ? date.slice(0, 4) : "";
  const id = Number(item?.id) || 0;
  if (!id || !title || item?.adult === true) return null;
  return {
    id,
    mediaType,
    title,
    originalTitle,
    overview: cleanText(item?.overview, 1_200),
    date,
    year,
    rating: Math.round((Number(item?.vote_average) || 0) * 10) / 10,
    voteCount: Number(item?.vote_count) || 0,
    popularity: Number(item?.popularity) || 0,
    posterPath: /^\/[A-Za-z0-9_.-]+$/.test(item?.poster_path || "") ? item.poster_path : "",
    backdropPath: /^\/[A-Za-z0-9_.-]+$/.test(item?.backdrop_path || "") ? item.backdrop_path : "",
    originalLanguage: cleanText(item?.original_language, 10),
    searchQuery: `${originalTitle}${year ? ` ${year}` : ""}`,
    tmdbUrl: `https://www.themoviedb.org/${mediaType}/${id}`,
  };
}

export function normalizeTmdbDetail(payload, mediaType = "movie", region = "VN") {
  const base = normalizeTmdb({ ...payload, media_type: mediaType }, mediaType);
  if (!base) return null;
  const uniquePeople = (people) => {
    const seen = new Set();
    return people.filter((person) => {
      if (!person?.id || seen.has(person.id)) return false;
      seen.add(person.id);
      return true;
    });
  };
  const crewDirectors = (payload?.credits?.crew || []).filter(
    (person) => person.job === "Director" || (person.department === "Directing" && person.job === "Series Director"),
  );
  const directors = uniquePeople([
    ...(payload?.created_by || []),
    ...crewDirectors,
  ]).slice(0, 8).map((person) => ({
    id: person.id,
    name: cleanText(person.name, 160),
    job: cleanText(person.job || (mediaType === "tv" ? "Creator" : "Director"), 80),
    profilePath: /^\/[A-Za-z0-9_.-]+$/.test(person.profile_path || "") ? person.profile_path : "",
  }));
  const cast = uniquePeople(payload?.credits?.cast || []).slice(0, 18).map((person) => ({
    id: person.id,
    name: cleanText(person.name, 160),
    character: cleanText(person.character, 180),
    profilePath: /^\/[A-Za-z0-9_.-]+$/.test(person.profile_path || "") ? person.profile_path : "",
  }));
  const keywordSource = payload?.keywords?.keywords || payload?.keywords?.results || [];
  const keywords = keywordSource.slice(0, 30).map((item) => ({
    id: Number(item.id) || 0,
    name: cleanText(item.name, 100),
  })).filter((item) => item.id && item.name);
  const logos = (payload?.images?.logos || [])
    .filter((item) => /^\/[A-Za-z0-9_.-]+$/.test(item.file_path || ""))
    .sort((a, b) => {
      const rank = (language) => (language === "vi" ? 3 : language === "en" ? 2 : 1);
      return rank(b.iso_639_1) - rank(a.iso_639_1) || (b.vote_average || 0) - (a.vote_average || 0);
    });
  let certification = "";
  if (mediaType === "movie") {
    const releases = payload?.release_dates?.results || [];
    const country = releases.find((item) => item.iso_3166_1 === region)
      || releases.find((item) => item.iso_3166_1 === "US");
    certification = cleanText(
      country?.release_dates?.find((item) => item.certification)?.certification,
      20,
    );
  } else {
    const ratings = payload?.content_ratings?.results || [];
    certification = cleanText(
      ratings.find((item) => item.iso_3166_1 === region)?.rating
        || ratings.find((item) => item.iso_3166_1 === "US")?.rating,
      20,
    );
  }
  const videos = (payload?.videos?.results || []).filter(
    (video) => video.site === "YouTube" && video.key,
  );
  const trailer = videos.find((video) => video.type === "Trailer" && video.official)
    || videos.find((video) => video.type === "Trailer")
    || videos[0];

  const rawRec = [
    ...(payload?.recommendations?.results || []),
    ...(payload?.similar?.results || []),
  ];
  const seenRec = new Set();
  const relatedContent = rawRec
    .map((item) => normalizeTmdb(item, mediaType))
    .filter((item) => {
      if (!item || seenRec.has(item.id)) return false;
      seenRec.add(item.id);
      return true;
    })
    .slice(0, 20);

  return {
    ...base,
    tagline: cleanText(payload?.tagline, 300),
    status: cleanText(payload?.status, 80),
    runtime: Number(payload?.runtime) || Number(payload?.episode_run_time?.[0]) || 0,
    genres: (payload?.genres || []).map((genre) => ({ id: genre.id, name: cleanText(genre.name, 100) })),
    keywords,
    directors,
    cast,
    certification,
    logoPath: logos[0]?.file_path || "",
    homepage: /^https?:\/\//.test(payload?.homepage || "") ? payload.homepage : "",
    productionCompanies: (payload?.production_companies || []).slice(0, 12).map((company) => ({
      id: company.id,
      name: cleanText(company.name, 180),
      originCountry: cleanText(company.origin_country, 10),
      logoPath: /^\/[A-Za-z0-9_.-]+$/.test(company.logo_path || "") ? company.logo_path : "",
    })),
    numberOfSeasons: Number(payload?.number_of_seasons) || 0,
    numberOfEpisodes: Number(payload?.number_of_episodes) || 0,
    seasons: (payload?.seasons || [])
      .filter((season) => Number(season.episode_count) > 0)
      .map((season) => ({
        id: Number(season.id) || 0,
        seasonNumber: Number(season.season_number) || 0,
        name: cleanText(season.name, 180),
        overview: cleanText(season.overview, 1_200),
        episodeCount: Number(season.episode_count) || 0,
        airDate: cleanText(season.air_date, 20),
        posterPath: /^\/[A-Za-z0-9_.-]+$/.test(season.poster_path || "") ? season.poster_path : "",
      }))
      .sort((a, b) => a.seasonNumber - b.seasonNumber),
    budget: Number(payload?.budget) || 0,
    revenue: Number(payload?.revenue) || 0,
    trailerKey: trailer?.key || "",
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}` : "",
    relatedContent,
  };
}

export function normalizeTmdbSeason(payload) {
  const seasonNumber = Number(payload?.season_number) || 0;
  return {
    id: Number(payload?.id) || 0,
    seasonNumber,
    name: cleanText(payload?.name || `Season ${seasonNumber}`, 180),
    overview: cleanText(payload?.overview, 2_000),
    airDate: cleanText(payload?.air_date, 20),
    posterPath: /^\/[A-Za-z0-9_.-]+$/.test(payload?.poster_path || "") ? payload.poster_path : "",
    episodes: (payload?.episodes || []).map((episode) => ({
      id: Number(episode.id) || 0,
      name: cleanText(episode.name || `Episode ${episode.episode_number}`, 240),
      overview: cleanText(episode.overview, 2_000),
      seasonNumber: Number(episode.season_number) || seasonNumber,
      episodeNumber: Number(episode.episode_number) || 0,
      airDate: cleanText(episode.air_date, 20),
      runtime: Number(episode.runtime) || 0,
      voteAverage: Math.round((Number(episode.vote_average) || 0) * 10) / 10,
      stillPath: /^\/[A-Za-z0-9_.-]+$/.test(episode.still_path || "") ? episode.still_path : "",
    })).filter((episode) => episode.id && episode.episodeNumber > 0),
  };
}

export function normalizeTmdbPersonSummary(person) {
  const id = Number(person?.id) || 0;
  const name = cleanText(person?.name, 200);
  if (!id || !name) return null;
  return {
    id,
    name,
    knownForDepartment: cleanText(person?.known_for_department, 100),
    popularity: Number(person?.popularity) || 0,
    profilePath: /^\/[A-Za-z0-9_.-]+$/.test(person?.profile_path || "") ? person.profile_path : "",
    knownFor: (person?.known_for || []).map((item) => normalizeTmdb(item, item.media_type || "movie")).filter(Boolean).slice(0, 4),
  };
}

export function normalizeTmdbPersonDetail(payload) {
  const summary = normalizeTmdbPersonSummary(payload);
  if (!summary) return null;
  const credits = payload?.combined_credits || {};
  const combined = [
    ...(credits.cast || []).map((item) => ({ ...item, creditRole: item.character || "Cast" })),
    ...(credits.crew || []).map((item) => ({ ...item, creditRole: item.job || item.department || "Crew" })),
  ];
  const seen = new Set();
  const filmography = combined
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .map((item) => {
      const media = normalizeTmdb(item, item.media_type || "movie");
      return media ? { ...media, creditRole: cleanText(item.creditRole, 160) } : null;
    })
    .filter((item) => {
      if (!item) return false;
      const key = `${item.mediaType}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 120);
  return {
    ...summary,
    biography: cleanText(payload?.biography, 8_000),
    birthday: cleanText(payload?.birthday, 20),
    deathday: cleanText(payload?.deathday, 20),
    placeOfBirth: cleanText(payload?.place_of_birth, 240),
    gender: Number(payload?.gender) || 0,
    alsoKnownAs: (payload?.also_known_as || []).map((name) => cleanText(name, 180)).filter(Boolean).slice(0, 20),
    filmography,
    movieCredits: filmography.filter((item) => item.mediaType === "movie"),
    tvCredits: filmography.filter((item) => item.mediaType === "tv"),
  };
}

export function deduplicateResults(results) {
  const unique = new Map();
  for (const candidate of results.filter(Boolean)) {
    const key = candidate.infoHash || `${candidate.title.toLowerCase()}|${candidate.size}`;
    const existing = unique.get(key);
    if (!existing) {
      unique.set(key, { ...candidate, sources: [...candidate.sources] });
      continue;
    }

    const merged = {
      sources: [...new Set([...existing.sources, ...candidate.sources])],
      seeders: Math.max(existing.seeders, candidate.seeders),
      leechers: Math.max(existing.leechers, candidate.leechers),
      verified: existing.verified || candidate.verified,
      health: Math.max(existing.health, candidate.health),
    };

    const existingIsMagnet = existing.link.startsWith("magnet:");
    const candidateIsMagnet = candidate.link.startsWith("magnet:");
    if (
      (!existingIsMagnet && candidateIsMagnet) ||
      (existingIsMagnet === candidateIsMagnet && candidate.link.length > existing.link.length)
    ) {
      Object.assign(existing, candidate);
    }
    Object.assign(existing, merged);
  }
  return [...unique.values()];
}

function safeJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  res.end(body);
}

async function fetchJson(url, options = {}, timeoutMs = 12_000, fetchImpl = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response;
    try {
      response = await fetchImpl(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "TorrShelf/0.3 (+local companion)",
          ...(options.headers || {}),
        },
      });
    } catch (error) {
      const host = new URL(url).hostname;
      const cause = error?.cause;
      const code = cause?.code || (error?.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR");
      const detail = cleanText(cause?.message || error?.message || "Network request failed", 260);
      const wrapped = new Error(`Kết nối ${host} thất bại [${code}]: ${detail}`);
      wrapped.code = code;
      wrapped.cause = cause || error;
      throw wrapped;
    }
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Phản hồi không phải JSON từ ${new URL(url).hostname}`);
    }
    if (!response.ok) {
      const message =
        data?.message || data?.status_message || data?.error || `${response.status} ${response.statusText}`;
      const error = new Error(String(message));
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function searchMagnetz(query, page, fetchImpl) {
  if (page > 4) return { results: [], total: 100, pages: 4 };
  const url = new URL("/api/magnets/search", MAGNETZ_API);
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  const payload = await fetchJson(url, {}, 12_000, fetchImpl);
  return {
    results: Array.isArray(payload?.data) ? payload.data.map(normalizeMagnetz).filter(Boolean) : [],
    total: Number(payload?.meta?.total) || 0,
    pages: Number(payload?.meta?.last_page) || 1,
  };
}

async function searchKnaben(query, page, hideXxx, sort, fetchImpl) {
  const pageSize = 50;
  const order = {
    seeders: { field: "seeders", direction: "desc" },
    "size-desc": { field: "bytes", direction: "desc" },
    "size-asc": { field: "bytes", direction: "asc" },
    newest: { field: "date", direction: "desc" },
  }[sort] || { field: "seeders", direction: "desc" };
  const payload = await fetchJson(
    KNABEN_API,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        search_type: "100%",
        search_field: "title",
        query,
        order_by: order.field,
        order_direction: order.direction,
        from: (page - 1) * pageSize,
        size: pageSize,
        hide_unsafe: true,
        hide_xxx: hideXxx,
      }),
    },
    12_000,
    fetchImpl,
  );
  const total = Number(payload?.total?.value) || 0;
  return {
    results: Array.isArray(payload?.hits) ? payload.hits.map(normalizeKnaben).filter(Boolean) : [],
    total,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function sortResults(results, sort) {
  const copy = [...results];
  if (sort === "size-asc") copy.sort((a, b) => a.size - b.size || b.seeders - a.seeders);
  else if (sort === "size-desc") copy.sort((a, b) => b.size - a.size || b.seeders - a.seeders);
  else if (sort === "newest") copy.sort((a, b) => Date.parse(b.date || 0) - Date.parse(a.date || 0));
  else copy.sort((a, b) => b.seeders - a.seeders || b.leechers - a.leechers);
  return copy;
}

function isAllowedTorrentLink(value) {
  if (typeof value !== "string" || value.length > 16_000) return false;
  if (/^magnet:\?xt=urn:btih:[a-z0-9]+/i.test(value)) return true;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ["knaben.eu", "www.knaben.eu", "knaben.org", "www.knaben.org"].includes(url.hostname) &&
      url.pathname.startsWith("/live/dl/")
    );
  } catch {
    return false;
  }
}

async function readJsonBody(req, maxBytes = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("Nội dung yêu cầu quá lớn");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw new Error("JSON không hợp lệ");
  }
}

function basicAuthHeader(username, password) {
  if (!username) return {};
  return { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` };
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function createRateLimiter() {
  const buckets = new Map();
  return function allow(key, limit, windowMs) {
    const now = Date.now();
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    current.count += 1;
    return current.count <= limit;
  };
}

function securityHeaders() {
  return {
    "Content-Security-Policy":
      "default-src 'self'; base-uri 'self'; connect-src 'self' *; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; form-action 'self'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

function serveStatic(req, res, pathname) {
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const safePath = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath) || !statSync(filePath).isFile()) return false;
  const stat = statSync(filePath);
  const extension = extname(filePath);
  const shouldRevalidate = filePath.endsWith("index.html") || extension === ".css" || extension === ".js";
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control": shouldRevalidate
      ? "no-cache, no-store, must-revalidate"
      : "public, max-age=3600",
    ...securityHeaders(),
  });
  createReadStream(filePath).pipe(res);
  return true;
}

const MOOD_GENRES = {
  adrenaline: "28,53,12",
  cozy: "35,10751,16",
  spooky: "27,9648",
  emotional: "18,10749",
  epic: "878,14,12",
  happy: "35,10402,16",
  mindbending: "9648,878,53",
};

const MOOD_NAMES = {
  adrenaline: "Adrenaline Hits — Kịch tính & Bùng nổ",
  cozy: "Cozy Night — Thư giãn & Gia đình",
  spooky: "Spooky & Thrills — Rùng rợn & Ám ảnh",
  emotional: "Deeply Emotional — Cảm xúc & Lắng đọng",
  epic: "Epic Sagas — Sử thi & Kỳ vĩ",
  happy: "Happy & Upbeat — Vui vẻ & Năng lượng",
  mindbending: "Mind-Bending — Xoắn não & Trí tuệ",
};

export function createTorrShelf(options = {}) {
  const runningInContainer = options.runningInContainer ?? isRunningInContainer();
  const torrServerResolution = resolveLocalServiceUrl(
    options.torrServerUrl || process.env.TORRSERVER_URL || "http://127.0.0.1:8090",
    runningInContainer,
  );
  const publicUrlResolution = resolveLocalServiceUrl(
    options.torrServerPublicUrl || process.env.TORRSERVER_PUBLIC_URL || "http://127.0.0.1:8090",
    runningInContainer,
  );
  const config = {
    host: options.host || process.env.HOST || "127.0.0.1",
    port: integer(options.port ?? process.env.PORT, 8787, 1, 65_535),
    torrServerUrl: torrServerResolution.url,
    torrServerPublicUrl: publicUrlResolution.url.toString().replace(/\/$/, ""),
    torrServerUrlAutoCorrected: torrServerResolution.autoCorrected,
    torrServerOriginalUrl: torrServerResolution.original,
    torrServerUsername: options.torrServerUsername ?? process.env.TORRSERVER_USERNAME ?? "",
    torrServerPassword: options.torrServerPassword ?? process.env.TORRSERVER_PASSWORD ?? "",
    tmdbToken: options.tmdbToken ?? process.env.TMDB_API_TOKEN ?? "",
    tmdbApiKey: options.tmdbApiKey ?? process.env.TMDB_API_KEY ?? "",
    tmdbLanguage: options.tmdbLanguage ?? process.env.TMDB_LANGUAGE ?? "vi-VN",
    tmdbRegion: options.tmdbRegion ?? process.env.TMDB_REGION ?? "VN",
    fetchImpl: options.fetchImpl || fetch,
  };
  const searchCache = new Map();
  const resultStore = new Map();
  let tmdbHomeCache = null;
  const tmdbListCache = new Map();
  const tmdbDetailCache = new Map();
  const tmdbSearchCache = new Map();
  const tmdbPersonCache = new Map();
  const tmdbSeasonCache = new Map();
  let tmdbActiveMode = null;
  let tmdbLastError = null;
  const allowRequest = createRateLimiter();

  function rememberResults(results) {
    const expiresAt = Date.now() + 15 * 60_000;
    return results.map((result) => {
      const ref = resultReference(result);
      resultStore.set(ref, { result, expiresAt });
      return { ...result, ref };
    });
  }

  function cleanStores() {
    const now = Date.now();
    for (const [key, value] of resultStore) if (value.expiresAt < now) resultStore.delete(key);
    for (const [key, value] of searchCache) if (value.expiresAt < now) searchCache.delete(key);
  }

  function getTmdbCredentials() {
    let token = String(config.tmdbToken || "").trim();
    let apiKey = String(config.tmdbApiKey || "").trim();
    if (/^Bearer\s+/i.test(token)) token = token.replace(/^Bearer\s+/i, "").trim();
    if (!apiKey && /^[a-f0-9]{32}$/i.test(token)) {
      apiKey = token;
      token = "";
    }
    return {
      token,
      apiKey,
      configured: Boolean(token || apiKey),
      mode: token ? "read_access_token" : apiKey ? "api_key_v3" : "none",
    };
  }

  function isTmdbConfigured() {
    return getTmdbCredentials().configured;
  }

  async function tmdbFetch(pathname, params = {}) {
    const credentials = getTmdbCredentials();
    if (!credentials.configured) throw new Error("TMDB chưa được cấu hình.");

    const availableModes = [];
    if (credentials.token) availableModes.push("read_access_token");
    if (credentials.apiKey) availableModes.push("api_key_v3");
    const modes = tmdbActiveMode && availableModes.includes(tmdbActiveMode)
      ? [tmdbActiveMode, ...availableModes.filter((mode) => mode !== tmdbActiveMode)]
      : availableModes;
    let lastError;

    for (const mode of modes) {
      const url = new URL(`${TMDB_API}${pathname}`);
      url.searchParams.set("language", config.tmdbLanguage);
      for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== "") url.searchParams.set(key, String(value));
      }
      if (mode === "api_key_v3") url.searchParams.set("api_key", credentials.apiKey);
      try {
        const result = await fetchJson(
          url,
          {
            headers: mode === "read_access_token"
              ? { Authorization: `Bearer ${credentials.token}` }
              : {},
          },
          12_000,
          config.fetchImpl,
        );
        tmdbActiveMode = mode;
        tmdbLastError = null;
        return result;
      } catch (error) {
        lastError = error;
        tmdbLastError = cleanText(error.message || "TMDB request failed", 300);
        if (![401, 403].includes(error.status)) break;
      }
    }
    throw lastError || new Error("TMDB authentication failed");
  }

  function getTmdbRailDefinitions() {
    return [
      {
        key: "trending",
        title: "Thịnh hành tuần này",
        subtitle: "Những tựa phim và series đang được quan tâm nhiều nhất",
        mediaType: "movie",
        path: "/trending/all/week",
        params: {},
      },
      {
        key: "popularMovies",
        title: "Phim lẻ phổ biến",
        subtitle: "Được cộng đồng điện ảnh xem nhiều nhất",
        mediaType: "movie",
        path: "/movie/popular",
        params: { region: config.tmdbRegion },
      },
      {
        key: "popularTv",
        title: "Series truyền hình",
        subtitle: "Chương trình truyền hình nổi bật toàn cầu",
        mediaType: "tv",
        path: "/tv/popular",
        params: {},
      },
      {
        key: "nowPlaying",
        title: "Đang chiếu tại rạp",
        subtitle: "Phát hành mới nhất tại các rạp chiếu",
        mediaType: "movie",
        path: "/movie/now_playing",
        params: { region: config.tmdbRegion },
      },
      {
        key: "animeSpotlight",
        title: "Anime nổi bật",
        subtitle: "Thế giới hoạt hình Nhật Bản đỉnh cao",
        mediaType: "tv",
        path: "/discover/tv",
        params: { with_genres: "16", with_original_language: "ja", sort_by: "popularity.desc" },
      },
      {
        key: "topRated",
        title: "Đánh giá cao nhất",
        subtitle: "Tuyệt phẩm điểm số cao không thể bỏ lỡ",
        mediaType: "movie",
        path: "/movie/top_rated",
        params: { region: config.tmdbRegion },
      },
      {
        key: "upcoming",
        title: "Sắp ra mắt",
        subtitle: "Lịch phát hành các bom tấn sắp tới",
        mediaType: "movie",
        path: "/movie/upcoming",
        params: { region: config.tmdbRegion },
      },
    ];
  }

  async function handleTmdbHome(req, res) {
    const ip = req.socket.remoteAddress || "unknown";
    if (!allowRequest(`tmdb:${ip}`, 40, 60_000)) {
      return safeJson(res, 429, { error: "Bạn tải trang khám phá quá nhanh. Hãy thử lại sau." });
    }
    if (!isTmdbConfigured()) {
      return safeJson(res, 503, {
        error: "TMDB chưa được cấu hình.",
        code: "tmdb_not_configured",
        setup: "Thêm TMDB_API_TOKEN vào file .env rồi khởi động lại TorrShelf.",
      });
    }
    if (tmdbHomeCache?.expiresAt > Date.now()) {
      return safeJson(res, 200, { ...tmdbHomeCache.payload, cached: true });
    }

    try {
      await tmdbFetch("/configuration");
    } catch (error) {
      const authFailure = [401, 403].includes(error.status);
      return safeJson(res, authFailure ? 401 : 502, {
        error: authFailure
          ? `TMDB từ chối thông tin xác thực: ${cleanText(error.message, 300)}`
          : `Không kết nối được TMDB: ${cleanText(error.message, 300)}`,
        code: authFailure ? "tmdb_auth_failed" : "tmdb_unreachable",
        credentialMode: getTmdbCredentials().mode,
      });
    }

    const railDefinitions = getTmdbRailDefinitions();
    const startedAt = Date.now();
    const settled = await Promise.allSettled(
      railDefinitions.map((rail) => tmdbFetch(rail.path, rail.params)),
    );
    const errors = [];
    const rails = [];
    settled.forEach((outcome, index) => {
      const definition = railDefinitions[index];
      if (outcome.status === "rejected") {
        errors.push({ key: definition.key, message: cleanText(outcome.reason?.message, 240) });
        return;
      }
      const items = (outcome.value?.results || [])
        .map((item) => normalizeTmdb(item, definition.mediaType))
        .filter(Boolean)
        .slice(0, 20);
      if (items.length) rails.push({ ...definition, items, path: undefined, params: undefined });
    });

    if (!rails.length) {
      return safeJson(res, 502, { error: "Không tải được dữ liệu TMDB.", sources: errors });
    }

    const trendingRail = rails.find((r) => r.key === "trending");
    const heroCandidates = (trendingRail ? trendingRail.items : rails.flatMap((r) => r.items))
      .filter((item) => item.backdropPath && item.overview);
    const heroes = heroCandidates.slice(0, 6);
    const hero = heroes[0] || rails[0].items[0];

    const payload = {
      hero,
      heroes,
      rails,
      meta: {
        language: config.tmdbLanguage,
        region: config.tmdbRegion,
        credentialMode: tmdbActiveMode,
        errors,
        durationMs: Date.now() - startedAt,
      },
      cached: false,
    };
    tmdbHomeCache = { payload, expiresAt: Date.now() + 10 * 60_000 };
    return safeJson(res, 200, payload);
  }

  async function handleTmdbList(req, res, url) {
    const ip = req.socket.remoteAddress || "unknown";
    if (!allowRequest(`tmdb-list:${ip}`, 60, 60_000)) {
      return safeJson(res, 429, { error: "Bạn tải danh mục quá nhanh. Hãy thử lại sau." });
    }
    const key = cleanText(url.searchParams.get("key"), 40);
    const page = integer(url.searchParams.get("page"), 1, 1, 100);
    const definition = getTmdbRailDefinitions().find((rail) => rail.key === key);
    if (!definition) return safeJson(res, 404, { error: "Danh mục TMDB không hợp lệ." });
    const cacheKey = `${key}:${page}`;
    const cached = tmdbListCache.get(cacheKey);
    if (cached?.expiresAt > Date.now()) return safeJson(res, 200, { ...cached.payload, cached: true });
    try {
      const payload = await tmdbFetch(definition.path, { ...definition.params, page });
      const result = {
        key,
        title: definition.title,
        subtitle: definition.subtitle,
        page: Number(payload?.page) || page,
        totalPages: Math.min(100, Number(payload?.total_pages) || 1),
        totalResults: Number(payload?.total_results) || 0,
        items: (payload?.results || [])
          .map((item) => normalizeTmdb(item, definition.mediaType))
          .filter(Boolean),
        cached: false,
      };
      tmdbListCache.set(cacheKey, { payload: result, expiresAt: Date.now() + 10 * 60_000 });
      return safeJson(res, 200, result);
    } catch (error) {
      return safeJson(res, error.status === 401 ? 401 : 502, {
        error: cleanText(error.message || "Không tải được danh mục TMDB.", 400),
      });
    }
  }

  async function handleTmdbSearch(req, res, url) {
    const ip = req.socket.remoteAddress || "unknown";
    if (!allowRequest(`tmdb-search:${ip}`, 60, 60_000)) {
      return safeJson(res, 429, { error: "Bạn tìm TMDB quá nhanh. Hãy thử lại sau." });
    }
    const query = cleanText(url.searchParams.get("q"), 160);
    const page = integer(url.searchParams.get("page"), 1, 1, 100);
    if (query.length < 2) return safeJson(res, 422, { error: "Nhập ít nhất 2 ký tự." });
    const cacheKey = `${query.toLowerCase()}:${page}`;
    const cached = tmdbSearchCache.get(cacheKey);
    if (cached?.expiresAt > Date.now()) return safeJson(res, 200, { ...cached.payload, cached: true });
    try {
      const payload = await tmdbFetch("/search/multi", {
        query,
        page,
        include_adult: false,
      });
      const media = [];
      const people = [];
      for (const item of payload?.results || []) {
        if (item.media_type === "person") {
          const person = normalizeTmdbPersonSummary(item);
          if (person) people.push(person);
        } else {
          const result = normalizeTmdb(item, item.media_type || "movie");
          if (result) media.push(result);
        }
      }
      const result = {
        query,
        page: Number(payload?.page) || page,
        totalPages: Math.min(100, Number(payload?.total_pages) || 1),
        totalResults: Number(payload?.total_results) || 0,
        items: media,
        people,
        cached: false,
      };
      tmdbSearchCache.set(cacheKey, { payload: result, expiresAt: Date.now() + 5 * 60_000 });
      return safeJson(res, 200, result);
    } catch (error) {
      return safeJson(res, error.status === 401 ? 401 : 502, {
        error: cleanText(error.message || "Không tìm kiếm được TMDB.", 400),
      });
    }
  }

  async function handleTmdbDiscover(req, res, url) {
    const ip = req.socket.remoteAddress || "unknown";
    if (!allowRequest(`tmdb-discover:${ip}`, 60, 60_000)) {
      return safeJson(res, 429, { error: "Bạn tải danh mục quá nhanh. Hãy thử lại sau." });
    }
    const kind = cleanText(url.searchParams.get("kind"), 20);
    const id = integer(url.searchParams.get("id"), 0, 0, 2_000_000_000);
    const mediaType = url.searchParams.get("media") === "tv" ? "tv" : "movie";
    const page = integer(url.searchParams.get("page"), 1, 1, 100);
    const label = cleanText(url.searchParams.get("label"), 160) || "Danh mục";
    const moodKey = cleanText(url.searchParams.get("mood"), 30).toLowerCase();
    const sort = cleanText(url.searchParams.get("sort"), 40) || "popularity.desc";

    const fieldByKind = {
      genre: "with_genres",
      keyword: "with_keywords",
      company: "with_companies",
    };

    let params = {
      page,
      sort_by: sort,
      include_adult: false,
      region: config.tmdbRegion,
    };
    let title = `Danh mục: ${label}`;
    let subtitle = mediaType === "tv" ? "Series trên TMDB" : "Phim lẻ trên TMDB";

    if (kind === "mood" && moodKey) {
      params.with_genres = MOOD_GENRES[moodKey] || "28";
      title = MOOD_NAMES[moodKey] || `Tâm trạng: ${moodKey}`;
      subtitle = "Tuyển tập phù hợp với tâm trạng của bạn";
    } else if (kind === "anime") {
      params.with_genres = "16";
      params.with_original_language = "ja";
      title = label !== "Danh mục" ? `Anime: ${label}` : "Anime Universe";
      subtitle = "Hoạt hình Nhật Bản tuyển chọn";
    } else if (fieldByKind[kind] && id) {
      params[fieldByKind[kind]] = id;
      title = kind === "genre" ? `Thể loại: ${label}` : kind === "keyword" ? `Tag: ${label}` : `Hãng: ${label}`;
    } else if (kind === "all") {
      title = label || "Tất cả phim & series";
    } else {
      return safeJson(res, 422, { error: "Bộ lọc TMDB không hợp lệ." });
    }

    const cacheKey = `discover:${kind}:${id}:${moodKey}:${mediaType}:${sort}:${page}`;
    const cached = tmdbListCache.get(cacheKey);
    if (cached?.expiresAt > Date.now()) return safeJson(res, 200, { ...cached.payload, cached: true });

    try {
      const payload = await tmdbFetch(`/discover/${mediaType}`, params);
      const result = {
        key: cacheKey,
        title,
        subtitle,
        page: Number(payload?.page) || page,
        totalPages: Math.min(100, Number(payload?.total_pages) || 1),
        totalResults: Number(payload?.total_results) || 0,
        items: (payload?.results || []).map((item) => normalizeTmdb(item, mediaType)).filter(Boolean),
        cached: false,
      };
      tmdbListCache.set(cacheKey, { payload: result, expiresAt: Date.now() + 10 * 60_000 });
      return safeJson(res, 200, result);
    } catch (error) {
      return safeJson(res, error.status === 401 ? 401 : 502, {
        error: cleanText(error.message || "Không tải được bộ lọc TMDB.", 400),
      });
    }
  }

  async function handleTmdbPerson(req, res, id) {
    const ip = req.socket.remoteAddress || "unknown";
    if (!allowRequest(`tmdb-person:${ip}`, 60, 60_000)) {
      return safeJson(res, 429, { error: "Bạn tải hồ sơ quá nhanh. Hãy thử lại sau." });
    }
    if (!/^\d{1,12}$/.test(id)) return safeJson(res, 422, { error: "ID người không hợp lệ." });
    const cached = tmdbPersonCache.get(id);
    if (cached?.expiresAt > Date.now()) return safeJson(res, 200, { data: cached.data, cached: true });
    try {
      let payload = await tmdbFetch(`/person/${id}`, {
        append_to_response: "combined_credits,images,external_ids",
        include_image_language: "vi,en,null",
      });
      if (!String(payload?.biography || "").trim()) {
        const english = await tmdbFetch(`/person/${id}`, {
          language: "en-US",
          append_to_response: "combined_credits,images,external_ids",
          include_image_language: "en,null",
        });
        payload = {
          ...payload,
          biography: english?.biography || payload?.biography,
          also_known_as: payload?.also_known_as?.length ? payload.also_known_as : english?.also_known_as,
          combined_credits: payload?.combined_credits || english?.combined_credits,
        };
      }
      const data = normalizeTmdbPersonDetail(payload);
      if (!data) return safeJson(res, 404, { error: "Không tìm thấy hồ sơ TMDB." });
      tmdbPersonCache.set(id, { data, expiresAt: Date.now() + 30 * 60_000 });
      return safeJson(res, 200, { data, cached: false });
    } catch (error) {
      return safeJson(res, error.status === 404 ? 404 : error.status === 401 ? 401 : 502, {
        error: cleanText(error.message || "Không tải được hồ sơ TMDB.", 400),
      });
    }
  }

  async function handleTmdbSeason(req, res, tvId, seasonNumber) {
    const ip = req.socket.remoteAddress || "unknown";
    if (!allowRequest(`tmdb-season:${ip}`, 80, 60_000)) {
      return safeJson(res, 429, { error: "Bạn tải danh sách tập quá nhanh. Hãy thử lại sau." });
    }
    if (!/^\d{1,12}$/.test(tvId) || !/^\d{1,4}$/.test(seasonNumber)) {
      return safeJson(res, 422, { error: "Season không hợp lệ." });
    }
    const cacheKey = `${tvId}:${seasonNumber}`;
    const cached = tmdbSeasonCache.get(cacheKey);
    if (cached?.expiresAt > Date.now()) return safeJson(res, 200, { data: cached.data, cached: true });
    try {
      let payload = await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
      const missingTranslation = !String(payload?.overview || "").trim()
        || (payload?.episodes || []).some((episode) => !String(episode.overview || "").trim());
      if (missingTranslation) {
        const english = await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`, { language: "en-US" });
        const englishEpisodes = new Map(
          (english?.episodes || []).map((episode) => [Number(episode.episode_number), episode]),
        );
        payload = {
          ...payload,
          name: payload?.name || english?.name,
          overview: payload?.overview || english?.overview,
          episodes: (payload?.episodes || []).map((episode) => {
            const fallback = englishEpisodes.get(Number(episode.episode_number));
            return {
              ...episode,
              name: episode.name || fallback?.name,
              overview: episode.overview || fallback?.overview,
            };
          }),
        };
      }
      const data = normalizeTmdbSeason(payload);
      tmdbSeasonCache.set(cacheKey, { data, expiresAt: Date.now() + 30 * 60_000 });
      return safeJson(res, 200, { data, cached: false });
    } catch (error) {
      return safeJson(res, error.status === 404 ? 404 : error.status === 401 ? 401 : 502, {
        error: cleanText(error.message || "Không tải được danh sách tập.", 400),
      });
    }
  }

  async function handleTmdbDetail(req, res, mediaType, id) {
    const ip = req.socket.remoteAddress || "unknown";
    if (!allowRequest(`tmdb-detail:${ip}`, 60, 60_000)) {
      return safeJson(res, 429, { error: "Bạn tải chi tiết quá nhanh. Hãy thử lại sau." });
    }
    if (!["movie", "tv"].includes(mediaType) || !/^\d{1,12}$/.test(id)) {
      return safeJson(res, 422, { error: "ID phim không hợp lệ." });
    }
    const cacheKey = `${mediaType}:${id}`;
    const cached = tmdbDetailCache.get(cacheKey);
    if (cached?.expiresAt > Date.now()) return safeJson(res, 200, { data: cached.data, cached: true });
    try {
      const append = mediaType === "movie"
        ? "credits,keywords,images,videos,release_dates,recommendations,similar"
        : "credits,keywords,images,videos,content_ratings,recommendations,similar";
      let payload = await tmdbFetch(`/${mediaType}/${id}`, {
        append_to_response: append,
        include_image_language: "vi,en,null",
      });
      if (!String(payload?.overview || "").trim() || !String(payload?.tagline || "").trim()) {
        const english = await tmdbFetch(`/${mediaType}/${id}`, {
          language: "en-US",
          append_to_response: append,
          include_image_language: "en,null",
        });
        payload = {
          ...payload,
          overview: payload?.overview || english?.overview,
          tagline: payload?.tagline || english?.tagline,
          credits: payload?.credits || english?.credits,
          keywords: payload?.keywords || english?.keywords,
          recommendations: payload?.recommendations || english?.recommendations,
          similar: payload?.similar || english?.similar,
        };
      }
      const data = normalizeTmdbDetail(payload, mediaType, config.tmdbRegion);
      if (!data) return safeJson(res, 404, { error: "Không tìm thấy phim trên TMDB." });
      tmdbDetailCache.set(cacheKey, { data, expiresAt: Date.now() + 30 * 60_000 });
      return safeJson(res, 200, { data, cached: false });
    } catch (error) {
      return safeJson(res, error.status === 404 ? 404 : error.status === 401 ? 401 : 502, {
        error: cleanText(error.message || "Không tải được chi tiết TMDB.", 400),
      });
    }
  }

  async function handleTmdbImage(_req, res, url) {
    const path = url.searchParams.get("path") || "";
    const size = url.searchParams.get("size") || "w500";
    const allowedSizes = new Set(["w185", "w300", "w500", "w780", "w1280", "original"]);
    if (!/^\/[A-Za-z0-9_.-]+$/.test(path) || !allowedSizes.has(size)) {
      return safeJson(res, 422, { error: "Đường dẫn ảnh TMDB không hợp lệ." });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await config.fetchImpl(`${TMDB_IMAGE_API}/${size}${path}`, {
        signal: controller.signal,
        headers: { "User-Agent": "TorrShelf/0.3 (+local companion)" },
      });
      if (!response.ok) return safeJson(res, response.status, { error: "Không tải được ảnh TMDB." });
      const declaredSize = Number(response.headers.get("content-length")) || 0;
      if (declaredSize > 8 * 1024 * 1024) return safeJson(res, 413, { error: "Ảnh quá lớn." });
      const body = Buffer.from(await response.arrayBuffer());
      if (body.length > 8 * 1024 * 1024) return safeJson(res, 413, { error: "Ảnh quá lớn." });
      res.writeHead(200, {
        "Content-Type": response.headers.get("content-type") || "image/jpeg",
        "Content-Length": body.length,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      });
      return res.end(body);
    } finally {
      clearTimeout(timer);
    }
  }

  async function handleSearch(req, res, url) {
    const ip = req.socket.remoteAddress || "unknown";
    if (!allowRequest(`search:${ip}`, 40, 60_000)) {
      return safeJson(res, 429, { error: "Bạn tìm kiếm quá nhanh. Hãy thử lại sau một phút." });
    }

    const query = cleanText(url.searchParams.get("q"), 160);
    if (query.length < 2) return safeJson(res, 422, { error: "Nhập ít nhất 2 ký tự để tìm kiếm." });

    const page = integer(url.searchParams.get("page"), 1, 1, 20);
    const source = ["all", "magnetz", "knaben"].includes(url.searchParams.get("source"))
      ? url.searchParams.get("source")
      : "all";
    const hideXxx = bool(url.searchParams.get("hideXxx"), true);
    const minSeeds = integer(url.searchParams.get("minSeeds"), 1, 0, 1_000_000);
    const rawMaxGb = String(url.searchParams.get("maxGb") || "").trim();
    const maxGb = rawMaxGb ? number(rawMaxGb, null, 0.1, 10_000_000) : null;
    const maxBytes = maxGb ? Math.floor(maxGb * GIB) : null;
    const sort = ["seeders", "size-asc", "size-desc", "newest"].includes(url.searchParams.get("sort"))
      ? url.searchParams.get("sort")
      : "seeders";
    const cacheKey = JSON.stringify({ query, page, source, hideXxx, minSeeds, maxGb, sort });
    cleanStores();

    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      const data = rememberResults(cached.payload.data.map(({ ref: _ref, ...item }) => item));
      return safeJson(res, 200, { ...cached.payload, data, meta: { ...cached.payload.meta, cached: true } });
    }

    const startedAt = Date.now();
    const jobs = [];
    if (source === "all" || source === "magnetz") {
      jobs.push(["magnetz", searchMagnetz(query, page, config.fetchImpl)]);
    }
    if (source === "all" || source === "knaben") {
      jobs.push(["knaben", searchKnaben(query, page, hideXxx, sort, config.fetchImpl)]);
    }

    const settled = await Promise.allSettled(jobs.map(([, promise]) => promise));
    const errors = [];
    const sourceTotals = {};
    const sourcePages = {};
    let combined = [];
    settled.forEach((outcome, index) => {
      const name = jobs[index][0];
      if (outcome.status === "fulfilled") {
        combined.push(...outcome.value.results);
        sourceTotals[name] = outcome.value.total;
        sourcePages[name] = outcome.value.pages;
      } else {
        errors.push({ source: name, message: cleanText(outcome.reason?.message || "Không truy cập được", 240) });
      }
    });

    if (!combined.length && errors.length === jobs.length) {
      return safeJson(res, 502, { error: "Cả hai nguồn tìm kiếm đều đang lỗi.", sources: errors });
    }

    combined = deduplicateResults(combined).filter(
      (item) => item.size > 0 && (!maxBytes || item.size <= maxBytes) && item.seeders >= minSeeds,
    );
    combined = sortResults(combined, sort);
    const data = rememberResults(combined);
    const maxPages = Math.min(20, Math.max(1, ...Object.values(sourcePages)));
    const payload = {
      data,
      meta: {
        query,
        page,
        maxPages,
        hasNextPage: page < maxPages,
        source,
        maxSizeGb: maxGb,
        minSeeds,
        returned: data.length,
        sourceTotals,
        errors,
        durationMs: Date.now() - startedAt,
        cached: false,
      },
    };
    searchCache.set(cacheKey, { payload, expiresAt: Date.now() + 30_000 });
    return safeJson(res, 200, payload);
  }

  async function resolveResultLink(result) {
    if (result.source === "magnetz" && /^[A-Za-z0-9_-]{1,80}$/.test(result.providerId)) {
      const payload = await fetchJson(
        `${MAGNETZ_API}/api/magnets/${encodeURIComponent(result.providerId)}`,
        {},
        12_000,
        config.fetchImpl,
      );
      const detail = payload?.data;
      if (typeof detail?.magnet_link === "string") return detail.magnet_link;
    }
    return result.link;
  }

  async function torrServerFetch(pathname, options = {}, timeoutMs = 90_000) {
    const url = new URL(pathname, config.torrServerUrl);
    return fetchJson(
      url,
      {
        ...options,
        headers: {
          ...basicAuthHeader(config.torrServerUsername, config.torrServerPassword),
          ...(options.headers || {}),
        },
      },
      timeoutMs,
      config.fetchImpl,
    );
  }

  async function handleAdd(req, res) {
    const ip = req.socket.remoteAddress || "unknown";
    if (!sameOrigin(req)) return safeJson(res, 403, { error: "Yêu cầu khác nguồn đã bị chặn." });
    if (!allowRequest(`add:${ip}`, 12, 60_000)) {
      return safeJson(res, 429, { error: "Quá nhiều yêu cầu thêm torrent. Hãy chờ một phút." });
    }

    const body = await readJsonBody(req);
    const ref = cleanText(body.ref, 80);
    cleanStores();
    const stored = resultStore.get(ref);
    if (!stored) return safeJson(res, 410, { error: "Kết quả đã hết hạn. Hãy tìm kiếm lại." });
    const result = stored.result;
    if (result.size <= 0) {
      return safeJson(res, 422, { error: "Torrent không có thông tin dung lượng hợp lệ." });
    }

    const link = await resolveResultLink(result);
    if (!isAllowedTorrentLink(link)) {
      return safeJson(res, 422, { error: "Nguồn này không cung cấp magnet hoặc link Knaben hợp lệ." });
    }

    const tmdbInput = body?.tmdb && typeof body.tmdb === "object" ? body.tmdb : null;
    const tmdb = tmdbInput && Number(tmdbInput.id) > 0
      ? {
          id: Number(tmdbInput.id),
          mediaType: tmdbInput.mediaType === "tv" ? "tv" : "movie",
          title: cleanText(tmdbInput.title, 300),
          originalTitle: cleanText(tmdbInput.originalTitle, 300),
          year: cleanText(tmdbInput.year, 8),
          posterPath: /^\/[A-Za-z0-9_.-]+$/.test(tmdbInput.posterPath || "") ? tmdbInput.posterPath : "",
          backdropPath: /^\/[A-Za-z0-9_.-]+$/.test(tmdbInput.backdropPath || "") ? tmdbInput.backdropPath : "",
        }
      : null;
    const torrShelfData = { source: result.sources, size: result.size, tmdb };
    const poster = tmdb?.posterPath ? `${TMDB_IMAGE_API}/w500${tmdb.posterPath}` : "";

    let response;
    try {
      response = await torrServerFetch(
        "/torrents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            link,
            title: result.title,
            category: result.category,
            poster,
            data: JSON.stringify({ TorrShelf: torrShelfData }),
            save_to_db: true,
          }),
        },
        95_000,
      );
    } catch (error) {
      const message = error?.name === "AbortError" ? "TorrServer chờ metadata quá lâu." : error?.message;
      throw new Error(`Không gửi được sang TorrServer: ${message}`);
    }

    return safeJson(res, 200, {
      ok: true,
      torrent: response,
      tmdb,
      message: `Đã thêm “${result.title}” vào TorrServer.`,
    });
  }

  async function handleLibrary(_req, res) {
    try {
      const torrents = await torrServerFetch(
        "/torrents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "list" }),
        },
        8_000,
      );
      return safeJson(res, 200, { data: Array.isArray(torrents) ? torrents : [] });
    } catch (error) {
      return safeJson(res, 502, { error: `Không đọc được TorrServer: ${error.message}` });
    }
  }

  async function handleTorrentAction(req, res) {
    if (!sameOrigin(req)) return safeJson(res, 403, { error: "Yêu cầu khác nguồn đã bị chặn." });
    const body = await readJsonBody(req);
    const action = body.action;
    const hash = cleanText(body.hash, 80).toLowerCase();
    if (!["drop", "rem", "activate", "preload"].includes(action) || !/^[a-f0-9]{40}$/.test(hash)) {
      return safeJson(res, 422, { error: "Thao tác hoặc torrent hash không hợp lệ." });
    }
    try {
      if (action === "activate" || action === "preload") {
        const fileId = integer(body.fileId, 0, 0, 1_000_000);
        if (action === "preload" && !fileId) {
          return safeJson(res, 422, { error: "Cần chọn file để preload." });
        }
        const query = new URLSearchParams({ link: hash, stat: "1" });
        if (fileId) query.set("index", String(fileId));
        if (action === "preload") query.set("preload", "1");
        const status = await torrServerFetch(`/stream/status?${query}`, {}, 75_000);
        return safeJson(res, 200, { ok: true, action, hash, torrent: status });
      }
      await torrServerFetch(
        "/torrents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, hash }),
        },
        15_000,
      );
      return safeJson(res, 200, { ok: true, action, hash });
    } catch (error) {
      return safeJson(res, 502, { error: `TorrServer từ chối thao tác: ${error.message}` });
    }
  }

  async function handleHealth(_req, res) {
    let torrServer = { online: false, version: null };
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2_500);
      const response = await config.fetchImpl(new URL("/echo", config.torrServerUrl), {
        signal: controller.signal,
        headers: basicAuthHeader(config.torrServerUsername, config.torrServerPassword),
      });
      clearTimeout(timer);
      const version = response.ok ? (await response.text()).trim() : null;
      torrServer = { online: Boolean(version?.startsWith("MatriX.")), version };
    } catch {
      // The search UI remains usable while TorrServer is offline.
    }
    return safeJson(res, 200, {
      ok: true,
      app: "TorrShelf",
      version: "0.12.0",
      theme: "cinewave",
      sizeFilter: { userControlled: true, emptyMeansUnlimited: true },
      torrServer: { ...torrServer, autoCorrected: config.torrServerUrlAutoCorrected },
      torrServerPublicUrl: config.torrServerPublicUrl,
      tmdb: {
        configured: isTmdbConfigured(),
        validated: Boolean(tmdbActiveMode),
        credentialMode: tmdbActiveMode || getTmdbCredentials().mode,
        lastError: tmdbLastError,
        language: config.tmdbLanguage,
        region: config.tmdbRegion,
      },
      network: { dnsResultOrder: DNS_RESULT_ORDER },
      sources: ["magnetz", "knaben"],
    });
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      if (req.method === "GET" && url.pathname === "/api/health") return await handleHealth(req, res);
      if (req.method === "GET" && url.pathname === "/api/tmdb/home") return await handleTmdbHome(req, res);
      if (req.method === "GET" && url.pathname === "/api/tmdb/list") return await handleTmdbList(req, res, url);
      if (req.method === "GET" && url.pathname === "/api/tmdb/search") return await handleTmdbSearch(req, res, url);
      if (req.method === "GET" && url.pathname === "/api/tmdb/discover") return await handleTmdbDiscover(req, res, url);
      const tmdbPersonMatch = url.pathname.match(/^\/api\/tmdb\/person\/(\d+)$/);
      if (req.method === "GET" && tmdbPersonMatch) {
        return await handleTmdbPerson(req, res, tmdbPersonMatch[1]);
      }
      const tmdbSeasonMatch = url.pathname.match(/^\/api\/tmdb\/tv\/(\d+)\/season\/(\d+)$/);
      if (req.method === "GET" && tmdbSeasonMatch) {
        return await handleTmdbSeason(req, res, tmdbSeasonMatch[1], tmdbSeasonMatch[2]);
      }
      const tmdbDetailMatch = url.pathname.match(/^\/api\/tmdb\/(movie|tv)\/(\d+)$/);
      if (req.method === "GET" && tmdbDetailMatch) {
        return await handleTmdbDetail(req, res, tmdbDetailMatch[1], tmdbDetailMatch[2]);
      }
      if (req.method === "GET" && url.pathname === "/api/tmdb/image") return await handleTmdbImage(req, res, url);
      if (req.method === "GET" && url.pathname === "/api/search") return await handleSearch(req, res, url);
      if (req.method === "GET" && url.pathname === "/api/torrserver/torrents") {
        return await handleLibrary(req, res);
      }
      if (req.method === "POST" && url.pathname === "/api/torrserver/add") return await handleAdd(req, res);
      if (req.method === "POST" && url.pathname === "/api/torrserver/action") {
        return await handleTorrentAction(req, res);
      }
      if (url.pathname.startsWith("/api/")) return safeJson(res, 404, { error: "Không tìm thấy API." });
      if (req.method === "GET" || req.method === "HEAD") {
        if (serveStatic(req, res, url.pathname)) return;
        if (!extname(url.pathname) && serveStatic(req, res, "/")) return;
      }
      safeJson(res, 404, { error: "Không tìm thấy." });
    } catch (error) {
      const status = /JSON|quá lớn/i.test(error.message) ? 400 : 500;
      safeJson(res, status, { error: cleanText(error.message || "Lỗi máy chủ", 500) });
    }
  });

  return { server, config };
}

export function startTorrShelf(options = {}) {
  const app = createTorrShelf(options);
  app.server.listen(app.config.port, app.config.host, () => {
    console.log(`TorrShelf CineWave: http://${app.config.host}:${app.config.port}`);
    if (app.config.torrServerUrlAutoCorrected) {
      console.warn(
        `TorrServer: auto-corrected ${app.config.torrServerOriginalUrl} -> ${app.config.torrServerUrl.origin} (non-Docker runtime)`,
      );
    } else {
      console.log(`TorrServer: ${app.config.torrServerUrl.origin}`);
    }
    console.log(`TMDB: ${app.config.tmdbToken || app.config.tmdbApiKey ? "configured" : "not configured"}`);
    console.log(`DNS result order: ${DNS_RESULT_ORDER}`);
    console.log("Torrent size filter: user-controlled (blank = unlimited)");
  });
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startTorrShelf();
}
