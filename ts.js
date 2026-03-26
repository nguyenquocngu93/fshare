(function() {
    'use strict';

    // ============ CẤU HÌNH ============
    const API_URL = 'https://phimapi.com/api';
    const PLUGIN_NAME = 'KKPhim';
    const PLUGIN_ID = 'kkphim';

    // Cấu hình danh mục (giống LNUM)
    const categories = [
        { id: 'phim-le', name: 'Phim lẻ', api: '/categories/phim-le/films' },
        { id: 'phim-bo', name: 'Phim bộ', api: '/categories/phim-bo/films' },
        { id: 'hoat-hinh', name: 'Hoạt hình', api: '/categories/hoat-hinh/films' },
        { id: 'tv-shows', name: 'TV Shows', api: '/categories/tv-shows/films' }
    ];

    // Cache
    const CACHE = {};
    const CACHE_TIME = 3 * 60 * 60 * 1000; // 3 giờ

    function getCache(key) {
        const item = CACHE[key];
        if (item && Date.now() - item.time < CACHE_TIME) {
            return item.data;
        }
        return null;
    }

    function setCache(key, data) {
        CACHE[key] = { data: data, time: Date.now() };
    }

    // ============ SERVICE ============
    class KkphimService {
        constructor() {
            this.name = PLUGIN_NAME;
            this.id = PLUGIN_ID;
        }

        // Lấy danh sách (giống LNUM)
        list(params, onComplete, onError) {
            const cacheKey = `list_${params.url}_${params.page || 1}`;
            const cached = getCache(cacheKey);
            if (cached) {
                onComplete(cached);
                return;
            }

            const [type, sort] = (params.url || 'phim-le').split('__');
            const page = params.page || 1;
            
            let url = '';
            if (type === 'search') {
                url = `${API_URL}/search?keyword=${encodeURIComponent(sort || '')}&page=${page}`;
            } else {
                const category = categories.find(c => c.id === type);
                if (category) {
                    url = `${API_URL}${category.api}?page=${page}`;
                } else {
                    url = `${API_URL}/categories/${type}/films?page=${page}`;
                }
            }

            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data && data.items) {
                        const result = {
                            results: data.items.map(item => ({
                                id: item._id,
                                title: item.name,
                                name: item.name,
                                poster_path: item.poster_url || item.thumb_url,
                                overview: item.content || '',
                                year: item.year,
                                vote_average: item.tmdb?.vote_average || null,
                                source: PLUGIN_ID
                            })),
                            page: data.pagination?.currentPage || page,
                            total_pages: data.pagination?.totalPages || 1,
                            total_results: data.pagination?.totalItems || data.items.length
                        };
                        setCache(cacheKey, result);
                        onComplete(result);
                    } else {
                        onError('Không có dữ liệu');
                    }
                })
                .catch(err => {
                    console.error('KKPhim list error:', err);
                    onError(err.message);
                });
        }

        // Lấy chi tiết (giống LNUM)
        full(params, onSuccess, onError) {
            const id = params.id;
            if (!id) {
                onError('Không có ID');
                return;
            }

            const cacheKey = `full_${id}`;
            const cached = getCache(cacheKey);
            if (cached) {
                onSuccess(cached);
                return;
            }

            fetch(`${API_URL}/films/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data._id) {
                        const detail = {
                            id: data._id,
                            title: data.name,
                            original_title: data.origin_name,
                            overview: data.content,
                            poster_path: data.poster_url,
                            backdrop_path: data.thumb_url,
                            vote_average: data.tmdb?.vote_average || null,
                            vote_count: data.tmdb?.vote_count || null,
                            release_date: data.year ? `${data.year}-01-01` : null,
                            runtime: data.time || null,
                            genres: (data.category || []).map(c => c.name),
                            source: PLUGIN_ID
                        };
                        setCache(cacheKey, detail);
                        onSuccess(detail);
                    } else {
                        onError('Không tìm thấy phim');
                    }
                })
                .catch(err => {
                    console.error('KKPhim full error:', err);
                    onError(err.message);
                });
        }

        // Tìm kiếm (giống LNUM)
        search(params, onComplete, onError) {
            this.list({ url: `search__${params.keyword}`, page: params.page || 1 }, onComplete, onError);
        }
    }

    // ============ ĐĂNG KÝ ============
    function register() {
        if (Lampa.Api.sources[PLUGIN_ID]) return;
        
        // Đăng ký service
        Lampa.Api.sources[PLUGIN_ID] = new KkphimService();
        Lampa.Api.sources[PLUGIN_ID].alias = PLUGIN_ID;
        
        console.log(`[${PLUGIN_NAME}] Đã đăng ký service`);
    }

    // ============ THÊM MENU (GIỐNG LNUM) ============
    function addMenu() {
        if (!Lampa.Menu || !Lampa.Menu.list) {
            setTimeout(addMenu, 500);
            return;
        }

        if (Lampa.Menu.list.some(item => item.id === PLUGIN_ID)) return;

        Lampa.Menu.list.push({
            id: PLUGIN_ID,
            name: PLUGIN_NAME,
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4V6zm0 4h16v2H4v-2zm0 4h10v2H4v-2zm13 0h3v2h-3v-2zm-3-4h6v2h-6v-2z"/></svg>',
            onSelect: function() {
                Lampa.Source.active(PLUGIN_ID);
                Lampa.Controller.toggle('menu');
            }
        });

        if (typeof Lampa.Menu.update === 'function') {
            Lampa.Menu.update();
        }

        console.log(`[${PLUGIN_NAME}] Đã thêm menu`);
    }

    // ============ KHỞI CHẠY ============
    function init() {
        if (window.Lampa && window.Lampa.Api) {
            register();
            addMenu();
        } else {
            Lampa.Listener.follow('app', function(e) {
                if (e.type === 'ready') {
                    register();
                    addMenu();
                }
            });
        }
    }

    init();
})();