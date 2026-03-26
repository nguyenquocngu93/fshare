(function() {
    'use strict';

    // ==================== CẤU HÌNH API ====================
    const API_BASE_URL = 'https://phimapi.com/api';
    const SOURCE_NAME = 'KKPhim';
    const SOURCE_ID = 'kkphim';

    // ==================== SERVICE CLASS ====================
    class KkphimApiService {
        constructor() {
            this.name = SOURCE_NAME;
            this.id = SOURCE_ID;
        }

        // Phương thức lấy danh sách phim theo danh mục (được Lampa gọi khi chọn nguồn)
        list(params, onComplete, onError) {
            // params.url có dạng "category__sort" ví dụ: "phim-le__new"
            let [category, sortType] = (params.url || 'phim-le__new').split('__');
            let page = params.page || 1;

            // Xây dựng endpoint
            let url = '';
            if (category === 'search') {
                // Nếu là tìm kiếm, params.url sẽ có dạng "search__keyword"
                let keyword = sortType || '';
                url = `${API_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}&page=${page}`;
            } else {
                // Danh sách theo category
                url = `${API_BASE_URL}/categories/${category}/films?page=${page}`;
                // Nếu có sort, thêm tham số (tuỳ API hỗ trợ)
                if (sortType && sortType !== 'new') {
                    url += `&sort=${sortType}`;
                }
            }

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data && data.items) {
                        const normalized = this._normalizeListData(data, page);
                        onComplete(normalized);
                    } else {
                        onError('Không có dữ liệu từ API');
                    }
                })
                .catch(error => {
                    console.error('KKPhim API error:', error);
                    onError(error.message || 'Lỗi kết nối API');
                });
        }

        // Phương thức lấy chi tiết phim
        full(params, onSuccess, onError) {
            let id = params.id;
            if (!id) {
                onError('Thiếu ID phim');
                return;
            }

            // Có thể dùng slug thay vì id; API thường dùng slug
            const url = `${API_BASE_URL}/films/${id}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data && data._id) {
                        const detail = this._normalizeDetailData(data);
                        onSuccess(detail);
                    } else {
                        onError('Không tìm thấy chi tiết phim');
                    }
                })
                .catch(error => {
                    console.error('KKPhim detail error:', error);
                    onError(error.message);
                });
        }

        // ==================== CHUẨN HÓA DỮ LIỆU ====================
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
                    vote_average: null,
                    source: SOURCE_ID,
                    raw: item
                })),
                page: pagination.currentPage || page,
                total_pages: pagination.totalPages || 1,
                total_results: pagination.totalItems || items.length
            };
        }

        _normalizeDetailData(apiResponse) {
            const item = apiResponse;
            // Xử lý tập phim (episodes) nếu có
            let seasons = [];
            if (item.episodes && Array.isArray(item.episodes)) {
                // Nếu có cấu trúc seasons, ánh xạ. Giả sử API trả về mảng các tập, mỗi tập có season
                const seasonMap = new Map();
                item.episodes.forEach(ep => {
                    const seasonNum = ep.season || 1;
                    if (!seasonMap.has(seasonNum)) {
                        seasonMap.set(seasonNum, { season_number: seasonNum, episodes: [] });
                    }
                    seasonMap.get(seasonNum).episodes.push({
                        episode_number: ep.episode || ep.number,
                        title: ep.title || `Tập ${ep.episode || ep.number}`,
                        still_path: ep.thumb_url,
                        runtime: null
                    });
                });
                seasons = Array.from(seasonMap.values()).sort((a,b) => a.season_number - b.season_number);
            }

            return {
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
                genres: (item.category || []).map(cat => cat.name),
                seasons: seasons,
                source: SOURCE_ID,
                raw: item
            };
        }
    }

    // ==================== ĐĂNG KÝ NGUỒN ====================
    function registerSource() {
        if (Lampa.Api.sources[SOURCE_ID]) {
            console.log(`[${SOURCE_NAME}] Đã được đăng ký trước đó`);
            return;
        }

        Lampa.Api.sources[SOURCE_ID] = new KkphimApiService();

        // Tuỳ chọn: thêm vào danh sách nguồn trong cài đặt (nếu có)
        if (Lampa.SettingsApi && Lampa.SettingsApi.addParam) {
            // Có thể thêm tùy chọn bật/tắt nguồn trong phần "Nguồn phim"
            console.log(`[${SOURCE_NAME}] Đã đăng ký thành công`);
        }

        Lampa.Listener.send('source_added', { source: SOURCE_ID, name: SOURCE_NAME });
    }

    // ==================== THÊM DANH MỤC VÀO MENU CHÍNH (TÙY CHỌN) ====================
    // Nếu muốn thêm mục riêng "KKPhim" trong menu bên trái
    function addMenu() {
        // Lampa.Listener.follow('activity', ...) để chèn khi activity load
        // Hoặc có thể can thiệp trực tiếp vào DOM
        Lampa.Listener.follow('activity', function(e) {
            if (e.type === 'start' && e.component === 'full') {
                setTimeout(() => {
                    if ($('.menu-item[data-source="kkphim"]').length === 0) {
                        const menuItems = $('.menu-items');
                        if (menuItems.length) {
                            const newItem = $(`
                                <div class="menu-item" data-source="kkphim">
                                    <div class="menu-item__icon"><svg>...</svg></div>
                                    <div class="menu-item__name">KKPhim</div>
                                </div>
                            `);
                            newItem.on('click', () => {
                                // Khi click vào mục, chuyển sang nguồn kkphim
                                Lampa.Source.active(SOURCE_ID);
                                Lampa.Controller.toggle('menu');
                            });
                            menuItems.append(newItem);
                        }
                    }
                }, 100);
            }
        });
    }

    // ==================== KHỞI TẠO ====================
    function init() {
        if (!window.Lampa || !Lampa.Api) {
            Lampa.Listener.follow('app', function(e) {
                if (e.type === 'ready') {
                    registerSource();
                    // addMenu(); // Bỏ comment nếu muốn thêm menu riêng
                }
            });
        } else {
            registerSource();
            // addMenu();
        }
    }

    init();
})();