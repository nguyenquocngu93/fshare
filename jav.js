(function () {
    'use strict';

    // ============== CẤU HÌNH ==============
    var CONFIG = {
        api_base: 'https://phimapi.com',
        img_base: 'https://phimimg.com/',
        name: 'KKPhim',
        logo: '🎬',
        cache_time: 1000 * 60 * 10, // 10 phút
        items_per_page: 24
    };

    // ============== STYLE ==============
    function addStyles() {
        if (document.getElementById('kkphim-styles')) return;

        var css = `
            /* ===== CARD BACKDROP STYLE ===== */
            .kkphim-card-wrap {
                position: relative;
                border-radius: 1em;
                overflow: hidden;
                background: #1a1a2e;
                cursor: pointer;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .kkphim-card-wrap:hover,
            .kkphim-card-wrap.focus {
                transform: scale(1.05);
                box-shadow: 0 0 0 3px #fff, 0 12px 40px rgba(0,0,0,0.6);
                z-index: 5;
            }

            /* Backdrop image */
            .kkphim-card__backdrop {
                width: 100%;
                aspect-ratio: 16/9;
                object-fit: cover;
                display: block;
                transition: opacity 0.3s;
            }

            /* Gradient overlay */
            .kkphim-card__overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 75%;
                background: linear-gradient(
                    0deg,
                    rgba(10, 10, 30, 0.95) 0%,
                    rgba(10, 10, 30, 0.7) 40%,
                    rgba(10, 10, 30, 0) 100%
                );
                pointer-events: none;
            }

            /* Info trên card */
            .kkphim-card__info {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 0.8em 1em;
                z-index: 2;
            }
            .kkphim-card__title {
                font-size: 1em;
                font-weight: 700;
                color: #fff;
                margin: 0 0 0.2em 0;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-shadow: 0 2px 8px rgba(0,0,0,0.8);
            }
            .kkphim-card__sub {
                font-size: 0.75em;
                color: rgba(255,255,255,0.7);
                margin: 0;
                display: -webkit-box;
                -webkit-line-clamp: 1;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            /* Badges */
            .kkphim-card__badges {
                position: absolute;
                top: 0.6em;
                left: 0.6em;
                right: 0.6em;
                display: flex;
                justify-content: space-between;
                z-index: 3;
                pointer-events: none;
            }
            .kkphim-badge {
                padding: 0.2em 0.6em;
                border-radius: 0.4em;
                font-size: 0.7em;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.03em;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
            }
            .kkphim-badge--quality {
                background: rgba(255, 68, 68, 0.85);
                color: #fff;
            }
            .kkphim-badge--lang {
                background: rgba(33, 150, 243, 0.85);
                color: #fff;
            }
            .kkphim-badge--year {
                background: rgba(255, 193, 7, 0.85);
                color: #000;
            }
            .kkphim-badge--ep {
                background: rgba(76, 175, 80, 0.85);
                color: #fff;
            }

            /* ===== DETAIL PAGE ===== */
            .kkphim-detail {
                position: relative;
                min-height: 100%;
            }
            .kkphim-detail__hero {
                position: relative;
                width: 100%;
                height: 60vh;
                min-height: 350px;
                overflow: hidden;
            }
            .kkphim-detail__hero-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .kkphim-detail__hero-gradient {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 80%;
                background: linear-gradient(
                    0deg,
                    var(--lampa-background, #0a0a1e) 0%,
                    rgba(10,10,30,0.8) 50%,
                    transparent 100%
                );
            }
            .kkphim-detail__content {
                position: relative;
                margin-top: -8em;
                padding: 0 2em 2em;
                z-index: 2;
                display: flex;
                gap: 2em;
            }
            .kkphim-detail__poster {
                flex-shrink: 0;
                width: 200px;
                border-radius: 1em;
                overflow: hidden;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            }
            .kkphim-detail__poster img {
                width: 100%;
                display: block;
            }
            .kkphim-detail__meta {
                flex: 1;
                min-width: 0;
            }
            .kkphim-detail__title {
                font-size: 2em;
                font-weight: 800;
                color: #fff;
                margin: 0 0 0.2em 0;
                text-shadow: 0 2px 12px rgba(0,0,0,0.6);
            }
            .kkphim-detail__original {
                font-size: 1.1em;
                color: rgba(255,255,255,0.5);
                margin: 0 0 1em 0;
                font-style: italic;
            }
            .kkphim-detail__tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                margin-bottom: 1em;
            }
            .kkphim-detail__tag {
                padding: 0.3em 0.8em;
                border-radius: 2em;
                font-size: 0.8em;
                font-weight: 600;
                background: rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.8);
                border: 1px solid rgba(255,255,255,0.15);
            }
            .kkphim-detail__desc {
                font-size: 0.95em;
                color: rgba(255,255,255,0.75);
                line-height: 1.7;
                margin: 1em 0;
                max-height: 8em;
                overflow-y: auto;
            }
            .kkphim-detail__info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 0.8em;
                margin: 1em 0;
            }
            .kkphim-detail__info-item {
                display: flex;
                align-items: center;
                gap: 0.5em;
                font-size: 0.85em;
                color: rgba(255,255,255,0.7);
            }
            .kkphim-detail__info-item span:first-child {
                color: rgba(255,255,255,0.4);
                min-width: 70px;
            }

            /* ===== EPISODE LIST ===== */
            .kkphim-episodes {
                padding: 1em 2em;
            }
            .kkphim-episodes__server {
                margin-bottom: 1.5em;
            }
            .kkphim-episodes__server-name {
                font-size: 1em;
                color: rgba(255,255,255,0.6);
                margin-bottom: 0.8em;
                padding-bottom: 0.4em;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .kkphim-episodes__list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
            }
            .kkphim-episode-btn {
                padding: 0.5em 1em;
                border-radius: 0.6em;
                background: rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.85);
                border: 1px solid rgba(255,255,255,0.1);
                cursor: pointer;
                font-size: 0.85em;
                font-weight: 600;
                transition: all 0.2s;
                min-width: 3em;
                text-align: center;
            }
            .kkphim-episode-btn:hover,
            .kkphim-episode-btn.focus {
                background: rgba(255, 68, 68, 0.8);
                border-color: rgba(255, 68, 68, 1);
                color: #fff;
                transform: scale(1.08);
            }

            /* ===== BUTTONS ===== */
            .kkphim-btn-play {
                display: inline-flex;
                align-items: center;
                gap: 0.5em;
                padding: 0.7em 1.8em;
                border-radius: 2em;
                background: linear-gradient(135deg, #e53935, #ff5252);
                color: #fff;
                font-size: 1em;
                font-weight: 700;
                border: none;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 20px rgba(229, 57, 53, 0.4);
                margin-right: 0.8em;
            }
            .kkphim-btn-play:hover,
            .kkphim-btn-play.focus {
                transform: scale(1.06);
                box-shadow: 0 6px 28px rgba(229, 57, 53, 0.6);
            }
            .kkphim-btn-bookmark {
                display: inline-flex;
                align-items: center;
                gap: 0.5em;
                padding: 0.7em 1.5em;
                border-radius: 2em;
                background: rgba(255,255,255,0.1);
                color: #fff;
                font-size: 1em;
                font-weight: 600;
                border: 1px solid rgba(255,255,255,0.2);
                cursor: pointer;
                transition: all 0.3s;
            }
            .kkphim-btn-bookmark:hover,
            .kkphim-btn-bookmark.focus {
                background: rgba(255,255,255,0.2);
                transform: scale(1.06);
            }

            /* ===== CATEGORY GRID ===== */
            .kkphim-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 1.2em;
                padding: 1em;
            }

            /* ===== SECTION HEADER ===== */
            .kkphim-section {
                padding: 0.5em 1em;
            }
            .kkphim-section__title {
                font-size: 1.3em;
                font-weight: 700;
                color: #fff;
                margin: 0 0 0.8em 0;
                display: flex;
                align-items: center;
                gap: 0.5em;
            }
            .kkphim-section__title::before {
                content: '';
                width: 4px;
                height: 1.2em;
                background: linear-gradient(180deg, #e53935, #ff5252);
                border-radius: 2px;
            }

            /* ===== SCROLL ROW ===== */
            .kkphim-scroll-row {
                display: flex;
                gap: 1em;
                overflow-x: auto;
                padding: 0.5em 1em 1em;
                scroll-behavior: smooth;
                -webkit-overflow-scrolling: touch;
            }
            .kkphim-scroll-row::-webkit-scrollbar {
                height: 4px;
            }
            .kkphim-scroll-row::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.05);
                border-radius: 2px;
            }
            .kkphim-scroll-row::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.15);
                border-radius: 2px;
            }
            .kkphim-scroll-row .kkphim-card-wrap {
                flex-shrink: 0;
                width: 300px;
            }

            /* ===== LOADING ===== */
            .kkphim-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 3em;
            }
            .kkphim-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255,255,255,0.1);
                border-top-color: #e53935;
                border-radius: 50%;
                animation: kkphim-spin 0.8s linear infinite;
            }
            @keyframes kkphim-spin {
                to { transform: rotate(360deg); }
            }

            /* ===== SEARCH ===== */
            .kkphim-empty {
                text-align: center;
                padding: 4em 2em;
                color: rgba(255,255,255,0.4);
                font-size: 1.1em;
            }
            .kkphim-empty__icon {
                font-size: 3em;
                margin-bottom: 0.5em;
            }

            /* ===== PAGINATION ===== */
            .kkphim-pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 0.5em;
                padding: 1.5em;
            }
            .kkphim-page-btn {
                padding: 0.5em 1em;
                border-radius: 0.5em;
                background: rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.7);
                border: 1px solid rgba(255,255,255,0.1);
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.2s;
            }
            .kkphim-page-btn:hover,
            .kkphim-page-btn.focus {
                background: rgba(255, 68, 68, 0.7);
                color: #fff;
            }
            .kkphim-page-btn.active {
                background: #e53935;
                color: #fff;
                border-color: #e53935;
            }

            /* ===== NAV MENU ===== */
            .kkphim-nav {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                padding: 1em;
            }
            .kkphim-nav__item {
                padding: 0.5em 1.2em;
                border-radius: 2em;
                background: rgba(255,255,255,0.06);
                color: rgba(255,255,255,0.7);
                font-size: 0.85em;
                cursor: pointer;
                transition: all 0.2s;
                border: 1px solid rgba(255,255,255,0.08);
            }
            .kkphim-nav__item:hover,
            .kkphim-nav__item.focus,
            .kkphim-nav__item.active {
                background: rgba(229, 57, 53, 0.8);
                color: #fff;
                border-color: rgba(229, 57, 53, 1);
            }
        `;

        var style = document.createElement('style');
        style.id = 'kkphim-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ============== API ==============
    var API = {
        cache: {},

        request: function (url, callback, errorCallback) {
            var cached = this.cache[url];
            if (cached && Date.now() - cached.time < CONFIG.cache_time) {
                callback(cached.data);
                return;
            }

            var self = this;
            $.ajax({
                url: url,
                timeout: 15000,
                dataType: 'json',
                success: function (data) {
                    self.cache[url] = { data: data, time: Date.now() };
                    callback(data);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error('KKPhim API Error:', url, textStatus, errorThrown);
                    if (errorCallback) errorCallback(textStatus);
                }
            });
        },

        // Phim mới cập nhật
        getNewMovies: function (page, callback) {
            var url = CONFIG.api_base + '/danh-sach/phim-moi-cap-nhat?page=' + (page || 1);
            this.request(url, function (data) {
                callback(data);
            });
        },

        // Danh sách phim theo loại
        getList: function (type, page, callback) {
            var url = CONFIG.api_base + '/v1/api/danh-sach/' + type + '?page=' + (page || 1);
            this.request(url, function (data) {
                callback(data);
            });
        },

        // Chi tiết phim
        getDetail: function (slug, callback) {
            var url = CONFIG.api_base + '/phim/' + slug;
            this.request(url, function (data) {
                callback(data);
            });
        },

        // Tìm kiếm
        search: function (keyword, page, callback) {
            var url = CONFIG.api_base + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&page=' + (page || 1);
            this.request(url, function (data) {
                callback(data);
            });
        },

        // Phim theo thể loại
        getByCategory: function (slug, page, callback) {
            var url = CONFIG.api_base + '/v1/api/the-loai/' + slug + '?page=' + (page || 1);
            this.request(url, function (data) {
                callback(data);
            });
        },

        // Phim theo quốc gia
        getByCountry: function (slug, page, callback) {
            var url = CONFIG.api_base + '/v1/api/quoc-gia/' + slug + '?page=' + (page || 1);
            this.request(url, function (data) {
                callback(data);
            });
        },

        // Lấy danh sách thể loại
        getCategories: function (callback) {
            var url = CONFIG.api_base + '/the-loai';
            this.request(url, function (data) {
                callback(data);
            });
        },

        // Lấy danh sách quốc gia
        getCountries: function (callback) {
            var url = CONFIG.api_base + '/quoc-gia';
            this.request(url, function (data) {
                callback(data);
            });
        },

        // Xây dựng URL ảnh
        imgUrl: function (path) {
            if (!path) return '';
            if (path.startsWith('http')) return path;
            return CONFIG.img_base + path;
        }
    };

    // ============== UI COMPONENTS ==============
    var UI = {
        // Tạo card phim với backdrop
        createCard: function (item, isFromV1Api) {
            var name = '', originName = '', slug = '', year = '', quality = '', lang = '', thumbUrl = '', posterUrl = '', episodeCurrent = '', type = '';

            if (isFromV1Api) {
                name = item.name || '';
                originName = item.origin_name || '';
                slug = item.slug || '';
                year = item.year || '';
                quality = item.quality || '';
                lang = item.lang || '';
                thumbUrl = API.imgUrl(item.thumb_url);
                posterUrl = API.imgUrl(item.poster_url);
                episodeCurrent = item.episode_current || '';
                type = item.type || '';
            } else {
                name = item.name || '';
                originName = item.origin_name || '';
                slug = item.slug || '';
                year = item.year || '';
                quality = item.quality || '';
                lang = item.lang || '';
                thumbUrl = item.thumb_url ? API.imgUrl(item.thumb_url) : '';
                posterUrl = item.poster_url ? API.imgUrl(item.poster_url) : '';
                episodeCurrent = item.episode_current || '';
                type = item.type || '';
            }

            // Dùng poster_url cho backdrop (thường là 16:9), thumb_url nếu không có
            var backdropUrl = posterUrl || thumbUrl;

            var html = '<div class="kkphim-card-wrap selector" data-slug="' + slug + '">';

            // Badges
            html += '<div class="kkphim-card__badges">';
            html += '<div style="display:flex;gap:0.3em;">';
            if (quality) html += '<span class="kkphim-badge kkphim-badge--quality">' + quality + '</span>';
            if (lang) html += '<span class="kkphim-badge kkphim-badge--lang">' + lang + '</span>';
            html += '</div>';
            html += '<div style="display:flex;gap:0.3em;">';
            if (year) html += '<span class="kkphim-badge kkphim-badge--year">' + year + '</span>';
            if (episodeCurrent) html += '<span class="kkphim-badge kkphim-badge--ep">' + episodeCurrent + '</span>';
            html += '</div>';
            html += '</div>';

            // Backdrop image
            html += '<img class="kkphim-card__backdrop" src="' + backdropUrl + '" alt="' + name + '" loading="lazy" onerror="this.src=\'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 9%22><rect fill=%22%231a1a2e%22 width=%2216%22 height=%229%22/><text x=%228%22 y=%225%22 text-anchor=%22middle%22 fill=%22%23333%22 font-size=%222%22>🎬</text></svg>\'">';

            // Gradient overlay
            html += '<div class="kkphim-card__overlay"></div>';

            // Info
            html += '<div class="kkphim-card__info">';
            html += '<p class="kkphim-card__title">' + name + '</p>';
            if (originName) html += '<p class="kkphim-card__sub">' + originName + '</p>';
            html += '</div>';

            html += '</div>';
            return html;
        },

        // Tạo loading spinner
        createLoading: function () {
            return '<div class="kkphim-loading"><div class="kkphim-spinner"></div></div>';
        },

        // Tạo thông báo trống
        createEmpty: function (message) {
            return '<div class="kkphim-empty"><div class="kkphim-empty__icon">🔍</div><div>' + (message || 'Không tìm thấy kết quả') + '</div></div>';
        },

        // Tạo pagination
        createPagination: function (currentPage, totalPages) {
            if (totalPages <= 1) return '';

            var html = '<div class="kkphim-pagination">';
            if (currentPage > 1) {
                html += '<div class="kkphim-page-btn selector" data-page="' + (currentPage - 1) + '">◀ Trước</div>';
            }

            var startPage = Math.max(1, currentPage - 2);
            var endPage = Math.min(totalPages, currentPage + 2);

            if (startPage > 1) {
                html += '<div class="kkphim-page-btn selector" data-page="1">1</div>';
                if (startPage > 2) html += '<span style="color:rgba(255,255,255,0.3)">...</span>';
            }

            for (var i = startPage; i <= endPage; i++) {
                html += '<div class="kkphim-page-btn selector' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</div>';
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) html += '<span style="color:rgba(255,255,255,0.3)">...</span>';
                html += '<div class="kkphim-page-btn selector" data-page="' + totalPages + '">' + totalPages + '</div>';
            }

            if (currentPage < totalPages) {
                html += '<div class="kkphim-page-btn selector" data-page="' + (currentPage + 1) + '">Sau ▶</div>';
            }

            html += '</div>';
            return html;
        }
    };

    // ============== PAGES ==============

    // --- Trang chủ ---
    function pageHome(render) {
        var html = '';

        // Menu danh mục
        var categories = [
            { name: '🎬 Phim Mới', action: 'new' },
            { name: '🎥 Phim Lẻ', action: 'list', slug: 'phim-le' },
            { name: '📺 Phim Bộ', action: 'list', slug: 'phim-bo' },
            { name: '🎭 Hoạt Hình', action: 'list', slug: 'hoat-hinh' },
            { name: '📡 TV Shows', action: 'list', slug: 'tv-shows' },
            { name: '🏷️ Thể Loại', action: 'categories' },
            { name: '🌍 Quốc Gia', action: 'countries' },
            { name: '🔍 Tìm Kiếm', action: 'search' }
        ];

        html += '<div class="kkphim-nav">';
        categories.forEach(function (cat) {
            html += '<div class="kkphim-nav__item selector" data-action="' + cat.action + '"' + (cat.slug ? ' data-slug="' + cat.slug + '"' : '') + '>' + cat.name + '</div>';
        });
        html += '</div>';

        html += '<div id="kkphim-home-content">' + UI.createLoading() + '</div>';

        render(html);

        // Load nội dung trang chủ
        loadHomeContent();
    }

    function loadHomeContent() {
        var container = document.getElementById('kkphim-home-content');
        if (!container) return;

        var sectionsLoaded = 0;
        var totalSections = 4;
        var sectionsHtml = { new: '', single: '', series: '', anime: '' };

        function checkDone() {
            sectionsLoaded++;
            if (sectionsLoaded >= totalSections) {
                var h = '';

                if (sectionsHtml.new) {
                    h += '<div class="kkphim-section"><div class="kkphim-section__title">Phim Mới Cập Nhật</div></div>';
                    h += '<div class="kkphim-scroll-row">' + sectionsHtml.new + '</div>';
                }
                if (sectionsHtml.single) {
                    h += '<div class="kkphim-section"><div class="kkphim-section__title">Phim Lẻ</div></div>';
                    h += '<div class="kkphim-scroll-row">' + sectionsHtml.single + '</div>';
                }
                if (sectionsHtml.series) {
                    h += '<div class="kkphim-section"><div class="kkphim-section__title">Phim Bộ</div></div>';
                    h += '<div class="kkphim-scroll-row">' + sectionsHtml.series + '</div>';
                }
                if (sectionsHtml.anime) {
                    h += '<div class="kkphim-section"><div class="kkphim-section__title">Hoạt Hình</div></div>';
                    h += '<div class="kkphim-scroll-row">' + sectionsHtml.anime + '</div>';
                }

                container.innerHTML = h;
                bindCardEvents();
            }
        }

        // Phim mới
        API.getNewMovies(1, function (data) {
            if (data && data.items) {
                data.items.slice(0, 12).forEach(function (item) {
                    sectionsHtml.new += UI.createCard(item, false);
                });
            }
            checkDone();
        });

        // Phim lẻ
        API.getList('phim-le', 1, function (data) {
            if (data && data.data && data.data.items) {
                data.data.items.slice(0, 12).forEach(function (item) {
                    sectionsHtml.single += UI.createCard(item, true);
                });
            }
            checkDone();
        });

        // Phim bộ
        API.getList('phim-bo', 1, function (data) {
            if (data && data.data && data.data.items) {
                data.data.items.slice(0, 12).forEach(function (item) {
                    sectionsHtml.series += UI.createCard(item, true);
                });
            }
            checkDone();
        });

        // Hoạt hình
        API.getList('hoat-hinh', 1, function (data) {
            if (data && data.data && data.data.items) {
                data.data.items.slice(0, 12).forEach(function (item) {
                    sectionsHtml.anime += UI.createCard(item, true);
                });
            }
            checkDone();
        });
    }

    // --- Trang danh sách ---
    function pageList(slug, page, title, render) {
        render(UI.createLoading());

        API.getList(slug, page || 1, function (data) {
            if (!data || !data.data || !data.data.items || data.data.items.length === 0) {
                render(UI.createEmpty());
                return;
            }

            var items = data.data.items;
            var params = data.data.params || {};
            var totalPages = Math.ceil((params.pagination && params.pagination.totalItems || 0) / (params.pagination && params.pagination.totalItemsPerPage || 24)) || 1;
            var currentPage = parseInt(params.pagination && params.pagination.currentPage) || page || 1;

            var html = '<div class="kkphim-section"><div class="kkphim-section__title">' + (title || slug) + '</div></div>';
            html += '<div class="kkphim-grid">';
            items.forEach(function (item) {
                html += UI.createCard(item, true);
            });
            html += '</div>';
            html += UI.createPagination(currentPage, totalPages);

            render(html);
            bindCardEvents();
            bindPaginationEvents(function (p) {
                pageList(slug, p, title, render);
            });
        });
    }

    // --- Trang phim mới ---
    function pageNew(page, render) {
        render(UI.createLoading());

        API.getNewMovies(page || 1, function (data) {
            if (!data || !data.items || data.items.length === 0) {
                render(UI.createEmpty());
                return;
            }

            var items = data.items;
            var totalPages = data.pagination ? data.pagination.totalPages : 1;
            var currentPage = data.pagination ? data.pagination.currentPage : page || 1;

            var html = '<div class="kkphim-section"><div class="kkphim-section__title">Phim Mới Cập Nhật</div></div>';
            html += '<div class="kkphim-grid">';
            items.forEach(function (item) {
                html += UI.createCard(item, false);
            });
            html += '</div>';
            html += UI.createPagination(currentPage, totalPages);

            render(html);
            bindCardEvents();
            bindPaginationEvents(function (p) {
                pageNew(p, render);
            });
        });
    }

    // --- Trang chi tiết phim ---
    function pageDetail(slug, render) {
        render(UI.createLoading());

        API.getDetail(slug, function (data) {
            if (!data || !data.movie) {
                render(UI.createEmpty('Không tìm thấy phim'));
                return;
            }

            var movie = data.movie;
            var episodes = data.episodes || [];

            var backdropUrl = API.imgUrl(movie.poster_url || movie.thumb_url);
            var thumbUrl = API.imgUrl(movie.thumb_url || movie.poster_url);

            var html = '<div class="kkphim-detail">';

            // Hero backdrop
            html += '<div class="kkphim-detail__hero">';
            html += '<img class="kkphim-detail__hero-img" src="' + backdropUrl + '" onerror="this.style.display=\'none\'">';
            html += '<div class="kkphim-detail__hero-gradient"></div>';
            html += '</div>';

            // Content
            html += '<div class="kkphim-detail__content">';

            // Poster
            html += '<div class="kkphim-detail__poster">';
            html += '<img src="' + thumbUrl + '" alt="' + (movie.name || '') + '">';
            html += '</div>';

            // Meta info
            html += '<div class="kkphim-detail__meta">';
            html += '<h1 class="kkphim-detail__title">' + (movie.name || '') + '</h1>';
            if (movie.origin_name) html += '<p class="kkphim-detail__original">' + movie.origin_name + '</p>';

            // Tags
            html += '<div class="kkphim-detail__tags">';
            if (movie.quality) html += '<span class="kkphim-detail__tag" style="background:rgba(229,57,53,0.3);border-color:rgba(229,57,53,0.5)">' + movie.quality + '</span>';
            if (movie.lang) html += '<span class="kkphim-detail__tag" style="background:rgba(33,150,243,0.3);border-color:rgba(33,150,243,0.5)">' + movie.lang + '</span>';
            if (movie.year) html += '<span class="kkphim-detail__tag">' + movie.year + '</span>';
            if (movie.episode_current) html += '<span class="kkphim-detail__tag" style="background:rgba(76,175,80,0.3);border-color:rgba(76,175,80,0.5)">' + movie.episode_current + '</span>';
            if (movie.category && movie.category.length) {
                movie.category.forEach(function (cat) {
                    html += '<span class="kkphim-detail__tag">' + cat.name + '</span>';
                });
            }
            html += '</div>';

            // Buttons
            html += '<div style="margin:1em 0">';
            if (episodes.length > 0 && episodes[0].server_data && episodes[0].server_data.length > 0) {
                var firstEp = episodes[0].server_data[0];
                html += '<button class="kkphim-btn-play selector" data-link="' + (firstEp.link_m3u8 || firstEp.link_embed || '') + '" data-name="' + (movie.name || '') + '">▶ Xem Phim</button>';
            }
            html += '<button class="kkphim-btn-bookmark selector" data-slug="' + slug + '">♡ Yêu Thích</button>';
            html += '</div>';

            // Info grid
            html += '<div class="kkphim-detail__info-grid">';
            if (movie.time) html += '<div class="kkphim-detail__info-item"><span>Thời lượng</span><span>' + movie.time + '</span></div>';
            if (movie.episode_total) html += '<div class="kkphim-detail__info-item"><span>Số tập</span><span>' + movie.episode_total + '</span></div>';
            if (movie.status) html += '<div class="kkphim-detail__info-item"><span>Trạng thái</span><span>' + movie.status + '</span></div>';
            if (movie.country && movie.country.length) html += '<div class="kkphim-detail__info-item"><span>Quốc gia</span><span>' + movie.country.map(function (c) { return c.name; }).join(', ') + '</span></div>';
            if (movie.actor && movie.actor.length && movie.actor[0] !== '') html += '<div class="kkphim-detail__info-item"><span>Diễn viên</span><span>' + movie.actor.slice(0, 5).join(', ') + '</span></div>';
            if (movie.director && movie.director.length && movie.director[0] !== '') html += '<div class="kkphim-detail__info-item"><span>Đạo diễn</span><span>' + movie.director.join(', ') + '</span></div>';
            html += '</div>';

            // Description
            if (movie.content) {
                var desc = movie.content.replace(/<[^>]*>/g, '');
                html += '<div class="kkphim-detail__desc">' + desc + '</div>';
            }

            html += '</div>'; // meta
            html += '</div>'; // content

            // Episodes
            if (episodes.length > 0) {
                html += '<div class="kkphim-episodes">';
                html += '<div class="kkphim-section__title">Danh Sách Tập</div>';

                episodes.forEach(function (server) {
                    if (!server.server_data || server.server_data.length === 0) return;

                    html += '<div class="kkphim-episodes__server">';
                    html += '<div class="kkphim-episodes__server-name">' + (server.server_name || 'Server') + '</div>';
                    html += '<div class="kkphim-episodes__list">';

                    server.server_data.forEach(function (ep) {
                        var epName = ep.name || ep.slug || '';
                        var epLink = ep.link_m3u8 || ep.link_embed || '';
                        html += '<div class="kkphim-episode-btn selector" data-link="' + epLink + '" data-name="' + (movie.name || '') + ' - ' + epName + '">' + epName + '</div>';
                    });

                    html += '</div>';
                    html += '</div>';
                });

                html += '</div>';
            }

            html += '</div>'; // detail

            render(html);
            bindDetailEvents();
        });
    }

    // --- Trang tìm kiếm ---
    function pageSearch(keyword, page, render) {
        if (!keyword) {
            // Hiện form tìm kiếm
            if (typeof Lampa !== 'undefined' && Lampa.Input) {
                Lampa.Input.edit({
                    title: 'Tìm kiếm phim',
                    value: '',
                    free: true
                }, function (newValue) {
                    if (newValue) {
                        pageSearch(newValue, 1, render);
                    }
                });
            } else {
                var kw = prompt('Nhập tên phim cần tìm:');
                if (kw) pageSearch(kw, 1, render);
            }
            return;
        }

        render(UI.createLoading());

        API.search(keyword, page || 1, function (data) {
            if (!data || !data.data || !data.data.items || data.data.items.length === 0) {
                render(UI.createEmpty('Không tìm thấy "' + keyword + '"'));
                return;
            }

            var items = data.data.items;
            var params = data.data.params || {};
            var totalPages = Math.ceil((params.pagination && params.pagination.totalItems || 0) / (params.pagination && params.pagination.totalItemsPerPage || 24)) || 1;
            var currentPage = parseInt(params.pagination && params.pagination.currentPage) || page || 1;

            var html = '<div class="kkphim-section"><div class="kkphim-section__title">Kết quả: "' + keyword + '"</div></div>';
            html += '<div class="kkphim-grid">';
            items.forEach(function (item) {
                html += UI.createCard(item, true);
            });
            html += '</div>';
            html += UI.createPagination(currentPage, totalPages);

            render(html);
            bindCardEvents();
            bindPaginationEvents(function (p) {
                pageSearch(keyword, p, render);
            });
        });
    }

    // --- Trang thể loại ---
    function pageCategories(render) {
        render(UI.createLoading());

        API.getCategories(function (data) {
            var items = data;
            if (data && data.data) items = data.data;
            if (!Array.isArray(items) || items.length === 0) {
                // Fallback danh sách thể loại
                items = [
                    { slug: 'hanh-dong', name: 'Hành Động' },
                    { slug: 'tinh-cam', name: 'Tình Cảm' },
                    { slug: 'hai-huoc', name: 'Hài Hước' },
                    { slug: 'co-trang', name: 'Cổ Trang' },
                    { slug: 'tam-ly', name: 'Tâm Lý' },
                    { slug: 'hinh-su', name: 'Hình Sự' },
                    { slug: 'chien-tranh', name: 'Chiến Tranh' },
                    { slug: 'the-thao', name: 'Thể Thao' },
                    { slug: 'vo-thuat', name: 'Võ Thuật' },
                    { slug: 'vien-tuong', name: 'Viễn Tưởng' },
                    { slug: 'phieu-luu', name: 'Phiêu Lưu' },
                    { slug: 'khoa-hoc', name: 'Khoa Học' },
                    { slug: 'kinh-di', name: 'Kinh Dị' },
                    { slug: 'am-nhac', name: 'Âm Nhạc' },
                    { slug: 'than-thoai', name: 'Thần Thoại' },
                    { slug: 'tai-lieu', name: 'Tài Liệu' },
                    { slug: 'gia-dinh', name: 'Gia Đình' },
                    { slug: 'chinh-kich', name: 'Chính Kịch' },
                    { slug: 'bi-an', name: 'Bí Ẩn' },
                    { slug: 'hoc-duong', name: 'Học Đường' },
                    { slug: 'kinh-dien', name: 'Kinh Điển' },
                    { slug: 'phim-18', name: 'Phim 18+' }
                ];
            }

            var html = '<div class="kkphim-section"><div class="kkphim-section__title">Thể Loại Phim</div></div>';
            html += '<div class="kkphim-nav">';
            items.forEach(function (cat) {
                html += '<div class="kkphim-nav__item selector" data-action="category" data-slug="' + cat.slug + '">' + cat.name + '</div>';
            });
            html += '</div>';

            render(html);
            bindNavEvents(render);
        });
    }

    // --- Trang quốc gia ---
    function pageCountries(render) {
        render(UI.createLoading());

        API.getCountries(function (data) {
            var items = data;
            if (data && data.data) items = data.data;
            if (!Array.isArray(items) || items.length === 0) {
                items = [
                    { slug: 'trung-quoc', name: 'Trung Quốc' },
                    { slug: 'han-quoc', name: 'Hàn Quốc' },
                    { slug: 'nhat-ban', name: 'Nhật Bản' },
                    { slug: 'thai-lan', name: 'Thái Lan' },
                    { slug: 'au-my', name: 'Âu Mỹ' },
                    { slug: 'dai-loan', name: 'Đài Loan' },
                    { slug: 'hong-kong', name: 'Hồng Kông' },
                    { slug: 'an-do', name: 'Ấn Độ' },
                    { slug: 'anh', name: 'Anh' },
                    { slug: 'phap', name: 'Pháp' },
                    { slug: 'canada', name: 'Canada' },
                    { slug: 'duc', name: 'Đức' },
                    { slug: 'tay-ban-nha', name: 'Tây Ban Nha' },
                    { slug: 'viet-nam', name: 'Việt Nam' },
                    { slug: 'philippines', name: 'Philippines' }
                ];
            }

            var html = '<div class="kkphim-section"><div class="kkphim-section__title">Quốc Gia</div></div>';
            html += '<div class="kkphim-nav">';
            items.forEach(function (country) {
                html += '<div class="kkphim-nav__item selector" data-action="country" data-slug="' + country.slug + '">' + country.name + '</div>';
            });
            html += '</div>';

            render(html);
            bindNavEvents(render);
        });
    }

    // --- Trang phim theo thể loại ---
    function pageCategoryList(slug, page, render) {
        render(UI.createLoading());

        API.getByCategory(slug, page || 1, function (data) {
            if (!data || !data.data || !data.data.items || data.data.items.length === 0) {
                render(UI.createEmpty());
                return;
            }

            var items = data.data.items;
            var params = data.data.params || {};
            var titleText = data.data.titlePage || slug;
            var totalPages = Math.ceil((params.pagination && params.pagination.totalItems || 0) / (params.pagination && params.pagination.totalItemsPerPage || 24)) || 1;
            var currentPage = parseInt(params.pagination && params.pagination.currentPage) || page || 1;

            var html = '<div class="kkphim-section"><div class="kkphim-section__title">' + titleText + '</div></div>';
            html += '<div class="kkphim-grid">';
            items.forEach(function (item) {
                html += UI.createCard(item, true);
            });
            html += '</div>';
            html += UI.createPagination(currentPage, totalPages);

            render(html);
            bindCardEvents();
            bindPaginationEvents(function (p) {
                pageCategoryList(slug, p, render);
            });
        });
    }

    // --- Trang phim theo quốc gia ---
    function pageCountryList(slug, page, render) {
        render(UI.createLoading());

        API.getByCountry(slug, page || 1, function (data) {
            if (!data || !data.data || !data.data.items || data.data.items.length === 0) {
                render(UI.createEmpty());
                return;
            }

            var items = data.data.items;
            var params = data.data.params || {};
            var titleText = data.data.titlePage || slug;
            var totalPages = Math.ceil((params.pagination && params.pagination.totalItems || 0) / (params.pagination && params.pagination.totalItemsPerPage || 24)) || 1;
            var currentPage = parseInt(params.pagination && params.pagination.currentPage) || page || 1;

            var html = '<div class="kkphim-section"><div class="kkphim-section__title">' + titleText + '</div></div>';
            html += '<div class="kkphim-grid">';
            items.forEach(function (item) {
                html += UI.createCard(item, true);
            });
            html += '</div>';
            html += UI.createPagination(currentPage, totalPages);

            render(html);
            bindCardEvents();
            bindPaginationEvents(function (p) {
                pageCountryList(slug, p, render);
            });
        });
    }

    // ============== EVENT BINDING ==============

    function bindCardEvents() {
        $(document).off('click.kkphim-card').on('click.kkphim-card', '.kkphim-card-wrap', function () {
            var slug = $(this).data('slug');
            if (slug) {
                openDetail(slug);
            }
        });
    }

    function bindDetailEvents() {
        // Play button
        $(document).off('click.kkphim-play').on('click.kkphim-play', '.kkphim-btn-play, .kkphim-episode-btn', function () {
            var link = $(this).data('link');
            var name = $(this).data('name');
            if (link) {
                playVideo(link, name);
            }
        });

        // Bookmark button
        $(document).off('click.kkphim-bookmark').on('click.kkphim-bookmark', '.kkphim-btn-bookmark', function () {
            var slug = $(this).data('slug');
            if (typeof Lampa !== 'undefined' && Lampa.Noty) {
                Lampa.Noty.show('Đã thêm vào yêu thích ♥');
            }
        });
    }

    function bindPaginationEvents(callback) {
        $(document).off('click.kkphim-page').on('click.kkphim-page', '.kkphim-page-btn', function () {
            var page = parseInt($(this).data('page'));
            if (page && callback) {
                window.scrollTo(0, 0);
                callback(page);
            }
        });
    }

    function bindNavEvents(render) {
        $(document).off('click.kkphim-nav').on('click.kkphim-nav', '.kkphim-nav__item', function () {
            var action = $(this).data('action');
            var slug = $(this).data('slug');

            switch (action) {
                case 'new':
                    openPage('new');
                    break;
                case 'list':
                    openPage('list', { slug: slug });
                    break;
                case 'categories':
                    openPage('categories');
                    break;
                case 'countries':
                    openPage('countries');
                    break;
                case 'search':
                    openPage('search');
                    break;
                case 'category':
                    openPage('categoryList', { slug: slug });
                    break;
                case 'country':
                    openPage('countryList', { slug: slug });
                    break;
            }
        });
    }

    // ============== NAVIGATION ==============

    function openDetail(slug) {
        if (typeof Lampa !== 'undefined' && Lampa.Activity) {
            Lampa.Activity.push({
                component: 'kkphim_detail',
                slug: slug
            });
        }
    }

    function openPage(page, params) {
        if (typeof Lampa !== 'undefined' && Lampa.Activity) {
            Lampa.Activity.push(Object.assign({
                component: 'kkphim_page',
                page: page
            }, params || {}));
        }
    }

    function playVideo(link, title) {
        if (!link) return;

        try {
            if (link.indexOf('.m3u8') !== -1) {
                // HLS stream
                if (typeof Lampa !== 'undefined' && Lampa.Player) {
                    Lampa.Player.play({
                        url: link,
                        title: title || CONFIG.name,
                        quality: {},
                    });
                    Lampa.Player.playlist([{
                        title: title || CONFIG.name,
                        url: link
                    }]);
                } else {
                    window.open(link, '_blank');
                }
            } else {
                // Embed link
                if (typeof Lampa !== 'undefined' && Lampa.Player) {
                    Lampa.Player.play({
                        url: link,
                        title: title || CONFIG.name
                    });
                } else {
                    window.open(link, '_blank');
                }
            }
        } catch (e) {
            console.error('KKPhim Play Error:', e);
            window.open(link, '_blank');
        }
    }

    // ============== LAMPA COMPONENTS ==============

    function createComponent(name, buildFn) {
        if (typeof Lampa === 'undefined') return;

        Lampa.Component.add(name, function (object) {
            var comp = this;
            var html = document.createElement('div');
            html.classList.add('kkphim-component');

            this.create = function () {};

            this.start = function () {
                if (typeof Lampa !== 'undefined' && Lampa.Controller) {
                    Lampa.Controller.add('content', {
                        toggle: function () {
                            Lampa.Controller.collectionSet(html);
                            Lampa.Controller.collectionFocus(false, html);
                        },
                        left: function () {
                            if (typeof Lampa !== 'undefined' && Lampa.Panel) Lampa.Panel.show();
                        },
                        right: function () {},
                        up: function () {
                            Lampa.Controller.collectionFocus('up', html);
                        },
                        down: function () {
                            Lampa.Controller.collectionFocus('down', html);
                        },
                        back: function () {
                            Lampa.Activity.backward();
                        }
                    });
                    Lampa.Controller.toggle('content');
                }

                buildFn(object, function (content) {
                    html.innerHTML = content;
                    if (typeof Lampa !== 'undefined' && Lampa.Controller) {
                        Lampa.Controller.collectionSet(html);
                        Lampa.Controller.collectionFocus(false, html);
                    }
                });
            };

            this.pause = function () {};
            this.stop = function () {};

            this.render = function () {
                return html;
            };

            this.destroy = function () {
                html.innerHTML = '';
            };
        });
    }

    // ============== KHỞI TẠO PLUGIN ==============

    function initPlugin() {
        addStyles();

        // Component trang chủ
        createComponent('kkphim', function (object, render) {
            pageHome(render);
            bindNavEvents(render);
        });

        // Component chi tiết
        createComponent('kkphim_detail', function (object, render) {
            pageDetail(object.slug, render);
        });

        // Component trang danh sách
        createComponent('kkphim_page', function (object, render) {
            switch (object.page) {
                case 'new':
                    pageNew(1, render);
                    break;
                case 'list':
                    var titleMap = {
                        'phim-le': '🎥 Phim Lẻ',
                        'phim-bo': '📺 Phim Bộ',
                        'hoat-hinh': '🎭 Hoạt Hình',
                        'tv-shows': '📡 TV Shows'
                    };
                    pageList(object.slug, 1, titleMap[object.slug] || object.slug, render);
                    break;
                case 'categories':
                    pageCategories(render);
                    break;
                case 'countries':
                    pageCountries(render);
                    break;
                case 'search':
                    pageSearch(object.keyword || null, 1, render);
                    break;
                case 'categoryList':
                    pageCategoryList(object.slug, 1, render);
                    break;
                case 'countryList':
                    pageCountryList(object.slug, 1, render);
                    break;
            }
        });

        // Thêm vào menu Lampa
        if (typeof Lampa !== 'undefined') {
            // Thêm menu button
            if (Lampa.Menu) {
                var menuItem = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg></div><div class="menu__text">KKPhim</div></li>');

                menuItem.on('hover:enter', function () {
                    Lampa.Activity.push({
                        component: 'kkphim',
                        title: 'KKPhim'
                    });
                });

                // Tìm vị trí thêm menu
                var menuList = $('.menu .menu__list');
                if (menuList.length) {
                    menuList.eq(0).append(menuItem);
                }
            }

            // Thêm nút tìm kiếm KKPhim vào search
            if (Lampa.Listener) {
                Lampa.Listener.follow('search', function (e) {
                    if (e.query) {
                        // Có thể thêm source KKPhim vào kết quả search
                    }
                });
            }

            console.log('✅ KKPhim Plugin loaded successfully!');
            if (Lampa.Noty) {
                Lampa.Noty.show('🎬 KKPhim Plugin đã sẵn sàng!', { time: 3000 });
            }
        }
    }

    // ============== KHỞI CHẠY ==============

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initPlugin, 100);
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(initPlugin, 100);
        });
    }

    // Nếu Lampa chưa load, đợi
    if (typeof Lampa === 'undefined') {
        var waitForLampa = setInterval(function () {
            if (typeof Lampa !== 'undefined') {
                clearInterval(waitForLampa);
                initPlugin();
            }
        }, 500);

        // Timeout sau 10s
        setTimeout(function () {
            clearInterval(waitForLampa);
        }, 10000);
    }

})();