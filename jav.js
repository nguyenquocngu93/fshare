// ==UserScript==
// @name         KKPhim
// @namespace    kkphim
// @version      1.0.0
// @description  Plugin xem phim KKPhim cho Cub.red
// @author       Plugin Dev
// @match        *://cub.red/*
// ==/UserScript==

const PLUGIN_ID = "kkphim";
const API_BASE = "https://phimapi.com";
const IMG_BASE = "https://phimimg.com";

// ==================== STYLES ====================
const STYLES = `
<style>
  .kkp-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0f0f13;
    min-height: 100vh;
    color: #fff;
  }

  /* ===== BACKDROP HERO ===== */
  .kkp-hero {
    position: relative;
    height: 70vh;
    min-height: 400px;
    overflow: hidden;
    margin-bottom: -80px;
  }

  @media (max-width: 768px) {
    .kkp-hero { height: 50vh; min-height: 300px; margin-bottom: -60px; }
  }

  .kkp-hero-backdrop {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center top;
    filter: blur(0px);
    transform: scale(1.05);
    transition: opacity 0.8s ease;
  }

  .kkp-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(15,15,19,0.3) 0%,
      rgba(15,15,19,0.5) 40%,
      rgba(15,15,19,0.95) 85%,
      #0f0f13 100%
    );
  }

  .kkp-hero-content {
    position: absolute;
    bottom: 100px;
    left: 24px;
    right: 24px;
    z-index: 2;
  }

  @media (max-width: 768px) {
    .kkp-hero-content { bottom: 80px; left: 16px; right: 16px; }
  }

  .kkp-hero-title {
    font-size: clamp(20px, 4vw, 36px);
    font-weight: 800;
    text-shadow: 0 2px 20px rgba(0,0,0,0.8);
    margin-bottom: 8px;
    line-height: 1.2;
  }

  .kkp-hero-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 16px;
  }

  .kkp-hero-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #e50914;
    color: #fff;
    border: none;
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .kkp-hero-btn:hover {
    background: #f40612;
    transform: scale(1.04);
  }

  /* ===== SEARCH BAR ===== */
  .kkp-search-wrap {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(15,15,19,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }

  .kkp-search-inner {
    max-width: 600px;
    margin: 0 auto;
    position: relative;
  }

  .kkp-search-input {
    width: 100%;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 50px;
    padding: 10px 48px 10px 18px;
    color: #fff;
    font-size: 15px;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .kkp-search-input:focus {
    background: rgba(255,255,255,0.15);
    border-color: #e50914;
    box-shadow: 0 0 0 3px rgba(229,9,20,0.2);
  }

  .kkp-search-input::placeholder { color: rgba(255,255,255,0.4); }

  .kkp-search-icon {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
    pointer-events: none;
  }

  /* ===== SECTION ===== */
  .kkp-section {
    padding: 0 16px 32px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .kkp-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-top: 32px;
  }

  .kkp-section-title {
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .kkp-section-title::before {
    content: '';
    display: block;
    width: 4px;
    height: 20px;
    background: #e50914;
    border-radius: 2px;
  }

  .kkp-see-all {
    color: #e50914;
    font-size: 13px;
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    opacity: 0.9;
  }

  /* ===== GRID ===== */
  .kkp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 14px;
  }

  @media (min-width: 480px) {
    .kkp-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  }

  @media (min-width: 768px) {
    .kkp-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 18px; }
  }

  @media (min-width: 1200px) {
    .kkp-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
  }

  /* ===== MOVIE CARD ===== */
  .kkp-card {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    background: #1a1a24;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .kkp-card:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    z-index: 10;
  }

  .kkp-card:active { transform: scale(0.97); }

  .kkp-card-poster {
    aspect-ratio: 2/3;
    width: 100%;
    object-fit: cover;
    display: block;
    background: #1a1a24;
  }

  .kkp-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0,0,0,0.92) 0%,
      rgba(0,0,0,0.4) 40%,
      transparent 65%
    );
    opacity: 0;
    transition: opacity 0.25s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .kkp-card:hover .kkp-card-overlay { opacity: 1; }

  .kkp-play-btn {
    width: 52px;
    height: 52px;
    background: rgba(229,9,20,0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    transform: scale(0.8);
    transition: transform 0.25s;
  }

  .kkp-card:hover .kkp-play-btn { transform: scale(1); }

  .kkp-card-info {
    padding: 10px 10px 12px;
  }

  .kkp-card-title {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 6px;
    color: #fff;
  }

  .kkp-card-meta {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }

  .kkp-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .kkp-badge-year {
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.7);
  }

  .kkp-badge-ep {
    background: rgba(229,9,20,0.2);
    color: #ff6b6b;
    border: 1px solid rgba(229,9,20,0.3);
  }

  .kkp-badge-quality {
    background: rgba(255,200,0,0.15);
    color: #ffd700;
    border: 1px solid rgba(255,200,0,0.2);
  }

  .kkp-card-top-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    font-size: 10px;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 5px;
    background: #e50914;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .kkp-card-top-badge.sub { background: #0a84ff; }
  .kkp-card-top-badge.thuyetminh { background: #30d158; color: #000; }

  /* ===== HORIZONTAL SCROLL ===== */
  .kkp-scroll-wrap {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    margin: 0 -16px;
    padding: 0 16px;
  }
  .kkp-scroll-wrap::-webkit-scrollbar { display: none; }

  .kkp-scroll-inner {
    display: flex;
    gap: 12px;
    padding-bottom: 8px;
  }

  .kkp-scroll-card {
    flex: 0 0 140px;
    width: 140px;
  }

  @media (min-width: 480px) {
    .kkp-scroll-card { flex: 0 0 160px; width: 160px; }
  }

  /* ===== CATEGORIES ===== */
  .kkp-cats {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 4px;
    margin: 0 -16px;
    padding-left: 16px;
    padding-right: 16px;
  }
  .kkp-cats::-webkit-scrollbar { display: none; }

  .kkp-cat-btn {
    flex-shrink: 0;
    padding: 7px 16px;
    border-radius: 50px;
    border: 1px solid rgba(255,255,255,0.15);
    background: transparent;
    color: rgba(255,255,255,0.7);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    font-weight: 500;
  }

  .kkp-cat-btn.active,
  .kkp-cat-btn:hover {
    background: #e50914;
    border-color: #e50914;
    color: #fff;
  }

  /* ===== DETAIL PAGE ===== */
  .kkp-detail {
    min-height: 100vh;
    background: #0f0f13;
  }

  .kkp-detail-backdrop {
    position: relative;
    height: 55vh;
    min-height: 320px;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .kkp-detail-backdrop { height: 45vh; min-height: 260px; }
  }

  .kkp-detail-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: blur(2px);
    transform: scale(1.08);
  }

  .kkp-detail-bg-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(15,15,19,0.2) 0%,
      rgba(15,15,19,0.7) 60%,
      #0f0f13 100%
    );
  }

  .kkp-detail-body {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 16px 40px;
    margin-top: -120px;
    position: relative;
    z-index: 2;
  }

  .kkp-detail-card {
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    .kkp-detail-card { gap: 14px; }
  }

  .kkp-detail-poster {
    flex-shrink: 0;
    width: 130px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    border: 2px solid rgba(255,255,255,0.1);
  }

  @media (max-width: 480px) {
    .kkp-detail-poster { width: 100px; }
  }

  .kkp-detail-poster img {
    width: 100%;
    aspect-ratio: 2/3;
    object-fit: cover;
    display: block;
  }

  .kkp-detail-meta {
    flex: 1;
    padding-top: 8px;
  }

  .kkp-detail-title {
    font-size: clamp(18px, 3.5vw, 26px);
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 4px;
  }

  .kkp-detail-subtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    margin-bottom: 12px;
    font-style: italic;
  }

  .kkp-detail-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }

  .kkp-detail-badge {
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 20px;
    font-weight: 600;
  }

  .kkp-detail-badge.year {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }

  .kkp-detail-badge.quality {
    background: rgba(255,200,0,0.2);
    color: #ffd700;
  }

  .kkp-detail-badge.genre {
    background: rgba(229,9,20,0.15);
    color: #ff6b6b;
    border: 1px solid rgba(229,9,20,0.25);
    cursor: pointer;
    transition: background 0.2s;
  }

  .kkp-detail-badge.genre:hover { background: rgba(229,9,20,0.3); }

  .kkp-detail-badge.country {
    background: rgba(48,209,88,0.15);
    color: #30d158;
  }

  .kkp-watch-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #e50914;
    color: #fff;
    border: none;
    padding: 12px 28px;
    border-radius: 50px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 8px 24px rgba(229,9,20,0.4);
    margin-bottom: 12px;
  }

  .kkp-watch-btn:hover {
    background: #f40612;
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(229,9,20,0.5);
  }

  .kkp-watch-btn:active { transform: scale(0.97); }

  .kkp-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    background: rgba(255,255,255,0.04);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    border: 1px solid rgba(255,255,255,0.07);
  }

  .kkp-info-item { }

  .kkp-info-label {
    font-size: 11px;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
    font-weight: 600;
  }

  .kkp-info-value {
    font-size: 13px;
    color: rgba(255,255,255,0.85);
    font-weight: 500;
  }

  .kkp-desc {
    font-size: 14px;
    line-height: 1.7;
    color: rgba(255,255,255,0.65);
    margin-bottom: 24px;
  }

  .kkp-desc.collapsed {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .kkp-desc-toggle {
    color: #e50914;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    margin-top: -8px;
    margin-bottom: 20px;
    display: block;
  }

  /* ===== EPISODES ===== */
  .kkp-eps-header {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .kkp-eps-header::before {
    content: '';
    display: block;
    width: 3px;
    height: 18px;
    background: #e50914;
    border-radius: 2px;
  }

  .kkp-server-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    margin-bottom: 14px;
  }
  .kkp-server-tabs::-webkit-scrollbar { display: none; }

  .kkp-server-tab {
    flex-shrink: 0;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.15);
    background: transparent;
    color: rgba(255,255,255,0.6);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
  }

  .kkp-server-tab.active {
    background: #e50914;
    border-color: #e50914;
    color: #fff;
  }

  .kkp-eps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
    gap: 8px;
    max-height: 280px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.15) transparent;
  }

  @media (min-width: 480px) {
    .kkp-eps-grid { grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); }
  }

  .kkp-ep-btn {
    padding: 8px 4px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: all 0.18s;
    -webkit-tap-highlight-color: transparent;
  }

  .kkp-ep-btn:hover, .kkp-ep-btn.active {
    background: #e50914;
    border-color: #e50914;
    color: #fff;
    transform: scale(1.05);
  }

  /* ===== VIDEO PLAYER ===== */
  .kkp-player-wrap {
    background: #000;
    border-radius: 0;
    overflow: hidden;
    margin: 0 -16px;
  }

  @media (min-width: 768px) {
    .kkp-player-wrap {
      border-radius: 12px;
      margin: 0 0 20px;
    }
  }

  .kkp-iframe {
    width: 100%;
    aspect-ratio: 16/9;
    border: none;
    display: block;
  }

  /* ===== BACK BUTTON ===== */
  .kkp-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    border: none;
    border-radius: 50px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 20px;
  }

  .kkp-back-btn:hover { background: rgba(255,255,255,0.18); }

  /* ===== LOADING ===== */
  .kkp-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 16px;
    color: rgba(255,255,255,0.4);
    font-size: 14px;
  }

  .kkp-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(229,9,20,0.2);
    border-top-color: #e50914;
    border-radius: 50%;
    animation: kkp-spin 0.8s linear infinite;
  }

  @keyframes kkp-spin { to { transform: rotate(360deg); } }

  /* ===== EMPTY / ERROR ===== */
  .kkp-empty {
    text-align: center;
    padding: 60px 20px;
    color: rgba(255,255,255,0.3);
  }

  .kkp-empty-icon { font-size: 48px; margin-bottom: 12px; }
  .kkp-empty-text { font-size: 15px; }

  /* ===== RATING STARS ===== */
  .kkp-rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #ffd700;
    font-weight: 600;
  }

  /* ===== SCROLL TO TOP ===== */
  .kkp-to-top {
    position: fixed;
    bottom: 24px;
    right: 20px;
    width: 42px;
    height: 42px;
    background: #e50914;
    border-radius: 50%;
    border: none;
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s;
    box-shadow: 0 4px 16px rgba(229,9,20,0.4);
  }
  .kkp-to-top.visible { opacity: 1; transform: translateY(0); }
</style>
`;

// ==================== HELPERS ====================
const api = async (path, params = {}) => {
  const url = new URL(API_BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("API error " + res.status);
  return res.json();
};

const imgUrl = (path) => {
  if (!path) return "https://via.placeholder.com/300x450/1a1a24/fff?text=No+Image";
  if (path.startsWith("http")) return path;
  return IMG_BASE + "/" + path.replace(/^\//, "");
};

const slugify = (str) =>
  (str || "").toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

const stripHtml = (html) =>
  (html || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();

const formatEp = (ep) => {
  const n = ep?.name || ep?.filename || "";
  return n.replace(/^[Tt]ap[\s-]*/i, "").replace(/^[Ee]pisode[\s-]*/i, "");
};

// ==================== COMPONENTS ====================
const Spinner = () => `
  <div class="kkp-loading">
    <div class="kkp-spinner"></div>
    <span>Đang tải...</span>
  </div>`;

const MovieCard = (movie, cls = "") => {
  const poster = imgUrl(movie.poster_url || movie.thumb_url);
  const lang = movie.lang || "";
  const langBadge = lang
    ? `<span class="kkp-card-top-badge ${lang.toLowerCase().includes("vietsub") ? "sub" : lang.toLowerCase().includes("thuyết") ? "thuyetminh" : ""}">${lang}</span>`
    : "";
  const ep = movie.episode_current || movie.time || "";

  return `
    <div class="kkp-card ${cls}" data-slug="${movie.slug}" onclick="kkpOpenDetail('${movie.slug}')">
      <img class="kkp-card-poster" src="${poster}" 
           alt="${movie.name}" loading="lazy"
           onerror="this.src='https://via.placeholder.com/300x450/1a1a24/fff?text=KKPhim'">
      ${langBadge}
      <div class="kkp-card-overlay">
        <div class="kkp-play-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      <div class="kkp-card-info">
        <div class="kkp-card-title">${movie.name}</div>
        <div class="kkp-card-meta">
          ${movie.year ? `<span class="kkp-badge kkp-badge-year">${movie.year}</span>` : ""}
          ${ep ? `<span class="kkp-badge kkp-badge-ep">${ep}</span>` : ""}
          ${movie.quality ? `<span class="kkp-badge kkp-badge-quality">${movie.quality}</span>` : ""}
        </div>
      </div>
    </div>`;
};

// ==================== STATE ====================
let state = {
  page: "home",
  searchQuery: "",
  currentSlug: "",
  currentEp: null,
  currentServer: 0,
  heroMovie: null,
  heroInterval: null,
};

// ==================== HOME PAGE ====================
async function renderHome(container) {
  container.innerHTML = STYLES + `
    <div class="kkp-container">
      <div class="kkp-search-wrap">
        <div class="kkp-search-inner">
          <input class="kkp-search-input" id="kkp-search" 
                 placeholder="🔍  Tìm kiếm phim..." 
                 value="${state.searchQuery}"
                 autocomplete="off">
          <svg class="kkp-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
      </div>

      <div id="kkp-hero" class="kkp-hero">
        <div class="kkp-hero-backdrop" id="kkp-hero-bg" style="background-image:url('')"></div>
        <div class="kkp-hero-overlay"></div>
        <div class="kkp-hero-content" id="kkp-hero-info"></div>
      </div>

      <div id="kkp-main" style="position:relative;z-index:1">${Spinner()}</div>
      
      <button class="kkp-to-top" id="kkp-totop" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑</button>
    </div>
  `;

  // Search
  const searchInput = container.querySelector("#kkp-search");
  let searchTimer;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    state.searchQuery = e.target.value.trim();
    searchTimer = setTimeout(() => {
      if (state.searchQuery.length > 1) {
        renderSearchResults(container.querySelector("#kkp-main"), state.searchQuery);
      } else if (state.searchQuery === "") {
        renderMainContent(container.querySelector("#kkp-main"), container.querySelector("#kkp-hero"));
      }
    }, 400);
  });

  if (state.searchQuery.length > 1) {
    renderSearchResults(container.querySelector("#kkp-main"), state.searchQuery);
  } else {
    await renderMainContent(container.querySelector("#kkp-main"), container.querySelector("#kkp-hero"));
  }

  // Scroll to top btn
  window.addEventListener("scroll", () => {
    const btn = document.getElementById("kkp-totop");
    if (btn) btn.classList.toggle("visible", window.scrollY > 400);
  });
}

async function renderMainContent(mainEl, heroEl) {
  try {
    const [newMovies, seriesMovies] = await Promise.all([
      api("/danh-sach/phim-moi-cap-nhat", { page: 1 }),
      api("/v1/api/danh-sach/phim-bo", { page: 1, limit: 12 }),
    ]);

    const movies = newMovies?.items || [];
    const series = seriesMovies?.data?.items || [];

    // Hero
    if (movies.length > 0) {
      await setupHero(heroEl, movies.slice(0, 5));
    }

    // Categories
    const cats = [
      { label: "⚡ Mới nhất", type: "phim-moi-cap-nhat" },
      { label: "🎬 Phim lẻ", type: "phim-le" },
      { label: "📺 Phim bộ", type: "phim-bo" },
      { label: "🎞️ Hoạt hình", type: "hoat-hinh" },
      { label: "🇰🇷 Hàn Quốc", type: "phim-bo", country: "han-quoc" },
      { label: "🇨🇳 Trung Quốc", type: "phim-bo", country: "trung-quoc" },
      { label: "🇺🇸 Âu Mỹ", type: "phim-le", country: "au-my" },
    ];

    mainEl.innerHTML = `
      <div class="kkp-section">
        <div class="kkp-section-header">
          <div class="kkp-section-title">Danh mục</div>
        </div>
        <div class="kkp-cats">
          ${cats.map((c, i) => `
            <button class="kkp-cat-btn ${i === 0 ? "active" : ""}" 
                    data-type="${c.type}" data-country="${c.country || ""}"
                    onclick="kkpLoadCat(this,'${c.type}','${c.country || ""}')">
              ${c.label}
            </button>`).join("")}
        </div>
      </div>

      <div class="kkp-section" id="kkp-cat-section">
        <div class="kkp-section-header">
          <div class="kkp-section-title">Phim mới cập nhật</div>
        </div>
        <div class="kkp-grid">
          ${movies.map((m) => MovieCard(m)).join("")}
        </div>
      </div>

      ${series.length ? `
      <div class="kkp-section">
        <div class="kkp-section-header">
          <div class="kkp-section-title">Phim bộ hot</div>
          <span class="kkp-see-all" onclick="kkpLoadCat(null,'phim-bo','')">Xem thêm →</span>
        </div>
        <div class="kkp-scroll-wrap">
          <div class="kkp-scroll-inner">
            ${series.map((m) => `<div class="kkp-scroll-card">${MovieCard(m)}</div>`).join("")}
          </div>
        </div>
      </div>` : ""}
    `;
  } catch (e) {
    mainEl.innerHTML = `<div class="kkp-empty"><div class="kkp-empty-icon">⚠️</div><div class="kkp-empty-text">Không thể tải dữ liệu</div></div>`;
  }
}

async function setupHero(heroEl, movies) {
  let idx = 0;
  const heroDetails = await Promise.all(
    movies.slice(0, 3).map((m) =>
      api(`/phim/${m.slug}`).catch(() => null)
    )
  );
  const validMovies = heroDetails.filter(Boolean).map((d) => d.movie || d);

  const updateHero = (movie) => {
    if (!movie) return;
    const bg = document.getElementById("kkp-hero-bg");
    const info = document.getElementById("kkp-hero-info");
    if (!bg || !info) return;

    const backdrop = imgUrl(movie.thumb_url || movie.poster_url);
    bg.style.backgroundImage = `url('${backdrop}')`;

    const genres = (movie.category || []).slice(0, 3).map((g) => g.name).join(" · ");
    info.innerHTML = `
      <div class="kkp-hero-title">${movie.name}</div>
      <div class="kkp-hero-meta">
        <span style="font-size:12px;color:rgba(255,255,255,0.6)">${movie.year || ""}</span>
        ${movie.quality ? `<span class="kkp-badge kkp-badge-quality">${movie.quality}</span>` : ""}
        ${movie.episode_current ? `<span class="kkp-badge kkp-badge-ep">${movie.episode_current}</span>` : ""}
        ${genres ? `<span style="font-size:12px;color:rgba(255,255,255,0.5)">${genres}</span>` : ""}
      </div>
      <button class="kkp-hero-btn" onclick="kkpOpenDetail('${movie.slug}')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        Xem ngay
      </button>
    `;
  };

  if (validMovies.length > 0) {
    updateHero(validMovies[0]);
    if (validMovies.length > 1) {
      clearInterval(state.heroInterval);
      state.heroInterval = setInterval(() => {
        idx = (idx + 1) % validMovies.length;
        updateHero(validMovies[idx]);
      }, 5000);
    }
  }
}

// ==================== CATEGORY LOADING ====================
window.kkpLoadCat = async function (btn, type, country) {
  // Update active button
  document.querySelectorAll(".kkp-cat-btn").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const section = document.getElementById("kkp-cat-section");
  if (!section) return;

  section.innerHTML = `<div class="kkp-section-header"><div class="kkp-section-title">Đang tải...</div></div>${Spinner()}`;

  try {
    let path, params = { page: 1, limit: 24 };
    if (country) {
      path = `/v1/api/quoc-gia/${country}`;
    } else {
      path = `/v1/api/danh-sach/${type}`;
    }

    const data = await api(path, params);
    const items = data?.data?.items || data?.items || [];
    const title = btn ? btn.textContent.trim() : "Phim";

    section.innerHTML = `
      <div class="kkp-section-header">
        <div class="kkp-section-title">${title}</div>
      </div>
      ${items.length ? `<div class="kkp-grid">${items.map((m) => MovieCard(m)).join("")}</div>` : '<div class="kkp-empty"><div class="kkp-empty-icon">🎬</div><div class="kkp-empty-text">Không có phim</div></div>'}
    `;
  } catch (e) {
    section.innerHTML = `<div class="kkp-empty"><div class="kkp-empty-icon">⚠️</div><div class="kkp-empty-text">Lỗi tải dữ liệu</div></div>`;
  }
};

// ==================== SEARCH ====================
async function renderSearchResults(mainEl, query) {
  mainEl.innerHTML = Spinner();
  try {
    const data = await api("/v1/api/tim-kiem", { keyword: query, limit: 24, page: 1 });
    const items = data?.data?.items || [];

    mainEl.innerHTML = `
      <div class="kkp-section">
        <div class="kkp-section-header">
          <div class="kkp-section-title">Kết quả: "${query}"</div>
          <span style="color:rgba(255,255,255,0.4);font-size:13px">${items.length} phim</span>
        </div>
        ${items.length
          ? `<div class="kkp-grid">${items.map((m) => MovieCard(m)).join("")}</div>`
          : `<div class="kkp-empty">
               <div class="kkp-empty-icon">🔍</div>
               <div class="kkp-empty-text">Không tìm thấy "<b>${query}</b>"</div>
             </div>`
        }
      </div>`;
  } catch (e) {
    mainEl.innerHTML = `<div class="kkp-empty"><div class="kkp-empty-icon">⚠️</div><div class="kkp-empty-text">Lỗi tìm kiếm</div></div>`;
  }
}

// ==================== DETAIL PAGE ====================
window.kkpOpenDetail = async function (slug) {
  clearInterval(state.heroInterval);
  state.page = "detail";
  state.currentSlug = slug;
  state.currentEp = null;
  state.currentServer = 0;

  const root = document.getElementById("kkp-root");
  if (!root) return;

  root.innerHTML = STYLES + `<div class="kkp-detail" id="kkp-detail-container">${Spinner()}</div>`;

  try {
    const data = await api(`/phim/${slug}`);
    const movie = data.movie;
    const episodes = data.episodes || [];

    renderDetailPage(root, movie, episodes);
  } catch (e) {
    root.innerHTML = STYLES + `
      <div class="kkp-detail" style="padding:40px 16px">
        <button class="kkp-back-btn" onclick="kkpGoHome()">← Quay lại</button>
        <div class="kkp-empty"><div class="kkp-empty-icon">⚠️</div><div class="kkp-empty-text">Không tải được thông tin phim</div></div>
      </div>`;
  }
};

function renderDetailPage(root, movie, episodes) {
  const poster = imgUrl(movie.poster_url || movie.thumb_url);
  const backdrop = imgUrl(movie.thumb_url || movie.poster_url);
  const genres = (movie.category || []).map((g) => `<span class="kkp-detail-badge genre" onclick="kkpOpenGenre('${g.slug}')">${g.name}</span>`).join("");
  const countries = (movie.country || []).map((c) => `<span class="kkp-detail-badge country">${c.name}</span>`).join("");
  const desc = stripHtml(movie.content);

  const allEps = episodes[0]?.server_data || [];
  const hasMultiServer = episodes.length > 1;

  root.innerHTML = STYLES + `
    <div class="kkp-detail">
      <!-- Backdrop -->
      <div class="kkp-detail-backdrop">
        <div class="kkp-detail-bg" style="background-image:url('${backdrop}')"></div>
        <div class="kkp-detail-bg-overlay"></div>
      </div>

      <div class="kkp-detail-body">
        <!-- Back -->
        <button class="kkp-back-btn" onclick="kkpGoHome()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Quay lại
        </button>

        <!-- Info Card -->
        <div class="kkp-detail-card">
          <div class="kkp-detail-poster">
            <img src="${poster}" alt="${movie.name}" 
                 onerror="this.src='https://via.placeholder.com/300x450/1a1a24/fff?text=KKPhim'">
          </div>
          <div class="kkp-detail-meta">
            <div class="kkp-detail-title">${movie.name}</div>
            ${movie.origin_name ? `<div class="kkp-detail-subtitle">${movie.origin_name}</div>` : ""}
            <div class="kkp-detail-badges">
              ${movie.year ? `<span class="kkp-detail-badge year">📅 ${movie.year}</span>` : ""}
              ${movie.quality ? `<span class="kkp-detail-badge quality">⭐ ${movie.quality}</span>` : ""}
              ${genres}
              ${countries}
            </div>
            <button class="kkp-watch-btn" onclick="kkpWatchFirst()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
              ${allEps.length > 1 ? "Xem tập 1" : "Xem phim"}
            </button>
          </div>
        </div>

        <!-- Movie Info Grid -->
        <div class="kkp-info-grid">
          ${[
            ["Trạng thái", movie.episode_current || "?"],
            ["Số tập", movie.episode_total || "?"],
            ["Thời lượng", movie.time || "?"],
            ["Năm", movie.year || "?"],
            ["Ngôn ngữ", movie.lang || "?"],
            ["Chất lượng", movie.quality || "?"],
          ].map(([label, value]) => `
            <div class="kkp-info-item">
              <div class="kkp-info-label">${label}</div>
              <div class="kkp-info-value">${value}</div>
            </div>`).join("")}
        </div>

        <!-- Description -->
        ${desc ? `
          <div class="kkp-desc collapsed" id="kkp-desc">${desc}</div>
          <span class="kkp-desc-toggle" id="kkp-desc-toggle" onclick="kkpToggleDesc()">Xem thêm ▾</span>
        ` : ""}

        <!-- Player -->
        <div id="kkp-player-area"></div>

        <!-- Episodes -->
        ${episodes.length > 0 ? `
          <div class="kkp-eps-header">Danh sách tập</div>
          ${hasMultiServer ? `
            <div class="kkp-server-tabs" id="kkp-server-tabs">
              ${episodes.map((s, i) => `
                <button class="kkp-server-tab ${i === 0 ? "active" : ""}" 
                        onclick="kkpSwitchServer(${i}, this)">
                  ${s.server_name || "Server " + (i + 1)}
                </button>`).join("")}
            </div>` : ""}
          <div class="kkp-eps-grid" id="kkp-eps-grid">
            ${renderEpisodeButtons(allEps, 0)}
          </div>` : ""}
      </div>
    </div>
  `;

  // Store episodes globally for server switching
  window._kkpEpisodes = episodes;
  window._kkpMovie = movie;
}

function renderEpisodeButtons(eps, serverIdx) {
  return eps.map((ep, i) => `
    <button class="kkp-ep-btn" 
            onclick="kkpPlayEp(${serverIdx}, ${i})"
            id="kkp-ep-${serverIdx}-${i}">
      ${formatEp(ep) || (i + 1)}
    </button>`).join("");
}

window.kkpSwitchServer = function (idx, btn) {
  state.currentServer = idx;
  state.currentEp = null;
  document.querySelectorAll(".kkp-server-tab").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  const eps = (window._kkpEpisodes || [])[idx]?.server_data || [];
  const grid = document.getElementById("kkp-eps-grid");
  if (grid) grid.innerHTML = renderEpisodeButtons(eps, idx);

  // Clear player
  const player = document.getElementById("kkp-player-area");
  if (player) player.innerHTML = "";
};

window.kkpPlayEp = function (serverIdx, epIdx) {
  const episodes = window._kkpEpisodes || [];
  const server = episodes[serverIdx];
  if (!server) return;

  const ep = server.server_data[epIdx];
  if (!ep) return;

  state.currentEp = { serverIdx, epIdx };
  const link = ep.link_embed || ep.link_m3u8;

  // Update button states
  document.querySelectorAll(".kkp-ep-btn").forEach((b) => b.classList.remove("active"));
  const activeBtn = document.getElementById(`kkp-ep-${serverIdx}-${epIdx}`);
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Render player
  const playerArea = document.getElementById("kkp-player-area");
  if (!playerArea) return;

  const movie = window._kkpMovie || {};
  const epName = ep.name ? ` - ${ep.name}` : "";

  playerArea.innerHTML = `
    <div style="margin: 0 -16px 20px; border-radius:0">
      <div style="background:rgba(255,255,255,0.04);padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.06)">
        <span style="font-size:13px;color:rgba(255,255,255,0.6)">
          Đang xem: <strong style="color:#fff">${movie.name}${epName}</strong>
        </span>
      </div>
      <div class="kkp-player-wrap">
        <iframe class="kkp-iframe" src="${link}" 
                allowfullscreen allow="fullscreen; autoplay" 
                scrolling="no" frameborder="0"></iframe>
      </div>
      <div style="display:flex;gap:8px;padding:10px 16px;background:rgba(255,255,255,0.03)">
        ${epIdx > 0 ? `<button class="kkp-back-btn" onclick="kkpPlayEp(${serverIdx},${epIdx - 1})" style="font-size:12px;padding:6px 12px">← Tập trước</button>` : ""}
        ${epIdx < server.server_data.length - 1 ? `<button class="kkp-back-btn" onclick="kkpPlayEp(${serverIdx},${epIdx + 1})" style="font-size:12px;padding:6px 12px;margin-left:auto">Tập tiếp →</button>` : ""}
      </div>
    </div>
  `;

  // Scroll to player
  setTimeout(() => {
    playerArea.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
};

window.kkpWatchFirst = function () {
  const eps = window._kkpEpisodes || [];
  if (eps.length > 0 && eps[0].server_data?.length > 0) {
    kkpPlayEp(0, 0);
  }
};

window.kkpToggleDesc = function () {
  const desc = document.getElementById("kkp-desc");
  const toggle = document.getElementById("kkp-desc-toggle");
  if (!desc) return;
  const collapsed = desc.classList.toggle("collapsed");
  toggle.textContent = collapsed ? "Xem thêm ▾" : "Thu gọn ▴";
};

window.kkpOpenGenre = async function (slug) {
  clearInterval(state.heroInterval);
  state.page = "genre";

  const root = document.getElementById("kkp-root");
  if (!root) return;

  root.innerHTML = STYLES + `
    <div class="kkp-container">
      <div style="padding:16px">
        <button class="kkp-back-btn" onclick="kkpGoHome()">← Quay lại</button>
        <div class="kkp-section-title" style="margin-bottom:16px">Thể loại: ${slug}</div>
        <div id="kkp-genre-grid">${Spinner()}</div>
      </div>
    </div>`;

  try {
    const data = await api(`/v1/api/the-loai/${slug}`, { page: 1, limit: 24 });
    const items = data?.data?.items || [];
    const name = data?.data?.titlePage || slug;

    root.querySelector(".kkp-section-title").textContent = `Thể loại: ${name}`;

    document.getElementById("kkp-genre-grid").innerHTML = items.length
      ? `<div class="kkp-grid">${items.map((m) => MovieCard(m)).join("")}</div>`
      : '<div class="kkp-empty"><div class="kkp-empty-icon">🎬</div><div class="kkp-empty-text">Không có phim</div></div>';
  } catch {
    document.getElementById("kkp-genre-grid").innerHTML =
      '<div class="kkp-empty"><div class="kkp-empty-icon">⚠️</div><div class="kkp-empty-text">Lỗi tải dữ liệu</div></div>';
  }
};

// ==================== NAVIGATION ====================
window.kkpGoHome = function () {
  clearInterval(state.heroInterval);
  state.page = "home";
  state.currentSlug = "";
  const root = document.getElementById("kkp-root");
  if (root) {
    root.innerHTML = Spinner();
    renderHome(root);
  }
};

// ==================== MAIN ENTRY ====================
function initPlugin(container) {
  container.id = "kkp-root";
  container.innerHTML = Spinner();
  renderHome(container);
}

// Export cho Cub.red plugin system
if (typeof module !== "undefined") {
  module.exports = { initPlugin };
}

// Auto-init nếu có container
const rootEl = document.getElementById("plugin-container") || document.getElementById("kkp-root");
if (rootEl) initPlugin(rootEl);