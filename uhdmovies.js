(function () {
    'use strict';

    var SOURCE_NAME = 'uhdmovies';
    var CAT_NAME    = 'UHDMovies';
    var BASE_URL    = 'https://uhdmovies.ink';
    var IMG_URL     = 'https://uhdmovies.ink';

    var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    function injectCSS() {
        if (document.getElementById('uhd-style')) return;
        var s = document.createElement('style');
        s.id = 'uhd-style';
        s.textContent = '.card__type{display:none!important}.card-label--type{display:none!important}';
        document.head.appendChild(s);
    }

    function getPoster(url) {
        if (!url) return '';
        if (url.indexOf('http') === 0) return url;
        if (url.indexOf('//') === 0) return 'https:' + url;
        return IMG_URL + url;
    }

    function normalizeItem(item) {
        if (!item) return {};
        return {
            id: item.slug || '',
            title: item.title || '',
            name: item.title || '',
            img: getPoster(item.poster),
            poster: getPoster(item.poster),
            year: item.year || '',
            overview: item.description || '',
            source: SOURCE_NAME,
            uhd_slug: item.slug || ''
        };
    }

    var CATEGORIES = [
        { url: '/', title: 'Phim mới' },
        { url: '/category/4k-uhd/', title: '4K UHD' },
        { url: '/category/1080p/', title: '1080p' },
        { url: '/category/2160p/', title: '2160p' },
        { url: '/category/dual-audio/', title: 'Dual Audio' },
        { url: '/category/web-dl/', title: 'WEB-DL' },
        { url: '/category/hindi-dubbed/', title: 'Hindi Dubbed' }
    ];

    // ========== FETCH PAGE - CẢI THIỆN NHIỀU FALLBACK ==========
    function fetchPage(catUrl, page, onOk, onFail) {
        var net = new Lampa.Reguest();
        var fullUrl = catUrl;
        
        if (fullUrl.indexOf('http') !== 0) {
            fullUrl = BASE_URL + fullUrl;
        }
        
        if (page > 1) {
            fullUrl += (fullUrl.indexOf('?') === -1 ? '?page=' : '&page=') + page;
        }
        
        console.log('[UHD] Fetching:', fullUrl);
        
        net.silent(fullUrl, function (data) {
            var items = [], totalPages = 1;
            
            try {
                var $html = $(data);
                
                // ===== SELECTOR 1: Article/Post =====
                var $articles = $html.find('article, .post, .item, .blog-post, .entry, .movie-item, .grid-item, .bs');
                
                // ===== SELECTOR 2: Nếu không có, tìm các link bài viết =====
                if ($articles.length === 0) {
                    $html.find('a').each(function() {
                        var href = $(this).attr('href');
                        if (href && href.indexOf(BASE_URL) === 0 && href !== '/' && href.split('/').length >= 4) {
                            var parent = $(this).closest('div, li, section');
                            if (parent.find('img').length > 0 || parent.find('h2, h3').length > 0) {
                                $articles = $articles.add(parent);
                            }
                        }
                    });
                }
                
                // ===== SELECTOR 3: Fallback cuối =====
                if ($articles.length === 0) {
                    $html.find('.content, .main, #content').find('a').each(function() {
                        var href = $(this).attr('href');
                        if (href && href.indexOf(BASE_URL) === 0 && href !== '/' && href.split('/').length >= 4) {
                            var parent = $(this).parent();
                            $articles = $articles.add(parent);
                        }
                    });
                }
                
                // Parse từng item
                $articles.each(function() {
                    var $art = $(this);
                    var $link = $art.find('a').first();
                    var href = $link.attr('href');
                    
                    // Lấy title từ nhiều nguồn
                    var title = $art.find('h2, h3, .title, .entry-title').first().text().trim();
                    if (!title) title = $link.text().trim();
                    if (!title) title = $art.text().trim().substring(0, 50);
                    
                    // Lấy poster
                    var poster = $art.find('img').first().attr('src') || '';
                    if (!poster) poster = $art.find('img').first().attr('data-src') || '';
                    
                    if (href && title && href !== '/' && href !== BASE_URL + '/') {
                        var slug = href.split('/').filter(function(p) { return p; }).pop();
                        if (slug && !items.some(function(i) { return i.slug === slug; })) {
                            items.push({ slug: slug, title: title, poster: poster });
                        }
                    }
                });
                
                // Lấy phân trang
                var pagination = $html.find('.pagination .page-numbers:not(.next):not(.prev)').last();
                if (pagination.length) {
                    var lastPage = parseInt(pagination.text());
                    if (!isNaN(lastPage)) totalPages = lastPage;
                } else {
                    var nextLink = $html.find('.pagination .next, a:contains("Next")').attr('href');
                    if (nextLink && nextLink.match(/page=(\d+)/)) {
                        totalPages = 2;
                    }
                }
                
                items = items.map(normalizeItem);
                console.log('[UHD] Found', items.length, 'movies, totalPages:', totalPages);
                
            } catch (e) {
                console.error('[UHD] Parse error:', e);
            }
            
            onOk({
                results: items,
                page: page,
                total_pages: totalPages,
                total_results: items.length,
                cat_url: catUrl
            });
        }, function (err) {
            console.error('[UHD] Fetch error:', err);
            onOk({ results: [], page: page, total_pages: 1, total_results: 0 });
        });
    }

    // ========== FETCH DETAIL - CẢI THIỆN LẤY LINK ==========
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
                year: '',
                servers: []
            };
            
            try {
                var $html = $(html);
                
                // Tiêu đề
                result.title = $html.find('h1.entry-title, h1.title, .post-title, .entry-title').first().text().trim();
                
                // Poster
                var posterImg = $html.find('.poster img, .featured-image img, .post-thumbnail img, .entry-image img').first();
                result.poster = posterImg.attr('src') || posterImg.attr('data-src') || '';
                
                // Mô tả
                result.description = $html.find('.entry-content p').first().text().trim();
                if (!result.description) {
                    result.description = $html.find('.description, .summary, .movie-description').text().trim();
                }
                
                // Năm
                var yearText = $html.find('.year, .release-year, .date').text().trim();
                result.year = yearText.match(/\d{4}/) ? yearText.match(/\d{4}/)[0] : '';
                
                // ===== LẤY LINK TẢI =====
                var links = [];
                
                // Cách 1: Tìm trong entry-content
                $html.find('.entry-content a, .download-links a, .post-content a, .movie-links a').each(function() {
                    var $a = $(this);
                    var href = $a.attr('href');
                    var text = $a.text().trim();
                    
                    if (href && href.indexOf('http') === 0 && href.indexOf(BASE_URL) === -1) {
                        var quality = '';
                        var lower = text.toLowerCase();
                        if (lower.includes('4k') || lower.includes('2160p')) quality = '4K';
                        else if (lower.includes('1080p')) quality = '1080p';
                        else if (lower.includes('720p')) quality = '720p';
                        else if (lower.includes('hevc') || lower.includes('x265')) quality = 'HEVC';
                        else if (lower.includes('hdr')) quality = 'HDR';
                        else if (lower.includes('dual')) quality = 'Dual Audio';
                        else quality = text.substring(0, 20) || 'Download';
                        
                        links.push({ quality: quality, url: href });
                    }
                });
                
                // Cách 2: Fallback - regex toàn bộ html
                if (links.length === 0) {
                    var raw = html;
                    var urlMatches = raw.match(/https?:\/\/[^\s"'<>]+/g);
                    if (urlMatches) {
                        var unique = [...new Set(urlMatches)];
                        unique.forEach(function(u) {
                            if (u.indexOf(BASE_URL) === -1 && 
                                !u.includes('wp-content') && 
                                !u.includes('.jpg') && 
                                !u.includes('.png') && 
                                !u.includes('.css') &&
                                !u.includes('.js')) {
                                links.push({ quality: 'Download', url: u });
                            }
                        });
                    }
                }
                
                // Gom nhóm link
                if (links.length) {
                    var groups = {};
                    links.forEach(function(link) {
                        var q = link.quality || 'Download';
                        if (!groups[q]) groups[q] = [];
                        groups[q].push(link);
                    });
                    for (var q in groups) {
                        result.servers.push({ name: q, links: groups[q] });
                    }
                }
                
                _detailCache[slug] = result;
                console.log('[UHD] Detail parsed, servers:', result.servers.length);
                
            } catch (e) {
                console.error('[UHD] Detail error:', e);
            }
            
            callback(result);
        }, function (err) {
            console.error('[UHD] Fetch detail error:', err);
            callback(null);
        });
    }

    function showServerMenu(card, detail) {
        if (!detail || !detail.servers || !detail.servers.length) {
            Lampa.Noty.show('Không có link');
            return;
        }
        
        var title = card.title || '';
        var poster = card.poster || card.img || '';
        
        if (detail.servers.length === 1 && detail.servers[0].links.length === 1) {
            Lampa.Player.play({
                url: detail.servers[0].links[0].url,
                title: title,
                poster: poster
            });
            return;
        }
        
        var items = detail.servers.map(function(s, i) {
            return { title: s.name + (s.links.length > 1 ? ' (' + s.links.length + ')' : ''), index: i };
        });
        
        Lampa.Select.show({
            title: 'Chọn server',
            items: items,
            onSelect: function(item) {
                var server = detail.servers[item.index];
                if (server.links.length === 1) {
                    Lampa.Player.play({
                        url: server.links[0].url,
                        title: title + ' - ' + server.name,
                        poster: poster
                    });
                } else {
                    var qItems = server.links.map(function(l, j) {
                        return { title: l.quality || 'Link ' + (j + 1), index: j };
                    });
                    Lampa.Select.show({
                        title: 'Chọn chất lượng',
                        items: qItems,
                        onSelect: function(qItem) {
                            var link = server.links[qItem.index];
                            Lampa.Player.play({
                                url: link.url,
                                title: title + ' - ' + server.name + ' - ' + (link.quality || ''),
                                poster: poster
                            });
                        }
                    });
                }
            }
        });
    }

    function UHDMoviesApi() {
        var self = this;
        
        self.list = function(params, onComplete, onError) {
            var page = params.page || 1;
            var catUrl = params.cat_url || params.url || '/';
            fetchPage(catUrl, page, onComplete, onError);
        };
        
        self.category = function(params, onComplete, onError) {
            var parts = CATEGORIES.map(function(cat) {
                return function(cb) {
                    fetchPage(cat.url, 1, function(res) {
                        cb({
                            title: cat.title,
                            results: res.results,
                            url: cat.url,
                            cat_url: cat.url,
                            page: 1,
                            total_pages: res.total_pages,
                            total_results: res.total_results,
                            source: SOURCE_NAME
                        });
                    }, function() {
                        cb({ title: cat.title, results: [], url: cat.url, cat_url: cat.url });
                    });
                };
            });
            Lampa.Api.partNext(parts, 2, onComplete, onError);
        };
        
        self.full = function(params, onComplete, onError) {
            var card = params.card || {};
            var slug = card.uhd_slug || card.id;
            if (!slug) {
                onError('no slug');
                return;
            }
            
            fetchDetail(slug, function(detail) {
                if (!detail) {
                    onError('no detail');
                    return;
                }
                
                var result = {
                    id: slug,
                    title: detail.title,
                    name: detail.title,
                    poster: getPoster(detail.poster),
                    img: getPoster(detail.poster),
                    overview: detail.description,
                    year: detail.year,
                    source: SOURCE_NAME,
                    servers: detail.servers
                };
                onComplete({ movie: result });
            }, onError);
        };
        
        self.search = function(params, onComplete, onError) {
            var q = encodeURIComponent(params.query || '');
            var url = BASE_URL + '?s=' + q;
            var net = new Lampa.Reguest();
            
            net.silent(url, function(html) {
                var items = [];
                var $html = $(html);
                $html.find('article, .post').each(function() {
                    var link = $(this).find('h2 a, h3 a').first();
                    var href = link.attr('href');
                    var title = link.text().trim();
                    var poster = $(this).find('img').first().attr('src') || '';
                    if (href && title) {
                        var slug = href.split('/').filter(function(p) { return p; }).pop();
                        items.push({ slug: slug, title: title, poster: poster });
                    }
                });
                items = items.map(normalizeItem);
                onComplete({ results: items, page: 1, total_pages: 1, total_results: items.length });
            }, onError);
        };
    }

    function UHDMoviesListComponent(object) {
        var catUrl = object.cat_url || object.url || '/';
        var catTitle = object.title || 'UHDMovies';
        var curPage = 1;
        var totalPages = 1;
        var loading = false;
        var itemsLoaded = [];
        
        var $html = $(
            '<div class="uhd-list-wrap" style="min-height:100vh;">' +
            '<div class="uhd-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px;"></div>' +
            '<div class="uhd-loader" style="text-align:center;padding:1.5em;display:none;">Đang tải...</div>' +
            '<div class="uhd-end" style="text-align:center;padding:1em;display:none;">— Hết phim —</div>' +
            '</div>'
        );
        var $grid = $html.find('.uhd-grid');
        var $loader = $html.find('.uhd-loader');
        var $end = $html.find('.uhd-end');
        
        function renderCard(item) {
            var $card = $(
                '<div class="uhd-card selector" style="cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;">' +
                '<div style="position:relative;padding-top:150%;background:#111;">' +
                '<img src="' + (item.img || '') + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/>' +
                '</div>' +
                '<div style="padding:6px 8px;">' +
                '<div style="font-size:13px;font-weight:600;">' + (item.title || '') + '</div>' +
                '<div style="font-size:11px;opacity:.5;">' + (item.year || '') + '</div>' +
                '</div></div>'
            );
            $card.on('hover:enter click', function() {
                Lampa.Activity.push({ component: 'full', id: item.id, source: SOURCE_NAME, card: item });
            });
            $grid.append($card);
        }
        
        function loadPage(page) {
            if (loading) return;
            if (page > totalPages && totalPages > 1) {
                $end.show();
                return;
            }
            loading = true;
            $loader.show();
            fetchPage(catUrl, page, function(res) {
                totalPages = res.total_pages || 1;
                var newItems = res.results.filter(function(item) {
                    return !itemsLoaded.includes(item.id);
                });
                newItems.forEach(function(item) {
                    itemsLoaded.push(item.id);
                    renderCard(item);
                });
                loading = false;
                $loader.hide();
                if (curPage >= totalPages) $end.show();
            }, function() {
                loading = false;
                $loader.hide();
            });
        }
        
        var scrollTimeout;
        function onScroll() {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                var scrollContainer = document.querySelector('.activity__body') || 
                                      document.querySelector('.layer__scroll') || window;
                var scrollTop = scrollContainer.scrollTop || window.pageYOffset;
                var clientHeight = scrollContainer.clientHeight || window.innerHeight;
                var scrollHeight = scrollContainer.scrollHeight || document.body.scrollHeight;
                if (scrollTop + clientHeight >= scrollHeight - 400) {
                    if (!loading && curPage < totalPages) {
                        curPage++;
                        loadPage(curPage);
                    }
                }
            }, 100);
        }
        
        function attachScroll() {
            var scrollContainer = document.querySelector('.activity__body') || 
                                  document.querySelector('.layer__scroll') || window;
            if (scrollContainer === window) {
                window.addEventListener('scroll', onScroll, true);
            } else {
                scrollContainer.addEventListener('scroll', onScroll);
            }
            $html.data('scrollContainer', scrollContainer);
        }
        
        function detachScroll() {
            var scrollContainer = $html.data('scrollContainer');
            if (scrollContainer) {
                if (scrollContainer === window) {
                    window.removeEventListener('scroll', onScroll, true);
                } else {
                    scrollContainer.removeEventListener('scroll', onScroll);
                }
            }
        }
        
        this.create = function() {
            loadPage(1);
            attachScroll();
            return $html;
        };
        this.render = function() { return $html; };
        this.header = function() { return catTitle; };
        this.destroy = function() { detachScroll(); };
    }

    function injectViewMore() {
        Lampa.Listener.follow('activity', function(e) {
            if (e.type !== 'start') return;
            var obj = e.object || {};
            if (obj.source !== SOURCE_NAME || obj.component !== 'category') return;
            setTimeout(function() {
                $('.items__head,.category__title').each(function() {
                    var $head = $(this);
                    if ($head.find('.uhd-more-btn').length) return;
                    var txt = $head.text().replace(/\s*[>›].*/g, '').trim();
                    var cfg = null;
                    CATEGORIES.forEach(function(c) { if (c.title === txt) cfg = c; });
                    if (!cfg) return;
                    var $btn = $('<span class="uhd-more-btn selector" style="font-size:12px;opacity:.65;cursor:pointer;margin-left:10px;padding:2px 10px;border:1px solid rgba(255,255,255,.3);border-radius:20px;">Xem thêm ›</span>');
                    $btn.on('hover:enter click', function() {
                        Lampa.Activity.push({ title: cfg.title, component: 'uhdmovies_list', cat_url: cfg.url, source: SOURCE_NAME, page: 1 });
                    });
                    $head.append($btn);
                });
            }, 900);
        });
    }

    function startPlugin() {
        if (window.uhdmovies_started) return;
        window.uhdmovies_started = true;
        
        injectCSS();
        Lampa.Api.sources[SOURCE_NAME] = new UHDMoviesApi();
        Lampa.Component.add('uhdmovies_list', UHDMoviesListComponent);
        
        var $item = $(
            '<li data-action="' + SOURCE_NAME + '" class="menu__item selector">' +
            '<div class="menu__ico">' + ICON + '</div>' +
            '<div class="menu__text">' + CAT_NAME + '</div></li>'
        );
        $item.on('hover:enter click', function() {
            Lampa.Activity.push({ title: CAT_NAME, component: 'category', source: SOURCE_NAME, page: 1 });
        });
        $('.menu .menu__list').eq(0).append($item);
        
        injectViewMore();
        
        Lampa.Listener.follow('full', function(e) {
            var obj = e.object || {};
            var card = (e.data && e.data.movie) ? e.data.movie : (obj.card || (obj.activity && obj.activity.card));
            if (!card || card.source !== SOURCE_NAME) return;
            var slug = card.uhd_slug || card.id;
            
            if (e.type === 'destroy') {
                delete _detailCache[slug];
                return;
            }
            if (e.type !== 'complite') return;
            
            var $render = obj.activity ? obj.activity.render() : (obj.render ? obj.render() : null);
            var $ctx = $render || $('body');
            
            if (!$ctx.find('.view--uhd').length) {
                var $btn = $(
                    '<div class="full-start__button selector view--uhd" data-subtitle="UHDMovies">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44">' +
                    '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>' +
                    '<path d="M9.5 8.5L15.5 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>' +
                    '<span>UHDMovies</span></div>'
                );
                $btn.on('hover:enter click', function() {
                    fetchDetail(slug, function(detail) {
                        if (!detail || !detail.servers || !detail.servers.length) {
                            Lampa.Noty.show('Không có link');
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
    }
    
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();