(function () {
    'use strict';

    var TORRSERVER_URL = 'http://gren439e.tsarea.tv:8880';

    function TorrentioParser() {
        var network = new Lampa.Regard();

        this.search = function (data) {
            var movie = data.movie || data.object; // Tùy vào event context
            var imdb_id = movie.imdb_id || (movie.external_ids ? movie.external_ids.imdb_id : null);

            if (!imdb_id) {
                Lampa.Noty.show('Không tìm thấy IMDB ID.');
                return;
            }

            var type = movie.number_of_seasons ? 'series' : 'movie';
            var id = imdb_id;
            
            if (type === 'series') {
                var s = movie.season || 1;
                var e = movie.episode || 1;
                id += ':' + s + ':' + e;
            }

            var url = 'https://torrentio.strem.fun/stream/' + type + '/' + id + '.json';

            Lampa.Select.show({
                title: 'Torrentio Search',
                items: [{ title: 'Đang quét nguồn...', subtitle: 'Vui lòng đợi' }],
                onBack: function () { network.clear(); }
            });

            network.silent(url, function (res) {
                if (res.streams && res.streams.length > 0) {
                    var items = res.streams.map(function (stream) {
                        var desc = stream.title.split('\n');
                        return {
                            title: desc[0],
                            subtitle: desc.slice(1).join(' '),
                            infoHash: stream.infoHash,
                            fileIdx: stream.fileIdx || 0,
                            url: stream.url
                        };
                    });

                    Lampa.Select.show({
                        title: 'Kết quả từ Torrentio',
                        items: items,
                        onSelect: function (item) {
                            if (item.infoHash) {
                                var magnet = 'magnet:?xt=urn:btih:' + item.infoHash;
                                var playUrl = TORRSERVER_URL + '/stream?link=' + encodeURIComponent(magnet) + '&index=' + item.fileIdx + '&play';
                                Lampa.Player.play({ url: playUrl, title: movie.title || movie.name });
                            } else if (item.url) {
                                Lampa.Player.play({ url: item.url, title: movie.title || movie.name });
                            }
                        },
                        onBack: function () {
                            Lampa.Controller.toggle('full_start');
                        }
                    });
                } else {
                    Lampa.Noty.show('Không tìm thấy nguồn.');
                }
            });
        };
    }

    function startPlugin() {
        // Lắng nghe sự kiện "full" (khi vào trang thông tin phim)
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var container = e.container.find('.full-start__buttons');
                
                // Kiểm tra xem nút đã tồn tại chưa để tránh trùng lặp
                if (container.length > 0 && !container.find('.view--torrentio').length) {
                    var btn = $('<div class="full-start__button selector view--torrentio"><svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M10 9l5 3-5 3V9z" fill="currentColor"/><path d="M0 0h24 v24H0z" fill="none"/></svg><span>Torrentio</span></div>');
                    
                    btn.on('hover:enter', function () {
                        new TorrentioParser().search(e);
                    });

                    container.append(btn);
                    
                    // Cập nhật lại Controller để Lampa nhận diện nút mới cho việc di chuyển bằng remote
                    if (Lampa.Controller.enabled().name == 'full_start') {
                        Lampa.Controller.toggle('full_start');
                    }
                }
            }
        });
    }

    // Cơ chế khởi chạy an toàn
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }
})();
