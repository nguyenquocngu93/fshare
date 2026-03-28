(function(){
  "use strict";
  if(!window.Lampa) return;

  // ---------- Cấu hình mặc định (có thể chỉnh trong Settings) ----------
  var PLUGIN_KEY = 'lampa_kkphim_settings';
  var CACHE_KEY  = 'lampa_kkphim_cache_v1';
  var DEFAULTS = {
    enabled: true,
    apiBase: 'https://phimapi.com',
    imgBase: 'https://img.phimapi.com/',
    homePath: '/api/v1/movies',
    searchPath: '/api/v1/search',
    detailPath: '/api/v1/movie',    // /movie/{id}
    resolvePath: '/api/v1/stream',  // /stream/{episodeId}
    quality: 'auto',
    cacheTTL: 3600
  };

  // ---------- Settings & Cache ----------
  function loadSettings(){
    try{
      var s = localStorage.getItem(PLUGIN_KEY);
      return s ? Object.assign({}, DEFAULTS, JSON.parse(s)) : Object.assign({}, DEFAULTS);
    }catch(e){
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings(obj){
    var merged = Object.assign({}, loadSettings(), obj);
    localStorage.setItem(PLUGIN_KEY, JSON.stringify(merged));
  }

  function cacheSet(key, data, ttl){
    try{
      var store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      store[key] = { ts: Date.now(), ttl: ttl || loadSettings().cacheTTL, data: data };
      localStorage.setItem(CACHE_KEY, JSON.stringify(store));
    }catch(e){ console.warn('kkphim cacheSet error', e); }
  }

  function cacheGet(key){
    try{
      var store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      var entry = store[key];
      if(!entry) return null;
      if((Date.now() - entry.ts)/1000 > (entry.ttl || loadSettings().cacheTTL)){
        delete store[key];
        localStorage.setItem(CACHE_KEY, JSON.stringify(store));
        return null;
      }
      return entry.data;
    }catch(e){ return null; }
  }

  // ---------- Network helpers ----------
  function safeJson(url, opts){
    return fetch(url, opts).then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function safeText(url, opts){
    return fetch(url, opts).then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  function buildApi(path, params){
    var s = loadSettings();
    var base = s.apiBase.replace(/\/+$/,'');
    var p = path || '';
    if(params && Object.keys(params).length){
      var qs = Object.keys(params).map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
      return base + p + (p.indexOf('?') === -1 ? '?' + qs : '&' + qs);
    }
    return base + p;
  }

  // ---------- Mapping helpers ----------
  function mapMovieItem(it){
    var s = loadSettings();
    var poster = '';
    if(it.poster) poster = s.imgBase.replace(/\/+$/,'/') + String(it.poster).replace(/^\/+/, '');
    else if(it.image) poster = it.image;
    else if(it.poster_url) poster = it.poster_url;
    return {
      title: it.title || it.name || '',
      id: it.id || it.slug || '',
      poster: poster,
      year: it.year || it.release_year || ''
    };
  }

  // ---------- Core: home / search / detail / resolve ----------
  function fetchHome(){
    var key = 'home';
    var c = cacheGet(key);
    if(c) return Promise.resolve(c);

    var s = loadSettings();
    var url = buildApi(s.homePath || DEFAULTS.homePath);
    return safeJson(url).then(function(json){
      var arr = json.data || json.results || json.items || json;
      if(!Array.isArray(arr)) arr = [];
      var items = arr.map(mapMovieItem);
      cacheSet(key, items);
      return items;
    }).catch(function(err){
      console.warn('kkphim.fetchHome JSON failed', err);
      // fallback: try text parse (if API returns HTML)
      return safeText(url).then(function(html){
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var items = [];
        doc.querySelectorAll('.movie-item, .item').forEach(function(el){
          var titleEl = el.querySelector('.title, h3, a');
          var imgEl = el.querySelector('img');
          var aEl = el.querySelector('a');
          items.push({
            title: titleEl ? titleEl.textContent.trim() : '',
            id: aEl ? aEl.href : '',
            poster: imgEl ? (imgEl.src.indexOf('http')===0 ? imgEl.src : (s.imgBase + imgEl.getAttribute('src'))) : ''
          });
        });
        cacheSet(key, items);
        return items;
      }).catch(function(e){ console.warn('kkphim.fetchHome fallback failed', e); return []; });
    });
  }

  function search(query, page){
    var key = 'search_' + query + '_' + (page || 1);
    var c = cacheGet(key);
    if(c) return Promise.resolve(c);

    var s = loadSettings();
    var url = buildApi(s.searchPath || DEFAULTS.searchPath, { q: query, page: page || 1 });
    return safeJson(url).then(function(json){
      var arr = json.data || json.results || json.items || json;
      if(!Array.isArray(arr)) arr = [];
      var items = arr.map(mapMovieItem);
      cacheSet(key, items);
      return items;
    }).catch(function(err){
      console.warn('kkphim.search failed', err);
      return [];
    });
  }

  function fetchDetail(idOrUrl){
    var key = 'detail_' + idOrUrl;
    var c = cacheGet(key);
    if(c) return Promise.resolve(c);

    var s = loadSettings();
    var url = (String(idOrUrl).indexOf('http') === 0) ? idOrUrl : buildApi((s.detailPath || DEFAULTS.detailPath) + '/' + idOrUrl);
    return safeJson(url).then(function(json){
      var d = json.data || json.movie || json;
      var episodes = [];
      if(Array.isArray(d.episodes)){
        episodes = d.episodes.map(function(ep){
          return {
            title: ep.title || ep.name || ('Tập ' + (ep.episode || ep.index || '')),
            url: (ep.id ? buildApi((loadSettings().resolvePath || DEFAULTS.resolvePath) + '/' + ep.id) : (ep.url || ep.stream || ''))
          };
        });
      }
      var detail = {
        title: d.title || d.name || '',
        poster: d.poster ? (loadSettings().imgBase.replace(/\/+$/,'/') + String(d.poster).replace(/^\/+/,'')) : (d.image || ''),
        description: d.description || d.overview || d.summary || '',
        episodes: episodes
      };
      cacheSet(key, detail);
      return detail;
    }).catch(function(err){
      console.warn('kkphim.fetchDetail failed', err);
      return Promise.reject(err);
    });
  }

  function resolvePlayLink(episodeUrl){
    if(!episodeUrl) return Promise.reject(new Error('Invalid episode URL'));
    return safeJson(episodeUrl).then(function(json){
      var streams = json.streams || (json.data && json.data.streams) || [];
      if(!Array.isArray(streams)) streams = [];
      if(streams.length){
        var pref = loadSettings().quality || 'auto';
        var chosen = streams[0];
        if(pref !== 'auto'){
          for(var i=0;i<streams.length;i++){
            if(String(streams[i].quality) === String(pref) || (streams[i].label && streams[i].label.indexOf(pref) !== -1)){
              chosen = streams[i];
              break;
            }
          }
        }
        return { url: chosen.file || chosen.url || chosen.src, type: 'direct', meta: chosen };
      }
      if(json.file) return { url: json.file, type: 'direct' };
      // fallback: parse page for iframe or script
      return safeText(episodeUrl).then(function(html){
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var iframe = doc.querySelector('iframe');
        if(iframe && iframe.src) return { url: iframe.src, type: 'iframe' };
        var scripts = Array.from(doc.querySelectorAll('script')).map(function(s){ return s.textContent; });
        for(var j=0;j<scripts.length;j++){
          var m = scripts[j].match(/file\s*:\s*["']([^"']+)["']/);
          if(m) return { url: m[1], type: 'direct' };
        }
        throw new Error('No playable stream found');
      });
    }).catch(function(err){
      return Promise.reject(err);
    });
  }

  // ---------- UI helpers (Android-friendly) ----------
  function renderGridActivity(title, items){
    try{
      if(window.Lampa && Lampa.Activity && typeof Lampa.Activity.push === 'function'){
        var cards = items.map(function(it){
          return { title: it.title, poster: it.poster, id: it.id, card: it };
        });
        Lampa.Activity.push({ title: title, component: 'category', source: 'kkphim', page: 1, cards: cards });
        return;
      }
    }catch(e){ console.warn('renderGridActivity failed', e); }

    // fallback to Render.showList or simple HTML
    try{
      if(Lampa.Render && typeof Lampa.Render.showList === 'function'){
        Lampa.Render.showList({ title: title, items: items.map(function(it){ return { title: it.title, poster: it.poster, url: it.id, params: { card: it } }; }) });
        return;
      }
    }catch(e){ console.warn('Render.showList failed', e); }

    var html = '<div style="padding:12px;font-family:Arial"><h2>' + title + '</h2>' +
      items.map(function(i){ return '<div style="display:flex;align-items:center;margin:8px 0"><img src="'+i.poster+'" style="width:100px;height:150px;object-fit:cover;margin-right:10px"><div><b>'+ (i.title||'') +'</b><div style="color:#666">'+ (i.year||'') +'</div></div></div>'; }).join('') + '</div>';
    var w = window.open(); if(w) w.document.body.innerHTML = html;
  }

  function renderDetailActivity(detail){
    try{
      if(window.Lampa && Lampa.Activity && typeof Lampa.Activity.push === 'function'){
        // push a 'full' activity with detail and episodes (Lampa Android will render)
        Lampa.Activity.push({ title: detail.title, component: 'full', source: 'kkphim', page: 1, card: detail });
        return;
      }
    }catch(e){ console.warn('renderDetailActivity failed', e); }

    // fallback modal or new window
    try{
      if(Lampa.Modal && typeof Lampa.Modal.open === 'function'){
        var html = '<div style="padding:12px"><img src="'+detail.poster+'" style="width:160px;height:240px;float:left;margin-right:12px"><h2>'+detail.title+'</h2><div style="clear:both"></div><p>'+ (detail.description||'') +'</p><h3>Tập</h3><ul>' + (detail.episodes||[]).map(function(ep){ return '<li><a href="'+ep.url+'">'+ep.title+'</a></li>'; }).join('') + '</ul></div>';
        try{ Lampa.Modal.open({ title: detail.title, html: html }); return; }catch(e){}
      }
    }catch(e){}

    var w = window.open();
    if(w) w.document.body.innerHTML = '<div style="padding:12px"><h2>'+detail.title+'</h2><img src="'+detail.poster+'" style="width:160px;height:240px"><p>'+ (detail.description||'') +'</p></div>';
  }

  // ---------- Settings panel ----------
  function createSettingsPanel(){
    var s = loadSettings();
    var panel = document.createElement('div');
    panel.style.padding = '12px';
    panel.innerHTML = ''
      + '<label><input id="kk_enabled" type="checkbox" '+(s.enabled?'checked':'')+'> Bật kkphim</label><br><br>'
      + '<label>API Base: <input id="kk_api" style="width:100%" value="'+s.apiBase+'"></label><br>'
      + '<label>Image Base: <input id="kk_img" style="width:100%" value="'+s.imgBase+'"></label><br>'
      + '<label>Home path: <input id="kk_home" style="width:100%" value="'+(s.homePath||'')+'"></label><br>'
      + '<label>Search path: <input id="kk_search" style="width:100%" value="'+(s.searchPath||'')+'"></label><br>'
      + '<label>Detail path: <input id="kk_detail" style="width:100%" value="'+(s.detailPath||'')+'"></label><br>'
      + '<label>Resolve path: <input id="kk_resolve" style="width:100%" value="'+(s.resolvePath||'')+'"></label><br>'
      + '<label>Quality: <select id="kk_quality"><option value="auto">Auto</option><option value="1080">1080</option><option value="720">720</option><option value="480">480</option></select></label><br>'
      + '<label>Cache TTL (s): <input id="kk_ttl" type="number" value="'+(s.cacheTTL||DEFAULTS.cacheTTL)+'" style="width:120px"></label><br>'
      + '<button id="kk_save" style="margin-top:8px">Lưu</button>';
    panel.querySelector('#kk_quality').value = s.quality || 'auto';
    panel.querySelector('#kk_save').addEventListener('click', function(){
      var newS = {
        enabled: !!panel.querySelector('#kk_enabled').checked,
        apiBase: panel.querySelector('#kk_api').value || DEFAULTS.apiBase,
        imgBase: panel.querySelector('#kk_img').value || DEFAULTS.imgBase,
        homePath: panel.querySelector('#kk_home').value || DEFAULTS.homePath,
        searchPath: panel.querySelector('#kk_search').value || DEFAULTS.searchPath,
        detailPath: panel.querySelector('#kk_detail').value || DEFAULTS.detailPath,
        resolvePath: panel.querySelector('#kk_resolve').value || DEFAULTS.resolvePath,
        quality: panel.querySelector('#kk_quality').value || 'auto',
        cacheTTL: Number(panel.querySelector('#kk_ttl').value) || DEFAULTS.cacheTTL
      };
      saveSettings(newS);
      try{ Lampa.Noty.show('Cài đặt kkphim đã lưu'); }catch(e){ console.log('Cài đặt kkphim đã lưu'); }
    });
    return panel;
  }

  // ---------- Left menu registration (wait for app ready) ----------
  function addLeftMenuItem(){
    try{
      // Prefer Lampa.Controller API if present (Android builds)
      if(window.Lampa && Lampa.Controller && typeof Lampa.Controller.add === 'function'){
        try{
          Lampa.Controller.add({
            id: 'kkphim',
            title: 'kkphim',
            icon: 'fa-film',
            onClick: function(){
              fetchHome().then(function(items){ renderGridActivity('kkphim - Trang chủ', items); }).catch(function(e){ console.error(e); try{ Lampa.Noty.show('Lỗi tải kkphim'); }catch(e){} });
            },
            onSettings: function(){
              try{ Lampa.Modal.open({ title: 'Cài đặt kkphim', html: createSettingsPanel() }); }catch(e){ openSettingsFallback(); }
            }
          });
          return;
        }catch(e){ console.warn('Controller.add failed', e); }
      }
    }catch(e){}

    // DOM fallback: insert into left menu after app ready
    try{
      var menuList = document.querySelector('.menu .menu__list, .menu__list, .left-menu, .menu-list');
      if(menuList && !menuList.querySelector('[data-action="kkphim"]')){
        var li = document.createElement('li');
        li.className = 'menu__item selector';
        li.setAttribute('data-action','kkphim');
        li.innerHTML = '<div class="menu__ico">🎬</div><div class="menu__text">kkphim</div>';
        menuList.appendChild(li);
        li.addEventListener('hover:enter', function(){
          fetchHome().then(function(items){ renderGridActivity('kkphim - Trang chủ', items); }).catch(function(e){ console.error(e); try{ Lampa.Noty.show('Lỗi tải kkphim'); }catch(e){} });
        });
      }
    }catch(e){ console.warn('addLeftMenuItem DOM fallback failed', e); }
  }

  function openSettingsFallback(){
    var panel = createSettingsPanel();
    try{ Lampa.Modal.open({ title: 'Cài đặt kkphim', html: panel }); }catch(e){ alert('Cài đặt kkphim: mở console để debug'); }
  }

  // ---------- Register API source for Lampa core (search/detail/resolve) ----------
  function registerApiSource(){
    try{
      window.Lampa = window.Lampa || {};
      window.Lampa.Api = window.Lampa.Api || {};
      window.Lampa.Api.sources = window.Lampa.Api.sources || {};
      window.Lampa.Api.sources.kkphim = {
        list: function(params, onSuccess, onError){
          fetchHome().then(function(results){ onSuccess({ results: results, title: 'kkphim' }); }).catch(onError);
        },
        search: function(params, onSuccess, onError){
          search(params.query || params.q || '', params.page || 1).then(function(results){ onSuccess({ results: results }); }).catch(onError);
        },
        full: function(params, onSuccess, onError){
          var id = params.id || (params.card && params.card.id) || params.url;
          fetchDetail(id).then(function(detail){ onSuccess(detail); }).catch(onError);
        },
        resolve: function(params, onSuccess, onError){
          var url = params.url || (params.episode && params.episode.url) || params.stream;
          resolvePlayLink(url).then(function(r){ onSuccess(r); }).catch(onError);
        }
      };
    }catch(e){ console.warn('registerApiSource failed', e); }
  }

  // ---------- Init: wait for app ready then add menu & register source ----------
  function init(){
    var s = loadSettings();
    if(!s.enabled){ console.log('kkphim plugin disabled'); return; }

    // If Lampa has app ready event
    try{
      if(Lampa.Listener && typeof Lampa.Listener.follow === 'function'){
        Lampa.Listener.follow('app', function(e){
          if(e && (e.type === 'ready' || e.action === 'ready')) addLeftMenuItem();
        });
      }else{
        // fallback: try DOMContentLoaded
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(addLeftMenuItem, 300); });
        setTimeout(addLeftMenuItem, 1000);
      }
    }catch(e){
      setTimeout(addLeftMenuItem, 1000);
    }

    // register API source immediately (so Lampa core can call)
    registerApiSource();

    // expose dev helpers
    window.Lampa = window.Lampa || {};
    window.Lampa.plugins = window.Lampa.plugins || {};
    window.Lampa.plugins.kkphimMain = {
      name: 'kkphim',
      getSettings: loadSettings,
      setSettings: saveSettings,
      _fetchHome: fetchHome,
      _search: search,
      _fetchDetail: fetchDetail,
      _resolve: resolvePlayLink,
      destroy: function(){
        try{
          var menuItem = document.querySelector('[data-action="kkphim"]');
          if(menuItem && menuItem.parentNode) menuItem.parentNode.removeChild(menuItem);
          if(window.Lampa && Lampa.Api && Lampa.Api.sources) delete window.Lampa.Api.sources.kkphim;
        }catch(e){ console.warn('kkphim destroy error', e); }
      }
    };

    console.log('kkphim plugin initialized (single-file Android-friendly) apiBase=' + s.apiBase);
  }

  // run init
  init();

})();