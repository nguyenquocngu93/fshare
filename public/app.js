const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  // Navigation
  desktopNav: $(".desktop-nav"),
  mobileDock: $(".mobile-dock"),
  navLinks: $$(".nav-link, .dock-btn"),
  quickSearchButton: $("#quickSearchButton"),
  quickSearchModal: $("#quickSearchModal"),
  quickSearchInput: $("#quickSearchInput"),
  quickSearchCloseBtn: $("#quickSearchCloseBtn"),
  quickSearchResults: $("#quickSearchResults"),

  // Server Pill
  torrServerLink: $("#torrServerLink"),
  serverDot: $("#serverDot"),
  serverLabel: $("#serverLabel"),

  // Backdrop
  pageBackdrop: $("#pageBackdrop"),
  pageBackdropImage: $("#pageBackdropImage"),

  // 1. Home / Discover View
  discoverView: $("#discoverView"),
  discoverLoading: $("#discoverLoading"),
  discoverContent: $("#discoverContent"),
  tmdbSetup: $("#tmdbSetup"),
  setupSearchButton: $("#setupSearchButton"),
  heroSlider: $("#heroSlider"),
  heroDots: $("#heroDots"),
  heroPrevBtn: $("#heroPrevBtn"),
  heroNextBtn: $("#heroNextBtn"),
  tmdbSearchForm: $("#tmdbSearchForm"),
  tmdbSearchInput: $("#tmdbSearchInput"),
  continueSection: $("#continueSection"),
  continueRow: $("#continueRow"),
  railsContainer: $("#railsContainer"),

  // 2. Discovery Hub View
  discoverHubView: $("#discoverHubView"),
  hubFormatTabs: $$(".hub-tab"),
  moodChips: $$(".mood-chip"),
  genrePills: $$(".genre-pill"),
  hubResultsKicker: $("#hubResultsKicker"),
  hubResultsTitle: $("#hubResultsTitle"),
  hubSortSelect: $("#hubSortSelect"),
  hubLoading: $("#hubLoading"),
  hubGrid: $("#hubGrid"),
  hubPagination: $("#hubPagination"),
  hubPrevBtn: $("#hubPrevBtn"),
  hubNextBtn: $("#hubNextBtn"),
  hubPageLabel: $("#hubPageLabel"),

  // 3. Anime View
  animeView: $("#animeView"),
  animeTabs: $$(".anime-tab"),
  animeSectionTitle: $("#animeSectionTitle"),
  animeCount: $("#animeCount"),
  animeLoading: $("#animeLoading"),
  animeGrid: $("#animeGrid"),
  animePagination: $("#animePagination"),
  animePrevBtn: $("#animePrevBtn"),
  animeNextBtn: $("#animeNextBtn"),
  animePageLabel: $("#animePageLabel"),

  // 4. Category Browse View
  browseView: $("#browseView"),
  browseBackButton: $("#browseBackButton"),
  browseTitle: $("#browseTitle"),
  browseSubtitle: $("#browseSubtitle"),
  browseCount: $("#browseCount"),
  browseLoading: $("#browseLoading"),
  browseGrid: $("#browseGrid"),
  browsePeopleSection: $("#browsePeopleSection"),
  browsePeopleGrid: $("#browsePeopleGrid"),
  browsePrev: $("#browsePrev"),
  browseNext: $("#browseNext"),
  browsePageLabel: $("#browsePageLabel"),

  // 5. Media Detail View
  mediaPageView: $("#mediaPageView"),
  mediaBackButton: $("#mediaBackButton"),
  mediaPageLoading: $("#mediaPageLoading"),
  mediaPageContent: $("#mediaPageContent"),

  // 6. Person View
  personView: $("#personView"),
  personBackButton: $("#personBackButton"),
  personLoading: $("#personLoading"),
  personContent: $("#personContent"),

  // 7. Torrent Search Desk
  searchView: $("#searchView"),
  searchForm: $("#searchForm"),
  searchInput: $("#searchInput"),
  searchClearBtn: $("#searchClearBtn"),
  sourceTabs: $$(".source-tab"),
  maxSize: $("#maxSizeInput"),
  minSeeds: $("#minSeedsInput"),
  sort: $("#sortSelect"),
  hideXxx: $("#hideXxxInput"),
  limitText: $("#limitText"),
  resultsHeader: $("#resultsHeader"),
  resultKicker: $("#resultKicker"),
  resultTitle: $("#resultTitle"),
  searchMeta: $("#searchMeta"),
  notice: $("#notice"),
  skeletons: $("#skeletons"),
  results: $("#results"),
  emptyState: $("#emptyState"),
  pagination: $("#pagination"),
  prevButton: $("#prevButton"),
  nextButton: $("#nextButton"),
  pageLabel: $("#pageLabel"),

  // 8. Library View
  libraryView: $("#libraryView"),
  libraryRefreshButton: $("#libraryRefreshButton"),
  libraryPageLoading: $("#libraryPageLoading"),
  libraryGrid: $("#libraryGrid"),
  libraryEmpty: $("#libraryEmpty"),
  libraryItemView: $("#libraryItemView"),
  libraryItemBackButton: $("#libraryItemBackButton"),
  libraryItemContent: $("#libraryItemContent"),

  // 9. Player View
  playerView: $("#playerView"),
  playerBackButton: $("#playerBackButton"),
  playerTitle: $("#playerTitle"),
  playerSubtitle: $("#playerSubtitle"),
  videoPlayer: $("#videoPlayer"),
  playerError: $("#playerError"),
  playerFileName: $("#playerFileName"),
  openDirectStream: $("#openDirectStream"),
  openVlc: $("#openVlc"),

  // 10. Preferences View
  preferencesView: $("#preferencesView"),
  prefTmdbStatus: $("#prefTmdbStatus"),
  prefTmdbMode: $("#prefTmdbMode"),
  prefTorrStatus: $("#prefTorrStatus"),
  prefTorrVersion: $("#prefTorrVersion"),
  prefTorrUrl: $("#prefTorrUrl"),
  prefTorrOpenLink: $("#prefTorrOpenLink"),
  themeOptionBtns: $$(".theme-option-btn"),
  clearHistoryBtn: $("#clearHistoryBtn"),

  // Modals & Toast
  trailerModal: $("#trailerModal"),
  trailerModalTitle: $("#trailerModalTitle"),
  trailerModalClose: $("#trailerModalClose"),
  trailerIframe: $("#trailerIframe"),
  toastRegion: $("#toastRegion"),
};

const state = {
  view: "discover",
  previousView: "discover",
  health: null,
  torrServerPublicUrl: "http://127.0.0.1:8090",
  discoverLoaded: false,
  mediaItems: new Map(),
  selectedMedia: null,
  selectedPerson: null,
  selectedSeason: null,
  personTab: "movie",
  personPage: 1,

  // Hero carousel
  heroSlides: [],
  activeHeroIndex: 0,
  heroTimer: null,

  // Discovery Hub State
  hubFormat: "all",
  hubMood: "adrenaline",
  hubGenreId: "",
  hubSort: "popularity.desc",
  hubPage: 1,
  hubTotalPages: 1,

  // Anime State
  animeType: "trending",
  animePage: 1,
  animeTotalPages: 1,

  // Browse View State
  browseKey: "",
  browseMode: "rail",
  browseParams: {},
  browsePage: 1,
  browseTotalPages: 1,

  // Torrent Search State
  torrentQuery: "",
  torrentSource: "all",
  torrentPage: 1,
  torrentMaxPages: 1,
  torrentLoading: false,
  torrentController: null,
  torrentResults: [],

  // Library & Telemetry
  libraryItems: new Map(),
  libraryHashes: new Set(),
  libraryPollTimer: null,
  selectedTorrent: null,
  selectedFile: null,

  // Watch History & Watchlist
  continueWatching: [],
  watchlist: new Set(),
};

// Load saved theme and history from localStorage
try {
  const savedTheme = localStorage.getItem("cinewave.theme") || "cinewave";
  document.documentElement.setAttribute("data-theme", savedTheme);
  state.continueWatching = JSON.parse(localStorage.getItem("cinewave.continueWatching") || "[]");
  state.watchlist = new Set(JSON.parse(localStorage.getItem("cinewave.watchlist") || "[]"));
} catch {
  // Ignore storage errors
}

/* -------------------------------------------------------------
 * API HELPERS
 * ------------------------------------------------------------- */
async function fetchApi(path, options = {}) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error || `Lỗi máy chủ (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.payload = data;
    throw error;
  }
  return data;
}

function tmdbImage(path, size = "w500") {
  if (!path) return "";
  return `/api/tmdb/image?size=${encodeURIComponent(size)}&path=${encodeURIComponent(path)}`;
}

function formatDuration(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function showToast(title, message = "", icon = "✓") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div>
      <strong>${escapeHtml(title)}</strong>
      ${message ? `<p>${escapeHtml(message)}</p>` : ""}
    </div>
    <button type="button" aria-label="Đóng">&times;</button>
  `;
  const close = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 200);
  };
  toast.querySelector("button").onclick = close;
  elements.toastRegion.appendChild(toast);
  setTimeout(close, 4500);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* -------------------------------------------------------------
 * ROUTING & VIEW NAVIGATION
 * ------------------------------------------------------------- */
function navigateView(view, pushState = true) {
  if (state.view !== view) {
    state.previousView = state.view;
    state.view = view;
  }

  // Update Nav buttons
  elements.navLinks.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  // Hide all view pages
  $$(".view-page").forEach((page) => page.classList.add("hidden"));

  // Stop background polling if navigating away from library
  if (view !== "manage" && state.libraryPollTimer) {
    clearInterval(state.libraryPollTimer);
    state.libraryPollTimer = null;
  }

  // Show target page
  if (view === "discover") {
    elements.discoverView.classList.remove("hidden");
    if (!state.discoverLoaded) loadDiscoverHome();
    renderContinueWatching();
  } else if (view === "discover-hub") {
    elements.discoverHubView.classList.remove("hidden");
    loadDiscoverHub();
  } else if (view === "anime") {
    elements.animeView.classList.remove("hidden");
    loadAnimeUniverse();
  } else if (view === "search") {
    elements.searchView.classList.remove("hidden");
    setTimeout(() => elements.searchInput.focus(), 100);
  } else if (view === "manage") {
    elements.libraryView.classList.remove("hidden");
    loadLibrary();
    state.libraryPollTimer = setInterval(loadLibrary, 2500);
  } else if (view === "preferences") {
    elements.preferencesView.classList.remove("hidden");
    updatePreferencesView();
  } else if (view === "browse") {
    elements.browseView.classList.remove("hidden");
  } else if (view === "media") {
    elements.mediaPageView.classList.remove("hidden");
  } else if (view === "person") {
    elements.personView.classList.remove("hidden");
  } else if (view === "libraryItem") {
    elements.libraryItemView.classList.remove("hidden");
  } else if (view === "player") {
    elements.playerView.classList.remove("hidden");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (pushState) {
    const urlMap = {
      discover: "/",
      "discover-hub": "/discover",
      anime: "/anime",
      search: "/search",
      manage: "/manage",
      preferences: "/preferences",
      browse: `/browse?key=${encodeURIComponent(state.browseKey || "")}`,
    };
    const targetUrl = urlMap[view] || "/";
    history.pushState({ view }, "", targetUrl);
  }
}

window.navigateView = navigateView;

window.addEventListener("popstate", (e) => {
  const targetView = e.state?.view || "discover";
  navigateView(targetView, false);
});

/* -------------------------------------------------------------
 * 1. HOME & HERO CAROUSEL
 * ------------------------------------------------------------- */
async function loadDiscoverHome() {
  elements.discoverLoading.classList.remove("hidden");
  elements.discoverContent.classList.add("hidden");
  elements.tmdbSetup.classList.add("hidden");

  try {
    const data = await fetchApi("/api/tmdb/home");
    state.discoverLoaded = true;
    elements.discoverLoading.classList.add("hidden");
    elements.discoverContent.classList.remove("hidden");

    // Build Hero Slides
    const heroes = data.heroes?.length ? data.heroes : data.hero ? [data.hero] : [];
    state.heroSlides = heroes;
    renderHeroCarousel(heroes);

    // Cache Media Items & Render Rails
    (data.rails || []).forEach((rail) => {
      rail.items.forEach((item) => state.mediaItems.set(`${item.mediaType}:${item.id}`, item));
    });
    renderRails(data.rails || []);
  } catch (error) {
    elements.discoverLoading.classList.add("hidden");
    if (error.payload?.code === "tmdb_not_configured" || error.status === 503) {
      elements.tmdbSetup.classList.remove("hidden");
    } else {
      showToast("Lỗi tải trang chủ TMDB", error.message, "✕");
    }
  }
}

function renderHeroCarousel(heroes) {
  if (!heroes.length) return;
  state.activeHeroIndex = 0;

  elements.heroSlider.innerHTML = heroes
    .map((item, idx) => {
      const year = item.year || (item.date ? item.date.slice(0, 4) : "");
      const rating = item.rating ? `${item.rating.toFixed(1)}` : "7.8";
      const mediaLabel = item.mediaType === "tv" ? "TV SERIES" : "MOVIE";
      const backdrop = tmdbImage(item.backdropPath, "original") || tmdbImage(item.posterPath, "w780");

      return `
        <article class="hero-slide ${idx === 0 ? "active" : ""}" data-hero-index="${idx}">
          <div class="hero-slide-backdrop">
            <img src="${backdrop}" alt="${escapeHtml(item.title)}" loading="${idx === 0 ? "eager" : "lazy"}" />
          </div>
          <div class="hero-slide-content">
            <div class="hero-badges-row">
              <span class="hero-trending-tag">🔥 TOP TRENDING #${idx + 1} THIS WEEK</span>
              <span class="hero-rating-badge">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                ${rating} ⭐
              </span>
              ${year ? `<span class="hero-meta-item">${year}</span>` : ""}
              <span class="badge-tag">${mediaLabel}</span>
              <span class="hero-quality-chip">4K UHD</span>
            </div>

            <h1 class="hero-title">${escapeHtml(item.title)}</h1>
            <p class="hero-synopsis">${escapeHtml(item.overview || "Thưởng thức bộ phim bom tấn với hình ảnh 4K HDR và âm thanh vòm đỉnh cao.")}</p>

            <div class="hero-actions-row">
              <button class="btn btn-primary" onclick="window.findTorrentForMedia('${item.mediaType}', ${item.id})" type="button">
                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                <span>Xem & Tìm Torrent</span>
              </button>
              <button class="btn btn-glass" onclick="window.openMediaDetail('${item.mediaType}', ${item.id})" type="button">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                <span>Chi tiết</span>
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  // Render Indicator Dots
  elements.heroDots.innerHTML = heroes
    .map((_, idx) => `<span class="hero-dot ${idx === 0 ? "active" : ""}" data-hero-dot="${idx}"></span>`)
    .join("");

  // Attach Dot Events
  $$(".hero-dot").forEach((dot) => {
    dot.onclick = () => setHeroSlide(Number(dot.dataset.heroDot));
  });

  // Start Autoplay
  startHeroAutoplay();
}

function setHeroSlide(index) {
  const total = state.heroSlides.length;
  if (!total) return;
  state.activeHeroIndex = (index + total) % total;

  $$(".hero-slide").forEach((slide, idx) => {
    slide.classList.toggle("active", idx === state.activeHeroIndex);
  });
  $$(".hero-dot").forEach((dot, idx) => {
    dot.classList.toggle("active", idx === state.activeHeroIndex);
  });
}

function startHeroAutoplay() {
  if (state.heroTimer) clearInterval(state.heroTimer);
  state.heroTimer = setInterval(() => {
    setHeroSlide(state.activeHeroIndex + 1);
  }, 7000);
}

elements.heroPrevBtn.onclick = () => {
  setHeroSlide(state.activeHeroIndex - 1);
  startHeroAutoplay();
};

elements.heroNextBtn.onclick = () => {
  setHeroSlide(state.activeHeroIndex + 1);
  startHeroAutoplay();
};

/* -------------------------------------------------------------
 * CONTENT RAILS RENDERING
 * ------------------------------------------------------------- */
function renderRails(rails) {
  elements.railsContainer.innerHTML = rails
    .map((rail) => {
      const itemsHtml = rail.items.map((item) => renderMediaCardHtml(item)).join("");
      return `
        <section class="content-rail" data-rail-key="${rail.key}">
          <div class="rail-header">
            <div>
              <h2 class="rail-title">${escapeHtml(rail.title)}</h2>
              <p class="rail-subtitle">${escapeHtml(rail.subtitle)}</p>
            </div>
            <div class="rail-controls">
              <button class="rail-arrow-btn" onclick="window.scrollRail('${rail.key}', -1)" type="button" aria-label="Cuộn trái">
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button class="rail-arrow-btn" onclick="window.scrollRail('${rail.key}', 1)" type="button" aria-label="Cuộn phải">
                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <button class="rail-more-btn" onclick="window.openBrowseRail('${rail.key}')" type="button">
                <span>Xem thêm</span>
                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
          <div id="railRow_${rail.key}" class="rail-posters-row">
            ${itemsHtml}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderMediaCardHtml(item) {
  state.mediaItems.set(`${item.mediaType}:${item.id}`, item);
  const poster = tmdbImage(item.posterPath, "w500");
  const year = item.year || (item.date ? item.date.slice(0, 4) : "");
  const rating = item.rating ? `${item.rating.toFixed(1)}` : "⭐";
  const mediaTypeLabel = item.mediaType === "tv" ? "TV" : "PHIM";

  return `
    <article class="media-card" data-media-type="${item.mediaType}" data-media-id="${item.id}">
      <div class="card-poster-box" onclick="window.openMediaDetail('${item.mediaType}', ${item.id})">
        ${poster ? `<img src="${poster}" alt="${escapeHtml(item.title)}" loading="lazy" />` : `<div class="poster-placeholder"><span>${escapeHtml(item.title)}</span></div>`}
        <span class="card-rating-tag">
          <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          ${rating}
        </span>
        <span class="card-type-tag">${mediaTypeLabel}</span>

        <div class="card-hover-overlay">
          <button class="card-quick-btn play" onclick="event.stopPropagation(); window.findTorrentForMedia('${item.mediaType}', ${item.id})" type="button">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            <span>Tìm Torrent</span>
          </button>
          <button class="card-quick-btn find" onclick="event.stopPropagation(); window.openMediaDetail('${item.mediaType}', ${item.id})" type="button">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            <span>Chi tiết</span>
          </button>
        </div>

        <div class="card-bottom-info">
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <div class="card-meta-line">
            <span>${year || "TMDB"}</span>
            <span>⭐ ${rating}</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

window.scrollRail = (railKey, direction) => {
  const row = $(`#railRow_${railKey}`);
  if (row) {
    row.scrollBy({ left: direction * 560, behavior: "smooth" });
  }
};

/* -------------------------------------------------------------
 * 2. DISCOVERY HUB LOGIC (Moods, Categories, Filters)
 * ------------------------------------------------------------- */
async function loadDiscoverHub() {
  elements.hubLoading.classList.remove("hidden");
  elements.hubGrid.innerHTML = "";

  try {
    let url = `/api/tmdb/discover?page=${state.hubPage}&media=${state.hubFormat === "anime" ? "tv" : state.hubFormat === "all" ? "movie" : state.hubFormat}&sort=${encodeURIComponent(state.hubSort)}`;

    if (state.hubFormat === "anime") {
      url += `&kind=anime&label=${encodeURIComponent("Anime Universe")}`;
    } else if (state.hubGenreId) {
      const activeGenreBtn = $(`.genre-pill[data-genre-id="${state.hubGenreId}"]`);
      const genreLabel = activeGenreBtn ? activeGenreBtn.textContent.trim() : "Thể loại";
      url += `&kind=genre&id=${state.hubGenreId}&label=${encodeURIComponent(genreLabel)}`;
    } else if (state.hubMood) {
      url += `&kind=mood&mood=${encodeURIComponent(state.hubMood)}`;
    } else {
      url += `&kind=genre&id=28&label=${encodeURIComponent("Hành động")}`;
    }

    const data = await fetchApi(url);
    elements.hubLoading.classList.add("hidden");
    elements.hubResultsTitle.textContent = data.title || "Kết quả tuyển chọn";
    state.hubTotalPages = data.totalPages || 1;
    elements.hubPageLabel.textContent = `Trang ${data.page} / ${state.hubTotalPages}`;

    elements.hubPrevBtn.disabled = data.page <= 1;
    elements.hubNextBtn.disabled = data.page >= state.hubTotalPages;

    elements.hubGrid.innerHTML = (data.items || []).map((item) => renderMediaCardHtml(item)).join("");
  } catch (error) {
    elements.hubLoading.classList.add("hidden");
    showToast("Lỗi tải Discovery Hub", error.message, "✕");
  }
}

// Hub Tab Format switching
elements.hubFormatTabs.forEach((tab) => {
  tab.onclick = () => {
    elements.hubFormatTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.hubFormat = tab.dataset.hubTab;
    state.hubPage = 1;
    loadDiscoverHub();
  };
});

// Mood chips click
elements.moodChips.forEach((chip) => {
  chip.onclick = () => {
    elements.moodChips.forEach((c) => c.classList.remove("active"));
    elements.genrePills.forEach((g) => g.classList.remove("active"));
    chip.classList.add("active");
    state.hubMood = chip.dataset.mood;
    state.hubGenreId = "";
    state.hubPage = 1;
    loadDiscoverHub();
  };
});

// Genre pills click
elements.genrePills.forEach((pill) => {
  pill.onclick = () => {
    elements.genrePills.forEach((p) => p.classList.remove("active"));
    elements.moodChips.forEach((c) => c.classList.remove("active"));
    pill.classList.add("active");
    state.hubGenreId = pill.dataset.genreId;
    state.hubMood = "";
    state.hubPage = 1;
    loadDiscoverHub();
  };
});

elements.hubSortSelect.onchange = (e) => {
  state.hubSort = e.target.value;
  state.hubPage = 1;
  loadDiscoverHub();
};

elements.hubPrevBtn.onclick = () => {
  if (state.hubPage > 1) {
    state.hubPage--;
    loadDiscoverHub();
    window.scrollTo({ top: elements.discoverHubView.offsetTop - 80, behavior: "smooth" });
  }
};

elements.hubNextBtn.onclick = () => {
  if (state.hubPage < state.hubTotalPages) {
    state.hubPage++;
    loadDiscoverHub();
    window.scrollTo({ top: elements.discoverHubView.offsetTop - 80, behavior: "smooth" });
  }
};

/* -------------------------------------------------------------
 * 3. ANIME UNIVERSE LOGIC
 * ------------------------------------------------------------- */
async function loadAnimeUniverse() {
  elements.animeLoading.classList.remove("hidden");
  elements.animeGrid.innerHTML = "";

  const animeTitles = {
    trending: "Anime thịnh hành mùa này",
    topRated: "Anime kinh điển đánh giá cao",
    movies: "Phim Anime điện ảnh (Movie)",
    shonen: "Shonen & Hành động đỉnh cao",
    romance: "Lãng mạn & Đời thường",
  };

  elements.animeSectionTitle.textContent = animeTitles[state.animeType] || "Anime Universe";

  try {
    let url = `/api/tmdb/discover?kind=anime&media=${state.animeType === "movies" ? "movie" : "tv"}&page=${state.animePage}`;
    if (state.animeType === "topRated") {
      url += "&sort=vote_average.desc";
    } else {
      url += "&sort=popularity.desc";
    }

    const data = await fetchApi(url);
    elements.animeLoading.classList.add("hidden");
    state.animeTotalPages = data.totalPages || 1;
    elements.animePageLabel.textContent = `Trang ${data.page} / ${state.animeTotalPages}`;
    elements.animePrevBtn.disabled = data.page <= 1;
    elements.animeNextBtn.disabled = data.page >= state.animeTotalPages;

    elements.animeGrid.innerHTML = (data.items || []).map((item) => renderMediaCardHtml(item)).join("");
  } catch (error) {
    elements.animeLoading.classList.add("hidden");
    showToast("Lỗi tải Anime", error.message, "✕");
  }
}

elements.animeTabs.forEach((tab) => {
  tab.onclick = () => {
    elements.animeTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.animeType = tab.dataset.animeType;
    state.animePage = 1;
    loadAnimeUniverse();
  };
});

elements.animePrevBtn.onclick = () => {
  if (state.animePage > 1) {
    state.animePage--;
    loadAnimeUniverse();
  }
};

elements.animeNextBtn.onclick = () => {
  if (state.animePage < state.animeTotalPages) {
    state.animePage++;
    loadAnimeUniverse();
  }
};

/* -------------------------------------------------------------
 * 4. BROWSE / FULL GRID VIEW
 * ------------------------------------------------------------- */
window.openBrowseRail = async (railKey, page = 1) => {
  state.browseKey = railKey;
  state.browseMode = "rail";
  state.browsePage = page;
  navigateView("browse");

  elements.browseLoading.classList.remove("hidden");
  elements.browseGrid.innerHTML = "";
  elements.browsePeopleSection.classList.add("hidden");

  try {
    const data = await fetchApi(`/api/tmdb/list?key=${encodeURIComponent(railKey)}&page=${page}`);
    elements.browseLoading.classList.add("hidden");
    elements.browseTitle.textContent = data.title || "Danh mục phim";
    elements.browseSubtitle.textContent = data.subtitle || "";
    elements.browseCount.textContent = `${data.totalResults?.toLocaleString("vi-VN") || ""} kết quả`;
    state.browseTotalPages = data.totalPages || 1;
    elements.browsePageLabel.textContent = `Trang ${data.page} / ${state.browseTotalPages}`;

    elements.browsePrev.disabled = data.page <= 1;
    elements.browseNext.disabled = data.page >= state.browseTotalPages;

    elements.browseGrid.innerHTML = (data.items || []).map((item) => renderMediaCardHtml(item)).join("");
  } catch (error) {
    elements.browseLoading.classList.add("hidden");
    showToast("Lỗi tải danh mục", error.message, "✕");
  }
};

elements.browseBackButton.onclick = () => navigateView(state.previousView || "discover");

elements.browsePrev.onclick = () => {
  if (state.browsePage > 1) {
    window.openBrowseRail(state.browseKey, state.browsePage - 1);
  }
};

elements.browseNext.onclick = () => {
  if (state.browsePage < state.browseTotalPages) {
    window.openBrowseRail(state.browseKey, state.browsePage + 1);
  }
};

/* -------------------------------------------------------------
 * 5. MEDIA DETAIL VIEW
 * ------------------------------------------------------------- */
window.openMediaDetail = async (mediaType, id) => {
  navigateView("media");
  elements.mediaPageLoading.classList.remove("hidden");
  elements.mediaPageContent.innerHTML = "";

  try {
    const { data } = await fetchApi(`/api/tmdb/${mediaType}/${id}`);
    state.selectedMedia = data;
    elements.mediaPageLoading.classList.add("hidden");
    renderMediaDetailPage(data);
  } catch (error) {
    elements.mediaPageLoading.classList.add("hidden");
    showToast("Lỗi tải chi tiết phim", error.message, "✕");
  }
};

function renderMediaDetailPage(media) {
  const backdrop = tmdbImage(media.backdropPath, "original") || tmdbImage(media.posterPath, "w780");
  const poster = tmdbImage(media.posterPath, "w500");
  const logo = tmdbImage(media.logoPath, "w500");
  const year = media.year || (media.date ? media.date.slice(0, 4) : "");
  const rating = media.rating ? media.rating.toFixed(1) : "⭐";
  const duration = formatDuration(media.runtime);
  const cert = media.certification || (media.mediaType === "tv" ? "TV-MA" : "PG-13");
  const isBookmarked = state.watchlist.has(`${media.mediaType}:${media.id}`);

  // Cast HTML
  const castHtml = (media.cast || [])
    .slice(0, 15)
    .map((actor) => {
      const photo = tmdbImage(actor.profilePath, "w185");
      return `
        <div class="cast-card" onclick="window.openPersonDetail(${actor.id})">
          <div class="cast-photo">
            ${photo ? `<img src="${photo}" alt="${escapeHtml(actor.name)}" loading="lazy" />` : ""}
          </div>
          <strong class="cast-name">${escapeHtml(actor.name)}</strong>
          <span class="cast-character">${escapeHtml(actor.character || "Diễn viên")}</span>
        </div>
      `;
    })
    .join("");

  // Related Content HTML
  const relatedHtml = (media.relatedContent || [])
    .slice(0, 12)
    .map((item) => renderMediaCardHtml(item))
    .join("");

  // Seasons dropdown if TV
  const seasonsHtml =
    media.mediaType === "tv" && media.seasons?.length
      ? `
        <div class="season-episodes-hub glass-panel">
          <div class="episodes-bar">
            <div>
              <h3>Danh sách mùa & tập</h3>
              <p class="rail-subtitle">Chọn tập để tìm kiếm torrent riêng từng tập</p>
            </div>
            <div class="season-selector-wrap">
              <select id="seasonSelect" onchange="window.loadTvSeason(${media.id}, this.value)">
                ${media.seasons.map((s) => `<option value="${s.seasonNumber}">${escapeHtml(s.name)} (${s.episodeCount} tập)</option>`).join("")}
              </select>
            </div>
          </div>
          <div id="episodesListContainer" class="episodes-list"></div>
        </div>
      `
      : "";

  elements.mediaPageContent.innerHTML = `
    <div class="media-visual-hero">
      <div class="media-visual-backdrop">
        <img src="${backdrop}" alt="${escapeHtml(media.title)}" />
      </div>
      <div class="media-visual-shade"></div>
      <div class="media-visual-title-box">
        ${logo ? `<img class="media-visual-logo" src="${logo}" alt="${escapeHtml(media.title)}" />` : `<h1 class="media-visual-heading">${escapeHtml(media.title)}</h1>`}
      </div>
    </div>

    <div class="media-sheet-card glass-panel">
      <div class="media-sheet-layout">
        <div class="detail-poster-wrap">
          <img src="${poster}" alt="${escapeHtml(media.title)}" />
        </div>
        <div class="detail-head-info">
          <h2>${escapeHtml(media.title)}</h2>
          ${media.originalTitle && media.originalTitle !== media.title ? `<p class="detail-original-title">${escapeHtml(media.originalTitle)}</p>` : ""}
          ${media.tagline ? `<p class="detail-tagline">“${escapeHtml(media.tagline)}”</p>` : ""}

          <div class="detail-badges-row">
            <span class="hero-rating-badge">
              <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              ${rating} ⭐ (${media.voteCount?.toLocaleString("vi-VN") || 0})
            </span>
            <span class="badge-tag">${cert}</span>
            ${year ? `<span class="badge-tag">${year}</span>` : ""}
            ${duration ? `<span class="badge-tag">${duration}</span>` : ""}
            <span class="badge-tag">${media.mediaType === "tv" ? `${media.numberOfSeasons || 1} Mùa` : "Bản Rạp"}</span>
            <span class="hero-quality-chip">4K UHD</span>
          </div>

          <div class="detail-action-buttons">
            <button class="btn btn-primary" onclick="window.findTorrentForMedia('${media.mediaType}', ${media.id})" type="button">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <span>Tìm bản Torrent</span>
            </button>
            ${media.trailerKey ? `<button class="btn btn-glass" onclick="window.openTrailer('${media.trailerKey}', '${escapeHtml(media.title)}')" type="button"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg><span>Xem Trailer</span></button>` : ""}
            <button id="bookmarkBtn" class="btn btn-glass" onclick="window.toggleWatchlist('${media.mediaType}', ${media.id})" type="button">
              <span>${isBookmarked ? "★ Đã lưu" : "☆ Yêu thích"}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="detail-body-grid">
        <div>
          <div class="detail-block">
            <div class="detail-block-head">
              <h3>Tóm tắt nội dung</h3>
            </div>
            <p class="detail-synopsis-text">${escapeHtml(media.overview || "Đang cập nhật nội dung cho tác phẩm này.")}</p>
          </div>

          <!-- Cast Section -->
          ${castHtml ? `<div class="detail-block"><div class="detail-block-head"><h3>Diễn viên chính</h3></div><div class="cast-scroller">${castHtml}</div></div>` : ""}

          <!-- TV Seasons Section -->
          ${seasonsHtml}

          <!-- Related Content Rail -->
          ${relatedHtml ? `<div class="detail-block" style="margin-top: 36px;"><div class="detail-block-head"><h3>Tác phẩm tương tự</h3></div><div class="rail-posters-row">${relatedHtml}</div></div>` : ""}
        </div>

        <div>
          <!-- Facts Panel -->
          <div class="facts-panel">
            <div class="fact-item"><span>Trạng thái</span><strong>${escapeHtml(media.status || "Đã phát hành")}</strong></div>
            <div class="fact-item"><span>Ngôn ngữ gốc</span><strong>${escapeHtml(media.originalLanguage?.toUpperCase() || "EN")}</strong></div>
            ${media.budget ? `<div class="fact-item"><span>Kinh phí</span><strong>$${(media.budget / 1e6).toFixed(1)}M</strong></div>` : ""}
            ${media.revenue ? `<div class="fact-item"><span>Doanh thu</span><strong>$${(media.revenue / 1e6).toFixed(1)}M</strong></div>` : ""}
            <div class="fact-item"><span>Thể loại</span><strong>${(media.genres || []).map((g) => g.name).join(", ") || "Tổng hợp"}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Auto load first season if TV
  if (media.mediaType === "tv" && media.seasons?.length) {
    const firstSeason = media.seasons[0].seasonNumber;
    window.loadTvSeason(media.id, firstSeason);
  }
}

window.loadTvSeason = async (tvId, seasonNumber) => {
  const container = $("#episodesListContainer");
  if (!container) return;
  container.innerHTML = `<div class="spinner" style="margin: 20px auto;"></div>`;

  try {
    const { data } = await fetchApi(`/api/tmdb/tv/${tvId}/season/${seasonNumber}`);
    container.innerHTML = (data.episodes || [])
      .map((ep) => {
        const still = tmdbImage(ep.stillPath, "w300");
        const epQuery = `${state.selectedMedia?.title || ""} S${String(seasonNumber).padStart(2, "0")}E${String(ep.episodeNumber).padStart(2, "0")}`;

        return `
          <div class="episode-card">
            <div class="episode-still-wrap">
              ${still ? `<img src="${still}" alt="${escapeHtml(ep.name)}" loading="lazy" />` : ""}
              <span class="episode-num-badge">Tập ${ep.episodeNumber}</span>
            </div>
            <div class="episode-meta-content">
              <h4>${escapeHtml(ep.name)}</h4>
              <div class="episode-meta-sub">
                <span>${ep.airDate || ""}</span> · <span>${formatDuration(ep.runtime)}</span> · <span>⭐ ${ep.voteAverage?.toFixed(1) || "7.5"}</span>
              </div>
              <p class="episode-desc-text">${escapeHtml(ep.overview || "Nội dung tập phim đang được cập nhật.")}</p>
            </div>
            <button class="btn btn-glass btn-sm" onclick="window.findTorrentByQuery('${escapeHtml(epQuery)}')" type="button">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <span>Tìm tập này</span>
            </button>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    container.innerHTML = `<p style="color: var(--text-dim);">Không tải được danh sách tập.</p>`;
  }
};

elements.mediaBackButton.onclick = () => navigateView(state.previousView || "discover");

/* -------------------------------------------------------------
 * 6. PERSON PROFILE VIEW
 * ------------------------------------------------------------- */
window.openPersonDetail = async (personId) => {
  navigateView("person");
  elements.personLoading.classList.remove("hidden");
  elements.personContent.innerHTML = "";

  try {
    const { data } = await fetchApi(`/api/tmdb/person/${personId}`);
    state.selectedPerson = data;
    elements.personLoading.classList.add("hidden");
    renderPersonDetailPage(data);
  } catch (error) {
    elements.personLoading.classList.add("hidden");
    showToast("Lỗi tải hồ sơ diễn viên", error.message, "✕");
  }
};

function renderPersonDetailPage(person) {
  const photo = tmdbImage(person.profilePath, "w500");
  const filmographyHtml = (person.filmography || [])
    .slice(0, 36)
    .map((item) => renderMediaCardHtml(item))
    .join("");

  elements.personContent.innerHTML = `
    <div class="person-profile-hero glass-panel">
      <div class="person-portrait">
        ${photo ? `<img src="${photo}" alt="${escapeHtml(person.name)}" />` : ""}
      </div>
      <div class="person-hero-info">
        <span class="badge-accent">${escapeHtml(person.knownForDepartment || "DIỄN VIÊN")}</span>
        <h1>${escapeHtml(person.name)}</h1>
        <div class="person-facts-row">
          ${person.birthday ? `<span>Sinh nhật: ${person.birthday}</span>` : ""}
          ${person.placeOfBirth ? `<span>Nơi sinh: ${escapeHtml(person.placeOfBirth)}</span>` : ""}
        </div>
        <p class="person-bio-text">${escapeHtml(person.biography || "Tiểu sử đang được cập nhật.")}</p>
      </div>
    </div>

    <div class="person-filmography-section">
      <div class="detail-block-head">
        <h3>Tác phẩm đã tham gia</h3>
      </div>
      <div class="cinewave-grid">${filmographyHtml}</div>
    </div>
  `;
}

elements.personBackButton.onclick = () => navigateView(state.previousView || "discover");

/* -------------------------------------------------------------
 * 7. TORRENT SEARCH ENGINE (Magnetz + Knaben)
 * ------------------------------------------------------------- */
window.findTorrentForMedia = (mediaType, id) => {
  const item = state.mediaItems.get(`${mediaType}:${id}`) || state.selectedMedia;
  if (!item) return;
  const query = item.searchQuery || `${item.originalTitle || item.title} ${item.year || ""}`.trim();
  window.findTorrentByQuery(query, item);
};

window.findTorrentByQuery = (query, tmdbData = null) => {
  navigateView("search");
  elements.searchInput.value = query;
  executeTorrentSearch(query, 1, tmdbData);
};

async function executeTorrentSearch(query, page = 1, tmdbData = null) {
  if (!query || query.trim().length < 2) return;
  state.torrentQuery = query.trim();
  state.torrentPage = page;
  state.torrentLoading = true;

  if (state.torrentController) state.torrentController.abort();
  state.torrentController = new AbortController();

  elements.skeletons.classList.remove("hidden");
  elements.skeletons.innerHTML = `<div class="spinner" style="grid-column: 1/-1; margin: 40px auto;"></div>`;
  elements.results.innerHTML = "";
  elements.emptyState.classList.add("hidden");
  elements.notice.classList.add("hidden");
  elements.resultsHeader.classList.remove("hidden");
  elements.resultTitle.textContent = `Đang tìm “${state.torrentQuery}”...`;

  const maxGb = elements.maxSize.value.trim();
  const minSeeds = elements.minSeeds.value || "1";
  const sort = elements.sort.value;
  const hideXxx = elements.hideXxx.checked;

  const params = new URLSearchParams({
    q: state.torrentQuery,
    page: String(page),
    source: state.torrentSource,
    minSeeds,
    sort,
    hideXxx: hideXxx ? "true" : "false",
  });
  if (maxGb) params.set("maxGb", maxGb);

  try {
    const res = await fetch(`/api/search?${params}`, { signal: state.torrentController.signal });
    const payload = await res.json();
    elements.skeletons.classList.add("hidden");

    if (!res.ok) throw new Error(payload?.error || "Lỗi tìm kiếm torrent");

    state.torrentResults = payload.data || [];
    state.torrentMaxPages = payload.meta?.maxPages || 1;

    elements.resultTitle.textContent = `Kết quả cho “${state.torrentQuery}”`;
    elements.searchMeta.textContent = `Tìm thấy ${payload.data.length} bản phát hành (${payload.meta?.durationMs || 0}ms)`;

    if (!payload.data.length) {
      elements.results.innerHTML = `
        <div class="empty-desk-state" style="grid-column: 1/-1;">
          <h2>Không tìm thấy bản torrent phù hợp</h2>
          <p>Hãy thử giảm bộ lọc seed tối thiểu hoặc đổi từ khóa ngắn hơn.</p>
        </div>
      `;
      elements.pagination.classList.add("hidden");
      return;
    }

    elements.results.innerHTML = payload.data
      .map((item) => renderTorrentResultCard(item, tmdbData))
      .join("");

    elements.pagination.classList.remove("hidden");
    elements.pageLabel.textContent = `Trang ${page} / ${state.torrentMaxPages}`;
    elements.prevButton.disabled = page <= 1;
    elements.nextButton.disabled = page >= state.torrentMaxPages;
  } catch (error) {
    if (error.name === "AbortError") return;
    elements.skeletons.classList.add("hidden");
    elements.notice.classList.remove("hidden");
    elements.notice.textContent = error.message;
  } finally {
    state.torrentLoading = false;
  }
}

function renderTorrentResultCard(item, tmdbData) {
  const sourcesBadges = (item.sources || [item.source])
    .map((s) => `<span class="source-badge ${s}">${s === "magnetz" ? "Magnetz" : "Knaben"}</span>`)
    .join(" ");

  return `
    <article class="torrent-card">
      <div class="torrent-card-top">
        <div class="torrent-tags-row">
          ${sourcesBadges}
          <span class="badge-tag">${escapeHtml(item.category || "Torrent")}</span>
          ${item.verified ? `<span class="badge-tag" style="color: var(--accent-amber);">✓ Verified</span>` : ""}
        </div>
        <span class="code-pill">${item.humanSize || "Không rõ"}</span>
      </div>

      <h3>${escapeHtml(item.title)}</h3>

      <div class="torrent-stats-row">
        <span class="stat-pill seeders">▲ ${item.seeders} Seeds</span>
        <span class="stat-pill">▼ ${item.leechers} Peers</span>
        ${item.date ? `<span>🕒 ${item.date.slice(0, 10)}</span>` : ""}
      </div>

      <div class="torrent-card-bottom">
        <button class="btn btn-primary btn-sm" onclick="window.sendToTorrServer('${item.ref}', ${tmdbData ? JSON.stringify(tmdbData).replace(/"/g, "&quot;") : "null"})" type="button">
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          <span>Gửi TorrServer</span>
        </button>
        ${item.link && item.link.startsWith("magnet:") ? `<button class="btn btn-glass btn-sm" onclick="window.copyMagnetLink('${escapeHtml(item.link)}')" type="button">Sao chép Magnet</button>` : ""}
      </div>
    </article>
  `;
}

window.sendToTorrServer = async (ref, tmdbData = null) => {
  showToast("Đang gửi sang TorrServer...", "Chờ kết nối và lấy metadata", "⚡");
  try {
    const payload = await fetchApi("/api/torrserver/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, tmdb: tmdbData }),
    });
    showToast("Đã thêm thành công!", payload.message || "Torrent đã được nạp vào TorrServer", "✓");
  } catch (error) {
    showToast("Thêm thất bại", error.message, "✕");
  }
};

window.copyMagnetLink = (link) => {
  navigator.clipboard.writeText(link).then(() => {
    showToast("Đã sao chép Magnet!", "Bạn có thể dán vào bất kỳ app torrent nào", "📋");
  });
};

elements.searchForm.onsubmit = (e) => {
  e.preventDefault();
  executeTorrentSearch(elements.searchInput.value, 1);
};

elements.sourceTabs.forEach((tab) => {
  tab.onclick = () => {
    elements.sourceTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.torrentSource = tab.dataset.source;
    if (elements.searchInput.value.trim()) {
      executeTorrentSearch(elements.searchInput.value, 1);
    }
  };
});

elements.prevButton.onclick = () => {
  if (state.torrentPage > 1) executeTorrentSearch(state.torrentQuery, state.torrentPage - 1);
};

elements.nextButton.onclick = () => {
  if (state.torrentPage < state.torrentMaxPages) executeTorrentSearch(state.torrentQuery, state.torrentPage + 1);
};

// Quick Tags
$$(".quick-tags-row button").forEach((btn) => {
  btn.onclick = () => {
    elements.searchInput.value = btn.dataset.query;
    executeTorrentSearch(btn.dataset.query, 1);
  };
});

// Inline Hero Search Form
elements.tmdbSearchForm.onsubmit = (e) => {
  e.preventDefault();
  const q = elements.tmdbSearchInput.value.trim();
  if (q) {
    window.findTorrentByQuery(q);
  }
};

/* -------------------------------------------------------------
 * 8. LIBRARY & TORRSERVER MANAGER
 * ------------------------------------------------------------- */
async function loadLibrary() {
  try {
    const data = await fetchApi("/api/torrserver/torrents");
    elements.libraryPageLoading.classList.add("hidden");
    const torrents = data.data || [];

    if (!torrents.length) {
      elements.libraryEmpty.classList.remove("hidden");
      elements.libraryGrid.innerHTML = "";
      return;
    }

    elements.libraryEmpty.classList.add("hidden");
    elements.libraryGrid.innerHTML = torrents.map((t) => renderLibraryTorrentCard(t)).join("");
  } catch (error) {
    elements.libraryPageLoading.classList.add("hidden");
  }
}

function renderLibraryTorrentCard(t) {
  const hash = t.hash || "";
  const stat = t.stat_string || "Sẵn sàng";
  const speed = t.download_speed ? `${(t.download_speed / 1024 / 1024).toFixed(2)} MB/s` : "0 KB/s";
  const peers = t.peers_count || 0;
  const seeds = t.connected_seeders || 0;
  const progress = t.preload_size && t.size ? Math.min(100, Math.round((t.preload_size / t.size) * 100)) : 0;

  // File list preview if multi-file
  const files = t.file_stats || [];
  const filesHtml = files
    .map((f) => {
      const fileId = f.id;
      const fileName = f.path || `File ${fileId}`;
      const fileSize = (f.length / 1024 / 1024 / 1024).toFixed(2);
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-top: 1px solid var(--line); font-size: 11px;">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;">${escapeHtml(fileName)} (${fileSize} GB)</span>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-primary btn-sm" onclick="window.playTorrServerStream('${hash}', ${fileId}, '${escapeHtml(fileName)}')" type="button">Phát</button>
            <button class="btn btn-glass btn-sm" onclick="window.preloadTorrentFile('${hash}', ${fileId})" type="button">Preload</button>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <article class="manage-torrent-card">
      <div class="manage-torrent-head">
        <span class="torrent-state-pill"><i class="status-dot online"></i> ${stat}</span>
        <div style="flex: 1; min-width: 0;">
          <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(t.title || hash)}</h3>
          <p style="color: var(--text-dim); font-size: 11px;">Hash: ${hash}</p>
        </div>
      </div>

      <div class="telemetry-grid">
        <div class="telemetry-box"><span>Tốc độ tải</span><strong>${speed}</strong></div>
        <div class="telemetry-box"><span>Peers</span><strong>${peers}</strong></div>
        <div class="telemetry-box"><span>Seeds</span><strong>${seeds}</strong></div>
        <div class="telemetry-box"><span>Preload</span><strong>${progress}%</strong></div>
        <div class="telemetry-progress-bar">
          <div class="telemetry-progress-fill" style="width: ${progress}%;"></div>
        </div>
      </div>

      <div style="display: flex; gap: 8px; margin: 12px 0;">
        <button class="btn btn-primary btn-sm" onclick="window.playTorrServerStream('${hash}', 1, '${escapeHtml(t.title || "")}')" type="button">▶ Phát ngay</button>
        <button class="btn btn-danger btn-sm" onclick="window.deleteTorrent('${hash}')" type="button">Xóa</button>
      </div>

      ${files.length > 1 ? `<details style="margin-top: 10px;"><summary style="cursor: pointer; color: var(--accent-cyan); font-size: 11px; font-weight: 700;">Xem danh sách ${files.length} file video</summary><div style="margin-top: 8px;">${filesHtml}</div></details>` : ""}
    </article>
  `;
}

window.deleteTorrent = async (hash) => {
  if (!confirm("Bạn có chắc muốn xóa torrent này khỏi TorrServer?")) return;
  try {
    await fetchApi("/api/torrserver/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rem", hash }),
    });
    showToast("Đã xóa torrent", "", "✓");
    loadLibrary();
  } catch (error) {
    showToast("Lỗi xóa", error.message, "✕");
  }
};

window.preloadTorrentFile = async (hash, fileId) => {
  try {
    await fetchApi("/api/torrserver/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "preload", hash, fileId }),
    });
    showToast("Bắt đầu preload...", "TorrServer đang cache buffer trước", "⚡");
  } catch (error) {
    showToast("Lỗi preload", error.message, "✕");
  }
};

elements.libraryRefreshButton.onclick = loadLibrary;

/* -------------------------------------------------------------
 * 9. INTERNAL VIDEO PLAYER & VLC INTEGRATION
 * ------------------------------------------------------------- */
window.playTorrServerStream = (hash, fileId = 1, title = "Video Stream") => {
  navigateView("player");
  elements.playerTitle.textContent = title;
  elements.playerSubtitle.textContent = `TorrServer Stream · File #${fileId}`;
  elements.playerFileName.textContent = title;

  const streamUrl = `${state.torrServerPublicUrl}/play/${hash}/${fileId}`;
  elements.videoPlayer.src = streamUrl;
  elements.videoPlayer.play().catch(() => {});

  elements.openDirectStream.href = streamUrl;
  elements.openVlc.href = `vlc://${streamUrl}`;

  // Save to continue watching
  saveToContinueWatching(title, streamUrl, hash, fileId);
};

function saveToContinueWatching(title, url, hash, fileId) {
  const item = {
    title,
    url,
    hash,
    fileId,
    timestamp: Date.now(),
    poster: state.selectedMedia?.posterPath ? tmdbImage(state.selectedMedia.posterPath, "w300") : "",
  };
  state.continueWatching = [item, ...state.continueWatching.filter((x) => x.url !== url)].slice(0, 10);
  try {
    localStorage.setItem("cinewave.continueWatching", JSON.stringify(state.continueWatching));
  } catch {}
}

function renderContinueWatching() {
  if (!state.continueWatching.length) {
    elements.continueSection.classList.add("hidden");
    return;
  }
  elements.continueSection.classList.remove("hidden");
  elements.continueRow.innerHTML = state.continueWatching
    .map((item) => `
      <div class="continue-card" onclick="window.playTorrServerStream('${item.hash}', ${item.fileId}, '${escapeHtml(item.title)}')">
        <div class="continue-thumb">
          ${item.poster ? `<img src="${item.poster}" alt="${escapeHtml(item.title)}" />` : `<div class="poster-placeholder"><span>▶</span></div>`}
          <div class="continue-play-icon"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg></div>
          <div class="continue-progress-bar"><div class="continue-progress-fill" style="width: 45%;"></div></div>
        </div>
        <div class="continue-info">
          <h4>${escapeHtml(item.title)}</h4>
          <p>Bấm để xem tiếp</p>
        </div>
      </div>
    `)
    .join("");
}

elements.playerBackButton.onclick = () => {
  elements.videoPlayer.pause();
  navigateView(state.previousView || "discover");
};

/* -------------------------------------------------------------
 * 10. PREFERENCES & THEMES
 * ------------------------------------------------------------- */
async function updatePreferencesView() {
  try {
    const health = await fetchApi("/api/health");
    state.health = health;

    elements.prefTmdbStatus.textContent = health.tmdb?.configured ? "Đã kết nối TMDB ✓" : "Chưa cấu hình TMDB";
    elements.prefTmdbStatus.className = health.tmdb?.configured ? "status-text online" : "status-text offline";
    elements.prefTmdbMode.textContent = health.tmdb?.credentialMode || "None";

    elements.prefTorrStatus.textContent = health.torrServer?.online ? `Online (${health.torrServer?.version || ""})` : "Offline / Chưa bật";
    elements.prefTorrStatus.className = health.torrServer?.online ? "status-text online" : "status-text offline";
    elements.prefTorrVersion.textContent = health.torrServer?.version || "N/A";
    elements.prefTorrUrl.textContent = health.torrServerPublicUrl || "http://127.0.0.1:8090";

    elements.serverDot.className = health.torrServer?.online ? "status-dot online" : "status-dot offline";
    elements.serverLabel.textContent = health.torrServer?.online ? `TorrServer ${health.torrServer?.version || "Online"}` : "TorrServer Offline";
  } catch {}
}

elements.themeOptionBtns.forEach((btn) => {
  btn.onclick = () => {
    elements.themeOptionBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const theme = btn.dataset.themeSet;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("cinewave.theme", theme);
    } catch {}
    showToast("Đã đổi chủ đề!", `Chủ đề hiện tại: ${btn.querySelector("strong").textContent}`, "🎨");
  };
});

elements.clearHistoryBtn.onclick = () => {
  if (confirm("Xóa toàn bộ lịch sử xem tiếp?")) {
    state.continueWatching = [];
    localStorage.removeItem("cinewave.continueWatching");
    renderContinueWatching();
    showToast("Đã xóa lịch sử xem", "", "✓");
  }
};

/* -------------------------------------------------------------
 * 11. MODALS (Trailer & Quick Search)
 * ------------------------------------------------------------- */
window.openTrailer = (youtubeKey, title) => {
  elements.trailerModalTitle.textContent = `${title} — Official Trailer`;
  elements.trailerIframe.src = `https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1`;
  elements.trailerModal.showModal();
};

elements.trailerModalClose.onclick = () => {
  elements.trailerIframe.src = "";
  elements.trailerModal.close();
};

elements.trailerModal.addEventListener("click", (e) => {
  if (e.target === elements.trailerModal) {
    elements.trailerIframe.src = "";
    elements.trailerModal.close();
  }
});

// Quick Search Modal
function openQuickSearch() {
  elements.quickSearchModal.classList.remove("hidden");
  elements.quickSearchInput.value = "";
  elements.quickSearchResults.innerHTML = "";
  setTimeout(() => elements.quickSearchInput.focus(), 50);
}

function closeQuickSearch() {
  elements.quickSearchModal.classList.add("hidden");
}

elements.quickSearchButton.onclick = openQuickSearch;
elements.quickSearchCloseBtn.onclick = closeQuickSearch;

elements.quickSearchModal.addEventListener("click", (e) => {
  if (e.target === elements.quickSearchModal) closeQuickSearch();
});

let quickSearchTimer = null;
elements.quickSearchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  if (quickSearchTimer) clearTimeout(quickSearchTimer);
  if (query.length < 2) {
    elements.quickSearchResults.innerHTML = "";
    return;
  }
  quickSearchTimer = setTimeout(async () => {
    try {
      const data = await fetchApi(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
      elements.quickSearchResults.innerHTML = (data.items || [])
        .slice(0, 8)
        .map((item) => {
          const poster = tmdbImage(item.posterPath, "w185");
          return `
            <div class="quick-search-item" onclick="window.openMediaDetail('${item.mediaType}', ${item.id}); document.getElementById('quickSearchModal').classList.add('hidden');" style="display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 8px; cursor: pointer; background: rgba(255,255,255,0.03);">
              ${poster ? `<img src="${poster}" style="width: 36px; height: 50px; border-radius: 4px; object-fit: cover;" />` : ""}
              <div>
                <strong style="display: block; font-size: 13px;">${escapeHtml(item.title)}</strong>
                <small style="color: var(--text-dim);">${item.year || ""} · ⭐ ${item.rating?.toFixed(1) || "7.5"}</small>
              </div>
            </div>
          `;
        })
        .join("");
    } catch {}
  }, 300);
});

// Global Keyboard Shortcut: '/' to open search, 'Esc' to close
window.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
    e.preventDefault();
    openQuickSearch();
  } else if (e.key === "Escape") {
    closeQuickSearch();
    if (elements.trailerModal.open) {
      elements.trailerIframe.src = "";
      elements.trailerModal.close();
    }
  }
});

// Watchlist Toggle
window.toggleWatchlist = (mediaType, id) => {
  const key = `${mediaType}:${id}`;
  if (state.watchlist.has(key)) {
    state.watchlist.delete(key);
    showToast("Đã xóa khỏi danh sách yêu thích", "", "☆");
  } else {
    state.watchlist.add(key);
    showToast("Đã thêm vào danh sách yêu thích", "", "★");
  }
  try {
    localStorage.setItem("cinewave.watchlist", JSON.stringify([...state.watchlist]));
  } catch {}
  const btn = $("#bookmarkBtn");
  if (btn) btn.innerHTML = `<span>${state.watchlist.has(key) ? "★ Đã lưu" : "☆ Yêu thích"}</span>`;
};

// Initial Setup
elements.navLinks.forEach((btn) => {
  btn.onclick = () => navigateView(btn.dataset.view);
});

elements.setupSearchButton.onclick = () => navigateView("search");

// Health check on startup
updatePreferencesView();

// Start on correct route based on pathname
const initialPath = window.location.pathname;
if (initialPath === "/discover") {
  navigateView("discover-hub", false);
} else if (initialPath === "/anime") {
  navigateView("anime", false);
} else if (initialPath === "/search") {
  navigateView("search", false);
} else if (initialPath === "/manage") {
  navigateView("manage", false);
} else if (initialPath === "/preferences") {
  navigateView("preferences", false);
} else {
  navigateView("discover", false);
}
