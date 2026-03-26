(function () {
    'use strict';

    var SOURCE_NAME = 'ophim';
    var CAT_NAME    = 'OPhim';
    var BASE_URL    = 'https://ophim1.com';
    var IMG_URL     = 'https://img.ophim1.com'; // ảnh phim

    var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    // =====================================================================
    // DANH MỤC (dựa trên API OPhim)
    // =====================================================================
    var CATEGORIES = [
        { id: 'phim-moi-cap-nhat', title: '📽️ Phim mới' },
        { id: 'phim-le', title: '🎬 Phim lẻ' },
        { id: 'phim-bo', title: '📺 Phim bộ' },
        { id: 'hoat-hinh', title: '🐉 Hoạt hình' },
        { id: 'tv-shows', title: '🎭 TV Shows' }
    ];

    // =====================================================================
    // HELPERS
    // =====================================================================
    function getPoster(url) {
        if (!url) return '';
        if (url.indexOf('http') === 0) return url;
        return IMG_URL + url;
    }

    function normalizeItem(item) {
        return {
            id: item.slug || item._id || '',
            title: item.name || '',
            name: item.name || '',
            img: getPoster(item.poster_url || item.thumb_url),
            poster: getPoster(item.poster_url || item.thumb_url),
            year: item.year || '',
            overview: item.content || '',
            source: SOURCE_NAME
        };
    }

    // =====================================================================
    // FETCH PAGE (dùng API JSON)
    // =====================================================================
    function fetchPage(catId, page, onOk, onFail) {
        var net = new Lampa.Reguest();
        var url = BASE_URL + '/v1/api/danh-sach/' + catId + '?page=' + page + '&limit=20';
        
        console.log('[OPhim] Fetching:', url);
        
        net.silent(url, function (data) {
            var items = [], totalPages = 1;
            try {
                if (data && data.items) {
                    items = data.items.map(normalizeItem);
                    totalPages = data.pagination?.totalPages || 1;
                }
            } catch (e) {
                console.error('[OPhim] Parse error:', e);
            }
            onOk({
                results: items,
                page: page,
                total_pages: totalPages,
                total_results: items.length,
                cat_url: catId
            });
        }, function (err) {
            console.error('[OPhim] Fetch error:', err);
            onOk({ results: [], page: page, total_pages: 1, total_results: 0 });
        });
    }

    // =====================================================================
    // FETCH DETAIL (lấy thông tin phim và link)
    // =====================================================================
    var _detailCache = {};

    function fetchDetail(slug, callback) {
        if (_detailCache[slug]) {
            callback(_detailCache[slug]);
            return;
        }
        
        var net = new Lampa.Reguest();
        var url = BASE_URL + '/phim/' + slug;
        
        net.silent(url, function (data) {
            var result = {
                title: '',
                poster: '',
                description: '',
                year: '',
                servers: []
            };
            
            try {
                var movie = data.movie || {};
                result.title = movie.name || '';
                result.poster = getPoster(movie.poster_url || movie.thumb_url);
                result.description = movie.content || '';
                result.year = movie.year || '';
                
                // Lấy các tập phim từ episodes
                var episodes = data.episodes || [];
                if (episodes.length) {
                    // Mỗi server (thường có 1 server chính)
                    episodes.forEach(function(server) {
                        var serverName = server.server_name || 'Server 1';
                        var links = [];
                        (server.server_data || []).forEach(function(ep) {
                            var link = ep.link_m3u8 || ep.link_embed;
                            if (link) {
                                links.push({
                                    quality: ep.name || 'Tập ' + (ep.episode || ''),
                                    url: link
                                });
                            }
                        });
                        if (links.length) {
                            result.servers.push({ name: serverName, links: links });
                        }
                    });
                }
                
                _detailCache[slug] = result;
            } catch (e) {
                console.error('[OPhim] Detail error:', e);
            }
            callback(result);
        }, function (err) {
            console.error('[OPhim] Detail fetch error:', err);
            callback(null);
        });
    }

    // =====================================================================
    // HIỂN THỊ MENU CHỌN TẬP/SERVER
    // =====================================================================
    function showEpisodeMenu(card, detail) {
        if (!detail || !detail.servers || !detail.servers.length) {
            Lampa.Noty.show('Không có link phát');
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
        
        // Nếu nhiều server
        var serverItems = detail.servers.map(function(s, i) {
            return { title: s.name, index: i };
        });
        
        Lampa.Select.show({
            title: 'Chọn server',
            items: serverItems,
            onSelect: function(item) {
                var server = detail.servers[item.index];
                if (server.links.length === 1) {
                    Lampa.Player.play({
                        url: server.links[0].url,
                        title: title + ' - ' + server.name,
                        poster: poster
                    });
                } else {
                    var epItems = server.links.map(function(l, j) {
                        return { title: l.quality, index: j };
                    });
                    Lampa.Select.show({
                        title: 'Chọn tập - ' + server.name,
                        items: epItems,
                        onSelect: function(epItem) {
                            var link = server.links[epItem.index];
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
    function OPhimApi() {
        var self = this;
        
        self.list = function(params, onComplete, onError) {
            var page = params.page || 1;
            var catId = params.cat_url || 'phim-moi-cap-nhat';
            fetchPage(catId, page, onComplete, onError);
        };
        
        self.category = function(params, onComplete, onError) {
            var parts = CATEGORIES.map(function(cat) {
                return function(cb) {
                    fetchPage(cat.id, 1, function(res) {
                        cb({
                            title: cat.title,
                            results: res.results,
                            url: cat.id,
                            cat_url: cat.id,
                            page: 1,
                            total_pages: res.total_pages,
                            total_results: res.total_results,
                            source: SOURCE_NAME
                        });
                    }, function() {
                        cb({ title: cat.title, results: [], url: cat.id, cat_url: cat.id });
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
                    poster: detail.poster,
                    img: detail.poster,
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
            var url = BASE_URL + '/v1/api/tim-kiem?keyword=' + q;
            var net = new Lampa.Reguest();
            net.silent(url, function(data) {
                var items = [];
                try {
                    if (data.data && data.data.items) {
                        items = data.data.items.map(normalizeItem);
                    } else if (data.items) {
                        items = data.items.map(normalizeItem);
                    }
                } catch(e) {}
                onComplete({ results: items, page: 1, total_pages: 1, total_results: items.length });
            }, onError);
        };
    }

    // =====================================================================
    // COMPONENT LIST
    // =====================================================================
    function OPhimListComponent(object) {
        var catId = object.cat_url || 'phim-moi-cap-nhat';
        var catTitle = object.title || 'OPhim';
        var curPage = 1;
        var totalPages = 1;
        var loading = false;
        var itemsLoaded = [];
        
        var $html = $(
            '<div class="ophim-list-wrap" style="min-height:100vh;">' +
            '<div class="ophim-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px;"></div>' +
            '<div class="ophim-loader" style="text-align:center;padding:1.5em;display:none;">Đang tải...</div>' +
            '<div class="ophim-end" style="text-align:center;padding:1em;display:none;">— Hết phim —</div>' +
            '</div>'
        );
        var $grid = $html.find('.ophim-grid');
        var $loader = $html.find('.ophim-loader');
        var $end = $html.find('.ophim-end');
        
        function renderCard(item) {
            var $card = $(
                '<div class="ophim-card selector" style="cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;">' +
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
            fetchPage(catId, page, function(res) {
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

    // =====================================================================
    // INJECT XEM THÊM
    // =====================================================================
    function injectViewMore() {
        Lampa.Listener.follow('activity', function(e) {
            if (e.type !== 'start') return;
            var obj = e.object || {};
            if (obj.source !== SOURCE_NAME || obj.component !== 'category') return;
            setTimeout(function() {
                $('.items__head,.category__title').each(function() {
                    var $head = $(this);
                    if ($head.find('.ophim-more-btn').length) return;
                    var txt = $head.text().replace(/\s*[>›].*/g, '').trim();
                    var cfg = null;
                    CATEGORIES.forEach(function(c) { if (c.title === txt) cfg = c; });
                    if (!cfg) return;
                    var $btn = $('<span class="ophim-more-btn selector" style="font-size:12px;opacity:.65;cursor:pointer;margin-left:10px;padding:2px 10px;border:1px solid rgba(255,255,255,.3);border-radius:20px;">Xem thêm ›</span>');
                    $btn.on('hover:enter click', function() {
                        Lampa.Activity.push({ title: cfg.title, component: 'ophim_list', cat_url: cfg.id, source: SOURCE_NAME, page: 1 });
                    });
                    $head.append($btn);
                });
            }, 900);
        });
    }

    // =====================================================================
    // KHỞI ĐỘNG
    // =====================================================================
    function startPlugin() {
        if (window.ophim_started) return;
        window.ophim_started = true;
        
        Lampa.Api.sources[SOURCE_NAME] = new OPhimApi();
        Lampa.Component.add('ophim_list', OPhimListComponent);
        
        // Thêm menu
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
        
        // Nút play
        Lampa.Listener.follow('full', function(e) {
            var obj = e.object || {};
            var card = (e.data && e.data.movie) ? e.data.movie : (obj.card || (obj.activity && obj.activity.card));
            if (!card || card.source !== SOURCE_NAME) return;
            var slug = card.id;
            
            if (e.type === 'destroy') {
                delete _detailCache[slug];
                return;
            }
            if (e.type !== 'complite') return;
            
            var $render = obj.activity ? obj.activity.render() : (obj.render ? obj.render() : null);
            var $ctx = $render || $('body');
            
            if (!$ctx.find('.view--ophim').length) {
                var $btn = $(
                    '<div class="full-start__button selector view--ophim" data-subtitle="OPhim">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44">' +
                    '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>' +
                    '<path d="M9.5 8.5L15.5 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>' +
                    '<span>OPhim</span></div>'
                );
                $btn.on('hover:enter click', function() {
                    fetchDetail(slug, function(detail) {
                        if (!detail || !detail.servers || !detail.servers.length) {
                            Lampa.Noty.show('Không có link phát');
                            return;
                        }
                        showEpisodeMenu(card, detail);
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