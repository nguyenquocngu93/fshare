(function () {
    'use strict';

    // 1. ĐỊNH NGHĨA COMPONENT HIỂN THỊ (KKPhim Content)
    function KKPhimComponent(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        var html    = $('<div class="category-full"></div>');
        
        this.create = function () {
            var _this = this;

            // Hiển thị Loading chuẩn Lampa
            Lampa.Select.show({ title: 'Đang tải KKPhim...', items: [] });

            // Gọi API lấy danh sách phim mới nhất
            network.silent('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1', function (data) {
                Lampa.Select.hide();
                
                if (data && data.items) {
                    // Dùng Items class để Lampa tự dàn hàng (Grid)
                    var list = new Lampa.Items({
                        category: 'kkphim_list',
                        type: 'card'
                    });

                    data.items.forEach(function (item) {
                        // Fix link ảnh poster
                        var img = item.poster_url;
                        if(img && !img.includes('http')) img = 'https://phimimg.com/uploads/vod/' + img;

                        // Tạo Card chuẩn Lampa (để tự động đẹp theo Skin)
                        var card = new Lampa.Card({
                            title: item.name,
                            release_year: item.year,
                            img: img,
                            card_id: item._id
                        });

                        card.create();
                        
                        // Fix điều khiển cho Remote/Chuột
                        card.onFocus = function() {
                            scroll.update(card.render());
                        };
                        
                        card.onEnter = function() {
                            Lampa.Activity.push({
                                url: 'https://phimapi.com/phim/' + item.slug,
                                title: item.name,
                                component: 'full_start',
                                id: item._id,
                                method: 'GET'
                            });
                        };

                        list.append(card.render());
                        items.push(card);
                    });

                    scroll.append(list.render());
                    html.append(scroll.render());

                    // Kích hoạt Controller để bấm được các phim
                    Lampa.Controller.add('kk_content', {
                        toggle: function () {
                            Lampa.Controller.collectionSet(html);
                            Lampa.Controller.render();
                        },
                        back: function () {
                            Lampa.Activity.backward();
                        }
                    });
                    Lampa.Controller.toggle('kk_content');

                } else {
                    Lampa.Noty.show('Không có dữ liệu!');
                }
            }, function () {
                Lampa.Select.hide();
                Lampa.Noty.show('Lỗi kết nối API!');
            });

            return this.render();
        };

        this.render = function () { return html; };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items.forEach(function(item){ if(item.destroy) item.destroy(); });
            html.remove();
            items = [];
        };
    }

    // 2. HÀM KHỞI CHẠY PLUGIN (PHẦN GHIM MENU SIDEBAR)
    function startPlugin() {
        // Đăng ký component vào hệ thống Lampa
        Lampa.Component.add('kkphim_component', KKPhimComponent);

        function addMenuItem() {
            // Kiểm tra tránh trùng lặp menu
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

            // Sự kiện click menu bên trái
            menu_item.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_component',
                    page: 1
                });
                Lampa.Menu.hide();
            });

            // Chèn vào sidebar
            $('.menu .menu__list').append(menu_item);
        }

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
