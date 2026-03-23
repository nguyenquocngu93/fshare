(function () {
    'use strict';

    function JavPlugin(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        var html    = $('<div></div>');
        var body    = $('<div class="category-full"></div>');
        
        this.create = function () {
            var _this = this;

            // Dữ liệu mẫu để đảm bảo Plugin luôn hiện nội dung khi test
            var demoData = [
                {title: 'SSNI-123 Nàng Tiên Cá', code: 'SSNI-123', img: 'https://jable.tv/contents/videos_screenshots/20000/20345/preview.jpg'},
                {title: 'IPX-999 Cô Giáo Thảo', code: 'IPX-999', img: 'https://jable.tv/contents/videos_screenshots/15000/15888/preview.jpg'},
                {title: 'STARS-555 Tuyệt Đỉnh', code: 'STARS-555', img: 'https://jable.tv/contents/videos_screenshots/10000/10234/preview.jpg'}
            ];

            // Xử lý hiển thị từng thẻ phim
            demoData.forEach(function (element) {
                var card = Lampa.Template.get('card', {
                    title: element.title,
                    release_year: element.code
                });

                card.find('.card__img').attr('src', element.img);
                
                // Sự kiện khi bấm vào phim
                card.on('hover:enter', function () {
                    Lampa.Select.show({
                        title: 'Tùy chọn cho ' + element.code,
                        items: [
                            {title: 'Tìm Torrent (Sukebei)', source: 'torrent'},
                            {title: 'Xem thông tin trên JavLibrary', source: 'info'}
                        ],
                        onSelect: function(a) {
                            if(a.source == 'torrent') {
                                // Gọi trình tìm kiếm Torrent mặc định của Lampa
                                Lampa.Activity.push({
                                    url: '',
                                    title: 'Torrent: ' + element.code,
                                    component: 'torrents',
                                    search: element.code,
                                    page: 1
                                });
                            } else {
                                Lampa.Noty.show('Chức năng thông tin đang phát triển');
                            }
                        },
                        onBack: function() {
                            Lampa.Controller.toggle('content');
                        }
                    });
                });

                body.append(card);
                items.push(card);
            });

            scroll.append(body);
            html.append(scroll.render());
            
            return html;
        };

        // Các hàm bắt buộc theo cấu trúc Lampa
        this.render = function () { return html; };
        this.pause  = function () {};
        this.stop   = function () {};
        
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
            body.remove();
            items.forEach(function(item){ item.remove(); });
            items = [];
        };
    }

    // Hàm khởi tạo Plugin
    function startPlugin() {
        window.jav_torrent_plugin = true;

        // Đăng ký Component vào hệ thống Lampa
        Lampa.Component.add('jav_torrent', JavPlugin);

        // Đăng ký vào Menu chính
        var menu_item = {
            id: 'jav_torrent',
            title: 'JAV Torrent',
            icon: '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="#fff"/></svg>',
            component: 'jav_torrent'
        };

        Lampa.Menu.add(menu_item);
    }

    // Kiểm tra và chạy Plugin khi App sẵn sàng
    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }
})();
