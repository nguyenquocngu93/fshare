(function() {
    'use strict';

    const API_BASE_URL = 'https://phimapi.com/api';
    const PLUGIN_NAME = 'KKPhim';
    const PLUGIN_ID = 'kkphim';

    // Cache settings
    const CACHE_SIZE = 100;
    const CACHE_TIME = 3 * 60 * 60 * 1000; // 3 giờ
    let cache = new Map();

    function getCached(key) {
        const item = cache.get(key);
        if (item && Date.now() - item.timestamp < CACHE_TIME) {
            return item.data;
        }
        return null;
    }

    function setCached(key, data) {
        if (cache.size >= CACHE_SIZE) {
            const oldestKey = cache.keys().next().value;
            cache.delete(oldestKey);
        }
        cache.set(key, { data, timestamp: Date.now() });
    }

    // ============ SERVICE CLASS ============
    class KkphimApiService {
        constructor() {
            this.name = PLUGIN_NAME;
            this.id = PLUGIN_ID;
        }

        // Phương thức chính: lấy danh sách nội dung
        list(params, onComplete, onError) {
            const cacheKey = `${params.url || ''}_${params.page || 1}`;
            const cached = getCached(cacheKey);
            if (cached) {
                onComplete(cached);
                return;
            }

            let [category, sortType] = (params.url || 'phim-le__new').split('__');
            let page = params.page || 1;
            let url = '';

            if (category === 'search') {
                let keyword = sortType || '';
                url = `${API_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}&page=${page}`;
            } else {
                url = `${API_BASE_URL}/categories/${category}/films?page=${page}`;
            }

            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data && data.items) {
                        const normalized = this._normalizeListData(data, page);
                        setCached(cacheKey, normalized);
                        onComplete(normalized);
                    } else {
                        onError('Không có dữ liệu');
                    }
                })
                .catch(err => {
                    console.error('[KKPhim] list error:', err);
                    onError(err.message || 'Lỗi kết nối');
                });
        }

        // Phương thức lấy chi tiết phim
        full(params, onSuccess, onError) {
            const id = params.id;
            if (!id) {
                onError('Thiếu ID phim');
                return;
            }

            const cacheKey = `detail_${id}`;
            const cached = getCached(cacheKey);
            if (cached) {
                onSuccess(cached);
                return;
            }

            fetch(`${API_BASE_URL}/films/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data._id) {
                        const detail = this._normalizeDetailData(data);
                        setCached(cacheKey, detail);
                        onSuccess(detail);
                    } else {
                        onError('Không tìm thấy chi tiết phim');
                    }
                })
                .catch(err => {
                    console.error('[KKPhim] detail error:', err);
                    onError(err.message);
                });
        }

        // Phương thức tìm kiếm (gọi lại list với category=search)
        search(params, onComplete, onError) {
            this.list({ url: `search__${params.keyword}`, page: params.page || 1 }, onComplete, onError);
        }

        // Chuẩn hóa danh sách
        _normalizeListData(apiResponse, page) {
            const items = apiResponse.items || [];
            const pagination = apiResponse.pagination || {};
            return {
                results: items.map(item => ({
                    id: item._id,
                    title: item.name,
                    name: item.name,
                    poster_path: item.poster_url || item.thumb_url,
                    overview: item.content || '',
                    year: item.year,
                    vote_average: item.tmdb?.vote_average || null,
                    source: PLUGIN_ID,
                    raw: item
                })),
                page: pagination.currentPage || page,
                total_pages: pagination.totalPages || 1,
                total_results: pagination.totalItems || items.length
            };
        }

        // Chuẩn hóa chi tiết
        _normalizeDetailData(apiResponse) {
            const item = apiResponse;
            const detail = {
                id: item._id,
                title: item.name,
                original_title: item.origin_name,
                overview: item.content,
                poster_path: item.poster_url,
                backdrop_path: item.thumb_url,
                vote_average: item.tmdb?.vote_average || null,
                vote_count: item.tmdb?.vote_count || null,
                release_date: item.year ? `${item.year}-01-01` : null,
                runtime: item.time || null,
                genres: (item.category || []).map(c => c.name),
                source: PLUGIN_ID,
                raw: item
            };

            // Xử lý tập phim
            if (item.episodes && Array.isArray(item.episodes)) {
                const seasons = [];
                const epMap = new Map();
                item.episodes.forEach(ep => {
                    const seasonNum = ep.season || 1;
                    if (!epMap.has(seasonNum)) {
                        epMap.set(seasonNum, { season_number: seasonNum, episodes: [] });
                    }
                    epMap.get(seasonNum).episodes.push({
                        episode_number: ep.episode || ep.number,
                        title: ep.title || `Tập ${ep.episode || ep.number}`,
                        still_path: ep.thumb_url,
                        runtime: null
                    });
                });
                detail.seasons = Array.from(epMap.values()).sort((a,b) => a.season_number - b.season_number);
            } else {
                detail.seasons = [];
            }
            return detail;
        }
    }

    // ============ ĐĂNG KÝ VÀO LAMPA ============
    function registerSource() {
        if (Lampa.Api.sources[PLUGIN_ID]) {
            console.log(`[${PLUGIN_NAME}] Đã được đăng ký trước đó`);
            return;
        }

        Lampa.Api.sources[PLUGIN_ID] = new KkphimApiService();
        // Alias để dễ gọi
        Lampa.Api.sources.kkphim = Lampa.Api.sources[PLUGIN_ID];
        console.log(`[${PLUGIN_NAME}] Đã đăng ký service thành công`);
    }

    // ============ THÊM MENU ============
    function addMenuItem() {
        if (!Lampa.Menu || !Lampa.Menu.list) {
            setTimeout(addMenuItem, 500);
            return;
        }

        const exists = Lampa.Menu.list.some(item => item.id === PLUGIN_ID);
        if (exists) {
            console.log(`[${PLUGIN_NAME}] Menu đã tồn tại`);
            return;
        }

        Lampa.Menu.list.push({
            id: PLUGIN_ID,
            name: PLUGIN_NAME,
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4V6zm0 4h16v2H4v-2zm0 4h10v2H4v-2zm13 0h3v2h-3v-2zm-3-4h6v2h-6v-2z"/></svg>',
            onSelect: function() {
                // Khi chọn menu, chuyển sang nguồn KKPhim
                Lampa.Source.active(PLUGIN_ID);
                Lampa.Controller.toggle('menu');
            }
        });

        if (typeof Lampa.Menu.update === 'function') {
            Lampa.Menu.update();
        }

        console.log(`[${PLUGIN_NAME}] Đã thêm menu thành công`);
    }

    // ============ THÊM DANH MỤC VÀO GIAO DIỆN CHÍNH ============
    function addCategories() {
        if (!Lampa.Component || !Lampa.Component.categories) {
            setTimeout(addCategories, 500);
            return;
        }

        // Thêm các danh mục riêng cho KKPhim (tuỳ chọn)
        const categories = [
            { id: 'phim-le', name: 'Phim lẻ', source: PLUGIN_ID, url: 'phim-le__new' },
            { id: 'phim-bo', name: 'Phim bộ', source: PLUGIN_ID, url: 'phim-bo__new' },
            { id: 'hoat-hinh', name: 'Hoạt hình', source: PLUGIN_ID, url: 'hoat-hinh__new' },
            { id: 'tv-shows', name: 'TV Shows', source: PLUGIN_ID, url: 'tv-shows__new' }
        ];

        categories.forEach(cat => {
            if (!Lampa.Component.categories[cat.id]) {
                Lampa.Component.categories[cat.id] = {
                    name: cat.name,
                    source: cat.source,
                    url: cat.url
                };
            }
        });

        console.log(`[${PLUGIN_NAME}] Đã thêm danh mục`);
    }

    // ============ KHỞI CHẠY ============
    function init() {
        if (typeof Lampa === 'undefined') {
            Lampa.Listener.follow('app', function(e) {
                if (e.type === 'ready') {
                    registerSource();
                    addMenuItem();
                    addCategories();
                }
            });
        } else {
            registerSource();
            addMenuItem();
            addCategories();
        }
    }

    init();
})();