(function () {
    'use strict';

    function TorrentioPlugin(object) {
        var network = new Lampa.RegExp.network();
        var scroll  = new Lampa.scroll({mask: true, over: true});
        var items   = [];
        
        // --- 1. Bộ lọc Parser: Tách thông tin từ Title của Torrentio ---
        function parseTorrentioTitle(title) {
            // Torrentio thường trả về: "Tên phim\n👤 1234 💾 2.5 GB ⚙️ Source"
            var parts = title.split('\n');
            var info = parts[1] || "";
            
            var seeders = info.match(/👤\s*(\d+)/);
            var size = info.match(/💾\s*([0-9.]+\s*[A-Z]+)/);
            
            return {
                name: parts[0],
                seeders: seeders ? parseInt(seeders[1]) : 0,
                size: size ? size[1] : 'N/A',
                quality: Lampa.Utils.getQuality(parts[0]) // Tự động lấy 4K, 1080p từ tên
            };
        }

        // --- 2. Hàm xử lý tìm kiếm chính ---
        this.search = function (params) {
            var card = params.card;
            var imdb_id = card.imdb_id;
            var type = card.number_of_seasons ? 'series' : 'movie';
            
            // Xử lý tập phim nếu là Series
            var query_path = imdb_id;
            if (type === 'series') {
                // Lấy tập và mùa từ Lampa (mặc định S1E1 nếu chưa chọn)
                var s = params.season || 1;
                var e = params.episode || 1;
                query_path += ':' + s + ':' + e;
            }

            var url = 'https://torrentio.strem.fun/stream/' + type + '/' + query_path + '.json';

            // Gọi API Torrentio
            network.silent(url, function (json) {
                if (json.streams && json.streams.length > 0) {
                    var results = json.streams.map(function (stream) {
                        var parsed = parseTorrentioTitle(stream.title);
                        
                        return {
                            title: parsed.name,
                            description: 'Seeds: ' + parsed.seeders + ' | Size: ' + parsed.size,
                            quality: parsed.quality,
                            url: stream.url, // Link magnet/stream
                            magnet: stream.infoHash ? 'magnet:?xt=urn:btih:' + stream.infoHash : stream.url
                        };
                    });
                    
                    // Gửi kết quả về giao diện Lampa
                    object.build(results);
                } else {
                    object.empty(); // Không tìm thấy kết quả
                }
            }, function () {
                object.error(); // Lỗi kết nối
            });
        };
    }

    // --- 3. Đăng ký Component vào hệ thống Lampa ---
    Lampa.Component.add('torrentio_plugin', TorrentioPlugin);

    // --- 4. Tích hợp nút bấm vào trang Chi tiết phim ---
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            // Tạo nút Torrentio
            var button = $(`
                <div class="full-start__button button--torrentio selector">
                    <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/>
                    </svg>
                    <span>Torrentio</span>
                </div>
            `);

            // Khi người dùng nhấn nút
            button.on('hover:enter', function () {
                Lampa.Component.item('torrentio_plugin', {
                    card: e.data.movie
                });
            });

            // Chèn nút vào danh sách nút của Lampa
            var container = e.object.find('.full-start__buttons');
            if (container.length) {
                container.append(button);
            }
        }
    });

    // Thêm CSS để nút trông đẹp hơn
    Lampa.Template.add('torrentio_style', `
        <style>
            .button--torrentio {
                background: rgba(123, 31, 162, 0.5) !important;
            }
            .button--torrentio.focus {
                background: #7b1fa2 !important;
            }
        </style>
    `);
    $('body').append(Lampa.Template.get('torrentio_style', {}, true));

})();
