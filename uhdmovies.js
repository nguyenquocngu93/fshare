(function () {
    'use strict';

    var SOURCE_NAME = 'uhdmovies';
    var CAT_NAME    = 'UHDMovies';
    var BASE_URL    = 'https://uhdmovies.ink';
    var IMG_URL     = 'https://uhdmovies.ink';
    var TMDB_TOKEN  = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
    var TMDB_BASE   = 'https://api.themoviedb.org/3';
    var TMDB_IMG    = 'https://image.tmdb.org/t/p/';

    var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    // =====================================================================
    // CSS
    // =====================================================================
    function injectCSS() {
        if (document.getElementById('uhd-style')) return;
        var s = document.createElement('style');
        s.id = 'uhd-style';
        s.textContent = '.card__type{display:none!important}.card-label--type{display:none!important}.card__label--tv{display:none!important}.item__type{display:none!important}';
        document.head.appendChild(s);
    }

    // =====================================================================
    // HELPERS
    // =====================================================================
    function getPoster(url) {
        if (!url) return '';
        if (url.indexOf('http') === 0) return url;
        if (url.indexOf('//') === 0) return 'https:' + url;
        return IMG_URL + url;
    }

    function normalizeItem(item) {
        if (!item) return {};
        return {
            id:                   item.slug || item.id || '',
            title:                item.title || item.name || '',
            name:                 item.name || item.title || '',
            original_title:       item.original_title || item.title || '',
            original_name:        item.original_name || item.name || '',
            img:                  getPoster(item.poster || item.thumbnail || item.image),
            poster:               getPoster(item.poster || item.thumbnail || item.image),
            release_date:         item.year ? (item.year + '-01-01') : '',
            vote_average:         item.rating || 0,
            overview:             item.description || item.overview || '',
            source:               SOURCE_NAME,
            uhd_slug:             item.slug || item.id || '',
            uhd_year:             item.year || 0,
        };
    }

    // =====================================================================
    // TMDB HELPERS
    // =====================================================================
    function tmdbAjax(url, onOk, onFail) {
        $.ajax({
            url: url, type: 'GET',
            headers: { 'Authorization': 'Bearer ' + TMDB_TOKEN },
            success: onOk,
            error:   onFail || function () {},
        });
    }

    function fetchTMDBDetail(tmdbId, mediaType, onDone) {
        var url = TMDB_BASE + '/' + mediaType + '/' + tmdbId
                + '?language=vi-VN&append_to_response=credits,images';
        tmdbAjax(url, function (t) { onDone(t); }, function () { onDone(null); });
    }

    function enrichWithTMDB(result, onDone) {
        var tmdbId = result.tmdb_id || '';
        var mediaType = result.type === 'tv' ? 'tv' : 'movie';
        
        if (tmdbId) {
            fetchTMDBDetail(tmdbId, mediaType, function (t) {
                if (t) {
                    if (t.backdrop_path) {
                        result.backdrop_path = t.backdrop_path;
                        result.background_image = TMDB_IMG + 'original' + t.backdrop_path;
                    }
                    if (t.poster_path && !result.poster) {
                        result.poster = TMDB_IMG + 'w500' + t.poster_path;
                        result.img = result.poster;
                    }
                    if (t.vote_average) result.vote_average = t.vote_average;
                    if (t.release_date) result.release_date = t.release_date;
                    if (t.first_air_date) result.first_air_date = t.first_air_date;
                    result.tmdb_id = String(t.id);
                }
                onDone(result);
            });
        } else {
            onDone(result);
        }
    }

    // =====================================================================
    // DANH MUC
    // =====================================================================
    var CATEGORIES = [
        { url: '/',                      title: 'Phim mới' },
        { url: '/category/4k-uhd/',      title: '4K UHD' },
        { url: '/category/1080p/',       title: '1080p' },
        { url: '/category/2160p/',       title: '2160p' },
        { url: '/category/dual-audio/',  title: 'Dual Audio' },
        { url: '/category/web-dl/',      title: 'WEB-DL' },
        { url: '/category/hindi-dubbed/','title' 'Hindi Dubbed' },
        { url: '/genre/action/',         title: 'Hành Động' },
        { url: '/genre/adventure/',      title: 'Phiêu Lưu' },
        { url: '/genre/comedy/',         title: 'Hài Hước' },
        { url: '/genre/drama/',          title: 'Chính Kịch' },
        { url: '/genre/horror/',         title: 'Kinh Dị' },
        { url: '/genre/sci-fi/',         title: 'Viễn Tưởng' },
        { url: '/genre/thriller/',       title: 'Gây Cấn' },
    ];

    // =====================================================================
    // FETCH PAGE - Lấy danh sách phim
    // =====================================================================
    function fetchPage(catUrl, page, onOk, onFail) {
        var net = new Lampa.Reguest();
        var fullUrl = catUrl;
        
        if (fullUrl.indexOf('http') !== 0) {
            fullUrl = BASE_URL + fullUrl;
        }
        
        // Xử lý phân trang của UHDMovies
        if (page > 1) {
            if (fullUrl.indexOf('?') === -1) {
                fullUrl = fullUrl + '?page=' + page;
            } else {
                fullUrl = fullUrl + '&page=' + page;
            }
        }
        
        console.log('[UHDMovies] Fetching:', fullUrl);
        
        net.silent(fullUrl, function (data) {
            var items = [], totalPages = 1;
            
            try {
                var $html = $(data);
                
                // Tìm các bài viết/phim - cấu trúc của UHDMovies
                $html.find('article, .post, .movie-item, .item, .bs, .blog-post').each(function() {
                    var $this = $(this);
                    var link = $this.find('h2 a, h3 a, .entry-title a, .title a').first().attr('href') || '';
                    var title = $this.find('h2 a, h3 a, .entry-title a, .title a').first().text().trim();
                    var poster = $this.find('img').first().attr('src') || '';
                    var year = $this.find('.year, .date, .release-year').text().trim();
                    
                    if (link && title) {
                        var slug = link.split('/').filter(function(p) { return p; }).pop();
                        items.push({
                            slug: slug,
                            title: title,
                            poster: poster,
                            year: parseInt(year) || 0
                        });
                    }
                });
                
                // Lấy tổng số trang từ phân trang
                var pagination = $html.find('.pagination .page-numbers:not(.next):not(.prev)').last();
                if (pagination.length) {
                    var lastPage = parseInt(pagination.text());
                    if (!isNaN(lastPage)) totalPages = lastPage;
                }
                
                items = items.map(normalizeItem);
                
            } catch (e) {
                console.error('[UHDMovies] Lỗi parse:', e);
            }
            
            console.log('[UHDMovies] Loaded', items.length, 'items');
            
            onOk({ 
                items: items, 
                page: page, 
                totalPages: totalPages, 
                totalItems: items.length,
                cat_url: catUrl
            });
        }, function (err) {
            console.error('[UHDMovies] Lỗi fetch:', err);
            if (onFail) onFail(err);
            else onOk({ items: [], page: page, totalPages: 1, totalItems: 0 });
        });
    }

    // =====================================================================
    // FETCH DETAIL - Lấy chi tiết phim và tất cả server
    // =====================================================================
    var _detailCache = {};

    function fetchDetail(slug, callback) {
        if (_detailCache[slug]) { 
            callback(_detailCache[slug]); 
            return; 
        }
        
        var net = new Lampa.Reguest();
        var url = BASE_URL + '/' + slug + '/';
        
        net.silent(url, function (html) {
            var result = {
                title: '',
                poster: '',
                description: '',
                year: 0,
                rating: 0,
                servers: []  // Danh sách server: [{ name: 'Server 1', links: [{ quality, url }] }]
            };
            
            try {
                var $html = $(html);
                
                // Lấy tiêu đề
                result.title = $html.find('h1.entry-title, h1.title, .post-title').first().text().trim();
                
                // Lấy poster
                var posterImg = $html.find('.poster img, .featured-image img, .wp-post-image, .movie-poster img').first();
                result.poster = posterImg.attr('src') || posterImg.attr('data-src') || '';
                
                // Lấy mô tả
                result.description = $html.find('.entry-content p, .description, .movie-description').first().text().trim();
                
                // Lấy năm
                var yearText = $html.find('.release-year, .year, .movie-year').text().trim();
                result.year = parseInt(yearText) || 0;
                
                // ===== QUAN TRỌNG: Lấy tất cả link server =====
                // Tìm tất cả link tải/phát
                var allLinks = [];
                
                // Tìm trong phần download links
                $html.find('.download-links a, .download a, .movie-links a, .server a, .btn-download, a[href*="pixeldrain"], a[href*="drive.google"], a[href*="mega.nz"], a[href*="mediafire"], a[href*="gdtot"], a[href*="filepress"]').each(function() {
                    var $a = $(this);
                    var href = $a.attr('href');
                    var text = $a.text().trim();
                    var quality = '';
                    
                    // Lấy chất lượng từ text hoặc class
                    if (text.match(/4k|2160p/i)) quality = '4K';
                    else if (text.match(/1080p|full hd/i)) quality = '1080p';
                    else if (text.match(/720p|hd/i)) quality = '720p';
                    else if (text.match(/hevc|x265/i)) quality = 'HEVC';
                    else if (text.match(/hdr/i)) quality = 'HDR';
                    else quality = text || 'Download';
                    
                    if (href && href.indexOf('http') === 0) {
                        allLinks.push({
                            quality: quality,
                            url: href,
                            server: 'Direct'
                        });
                    }
                });
                
                // Gom nhóm theo server nếu có
                if (allLinks.length) {
                    // Gom theo chất lượng để hiển thị menu
                    var qualityGroups = {};
                    allLinks.forEach(function(link) {
                        if (!qualityGroups[link.quality]) {
                            qualityGroups[link.quality] = [];
                        }
                        qualityGroups[link.quality].push(link);
                    });
                    
                    // Tạo danh sách server (mỗi chất lượng là 1 server)
                    for (var q in qualityGroups) {
                        result.servers.push({
                            name: q,
                            links: qualityGroups[q]
                        });
                    }
                }
                
                // Fallback: Nếu không tìm thấy link, tìm trong nội dung
                if (result.servers.length === 0) {
                    var content = $html.find('.entry-content').html() || '';
                    var urlMatches = content.match(/https?:\/\/[^\s"'<>]+/g);
                    if (urlMatches) {
                        var uniqueUrls = [...new Set(urlMatches)];
                        uniqueUrls.forEach(function(url, idx) {
                            if (url.indexOf('uhdmovies') === -1) {
                                result.servers.push({
                                    name: 'Server ' + (idx + 1),
                                    links: [{ quality: 'Link', url: url }]
                                });
                            }
                        });
                    }
                }
                
                _detailCache[slug] = result;
                
            } catch (e) {
                console.error('[UHDMovies] Lỗi parse detail:', e);
                _detailCache[slug] = result;
            }
            
            callback(_detailCache[slug]);
        }, function (err) {
            console.error('[UHDMovies] Lỗi fetch detail:', err);
            callback(null);
        });
    }

    // =====================================================================
    // HIỂN THỊ MENU CHỌN SERVER
    // =====================================================================
    function showServerMenu(card, detail) {
        if (!detail || !detail.servers || !detail.servers.length) {
            Lampa.Noty.show('Không tìm thấy link phát');
            return;
        }
        
        var title = card.title || '';
        var poster = card.img || card.poster || '';
        
        // Nếu chỉ có 1 server duy nhất
        if (detail.servers.length === 1 && detail.servers[0].links.length === 1) {
            Lampa.Player.play({
                url: detail.servers[0].links[0].url,
                title: title,
                poster: poster
            });
            return;
        }
        
        // Nếu chỉ có 1 server nhưng nhiều link (nhiều chất lượng)
        if (detail.servers.length === 1 && detail.servers[0].links.length > 1) {
            var server = detail.servers[0];
            var items = server.links.map(function(link, idx) {
                return { title: link.quality, index: idx };
            });
            
            Lampa.Select.show({
                title: 'Chọn chất lượng',
                items: items,
                onSelect: function(item) {
                    var link = server.links[item.index];
                    if (link && link.url) {
                        Lampa.Player.play({
                            url: link.url,
                            title: title + ' - ' + link.quality,
                            poster: poster
                        });
                    }
                }
            });
            return;
        }
        
        // Nhiều server
        var serverItems = detail.servers.map(function(server, idx) {
            return { title: server.name, index: idx };
        });
        
        Lampa.Select.show({
            title: 'Chọn server',
            items: serverItems,
            onSelect: function(item) {
                var server = detail.servers[item.index];
                
                // Nếu server có nhiều link
                if (server.links.length > 1) {
                    var qualityItems = server.links.map(function(link, idx) {
                        return { title: link.quality, index: idx };
                    });
                    
                    Lampa.Select.show({
                        title: 'Chọn chất lượng',
                        items: qualityItems,
                        onSelect: function(qItem) {
                            var link = server.links[qItem.index];
                            if (link && link.url) {
                                Lampa.Player.play({
                                    url: link.url,
                                    title: title + ' - ' + server.name + ' - ' + link.quality,
                                    poster: poster
                                });
                            }
                        }
                    });
                } else if (server.links.length === 1) {
                    Lampa.Player.play({
                        url: server.links[0].url,
                        title: title + ' - ' + server.name,
                        poster: poster
                    });
                }
            }
        });
    }

    // =====================================================================
    // API SOURCE
    // =====================================================================
    function UHDMoviesApi() {
        var self = this;
        self.network = new Lampa.Reguest();

        self.list = function (params, onComplete, onError) {
            var page = params.page || 1;
            var catUrl = params.cat_url || params.url || '/';
            
            fetchPage(catUrl, page, function (res) {
                onComplete({
                    results:       res.items,
                    page:          res.page,
                    total_pages:   res.totalPages,
                    total_results: res.totalItems,
                    cat_url:       catUrl,
                    url:           catUrl,
                });
            }, onError);
        };

        self.category = function (params, onComplete, onError) {
            var parts = CATEGORIES.map(function (cat) {
                return function (cb) {
                    fetchPage(cat.url, 1, function (res) {
                        cb({ 
                            title: cat.title, 
                            results: res.items, 
                            url: cat.url, 
                            cat_url: cat.url,
                            page: 1, 
                            total_pages: res.totalPages, 
                            total_results: res.totalItems, 
                            source: SOURCE_NAME 
                        });
                    }, function () { 
                        cb({ title: cat.title, results: [], url: cat.url, cat_url: cat.url }); 
                    });
                };
            });
            Lampa.Api.partNext(parts, 2, onComplete, onError);
        };

        self.full = function (params, onComplete, onError) {
            var card = params.card || {};
            var slug = card.uhd_slug || card.id;
            if (!slug) { 
                if (onError) onError('no slug'); 
                return; 
            }

            fetchDetail(slug, function (detail) {
                if (!detail) {
                    if (onError) onError('Không tìm thấy');
                    return;
                }
                
                var result = {
                    id: slug,
                    title: detail.title,
                    name: detail.title,
                    original_title: detail.title,
                    overview: detail.description,
                    poster: getPoster(detail.poster),
                    img: getPoster(detail.poster),
                    year: detail.year,
                    rating: detail.rating,
                    source: SOURCE_NAME,
                    servers: detail.servers  // Lưu servers để hiển thị
                };
                
                // Enrich TMDB
                enrichWithTMDB(result, function (enriched) {
                    onComplete({ movie: enriched });
                });
            }, onError);
        };

        self.search = function (params, onComplete, onError) {
            var q = encodeURIComponent(params.query || '');
            var url = BASE_URL + '?s=' + q;
            
            var net = new Lampa.Reguest();
            net.silent(url, function (html) {
                var items = [];
                try {
                    var $html = $(html);
                    $html.find('article, .post, .search-result, .item').each(function() {
                        var $this = $(this);
                        var link = $this.find('h2 a, h3 a, .entry-title a').first().attr('href') || '';
                        var title = $this.find('h2 a, h3 a, .entry-title a').first().text().trim();
                        var poster = $this.find('img').first().attr('src') || '';
                        
                        if (link && title) {
                            var slug = link.split('/').filter(function(p) { return p; }).pop();
                            items.push({
                                slug: slug,
                                title: title,
                                poster: poster
                            });
                        }
                    });
                    items = items.map(normalizeItem);
                } catch (e) {}
                
                onComplete({ 
                    results: items, 
                    page: 1, 
                    total_pages: 1, 
                    total_results: items.length 
                });
            }, onError);
        };

        self.clear = function () { self.network.clear(); };
    }

    // =====================================================================
    // COMPONENT: DANH SÁCH INFINITE SCROLL
    // =====================================================================
    function UHDMoviesListComponent(object) {
        var catUrl   = object.cat_url || object.url || '/';
        var catTitle = object.title   || 'UHDMovies';
        var curPage  = object.page || 1;
        var totalPages = 1;
        var loading = false;
        var itemsLoaded = [];

        var $html = $(
            '<div class="uhd-list-wrap" style="min-height:100vh;">' +
            '<div class="uhd-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px;"></div>' +
            '<div class="uhd-loader" style="text-align:center;padding:1.5em;display:none;"><span style="opacity:.5;font-size:.9em;">Đang tải...</span></div>' +
            '<div class="uhd-end" style="text-align:center;padding:1em;display:none;"><span style="opacity:.4;font-size:.85em;">— Đã tải hết phim —</span></div>' +
            '</div>'
        );
        var $grid   = $html.find('.uhd-grid');
        var $loader = $html.find('.uhd-loader');
        var $end    = $html.find('.uhd-end');

        function renderCard(item) {
            var poster = item.img || item.poster || '';
            var year   = item.release_date ? item.release_date.slice(0, 4) : (item.year || '');
            var $card  = $(
                '<div class="uhd-card selector" style="cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;">' +
                '<div style="position:relative;padding-top:150%;background:#111;">' +
                '<img src="' + poster + '" loading="lazy" decoding="async" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/>' +
                '</div>' +
                '<div style="padding:6px 8px;">' +
                '<div style="font-size:13px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + (item.title || '') + '</div>' +
                '<div style="font-size:11px;opacity:.5;margin-top:2px;">' + year + '</div>' +
                '</div></div>'
            );
            $card.on('hover:enter click', function () {
                Lampa.Activity.push({ component: 'full', id: item.id, source: SOURCE_NAME, card: item });
            });
            $grid.append($card);
        }

        function clearGrid() {
            $grid.empty();
            itemsLoaded = [];
        }

        function loadPage(page) {
            if (loading) return;
            if (page > totalPages && totalPages > 0) {
                $end.show();
                return;
            }
            
            loading = true;
            $loader.show();
            
            fetchPage(catUrl, page, function (res) {
                totalPages = res.totalPages || 1;
                
                var newItems = res.items.filter(function(item) {
                    return !itemsLoaded.includes(item.id);
                });
                
                newItems.forEach(function(item) {
                    itemsLoaded.push(item.id);
                    renderCard(item);
                });
                
                loading = false;
                $loader.hide();
                
                if (curPage >= totalPages) {
                    $end.show();
                }
            }, function (err) {
                loading = false;
                $loader.hide();
            });
        }

        var scrollTimeout;
        function onScroll() {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                var scrollContainer = document.querySelector('.activity__body') || 
                                      document.querySelector('.layer__scroll') ||
                                      document.querySelector('.app__content') ||
                                      window;
                
                var scrollTop, scrollHeight, clientHeight;
                
                if (scrollContainer === window) {
                    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    scrollHeight = document.documentElement.scrollHeight;
                    clientHeight = window.innerHeight;
                } else {
                    scrollTop = scrollContainer.scrollTop;
                    scrollHeight = scrollContainer.scrollHeight;
                    clientHeight = scrollContainer.clientHeight;
                }
                
                if (scrollTop + clientHeight >= scrollHeight - 400) {
                    if (!loading && curPage < totalPages) {
                        curPage++;
                        loadPage(curPage);
                    }
                }
            }, 100);
        }

        function attachScrollListener() {
            var scrollContainer = document.querySelector('.activity__body') || 
                                  document.querySelector('.layer__scroll') ||
                                  window;
            
            if (scrollContainer === window) {
                window.addEventListener('scroll', onScroll, true);
            } else {
                scrollContainer.addEventListener('scroll', onScroll);
            }
            
            $html.data('scrollContainer', scrollContainer);
            $html.data('scrollListener', onScroll);
        }

        function detachScrollListener() {
            var scrollContainer = $html.data('scrollContainer');
            var listener = $html.data('scrollListener');
            if (scrollContainer && listener) {
                if (scrollContainer === window) {
                    window.removeEventListener('scroll', listener, true);
                } else {
                    scrollContainer.removeEventListener('scroll', listener);
                }
            }
        }

        this.create = function () {
            clearGrid();
            curPage = 1;
            totalPages = 1;
            loadPage(1);
            attachScrollListener();
            return $html;
        };
        
        this.start = function () { return this.create(); };
        this.render = function () { return $html; };
        this.header = function () { return catTitle; };
        this.pause = function () { detachScrollListener(); };
        this.resume = function () { attachScrollListener(); };
        this.stop = function () { detachScrollListener(); };
        this.destroy = function () {
            detachScrollListener();
            clearGrid();
            $html.remove();
        };
    }

    // =====================================================================
    // KHỞI ĐỘNG
    // =====================================================================
    function startPlugin() {
        if (window.uhdmovies_started) return;
        window.uhdmovies_started = true;

        injectCSS();
        Lampa.Api.sources[SOURCE_NAME] = new UHDMoviesApi();
        Lampa.Component.add('uhdmovies_list', UHDMoviesListComponent);

        // Xử lý khi mở trang chi tiết phim
        Lampa.Listener.follow('full', function (e) {
            var obj = e.object || {};
            var card = (e.data && e.data.movie) ? e.data.movie : (obj.card || (obj.activity && obj.activity.card));
            if (!card || card.source !== SOURCE_NAME) return;
            var slug = card.uhd_slug || card.id;

            if (e.type === 'destroy') {
                return;
            }
            if (e.type !== 'complite') return;

            var $render = obj.activity ? obj.activity.render() : (obj.render ? obj.render() : null);
            var $ctx = $render || $('body');

            // Thêm nút UHDMovies vào trang chi tiết
            if (!$ctx.find('.view--uhdmovies').length) {
                var $btn = $(
                    '<div class="full-start__button selector view--uhdmovies" data-subtitle="UHDMovies">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44">' +
                    '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>' +
                    '<path d="M9.5 8.5L15.5 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>' +
                    '<span>UHDMovies</span></div>'
                );
                
                $btn.on('hover:enter click', function () {
                    fetchDetail(slug, function (detail) {
                        if (!detail || !detail.servers || !detail.servers.length) {
                            Lampa.Noty.show('Không tìm thấy link phát');
                            return;
                        }
                        showServerMenu(card, detail);
                    });
                });
                
                var $tor = $ctx.find('.view--torrent');
                if ($tor.length) $tor.after($btn);
                else $ctx.find('.full-start__buttons').append($btn);
            }
        });

        // Thêm vào menu chính
        var $item = $(
            '<li data-action="' + SOURCE_NAME + '" class="menu__item selector">' +
            '<div class="menu__ico">' + ICON + '</div>' +
            '<div class="menu__text">' + CAT_NAME + '</div></li>'
        );
        $item.on('hover:enter', function () {
            Lampa.Activity.push({ title: CAT_NAME, component: 'category', source: SOURCE_NAME, page: 1 });
        });
        
        // Chờ menu load xong rồi thêm
        setTimeout(function() {
            $('.menu .menu__list').eq(0).append($item);
        }, 1000);
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();