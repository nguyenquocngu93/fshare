(function () {
    'use strict';

    function TorrentioPlugin() {
        var torrserver_url = 'http://gren439e.tsarea.tv:8880';

        // 1. Khởi tạo Component riêng cho Torrentio
        Lampa.Component.add('torrentio_component', function (object, str) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({mask:true, over:true});
            var items = [];
            var html = $('<div></div>');
            
            this.create = function () {
                var _this = this;
                // Khi mở component này, nó sẽ tự đi tìm kiếm
                this.search();
                return scroll.render();
            };

            this.search = function () {
                var movie = object.movie;
                var type = movie.number_of_seasons ? 'series' : 'movie';
                var s = Lampa.Storage.get('online_last_season_' + movie.id, 1);
                var ep = Lampa.Storage.get('online_last_episode_' + movie.id, 1);
                var query = type === 'series' ? `${movie.imdb_id}:${s}:${ep}` : movie.imdb_id;

                var url = `https://torrentio.strem.io/streams/${type}/${query}.json`;

                network.silent(url, function (json) {
                    if (json.streams && json.streams.length > 0) {
                        _this.build(json.streams);
                    } else {
                        Lampa.Noty.show('Không tìm thấy link từ Torrentio');
                    }
                }, function () {
                    Lampa.Noty.show('Lỗi kết nối API Torrentio');
                });
            };

            this.build = function (data) {
                var _this = this;
                // Sắp xếp size trước khi hiển thị
                data.sort(function(a, b) {
                    return b.title.length - a.title.length; // Sort tạm theo độ dài title nếu không parse được size
                });

                data.forEach(function (stream) {
                    var item = Lampa.Template.get('button', {title: stream.title.split('\n')[0]});
                    item.on('hover:enter', function () {
                        var magnet = `magnet:?xt=urn:btih:${stream.infoHash}`;
                        var play_url = `${torrserver_url}/stream/magnet?link=${encodeURIComponent(magnet)}&play`;
                        Lampa.Player.play({
                            url: play_url,
                            title: object.movie.title,
                            subtitle: stream.title.split('\n')[0]
                        });
                    });
                    html.append(item);
                });
                scroll.append(html);
                Lampa.Controller.enable('content');
            };

            this.render = function () { return scroll.render(); };
            this.pause = function () {};
            this.stop = function () {};
        });

        // 2. CHÈN NÚT VÀO MENU "TRỰC TUYẾN" (ONLINE) CỦA LAMPA
        // Đây là cách chắc chắn nhất để hiện nút nếu chèn vào trang chính bị lỗi
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var movie = e.data.movie;
                
                // Tạo nút bấm
                var btn = $(`<div class="full-start__button selector torrentio-style">
                    <svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" fill="white"/></svg>
                    <span>Torrentio v2</span>
                </div>`);

                btn.on('hover:enter', function () {
                    // Mở Component Torrentio đã tạo ở trên
                    Lampa.Component.item({
                        type: 'torrentio_component',
                        title: 'Torrentio',
                        movie: movie,
                        id: movie.id
                    });
                });

                // Cố gắng chèn vào cả 2 vị trí để đảm bảo nó xuất hiện
                var place = e.container.find('.full-start__buttons');
                if (place.length) place.append(btn);
                
                // Cập nhật Controller
                Lampa.Controller.add('full_start', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(e.container);
                        Lampa.Controller.render();
                    }
                });
            }
        });
    }

    if (window.appready) TorrentioPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') TorrentioPlugin(); });
})();
