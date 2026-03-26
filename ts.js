(function() {
    'use strict';

    const API_BASE_URL = 'https://phimapi.com/api';
    const SOURCE_NAME = 'KKPhim';
    const SOURCE_ID = 'kkphim';

    class KkphimApiService {
        constructor() {
            this.name = SOURCE_NAME;
            this.id = SOURCE_ID;
        }

        list(params, onComplete, onError) {
            let [category, sortType] = (params.url || 'phim-le__new').split('__');
            let page = params.page || 1;

            let url = '';
            if (category === 'search') {
                let keyword = sortType || '';
                url = `${API_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}&page=${page}`;
            } else {
                url = `${API_BASE_URL}/categories/${category}/films?page=${page}`;
                if (sortType && sortType !== 'new') url += `&sort=${sortType}`;
            }

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data && data.items) {
                        onComplete(this._normalizeListData(data, page));
                    } else {
                        onError('Không có dữ liệu từ API');
                    }
                })
                .catch(error => {
                    console.error('KKPhim API error:', error);
                    onError(error.message || 'Lỗi kết nối API');
                });
        }

        full(params, onSuccess, onError) {
            let id = params.id;
            if (!id) {
                onError('Thiếu ID phim');
                return;
            }

            const url = `${API_BASE_URL}/films/${id}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data && data._id) {
                        onSuccess(this._normalizeDetailData(data));
                    } else {
                        onError('Không tìm thấy chi tiết phim');
                    }
                })
                .catch(error => {
                    console.error('KKPhim detail error:', error);
                    onError(error.message);
                });
        }

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
            let seasons = [];
            if (item.episodes && Array.isArray(item.episodes)) {
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

    function registerSource() {
        if (Lampa.Api.sources[SOURCE_ID]) {
            console.log(`[${SOURCE_NAME}] Đã được đăng ký trước đó`);
            return;
        }

        // 1. Đăng ký service vào Lampa.Api.sources
        Lampa.Api.sources[SOURCE_ID] = new KkphimApiService();
        console.log(`[${SOURCE_NAME}] Service đã đăng ký vào Lampa.Api.sources`);

        // 2. Thêm nguồn vào danh sách nguồn của Lampa (quan trọng để xuất hiện trong dropdown)
        if (Lampa.Source && Lampa.Source.list) {
            // Kiểm tra xem nguồn đã tồn tại chưa
            const exists = Lampa.Source.list.some(s => s.id === SOURCE_ID);
            if (!exists) {
                Lampa.Source.list.push({
                    id: SOURCE_ID,
                    name: SOURCE_NAME,
                    // Có thể thêm các thông tin khác nếu cần
                    type: 'torrent', // hoặc 'online', tuỳ vào loại nguồn
                });
                console.log(`[${SOURCE_NAME}] Đã thêm vào Lampa.Source.list`);
            } else {
                console.log(`[${SOURCE_NAME}] Đã tồn tại trong Lampa.Source.list`);
            }

            // Gọi hàm cập nhật nguồn (nếu có) để giao diện refresh
            if (typeof Lampa.Source.update === 'function') {
                Lampa.Source.update();
            }
        } else {
            console.warn('[KKPhim] Lampa.Source.list không tồn tại, không thể thêm nguồn.');
        }

        // 3. Gửi sự kiện (tuỳ chọn)
        Lampa.Listener.send('source_added', { source: SOURCE_ID, name: SOURCE_NAME });
        console.log(`[${SOURCE_NAME}] Đã đăng ký thành công`);
    }

    function init() {
        if (!window.Lampa || !Lampa.Api) {
            Lampa.Listener.follow('app', function(e) {
                if (e.type === 'ready') {
                    registerSource();
                }
            });
        } else {
            registerSource();
        }
    }

    init();
})();