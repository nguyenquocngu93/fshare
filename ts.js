(function() {
  'use strict';
  
  if (typeof Lampa === 'undefined') return;
  if (Lampa.Platform.version < 200) return;
  
  const KKPHIM_API = 'https://phimapi.com';
  const CACHE_TIME = 10800000; // 3h
  let cache = {};
  
  // Cache simple
  const cacheGet = (key) => {
    const item = cache[key];
    return item && (Date.now() - item.t < CACHE_TIME) ? item.d : null;
  };
  const cacheSet = (key, data) => {
    cache[key] = { d: data, t: Date.now() };
  };
  
  // Source chính
  Lampa.Api.sources.kkphim = {
    category: (params = {}) => {
      const cat = params.cat || 'phim-moi-cap-nhat-v3';
      const page = params.page || 1;
      const key = `kkphim_cat_${cat}_${page}`;
      const cached = cacheGet(key);
      
      if (cached) return Promise.resolve(cached);
      
      let url = `${KKPHIM_API}/danh-sach/${cat}?page=${page}`;
      if (cat.startsWith('v1')) url = `${KKPHIM_API}/${cat}?page=${page}&limit=20`;
      
      return fetch(url)
        .then(r => r.json())
        .then(json => {
          const items = (json.items || json.data || []).slice(0, 20);
          
          items.forEach(item => {
            item.title = item.name || item.title || 'Unknown';
            item.img = item.poster || item.poster_url || item.thumb_url || 'https://via.placeholder.com/300x450?text=No+Image';
            item.url = `${KKPHIM_API}/phim/${item.slug}`;
            item.original_title = item.original_name || '';
            item.year = item.year || '';
            item.rating = item.imdb || 0;
            item.type = cat.includes('phim-bo') ? 'serial' : 'movie';
          });
          
          const result = {
            items,
            total_pages: json.total_pages || 1,
            pagination: { page }
          };
          
          cacheSet(key, result);
          return result;
        })
        .catch(e => {
          console.error('KKPhim category error:', e);
          return { items: [] };
        });
    },
    
    // Detail + PHÁT LUÔN
    detail: (url) => {
      const slug = url.split('/').pop();
      const key = `kkphim_detail_${slug}`;
      const cached = cacheGet(key);
      
      if (cached) return Promise.resolve(cached);
      
      return fetch(url)
        .then(r => r.json())
        .then(data => {
          // Parse episodes/servers thực tế API
          const servers = data.movie?.server_data || data.servers || [];
          let playlist = [];
          
          // Lấy embed đầu tiên để PHÁT LUÔN
          if (servers[0]?.episodes?.[0]) {
            const firstEp = servers[0].episodes[0];
            playlist = [{
              url: firstEp.link_embed || firstEp.link_m3u8 || firstEp.embed,
              quality: 'auto',
              timeline: 0,
              title: firstEp.name || 'Tập 1'
            }];
          }
          
          const result = {
            title: data.name,
            original_title: data.original_name,
            img: data.poster,
            description: data.content || data.description,
            episodes: servers.flatMap(s => s.episodes || []),
            playlist: playlist,  // Phát luôn!
            iframe_src: playlist[0]?.url || ''
          };
          
          cacheSet(key, result);
          return result;
        });
    }
  };
  
  // Thêm vào menu chính
  Lampa.Listener.follow('full', e => {
    if (e.type === 'complite') {
      const html = `
        <div class="full-start__item selector focus" data-uri="kkphim|phim-moi-cap-nhat-v3">
          <div class="full-start__img"><img src="https://via.placeholder.com/300x450/FF4757/FFF?text=KKPhim" /></div>
          <div class="full-start__title">KKPhim</div>
        </div>
      `;
      $('.full-start__line').append(html);
      
      $('.full-start__item[data-uri*="kkphim"]').on('hover:enter', () => {
        Lampa.Activity.push({
          url: '',
          title: 'KKPhim',
          component: 'full',
          source: 'kkphim',
          page: 1
        });
      });
    }
  });
  
  console.log('✅ KKPhim Plugin Loaded!');
})();