(function () {
    'use strict';

    // --- 1. Đăng ký Cài đặt (Settings) vào Hệ thống Lampa ---
    Lampa.Settings.add({
        title: 'Torrentio',
        type: 'open',
        name: 'torrentio_settings',
        icon: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/></svg>',
        onRender: function(body) {
            var items = [
                {
                    title: 'Nguồn Torrentio',
                    name: 'torrentio_url',
                    type: 'input',
                    placeholder: 'https://torrentio.strem.fun',
                    default: 'https://torrentio.strem.fun'
                },
                {
                    title: 'Lọc phim CAM',
                    name: 'torrentio_filter_cam',
                    type: 'select',
                    values: { 'yes': 'Bật', 'no': 'Tắt' },
                    default: 'yes'
                },
                {
                    title: 'Số lượng kết quả tối đa',
                    name: 'torrentio_limit',
                    type: 'select',
                    values: { '5': '5', '10': '10', '20': '20', '0': 'Không giới hạn' },
                    default: '10'
                }
            ];

            items.forEach(function(item) {
                var html = Lampa.Template.get('settings_field', item);
                html.on('hover:enter', function() {
                    Lampa.Settings.update(item, html);
                });
                body.append(html);
            });
        }
    });

    // --- 2. Thành phần hiển thị kết quả (Component) ---
    function TorrentioComponent(object) {
        var network = new Lampa.RegExp.network();
        var scroll = new Lampa.scroll({mask: true, over: true});
        var files = new Lampa.files();
        var filter = new Lampa.filter();
        var last_results = [];

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            var card = object.card;
            var imdb_id = card.imdb_id;
            var type = card.number_of_seasons ? 'series' : 'movie';
            var host = Lampa.Storage.get('torrentio_url', 'https://torrentio.strem.fun');
            
            // Xử lý Movie vs Series
            var query_path = imdb_id;
            if (type === 'series') {
                var s = object.season || 1;
                var e = object.episode || 1;
                query_path += ':' + s + ':' + e;
            }

            var url = host + '/stream/' + type + '/' + query_path + '.json';

            network.silent(url, function(json) {
                _this.activity.loader(false);
                if (json.streams && json.streams.length > 0) {
                    _this.build(json.streams);
                } else {
                    _this.empty();
                }
            }, function() {
                _this.activity.loader(false);
                _this.error();
            });

            return scroll.render();
        };

        this.build = function(streams) {
            var _this = this;
            var limit = parseInt(Lampa.Storage.get('torrentio_limit', '10'));
            var filter_cam = Lampa.Storage.get('torrentio_filter_cam', 'yes');

            streams.forEach(function(stream, index) {
                if (limit > 0 && index >= limit) return;
                
                // Parser thông tin từ chuỗi Torrentio
                var title_parts = stream.title.split('\n');
                var info_line = title_parts[1] || "";
                
                // Lọc phim CAM nếu cài đặt bật
                if (filter_cam === 'yes' && (stream.title.toLowerCase().includes('cam') || stream.title.toLowerCase().includes('ts'))) return;

                var item = Lampa.Template.get('button', {
                    title: title_parts[0],
                    description: info_line
                });

                item.on('hover:enter', function() {
                    // Chuyển sang trình phát của Lampa
                    var video_url = stream.url;
                    var player_data = {
                        url: video_url,
                        title: object.card.title + (object.episode ? ' - S' + object.season + 'E' + object.episode : ''),
                        subtitles: []
                    };
                    Lampa.Player.play(player_data);
                });

                scroll.append(item);
            });
        };

        this.empty = function() {
            scroll.append(Lampa.Template.get('empty', {title: 'Không tìm thấy kết quả từ Torrentio'}));
        };

        this.error = function() {
            scroll.append(Lampa.Template.get('error', {title: 'Lỗi kết nối đến Torrentio'}));
        };
    }

    // --- 3. Đăng ký Component và Nút bấm ---
    Lampa.Component.add('torrentio_component', TorrentioComponent);

    Lampa.Listener.follow('full', function(e) {
        if (e.type == 'complite') {
            var render = e.object.render();
            var button = $(`
                <div class="full-start__button selector">
                    <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>
                    <span>Torrentio</span>
                </div>
            `);

            button.on('hover:enter', function() {
                Lampa.Component.item('torrentio_component', {
                    card: e.data.movie,
                    season: e.data.season,
                    episode: e.data.episode
                });
            });

            render.find('.full-start__buttons').append(button);
        }
    });

})();
