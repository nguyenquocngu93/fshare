(function () {
    'use strict';

    // ==========================================
    // PLUGIN KKPHIM CHO LAMPA
    // API: https://phimapi.com
    // ==========================================

    var BASE_URL = 'https://phimapi.com';
    var IMG_URL  = 'https://phimimg.com/';

    // --- Helper: gọi API ---
    function fetchAPI(url, callback) {
        Lampa.Network.silent(url, function (data) {
            callback(null, data);
        }, function (err) {
            callback(err);
        });
    }

    // --- Chuyển đổi dữ liệu phim sang định dạng Lampa ---
    function convertMovie(item) {
        return {
            id:           item.slug,
            title:        item.name,
            original_title: item.origin_name || item.name,
            poster:       IMG_URL + item.poster_url,
            poster_path:  IMG_URL + item.poster_url,
            thumb_url:    IMG_URL + item.thumb_url,
            year:         item.year,
            type:         item.type === 'series' ? 'tv' : 'movie',
            kkphim_slug:  item.slug,  // lưu slug để lấy chi tiết sau
        };
    }

    // ==========================================
    // SOURCE: Danh sách phim mới cập nhật
    // ==========================================
    Lampa.Source.add('kkphim', {
        title: 'KKPhim',

        // Lampa gọi hàm này để lấy danh sách phim
        list: function (params, oncomplete, onerror) {
            var page = params.page || 1;
            var url  = BASE_URL + '/danh-sach/phim-moi-cap-nhat?page=' + page;

            fetchAPI(url, function (err, data) {
                if (err) return onerror(err);

                var items = (data.items || []).map(convertMovie);

                oncomplete({
                    results:       items,
                    total_pages:   data.pagination ? data.pagination.totalPages : 1,
                    total_results: data.pagination ? data.pagination.totalItems : items.length,
                });
            });
        },

        // Lampa gọi hàm này khi tìm kiếm
        search: function (params, oncomplete, onerror) {
            var keyword = params.query || '';
            var url = BASE_URL + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword);

            fetchAPI(url, function (err, data) {
                if (err) return onerror(err);

                var items = [];
                if (data.data && data.data.items) {
                    items = data.data.items.map(convertMovie);
                }

                oncomplete({ results: items });
            });
        },

        // Lampa gọi hàm này để lấy chi tiết + link xem phim
        full: function (params, oncomplete, onerror) {
            var slug = params.kkphim_slug || params.id;
            var url  = BASE_URL + '/phim/' + slug;

            fetchAPI(url, function (err, data) {
                if (err) return onerror(err);

                var movie   = data.movie || {};
                var episodes = data.episodes || [];

                // Lấy link xem (m3u8) từ episodes
                var videos = [];
                episodes.forEach(function (server) {
                    (server.server_data || []).forEach(function (ep) {
                        videos.push({
                            title:  ep.name || 'Tập ' + ep.slug,
                            url:    ep.link_m3u8 || ep.link_embed,
                        });
                    });
                });

                oncomplete({
                    movie:  convertMovie(movie),
                    videos: videos,
                });
            });
        },
    });

    // ==========================================
    // ĐĂNG KÝ PLUGIN VÀO LAMPA
    // ==========================================
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') {
            // Thêm KKPhim vào danh sách nguồn
            Lampa.Arrays.push(Lampa.Storage.get('sources', []), 'kkphim');

            console.log('[KKPhim Plugin] Đã khởi động!');
        }
    });

})();
