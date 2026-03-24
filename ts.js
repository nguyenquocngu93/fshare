(function () {
    'use strict';

    function Jackett(object) {
        var network = new Lampa.RegExp();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [];
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        
        // --- ĐOẠN MOD: THIẾT LẬP SERVER JACRED ---
        var jack_url = 'https://jac.maxvol.pro';
        var jack_key = '1';
        // ---------------------------------------

        this.create = function () {
            var _this = this;
            this.start();
            return this.render();
        };

        this.start = function () {
            var _this = this;
            // Tạo URL tìm kiếm chuẩn cho Jacred API v1
            var url = jack_url + '/api/v1/search?api_key=' + jack_key + '&query=' + encodeURIComponent(object.search);

            Lampa.Network.silent(url, function (json) {
                if (json && json.result && json.result.length) {
                    _this.build(json.result);
                } else {
                    _this.empty();
                }
            }, function () {
                _this.empty();
            });
        };

        this.build = function (data) {
            var _this = this;
            data.forEach(function (item) {
                // Chuyển đổi dữ liệu từ Jacred sang định dạng Lampa hiểu
                var obj = {
                    title: item.title,
                    quality: item.quality || '720p',
                    size: Lampa.Utils.bytesToSize(item.size),
                    seeders: item.seeds,
                    leechers: item.peers,
                    magnet: item.magnet,
                    plugin: 'Jacred Mod by Ni'
                };

                var card = Lampa.Template.get('torrent_item', obj);
                
                card.on('hover:enter', function () {
                    // Gọi trình phát Torrent (TorrServe/WebTorr)
                    Lampa.Torrent.run(obj);
                });

                body.append(card);
                items.push(card);
            });

            this.onReatdy();
        };

        this.empty = function () {
            body.append('<div class="empty">Không tìm thấy kết quả từ Jacred</div>');
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
        Lampa.Component.add('jackett', Jackett);
        Lampa.Search.addSource(Jackett);
    }
})();