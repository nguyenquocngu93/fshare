(function() {
  'use strict';
  
  if (typeof Lampa === 'undefined') return;
  
  const KKPHIM_API = 'https://phimapi.com';
  let cache = {};
  const CACHE_TIME = 10800000;
  
  const cacheGet = key => cache[key]?.d && (Date.now() - cache[key].t < CACHE_TIME) ? cache[key].d : null;
  const cacheSet = (key, data) => cache[key] = { d: data, t: Date.now() };
  
  // Đăng ký source
  if (!Lampa.Api.sources.kkphim) {
    Lampa.Api.sources.kkphim = {
      category: (params = {}) => {
        const cat = params.cat || 'phim-moi-cap-nhat-v3';
        const page = params.page || 1;
        const key = `kk_${cat}_${page}`;
        const cached = cacheGet(key);
        
        if (cached) return Promise.resolve(cached);
        
        let url = `${KKPHIM_API}/danh-sach/${cat}?page=${page}`;
        if (cat.startsWith('v1')) url = `${KKPHIM_API}/${cat}?page=${page}`;
        
        return fetch(url).then(r => r.json()).then(json => {
          const items = (json.items || json.data || []).slice(0, 20);
          
          items.forEach(item => {
            item.title = item.name || 'N/A';
            item.img = item.poster || item.poster_url || 'https://via.placeholder.com/300x450/95A5A6/fff?text=KKPhim';
            item.url = `${KKPHIM_API}/phim/${item.slug}`;
            item.original_title = item.original_name || '';
            item.year = parseInt(item.year) || 2026;
            item.type = cat.includes('bo') ? 'serial' : 'movie';
          });
          
          const result = { items, total_pages: json.total_pages || 1, pagination: { page } };
          cacheSet(key, result);
          return result;
        }).catch(() => ({ items: [] }));
      },
      
      detail: url => {
        const slug = url.split('/').pop();
        const key = `kk_detail_${slug}`;
        const cached = cacheGet(key);
        
        if (cached) return Promise.resolve(cached);
        
        return fetch(url).then(r => r.json()).then(data => {
          const playlist = [{
            url: data.movie?.embed_url || data.embed || data.playlist?.[0]?.file || '',
            quality: 'HD',
            title: 'Tập 1'
          }];
          
          const result = {
            title: data.name || 'Unknown',
            img: data.poster,
            description: data.content,
            playlist,
            episodes: data.episodes || []
          };
          cacheSet(key, result);
          return result;
        }).catch(() => ({}));
      }
    };
  }
  
  // THÊM MENU - Fix chính
  Lampa.Listener.follow('app', (e) => {
    if (e.type === 'complite') {
      setTimeout(() => {
        // Thêm vào Full Start (như TMDB, lnum)
        let menuItem = `<div class="full-start__item selector" data-item="kkphim">
          <div class="full-start__img">
            <img src="https://via.placeholder.com/300x450/FF6B6B/FFFFFF?text=KKPhim" srcset="https://via.placeholder.com/600x900/FF6B6B/FFFFFF?text=KKPhim 2x">
          </div>
          <div class="full-start__title">KKPhim</div>
          <div class="full-start__title-descr">Phim Việt HD</div>
        </div>`;
        
        if (!$('.full-start__item[data-item="kkphim"]').length) {
          $('.full-start__line').append(menuItem);
          
          // Click handler
          $('.full-start__item[data-item="kkphim"]').on('hover:enter', () => {
            Lampa.Activity.push({
              url: 'kkphim|phim-moi-cap-nhat-v3',
              title: 'KKPhim - Phim Mới',
              component: 'full',
              source: 'kkphim',
              page: 1
            });
          });
        }
        
        console.log('✅ KKPhim menu added!');
      }, 2000); // Delay để DOM ready
    }
  });
  
  // Settings toggle
  Lampa.Settings.main().render().find('.selector').eq(-1).after(`
    <div class="simple-settings-item selector">
      <div class="settings-param selector" data-name="kkphim_enable">
        <div class="settings-param__name">KKPhim Source</div>
        <div class="settings-param__value">Bật nguồn KKPhim</div>
        <div class="settings-param__descr">Phim HD Việt sub</div>
        <div class="settings-param__status selector" data-off>Off</div>
      </div>
    </div>
  `);
  
  console.log('🚀 KKPhim v1.1 loaded - Menu sẽ hiện sau 2s!');
})();