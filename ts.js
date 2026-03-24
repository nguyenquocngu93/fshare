(function () {
    'use strict';

    function TorrentioFullPlugin() {
        var torrserver_url = 'http://gren439e.tsarea.tv:8880';

        // Hàm đổi size (giữ nguyên logic cũ)
        function parseSizeToBytes(sizeStr) {
            if (!sizeStr) return 0;
            let match = sizeStr.match(/([\d.]+)\s*([GB|MB]+)/i);
            if (!match) return 0;
            let num = parseFloat(match[1]);
            let unit = match[2].toUpperCase();
            return unit === 'GB' ? num * 1024 * 1024 * 1024 : num * 1024 * 1024;
        }

        // --- ĐĂNG KÝ NÚT VÀO MENU SOURCE ---
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Tạo một item mới cho menu
                let button = $(`<div class="full-start__button selector">
                    <svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" fill="#fff"/></svg>
                    <span>Torrentio</span>
                </div>`);

                // Khi bấm vào nút này
                button.on('hover:enter', function () {
                    startSearch(e.data);
                });

                // Chèn nút vào vùng hiển thị (append vào danh sách buttons)
                $('.full-start__buttons', e.container).append(button);
            }
        });

        // --- HÀM TÌM KIẾM CHÍNH ---
        function startSearch(data) {
            let movie = data.movie;
            let type = movie.number_of_seasons ? 'series' : 'movie';
            let imdb_id = movie.imdb_id;

            if (!imdb_id) {
                Lampa.Noty.show('Không có ID IMDB');
                return;
            }

            // Lấy tập/phần (nếu có)
            let s = Lampa.Storage.get('online_last_season_' + movie.id, 1);
            let ep = Lampa.Storage.get('online_last_episode_' + movie.id, 1);
            let query_id = type === 'series' ? `${imdb_id}:${s}:${ep}` : imdb_id;

            Lampa.Select.show({
                title: 'Torrentio',
                items: [{ title: 'Đang tìm kiếm...' }]
            });

            fetch(`https://torrentio.strem.io/streams/${type}/${query_id}.json`)
                .then(res => res.json())
                .then(json => {
                    if (json.streams && json.streams.length > 0) {
                        let items = json.streams.map(stream => {
                            let lines = stream.title.split('\n');
                            let info = lines[1] || "";
                            let seeders = info.match(/👤\s*(\d+)/) ? info.match(/👤\s*(\d+)/)[1] : '0';
                            let sizeMatch = info.match(/💾\s*([\d.]+\s*[GB|MB]+)/);
                            let sizeText = sizeMatch ? sizeMatch[1] : '0 MB';

                            return {
                                title: lines[0],
                                subtitle: `[${sizeText}] - Seeders: ${seeders}`,
                                magnet: stream.infoHash,
                                sizeBytes: parseSizeToBytes(sizeText)
                            };
                        });

                        // Sắp xếp size lớn nhất
                        items.sort((a, b) => b.sizeBytes - a.sizeBytes);

                        Lampa.Select.show({
                            title: 'Kết quả Torrentio',
                            items: items,
                            onSelect: (item) => {
                                let link = `magnet:?xt=urn:btih:${item.magnet}`;
                                let play_url = `${torrserver_url}/stream/magnet?link=${encodeURIComponent(link)}&play`;
                                
                                Lampa.Player.play({
                                    url: play_url,
                                    title: movie.title,
                                    subtitle: item.title
                                });
                            },
                            onBack: () => Lampa.Controller.toggle('full_start')
                        });
                    } else {
                        Lampa.Noty.show('Không tìm thấy link');
                    }
                })
                .catch(() => Lampa.Noty.show('Lỗi API'));
        }
    }

    if (window.appready) TorrentioFullPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') TorrentioFullPlugin(); });
})();
