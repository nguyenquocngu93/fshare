/* KKPhim + OPhim Parser Plugin for Lampa MX
 * Parser chuẩn Lampa.Plugins (type: 'parser')
 * Version: 1.0.1 - Safe (fix TypeError replace undefined)
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
    key:   'kkphim',
    name:  'KKPhim',
    api:   'https://phimapi.com/',
    img:   'https://phimimg.com/'
  },
  ophim: {
    key:   'ophim',
    name:  'OPhim',
    api:   'https://ophim1.com/',
    img:   'https://img.ophim.live/uploads/movies/'
  }
};

var STORAGE_KEY = 'kkphim_lampa_parser';
var PLUGIN_NAME = 'kkphim_vi';

/* ============================================================
   UTILITIES - an toàn, không bao giờ throw
============================================================ */
function s(str){
  // Safe string
  return str == null ? '' : String(str);
}
function isStr(x){
  return typeof x === 'string' && x.length > 0;
}
function safe(x, fallback){
  return x == null ? (fallback || '') : x;
}
function num(x, fb){
  var n = parseInt(x, 10);
  return isNaN(n) ? (fb || 0) : n;
}

function loadCfg(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch(e){ return {}; }
}
function saveCfg(o){
  try {
    var c = loadCfg();
    Object.keys(o).forEach(function(k){ c[k] = o[k]; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch(e){}
}
function isEnabled(key){
  var c = loadCfg();
  if (c['source_' + key + '_enabled'] === undefined) return true;
  return c['source_' + key + '_enabled'] === true;
}

/* ============================================================
   HTTP - dùng Lampa.Reguest nếu có, fallback fetch
============================================================ */
function getJSON(url){
  return new Promise(function(resolve){
    var done = false;
    function finish(data){
      if (done) return;
      done = true;
      resolve(data);
    }
    try {
      if (window.Lampa && Lampa.Reguest){
        var net = new Lampa.Reguest();
        net.timeout(15000);
        net.silent(url, function(data){
          if (typeof data === 'string'){
            try { finish(JSON.parse(data)); } catch(e){ finish(null); }
          } else finish(data);
        }, function(){ finish(null); });
      } else {
        fetch(url).then(function(r){
          return r.json().catch(function(){ return null; });
        }).then(finish).catch(function(){ finish(null); });
      }
    } catch(e){
      finish(null);
    }
  });
}

/* ============================================================
   SCORING + MATCH
============================================================ */
function nStr(s_){
  return s(s_).toLowerCase().trim()
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'')
    .replace(/\s+/g,' ');
}
function getBaseName(name){
  if (!name) return '';
  return s(name)
    .replace(/[\s\-]*[\(\[]?\s*[Ss]eason\s*\d+\s*[\)\]]?/gi,'')
    .replace(/[\s\-]*[\(\[]?\s*[Pp]h[aầ]n\s*\d+\s*[\)\]]?/gi,'')
    .replace(/[\s\-]*[\(\[]?\s*[Mm][uù]a\s*\d+\s*[\)\]]?/gi,'')
    .replace(/[\s\-]*\bS\d+\b/g,'')
    .trim();
}
function mScore(item, title, orig, year){
  try {
    var score = 0;
    var nT = nStr(title), nO = nStr(orig);
    var n1 = nStr(item && (item.name || item.title));
    var n2 = nStr(item && (item.origin_name || item.original_name));
    var nTb = nStr(getBaseName(title));
    var nOb = nStr(getBaseName(orig));
    var n1b = nStr(getBaseName(item && (item.name || item.title)));
    var n2b = nStr(getBaseName(item && (item.origin_name || item.original_name)));

    if (nT && (n1 === nT || n2 === nT)) score += 100;
    else if (nO && nO !== nT && (n1 === nO || n2 === nO)) score += 100;
    else if (nTb && (n1b === nTb || n2b === nTb)) score += 90;
    else if (nOb && nOb !== nTb && (n1b === nOb || n2b === nOb)) score += 90;
    else if (nT && nT.length >= 3 && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1)) score += 60;
    else if (nO && nO.length >= 3 && (n1.indexOf(nO) > -1 || nO.indexOf(n1) > -1)) score += 55;
    else if (nTb && nTb.length >= 3 && (n1b.indexOf(nTb) > -1 || nTb.indexOf(n1b) > -1)) score += 40;
    else if (nOb && nOb.length >= 3 && (n2b.indexOf(nOb) > -1 || nOb.indexOf(n1b) > -1)) score += 40;

    if (score > 0 && year && item.year){
      var iy = num(item.year);
      var ty = num(year);
      if (iy === ty) score += 30;
      else if (Math.abs(iy - ty) <= 1) score += 15;
    }
    return score;
  } catch(e){
    return 0;
  }
}
function mBest(items, title, orig, year){
  if (!Array.isArray(items) || !items.length) return null;
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
   SEARCH API
============================================================ */
function sSrc(source, kw, page){
  if (!source || !isStr(kw)) return Promise.resolve([]);
  return getJSON(
    source.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) +
    '&limit=20&page=' + (page || 1)
  ).then(function(d){
    if (!d) return [];
    if (d.status === 'success' && d.data && Array.isArray(d.data.items)) return d.data.items;
    if (d.data && Array.isArray(d.data.items)) return d.data.items;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d)) return d;
    return [];
  }).then(function(items){
    return items.filter(function(i){ return i && (i.slug || i._id); });
  });
}

/* ============================================================
   DETAIL API
============================================================ */
function fDet(source, slug){
  if (!source || !isStr(slug)) return Promise.resolve(null);
  return getJSON(source.api + 'v1/api/phim/' + slug).then(function(d){
    if (!d) return null;
    if (d.status === 'success' && d.data){
      return {
        movie: d.data.item || {},
        episodes: Array.isArray(d.data.episodes) ? d.data.episodes : []
      };
    }
    if (d.movie || d.item){
      return {
        movie: d.movie || d.item || {},
        episodes: Array.isArray(d.episodes) ? d.episodes : []
      };
    }
    return null;
  });
}

/* ============================================================
   VALIDATE URL - lọc link hỏng
============================================================ */
function validUrl(u){
  return isStr(u) && (u.indexOf('http://') === 0 || u.indexOf('https://') === 0);
}

/* ============================================================
   FORMAT CARD (Lampa.Parser cần)
============================================================ */
function formatCard(item, source, type){
  var poster = '';
  if (item && (item.poster_url || item.thumb_url)){
    var pi = item.poster_url || item.thumb_url;
    poster = pi.indexOf('http') === 0 ? pi : (source.img + pi);
  }
  var title  = s(item && (item.name || item.title));
  var orig   = s(item && (item.origin_name || item.original_name));
  var year   = s(item && item.year);
  var quality = s(item && item.quality) || (type === 'tv' ? 'TV' : 'HD');

  return {
    title:          title,
    original_title: orig,
    year:           year,
    poster:         poster,
    backdrop:       poster,
    quality:        quality,
    type:           type,
    url:            source.api + 'v1/api/phim/' + s(item && item.slug),
    _slug:          s(item && item.slug),
    _source:        source.key,
    _raw:           item
  };
}

/* ============================================================
   FORMAT INFO - episodes LUÔN có files[].url hợp lệ
============================================================ */
function formatInfo(det, type, slug, sourceKey){
  if (!det) return null;
  var m = det.movie || {};
  var eps = Array.isArray(det.episodes) ? det.episodes : [];

  var title  = s(m.name || m.title);
  var orig   = s(m.origin_name || m.original_name);
  var year   = s(m.year);
  var poster = '';
  if (m.poster_url || m.thumb_url){
    var pi = m.poster_url || m.thumb_url;
    poster = pi.indexOf('http') === 0 ? pi : (SOURCES[sourceKey].img + pi);
  }
  var plot   = s(m.content || m.description || m.overview);
  var isSeries = type === 'tv' || m.type === 'series' || m.type === 'tvshows';

  var episodeList = [];

  if (isSeries){
    eps.forEach(function(srv, srvIdx){
      if (!srv) return;
      var serverName = s(srv.server_name) || ('Server ' + (srvIdx + 1));
      var data = Array.isArray(srv.server_data) ? srv.server_data : [];
      data.forEach(function(ep){
        if (!ep) return;
        var epName = s(ep.name) || ('Tập ' + (episodeList.length + 1));
        var url = ep.link_m3u8 || ep.link_embed || '';
        if (!validUrl(url)) return;

        // Tách season + number từ tên tập
        var season = 1, number = num(String(epName).replace(/[^\d]/g,''), episodeList.length + 1);
        var sMatch = epName.match(/S(\d{1,2})E(\d{1,3})/i) ||
                     epName.match(/[Ss]eason\s*(\d+).*?[Ee]pisode\s*(\d+)/i) ||
                     epName.match(/[Pp]hần\s*(\d+).*?Tập\s*(\d+)/i) ||
                     epName.match(/S(\d{1,2})/i);
        if (sMatch){
          if (sMatch.length >= 3 && sMatch[2]){
            season = num(sMatch[1], 1);
            number = num(sMatch[2], number);
          } else {
            season = num(sMatch[1], 1);
          }
        }
        // Nếu tên chỉ có số → giữ season 1
        if (!sMatch && /^\s*\d+\s*$/.test(epName)){
          season = 1;
        }

        episodeList.push({
          title:  epName,
          number: number,
          season: season,
          files: [{
            quality: serverName,
            url:     url
          }]
        });
      });
    });
  } else {
    // Phim lẻ - 1 tập
    eps.forEach(function(srv, srvIdx){
      if (!srv) return;
      var serverName = s(srv.server_name) || ('Server ' + (srvIdx + 1));
      var data = Array.isArray(srv.server_data) ? srv.server_data : [];
      if (data.length && data[0]){
        var url = data[0].link_m3u8 || data[0].link_embed || '';
        if (validUrl(url)){
          episodeList.push({
            title:  'Full',
            number: 1,
            season: 1,
            files: [{
              quality: serverName,
              url:     url
            }]
          });
        }
      }
    });
  }

  // Gộp server trùng tập
  var merged = {};
  episodeList.forEach(function(ep){
    if (!ep || !ep.files || !ep.files.length) return;
    var key = 'S' + (ep.season || 1) + 'E' + (ep.number || 0);
    if (!merged[key]){
      merged[key] = {
        title:  s(ep.title) || ('Tập ' + ep.number),
        number: ep.number,
        season: ep.season,
        files:  []
      };
    }
    ep.files.forEach(function(f){
      if (f && validUrl(f.url)){
        merged[key].files.push({
          quality: s(f.quality) || 'HD',
          url:     f.url
        });
      }
    });
  });

  var finalEpisodes = [];
  Object.keys(merged).sort().forEach(function(k){
    var e = merged[k];
    if (e.files && e.files.length) finalEpisodes.push(e);
  });

  // Nếu không có episode nào hợp lệ → vẫn trả về info để Lampa hiển thị
  return {
    title:          title || '(không rõ)',
    original_title: orig,
    year:           year,
    poster:         poster,
    backdrop:       poster,
    plot:           plot,
    type:           isSeries ? 'tv' : 'movie',
    episodes:       finalEpisodes,
    _slug:          slug,
    _source:        sourceKey
  };
}

/* ============================================================
   PLUGIN REGISTRATION
============================================================ */
function safe_call(call, data){
  try { if (call) call(data); } catch(e){}
}
function safe_error(onError, msg){
  try { if (onError) onError(msg || 'Lỗi'); } catch(e){}
}

Lampa.Plugins.add({
  type:    'parser',
  name:    PLUGIN_NAME,
  version: '1.0.1',

  search: function(query, call, onError){
    try {
      var q = (typeof query === 'string')
        ? { title: query, orig: '', year: '' }
        : {
            title: s(query.title || query.name),
            orig:  s(query.original_title || query.original_name),
            year:  s(query.year)
          };

      var results = [];
      var pending = 0;
      var done = false;
      var enabledKeys = Object.keys(SOURCES).filter(isEnabled);

      if (!enabledKeys.length){
        safe_call(call, []);
        return;
      }

      function flush(){
        if (done) return;
        done = true;
        results.sort(function(a, b){
          var sa = mScore(a._raw, q.title, q.orig, q.year);
          var sb = mScore(b._raw, q.title, q.orig, q.year);
          return sb - sa;
        });
        safe_call(call, results);
      }

      enabledKeys.forEach(function(key){
        var src = SOURCES[key];
        pending++;
        sSrc(src, q.title, 1).then(function(items){
          var best = mBest(items, q.title, q.orig, q.year);
          if (best && best.slug){
            var ec = s(best.episode_current);
            var type = (ec && ec !== 'Full' && ec !== 'full') ? 'tv' : 'movie';
            results.push(formatCard(best, src, type));
          }
          pending--;
          if (pending === 0) flush();
        });
      });

      // Timeout 8s phòng API treo
      setTimeout(function(){
        if (pending > 0 && !done){
          pending = 0;
          flush();
        }
      }, 8000);

    } catch(e){
      console.error('[KKPhim Parser] search error:', e);
      safe_error(onError, 'Lỗi search');
      safe_call(call, []);
    }
  },

  getInfo: function(card, call, onError){
    try {
      if (!card){
        safe_call(call, null);
        return;
      }
      var slug = s(card._slug) || (card.url ? s(card.url).split('/').pop() : '');
      var srcKey = s(card._source) || 'kkphim';
      var type = (card.type === 'tv' || card.type === 'movie') ? card.type : 'movie';
      var source = SOURCES[srcKey];

      if (!slug || !source){
        safe_call(call, null);
        return;
      }

      fDet(source, slug).then(function(det){
        if (!det){
          // Fallback search
          var q = {
            title: s(card.title || card.name),
            orig:  s(card.original_title || card.original_name),
            year:  s(card.year)
          };
          return sSrc(source, q.title || q.orig, 1).then(function(items){
            var best = mBest(items, q.title, q.orig, q.year);
            if (!best) return null;
            return fDet(source, best.slug);
          });
        }
        return det;
      }).then(function(finalDet){
        if (!finalDet){
          safe_call(call, null);
          return;
        }
        var info = formatInfo(finalDet, type, slug, srcKey);
        safe_call(call, info);
      }).catch(function(){
        safe_call(call, null);
      });

    } catch(e){
      console.error('[KKPhim Parser] getInfo error:', e);
      safe_call(call, null);
    }
  },

  getStream: function(params, onResult, onError){
    try {
      if (!params){
        safe_error(onError, 'Không có params');
        return;
      }
      var card    = params.card || {};
      var episode = params.episode || {};
      var files   = Array.isArray(episode.files) ? episode.files : [];

      if (!files.length){
        safe_error(onError, 'Không có link');
        return;
      }

      var results = [];
      files.forEach(function(f){
        if (f && validUrl(f.url)){
          results.push({
            quality: s(f.quality) || 'HD',
            url:     f.url
          });
        }
      });

      if (!results.length){
        safe_error(onError, 'Link không hợp lệ');
        return;
      }

      safe_call(onResult, results);
    } catch(e){
      console.error('[KKPhim Parser] getStream error:', e);
      safe_error(onError, 'Lỗi');
    }
  }
});

/* ============================================================
   PLUGIN RIÊNG CHO OPHIM
============================================================ */
Lampa.Plugins.add({
  type:    'parser',
  name:    'ophim_vi',
  version: '1.0.1',

  search: function(query, call, onError){
    return Lampa.Plugins.get(PLUGIN_NAME).search(query, call, onError);
  },
  getInfo: function(card, call, onError){
    if (card) card._source = 'ophim';
    return Lampa.Plugins.get(PLUGIN_NAME).getInfo(card, call, onError);
  },
  getStream: function(params, onResult, onError){
    return Lampa.Plugins.get(PLUGIN_NAME).getStream(params, onResult, onError);
  }
});

/* ============================================================
   SETTINGS - bật/tắt từng nguồn
============================================================ */
function addSettings(){
  if (!window.Lampa || !Lampa.SettingsApi || !Lampa.SettingsApi.addParam) return;

  try {
    Lampa.SettingsApi.addParam({
      component: 'interface',
      param: {
        name: 'kkphim_lp_on',
        type: 'select',
        values: { 'on': 'Bật', 'off': 'Tắt' },
        default: 'on'
      },
      field: { name: 'KKPhim Parser VI' }
    });

    Lampa.SettingsApi.addParam({
      component: 'interface',
      param: {
        name: 'kkphim_lp_kkphim',
        type: 'select',
        values: { 'on': 'Bật', 'off': 'Tắt' },
        default: 'on'
      },
      field: { name: '  • Nguồn KKPhim' },
      onChange: function(v){ saveCfg({ source_kkphim_enabled: v === 'on' }); }
    });

    Lampa.SettingsApi.addParam({
      component: 'interface',
      param: {
        name: 'kkphim_lp_ophim',
        type: 'select',
        values: { 'on': 'Bật', 'off': 'Tắt' },
        default: 'on'
      },
      field: { name: '  • Nguồn OPhim' },
      onChange: function(v){ saveCfg({ source_ophim_enabled: v === 'on' }); }
    });
  } catch(e){
    console.warn('[KKPhim Parser] addSettings error:', e);
  }
}

if (window.appready){
  setTimeout(addSettings, 200);
} else {
  Lampa.Listener.follow('app', function(e){
    if (e.type === 'ready') setTimeout(addSettings, 200);
  });
}

console.log('[KKPhim Parser VI] v1.0.1 OK');
})();
