(function () {
    'use strict';

    function Torrentio(object) {
        var network = new Lampa.RegExp();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [];
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        
        // --- TORRENTIO SOURCE CONFIGURATION ---
        var torrentio_url = 'https://torrentio.strem.fun';
        var cinemeta_url = 'https://v3-cinemeta.strem.fun';
        // ------------------------------------

        this.create = function () {
            var _this = this;
            this.start();
            return this.render();
        };

        this.start = function () {
            var _this = this;
            // Search using Cinemeta to get content metadata
            var search_query = encodeURIComponent(object.search);
            var url = cinemeta_url + '/catalog/movie/search=' + search_query + '.json';

            Lampa.Network.silent(url, function (json) {
                if (json && json.metas && json.metas.length) {
                    // For each result, get streams from Torrentio
                    json.metas.forEach(function(meta) {
                        _this.getStreams(meta);
                    });
                    _this.onReatdy();
                } else {
                    _this.empty();
                }
            }, function () {
                _this.empty();
            });
        };

        this.getStreams = function(meta) {
            var _this = this;
            var imdbId = meta.id.split(':')[0]; // Extract IMDB ID
            var streams_url = torrentio_url + '/stream/movie/' + imdbId + '.json';

            Lampa.Network.silent(streams_url, function (json) {
                if (json && json.streams && json.streams.length) {
                    _this.build(json.streams, meta);
                }
            }, function () {
                // Silent fail for individual streams
            });
        };

        this.build = function (data, meta) {
            var _this = this;
            data.forEach(function (item) {
                // Parse stream title for quality and seeders
                var title_parts = item.title.split('\n');
                var quality = title_parts[0] || '720p';
                var info = title_parts[1] || '';

                var obj = {
                    title: meta.name + ' - ' + quality,
                    quality: quality,
                    info: info,
                    url: item.url,
                    plugin: 'Torrentio by Ni'
                };

                var card = Lampa.Template.get('torrent_item', obj);
                
                card.on('hover:enter', function () {
                    // Use Lampa Player to play the stream
                    if (item.url.startsWith('magnet:')) {
                        // For magnet links, use torrent player
                        Lampa.Torrent.run(obj);
                    } else {
                        // For direct streams, use Lampa player
                        Lampa.Player.play({
                            url: item.url,
                            title: obj.title,
                            source: 'torrentio'
                        });
                    }
                });

                body.append(card);
                items.push(card);
            });
        };

        this.empty = function () {
            body.append('<div class="empty">Không tìm thấy kết quả từ Torrentio</div>');
            this.onReatdy();
        };

        this.render = function () {
            return html;
        };

        this.onReatdy = function () {
            html.append(scroll.render());
            scroll.append(body);
        };
    }

    // Đăng ký plugin vào hệ thống Lampa
    if (window.lampa_plugins) {
        Lampa.Component.add('torrentio', Torrentio);
        Lampa.Search.addSource(Torrentio);
        // Register as a playback source in Lampa player
        if (Lampa.Player && Lampa.Player.registerSource) {
            Lampa.Player.registerSource('torrentio', Torrentio);
        }
    }
})();