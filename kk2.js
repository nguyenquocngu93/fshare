(function () {
    'use strict';

    if (window.plugin_kkphim_ready) return;
    window.plugin_kkphim_ready = true;

    Lampa.Platform.tv();

    function start() {

        // icon đẹp (play + box)
        let icon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24">
            <path fill="currentColor" d="M4 4h16v16H4z"/>
            <path fill="#000" d="M10 8l6 4l-6 4z"/>
        </svg>`;

        // tạo menu giống anime.js
        let button = $(`
            <li class="menu__item selector" data-action="kkphim">
                <div class="menu__ico">${icon}</div>
                <div class="menu__text">kkphim</div>
            </li>
        `);

        // hành động khi bấm
        button.on('hover:enter', function () {

            Lampa.Activity.push({
                url: '', // sau này bạn gắn API kkphim vào đây
                title: 'KKPhim',
                component: 'category_full',
                source: 'tmdb', // tạm dùng tmdb UI
                card_type: true,
                page: 1
            });

        });

        // gắn vào menu trái
        $('.menu .menu__list').eq(0).append(button);
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') start();
    });

})();