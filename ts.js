(function () {
    'use strict';

    function TorrentioFinalMod() {
        var torrserver_url = 'http://gren439e.tsarea.tv:8880';

        function getBytes(sizeStr) {
            if (!sizeStr) return 0;
            let m = sizeStr.match(/([\d.]+)\s*([GB|MB]+)/i);
            if (!m) return 0;
            let n = parseFloat(m[1]);
            return m[2].toUpperCase() === 'GB' ? n * 1073741824 : n * 1048576;
        }

        // --- HÀM CHÈN NÚT THÔNG MINH ---
        function injectButton(container, data) {
            if (container.find('.torrentio-btn').length > 0) return; // Tránh chèn trùng

            var button = $(`<div class="full-start__button selector torrentio-btn">
                <svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" fill="white"/></svg>
                <span>Torrentio</span>
            </div>`);

            button.on('hover:enter', function () {
                startSearch(data.movie);
            });

            // Tìm mọi vị trí có thể chèn (Online, Trailers, hoặc Buttons chung)
            var targets = [
                container.find('.full-start__buttons'),
                container.find('.full-info__actions'),
                container.find('.view--online'),
                container.find('.view--torrent')
            ];

            for (var i = 0; i < targets.length; i++) {
                if (targets[i].length) {
                    targets[i].append(button);
                    // Ép Lampa cập nhật lại trình điều khiển để nút có thể chọn được
                    Lampa.Controller.add('full_start', {
                        toggle: function () {
                            Lampa.Controller.collectionSet(container);
                            Lampa.Controller.render();
                        }
                    });
                    break;
                }
            }
        }

        // --- THEO DÕI GIAO DIỆN ---
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Thử chèn ngay lập tức
                injectButton(e.container, e.data);
                
                // Đề phòng giao diện render chậm, dùng Observer để chờ
                var observer = new MutationObserver(function() {
                    injectButton(e.container, e.data);
                });
                observer.observe(e.container[0], { childList: true, subtree: true });
            }
        });

        function startSearch(movie) {
            var type = movie.number_of_seasons ? 'series' : 'movie';
            var s = Lampa.Storage.get('online_last_season_' + movie.id, 1);
            var ep = Lampa.Storage.get('online_last_episode_' + movie.id, 1);
            var query = type === 'series' ? `${movie.imdb_id}:${s}:${ep}` : movie.imdb_id;

            if (!movie.imdb_id) {
                Lampa.Noty.show('Phim này không có IMDB ID.');
                return;
            }

            Lampa.Select.show({
                title: 'Tìm kiếm Torrentio...',
                items: [{ title: 'Đang tải dữ liệu...' }],
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
                                subtitle: `[${sizeTxt}] - Seeds: ${seeders}`,
                                magnet: s.infoHash,
                                sizeBytes: getBytes(sizeTxt)
                            };
                        });

                        list.sort((a, b) => b.sizeBytes - a.sizeBytes);

                        Lampa.Select.show({
                            title: 'Kết quả: ' + (type === 'series' ? `S${s}E${ep}` : movie.title),
                            items: list,
                            onSelect: (item) => {
                                var link = `magnet:?xt=urn:btih:${item.magnet}`;
                                var play_url = `${torrserver_url}/stream/magnet?link=${encodeURIComponent(link)}&play`;
                                Lampa.Player.play({ url: play_url, title: movie.title, subtitle: item.title });
                            },
                            onBack: () => Lampa.Controller.toggle('full_start')
                        });
                    } else {
                        Lampa.Noty.show('Không tìm thấy link.');
                    }
                })
                .catch(() => Lampa.Noty.show('Lỗi API Torrentio'));
        }
    }

    if (window.appready) TorrentioFinalMod();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') TorrentioFinalMod(); });
})();
