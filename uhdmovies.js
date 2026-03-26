(function () {
    'use strict';

    var SOURCE_NAME = 'uhdmovies';
    var CAT_NAME    = 'UHDMovies';
    var BASE_URL    = 'https://uhdmovies.ink';
    var IMG_URL     = 'https://uhdmovies.ink';

    var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    // =====================================================================
    // HELPER
    // =====================================================================
    function getPoster(url) {
        if (!url) return '';
        if (url.indexOf('http') === 0) return url;
        if (url.indexOf('//') === 0) return 'https:' + url;
        return url;
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
            overview: '',
            source: SOURCE_NAME
        };
    }

    // =====================================================================
    // DANH MUC
    // =====================================================================
    var CATEGORIES = [
        { url: '/', title: 'Phim mới' },
        { url: '/category/4k-uhd/', title: '4K UHD' },
        { url: '/category/1080p/', title: '1080p' },
        { url: '/category/2160p/', title: '2160p' },
        { url: '/category/dual-audio/', title: 'Dual Audio' },
        { url: '/category/web-dl/', title: 'WEB-DL' }
    ];

    // =====================================================================
    // FETCH PAGE
    // =====================================================================
    function fetchPage(catUrl, page, callback, errorCallback) {
        var net = new Lampa.Reguest();
        var url = BASE_URL + catUrl;
        
        if (page > 1) {
            url += (url.indexOf('?') === -1 ? '?page=' : '&page=') + page;
        }
        
        console.log('[UHD] Fetch:', url);
        
        net.silent(url, function(html) {
            var items = [];
            try {
                var $html = $(html);
                
                // Tìm các bài viết
                $html.find('article, .post, .item, .bs').each(function() {
                    var $this = $(this);
                    var link = $this.find('a').first().attr('href');
                    var title = $this.find('h2 a, h3 a, .title a').first().text().trim();
                    var poster = $this.find('img').first().attr('src') || '';
                    
                    if (link && title) {
                        var slug = link.split('/').filter(function(p) { return p; }).pop();
                        items.push({
                            slug: slug,
                            title: title,
                            poster: poster,
                            year: ''
                        });
                    }
                });
                
                items = items.map(normalizeItem);
            } catch(e) {
                console.error('[UHD] Parse error:', e);
            }
            
            callback({
                results: items,
                page: page,
                total_pages: 10,
                total_results: items.length
            });
        }, function(err) {
            console.error('[UHD] Fetch error:', err);
            if (errorCallback) errorCallback(err);
            else callback({ results: [], page: page, total_pages: 1, total_results: 0 });
        });
    }

    // =====================================================================
    // FETCH DETAIL
    // =====================================================================
    var detailCache = {};

    function fetchDetail(slug, callback) {
        if (detailCache[slug]) {
            callback(detailCache[slug]);
            return;
        }
        
        var net = new Lampa.Reguest();
        var url = BASE_URL + '/' + slug + '/';
        
        net.silent(url, function(html) {
            var result = {
                title: '',
                poster: '',
                servers: []
            };
            
            try {
                var $html = $(html);
                
                result.title = $html.find('h1.entry-title, h1.title').first().text().trim();
                result.poster = $html.find('.poster img, .featured-image img').first().attr('src') || '';
                
                // Lấy tất cả link download
                var links = [];
                $html.find('a').each(function() {
                    var href = $(this).attr('href');
                    var text = $(this).text().trim();
                    if (href && href.indexOf('http') === 0 && href.indexOf('uhdmovies') === -1) {
                        var quality = '';
                        if (text.match(/4k|2160p/i)) quality = '4K';
                        else if (text.match(/1080p/i)) quality = '1080p';
                        else if (text.match(/720p/i)) quality = '720p';
                        else quality = text.substring(0, 20);
                        
                        links.push({
                            quality: quality,
                            url: href
                        });
                    }
                });
                
                // Gom nhóm theo chất lượng
                if (links.length) {
                    var groups = {};
                    links.forEach(function(link) {
                        var q = link.quality || 'Download';
                        if (!groups[q]) groups[q] = [];
                        groups[q].push(link);
                    });
                    
                    for (var q in groups) {
                        result.servers.push({
                            name: q,
                            links: groups[q]
                        });
                    }
                }
                
                detailCache[slug] = result;
                
            } catch(e) {
                console.error('[UHD] Detail error:', e);
                detailCache[slug] = result;
            }
            
            callback(result);
        }, function(err) {
            console.error('[UHD] Fetch detail error:', err);
            callback(null);
        });
    }

    // =====================================================================
    // HIỂN THỊ MENU
    // =====================================================================
    function showServerMenu(card, detail) {
        if (!detail || !detail.servers || !detail.servers.length) {
            Lampa.Noty.show('Không có link');
            return;
        }
        
        var title = card.title || '';
        var poster = card.poster || card.img || '';
        
        // Nếu chỉ có 1 server và 1 link
        if (detail.servers.length === 1 && detail.servers[0].links.length === 1) {
            Lampa.Player.play({
                url: detail.servers[0].links[0].url,
                title: title,
                poster: poster
            });
            return;
        }
        
        // Nhiều server
        var items = detail.servers.map(function(s, i) {
            return { title: s.name, index: i };
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
                        return { title: l.quality, index: j };
                    });
                    Lampa.Select.show({
                        title: 'Chọn chất lượng',
                        items: qItems,
                        onSelect: function(qItem) {
                            var link = server.links[qItem.index];
                            Lampa.Player.play({
                                url: link.url,
                                title: title + ' - ' + server.name + ' - ' + link.quality,
                                poster: poster
                            });
                        }
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
            var slug = card.id;
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
                    overview: '',
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
                try {
                    var $html = $(html);
                    $html.find('article, .post').each(function() {
                        var link = $(this).find('a').first().attr('href');
                        var title = $(this).find('h2 a, h3 a').first().text().trim();
                        if (link && title) {
                            var slug = link.split('/').filter(function(p) { return p; }).pop();
                            items.push({
                                slug: slug,
                                title: title,
                                poster: ''
                            });
                        }
                    });
                    items = items.map(normalizeItem);
                } catch(e) {}
                onComplete({ results: items, page: 1, total_pages: 1, total_results: items.length });
            }, onError);
        };
    }

    // =====================================================================
    // COMPONENT LIST
    // =====================================================================
    function UHDMoviesListComponent(object) {
        var catUrl = object.cat_url || object.url || '/';
        var catTitle = object.title || 'UHDMovies';
        var curPage = 1;
        var totalPages = 1;
        var loading = false;
        
        var $html = $(
            '<div class="uhd-list-wrap">' +
            '<div class="uhd-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px;"></div>' +
            '<div class="uhd-loader" style="text-align:center;padding:1.5em;display:none;">Đang tải...</div>' +
            '</div>'
        );
        var $grid = $html.find('.uhd-grid');
        var $loader = $html.find('.uhd-loader');
        
        function renderCard(item) {
            var $card = $(
                '<div class="uhd-card selector" style="cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;">' +
                '<div style="position:relative;padding-top:150%;background:#111;">' +
                '<img src="' + (item.img || '') + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/>' +
                '</div>' +
                '<div style="padding:6px 8px;">' +
                '<div style="font-size:13px;font-weight:600;">' + (item.title || '') + '</div>' +
                '</div></div>'
            );
            $card.on('click', function() {
                Lampa.Activity.push({ component: 'full', id: item.id, source: SOURCE_NAME, card: item });
            });
            $grid.append($card);
        }
        
        function loadPage(page) {
            if (loading) return;
            loading = true;
            $loader.show();
            
            fetchPage(catUrl, page, function(res) {
                totalPages = res.total_pages || 1;
                res.results.forEach(renderCard);
                loading = false;
                $loader.hide();
            }, function() {
                loading = false;
                $loader.hide();
            });
        }
        
        this.create = function() {
            loadPage(1);
            return $html;
        };
        this.render = function() { return $html; };
        this.header = function() { return catTitle; };
    }

    // =====================================================================
    // KHỞI ĐỘNG
    // =====================================================================
    function startPlugin() {
        if (window.uhdmovies_started) return;
        window.uhdmovies_started = true;
        
        Lampa.Api.sources[SOURCE_NAME] = new UHDMoviesApi();
        Lampa.Component.add('uhdmovies_list', UHDMoviesListComponent);
        
        // Thêm menu
        var $item = $(
            '<li class="menu__item selector">' +
            '<div class="menu__ico">' + ICON + '</div>' +
            '<div class="menu__text">' + CAT_NAME + '</div></li>'
        );
        $item.on('click', function() {
            Lampa.Activity.push({ title: CAT_NAME, component: 'category', source: SOURCE_NAME });
        });
        
        setTimeout(function() {
            $('.menu .menu__list').eq(0).append($item);
        }, 1000);
        
        // Xử lý nút play
        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite') return;
            var obj = e.object || {};
            var card = (e.data && e.data.movie) ? e.data.movie : (obj.card || (obj.activity && obj.activity.card));
            if (!card || card.source !== SOURCE_NAME) return;
            
            setTimeout(function() {
                var $ctx = obj.activity ? obj.activity.render() : $('body');
                if ($ctx.find('.view--uhd').length) return;
                
                var $btn = $(
                    '<div class="full-start__button selector view--uhd">' +
                    '<svg width="44" height="44" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 8.5L15.5 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>' +
                    '<span>UHDMovies</span></div>'
                );
                
                $btn.on('click', function() {
                    fetchDetail(card.id, function(detail) {
                        if (!detail || !detail.servers || !detail.servers.length) {
                            Lampa.Noty.show('Không có link');
                            return;
                        }
                        showServerMenu(card, detail);
                    });
                });
                
                $ctx.find('.full-start__buttons').append($btn);
            }, 500);
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