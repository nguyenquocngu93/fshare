(function () {
    'use strict';

    // 1. Đăng ký thông tin Plugin vào hệ thống Lampa
    Lampa.Manifest.plugins = Object.assign(Lampa.Manifest.plugins || {}, {
        'torrentio_custom': {
            type: 'video',
            version: '1.0.0',
            name: 'Torrentio Parser (Custom)',
            description: 'Lấy nguồn torrent tiếng Anh và chuyển qua TorrServer',
            component: 'torrentio'
        }
    });

    // 2. Lắng nghe sự kiện khi render trang chi tiết phim (Component: Full)
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'build') {
            
            // Render nút bấm (Button Registration)
            var btn_html = '<div class="full-button selector" data-action="torrentio_custom">' +
                           '<div class="full-button__icon"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" /></svg></div>' +
                           '<div class="full-button__text">Torrentio EN</div>' +
                           '</div>';

            var button = $(btn_html);

            // Gắn sự kiện khi click/enter vào nút
            button.on('hover:enter', function () {
                var card = e.object;
                var imdb_id = card.imdb_id;

                if (!imdb_id) {
                    Lampa.Noty.show('Không tìm thấy IMDB ID để lấy link Torrentio.');
                    return;
                }

                // Logic phân biệt Movie và TV Series
                var type = card.name ? 'movie' : 'series';
                var api_url = '';

                if (type === 'movie') {
                    api_url = 'https://torrentio.strem.fun/stream/movie/' + imdb_id + '.json';
                } else {
                    // Mặc định gọi thử Season 1 - Tập 1. (Có thể mở rộng thêm logic chọn tập sau)
                    api_url = 'https://torrentio.strem.fun/stream/series/' + imdb_id + ':1:1.json';
                }

                Lampa.Modal.show({ title: 'Torrentio', html: '<div class="broadcast__text">Đang tìm kiếm nguồn...</div>' });

                // 3. Gọi API lấy dữ liệu từ mạng lưới Torrent
                var network = new Lampa.Reguest();
                network.request(api_url, function (data) {
                    Lampa.Modal.close();

                    if (data && data.streams && data.streams.length > 0) {
                        var items = [];

                        data.streams.forEach(function (stream) {
                            // Tạo Magnet link từ infoHash để TorrServer có thể đọc được
                            var magnet = stream.infoHash ? 'magnet:?xt=urn:btih:' + stream.infoHash : stream.url;
                            var title_parts = stream.title ? stream.title.split('\n') : ['Unknown'];

                            items.push({
                                title: stream.name + ' - ' + title_parts[0], // Tên tracker & Chất lượng (vd: YTS - 1080p)
                                description: title_parts.slice(1).join(' | '), // Thông số dung lượng, số lượng Seeders
                                magnet: magnet,
                                hash: stream.infoHash
                            });
                        });

                        // 4. Render danh sách Menu kết quả
                        Lampa.Select.show({
                            title: 'Chọn nguồn xem',
                            items: items,
                            onSelect: function (selected) {
                                // Truyền URL magnet vào Lampa Player, hệ thống sẽ tự động bắt luồng và đẩy sang TorrServer
                                Lampa.Player.play({
                                    title: card.title || card.name,
                                    url: selected.magnet,
                                    timeline: { hash: selected.hash, time: 0 }
                                });
                            },
                            onBack: function () {
                                Lampa.Controller.toggle('full');
                            }
                        });
                    } else {
                        Lampa.Noty.show('Không có kết quả nào.');
                    }
                }, function () {
                    Lampa.Modal.close();
                    Lampa.Noty.show('Lỗi kết nối đến server Torrentio.');
                });
            });

            // Chèn nút Torrentio vào cạnh nút "Play" hiện tại
            e.html.find('.full-start__buttons').append(button);
        }
    });

})();
