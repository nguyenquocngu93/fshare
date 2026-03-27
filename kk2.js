(function () {
    'use strict';

    // 1. CSS DÁN NHÃN (Lấy cảm hứng từ lnum.js)
    Lampa.Template.add('kkphim_style', `
        <style>
            .card__kk-label {
                position: absolute;
                top: 0.5em;
                left: 0.5em;
                background: #e74c3c;
                color: #fff;
                padding: 0.1em 0.5em;
                border-radius: 0.2em;
                font-size: 0.75em;
                z-index: 5;
            }
        </style>
    `);

    function KKPhimComponent(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        var html    = $('<div class="category-full"></div>'); // LỚP VỎ NGOÀI CÙNG
        
        this.create = function () { return this.render(); };

        this.start = function () {
            var _this = this;
            
            // Xóa sạch để load mới
            scroll.clear();
            html.append(scroll.render());

            network.silent('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1', function (data) {
                if (data && data.items) {
                    // LỚP VỎ THỨ 2: "items" - Đây là class quyết định chia 2-3 cột trên mobile
                    var body = $('<div class="items"></div>');

                    data.items.forEach(function (item) {
                        // FIX API ẢNH: Đảm bảo lấy đúng link poster
                        var img = item.poster_url;
                        if(img && !img.includes('http')) img = 'https://phimimg.com/uploads/vod/' + img;

                        // Tạo card từ template chuẩn
                        var card = Lampa.Template.get('card', {
                            title: item.name,
                            release_year: item.year || '2026'
                        });

                        // ÉP CLASS BỐ TRÍ: card--fixed giúp poster đều nhau
                        card.addClass('card--fixed selector');
                        
                        // Nhét link ảnh vào đúng chỗ Lampa cần
                        card.find('.card__img').attr('src', img);

                        // Chèn nhãn tập phim (lnum style)
                        if (item.episode_current) {
                            card.find('.card__view').append('<div class="card__kk-label">' + item.episode_current + '</div>');
                        }

                        // Xử lý Touch cho điện thoại
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
                    _this.activity.loader(false);
                }
            });
        };

        this.render = function () { return html; };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
            items = [];
        };
    }

    // --- SIDEBAR (GIỮ NGUYÊN) ---
    function startPlugin() {
        Lampa.Component.add('kkphim_component', KKPhimComponent);

        function addMenuItem() {
            if ($('.menu .menu__list [data-action="kkphim"]').length > 0) return;

            var menu_item = $(`
                <div class="menu__item selector" data-action="kkphim">
                    <div class="menu__ico"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.5V7.5L16 12L10 16.5Z" fill="white"/></svg></div>
                    <div class="menu__text">KKPhim</div>
                </div>
            `);

            menu_item.on('click', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_component',
                    page: 1
                });
                Lampa.Menu.hide();
            });

            $('.menu .menu__list').append(menu_item);
        }

        if (window.appready) addMenuItem();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addMenuItem(); });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
