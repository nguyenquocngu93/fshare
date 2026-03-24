(function () {
    'use strict';

    // --- 1. CẤU HÌNH HỆ THỐNG (MOD BY NI) ---
    var config = {
        jacred_url: 'https://jac.maxvol.pro',
        torrentio_url: 'https://torrentio.strem.fun',
        api_key: '1'
    };

    // --- 2. ĐĂNG KÝ NÚT VÀO TRANG CHI TIẾT PHIM ---
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            // Tạo nút "Xem Torrent (Ní)"
            var button = $('<div class="full-start__button selector">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 5V11C4 16.19 7.41 20.92 12 22C16.59 20.92 20 16.19 20 11V5L12 2Z" stroke="currentColor" stroke-width="2"/></svg>' +
                '<span>Xem Torrent (Ní)</span>' +
            }</div>');

            button.on('hover:enter', function () {
                // Lấy thông tin phim để search
                var title = e.data.movie.title || e.data.movie.name;
                var year = (e.data.movie.release_date || e.data.movie.first_air_date || '').slice(0, 4);
                
                // Mở giao diện chọn nguồn (Jacred hoặc Torrentio)
                Lampa.Select.show({
                    title: 'Chọn nguồn tìm kiếm',
                    items: [
                        {title: 'Jacred (Maxvol)', source: 'jacred'},
                        {title: 'Torrentio (Stremio)', source: 'torrentio'}
                    ],
                    onSelect: function (item) {
                        if (item.source == 'jacred') {
                            startSearch(title + ' ' + year, 'jacred');
                        } else {
                            startSearch(e.data.movie.imdb_id, 'torrentio'); // Torrentio ưu tiên IMDB ID
                        }
                    }
                });
            });

            // Chèn nút vào hàng nút bấm
            e.object.container.find('.full-start__buttons').append(button);
        }
    });

    // --- 3. LOGIC TÌM KIẾM VÀ GỌI TORRSERVER ---
    function startSearch(query, source) {
        var url = '';
        if (source == 'jacred') {
            url = config.jacred_url + '/api/v1/search?api_key=' + config.api_key + '&query=' + encodeURIComponent(query);
        } else {
            // URL Torrentio cho phim lẻ (movie) - ví dụ đơn giản
            url = config.torrentio_url + '/providers=yts,eztv,rarbg/stream/movie/' + query + '.json';
        }

        Lampa.Modal.open({
            title: 'Đang quét link...',
            html: $('<div class="broadcast__scan">Đợi xíu ní ơi, đang lùng phim...</div>'),
            onBack: function () {
                Lampa.Modal.close();
            }
        });

        Lampa.Network.silent(url, function (json) {
            Lampa.Modal.close();
            var results = source == 'jacred' ? json.result : json.streams;
            
            if (results && results.length) {
                showResults(results, source);
            } else {
                Lampa.Noty.show('Không tìm thấy link nào rồi ní!');
            }
        });
    }

    // --- 4. HIỂN THỊ KẾT QUẢ VÀ ĐẨY QUA TORRSERVER ---
    function showResults(data, source) {
        var items = data.map(function (item) {
            return {
                title: item.title || item.name,
                size: Lampa.Utils.bytesToSize(item.size || 0),
                magnet: item.magnet || (item.infoHash ? 'magnet:?xt=urn:btih:' + item.infoHash : ''),
                quality: item.quality || 'HD'
            };
        });

        Lampa.Select.show({
            title: 'Danh sách link Torrent',
            items: items,
            onSelect: function (selected) {
                // ĐẨY QUA TORRSERVER ĐỂ XEM
                if (selected.magnet) {
                    Lampa.Torrent.run({
                        title: selected.title,
                        url: selected.magnet
                    });
                } else {
                    Lampa.Noty.show('Link lỗi rồi!');
                }
            }
        });
    }

})();
