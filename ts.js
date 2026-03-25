(function () {
    'use strict';

    // 1. MODULE CÀI ĐẶT (Cho phép người dùng đổi Link TorrServer/API trong Settings)
    Lampa.Settings.add({
        title: 'Torrentio EN',
        type: 'book',
        icon: '<svg...>...</svg>',
        name: 'torrentio_settings',
        description: 'Cấu hình Parser Torrentio cá nhân',
        onRender: function (body) {
            // Render giao diện cài đặt ở đây
        }
    });

    // 2. MODULE COMPONENT (Xử lý giao diện danh sách kết quả)
    function TorrentioComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var list = new Lampa.List();
        
        this.create = function () {
            // Dựng UI, Xử lý Scroll, Quản lý Focus (Controller)
            // Đây là nơi ngốn hàng trăm dòng code nhất
        }

        this.search = function (imdb_id) {
            // Gọi API, Parse JSON, xử lý lỗi Network
        }
    }

    // 3. MODULE KHỞI TẠO (Hook vào hệ thống)
    function startPlugin() {
        // Kiểm tra xem Lampa đã load xong chưa
        window.plugin_torrentio_ready = true;

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'ready') {
                // Đăng ký Button
                // Đăng ký Controller để điều khiển bằng Remote
                // Xử lý sự kiện bấm nút
            }
        });
    }

    // Chờ Lampa sẵn sàng thì mới "nổ máy"
    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }
})();
