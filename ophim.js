/**
 * NguonC Plugin for Lampa Android
 * Version: 3.0.0 - Error Handling
 */

(function() {
    'use strict';
    
    // Kiểm tra Lampa
    if (typeof window.Lampa === 'undefined') {
        console.error('NguonC: Lampa not found');
        return;
    }

    var CONFIG = {
        name: 'NguonC',
        component: 'nguonc',
        version: '3.0.0',
        // Thử nhiều domain phụ
        domains: [
            'https://phim.nguonc.com',
            'https://nguonc.com',
            'https://www.nguonc.com'
        ],
        poster_default: 'https://via.placeholder.com/300x450/222/666?text=No+Image'
    };

    var currentDomain = CONFIG.domains[0];
    var favorites = [];
    var history = [];

    // Load data
    try {
        favorites = JSON.parse(localStorage.getItem('nguonc_fav') || '[]');
        history = JSON.parse(localStorage.getItem('nguonc_hist') || '[]');
    } catch(e) {}

    function save() {
        try {
            localStorage.setItem('nguonc_fav', JSON.stringify(favorites));
            localStorage.setItem('nguonc_hist', JSON.stringify(history));
        } catch(e) {}
    }

    function isFav(id) {
        for (var i = 0; i < favorites.length; i++) {
            if (favorites[i].id === id) return true;
        }
        return false;
    }

    // ===== API với ERROR HANDLING =====
    
    function fetchHTML(url, callback) {
        console.log('NguonC: Fetching', url);
        
        $.ajax({
            url: url,
            method: 'GET',
            timeout: 15000,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(html) {
                console.log('NguonC: Fetch success', url.substring(0, 50));
                callback(null, html);
            },
            error: function(xhr, status, error) {
                console.error('NguonC: Fetch error', status, error);
                callback(error || status, null);
            }
        });
    }

    // Thử từng domain cho đến khi thành công
    function tryDomains(path, callback, domainIndex) {
        domainIndex = domainIndex || 0;
        
        if (domainIndex >= CONFIG.domains.length) {
            return callback('All domains failed');
        }
        
        var url = CONFIG.domains[domainIndex] + path;
        
        fetchHTML(url, function(err, html) {
            if (!err && html) {
                currentDomain = CONFIG.domains[domainIndex];
                callback(null, html);
            } else {
                tryDomains(path, callback, domainIndex + 1);
            }
        });
    }

    // Parse movies với nhiều selector fallback
    function parseMovies(html, source) {
        var movies = [];
        var div = document.createElement('div');
        div.innerHTML = html;
        
        // Nhiều selector khác nhau để thử
        var selectors = [
            '.film-item',
            '.movie-item',
            '.item.film',
            '.card',
            '.poster',
            '.film',
            'article',
            '.thumb',
            '.movie'
        ];
        
        var items = [];
        for (var i = 0; i < selectors.length; i++) {
            items = div.querySelectorAll(selectors[i]);
            console.log('NguonC: Trying selector', selectors[i], 'found', items.length);
            if (items.length > 0) break;
        }
        
        // Nếu vẫn không tìm thấy, thử tìm tất cả thẻ a có hình ảnh
        if (items.length === 0) {
            var links = div.querySelectorAll('a');
            var tempItems = [];
            for (var j = 0; j < links.length; j++) {
                if (links[j].querySelector('img')) {
                    tempItems.push(links[j]);
                }
            }
            if (tempItems.length > 0) {
                console.log('NguonC: Fallback to img links', tempItems.length);
                items = tempItems;
            }
        }
        
        for (var k = 0; k < items.length; k++) {
            var item = items[k];
            var link = item.tagName === 'A' ? item : item.querySelector('a');
            var img = item.querySelector('img');
            
            // Tìm title qua nhiều cách
            var title = null;
            var titleSelectors = ['.name', '.title', 'h3', 'h2', '.film-name', '.movie-title', 'a'];
            for (var t = 0; t < titleSelectors.length; t++) {
                var el = titleSelectors[t] === 'a' && item.tagName !== 'A' ? item.querySelector('a') : item.querySelector(titleSelectors[t]);
                if (el) {
                    title = el.textContent || el.getAttribute('title');
                    if (title) break;
                }
            }
            
            if (!title && img) title = img.getAttribute('alt');
            
            if (link && title) {
                var href = link.getAttribute('href') || '';
                // Chỉ lấy link phim
                if (href.indexOf('/phim/') === -1 && href.indexOf('phim-') === -1) continue;
                
                var id = href.replace(/.*\//, '').replace('.html', '').split('?')[0];
                var poster = img ? (img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('src')) : '';
                
                // Fix relative URL
                if (poster && poster.indexOf('http') !== 0) {
                    poster = currentDomain + (poster.indexOf('/') === 0 ? '' : '/') + poster;
                }
                
                movies.push({
                    id: id,
                    title: title.trim(),
                    poster: poster || CONFIG.poster_default,
                    url: href.indexOf('http') === 0 ? href : currentDomain + href,
                    source: source || 'list'
                });
            }
        }
        
        console.log('NguonC: Parsed', movies.length, 'movies');
        return movies;
    }

    function getMovies(type, page, callback) {
        var paths = {
            latest: '/phim-moi-cap-nhat',
            single: '/phim-le',
            series: '/phim-bo',
            cinema: '/phim-chieu-rap',
            anime: '/hoat-hinh'
        };
        
        var path = (paths[type] || paths.latest) + (page > 1 ? '?page=' + page : '');
        
        tryDomains(path, function(err, html) {
            if (err || !html) {
                console.error('NguonC: getMovies error', err);
                return callback([]);
            }
            
            var movies = parseMovies(html, type);
            callback(movies);
        });
    }

    function searchMovies(query, callback) {
        var path = '/tim-kiem?keyword=' + encodeURIComponent(query);
        
        tryDomains(path, function(err, html) {
            if (err || !html) return callback([]);
            
            var movies = parseMovies(html, 'search');
            callback(movies);
        });
    }

    function getMovieInfo(id, callback) {
        var path = '/phim/' + id;
        
        tryDomains(path, function(err, html) {
            if (err || !html) return callback(null);
            
            var div = document.createElement('div');
            div.innerHTML = html;
            
            var title = div.querySelector('h1, .film-title, .movie-title');
            var poster = div.querySelector('.film-poster img, .movie-poster img');
            var desc = div.querySelector('.description, .summary, .content');
            
            // Parse episodes
            var episodes = [];
            var epSelectors = [
                '.episode a',
                '.ep-item',
                '[data-episode]',
                '.list-episodes a',
                '.episodes a'
            ];
            
            var epElements = [];
            for (var i = 0; i < epSelectors.length; i++) {
                epElements = div.querySelectorAll(epSelectors[i]);
                if (epElements.length > 0) break;
            }
            
            for (var j = 0; j < epElements.length; j++) {
                var ep = epElements[j];
                var epUrl = ep.getAttribute('href') || ep.getAttribute('data-url');
                var epNum = ep.getAttribute('data-episode') || ep.textContent.match(/\d+/) || (j + 1);
                
                if (epUrl) {
                    episodes.push({
                        number: parseInt(epNum) || (j + 1),
                        url: epUrl.indexOf('http') === 0 ? epUrl : currentDomain + epUrl
                    });
                }
            }
            
            // Nếu không có episodes, tạo 1 tập
            if (episodes.length === 0) {
                episodes.push({
                    number: 1,
                    url: currentDomain + path
                });
            }
            
            var posterUrl = '';
            if (poster) {
                posterUrl = poster.getAttribute('data-src') || poster.getAttribute('src') || '';
                if (posterUrl && posterUrl.indexOf('http') !== 0) {
                    posterUrl = currentDomain + posterUrl;
                }
            }
            
            callback({
                id: id,
                title: title ? title.textContent.trim() : 'Unknown',
                poster: posterUrl || CONFIG.poster_default,
                description: desc ? desc.textContent.trim() : '',
                episodes: episodes
            });
        });
    }

    function getVideo(url, callback) {
        fetchHTML(url, function(err, html) {
            if (err || !html) return callback(null);
            
            var videoUrl = null;
            
            // Tìm m3u8
            var m3u8Match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i);
            if (m3u8Match) videoUrl = m3u8Match[1];
            
            // Hoặc mp4
            if (!videoUrl) {
                var mp4Match = html.match(/(https?:\/\/[^"']+\.mp4[^"']*)/i);
                if (mp4Match) videoUrl = mp4Match[1];
            }
            
            // Hoặc embed iframe
            if (!videoUrl) {
                var iframeMatch = html.match(/iframe[^>]+src=["']([^"']+)["']/i);
                if (iframeMatch) {
                    var embedUrl = iframeMatch[1];
                    if (embedUrl.indexOf('//') === 0) embedUrl = 'https:' + embedUrl;
                    videoUrl = embedUrl;
                }
            }
            
            callback(videoUrl ? [{ url: videoUrl }] : null);
        });
    }

    // ===== UI =====

    function createCard(movie) {
        return $('<div class="card selector" style="position:relative;">' +
            '<div class="card__view" style="position:relative; padding-bottom:150%; overflow:hidden; border-radius:8px;">' +
                '<img src="' + movie.poster + '" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" onerror="this.src=\'' + CONFIG.poster_default + '\'">' +
            '</div>' +
            '<div class="card