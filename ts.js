(function () {
    'use strict';

    function TorrentioMod() {
        var torrserver_url = 'http://gren439e.tsarea.tv:8880';

        // Hàm hỗ trợ tính toán Size
        function getBytes(sizeStr) {
            if (!sizeStr) return 0;
            let m = sizeStr.match(/([\d.]+)\s*([GB|MB]+)/i);
            if (!m) return 0;
            let n = parseFloat(m[1]);
            return m[2].toUpperCase() === 'GB' ? n * 1073741824 : n * 1048576;
        }

        // Lắng nghe sự kiện render trang chi tiết phim
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var movie = e.data.movie;
                var container = e.container;
                
                // Tạo nút bấm theo chuẩn Lampa
                var button = $(`<div class="full-start__button selector">
                    <svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" fill="white"/></svg>
                    <span>Torrentio</span>
                </div>`);

                // Đăng ký sự kiện bấm
                button.on('hover:enter', function () {
                    startSearch(movie);
                });

                // Chèn nút vào đúng vị trí (thử cả 2 class phổ biến của Lampa)
                var target = $('.full-start__buttons', container);
                if (target.length) target.append(button);
                else $('.full-info__actions', container).append(button);

                // Quan trọng: Refresh lại trình điều khiển để nhận nút mới
                if (Lampa.Controller.enabled().name == 'full_start') {
                    Lampa.Controller.toggle('full_start');
                }
            }
        });

        function startSearch(movie) {
            var type = movie.number_of_seasons ? 'series' : 'movie';
            var s = Lampa.Storage.get('online_last_season_' + movie.id, 1);
            var ep = Lampa.Storage.get('online_last_episode_' + movie.id, 1);
            var query = type === 'series' ? `${movie.imdb_id}:${s}:${ep}` : movie.imdb_id;

            if (!movie.imdb_id) {
                Lampa.Noty.show('Phim này thiếu mã IMDB.');
                return;
            }

            Lampa.Select.show({
                title: 'Đang tìm trên Torrentio...',
                items: [{ title: 'Vui lòng đợi...' }],
                onBack: () => Lampa.Controller.toggle('full_start')
            });

            fetch(`https://torrentio.strem.io/streams/${type}/${query}.json`)
                .then(r => r.json())
                .then(json => {
                    if (json.streams && json.streams.length > 0) {
                        let list = json.streams.map(s => {
                            let lines = s.title.split('\n');
                            let info = lines[1] || "";
                            let sizeTxt = (info.match(/💾\s*([\d.]+\s*[GB|MB]+)/) || [0, '0 MB'])[1];
                            let seeders = (info.match(/👤\s*(\d+)/) || [0, '0'])[1];

                            return {
                                title: lines[0],
                                subtitle: `[${sizeTxt}] - Seed: ${seeders}`,
                                magnet: s.infoHash,
                                sizeBytes: getBytes(sizeTxt)
                            };
                        });

                        // Sắp xếp size giảm dần
                        list.sort((a, b) => b.sizeBytes - a.sizeBytes);

                        Lampa.Select.show({
                            title: 'Torrentio: ' + (type === 'series' ? `S${s} E${ep}` : 'Movie'),
                            items: list,
                            onSelect: (item) => {
                                var link = `magnet:?xt=urn:btih:${item.magnet}`;
                                var play_url = `${torrserver_url}/stream/magnet?link=${encodeURIComponent(link)}&play`;
                                
                                Lampa.Player.play({
                                    url: play_url,
                                    title: movie.title,
                                    subtitle: item.title
                                });
                            },
                            onBack: () => Lampa.Controller.toggle('full_start')
                        });
                    } else {
                        Lampa.Noty.show('Không tìm thấy kết quả.');
                    }
                })
                .catch(() => Lampa.Noty.show('Lỗi kết nối API Torrentio'));
        }
    }

    // Khởi động plugin
    if (window.appready) TorrentioMod();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') TorrentioMod(); });
})();
