(function () {
    'use strict';

    // 1. ĐỊNH NGHĨA COMPONENT HIỂN THỊ (KKPhim Content)
    function KKPhimComponent(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        var html    = $('<div></div>');
        
        this.create = function () {
            var _this = this;
            html.append(scroll.render());

            // Hiển thị loading trong khi đợi API
            Lampa.Select.show({
                title: 'Đang tải KKPhim...',
                items: []
            });

            // Gọi API lấy danh sách phim mới nhất
            network.silent('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1', function (data) {
                Lampa.Select.hide();
                
                if (data && data.items) {
                    scroll.clear();
                    
                    // Tạo grid để chứa các poster phim
                    var grid = $('<div class="category-full"></div>');
                    
                    data.items.forEach(function (item) {
                        // Chuẩn bị dữ liệu chuẩn cho Card của Lampa
                        var card_data = {
                            title: item.name,
                            original_title: item.origin_name,
                            release_year: item.year || '2024',
                            img: item.poster_url // Link poster trực tiếp từ KKPhim
                        };

                        // Tạo đối tượng Card (Poster)
                        var card = Lampa.Template.get('card', card_data);
                        card.addClass('selector');

                        // Xử lý khi bấm chọn phim
                        card.on('hover:enter', function () {
                            Lampa.Activity.push({
                                url: 'https://phimapi.com/phim/' + item.slug,
                                title: item.name,
                                component: 'full_start', // Mở trang chi tiết nội dung của Lampa
                                id: item._id,
                                method: 'GET'
                            });
                        });

                        grid.append(card);
                        items.push(card);
                    });

                    scroll.append(grid);

                    // Cấu hình điều khiển (Remote/Keyboard)
                    Lampa.Controller.add('content', {
                        toggle: function () {
                            Lampa.Controller.collectionSet(scroll.render());
                            Lampa.Controller.render();
                        },
                        up: function () {},
                        down: function () {},
                        back: function () {
                            Lampa.Activity.backward();
                        }
                    });
                    Lampa.Controller.toggle('content');

                } else {
                    Lampa.Noty.show('Không tìm thấy dữ liệu phim.');
                }
            }, function () {
                Lampa.Select.hide();
                Lampa.Noty.show('Lỗi kết nối đến máy chủ KKPhim.');
            });

            return this.render();
        };

        this.render = function () {
            return html;
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            if (html) html.remove();
            items = [];
        };
    }

    // 2. HÀM KHỞI CHẠY PLUGIN (Ghim Menu Sidebar)
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

            // Sự kiện click menu
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

    // KÍCH HOẠT PLUGIN TOÀN CỤC
    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }

})();
