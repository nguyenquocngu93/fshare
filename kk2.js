(function () {
    'use strict';

    function kkphimPlugin() {
        // 1. Tạo Component hiển thị nội dung khi bấm vào menu
        Lampa.Component.add('kkphim_component', function (object) {
            var network = new Lampa.Reguest();
            var scroll  = new Lampa.Scroll({mask: true, over: true});
            var items   = [];
            var html    = $('<div></div>');
            
            this.create = function () {
                var _this = this;
                html.append(scroll.render());
                
                // Hiển thị nội dung tạm thời
                var info = $('<div class="category-full" style="padding: 20px; text-align: center;"><h2>KKPhim</h2><p>Dữ liệu sẽ hiển thị tại đây...</p></div>');
                scroll.append(info);
                return this.render();
            };

            this.render = function () {
                return html;
            };
        });

        // 2. Hàm chèn Menu vào sidebar
        function addMenuItem() {
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

            menu_item.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_component',
                    page: 1
                });
                // Đóng menu sau khi chọn (trên mobile)
                Lampa.Menu.hide();
            });

            // Chèn vào cuối danh sách menu
            $('.menu .menu__list').append(menu_item);
        }

        // Đợi app sẵn sàng thì chèn menu
        if (window.appready) addMenuItem();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') addMenuItem();
            });
        }
    }

    // Khởi chạy script
    if (window.appready) kkphimPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') kkphimPlugin();
        });
    }
})();
