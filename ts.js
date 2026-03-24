(function () {
    'use strict';

    function TorrentioParser() {
        var torrserver_url = 'http://gren439e.tsarea.tv:8880';

        // Hàm chuyển đổi Size sang Bytes để sắp xếp
        function parseSize(sizeStr) {
            if (!sizeStr) return 0;
            let match = sizeStr.match(/([\d.]+)\s*([GB|MB]+)/i);
            if (!match) return 0;
            let num = parseFloat(match[1]);
            let unit = match[2].toUpperCase();
            return unit === 'GB' ? num * 1024 * 1024 * 1024 : num * 1024 * 1024;
        }

        // Đăng ký Listener để chèn nút khi mở trang thông tin phim
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                let movie = e.data.movie;
                let imdb_id = movie.imdb_id;

                // Tạo nút bấm với icon và style giống hệ thống
                let button = $(`<div class="full-start__button selector">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="36px" height="36px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.31 2.69 6 6 6s6-2.69 6-6V6h-1.5z"/></svg>
                    <span>Torrentio</span>
                </div>`);

                button.on('hover:enter', function () {
                    if (!imdb_id) {
                        Lampa.Noty.show('Phim này không có IMDB ID');
                        return;
                    }
                    search(movie, e.data);
                });

                // Chèn nút vào danh sách nút chính của trang (Source/Online/Trailer)
                $('.full-start__buttons', e.container).append(button);
            }
        });

        function search(movie, data) {
            let type = movie.number_of_seasons ? 'series' : 'movie';
            let s = Lampa.Storage.get('online_last_season_' + movie.id, 1);
            let ep = Lampa.Storage.get('online_last_episode_' + movie.id, 1);
            let query = type === 'series' ? `${movie.imdb_id}:${s}:${ep}` : movie.imdb_id;

            Lampa.Select.show({
                title: 'Torrentio Search',
                items: [{ title: 'Đang tìm kiếm...' }],
                onBack: () => Lampa.Controller.toggle('full_start')
            });

            fetch(`https://torrentio.strem.io/streams/${type}/${query}.json`)
                .then(res => res.json())
                .then(json => {
                    if (json.streams && json.streams.length > 0) {
                        let results = json.streams.map(s => {
                            let lines = s.title.split('\n');
                            let info = lines[1] || "";
                            let sizeMatch = info.match(/💾\s*([\d.]+\s*[GB|MB]+)/);
                            let sizeText = sizeMatch ? sizeMatch[1] : '0 MB';
                            let seeders = info.match(/👤\s*(\d+)/) ? info.match(/👤\s*(\d+)/)[1] : '0';

                            return {
                                title: lines[0],
                                subtitle: `[${sizeText}] - Seeders: ${seeders}`,
                                magnet: s.infoHash,
                                sizeBytes: parseSize(sizeText)
                            };
                        });

                        // Sắp xếp theo Size từ lớn đến nhỏ
                        results.sort((a, b) => b.sizeBytes - a.sizeBytes);

                        Lampa.Select.show({
                            title: 'Kết quả: ' + (type === 'series' ? `S${s} E${ep}` : movie.title),
                            items: results,
                            onSelect: (item) => {
                                let magnet = `magnet:?xt=urn:btih:${item.magnet}`;
                                let play_url = `${torrserver_url}/stream/magnet?link=${encodeURIComponent(magnet)}&play`;
                                
                                Lampa.Player.play({
                                    url: play_url,
                                    title: movie.title,
                                    subtitle: item.title
                                });
                            },
                            onBack: () => Lampa.Controller.toggle('full_start')
                        });
                    } else {
                        Lampa.Noty.show('Không tìm thấy link từ Torrentio');
                    }
                })
                .catch(() => Lampa.Noty.show('Lỗi kết nối API'));
        }
    }

    // Khởi tạo plugin
    if (window.appready) TorrentioParser();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') TorrentioParser(); });
})();
