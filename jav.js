(function () {
    'use strict';

    // 1. Định nghĩa Component chính
    function JavComponent(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        var html    = $('<div class="category-full"></div>');
        
        this.create = function () {
            var _this = this;
            // Dữ liệu mẫu để kiểm tra hiển thị
            var data = [
                {title: 'Mẫu 1: SSNI-123', code: 'SSNI-123', img: 'https://via.placeholder.com/300x450'},
                {title: 'Mẫu 2: IPX-999', code: 'IPX-999', img: 'https://via.placeholder.com/300x450'}
            ];

            data.forEach(function (element) {
                var card = Lampa.Template.get('card', {
                    title: element.title,
                    release_year: element.code
                });
                card.find('.card__img').attr('src', element.img);
                
                card.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Torrent: ' + element.code,
                        component: 'torrents',
                        search: element.code,
                        page: 1
                    });
                });
                html.append(card);
                items.push(card);
            });
            return scroll.render();
        };

        this.render = function () {
            scroll.append(html);
            return scroll.render();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
            items.forEach(function(item){ item.remove(); });
            items = [];
        };
    }

    // 2. Hàm khởi tạo Plugin (Bắt chước chính xác cấu trúc kkphim)
    function initJavPlugin() {
        if (window.jav_plugin_loaded) return;
        window.jav_plugin_loaded = true;

        // Đăng ký Component trước
        Lampa.Component.add('jav_plugin', JavComponent);

        // Thêm Menu bằng cách can thiệp trực tiếp vào Listener App
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                var menu_item = {
                    id: 'jav_plugin',
                    title: 'Kho JAV',
                    icon: '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#ffc107"/></svg>',
                    component: 'jav_plugin'
                };
                
                // Kiểm tra nếu Menu chưa tồn tại thì mới thêm
                if ($('.menu .menu__list').length > 0 && !$('.menu [data-id="jav_plugin"]').length) {
                    Lampa.Menu.add(menu_item);
                }
            }
        });
    }

    // 3. Chạy lệnh khởi tạo ngay lập tức
    if (window.Lampa) {
        initJavPlugin();
    } else {
        // Dự phòng nếu Lampa load chậm
        var waitLampa = setInterval(function() {
            if (window.Lampa) {
                clearInterval(waitLampa);
                initJavPlugin();
            }
        }, 200);
    }
})();
