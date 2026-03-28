(function(){
  "use strict";
  if(!window.Lampa) return;

  var PLUGIN_KEY = 'lampa_kkphim_settings';
  var CACHE_KEY = 'lampa_kkphim_cache';
  var DEFAULTS = {
    enabled: true,
    apiBase: 'https://phimapi.com',
    imgBase: 'https://img.phimapi.com/',
    homePath: '/api/v1/movies',
    searchPath: '/api/v1/search',
    detailPath: '/api/v1/movie',
    resolvePath: '/api/v1/stream',
    quality: 'auto',
    cacheTTL: 3600
  };

  // ---------- Settings & Cache ----------
  function loadSettings(){
    try{
      var s = localStorage.getItem(PLUGIN_KEY);
      return s ? Object.assign({}, DEFAULTS, JSON.parse(s)) : Object.assign({}, DEFAULTS);
    }catch(e){ return Object.assign({}, DEFAULTS); }
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
    }catch(e){ console.warn('cacheSet error', e); }
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

  // ---------- Network ----------
  function safeJson(url, opts){
    return fetch(url, opts).then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function buildApi(path, params){
    var s = loadSettings();
    var base = s.apiBase.replace(/\/+$/,'');
    var p = path || '';
    if(params && Object.keys(params).length){
      var qs = Object.keys(params).map(function(k){ return encodeURIComponent(k)+'='+encodeURIComponent(params[k]); }).join('&');
      return base + p + (p.indexOf('?')===-1 ? '?' + qs : '&' + qs);
    }
    return base + p;
  }

  // ---------- Mapping ----------
  function mapMovieItem(it){
    var s = loadSettings();
    var poster = '';
    if(it.poster) poster = s.imgBase.replace(/\/+$/,'/') + String(it.poster).replace(/^\/+/,'');
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
      console.warn('fetchHome failed', err);
      return Promise.resolve([]);
    });
  }

  function search(query, page){
    var key = 'search_' + query + '_' + (page||1);
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
      console.warn('search failed', err);
      return Promise.resolve([]);
    });
  }

  function fetchDetail(id){
    var key = 'detail_' + id;
    var c = cacheGet(key);
    if(c) return Promise.resolve(c);
    var s = loadSettings();
    var url = (String(id).indexOf('http')===0) ? id : buildApi((s.detailPath || DEFAULTS.detailPath) + '/' + id);
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
      console.warn('fetchDetail failed', err);
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
      return Promise.reject(new Error('No stream found'));
    }).catch(function(err){
      return Promise.reject(err);
    });
  }

  // ---------- UI integration for Lampa Android ----------
  function renderGridActivity(title, items){
    // Prefer Lampa.Activity + Controller if available (Android)
    try{
      if(window.Lampa && Lampa.Activity && typeof Lampa.Activity.push === 'function'){
        // Build payload expected by Lampa Android: component 'category' with cards
        var cards = items.map(function(it){
          return {
            title: it.title,
            poster: it.poster,
            id: it.id,
            card: it
          };
        });
        Lampa.Activity.push({ title: title, component: 'category', source: 'kkphim', page: 1, cards: cards });
        return;
      }
    }catch(e){ console.warn('Activity.push failed', e); }

    // Fallback to Render.showList or simple window
    try{
      if(Lampa.Render && typeof Lampa.Render.showList === 'function'){
        Lampa.Render.showList({ title: title, items: items.map(function(it){ return { title: it.title, poster: it.poster, url: it.id, params: { card: it } }; }) });
        return;
      }
    }catch(e){ console.warn('Render.showList failed', e); }

    // Final fallback: open simple HTML
    var html = '<div style="padding:12px;font-family:Arial"><h2>' + title + '</h2>' +
      items.map(function(i){ return '<div style="display:flex;align-items:center;margin:8px 0"><img src="'+i.poster+'" style="width:100px;height:150px;object-fit:cover;margin-right:10px"><div><b>'+ (i.title||'') +'</b><div style="color:#666">'+ (i.year||'') +'</div></div></div>'; }).join('') + '</div>';
    var w = window.open(); if(w) w.document.body.innerHTML = html;
  }

  function openSettingsPanel(panelElement){
    try{
      if(Lampa.Modal && typeof Lampa.Modal.open === 'function'){
        try{ Lampa.Modal.open({ title: 'Cài đặt kkphim', html: panelElement }); return; }catch(e){}
        try{ Lampa.Modal.open({ title: 'Cài đặt kkphim', html: panelElement.innerHTML }); return; }catch(e){}
      }
    }catch(e){}
    alert('Cài đặt kkphim: mở console để debug');
  }

  function createSettingsPanel(){
    var s = loadSettings();
    var panel = document.createElement('div');
    panel.style.padding = '12px';
    panel.innerHTML = ''
      + '<label><input id="kk_enabled" type="checkbox" '+(s.enabled?'checked':'')+'> Bật kkphim</label><br><br>'
      + '<label>API Base: <input id="kk_api" style="width:100%" value="'+s.apiBase+'"></label><br>'
      + '<label>Image Base: <input id="kk_img" style="width:100%" value="'+s.imgBase+'"></label><br>'
      + '<label>Quality: <select id="kk_quality"><option value="auto">Auto</option><option value="1080">1080</option><option value="720">720</option></select></label><br>'
      + '<label>Cache TTL (s): <input id="kk_ttl" type="number" value="'+(s.cacheTTL||DEFAULTS.cacheTTL)+'" style="width:120px"></label><br>'
      + '<button id="kk_save" style="margin-top:8px">Lưu</button>';
    panel.querySelector('#kk_quality').value = s.quality || 'auto';
    panel.querySelector('#kk_save').addEventListener('click', function(){
      var newS = {
        enabled: !!panel.querySelector('#kk_enabled').checked,
        apiBase: panel.querySelector('#kk_api').value || DEFAULTS.apiBase,
        imgBase: panel.querySelector('#kk_img').value || DEFAULTS.imgBase,
        quality: panel.querySelector('#kk_quality').value || 'auto',
        cacheTTL: Number(panel.querySelector('#kk_ttl').value) || DEFAULTS.cacheTTL
      };
      saveSettings(newS);
      try{ Lampa.Noty.show('Cài đặt kkphim đã lưu'); }catch(e){ console.log('Cài đặt kkphim đã lưu'); }
    });
    return panel;
  }

  // ---------- Register left menu (Android style) ----------
  function registerLeftMenu(){
    try{
      // Try to use Lampa.Controller or Activity to add menu if available
      if(window.Lampa && Lampa.Controller && typeof Lampa.Controller.add === 'function'){
        // Some Android builds expose Controller.add for left menu; use safe call
        try{
          Lampa.Controller.add({
            id: 'kkphim',
            title: 'kkphim',
            icon: 'fa-film',
            onClick: function(){
              fetchHome().then(function(items){ renderGridActivity('kkphim - Trang chủ', items); }).catch(function(e){ console.error(e); });
            },
            onSettings: function(){
              openSettingsPanel(createSettingsPanel());
            }
          });
          return;
        }catch(e){ console.warn('Controller.add failed', e); }
      }
    }catch(e){ /* ignore */ }

    // DOM fallback: insert into left menu DOM used by Android build
    try{
      var menuList = document.querySelector('.menu .menu__list, .menu__list, .left-menu, .menu-list');
      if(menuList && !menuList.querySelector('[data-action="kkphim"]')){
        var icon = '<svg style="width:20px;height:20px" viewBox="0 0 24 24"><path fill="currentColor" d="M10 16.5L16 12L10 7.5V16.5Z"/></svg>';
        var li = document.createElement('li');
        li.className = 'menu__item selector';
        li.setAttribute('data-action','kkphim');
        li.innerHTML = '<div class="menu__ico">'+icon+'</div><div class="menu__text">kkphim</div>';
        menuList.appendChild(li);
        li.addEventListener('hover:enter', function(){
          fetchHome().then(function(items){ renderGridActivity('kkphim - Trang chủ', items); }).catch(function(e){ console.error(e); });
        });
      }
    }catch(e){ console.warn('registerLeftMenu DOM fallback failed', e); }
  }

  // ---------- Register API source for Lampa core ----------
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

  // ---------- Plugin public ----------
  var plugin = {
    name: 'kkphim',
    init: function(){
      var s = loadSettings();
      if(!s.enabled){ console.log('kkphim plugin disabled'); return; }
      registerLeftMenu();
      registerApiSource();
      console.log('kkphim plugin initialized (Android compatible) apiBase=' + s.apiBase);
    },
    getSettings: loadSettings,
    setSettings: saveSettings,
    destroy: function(){
      try{
        var menuItem = document.querySelector('[data-action="kkphim"]');
        if(menuItem && menuItem.parentNode) menuItem.parentNode.removeChild(menuItem);
        if(window.Lampa && Lampa.Api && Lampa.Api.sources) delete window.Lampa.Api.sources.kkphim;
      }catch(e){ console.warn('destroy error', e); }
    },
    _fetchHome: fetchHome,
    _search: search,
    _fetchDetail: fetchDetail,
    _resolve: resolvePlayLink
  };

  window.Lampa.plugins = window.Lampa.plugins || {};
  window.Lampa.plugins.kkphimMain = plugin;

})();