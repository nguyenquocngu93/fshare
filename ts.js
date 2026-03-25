(function () {
    'use strict';

    function Torrentio(object) {
        var network = new Lampa.Reguest();
        
        this.create = function () {
            var _this = this;
            var info  = object.movie;
            var type  = info.number_of_seasons ? 'series' : 'movie';
            var id    = info.imdb_id;

            if (!id) {
                Lampa.Noty.show('Không tìm thấy IMDB ID.');
                return;
            }

            Lampa.Select.show({
                title: 'Torrentio: ' + info.title,
                items: [{title: 'Đang tìm kiếm luồng...'}]
            });

            // API Torrentio
            var url = 'https://torrentio.strem.fun/providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrent9,horriblesubs,nyaasi,megatorrents,limetorrents,zooqle/stream/' + type + '/' + id + '.json';

            network.silent(url, function (json) {
                if (json.streams && json.streams.length > 0) {
                    _this.showStreams(json.streams, info.title);
                } else {
                    Lampa.Noty.show('Không tìm thấy kết quả.');
                }
            }, function () {
                Lampa.Noty.show('Lỗi kết nối Torrentio.');
            });
        };

        this.showStreams = function (streams, title) {
            var items = streams.map(function (stream) {
                return {
                    title: stream.title.split('\n')[0],
                    subtitle: stream.title.split('\n').slice(1).join(' '),
                    url: stream.url
                };
            });

            Lampa.Select.show({
                title: 'Kết quả từ Torrentio',
                items: items,
                onSelect: function (item) {
                    Lampa.Player.play({
                        url: item.url,
                        title: title
                    });
                }
            });
        };
    }

    function startPlugin() {
        // Lắng nghe sự kiện khi mở thẻ phim
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Đợi 100ms để đảm bảo các nút mặc định đã render xong
                setTimeout(function() {
                    var container = $('.full-start__buttons');
                    
                    if (container.length && !container.find('.button--torrentio').length) {
                        var button = $(`<div class="full-start__button selector button--torrentio">
                            <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" style="fill: currentColor; margin-right: 10px; vertical-align: middle;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/></svg>
                            <span>Torrentio</span>
                        </div>`);

                        button.on('hover:enter', function () {
                            var search = new Torrentio(e.data);
                            search.create();
                        });

                        container.append(button);
                        
                        // Buộc Lampa cập nhật lại danh sách các phần tử có thể điều khiển
                        if (Lampa.Controller.enabled().name == 'full_start') {
                            Lampa.Controller.enable('full_start');
                        }
                    }
                }, 100);
            }
        });
    }

    if (window.app_ready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
