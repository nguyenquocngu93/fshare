(function () {
    'use strict';

    try {
        const KKPhim = {
            name: 'KKPhim',
            version: '1.0.0',
            api: 'https://phimapi.com',

            init() {
                this.addStyles();
                this.registerComponents();
                this.addMenu();
                console.log('KKPhim Plugin loaded successfully');
            },

            addMenu() {
                const menuItem = $(`
                    <li class="menu__item selector" data-action="kkphim">
                        <div class="menu__ico">🎬</div>
                        <div class="menu__text">KKPhim</div>
                    </li>
                `);

                menuItem.on('hover:enter', () => {
                    Lampa.Activity.push({
                        url: '',
                        title: 'KKPhim',
                        component: 'kkphim_main',
                        page: 1
                    });
                });

                $('.menu .menu__list').first().append(menuItem);
            },

            registerComponents() {
                // Main screen component
                Lampa.Component.add('kkphim_main', (object) => {
                    const activity = new Lampa.Activity(object);
                    const scroll = new Lampa.Scroll({ mask: true });
                    const container = $('<div class="kkphim-container"></div>');

                    scroll.append(container);
                    activity.append(scroll.render());

                    activity.create = () => {
                        activity.loader(true);
                        this.loadCategories(container, () => {
                            activity.loader(false);
                            activity.toggle();
                        });
                    };

                    activity.toggle = () => {
                        Lampa.Activity.active(activity);
                        scroll.update();
                    };

                    activity.back = () => {
                        Lampa.Activity.backward();
                    };

                    return activity;
                });

                // Detail component
                Lampa.Component.add('kkphim_detail', (object) => {
                    const activity = new Lampa.Activity(object);
                    const scroll = new Lampa.Scroll({ mask: true });
                    const container = $('<div class="kkphim-detail"></div>');

                    scroll.append(container);
                    activity.append(scroll.render());

                    activity.create = () => {
                        activity.loader(true);
                        this.loadDetail(object.slug, container, () => {
                            activity.loader(false);
                            activity.toggle();
                        });
                    };

                    activity.toggle = () => {
                        Lampa.Activity.active(activity);
                        scroll.update();
                    };

                    activity.back = () => {
                        Lampa.Activity.backward();
                    };

                    return activity;
                });
            },

            loadCategories(container, callback) {
                const categories = [
                    { title: 'Phim Mới Cập Nhật', url: '/danh-sach/phim-moi-cap-nhat?page=1' },
                    { title: 'Phim Lẻ', url: '/v1/api/danh-sach/phim-le?page=1' },
                    { title: 'Phim Bộ', url: '/v1/api/danh-sach/phim-bo?page=1' }
                ];

                let loaded = 0;
                const total = categories.length;

                categories.forEach((cat) => {
                    this.request(cat.url, (data) => {
                        const items = data.items || (data.data?.items || []);
                        if (items.length > 0) {
                            this.createRow(cat.title, items, container);
                        }

                        loaded++;
                        if (loaded >= total) callback();
                    }, () => {
                        loaded++;
                        if (loaded >= total) callback();
                    });
                });
            },

            createRow(title, items, container) {
                const row = $(`
                    <div class="kkphim-row">
                        <div class="kkphim-row-title">${title}</div>
                        <div class="kkphim-row-content"></div>
                    </div>
                `);

                const content = row.find('.kkphim-row-content');

                items.slice(0, 10).forEach((item) => {
                    const card = $(`
                        <div class="kkphim-card selector" data-slug="${item.slug}">
                            <img src="${item.poster_url || item.thumb_url}" class="kkphim-card-img" onerror="this.src='./img/img_broken.svg'">
                            <div class="kkphim-card-title">${item.name}</div>
                            <div class="kkphim-card-quality">${item.quality || ''}</div>
                        </div>
                    `);

                    card.on('hover:enter', () => {
                        Lampa.Activity.push({
                            url: '',
                            title: item.name,
                            component: 'kkphim_detail',
                            slug: item.slug
                        });
                    });

                    content.append(card);
                });

                container.append(row);
            },

            loadDetail(slug, container, callback) {
                this.request(`/phim/${slug}`, (data) => {
                    const movie = data.movie;
                    const html = `
                        <div class="kkphim-detail-content">
                            <img src="${movie.thumb_url}" class="kkphim-detail-poster">
                            <div class="kkphim-detail-info">
                                <h1>${movie.name}</h1>
                                <p>${movie.origin_name || ''}</p>
                                <div class="kkphim-detail-meta">
                                    <span>${movie.year || ''}</span>
                                    <span>${movie.quality || ''}</span>
                                    <span>${movie.lang || ''}</span>
                                </div>
                                <p class="kkphim-detail-desc">${movie.content || ''}</p>
                            </div>
                        </div>
                    `;

                    container.html(html);
                    callback();
                }, () => {
                    container.html('<div class="kkphim-empty">Không thể tải thông tin phim</div>');
                    callback();
                });
            },

            request(url, success, error) {
                const fullUrl = url.startsWith('http') ? url : this.api + url;
                const reguest = new Lampa.Reguest();

                reguest.native(fullUrl, (data) => {
                    if (typeof data === 'string') data = JSON.parse(data);
                    success(data);
                }, () => {
                    error();
                });
            },

            addStyles() {
                const css = `
                    .kkphim-container { padding: 1em; }
                    .kkphim-row { margin-bottom: 2em; }
                    .kkphim-row-title { font-size: 1.2em; color: #fff; margin-bottom: 1em; font-weight: bold; }
                    .kkphim-row-content { display: flex; gap: 1em; overflow-x: auto; padding-bottom: 0.5em; }
                    .kkphim-card { width: 120px; flex-shrink: 0; }
                    .kkphim-card-img { width: 100%; border-radius: 8px; }
                    .kkphim-card-title { color: #fff; font-size: 0.9em; margin-top: 0.5em; }
                    .kkphim-card-quality { color: #ff0000; font-size: 0.8em; margin-top: 0.2em; }
                    .kkphim-detail-content { display: flex; gap: 2em; padding: 2em; }
                    .kkphim-detail-poster { width: 200px; border-radius: 12px; }
                    .kkphim-detail-info { color: #fff; flex: 1; }
                    .kkphim-detail-meta { gap: 1em; display: flex; margin: 1em 0; }
                    .kkphim-detail-desc { line-height: 1.5; margin-top: 1em; }
                    .kkphim-empty { color: #fff; text-align: center; padding: 2em; }
                `;

                if (!$('#kkphim-styles').length) {
                    $('head').append(`<style id="kkphim-styles">${css}</style>`);
                }
            }
        };

        // Initialize when Lampa is ready
        if (window.appready) {
            KKPhim.init();
        } else {
            Lampa.Listener.follow('app', (e) => {
                if (e.type === 'ready') {
                    KKPhim.init();
                }
            });
        }
    } catch (e) {
        console.error('KKPhim Plugin Error:', e);
        Lampa.Noty.show('Lỗi tải plugin KKPhim');
    }
})();