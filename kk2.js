(function () {
    'use strict';

    if (window.plugin_kkphim_ready) return;
    window.plugin_kkphim_ready = true;

    Lampa.Platform.tv();

    function start() {

        // ===== MENU GIỐNG ANIME.JS =====
        let icon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24">
            <path fill="currentColor" d="M4 4h16v16H4z"/>
            <path fill="#000" d="M10 8l6 4l-6 4z"/>
        </svg>`;

        let button = $(`
            <li class="menu__item selector" data-action="kkphim">
                <div class="menu__ico">${icon}</div>
                <div class="menu__text">kkphim</div>
            </li>
        `);

        button.on('hover:enter', function () {
            Lampa.Activity.push({
                title: 'KKPhim',
                component: 'kkphim_home'
            });
        });

        $('.menu .menu__list').eq(0).append(button);

        // ===== COMPONENT =====
        Lampa.Component.add('kkphim_home', {
            create: function () {

                let html = $('<div class="kk-home"></div>');

                let scroll = new Lampa.Scroll({
                    mask: true,
                    over: true
                });

                html.append(scroll.render());

                let categories = [
                    { title: 'Phim mới', url: 'https://phimapi.com/danh-sach/phim-moi-cap-nhat' },
                    { title: 'Phim lẻ', url: 'https://phimapi.com/v1/api/danh-sach/phim-le' },
                    { title: 'Phim bộ', url: 'https://phimapi.com/v1/api/danh-sach/phim-bo' }
                ];

                categories.forEach(cat => loadRow(scroll, cat));

                return html;
            }
        });

        // ===== LOAD ROW =====
        function loadRow(scroll, cat) {

            let row = $(`
                <div style="margin-bottom:30px">
                    <div style="font-size:20px;margin:10px 0">${cat.title}</div>
                    <div class="kk-row"></div>
                </div>
            `);

            let line = new Lampa.Scroll({
                horizontal: true,
                mask: true
            });

            row.find('.kk-row').append(line.render());
            scroll.append(row);

            fetch(cat.url)
                .then(r => r.json())
                .then(data => {

                    let items = data.items || data.data?.items || [];

                    items.forEach(item => {

                        let card = Lampa.Template.get('card', {
                            title: item.name,
                            poster: item.poster_url || item.thumb_url
                        });

                        let el = $(card);

                        el.on('hover:enter', function () {
                            openDetail(item);
                        });

                        line.append(el);
                    });

                    line.update();
                });
        }

        // ===== DETAIL + PLAY =====
        function openDetail(item) {

            fetch('https://phimapi.com/phim/' + item.slug)
                .then(r => r.json())
                .then(data => {

                    let movie = data.movie;
                    let episodes = data.episodes?.[0]?.server_data || [];

                    let list = episodes.map(ep => ({
                        title: ep.name,
                        url: ep.link_m3u8 || ep.link_embed
                    }));

                    Lampa.Select.show({
                        title: movie.name,
                        items: list,
                        onSelect: function (a) {
                            Lampa.Player.play(a.url);
                        }
                    });

                });
        }

    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') start();
    });

})();