(function () {
    'use strict';

    function TorrentioPlugin(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        var html    = $('<div></div>');
        var info    = object.movie; // Lấy thông tin phim từ card Lampa

        this.create = function () {
            var _this = this;
            this.start();
            return this.render();
        };

        this.start = function () {
            var type = info.number_of_seasons ? 'series' : 'movie';
            var id = info.imdb_id;
            
            // Nếu không có IMDB ID, thử lấy qua API khác hoặc báo lỗi
            if(!id) {
                Lampa.Noty.show('Không tìm thấy mã IMDB cho phim này.');
                return;
            }

            // Gọi API Torrentio (mặc định lấy tất cả providers)
            var url = 'https://torrentio.strem.fun/providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrent9,horriblesubs,nyaasi,megatorrents,limetorrents,zooqle/stream/' + type + '/' + id + '.json';

            network.silent(url, function (json) {
                if (json.streams && json.streams.length > 0) {
                    _this.displayStreams(json.streams);
                } else {
                    Lampa.Noty.show('Không tìm thấy luồng torrent nào từ Torrentio.');
                }
            }, function () {
                Lampa.Noty.show('Lỗi kết nối tới API Torrentio.');
            });
        };

        this.displayStreams = function (streams) {
            var _this = this;
            streams.forEach(function (stream) {
                var item = Lampa.Template.get('button_category', {title: stream.title});
                item.on('hover:enter', function () {
                    // Xử lý khi chọn một stream (thường là mở link magnet/video)
                    Lampa.Player.play({
                        url: stream.url || stream.infoHash, // Torrentio trả về URL hoặc Hash
                        title: info.title
                    });
                });
                html.append(item);
            });
            Lampa.Controller.enable('content');
        };

        this.render = function () {
            return html;
        };
    }

    // Đăng ký Plugin vào hệ thống Lampa
    function startPlugin() {
        window.torrentio_plugin = true;

        // Thêm nút vào card phim (Full info)
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var button = $('<div class="full-start__button selector"><span>Torrentio</span></div>');
                button.on('hover:enter', function () {
                    Lampa.Component.add('torrentio_view', TorrentioPlugin, {movie: e.data.movie});
                    Lampa.Controller.enable('torrentio_view');
                });
                e.object.find('.full-start__buttons').append(button);
            }
        });
    }

    if (window.app_ready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
