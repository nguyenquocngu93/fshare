(function () {
    'use strict';

    var SOURCE_NAME = 'uhdmovies';
    var CAT_NAME    = 'UHDMovies';
    var BASE_URL    = 'https://uhdmovies.ink';

    var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    // =====================================================================
    // CSS ẨN BỚT THỪA
    // =====================================================================
    function injectCSS() {
        if (document.getElementById('uhd-style')) return;
        var s = document.createElement('style');
        s.id = 'uhd-style';
        s.textContent = '.card__type{display:none!important}.card-label--type{display:none!important}';
        document.head.appendChild(s);
    }

    // =====================================================================
    // HELPERS
    // =====================================================================
    function cleanUrl(url) {
        if (!url) return '';
        if (url.indexOf('http') === 0) return url;
        if (url.indexOf('//') === 0) return 'https:' + url;
        return url;
    }

    function normalizeItem(item) {
        return {
            id: item.slug,
            title: item.title,
            name: item.title,
            img: cleanUrl(item.poster),
            poster: cleanUrl(item.poster),
            year: item.year || '',
            source: SOURCE_NAME
        };
    }

    // =====================================================================
    // DANH MỤC LẤY TỪ WEB
    // =====================================================================
    var CATEGORIES = [
        { url: '/', name: 'Movies', title: 'Phim mới' },
        { url: '/category/4k-uhd/', name: '4K UHD', title: '4K UHD' },
        { url: '/category/1080p/', name: '1080p', title: '1080p' },
        { url: '/category/2160p/', name: '2160p', title: '2160p' },
        { url: '/category/dual-audio/', name: 'Dual Audio', title: 'Dual Audio' },
        { url: '/category/web-dl/', name: 'WEB-DL', title: 'WEB-DL' },
        { url: '/category/hindi-dubbed/', name: 'Hindi Dubbed', title: 'Hindi Dubbed' }
    ];

    // =====================================================================
    // FETCH PAGE - LẤY DANH SÁCH PHIM TỪ WEB
    // =====================================================================
    function fetchPage(catUrl, page, callback, errorCallback) {
        var net = new Lampa.Reguest();
        var url = BASE_URL + catUrl;
        
        if (page > 1) {
            url += (url.indexOf('?') === -1 ? '?page=' : '&page=') + page;
        }
        
        console.log('[UHD] Fetch list:', url);
        
        net.silent(url, function(html) {
            var items = [];
            var $html = $(html);
            
            // Cấu trúc thực tế: mỗi bài viết là <article>
            $html.find('article, .post').each(function() {
                var $article = $(this);
                
                // Link bài viết
                var link = $article.find('h2 a, h3 a, .entry-title a').first();
                var href = link.attr('href');
                var title = link.text().trim();
                
                // Ảnh poster
                var poster = '';
                var img = $article.find('img').first();
                if (img.length) {
                    poster = img.attr('src') || img.attr('data-src') || '';
                }
                
                if (href && title) {
                    var slug = href.split('/').filter(function(p) { return p; }).pop();
                    items.push({
                        slug: slug,
                        title: title,
                        poster: poster,
                        year: ''
                    });
                }
            });
            
            // Nếu không tìm thấy article, thử tìm theo cấu trúc khác
            if (items.length === 0) {
                $html.find('.item, .movie-item, .post-item').each(function() {
                    var $this = $(this);
                    var link = $this.find('a').first();
                    var href = link.attr('href');
                    var title = link.find('h2, h3, .title').text().trim() || link.text().trim();
                    var poster = $this.find('img').first().attr('src') || '';
                    
                    if (href && title) {
                        var slug = href.split('/').filter(function(p) { return p; }).pop();
                        items.push({
                            slug: slug,
                            title: title,
                            poster: poster,
                            year: ''
                        });
                    }
                });
            }
            
            // Lấy tổng số trang
            var totalPages = 1;
            var pagination = $html.find('.pagination .page-numbers:not(.next):not(.prev)').last();
            if (pagination.length) {
                var lastPage = parseInt(pagination.text());
                if (!isNaN(lastPage)) totalPages = lastPage;
            }
            
            items = items.map(normalizeItem);
            console.log('[UHD] Found', items.length, 'movies');
            
            callback({
                results: items,
                page: page,
                total_pages: totalPages,
                total_results: items.length
            });
        }, function(err) {
            console.error('[UHD] Fetch error:', err);
            if (errorCallback) errorCallback(err);
            else callback({ results: [], page: page, total_pages: 1, total_results: 0 });
        });
    }

    // =====================================================================
    // FETCH DETAIL - LẤY CHI TIẾT VÀ LINK
    // =====================================================================
    var detailCache = {};

    function fetchDetail(slug, callback) {
        if (detailCache[slug]) {
            callback(detailCache[slug]);
            return;
        }
        
        var net = new Lampa.Reguest();
        var url = BASE_URL + '/' + slug + '/';
        
        console.log('[UHD] Fetch detail:', url);
        
        net.silent(url, function(html) {
            var result = {
                title: '',
                poster: '',
                servers: []
            };
            
            var $html = $(html);
            
            // Tiêu đề
            result.title = $html.find('h1.entry-title, h1.title').first().text().trim();
            
            // Poster
            var posterImg = $html.find('.post-thumbnail img, .featured-image img, .entry-image img').first();
            result.poster = posterImg.attr('src') || posterImg.attr('data-src') || '';
            
            // Lấy tất cả link tải
            var links = [];
            $html.find('.entry-content a, .download-links a, .post-content a').each(function() {
                var $a = $(this);
                var href = $a.attr('href');
                var text = $a.text().trim();
                
                // Chỉ lấy link ngoài, không lấy link nội bộ
                if (href && href.indexOf('http') === 0 && href.indexOf('uhdmovies') === -1) {
                    // Xác định chất lượng từ text
                    var quality = '';
                    var lowerText = text.toLowerCase();
                    if (lowerText.includes('4k') || lowerText.includes('2160p')) quality = '4K';
                    else if (lowerText.includes('1080p')) quality = '1080p';
                    else if (lowerText.includes('720p')) quality = '720p';
                    else if (lowerText.includes('hevc') || lowerText.includes('x265')) quality = 'HEVC';
                    else if (lowerText.includes('hdr')) quality = 'HDR';
                    else if (lowerText.includes('web-dl')) quality = 'WEB-DL';
                    else if (lowerText.includes('dual')) quality = 'Dual Audio';
                    else quality = text.substring(0, 25);
                    
                    // Xác định server từ URL
                    var server = '';
                    if (href.includes('pixeldrain')) server = 'PixelDrain';
                    else if (href.includes('drive.google')) server = 'Google Drive';
                    else if (href.includes('mega.nz')) server = 'Mega';
                    else if (href.includes('mediafire')) server = 'MediaFire';
                    else if (href.includes('gdtot')) server = 'GDTot';
                    else if (href.includes('filepress')) server = 'FilePress';
                    else server = 'Download';
                    
                    links.push({
                        quality: quality,
                        url: href,
                        server: server
                    });
                }
            });
            
            // Gom link theo server
            var serverMap = {};
            links.forEach(function(link) {
                var key = link.server;
                if (!serverMap[key]) serverMap[key] = [];
                serverMap[key].push(link);
            });
            
            for (var serverName in serverMap) {
                result.servers.push({
                    name: serverName,
                    links: serverMap[serverName]
                });
            }
            
            // Nếu không có link, thử tìm trong raw content
            if (result.servers.length === 0) {
                var content = $html.find('.entry-content').html() || '';
                var urlMatches = content.match(/https?:\/\/[^\s"'<>]+/g);
                if (urlMatches) {
                    var unique = [...new Set(urlMatches)];
                    unique.forEach(function(u, i) {
                        if (u.indexOf('uhdmovies') === -1) {
                            result.servers.push({
                                name: 'Link ' + (i + 1),
                                links: [{ quality: 'Download', url: u, server: 'Direct' }]
                            });
                        }
                    });
                }
            }
            
            detailCache[slug] = result;
            callback(result);
            
        }, function(err) {
            console.error('[UHD] Detail error:', err);
            callback(null);
        });
    }

    // =====================================================================
    // HIỂN THỊ MENU SERVER
    // =====================================================================
    function showServerMenu(card, detail) {
        if (!detail || !detail.servers || !detail.servers.length) {
            Lampa.Noty.show('Không tìm thấy link');
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
        
        // Tạo menu chọn server
        var serverItems = detail.servers.map(function(s, i) {
            var count = s.links.length;
            return { title: s.name + (count > 1 ? ' (' + count + ' chất lượng)' : ''), index: i };
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
                    var qualityItems = server.links.map(function(l, j) {
                        return { title: l.quality || 'Link ' + (j + 1), index: j };
                    });
                    
                    Lampa.Select.show({
                        title: 'Chọn chất lượng - ' + server.name,
                        items: qualityItems,
                        onSelect: function(qItem) {
                            var link = server.links[qItem.index];
                            Lampa.Player.play({
                                url: link.url,
                                title: title + ' - ' + server.name + ' - ' + (link.quality || 'Link'),
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
                    poster: detail.poster,
                    img: detail.poster,
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
                var $html = $(html);
                
                $html.find('article, .post').each(function() {
                    var link = $(this).find('h2 a, h3 a').first();
                    var href = link.attr('href');
                    var title = link.text().trim();
                    var poster = $(this).find('img').first().attr('src') || '';
                    
                    if (href && title) {
                        var slug = href.split('/').filter(function(p) { return p; }).pop();
                        items.push({
                            slug: slug,
                            title: title,
                            poster: poster
                        });
                    }
                });
                
                items = items.map(normalizeItem);
                onComplete({ results: items, page: 1, total_pages: 1, total_results: items.length });
            }, onError);
        };
    }

    // =====================================================================
    // COMPONENT LIST (Infinite Scroll)
    // =====================================================================
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
            '<div class="uhd-loader" style="text-align:center;padding:1.5em;display:none;"><span>Đang tải...</span></div>' +
            '<div class="uhd-end" style="text-align:center;padding:1em;display:none;"><span style="opacity:.4;">— Hết phim —</span></div>' +
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
                '<div style="font-size:13px;font-weight:600;line-height:1.3;">' + (item.title || '') + '</div>' +
                '<div style="font-size:11px;opacity:.5;margin-top:2px;">' + (item.year || '') + '</div>' +
                '</div></div>'
            );
            $card.on('click', function() {
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
        
        function onScroll() {
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
        }
        
        this.create = function() {
            loadPage(1);
            window.addEventListener('scroll', onScroll, true);
            return $html;
        };
        this.render = function() { return $html; };
        this.header = function() { return catTitle; };
        this.destroy = function() {
            window.removeEventListener('scroll', onScroll, true);
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
        
        // Thêm menu chính
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
        
        // Thêm nút play vào trang chi tiết
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
                            Lampa.Noty.show('Không tìm thấy link');
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