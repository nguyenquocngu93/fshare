(function () {
  'use strict';
  
  if (!window.Lampa || Lampa.Platform.version < 300) return;
  
  var KKPHIM_BASE = 'https://phimapi.com';
  var KKPHIM_VERSION = '1.0';
  var cache = {};
  var cache_time = 3 * 60 * 60 * 1000; // 3h
  var max_cache = 100;
  
  // Categories như lnum
  var BASE_CATEGORIES = {
    phim_moi: { title: 'Phim Mới', url: 'phim-moi-cap-nhat-v3', img: 'https://via.placeholder.com/150x200/FF6B6B/FFFFFF?text=New' },
    phim_le: { title: 'Phim Lẻ', url: 'v1/api/danh-sach/phim-le', img: 'https://via.placeholder.com/150x200/4ECDC4/FFFFFF?text=Movie' },
    phim_bo: { title: 'Phim Bộ', url: 'v1/api/danh-sach/phim-bo', img: 'https://via.placeholder.com/150x200/45B7D1/FFFFFF?text=TV' },
    hoat_hinh: { title: 'Hoạt Hình', url: 'v1/api/danh-sach/hoat-hinh', img: 'https://via.placeholder.com/150x200/F9CA24/000000?text=Cartoon' },
    hanh_dong: { title: 'Hành Động', url: 'v1/api/the-loai/hanh-dong', img: 'https://via.placeholder.com/150x200/E74C3C/FFFFFF?text=Action' },
    shuffle: { title: 'Ngẫu Nhiên', url: 'shuffle', img: 'https://via.placeholder.com/150x200/9B59B6/FFFFFF?text=Random' }
  };
  
  // Cache utils từ lnum
  function getCache(key) {
    var item = cache[key];
    return item && (Date.now() - item.time < cache_time) ? item.data : null;
  }
  function setCache(key, data) {
    cache[key] = { data, time: Date.now() };
    if (Object.keys(cache).length > max_cache) {
      var keys = Object.keys(cache);
      delete cache[keys[0]];
    }
  }
  
  // Main source
  Lampa.Api.sources.kkphim = {
    
    category: function(params) {
      var cat = params.cat || 'phim_moi';
      var page = params.page || 1;
      var key = 'kkphim_' + cat + '_' + page;
      var cached = getCache(key);
      
      if (cached) return Promise.resolve(cached);
      
      var url = KKPHIM_BASE + '/' + BASE_CATEGORIES[cat]?.url || 'phim-moi-cap-nhat-v3';
      if (url.includes('v1/api')) url += '?page=' + page + '&limit=20';
      else url += '?page=' + page;
      
      return fetch(url)
        .then(res => res.json())
        .then(data => {
          var items = data.items || data.data || [];
          
          items.forEach(item => {
            item.title = item.name || item.title;
            item.original_title = item.original_name || '';
            item.img = item.poster_url || item.poster || item.thumb_url || item.horizontal_poster || 
                       'https://via.placeholder.com/300x450/95A5A6/FFFFFF?text=No+Poster';
            item.poster = item.img;
            item.url = KKPHIM_BASE + '/phim/' + item.slug;
            item.type = cat === 'phim_bo' ? 'serial' : 'movie';
            item.content = 'movie';
            item.year = item.year || '';
            item.genres = item.category ? (Array.isArray(item.category) ? item.category : [item.category]) : [];
            item.rating = parseFloat(item.rating || item.imdb || 0);
            item.description = item.description || '';
          });
          
          var result = { 
            items: items.slice(0, 20),
            total_pages: data.totalPages || data.total_pages || 1,
            pagination: { page, total: data.totalPages }
          };
          
          setCache(key, result);
          return result;
        })
        .catch(e => {
          Lampa.Noty.show('KKPhim category error: ' + e.message);
          return { items: [] };
        });
    },
    
    detail: function(url) {
      var key = 'kkphim_detail_' + url.split('/').pop();
      var cached = getCache(key);
      if (cached) return Promise.resolve(cached);
      
      return fetch(url)
        .then(res => res.json())
        .then(data => {
          // Parse episodes/servers như lnum
          var episodes = [];
          var servers = data.movie?.server_data || data.servers || [];
          
          servers.forEach((server, sidx) => {
            server.episodes.forEach((ep, eidx) => {
              episodes.push({
                title: ep.name || `Tập ${eidx + 1}`,
                id: eidx + 1,
                server: server.server_name || 'default',
                embed: ep.link_embed || ep.embed_url || ep.link_m3u8,
                playlist: ep.link_m3u8 ? [{url: ep.link_m3u8, quality: 'auto', timeline: 0}] : []
              });
            });
          });
          
          var result = {
            title: data.name,
            original_title: data.original_name,
            img: data.poster,
            description: data.content,
            episodes: episodes,
            iframe_src: episodes[0]?.embed || ''  // Phát luôn tập 1
          };
          
          setCache(key, result);
          return result;
        });
    },
    
    search: function(query, page) {
      var url = KKPHIM_BASE + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(query) + '&page=' + (page || 1);
      return fetch(url).then(res => res.json()).then(data => (data.items || []).map(item => ({
        title: item.name,
        img: item.poster,
        url: KKPHIM_BASE + '/phim/' + item.slug
      })));
    }
  };
  
  // Menu categories
  Lampa.Listener.follow('app', (e) => {
    if (e.type === 'complite') {
      var html = '';
      Object.keys(BASE_CATEGORIES).forEach(cat => {
        var c = BASE_CATEGORIES[cat];
        html += `<div class="full-start__item selector" data-cat="${cat}">
          <div class="full-start__img"><img src="${c.img}" /></div>
          <div class="full-start__title">${c.title}</div>
        </div>`;
      });
      $('.full-start__line').append(html);
      
      $('.selector[data-cat]').on('hover:enter', function() {
        var cat = $(this).data('cat');
        Lampa.Activity.push({
          url: BASE_CATEGORIES[cat].url,
          title: BASE_CATEGORIES[cat].title,
          component: 'full',
          source: 'kkphim',
          cat: cat,
          page: 1
        });
      });
    }
  });
  
  // Toggle settings
  Lampa.Settings.main().param({
    component: 'items_line',
    name: 'KKPhim Source',
    type: 'toggle',
    value: true,
    description: 'Bật nguồn phim KKPhim'
  });
  
  console.log('KKPhim Plugin v' + KKPHIM_VERSION + ' loaded!');
  
})();