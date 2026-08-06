/* KKPhim + OPhim Source Plugin for Lampa MX
 * Plugin nguồn phim theo cơ chế Lampa.Api.sources
 * Tham khảo: github.com/nb557/plugins/kp_source.js
 *
 * Version: 2.0.0 - Rewrite theo đúng chuẩn Lampa
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
  var IMG_BASE     = 'https://phimimg.com/';

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
    // Mặc định: kkphim, có thể đổi sang ophim trong settings
    return loadCfg().active_source || 'kkphim';
  }

  /* ============================================================
     NETWORK
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
    }, function (a, b) {
      if (onErr) onErr(a || b || 'error');
    });
  }

  /* ============================================================
     UTILITIES
  ============================================================ */
  function s_(v) { return v == null ? '' : String(v); }
  function num(v, fb) { var n = parseInt(v, 10); return isNaN(n) ? (fb || 0) : n; }
  function validUrl(u) {
    return typeof u === 'string' && u.length > 5 &&
      (u.indexOf('http://') === 0 || u.indexOf('https://') === 0);
  }
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
  function fixImg(u, srcKey) {
    if (!u) return '';
    if (u.indexOf('http') === 0) return u;
    return (SOURCES[srcKey] || SOURCES.kkphim).img + u;
  }

  /* ============================================================
     SCORING - chấm điểm match
  ============================================================ */
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
          var data = d.data;
          resolve({
            items: (data.items || []).filter(function (i) { return i && i.slug; }),
            total_pages: data.totalPages || 1
          });
        },
        function () { resolve({ items: [], total_pages: 1 }); }
      );
    });
  }

  /* ============================================================
     CONVERT TO LAMPA FORMAT
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
      source:        SOURCE_NAME,
      type:          isSeries ? 'tv' : 'movie',
      adult:         false,
      id:            SOURCE_NAME + '_' + (item.slug || ''),
      title:         title,
      original_title: orig,
      overview:      s_(item.content || item.description || ''),
      img:           poster,
      background_image: poster,
      genres:        [],
      production_companies: [],
      production_countries: [],
      vote_average:  parseFloat(item.tmdb?.vote_average) || 0,
      vote_count:    0,
      year:          year,
      release_date:  year ? (year + '-01-01') : '',
      first_air_date: year ? (year + '-01-01') : '',
      _raw:          item,
      _srcKey:       srcKey,
      _slug:         s_(item.slug)
    };
  }

  /* ============================================================
     SOURCE METHODS - theo chuẩn Lampa.Api.sources
  ============================================================ */
  function main(params, oncomplite) {
    // Lampa gọi khi user vào "Home" với source này
    // Trả về menu items
    oncomplite([]);
  }

  function menu(params, oncomplite) {
    // Menu filter cho source
    oncomplite([]);
  }

  function list(params, oncomplite) {
    // List danh sách phim theo category
    var srcKey = getSourceKey();
    var cat = params.url || 'phim-moi-cap-nhat';
    var page = params.page || 1;

    listAPI(srcKey, cat, page).then(function (res) {
      var items = (res.items || []).map(function (i) { return convertItem(i, srcKey); }).filter(Boolean);
      oncomplite({
        results: items,
        page: page,
        total_pages: res.total_pages || 1
      });
    });
  }

  function category(params, oncomplite) {
    // Giống list
    list(params, oncomplite);
  }

  function full(params, oncomplite) {
    // Trang chi tiết phim
    var card = params.card || params.movie || params;
    var srcKey = card._srcKey || getSourceKey();
    var slug = card._slug || s_(card.id).replace(SOURCE_NAME + '_', '');

    if (!slug) {
      oncomplite({});
      return;
    }

    detailAPI(srcKey, slug).then(function (det) {
      if (!det) {
        oncomplite({});
        return;
      }

      var m = det.movie || {};
      var item = {
        source: SOURCE_NAME,
        type: card.type || (m.type === 'series' ? 'tv' : 'movie'),
        id: SOURCE_NAME + '_' + slug,
        title: s_(m.name || m.title),
        original_title: s_(m.origin_name || m.original_name),
        overview: s_(m.content || m.description || ''),
        img: fixImg(m.poster_url || m.thumb_url, srcKey),
        background_image: fixImg(m.poster_url || m.thumb_url, srcKey),
        year: s_(m.year),
        release_date: s_(m.year) ? s_(m.year) + '-01-01' : '',
        first_air_date: s_(m.year) ? s_(m.year) + '-01-01' : '',
        _episodes: det.episodes || [],
        _srcKey: srcKey,
        _slug: slug,
        _raw: m
      };
      oncomplite(item);
    });
  }

  function search(params, oncomplite) {
    // Lampa gọi khi user tìm kiếm
    var srcKey = getSourceKey();
    var query = params.query || params.title || '';
    var page = params.page || 1;
    var status = new Lampa.Status(1);

    status.onComplite = function (data) {
      if (data.query && data.query.results) {
        oncomplite(data.query);
      } else {
        oncomplite({ results: [], page: 1, total_pages: 1 });
      }
    };

    if (isEnabled(srcKey)) {
      searchAPI(srcKey, query, page).then(function (items) {
        var results = items.map(function (i) { return convertItem(i, srcKey); }).filter(Boolean);
        status.append('query', { results: results, page: page, total_pages: 1 });
      });
    } else {
      // Thử source kia
      var altKey = srcKey === 'kkphim' ? 'ophim' : 'kkphim';
      if (isEnabled(altKey)) {
        searchAPI(altKey, query, page).then(function (items) {
          var results = items.map(function (i) { return convertItem(i, altKey); }).filter(Boolean);
          status.append('query', { results: results, page: page, total_pages: 1 });
        });
      } else {
        status.append('query', { results: [], page: 1, total_pages: 1 });
      }
    }
  }

  function search$1(params, oncomplite) {
    // Discovery - hiện trên search bar
    search(params, oncomplite);
  }

  function person(params, oncomplite) {
    oncomplite({});
  }

  function seasons(tv, from, oncomplite) {
    // from là array season_number cần lấy
    // Trả về từng season info
    var status = new Lampa.Status(from.length);
    status.onComplite = oncomplite;

    from.forEach(function (sn) {
      // KKPhim/OPhim gộp season trong episodes, trả về thông tin cơ bản
      status.append(String(sn), {
        season_number: sn,
        episodes: [],
        air_date: ''
      });
    });
  }

  function clear() {
    network.clear();
  }

  function discovery() {
    return {
      title: SOURCE_TITLE,
      search: search$1,
      params: {
        align_left: true,
        object: { source: SOURCE_NAME }
      },
      onMore: function (params) {
        Lampa.Activity.push({
          url: '',
          title: 'KKPhim: ' + params.query,
          component: 'category_full',
          page: 1,
          query: encodeURIComponent(params.query),
          source: SOURCE_NAME
        });
      },
      onCancel: network.clear.bind(network)
    };
  }

  /* ============================================================
     PLUGIN DEFINITION
  ============================================================ */
  var KK = {
    SOURCE_NAME:  SOURCE_NAME,
    SOURCE_TITLE: SOURCE_TITLE,
    main:         main,
    menu:         menu,
    full:         full,
    list:         list,
    category:     category,
    search:       search,
    clear:        clear,
    person:       person,
    seasons:      seasons,
    discovery:    discovery
  };

  function addPlugin() {
    if (Lampa.Api.sources && Lampa.Api.sources[SOURCE_NAME]) {
      Lampa.Noty.show('KKPhim đã được cài');
      return;
    }

    Lampa.Api.sources[SOURCE_NAME] = KK;
    Object.defineProperty(Lampa.Api.sources, SOURCE_NAME, {
      get: function () { return KK; },
      configurable: true
    });

    // Thêm vào danh sách source
    var sources = {};
    if (Lampa.Params && Lampa.Params.values && Lampa.Params.values['source']) {
      Lampa.Arrays.extend(sources, Lampa.Params.values['source']);
      sources[SOURCE_NAME] = SOURCE_TITLE;
    } else {
      // Mặc định các source có sẵn
      sources.tmdb  = 'TMDB';
      sources.cub   = 'CUB';
      sources[SOURCE_NAME] = SOURCE_TITLE;
    }
    Lampa.Params.select('source', sources, loadCfg().active_source_default || 'tmdb');

    // Inject vào menu Categories
    if (Lampa.Router) {
      Lampa.Listener.follow('menu', function (e) {
        if (e.type === 'action' && Lampa.Storage.field('source') === SOURCE_NAME) {
          if (e.action === 'movie' || e.action === 'tv' || e.action === 'anime' || e.action === 'cartoon') {
            Lampa.Router.call('category', {
              url: e.action,
              title: e.action,
              source: SOURCE_NAME
            });
            e.abort();
          }
        }
      });
    }

    // Settings
    if (Lampa.SettingsApi) {
      Lampa.SettingsApi.addParam({
        component: 'source',
        param: {
          name: 'kkphim_active_source',
          type: 'select',
          values: { 'kkphim': 'KKPhim (phimapi.com)', 'ophim': 'OPhim (ophim1.com)' },
          default: 'kkphim'
        },
        field: { name: 'KKPhim — Nguồn' },
        onChange: function (v) { saveCfg({ active_source: v }); }
      });

      Lampa.SettingsApi.addParam({
        component: 'source',
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
        component: 'source',
        param: {
          name: 'kkphim_enable_ophim',
          type: 'select',
          values: { 'on': 'Bật', 'off': 'Tắt' },
          default: 'on'
        },
        field: { name: '  • Bật OPhim' },
        onChange: function (v) { saveCfg({ source_ophim_enabled: v === 'on' }); }
      });
    }

    Lampa.Noty.show('KKPhim Parser đã sẵn sàng');
    console.log('[KKPhim Parser] v2.0.0 OK');
  }

  if (window.appready) {
    setTimeout(addPlugin, 100);
  } else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') setTimeout(addPlugin, 100);
    });
  }
})();
