(function () {
    'use strict';

    // ĐỊNH NGHĨA COMPONENT KKPHIM (Cấu trúc hiển thị nội dung)
    function KKPhimComponent(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        var html    = $('<div></div>');
        
        this.create = function () {
            var _this = this;
            html.append(scroll.render());
            
            // PHẦN NÀY ĐỂ CODE HIỂN THỊ DỮ LIỆU SAU NÀY
            var info = $('<div class="category-full" style="padding: 20px; text-align: center;"><h2>KKPhim</h2><p>Dữ liệu sẽ hiển thị tại đây...</p></div>');
            scroll.append(info);
            
            return this.render();
        };

        this.render = function () {
            return html;
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
            items = [];
        };
    }

    // HÀM KHỞI CHẠY PLUGIN
    function startPlugin() {
        // 1. Đăng ký component với hệ thống Lampa
        Lampa.Component.add('kkphim_component', KKPhimComponent);

        // 2. Hàm chèn Menu vào Sidebar
        function addMenuItem() {
            // Kiểm tra nếu menu đã tồn tại thì không chèn nữa
            if ($('.menu .menu__list [data-action="kkphim"]').length > 0) return;

            var menu_item = $(`
                <div class="menu__item selector" data-action="kkphim">
                    <div class="menu__ico">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.5V7.5L16 12L10 16.5Z" fill="white"/>
                        </svg>
                    </div>
                    <div class="menu__text">KKPhim</div>
                </div>
            `);

            // Sự kiện khi nhấn vào menu
            menu_item.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_component',
                    page: 1
                });
                Lampa.Menu.hide(); // Ẩn sidebar sau khi chọn
            });

            // Chèn menu vào danh sách
            $('.menu .menu__list').append(menu_item);
        }

        // Chờ app sẵn sàng để chèn menu
        if (window.appready) addMenuItem();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') addMenuItem();
            });
        }
    }

    // KÍCH HOẠT PLUGIN
    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }

})();
