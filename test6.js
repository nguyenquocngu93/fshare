/* KKPhim + OPhim Plugin for Lampa MX
 * Fork 100% từ pattern LNUM (https://levende.github.io/lampa-plugins/lnum.js)
 * Chỉ thay API endpoint + convert data format sang KKPhim/OPhim
 *
 * Version: 4.0.0 - Fork LNUM pattern
 */
(function () {
  'use strict';

  if (window.kkphim_lampa_plugin) return;
  window.kkphim_lampa_plugin = true;

  addTranslates();

  var SOURCE_NAME  = 'kkphim';
  var CACHE_SIZE   = 100;
  var CACHE_TIME   = 1000 * 60 * 60 * 3; //3h
  var cache        = {};
  var COLLECTIONS  = [];

  // Cấu hình nguồn KKPhim/OPhim
  var SOURCES = {
    kkphim: {
      api: 'https://phimapi.com/',
      img: 'https://phimimg.com/',
      token: 'kkphim'
    },
    ophim: {
      api: 'https://ophim1.com/',
      img: 'https://img.ophim.live/uploads/movies/',
      token: 'ophim'
    }
  };

  // Lưu config nguồn nào đang dùng
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
  function getActiveSource() {
    return loadCfg().active_source || 'kkphim';
  }
  function isEnabled(key) {
    var c = loadCfg();
    if (c['source_' + key + '_enabled'] === undefined) return true;
    return c['source_' + key + '_enabled'] === true;
  }

  // Categories theo API phimapi.com
  var BASE_CATEGORIES = {
    new:     'phim-moi-cap-nhat',
    movies:  'phim-le',
    tv:      'phim-bo',
    cartoons:'hoat-hinh',
    tvshows: 'tv-shows',
    vietsub: 'phim-vietsub',
    thuyetminh: 'phim-thuyet-minh'
  };

  var LINE_TYPES = {
    base: 'base'
  };

  var CAT_NAME = SOURCE_NAME.toUpperCase();

  var DISPLAY_OPTIONS = {
    new:        { title: 'Phim mới cập nhật' },
    movies:     { title: 'Phim lẻ mới' },
    tv:         { title: 'Phim bộ mới' },
    cartoons:   { title: 'Hoạt hình' },
    tvshows:    { title: 'TV Shows' },
    vietsub:    { title: 'Phim Vietsub' },
    thuyetminh: { title: 'Phim thuyết minh' }
  };

  // ========== CACHE (giống LNUM) ==========
  function getCache(key) {
    var res = cache[key];
    if (res) {
      var ts = Date.now() - CACHE_TIME;
      if (res.timestamp > ts) return res.value;
      for (var ID in cache) {
        var node = cache[ID];
        if (!(node && node.timestamp > ts)) delete cache[ID];
      }
    }
    return null;
  }

  function setCache(key, value) {
    var ts = Date.now();
    var size = Object.keys(cache).length;
    if (size >= CACHE_SIZE) {
      var cacheTs = ts - CACHE_TIME;
      for (var ID in cache) {
        var node = cache[ID];
        if (!(node && node.timestamp > cacheTs)) delete cache[ID];
      }
      size = Object.keys(cache).length;
      if (size >= CACHE_SIZE) {
        var tss = [];
        for (var i in cache) {
          var n = cache[i];
          tss.push(n && n.timestamp || 0);
        }
        tss.sort(function (a, b) { return a - b; });
        cacheTs = tss[Math.floor(tss.length / 2)];
        for (var j in cache) {
          var n2 = cache[j];
          if (!(n2 && n2.timestamp > cacheTs)) delete cache[j];
        }
      }
    }
    cache[key] = { timestamp: ts, value: value };
  }

  // ========== NETWORK (giống LNUM) ==========
  var network = new Lampa.Reguest();

  function s_(v) { return v == null ? '' : String(v); }
  function num(v, fb) { var n = parseInt(v, 10); return isNaN(n) ? (fb || 0) : n; }
  function validUrl(u) {
    return typeof u === 'string' && u.length > 5 &&
      (u.indexOf('http://') === 0 || u.indexOf('https://') === 0);
  }
  function fixImg(u, src) {
    if (!u) return '';
    if (u.indexOf('http') === 0) return u;
    return SOURCES[src].img + u;
  }

  // ========== CONVERT DATA (KKPhim → Lampa format) ==========
  function normalizeItem(item, srcKey) {
    if (!item || !item.slug) return null;

    var ec = s_(item.episode_current);
    var isSeries = item.type === 'series' || item.type === 'tvshows' ||
      (ec && ec !== 'Full' && ec !== 'full');
    var movieType = isSeries ? 'tv' : 'movie';

    var poster = fixImg(item.poster_url || item.thumb_url, srcKey);
    var title  = s_(item.name || item.title);
    var orig   = s_(item.origin_name || item.original_name);
    var year   = s_(item.year);

    return {
      id:                SOURCE_NAME + '_' + item.slug,
      source:            SOURCE_NAME,
      type:              movieType,
      title:             title,
      name:              title,
      original_title:    orig,
      original_name:     orig,
      overview:          s_(item.content || item.description || ''),
      description:       s_(item.content || item.description || ''),
      poster_path:       poster,
      img:               poster,
      backdrop_path:     poster,
      background_image:  poster,
      vote_average:      0,
      vote_count:        0,
      year:              year,
      release_date:      year ? (year + '-01-01') : '',
      first_air_date:    year ? (year + '-01-01') : '',
      promo_title:       title,
      promo:             s_(item.content || item.description || ''),
      _srcKey:           srcKey,
      _slug:             item.slug
    };
  }

  // ========== API CALLS ==========
  function listFromAPI(srcKey, cat, page, onComplete, onError) {
    var src = SOURCES[srcKey];
    var url = src.api + 'v1/api/danh-sach/' + cat + '?page=' + (page || 1);

    network.timeout(15000);
    network.silent(url, function (data) {
      if (!data) { onError(new Error('Empty')); return; }
      var rawItems = (data.data && data.data.items) || [];
      var results = rawItems.map(function (i) { return normalizeItem(i, srcKey); }).filter(Boolean);
      onComplete({
        results: results,
        page: page || 1,
        total_pages: (data.data && data.data.totalPages) || 1,
        total_results: results.length
      });
    }, function (err) { onError(err); });
  }

  function getFromCache(url, onComplete, onError) {
    var cached = getCache(url);
    if (cached) {
      onComplete(cached);
    } else {
      listFromAPI(getActiveSource(), url.split('?')[0].split('/').pop(), 1,
        function (json) { setCache(url, json); onComplete(json); },
        onError);
    }
  }

  // ========== SOURCE METHODS (giống LNUM) ==========
  function makeRequest(cat, title, callback) {
    var srcKey = getActiveSource();
    listFromAPI(srcKey, cat, 1, function (json) {
      var result = {
        title: cat,
        url: cat,
        title: title,
        page: 1,
        total_results: json.total_results || 0,
        total_pages: json.total_pages || 1,
        more: json.total_pages > 1,
        results: json.results || [],
        source: SOURCE_NAME
      };
      callback(result);
    }, function (err) {
      callback({ error: err });
    });
  }

  function main(params, onSuccess, onError) {
    var partsData = [];

    if (DISPLAY_OPTIONS.new.visible !== false) {
      partsData.push(function (callback) {
        makeRequest(BASE_CATEGORIES.new, DISPLAY_OPTIONS.new.title, callback);
      });
    }
    if (DISPLAY_OPTIONS.movies.visible !== false) {
      partsData.push(function (callback) {
        makeRequest(BASE_CATEGORIES.movies, DISPLAY_OPTIONS.movies.title, callback);
      });
    }
    if (DISPLAY_OPTIONS.tv.visible !== false) {
      partsData.push(function (callback) {
        makeRequest(BASE_CATEGORIES.tv, DISPLAY_OPTIONS.tv.title, callback);
      });
    }
    if (DISPLAY_OPTIONS.cartoons.visible !== false) {
      partsData.push(function (callback) {
        makeRequest(BASE_CATEGORIES.cartoons, DISPLAY_OPTIONS.cartoons.title, callback);
      });
    }
    if (DISPLAY_OPTIONS.tvshows.visible !== false) {
      partsData.push(function (callback) {
        makeRequest(BASE_CATEGORIES.tvshows, DISPLAY_OPTIONS.tvshows.title, callback);
      });
    }
    if (DISPLAY_OPTIONS.vietsub.visible !== false) {
      partsData.push(function (callback) {
        makeRequest(BASE_CATEGORIES.vietsub, DISPLAY_OPTIONS.vietsub.title, callback);
      });
    }
    if (DISPLAY_OPTIONS.thuyetminh.visible !== false) {
      partsData.push(function (callback) {
        makeRequest(BASE_CATEGORIES.thuyetminh, DISPLAY_OPTIONS.thuyetminh.title, callback);
      });
    }

    function loadPart(partLoaded, partEmpty) {
      Lampa.Api.partNext(partsData, 5, partLoaded, partEmpty);
    }
    loadPart(onSuccess, onError);
    return loadPart;
  }

  function category(params, onSuccess, onError) {
    var cat = params.url || '';
    var page = params.page || 1;
    var srcKey = getActiveSource();

    // Tìm title theo url
    var titleMap = {};
    Object.keys(BASE_CATEGORIES).forEach(function (k) {
      titleMap[BASE_CATEGORIES[k]] = DISPLAY_OPTIONS[k] ? DISPLAY_OPTIONS[k].title : k;
    });
    var title = titleMap[cat] || cat;

    function loadPart(partLoaded, partEmpty) {
      listFromAPI(srcKey, cat, page, function (json) {
        partLoaded({
          title: title,
          url: cat,
          results: json.results || [],
          page: page,
          total_pages: json.total_pages || 1,
          more: page < (json.total_pages || 1),
          source: SOURCE_NAME
        });
      }, function (err) {
        partEmpty(err);
      });
    }
    loadPart(onSuccess, onError);
    return loadPart;
  }

  function list(params, onSuccess, onError) {
    return category(params, onSuccess, onError);
  }

  function full(params, onSuccess, onError) {
    var card = params.card || params;
    var srcKey = card._srcKey || getActiveSource();
    var slug = card._slug || s_(card.id).replace(SOURCE_NAME + '_', '');

    if (!slug) { onSuccess({}); return; }

    var url = SOURCES[srcKey].api + 'v1/api/phim/' + slug;
    network.timeout(15000);
    network.silent(url, function (data) {
      if (!data || data.status !== 'success' || !data.data) {
        onSuccess({});
        return;
      }

      var m = data.data.item || {};
      var eps = data.data.episodes || [];
      var ec = s_(m.episode_current);
      var isSeries = m.type === 'series' || m.type === 'tvshows' ||
        (ec && ec !== 'Full' && ec !== 'full') ||
        (eps.length > 0 && eps[0].server_data && eps[0].server_data.length > 1);
      var movieType = isSeries ? 'tv' : 'movie';

      // Gom episodes
      var lampaEps = [];
      eps.forEach(function (srv, sIdx) {
        if (!srv) return;
        var sname = s_(srv.server_name) || ('Server ' + (sIdx + 1));
        var sdata = Array.isArray(srv.server_data) ? srv.server_data : [];
        sdata.forEach(function (ep) {
          if (!ep) return;
          var epName = s_(ep.name) || '';
          var epUrl = ep.link_m3u8 || ep.link_embed || '';
          if (!validUrl(epUrl)) return;
          lampaEps.push({
            title: epName || ('Tập ' + (lampaEps.length + 1)),
            season: 1,
            number: lampaEps.length + 1,
            source: sname,
            url: epUrl,
            files: [{ quality: sname, url: epUrl }]
          });
        });
      });

      var poster = fixImg(m.poster_url || m.thumb_url, srcKey);
      var title  = s_(m.name || m.title);
      var orig   = s_(m.origin_name || m.original_name);
      var year   = s_(m.year);

      var item = {
        id: SOURCE_NAME + '_' + slug,
        source: SOURCE_NAME,
        type: movieType,
        title: title,
        name: title,
        original_title: orig,
        original_name: orig,
        overview: s_(m.content || m.description || ''),
        description: s_(m.content || m.description || ''),
        poster_path: poster,
        img: poster,
        backdrop_path: poster,
        background_image: poster,
        vote_average: 0,
        vote_count: 0,
        year: year,
        release_date: year ? (year + '-01-01') : '',
        first_air_date: year ? (year + '-01-01') : '',
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
    }, function (err) {
      onSuccess({});
    });
  }

  function search(params, onSuccess, onError) {
    var query = params.query || params.title || '';
    var page = params.page || 1;
    var srcKey = getActiveSource();
    var url = SOURCES[srcKey].api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(query) + '&limit=20&page=' + page;

    network.timeout(15000);
    network.silent(url, function (data) {
      if (!data) { onSuccess({ results: [], page: 1 }); return; }
      var rawItems = (data.data && data.data.items) || [];
      var results = rawItems.map(function (i) { return normalizeItem(i, srcKey); }).filter(Boolean);
      onSuccess({
        results: results,
        page: page,
        total_pages: 1,
        query: query
      });
    }, function () {
      onSuccess({ results: [], page: 1 });
    });
  }

  function clear() { network.clear(); }

  function person(params, onSuccess, onError) { onSuccess({}); }
  function seasons(params, onSuccess, onError) { onSuccess({}); }

  // ========== TRANSLATIONS (giống LNUM) ==========
  function addTranslates() {
    Lampa.Lang.add({
      kkphim_title: { en: 'KKPhim', ru: 'KKPhim', uk: 'KKPhim', vi: 'KKPhim' }
    });
  }

  // ========== PLUGIN DEFINITION (giống LNUM) ==========
  var KK = {
    SOURCE_NAME:  SOURCE_NAME,
    SOURCE_TITLE: CAT_NAME,
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
      return;
    }

    Lampa.Api.sources[SOURCE_NAME] = KK;
    Object.defineProperty(Lampa.Api.sources, SOURCE_NAME, {
      get: function () { return KK; },
      configurable: true
    });

    // Settings (giống LNUM)
    if (Lampa.SettingsApi) {
      try {
        Lampa.SettingsApi.addComponent({
          component: 'kkphim_settings',
          name: 'KKPhim',
          icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4h-4z"/></svg>'
        });

        Lampa.SettingsApi.addParam({
          component: 'kkphim_settings',
          param: {
            name: 'kkphim_active_source',
            type: 'select',
            values: { 'kkphim': 'KKPhim (phimapi.com)', 'ophim': 'OPhim (ophim1.com)' },
            default: 'kkphim'
          },
          field: { name: 'Nguồn mặc định' },
          onChange: function (v) { saveCfg({ active_source: v }); }
        });

        Lampa.SettingsApi.addParam({
          component: 'kkphim_settings',
          param: {
            name: 'kkphim_enable_kkphim',
            type: 'select',
            values: { 'true': 'Bật', 'false': 'Tắt' },
            default: 'true'
          },
          field: { name: 'Bật KKPhim' },
          onChange: function (v) { saveCfg({ source_kkphim_enabled: v === 'true' }); }
        });

        Lampa.SettingsApi.addParam({
          component: 'kkphim_settings',
          param: {
            name: 'kkphim_enable_ophim',
            type: 'select',
            values: { 'true': 'Bật', 'false': 'Tắt' },
            default: 'true'
          },
          field: { name: 'Bật OPhim' },
          onChange: function (v) { saveCfg({ source_ophim_enabled: v === 'true' }); }
        });
      } catch (e) {}
    }

    // Inject menu item (giống LNUM)
    var menuItem = $(
      '<li class="menu__item selector" data-action="' + SOURCE_NAME + '">' +
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

    function appendMenu() {
      if ($('.menu__list').length) {
        $('.menu__list').first().append(menuItem);
      } else {
        setTimeout(appendMenu, 200);
      }
    }
    appendMenu();

    Lampa.Noty.show('KKPhim Parser đã sẵn sàng');
    console.log('[KKPhim Parser] v4.0.0 OK — Fork LNUM pattern');
  }

  if (window.appready) {
    setTimeout(startPlugin, 100);
  } else {
    Lampa.Listener.follow('app', function (event) {
      if (event.type === 'ready') setTimeout(startPlugin, 100);
    });
  }
})();
