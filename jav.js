(function () {
    'use strict';

    function JavPlugin(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        var html    = $('<div></div>');
        var body    = $('<div class="category-full"></div>');
        
        // 1. Khởi tạo Component
        this.create = function () {
            var _this = this;

            // Hiển thị loading
            this.activity.loader(true);

            // Giả lập lấy dữ liệu từ JavLibrary (Bạn sẽ thay bằng link Scraper của bạn)
            // Lưu ý: Cần qua Proxy để tránh CORS nếu chạy trên Web
            var url = 'https://www.javlibrary.com/vi/vl_update.php'; 

            // Ở đây mình demo dữ liệu mẫu theo cấu trúc Lampa
            var demoData = [
                {title: 'SSNI-123 Nàng Tiên Cá', code: 'SSNI-123', img: 'https://v2.vcdn.vn/images/2023/05/ssni-123.jpg'},
                {title: 'IPX-999 Cô Giáo Thảo', code: 'IPX-999', img: 'https://v2.vcdn.vn/images/2023/05/ipx-999.jpg'}
            ];

            demoData.forEach(function (element) {
                var card = Lampa.Template.get('card', {
                    title: element.title,
                    release_year: element.code
                });

                card.find('.card__img').attr('src', element.img);
                
                // Khi bấm vào phim -> Gọi tìm kiếm Torrent
                card.on('hover:enter', function () {
                    _this.searchTorrent(element.code);
                });

                body.append(card);
                items.push(card);
            });

            scroll.append(body);
            html.append(scroll.render());
            
            this.activity.loader(false);
            return html;
        };

        // 2. Logic tìm Torrent (Kết nối với Sukebei/Nyaa)
        this.searchTorrent = function(code) {
            Lampa.Select.show({
                title: 'Tìm kiếm Torrent cho ' + code,
                items: [
                    {title: 'Tìm trên Sukebei (Nyaa)', source: 'sukebei'},
                    {title: 'Tìm trên Jackett (Nếu có)', source: 'jackett'}
                ],
                onSelect: function(a){
                    // Lampa có trình tìm kiếm Torrent mặc định
                    // Bạn có thể "mượn" nó để tìm theo mã code
                    Lampa.Activity.push({
                        url: '',
                        title: 'Torrent: ' + code,
                        component: 'torrents', // Component mặc định của Lampa
                        search: code,
                        page: 1
                    });
                }
            });
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };
        
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
            body.remove();
            items.forEach(function(item){ item.remove(); });
            items = [];
        };
    }

    // 3. Đăng ký Menu theo chuẩn kkphim.js
    function startPlugin() {
        window.jav_plugin_installed = true;

        // Thêm Component vào hệ thống
        Lampa.Component.add('jav_plugin', JavPlugin);

        // Thêm vào Menu chính
        var menu_item = {
            id: 'jav_plugin',
            title: 'Kho JAV (Torrent)',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.5V7.5L16 12L10 16.5Z" fill="white"/></svg>',
            component: 'jav_plugin'
        };

        Lampa.Menu.add(menu_item);
    }

    // Chờ app sẵn sàng
    if (window.appready && !window.jav_plugin_installed) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready' && !window.jav_plugin_installed) startPlugin();
        });
    }
})();
