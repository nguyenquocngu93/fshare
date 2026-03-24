(function () {
    'use strict';

    function TorrentioJackettStyle() {
        var server = 'http://gren439e.tsarea.tv:8880';

        // Tạo Component để hiển thị kết quả giống Jackett
        Lampa.Component.add('torrentio_mod', function (object, str) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({mask: true, over: true});
            var files = new Lampa.Files(object);
            var html = $('<div></div>');
            
            this.create = function () {
                var _this = this;
                this.search();
                return scroll.render();
            };

            this.search = function () {
                var _this = this;
                var movie = object.movie;
                var type = movie.number_of_seasons ? 'series' : 'movie';
                var s = Lampa.Storage.get('online_last_season_' + movie.id, 1);
                var ep = Lampa.Storage.get('online_last_episode_' + movie.id, 1);
                var id = type === 'series' ? `${movie.imdb_id}:${s}:${ep}` : movie.imdb_id;

                network.silent(`https://torrentio.strem.io/streams/${type}/${id}.json`, function (json) {
                    if (json.streams && json.streams.length > 0) {
                        _this.build(json.streams);
                    } else {
                        Lampa.Noty.show('Không tìm thấy link');
                    }
                });
            };

            this.build = function (streams) {
                var _this = this;
                // Sắp xếp theo dung lượng (Logic từ Jackett)
                streams.sort(function(a, b) {
                    var sizeA = a.title.match(/💾\s*([\d.]+\s*[GB|MB]+)/);
                    var sizeB = b.title.match(/💾\s*([\d.]+\s*[GB|MB]+)/);
                    return (sizeB ? parseFloat(sizeB[1]) : 0) - (sizeA ? parseFloat(sizeA[1]) : 0);
                });

                streams.forEach(function (stream) {
                    var lines = stream.title.split('\n');
                    var item = Lampa.Template.get('button', {title: lines[0], subtitle: lines[1]});
                    
                    item.on('hover:enter', function () {
                        var magnet = 'magnet:?xt=urn:btih:' + stream.infoHash;
                        var url = server + '/stream/magnet?link=' + encodeURIComponent(magnet) + '&play';
                        Lampa.Player.play({
                            url: url,
                            title: object.movie.title,
                            subtitle: lines[0]
                        });
                    });
                    html.append(item);
                });
                scroll.append(html);
                _this.checkState();
            };

            this.checkState = function(){
                Lampa.Controller.enable('content');
            };

            this.render = function () { return scroll.render(); };
            this.pause = function () {};
            this.stop = function () {};
        });

        // CHÈN NÚT VÀO TRANG FULL (GIỐNG JACKETT)
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $(`<div class="full-start__button selector">
                    <svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" fill="white"/></svg>
                    <span>Torrentio</span>
                </div>`);

                btn.on('hover:enter', function () {
                    Lampa.Component.item({
                        type: 'torrentio_mod',
                        title: 'Torrentio',
                        movie: e.data.movie,
                        id: e.data.movie.id
                    });
                });

                // Jackett dùng cách chèn này để đảm bảo nút hiện lên
                var target = e.container.find('.full-start__buttons');
                if (target.length) {
                    target.append(btn);
                    // Ép Controller cập nhật lại để nhận nút
                    Lampa.Controller.add('full_start', {
                        toggle: function () {
                            Lampa.Controller.collectionSet(e.container);
                            Lampa.Controller.render();
                        }
                    });
                }
            }
        });
    }

    if (window.appready) TorrentioJackettStyle();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') TorrentioJackettStyle(); });
})();
