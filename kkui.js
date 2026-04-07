(function() {
    'use strict';

    // ===== CONFIG =====
    const API_BASE = 'https://phimapi.com';
    const TMDB_KEY = '6979c8ec101ed849f44d197c86582644'; // Thay bằng key của bạn
    const TMDB_BASE = 'https://api.themoviedb.org/3';
    const TMDB_IMG = 'https://image.tmdb.org/t/p';

    // Import CSS
    const CSS_URL = 'https://nguyenquocngu93.github.io/fshare/style.css'; // Thay đường dẫn
    Lampa.Storage.set('kkphim_css_loaded', false);
    
    function loadCSS() {
        if (Lampa.Storage.get('kkphim_css_loaded')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CSS_URL;
        document.head.appendChild(link);
        Lampa.Storage.set('kkphim_css_loaded', true);
        console.log('[KKPhim] CSS loaded from:', CSS_URL);
    }

    // ===== NETWORK =====
    function request(url, callback, errorCallback) {
        Lampa.Noty.get().clear();
        $.ajax({
            url: url,
            type: 'GET',
            timeout: 10000,
            success: callback,
            error: function(xhr) {
                console.error('[KKPhim] Request failed:', url, xhr);
                if (errorCallback) errorCallback(xhr);
                else Lampa.Noty.show('Lỗi tải dữ liệu: ' + xhr.status);
            }
        });
    }

    // ===== TMDB HELPERS =====
    function getTMDBData(name, year, type, callback) {
        const searchType = type === 'series' ? 'tv' : 'movie';
        const query = encodeURIComponent(name);
        const url = `${TMDB_BASE}/search/${searchType}?api_key=${TMDB_KEY}&language=vi-VN&query=${query}&year=${year || ''}`;
        
        request(url, function(data) {
            if (data.results && data.results.length > 0) {
                const tmdbId = data.results[0].id;
                getDetailedTMDB(tmdbId, searchType, callback);
            } else {
                callback(null);
            }
        }, () => callback(null));
    }

    function getDetailedTMDB(id, type, callback) {
        const urls = {
            details: `${TMDB_BASE}/${type}/${id}?api_key=${TMDB_KEY}&language=vi-VN`,
            credits: `${TMDB_BASE}/${type}/${id}/credits?api_key=${TMDB_KEY}&language=vi-VN`,
            similar: `${TMDB_BASE}/${type}/${id}/similar?api_key=${TMDB_KEY}&language=vi-VN&page=1`
        };

        let result = {};
        let pending = 3;

        function check() {
            pending--;
            if (pending === 0) callback(result);
        }

        request(urls.details, (data) => { result.details = data; check(); }, check);
        request(urls.credits, (data) => { result.credits = data; check(); }, check);
        request(urls.similar, (data) => { result.similar = data; check(); }, check);
    }

    // ===== MAIN COMPONENT =====
    class KKPhimComponent extends Lampa.Component {
        constructor(object) {
            super(object);
            this.content = Lampa.Template.get('items_line', { title: 'KKPhim' });
            this.scroll = new Lampa.Scroll({ mask: true, over: true });
            this.data = [];
            this.page = 1;
            this.type = object.type || 'phim-moi-cap-nhat';
        }

        create() {
            loadCSS();
            this.activity.loader(true);
            this.loadData();
            return this.content;
        }

        loadData() {
            const url = `${API_BASE}/danh-sach/${this.type}?page=${this.page}`;
            request(url, (resp) => {
                this.activity.loader(false);
                if (resp && resp.data && resp.data.items) {
                    this.data = this.data.concat(resp.data.items);
                    this.build();
                }
            }, () => {
                this.activity.loader(false);
                this.empty('Không tải được dữ liệu');
            });
        }

        build() {
            const html = $('<div class="kk-grid-wrap"></div>');
            const grid = $('<div class="kk-grid kk-grid--hgrid-2"></div>');

            this.data.forEach((item) => {
                const card = this.createCard(item);
                grid.append(card);
            });

            html.append(grid);

            const more = $('<div class="kk-loadmore selector">Xem thêm</div>');
            more.on('hover:enter', () => {
                this.page++;
                this.loadData();
            });
            html.append(more);

            this.scroll.append(html);
            this.content.append(this.scroll.render());
        }

        createCard(item) {
            const card = $(`
                <div class="kk-card-h selector">
                    <div class="kk-card-h-img">
                        ${item.thumb_url ? `<img src="${item.thumb_url}" alt="${item.name}">` : '<div class="kk-card-h-noposter">Không có ảnh</div>'}
                        ${item.quality ? `<div class="kk-card-q">${item.quality}</div>` : ''}
                        ${item.episode_current ? `<div class="kk-card-ep">${item.episode_current}</div>` : ''}
                    </div>
                    <div class="kk-card-h-body">
                        <div class="kk-card-name">${item.name}</div>
                        <div class="kk-card-origin">${item.origin_name || ''}</div>
                        <div class="kk-card-meta">
                            <span class="kk-card-year">${item.year || 'N/A'}</span>
                            <span class="kk-card-lang">${item.lang || 'Vietsub'}</span>
                        </div>
                    </div>
                </div>
            `);

            card.on('hover:focus', () => card.addClass('focus'));
            card.on('hover:blur', () => card.removeClass('focus'));
            card.on('hover:enter', () => {
                Lampa.Activity.push({
                    url: '',
                    title: item.name,
                    component: 'kkphim_detail',
                    slug: item.slug,
                    page: 1
                });
            });

            return card;
        }

        empty(msg) {
            const empty = Lampa.Template.get('list_empty');
            empty.find('.empty__descr').text(msg || 'Không có dữ liệu');
            this.scroll.append(empty);
            this.content.append(this.scroll.render());
        }

        start() {
            Lampa.Controller.add('content', {
                toggle: () => {
                    Lampa.Controller.collectionSet(this.scroll.render());
                    Lampa.Controller.collectionFocus(false, this.scroll.render());
                },
                left: () => {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                up: () => {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: () => {
                    Navigator.move('down');
                },
                right: () => {
                    Navigator.move('right');
                },
                back: () => {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        }

        pause() {}
        stop() {}
        render() { return this.content; }
        destroy() {}
    }

    // ===== DETAIL COMPONENT =====
    class KKPhimDetail extends Lampa.Component {
        constructor(object) {
            super(object);
            this.content = $('<div class="kk-detail-wrap"></div>');
            this.scroll = new Lampa.Scroll({ mask: true, over: true });
            this.slug = object.slug;
            this.movie = null;
            this.tmdb = null;
        }

        create() {
            loadCSS();
            this.activity.loader(true);
            this.loadMovie();
            return this.content;
        }

        loadMovie() {
            const url = `${API_BASE}/phim/${this.slug}`;
            request(url, (resp) => {
                if (resp && resp.movie) {
                    this.movie = resp.movie;
                    this.loadTMDB();
                } else {
                    this.activity.loader(false);
                    this.empty('Không tìm thấy phim');
                }
            }, () => {
                this.activity.loader(false);
                this.empty('Lỗi tải dữ liệu');
            });
        }

        loadTMDB() {
            getTMDBData(
                this.movie.origin_name || this.movie.name,
                this.movie.year,
                this.movie.type,
                (data) => {
                    this.tmdb = data;
                    this.activity.loader(false);
                    this.build();
                }
            );
        }

        build() {
            const html = $('<div></div>');

            // HERO with backdrop + logo
            html.append(this.createHero());

            // BODY
            const body = $('<div class="kk-body"></div>');
            
            // Directors & Cast
            if (this.tmdb && this.tmdb.credits) {
                body.append(this.createCrew());
                body.append(this.createCast());
            }

            // Description
            body.append(this.createDescription());

            // Actions (Play buttons)
            body.append(this.createActions());

            html.append(body);

            // Similar movies
            if (this.tmdb && this.tmdb.similar) {
                html.append(this.createSimilar());
            }

            this.scroll.append(html);
            this.content.append(this.scroll.render());
        }

        createHero() {
            const hero = $('<div class="kk-hero"></div>');
            const backdrop = this.tmdb?.details?.backdrop_path 
                ? `${TMDB_IMG}/original${this.tmdb.details.backdrop_path}`
                : this.movie.thumb_url || '';

            const backdropEl = $(`
                <div class="kk-hero-backdrop">
                    ${backdrop ? `<img src="${backdrop}" alt="">` : '<div class="kk-hero-backdrop-empty"></div>'}
                </div>
            `);

            const card = $('<div class="kk-hero-card"></div>');

            // Poster
            const posterWrap = $('<div class="kk-hero-poster-wrap"></div>');
            const poster = this.tmdb?.details?.poster_path
                ? `${TMDB_IMG}/w500${this.tmdb.details.poster_path}`
                : this.movie.poster_url || '';
            posterWrap.html(`<div class="kk-hero-poster"><img src="${poster}" alt=""></div>`);

            // Meta
            const meta = $('<div class="kk-hero-meta"></div>');

            // Logo (if exists)
            if (this.tmdb?.details?.belongs_to_collection?.logo_path) {
                const logo = `${TMDB_IMG}/w500${this.tmdb.details.belongs_to_collection.logo_path}`;
                meta.append(`<div class="kk-logo"><img src="${logo}" alt=""></div>`);
            } else {
                meta.append(`<h1 class="kk-title">${this.movie.name}</h1>`);
            }

            meta.append(`<div class="kk-origin">${this.movie.origin_name || ''}</div>`);

            // Year & Country
            const yc = $('<div class="kk-hm-yc"></div>');
            yc.append(`<span class="kk-hm-year">${this.movie.year || 'N/A'}</span>`);
            if (this.movie.country && this.movie.country.length > 0) {
                yc.append(`<span class="kk-hm-country">${this.movie.country[0].name}</span>`);
            }
            meta.append(yc);

            // Tagline
            if (this.tmdb?.details?.tagline) {
                meta.append(`<div class="kk-hm-tagline">${this.tmdb.details.tagline}</div>`);
            }

            // Badges
            const badges = $('<div class="kk-hm-badges"></div>');
            if (this.tmdb?.details?.vote_average) {
                const vote = this.tmdb.details.vote_average.toFixed(1);
                badges.append(`<div class="kk-hm-vote">${vote}<small>/10</small></div>`);
            }
            if (this.movie.time) {
                badges.append(`<div class="kk-hm-badge">${this.movie.time}</div>`);
            }
            if (this.movie.episode_current) {
                badges.append(`<div class="kk-hm-badge">${this.movie.episode_current}</div>`);
            }
            meta.append(badges);

            card.append(posterWrap);
            card.append(meta);
            hero.append(backdropEl);
            hero.append(card);

            return hero;
        }

        createCrew() {
            if (!this.tmdb?.credits?.crew) return '';
            const directors = this.tmdb.credits.crew.filter(c => c.job === 'Director');
            if (directors.length === 0) return '';

            const section = $('<div class="kk-section"></div>');
            section.append('<div class="kk-block-title">ĐẠO DIỄN</div>');

            const director = directors[0];
            const avatar = director.profile_path 
                ? `${TMDB_IMG}/w185${director.profile_path}`
                : '';

            const crew = $(`
                <div class="kk-crew">
                    <div class="kk-crew-avatar">
                        ${avatar ? `<img src="${avatar}" alt="">` : '<div class="kk-crew-avatar-empty"></div>'}
                    </div>
                    <div class="kk-crew-info">
                        <div class="kk-crew-label">Đạo diễn</div>
                        <div class="kk-crew-name">${director.name}</div>
                    </div>
                </div>
            `);

            section.append(crew);
            return section;
        }

        createCast() {
            if (!this.tmdb?.credits?.cast) return '';
            const cast = this.tmdb.credits.cast.slice(0, 10);
            if (cast.length === 0) return '';

            const section = $('<div class="kk-section"></div>');
            section.append('<div class="kk-block-title">DIỄN VIÊN</div>');

            const list = $('<div class="kk-cast-list"></div>');

            cast.forEach(person => {
                const img = person.profile_path
                    ? `${TMDB_IMG}/w185${person.profile_path}`
                    : '';

                const card = $(`
                    <div class="kk-cast-card selector">
                        <div class="kk-cast-img">
                            ${img ? `<img src="${img}" alt="">` : '<div class="kk-cast-empty"></div>'}
                        </div>
                        <div class="kk-cast-info">
                            <div class="kk-cast-name">${person.name}</div>
                            <div class="kk-cast-role">${person.character || ''}</div>
                        </div>
                    </div>
                `);

                card.on('hover:focus', () => card.addClass('focus'));
                card.on('hover:blur', () => card.removeClass('focus'));

                list.append(card);
            });

            section.append(list);
            return section;
        }

        createDescription() {
            const desc = this.tmdb?.details?.overview || this.movie.content || '';
            if (!desc) return '';

            return $(`
                <div class="kk-body-desc">
                    <div class="kk-body-desc-label">NỘI DUNG</div>
                    <div class="kk-body-desc-text">${desc}</div>
                </div>
            `);
        }

        createActions() {
            const actions = $('<div class="kk-actions"></div>');
            
            const playBtn = $(`
                <div class="kk-src-btn kk-src-btn--kkphim selector">
                    <div class="kk-sb-main">▶ Xem phim</div>
                    <div class="kk-sb-sub">KKPhim</div>
                </div>
            `);

            playBtn.on('hover:focus', () => playBtn.addClass('focus'));
            playBtn.on('hover:blur', () => playBtn.removeClass('focus'));
            playBtn.on('hover:enter', () => {
                this.playMovie();
            });

            actions.append(playBtn);
            return actions;
        }

        createSimilar() {
            const items = this.tmdb.similar?.results?.slice(0, 10) || [];
            if (items.length === 0) return '';

            const section = $('<div class="kk-section kk-section--last kk-similar"></div>');
            section.append('<div class="kk-block-title">PHIM TƯƠNG TỰ</div>');

            const list = $('<div class="kk-similar-list"></div>');

            items.forEach(item => {
                const poster = item.poster_path
                    ? `${TMDB_IMG}/w342${item.poster_path}`
                    : '';

                const card = $(`
                    <div class="kk-card selector">
                        <div class="kk-card-img">
                            ${poster ? `<img src="${poster}" alt="">` : '<div class="kk-card-noposter">N/A</div>'}
                        </div>
                        <div class="kk-card-body">
                            <div class="kk-card-name">${item.title || item.name}</div>
                            <div class="kk-card-meta">
                                <span class="kk-card-year">${(item.release_date || item.first_air_date || '').substring(0, 4)}</span>
                            </div>
                        </div>
                    </div>
                `);

                card.on('hover:focus', () => card.addClass('focus'));
                card.on('hover:blur', () => card.removeClass('focus'));

                list.append(card);
            });

            section.append(list);
            return section;
        }

        playMovie() {
            if (!this.movie.episodes || this.movie.episodes.length === 0) {
                Lampa.Noty.show('Không có tập phim');
                return;
            }

            const firstServer = this.movie.episodes[0];
            const firstEp = firstServer.server_data[0];

            if (!firstEp) {
                Lampa.Noty.show('Không tìm thấy link');
                return;
            }

            Lampa.Player.play({
                title: this.movie.name,
                url: firstEp.link_m3u8 || firstEp.link_embed
            });
        }

        empty(msg) {
            const empty = Lampa.Template.get('list_empty');
            empty.find('.empty__descr').text(msg);
            this.scroll.append(empty);
            this.content.append(this.scroll.render());
        }

        start() {
            Lampa.Controller.add('content', {
                toggle: () => {
                    Lampa.Controller.collectionSet(this.scroll.render());
                    Lampa.Controller.collectionFocus(false, this.scroll.render());
                },
                back: () => {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
        }

        pause() {}
        stop() {}
        render() { return this.content; }
        destroy() {}
    }

    // ===== REGISTER PLUGIN =====
    Lampa.Component.add('kkphim', KKPhimComponent);
    Lampa.Component.add('kkphim_detail', KKPhimDetail);

    // Menu item
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            Lampa.Settings.main().update();
            
            // Add menu
            const menuItem = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg></div><div class="menu__text">KKPhim</div></li>');
            
            menuItem.on('hover:enter', function() {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim',
                    type: 'phim-moi-cap-nhat',
                    page: 1
                });
            });

            $('.menu .menu__list').eq(0).append(menuItem);
        }
    });

    console.log('[KKPhim] Plugin loaded successfully!');

})();