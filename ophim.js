(function () {
    'use strict';

    // ==========================================
    // CẤU HÌNH
    // ==========================================
    var CONFIG = {
        name: 'vietnamese_project',
        title: 'Dự Án Tiếng Việt',
        version: '2.0.0',
        storage_key: 'vn_plugin_data',
        apis: {
            ophim: 'https://ophim1.com',
            kkphim: 'https://phimapi.com',
            phimmoi: 'https://phimmoichieuoi.net/api/v1'
        }
    };

    // ==========================================
    // STORAGE - LƯU TRỮ DỮ LIỆU
    // ==========================================
    var Storage = {
        get: function (key, def) {
            try {
                var data = localStorage.getItem(CONFIG.storage_key + '_' + key);
                return data ? JSON.parse(data) : (def !== undefined ? def : null);
            } catch (e) { return def || null; }
        },
        set: function (key, value) {
            try {
                localStorage.setItem(CONFIG.storage_key + '_' + key, JSON.stringify(value));
            } catch (e) { }
        },
        remove: function (key) {
            localStorage.removeItem(CONFIG.storage_key + '_' + key);
        }
    };

    // ==========================================
    // AUTH - ĐĂNG NHẬP / TÀI KHOẢN
    // ==========================================
    var Auth = {
        isLoggedIn: function () {
            return !!Storage.get('user');
        },

        getUser: function () {
            return Storage.get('user');
        },

        login: function (username, password, callback) {
            // Giả lập login (thay bằng API thật)
            if (!username || !password) {
                return callback('Vui lòng nhập đầy đủ thông tin!');
            }
            if (password.length < 6) {
                return callback('Mật khẩu phải ít nhất 6 ký tự!');
            }

            // TODO: Thay bằng API backend thật
            // Lampa.Reguest.post('https://your-api.com/login', { username, password }, ...)
            setTimeout(function () {
                var user = {
                    id: Date.now(),
                    username: username,
                    avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(username) + '&background=e50914&color=fff',
                    joined: new Date().toLocaleDateString('vi-VN'),
                    token: 'mock_token_' + Date.now()
                };
                Storage.set('user', user);
                callback(null, user);
            }, 800);
        },

        register: function (username, password, email, callback) {
            if (!username || !password || !email) {
                return callback('Vui lòng nhập đầy đủ thông tin!');
            }
            if (password.length < 6) {
                return callback('Mật khẩu phải ít nhất 6 ký tự!');
            }
            if (!email.includes('@')) {
                return callback('Email không hợp lệ!');
            }

            // TODO: Thay bằng API backend thật
            setTimeout(function () {
                var user = {
                    id: Date.now(),
                    username: username,
                    email: email,
                    avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(username) + '&background=e50914&color=fff',
                    joined: new Date().toLocaleDateString('vi-VN'),
                    token: 'mock_token_' + Date.now()
                };
                Storage.set('user', user);
                callback(null, user);
            }, 800);
        },

        logout: function () {
            Storage.remove('user');
            Lampa.Noty.show('Đã đăng xuất!');
        }
    };

    // ==========================================
    // FAVORITES - YÊU THÍCH
    // ==========================================
    var Favorites = {
        getAll: function () {
            return Storage.get('favorites', []);
        },

        add: function (movie) {
            var list = this.getAll();
            var exists = list.find(function (m) { return m.slug === movie.slug; });
            if (!exists) {
                movie.added_at = Date.now();
                list.unshift(movie);
                Storage.set('favorites', list);
                Lampa.Noty.show('✅ Đã thêm vào yêu thích!');
                return true;
            }
            Lampa.Noty.show('⚠️ Phim đã có trong danh sách!');
            return false;
        },

        remove: function (slug) {
            var list = this.getAll();
            list = list.filter(function (m) { return m.slug !== slug; });
            Storage.set('favorites', list);
            Lampa.Noty.show('🗑️ Đã xóa khỏi yêu thích!');
        },

        isFavorite: function (slug) {
            var list = this.getAll();
            return !!list.find(function (m) { return m.slug === slug; });
        },

        toggle: function (movie) {
            if (this.isFavorite(movie.slug)) {
                this.remove(movie.slug);
                return false;
            } else {
                this.add(movie);
                return true;
            }
        }
    };

    // ==========================================
    // HISTORY - LỊCH SỬ XEM
    // ==========================================
    var History = {
        getAll: function () {
            return Storage.get('history', []);
        },

        add: function (movie, episode) {
            var list = this.getAll();
            // Xóa nếu đã tồn tại
            list = list.filter(function (item) {
                return !(item.slug === movie.slug && item.episode === episode);
            });
            list.unshift({
                id: movie.id || movie.slug,
                slug: movie.slug,
                title: movie.title || movie.name,
                poster: movie.poster || movie.thumb_url,
                episode: episode,
                watched_at: Date.now(),
                watched_date: new Date().toLocaleDateString('vi-VN')
            });
            // Giới hạn 100 mục
            if (list.length > 100) list = list.slice(0, 100);
            Storage.set('history', list);
        },

        remove: function (slug) {
            var list = this.getAll().filter(function (item) { return item.slug !== slug; });
            Storage.set('history', list);
        },

        clear: function () {
            Storage.set('history', []);
            Lampa.Noty.show('🗑️ Đã xóa toàn bộ lịch sử!');
        },

        getProgress: function (slug, episode) {
            var key = 'progress_' + slug + '_' + episode;
            return Storage.get(key, 0);
        },

        saveProgress: function (slug, episode, time, duration) {
            var key = 'progress_' + slug + '_' + episode;
            Storage.set(key, { time: time, duration: duration, percent: Math.round((time / duration) * 100) });
        }
    };

    // ==========================================
    // SUBTITLES - PHỤ ĐỀ
    // ==========================================
    var Subtitles = {
        // Tìm phụ đề từ OpenSubtitles
        search: function (title, year, callback) {
            var query = encodeURIComponent(title);
            var url = 'https://rest.opensubtitles.org/search/query-' + query + '/sublanguageid-vie';

            Lampa.Reguest.get(url, function (data) {
                if (!data || !Array.isArray(data)) return callback(null, []);
                var subs = data.slice(0, 10).map(function (sub) {
                    return {
                        id: sub.IDSubtitleFile,
                        title: sub.MovieReleaseName || title,
                        language: 'Tiếng Việt',
                        format: sub.SubFormat,
                        download_url: sub.SubDownloadLink,
                        rating: sub.SubRating,
                        downloads: sub.SubDownloadsCnt
                    };
                });
                callback(null, subs);
            }, function () {
                callback(null, []);
            });
        },

        // Tải và inject phụ đề vào player
        load: function (url, callback) {
            Lampa.Reguest.get(url, function (data) {
                callback(null, data);
            }, function (err) {
                callback(err, null);
            });
        },

        // Parse SRT sang VTT
        srtToVtt: function (srt) {
            return 'WEBVTT\n\n' + srt
                .replace(/\r\n|\r|\n/g, '\n')
                .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
                .trim();
        },

        // Tạo blob URL từ text
        createBlobUrl: function (text, type) {
            type = type || 'text/vtt';
            var blob = new Blob([text], { type: type });
            return URL.createObjectURL(blob);
        }
    };

    // ==========================================
    // TV REMOTE - HỖ TRỢ ĐIỀU KHIỂN TV
    // ==========================================
    var TVRemote = {
        focusIndex: 0,
        focusableSelector: '.vn-focusable, .focus',
        isTV: false,

        init: function () {
            // Kiểm tra TV
            this.isTV = /TV|SmartTV|Tizen|WebOS|VIDAA/.test(navigator.userAgent);

            document.addEventListener('keydown', this.handleKey.bind(this));
            this.setupFocusNavigation();
        },

        handleKey: function (e) {
            var keys = {
                LEFT: [37, 21],
                RIGHT: [39, 22],
                UP: [38, 19],
                DOWN: [40, 20],
                OK: [13, 32, 85],
                BACK: [8, 27, 461],
                RED: [403],
                GREEN: [404],
                YELLOW: [405],
                BLUE: [406],
                PLAY_PAUSE: [415, 19, 179],
                FF: [417],
                RW: [412]
            };

            var self = this;

            // Navigation
            if (keys.DOWN.includes(e.keyCode)) {
                self.moveFocus('down');
            } else if (keys.UP.includes(e.keyCode)) {
                self.moveFocus('up');
            } else if (keys.LEFT.includes(e.keyCode)) {
                self.moveFocus('left');
            } else if (keys.RIGHT.includes(e.keyCode)) {
                self.moveFocus('right');
            } else if (keys.OK.includes(e.keyCode)) {
                self.clickFocused();
            } else if (keys.BACK.includes(e.keyCode)) {
                self.goBack();
                e.preventDefault();
            } else if (keys.RED.includes(e.keyCode)) {
                // Nút đỏ = Yêu thích
                Lampa.Noty.show('❤️ Thêm vào yêu thích');
            } else if (keys.GREEN.includes(e.keyCode)) {
                // Nút xanh = Tìm kiếm
                self.focusSearch();
            }
        },

        moveFocus: function (direction) {
            var elements = document.querySelectorAll(this.focusableSelector);
            if (!elements.length) return;

            var current = document.activeElement;
            var currentIdx = Array.from(elements).indexOf(current);

            var nextIdx = currentIdx;

            if (direction === 'down' || direction === 'right') {
                nextIdx = Math.min(currentIdx + 1, elements.length - 1);
            } else if (direction === 'up' || direction === 'left') {
                nextIdx = Math.max(currentIdx - 1, 0);
            }

            if (elements[nextIdx]) {
                elements[nextIdx].focus();
                elements[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        },

        clickFocused: function () {
            var el = document.activeElement;
            if (el) el.click();
        },

        goBack: function () {
            if (Lampa.Activity && Lampa.Activity.backward) {
                Lampa.Activity.backward();
            }
        },

        focusSearch: function () {
            var input = document.querySelector('.vn-search-input');
            if (input) {
                input.focus();
                // Mở bàn phím ảo nếu trên TV
                if (this.isTV) {
                    VirtualKeyboard.open(function (text) {
                        input.value = text;
                        document.querySelector('.vn-search-btn').click();
                    });
                }
            }
        },

        setupFocusNavigation: function () {
            // Thêm tabindex cho các phần tử có thể focus
            document.addEventListener('DOMNodeInserted', function () {
                document.querySelectorAll('.focus:not([tabindex])').forEach(function (el) {
                    el.setAttribute('tabindex', '0');
                });
            });
        }
    };

    // ==========================================
    // BÀN PHÍM ẢO (TV)
    // ==========================================
    var VirtualKeyboard = {
        callback: null,
        value: '',

        open: function (callback) {
            this.callback = callback;
            this.value = '';

            var rows = [
                ['1','2','3','4','5','6','7','8','9','0'],
                ['q','w','e','r','t','y','u','i','o','p'],
                ['a','s','d','f','g','h','j','k','l'],
                ['z','x','c','v','b','n','m'],
                ['Xóa', 'Cách', 'Tìm']
            ];

            var html = '<div class="vn-keyboard" id="vn-keyboard">' +
                '<div class="vn-keyboard__display" id="vn-kb-display">_</div>';

            rows.forEach(function (row) {
                html += '<div class="vn-keyboard__row">';
                row.forEach(function (key) {
                    html += '<button class="vn-kb-key focus" data-key="' + key + '">' + key + '</button>';
                });
                html += '</div>';
            });

            html += '</div>';

            var overlay = $('<div class="vn-overlay">' + html + '</div>');
            $('body').append(overlay);

            var self = this;

            overlay.on('click', '.vn-kb-key', function () {
                var key = $(this).data('key');
                self.handleKey(key);
            });

            overlay.on('click', '.vn-overlay', function (e) {
                if ($(e.target).hasClass('vn-overlay')) {
                    overlay.remove();
                }
            });
        },

        handleKey: function (key) {
            if (key === 'Xóa') {
                this.value = this.value.slice(0, -1);
            } else if (key === 'Cách') {
                this.value += ' ';
            } else if (key === 'Tìm') {
                if (this.callback) this.callback(this.value);
                $('#vn-keyboard').closest('.vn-overlay').remove();
                return;
            } else {
                this.value += key;
            }
            $('#vn-kb-display').text(this.value || '_');
        }
    };

    // ==========================================
    // API SOURCES
    // ==========================================
    var Sources = {
        getList: function (type, page, callback) {
            var url = CONFIG.apis.ophim + '/danh-sach/' + type + '?page=' + (page || 1);
            Lampa.Reguest.get(url, function (data) {
                if (!data || !data.items) return callback('Lỗi API', null);
                var movies = data.items.map(Sources._parseItem);
                callback(null, { movies: movies, total: data.params && data.params.pagination ? data.params.pagination.totalItems : 0, totalPages: data.params && data.params.pagination ? Math.ceil(data.params.pagination.totalItems / 24) : 1 });
            }, function (e) { callback(e, null); });
        },

        getDetail: function (slug, callback) {
            var url = CONFIG.apis.ophim + '/phim/' + slug;
            Lampa.Reguest.get(url, function (data) {
                callback(null, data);
            }, function (e) { callback(e, null); });
        },

        search: function (query, page, callback) {
            var url = CONFIG.apis.kkphim + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(query) + '&page=' + (page || 1) + '&limit=24';
            Lampa.Reguest.get(url, function (data) {
                if (!data || !data.data) return callback('Không có kết quả', null);
                var movies = (data.data.items || []).map(function (item) {
                    return {
                        id: item._id,
                        title: item.name,
                        original_title: item.origin_name,
                        poster: 'https://phimimg.com/' + item.thumb_url,
                        backdrop: 'https://phimimg.com/' + item.poster_url,
                        year: item.year,
                        quality: item.quality,
                        lang: item.lang,
                        status: item.episode_current,
                        slug: item.slug,
                        type: item.type
                    };
                });
                callback(null, { movies: movies, total: data.data.params ? data.data.params.pagination.totalItems : 0 });
            }, function (e) { callback(e, null); });
        },

        getByGenre: function (genre, page, callback) {
            var url = CONFIG.apis.ophim + '/the-loai/' + genre + '?page=' + (page || 1);
            Lampa.Reguest.get(url, function (data) {
                if (!data || !data.items) return callback('Lỗi', null);
                callback(null, { movies: data.items.map(Sources._parseItem) });
            }, function (e) { callback(e, null); });
        },

        _parseItem: function (item) {
            return {
                id: item._id,
                title: item.name,
                original_title: item.origin_name,
                poster: 'https://img.ophim.live/uploads/movies/' + item.thumb_url,
                backdrop: 'https://img.ophim.live/uploads/movies/' + item.poster_url,
                year: item.year,
                quality: item.quality,
                lang: item.lang,
                status: item.episode_current,
                slug: item.slug,
                type: item.type
            };
        }
    };

    // ==========================================
    // UI COMPONENTS
    // ==========================================
    var UI = {
        // Tạo card phim
        card: function (movie) {
            var isFav = Favorites.isFavorite(movie.slug);
            return [
                '<div class="vn-card vn-focusable" tabindex="0"',
                '  data-slug="' + (movie.slug || '') + '"',
                '  data-title="' + (movie.title || '') + '"',
                '>',
                '  <div class="vn-card__poster">',
                '    <img src="' + (movie.poster || '') + '" alt="' + (movie.title || '') + '" loading="lazy" onerror="this.src=\'https://via.placeholder.com/160x240/1a1a2e/e50914?text=No+Image\'" />',
                '    <div class="vn-card__overlay">',
                '      <button class="vn-fav-btn ' + (isFav ? 'active' : '') + '" data-slug="' + movie.slug + '" title="Yêu thích">',
                '        ' + (isFav ? '❤️' : '🤍'),
                '      </button>',
                '      <div class="vn-play-icon">▶</div>',
                '    </div>',
                '    ' + (movie.quality ? '<span class="vn-badge vn-badge--quality">' + movie.quality + '</span>' : ''),
                '    ' + (movie.lang ? '<span class="vn-badge vn-badge--lang">' + movie.lang + '</span>' : ''),
                '    ' + (movie.status ? '<span class="vn-badge vn-badge--ep">' + movie.status + '</span>' : ''),
                '  </div>',
                '  <div class="vn-card__body">',
                '    <div class="vn-card__title">' + (movie.title || 'Không có tên') + '</div>',
                '    ' + (movie.year ? '<div class="vn-card__year">' + movie.year + '</div>' : ''),
                '  </div>',
                '</div>'
            ].join('');
        },

        // Grid phim
        grid: function (movies) {
            if (!movies || !movies.length) {
                return '<div class="vn-empty"><div class="vn-empty__icon">🎬</div><p>Không có phim nào</p></div>';
            }
            return '<div class="vn-grid">' + movies.map(UI.card).join('') + '</div>';
        },

        // Loading
        loading: function (text) {
            return '<div class="vn-loading"><div class="vn-spinner"></div><p>' + (text || 'Đang tải...') + '</p></div>';
        },

        // Lỗi
        error: function (text) {
            return '<div class="vn-error"><div class="vn-error__icon">❌</div><p>' + (text || 'Đã xảy ra lỗi!') + '</p><button class="vn-btn vn-focusable" onclick="location.reload()">Tải lại</button></div>';
        },

        // Pagination
        pagination: function (current, total) {
            var pages = '';
            var start = Math.max(1, current - 2);
            var end = Math.min(total, current + 2);

            for (var i = start; i <= end; i++) {
                pages += '<button class="vn-page-btn vn-focusable ' + (i === current ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
            }

            return [
                '<div class="vn-pagination">',
                '  <button class="vn-page-btn vn-focusable" data-page="1" ' + (current <= 1 ? 'disabled' : '') + '>«</button>',
                '  <button class="vn-page-btn vn-focusable" data-page="' + (current - 1) + '" ' + (current <= 1 ? 'disabled' : '') + '>‹</button>',
                '  ' + pages,
                '  <button class="vn-page-btn vn-focusable" data-page="' + (current + 1) + '" ' + (current >= total ? 'disabled' : '') + '>›</button>',
                '  <button class="vn-page-btn vn-focusable" data-page="' + total + '" ' + (current >= total ? 'disabled' : '') + '>»</button>',
                '  <span class="vn-page-info">Trang ' + current + '/' + total + '</span>',
                '</div>'
            ].join('');
        }
    };

    // ==========================================
    // PAGES
    // ==========================================

    // ---- TRANG CHỦ ----
    var HomePage = {
        categories: [
            { id: 'phim-moi', label: '🔥 Phim Mới' },
            { id: 'phim-bo', label: '📺 Phim Bộ' },
            { id: 'phim-le', label: '🎬 Phim Lẻ' },
            { id: 'hoat-hinh', label: '🎯 Hoạt Hình' },
            { id: 'tv-shows', label: '📡 TV Shows' }
        ],
        genres: [
            { id: 'hanh-dong', label: 'Hành Động' },
            { id: 'tinh-cam', label: 'Tình Cảm' },
            { id: 'hai-huoc', label: 'Hài Hước' },
            { id: 'kinh-di', label: 'Kinh Dị' },
            { id: 'vien-tuong', label: 'Viễn Tưởng' },
            { id: 'tam-ly', label: 'Tâm Lý' },
            { id: 'hinh-su', label: 'Hình Sự' },
            { id: 'vo-thuat', label: 'Võ Thuật' },
            { id: 'phieu-luu', label: 'Phiêu Lưu' },
            { id: 'than-thoai', label: 'Thần Thoại' }
        ],

        state: {
            tab: 'phim-moi',
            page: 1,
            totalPages: 1,
            searchQuery: '',
            isSearching: false
        },

        render: function (container) {
            var self = this;
            var user = Auth.getUser();

            var html = [
                '<div class="vn-page" id="vn-home">',

                // HEADER
                '<div class="vn-topbar">',
                '  <div class="vn-logo">🎬 ' + CONFIG.title + '</div>',
                '  <div class="vn-topbar__search">',
                '    <input class="vn-search-input vn-focusable" id="vn-search" type="text" placeholder="Tìm kiếm phim..." />',
                '    <button class="vn-search-btn vn-focusable" id="vn-search-submit">🔍</button>',
                '  </div>',
                '  <div class="vn-topbar__actions">',
                '    <button class="vn-topbar-btn vn-focusable" id="vn-btn-fav">❤️ Yêu Thích</button>',
                '    <button class="vn-topbar-btn vn-focusable" id="vn-btn-history">🕐 Lịch Sử</button>',
                '    ' + (user
                        ? '<button class="vn-topbar-btn vn-focusable" id="vn-btn-profile"><img src="' + user.avatar + '" class="vn-avatar" /> ' + user.username + '</button>'
                        : '<button class="vn-topbar-btn vn-topbar-btn--login vn-focusable" id="vn-btn-login">👤 Đăng Nhập</button>'),
                '  </div>',
                '</div>',

                // TABS
                '<div class="vn-tabs">',
                self.categories.map(function (cat) {
                    return '<button class="vn-tab vn-focusable ' + (cat.id === self.state.tab ? 'active' : '') + '" data-tab="' + cat.id + '">' + cat.label + '</button>';
                }).join(''),
                '</div>',

                // THỂ LOẠI
                '<div class="vn-genres">',
                '<span class="vn-genres__label">Thể loại:</span>',
                self.genres.map(function (g) {
                    return '<button class="vn-genre-btn vn-focusable" data-genre="' + g.id + '">' + g.label + '</button>';
                }).join(''),
                '</div>',

                // CONTENT
                '<div class="vn-content" id="vn-content">',
                UI.loading('Đang tải phim...'),
                '</div>',

                '</div>'
            ].join('');

            container.html(html);
            self._bindEvents(container);
            self.loadMovies(container);
        },

        _bindEvents: function (container) {
            var self = this;

            // Tab click
            container.on('click', '.vn-tab', function () {
                container.find('.vn-tab').removeClass('active');
                $(this).addClass('active');
                self.state.tab = $(this).data('tab');
                self.state.page = 1;
                self.state.isSearching = false;
                self.state.searchQuery = '';
                container.find('#vn-search').val('');
                self.loadMovies(container);
            });

            // Genre click
            container.on('click', '.vn-genre-btn', function () {
                var genre = $(this).data('genre');
                container.find('.vn-genre-btn').removeClass('active');
                $(this).addClass('active');
                self.state.isSearching = false;
                self.state.page = 1;
                self.loadByGenre(container, genre);
            });

            // Search
            container.on('click', '#vn-search-submit', function () {
                self._doSearch(container);
            });

            container.on('keypress', '#vn-search', function (e) {
                if (e.which === 13) self._doSearch(container);
            });

            // Pagination
            container.on('click', '.vn-page-btn:not([disabled])', function () {
                var page = parseInt($(this).data('page'));
                self.state.page = page;
                self.loadMovies(container);
                container.find('#vn-home')[0].scrollIntoView({ behavior: 'smooth' });
            });

            // Movie card click
            container.on('click', '.vn-card', function (e) {
                if ($(e.target).hasClass('vn-fav-btn') || $(e.target).closest('.vn-fav-btn').length) return;
                var slug = $(this).data('slug');
                if (slug) DetailPage.open(slug);
            });

            // Favorite btn
            container.on('click', '.vn-fav-btn', function (e) {
                e.stopPropagation();
                var slug = $(this).data('slug');
                var card = $(this).closest('.vn-card');
                var movie = {
                    slug: slug,
                    title: card.data('title'),
                    poster: card.find('img').attr('src')
                };
                var isFav = Favorites.toggle(movie);
                $(this).html(isFav ? '❤️' : '🤍');
                $(this).toggleClass('active', isFav);
            });

            // Nav buttons
            container.on('click', '#vn-btn-fav', function () {
                FavoritesPage.open();
            });

            container.on('click', '#vn-btn-history', function () {
                HistoryPage.open();
            });

            container.on('click', '#vn-btn-login', function () {
                AuthPage.openLogin();
            });

            container.on('click', '#vn-btn-profile', function () {
                ProfilePage.open();
            });

            // TV: keyboard navigation
            container.on('keydown', '.vn-focusable', function (e) {
                if (e.keyCode === 13) $(this).click();
            });
        },

        _doSearch: function (container) {
            var query = container.find('#vn-search').val().trim();
            if (!query) return;
            this.state.isSearching = true;
            this.state.searchQuery = query;
            this.state.page = 1;
            this.loadMovies(container);
        },

        loadMovies: function (container) {
            var self = this;
            var content = container.find('#vn-content');
            content.html(UI.loading('Đang tải phim...'));

            if (self.state.isSearching) {
                Sources.search(self.state.searchQuery, self.state.page, function (err, data) {
                    if (err || !data) return content.html(UI.error('Không tìm thấy kết quả!'));
                    self.state.totalPages = Math.ceil((data.total || 0) / 24) || 1;
                    content.html(UI.grid(data.movies) + UI.pagination(self.state.page, self.state.totalPages));
                });
            } else {
                Sources.getList(self.state.tab, self.state.page, function (err, data) {
                    if (err || !data) return content.html(UI.error('Lỗi tải dữ liệu!'));
                    self.state.totalPages = data.totalPages || 1;
                    content.html(UI.grid(data.movies) + UI.pagination(self.state.page, self.state.totalPages));
                });
            }
        },

        loadByGenre: function (container, genre) {
            var self = this;
            var content = container.find('#vn-content');
            content.html(UI.loading('Đang tải thể loại...'));

            Sources.getByGenre(genre, 1, function (err, data) {
                if (err || !data) return content.html(UI.error());
                content.html(UI.grid(data.movies));
            });
        }
    };

    // ---- TRANG CHI TIẾT ----
    var DetailPage = {
        open: function (slug) {
            var overlay = $('<div class="vn-overlay vn-detail-overlay"></div>');
            overlay.html(UI.loading('Đang tải thông tin phim...'));
            $('body').append(overlay);

            Sources.getDetail(slug, function (err, data) {
                if (err || !data) {
                    overlay.html('<div class="vn-detail-error">' + UI.error('Không tải được thông tin!') + '</div>');
                    return;
                }

                var movie = data.movie;
                var episodes = data.episodes || [];

                var html = [
                    '<div class="vn-detail">',

                    // BACKDROP
                    '<div class="vn-detail__bg" style="background-image:url(https://img.ophim.live/uploads/movies/' + movie.poster_url + ')"></div>',

                    // CLOSE
                    '<button class="vn-detail__close vn-focusable" id="vn-detail-close">✕</button>',

                    // HERO
                    '<div class="vn-detail__hero">',
                    '  <div class="vn-detail__poster">',
                    '    <img src="https://img.ophim.live/uploads/movies/' + movie.thumb_url + '" alt="' + movie.name + '" />',
                    '    <div class="vn-detail__poster-actions">',
                    '      <button class="vn-btn-fav-detail vn-focusable ' + (Favorites.isFavorite(slug) ? 'active' : '') + '" data-slug="' + slug + '">',
                    '        ' + (Favorites.isFavorite(slug) ? '❤️ Đã Yêu Thích' : '🤍 Yêu Thích'),
                    '      </button>',
                    '    </div>',
                    '  </div>',
                    '  <div class="vn-detail__meta">',
                    '    <h1 class="vn-detail__title">' + (movie.name || '') + '</h1>',
                    '    <p class="vn-detail__original">' + (movie.origin_name || '') + '</p>',
                    '    <div class="vn-detail__tags">',
                    '      ' + (movie.year ? '<span class="vn-tag">📅 ' + movie.year + '</span>' : ''),
                    '      ' + (movie.quality ? '<span class="vn-tag vn-tag--red">' + movie.quality + '</span>' : ''),
                    '      ' + (movie.lang ? '<span class="vn-tag">' + movie.lang + '</span>' : ''),
                    '      ' + (movie.time ? '<span class="vn-tag">⏱️ ' + movie.time + '</span>' : ''),
                    '      ' + (movie.episode_current ? '<span class="vn-tag vn-tag--green">' + movie.episode_current + '</span>' : ''),
                    '      ' + (movie.tmdb && movie.tmdb.vote_average ? '<span class="vn-tag vn-tag--gold">⭐ ' + parseFloat(movie.tmdb.vote_average).toFixed(1) + '</span>' : ''),
                    '    </div>',
                    '    <div class="vn-detail__genres">',
                    (movie.category || []).map(function (c) { return '<span class="vn-genre-tag">' + c.name + '</span>'; }).join(''),
                    '    </div>',
                    '    <div class="vn-detail__countries">',
                    (movie.country || []).map(function (c) { return '<span class="vn-country-tag">🌏 ' + c.name + '</span>'; }).join(''),
                    '    </div>',
                    '    <p class="vn-detail__desc">' + (movie.content || 'Đang cập nhật nội dung...') + '</p>',
                    '    <div class="vn-detail__cast">',
                    '      ' + (movie.actor && movie.actor.length ? '<strong>Diễn viên:</strong> ' + movie.actor.slice(0, 5).join(', ') : ''),
                    '    </div>',
                    '    <div class="vn-detail__director">',
                    '      ' + (movie.director && movie.director.length ? '<strong>Đạo diễn:</strong> ' + movie.director.join(', ') : ''),
                    '    </div>',
                    '  </div>',
                    '</div>',

                    // TABS
                    '<div class="vn-detail__tabs">',
                    '  <button class="vn-detail-tab vn-focusable active" data-dtab="episodes">📋 Danh Sách Tập</button>',
                    '  <button class="vn-detail-tab vn-focusable" data-dtab="subtitles">💬 Phụ Đề</button>',
                    '  <button class="vn-detail-tab vn-focusable" data-dtab="related">🎬 Phim Liên Quan</button>',
                    '</div>',

                    // EPISODES
                    '<div class="vn-detail__panel" id="vn-panel-episodes">',
                    DetailPage._renderEpisodes(episodes, slug),
                    '</div>',

                    // SUBTITLES
                    '<div class="vn-detail__panel vn-hidden" id="vn-panel-subtitles">',
                    DetailPage._renderSubtitles(movie),
                    '</div>',

                    // RELATED
                    '<div class="vn-detail__panel vn-hidden" id="vn-panel-related">',
                    '<div id="vn-related-content">' + UI.loading('Đang tải phim liên quan...') + '</div>',
                    '</div>',

                    '</div>' // .vn-detail
                ].join('');

                overlay.html(html);

                // Load phim liên quan
                if (movie.category && movie.category[0]) {
                    Sources.getByGenre(movie.category[0].slug, 1, function (err, data) {
                        overlay.find('#vn-related-content').html(data ? UI.grid(data.movies.slice(0, 12)) : UI.error());
                        overlay.on('click', '#vn-panel-related .vn-card', function () {
                            var s = $(this).data('slug');
                            if (s) {
                                overlay.remove();
                                DetailPage.open(s);
                            }
                        });
                    });
                }

                // EVENTS
                overlay.on('click', '#vn-detail-close', function () {
                    overlay.remove();
                });

                overlay.on('click', '.vn-detail-tab', function () {
                    overlay.find('.vn-detail-tab').removeClass('active');
                    $(this).addClass('active');
                    overlay.find('.vn-detail__panel').addClass('vn-hidden');
                    overlay.find('#vn-panel-' + $(this).data('dtab')).removeClass('vn-hidden');
                });

                overlay.on('click', '.vn-btn-fav-detail', function () {
                    var movie_data = {
                        slug: slug,
                        title: movie.name,
                        poster: 'https://img.ophim.live/uploads/movies/' + movie.thumb_url,
                        year: movie.year,
                        quality: movie.quality
                    };
                    var isFav = Favorites.toggle(movie_data);
                    $(this).html(isFav ? '❤️ Đã Yêu Thích' : '🤍 Yêu Thích');
                    $(this).toggleClass('active', isFav);
                });

                // Chọn tập
                overlay.on('click', '.vn-ep-btn', function () {
                    var serverIdx = $(this).data('server');
                    var epIdx = $(this).data('ep');
                    var ep = episodes[serverIdx].server_data[epIdx];

                    overlay.find('.vn-ep-btn').removeClass('active');
                    $(this).addClass('active');

                    if (ep && ep.link_m3u8) {
                        History.add({
                            slug: slug,
                            title: movie.name,
                            poster: 'https://img.ophim.live/uploads/movies/' + movie.thumb_url
                        }, ep.name || ('Tập ' + (epIdx + 1)));

                        DetailPage._playEpisode(movie, ep, episodes[serverIdx].server_data, epIdx);
                    } else {
                        Lampa.Noty.show('⚠️ Không có link phát!');
                    }
                });

                // Phụ đề tải
                overlay.on('click', '.vn-sub-load', function () {
                    var url = $(this).data('url');
                    Lampa.Noty.show('📥 Đang tải phụ đề...');
                    Subtitles.load(url, function (err, text) {
                        if (err) return Lampa.Noty.show('❌ Tải phụ đề thất bại!');
                        var vtt = Subtitles.srtToVtt(text);
                        var blobUrl = Subtitles.createBlobUrl(vtt);
                        Storage.set('current_subtitle', blobUrl);
                        Lampa.Noty.show('✅ Phụ đề đã sẵn sàng!');
                    });
                });

                // Keyboard close
                $(document).on('keydown.detail', function (e) {
                    if (e.keyCode === 27 || e.keyCode === 461) {
                        overlay.remove();
                        $(document).off('keydown.detail');
                    }
                });
            });
        },

        _renderEpisodes: function (episodes, slug) {
            if (!episodes || !episodes.length) {
                return '<div class="vn-empty">Chưa có tập nào</div>';
            }

            var html = '';
            episodes.forEach(function (server, si) {
                html += '<div class="vn-server-block">';
                html += '<div class="vn-server-name">' + (server.server_name || 'Server ' + (si + 1)) + '</div>';
                html += '<div class="vn-ep-list">';

                server.server_data.forEach(function (ep, ei) {
                    var progress = History.getProgress(slug, ep.name);
                    var progressHtml = progress && progress.percent > 0
                        ? '<div class="vn-ep-progress" style="width:' + progress.percent + '%"></div>'
                        : '';

                    html += '<button class="vn-ep-btn vn-focusable" data-server="' + si + '" data-ep="' + ei + '">';
                    html += '<span class="vn-ep-name">' + (ep.name || ('Tập ' + (ei + 1))) + '</span>';
                    html += progressHtml;
                    html += '</button>';
                });

                html += '</div></div>';
            });

            return html;
        },

        _renderSubtitles: function (movie) {
            var html = [
                '<div class="vn-subtitles">',
                '  <h3>💬 Phụ Đề Tiếng Việt</h3>',
                '  <p class="vn-sub-desc">Tìm và tải phụ đề từ OpenSubtitles</p>',
                '  <button class="vn-btn vn-focusable" id="vn-search-subs">🔍 Tìm Phụ Đề</button>',
                '  <div id="vn-subs-result"></div>',
                '  <div class="vn-sub-manual">',
                '    <h4>Hoặc nhập link phụ đề (.srt/.vtt):</h4>',
                '    <div class="vn-sub-input-row">',
                '      <input class="vn-input vn-focusable" id="vn-sub-url" placeholder="https://..." />',
                '      <button class="vn-btn vn-focusable vn-sub-load" id="vn-sub-manual-load">Tải</button>',
                '    </div>',
                '  </div>',
                '</div>'
            ].join('');

            return html;
        },

        _playEpisode: function (movie, episode, allEpisodes, currentIdx) {
            var subtitleUrl = Storage.get('current_subtitle');

            var playerData = {
                title: movie.name + ' - ' + (episode.name || ''),
                url: episode.link_m3u8,
                poster: 'https://img.ophim.live/uploads/movies/' + (movie.poster_url || movie.thumb_url),
                timeline: {}
            };

            // Thêm phụ đề nếu có
            if (subtitleUrl) {
                playerData.subtitles = [{ url: subtitleUrl, label: 'Tiếng Việt', language: 'vi' }];
            }

            // Thêm tập tiếp theo
            if (currentIdx < allEpisodes.length - 1) {
                playerData.next = function () {
                    var nextEp = allEpisodes[currentIdx + 1];
                    if (nextEp) DetailPage._playEpisode(movie, nextEp, allEpisodes, currentIdx + 1);
                };
            }

            // Thêm tập trước
            if (currentIdx > 0) {
                playerData.prev = function () {
                    var prevEp = allEpisodes[currentIdx - 1];
                    if (prevEp) DetailPage._playEpisode(movie, prevEp, allEpisodes, currentIdx - 1);
                };
            }

            Lampa.Player.play(playerData);

            // Theo dõi tiến độ
            var slug = movie.slug;
            var epName = episode.name;
            var progressInterval = setInterval(function () {
                if (Lampa.Player.video) {
                    var v = Lampa.Player.video;
                    if (v.duration) {
                        History.saveProgress(slug, epName, v.currentTime, v.duration);
                    }
                } else {
                    clearInterval(progressInterval);
                }
            }, 5000);
        }
    };

    // ---- TRANG YÊU THÍCH ----
    var FavoritesPage = {
        open: function () {
            var overlay = $('<div class="vn-overlay vn-page-overlay"></div>');
            var favs = Favorites.getAll();

            var html = [
                '<div class="vn-subpage">',
                '  <div class="vn-subpage__header">',
                '    <h2>❤️ Phim Yêu Thích</h2>',
                '    <button class="vn-btn-close vn-focusable">✕</button>',
                '  </div>',
                '  <div class="vn-subpage__body">',
                favs.length
                    ? UI.grid(favs)
                    : '<div class="vn-empty"><div class="vn-empty__icon">💔</div><p>Chưa có phim yêu thích nào</p></div>',
                '  </div>',
                '</div>'
            ].join('');

            overlay.html(html);
            $('body').append(overlay);

            overlay.on('click', '.vn-btn-close', function () { overlay.remove(); });
            overlay.on('click', '.vn-card', function () {
                var slug = $(this).data('slug');
                if (slug) { overlay.remove(); DetailPage.open(slug); }
            });
            overlay.on('click', '.vn-fav-btn', function (e) {
                e.stopPropagation();
                var slug = $(this).data('slug');
                Favorites.remove(slug);
                $(this).closest('.vn-card').fadeOut(300, function () { $(this).remove(); });
            });
        }
    };

    // ---- TRANG LỊCH SỬ ----
    var HistoryPage = {
        open: function () {
            var overlay = $('<div class="vn-overlay vn-page-overlay"></div>');
            var history = History.getAll();

            var historyHtml = history.length
                ? history.map(function (item) {
                    var progress = History.getProgress(item.slug, item.episode);
                    return [
                        '<div class="vn-history-item vn-focusable" data-slug="' + item.slug + '" tabindex="0">',
                        '  <div class="vn-history-item__poster">',
                        '    <img src="' + (item.poster || '') + '" loading="lazy" />',
                        '    ' + (progress && progress.percent ? '<div class="vn-history-progress"><div class="vn-history-progress__bar" style="width:' + progress.percent + '%"></div></div>' : ''),
                        '  </div>',
                        '  <div class="vn-history-item__info">',
                        '    <div class="vn-history-item__title">' + item.title + '</div>',
                        '    <div class="vn-history-item__ep">📺 ' + (item.episode || 'Không rõ') + '</div>',
                        '    <div class="vn-history-item__date">🕐 ' + item.watched_date + '</div>',
                        '    ' + (progress ? '<div class="vn-history-item__progress">' + progress.percent + '% đã xem</div>' : ''),
                        '  </div>',
                        '  <button class="vn-history-del vn-focusable" data-slug="' + item.slug + '" title="Xóa">🗑️</button>',
                        '</div>'
                    ].join('');
                }).join('')
                : '<div class="vn-empty"><div class="vn-empty__icon">📭</div><p>Chưa có lịch sử xem</p></div>';

            var html = [
                '<div class="vn-subpage">',
                '  <div class="vn-subpage__header">',
                '    <h2>🕐 Lịch Sử Xem</h2>',
                '    <div class="vn-subpage__actions">',
                '      ' + (history.length ? '<button class="vn-btn vn-btn--danger vn-focusable" id="vn-clear-history">🗑️ Xóa Tất Cả</button>' : ''),
                '      <button class="vn-btn-close vn-focusable">✕</button>',
                '    </div>',
                '  </div>',
                '  <div class="vn-subpage__body">',
                '    <div class="vn-history-list">' + historyHtml + '</div>',
                '  </div>',
                '</div>'
            ].join('');

            overlay.html(html);
            $('body').append(overlay);

            overlay.on('click', '.vn-btn-close', function () { overlay.remove(); });

            overlay.on('click', '.vn-history-item', function (e) {
                if ($(e.target).hasClass('vn-history-del')) return;
                var slug = $(this).data('slug');
                if (slug) { overlay.remove(); DetailPage.open(slug); }
            });

            overlay.on('click', '.vn-history-del', function (e) {
                e.stopPropagation();
                var slug = $(this).data('slug');
                History.remove(slug);
                $(this).closest('.vn-history-item').fadeOut(300, function () { $(this).remove(); });
                Lampa.Noty.show('🗑️ Đã xóa!');
            });

            overlay.on('click', '#vn-clear-history', function () {
                History.clear();
                overlay.find('.vn-history-list').html('<div class="vn-empty"><div class="vn-empty__icon">📭</div><p>Chưa có lịch sử xem</p></div>');
            });
        }
    };

    // ---- TRANG ĐĂNG NHẬP ----
    var AuthPage = {
        openLogin: function () {
            var overlay = $('<div class="vn-overlay vn-auth-overlay"></div>');

            var html = [
                '<div class="vn-auth">',
                '  <div class="vn-auth__header">',
                '    <h2>👤 Đăng Nhập</h2>',
                '    <button class="vn-btn-close vn-focusable">✕</button>',
                '  </div>',
                '  <div class="vn-auth__body">',
                '    <div class="vn-form">',
                '      <div class="vn-form-group">',
                '        <label>Tên đăng nhập</label>',
                '        <input class="vn-input vn-focusable" id="vn-login-user" type="text" placeholder="Nhập tên đăng nhập..." />',
                '      </div>',
                '      <div class="vn-form-group">',
                '        <label>Mật khẩu</label>',
                '        <input class="vn-input vn-focusable" id="vn-login-pass" type="password" placeholder="Nhập mật khẩu..." />',
                '      </div>',
                '      <div class="vn-form-error vn-hidden" id="vn-login-error"></div>',
                '      <button class="vn-btn vn-btn--primary vn-focusable" id="vn-login-submit">🔑 Đăng Nhập</button>',
                '      <div class="vn-auth__switch">',
                '        Chưa có tài khoản? <button class="vn-link vn-focusable" id="vn-goto-register">Đăng Ký</button>',
                '      </div>',
                '    </div>',
                '  </div>',
                '</div>'
            ].join('');

            overlay.html(html);
            $('body').append(overlay);

            overlay.on('click', '.vn-btn-close', function () { overlay.remove(); });

            overlay.on('click', '#vn-login-submit', function () {
                var username = overlay.find('#vn-login-user').val().trim();
                var password = overlay.find('#vn-login-pass').val();
                var btn = $(this);
                var errEl = overlay.find('#vn-login-error');

                btn.html('⏳ Đang đăng nhập...').prop('disabled', true);
                errEl.addClass('vn-hidden').text('');

                Auth.login(username, password, function (err, user) {
                    btn.html('🔑 Đăng Nhập').prop('disabled', false);
                    if (err) {
                        errEl.removeClass('vn-hidden').text('⚠️ ' + err);
                        return;
                    }
                    Lampa.Noty.show('✅ Đăng nhập thành công! Xin chào ' + user.username);
                    overlay.remove();
                    // Refresh header
                    var loginBtn = $('#vn-btn-login');
                    loginBtn.replaceWith('<button class="vn-topbar-btn vn-focusable" id="vn-btn-profile"><img src="' + user.avatar + '" class="vn-avatar" /> ' + user.username + '</button>');
                    $(document).on('click', '#vn-btn-profile', function () { ProfilePage.open(); });
                });
            });

            overlay.on('click', '#vn-goto-register', function () {
                overlay.remove();
                AuthPage.openRegister();
            });

            overlay.on('keypress', '#vn-login-pass', function (e) {
                if (e.which === 13) overlay.find('#vn-login-submit').click();
            });
        },

        openRegister: function () {
            var overlay = $('<div class="vn-overlay vn-auth-overlay"></div>');

            var html = [
                '<div class="vn-auth">',
                '  <div class="vn-auth__header">',
                '    <h2>📝 Đăng Ký</h2>',
                '    <button class="vn-btn-close vn-focusable">✕</button>',
                '  </div>',
                '  <div class="vn-auth__body">',
                '    <div class="vn-form">',
                '      <div class="vn-form-group">',
                '        <label>Tên đăng nhập</label>',
                '        <input class="vn-input vn-focusable" id="vn-reg-user" type="text" placeholder="Tên đăng nhập..." />',
                '      </div>',
                '      <div class="vn-form-group">',
                '        <label>Email</label>',
                '        <input class="vn-input vn-focusable" id="vn-reg-email" type="email" placeholder="Email của bạn..." />',
                '      </div>',
                '      <div class="vn-form-group">',
                '        <label>Mật khẩu</label>',
                '        <input class="vn-input vn-focusable" id="vn-reg-pass" type="password" placeholder="Tối thiểu 6 ký tự..." />',
                '      </div>',
                '      <div class="vn-form-error vn-hidden" id="vn-reg-error"></div>',
                '      <button class="vn-btn vn-btn--primary vn-focusable" id="vn-reg-submit">📝 Đăng Ký</button>',
                '      <div class="vn-auth__switch">',
                '        Đã có tài khoản? <button class="vn-link vn-focusable" id="vn-goto-login">Đăng Nhập</button>',
                '      </div>',
                '    </div>',
                '  </div>',
                '</div>'
            ].join('');

            overlay.html(html);
            $('body').append(overlay);

            overlay.on('click', '.vn-btn-close', function () { overlay.remove(); });

            overlay.on('click', '#vn-reg-submit', function () {
                var username = overlay.find('#vn-reg-user').val().trim();
                var email = overlay.find('#vn-reg-email').val().trim();
                var password = overlay.find('#vn-reg-pass').val();
                var btn = $(this);
                var errEl = overlay.find('#vn-reg-error');

                btn.html('⏳ Đang đăng ký...').prop('disabled', true);
                errEl.addClass('vn-hidden').text('');

                Auth.register(username, password, email, function (err, user) {
                    btn.html('📝 Đăng Ký').prop('disabled', false);
                    if (err) {
                        errEl.removeClass('vn-hidden').text('⚠️ ' + err);
                        return;
                    }
                    Lampa.Noty.show('🎉 Đăng ký thành công! Xin chào ' + user.username);
                    overlay.remove();
                });
            });

            overlay.on('click', '#vn-goto-login', function () {
                overlay.remove();
                AuthPage.openLogin();
            });
        }
    };

    // ---- TRANG HỒ SƠ ----
    var ProfilePage = {
        open: function () {
            var user = Auth.getUser();
            if (!user) { AuthPage.openLogin(); return; }

            var favCount = Favorites.getAll().length;
            var historyCount = History.getAll().length;
            var overlay = $('<div class="vn-overlay vn-page-overlay"></div>');

            var html = [
                '<div class="vn-subpage">',
                '  <div class="vn-subpage__header">',
                '    <h2>👤 Hồ Sơ</h2>',
                '    <button class="vn-btn-close vn-focusable">✕</button>',
                '  </div>',
                '  <div class="vn-subpage__body">',
                '    <div class="vn-profile">',
                '      <div class="vn-profile__avatar">',
                '        <img src="' + user.avatar + '" alt="' + user.username + '" />',
                '      </div>',
                '      <h2 class="vn-profile__name">' + user.username + '</h2>',
                '      <p class="vn-profile__joined">🗓️ Tham gia: ' + user.joined + '</p>',
                '      <div class="vn-profile__stats">',
                '        <div class="vn-stat">',
                '          <div class="vn-stat__num">' + favCount + '</div>',
                '          <div class="vn-stat__label">Yêu Thích</div>',
                '        </div>',
                '        <div class="vn-stat">',
                '          <div class="vn-stat__num">' + historyCount + '</div>',
                '          <div class="vn-stat__label">Đã Xem</div>',
                '        </div>',
                '      </div>',
                '      <div class="vn-profile__actions">',
                '        <button class="vn-btn vn-focusable" id="vn-goto-fav">❤️ Phim Yêu Thích</button>',
                '        <button class="vn-btn vn-focusable" id="vn-goto-hist">🕐 Lịch Sử Xem</button>',
                '        <button class="vn-btn vn-btn--danger vn-focusable" id="vn-profile-logout">🚪 Đăng Xuất</button>',
                '      </div>',
                '    </div>',
                '  </div>',
                '</div>'
            ].join('');

            overlay.html(html);
            $('body').append(overlay);

            overlay.on('click', '.vn-btn-close', function () { overlay.remove(); });
            overlay.on('click', '#vn-goto-fav', function () { overlay.remove(); FavoritesPage.open(); });
            overlay.on('click', '#vn-goto-hist', function () { overlay.remove(); HistoryPage.open(); });
            overlay.on('click', '#vn-profile-logout', function () {
                Auth.logout();
                overlay.remove();
                var profileBtn = $('#vn-btn-profile');
                if (profileBtn.length) {
                    profileBtn.replaceWith('<button class="vn-topbar-btn vn-topbar-btn--login vn-focusable" id="vn-btn-login">👤 Đăng Nhập</button>');
                    $(document).on('click', '#vn-btn-login', function () { AuthPage.openLogin(); });
                }
            });
        }
    };

    // ==========================================
    // CSS
    // ==========================================
    var Styles = {
        inject: function () {
            if (document.getElementById('vn-plugin-css')) return;
            var css = `
/* ===== RESET & BASE ===== */
.vn-page, .vn-overlay, .vn-subpage, .vn-detail, .vn-auth {
    box-sizing: border-box;
    font-family: 'Segoe UI', 'Roboto', sans-serif;
    color: #fff;
}
*, *::before, *::after { box-sizing: inherit; }

/* ===== OVERLAY ===== */
.vn-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.92);
    z-index: 9000;
    overflow-y: auto;
    padding: 20px;
    animation: vn-fadeIn 0.2s ease;
}

@keyframes vn-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* ===== PAGE ===== */
.vn-page {
    background: #0a0a14;
    min-height: 100vh;
    padding: 0;
}

/* ===== TOPBAR ===== */
.vn-topbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    background: linear-gradient(to bottom, #0d0d1a, transparent);
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-wrap: wrap;
}

.vn-logo {
    font-size: 22px;
    font-weight: 800;
    background: linear-gradient(135deg, #e50914, #ff6b35);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    white-space: nowrap;
    flex-shrink: 0;
}

.vn-topbar__search {
    display: flex;
    flex: 1;
    max-width: 400px;
    gap: 8px;
}

.vn-search-input {
    flex: 1;
    padding: 10px 16px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 24px;
    color: #fff;
    font-size: 14px;
    outline: none;
    transition: all 0.3s;
}

.vn-search-input:focus, .vn-search-input:hover {
    border-color: #e50914;
    background: rgba(229,9,20,0.1);
}

.vn-search-btn {
    padding: 10px 16px;
    background: #e50914;
    border: none;
    border-radius: 24px;
    color: #fff;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
    flex-shrink: 0;
}

.vn-search-btn:hover, .vn-search-btn:focus {
    background: #ff1a1a;
    transform: scale(1.05);
}

.vn-topbar__actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
    flex-wrap: wrap;
}

.vn-topbar-btn {
    padding: 8px 14px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 20px;
    color: #fff;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
}

.vn-topbar-btn:hover, .vn-topbar-btn:focus {
    background: rgba(229,9,20,0.3);
    border-color: #e50914;
}

.vn-topbar-btn--login {
    background: linear-gradient(135deg, #e50914, #b20710);
    border-color: #e50914;
    font-weight: 600;
}

.vn-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    vertical-align: middle;
}

/* ===== TABS ===== */
.vn-tabs {
    display: flex;
    gap: 8px;
    padding: 16px 24px;
    flex-wrap: wrap;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

.vn-tab {
    padding: 8px 20px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    color: #ccc;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.25s;
}

.vn-tab:hover, .vn-tab:focus {
    background: rgba(229,9,20,0.2);
    border-color: #e50914;
    color: #fff;
}

.vn-tab.active {
    background: linear-gradient(135deg, #e50914, #b20710);
    border-color: #e50914;
    color: #fff;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(229,9,20,0.4);
}

/* ===== GENRES BAR ===== */
.vn-genres {
    display: flex;
    gap: 8px;
    padding: 12px 24px;
    flex-wrap: wrap;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.04);
}

.vn-genres__label {
    font-size: 12px;
    color: #888;
    white-space: nowrap;
}

.vn-genre-btn {
    padding: 5px 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    color: #aaa;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
}

.vn-genre-btn:hover, .vn-genre-btn:focus, .vn-genre-btn.active {
    background: rgba(229,9,20,0.2);
    border-color: #e50914;
    color: #fff;
}

/* ===== CONTENT ===== */
.vn-content {
    padding: 24px;
}

/* ===== GRID ===== */
.vn-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 18px;
}

/* ===== CARD ===== */
.vn-card {
    border-radius: 10px;
    overflow: hidden;
    background: #141428;
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
    border: 2px solid transparent;
    outline: none;
    position: relative;
}

.vn-card:hover, .vn-card:focus {
    transform: translateY(-8px) scale(1.03);
    box-shadow: 0 16px 40px rgba(229,9,20,0.45);
    border-color: #e50914;
}

.vn-card__poster {
    position: relative;
    aspect-ratio: 2/3;
    overflow: hidden;
    background: #0d0d1a;
}

.vn-card__poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s;
}

.vn-card:hover .vn-card__poster img {
    transform: scale(1.1);
}

.vn-card__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
    opacity: 0;
    transition: opacity 0.3s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
}

.vn-card:hover .vn-card__overlay {
    opacity: 1;
}

.vn-play-icon {
    width: 52px;
    height: 52px;
    background: rgba(229,9,20,0.95);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 16px rgba(229,9,20,0.6);
}

.vn-fav-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0,0,0,0.7);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
    z-index: 5;
}

.vn-fav-btn:hover { transform: scale(1.2); }
.vn-fav-btn.active { background: rgba(229,9,20,0.8); }

/* BADGES */
.vn-badge {
    position: absolute;
    font-size: 9px;
    font-weight: 800;
    padding: 3px 7px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.vn-badge--quality {
    top: 8px;
    left: 8px;
    background: #e50914;
}

.vn-badge--lang {
    bottom: 8px;
    left: 8px;
    background: rgba(0,0,0,0.85);
    border: 1px solid rgba(255,255,255,0.2);
}

.vn-badge--ep {
    bottom: 8px;
    right: 8px;
    background: rgba(0,150,0,0.85);
}

.vn-card__body {
    padding: 10px 12px;
}

.vn-card__title {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.vn-card__year {
    font-size: 11px;
    color: #777;
    margin-top: 4px;
}

/* ===== PAGINATION ===== */
.vn-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 24px 0;
    flex-wrap: wrap;
}

.vn-page-btn {
    min-width: 38px;
    height: 38px;
    padding: 0 10px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #ccc;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
}

.vn-page-btn:hover, .vn-page-btn:focus {
    background: rgba(229,9,20,0.25);
    border-color: #e50914;
    color: #fff;
}

.vn-page-btn.active {
    background: #e50914;
    border-color: #e50914;
    color: #fff;
    font-weight: 700;
}

.vn-page-btn[disabled] {
    opacity: 0.3;
    cursor: not-allowed;
}

.vn-page-info {
    color: #888;
    font-size: 13px;
    padding: 0 8px;
}

/* ===== LOADING ===== */
.vn-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 16px;
    color: #aaa;
}

.vn-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(229,9,20,0.2);
    border-top-color: #e50914;
    border-radius: 50%;
    animation: vn-spin 0.8s linear infinite;
}

@keyframes vn-spin {
    to { transform: rotate(360deg); }
}

/* ===== ERROR / EMPTY ===== */
.vn-error, .vn-empty {
    text-align: center;
    padding: 60px 20px;
    color: #888;
}

.vn-error { color: #e50914; }
.vn-error__icon, .vn-empty__icon {
    font-size: 48px;
    margin-bottom: 16px;
}

/* ===== BUTTONS ===== */
.vn-btn {
    padding: 10px 24px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.vn-btn:hover, .vn-btn:focus {
    background: rgba(255,255,255,0.15);
    border-color: rgba(255,255,255,0.3);
}

.vn-btn--primary {
    background: linear-gradient(135deg, #e50914, #b20710);
    border-color: #e50914;
    font-weight: 600;
    width: 100%;
    padding: 12px;
    font-size: 15px;
}

.vn-btn--primary:hover, .vn-btn--primary:focus {
    background: linear-gradient(135deg, #ff1a1a, #e50914);
    box-shadow: 0 4px 16px rgba(229,9,20,0.5);
}

.vn-btn--danger {
    background: rgba(229,9,20,0.15);
    border-color: rgba(229,9,20,0.4);
    color: #ff6b6b;
}

.vn-btn--danger:hover, .vn-btn--danger:focus {
    background: rgba(229,9,20,0.3);
    border-color: #e50914;
    color: #fff;
}

.vn-link {
    background: none;
    border: none;
    color: #e50914;
    cursor: pointer;
    font-size: inherit;
    text-decoration: underline;
    padding: 0;
}

/* ===== SUBPAGE ===== */
.vn-subpage {
    background: #0d0d1a;
    border-radius: 12px;
    max-width: 960px;
    margin: 0 auto;
    overflow: hidden;
}

.vn-subpage__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    background: rgba(229,9,20,0.05);
}

.vn-subpage__header h2 {
    margin: 0;
    font-size: 20px;
}

.vn-subpage__actions {
    display: flex;
    gap: 10px;
    align-items: center;
}

.vn-btn-close {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
}

.vn-btn-close:hover, .vn-btn-close:focus {
    background: #e50914;
    border-color: #e50914;
    transform: scale(1.1);
}

.vn-subpage__body {
    padding: 24px;
    max-height: 80vh;
    overflow-y: auto;
}

/* ===== DETAIL PAGE ===== */
.vn-detail-overlay {
    padding: 0;
}

.vn-detail {
    background: #090912;
    min-height: 100vh;
    position: relative;
}

.vn-detail__bg {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60vh;
    background-size: cover;
    background-position: center top;
    filter: blur(24px) brightness(0.25);
    z-index: 0;
    pointer-events: none;
}

.vn-detail__close {
    position: fixed;
    top: 20px;
    right: 24px;
    z-index: 200;
    background: rgba(0,0,0,0.7);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 50%;
    width: 42px;
    height: 42px;
    color: #fff;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    backdrop-filter: blur(4px);
}

.vn-detail__close:hover, .vn-detail__close:focus {
    background: #e50914;
    border-color: #e50914;
    transform: scale(1.1);
}

.vn-detail__hero {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 32px;
    padding: 60px 32px 32px;
    align-items: flex-start;
}

.vn-detail__poster {
    flex-shrink: 0;
}

.vn-detail__poster img {
    width: 200px;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.7);
    display: block;
}

.vn-detail__poster-actions {
    margin-top: 12px;
}

.vn-btn-fav-detail {
    width: 100%;
    padding: 10px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
}

.vn-btn-fav-detail:hover, .vn-btn-fav-detail:focus,
.vn-btn-fav-detail.active {
    background: rgba(229,9,20,0.25);
    border-color: #e50914;
}

.vn-detail__title {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 6px;
    line-height: 1.2;
}

.vn-detail__original {
    color: #999;
    font-style: italic;
    margin-bottom: 16px;
    font-size: 15px;
}

.vn-detail__tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 14px;
}

.vn-tag {
    padding: 4px 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    font-size: 12px;
    color: #ccc;
}

.vn-tag--red { background: rgba(229,9,20,0.25); border-color: #e50914; color: #ff8080; }
.vn-tag--green { background: rgba(0,180,0,0.2); border-color: #00b400; color: #80ff80; }
.vn-tag--gold { background: rgba(255,180,0,0.2); border-color: #ffb400; color: #ffd700; }

.vn-detail__genres, .vn-detail__countries {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
}

.vn-genre-tag {
    padding: 4px 12px;
    background: rgba(229,9,20,0.12);
    border: 1px solid rgba(229,9,20,0.3);
    border-radius: 12px;
    font-size: 11px;
    color: #ff9999;
}

.vn-country-tag {
    padding: 4px 12px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    font-size: 11px;
    color: #bbb;
}

.vn-detail__desc {
    font-size: 14px;
    line-height: 1.8;
    color: #ccc;
    margin-bottom: 12px;
    max-height: 120px;
    overflow: hidden;
}

.vn-detail__cast, .vn-detail__director {
    font-size: 13px;
    color: #aaa;
    margin-bottom: 6px;
}

.vn-detail__cast strong, .vn-detail__director strong {
    color: #ddd;
}

/* DETAIL TABS */
.vn-detail__tabs {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 6px;
    padding: 0 32px;
    border-bottom: 2px solid rgba(255,255,255,0.06);
}

.vn-detail-tab {
    padding: 12px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    color: #888;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.vn-detail-tab:hover, .vn-detail-tab:focus { color: #fff; }
.vn-detail-tab.active { color: #e50914; border-bottom-color: #e50914; font-weight: 600; }

.vn-detail__panel {
    position: relative;
    z-index: 1;
    padding: 24px 32px;
}

.vn-hidden { display: none !important; }

/* SERVER & EPISODES */
.vn-server-block {
    margin-bottom: 24px;
}

.vn-server-name {
    font-size: 12px;
    font-weight: 700;
    color: #ff6b35;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
    padding-left: 10px;
    border-left: 3px solid #ff6b35;
}

.vn-ep-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.vn-ep-btn {
    position: relative;
    padding: 8px 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #ccc;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    overflow: hidden;
    min-width: 60px;
    text-align: center;
}

.vn-ep-btn:hover, .vn-ep-btn:focus {
    background: rgba(229,9,20,0.2);
    border-color: #e50914;
    color: #fff;
}

.vn-ep-btn.active {
    background: #e50914;
    border-color: #e50914;
    color: #fff;
    font-weight: 700;
}

.vn-ep-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: #4caf50;
    border-radius: 0 0 8px 8px;
}

/* SUBTITLES */
.vn-subtitles h3 {
    font-size: 18px;
    margin-bottom: 8px;
}

.vn-sub-desc {
    color: #888;
    font-size: 13px;
    margin-bottom: 16px;
}

.vn-sub-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    margin-bottom: 8px;
}

.vn-sub-info {
    font-size: 13px;
    color: #ccc;
}

.vn-sub-rating {
    font-size: 11px;
    color: #888;
    margin-top: 2px;
}

.vn-sub-manual {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.06);
}

.vn-sub-manual h4 {
    font-size: 14px;
    color: #aaa;
    margin-bottom: 12px;
}

.vn-sub-input-row {
    display: flex;
    gap: 10px;
}

.vn-input {
    flex: 1;
    padding: 10px 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
}

.vn-input:focus, .vn-input:hover {
    border-color: #e50914;
}

/* HISTORY */
.vn-history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.vn-history-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    outline: none;
    position: relative;
}

.vn-history-item:hover, .vn-history-item:focus {
    background: rgba(229,9,20,0.1);
    border-color: rgba(229,9,20,0.3);
}

.vn-history-item__poster {
    width: 60px;
    flex-shrink: 0;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
}

.vn-history-item__poster img {
    width: 100%;
    aspect-ratio: 2/3;
    object-fit: cover;
    display: block;
}

.vn-history-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255,255,255,0.2);
}

.vn-history-progress__bar {
    height: 100%;
    background: #4caf50;
}

.vn-history-item__info {
    flex: 1;
    min-width: 0;
}

.vn-history-item__title {
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.vn-history-item__ep, .vn-history-item__date {
    font-size: 12px;
    color: #888;
    margin-top: 3px;
}

.vn-history-item__progress {
    font-size: 11px;
    color: #4caf50;
    margin-top: 3px;
}

.vn-history-del {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 8px;
    opacity: 0.4;
    transition: opacity 0.2s;
    flex-shrink: 0;
}

.vn-history-del:hover { opacity: 1; }

/* AUTH */
.vn-auth-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
}

.vn-auth {
    background: #0d0d1a;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    overflow: hidden;
    box-shadow: 0 24px 80px rgba(0,0,0,0.8);
    animation: vn-slideUp 0.3s ease;
}

@keyframes vn-slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.vn-auth__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: rgba(229,9,20,0.05);
    border-bottom: 1px solid rgba(255,255,255,0.06);
}

.vn-auth__header h2 { margin: 0; font-size: 20px; }

.vn-auth__body { padding: 24px; }

.vn-form-group {
    margin-bottom: 16px;
}

.vn-form-group label {
    display: block;
    font-size: 13px;
    color: #aaa;
    margin-bottom: 6px;
    font-weight: 500;
}

.vn-form-group .vn-input {
    width: 100%;
    padding: 12px 16px;
    font-size: 15px;
}

.vn-form-error {
    background: rgba(229,9,20,0.15);
    border: 1px solid rgba(229,9,20,0.4);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    color: #ff8080;
    margin-bottom: 14px;
}

.vn-auth__switch {
    text-align: center;
    margin-top: 16px;
    font-size: 13px;
    color: #888;
}

/* PROFILE */
.vn-profile {
    text-align: center;
    padding: 20px 0;
}

.vn-profile__avatar img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 3px solid #e50914;
    box-shadow: 0 8px 24px rgba(229,9,20,0.4);
    margin-bottom: 16px;
}

.vn-profile__name {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
}

.vn-profile__joined {
    color: #888;
    font-size: 13px;
    margin-bottom: 24px;
}

.vn-profile__stats {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 32px;
    padding: 20px;
    background: rgba(255,255,255,0.03);
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.06);
}

.vn-stat__num {
    font-size: 32px;
    font-weight: 800;
    color: #e50914;
}

.vn-stat__label {
    font-size: 12px;
    color: #888;
    margin-top: 4px;
}

.vn-profile__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 280px;
    margin: 0 auto;
}

/* ===== VIRTUAL KEYBOARD ===== */
.vn-keyboard {
    background: #111122;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 20px;
    max-width: 480px;
    margin: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.vn-keyboard__display {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 18px;
    margin-bottom: 16px;
    min-height: 48px;
    word-break: break-all;
    color: #fff;
}

.vn-keyboard__row {
    display: flex;
    gap: 6px;
    justify-content: center;
    margin-bottom: 6px;
    flex-wrap: wrap;
}

.vn-kb-key {
    min-width: 38px;
    height: 38px;
    padding: 0 8px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.15s;
}

.vn-kb-key:hover, .vn-kb-key:focus {
    background: #e50914;
    border-color: #e50914;
}

/* ===== FOCUS (TV REMOTE) ===== */
.vn-focusable {
    outline: none;
}

.vn-focusable:focus {
    outline: 2px solid #e50914;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(229,9,20,0.25);
}

/* ===== SCROLLBAR ===== */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0d0d1a; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #e50914; }

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
    .vn-topbar { padding: 12px 16px; gap: 10px; }
    .vn-topbar__search { max-width: 100%; order: 3; flex: 1 1 100%; }
    .vn-content { padding: 16px; }
    .vn-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
    .vn-detail__hero { flex-direction: column; padding: 40px 20px 20px; }
    .vn-detail__poster img { width: 140px; }
    .vn-detail__title { font-size: 20px; }
    .vn-detail__panel { padding: 20px; }
    .vn-detail__tabs { padding: 0 20px; }
}

@media (max-width: 480px) {
    .vn-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
    .vn-tabs { padding: 12px 16px; }
    .vn-topbar-btn span { display: none; }
}
            `;

            var style = document.createElement('style');
            style.id = 'vn-plugin-css';
            style.textContent = css;
            document.head.appendChild(style);
        }
    };

    // ==========================================
    // KHỞI ĐỘNG PLUGIN
    // ==========================================
    function bootstrap() {
        // Inject CSS
        Styles.inject();

        // Khởi tạo TV Remote
        TVRemote.init();

        // Đăng ký component Lampa
        Lampa.Component.add(CONFIG.name, {
            create: function () {
                var container = $('<div></div>');
                HomePage.render(container);
                this.render(container);
            },

            render: function (container) {
                this.el = container;
                return container;
            },

            destroy: function () {
                if (this.el) this.el.remove();
            }
        });

        // Thêm vào menu Lampa
        Lampa.Menu.add({
            title: CONFIG.title,
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>',
            onSelect: function () {
                Lampa.Activity.push({
                    url: '',
                    title: CONFIG.title,
                    component: CONFIG.name,
                    page: 1
                });
            }
        });

        console.log('[' + CONFIG.title + '] v' + CONFIG.version + ' ✅ Khởi động thành công!');
    }

    // Chạy khi sẵn sàng
    if (window.appready) {
        bootstrap();
    } else {
        document.addEventListener('appready', bootstrap);
    }

})();