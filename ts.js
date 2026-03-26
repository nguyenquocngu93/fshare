(function() {
    'use strict';

    const API_BASE_URL = 'https://phimapi.com/api';
    const SOURCE_NAME = 'KKPhim';
    const SOURCE_ID = 'kkphim';

    // ========== PARSER ĐỊNH NGHĨA CÁC PHƯƠNG THỨC CẦN THIẾT ==========
    const KkphimParser = {
        name: SOURCE_NAME,
        id: SOURCE_ID,

        // Lấy danh sách phim (dùng cho các danh mục)
        list: function(params, onComplete, onError) {
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
                .then(res => res.json())
                .then(data => {
                    if (data && data.items) {
                        const items = data.items.map(item => ({
                            id: item._id,
                            title: item.name,
                            poster_path: item.poster_url || item.thumb_url,
                            overview: item.content || '',
                            year: item.year,
                            source: SOURCE_ID,
                            raw: item
                        }));
                        const result = {
                            results: items,
                            page: data.pagination?.currentPage || page,
                            total_pages: data.pagination?.totalPages || 1,
                            total_results: data.pagination?.totalItems || items.length
                        };
                        onComplete(result);
                    } else {
                        onError('Không có dữ liệu từ API');
                    }
                })
                .catch(err => {
                    console.error('KKPhim list error:', err);
                    onError(err.message);
                });
        },

        // Lấy chi tiết phim
        full: function(params, onSuccess, onError) {
            let id = params.id;
            if (!id) {
                onError('Thiếu ID phim');
                return;
            }
            fetch(`${API_BASE_URL}/films/${id}`)
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
                            source: SOURCE_ID,
                            raw: data
                        };
                        // Xử lý tập phim nếu có
                        if (data.episodes && Array.isArray(data.episodes)) {
                            const seasons = [];
                            const epMap = new Map();
                            data.episodes.forEach(ep => {
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
                        onSuccess(detail);
                    } else {
                        onError('Không tìm thấy chi tiết phim');
                    }
                })
                .catch(err => {
                    console.error('KKPhim full error:', err);
                    onError(err.message);
                });
        },

        // Tìm kiếm (tuỳ chọn)
        search: function(params, onComplete, onError) {
            let keyword = params.keyword || '';
            let page = params.page || 1;
            let url = `${API_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}&page=${page}`;
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data && data.items) {
                        const items = data.items.map(item => ({
                            id: item._id,
                            title: item.name,
                            poster_path: item.poster_url || item.thumb_url,
                            overview: item.content || '',
                            year: item.year,
                            source: SOURCE_ID,
                            raw: item
                        }));
                        const result = {
                            results: items,
                            page: data.pagination?.currentPage || page,
                            total_pages: data.pagination?.totalPages || 1,
                            total_results: data.pagination?.totalItems || items.length
                        };
                        onComplete(result);
                    } else {
                        onError('Không tìm thấy kết quả');
                    }
                })
                .catch(err => {
                    console.error('KKPhim search error:', err);
                    onError(err.message);
                });
        }
    };

    // ========== ĐĂNG KÝ VÀO LAMPA ==========
    function registerSource() {
        // 1. Đăng ký parser
        if (!Lampa.Parser) Lampa.Parser = { parsers: {} };
        if (Lampa.Parser.parsers[SOURCE_ID]) {
            console.log(`[${SOURCE_NAME}] Parser đã tồn tại, bỏ qua`);
            return;
        }
        Lampa.Parser.parsers[SOURCE_ID] = KkphimParser;
        console.log(`[${SOURCE_NAME}] Parser đã đăng ký thành công`);

        // 2. Thêm nguồn vào danh sách nguồn (dropdown chọn nguồn)
        if (!Lampa.Source) Lampa.Source = { list: [] };
        const exists = Lampa.Source.list.some(s => s.id === SOURCE_ID);
        if (!exists) {
            Lampa.Source.list.push({
                id: SOURCE_ID,
                name: SOURCE_NAME,
                type: 'torrent',      // hoặc 'online' tùy loại nội dung
                parser: SOURCE_ID     // liên kết với parser vừa đăng ký
            });
            console.log(`[${SOURCE_NAME}] Đã thêm vào Lampa.Source.list`);

            // 3. Làm mới danh sách nguồn nếu có hàm update
            if (typeof Lampa.Source.update === 'function') {
                Lampa.Source.update();
            }
        } else {
            console.log(`[${SOURCE_NAME}] Đã tồn tại trong Lampa.Source.list`);
        }
    }

    // ========== KHỞI CHẠY ==========
    function init() {
        if (!window.Lampa) {
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