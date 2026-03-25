(function () {
    'use strict';

    function Torrentio(object) {
        var network = new Lampa.Reguest();
        var info = object.movie;
        
        this.create = function () {
            var _this = this;
            var type = info.number_of_seasons ? 'series' : 'movie';
            var id = info.imdb_id;

            if (!id) {
                Lampa.Noty.show('Không tìm thấy mã IMDB.');
                return;
            }

            Lampa.Select.show({
                title: 'Torrentio: ' + info.title,
                items: [{ title: 'Đang tìm kiếm...' }],
                onBack: function() { Lampa.Controller.toggle('full_start'); }
            });

            var url = 'https://torrentio.strem.fun/providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrent9,horriblesubs,nyaasi,megatorrents,limetorrents,zooqle/stream/' + type + '/' + id + '.json';

            network.silent(url, function (json) {
                if (json.streams && json.streams.length > 0) {
                    _this.showStreams(json.streams);
                } else {
                    Lampa.Noty.show('Không tìm thấy luồng nào.');
                }
            }, function () {
                Lampa.Noty.show('Lỗi kết nối Torrentio.');
            });
        };

        this.showStreams = function (streams) {
            var items = streams.map(function (stream) {
                return {
                    title: stream.title.split('\n')[0],
                    subtitle: stream.title.split('\n').slice(1).join(' '),
                    url: stream.url
                };
            });

            Lampa.Select.show({
                title: 'Kết quả Torrentio',
                items: items,
                onSelect: function (item) {
                    Lampa.Player.play({ url: item.url, title: info.title });
                },
                onBack: function() { Lampa.Controller.toggle('full_start'); }
            });
        };
    }

    function startPlugin() {
        // Lắng nghe sự kiện render thông tin phim giống tmdb-networks.js
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render(); // Lấy DOM của thẻ phim
                var container = render.find('.full-start__buttons'); // Tìm hàng nút chức năng

                if (container.length && !container.find('.button--torrentio').length) {
                    // Tạo nút bấm với class selector để có thể chọn bằng remote
                    var button = $('<div class="full-start__button selector button--torrentio"><span>Torrentio</span></div>');

                    button.on('hover:enter', function () {
                        var search = new Torrentio(e.data);
                        search.create();
                    });

                    // Chèn nút vào sau nút cuối cùng trong hàng
                    container.append(button);
                    
                    // Thông báo cho Lampa biết có thành phần mới cần quản lý focus
                    Lampa.Controller.add('full_start', {
                        toggle: function () {
                            Lampa.Controller.collectionSet(render);
                            Lampa.Controller.move('right');
                        }
                    });
                }
            }
        });
    }

    if (window.app_ready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
