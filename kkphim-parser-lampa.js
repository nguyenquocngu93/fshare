/* KKPhim + OPhim Parser Plugin for Lampa MX
 * Parser chuẩn Lampa.Plugins (type: 'parser')
 * Tự vào menu parser cùng với TMDB, TorrServer, TopRootu...
 * Lampa tự build UI: card, season/episode picker, player.
 *
 * Version: 1.0.0
 */
(function(){
'use strict';

if (window.__kkphim_lampa_parser) return;
window.__kkphim_lampa_parser = true;

/* ============================================================
   CONFIG
============================================================ */
var SOURCES = {
  kkphim: {
    name: 'KKPhim',
    api:  'https://phimapi.com/',
    img:  'https://phimimg.com/',
    enabled: true
  },
  ophim: {
    name: 'OPhim',
    api:  'https://ophim1.com/',
    img:  'https://img.ophim.live/uploads/movies/',
    enabled: true
  }
};

var STORAGE_KEY = 'kkphim_lampa_parser';

/* ============================================================
   STORAGE (tùy chọn bật/tắt từng nguồn)
============================================================ */
function loadCfg(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch(e){ return {}; }
}
function saveCfg(o){
  try { var c = loadCfg();
        Object.keys(o).forEach(function(k){ c[k] = o[k]; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }
  catch(e){}
}
function isEnabled(key){
  var c = loadCfg();
  if (c['source_' + key + '_enabled'] === undefined) return true;
  return c['source_' + key + '_enabled'] === true;
}

/* ============================================================
   HTTP HELPERS (Lampa có sẵn Lampa.Reguest nhưng dùng fetch cho gọn)
============================================================ */
function getJSON(url){
  return new Promise(function(resolve){
    if (window.Lampa && Lampa.Reguest){
      var net = new Lampa.Reguest();
      net.timeout(15000);
      net.silent(url,
        function(data){
          if (typeof data === 'string'){
            try { resolve(JSON.parse(data)); } catch(e){ resolve(null); }
          } else resolve(data);
        },
        function(){ resolve(null); }
      );
    } else {
      fetch(url).then(function(r){ return r.json(); }).then(resolve).catch(function(){ resolve(null); });
    }
  });
}

/* ============================================================
   IMAGE URL HELPER
============================================================ */
function fixImg(u, src){
  if (!u) return '';
  if (u.indexOf('http') === 0) return u;
  return (src ? src.img : SOURCES.kkphim.img) + u;
}

/* ============================================================
   SEARCH
============================================================ */
function sSrc(source, kw, page){
  return getJSON(
    source.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) +
    '&limit=20&page=' + (page || 1)
  ).then(function(d){
    if (!d) return [];
    if (d.status === 'success' && d.data && d.data.items) return d.data.items;
    if (d.data && d.data.items) return d.data.items;
    if (d.items) return d.items;
    if (Array.isArray(d)) return d;
    return [];
  }).then(function(items){
    return items.filter(function(i){ return i && (i.slug || i._id); });
  });
}

/* ============================================================
   DETAIL
============================================================ */
function fDet(source, slug){
  return getJSON(source.api + 'v1/api/phim/' + slug).then(function(d){
    if (!d) return null;
    if (d.status === 'success' && d.data){
      return {
        movie: d.data.item || {},
        episodes: d.data.episodes || []
      };
    }
    if (d.movie || d.item){
      return {
        movie: d.movie || d.item || {},
        episodes: d.episodes || []
      };
    }
    return null;
  });
}

/* ============================================================
   SCORING (chấm điểm match thông minh)
============================================================ */
function nStr(s){
  return String(s||'')
    .toLowerCase().trim()
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'')
    .replace(/\s+/g,' ');
}
function getBaseName(name){
  if (!name) return '';
  return name
    .replace(/[\s\-]*[\(\[]?\s*[Ss]eason\s*\d+\s*[\)\]]?/gi,'')
    .replace(/[\s\-]*[\(\[]?\s*[Pp]h[aầ]n\s*\d+\s*[\)\]]?/gi,'')
    .replace(/[\s\-]*[\(\[]?\s*[Mm][uù]a\s*\d+\s*[\)\]]?/gi,'')
    .replace(/[\s\-]*\bS\d+\b/g,'')
    .trim();
}
function mScore(item, title, orig, year){
  var score = 0;
  var nT = nStr(title), nO = nStr(orig);
  var n1 = nStr(item.name || item.title || '');
  var n2 = nStr(item.origin_name || item.original_name || '');
  var nTb = nStr(getBaseName(title));
  var nOb = nStr(getBaseName(orig));
  var n1b = nStr(getBaseName(item.name || item.title || ''));
  var n2b = nStr(getBaseName(item.origin_name || item.original_name || ''));

  if (nT && (n1 === nT || n2 === nT)) score += 100;
  else if (nO && nO !== nT && (n1 === nO || n2 === nO)) score += 100;
  else if (nTb && (n1b === nTb || n2b === nTb)) score += 90;
  else if (nOb && nOb !== nTb && (n1b === nOb || n2b === nOb)) score += 90;
  else if (nT && nT.length >= 3 && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1)) score += 60;
  else if (nO && nO.length >= 3 && (n1.indexOf(nO) > -1 || nO.indexOf(n1) > -1)) score += 55;
  else if (nTb && nTb.length >= 3 && (n1b.indexOf(nTb) > -1 || nTb.indexOf(n1b) > -1)) score += 40;
  else if (nOb && nOb.length >= 3 && (n2b.indexOf(nOb) > -1 || nOb.indexOf(n1b) > -1)) score += 40;

  if (score > 0 && year && item.year){
    var iy = parseInt(item.year);
    var ty = parseInt(year);
    if (iy === ty) score += 30;
    else if (Math.abs(iy - ty) <= 1) score += 15;
  }
  return score;
}
function mBest(items, title, orig, year){
  if (!items || !items.length) return null;
  var scored = items.map(function(it){
    return { item: it, score: mScore(it, title, orig, year) };
  });
  scored.sort(function(a, b){ return b.score - a.score; });
  if (scored[0].score > 0) return scored[0].item;
  if (items.length === 1) return items[0];
  if (year && items.length <= 3) return items[0];
  return null;
}

/* ============================================================
   FORMAT CARD THEO CHUẨN LAMPA
   Lampa.Parser cần các field:
   - title, original_title, year
   - poster (url), backdrop (url)
   - quality (string)
   - type ('movie' | 'tv')
   - url (để Lampa gọi lại getInfo)
   - info (raw data để dùng nội bộ)
============================================================ */
function formatCard(item, source, type){
  var isSeries = type === 'tv' || item.type === 'series' || item.type === 'tvshows';
  var ec = String(item.episode_current || '');
  if (!isSeries && ec && ec !== 'Full' && ec !== 'full') isSeries = true;

  var poster = fixImg(item.poster_url || item.thumb_url, source);
  var title  = item.name || item.title || '';
  var orig   = item.origin_name || item.original_name || '';
  var year   = item.year || '';
  var quality = item.quality || (isSeries ? (ec || 'TV') : 'HD');

  return {
    title:          title,
    original_title: orig,
    year:           year,
    poster:         poster,
    backdrop:       poster,
    quality:        quality,
    type:           isSeries ? 'tv' : 'movie',
    url:            source.api + 'v1/api/phim/' + (item.slug || ''),
    // Lưu raw để các hàm sau dùng
    _slug:          item.slug || '',
    _source:        source.key,
    _raw:           item
  };
}

/* ============================================================
   FORMAT INFO (Lampa tự build season/episode UI từ đây)
   Lampa.Parser.getInfo cần:
   - title, original_title, year
   - poster, backdrop
   - plot (mô tả)
   - episodes: [
       { title, number, season, files: [ { quality, url } ] }
     ]
============================================================ */
function formatInfo(det, type, slug, sourceKey){
  if (!det) return null;
  var m = det.movie || {};
  var eps = det.episodes || [];

  var title  = m.name || m.title || '';
  var orig   = m.origin_name || m.original_name || '';
  var year   = m.year || '';
  var poster = fixImg(m.poster_url || m.thumb_url, SOURCES[sourceKey]);
  var plot   = m.content || m.description || m.overview || '';
  var isSeries = type === 'tv' || m.type === 'series' || m.type === 'tvshows';

  // Gom episodes theo season (Lampa.Parser hỗ trợ season qua number)
  var episodeList = [];

  if (isSeries){
    // Mỗi "episodes[i]" trong API là 1 server, server_data là list tập
    eps.forEach(function(srv, srvIdx){
      var serverName = srv.server_name || ('Server ' + (srvIdx + 1));
      var data = srv.server_data || [];
      data.forEach(function(ep){
        var epName = ep.name || '';
        var epNum = parseInt(String(epName).replace(/[^\d]/g,'')) || (episodeList.length + 1);
        // Lấy link tốt nhất
        var url = ep.link_m3u8 || ep.link_embed || '';
        if (!url) return;
        episodeList.push({
          title:   epName || ('Tập ' + epNum),
          number:  epNum,
          season:  1, // KKPhim/OPhim thường gộp season trong tên tập
          files: [{
            quality: serverName,
            url:     url
          }]
        });
      });
    });

    // Nếu tên tập chứa "Sxx" → tách season
    var hasSeason = episodeList.some(function(e){
      return /S\d{1,2}/i.test(e.title) || /[Ss]eason/i.test(e.title) || /[Pp]hần/i.test(e.title);
    });
    if (hasSeason){
      episodeList.forEach(function(e){
        var sMatch = e.title.match(/S(\d{1,2})/i) ||
                     e.title.match(/[Ss]eason\s*(\d+)/i) ||
                     e.title.match(/[Pp]hần\s*(\d+)/i);
        if (sMatch) e.season = parseInt(sMatch[1]);
        e.number = parseInt(String(e.title).replace(/[^\d]/g,'').slice(-3)) || e.number;
      });
    }
  } else {
    // Phim lẻ: 1 "tập" duy nhất
    eps.forEach(function(srv, srvIdx){
      var serverName = srv.server_name || ('Server ' + (srvIdx + 1));
      var data = srv.server_data || [];
      if (data && data[0]){
        var url = data[0].link_m3u8 || data[0].link_embed || '';
        if (url){
          episodeList.push({
            title:  'Full',
            number: 1,
            season: 1,
            files:  [{ quality: serverName, url: url }]
          });
        }
      }
    });
  }

  // Nếu có nhiều server, gộp files vào cùng episode number
  var merged = {};
  episodeList.forEach(function(ep){
    var key = 'S' + ep.season + 'E' + ep.number;
    if (!merged[key]){
      merged[key] = {
        title:  ep.title,
        number: ep.number,
        season: ep.season,
        files:  []
      };
    }
    ep.files.forEach(function(f){
      merged[key].files.push(f);
    });
  });
  var finalEpisodes = Object.keys(merged).sort().map(function(k){
    return merged[k];
  });

  return {
    title:          title,
    original_title: orig,
    year:           year,
    poster:         poster,
    backdrop:       poster,
    plot:           plot,
    type:           isSeries ? 'tv' : 'movie',
    episodes:       finalEpisodes,
    _slug:          slug,
    _source:        sourceKey,
    _raw:           m
  };
}

/* ============================================================
   TÌM SLUG ĐÚNG KHI Lampa GỌI search()
   Lampa.Parser.search nhận (query, call)
   query có thể là string hoặc object { title, original_title, year, ... }
   → Trả về best match
============================================================ */
function pickQuery(query){
  if (typeof query === 'string') return { title: query, orig: '', year: '' };
  return {
    title: query.title || query.name || '',
    orig:  query.original_title || query.original_name || '',
    year:  query.year || ''
  };
}

function tryFindSlug(title, orig, year, source){
  return sSrc(source, title, 1).then(function(items){
    var best = mBest(items, title, orig, year);
    if (best) return best;
    if (orig && orig !== title){
      return sSrc(source, orig, 1).then(function(items2){
        return mBest(items2, title, orig, year);
      });
    }
    return null;
  });
}

function searchBest(query, source, type){
  var q = pickQuery(query);
  return tryFindSlug(q.title, q.orig, q.year, source).then(function(best){
    if (!best) return null;
    return fDet(source, best.slug).then(function(det){
      return formatInfo(det, type, best.slug, source.key);
    });
  });
}

/* ============================================================
   TÌM SLUG THEO slug trực tiếp (nhanh)
============================================================ */
function fetchBySlug(slug, source, type){
  return fDet(source, slug).then(function(det){
    return formatInfo(det, type, slug, source.key);
  });
}

/* ============================================================
   ĐĂNG KÝ PLUGIN KIỂU PARSER
   Lampa.Plugins.add cho Lampa.Parser
============================================================ */
Lampa.Plugins.add({
  type:   'parser',
  name:   'kkphim_vi',
  version:'1.0.0',

  // Tìm kiếm theo query
  // Lampa gọi khi user chọn parser này + search
  search: function(query, call, onError){
    var q = pickQuery(query);
    var results = [];
    var pending = 0;
    var enabledKeys = Object.keys(SOURCES).filter(isEnabled);

    if (!enabledKeys.length){
      if (call) call([]);
      return;
    }

    enabledKeys.forEach(function(key){
      var src = SOURCES[key];
      pending++;
      tryFindSlug(q.title, q.orig, q.year, src).then(function(best){
        if (best && best.slug){
          results.push(formatCard(best, src, q.year ? 'movie' : 'movie'));
        }
        pending--;
        if (pending === 0 && call){
          // Sắp xếp theo score
          results.sort(function(a, b){
            var sa = mScore(a._raw, q.title, q.orig, q.year);
            var sb = mScore(b._raw, q.title, q.orig, q.year);
            return sb - sa;
          });
          call(results);
        }
      });
    });
  },

  // Lấy chi tiết (Lampa tự build UI season/episode từ episodes)
  getInfo: function(card, call, onError){
    var slug   = card._slug || (card.url ? card.url.split('/').pop() : '');
    var srcKey = card._source || 'kkphim';
    var type   = card.type || 'movie';
    var source = SOURCES[srcKey];

    if (!slug || !source){
      if (call) call(null);
      return;
    }

    fetchBySlug(slug, source, type).then(function(info){
      // Fallback nếu slug trực tiếp không ra → search
      if (!info || !info.episodes || !info.episodes.length){
        var q = pickQuery(card);
        searchBest(q, source, type).then(function(fallback){
          call(fallback);
        });
      } else {
        call(info);
      }
    });
  },

  // Lấy link stream (Lampa tự build player + chọn quality)
  // Lampa truyền vào params: { card, episode, season, translation, ... }
  getStream: function(params, onResult, onError){
    var card    = params.card || {};
    var episode = params.episode || params;
    var files   = (episode && episode.files) || [];

    if (!files.length){
      if (onError) onError('Không có link');
      return;
    }

    var results = files.map(function(f){
      return {
        quality: f.quality || 'HD',
        url:     f.url
      };
    });
    if (onResult) onResult(results);
  }
});

/* ============================================================
   ĐĂNG KÝ RIÊNG CHO OPHIM (nếu user muốn chọn nguồn riêng)
============================================================ */
Lampa.Plugins.add({
  type:   'parser',
  name:   'ophim_vi',
  version:'1.0.0',

  search: function(query, call, onError){
    return Lampa.Plugins.get('kkphim_vi').search(query, call, onError);
  },
  getInfo: function(card, call, onError){
    card._source = 'ophim';
    return Lampa.Plugins.get('kkphim_vi').getInfo(card, call, onError);
  },
  getStream: function(params, onResult, onError){
    return Lampa.Plugins.get('kkphim_vi').getStream(params, onResult, onError);
  }
});

/* ============================================================
   SETTINGS: bật/tắt từng nguồn
============================================================ */
function addSettings(){
  if (!Lampa.SettingsApi || !Lampa.SettingsApi.addParam) return;

  Lampa.SettingsApi.addParam({
    component: 'interface',
    param: {
      name: 'kkphim_parser_enabled',
      type: 'select',
      values: { 'on': 'Bật', 'off': 'Tắt' },
      default: 'on'
    },
    field: {
      name: 'KKPhim Parser (VI)'
    }
  });

  Lampa.SettingsApi.addParam({
    component: 'interface',
    param: {
      name: 'kkphim_source_kkphim',
      type: 'select',
      values: { 'on': 'Bật', 'off': 'Tắt' },
      default: 'on'
    },
    field: {
      name: 'KKPhim — Nguồn KKPhim'
    },
    onChange: function(v){
      saveCfg({ source_kkphim_enabled: v === 'on' });
    }
  });

  Lampa.SettingsApi.addParam({
    component: 'interface',
    param: {
      name: 'kkphim_source_ophim',
      type: 'select',
      values: { 'on': 'Bật', 'off': 'Tắt' },
      default: 'on'
    },
    field: {
      name: 'KKPhim — Nguồn OPhim'
    },
    onChange: function(v){
      saveCfg({ source_ophim_enabled: v === 'on' });
    }
  });
}

if (window.appready){
  setTimeout(addSettings, 200);
} else {
  Lampa.Listener.follow('app', function(e){
    if (e.type === 'ready') setTimeout(addSettings, 200);
  });
}

console.log('[KKPhim Parser VI] v1.0.0 OK — registered as Lampa plugin parser');
})();
