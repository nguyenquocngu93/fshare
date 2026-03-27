(function () {
    'use strict';

    if (window.plugin_kkphim_ready) return;
    window.plugin_kkphim_ready = true;

    function startPlugin() {
        console.log('KKPhim plugin loaded');

        // thêm menu bên trái giống anime.js
        Lampa.Menu.add({
            title: 'kkphim',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
                  '<path d="M4 4H20V20H4V4Z" stroke="white" stroke-width="2"/>' +
                  '<path d="M9 8L16 12L9 16V8Z" fill="white"/>' +
                  '</svg>',
            onSelect: function () {

                // mở trang riêng giống anime.js
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_component'
                });

            }
        });

        // tạo component hiển thị nội dung
        Lampa.Component.add('kkphim_component', {
            create: function () {
                let html = $('<div class="kkphim-page" style="padding:20px;"></div>');

                html.append('<div style="font-size:22px;font-weight:bold;margin-bottom:15px;">KKPhim</div>');
                html.append('<div>Đang load dữ liệu...</div>');

                return html;
            },

            destroy: function () {
                // cleanup nếu cần
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') startPlugin();
    });

})();