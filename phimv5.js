/* KKPhim Plugin v5.0 - Complete Rebuild */
(function () {
  "use strict";
  if (window.__kkphim_v5) return;
  window.__kkphim_v5 = true;

  // ══════════════════════════════════════════
  // CONSTANTS
  // ══════════════════════════════════════════
  var VERSION = "5.0";
  var STG_KEY = "kkv5_settings";
  var CW_KEY = "kkv5_cw";
  var HIST_KEY = "kkv5_history";
  var PROG_KEY = "kkv5_progress";
  var CSS_URL = "https://nguyenquocngu93.github.io/fshare/cssv5.css";

  var SOURCES = {
    kkphim: {
      key: "kkphim",
      name: "KKPhim",
      api: "https://phimapi.com/",
      img: "https://phimimg.com/",
    },
    ophim: {
      key: "ophim",
      name: "OPhim",
      api: "https://ophim1.com/",
      img: "https://img.ophim.live/uploads/movies/",
    },
  };

  var TMDB_TOKEN =
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0";
  var TMDB_IMG = "https://image.tmdb.org/t/p/original";
  var TMDB_W500 = "https://image.tmdb.org/t/p/w500";
  var TMDB_W300 = "https://image.tmdb.org/t/p/w300";
  var TIO_BASE = "https://torrentio.strem.fun";

  var _genreCache = { movie: null, tv: null };
  var _playUrl = null;
  var _playCwId = null;
  var _progressIv = null;
  var _lastSave = 0;

  // ══════════════════════════════════════════
  // UTILITIES
  // ══════════════════════════════════════════
  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  function $(sel) {
    if (typeof sel === "string") {
      if (sel.charAt(0) === "<") {
        var d = document.createElement("div");
        d.innerHTML = sel.trim();
        return new Dom(
          d.children.length === 1 ? [d.children[0]] : Array.from(d.childNodes)
        );
      }
      return new Dom(Array.from(document.querySelectorAll(sel)));
    }
    if (sel instanceof Dom) return sel;
    if (sel instanceof HTMLElement) return new Dom([sel]);
    if (sel && sel.jquery) return sel; // Lampa jQuery
    return new Dom([]);
  }
  // Use Lampa's jQuery
  var $L = window.jQuery || window.$;

  // ── Settings helpers ──
  function getSetting(k, def) {
    try {
      var s = JSON.parse(localStorage.getItem(STG_KEY) || "{}");
      return s[k] !== undefined ? s[k] : def;
    } catch (e) {
      return def;
    }
  }
  function setSetting(obj) {
    try {
      var s = JSON.parse(localStorage.getItem(STG_KEY) || "{}");
      Object.keys(obj).forEach(function (k) {
        s[k] = obj[k];
      });
      localStorage.setItem(STG_KEY, JSON.stringify(s));
    } catch (e) {}
  }
  function allSettings() {
    try {
      return JSON.parse(localStorage.getItem(STG_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  // Shorthand settings
  function tmdbLang() {
    return getSetting("tmdb_lang", "vi-VN");
  }
  function tsHost() {
    return getSetting("ts_host", "");
  }
  function tsPass() {
    return getSetting("ts_pass", "");
  }
  function tioConfig() {
    return getSetting("tio_config", "");
  }
  function aioUrl() {
    return getSetting("aio_url", "");
  }
  function torrentEngine() {
    return getSetting("torrent_engine", "torrentio");
  }
  function rowLimit() {
    return parseInt(getSetting("row_limit", "20"));
  }
  function cardStyle() {
    return getSetting("card_style", "landscape");
  }

  // ── Storage: CW, History, Progress ──
  function getCW() {
    try {
      return JSON.parse(localStorage.getItem(CW_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function saveCW(arr) {
    try {
      localStorage.setItem(CW_KEY, JSON.stringify(arr));
    } catch (e) {}
  }
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HIST_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function saveHistoryArr(arr) {
    try {
      localStorage.setItem(HIST_KEY, JSON.stringify(arr));
    } catch (e) {}
  }
  function getProgressMap() {
    try {
      return JSON.parse(localStorage.getItem(PROG_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveProgressMap(m) {
    try {
      localStorage.setItem(PROG_KEY, JSON.stringify(m));
    } catch (e) {}
  }

  // ── Text/HTML helpers ──
  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function stripHtml(s) {
    return String(s || "")
      .replace(/<[^>]+>/g, "")
      .trim();
  }
  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, "")
      .replace(/\s+/g, " ");
  }
  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function fmtTime(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    sec = Math.floor(sec);
    var h = Math.floor(sec / 3600),
      m = Math.floor((sec % 3600) / 60),
      s = sec % 60;
    return h > 0 ? h + ":" + pad(m) + ":" + pad(s) : m + ":" + pad(s);
  }
  function delay(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  // ── Throttle & RAF ──
  function throttle(fn, ms) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  function batchAppend(parent, els) {
    var f = document.createDocumentFragment();
    for (var i = 0; i < els.length; i++) {
      var node = els[i] instanceof $L ? els[i][0] : els[i];
      if (!node) continue;
      if (node.parentNode) {
        try {
          node.parentNode.removeChild(node);
        } catch (e) {}
      }
      f.appendChild(node);
    }
    var p = parent instanceof $L ? parent[0] : parent;
    if (p) p.appendChild(f);
  }

  // ── Touch-safe click binding ──
  function bindClick(el, fn) {
    if (!el || !el.length || typeof fn !== "function") return;
    var sx = 0,
      sy = 0,
      moved = false,
      touched = false;
    var dom = el[0];

    if (dom && dom.addEventListener) {
      dom.addEventListener(
        "touchstart",
        function (e) {
          var t = (e.touches || [])[0];
          if (t) {
            sx = t.clientX;
            sy = t.clientY;
            moved = false;
          }
        },
        { passive: true }
      );

      dom.addEventListener(
        "touchmove",
        function (e) {
          var t = (e.touches || [])[0];
          if (
            t &&
            (Math.abs(t.clientX - sx) > 12 || Math.abs(t.clientY - sy) > 12)
          )
            moved = true;
        },
        { passive: true }
      );

      dom.addEventListener(
        "touchend",
        function (e) {
          if (moved) return;
          touched = true;
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
          fn.call(dom, e);
          setTimeout(function () {
            touched = false;
          }, 350);
        },
        { passive: false }
      );
    }

    el.on("click", function (e) {
      if (touched || moved) return;
      e.preventDefault();
      e.stopPropagation();
      fn.call(this, e);
    });

    el.on("hover:enter", function (e) {
      fn.call(this, e);
    });
  }

  // ── Scroll setup (120Hz optimized) ──
  function setupScroll(scroll) {
    var el = scroll.render();
    el.css({ overflow: "hidden", position: "relative", height: "100%" });
    var body = el.find(".scroll__body");

    var styles = {
      transform: "translate3d(0,0,0)",
      "-webkit-transform": "translate3d(0,0,0)",
      "overflow-y": "auto",
      "overflow-x": "hidden",
      "-webkit-overflow-scrolling": "touch",
      height: "100%",
      "padding-bottom": "8em",
      "touch-action": "pan-y",
      "will-change": "transform",
      contain: "layout paint",
      "backface-visibility": "hidden",
      "-webkit-backface-visibility": "hidden",
      "overscroll-behavior": "contain",
    };

    body.css($L.extend({ position: "relative" }, styles));

    if (body[0]) {
      Object.keys(styles).forEach(function (k) {
        body[0].style.setProperty(k, styles[k], "important");
      });
    }

    if (isMobile()) {
      body.css({ "scroll-behavior": "auto", transition: "none" });
    }
  }

  function clearScroll(scroll) {
    try {
      scroll.render().find(".scroll__body").empty();
    } catch (e) {}
  }

  function activateController(scroll) {
    Lampa.Controller.add("content", {
      toggle: function () {
        Lampa.Controller.collectionSet(scroll.render());
        Lampa.Controller.collectionFocus(false, scroll.render());
      },
      left: function () {
        if (Navigator.canmove("left")) Navigator.move("left");
        else Lampa.Controller.toggle("menu");
      },
      right: function () {
        Navigator.move("right");
      },
      up: function () {
        if (Navigator.canmove("up")) Navigator.move("up");
        else Lampa.Controller.toggle("head");
      },
      down: function () {
        Navigator.move("down");
      },
      back: function () {
        Lampa.Activity.backward();
      },
    });
    setTimeout(function () {
      Lampa.Controller.toggle("content");
      Lampa.Controller.collectionSet(scroll.render());
      Lampa.Controller.collectionFocus(false, scroll.render());
    }, 0);
  }

  // ══════════════════════════════════════════
  // PROGRESS TRACKING
  // ══════════════════════════════════════════
  function makeProgressKey(url, cwId) {
    var src = cwId || url || "";
    if (!src) return "";
    try {
      return btoa(unescape(encodeURIComponent(src)))
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 50);
    } catch (e) {
      return src.substring(0, 50);
    }
  }

  function saveProgress(url, time, dur, cwId) {
    if (!url || !time || !dur || time < 5 || dur < 10) return;
    var m = getProgressMap();
    var k = makeProgressKey(url, cwId);
    m[k] = {
      url: url,
      cwId: cwId || "",
      time: Math.floor(time),
      duration: Math.floor(dur),
      percent: Math.min(99, Math.floor((time / dur) * 100)),
      ts: Date.now(),
    };
    // Cleanup old entries
    var keys = Object.keys(m);
    if (keys.length > 300) {
      keys.sort(function (a, b) {
        return (m[a].ts || 0) - (m[b].ts || 0);
      });
      for (var i = 0; i < keys.length - 300; i++) delete m[keys[i]];
    }
    saveProgressMap(m);
  }

  function getProgressFor(url, cwId) {
    var m = getProgressMap();
    var k = makeProgressKey(url, cwId);
    var r = m[k];
    if (!r && cwId) r = m[makeProgressKey(url)];
    if (!r) return null;
    if (Date.now() - r.ts > 30 * 86400000) {
      delete m[k];
      saveProgressMap(m);
      return null;
    }
    return r;
  }

  function clearProgress(url, cwId) {
    var m = getProgressMap();
    delete m[makeProgressKey(url, cwId)];
    if (cwId) delete m[makeProgressKey(url)];
    saveProgressMap(m);
  }

  function startTracking(url, cwId) {
    stopTracking();
    _playUrl = url;
    _playCwId = cwId || null;
    _lastSave = 0;
    _progressIv = setInterval(function () {
      try {
        var v = document.querySelector("video");
        if (v && v.currentTime > 0 && v.duration > 10) {
          var now = Date.now();
          if (now - _lastSave >= 5000) {
            _lastSave = now;
            saveProgress(_playUrl, v.currentTime, v.duration, _playCwId);
            updateCWProgress(_playCwId, v.currentTime, v.duration);
          }
        }
      } catch (e) {}
    }, 5000);
  }

  function stopTracking() {
    if (_progressIv) {
      clearInterval(_progressIv);
      _progressIv = null;
    }
    try {
      var v = document.querySelector("video");
      if (v && _playUrl && v.currentTime > 0 && v.duration > 10) {
        saveProgress(_playUrl, v.currentTime, v.duration, _playCwId);
        updateCWProgress(_playCwId, v.currentTime, v.duration);
      }
    } catch (e) {}
    _playUrl = null;
    _playCwId = null;
  }

  function updateCWProgress(cwId, time, dur) {
    if (!cwId || !dur || dur < 10) return;
    try {
      var arr = getCW();
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].id === cwId) {
          arr[i].prog_time = Math.floor(time);
          arr[i].prog_dur = Math.floor(dur);
          arr[i].prog_pct = Math.min(99, Math.floor((time / dur) * 100));
          saveCW(arr);
          return;
        }
      }
    } catch (e) {}
  }

  // ══════════════════════════════════════════
  // HISTORY & CONTINUE WATCHING
  // ══════════════════════════════════════════
  function addHistory(item) {
    try {
      if (!item || !item.name) return;
      var arr = getHistory();
      var id = (item.source || "") + "_" + (item.slug || item.tmdb_id || "");
      arr = arr.filter(function (x) {
        return x.id !== id;
      });
      arr.unshift(
        $L.extend({}, item, { id: id, hist_time: Date.now() })
      );
      if (arr.length > 60) arr = arr.slice(0, 60);
      saveHistoryArr(arr);
    } catch (e) {}
  }

  function addContinueWatching(item, epName, link, poster, backdrop) {
    try {
      if (!item || !item.name) return;
      var arr = getCW();
      var nk = normalize(item.name || item.origin_name || "");
      var id = nk + "_" + (epName || "movie");
      arr = arr.filter(function (x) {
        return x.id !== id;
      });
      var pg = getProgressFor(link, id);
      arr.unshift({
        id: id,
        source: item.source || "",
        slug: item.slug || "",
        name: item.name || "",
        origin_name: item.origin_name || "",
        poster_url: poster || backdrop || item.poster_url || "",
        thumb_url: backdrop || poster || item.thumb_url || "",
        year: item.year || "",
        quality: item.quality || "",
        tmdb: item.tmdb || {},
        type: item.type || "",
        ep_name: epName || "",
        ep_link: link || "",
        prog_time: pg ? pg.time : 0,
        prog_dur: pg ? pg.duration : 0,
        prog_pct: pg ? pg.percent : 0,
        cw_time: Date.now(),
      });
      if (arr.length > 50) arr = arr.slice(0, 50);
      saveCW(arr);
    } catch (e) {}
  }

  // ══════════════════════════════════════════
  // PLAYBACK
  // ══════════════════════════════════════════
  function resumeVideo(time) {
    if (!time || time < 5) return;
    var attempts = 0;
    var iv = setInterval(function () {
      attempts++;
      try {
        var v = document.querySelector("video");
        if (v && v.readyState >= 2 && v.duration > 10) {
          v.currentTime = time;
          clearInterval(iv);
          Lampa.Noty.show("▶ " + fmtTime(time));
        }
      } catch (e) {}
      if (attempts > 40) clearInterval(iv);
    }, 500);
  }

  function playWithResume(title, url, poster, backdrop, itemData, epName) {
    if (!url) {
      Lampa.Noty.show("Không có link phát");
      return;
    }

    var cwId = "";
    if (itemData) {
      cwId =
        normalize(itemData.name || itemData.origin_name || "") +
        "_" +
        (epName || "movie");
    }

    var pg = getProgressFor(url, cwId);
    if (!pg && cwId) {
      var cwArr = getCW();
      for (var i = 0; i < cwArr.length; i++) {
        if (cwArr[i].id === cwId && cwArr[i].prog_time > 0) {
          pg = {
            time: cwArr[i].prog_time,
            duration: cwArr[i].prog_dur,
            percent: cwArr[i].prog_pct,
          };
          break;
        }
      }
    }

    if (pg && pg.time > 10 && pg.percent < 95) {
      Lampa.Select.show({
        title: "Tiếp tục xem?",
        items: [
          {
            title:
              "▶️ Tiếp tục từ " +
              fmtTime(pg.time) +
              " (" +
              pg.percent +
              "%)",
            value: "resume",
          },
          { title: "🔄 Xem từ đầu", value: "restart" },
        ],
        onSelect: function (a) {
          if (a.value === "resume")
            doPlay(title, url, pg.time, poster, backdrop, itemData, epName, cwId);
          else {
            clearProgress(url, cwId);
            doPlay(title, url, 0, poster, backdrop, itemData, epName, cwId);
          }
        },
        onBack: function () {
          Lampa.Controller.toggle("content");
        },
      });
    } else {
      doPlay(title, url, 0, poster, backdrop, itemData, epName, cwId);
    }
  }

  function doPlay(title, url, resumeTime, poster, backdrop, itemData, epName, cwId) {
    if (itemData)
      addContinueWatching(
        itemData,
        epName || "",
        url,
        poster || "",
        backdrop || ""
      );
    startTracking(url, cwId);

    var playUrl = url;
    if (
      tsHost() &&
      url.indexOf(tsHost().replace(/https?:\/\//, "")) > -1 &&
      url.indexOf("preload") === -1
    ) {
      playUrl += url.indexOf("?") > -1 ? "&preload" : "?preload";
    }

    Lampa.Player.play({ title: title, url: playUrl });
    if (resumeTime > 0) resumeVideo(resumeTime);
  }

  // ══════════════════════════════════════════
  // IMAGE HELPERS
  // ══════════════════════════════════════════
  function sourceImg(url, source) {
    if (!url) return "";
    if (url.indexOf("http") === 0) return url;
    var s = source || SOURCES.ophim;
    return s.img ? s.img + url : url;
  }

  function tmdbPoster(path) {
    return path ? TMDB_W300 + path : "";
  }
  function tmdbBackdrop(path) {
    return path ? TMDB_W500 + path : "";
  }
  function tmdbOriginal(path) {
    return path ? TMDB_IMG + path : "";
  }

  // ══════════════════════════════════════════
  // TMDB API
  // ══════════════════════════════════════════
  async function tmdbFetch(path) {
    var r = await fetch("https://api.themoviedb.org/3" + path, {
      headers: {
        Authorization: "Bearer " + TMDB_TOKEN,
        "Content-Type": "application/json",
      },
    });
    if (!r.ok) throw new Error("TMDB " + r.status);
    return await r.json();
  }

  async function tmdbFetchFallback(path) {
    var d = await tmdbFetch(path);
    if (!d.overview || !d.overview.trim()) {
      var lang = tmdbLang();
      if (lang !== "en-US") {
        try {
          var en = await tmdbFetch(
            path.replace("language=" + lang, "language=en-US")
          );
          if (en.overview && en.overview.trim()) {
            d.overview = en.overview;
            d._fallback = true;
          }
        } catch (e) {}
      }
    }
    return d;
  }

  async function tmdbGetImdb(type, id) {
    if (!id) return null;
    try {
      return (await tmdbFetch("/" + type + "/" + id + "/external_ids")).imdb_id || null;
    } catch (e) {
      return null;
    }
  }

  async function tmdbSeasons(id) {
    try {
      var r = await tmdbFetch("/tv/" + id + "?language=" + tmdbLang());
      if (r && r.seasons)
        return r.seasons
          .filter(function (s) {
            return s.season_number > 0;
          })
          .map(function (s) {
            return {
              season_number: s.season_number,
              name: s.name || "Season " + s.season_number,
              episode_count: s.episode_count || 0,
            };
          });
    } catch (e) {}
    return [];
  }

  async function tmdbGenres(type) {
    if (_genreCache[type]) return _genreCache[type];
    try {
      var r = await tmdbFetch(
        "/genre/" + type + "/list?language=" + tmdbLang()
      );
      _genreCache[type] = r.genres || [];
      return _genreCache[type];
    } catch (e) {
      return [];
    }
  }

  async function tmdbPersonCredits(pid) {
    try {
      return await tmdbFetch(
        "/person/" + pid + "/combined_credits?language=" + tmdbLang()
      );
    } catch (e) {
      return null;
    }
  }

  async function tmdbSearch(q, page) {
    return await tmdbFetch(
      "/search/multi?language=" +
        tmdbLang() +
        "&query=" +
        encodeURIComponent(q) +
        "&page=" +
        (page || 1)
    );
  }

  async function tmdbDetail(type, id) {
    return await tmdbFetchFallback(
      "/" +
        type +
        "/" +
        id +
        "?language=" +
        tmdbLang() +
        "&append_to_response=credits,images,similar,external_ids"
    );
  }

  async function tmdbImages(type, id) {
    return await tmdbFetch("/" + type + "/" + id + "/images");
  }

  async function tmdbDiscover(type, genreId, page) {
    return await tmdbFetch(
      "/discover/" +
        type +
        "?language=" +
        tmdbLang() +
        "&sort_by=popularity.desc&with_genres=" +
        genreId +
        "&page=" +
        (page || 1)
    );
  }

  async function tmdbSimilar(type, id, page) {
    return await tmdbFetch(
      "/" +
        type +
        "/" +
        id +
        "/similar?language=" +
        tmdbLang() +
        "&page=" +
        (page || 1)
    );
  }

  // TMDB list endpoints
  var TMDB_LISTS = {
    trending: function (p) {
      return tmdbFetch(
        "/trending/all/week?language=" + tmdbLang() + "&page=" + p
      );
    },
    trending_day: function (p) {
      return tmdbFetch(
        "/trending/all/day?language=" + tmdbLang() + "&page=" + p
      );
    },
    popular_movies: function (p) {
      return tmdbFetch(
        "/movie/popular?language=" + tmdbLang() + "&page=" + p
      );
    },
    popular_tv: function (p) {
      return tmdbFetch("/tv/popular?language=" + tmdbLang() + "&page=" + p);
    },
    top_movies: function (p) {
      return tmdbFetch(
        "/movie/top_rated?language=" + tmdbLang() + "&page=" + p
      );
    },
    top_tv: function (p) {
      return tmdbFetch(
        "/tv/top_rated?language=" + tmdbLang() + "&page=" + p
      );
    },
    now_playing: function (p) {
      return tmdbFetch(
        "/movie/now_playing?language=" + tmdbLang() + "&page=" + p
      );
    },
    upcoming: function (p) {
      return tmdbFetch(
        "/movie/upcoming?language=" + tmdbLang() + "&page=" + p
      );
    },
    airing_today: function (p) {
      return tmdbFetch(
        "/tv/airing_today?language=" + tmdbLang() + "&page=" + p
      );
    },
    on_the_air: function (p) {
      return tmdbFetch(
        "/tv/on_the_air?language=" + tmdbLang() + "&page=" + p
      );
    },
  };

  var RANDOM_KEYS = [
    "trending",
    "popular_movies",
    "popular_tv",
    "top_movies",
    "top_tv",
    "now_playing",
    "airing_today",
  ];

  function tmdbNormalize(item) {
    if (!item) return null;
    var mt = item.media_type || (item.first_air_date ? "tv" : "movie");
    return {
      tmdb_id: item.id,
      media_type: mt,
      name: item.title || item.name || "",
      poster_url: tmdbPoster(item.poster_path),
      backdrop_url: tmdbBackdrop(item.backdrop_path),
      year: (item.release_date || item.first_air_date || "").slice(0, 4),
      vote: item.vote_average ? Number(item.vote_average).toFixed(1) : "",
    };
  }

  function getLogo(images) {
    if (!images || !images.logos || !images.logos.length) return null;
    return (
      images.logos.find(function (l) {
        return l.iso_639_1 === "vi";
      }) ||
      images.logos.find(function (l) {
        return l.iso_639_1 === "en";
      }) ||
      images.logos[0] ||
      null
    );
  }

  // ══════════════════════════════════════════
  // SOURCE API (KKPhim / OPhim)
  // ══════════════════════════════════════════
  async function sourceSearch(source, keyword) {
    try {
      var r = await fetch(
        source.api +
          "v1/api/tim-kiem?keyword=" +
          encodeURIComponent(keyword) +
          "&page=1"
      );
      if (!r.ok) return [];
      var d = await r.json();
      return (d && d.data && d.data.items) || (d && d.items) || [];
    } catch (e) {
      return [];
    }
  }

  function bestMatch(items, title, orig, year) {
    if (!items || !items.length) return null;
    var nT = normalize(title),
      nO = normalize(orig);
    // Exact match
    for (var i = 0; i < items.length; i++) {
      var n1 = normalize(items[i].name || items[i].title || "");
      var n2 = normalize(items[i].origin_name || items[i].original_name || "");
      if ((nT && (n1 === nT || n2 === nT)) || (nO && (n1 === nO || n2 === nO))) {
        if (!year || !items[i].year || String(items[i].year) === String(year))
          return items[i];
      }
    }
    // Partial match
    for (var j = 0; j < items.length; j++) {
      var m1 = normalize(items[j].name || items[j].title || "");
      var m2 = normalize(items[j].origin_name || items[j].original_name || "");
      if (
        (nT && (m1.indexOf(nT) > -1 || nT.indexOf(m1) > -1)) ||
        (nO && (m2.indexOf(nO) > -1 || nO.indexOf(m2) > -1))
      ) {
        if (!year || !items[j].year || String(items[j].year) === String(year))
          return items[j];
      }
    }
    return null;
  }

  async function findSlugs(title, orig, year) {
    var result = { kkphim: null, ophim: null };
    var terms = [title];
    if (orig && orig !== title) terms.push(orig);

    for (var i = 0; i < terms.length; i++) {
      if (!result.kkphim) {
        var f1 = bestMatch(
          await sourceSearch(SOURCES.kkphim, terms[i]),
          title,
          orig,
          year
        );
        if (f1 && f1.slug) result.kkphim = f1.slug;
      }
      if (!result.ophim) {
        var f2 = bestMatch(
          await sourceSearch(SOURCES.ophim, terms[i]),
          title,
          orig,
          year
        );
        if (f2 && f2.slug) result.ophim = f2.slug;
      }
      if (result.kkphim && result.ophim) break;
    }
    return result;
  }

  async function fetchDetail(source, slug) {
    try {
      var r = await fetch(source.api + "phim/" + slug);
      if (!r.ok) return null;
      var d = await r.json();
      return { movie: d.movie || d || {}, episodes: d.episodes || [] };
    } catch (e) {
      return null;
    }
  }

  function extractSeasonNum(name, slug) {
    var m =
      name.match(/season\s*(\d+)/i) ||
      name.match(/phần\s*(\d+)/i) ||
      slug.match(/season-(\d+)/i) ||
      slug.match(/phan-(\d+)/i) ||
      name.match(/S(\d+)/);
    if (m) return parseInt(m[1]);
    var nm2 = name.match(/(\d+)$/) || slug.match(/-(\d+)$/);
    if (nm2) {
      var n = parseInt(nm2[1]);
      if (n >= 2 && n <= 30) return n;
    }
    return 1;
  }

  async function findSeasonSlugs(source, title, orig) {
    var results = [];
    try {
      var items = await sourceSearch(source, title);
      if (!items.length && orig) items = await sourceSearch(source, orig);
      var nT = normalize(title),
        nO = normalize(orig);
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.slug) continue;
        var n1 = normalize(it.name || it.title || "");
        var n2 = normalize(it.origin_name || it.original_name || "");
        var ok = false;
        if (nT && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1 || n1 === nT))
          ok = true;
        if (nO && (n2.indexOf(nO) > -1 || nO.indexOf(n2) > -1 || n2 === nO))
          ok = true;
        if (ok)
          results.push({
            slug: it.slug,
            name: it.name || it.title || "",
            season: extractSeasonNum(it.name || it.title || "", it.slug || ""),
            source: source,
          });
      }
    } catch (e) {}
    return results;
  }

  function getMediaType(data) {
    if (data && data.tmdb && data.tmdb.type === "tv") return "tv";
    if (data && data.tmdb && data.tmdb.type === "movie") return "movie";
    if (
      data &&
      (data.type === "series" ||
        data.type === "tvshows" ||
        data.type === "hoathinh")
    )
      return "tv";
    if (data && data.episode_total && data.episode_total !== "1") return "tv";
    return "movie";
  }

  // ══════════════════════════════════════════
  // TORRSERVER
  // ══════════════════════════════════════════
  function tsUrl(path) {
    var h = tsHost();
    if (!h) return "";
    h = h.replace(/\/+$/, "");
    if (h.indexOf("http") !== 0) h = "http://" + h;
    return h + path;
  }

  function tsHeaders() {
    var h = { "Content-Type": "application/json" };
    var pw = tsPass();
    if (pw) h["Authorization"] = "Basic " + btoa("admin:" + pw);
    return h;
  }

  function makeMagnet(hash) {
    return (
      "magnet:?xt=urn:btih:" +
      hash +
      "&tr=" +
      encodeURIComponent("udp://tracker.opentrackr.org:1337/announce")
    );
  }

  async function tsSpeedTest() {
    var h = tsHost();
    if (!h) return { ok: false, msg: "Chưa cấu hình" };
    try {
      var t0 = Date.now();
      var r = await fetch(tsUrl("/echo"), { method: "GET", headers: tsHeaders() });
      var ping = Date.now() - t0;
      if (!r.ok) return { ok: false, msg: "HTTP " + r.status, ping: ping };

      var r2 = await fetch(tsUrl("/settings"), {
        method: "POST",
        headers: tsHeaders(),
        body: JSON.stringify({ action: "get" }),
      });
      var settings = null;
      try {
        settings = await r2.json();
      } catch (e) {}

      var r3 = await fetch(tsUrl("/torrents"), {
        method: "POST",
        headers: tsHeaders(),
        body: JSON.stringify({ action: "list" }),
      });
      var torrents = [];
      try {
        torrents = await r3.json();
        if (!Array.isArray(torrents)) torrents = [];
      } catch (e) {}

      return {
        ok: true,
        ping: ping,
        settings: settings,
        torrents: torrents,
        version: settings ? settings.TorrServerVersion || "?" : "?",
        msg:
          "Ping: " +
          ping +
          "ms | Torrents: " +
          torrents.length +
          (settings ? " | v" + (settings.TorrServerVersion || "?") : ""),
      };
    } catch (e) {
      return { ok: false, msg: e.message || "Lỗi kết nối" };
    }
  }

  async function tsClearAll() {
    try {
      var r = await fetch(tsUrl("/torrents"), {
        method: "POST",
        headers: tsHeaders(),
        body: JSON.stringify({ action: "list" }),
      });
      var list = await r.json();
      if (!Array.isArray(list)) return 0;
      var count = 0;
      for (var i = 0; i < list.length; i++) {
        try {
          await fetch(tsUrl("/torrents"), {
            method: "POST",
            headers: tsHeaders(),
            body: JSON.stringify({ action: "rem", hash: list[i].hash }),
          });
          count++;
        } catch (e) {}
      }
      return count;
    } catch (e) {
      return -1;
    }
  }

  async function playTorrServer(stream, title, poster, itemData, epName) {
    if (!tsHost()) {
      Lampa.Noty.show("Chưa cấu hình TorrServer!");
      return;
    }
    Lampa.Noty.show("Đang gửi tới TorrServer...");

    try {
      var u = tsUrl("/torrents");
      var r = await fetch(u, {
        method: "POST",
        headers: tsHeaders(),
        body: JSON.stringify({
          action: "add",
          link: makeMagnet(stream.infoHash),
          title: title || "",
          poster: poster || "",
          save_to_db: false,
        }),
      });
      if (!r.ok) throw new Error("TS: " + r.status);

      var td = await r.json();
      var hash = td.hash || stream.infoHash;

      await delay(2000);

      var info = null,
        retry = 0;
      while (retry < 3) {
        try {
          var r2 = await fetch(u, {
            method: "POST",
            headers: tsHeaders(),
            body: JSON.stringify({ action: "get", hash: hash }),
          });
          info = await r2.json();
          if (info && info.file_stats && info.file_stats.length) break;
        } catch (e) {}
        retry++;
        await delay(1500);
      }

      var files = [];
      if (info && info.file_stats)
        files = info.file_stats
          .filter(function (f) {
            return (f.path || "")
              .toLowerCase()
              .match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);
          })
          .sort(function (a, b) {
            return (a.id || 0) - (b.id || 0);
          });

      if (!files.length) {
        playWithResume(
          title,
          tsUrl("/stream/fname?link=" + hash + "&index=0&play&preload"),
          poster,
          "",
          itemData,
          epName
        );
      } else if (files.length === 1) {
        playWithResume(
          title,
          tsUrl(
            "/stream/fname?link=" +
              hash +
              "&index=" +
              (files[0].id || 0) +
              "&play&preload"
          ),
          poster,
          "",
          itemData,
          epName
        );
      } else {
        Lampa.Select.show({
          title: "Chọn file (" + files.length + ")",
          items: files.map(function (f) {
            var sz = f.length
              ? (f.length / 1073741824).toFixed(1) + " GB"
              : "";
            return {
              title:
                (f.path || "").split("/").pop() + (sz ? " [" + sz + "]" : ""),
              value: f,
            };
          }),
          onSelect: function (a) {
            playWithResume(
              title,
              tsUrl(
                "/stream/fname?link=" +
                  hash +
                  "&index=" +
                  (a.value.id || 0) +
                  "&play&preload"
              ),
              poster,
              "",
              itemData,
              epName
            );
          },
          onBack: function () {
            Lampa.Controller.toggle("content");
          },
        });
      }
    } catch (e) {
      Lampa.Noty.show("Lỗi TS: " + (e.message || ""));
    }
  }

  // ══════════════════════════════════════════
  // TORRENTIO / AIO STREAMS
  // ══════════════════════════════════════════
  function parseTioConfig(raw) {
    if (!raw) return "";
    raw = String(raw).trim();
    if (!raw) return "";
    var m = raw.match(
      /torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i
    );
    if (m) return m[1];
    m = raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);
    if (m) return m[1].replace(/\/+$/, "");
    m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);
    if (m) return m[1];
    if (raw.indexOf("torrentio.strem.fun") > -1) {
      raw = raw
        .replace(/^https?:\/\/torrentio\.strem\.fun\/?/i, "")
        .replace(
          /\/(manifest\.json|stream\/.*|configure\/?.*)?$/i,
          ""
        )
        .replace(/^\/+|\/+$/g, "");
      if (raw && raw.indexOf("=") > -1) return raw.replace(/\|/g, "%7C");
      return "";
    }
    raw = raw.replace(/^\/+|\/+$/g, "").replace(/\|/g, "%7C");
    return raw.indexOf("=") === -1 ? "" : raw;
  }

  function parseAioUrl(raw) {
    if (!raw) return "";
    return String(raw)
      .trim()
      .replace(/\/manifest\.json\s*$/i, "")
      .replace(/\/+$/, "");
  }

  function makeTioUrl(type, imdb, s, e) {
    var t = type === "tv" ? "series" : "movie";
    var id = imdb;
    if (type === "tv" && s && e) id = imdb + ":" + s + ":" + e;
    var c = parseTioConfig(tioConfig());
    return TIO_BASE + (c ? "/" + c : "") + "/stream/" + t + "/" + id + ".json";
  }

  function makeAioUrl(type, imdb, s, e) {
    var base = parseAioUrl(aioUrl());
    if (!base) return "";
    var t = type === "tv" ? "series" : "movie";
    var id = imdb;
    if (type === "tv" && s && e) id = imdb + ":" + s + ":" + e;
    return base + "/stream/" + t + "/" + id + ".json";
  }

  function parseStreamItem(st) {
    if (!st) return null;
    var rn = String(st.name || st.title || "");
    var rd = String(st.description || "");
    var combined = rn + "\n" + rd;

    var name = "",
      source = "",
      seeds = "",
      size = "",
      quality = "",
      filename = "";

    // Name
    var lines = rn.split("\n");
    var firstLine = lines[0].trim();
    var srcMatch = firstLine.match(/^\[([^\]]+)\]\s*(.*)/);
    if (srcMatch) {
      source = srcMatch[1].trim();
      name = srcMatch[2].trim();
    } else {
      name = firstLine.replace(/^[^\w\[({]*/, "").trim();
    }

    // Quality from rest of name
    if (lines.length > 1) {
      var qm = lines
        .slice(1)
        .join(" ")
        .match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);
      if (qm) quality = qm[1].toUpperCase();
    }

    // Parse description lines
    rd.split("\n").forEach(function (dl) {
      dl = dl.trim();
      if (!dl) return;
      if (!size) {
        var sm = dl.match(
          /[📀💾]\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i
        );
        if (sm) size = sm[1].trim();
      }
      if (!seeds) {
        var sdm = dl.match(/👤\s*(\d+)/);
        if (sdm) seeds = sdm[1];
      }
      if (!source) {
        var srcm = dl.match(/⚙️\s*(.+)/);
        if (srcm) source = srcm[1].trim();
      }
      if (!filename) {
        var fnm = dl.match(/📁\s*(.+)/);
        if (fnm) filename = fnm[1].trim();
      }
      if (!quality) {
        var qm2 = dl.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);
        if (qm2) quality = qm2[1].toUpperCase();
      }
    });

    // Fallbacks from combined
    if (!quality) {
      var qm3 = combined.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);
      if (qm3) quality = qm3[1].toUpperCase();
    }
    if (!size) {
      var sm2 = combined.match(/\b([\d.,]+)\s*(GB|GiB|MB|MiB|TB)\b/i);
      if (sm2) size = sm2[1] + " " + sm2[2];
    }
    if (!seeds) {
      var sdm2 = combined.match(/[Ss]eed(?:er)?s?[:\s]*(\d+)/);
      if (sdm2) seeds = sdm2[1];
    }

    // behaviorHints
    if (st.behaviorHints) {
      var bh = st.behaviorHints;
      if (!filename && bh.filename)
        filename = String(bh.filename).trim();
      if (!size && bh.videoSize) {
        var bytes = Number(bh.videoSize);
        if (!isNaN(bytes) && bytes > 0) {
          if (bytes >= 1099511627776)
            size = (bytes / 1099511627776).toFixed(2) + " TB";
          else if (bytes >= 1073741824)
            size = (bytes / 1073741824).toFixed(1) + " GB";
          else if (bytes >= 1048576)
            size = (bytes / 1048576).toFixed(0) + " MB";
        }
      }
      if (!source && bh.bingeGroup) {
        var bgm = String(bh.bingeGroup).match(/\|([^|]+)$/);
        if (bgm) source = bgm[1].trim();
      }
    }

    if (!name || name === "?") {
      if (filename)
        name = filename.replace(/\.\w{2,4}$/, "").replace(/\./g, " ");
    }

    return {
      name: name || "Unknown",
      infoHash: st.infoHash || "",
      fileIdx: st.fileIdx,
      url: st.url || "",
      size: size,
      seeds: seeds,
      quality: quality,
      source: source,
      filename: filename,
    };
  }

  async function fetchStreams(type, imdb, s, e) {
    var engine = torrentEngine();
    var url;
    if (engine === "aio") {
      url = makeAioUrl(type, imdb, s, e);
      if (!url) throw new Error("Chưa cấu hình AIO URL");
    } else {
      url = makeTioUrl(type, imdb, s, e);
    }
    var r = await fetch(url);
    if (!r.ok) throw new Error(engine + " HTTP " + r.status);
    var d = await r.json();
    var st = d.streams || [];
    if (!st.length) {
      if (Array.isArray(d)) st = d;
      else if (d.data && Array.isArray(d.data)) st = d.data;
    }
    return st.map(parseStreamItem).filter(function (s2) {
      return s2 && (s2.infoHash || s2.url);
    });
  }

  function formatStreamTitle(s) {
    var parts = [];
    var line1 = s.name || "Unknown";
    if (s.quality && line1.toUpperCase().indexOf(s.quality) === -1)
      line1 += " [" + s.quality + "]";
    parts.push(line1);
    var meta = [];
    if (s.size) meta.push("💾 " + s.size);
    if (s.seeds) meta.push("👤 " + s.seeds);
    if (s.source) meta.push("⚙️ " + s.source);
    if (meta.length) parts.push(meta.join("  "));
    if (s.filename && s.filename !== s.name) {
      var fn = s.filename;
      if (fn.length > 60) fn = fn.substring(0, 57) + "...";
      parts.push("📁 " + fn);
    }
    return parts.join("\n");
  }

  function showStreamPicker(streams, title, poster, itemData, epName) {
    var hasTS = !!tsHost();
    if (!streams.length) {
      Lampa.Noty.show("Không tìm thấy stream");
      return;
    }
    Lampa.Select.show({
      title: title + " (" + streams.length + ")",
      items: streams.slice(0, 50).map(function (s) {
        return { title: formatStreamTitle(s), value: s };
      }),
      onSelect: function (a) {
        var s = a.value;
        if (hasTS && s.infoHash)
          playTorrServer(s, title, poster, itemData, epName);
        else if (s.url)
          playWithResume(title, s.url, poster, "", itemData, epName);
        else
          Lampa.Noty.show(
            s.infoHash ? "Cần TorrServer để phát" : "Không có link"
          );
      },
      onBack: function () {
        Lampa.Controller.toggle("content");
      },
    });
  }

  async function openTorrentMovie(tmdbId, title, poster, imdb, itemData) {
    Lampa.Noty.show("Tìm torrent...");
    try {
      var id = imdb || (await tmdbGetImdb("movie", tmdbId));
      if (!id) {
        Lampa.Noty.show("Không tìm thấy IMDB ID");
        return;
      }
      var st = await fetchStreams("movie", id);
      if (!st.length) {
        Lampa.Noty.show("Không có torrent");
        return;
      }
      showStreamPicker(st, title, poster, itemData, "Torrent");
    } catch (e) {
      Lampa.Noty.show("Lỗi: " + (e.message || ""));
    }
  }

  async function openTorrentTV(tmdbId, title, poster, imdb, itemData) {
    Lampa.Noty.show("Đang tải danh sách season...");
    try {
      var id = imdb || (await tmdbGetImdb("tv", tmdbId));
      if (!id) {
        Lampa.Noty.show("Không tìm thấy IMDB ID");
        return;
      }
      var seasons = await tmdbSeasons(tmdbId);
      if (seasons.length > 1) {
        Lampa.Select.show({
          title: "Chọn Season",
          items: seasons.map(function (s) {
            return {
              title:
                s.name +
                (s.episode_count ? " (" + s.episode_count + " tập)" : ""),
              value: s,
            };
          }),
          onSelect: function (a) {
            pickTorrentEpisode(a.value, id, title, poster, itemData);
          },
          onBack: function () {
            Lampa.Controller.toggle("content");
          },
        });
      } else if (seasons.length === 1)
        pickTorrentEpisode(seasons[0], id, title, poster, itemData);
      else Lampa.Noty.show("Không có season nào");
    } catch (e) {
      Lampa.Noty.show("Lỗi: " + (e.message || ""));
    }
  }

  function pickTorrentEpisode(season, imdb, title, poster, itemData) {
    var items = [];
    for (var i = 1; i <= (season.episode_count || 1); i++)
      items.push({
        title: "S" + pad(season.season_number) + "E" + pad(i),
        value: { s: season.season_number, e: i },
      });
    Lampa.Select.show({
      title: season.name,
      items: items,
      onSelect: async function (a) {
        var label =
          title +
          " S" +
          pad(a.value.s) +
          "E" +
          pad(a.value.e);
        Lampa.Noty.show("Tìm " + label + "...");
        try {
          var st = await fetchStreams("tv", imdb, a.value.s, a.value.e);
          if (!st.length) {
            Lampa.Noty.show("Không có torrent");
            return;
          }
          showStreamPicker(
            st,
            label,
            poster,
            itemData,
            "S" + pad(a.value.s) + "E" + pad(a.value.e)
          );
        } catch (e) {
          Lampa.Noty.show("Lỗi: " + (e.message || ""));
        }
      },
      onBack: function () {
        Lampa.Controller.toggle("content");
      },
    });
  }

  // ══════════════════════════════════════════
  // CARD BUILDERS
  // ══════════════════════════════════════════

  // ── Source card (KKPhim/OPhim) ──
  function makeSourceCard(item, source, style) {
    if (!item || !item.slug) return $L("<div></div>");

    var poster = sourceImg(item.poster_url || item.thumb_url, source);
    var backdrop = sourceImg(item.thumb_url || item.poster_url, source);
    var name = item.name || item.title || "";
    var origin = item.origin_name || "";
    var year = item.year || "";
    var quality = item.quality || "";
    var epCurrent = item.episode_current || "";

    var isLandscape = style === "landscape";
    var cardClass = isLandscape ? "kk-card-h" : "kk-card-v";
    var img = isLandscape ? backdrop || poster : poster || backdrop;

    var badges = "";
    if (quality)
      badges += '<span class="kk-badge kk-badge-quality">' + esc(quality) + "</span>";
    if (epCurrent)
      badges +=
        '<span class="kk-badge kk-badge-ep">' + esc(epCurrent) + "</span>";

    var html =
      '<div class="' +
      cardClass +
      ' selector">' +
      '<div class="kk-card-poster">' +
      (img
        ? '<img src="' + esc(img) + '" loading="lazy" alt="">'
        : '<div class="kk-card-noimg"><span>No Image</span></div>') +
      '<div class="kk-card-badges">' +
      badges +
      "</div>" +
      "</div>" +
      '<div class="kk-card-info">' +
      '<div class="kk-card-title">' +
      esc(name) +
      "</div>" +
      (origin && origin !== name
        ? '<div class="kk-card-subtitle">' + esc(origin) + "</div>"
        : "") +
      (year
        ? '<div class="kk-card-meta"><span>' + esc(year) + "</span></div>"
        : "") +
      "</div>" +
      "</div>";

    var card = $L(html);
    bindClick(card, function () {
      addHistory(
        $L.extend({}, item, { source: source.key })
      );
      Lampa.Activity.push({
        url: "",
        title: name,
        component: "kkv5_source_detail",
        slug: item.slug,
        source_key: source.key,
        page: 1,
      });
    });
    return card;
  }

  // ── TMDB card ──
  function makeTmdbCard(item, style) {
    var d = tmdbNormalize(item);
    if (!d || !d.tmdb_id) return $L("<div></div>");

    var isLandscape = style === "landscape";
    var cardClass = isLandscape ? "kk-card-h" : "kk-card-v";
    var img = isLandscape
      ? d.backdrop_url || d.poster_url
      : d.poster_url || d.backdrop_url;

    var badges = "";
    if (d.vote)
      badges += '<span class="kk-badge kk-badge-vote">⭐' + esc(d.vote) + "</span>";
    badges +=
      '<span class="kk-badge kk-badge-type">' +
      (d.media_type === "tv" ? "TV" : "Film") +
      "</span>";

    var html =
      '<div class="' +
      cardClass +
      ' selector">' +
      '<div class="kk-card-poster">' +
      (img
        ? '<img src="' + esc(img) + '" loading="lazy" alt="">'
        : '<div class="kk-card-noimg"><span>No Image</span></div>') +
      '<div class="kk-card-badges">' +
      badges +
      "</div>" +
      "</div>" +
      '<div class="kk-card-info">' +
      '<div class="kk-card-title">' +
      esc(d.name) +
      "</div>" +
      (d.year
        ? '<div class="kk-card-meta"><span>' + esc(d.year) + "</span></div>"
        : "") +
      "</div>" +
      "</div>";

    var card = $L(html);
    bindClick(card, function () {
      Lampa.Activity.push({
        url: "",
        title: d.name,
        component: "kkv5_tmdb_detail",
        tmdb_id: d.tmdb_id,
        media_type: d.media_type,
        page: 1,
      });
    });
    return card;
  }

  // ── Continue Watching card ──
  function makeCWCard(item) {
    if (!item || !item.name) return $L("<div></div>");

    var poster = item.thumb_url || item.poster_url || "";
    var epName = item.ep_name || "Tiếp tục";
    var link = item.ep_link || "";
    var cwId = item.id || "";

    var pg = null;
    if (link) pg = getProgressFor(link, cwId);
    if (!pg && item.prog_time > 0)
      pg = {
        time: item.prog_time,
        duration: item.prog_dur,
        percent: item.prog_pct,
      };

    var progressHtml = "";
    var timeInfo = "";
    if (pg && pg.percent > 0 && pg.percent < 95 && pg.duration > 10) {
      progressHtml =
        '<div class="kk-cw-progress"><div class="kk-cw-bar" style="width:' +
        pg.percent +
        '%"></div></div>';
      timeInfo =
        fmtTime(pg.time) +
        "/" +
        fmtTime(pg.duration) +
        " (" +
        pg.percent +
        "%)";
    }

    var sub = timeInfo ? "▶ " + timeInfo : "Nhấn để xem";

    var html =
      '<div class="kk-card-h kk-card-cw selector">' +
      '<div class="kk-card-poster">' +
      (poster
        ? '<img src="' + esc(poster) + '" loading="lazy" alt="">'
        : '<div class="kk-card-noimg"><span>CW</span></div>') +
      progressHtml +
      "</div>" +
      '<div class="kk-card-info">' +
      '<div class="kk-card-title">' +
      esc(item.name) +
      "</div>" +
      '<div class="kk-card-meta"><span>' +
      esc(epName) +
      "</span></div>" +
      '<div class="kk-card-sub">' +
      sub +
      "</div>" +
      "</div>" +
      "</div>";

    var card = $L(html);
    bindClick(card, function () {
      if (link)
        playWithResume(
          (item.name || "") + " - " + epName,
          link,
          item.poster_url,
          item.thumb_url,
          item,
          epName
        );
      else if (item.slug)
        Lampa.Activity.push({
          url: "",
          title: item.name || "",
          component: "kkv5_source_detail",
          slug: item.slug,
          source_key: item.source || "ophim",
          page: 1,
        });
    });
    return card;
  }

  // ── Row builder ──
  function makeRow(title, items, cardFn, moreAction) {
    var row = $L('<div class="kk-row"></div>');
    var head = $L('<div class="kk-row-head"></div>');
    head.append('<div class="kk-row-title">' + esc(title) + "</div>");
    if (moreAction) {
      var more = $L('<div class="kk-row-more selector">Xem thêm</div>');
      bindClick(more, moreAction);
      head.append(more);
    }
    row.append(head);

    var list = $L('<div class="kk-row-list"></div>');
    var cards = [];
    items.forEach(function (item) {
      cards.push(cardFn(item));
    });
    batchAppend(list, cards);
    row.append(list);
    return row;
  }

  // ══════════════════════════════════════════
  // EPISODE BUILDER
  // ══════════════════════════════════════════
  function buildEpisodeList(container, episodes, title, itemData, poster, backdrop) {
    var frag = document.createDocumentFragment();

    episodes.forEach(function (server) {
      var serverName = server.server_name || "Server";
      var data = server.server_data || [];
      var icon = "📺";
      var snl = serverName.toLowerCase();
      if (
        snl.indexOf("thuyết minh") > -1 ||
        snl.indexOf("thuyet minh") > -1
      )
        icon = "🇻🇳";
      else if (snl.indexOf("vietsub") > -1 || snl.indexOf("sub") > -1)
        icon = "📝";

      var header = document.createElement("div");
      header.className = "kk-ep-server";
      header.textContent =
        icon + " " + serverName + " (" + data.length + ")";
      frag.appendChild(header);

      var grid = $L('<div class="kk-ep-grid"></div>');
      var chips = [];

      data.forEach(function (ep) {
        var link = ep.link_m3u8 || ep.link_embed || "";
        var epName = ep.name || "Tập";
        var cwId = "";
        if (itemData) {
          cwId =
            normalize(
              itemData.name || itemData.origin_name || ""
            ) +
            "_" +
            epName;
        }

        var pg = link ? getProgressFor(link, cwId) : null;
        var progressHtml = "";
        if (pg && pg.percent > 0 && pg.percent < 95 && pg.duration > 10) {
          progressHtml =
            '<div class="kk-ep-progress"><div class="kk-ep-bar" style="width:' +
            pg.percent +
            '%"></div></div>';
        }

        var chip = $L(
          '<div class="kk-ep-chip selector' +
            (link ? "" : " disabled") +
            '">' +
            esc(epName) +
            progressHtml +
            "</div>"
        );

        bindClick(chip, function () {
          if (link)
            playWithResume(
              title + " - " + epName,
              link,
              poster,
              backdrop,
              itemData,
              epName
            );
          else Lampa.Noty.show("Không có link phát");
        });
        chips.push(chip);
      });

      batchAppend(grid, chips);
      frag.appendChild(grid[0]);
    });

    container[0].appendChild(frag);
  }

  // ── Source expand button ──
  function makeSourceExpander(
    sourceKey,
    sourceName,
    slug,
    title,
    origTitle,
    mediaType,
    cssClass,
    itemData,
    poster,
    backdrop
  ) {
    var wrapper = $L('<div class="kk-source-block"></div>');
    var btn = $L(
      '<div class="kk-source-btn ' +
        cssClass +
        ' selector">' +
        '<div class="kk-source-btn-main">▶ ' +
        esc(sourceName) +
        ' <span class="kk-arrow">▼</span></div>' +
        '<div class="kk-source-btn-sub">Bấm để xem danh sách tập</div>' +
        "</div>"
    );
    var box = $L('<div class="kk-ep-box"></div>');
    wrapper.append(btn).append(box);

    var loaded = false,
      open = false;

    bindClick(btn, function () {
      open = !open;
      btn.toggleClass("kk-open", open);
      box.toggleClass("kk-show", open);

      if (open && !loaded) {
        loaded = true;
        box.html('<div class="kk-loading">⏳ Đang tải...</div>');

        if (mediaType === "tv") {
          // TV: search for season slugs
          findSeasonSlugs(SOURCES[sourceKey], title, origTitle)
            .then(function (entries) {
              if (!entries.length && slug) {
                entries = [
                  {
                    slug: slug,
                    name: title,
                    season: 1,
                    source: SOURCES[sourceKey],
                  },
                ];
              }
              if (!entries.length) {
                box.html(
                  '<div class="kk-error">❌ Không tìm thấy</div>'
                );
                return;
              }

              var sMap = {};
              entries.forEach(function (e) {
                if (!sMap[e.season]) sMap[e.season] = [];
                sMap[e.season].push(e);
              });
              var sNums = Object.keys(sMap)
                .map(Number)
                .sort(function (a, b) {
                  return a - b;
                });

              if (sNums.length === 1) {
                loadSeasonEps(
                  box,
                  sMap[sNums[0]],
                  title,
                  sNums[0],
                  null,
                  itemData,
                  poster,
                  backdrop
                );
              } else {
                showSeasonPicker(
                  box,
                  sMap,
                  sNums,
                  title,
                  itemData,
                  poster,
                  backdrop
                );
              }
            })
            .catch(function (e) {
              box.html(
                '<div class="kk-error">❌ ' +
                  esc(e.message || "") +
                  "</div>"
              );
            });
        } else {
          // Movie: direct fetch
          fetchDetail(SOURCES[sourceKey], slug)
            .then(function (det) {
              if (
                !det ||
                !det.episodes ||
                !det.episodes.length
              ) {
                box.html(
                  '<div class="kk-error">❌ Không có tập</div>'
                );
                return;
              }
              var md = $L.extend({}, itemData || {});
              if (!md.slug) md.slug = slug;
              box.empty();
              buildEpisodeList(
                box,
                det.episodes,
                title,
                md,
                poster,
                backdrop
              );
            })
            .catch(function (e) {
              box.html(
                '<div class="kk-error">❌ ' +
                  esc(e.message || "") +
                  "</div>"
              );
            });
        }
      }
    });

    return wrapper;
  }

  function showSeasonPicker(container, sMap, sNums, title, itemData, poster, backdrop) {
    container.empty();
    sNums.forEach(function (sn) {
      var item = $L(
        '<div class="kk-season-item selector"><span>📺 Season ' +
          sn +
          "</span></div>"
      );
      bindClick(item, function () {
        loadSeasonEps(
          container,
          sMap[sn],
          title,
          sn,
          function () {
            showSeasonPicker(
              container,
              sMap,
              sNums,
              title,
              itemData,
              poster,
              backdrop
            );
          },
          itemData,
          poster,
          backdrop
        );
      });
      container.append(item);
    });
  }

  async function loadSeasonEps(
    container,
    entries,
    title,
    sNum,
    backFn,
    itemData,
    poster,
    backdrop
  ) {
    container.html(
      '<div class="kk-loading">⏳ Season ' + sNum + "...</div>"
    );
    for (var i = 0; i < entries.length; i++) {
      try {
        var det = await fetchDetail(entries[i].source, entries[i].slug);
        if (det && det.episodes && det.episodes.length) {
          container.empty();
          if (backFn) {
            var bk = $L(
              '<div class="kk-back-btn selector">← Quay lại</div>'
            );
            bindClick(bk, backFn);
            container.append(bk);
          }
          var md = $L.extend({}, itemData || {});
          if (!md.slug) md.slug = entries[i].slug;
          buildEpisodeList(
            container,
            det.episodes,
            title + " S" + pad(sNum),
            md,
            poster,
            backdrop
          );
          return;
        }
      } catch (e) {}
    }
    container.html('<div class="kk-error">❌ Không có tập</div>');
  }

  // ── Torrent button ──
  function makeTorrentButton(mediaType, tmdbId, title, poster, imdb, itemData) {
    var engine = torrentEngine();
    var label = engine === "aio" ? "🌊 AIO" : "🧲 Torrent";
    if (tsHost()) label += " → TS";

    var cssClass = engine === "aio" ? "kk-source-aio" : "kk-source-torrent";
    var btn = $L(
      '<div class="kk-source-btn ' +
        cssClass +
        ' selector"><div class="kk-source-btn-main">' +
        label +
        "</div></div>"
    );

    if (mediaType === "movie") {
      bindClick(btn, function () {
        openTorrentMovie(tmdbId, title, poster, imdb, itemData);
      });
    } else {
      bindClick(btn, function () {
        openTorrentTV(tmdbId, title, poster, imdb, itemData);
      });
    }

    return $L('<div class="kk-source-block"></div>').append(btn);
  }

  // ══════════════════════════════════════════
  // DETAIL PAGE BUILDER (shared)
  // ══════════════════════════════════════════
  function buildHero(backdrop, poster, logoHtml, titleHtml, extra) {
    extra = extra || {};
    var countryHtml = "";
    if (extra.countries && extra.countries.length) {
      countryHtml = '<span class="kk-country-tags">';
      extra.countries.slice(0, 3).forEach(function (c) {
        var code = c.iso_3166_1 || c.name || "";
        if (code)
          countryHtml +=
            '<span class="kk-country-tag">' + esc(code) + "</span>";
      });
      countryHtml += "</span>";
    }

    return $L(
      '<div class="kk-hero">' +
        '<div class="kk-hero-bg">' +
        (backdrop
          ? '<img src="' + esc(backdrop) + '" loading="lazy">'
          : '<div class="kk-hero-bg-empty"></div>') +
        "</div>" +
        '<div class="kk-hero-content">' +
        '<div class="kk-hero-poster">' +
        (poster ? '<img src="' + esc(poster) + '" loading="lazy">' : "") +
        "</div>" +
        '<div class="kk-hero-meta">' +
        (extra.year || countryHtml
          ? '<div class="kk-hero-yc">' +
            (extra.year
              ? '<span class="kk-hero-year">' +
                esc(extra.year) +
                "</span>"
              : "") +
            countryHtml +
            "</div>"
          : "") +
        (logoHtml || titleHtml) +
        '<div class="kk-hero-badges">' +
        (extra.vote
          ? '<span class="kk-hero-vote">' +
            esc(extra.vote) +
            " <small>TMDB</small></span>"
          : "") +
        "</div>" +
        (extra.runtime || extra.genres
          ? '<div class="kk-hero-details">' +
            (extra.runtime
              ? '<span class="kk-hero-runtime">' +
                esc(extra.runtime) +
                "</span>"
              : "") +
            (extra.genres
              ? '<span class="kk-hero-genres">' +
                esc(extra.genres) +
                "</span>"
              : "") +
            "</div>"
          : "") +
        "</div>" +
        "</div>" +
        "</div>"
    );
  }

  function buildDescription(desc, isFallback) {
    var label = "Nội dung";
    if (isFallback) label += ' <small style="opacity:0.5">(EN)</small>';
    return $L(
      '<div class="kk-desc">' +
        '<div class="kk-desc-label">' +
        label +
        "</div>" +
        '<div class="kk-desc-text">' +
        esc(desc || "Không có mô tả").replace(/\n/g, "<br>") +
        "</div>" +
        "</div>"
    );
  }

  function buildCastList(cast, clickable) {
    var list = $L('<div class="kk-cast-list"></div>');
    var cards = [];
    cast.forEach(function (c) {
      var avatar = c.profile_path
        ? '<img src="' +
          esc(TMDB_W300 + c.profile_path) +
          '" loading="lazy">'
        : '<div class="kk-cast-noimg"></div>';

      var card;
      if (clickable && c.id) {
        card = $L(
          '<div class="kk-cast-card selector">' +
            '<div class="kk-cast-avatar">' +
            avatar +
            "</div>" +
            '<div class="kk-cast-info">' +
            '<div class="kk-cast-name">' +
            esc(c.name || "") +
            "</div>" +
            '<div class="kk-cast-role">' +
            esc(c.character || "") +
            "</div>" +
            "</div>" +
            "</div>"
        );
        bindClick(card, function () {
          Lampa.Activity.push({
            url: "",
            title: c.name || "",
            component: "kkv5_person",
            person_id: c.id,
            page: 1,
          });
        });
      } else {
        card = $L(
          '<div class="kk-cast-card">' +
            '<div class="kk-cast-avatar">' +
            avatar +
            "</div>" +
            '<div class="kk-cast-info">' +
            '<div class="kk-cast-name">' +
            esc(c.name || "") +
            "</div>" +
            "</div>" +
            "</div>"
        );
      }
      cards.push(card);
    });
    batchAppend(list, cards);
    return list;
  }

  // ══════════════════════════════════════════
  // INPUT HELPERS
  // ══════════════════════════════════════════
  function openSearch(component) {
    function go(kw) {
      kw = String(kw || "").trim();
      if (kw)
        Lampa.Activity.push({
          url: "",
          title: "🔍 " + kw,
          component: component,
          keyword: kw,
          page_num: 1,
        });
    }
    try {
      if (Lampa.Input && Lampa.Input.edit) {
        Lampa.Input.edit({ title: "Tìm kiếm", value: "", free: true }, go);
        return;
      }
    } catch (e) {}
    go(window.prompt("Tìm kiếm:"));
  }

  // ══════════════════════════════════════════
  // CSS INJECTION
  // ══════════════════════════════════════════
  function injectCSS() {
    if ($L("#kkv5-css").length) return;
    var link = document.createElement("link");
    link.id = "kkv5-css";
    link.rel = "stylesheet";
    link.href = CSS_URL;
    document.head.appendChild(link);
  }

  // ══════════════════════════════════════════
  // MENU
  // ══════════════════════════════════════════
  function addMenuItems() {
    function insert() {
      if ($L('.menu__item[data-action="kkv5_kkphim"]').length) return;

      var items = [
        {
          key: "kkv5_kkphim",
          label: "KKPhim",
          component: "kkv5_tab_kkphim",
          icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm6 10v-4l3.5 2L10 14z"/></svg>',
        },
        {
          key: "kkv5_ophim",
          label: "OPhim",
          component: "kkv5_tab_ophim",
          icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>',
        },
        {
          key: "kkv5_tmdb",
          label: "TMDB",
          component: "kkv5_tab_tmdb",
          icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
        },
      ];

      var menuList = $L(".menu .menu__list").first();
      items.forEach(function (it) {
        var el = $L(
          '<li class="menu__item selector" data-action="' +
            it.key +
            '">' +
            '<div class="menu__ico">' +
            it.icon +
            "</div>" +
            '<div class="menu__text">' +
            it.label +
            "</div>" +
            "</li>"
        );
        bindClick(el, function () {
          Lampa.Activity.push({
            url: "",
            title: it.label,
            component: it.component,
            page: 1,
          });
        });
        menuList.append(el);
      });
    }

    setTimeout(insert, 500);
    Lampa.Listener.follow("app", function (e) {
      if (e.type === "ready") setTimeout(insert, 500);
    });
  }

  // ══════════════════════════════════════════
  //  COMPONENTS
  // ══════════════════════════════════════════
  function startPlugin() {
    // Viewport for mobile
    if (!document.querySelector('meta[name="viewport"]')) {
      var vp = document.createElement("meta");
      vp.name = "viewport";
      vp.content =
        "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no";
      document.head.appendChild(vp);
    }

    if (isMobile()) {
      document.body.style.transform = "translateZ(0)";
      document.body.style.backfaceVisibility = "hidden";
    }

    injectCSS();
    addMenuItems();

    // Player hook
    Lampa.Listener.follow("player", function (e) {
      if (e.type === "destroy" || e.type === "stop") stopTracking();
    });

    // ════════════════════════════════════
    // TAB: KKPhim
    // ════════════════════════════════════
    Lampa.Component.add("kkv5_tab_kkphim", function () {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var comp = this;
      var SOURCE = SOURCES.kkphim;
      var CATS = [
        { name: "Phim Mới", api: "danh-sach/phim-moi-cap-nhat" },
        { name: "Phim Bộ", api: "v1/api/danh-sach/phim-bo" },
        { name: "Phim Lẻ", api: "v1/api/danh-sach/phim-le" },
        { name: "Hoạt Hình", api: "v1/api/danh-sach/hoat-hinh" },
        { name: "TV Shows", api: "v1/api/danh-sach/tv-shows" },
      ];

      this.create = function () {
        comp.activity.loader(true);
        clearScroll(scroll);

        // Topbar
        var topbar = $L(
          '<div class="kk-topbar">' +
            '<div class="kk-topbar-title">KKPhim</div>' +
            '<div class="kk-topbar-actions">' +
            '<div class="kk-btn selector">🔍</div>' +
            '<div class="kk-btn selector">⚙️</div>' +
            "</div>" +
            "</div>"
        );
        bindClick($L(topbar.find(".kk-btn")[0]), function () {
          openSearch("kkv5_source_search");
        });
        bindClick($L(topbar.find(".kk-btn")[1]), function () {
          Lampa.Activity.push({
            url: "",
            title: "Cài đặt",
            component: "kkv5_settings",
          });
        });
        scroll.append(topbar);

        // Continue Watching
        var cw = getCW().filter(function (x) {
          return x.source === "kkphim";
        });
        if (cw.length) {
          var cwRow = makeRow(
            "▶ Tiếp tục xem",
            cw.slice(0, rowLimit()),
            makeCWCard,
            null
          );
          scroll.append(cwRow);
        }

        // Categories
        var style = cardStyle();
        var ci = 0;
        function loadNext() {
          if (ci >= CATS.length) {
            comp.activity.loader(false);
            comp.start();
            return;
          }
          var cat = CATS[ci];
          ci++;

          fetch(SOURCE.api + cat.api + "?page=1")
            .then(function (r) {
              return r.json();
            })
            .then(function (res) {
              var items =
                (res && res.items) ||
                (res && res.data && res.data.items) ||
                [];
              items = items.filter(function (i) {
                return i && i.slug;
              });
              if (items.length) {
                var row = makeRow(
                  cat.name,
                  items.slice(0, rowLimit()),
                  function (item) {
                    return makeSourceCard(item, SOURCE, style);
                  },
                  function () {
                    Lampa.Activity.push({
                      url: "",
                      title: cat.name,
                      component: "kkv5_source_list",
                      source_key: "kkphim",
                      api_path: cat.api,
                      page_num: 1,
                    });
                  }
                );
                scroll.append(row);
              }
              if (ci === 1) {
                comp.activity.loader(false);
                comp.start();
              }
              setTimeout(loadNext, 30);
            })
            .catch(function () {
              if (ci === 1) {
                comp.activity.loader(false);
                comp.start();
              }
              setTimeout(loadNext, 30);
            });
        }
        loadNext();
      };

      this.start = function () {
        activateController(scroll);
        setupScroll(scroll);
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return scroll.render();
      };
      this.destroy = function () {
        scroll.destroy();
      };
    });

    // ════════════════════════════════════
    // TAB: OPhim
    // ════════════════════════════════════
    Lampa.Component.add("kkv5_tab_ophim", function () {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var comp = this;
      var SOURCE = SOURCES.ophim;
      var CATS = [
        { name: "Phim Mới", api: "danh-sach/phim-moi-cap-nhat" },
        { name: "Phim Bộ", api: "v1/api/danh-sach/phim-bo" },
        { name: "Phim Lẻ", api: "v1/api/danh-sach/phim-le" },
        { name: "Hoạt Hình", api: "v1/api/danh-sach/hoat-hinh" },
        { name: "TV Shows", api: "v1/api/danh-sach/tv-shows" },
      ];

      this.create = function () {
        comp.activity.loader(true);
        clearScroll(scroll);

        var topbar = $L(
          '<div class="kk-topbar">' +
            '<div class="kk-topbar-title">OPhim</div>' +
            '<div class="kk-topbar-actions">' +
            '<div class="kk-btn selector">🔍</div>' +
            '<div class="kk-btn selector">⚙️</div>' +
            "</div>" +
            "</div>"
        );
        bindClick($L(topbar.find(".kk-btn")[0]), function () {
          openSearch("kkv5_source_search");
        });
        bindClick($L(topbar.find(".kk-btn")[1]), function () {
          Lampa.Activity.push({
            url: "",
            title: "Cài đặt",
            component: "kkv5_settings",
          });
        });
        scroll.append(topbar);

        var cw = getCW().filter(function (x) {
          return x.source === "ophim";
        });
        if (cw.length) {
          scroll.append(
            makeRow(
              "▶ Tiếp tục xem",
              cw.slice(0, rowLimit()),
              makeCWCard,
              null
            )
          );
        }

        var style = cardStyle();
        var ci = 0;
        function loadNext() {
          if (ci >= CATS.length) {
            comp.activity.loader(false);
            comp.start();
            return;
          }
          var cat = CATS[ci];
          ci++;

          fetch(SOURCE.api + cat.api + "?page=1")
            .then(function (r) {
              return r.json();
            })
            .then(function (res) {
              var items =
                (res && res.items) ||
                (res && res.data && res.data.items) ||
                [];
              items = items.filter(function (i) {
                return i && i.slug;
              });
              if (items.length) {
                scroll.append(
                  makeRow(
                    cat.name,
                    items.slice(0, rowLimit()),
                    function (item) {
                      return makeSourceCard(item, SOURCE, style);
                    },
                    function () {
                      Lampa.Activity.push({
                        url: "",
                        title: cat.name,
                        component: "kkv5_source_list",
                        source_key: "ophim",
                        api_path: cat.api,
                        page_num: 1,
                      });
                    }
                  )
                );
              }
              if (ci === 1) {
                comp.activity.loader(false);
                comp.start();
              }
              setTimeout(loadNext, 30);
            })
            .catch(function () {
              if (ci === 1) {
                comp.activity.loader(false);
                comp.start();
              }
              setTimeout(loadNext, 30);
            });
        }
        loadNext();
      };

      this.start = function () {
        activateController(scroll);
        setupScroll(scroll);
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return scroll.render();
      };
      this.destroy = function () {
        scroll.destroy();
      };
    });

    // ════════════════════════════════════
    // TAB: TMDB
    // ════════════════════════════════════
    Lampa.Component.add("kkv5_tab_tmdb", function () {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var comp = this;
      var SECTIONS = [
        { name: "🔥 Xu hướng", key: "trending_day" },
        { name: "🎬 Đang chiếu", key: "now_playing" },
        { name: "📅 Sắp chiếu", key: "upcoming" },
        { name: "🌟 Phim lẻ hay", key: "popular_movies" },
        { name: "📺 Phim bộ hay", key: "popular_tv" },
        { name: "⭐ Top phim", key: "top_movies" },
        { name: "⭐ Top TV", key: "top_tv" },
      ];

      this.create = function () {
        comp.activity.loader(true);
        clearScroll(scroll);

        var topbar = $L(
          '<div class="kk-topbar">' +
            '<div class="kk-topbar-title kk-tmdb-title">TMDB</div>' +
            '<div class="kk-topbar-actions">' +
            '<div class="kk-btn selector">🔍</div>' +
            '<div class="kk-btn selector">⚙️</div>' +
            "</div>" +
            "</div>"
        );
        bindClick($L(topbar.find(".kk-btn")[0]), function () {
          openSearch("kkv5_tmdb_search");
        });
        bindClick($L(topbar.find(".kk-btn")[1]), function () {
          Lampa.Activity.push({
            url: "",
            title: "Cài đặt",
            component: "kkv5_settings",
          });
        });
        scroll.append(topbar);

        // CW all sources
        var cw = getCW();
        if (cw.length) {
          scroll.append(
            makeRow(
              "▶ Tiếp tục xem",
              cw.slice(0, rowLimit()),
              makeCWCard,
              null
            )
          );
        }

        var style = cardStyle();
        var si = 0;
        function loadNext() {
          if (si >= SECTIONS.length) {
            comp.activity.loader(false);
            comp.start();
            return;
          }
          var sec = SECTIONS[si];
          si++;
          var fn = TMDB_LISTS[sec.key];
          if (!fn) {
            setTimeout(loadNext, 10);
            return;
          }
          fn(1)
            .then(function (res) {
              var items = (res.results || []).filter(function (i) {
                return i.media_type !== "person";
              });
              if (items.length) {
                scroll.append(
                  makeRow(
                    sec.name,
                    items.slice(0, rowLimit()),
                    function (item) {
                      return makeTmdbCard(item, style);
                    },
                    function () {
                      Lampa.Activity.push({
                        url: "",
                        title: sec.name,
                        component: "kkv5_tmdb_list",
                        list_key: sec.key,
                        page_num: 1,
                      });
                    }
                  )
                );
              }
              if (si === 1) {
                comp.activity.loader(false);
                comp.start();
              }
              setTimeout(loadNext, 30);
            })
            .catch(function () {
              if (si === 1) {
                comp.activity.loader(false);
                comp.start();
              }
              setTimeout(loadNext, 30);
            });
        }
        loadNext();
      };

      this.start = function () {
        activateController(scroll);
        setupScroll(scroll);
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return scroll.render();
      };
      this.destroy = function () {
        scroll.destroy();
      };
    });

    // ════════════════════════════════════
    // SOURCE LIST (infinite scroll)
    // ════════════════════════════════════
    Lampa.Component.add("kkv5_source_list", function (obj) {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var comp = this;
      var page = obj.page_num || 1;
      var source = SOURCES[obj.source_key] || SOURCES.ophim;
      var apiPath = obj.api_path || "";
      var catSlug = obj.cat_slug || "";

      var grid = $L('<div class="kk-grid"></div>');
      var spinner = $L(
        '<div class="kk-spinner" style="display:none"><div class="kk-spin"></div></div>'
      );
      var endMsg = $L(
        '<div class="kk-end-msg" style="display:none">Đã hết</div>'
      );
      var loading = false,
        done = false;
      var style = cardStyle();

      this.create = function () {
        comp.activity.loader(true);
        clearScroll(scroll);
        scroll.append(
          $L('<div class="kk-list-wrap"></div>')
            .append(
              '<div class="kk-list-title">' +
                esc(obj.title || "") +
                "</div>"
            )
            .append(grid)
            .append(spinner)
            .append(endMsg)
        );

        var body = scroll.render().find(".scroll__body");
        body.on(
          "scroll",
          throttle(function () {
            if (loading || done) return;
            var el = body[0];
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400)
              loadMore();
          }, 200)
        );

        loadMore();
      };

      function loadMore() {
        loading = true;
        spinner.show();
        var url;
        if (catSlug)
          url =
            source.api +
            "v1/api/the-loai/" +
            catSlug +
            "?page=" +
            page;
        else url = source.api + apiPath + "?page=" + page;

        fetch(url)
          .then(function (r) {
            return r.json();
          })
          .then(function (res) {
            var items =
              (res && res.items) ||
              (res && res.data && res.data.items) ||
              [];
            items = items.filter(function (i) {
              return i && i.slug;
            });
            spinner.hide();
            if (!items.length) {
              done = true;
              endMsg.show();
            } else {
              var cards = [];
              items.forEach(function (item) {
                cards.push(
                  makeSourceCard(item, source, style).addClass("kk-grid-item")
                );
              });
              batchAppend(grid, cards);
              page++;
            }
            loading = false;
            comp.activity.loader(false);
            comp.start();
          })
          .catch(function () {
            loading = false;
            spinner.hide();
            endMsg.show();
            comp.activity.loader(false);
          });
      }

      this.start = function () {
        activateController(scroll);
        setupScroll(scroll);
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return scroll.render();
      };
      this.destroy = function () {
        scroll.destroy();
      };
    });

    // ════════════════════════════════════
    // SOURCE SEARCH
    // ════════════════════════════════════
    Lampa.Component.add("kkv5_source_search", function (obj) {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var comp = this;
      var kw = obj.keyword || "";
      var page = obj.page_num || 1;
      var grid = $L('<div class="kk-grid"></div>');
      var spinner = $L(
        '<div class="kk-spinner" style="display:none"><div class="kk-spin"></div></div>'
      );
      var endMsg = $L(
        '<div class="kk-end-msg" style="display:none">Đã hết</div>'
      );
      var loading = false,
        done = false;
      var style = cardStyle();

      // Search both sources
      var allResults = [];

      this.create = function () {
        comp.activity.loader(true);
        clearScroll(scroll);
        scroll.append(
          $L('<div class="kk-list-wrap"></div>')
            .append(
              '<div class="kk-list-title">🔍 ' + esc(kw) + "</div>"
            )
            .append(grid)
            .append(spinner)
            .append(endMsg)
        );

        // Search KKPhim + OPhim simultaneously
        spinner.show();
        Promise.all([
          sourceSearch(SOURCES.kkphim, kw),
          sourceSearch(SOURCES.ophim, kw),
        ])
          .then(function (results) {
            var kkItems = results[0] || [];
            var opItems = results[1] || [];

            // Tag with source
            kkItems.forEach(function (i) {
              i._source = SOURCES.kkphim;
            });
            opItems.forEach(function (i) {
              i._source = SOURCES.ophim;
            });

            // Merge, deduplicate by slug
            var seen = {};
            var merged = [];
            kkItems.concat(opItems).forEach(function (i) {
              if (i.slug && !seen[i.slug]) {
                seen[i.slug] = true;
                merged.push(i);
              }
            });

            spinner.hide();
            if (!merged.length) {
              endMsg.text("Không tìm thấy").show();
            } else {
              var cards = [];
              merged.forEach(function (item) {
                cards.push(
                  makeSourceCard(
                    item,
                    item._source || SOURCES.ophim,
                    style
                  ).addClass("kk-grid-item")
                );
              });
              batchAppend(grid, cards);
            }

            comp.activity.loader(false);
            comp.start();
          })
          .catch(function () {
            spinner.hide();
            endMsg.text("Lỗi tìm kiếm").show();
            comp.activity.loader(false);
            comp.start();
          });
      };

      this.start = function () {
        activateController(scroll);
        setupScroll(scroll);
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return scroll.render();
      };
      this.destroy = function () {
        scroll.destroy();
      };
    });

    // ════════════════════════════════════
    // SOURCE DETAIL (KKPhim/OPhim)
    // ════════════════════════════════════
    Lampa.Component.add("kkv5_source_detail", function (obj) {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var comp = this;
      var slug = obj.slug;
      var sourceKey = obj.source_key || "ophim";
      var source = SOURCES[sourceKey] || SOURCES.ophim;
      var rendered = false;

      this.create = function () {
        comp.activity.loader(true);
        clearScroll(scroll);

        if (!slug) {
          comp.activity.loader(false);
          comp.start();
          return;
        }

        fetchDetail(source, slug)
          .then(async function (det) {
            if (!det) {
              comp.activity.loader(false);
              return;
            }

            var movie = det.movie || {};
            var episodes = det.episodes || [];
            var name = movie.name || movie.title || "";
            var origName = movie.origin_name || "";
            var year = movie.year || "";
            var desc = stripHtml(movie.content || "");
            var poster = sourceImg(
              movie.poster_url || movie.thumb_url,
              source
            );
            var backdrop = sourceImg(
              movie.thumb_url || movie.poster_url,
              source
            );
            var quality = movie.quality || "";
            var mt = getMediaType(movie);
            var tmdbId =
              movie.tmdb && movie.tmdb.id ? movie.tmdb.id : null;

            // Try to get TMDB info
            var tmdb = null,
              logos = null;
            if (tmdbId) {
              try {
                tmdb = await tmdbFetchFallback(
                  "/" +
                    mt +
                    "/" +
                    tmdbId +
                    "?language=" +
                    tmdbLang() +
                    "&append_to_response=credits,images"
                );
              } catch (e) {}
              try {
                logos = await tmdbImages(mt, tmdbId);
              } catch (e) {}
            }

            buildPage(
              movie,
              episodes,
              tmdb,
              logos,
              mt,
              tmdbId,
              source,
              poster,
              backdrop
            );
          })
          .catch(function (e) {
            comp.activity.loader(false);
            Lampa.Noty.show("Lỗi: " + (e.message || ""));
          });
      };

      function buildPage(
        movie,
        episodes,
        tmdb,
        logos,
        mt,
        tmdbId,
        source,
        poster,
        backdrop
      ) {
        clearScroll(scroll);

        var name = movie.name || "";
        var origName = movie.origin_name || "";
        var desc = stripHtml(movie.content || "");
        var year = movie.year || "";
        var runtime = movie.time || "";
        var vote = "N/A";
        var isFallback = false;
        var castArr = [],
          dirsArr = [];
        var genres = "";
        var logoHtml = "";
        var countries = [];

        // Enhance with TMDB data
        if (tmdb) {
          if (tmdb.backdrop_path)
            backdrop = tmdbOriginal(tmdb.backdrop_path);
          if (tmdb.poster_path)
            poster = TMDB_W500 + tmdb.poster_path;
          if (tmdb.title || tmdb.name) name = tmdb.title || tmdb.name;
          if (tmdb.overview) {
            desc = tmdb.overview;
            isFallback = tmdb._fallback || false;
          }
          if (tmdb.vote_average)
            vote = Number(tmdb.vote_average).toFixed(1);
          if (tmdb.release_date) year = tmdb.release_date.slice(0, 4);
          if (tmdb.runtime) runtime = tmdb.runtime + " phút";
          genres = (tmdb.genres || [])
            .slice(0, 3)
            .map(function (g) {
              return g.name;
            })
            .join(" | ");

          var logo = getLogo(logos || tmdb.images);
          if (logo && logo.file_path)
            logoHtml =
              '<div class="kk-logo"><img src="' +
              esc(TMDB_W500 + logo.file_path) +
              '" loading="lazy"></div>';

          if (tmdb.credits) {
            castArr = (tmdb.credits.cast || []).slice(0, 15);
            dirsArr = (tmdb.credits.crew || [])
              .filter(function (c) {
                return c.job === "Director" || c.job === "Creator";
              })
              .slice(0, 4);
          }

          countries = tmdb.production_countries || [];
          if (!countries.length && tmdb.origin_country)
            countries = tmdb.origin_country.map(function (c) {
              return { iso_3166_1: c };
            });
        }

        if (!genres && movie.category && movie.category.length)
          genres = movie.category
            .slice(0, 3)
            .map(function (c) {
              return c.name || "";
            })
            .join(" | ");

        if (!countries.length && movie.country && Array.isArray(movie.country))
          countries = movie.country.map(function (c) {
            return {
              iso_3166_1: (c.slug || "").toUpperCase(),
              name: c.name || "",
            };
          });

        var titleHtml = logoHtml
          ? ""
          : '<div class="kk-hero-title">' + esc(name) + "</div>";

        // Build page
        var wrap = $L('<div class="kk-detail"></div>');

        wrap.append(
          buildHero(backdrop, poster, logoHtml, titleHtml, {
            vote: vote !== "N/A" ? vote : "",
            year: year,
            runtime: runtime,
            genres: genres,
            countries: countries,
          })
        );

        wrap.append(buildDescription(desc, isFallback));

        // Source actions
        var actions = $L('<div class="kk-actions"></div>');

        // Current source episodes
        if (episodes && episodes.length) {
          var totalEps = 0;
          episodes.forEach(function (sv) {
            totalEps += (sv.server_data || []).length;
          });

          var srcBtn = $L(
            '<div class="kk-source-block">' +
              '<div class="kk-source-btn kk-source-' +
              source.key +
              ' selector">' +
              '<div class="kk-source-btn-main">▶ ' +
              esc(source.name) +
              ' <span class="kk-arrow">▼</span></div>' +
              '<div class="kk-source-btn-sub">' +
              totalEps +
              " tập</div>" +
              "</div>" +
              '<div class="kk-ep-box"></div>' +
              "</div>"
          );

          var epBox = srcBtn.find(".kk-ep-box");
          var itemData = $L.extend({}, movie, { source: source.key });
          buildEpisodeList(
            epBox,
            episodes,
            name,
            itemData,
            poster,
            backdrop
          );

          var isOpen = false;
          bindClick(srcBtn.find(".kk-source-btn"), function () {
            isOpen = !isOpen;
            srcBtn
              .find(".kk-source-btn")
              .toggleClass("kk-open", isOpen);
            epBox.toggleClass("kk-show", isOpen);
          });

          actions.append(srcBtn);
        }

        // Other source
        var otherKey = source.key === "kkphim" ? "ophim" : "kkphim";
        var otherSource = SOURCES[otherKey];
        var otherItemData = $L.extend({}, movie, {
          source: otherKey,
        });

        actions.append(
          makeSourceExpander(
            otherKey,
            otherSource.name,
            null,
            name,
            origName,
            mt,
            "kk-source-" + otherKey,
            otherItemData,
            poster,
            backdrop
          )
        );

        // Torrent
        if (tmdbId) {
          var imdb =
            tmdb && tmdb.external_ids
              ? tmdb.external_ids.imdb_id
              : null;
          actions.append(
            makeTorrentButton(mt, tmdbId, name, poster, imdb, movie)
          );
        }

        wrap.append(actions);

        // Cast
        if (castArr.length) {
          wrap.append(
            $L('<div class="kk-section"></div>')
              .append('<div class="kk-section-title">Diễn viên</div>')
              .append(buildCastList(castArr, !!tmdbId))
          );
        }

        scroll.append(wrap);
        comp.activity.loader(false);
        comp.start();
      }

      this.start = function () {
        activateController(scroll);
        setupScroll(scroll);
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return scroll.render();
      };
      this.destroy = function () {
        scroll.destroy();
      };
    });

    // ════════════════════════════════════
    // TMDB LIST (infinite scroll)
    // ════════════════════════════════════
    Lampa.Component.add("kkv5_tmdb_list", function (obj) {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var comp = this;
      var page = obj.page_num || 1;
      var listKey = obj.list_key || "trending";

      var grid = $L('<div class="kk-grid"></div>');
      var spinner = $L(
        '<div class="kk-spinner" style="display:none"><div class="kk-spin"></div></div>'
      );
      var endMsg = $L(
        '<div class="kk-end-msg" style="display:none">Đã hết</div>'
      );
      var loading = false,
        done = false;
      var style = cardStyle();

      this.create = function () {
        comp.activity.loader(true);
        clearScroll(scroll);
        scroll.append(
          $L('<div class="kk-list-wrap"></div>')
            .append(
              '<div class="kk-list-title">' +
                esc(obj.title || "TMDB") +
                "</div>"
            )
            .append(grid)
            .append(spinner)
            .append(endMsg)
        );

        var body = scroll.render().find(".scroll__body");
        body.on(
          "scroll",
          throttle(function () {
            if (loading || done) return;
            var el = body[0];
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400)
              loadMore();
          }, 200)
        );

        loadMore();
      };

      function loadMore() {
        loading = true;
        spinner.show();
        var fn = TMDB_LISTS[listKey] || TMDB_LISTS.trending;
        fn(page)
          .then(function (r) {
            var items = (r.results || []).filter(function (i) {
              return i.media_type !== "person";
            });
            spinner.hide();
            if (!items.length) {
              done = true;
              endMsg.show();
            } else {
              var cards = [];
              items.forEach(function (i) {
                cards.push(
                  makeTmdbCard(i, style).addClass("kk-grid-item")
                );
              });
              batchAppend(grid, cards);
              page++;
            }
            loading = false;
            comp.activity.loader(false);
            comp.start();
          })
          .catch(function () {
            loading = false;
            spinner.hide();
            endMsg.show();
            comp.activity.loader(false);
          });
      }

      this.start = function () {
        activateController(scroll);
        setupScroll(scroll);
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return scroll.render();
      };
      this.destroy = function () {
        scroll.destroy();
      };
    });

    // ════════════════════════════════════
    // TMDB SEARCH
    // ════════════════════════════════════
    Lampa.Component.add("kkv5_tmdb_search", function (obj) {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var comp = this;
      var kw = obj.keyword || "";
      var page = obj.page_num || 1;

      var grid = $L('<div class="kk-grid"></div>');
      var spinner = $L(
        '<div class="kk-spinner" style="display:none"><div class="kk-spin"></div></div>'
      );
      var endMsg = $L(
        '<div class="kk-end-msg" style="display:none">Đã hết</div>'
      );
      var loading = false,
        done = false;
      var style = cardStyle();

      this.create = function () {
        comp.activity.loader(true);
        clearScroll(scroll);
        scroll.append(
          $L('<div class="kk-list-wrap"></div>')
            .append(
              '<div class="kk-list-title">🔍 ' + esc(kw) + "</div>"
            )
            .append(grid)
            .append(spinner)
            .append(endMsg)
        );

        var body = scroll.render().find(".scroll__body");
        body.on(
          "scroll",
          throttle(function () {
            if (loading || done) return;
            var el = body[0];
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400)
              loadMore();
          }, 200)
        );

        loadMore();
      };

      function loadMore() {
        loading = true;
        spinner.show();
        tmdbSearch(kw, page)
          .then(function (r) {
            var items = (r.results || []).filter(function (i) {
              return i.media_type !== "person";
            });
            spinner.hide();
            if (!items.length) {
              done = true;
              endMsg.show();
            } else {
              var cards = [];
              items.forEach(function (i) {
                cards.push(
                  makeTmdbCard(i, style).addClass("kk-grid-item")
                );
              });
              batchAppend(grid, cards);
              page++;
            }
            loading = false;
            comp.activity.loader(false);
            comp.start();
          })
          .catch(function () {
            loading = false;
            spinner.hide();
            endMsg.show();
            comp.activity.loader(false);
          });
      }

      this.start = function () {
        activateController(scroll);
        setupScroll(scroll);
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return scroll.render();
      };
      this.destroy = function () {
        scroll.destroy();
      };
    });

    // ════════════════════════════════════
    // TMDB DETAIL
    // ════════════════════════════════════
    Lampa.Component.add("kkv5_tmdb_detail", function (obj) {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var comp = this;
      var tmdbId = obj.tmdb_id;
      var mt = obj.media_type || "movie";

      this.create = function () {
        comp.activity.loader(true);
        clearScroll(scroll);

        if (!tmdbId) {
          comp.activity.loader(false);
          comp.start();
          return;
        }

        tmdbDetail(mt, tmdbId)
          .then(async function (tmdb) {
            var logos = null;
            try {
              logos = await tmdbImages(mt, tmdbId);
            } catch (e) {}

            var title = tmdb.title || tmdb.name || "";
            var origTitle =
              tmdb.original_title || tmdb.original_name || "";
            var year = (
              tmdb.release_date ||
              tmdb.first_air_date ||
              ""
            ).slice(0, 4);

            Lampa.Noty.show("Tìm nguồn phát...");
            var slugs = await findSlugs(title, origTitle, year);

            buildPage(tmdb, logos, slugs, title, origTitle, year);
          })
          .catch(function (e) {
            comp.activity.loader(false);
            Lampa.Noty.show("Lỗi: " + (e.message || ""));
          });
      };

      function buildPage(tmdb, logos, slugs, title, origTitle, year) {
        clearScroll(scroll);

        var backdrop = tmdb.backdrop_path
          ? tmdbOriginal(tmdb.backdrop_path)
          : "";
        var poster = tmdb.poster_path
          ? TMDB_W500 + tmdb.poster_path
          : "";
        var backdropW5 = tmdb.backdrop_path
          ? tmdbBackdrop(tmdb.backdrop_path)
          : "";
        var desc = tmdb.overview || "";
        var isFallback = tmdb._fallback || false;
        var vote = tmdb.vote_average
          ? Number(tmdb.vote_average).toFixed(1)
          : "";
        var runtime = tmdb.runtime ? tmdb.runtime + " phút" : "";
        var genres = (tmdb.genres || [])
          .slice(0, 3)
          .map(function (g) {
            return g.name;
          })
          .join(" | ");

        var logo = getLogo(logos || (tmdb.images || {}));
        var logoHtml = "";
        if (logo && logo.file_path)
          logoHtml =
            '<div class="kk-logo"><img src="' +
            esc(TMDB_W500 + logo.file_path) +
            '" loading="lazy"></div>';

        var titleHtml = logoHtml
          ? ""
          : '<div class="kk-hero-title">' + esc(title) + "</div>";

        var castArr = [],
          dirsArr = [];
        if (tmdb.credits) {
          castArr = (tmdb.credits.cast || []).slice(0, 15);
          dirsArr = (tmdb.credits.crew || [])
            .filter(function (c) {
              return c.job === "Director" || c.job === "Creator";
            })
            .slice(0, 4);
        }

        var imdb =
          (tmdb.external_ids && tmdb.external_ids.imdb_id) || null;

        var countries = tmdb.production_countries || [];
        if (!countries.length && tmdb.origin_country)
          countries = tmdb.origin_country.map(function (c) {
            return { iso_3166_1: c };
          });

        var wrap = $L('<div class="kk-detail"></div>');

        wrap.append(
          buildHero(backdrop, poster, logoHtml, titleHtml, {
            vote: vote,
            year: year,
            runtime: runtime,
            genres: genres,
            countries: countries,
          })
        );

        wrap.append(buildDescription(desc, isFallback));

        // Actions: KKPhim, OPhim, Torrent
        var actions = $L('<div class="kk-actions"></div>');
        var itemData = {
          name: title,
          origin_name: origTitle,
          slug: "",
          poster_url: poster,
          thumb_url: backdropW5,
          year: year,
          tmdb: { id: tmdbId, type: mt },
          type: mt === "tv" ? "series" : "single",
        };

        // KKPhim
        if (slugs.kkphim) {
          var kkData = $L.extend({}, itemData, {
            slug: slugs.kkphim,
            source: "kkphim",
          });
          actions.append(
            makeSourceExpander(
              "kkphim",
              "KKPhim",
              slugs.kkphim,
              title,
              origTitle,
              mt,
              "kk-source-kkphim",
              kkData,
              poster,
              backdropW5
            )
          );
        } else {
          actions.append(
            '<div class="kk-source-btn kk-source-na">KKPhim – Không có</div>'
          );
        }

        // OPhim
        if (slugs.ophim) {
          var opData = $L.extend({}, itemData, {
            slug: slugs.ophim,
            source: "ophim",
          });
          actions.append(
            makeSourceExpander(
              "ophim",
              "OPhim",
              slugs.ophim,
              title,
              origTitle,
              mt,
              "kk-source-ophim",
              opData,
              poster,
              backdropW5
            )
          );
        } else {
          actions.append(
            '<div class="kk-source-btn kk-source-na">OPhim – Không có</div>'
          );
        }

        // Torrent
        actions.append(
          makeTorrentButton(mt, tmdbId, title, poster || backdropW5, imdb, itemData)
        );

        wrap.append(actions);

        // Cast
        if (castArr.length) {
          wrap.append(
            $L('<div class="kk-section"></div>')
              .append('<div class="kk-section-title">Diễn viên</div>')
              .append(buildCastList(castArr, true))
          );
        }

        // Similar
        var simItems =
          tmdb.similar && tmdb.similar.results
            ? tmdb.similar.results.slice(0, 20)
            : [];
        if (simItems.length) {
          var simSec = $L('<div class="kk-section"></div>');
          simSec.append(
            '<div class="kk-section-title">Phim tương tự</div>'
          );
          var simList = $L('<div class="kk-similar-list"></div>');
          var simCards = [];
          simItems.forEach(function (i) {
            if (!i.media_type) i.media_type = mt;
            simCards.push(makeTmdbCard(i, cardStyle()));
          });
          batchAppend(simList, simCards);
          simSec.append(simList);
          wrap.append(simSec);
        }

        // Random recommendation
        var randSec = $L('<div class="kk-section"></div>');
        var randTitle = $L(
          '<div class="kk-section-title">🎲 Gợi ý</div>'
        );
        var randList = $L(
          '<div class="kk-similar-list"><div class="kk-loading">⏳</div></div>'
        );
        randSec.append(randTitle).append(randList);
        wrap.append(randSec);

        setTimeout(function () {
          var rIdx = Math.floor(Math.random() * RANDOM_KEYS.length);
          var rPage = Math.floor(Math.random() * 3) + 1;
          var rFn = TMDB_LISTS[RANDOM_KEYS[rIdx]];
          var rNames = {
            trending: "🔥 Trending",
            popular_movies: "🌟 Phim hot",
            popular_tv: "📺 TV hot",
            top_movies: "⭐ Top phim",
            top_tv: "⭐ Top TV",
            now_playing: "🎬 Đang chiếu",
            airing_today: "📡 Phát hôm nay",
          };
          randTitle.text(rNames[RANDOM_KEYS[rIdx]] || "🎲 Gợi ý");

          if (rFn)
            rFn(rPage)
              .then(function (res) {
                var items = (res.results || []).filter(function (i) {
                  return i.media_type !== "person" && i.id !== tmdbId;
                });
                randList.empty();
                if (items.length) {
                  var cards = [];
                  items.slice(0, 20).forEach(function (i) {
                    if (!i.media_type)
                      i.media_type = mt === "tv" ? "tv" : "movie";
                    cards.push(makeTmdbCard(i, cardStyle()));
                  });
                  batchAppend(randList, cards);
                }
              })
              .catch(function () {
                randList.empty();
              });
        }, 500);

        scroll.append(wrap);
        comp.activity.loader(false);
        comp.start();
      }

      this.start = function () {
        activateController(scroll);
        setupScroll(scroll);
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return scroll.render();
      };
      this.destroy = function () {
        scroll.destroy();
      };
    });

    // ════════════════════════════════════
    // PERSON
    // ════════════════════════════════════
    Lampa.Component.add("kkv5_person", function (obj) {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var comp = this;
      var pid = obj.person_id;

      this.create = function () {
        comp.activity.loader(true);
        clearScroll(scroll);

        if (!pid) {
          comp.activity.loader(false);
          comp.start();
          return;
        }

        Promise.all([
          tmdbFetch("/person/" + pid + "?language=" + tmdbLang()),
          tmdbPersonCredits(pid),
        ])
          .then(function (res) {
            var person = res[0];
            var credits = res[1];

            var wrap = $L('<div class="kk-detail"></div>');
            var avatar = person.profile_path
              ? TMDB_W500 + person.profile_path
              : "";
            wrap.append(
              '<div class="kk-person-header">' +
                '<div class="kk-person-avatar">' +
                (avatar
                  ? '<img src="' + esc(avatar) + '" loading="lazy">'
                  : "") +
                "</div>" +
                '<div class="kk-person-info">' +
                '<div class="kk-person-name">' +
                esc(person.name || "") +
                "</div>" +
                "</div>" +
                "</div>"
            );

            var style = cardStyle();

            if (credits && credits.cast) {
              var movies = credits.cast
                .filter(function (c) {
                  return c.media_type === "movie";
                })
                .sort(function (a, b) {
                  return (b.popularity || 0) - (a.popularity || 0);
                });
              var tvs = credits.cast
                .filter(function (c) {
                  return c.media_type === "tv";
                })
                .sort(function (a, b) {
                  return (b.popularity || 0) - (a.popularity || 0);
                });

              if (movies.length) {
                wrap.append(
                  makeRow(
                    "🎬 Phim lẻ",
                    movies.slice(0, rowLimit()),
                    function (item) {
                      return makeTmdbCard(item, style);
                    },
                    null
                  )
                );
              }
              if (tvs.length) {
                wrap.append(
                  makeRow(
                    "📺 Phim bộ",
                    tvs.slice(0, rowLimit()),
                    function (item) {
                      return makeTmdbCard(item, style);
                    },
                    null
                  )
                );
              }
            }

            scroll.append(wrap);
            comp.activity.loader(false);
            comp.start();
          })
          .catch(function () {
            comp.activity.loader(false);
          });
      };

      this.start = function () {
        activateController(scroll);
        setupScroll(scroll);
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return scroll.render();
      };
      this.destroy = function () {
        scroll.destroy();
      };
    });

    // ════════════════════════════════════
    // SETTINGS
    // ════════════════════════════════════
    Lampa.Component.add("kkv5_settings", function () {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var comp = this;

      this.create = function () {
        clearScroll(scroll);
        var s = allSettings();
        var wrap = $L('<div class="kk-settings"></div>');

        wrap.append(
          '<div class="kk-settings-header">⚙️ Cài đặt KKPhim v' +
            VERSION +
            "</div>"
        );

        // Card Style
        var gCard = makeGroup("🃏 Kiểu card");
        var cs = s.card_style || "landscape";
        [
          { k: "landscape", n: "Ngang" },
          { k: "portrait", n: "Dọc" },
        ].forEach(function (o) {
          gCard.append(
            makeOption(o.n, "", cs === o.k, function () {
              setSetting({ card_style: o.k });
              comp.create();
            })
          );
        });
        wrap.append(gCard);

        // Row limit
        var gRow = makeGroup("📊 Số phim/hàng");
        var rl = String(s.row_limit || "20");
        [
          { k: "10", n: "10" },
          { k: "20", n: "20" },
          { k: "30", n: "30" },
        ].forEach(function (o) {
          gRow.append(
            makeOption(o.n, "", rl === o.k, function () {
              setSetting({ row_limit: o.k });
              comp.create();
            })
          );
        });
        wrap.append(gRow);

        // TMDB Language
        var gLang = makeGroup("🌐 Ngôn ngữ TMDB");
        var cl = s.tmdb_lang || "vi-VN";
        [
          { k: "vi-VN", n: "Tiếng Việt" },
          { k: "en-US", n: "English" },
        ].forEach(function (o) {
          gLang.append(
            makeOption(o.n, "", cl === o.k, function () {
              setSetting({ tmdb_lang: o.k });
              _genreCache = { movie: null, tv: null };
              comp.create();
            })
          );
        });
        wrap.append(gLang);

        // Torrent Engine
        var gEngine = makeGroup("🎯 Torrent Engine");
        var ce = s.torrent_engine || "torrentio";
        gEngine.append(
          makeOption("Torrentio", "", ce === "torrentio", function () {
            setSetting({ torrent_engine: "torrentio" });
            comp.create();
          })
        );
        gEngine.append(
          makeOption("AIOStreams", "", ce === "aio", function () {
            setSetting({ torrent_engine: "aio" });
            comp.create();
          })
        );
        wrap.append(gEngine);

        // TorrServer
        var gTS = makeGroup("🖥️ TorrServer");
        gTS.append(
          makeInput(
            "Địa chỉ",
            "192.168.1.100:8090",
            s.ts_host || "Chưa cài",
            "Địa chỉ TorrServer",
            "ts_host",
            s
          )
        );
        gTS.append(
          makeInput(
            "Mật khẩu",
            "",
            s.ts_pass ? "••••" : "Không",
            "Mật khẩu TS",
            "ts_pass",
            s
          )
        );

        // Speed test
        var tsStatus = $L(
          '<div class="kk-status" style="display:none"></div>'
        );
        var tsTestBtn = makeActionItem(
          "🧪 Test kết nối",
          "",
          "Test"
        );
        bindClick(tsTestBtn, async function () {
          var h = tsHost();
          if (!h) {
            tsStatus
              .show()
              .attr("class", "kk-status kk-status-err")
              .html("❌ Chưa nhập địa chỉ");
            return;
          }
          tsStatus
            .show()
            .attr("class", "kk-status kk-status-loading")
            .html("⏳ Testing...");
          var result = await tsSpeedTest();
          if (result.ok) {
            tsStatus
              .attr("class", "kk-status kk-status-ok")
              .html("✅ " + result.msg);
          } else {
            tsStatus
              .attr("class", "kk-status kk-status-err")
              .html("❌ " + result.msg);
          }
        });
        gTS.append(tsTestBtn).append(tsStatus);

        // Clear torrents
        var tsClearBtn = makeActionItem(
          "🗑️ Xóa torrent cache",
          "",
          "Xóa"
        );
        bindClick(tsClearBtn, async function () {
          if (!tsHost()) {
            Lampa.Noty.show("Chưa cấu hình");
            return;
          }
          Lampa.Noty.show("⏳ Đang xóa...");
          var count = await tsClearAll();
          Lampa.Noty.show(
            count >= 0
              ? "✅ Đã xóa " + count + " torrent"
              : "❌ Lỗi"
          );
        });
        gTS.append(tsClearBtn);
        wrap.append(gTS);

        // Torrentio config
        var gTio = makeGroup("🧲 Torrentio");
        gTio.append(
          makeInput(
            "Config",
            "",
            s.tio_config || "Mặc định",
            "Torrentio Config",
            "tio_config",
            s
          )
        );
        var tioStatus = $L(
          '<div class="kk-status" style="display:none"></div>'
        );
        var tioTestBtn = makeActionItem("🧪 Test", "", "Test");
        bindClick(tioTestBtn, async function () {
          tioStatus
            .show()
            .attr("class", "kk-status kk-status-loading")
            .html("⏳...");
          try {
            var cfg = parseTioConfig(tioConfig());
            var url =
              TIO_BASE +
              (cfg ? "/" + cfg : "") +
              "/stream/movie/tt0111161.json";
            var r = await fetch(url);
            if (r.ok) {
              var d = await r.json();
              tioStatus
                .attr("class", "kk-status kk-status-ok")
                .html(
                  "✅ " + ((d.streams || []).length) + " streams"
                );
            } else {
              tioStatus
                .attr("class", "kk-status kk-status-err")
                .html("❌ HTTP " + r.status);
            }
          } catch (e) {
            tioStatus
              .attr("class", "kk-status kk-status-err")
              .html("❌ " + esc(e.message || ""));
          }
        });
        gTio.append(tioTestBtn).append(tioStatus);
        wrap.append(gTio);

        // AIO
        var gAio = makeGroup("🌊 AIOStreams");
        gAio.append(
          makeInput(
            "URL",
            "",
            s.aio_url || "Chưa cài",
            "AIO URL",
            "aio_url",
            s
          )
        );
        var aioStatus = $L(
          '<div class="kk-status" style="display:none"></div>'
        );
        var aioTestBtn = makeActionItem("🧪 Test", "", "Test");
        bindClick(aioTestBtn, async function () {
          var base = parseAioUrl(aioUrl());
          if (!base) {
            aioStatus
              .show()
              .attr("class", "kk-status kk-status-err")
              .html("❌ Chưa nhập");
            return;
          }
          aioStatus
            .show()
            .attr("class", "kk-status kk-status-loading")
            .html("⏳...");
          try {
            var r = await fetch(
              base + "/stream/movie/tt0111161.json"
            );
            if (r.ok) {
              var d = await r.json();
              aioStatus
                .attr("class", "kk-status kk-status-ok")
                .html(
                  "✅ " + ((d.streams || []).length) + " streams"
                );
            } else {
              aioStatus
                .attr("class", "kk-status kk-status-err")
                .html("❌ HTTP " + r.status);
            }
          } catch (e) {
            aioStatus
              .attr("class", "kk-status kk-status-err")
              .html("❌ " + esc(e.message || ""));
          }
        });
        gAio.append(aioTestBtn).append(aioStatus);
        wrap.append(gAio);

        // Data management
        var gData = makeGroup("🕘 Dữ liệu");
        var dcw = makeActionItem(
          "Xóa Continue Watching",
          getCW().length + " mục",
          "Xóa"
        );
        bindClick(dcw, function () {
          localStorage.removeItem(CW_KEY);
          Lampa.Noty.show("OK");
          comp.create();
        });
        var dhist = makeActionItem(
          "Xóa lịch sử",
          getHistory().length + " mục",
          "Xóa"
        );
        bindClick(dhist, function () {
          localStorage.removeItem(HIST_KEY);
          Lampa.Noty.show("OK");
          comp.create();
        });
        var dprog = makeActionItem(
          "Xóa tiến trình",
          Object.keys(getProgressMap()).length + " mục",
          "Xóa"
        );
        bindClick(dprog, function () {
          localStorage.removeItem(PROG_KEY);
          Lampa.Noty.show("OK");
          comp.create();
        });
        gData.append(dcw).append(dhist).append(dprog);
        wrap.append(gData);

        // Reset
        var gReset = makeGroup("");
        var resetBtn = makeActionItem("🗑️ Reset toàn bộ", "", "Reset");
        resetBtn.find(".kk-settings-value").css("color", "#f87171");
        bindClick(resetBtn, function () {
          localStorage.removeItem(STG_KEY);
          localStorage.removeItem(CW_KEY);
          localStorage.removeItem(HIST_KEY);
          localStorage.removeItem(PROG_KEY);
          _genreCache = { movie: null, tv: null };
          Lampa.Activity.backward();
        });
        gReset.append(resetBtn);
        wrap.append(gReset);

        scroll.append(wrap);
        comp.start();
      };

      function makeGroup(title) {
        var g = $L('<div class="kk-settings-group"></div>');
        if (title)
          g.append(
            '<div class="kk-settings-group-title">' + title + "</div>"
          );
        return g;
      }

      function makeActionItem(name, desc, value) {
        return $L(
          '<div class="kk-settings-item selector">' +
            '<div class="kk-settings-label">' +
            '<div class="kk-settings-name">' +
            esc(name) +
            "</div>" +
            (desc
              ? '<div class="kk-settings-desc">' + esc(desc) + "</div>"
              : "") +
            "</div>" +
            '<div class="kk-settings-value">' +
            esc(value) +
            "</div>" +
            "</div>"
        );
      }

      function makeOption(name, desc, active, callback) {
        var item = makeActionItem(name, desc, active ? "✅" : "○");
        if (active)
          item.find(".kk-settings-value").css("color", "#4ade80");
        bindClick(item, callback);
        return item;
      }

      function makeInput(name, placeholder, currentVal, promptTitle, key, settings) {
        var item = makeActionItem(name, placeholder, currentVal);
        bindClick(item, function () {
          try {
            if (Lampa.Input && Lampa.Input.edit) {
              Lampa.Input.edit(
                {
                  title: promptTitle,
                  value: settings[key] || "",
                  free: true,
                  nosave: true,
                },
                function (v) {
                  v = (v || "").trim();
                  var obj2 = {};
                  obj2[key] = v;
                  setSetting(obj2);
                  settings[key] = v;
                  item
                    .find(".kk-settings-value")
                    .text(v || currentVal);
                }
              );
              return;
            }
          } catch (e) {}
          var v = window.prompt(promptTitle, settings[key] || "");
          if (v !== null) {
            v = v.trim();
            var obj2 = {};
            obj2[key] = v;
            setSetting(obj2);
            settings[key] = v;
            item.find(".kk-settings-value").text(v || currentVal);
          }
        });
        return item;
      }

      this.start = function () {
        activateController(scroll);
        setupScroll(scroll);
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return scroll.render();
      };
      this.destroy = function () {
        scroll.destroy();
      };
    });
  } // end startPlugin

  if (window.appready) startPlugin();
  else
    Lampa.Listener.follow("app", function (e) {
      if (e.type === "ready") startPlugin();
    });
})();