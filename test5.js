/* KKPhim + OPhim Plugin for Lampa MX
 * Plugin theo pattern LNUM/KP:
 *  - Đăng ký vào Lampa.Api.sources
 *  - Inject menu item vào Lampa menu
 *  - Lampa tự build UI đẹp qua component 'category' có sẵn
 *  - Khi click phim, Lampa tự gọi full() để lấy chi tiết
 *
 * Version: 3.0.1 - Return loadPart function (LNUM pattern)
 */
(function () {
  'use strict';

  if (window.kkphim_lampa_plugin) return;
  window.kkphim_lampa_plugin = true;

  /* ============================================================
     CONFIG
  ============================================================ */
  var SOURCE_NAME  = 'kkphim';
  var SOURCE_TITLE = 'KKPhim';

  var SOURCES = {
    kkphim: {
      name: 'KKPhim',
      api:  'https://phimapi.com/',
      img:  'https://phimimg.com/'
    },
    ophim: {
      name: 'OPhim',
      api:  'https://ophim1.com/',
      img:  'https://img.ophim.live/uploads/movies/'
    }
  };

  var CATS = [
    { url: 'phim-moi-cap-nhat', title: 'Phim mới cập nhật' },
    { url: 'phim-le',           title: 'Phim lẻ mới' },
    { url: 'phim-bo',           title: 'Phim bộ mới' },
    { url: 'hoat-hinh',         title: 'Hoạt hình' },
    { url: 'tv-shows',          title: 'TV Shows' },
    { url: 'phim-vietsub',      title: 'Phim Vietsub' },
    { url: 'phim-thuyet-minh',  title: 'Phim thuyết minh' }
  ];

  /* ============================================================
     STORAGE
  ============================================================ */
  function loadCfg() {
    try { return JSON.parse(localStorage.getItem('kkphim_lampa_cfg') || '{}'); }
    catch (e) { return {}; }
  }
  function saveCfg(o) {
    try {
      var c = loadCfg();
      Object.keys(o).forEach(function (k) { c[k] = o[k]; });
      localStorage.setItem('kkphim_lampa_cfg', JSON.stringify(c));
    } catch (e) {}
  }
  function isEnabled(key) {
    var c = loadCfg();
    if (c['source_' + key + '_enabled'] === undefined) return true;
    return c['source_' + key + '_enabled'] === true;
  }
  function getSourceKey() {
    return loadCfg().active_source || 'kkphim';
  }
  function getEnabledSourceKeys() {
    return Object.keys(SOURCES).filter(isEnabled);
  }

  /* ============================================================
     NETWORK - dùng Lampa.Reguest
  ============================================================ */
  var network = new Lampa.Reguest();
  network.timeout(15000);

  function getJSON(url, onOk, onErr) {
    network.silent(url, function (data) {
      if (typeof data === 'string') {
        try { onOk(JSON.parse(data)); } catch (e) { onOk(null); }
      } else {
        onOk(data);
      }
    }, function () { if (onErr) onErr(); });
  }

  function s_(v) { return v == null ? '' : String(v); }
  function num(v, fb) { var n = parseInt(v, 10); return isNaN(n) ? (fb || 0) : n; }
  function validUrl(u) {
    return typeof u === 'string' && u.length > 5 &&
      (u.indexOf('http://') === 0 || u.indexOf('https://') === 0);
  }
  function fixImg(u, srcKey) {
    if (!u) return '';
    if (u.indexOf('http') === 0) return u;
    return (SOURCES[srcKey] || SOURCES.kkphim).img + u;
  }

  /* ============================================================
     SCORING
  ============================================================ */
  function nStr(str) {
    return s_(str).toLowerCase().trim()
      .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '')
      .replace(/\s+/g, ' ');
  }
  function getBaseName(name) {
    if (!name) return '';
    return s_(name)
      .replace(/[\s\-]*[\(\[]?\s*[Ss]eason\s*\d+\s*[\)\]]?/gi, '')
      .replace(/[\s\-]*[\(\[]?\s*[Pp]h[aầ]n\s*\d+\s*[\)\]]?/gi, '')
      .replace(/[\s\-]*[\(\[]?\s*[Mm][uù]a\s*\d+\s*[\)\]]?/gi, '')
      .replace(/[\s\-]*\bS\d+\b/g, '')
      .trim();
  }
  function mScore(item, title, orig, year) {
    if (!item) return 0;
    var score = 0;
    var nT = nStr(title), nO = nStr(orig);
    var n1 = nStr(item.name || item.title);
    var n2 = nStr(item.origin_name || item.original_name);
    var nTb = nStr(getBaseName(title));
    var nOb = nStr(getBaseName(orig));
    var n1b = nStr(getBaseName(item.name || item.title));
    var n2b = nStr(getBaseName(item.origin_name || item.original_name));

    if (nT && (n1 === nT || n2 === nT)) score += 100;
    else if (nO && nO !== nT && (n1 === nO || n2 === nO)) score += 100;
    else if (nTb && (n1b === nTb || n2b === nTb)) score += 90;
    else if (nOb && nOb !== nTb && (n1b === nOb || n2b === nOb)) score += 90;
    else if (nT && nT.length >= 3 && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1)) score += 60;
    else if (nO && nO.length >= 3 && (n1.indexOf(nO) > -1 || nO.indexOf(n1) > -1)) score += 55;
    else if (nTb && nTb.length >= 3 && (n1b.indexOf(nTb) > -1 || nTb.indexOf(n1b) > -1)) score += 40;
    else if (nOb && nOb.length >= 3 && (n2b.indexOf(nOb) > -1 || nOb.indexOf(n1b) > -1)) score += 40;

    if (score > 0 && year && item.year) {
      var iy = num(item.year);
      var ty = num(year);
      if (iy === ty) score += 30;
      else if (Math.abs(iy - ty) <= 1) score += 15;
    }
    return score;
  }
  function mBest(items, title, orig, year) {
    if (!items || !items.length) return null;
    var scored = items.map(function (it) {
      return { item: it, score: mScore(it, title, orig, year) };
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    if (scored[0].score > 0) return scored[0].item;
    if (items.length === 1) return items[0];
    if (year && items.length <= 3) return items[0];
    return null;
  }

  /* ============================================================
     API CALLS
  ============================================================ */
  function searchAPI(srcKey, kw, page) {
    var src = SOURCES[srcKey];
    if (!src) return Promise.resolve([]);
    return new Promise(function (resolve) {
      getJSON(
        src.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) +
        '&limit=20&page=' + (page || 1),
        function (d) {
          if (!d) return resolve([]);
          var items = (d.data && d.data.items) || d.items || [];
          resolve(items.filter(function (i) { return i && i.slug; }));
        },
        function () { resolve([]); }
      );
    });
  }

  function detailAPI(srcKey, slug) {
    var src = SOURCES[srcKey];
    if (!src) return Promise.resolve(null);
    return new Promise(function (resolve) {
      getJSON(src.api + 'v1/api/phim/' + slug, function (d) {
        if (!d) return resolve(null);
        if (d.status === 'success' && d.data) {
          return resolve({
            movie: d.data.item || {},
            episodes: d.data.episodes || []
          });
        }
        resolve(null);
      }, function () { resolve(null); });
    });
  }

  function listAPI(srcKey, cat, page) {
    var src = SOURCES[srcKey];
    if (!src) return Promise.resolve({ items: [], total_pages: 1 });
    return new Promise(function (resolve) {
      getJSON(
        src.api + 'v1/api/danh-sach/' + cat + '?page=' + (page || 1),
        function (d) {
          if (!d || !d.data) return resolve({ items: [], total_pages: 1 });
          resolve({
            items: (d.data.items || []).filter(function (i) { return i && i.slug; }),
            total_pages: d.data.totalPages || 1
          });
        },
        function () { resolve({ items: [], total_pages: 1 }); }
      );
    });
  }

  /* ============================================================
     CONVERT TO LAMPA FORMAT (theo pattern LNUM)
  ============================================================ */
  function convertItem(item, srcKey) {
    if (!item) return null;
    var ec = s_(item.episode_current);
    var isSeries = item.type === 'series' || item.type === 'tvshows' ||
      (ec && ec !== 'Full' && ec !== 'full');
    var poster = fixImg(item.poster_url || item.thumb_url, srcKey);
    var title  = s_(item.name || item.title);
    var orig   = s_(item.origin_name || item.original_name);
    var year   = s_(item.year);

    return {
      id:             SOURCE_NAME + '_' + (item.slug || ''),
      source:         SOURCE_NAME,
      title:          title,
      name:           title,
      original_title: orig,
      original_name:  orig,
      overview:       s_(item.content || item.description || ''),
      description:    s_(item.content || item.description || ''),
      poster_path:    poster,
      img:            poster,
      backdrop_path:  poster,
      background_image: poster,
      type:           isSeries ? 'tv' : 'movie',
      vote_average:   0,
      vote_count:     0,
      year:           year,
      release_date:   year ? (year + '-01-01') : '',
      first_air_date: year ? (year + '-01-01') : '',
      _srcKey:        srcKey,
      _slug:          s_(item.slug)
    };
  }

  /* ============================================================
     SOURCE METHODS - pattern LNUM
  ============================================================ */
  function makeRequest(srcKey, cat, title, callback) {
    listAPI(srcKey, cat, 1).then(function (res) {
      var items = (res.items || []).map(function (i) { return convertItem(i, srcKey); }).filter(Boolean);
      callback({
        title: title,
        url: cat,
        results: items,
        page: 1,
        total_pages: res.total_pages || 1,
        more: 1 < (res.total_pages || 1),
        source: SOURCE_NAME
      });
    });
  }

  // main = Home - nhiều row (categories)
  function main(params, onSuccess, onError) {
    var srcKey = getSourceKey();
    var partsData = CATS.map(function (cat) {
      return function (callback) {
        makeRequest(srcKey, cat.url, cat.title, callback);
      };
    });

    function loadPart(partLoaded, partEmpty) {
      Lampa.Api.partNext(partsData, 5, partLoaded, partEmpty);
    }
    loadPart(onSuccess, onError);
    return loadPart;  // ← QUAN TRỌNG: return function
  }

  // category = click "Xem thêm" trên row -> vào trang list
  function category(params, onSuccess, onError) {
    var srcKey = getSourceKey();
    var url = params.url || '';
    var cat = CATS.find(function (c) { return c.url === url; });

    if (!cat) {
      onSuccess({ results: [], page: 1, total_pages: 1, source: SOURCE_NAME });
      return;
    }

    function loadPart(partLoaded, partEmpty) {
      listAPI(srcKey, cat.url, params.page || 1).then(function (res) {
        var items = (res.items || []).map(function (i) { return convertItem(i, srcKey); }).filter(Boolean);
        partLoaded({
          title: cat.title,
          url: cat.url,
          results: items,
          page: params.page || 1,
          total_pages: res.total_pages || 1,
          more: (params.page || 1) < (res.total_pages || 1),
          source: SOURCE_NAME
        });
      });
    }
    loadPart(onSuccess, onError);
    return loadPart;  // ← QUAN TRỌNG: return function
  }

  // list = giống category
  function list(params, onSuccess, onError) {
    return category(params, onSuccess, onError);
  }

  // full = trang chi tiết phim - pattern LNUM
  function full(params, onSuccess, onError) {
    var card = params.card || params;
    var srcKey = card._srcKey || getSourceKey();
    var slug = card._slug || s_(card.id).replace(SOURCE_NAME + '_', '');

    if (!slug) { onSuccess({}); return; }

    detailAPI(srcKey, slug).then(function (det) {
      if (!det) { onSuccess({}); return; }
      var m = det.movie || {};
      var eps = det.episodes || [];
      var ec = s_(m.episode_current);
      var isSeries = m.type === 'series' || m.type === 'tvshows' ||
        (ec && ec !== 'Full' && ec !== 'full') || (eps.length > 0 && eps[0].server_data && eps[0].server_data.length > 1);

      // Gom episodes
      var lampaEps = [];
      eps.forEach(function (srv, sIdx) {
        if (!srv) return;
        var sname = s_(srv.server_name) || ('Server ' + (sIdx + 1));
        var sdata = Array.isArray(srv.server_data) ? srv.server_data : [];
        sdata.forEach(function (ep) {
          if (!ep) return;
          var epName = s_(ep.name) || '';
          var url = ep.link_m3u8 || ep.link_embed || '';
          if (!validUrl(url)) return;
          lampaEps.push({
            title: epName || 'Tập ' + (lampaEps.length + 1),
            season: 1,
            number: lampaEps.length + 1,
            source: sname,
            url: url,
            files: [{ quality: sname, url: url }]
          });
        });
      });

      var item = {
        id: SOURCE_NAME + '_' + slug,
        source: SOURCE_NAME,
        type: isSeries ? 'tv' : 'movie',
        title: s_(m.name || m.title),
        name: s_(m.name || m.title),
        original_title: s_(m.origin_name || m.original_name),
        original_name: s_(m.origin_name || m.original_name),
        overview: s_(m.content || m.description || ''),
        description: s_(m.content || m.description || ''),
        img: fixImg(m.poster_url || m.thumb_url, srcKey),
        poster_path: fixImg(m.poster_url || m.thumb_url, srcKey),
        background_image: fixImg(m.poster_url || m.thumb_url, srcKey),
        backdrop_path: fixImg(m.poster_url || m.thumb_url, srcKey),
        year: s_(m.year),
        release_date: s_(m.year) ? s_(m.year) + '-01-01' : '',
        first_air_date: s_(m.year) ? s_(m.year) + '-01-01' : '',
        episodes: lampaEps,
        episode_parser: function (ep, onpick) {
          var files = (ep.files || []).map(function (f) {
            return { quality: f.quality, url: f.url };
          });
          onpick(files);
        },
        _srcKey: srcKey,
        _slug: slug
      };
      onSuccess(item);
    });
  }

  // search = tìm kiếm
  function search(params, onSuccess, onError) {
    var srcKey = getSourceKey();
    var query = params.query || params.title || '';
    var page = params.page || 1;

    searchAPI(srcKey, query, page).then(function (items) {
      var results = items.map(function (i) { return convertItem(i, srcKey); }).filter(Boolean);
      onSuccess({
        results: results,
        page: page,
        total_pages: 1,
        query: query
      });
    });
  }

  function clear() { network.clear(); }

  function person(params, onSuccess, onError) { onSuccess({}); }
  function seasons(params, onSuccess, onError) { onSuccess({}); }

  /* ============================================================
     PLUGIN DEFINITION
  ============================================================ */
  var KK = {
    SOURCE_NAME:  SOURCE_NAME,
    SOURCE_TITLE: SOURCE_TITLE,
    main:         main,
    category:     category,
    list:         list,
    full:         full,
    search:       search,
    clear:        clear,
    person:       person,
    seasons:      seasons
  };

  function startPlugin() {
    if (Lampa.Api.sources && Lampa.Api.sources[SOURCE_NAME]) {
      console.log('[KKPhim] Already installed');
      return;
    }

    // 1. Đăng ký source
    Lampa.Api.sources[SOURCE_NAME] = KK;
    Object.defineProperty(Lampa.Api.sources, SOURCE_NAME, {
      get: function () { return KK; },
      configurable: true
    });

    // 2. Inject menu item vào Lampa menu (giống LNUM)
    var menuItem = $(
      '<li class="menu__item selector" data-action="kkphim">' +
        '<div class="menu__ico">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">' +
            '<path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4h-4z"/>' +
          '</svg>' +
        '</div>' +
        '<div class="menu__text">KKPhim</div>' +
      '</li>'
    );

    menuItem.on('hover:enter', function () {
      Lampa.Activity.push({
        title: 'KKPhim',
        component: 'category',
        source: SOURCE_NAME,
        page: 1,
        url: ''
      });
    });

    // Append menu khi DOM ready
    function appendMenu() {
      if ($('.menu__list').length) {
        $('.menu__list').first().append(menuItem);
      } else {
        setTimeout(appendMenu, 200);
      }
    }
    appendMenu();

    // 3. Settings
    if (Lampa.SettingsApi) {
      try {
        Lampa.SettingsApi.addParam({
          component: 'interface',
          param: {
            name: 'kkphim_active_source',
            type: 'select',
            values: { 'kkphim': 'KKPhim (phimapi.com)', 'ophim': 'OPhim (ophim1.com)' },
            default: 'kkphim'
          },
          field: { name: 'KKPhim — Nguồn mặc định' },
          onChange: function (v) { saveCfg({ active_source: v }); }
        });

        Lampa.SettingsApi.addParam({
          component: 'interface',
          param: {
            name: 'kkphim_enable_kkphim',
            type: 'select',
            values: { 'on': 'Bật', 'off': 'Tắt' },
            default: 'on'
          },
          field: { name: '  • Bật KKPhim' },
          onChange: function (v) { saveCfg({ source_kkphim_enabled: v === 'on' }); }
        });

        Lampa.SettingsApi.addParam({
          component: 'interface',
          param: {
            name: 'kkphim_enable_ophim',
            type: 'select',
            values: { 'on': 'Bật', 'off': 'Tắt' },
            default: 'on'
          },
          field: { name: '  • Bật OPhim' },
          onChange: function (v) { saveCfg({ source_ophim_enabled: v === 'on' }); }
        });
      } catch (e) {}
    }

    Lampa.Noty.show('KKPhim Parser đã sẵn sàng');
    console.log('[KKPhim Parser] v3.0.1 OK — Pattern LNUM + return loadPart');
  }

  if (window.appready) {
    setTimeout(startPlugin, 100);
  } else {
    Lampa.Listener.follow('app', function (event) {
      if (event.type === 'ready') setTimeout(startPlugin, 100);
    });
  }
})();
