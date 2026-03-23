(function () {
    'use strict';

    function JavPlugin() {
        // 1. Khởi tạo Component hiển thị danh sách phim
        Lampa.Component.add('jav_list', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({mask: true, over: true});
            var items = [];
            
            this.create = function () {
                var _this = this;
                // Giả lập gọi đến JavLibrary (qua Proxy để tránh bị chặn)
                var url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.javlibrary.com/vi/vl_update.php');
                
                network.silent(url, function (str) {
                    // Regex bóc tách dữ liệu thô từ HTML (Cần tinh chỉnh theo cấu trúc web thực tế)
                    // Ở đây mình giả lập một mảng dữ liệu
                    var data = [
                        {title: 'SSNI-123 Nàng tiên cá', code: 'SSNI-123', img: 'https://via.placeholder.com/150'},
                        {title: 'IPX-999 Cô giáo thảo', code: 'IPX-999', img: 'https://via.placeholder.com/150'}
                    ];
                    
                    data.forEach(function(item) {
                        var card = Lampa.Template.get('card', {title: item.title, release_year: item.code});
                        card.find('.card__img').attr('src', item.img);
                        
                        // Khi người dùng click vào phim
                        card.on('hover:enter', function() {
                            _this.searchTorrent(item.code);
                        });
                        
                        scroll.append(card);
                    });
                });
                
                return scroll.render();
            };

            // 2. Hàm tìm kiếm Torrent từ Sukebei (Nyaa)
            this.searchTorrent = function(code) {
                Lampa.Select.show({
                    title: 'Tìm Torrent cho: ' + code,
                    items: [
                        {title: 'Đang tìm kiếm nguồn Sukebei...', subtitle: 'Vui lòng đợi'}
                    ],
                    onSelect: function(a){}
                });

                // Gọi API của Sukebei (thường qua RSS/JSON)
                var searchUrl = 'https://sukebei.nyaa.si/?page=rss&q=' + code;
                
                // Sau khi có kết quả từ RSS, Lampa sẽ hiển thị danh sách Torrent
                // Người dùng chọn bản 1080p hoặc 720p để Play qua TorrServer
                console.log("Đang tìm Magnet cho mã: " + code);
            };
        });

        // 3. Thêm nút vào Menu chính của Lampa
        this.start = function () {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') {
                    Lampa.Menu.add({
                        id: 'jav_plugin',
                        title: 'Thế giới JAV',
                        icon: '<svg height="36" viewBox="0 0 24 24" width="36"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="#fff"/></svg>',
                        component: 'jav_list'
                    });
                }
            });
        };
    }

    // Đăng ký Plugin
    if (window.appready) JavPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') JavPlugin();
    });
})();
