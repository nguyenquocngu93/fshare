(function () {
    'use strict';

    // 1. COMPONENT HIỂN THỊ (KKPhim Content) - Tối ưu cho Touch
    function KKPhimComponent(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        var html    = $('<div class="category-full"></div>');
        
        this.create = function () {
            var _this = this;

            // Gọi API lấy phim mới
            network.silent('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1', function (data) {
                if (data && data.items) {
                    scroll.clear();
                    
                    // Container "items" để chia cột poster tự động
                    var body = $('<div class="items"></div>');

                    data.items.forEach(function (item) {
                        // Fix link ảnh poster
                        var img = item.poster_url;
                        if(img && !img.includes('http')) img = 'https://phimimg.com/uploads/vod/' + img;

                        // Tạo card từ template mặc định
                        var card = Lampa.Template.get('card', {
                            title: item.name,
                            release_year: item.year
                        });

                        // Thêm class chuẩn để hiện poster đẹp trên cảm ứng
                        card.addClass('card--fixed selector');
                        card.find('.card__img').attr('src', img);

                        // Sự kiện CHẠM (Click/Touch) để mở phim
                        card.on('click', function () {
                            Lampa.Activity.push({
                                url: 'https://phimapi.com/phim/' + item.slug,
                                title: item.name,
                                component: 'full_start',
                                id: item._id,
                                method: 'GET'
                            });
                        });

                        body.append(card);
                        items.push(card);
                    });

                    scroll.append(body);
                    html.append(scroll.render());
                    
                    // Với Touchscreen, chỉ cần thông báo Activity đã sẵn sàng
                    _this.activity.loader(false);
                }
            }, function () {
                Lampa.Noty.show('Lỗi kết nối KKPhim!');
            });

            return this.render();
        };

        this.render = function () { return html; };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
            items = [];
        };
    }

    // 2. PHẦN MENU SIDEBAR (GIỮ ĐÚNG CẤU TRÚC ĐÃ GHIM)
    function startPlugin() {
        Lampa.Component.add('kkphim_component', KKPhimComponent);

        function addMenuItem() {
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

            // Chạm vào menu sidebar để mở
            menu_item.on('click', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_component',
                    page: 1
                });
                Lampa.Menu.hide(); // Ẩn menu sau khi chạm
            });

            $('.menu .menu__list').append(menu_item);
        }

        if (window.appready) addMenuItem();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') addMenuItem();
            });
        }
    }

    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }
})();
