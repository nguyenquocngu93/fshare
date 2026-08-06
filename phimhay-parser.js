/* ============================================================================
 * PhimHay Parser v1.0.0 - Plugin Lampa MX
 * ----------------------------------------------------------------------------
 * Plugin parser phim tiếng Việt cho Lampa MX.
 * Hỗ trợ: Tìm kiếm, Danh mục, Lọc theo năm/quốc gia/thể loại, Phim lẻ/bộ
 * Tương thích: Web, Android TV, Tizen, WebOS
 * ----------------------------------------------------------------------------
 * CÁCH DÙNG:
 *   1. Thay đổi BASE_URL và CATEGORY_MAP cho nguồn phim của bạn.
 *   2. Nếu nguồn dùng API JSON thì chỉnh API endpoints.
 *   3. Nếu scrape HTML thì chỉnh selectors trong hàm htmlToItems/htmlToEpisodes.
 *   4. Host file này trên GitHub Pages (xem README.md).
 *   5. Trong Lampa: Cài đặt → Plugin → Thêm URL plugin.
 * ============================================================================
 */
(function(){
'use strict';

/* Tránh load 2 lần */
if(window.__phimhay_parser)return;
window.__phimhay_parser=true;

/* ============================================================================
 * CẤU HÌNH NGUỒN PHIM - CHỈNH Ở ĐÂY
 * ============================================================================ */

/** URL gốc của trang web phim. Thay bằng domain thật của bạn. */
var BASE_URL = 'https://example.com';

/** Nếu trang có API JSON, đặt endpoint ở đây. Để trống nếu chỉ scrape HTML. */
var API = {
    search: '/api/search?keyword={q}&page={p}',
    detail: '/api/movie/{slug}',
    list:   '/api/danh-sach/{cat}?page={p}',
    filter: '/api/tim-kiem?keyword={q}&sort={sort}&year={year}&country={country}&category={cat}&page={p}'
};

/** Mapping danh mục (slug hiển thị -> slug gốc trên trang). */
var CATEGORY_MAP = {
    'phim-moi':      { name: 'Phim Mới',     slug: 'phim-moi' },
    'phim-le':       { name: 'Phim Lẻ',      slug: 'phim-le' },
    'phim-bo':       { name: 'Phim Bộ',      slug: 'phim-bo' },
    'hoat-hinh':     { name: 'Hoạt Hình',    slug: 'hoat-hinh' },
    'phim-chieu-rap':{ name: 'Chiếu Rạp',    slug: 'phim-chieu-rap' },
    'phim-vietsub':  { name: 'Vietsub',      slug: 'phim-vietsub' },
    'phim-thuyet-minh':{ name: 'Thuyết Minh',slug: 'phim-thuyet-minh' },
    'phim-long-tien':{ name: 'Long Tiên',    slug: 'phim-long-tien' }
};

/** Thể loại phim (dùng cho filter). */
var GENRES = [
    'hanh-dong','vien-tuong','kinh-di','tinh-cam','hoat-hinh',
    'hai-huoc','phieu-luu','tam-ly','than-thoai','co-trang',
    'chien-tranh','the-thao','am-nhac','gia-dinh','hinh-su',
    'vo-thuat','khoa-hoc-vien-tuong','tre-em','lich-su'
];

/** Quốc gia. */
var COUNTRIES = [
    'viet-nam','trung-quoc','han-quoc','nhat-ban','thai-lan',
    'au-my','anh','phap','hong-kong','dai-loan',
    'an-do','nga','duc','tay-ban-nha','italia','other'
];

/** Số kết quả mỗi trang. */
var PAGE_SIZE = 24;

/** Selector CSS để scrape HTML (dùng khi không có API). */
var SELECTORS = {
    listItem:  '.ml-item, .film-item, .movie-item',
    listLink:  'a[href]',
    listTitle: '.film-name, h3, .title, h2',
    listImg:   'img',
    listYear:  '.film-year, .year, .info span',
    listOriginName:'.film-origin, .origin-name',
    detailTitle:'.film-title, h1, .title',
    detailImg:  '.film-poster img, .poster img',
    detailDesc: '.film-description, .description, .content',
    detailServer:'.server-item, .episodes-server',
    detailServerName:'.server-name, h3',
    detailEpisode:'.ep-item, .episode-item, a[href*="tap-"]',
    detailEpisodeLink:'a[href], a'
};

/* ============================================================================
 * CẤU HÌNH CACHE & LƯU TRỮ
 * ============================================================================ */

var CACHE_KEY = 'phimhay_parser_cache';
var CACHE_TTL = 30 * 60 * 1000; // 30 phút

function getCache(key){
    try{
        var c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        var item = c[key];
        if(item && (Date.now() - item.t) < CACHE_TTL) return item.data;
    }catch(e){}
    return null;
}
function setCache(key, data){
    try{
        var c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        c[key] = { data: data, t: Date.now() };
        // Giữ cache không quá 5MB
        var str = JSON.stringify(c);
        if(str.length > 5 * 1024 * 1024){
            // Xoá 1/4 cache cũ nhất
            var keys = Object.keys(c).sort(function(a,b){return c[a].t - c[b].t;});
            for(var i = 0; i < Math.floor(keys.length / 4); i++) delete c[keys[i]];
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    }catch(e){}
}

/* ============================================================================
 * TIỆN ÍCH
 * ============================================================================ */

function E(s){
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function pad2(n){ return (n < 10 ? '0' : '') + n; }
function absUrl(u){
    if(!u) return '';
    if(u.indexOf('//') === 0) return 'https:' + u;
    if(u.indexOf('http') !== 0) return BASE_URL + (u.charAt(0) === '/' ? '' : '/') + u;
    return u;
}
function nrm(s){
    return String(s || '').toLowerCase().trim()
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s\u00C0-\u024F\u1E00-\u1EFF]/g, '')
        .replace(/\s+/g, ' ');
}
function slugify(s){
    return String(s || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/* ============================================================================
 * GỌI MẠNG (DÙNG CẢ Lampa.Reguest VÀ fetch)
 * ============================================================================ */

function net(){
    return new Lampa.Reguest();
}

function http(url, cb, err, timeout){
    timeout = timeout || 15000;
    var r = net();
    r.timeout(timeout);
    r.silent(url,
        function(data){
            try{
                var json = typeof data === 'string' ? JSON.parse(data) : data;
                cb(json);
            }catch(e){
                // Không phải JSON, trả về text
                cb(data);
            }
        },
        function(a, b){
            (err || function(){})((a && a.status) || 0, b);
        }
    );
}

function httpRaw(url, cb, err, timeout){
    timeout = timeout || 15000;
    var r = net();
    r.timeout(timeout);
    r.silent(url, cb, err || function(){});
}

/* ============================================================================
 * SCRAPE HTML -> DANH SÁCH PHIM
 * ============================================================================ */

function htmlToItems(html){
    try{
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var items = [];
        var nodes = doc.querySelectorAll(SELECTORS.listItem);
        for(var i = 0; i < nodes.length; i++){
            var el = nodes[i];
            var a = el.querySelector(SELECTORS.listLink);
            var href = a ? a.getAttribute('href') : '';
            var title = (function(){
                var t = el.querySelector(SELECTORS.listTitle);
                return t ? (t.textContent || '').trim() : (a ? (a.getAttribute('title') || '').trim() : '');
            })();
            var img = (function(){
                var i2 = el.querySelector(SELECTORS.listImg);
                if(!i2) return '';
                return i2.getAttribute('data-src') || i2.getAttribute('data-original') || i2.getAttribute('src') || '';
            })();
            var year = (function(){
                var y = el.querySelector(SELECTORS.listYear);
                var m = y ? (y.textContent || '').match(/\d{4}/) : null;
                return m ? m[0] : '';
            })();
            var origin = (function(){
                var o = el.querySelector(SELECTORS.listOriginName);
                return o ? (o.textContent || '').trim() : '';
            })();
            if(!href || !title) continue;
            var slug = href.replace(/^.*\//, '').replace(/\.html?$/, '').replace(/[?#].*$/, '');
            items.push({
                title: title,
                origin_name: origin,
                slug: slug,
                url: absUrl(href),
                poster: absUrl(img),
                year: year
            });
        }
        return items;
    }catch(e){
        console.error('[PhimHay] htmlToItems error:', e);
        return [];
    }
}

function htmlToDetail(html){
    try{
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var t = doc.querySelector(SELECTORS.detailTitle);
        var i2 = doc.querySelector(SELECTORS.detailImg);
        var d = doc.querySelector(SELECTORS.detailDesc);
        var desc = d ? (d.textContent || '').trim() : '';
        // Tìm servers
        var servers = [];
        var sNodes = doc.querySelectorAll(SELECTORS.detailServer);
        if(sNodes.length){
            sNodes.forEach(function(sn){
                var name = (function(){
                    var n = sn.querySelector(SELECTORS.detailServerName);
                    return n ? (n.textContent || '').replace(/^Server\s*/i, '').trim() : ('Server ' + (servers.length + 1));
                })();
                var eps = [];
                sn.querySelectorAll(SELECTORS.detailEpisode).forEach(function(en){
                    var a = en.querySelector ? en.querySelector(SELECTORS.detailEpisodeLink) : null;
                    if(!a) a = en;
                    var epName = (en.textContent || '').trim() || ('Tập ' + (eps.length + 1));
                    var epLink = a.getAttribute('data-link') || a.getAttribute('href') || a.getAttribute('data-url') || '';
                    if(epLink){
                        eps.push({ name: epName, link: epLink });
                    }
                });
                if(eps.length) servers.push({ name: name, episodes: eps });
            });
        }
        return {
            title: t ? (t.textContent || '').trim() : '',
            poster: i2 ? (i2.getAttribute('src') || '') : '',
            description: desc,
            servers: servers
        };
    }catch(e){
        console.error('[PhimHay] htmlToDetail error:', e);
        return null;
    }
}

/* ============================================================================
 * TÌM KIẾM
 * ============================================================================ */

function searchSource(keyword, page, cb){
    page = page || 1;
    var cacheKey = 'search:' + keyword + ':' + page;
    var cached = getCache(cacheKey);
    if(cached){ cb(cached); return; }

    // Ưu tiên API nếu có
    if(API.search){
        var url = BASE_URL + API.search
            .replace('{q}', encodeURIComponent(keyword))
            .replace('{p}', page);
        http(url, function(data){
            var items = Array.isArray(data) ? data : (data.items || data.data || data.results || []);
            setCache(cacheKey, items);
            cb(items);
        }, function(){
            // Fallback scrape
            scrapeSearch(keyword, page, cb);
        });
    } else {
        scrapeSearch(keyword, page, cb);
    }
}

function scrapeSearch(keyword, page, cb){
    var url = BASE_URL + '/tim-kiem.html?keyword=' + encodeURIComponent(keyword) + '&page=' + page;
    httpRaw(url, function(html){
        var items = htmlToItems(html);
        setCache('search:' + keyword + ':' + page, items);
        cb(items);
    }, function(){ cb([]); });
}

/* ============================================================================
 * DANH SÁCH THEO DANH MỤC
 * ============================================================================ */

function listCategory(catKey, page, cb){
    page = page || 1;
    var cat = CATEGORY_MAP[catKey];
    if(!cat){ cb([]); return; }
    var cacheKey = 'cat:' + catKey + ':' + page;
    var cached = getCache(cacheKey);
    if(cached){ cb(cached); return; }

    if(API.list){
        var url = BASE_URL + API.list
            .replace('{cat}', cat.slug)
            .replace('{p}', page);
        http(url, function(data){
            var items = Array.isArray(data) ? data : (data.items || data.data || data.results || []);
            setCache(cacheKey, items);
            cb(items);
        }, function(){
            scrapeCategory(cat.slug, page, cb, cacheKey);
        });
    } else {
        scrapeCategory(cat.slug, page, cb, cacheKey);
    }
}

function scrapeCategory(slug, page, cb, cacheKey){
    var url = BASE_URL + '/danh-sach/' + slug + '.html?page=' + page;
    httpRaw(url, function(html){
        var items = htmlToItems(html);
        setCache(cacheKey, items);
        cb(items);
    }, function(){ cb([]); });
}

/* ============================================================================
 * CHI TIẾT PHIM + TẬP
 * ============================================================================ */

function getDetail(slug, cb){
    var cacheKey = 'detail:' + slug;
    var cached = getCache(cacheKey);
    if(cached){ cb(cached); return; }

    // Ưu tiên API
    if(API.detail){
        var url = BASE_URL + API.detail.replace('{slug}', slug);
        http(url, function(data){
            var m = data.movie || data.item || data;
            var eps = data.episodes || m.episodes || [];
            var result = {
                title: m.title || m.name,
                origin_name: m.origin_name || m.original_name || '',
                poster: absUrl(m.poster_url || m.poster || m.thumb || m.image || ''),
                description: m.description || m.overview || m.content || '',
                year: m.year || (m.release_date || '').slice(0, 4),
                episodes: formatEpisodes(eps)
            };
            setCache(cacheKey, result);
            cb(result);
        }, function(){
            scrapeDetail(slug, cb, cacheKey);
        });
    } else {
        scrapeDetail(slug, cb, cacheKey);
    }
}

function scrapeDetail(slug, cb, cacheKey){
    var url = BASE_URL + '/phim/' + slug + '.html';
    httpRaw(url, function(html){
        var d = htmlToDetail(html);
        if(!d){ cb(null); return; }
        var result = {
            title: d.title,
            origin_name: '',
            poster: absUrl(d.poster),
            description: d.description,
            year: '',
            episodes: d.servers
        };
        setCache(cacheKey, result);
        cb(result);
    }, function(){ cb(null); });
}

function formatEpisodes(eps){
    // Nếu API trả về dạng [{server_name, server_data:[{name,link_m3u8|link_embed}]}]
    if(eps && eps.length && eps[0].server_data){
        return eps.map(function(sv){
            return {
                name: sv.server_name || 'Server',
                episodes: (sv.server_data || []).map(function(ep){
                    return {
                        name: ep.name || ('Tập ' + (i + 1)),
                        link: ep.link_m3u8 || ep.link_embed || ep.link || ''
                    };
                })
            };
        });
    }
    // Nếu API trả về dạng phẳng [{name, link, episode}] -> gom thành 1 server
    if(eps && eps.length && eps[0].link){
        return [{
            name: 'Server 1',
            episodes: eps.map(function(ep, i){
                return { name: ep.name || ('Tập ' + (i + 1)), link: ep.link };
            })
        }];
    }
    return [];
}

/* ============================================================================
 * PHÁT VIDEO
 * ============================================================================ */

function playEpisode(title, url, card){
    if(!url){ Lampa.Noty.show('Tập này chưa có link'); return; }
    // Nếu là link embed thì Lampa tự xử lý
    Lampa.Player.play({
        title: title,
        url: url,
        movie: card || {}
    });
}

/* ============================================================================
 * CHẤM ĐIỂM MATCH
 * ============================================================================ */

function scoreMatch(item, title, origName, year){
    var s = 0;
    var nT = nrm(title), nO = nrm(origName);
    var nIT = nrm(item.title || item.name), nIO = nrm(item.origin_name || item.original_name);
    if(nT && (nIT === nT || nIO === nT)) s += 100;
    else if(nO && (nIT === nO || nIO === nO)) s += 95;
    else if(nT.length >= 3 && (nIT.indexOf(nT) >= 0 || nT.indexOf(nIT) >= 0)) s += 60;
    else if(nO.length >= 3 && (nIT.indexOf(nO) >= 0 || nO.indexOf(nIT) >= 0)) s += 50;
    if(s > 0 && year && item.year){
        var iy = parseInt(item.year), ty = parseInt(year);
        if(iy === ty) s += 30;
        else if(Math.abs(iy - ty) <= 1) s += 15;
    }
    return s;
}

function bestMatch(items, title, origName, year){
    if(!items || !items.length) return null;
    var best = null, bestScore = 0;
    items.forEach(function(it){
        var sc = scoreMatch(it, title, origName, year);
        if(sc > bestScore){ bestScore = sc; best = it; }
    });
    if(best) return best;
    if(items.length === 1) return items[0];
    if(year && items.length <= 3) return items[0];
    return null;
}

/* ============================================================================
 * GIAO DIỆN LAMPA
 * ============================================================================ */

function bindEvents(el, fn){
    var sx=0,sy=0,mv=false,tc=false;
    el.on('touchstart', function(e){
        var t = (e.originalEvent || e).touches;
        t = t && t[0];
        if(t){ sx = t.clientX; sy = t.clientY; mv = false; }
    });
    el.on('touchmove', function(e){
        var t = (e.originalEvent || e).touches;
        t = t && t[0];
        if(t && (Math.abs(t.clientX - sx) > 10 || Math.abs(t.clientY - sy) > 10)) mv = true;
    });
    el.on('touchend', function(e){
        if(mv) return;
        tc = true;
        e.preventDefault();
        e.stopPropagation();
        setTimeout(function(){ fn.call(el[0], e); }, 100);
        setTimeout(function(){ tc = false; }, 400);
    });
    el.on('click', function(e){
        if(tc || mv) return;
        e.preventDefault();
        e.stopPropagation();
        fn.call(this, e);
    });
    el.on('hover:enter', function(e){
        fn.call(this, e);
    });
}

/** Hiển thị chọn server + tập */
function showEpisodes(detail, card){
    if(!detail || !detail.episodes || !detail.episodes.length){
        Lampa.Noty.show('Không có tập nào');
        return;
    }
    if(detail.episodes.length === 1){
        showEpList(detail.title, detail.episodes[0], card);
    } else {
        Lampa.Select.show({
            title: 'Chọn Server - ' + (detail.title || ''),
            items: detail.episodes.map(function(sv, i){
                return {
                    title: (sv.name || ('Server ' + (i + 1))) + ' (' + (sv.episodes || []).length + ' tập)',
                    value: sv
                };
            }),
            onSelect: function(a){
                showEpList(detail.title, a.value, card);
            },
            onBack: function(){
                Lampa.Controller.toggle('content');
            }
        });
    }
}

function showEpList(title, server, card){
    var eps = server.episodes || [];
    if(!eps.length){ Lampa.Noty.show('Server rỗng'); return; }
    Lampa.Select.show({
        title: (server.name || 'Server') + ' - ' + (title || ''),
        items: eps.map(function(ep){
            return {
                title: ep.name || 'Tập',
                subtitle: '',
                value: ep
            };
        }),
        onSelect: function(a){
            var ep = a.value;
            if(!ep.link){ Lampa.Noty.show('Tập này chưa có link'); return; }
            playEpisode((title || 'Phim') + ' - ' + (ep.name || ''), ep.link, card);
        },
        onBack: function(){
            Lampa.Controller.toggle('content');
        }
    });
}

/** Tạo nút nguồn phim để chèn vào trang chi tiết */
function buildSourceButton(activity, card){
    var title = card.title || card.name || '';
    var origName = card.original_title || card.original_name || '';
    var year = (card.release_date || card.first_air_date || card.year || '').toString().slice(0, 4);
    var mediaType = (card.type === 'tv' || card.number_of_seasons || card.first_air_date) ? 'tv' : 'movie';

    var btn = $('<div class="kk-src-btn selector" style="background:linear-gradient(135deg,rgba(59,130,246,.18),rgba(59,130,246,.06));border:1px solid rgba(59,130,246,.4);">'
        + '<div class="kk-sb-main">▶ PhimHay <span class="kk-arrow">▼</span></div>'
        + '<div class="kk-sb-sub">Bấm để tìm nguồn</div>'
        + '</div>');

    bindEvents(btn, function(){
        Lampa.Noty.show('Đang tìm: ' + title);
        // Thử tìm với nhiều biến thể
        var terms = [];
        if(origName) terms.push(origName);
        if(title && terms.indexOf(title) === -1) terms.push(title);
        if(year){
            if(origName) terms.push(origName + ' ' + year);
            if(title) terms.push(title + ' ' + year);
        }
        tryFind(terms, 0, title, origName, year, mediaType, card, btn);
    });
    return btn;
}

function tryFind(terms, idx, title, origName, year, mediaType, card, btn){
    if(idx >= terms.length){
        Lampa.Noty.show('Không tìm thấy!');
        btn.find('.kk-sb-sub').text('Không tìm thấy - thử lại');
        return;
    }
    var term = terms[idx];
    if(!term || term.length < 2){
        tryFind(terms, idx + 1, title, origName, year, mediaType, card, btn);
        return;
    }
    searchSource(term, 1, function(items){
        var best = bestMatch(items, title, origName, year);
        if(best){
            var slug = best.slug || (best.url || '').replace(/^.*\/phim\//, '').replace(/\.html?$/, '');
            if(!slug){ tryFind(terms, idx + 1, title, origName, year, mediaType, card, btn); return; }
            Lampa.Noty.show('Đang tải chi tiết...');
            getDetail(slug, function(detail){
                if(!detail){ tryFind(terms, idx + 1, title, origName, year, mediaType, card, btn); return; }
                btn.find('.kk-sb-sub').text('Mở ' + (detail.episodes[0] ? detail.episodes.length + ' server' : 'xem'));
                bindEvents(btn, function(){
                    showEpisodes(detail, card);
                });
                // Tự động mở nếu chỉ 1 server
                if(detail.episodes.length === 1 && detail.episodes[0].episodes.length === 1){
                    showEpisodes(detail, card);
                }
            });
        } else {
            tryFind(terms, idx + 1, title, origName, year, mediaType, card, btn);
        }
    });
}

/* ============================================================================
 * MỤC TRONG LAMPA (Sidebar / Menu)
 * ============================================================================ */

function addMenuItem(){
    if(!Lampa.Menu || !Lampa.Menu.show) return;
    Lampa.Menu.add({
        id: 'phimhay',
        title: 'PhimHay Parser',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4h-4z"/></svg>',
        onClick: function(){
            openPhimHayHome();
        }
    });
}

function openPhimHayHome(){
    var items = [
        { title: '🔍 Tìm kiếm', value: 'search' },
        { title: '📂 Danh mục', value: 'category' },
        { title: '🎬 Phim Mới', value: 'phim-moi' },
        { title: '🎞️ Phim Lẻ', value: 'phim-le' },
        { title: '📺 Phim Bộ', value: 'phim-bo' },
        { title: '🎨 Hoạt Hình', value: 'hoat-hinh' },
        { title: '🍿 Chiếu Rạp', value: 'phim-chieu-rap' }
    ];
    Lampa.Select.show({
        title: 'PhimHay Parser',
        items: items,
        onSelect: function(a){
            if(a.value === 'search'){
                Lampa.Search.show ? Lampa.Search.show({ component: 'phimhay_search' }) : promptSearch();
            } else if(a.value === 'category'){
                openCategoryList();
            } else {
                openCategoryPage(a.value, a.title);
            }
        },
        onBack: function(){
            Lampa.Controller.toggle('content');
        }
    });
}

function promptSearch(){
    Lampa.Prompt && Lampa.Prompt.open({
        title: 'Tìm phim',
        value: '',
        onInput: function(val){
            // Optional: gợi ý
        },
        onSubmit: function(val){
            openSearchResults(val);
        }
    });
}

function openSearchResults(keyword, page){
    page = page || 1;
    Lampa.Loading && Lampa.Loading.show();
    searchSource(keyword, page, function(items){
        Lampa.Loading && Lampa.Loading.hide();
        if(!items.length){
            Lampa.Noty.show('Không có kết quả');
            return;
        }
        showItemsList('Tìm: ' + keyword, items, page, function(p){
            openSearchResults(keyword, p);
        });
    });
}

function openCategoryList(){
    var items = Object.keys(CATEGORY_MAP).map(function(k){
        return { title: CATEGORY_MAP[k].name, value: k };
    });
    Lampa.Select.show({
        title: 'Danh mục',
        items: items,
        onSelect: function(a){
            openCategoryPage(a.value, a.title);
        },
        onBack: function(){
            Lampa.Controller.toggle('content');
        }
    });
}

function openCategoryPage(catKey, title, page){
    page = page || 1;
    Lampa.Loading && Lampa.Loading.show();
    listCategory(catKey, page, function(items){
        Lampa.Loading && Lampa.Loading.hide();
        if(!items.length){
            Lampa.Noty.show('Danh mục trống');
            return;
        }
        showItemsList(title, items, page, function(p){
            openCategoryPage(catKey, title, p);
        });
    });
}

function showItemsList(title, items, page, loadMoreCb){
    var html = '<div class="phimhay-list"><div class="phimhay-grid">';
    items.forEach(function(it){
        var poster = absUrl(it.poster || it.poster_url || it.thumb || it.image || '');
        var t = it.title || it.name || '';
        var origin = it.origin_name || it.original_name || '';
        var year = it.year || (it.release_date || '').slice(0, 4);
        html += '<div class="phimhay-item" data-slug="' + E(it.slug || '') + '" data-title="' + E(t) + '">'
            + '<div class="phimhay-poster" style="background-image:url(' + E(poster) + ')">'
            + (year ? '<span class="phimhay-year">' + E(year) + '</span>' : '')
            + '</div>'
            + '<div class="phimhay-info">'
            + '<div class="phimhay-title">' + E(t) + '</div>'
            + (origin ? '<div class="phimhay-origin">' + E(origin) + '</div>' : '')
            + '</div>'
            + '</div>';
    });
    html += '</div></div>';

    var $view = $('<div class="phimhay-page"></div>');
    $view.html(html);
    $view.prepend('<div class="phimhay-header">' + E(title) + '</div>');

    Lampa.Activity.push({
        url: '',
        title: title,
        component: 'phimhay_page',
        source: $view,
        onAppend: function(){}
    });

    // Bind click
    $view.find('.phimhay-item').on('click', function(){
        var slug = $(this).attr('data-slug');
        var t = $(this).attr('data-title');
        if(slug) openMovieDetail(slug, t);
    });
    $view.find('.phimhay-item').on('hover:enter', function(){
        var slug = $(this).attr('data-slug');
        var t = $(this).attr('data-title');
        if(slug) openMovieDetail(slug, t);
    });
}

function openMovieDetail(slug, fallbackTitle){
    Lampa.Loading && Lampa.Loading.show();
    getDetail(slug, function(detail){
        Lampa.Loading && Lampa.Loading.hide();
        if(!detail){ Lampa.Noty.show('Không tải được'); return; }
        showEpisodes(detail, { title: detail.title || fallbackTitle });
    });
}

/* ============================================================================
 * CSS INLINE (ĐỂ PLUGIN ĐỘC LẬP)
 * ============================================================================ */

function injectCSS(){
    if($('#phimhay-css').length) return;
    var css = ''
        + '.phimhay-page{padding:3em 2em;background:#0b0b0b;min-height:100vh;color:#fff;}'
        + '.phimhay-header{font-size:1.6em;font-weight:700;margin-bottom:1.5em;padding-bottom:.5em;border-bottom:1px solid rgba(255,255,255,.1);}'
        + '.phimhay-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:1.5em;}'
        + '.phimhay-item{cursor:pointer;transition:transform .2s;}'
        + '.phimhay-item:hover,.phimhay-item.focus{transform:scale(1.05);}'
        + '.phimhay-poster{width:100%;padding-top:150%;background-size:cover;background-position:center;border-radius:6px;position:relative;background-color:#222;}'
        + '.phimhay-year{position:absolute;top:.5em;right:.5em;background:rgba(0,0,0,.7);color:#fff;padding:.2em .5em;border-radius:3px;font-size:.75em;}'
        + '.phimhay-info{margin-top:.6em;}'
        + '.phimhay-title{font-size:1em;font-weight:600;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}'
        + '.phimhay-origin{font-size:.85em;color:rgba(255,255,255,.6);margin-top:.3em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}';
    $('head').append('<style id="phimhay-css">' + css + '</style>');
}

/* ============================================================================
 * KHỞI TẠO
 * ============================================================================ */

function start(){
    if(window.__phimhay_parser_started) return;
    window.__phimhay_parser_started = true;

    injectCSS();

    // Thêm mục menu nếu Lampa hỗ trợ
    try{ addMenuItem(); }catch(e){ console.warn('[PhimHay] addMenuItem failed:', e); }

    // Hook vào trang chi tiết phim để chèn nút
    Lampa.Listener.follow('full', function(e){
        if(e.type !== 'complite') return;
        var card = (e.data && e.data.movie) || (e.object && e.object.card);
        if(!card) return;
        var $ctx = (e.object && e.object.activity && e.object.activity.render) ? e.object.activity.render() : null;
        if(!$ctx || !$ctx.length) return;
        if($ctx.find('.view--phimhay').length) return;
        var btn = buildSourceButton(null, card);
        btn.addClass('view--phimhay');
        // Tìm chỗ chèn: sau các nút torrent hiện có, hoặc cuối button bar
        var anchor = $ctx.find('.full-start__buttons, .view--torrent, .view--kkphim');
        if(anchor.length){
            anchor.last().after(btn);
        } else {
            $ctx.find('.full-start').append(btn);
        }
    });

    console.log('[PhimHay Parser] v1.0.0 ready');
}

if(window.appready) start();
else Lampa.Listener.follow('app', function(e){ if(e.type === 'ready') start(); });

/* ============================================================================
 * API CÔNG KHAI - ĐỂ PLUGIN KHÁC CÓ THỂ TÍCH HỢP
 * ============================================================================ */

window.__phimhay_parser = {
    version: '1.0.0',
    /* Tìm kiếm */
    search: searchSource,
    /* Lấy chi tiết */
    detail: getDetail,
    /* Lấy danh sách theo category */
    list: listCategory,
    /* Phát 1 tập */
    play: playEpisode,
    /* Tạo nút cho trang chi tiết */
    buildButton: buildSourceButton,
    /* Mở trang chủ */
    open: openPhimHayHome,
    /* Cấu hình */
    config: {
        get baseUrl(){ return BASE_URL; },
        get categories(){ return CATEGORY_MAP; },
        get genres(){ return GENRES; },
        get countries(){ return COUNTRIES; }
    },
    /* Thay đổi URL nguồn */
    setBaseUrl: function(url){
        if(typeof url === 'string' && url){
            BASE_URL = url.replace(/\/+$/, '');
            // Xoá cache khi đổi nguồn
            try{ localStorage.removeItem(CACHE_KEY); }catch(e){}
        }
    },
    /* Xoá cache */
    clearCache: function(){
        try{ localStorage.removeItem(CACHE_KEY); }catch(e){}
    }
};

})();
