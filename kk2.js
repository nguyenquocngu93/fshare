(function () {
    'use strict';

    function kkphimPlugin() {
        // 1. Thêm mục vào menu bên trái
        Lampa.Component.add('kkphim_component', function (object) {
            var network = new Lampa.Reguest();
            var scroll  = new Lampa.Scroll({mask: true, over: true});
            var items   = [];
            var html    = $('<div></div>');
            
            this.create = function () {
                var _this = this;
                
                // Giao diện khi nhấn vào menu KKPhim
                html.append(scroll.render());
                
                // Demo: Hiển thị dòng chữ thông báo
                var info = $('<div class="category-full"><h2>Chào mừng đến với KKPhim</h2><p>Dữ liệu đang được tải...</p></div>');
                scroll.append(info);
                
                return this.render();
            };

            this.render = function () {
                return html;
            };
        });

        // 2. Đăng ký Menu item
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                var menu_item = $(`
                    <div class="menu__item selector" data-action="kkphim">
                        <svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="white"/>
                        </svg>
                        <div class="menu__text">KKPhim</div>
                    </div>
                `);

                menu_item.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: 'KKPhim',
                        component: 'kkphim_component',
                        page: 1
                    });
                });

                // Chèn vào menu bên trái (thường là sau mục "Phim")
                $('.menu .menu__list').append(menu_item);
            }
        });
    }

    // Khởi chạy plugin
    if (window.appready) kkphimPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') kkphimPlugin();
        });
    }
})();
