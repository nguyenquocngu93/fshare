import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deduplicateResults,
  normalizeKnaben,
  normalizeMagnetz,
  normalizeTmdb,
  normalizeTmdbDetail,
  normalizeTmdbPersonDetail,
  normalizeTmdbSeason,
} from "../server.mjs";

test("normalizeTmdb creates normalized movie payload", () => {
  const item = {
    id: 12345,
    title: "Spider-Man: Brand New Day",
    original_title: "Spider-Man: Brand New Day",
    release_date: "2026-07-15",
    vote_average: 8.24,
    vote_count: 1420,
    popularity: 580.4,
    poster_path: "/spider_poster.jpg",
    backdrop_path: "/spider_backdrop.jpg",
    overview: "Peter Parker returns...",
    original_language: "en",
  };

  const result = normalizeTmdb(item, "movie");
  assert.equal(result.id, 12345);
  assert.equal(result.mediaType, "movie");
  assert.equal(result.title, "Spider-Man: Brand New Day");
  assert.equal(result.year, "2026");
  assert.equal(result.rating, 8.2);
  assert.equal(result.posterPath, "/spider_poster.jpg");
  assert.equal(result.backdropPath, "/spider_backdrop.jpg");
  assert.equal(result.searchQuery, "Spider-Man: Brand New Day 2026");
});

test("normalizeTmdbDetail extracts cast, crew, trailer and related content", () => {
  const payload = {
    id: 999,
    title: "The Odyssey",
    original_title: "The Odyssey",
    release_date: "2026-05-10",
    overview: "Odysseus embarks on a journey...",
    tagline: "The voyage begins",
    status: "Released",
    runtime: 155,
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }],
    credits: {
      cast: [
        { id: 101, name: "Actor One", character: "Odysseus", profile_path: "/actor1.jpg" },
        { id: 102, name: "Actor Two", character: "Penelope", profile_path: "/actor2.jpg" },
      ],
      crew: [
        { id: 201, name: "Director One", job: "Director", profile_path: "/dir1.jpg" },
      ],
    },
    videos: {
      results: [
        { site: "YouTube", key: "abc123xyz", type: "Trailer", official: true },
      ],
    },
    recommendations: {
      results: [
        { id: 888, title: "Troy", release_date: "2004-05-14", poster_path: "/troy.jpg" },
      ],
    },
  };

  const detail = normalizeTmdbDetail(payload, "movie");
  assert.equal(detail.id, 999);
  assert.equal(detail.runtime, 155);
  assert.equal(detail.directors.length, 1);
  assert.equal(detail.directors[0].name, "Director One");
  assert.equal(detail.cast.length, 2);
  assert.equal(detail.cast[0].character, "Odysseus");
  assert.equal(detail.trailerKey, "abc123xyz");
  assert.equal(detail.relatedContent.length, 1);
  assert.equal(detail.relatedContent[0].id, 888);
});

test("normalizeTmdbSeason extracts episode lists", () => {
  const payload = {
    id: 10,
    season_number: 1,
    name: "Season 1",
    overview: "The opening season",
    episodes: [
      { id: 501, episode_number: 1, name: "Pilot", runtime: 58, still_path: "/ep1.jpg", vote_average: 8.5 },
      { id: 502, episode_number: 2, name: "The Descent", runtime: 52, still_path: "/ep2.jpg", vote_average: 8.3 },
    ],
  };

  const season = normalizeTmdbSeason(payload);
  assert.equal(season.seasonNumber, 1);
  assert.equal(season.episodes.length, 2);
  assert.equal(season.episodes[0].name, "Pilot");
  assert.equal(season.episodes[1].runtime, 52);
});

test("normalizeMagnetz and normalizeKnaben format torrents properly", () => {
  const mag = normalizeMagnetz({
    sqid: "abc-123",
    name: "Spider-Man 2026 2160p UHD HDR",
    size: 25 * 1024 * 1024 * 1024,
    seeders: 150,
    leechers: 20,
    info_hash: "1234567890ABCDEF1234567890ABCDEF12345678",
    magnet_link: "magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678",
  });
  assert.equal(mag.source, "magnetz");
  assert.equal(mag.seeders, 150);

  const knab = normalizeKnaben({
    id: "k-456",
    title: "Spider-Man 2026 1080p BluRay",
    bytes: 8 * 1024 * 1024 * 1024,
    seeders: 95,
    peers: 10,
    hash: "ABCDEF1234567890ABCDEF1234567890ABCDEF12",
    magnetUrl: "magnet:?xt=urn:btih:abcdef1234567890abcdef1234567890abcdef12",
  });
  assert.equal(knab.source, "knaben");
  assert.equal(knab.seeders, 95);
});

test("deduplicateResults merges duplicate info hashes", () => {
  const item1 = {
    source: "magnetz",
    sources: ["magnetz"],
    infoHash: "AAAA111122223333444455556666777788889999",
    title: "Spider-Man 2026",
    size: 5000,
    seeders: 50,
    leechers: 5,
    link: "magnet:?xt=urn:btih:AAAA111122223333444455556666777788889999",
  };
  const item2 = {
    source: "knaben",
    sources: ["knaben"],
    infoHash: "AAAA111122223333444455556666777788889999",
    title: "Spider-Man 2026",
    size: 5000,
    seeders: 80,
    leechers: 12,
    link: "magnet:?xt=urn:btih:AAAA111122223333444455556666777788889999&tr=http://tracker.com",
  };

  const deduplicated = deduplicateResults([item1, item2]);
  assert.equal(deduplicated.length, 1);
  assert.equal(deduplicated[0].seeders, 80);
  assert.deepEqual(deduplicated[0].sources, ["magnetz", "knaben"]);
});
