import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import {
  createTorrShelf,
  loadEnvFile,
  resolveLocalServiceUrl,
  deduplicateResults,
  normalizeKnaben,
  normalizeMagnetz,
  normalizeTmdb,
  normalizeReleaseTitle,
  scoreStreamTitleMatch,
  normalizeTorrServerTarget,
  normalizeCloudStreamRepoUrl,
  normalizeStremioManifestUrl,
  selectTorrentVideoFile,
} from "../server.mjs";
import {
  buildTorrentioEndpoint,
  isJacredSeasonMatch,
  normalizeJacredResults,
  parseSizeGb,
  sanitizeNativeProviderConfig,
} from "../providers/hybrid-native.mjs";
import {
  get4KHDHubStreams,
  parse4KHDHubItems,
  parse4KHDHubSearch,
  select4KHDHubCard,
} from "../providers/4khdhub.mjs";
import {
  getMoviesDriveStreams,
  parseMoviesDriveDownloadLinks,
  parseMoviesDriveSearch,
  selectMoviesDriveResult,
} from "../providers/moviesdrive.mjs";
import {
  getHDHub4uStreams,
  parseHDHub4uEpisodeLinks,
  parseHDHub4uSearch,
  selectHDHub4uResult,
} from "../providers/hdhub4u.mjs";
import { getVadapavStreams } from "../providers/vadapav.mjs";
import { getHubCloudSearchStreams } from "../providers/hubcloud-search.mjs";
import {
  getUHDMoviesStreams,
  parseUHDMoviesSearch,
  parseUHDMoviesSidLinks,
  selectUHDMoviesResult,
} from "../providers/uhdmovies.mjs";

const HASH = "DAFC8C076CA2F3ED376EEAE7C76A0D6BE2415C45";
const MAGNET = `magnet:?xt=urn:btih:${HASH}&dn=Ubuntu`;

describe(".env loader", () => {
  it("uses the last duplicate value while preserving real environment variables", () => {
    const dir = mkdtempSync(join(tmpdir(), "torr-shelf-env-"));
    const path = join(dir, ".env");
    const duplicateKey = "TORRSHELF_TEST_DUPLICATE";
    const preservedKey = "TORRSHELF_TEST_PRESERVED";
    delete process.env[duplicateKey];
    process.env[preservedKey] = "from-process";
    writeFileSync(
      path,
      `${duplicateKey}=old\n${duplicateKey}=new\n${preservedKey}=from-file\n`,
    );
    loadEnvFile(path);
    assert.equal(process.env[duplicateKey], "new");
    assert.equal(process.env[preservedKey], "from-process");
    delete process.env[duplicateKey];
    delete process.env[preservedKey];
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("runtime URL correction", () => {
  it("replaces Docker host aliases when running directly on Termux or a desktop", () => {
    const result = resolveLocalServiceUrl("http://host.docker.internal:8090", false);
    assert.equal(result.url.origin, "http://127.0.0.1:8090");
    assert.equal(result.autoCorrected, true);
  });

  it("keeps the Docker host alias from inside a container", () => {
    const result = resolveLocalServiceUrl("http://host.docker.internal:8090", true);
    assert.equal(result.url.origin, "http://host.docker.internal:8090");
    assert.equal(result.autoCorrected, false);
  });

  it("normalizes a user-selected public TorrServer endpoint", () => {
    assert.equal(normalizeTorrServerTarget("62.60.153.226:12345/").origin, "http://62.60.153.226:12345");
    assert.equal(normalizeTorrServerTarget("https://remote.example/path").href, "https://remote.example/");
    assert.throws(() => normalizeTorrServerTarget("ftp://remote.example"), /HTTP/);
  });

  it("normalizes CloudStream repository URLs", () => {
    assert.equal(normalizeCloudStreamRepoUrl("cloudstreamrepo://cloudstream.test/repo.json").href, "https://cloudstream.test/repo.json");
  });

  it("normalizes Stremio addon manifest URLs", () => {
    assert.equal(normalizeStremioManifestUrl("hybrid.test/abc/configure").href, "https://hybrid.test/abc/manifest.json");
    assert.equal(normalizeStremioManifestUrl("stremio://hybrid.test/abc/manifest.json").href, "https://hybrid.test/abc/manifest.json");
  });
});

describe("normalizers", () => {
  it("normalizes Magnetz results", () => {
    const result = normalizeMagnetz({
      sqid: "abc123",
      name: "Ubuntu ISO",
      info_hash: HASH,
      size: 2_000_000_000,
      seeders: 42,
      leechers: 3,
      magnet_link: MAGNET,
      is_verified: true,
    });
    assert.equal(result.source, "magnetz");
    assert.equal(result.infoHash, HASH);
    assert.equal(result.seeders, 42);
    assert.equal(result.verified, true);
  });

  it("normalizes Knaben results", () => {
    const result = normalizeKnaben({
      id: "k1",
      title: "Ubuntu ISO",
      hash: HASH,
      bytes: 2_000_000_000,
      seeders: 55,
      peers: 4,
      magnetUrl: `${MAGNET}&tr=udp%3A%2F%2Ftracker.example`,
      category: "PC / Unix",
    });
    assert.equal(result.source, "knaben");
    assert.equal(result.seeders, 55);
    assert.match(result.link, /^magnet:/);
  });

  it("normalizes TMDB movies into a torrent search query", () => {
    const result = normalizeTmdb({
      id: 123,
      title: "Tên tiếng Việt",
      original_title: "Original Title",
      release_date: "2026-08-01",
      vote_average: 8.24,
      poster_path: "/poster.jpg",
      backdrop_path: "/backdrop.jpg",
    });
    assert.equal(result.mediaType, "movie");
    assert.equal(result.year, "2026");
    assert.equal(result.rating, 8.2);
    assert.equal(result.searchQuery, "Original Title 2026");
  });

  it("filters fuzzy addon results by exact title, year and episode", () => {
    assert.equal(normalizeReleaseTitle("Spider-Man 3"), "spider man 3");
    const silentHill = { title: "Đồi Câm Lặng", originalTitle: "Silent Hill", year: 2006 };
    assert.equal(scoreStreamTitleMatch("Silent.Hill.2006.1080p.BluRay.x265", silentHill).match, true);
    assert.equal(scoreStreamTitleMatch("Shrek the Halls 2007 Jack Frost 1979", silentHill).reason, "title-mismatch");
    assert.equal(scoreStreamTitleMatch("SILENT HILL The Short Message", silentHill).reason, "title-suffix-mismatch");
    assert.equal(scoreStreamTitleMatch("Silent Hill Revelation 2012 1080p", silentHill).reason, "year-mismatch");
    assert.equal(scoreStreamTitleMatch("Человек-паук 3 / Spider-Man 3 (2007) BluRay 2160p", { originalTitle: "Spider-Man 3", year: 2007 }).match, true);
    assert.equal(scoreStreamTitleMatch("The 13th Warrior Release 1999", { originalTitle: "The Northman", year: 2022 }).match, false);
    assert.equal(scoreStreamTitleMatch("House of the Dragon S02E02 1080p", { originalTitle: "House of the Dragon", season: 2, episode: 1 }).reason, "episode-mismatch");
    const itFollows = { originalTitle: "It Follows", aliases: ["Оно"], year: 2014 };
    assert.equal(scoreStreamTitleMatch("Воно / It Follows (2014) BDRemux 1080p Ukr Eng", itFollows).match, true);
    assert.equal(scoreStreamTitleMatch("Оно [2014] BDRip 1080p", itFollows).match, true);
    assert.equal(scoreStreamTitleMatch("RCC Харитонов vs Белтран 25.02.2018 MMA WEBRip 1080p", itFollows).reason, "title-mismatch");
    assert.equal(scoreStreamTitleMatch("Смертоносная земля / Killing Ground (2016) BDRemux", itFollows).match, false);
    assert.equal(scoreStreamTitleMatch("Оно. Новая глава / It Feeds (2025) WEB-DL", itFollows).reason, "year-mismatch");
  });

  it("keeps Jacred packs by season without filtering the requested episode", () => {
    const config = sanitizeNativeProviderConfig({ jacredEnabled: true, torrentioEnabled: false, maxResults: 999, jacredDomain: "bad.host" });
    assert.equal(config.jacredDomain, "jac.red");
    assert.equal(config.maxResults, 200);
    assert.equal(config.fourKhdHubEnabled, false);
    assert.equal(config.moviesDriveEnabled, false);
    assert.equal(config.hdHub4uEnabled, false);
    assert.equal(config.vadapavEnabled, false);
    assert.equal(config.uhdMoviesEnabled, false);
    assert.equal(config.hubCloudSearchEnabled, false);
    const scraperConfig = sanitizeNativeProviderConfig({ fourKhdHubEnabled: true, moviesDriveEnabled: true, hdHub4uEnabled: true, vadapavEnabled: true, uhdMoviesEnabled: true, hubCloudSearchEnabled: true });
    assert.equal(scraperConfig.fourKhdHubEnabled, true);
    assert.equal(scraperConfig.moviesDriveEnabled, true);
    assert.equal(scraperConfig.hdHub4uEnabled, true);
    assert.equal(scraperConfig.vadapavEnabled, true);
    assert.equal(scraperConfig.uhdMoviesEnabled, true);
    assert.equal(scraperConfig.hubCloudSearchEnabled, true);
    assert.equal(parseSizeGb("252.3 ГБ"), 252.3);
    assert.equal(parseSizeGb("266,74 ГБ"), 266.74);
    assert.equal(isJacredSeasonMatch("Дом Дракона / Сезон: 1 / Серии: 1-10", { type: "series", season: 1, episode: 9 }), true);
    assert.equal(isJacredSeasonMatch("Дом Дракона S02", { type: "series", season: 1, seasons: [2], episode: 1 }), false);
    assert.equal(isJacredSeasonMatch("Неизвестное название", { type: "series", season: 1, seasons: [1], episode: 9 }), true);
    const results = normalizeJacredResults([[
      { title: "Дом Дракона / Сезон: 1", magnet: MAGNET, types: ["serial"], seasons: [1], size: Math.round(252.3 * 1024 ** 3), sizeName: "252.3 ГБ", sid: 20 },
      { title: "House of the Dragon [S01]", magnet: MAGNET, types: ["serial"], seasons: [1], sizeName: "252.30 GB", sid: 27 },
    ]], "series");
    assert.equal(results.length, 1);
    assert.equal(results[0].pack, true);
    assert.equal(results[0].sizeGB.toFixed(1), "252.3");
    assert.equal(results[0].seeds, 27);
    assert.deepEqual(results[0].seasons, [1]);
    assert.match(buildTorrentioEndpoint("https://torrentio.strem.fun/providers=yts/manifest.json", "series", "tt123:1:2"), /\/stream\/series\/tt123%3A1%3A2\.json$/);
  });

  it("scrapes exact 4KHDHub cards and resolves an isolated direct HTTP stream", async () => {
    const searchHtml = `<a class="movie-card" href="/guardians-movie-221/"><span class="movie-card-format">Movies</span><h3 class="movie-card-title">Guardians of the Galaxy Marvel Phase 2</h3><p class="movie-card-meta">2014</p></a>`;
    const pageHtml = `<div class="download-item"><div class="file-title">Guardians.of.the.Galaxy.2014.2160p.HDR.mkv</div><span>47.24 GB</span><a href="https://hubcloud.cx/drive/test">Download HubCloud</a></div>`;
    const hubHtml = `<html><script>var url = 'https://gamerxyt.com/hubcloud.php?id=test';</script></html>`;
    const finalHtml = `<title>Guardians.of.the.Galaxy.2014.2160p.HDR.mkv</title><a href="https://pixel.hubcloud.cx/?id=test">Download [Server : 10Gbps]</a>`;
    const direct = "https://video-downloads.googleusercontent.com/example-token";
    const makeResponse = (body, url) => { const response = new Response(body, { status: 200, headers: { "Content-Type": "text/html" } });Object.defineProperty(response, "url", { value: url });return response; };
    const fakeFetch = async (input) => {
      const url = String(input);
      if (url.includes("4khdhub.one/?s=")) return makeResponse(searchHtml, url);
      if (url.endsWith("/guardians-movie-221/")) return makeResponse(pageHtml, url);
      if (url === "https://hubcloud.cx/drive/test") return makeResponse(hubHtml, url);
      if (url.startsWith("https://gamerxyt.com/hubcloud.php")) return makeResponse(finalHtml, url);
      if (url.startsWith("https://pixel.hubcloud.cx/")) return makeResponse("", `https://gamerxyt.com/dl.php?link=${encodeURIComponent(direct)}`);
      throw new Error(`Unexpected 4KHDHub URL: ${url}`);
    };
    const cards = parse4KHDHubSearch(searchHtml), card = select4KHDHubCard(cards, { title: "Guardians of the Galaxy", year: 2014, type: "movie" });
    assert.equal(card?.year, 2014);
    assert.equal(parse4KHDHubItems(pageHtml, { type: "movie" }).length, 1);
    const streams = await get4KHDHubStreams({ title: "Guardians of the Galaxy", year: 2014, type: "movie", maxResults: 2 }, fakeFetch);
    assert.equal(streams.length, 1);
    assert.equal(streams[0].url, direct);
    assert.match(streams[0].title, /47\.24 GB · 2160p · HTTP/);
  });

  it("scrapes MoviesDrive search, exact episode links and direct HubCloud streams", async () => {
    const direct = "https://video-downloads.googleusercontent.com/moviesdrive-token";
    const makeResponse = (body, url, type = "text/html") => { const response = new Response(body, { status: 200, headers: { "Content-Type": type } });Object.defineProperty(response, "url", { value: url });return response; };
    const searchPayload = { found: 1, hits: [{ document: { post_title: "Silo (2023) Season 1 WEB Series 1080p", permalink: "/silo-season-1/", category: ["WEB"], imdb_id: "tt14688458" } }] };
    const fakeFetch = async (input) => {
      const url = new URL(input);
      if (url.hostname === "raw.githubusercontent.com") return Response.json({ moviesdrive: "https://moviesdrive.test" });
      if (url.hostname === "moviesdrive.test" && url.pathname === "/search.php") return Response.json(searchPayload);
      if (url.hostname === "moviesdrive.test" && url.pathname === "/silo-season-1/") return makeResponse(`<h5><a href="https://graph.moviesdrives-com.workers.dev/Silo-S01-Episode-1-1080p-680MB">1080p</a></h5>`, url.toString());
      if (url.hostname === "graph.moviesdrives-com.workers.dev") return makeResponse(`<title>Silo.S01E01.1080p.680MB – Telegraph</title><a href="https://hubcloud.cx/drive/md-test">HubCloud [Direct-DL]</a>`, url.toString());
      if (url.hostname === "hubcloud.cx" && url.pathname === "/drive/md-test") return makeResponse(`<script>var url='https://gamerxyt.com/hubcloud.php?id=md-test';</script>`, url.toString());
      if (url.hostname === "gamerxyt.com" && url.pathname === "/hubcloud.php") return makeResponse(`<title>Silo.S01E01.1080p.mkv</title><a href="https://pixel.hubcloud.cx/?id=md-test">Download [Server : 10Gbps]</a>`, url.toString());
      if (url.hostname === "pixel.hubcloud.cx") return makeResponse("", `https://gamerxyt.com/dl.php?link=${encodeURIComponent(direct)}`);
      throw new Error(`Unexpected MoviesDrive URL: ${url}`);
    };
    const parsed = parseMoviesDriveSearch(searchPayload, "https://moviesdrive.test"), selected = selectMoviesDriveResult(parsed, { title: "Silo", year: 2023, type: "series", season: 1 });
    assert.equal(selected?.imdbId, "tt14688458");
    assert.equal(parseMoviesDriveDownloadLinks(`<a href="https://graph.moviesdrives-com.workers.dev/Silo-S01-Episode-1-1080p">1080p</a><a href="https://graph.moviesdrives-com.workers.dev/Silo-S01-Episode-2-1080p">1080p</a>`, "https://moviesdrive.test", { type: "series", season: 1, episode: 1 }).length, 1);
    const multiSeason = parseMoviesDriveDownloadLinks(`<h5>Season 2 [Complete] 1080p WEB-DL</h5><h5><a href="https://mdrive.lol/archive/6775/">1080p Single Episode</a></h5>`, "https://moviesdrive.test", { type: "series", season: 2, episode: 1 });
    assert.equal(multiSeason[0]?.targetEpisode, 1);
    assert.equal(multiSeason[0]?.quality, "1080p");
    const streams = await getMoviesDriveStreams({ title: "Silo", year: 2023, type: "series", season: 1, episode: 1, maxResults: 2 }, fakeFetch);
    assert.equal(streams.length, 1);
    assert.equal(streams[0].url, direct);
    assert.match(streams[0].title, /1080p.*HTTP/s);
  });

  it("scrapes HDHub4u Typesense matches and resolves HubCloud search results", async () => {
    const direct = "https://video-downloads.googleusercontent.com/hdhub4u-token";
    const makeResponse = (body, url, type = "text/html") => { const response = new Response(body, { status: 200, headers: { "Content-Type": type } });Object.defineProperty(response, "url", { value: url });return response; };
    const searchPayload = { found: 1, hits: [{ document: { post_title: "Guardians of the Galaxy (2014) BluRay Full Movie", permalink: "/guardians-2014/", category: ["Movies"], imdb_id: "tt2015381" } }] };
    const fakeFetch = async (input) => {
      const url = new URL(input);
      if (url.hostname === "raw.githubusercontent.com") return Response.json({ HDHUB4u: "https://hdhub4u.test" });
      if (url.hostname === "search.pingora.fyi") return Response.json(searchPayload);
      if (url.hostname === "hdhub4u.test" && url.pathname === "/guardians-2014/") return makeResponse(`<h3><a href="https://hubcloud.cx/drive/search-recover.php?from_ac=token&q=locked">1080p Untouched</a></h3>`, url.toString());
      if (url.hostname === "hubcloud.cx" && url.pathname.endsWith("search-recover.php") && url.searchParams.get("api") === "search") return Response.json({ hits: [{ file_name: "Guardians.of.the.Galaxy.2014.2160p.mkv", mimeType: "video/x-matrosk", size: "4.6 GB", url: "https://hubcloud.cx/drive/hd-test" }] });
      if (url.hostname === "hubcloud.cx" && url.pathname === "/drive/hd-test") return makeResponse(`<script>var url='https://gamerxyt.com/hubcloud.php?id=hd-test';</script>`, url.toString());
      if (url.hostname === "gamerxyt.com" && url.pathname === "/hubcloud.php") return makeResponse(`<title>Guardians.of.the.Galaxy.2014.2160p.mkv</title><a href="https://pixel.hubcloud.cx/?id=hd-test">Download [Server : 10Gbps]</a>`, url.toString());
      if (url.hostname === "pixel.hubcloud.cx") return makeResponse("", `https://gamerxyt.com/dl.php?link=${encodeURIComponent(direct)}`);
      throw new Error(`Unexpected HDHub4u URL: ${url}`);
    };
    const parsed = parseHDHub4uSearch(searchPayload), selected = selectHDHub4uResult(parsed, { title: "Guardians of the Galaxy", year: 2014, type: "movie", imdbId: "tt2015381" });
    assert.equal(selected?.imdbId, "tt2015381");
    const episodeLinks = parseHDHub4uEpisodeLinks(`<h4><strong>EPiSODE 1</strong></h4><h4>1080p – <a href="https://hubdrive.tips/file/1">Drive</a></h4><h4><strong>EPiSODE 2</strong></h4><h4><a href="https://hubdrive.tips/file/2">Drive</a></h4>`, "https://hdhub4u.test", 1);
    assert.equal(episodeLinks.length, 1);
    const redirectLinks = parseHDHub4uEpisodeLinks(`<h4>EPiSODE 1 | <a href="https://greenmountmotors.com/?id=test">WATCH</a></h4><h4>EPiSODE 2</h4>`, "https://hdhub4u.test", 1);
    assert.equal(new URL(redirectLinks[0]?.url).hostname, "greenmountmotors.com");
    const streams = await getHDHub4uStreams({ title: "Guardians of the Galaxy", year: 2014, type: "movie", imdbId: "tt2015381", maxResults: 2 }, fakeFetch);
    assert.equal(streams.length, 1);
    assert.equal(streams[0].url, direct);
    assert.match(streams[0].title, /4\.6 GB · 2160p · HTTP/);
  });

  it("loads Vadapav and standalone HubCloud Search streams", async () => {
    const makeResponse = (body, url, type = "text/html") => { const response = new Response(body, { status: 200, headers: { "Content-Type": type } });Object.defineProperty(response, "url", { value: url });return response; };
    const vadapavFetch = async () => Response.json({ streams: [{ name: "vadapav.mov 1080P", title: "Silo S01E01.mkv\n1 GB", url: "https://dl.vadapav.mov/file.mkv" }] });
    const vadapav = await getVadapavStreams({ type: "series", id: "tt14688458:1:1" }, vadapavFetch);
    assert.equal(vadapav[0].name, "Vadapav 1080P");
    const direct = "https://video-downloads.googleusercontent.com/hubcloud-search-token";
    const hubFetch = async (input) => {
      const url = new URL(input);
      if (url.pathname.endsWith("search-recover.php") && url.searchParams.get("api") === "search") return Response.json({ hits: [{ file_name: "Silo.S01E01.1080p.mkv", mimeType: "video/x-matrosk", size: "1.2 GB", url: "https://hubcloud.cx/drive/search-test" }] });
      if (url.hostname === "hubcloud.cx" && url.pathname === "/drive/search-test") return makeResponse(`<script>var url='https://gamerxyt.com/hubcloud.php?id=search-test';</script>`, url.toString());
      if (url.hostname === "gamerxyt.com") return makeResponse(`<title>Silo.S01E01.1080p.mkv</title><a href="https://pixel.hubcloud.cx/?id=search-test">Download [Server : 10Gbps]</a>`, url.toString());
      if (url.hostname === "pixel.hubcloud.cx") return makeResponse("", `https://gamerxyt.com/dl.php?link=${encodeURIComponent(direct)}`);
      throw new Error(`Unexpected HubCloud Search URL: ${url}`);
    };
    const hub = await getHubCloudSearchStreams({ title: "Silo", type: "series", season: 1, episode: 1, maxResults: 2 }, hubFetch);
    assert.equal(hub.length, 1);
    assert.equal(hub[0].url, direct);
  });

  it("resolves UHDMovies SID and DriveSeed chains without archive files", async () => {
    const direct = "https://video-downloads.googleusercontent.com/uhdmovies-token";
    const makeResponse = (body, url, type = "text/html") => { const response = new Response(body, { status: 200, headers: { "Content-Type": type } });Object.defineProperty(response, "url", { value: url });return response; };
    const fakeFetch = async (input, options = {}) => {
      const url = new URL(input), body = String(options.body || "");
      if (url.hostname === "raw.githubusercontent.com") return Response.json({ UHDMovies: "https://uhdmovies.test" });
      if (url.hostname === "uhdmovies.test" && url.pathname.startsWith("/search/")) return makeResponse(`<a href="/download-silo/" title="Download Silo (2023) Season 1 2160p Series">Download Silo (2023) Season 1 2160p Series</a>`, url.toString());
      if (url.hostname === "uhdmovies.test" && url.pathname === "/download-silo/") return makeResponse(`<p>Season 1 Silo.S01.2160p [9 GB/E] <a href="https://cloud.unblockedgames.test/?sid=abc">Episode 1</a></p>`, url.toString());
      if (url.hostname === "cloud.unblockedgames.test" && options.method !== "POST" && url.searchParams.has("sid")) return makeResponse(`<form id="landing" action="https://cloud.unblockedgames.test/"><input name="_wp_http" value="one"></form>`, url.toString());
      if (url.hostname === "cloud.unblockedgames.test" && options.method === "POST" && body.includes("_wp_http=one")) return makeResponse(`<form id="landing" action="https://cloud.unblockedgames.test/verify"><input name="_wp_http2" value="two"><input name="token" value="token"></form>`, url.toString());
      if (url.hostname === "cloud.unblockedgames.test" && options.method === "POST" && body.includes("_wp_http2=two")) return makeResponse(`<script>s_343('cookie','value');c.setAttribute("href","https://cloud.unblockedgames.test/?go=file")</script>`, url.toString());
      if (url.hostname === "cloud.unblockedgames.test" && url.searchParams.has("go")) return makeResponse(`<meta http-equiv="refresh" content="0;url=https://driveseed.test/r?id=file">`, url.toString());
      if (url.hostname === "driveseed.test" && url.pathname === "/r") return makeResponse(`<script>window.location.replace("/file/id")</script>`, url.toString());
      if (url.hostname === "driveseed.test" && url.pathname === "/file/id") return makeResponse(`<title>Silo.S01E01.2160p.mkv</title><li>Name : Silo.S01E01.2160p.mkv</li><li>Size : 9 GB</li><a href="https://cdn.video.test/direct">Instant Download</a>`, url.toString());
      if (url.hostname === "cdn.video.test") return makeResponse("", `https://video-seed.test/?url=${encodeURIComponent(direct)}`);
      throw new Error(`Unexpected UHDMovies URL: ${url}`);
    };
    const search = parseUHDMoviesSearch(`<a href="/download-silo/">Download Silo (2023) Season 1 Series</a>`, "https://uhdmovies.test"), selected = selectUHDMoviesResult(search, { title: "Silo", year: 2023, type: "series", season: 1 });
    assert.equal(selected?.year, 2023);
    assert.equal(parseUHDMoviesSidLinks(`<p>Season 1 Silo.S01 <a href="https://cloud.test/?sid=a">Episode 1</a></p>`, "https://uhdmovies.test", { type: "series", season: 1, episode: 1 }).length, 1);
    const streams = await getUHDMoviesStreams({ title: "Silo", year: 2023, type: "series", season: 1, episode: 1, maxResults: 1 }, fakeFetch);
    assert.equal(streams.length, 1);
    assert.equal(streams[0].url, direct);
    assert.match(streams[0].title, /9 GB · 2160p · HTTP/);
  });

  it("deduplicates by info hash and keeps the richer magnet", () => {
    const magnetz = normalizeMagnetz({
      sqid: "abc123",
      name: "Ubuntu ISO",
      info_hash: HASH,
      size: 2_000_000_000,
      seeders: 42,
      leechers: 3,
      magnet_link: MAGNET,
      is_verified: true,
    });
    const knaben = normalizeKnaben({
      id: "k1",
      title: "Ubuntu ISO",
      hash: HASH,
      bytes: 2_000_000_000,
      seeders: 55,
      peers: 4,
      magnetUrl: `${MAGNET}&tr=udp%3A%2F%2Ftracker.example`,
    });
    const [result] = deduplicateResults([magnetz, knaben]);
    assert.deepEqual(result.sources.sort(), ["knaben", "magnetz"]);
    assert.equal(result.seeders, 55);
    assert.match(result.link, /tracker\.example/);
    assert.equal(result.verified, true);
  });

  it("selects the largest feature video for a movie", () => {
    const file = selectTorrentVideoFile([
      { id: 1, path: "Sample/sample.mkv", length: 900_000_000 },
      { id: 2, path: "Movie.1080p.mkv", length: 4_000_000_000 },
      { id: 3, path: "Featurette.mp4", length: 5_000_000_000 },
    ]);
    assert.equal(file.id, 2);
  });

  it("selects an exact season episode from a pack", () => {
    const file = selectTorrentVideoFile([
      { id: 4, path: "Show.S01E02.mkv", length: 1_000_000_000 },
      { id: 5, path: "Show.S01E03.mkv", length: 1_000_000_000 },
    ], { season: 1, episode: 3 });
    assert.equal(file.id, 5);
  });
});

describe("HTTP app", () => {
  let app;
  let baseUrl;
  let addRequest;
  let remoteAddRequest;
  let knabenRequest;
  let jacredQueries = [];
  let hybridRevision = 1;
  let syncDir;

  before(async () => {
    syncDir = mkdtempSync(join(tmpdir(), "torr-shelf-sync-"));
    const fakeFetch = async (input, options = {}) => {
      const url = new URL(input);
      if (url.hostname === "seek.test") {
        const range = String(options.headers?.Range || options.headers?.range || "bytes=0-").match(/bytes=(\d+)-(\d*)/), start = Number(range?.[1] || 0), end = range?.[2] ? Number(range[2]) : 999, length = Math.max(0, end - start + 1);
        return new Response(new Uint8Array(length), { status: 206, headers: { "Content-Type": "video/x-matroska", "Content-Length": String(length), "Content-Range": `bytes ${start}-${end}/1000` } });
      }
      if (url.hostname === "4khdhub.one" && url.pathname === "/" && url.searchParams.has("s")) return new Response(`<a class="movie-card" href="/original-movie-1/"><span class="movie-card-format">Movies</span><h3 class="movie-card-title">Original Movie</h3><p class="movie-card-meta">2026</p></a>`, { status: 200, headers: { "Content-Type": "text/html" } });
      if (url.hostname === "4khdhub.one" && url.pathname === "/original-movie-1/") return new Response(`<div class="download-item"><div class="file-title">Original.Movie.2026.2160p.WEB-DL.mkv</div><span>12.5 GB</span><a href="https://hubcloud.cx/drive/original">Download HubCloud</a></div>`, { status: 200, headers: { "Content-Type": "text/html" } });
      if (url.hostname === "hubcloud.cx" && url.pathname === "/drive/original") return new Response(`<script>var url='https://gamerxyt.com/hubcloud.php?id=original';</script>`, { status: 200, headers: { "Content-Type": "text/html" } });
      if (url.hostname === "gamerxyt.com" && url.pathname === "/hubcloud.php") return new Response(`<title>Original.Movie.2026.2160p.WEB-DL.mkv</title><a href="https://pixel.hubcloud.cx/?id=original">Download [Server : 10Gbps]</a>`, { status: 200, headers: { "Content-Type": "text/html" } });
      if (url.hostname === "pixel.hubcloud.cx") { const response = new Response("", { status: 200, headers: { "Content-Type": "text/html" } });Object.defineProperty(response, "url", { value: `https://gamerxyt.com/dl.php?link=${encodeURIComponent("https://video-downloads.googleusercontent.com/original")}` });return response; }
      if (url.hostname === "magnetz.eu" && url.pathname === "/api/magnets/search") {
        return Response.json({
          data: [
            {
              sqid: "abc123",
              name: "Ubuntu ISO",
              info_hash: HASH,
              size: 2_000_000_000,
              human_size: "1.86 GB",
              seeders: 42,
              leechers: 3,
              magnet_link: MAGNET,
              is_verified: true,
            },
            {
              sqid: "too-big",
              name: "Too big",
              info_hash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
              size: 40 * 1024 ** 3,
              seeders: 900,
              magnet_link: "magnet:?xt=urn:btih:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            },
          ],
          meta: { total: 2, last_page: 1 },
        });
      }
      if (url.hostname === "api.knaben.org") {
        knabenRequest = JSON.parse(options.body);
        return Response.json({
          total: { value: 1 },
          hits: [
            {
              id: "k1",
              title: "Ubuntu ISO",
              hash: HASH,
              bytes: 2_000_000_000,
              seeders: 55,
              peers: 4,
              magnetUrl: `${MAGNET}&tr=udp%3A%2F%2Ftracker.example`,
              category: "PC / Unix",
            },
          ],
        });
      }
      if (url.hostname === "api.themoviedb.org") {
        if (options.headers?.Authorization) {
          return Response.json(
            { status_message: "Invalid API key: You must be granted a valid key." },
            { status: 401 },
          );
        }
        assert.equal(url.searchParams.get("api_key"), "1234567890abcdef1234567890abcdef");
        if (url.pathname.endsWith("/configuration")) return Response.json({ images: {} });
        if (url.pathname.endsWith("/person/99")) {
          return Response.json({
            id: 99,
            name: "Person One",
            biography: "Tiểu sử",
            birthday: "1980-01-01",
            place_of_birth: "Việt Nam",
            known_for_department: "Acting",
            profile_path: "/person.jpg",
            also_known_as: ["P. One"],
            combined_credits: {
              cast: [{ id: 123, media_type: "movie", title: "Tên phim", original_title: "Original Movie", release_date: "2026-08-01", popularity: 100, character: "Hero" }],
              crew: [],
            },
          });
        }
        if (url.pathname.endsWith("/tv/456/season/1")) {
          return Response.json({
            id: 7001,
            season_number: 1,
            name: "Mùa 1",
            overview: "Nội dung mùa",
            episodes: [
              { id: 8001, season_number: 1, episode_number: 1, name: "Tập đầu", overview: "Nội dung tập", runtime: 52, still_path: "/still.jpg", air_date: "2025-01-01", vote_average: 8 },
            ],
          });
        }
        if (url.pathname.endsWith("/tv/456")) {
          return Response.json({
            id: 456,
            name: url.searchParams.get("language") === "ru-RU" ? "Дом Дракона" : "Tên series",
            original_name: "Original Series",
            first_air_date: "2025-01-01",
            overview: "Nội dung series",
            tagline: "Tagline series",
            status: "Returning Series",
            episode_run_time: [52],
            vote_average: 8,
            vote_count: 50,
            poster_path: "/tv-poster.jpg",
            backdrop_path: "/tv-backdrop.jpg",
            original_language: "en",
            genres: [{ id: 18, name: "Chính kịch" }],
            seasons: [{ id: 7001, season_number: 1, name: "Mùa 1", episode_count: 1, overview: "Nội dung mùa", poster_path: "/season.jpg" }],
            number_of_seasons: 1,
            number_of_episodes: 1,
            credits: { cast: [], crew: [] },
            keywords: { results: [] },
            images: { logos: [] },
            videos: { results: [] },
            content_ratings: { results: [{ iso_3166_1: "US", rating: "TV-MA" }] },
            external_ids: { imdb_id: "tt7654321" },
            production_companies: [],
          });
        }
        if (url.pathname.endsWith("/movie/123")) {
          return Response.json({
            id: 123,
            title: "Tên phim",
            original_title: "Original Movie",
            release_date: "2026-08-01",
            overview: "Nội dung đầy đủ",
            tagline: "Một tagline",
            status: "Released",
            runtime: 125,
            vote_average: 8.1,
            vote_count: 100,
            poster_path: "/poster-default.jpg",
            backdrop_path: "/backdrop.jpg",
            original_language: "en",
            genres: [{ id: 28, name: "Hành động" }],
            credits: {
              cast: [{ id: 10, name: "Actor One", character: "Hero", profile_path: "/actor.jpg" }],
              crew: [{ id: 11, name: "Director One", job: "Director", department: "Directing", profile_path: "/director.jpg" }],
            },
            keywords: { keywords: [{ id: 1, name: "adventure" }] },
            images: {
              posters: [
                { file_path: "/poster-vi.jpg", iso_639_1: "vi", vote_average: 7 },
                { file_path: "/poster-en.jpg", iso_639_1: "en", vote_average: 9 },
              ],
              logos: [
                { file_path: "/logo-vi.png", iso_639_1: "vi", vote_average: 10 },
                { file_path: "/logo-original.png", iso_639_1: "en", vote_average: 5 },
              ],
            },
            videos: { results: [{ site: "YouTube", key: "abc", type: "Trailer", official: true }] },
            release_dates: { results: [{ iso_3166_1: "VN", release_dates: [{ certification: "C16" }] }] },
            external_ids: { imdb_id: "tt1234567" },
            production_companies: [{ id: 20, name: "Studio", logo_path: "/studio.png", origin_country: "US" }],
          });
        }
        const isTv = url.pathname.includes("/tv/");
        return Response.json({
          page: 1,
          total_pages: 3,
          total_results: 55,
          results: [
            {
              id: isTv ? 456 : 123,
              media_type: isTv ? "tv" : "movie",
              title: isTv ? undefined : "Tên phim",
              original_title: isTv ? undefined : "Original Movie",
              name: isTv ? "Tên series" : undefined,
              original_name: isTv ? "Original Series" : undefined,
              release_date: isTv ? undefined : "2026-08-01",
              first_air_date: isTv ? "2025-01-01" : undefined,
              overview: "Mô tả",
              vote_average: 8.1,
              vote_count: 100,
              poster_path: "/poster.jpg",
              backdrop_path: "/backdrop.jpg",
              adult: false,
            },
            ...(url.pathname.endsWith("/search/multi") ? [{
              id: 99,
              media_type: "person",
              name: "Person One",
              known_for_department: "Acting",
              profile_path: "/person.jpg",
              popularity: 50,
              known_for: [],
            }] : []),
          ],
        });
      }
      if (url.hostname === "images.metahub.space" && url.pathname === "/background/medium/tt11138512/img") {
        return new Response(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]), { headers: { "Content-Type": "image/jpeg" } });
      }
      if (url.hostname === "images.metahub.space" && url.pathname === "/logo/medium/tt11138512/img") {
        return new Response(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]), { headers: { "Content-Type": "image/png" } });
      }
      if (url.hostname === "cloudstream.test" && url.pathname === "/repo.json") {
        return Response.json({ name: "Phisher Test", description: "CloudStream test repo", manifestVersion: 1, pluginLists: ["https://cloudstream.test/plugins.json"] });
      }
      if (url.hostname === "cloudstream.test" && url.pathname === "/plugins.json") {
        return Response.json([{ url: "https://cloudstream.test/StreamPlay.cs3", status: 1, version: 658, name: "StreamPlay", internalName: "StreamPlay", authors: ["Phisher98", "Hexated"], description: "MultiAPI", language: "en", tvTypes: ["Movie", "TvSeries"] }]);
      }
      if (url.hostname === "opensubtitles-v3.strem.io" && url.pathname === "/manifest.json") {
        return Response.json({ id: "org.stremio.opensubtitlesv3", version: "1.0.0", name: "OpenSubtitles v3", resources: ["subtitles"], types: ["movie", "series"], idPrefixes: ["tt"] });
      }
      if (url.hostname === "opensubtitles-v3.strem.io" && url.pathname.startsWith("/subtitles/")) {
        return Response.json({ subtitles: [
          { id: "vi-1", url: "https://subs.test/vi.srt", lang: "vie" },
          { id: "en-1", url: "https://subs.test/en.srt", lang: "eng" },
        ] });
      }
      if (url.hostname === "jac.red" && url.pathname === "/api/v1.0/torrents") {
        jacredQueries.push(url.searchParams.get("search"));
        return Response.json([
          { title: "Дом Дракона / Сезон: 1 / Серии: 1-10", magnet: "magnet:?xt=urn:btih:CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", types: ["serial"], seasons: [1], size: Math.round(252.3 * 1024 ** 3), sizeName: "252.3 ГБ", sid: 27, tracker: "kinozal", quality: 2160 },
          { title: "Дом Дракона S01 Complete", magnet: MAGNET, types: ["serial"], seasons: [1], sizeName: "92.60 GB", sid: 20, tracker: "rutor", quality: 1080 },
          { title: "RCC Харитонов vs Белтран [25.02.2018, MMA, WEBRip 1080p]", magnet: "magnet:?xt=urn:btih:DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD", types: ["serial"], seasons: [1], sizeName: "21.26 GB", sid: 4, tracker: "rutracker", quality: 1080 },
          { title: "Смертоносная земля / Killing Ground (2016) BDRemux 1080p", magnet: "magnet:?xt=urn:btih:EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE", types: ["serial"], seasons: [1], sizeName: "20.09 GB", sid: 4, tracker: "rutracker", quality: 1080 },
        ]);
      }
      if (url.hostname === "hybrid.test" && url.pathname === "/abc/manifest.json") {
        return Response.json({ id: "com.hybrid.test", version: `7.0.${hybridRevision}`, name: "Hybrid Test", description: "Test addon", resources: ["stream"], types: ["movie", "series"], idPrefixes: ["tt"] });
      }
      if (url.hostname === "hybrid.test" && url.pathname.startsWith("/abc/stream/")) {
        if (url.pathname.includes("tt9999999")) return Response.json({ streams: [
          { name: "Magnetz", title: "Silent.Hill.2006.1080p.BluRay.x265", infoHash: HASH, fileIdx: 0 },
          { name: "Magnetz", title: "Shrek the Halls 2007 Jack Frost 1979", infoHash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", fileIdx: 0 },
          { name: "Magnetz", title: "SILENT HILL The Short Message", infoHash: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB", fileIdx: 0 },
        ] });
        return Response.json({ streams: [
          { name: "Hybrid Direct", title: `Revision ${hybridRevision} Movie 1080p\n4.0 GB | 42 seeds`, url: "http://remote.test:12345/stream/movie?link=hash&index=1&play", behaviorHints: { notWebReady: true } },
          { name: "Hybrid Hash", title: "Movie 4K", infoHash: HASH, fileIdx: 7 },
        ] });
      }
      if (url.hostname === "remote.test" && url.pathname === "/echo") {
        return new Response("MatriX.200.1", { status: 200 });
      }
      if (url.hostname === "remote.test" && url.pathname === "/torrents") {
        remoteAddRequest = JSON.parse(options.body);
        return Response.json({ hash: HASH.toLowerCase(), stat: 0, stat_string: "Torrent added", file_stats: [{ id: 7, path: "Movie.2026.1080p.mkv", length: 4_000_000_000 }] });
      }
      if (url.hostname === "torrserver.test" && url.pathname === "/echo") {
        return new Response("MatriX.142.2", { status: 200 });
      }
      if (url.hostname === "torrserver.test" && url.pathname === "/stream/status") {
        return Response.json({
          hash: HASH.toLowerCase(),
          stat: 2,
          stat_string: "Torrent preload",
          preload_size: 64_000_000,
          preloaded_bytes: 16_000_000,
          download_speed: 4_000_000,
          active_peers: 6,
          total_peers: 20,
          connected_seeders: 3,
          file_stats: [{ id: 1, path: "ubuntu.iso.mp4", length: 2_000_000_000 }],
        });
      }
      if (url.hostname === "torrserver.test" && url.pathname === "/torrents") {
        const request = JSON.parse(options.body);
        if (request.action === "list") {
          return Response.json([
            {
              hash: HASH.toLowerCase(),
              title: "Ubuntu ISO",
              torrent_size: 2_000_000_000,
              loaded_size: 500_000_000,
              download_speed: 5_000_000,
              active_peers: 8,
              total_peers: 25,
              connected_seeders: 4,
              stat: 3,
              stat_string: "Torrent working",
              file_stats: [{ id: 1, path: "ubuntu.iso.mp4", length: 2_000_000_000 }],
            },
          ]);
        }
        if (request.action === "add" && /Дом Дракона|Complete/i.test(request.title || "")) {
          return Response.json({ hash: HASH.toLowerCase(), stat: 0, stat_string: "Torrent added", file_stats: [
            { id: 2, path: "House.of.the.Dragon.S01E02.mkv", length: 2_000_000_000 },
            { id: 3, path: "House.of.the.Dragon.S01E03.mkv", length: 2_100_000_000 },
          ] });
        }
        addRequest = request;
        return Response.json({ hash: HASH.toLowerCase(), stat: 0, stat_string: "Torrent added", file_stats: [{ id: 7, path: "Movie.2026.1080p.mkv", length: 4_000_000_000 }] });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    };

    app = createTorrShelf({
      torrServerUrl: "http://torrserver.test:8090",
      torrServerPublicUrl: "http://127.0.0.1:8090",
      tmdbToken: "test-token-that-must-not-leak",
      tmdbApiKey: "1234567890abcdef1234567890abcdef",
      syncFile: join(syncDir, "sync.json"),
      fetchImpl: fakeFetch,
    });
    await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => app.server.close((error) => (error ? reject(error) : resolve())));
    rmSync(syncDir, { recursive: true, force: true });
  });

  it("cache-busts frontend assets and forces JS/CSS revalidation", async () => {
    const htmlResponse = await fetch(`${baseUrl}/`);
    const html = await htmlResponse.text();
    assert.match(html, /cinewave-clone\.css\?v=1\.6\.6/);
    assert.match(html, /cinewave-app\.js\?v=1\.6\.6/);
    assert.doesNotMatch(html, /legacy\.css|restored-013\.css/);
    assert.match(html, /class="cw-header"/);
    assert.match(html, /id="detailHeaderIdentity"/);
    assert.match(html, /id="detailHeaderBack"/);
    assert.match(html, /id="detailHeaderLibrary"/);
    assert.match(html, /class="cw-mobile-dock"/);
    assert.match(html, /id="discoverView"/);
    assert.match(html, /id="torrentView"/);
    assert.match(html, /id="libraryView"/);
    assert.match(html, /id="libraryTabs"/);
    assert.match(html, /data-library-tab="added"/);
    assert.match(html, /data-library-tab="liked"/);
    assert.match(html, /id="libraryAddedPanel"/);
    assert.match(html, /id="libraryLikedPanel"/);
    assert.match(html, /id="likedGrid"/);
    assert.match(html, /id="likedRecommendationGrid"/);
    assert.match(html, /Vì bạn đã thích video/);
    assert.match(html, /id="continueWatchingGrid"/);
    assert.match(html, /data-go="library"/);
    assert.match(html, /id="settingsView"/);
    assert.match(html, /id="torrServerSettingsForm"/);
    assert.match(html, /id="playerPreference"/);
    assert.match(html, /id="posterColumns"/);
    assert.match(html, /id="fontPreference"/);
    assert.match(html, /value="inter">Inter · đồng đều/);
    assert.match(html, /id="stremioAddonSettings"/);
    assert.match(html, /value="3">3 cột · giống Stremio/);
    assert.match(html, /value="torrshelf">TorrShelf Player/);
    assert.match(html, /value="mpv">mpv-android · tự nạp phụ đề/);
    assert.match(html, /value="mx">MX Player · sync tiến độ/);
    assert.match(html, /value="external">Trình phát ngoài/);
    assert.match(html, /app-default-arm64-v8a-release\.apk/);
    assert.match(html, /id="nativeProviderForm"/);
    assert.match(html, /name="fourKhdHubEnabled"/);
    assert.match(html, /name="moviesDriveEnabled"/);
    assert.match(html, /name="hdHub4uEnabled"/);
    assert.match(html, /name="vadapavEnabled"/);
    assert.match(html, /name="uhdMoviesEnabled"/);
    assert.match(html, /name="hubCloudSearchEnabled"/);
    assert.match(html, /4KHDHub · HTTP/);
    assert.match(html, /MoviesDrive · HTTP/);
    assert.match(html, /HDHub4u · HTTP/);
    assert.match(html, /Vadapav · Open directory/);
    assert.match(html, /UHDMovies · HTTP/);
    assert.match(html, /HubCloud Search · Directory/);
    assert.match(html, /MoviesDrive\/HDHub4u hỗ trợ cả trang multi-season/);
    assert.match(html, /id="stremioAddonForm"/);
    assert.match(html, /https:\/\/subsense\.nepiraw\.com\//);
    assert.match(html, /id="cloudStreamRepoForm"/);
    assert.match(html, /id="cloudStreamBridgeForm"/);
    assert.match(html, /class="cw-cloudstream-settings hidden"/);
    assert.match(html, /class="cw-home-torrent-promo"/);
    assert.match(html, /Phim theo tâm trạng/);
    assert.match(html, /Hoặc chọn thể loại/);
    assert.equal((html.match(/data-mood=/g) || []).length, 12);
    assert.equal((html.match(/data-genre=/g) || []).length, 18);
    assert.match(html, /data-label="Mind-Bending"/);
    assert.match(html, /data-label="Family Night"/);
    assert.match(html, /data-label="Fantasy"/);
    assert.match(html, /data-label="Western"/);
    assert.match(html, /id="discoverSentinel"/);
    assert.doesNotMatch(html, /id="discoverPrev"|id="discoverNext"/);
    assert.doesNotMatch(html, /Thử nhanh|Ubuntu 26\.04|Big Buck Bunny/);
    assert.match(htmlResponse.headers.get("cache-control"), /no-store/);

    const cropGuideResponse = await fetch(`${baseUrl}/avengers-infinity-war-cinemeta-guide.html`);
    assert.equal(cropGuideResponse.status, 200);
    const cropGuide = await cropGuideResponse.text();
    assert.match(cropGuide, /simulateTorrShelfSearch/);
    assert.match(cropGuide, /\/api\/tmdb\/search\?q=Avengers%20Infinity%20War/);
    assert.match(cropGuide, /\/api\/cinemeta\/background\?imdb=\$\{encodeURIComponent\(imdbId\)\}/);
    assert.match(cropGuide, /16 \/ 11/);
    assert.match(cropGuide, /1\.00 · không thu/);
    assert.match(cropGuide, /No filter, opacity, mask or dark overlay/);

    const cssResponse = await fetch(`${baseUrl}/cinewave-clone.css?v=1.6.6`);
    assert.equal(cssResponse.status, 200);
    assert.match(cssResponse.headers.get("cache-control"), /no-store/);
    const css = await cssResponse.text();
    assert.match(css, /\.cw-header\{position:fixed/);
    assert.match(css, /\.cw-mobile-dock\{position:fixed/);
    assert.match(css, /\.cw-moods\{/);
    assert.match(css, /\.cw-moods button:nth-child\(12\) i\{color:#fbbf24\}/);
    assert.match(css, /\.cw-categories button svg\{width:16px;height:16px;flex:0 0 16px\}/);
    assert.match(css, /\.cw-detail-hero\{/);
    assert.match(css, /\.ts-torrent-card\{/);
    assert.match(css, /\.ts-stream-badges\{/);
    assert.match(css, /\.ts-card-actions \.ts-add\{/);
    assert.match(css, /\.cw-episode-browser\{[^}]*max-height:none[^}]*overflow:visible/);
    assert.match(css, /\.cw-episode-list\{[^}]*overflow:visible/);
    assert.match(css, /\.cw-episode-detail-info\{/);
    assert.match(css, /#detailView\.episode-selected/);
    assert.match(css, /\.cw-cast-avatar\{/);
    assert.match(css, /\.cw-related-section\{/);
    assert.match(css, /\.cw-person-profile\{/);
    assert.match(css, /\.cw-torrserver-config\{/);
    assert.match(css, /\.cw-player-settings,\.cw-display-settings\{/);
    assert.match(css, /\.cw-player-settings>select,\.cw-display-settings>select\{/);
    assert.match(css, /\.cw-player-download\{/);
    assert.match(css, /\.cw-native-settings\{/);
    assert.match(css, /\.cw-native-source-grid\{/);
    assert.match(css, /\.cw-addon-settings\{/);
    assert.match(css, /\.cw-cloudstream-settings\{/);
    assert.match(css, /\.cw-stream-row\{[^}]*min-width:0[^}]*max-width:100%[^}]*overflow:hidden/);
    assert.match(css, /\.cw-info-streams\{[^}]*min-width:0[^}]*max-width:100%/);
    assert.match(css, /\.cw-stream-results\{[^}]*grid-template-columns:minmax\(0,1fr\)[^}]*overflow:hidden/);
    assert.match(css, /\.cw-stream-title,\.cw-stream-details\{[^}]*overflow-wrap:anywhere[^}]*word-break:break-word/);
    assert.match(css, /\.cw-stream-tracker\{[^}]*color:var\(--cyan-light\)[^}]*font:inherit/);
    assert.match(css, /\.cw-stream-badges>span\{[^}]*color:inherit[^}]*font:inherit/);
    assert.match(css, /\.cw-stream-addon-tabs\{/);
    assert.match(css, /\.cw-stream-addon-bar\{display:grid/);
    assert.match(css, /\.cw-stream-settings-button\{display:grid/);
    assert.match(css, /body\[data-font="outfit"\]/);
    assert.match(css, /\.cw-season-tabs\{/);
    assert.match(css, /\.cw-detail-logo\{[^}]*transform:translateY\(0\)/);
    assert.doesNotMatch(css, /\.cw-detail-copy\{[^}]*transform/);
    assert.match(css, /\.cw-detail-copy\{[^}]*padding-bottom:0/);
    assert.match(css, /\.cw-detail-shell\{[^}]*padding:70px 20px 0/);
    assert.match(css, /\.cw-detail-meta\{[^}]*margin:0/);
    assert.match(css, /\.cw-detail-hero:after\{[^}]*height:3px[^}]*background:#05070a/);
    assert.match(css, /\.cw-detail-body\{[^}]*margin:-2px auto 0[^}]*padding:104px 20px 80px[^}]*background:#05070a/);
    assert.match(css, /\.cw-detail-body>\.cw-overview-info\{margin-top:32px/);
    assert.match(css, /\.cw-info-streams\{[^}]*--cw-stream-font-size:14px/);
    assert.match(css, /\.cw-stream-row-copy\{[^}]*color:var\(--zinc-300\)[^}]*font-size:var\(--cw-stream-font-size\);font-weight:600;line-height:20px/);
    assert.match(css, /\.cw-stream-loading b,[^{]+\{font-size:var\(--cw-stream-font-size\);font-weight:600;line-height:20px\}/);
    assert.doesNotMatch(css, /\.cw-stream-(?:provider|row-meta)/);
    assert.doesNotMatch(css, /\.cw-stream-row-copy>(?:strong|small)/);
    assert.match(css, /\.cw-detail-hero\{[^}]*min-height:0[^}]*aspect-ratio:32\/20\.69[^}]*overflow:visible/);
    assert.match(css, /\.cw-detail-bg\{[^}]*overflow:hidden/);
    assert.match(css, /\.cw-detail-shell\{[^}]*z-index:5[^}]*height:100%[^}]*min-height:0/);
    assert.match(css, /\.cw-detail-bg>img\{[^}]*object-fit:cover[^}]*transform:translateY\(0\) scale\(1\.15\)[^}]*transform-origin:center top/);
    assert.match(css, /#detailView\{[^}]*margin:0/);
    assert.doesNotMatch(css, /\.cw-header\.cw-detail-context\{/);
    assert.match(css, /\.cw-header\.cw-detail-header-active \.cw-brand[^}]+opacity:0/);
    assert.match(css, /\.cw-detail-header-identity\{[^}]*display:grid[^}]*opacity:0/);
    assert.match(css, /\.cw-detail-hero-back\{[^}]*width:42px[^}]*height:42px/);
    assert.match(css, /\.cw-detail-secondary\{[^}]*gap:0[^}]*padding:3px 6px/);
    assert.match(css, /\.cw-detail-icon\{[^}]*width:38px!important[^}]*height:38px!important/);
    assert.match(css, /\.cw-detail-hero\{aspect-ratio:16\/11[^}]*\}/);
    assert.match(css, /\.cw-detail-bg>img\{-webkit-mask-image:none;mask-image:none\}/);
    assert.match(css, /\.cw-detail-gradient\{display:block;background:linear-gradient\(to bottom,rgba\(5,7,10,\.10\) 0%,rgba\(5,7,10,\.12\) 43%,rgba\(5,7,10,\.34\) 63%,rgba\(5,7,10,\.72\) 84%,#05070a 100%\)/);
    assert.match(css, /\.cw-detail-hero:after\{display:none\}/);
    assert.match(css, /\.cw-detail-title-visual\{margin-bottom:-8px\}/);
    assert.match(css, /\.cw-detail-logo\{max-width:min\(56vw,440px\);max-height:68px\}/);
    assert.match(css, /\.cw-detail-body\{margin-top:0;padding-top:52px\}/);
    assert.match(css, /\.cw-detail-meta-facts,\.cw-detail-meta-actions\{display:flex;align-items:center\}/);
    assert.match(css, /\.cw-imdb-badge\{/);
    assert.match(css, /\.cw-detail-meta-icon\{display:grid;width:38px;height:38px/);
    assert.match(css, /\.cw-library-tabs\{display:inline-flex/);
    assert.match(css, /\.cw-library-tabs button\.active\{/);
    assert.match(css, /\.cw-liked-recommendations\{/);
    assert.match(css, /@media\(hover:hover\) and \(pointer:fine\)\{\.cw-poster/);
    assert.match(css, /\.cw-detail-body-genres\{/);
    assert.doesNotMatch(css, /\.cw-streams-head\{/);
    assert.doesNotMatch(css, /\.cw-stream-row\{[^}]*border-bottom/);
    assert.doesNotMatch(css, /\.cw-episode\{[^}]*border-bottom/);
    assert.doesNotMatch(css, /\.cw-episodes-toolbar\{[^}]*border-bottom/);
    assert.match(css, /@media\(orientation:landscape\)[^{]*\{[^}]*\.cw-detail-hero\{[^}]*aspect-ratio:auto/);
    assert.match(css, /@media \(orientation:landscape\) and \(min-width:640px\)\{[\s\S]*?\.cw-detail-layout\{display:grid/);
    assert.match(css, /\.cw-mobile-dock\{display:none\}/);
    assert.match(css, /\.cw-detail-gradient\{display:block;background:linear-gradient\(90deg,#05070a/);
    assert.match(css, /\.ts-card-actions \.ts-add\{/);
    assert.match(css, /\.cw-poster-row\{[^}]*grid-auto-columns:128px[^}]*gap:16px[^}]*padding:24px 20px[^}]*scrollbar-color:#1a1d23 #05070a/);
    assert.match(css, /\.cw-poster-row \.cw-poster\{aspect-ratio:2\/3\}/);
    assert.match(css, /\.cw-poster-row::-webkit-scrollbar\{display:block;width:8px;height:8px\}/);
    assert.match(css, /\.cw-poster-row::-webkit-scrollbar-thumb\{[^}]*background:#1a1d23/);
    assert.match(css, /\.cw-poster-progress\{[^}]*right:12px[^}]*bottom:10px[^}]*left:12px[^}]*width:calc\(100% - 24px\)/);
    assert.match(css, /\.cw-poster-progress-track\{fill:rgba\(0,0,0,\.72\)\}/);
    assert.match(css, /\.cw-poster-progress-value\{fill:var\(--cyan-light\)\}/);
    assert.doesNotMatch(css, /\.cw-poster-progress-fill\{/);
    assert.match(css, /\.cw-episode-section\{margin-top:32px;scroll-margin-top:90px\}/);
    assert.doesNotMatch(css, /body\[data-poster-columns="3"\] \.cw-poster-row/);
    assert.match(css, /body\[data-poster-columns="3"\] \.cw-poster-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:12px\}/);
    assert.match(css, /\.cw-player-settings,\.cw-display-settings\{/);
    assert.match(css, /\.cw-library-block\{/);
    assert.match(css, /\.cw-infinite-sentinel\{/);
    assert.match(css, /font-family:Inter/);
    assert.match(css, /font-family:Outfit/);
    const jsResponse = await fetch(`${baseUrl}/cinewave-app.js?v=1.6.6`);
    const js = await jsResponse.text();
    assert.match(js, /history\.scrollRestoration='manual'/);
    assert.match(js, /function setHero/);
    assert.match(js, /homeLoaded/);
    assert.match(js, /state\.homeLoaded\?showView\('home'\):loadHome\(\)/);
    assert.match(js, /function handleDetailBack/);
    assert.match(js, /function searchTorrents/);
    assert.match(js, /new IntersectionObserver/);
    assert.match(js, /data-share-current/);
    assert.match(js, /data-share-person/);
    assert.match(js, /torrshelf:torrserver-url/);
    assert.match(js, /torrServerUrl:state\.customTorrServerUrl/);
    assert.match(js, /const homeIcons=/);
    assert.match(js, /randomPicks:/);
    assert.match(js, /els\.detail\.classList\.remove\('episode-selected'\)/);
    assert.match(js, /function readPosterColumns\(\)\{return localStorage\.getItem\('torrshelf:poster-columns'\)===\'2\'\?2:3;\}/);
    assert.match(js, /function applyPosterLayout/);
    assert.match(js, /Đã dùng \$\{state\.posterColumns\} cột poster/);
    assert.match(js, /\/api\/stremio\/streams/);
    assert.match(js, /\/api\/native\/streams/);
    assert.match(js, /torrshelf:native-provider/);
    assert.match(js, /fourKhdHubEnabled:false,moviesDriveEnabled:false,hdHub4uEnabled:false,vadapavEnabled:false,uhdMoviesEnabled:false,hubCloudSearchEnabled:false/);
    assert.match(js, /form\.elements\.fourKhdHubEnabled\.checked/);
    assert.match(js, /form\.elements\.moviesDriveEnabled\.checked/);
    assert.match(js, /form\.elements\.hdHub4uEnabled\.checked/);
    assert.match(js, /form\.elements\.vadapavEnabled\.checked/);
    assert.match(js, /form\.elements\.uhdMoviesEnabled\.checked/);
    assert.match(js, /form\.elements\.hubCloudSearchEnabled\.checked/);
    assert.match(js, /queriedStreamAddons/);
    assert.match(js, /\/api\/stremio\/cache\/clear/);
    assert.match(js, /streamRequestId/);
    assert.match(js, /requestId!==state\.streamRequestId/);
    assert.match(js, /markStremioAddonsChanged/);
    assert.match(js, /\/api\/stremio\/resolve/);
    assert.match(js, /\/api\/player\/session/);
    assert.match(js, /localStorage\.removeItem\('torrshelf:external-playback'\)/);
    assert.doesNotMatch(js, /function rememberExternalPlayback|function settleExternalPlayback|estimated:true/);
    assert.match(js, /runtimeMinutes:item\.mediaType===/);
    assert.match(js, /\/api\/sync\/state/);
    assert.match(js, /\/api\/sync\/library/);
    assert.match(js, /addEventListener\('focus',refreshSyncAfterReturn\)/);
    assert.match(js, /addEventListener\('pageshow',refreshSyncAfterReturn\)/);
    assert.match(js, /visibilitychange/);
    assert.match(js, /function poster\(item,showProgress=false\)/);
    assert.match(js, /showProgress&&percent>0\?`<svg class="cw-poster-progress"[^`]+class="cw-poster-progress-value"[^`]+width="\$\{percent\.toFixed\(1\)\}"/);
    assert.doesNotMatch(js, /--cw-progress|scaleX\(\$\{\(percent\/100\)/);
    assert.match(js, /row\('Tiếp tục xem',continuing,'nowPlaying',true\)/);
    assert.doesNotMatch(js, /\.map\(poster\)/);
    assert.match(js, /continueWatchingItems/);
    assert.match(js, /Number\(record\.percent\)<=0/);
    assert.match(js, /\/api\/player\/external/);
    assert.match(js, /originalTitle:item\.originalTitle/);
    assert.match(js, /launchPlayerSession/);
    assert.match(js, /url\.searchParams\.set\('engine',engine\)/);
    assert.match(js, /\['mpv','mx'\]\.includes\(state\.playerPreference\)\?state\.playerPreference:/);
    assert.match(js, /Đã chọn MX Player sync/);
    assert.match(js, /package=app\.torrshelf\.player/);
    assert.match(js, /episodeSection/);
    assert.doesNotMatch(js, /episodeCount/);
    assert.match(js, /normalHeight=Number\(hero\.dataset\.normalHeight\)\|\|0/);
    assert.match(js, /landscape=matchMedia\('\(orientation: landscape\) and \(min-width: 640px\)'\)\.matches,progress=Math\.max\(0,Math\.min\(1,scrollY\/Math\.max\(220,normalHeight\*\.92\)\)\),zoomEnd=\.20,zoomOut=landscape\?0:Math\.min\(1,progress\/zoomEnd\),sourceRatio=/);
    assert.match(js, /fullHeight=width\/sourceRatio,frameHeight=normalHeight\+\(fullHeight-normalHeight\)\*zoomOut/);
    assert.match(js, /previousHeight=Number\(hero\.dataset\.frameHeight\)\|\|0;if\(Math\.abs\(previousHeight-frameHeight\)>.1\)\{hero\.style\.height=`\$\{frameHeight\}px`;hero\.dataset\.frameHeight=String\(frameHeight\);\}/);
    assert.match(js, /if\(backdrop\)\{backdrop\.style\.transform='translateY\(0\) scale\(1\)';backdrop\.style\.maskImage='none';backdrop\.style\.webkitMaskImage='none';\}/);
    assert.match(js, /if\(shade\)shade\.style\.opacity=''/);
    assert.match(js, /titleBox=heroLogo\.getBoundingClientRect\(\),headerBox=els\.header\.getBoundingClientRect\(\),mergeDistance=Math\.max\(56,titleBox\.height\+24\)/);
    assert.match(js, /heroLogo\.style\.transform=merge\?`translateY\(\$\{-12\*merge\}px\) scale\(\$\{1-merge\*\.12\}\)`:''/);
    assert.match(js, /els\.detailHeaderIdentity\.style\.opacity=String\(merge\)/);
    assert.doesNotMatch(js, /logoProgress|backdropY|logoY/);
    assert.doesNotMatch(js, /cw-detail-open|cw-stremio-credit/);
    assert.match(js, /classList\.add\('cw-detail-context'\)/);
    assert.match(js, /classList\.toggle\('cw-detail-header-active',merge>\.62\)/);
    assert.doesNotMatch(js, /addEventListener\('touchstart'|addEventListener\('touchmove'|detailTouch|readDetailScrollOffset/);
    assert.match(js, /detailScrollFrame=requestAnimationFrame\(\(\)=>\{detailScrollFrame=0;updateDetailHeaderMotion\(\)\}\)/);
    assert.match(js, /const requestId=\+\+state\.detailRequestId/);
    assert.match(js, /detailHeaderLogo\.removeAttribute\('src'\)/);
    assert.match(js, /if\(requestId!==state\.detailRequestId\)return/);
    assert.match(js, /Number\(state\.selected\?\.id\)!==mediaId/);
    assert.match(js, /discoverGrid\.insertAdjacentHTML\('beforeend',markup\)/);
    assert.doesNotMatch(js, /discoverGrid\.innerHTML=state\.discoverItems\.map/);
    assert.match(js, /\/api\/cinemeta\/background\?imdb=/);
    assert.match(js, /\/api\/cinemeta\/logo\?imdb=/);
    assert.match(js, /data-logo-fallback/);
    assert.match(js, /const episodeSection=item\.mediaType===/);
    assert.match(js, /class="cw-detail-content"[^`]+cw-detail-body-genres[^`]+\$\{episodeSection\}/);
    assert.match(js, /id="detailLinksColumn" class="cw-detail-links-column"/);
    assert.match(js, /id="infoStreams" class="cw-info-streams hidden"/);
    assert.match(js, /links=\$\('#detailLinksColumn'\);if\(panel&&links\)links\.append\(panel\)/);
    assert.match(js, /data-like-current/);
    assert.match(js, /torrshelf:liked-media/);
    assert.match(js, /function readLikedMedia\(\)/);
    assert.match(js, /function likedItems\(\)/);
    assert.match(js, /function setLibraryTab\(tab\)/);
    assert.match(js, /async function loadLikedRecommendations/);
    assert.match(js, /Vì bạn đã thích \$\{seed\.title/);
    assert.match(js, /data-library-tab/);
    assert.match(js, /seasonCache: new Map\(\), seasonRequests: new Map\(\)/);
    assert.match(js, /function fetchSeasonCached/);
    assert.match(js, /async function preloadSeasons[^}]+Promise\.allSettled/);
    assert.match(js, /const selectedLoad=loadSeason\(data\.id,state\.selectedSeason\);void preloadSeasons\(data\.id,data\.seasons\);await selectedLoad/);
    assert.match(js, /requestAnimationFrame\(\(\)=>window\.scrollTo\(\{top:0,behavior:'smooth'\}\)\)/);
    assert.doesNotMatch(js, /els\.detail\.scrollIntoView/);
    assert.doesNotMatch(js, /await loadSeason\([^;]+;requestAnimationFrame\(\(\)=>\$\('#episodeSection'\)/);
    assert.match(js, /data-backdrop-fallback/);
    assert.match(js, /data-stream-addon/);
    assert.match(js, /function revealActiveStreamAddon/);
    assert.match(js, /cw-stream-addon-bar/);
    assert.match(js, /data-open-addon-settings/);
    assert.match(js, /stremioAddonSettings/);
    assert.match(js, /function readFontPreference\(\)/);
    assert.match(js, /function applyFontPreference\(\)/);
    assert.match(js, /torrshelf:font/);
    assert.match(js, /updateDetailHeaderMotion/);
    assert.match(js, /classList\.remove\('cw-detail-context','cw-detail-header-active'\)/);
    assert.match(js, /torrshelf:library/);
    assert.match(js, /torrshelf:player/);
    assert.match(js, /state\.playerPreference===\'external\'/);
    assert.match(js, /S\.title=\$\{intentTitle\}/);
    assert.match(js, /externalTitle=item\.mediaType===\'tv\'/);
    assert.match(js, /Đang mở trình phát ngoài/);
    assert.match(js, /data-library-current/);
    assert.match(js, /toggleCurrentLibrary/);
    assert.match(js, /selectEpisode/);
    assert.match(js, /const detailMeta=/);
    assert.match(js, /<div class="cw-detail-body">\s*<main class="cw-detail-content">\s*\$\{detailMeta\}/);
    assert.match(js, /<aside id="detailLinksColumn" class="cw-detail-links-column">/);
    assert.match(js, /<div class="cw-detail-supporting">/);
    assert.doesNotMatch(js, /data-show-streams/);
    assert.match(js, /torrshelf:stremio-addons/);
    assert.match(js, /torrshelf:cloudstream/);
    assert.match(js, /\/api\/cloudstream\/import/);
    assert.match(js, /connectCloudStreamBridge/);
    assert.match(js, /const CLOUDSTREAM_ENABLED = false/);
    assert.match(js, /sourceKind!==\'cloudstream-bridge\'/);
    assert.match(js, /class="cw-stream-row" data-info-stream/);
    assert.match(js, /class="cw-stream-tracker">\$\{esc\(tracker\)\}/);
    assert.match(js, /class="cw-stream-title">\$\{esc\(headline\)\}/);
    assert.match(js, /class="cw-stream-details">\$\{esc\(lines\.join/);
    assert.doesNotMatch(js, /aria-label="Play stream"/);
    assert.match(js, /data-add=/);
    assert.match(js, /intent:\/\//);

    const fontResponse = await fetch(`${baseUrl}/fonts/outfit-latin.woff2`);
    assert.equal(fontResponse.status, 200);
    assert.equal(fontResponse.headers.get("content-type"), "font/woff2");
  });

  it("reports TorrServer health", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const payload = await response.json();
    assert.equal(payload.torrServer.online, true);
    assert.equal(payload.torrServer.version, "MatriX.142.2");
    assert.equal(payload.sizeFilter.userControlled, true);
    assert.equal(payload.sizeFilter.emptyMeansUnlimited, true);
    assert.equal(payload.tmdb.configured, true);
    assert.doesNotMatch(JSON.stringify(payload), /test-token-that-must-not-leak/);
    assert.doesNotMatch(JSON.stringify(payload), /1234567890abcdef1234567890abcdef/);
  });

  it("checks a user-selected public TorrServer through the local backend", async () => {
    const response = await fetch(`${baseUrl}/api/torrserver/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "remote.test:12345" }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.online, true);
    assert.equal(payload.version, "MatriX.200.1");
    assert.equal(payload.url, "http://remote.test:12345");
  });

  it("imports CloudStream repository metadata and detects StreamPlay", async () => {
    const response = await fetch(`${baseUrl}/api/cloudstream/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://cloudstream.test/repo.json" }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.repo.name, "Phisher Test");
    assert.equal(payload.plugins[0].internalName, "StreamPlay");
    assert.equal(payload.plugins[0].version, 658);
  });

  it("imports a Stremio stream addon manifest", async () => {
    const response = await fetch(`${baseUrl}/api/stremio/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "http://hybrid.test/abc/manifest.json" }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.addon.id, "com.hybrid.test");
    assert.equal(payload.addon.baseUrl, "http://hybrid.test/abc");
  });

  it("loads and resolves imported Stremio streams", async () => {
    const streamsResponse = await fetch(`${baseUrl}/api/stremio/streams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "movie", id: "tt1234567", addons: ["http://hybrid.test/abc/manifest.json"] }),
    });
    const streams = await streamsResponse.json();
    assert.equal(streamsResponse.status, 200);
    assert.equal(streams.streams.length, 2);
    assert.equal(streams.streams[0].title.includes("\n"), true);

    const resolveResponse = await fetch(`${baseUrl}/api/stremio/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ infoHash: HASH, fileIdx: 7, title: "Movie 4K", torrServerUrl: "http://remote.test:12345" }),
    });
    const resolved = await resolveResponse.json();
    const streamUrl = new URL(resolved.streamUrl);
    assert.equal(resolveResponse.status, 200);
    assert.equal(streamUrl.origin, "http://remote.test:12345");
    assert.equal(streamUrl.searchParams.get("index"), "7");
    assert.match(streamUrl.searchParams.get("link"), /^magnet:/);
  });

  it("removes wrong Hybrid movie matches before returning stream cards", async () => {
    const response = await fetch(`${baseUrl}/api/stremio/streams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "movie",
        id: "tt9999999",
        addons: ["http://hybrid.test/abc/manifest.json"],
        media: { title: "Đồi Câm Lặng", originalTitle: "Silent Hill", year: 2006 },
      }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.streams.length, 1);
    assert.match(payload.streams[0].title, /Silent\.Hill\.2006/);
    assert.equal(payload.matching.filtered, 2);
  });

  it("keeps the experimental 4KHDHub scraper disabled by default and resolves it when enabled", async () => {
    const response = await fetch(`${baseUrl}/api/native/streams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "movie",
        id: "tt1234567",
        media: { tmdbId: 123, title: "Tên phim", originalTitle: "Original Movie", year: 2026 },
        config: { enabled: true, fourKhdHubEnabled: true, jacredEnabled: false, torrentioEnabled: false, knabenEnabled: false, magnetzEnabled: false },
      }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.streams.length, 1);
    assert.equal(payload.streams[0].addonName, "4KHDHub");
    assert.match(payload.streams[0].title, /12\.5 GB · 2160p · HTTP/);
    assert.equal(payload.streams[0].url, "https://video-downloads.googleusercontent.com/original");
    const resolvedResponse = await fetch(`${baseUrl}/api/stremio/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload.streams[0]) });
    const resolved = await resolvedResponse.json();
    assert.equal(resolved.direct, true);
    assert.equal(resolved.streamUrl, payload.streams[0].url);
  });

  it("wraps seekable HTTP sources in a real local 206 Range proxy", async () => {
    const resolveResponse = await fetch(`${baseUrl}/api/stremio/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: "https://seek.test/video.mkv", title: "Seek Test.mkv", rangeProxy: true, headers: {} }) });
    const resolved = await resolveResponse.json();
    assert.equal(resolveResponse.status, 200);
    assert.equal(resolved.rangeProxy, true);
    assert.match(resolved.streamUrl, /\/api\/http-range\//);
    const rangeResponse = await fetch(resolved.streamUrl, { headers: { Range: "bytes=100-101" } });
    assert.equal(rangeResponse.status, 206);
    assert.equal(rangeResponse.headers.get("content-range"), "bytes 100-101/1000");
    assert.equal((await rangeResponse.arrayBuffer()).byteLength, 2);
  });

  it("searches Jacred by Russian TMDB title and resolves the exact episode from a pack", async () => {
    const response = await fetch(`${baseUrl}/api/native/streams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "series",
        id: "tt7654321:1:3",
        media: { tmdbId: 456, title: "Tên series", originalTitle: "Original Series", year: 2025, season: 1, episode: 3 },
        config: { enabled: true, jacredEnabled: true, torrentioEnabled: false, knabenEnabled: false, magnetzEnabled: false, jacredDomain: "jac.red" },
      }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.searchTitles.russian, "Дом Дракона");
    assert.deepEqual([...new Set(jacredQueries)].sort(), ["Original Series", "tt7654321", "Дом Дракона"].sort());
    assert.equal(payload.streams.length, 2);
    assert.equal(payload.streams[0].addonName, "Jacred");
    assert.equal(payload.streams[0].tracker, "kinozal");
    assert.match(payload.streams[0].title, /252\.30 GB/);
    assert.doesNotMatch(payload.streams[0].title, /kinozal/i);
    assert.equal(payload.streams[0].nativePack, true);
    assert.equal(payload.streams[0].episode, 3);

    const resolveResponse = await fetch(`${baseUrl}/api/stremio/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.streams[0]),
    });
    const resolved = await resolveResponse.json();
    assert.equal(resolveResponse.status, 200);
    assert.equal(resolved.nativePack, true);
    assert.equal(resolved.file.id, 3);
    assert.match(resolved.file.path, /S01E03/);
    assert.equal(new URL(resolved.streamUrl).searchParams.get("index"), "3");
  });

  it("clears stale addon manifests and streams when an addon is re-imported", async () => {
    const cachedResponse = await fetch(`${baseUrl}/api/stremio/streams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "movie", id: "tt1234567", addons: ["http://hybrid.test/abc/manifest.json"] }),
    });
    const cached = await cachedResponse.json();
    assert.equal(cached.cached, true);
    assert.match(cached.streams[0].title, /Revision 1/);

    hybridRevision = 2;
    const importResponse = await fetch(`${baseUrl}/api/stremio/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "http://hybrid.test/abc/manifest.json", refresh: true }),
    });
    const imported = await importResponse.json();
    assert.equal(importResponse.status, 200);
    assert.equal(imported.cacheRefreshed, true);
    assert.equal(imported.addon.version, "7.0.2");

    const freshResponse = await fetch(`${baseUrl}/api/stremio/streams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "movie", id: "tt1234567", addons: ["http://hybrid.test/abc/manifest.json"] }),
    });
    const fresh = await freshResponse.json();
    assert.equal(fresh.cached, false);
    assert.match(fresh.streams[0].title, /Revision 2/);

    const clearResponse = await fetch(`${baseUrl}/api/stremio/cache/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const cleared = await clearResponse.json();
    assert.equal(clearResponse.status, 200);
    assert.equal(cleared.ok, true);
    assert.ok(cleared.cleared.streams >= 1);
  });

  it("loads subtitles by exact Stremio movie or episode ID", async () => {
    const response = await fetch(`${baseUrl}/api/stremio/subtitles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "series", id: "tt7654321:1:3", addons: [] }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.id, "tt7654321:1:3");
    assert.equal(payload.subtitles[0].language, "vi");
    assert.equal(payload.subtitles[1].language, "en");
  });

  it("creates a metadata and subtitle play session for the APK", async () => {
    const response = await fetch(`${baseUrl}/api/player/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        streamUrl: "http://remote.test:12345/stream/show?play",
        title: "Test Show",
        originalTitle: "Original Test Show",
        year: "2025",
        tmdbId: 456,
        mediaType: "tv",
        imdbId: "tt7654321",
        posterPath: "/poster.jpg",
        backdropPath: "/backdrop.jpg",
        type: "series",
        id: "tt7654321:1:3",
        season: 1,
        episode: 3,
        runtimeMinutes: 40,
        headers: { Referer: "https://example.test/" },
      }),
    });
    const created = await response.json();
    assert.equal(response.status, 200);
    assert.equal(created.subtitleCount, 2);
    assert.equal(created.resumeDurationMs, 2_400_000);
    assert.match(created.deepLink, /^torrshelf-player:\/\/play\?/);

    const sessionResponse = await fetch(`${baseUrl}/api/player/session/${created.token}`);
    const session = await sessionResponse.json();
    assert.equal(sessionResponse.status, 200);
    assert.equal(session.title, "Test Show");
    assert.equal(session.season, 1);
    assert.equal(session.episode, 3);
    assert.equal(session.headers.Referer, "https://example.test/");
    assert.equal(session.subtitles[0].language, "vi");
    assert.equal(session.resumePositionMs, 0);
    assert.equal(session.resumeDurationMs, 2_400_000);

    const progressResponse = await fetch(`${baseUrl}/api/player/session/${created.token}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionMs: 1_200_000, durationMs: 2_400_000 }),
    });
    const progress = await progressResponse.json();
    assert.equal(progressResponse.status, 200);
    assert.equal(progress.progress.videoKey, "tt7654321:1:3");
    assert.equal(progress.progress.mediaKey, "tv:456");
    assert.equal(progress.progress.percent, 0.5);

    const nextSessionResponse = await fetch(`${baseUrl}/api/player/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamUrl: "http://another-source.test/episode.mkv", title: "Test Show", originalTitle: "Original Test Show", year: "2025", tmdbId: 456, mediaType: "tv", imdbId: "tt7654321", type: "series", id: "tt7654321:1:3", season: 1, episode: 3, posterPath: "/poster.jpg" }),
    });
    const nextSession = await nextSessionResponse.json();
    assert.equal(nextSession.resumePositionMs, 1_200_000);

    const ignoredRegressionResponse = await fetch(`${baseUrl}/api/player/session/${nextSession.token}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionMs: 14_000, durationMs: 2_400_000 }),
    });
    const ignoredRegression = await ignoredRegressionResponse.json();
    assert.equal(ignoredRegressionResponse.status, 200);
    assert.equal(ignoredRegression.regressionIgnored, true);
    assert.equal(ignoredRegression.reportedPositionMs, 14_000);
    assert.equal(ignoredRegression.progress.positionMs, 1_200_000);

    const webFallbackResponse = await fetch(`${baseUrl}/api/player/session/${nextSession.token}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionMs: 1_680_000, durationMs: 2_400_000, estimated: true }),
    });
    const webFallback = await webFallbackResponse.json();
    assert.equal(webFallbackResponse.status, 200);
    assert.equal(webFallback.progress.positionMs, 1_680_000);
    assert.equal(webFallback.progress.percent, 0.7);
  });

  it("persists the synchronized library and continue-watching snapshot", async () => {
    const addResponse = await fetch(`${baseUrl}/api/sync/library`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media: { id: 456, mediaType: "tv", title: "Test Show", originalTitle: "Original Test Show", year: "2025", imdbId: "tt7654321", posterPath: "/poster.jpg" }, inLibrary: true }),
    });
    const added = await addResponse.json();
    assert.equal(addResponse.status, 200);
    assert.equal(added.inLibrary, true);
    assert.equal(added.state.library[0].id, 456);

    const stateResponse = await fetch(`${baseUrl}/api/sync/state`);
    const statePayload = await stateResponse.json();
    assert.equal(statePayload.library.length, 1);
    assert.equal(statePayload.progress[0].videoKey, "tt7654321:1:3");
    assert.equal(statePayload.continueWatching[0].percent, 0.7);
    assert.equal(existsSync(join(syncDir, "sync.json")), true);
  });

  it("normalizes an external-player duration reported in seconds", async () => {
    const sessionResponse = await fetch(`${baseUrl}/api/player/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamUrl: "http://remote.test/movie.mkv", title: "Test Movie", originalTitle: "Test Movie", year: "2026", tmdbId: 123, mediaType: "movie", imdbId: "tt1234567", type: "movie", id: "tt1234567", posterPath: "/poster.jpg" }),
    });
    const session = await sessionResponse.json();
    const response = await fetch(`${baseUrl}/api/player/session/${session.token}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionMs: 60_000, durationMs: 7_200, engine: "mpv" }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.progress.durationMs, 7_200_000);
    assert.equal(payload.progress.positionMs, 60_000);
    assert.equal(payload.progress.completed, false);
    assert.ok(payload.progress.percent < 0.01);
  });

  it("creates a short local external-player handoff without losing the stream query", async () => {
    const streamUrl = "http://remote.test:12345/stream/Movie.mkv?link=magnet%3A%3Fxt%3Durn%3Abtih%3AABC%26tr%3Dudp%253A%252F%252Ftracker&index=7&play=";
    const response = await fetch(`${baseUrl}/api/player/external`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamUrl, title: "The Northman (2022)" }),
    });
    const created = await response.json();
    assert.equal(response.status, 200);
    assert.equal(created.title, "The Northman (2022)");
    assert.match(created.handoffUrl, /\/api\/player\/external\/[A-Za-z0-9_-]+\/The%20Northman%20\(2022\)\.mkv$/);
    assert.doesNotMatch(created.handoffUrl, /magnet|tracker|index=/);

    const openResponse = await fetch(created.handoffUrl, { redirect: "manual" });
    assert.equal(openResponse.status, 307);
    assert.equal(openResponse.headers.get("location"), streamUrl);
    assert.match(openResponse.headers.get("content-disposition"), /The%20Northman%20\(2022\)\.mkv/);
    assert.equal(decodeURIComponent(openResponse.headers.get("x-torrshelf-title")), "The Northman (2022)");
  });

  it("loads the TorrServer library", async () => {
    const response = await fetch(`${baseUrl}/api/torrserver/torrents`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.data.length, 1);
    assert.equal(payload.data[0].title, "Ubuntu ISO");
  });

  it("loads the TMDB home rails without exposing credentials", async () => {
    const response = await fetch(`${baseUrl}/api/tmdb/home`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.ok(payload.hero);
    assert.equal(payload.rails.length, 7);
    assert.equal(payload.rails[0].items[0].searchQuery, "Original Movie 2026");
    assert.equal(payload.rails[1].key, "randomPicks");
    assert.equal(payload.rails[1].title, "Phim ngẫu nhiên");
    assert.equal(payload.meta.credentialMode, "api_key_v3");
    assert.doesNotMatch(JSON.stringify(payload), /test-token-that-must-not-leak/);
    assert.doesNotMatch(JSON.stringify(payload), /1234567890abcdef1234567890abcdef/);
  });

  it("paginates a TMDB rail", async () => {
    const response = await fetch(`${baseUrl}/api/tmdb/list?key=popularMovies&page=1`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.title, "Phim phổ biến");
    assert.equal(payload.totalPages, 3);
    assert.equal(payload.items[0].id, 123);
  });

  it("searches TMDB media and people", async () => {
    const response = await fetch(`${baseUrl}/api/tmdb/search?q=person&page=1`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.items[0].id, 123);
    assert.equal(payload.people[0].name, "Person One");
  });

  it("builds internal genre and tag collections", async () => {
    const response = await fetch(`${baseUrl}/api/tmdb/discover?kind=genre&id=28&label=Action&media=movie&page=1`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.title, "Thể loại: Action");
    assert.equal(payload.items[0].id, 123);

    const moodResponse = await fetch(`${baseUrl}/api/tmdb/discover?kind=genre&id=28,53&label=Adrenaline&media=movie&page=1`);
    assert.equal(moodResponse.status, 200);
    const allResponse = await fetch(`${baseUrl}/api/tmdb/discover?kind=all&media=tv&sort=latest&page=1`);
    assert.equal(allResponse.status, 200);
  });

  it("returns an internal person profile and filmography", async () => {
    const response = await fetch(`${baseUrl}/api/tmdb/person/99`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.data.name, "Person One");
    assert.equal(payload.data.filmography[0].creditRole, "Hero");
    assert.equal(payload.data.movieCredits.length, 1);
    assert.equal(payload.data.tvCredits.length, 0);
  });

  it("returns TMDB recommendations for related and because-you-watched rows", async () => {
    const response = await fetch(`${baseUrl}/api/tmdb/recommendations?media=movie&id=123`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.items[0].id, 123);
  });

  it("returns full TMDB metadata for a detail page", async () => {
    const response = await fetch(`${baseUrl}/api/tmdb/movie/123`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.data.runtime, 125);
    assert.equal(payload.data.certification, "C16");
    assert.equal(payload.data.imdbId, "tt1234567");
    assert.equal(payload.data.directors[0].name, "Director One");
    assert.equal(payload.data.directors[0].profilePath, "/director.jpg");
    assert.equal(payload.data.cast[0].character, "Hero");
    assert.deepEqual(payload.data.keywords[0], { id: 1, name: "adventure" });
    assert.equal(payload.data.posterPath, "/poster-vi.jpg");
    assert.equal(payload.data.logoPath, "/logo-original.png");
  });

  it("proxies the curated Cinemeta MetaHub backdrop by exact IMDb ID", async () => {
    const response = await fetch(`${baseUrl}/api/cinemeta/background?imdb=tt11138512`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/jpeg");
    assert.equal((await response.arrayBuffer()).byteLength, 4);
  });

  it("proxies the same Cinemeta MetaHub logo used by Stremio", async () => {
    const response = await fetch(`${baseUrl}/api/cinemeta/logo?imdb=tt11138512`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal((await response.arrayBuffer()).byteLength, 4);
  });

  it("returns TV seasons and episode metadata", async () => {
    const detailResponse = await fetch(`${baseUrl}/api/tmdb/tv/456`);
    const detail = await detailResponse.json();
    assert.equal(detailResponse.status, 200);
    assert.equal(detail.data.seasons[0].seasonNumber, 1);
    assert.equal(detail.data.seasons[0].episodeCount, 1);

    const seasonResponse = await fetch(`${baseUrl}/api/tmdb/tv/456/season/1`);
    const season = await seasonResponse.json();
    assert.equal(seasonResponse.status, 200);
    assert.equal(season.data.episodes[0].episodeNumber, 1);
    assert.equal(season.data.episodes[0].runtime, 52);
    assert.equal(season.data.episodes[0].stillPath, "/still.jpg");
  });

  it("merges duplicate results and filters torrents over 30 GB", async () => {
    const response = await fetch(`${baseUrl}/api/search?q=ubuntu&source=all&maxGb=30&minSeeds=1`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.data.length, 1);
    assert.deepEqual(payload.data[0].sources.sort(), ["knaben", "magnetz"]);
    assert.ok(payload.data[0].ref);
  });

  it("passes the selected size sorting to Knaben instead of sorting only a seeders page", async () => {
    const response = await fetch(`${baseUrl}/api/search?q=house%20of%20the%20dragon&source=knaben&sort=size-desc&maxGb=&minSeeds=0`);
    assert.equal(response.status, 200);
    assert.equal(knabenRequest.order_by, "bytes");
    assert.equal(knabenRequest.order_direction, "desc");
  });

  it("has no hard size limit when the user leaves the filter blank", async () => {
    const response = await fetch(`${baseUrl}/api/search?q=ubuntu&source=magnetz&maxGb=&minSeeds=0`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.ok(payload.data.some((item) => item.title === "Too big"));
    assert.equal(payload.meta.maxSizeGb, null);
  });

  it("manages torrents through drop/remove actions", async () => {
    const response = await fetch(`${baseUrl}/api/torrserver/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "drop", hash: HASH.toLowerCase() }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.action, "drop");

    const activateResponse = await fetch(`${baseUrl}/api/torrserver/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "preload", hash: HASH.toLowerCase(), fileId: 1 }),
    });
    const activated = await activateResponse.json();
    assert.equal(activateResponse.status, 200);
    assert.equal(activated.torrent.stat_string, "Torrent preload");
    assert.equal(activated.torrent.active_peers, 6);
  });

  it("adds a cached search result to TorrServer", async () => {
    const searchResponse = await fetch(`${baseUrl}/api/search?q=ubuntu&source=all&maxGb=30&minSeeds=1`);
    const search = await searchResponse.json();
    const response = await fetch(`${baseUrl}/api/torrserver/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: search.data[0].ref,
        tmdb: {
          id: 123,
          mediaType: "movie",
          title: "Tên phim",
          originalTitle: "Original Movie",
          year: "2026",
          posterPath: "/poster.jpg",
          backdropPath: "/backdrop.jpg",
        },
      }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.message, "Đã thêm");
    assert.equal(addRequest.action, "add");
    assert.equal(addRequest.save_to_db, true);
    assert.match(addRequest.link, /^magnet:/);
    assert.match(addRequest.poster, /image\.tmdb\.org\/t\/p\/w500\/poster\.jpg/);
    assert.equal(JSON.parse(addRequest.data).TorrShelf.tmdb.id, 123);
  });

  it("adds a cached result to the selected public TorrServer", async () => {
    const searchResponse = await fetch(`${baseUrl}/api/search?q=ubuntu&source=all&maxGb=30&minSeeds=1`);
    const search = await searchResponse.json();
    const response = await fetch(`${baseUrl}/api/torrserver/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: search.data[0].ref, torrServerUrl: "http://remote.test:12345/" }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.torrServerUrl, "http://remote.test:12345");
    assert.equal(remoteAddRequest.action, "add");
    assert.equal(remoteAddRequest.save_to_db, true);
  });

  it("prepares a transient TorrServer stream for an external player", async () => {
    const searchResponse = await fetch(`${baseUrl}/api/search?q=movie&source=all&maxGb=30&minSeeds=1`);
    const search = await searchResponse.json();
    const response = await fetch(`${baseUrl}/api/torrserver/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: search.data[0].ref, torrServerUrl: "http://remote.test:12345/" }),
    });
    const payload = await response.json();
    const streamUrl = new URL(payload.streamUrl);
    assert.equal(response.status, 200);
    assert.equal(payload.transient, true);
    assert.equal(payload.file.id, 7);
    assert.equal(streamUrl.origin, "http://remote.test:12345");
    assert.equal(streamUrl.searchParams.get("index"), "7");
    assert.equal(streamUrl.searchParams.has("play"), true);
    assert.equal(remoteAddRequest.save_to_db, false);
  });
});
