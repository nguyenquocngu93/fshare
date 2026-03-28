(function () {
    // Polyfills (giữ nguyên)
    if (!Object.keys) { Object.keys = function getObjectKeys(o) { var r = [], k; for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) { r.push(k); } } return r; }; }
    if (!Array.prototype.map) { Array.prototype.map = function mapArray(c, t) { if (this == null) { throw new TypeError('Array is null or undefined'); } var s = Object(this), l = s.length >>> 0; if (typeof c !== 'function') { throw new TypeError(c + ' is not a function'); } var r = new Array(l); for (var i = 0; i < l; i++) { if (i in s) { r[i] = c.call(t, s[i], i, s); } } return r; }; }
    if (!Array.prototype.forEach) { Array.prototype.forEach = function forEachArray(c, t) { if (this == null) { throw new TypeError('Array is null or undefined'); } var s = Object(this), l = s.length >>> 0; if (typeof c !== 'function') { throw new TypeError(c + ' is not a function'); } for (var i = 0; i < l; i++) { if (i in s) { c.call(t, s[i], i, s); } } }; }
    if (!Array.prototype.indexOf) { Array.prototype.indexOf = function indexOfElement(e, f) { if (this == null) { throw new TypeError('"this" is null or not defined'); } var s = Object(this), l = s.length >>> 0; if (l === 0) return -1; var i = Number(f) || 0; if (i >= l) return -1; var k = Math.max(i >= 0 ? i : l - Math.abs(i), 0); while (k < l) { if (k in s && s[k] === e) return k; k++; } return -1; }; }

    addTranslates();

    var ICON = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"><g><g><path fill="currentColor" d="M482.909,67.2H29.091C13.05,67.2,0,80.25,0,96.291v319.418C0,431.75,13.05,444.8,29.091,444.8h453.818c16.041,0,29.091-13.05,29.091-29.091V96.291C512,80.25,498.95,67.2,482.909,67.2z M477.091,409.891H34.909V102.109h442.182V409.891z"/></g></g><g><g><rect fill="currentColor" x="126.836" y="84.655" width="34.909" height="342.109"/></g></g><g><g><rect fill="currentColor" x="350.255" y="84.655" width="34.909" height="342.109"/></g></g><g><g><rect fill="currentColor" x="367.709" y="184.145" width="126.836" height="34.909"/></g></g><g><g><rect fill="currentColor" x="17.455" y="184.145" width="126.836" height="34.909"/></g></g><g><g><rect fill="currentColor" x="367.709" y="292.364" width="126.836" height="34.909"/></g></g><g><g><rect fill="currentColor" x="17.455" y="292.364" width="126.836" height="34.909"/></g></g></svg>';

    var SOURCE_NAME = 'KPHim';
    var CACHE_SIZE = 100;
    var CACHE_TIME = 1000 * 60 * 60 * 3;
    var cache = {};

    var API_BASE_URL = 'https://phimapi.com';
    var IMAGE_BASE_URL = 'https://phimimg.com';

    var CATEGORIES = {
        'phim-bo': 'Phim bộ',
        'phim-le': 'Phim lẻ',
        'tv-show': 'TV Shows',
        'hoathinh': 'Hoạt hình',
        'phim-chieu-rap': 'Phim chiếu rạp'
    };

    var DISPLAY_OPTIONS = {};
    for (var cat in CATEGORIES) {
        DISPLAY_OPTIONS[cat] = {
            title: CATEGORIES[cat],
            visible: true
        };
    }

    function KPHimApiService() {
        var self = this;
        self.network = new Lampa.Reguest();

        function getCache(key) {
            var res = cache[key];
            if (res) {
                var cache_timestamp = Date.now() - CACHE_TIME;
                if (res.timestamp > cache_timestamp) return res.value;
                for (var ID in cache) {
                    var node = cache[ID];
                    if (!(node && node.timestamp > cache_timestamp)) delete cache[ID];
                }
            }
            return null;
        }

        function setCache(key, value) {
            var timestamp = Date.now();
            var size = Object.keys(cache).length;
            if (size >= CACHE_SIZE) {
                var cache_timestamp = timestamp - CACHE_TIME;
                for (var ID in cache) {
                    var node = cache[ID];
                    if (!(node && node.timestamp > cache_timestamp)) delete cache[ID];
                }
                size = Object.keys(cache).length;
                if (size >= CACHE_SIZE) {
                    var timestamps = [];
                    for (var ID in cache) {
                        var node = cache[ID];
                        timestamps.push(node && node.timestamp || 0);
                    }
                    timestamps.sort(function (a, b) { return a - b });
                    cache_timestamp = timestamps[Math.floor(timestamps.length / 2)];
                    for (var ID in cache) {
                        var node = cache[ID];
                        if (!(node && node.timestamp > cache_timestamp)) delete cache[ID];
                    }
                }
            }
            cache[key] = {
                timestamp: timestamp,
                value: value
            };
        }

        function normalizeData(json) {
            var items = [];
            if (json && json.data && json.data.items) {
                items = json.data.items;
            } else if (json && json.items) {
                items = json.items;
            } else if (Array.isArray(json)) {
                items = json;
            }

            return {
                results: items.map(function (item) {
                    return {
                        id: item._id,
                        name: item.name,
                        title: item.name,
                        original_name: item.origin_name,
                        poster_path: item.poster_url || item.thumb_url,
                        img: item.poster_url || item.thumb_url,
                        overview: item.content || item.description,
                        vote_average: item.tmdb?.vote_average || 0,
                        year: item.year,
                        slug: item.slug,
                        source: SOURCE_NAME
                    };
                }),
                page: json.page || 1,
                total_pages: Math.ceil((json.data?.total || json.total || 0) / 20) || 1,
                total_results: json.data?.total || json.total || 0
            };
        }

        self.get = function (url, onComplete, onError) {
            var cached = getCache(url);
            if (cached) {
                onComplete(cached);
                return;
            }

            self.network.silent(url, function (json) {
                if (!json) {
                    onError(new Error('Empty response'));
                    return;
                }
                var normalized = normalizeData(json);
                setCache(url, normalized);
                onComplete(normalized);
            }, function (err) {
                onError(err);
            });
        };

        self.list = function (params, onComplete, onError) {
            params = params || {};
            var category = params.url || 'phim-bo';
            var page = params.page || 1;
            var limit = 20;
            var url = API_BASE_URL + '/v1/api/danh-sach/' + category + '?page=' + page + '&limit=' + limit;
            self.get(url, onComplete, onError);
        };

        self.full = function (params, onSuccess, onError) {
            var slug = params.card.slug;
            if (!slug) {
                onError(new Error('No slug'));
                return;
            }
            var url = API_BASE_URL + '/v1/api/phim/' + slug;
            self.network.silent(url, function (json) {
                if (json && json.data && json.data.movie) {
                    var movie = json.data.movie;
                    var card = {
                        id: movie._id,
                        name: movie.name,
                        title: movie.name,
                        original_name: movie.origin_name,
                        overview: movie.content,
                        poster_path: movie.poster_url,
                        backdrop_path: movie.thumb_url,
                        year: movie.year,
                        type: movie.type,
                        status: movie.status,
                        episode_total: movie.episode_total,
                        episodes: json.data.episodes || []
                    };
                    onSuccess(card);
                } else {
                    onError(new Error('Movie not found'));
                }
            }, onError);
        };

        self.category = function (params, onSuccess, onError) {
            var partsData = [];
            for (var key in DISPLAY_OPTIONS) {
                if (DISPLAY_OPTIONS[key].visible) {
                    partsData.push((function(catKey, catTitle) {
                        return function(callback) {
                            callback({
                                source: SOURCE_NAME,
                                url: catKey,
                                title: catTitle,
                                page: 1,
                                more: true,
                                results: []
                            });
                        };
                    })(key, DISPLAY_OPTIONS[key].title));
                }
            }
            Lampa.Api.partNext(partsData, 5, onSuccess, onError);
        };

        self.search = function (params, onSuccess, onError) {
            var query = params.query;
            var page = params.page || 1;
            if (!query) {
                onError(new Error('No query'));
                return;
            }
            var url = API_BASE_URL + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(query) + '&page=' + page;
            self.get(url, onSuccess, onError);
        };

        self.clear = function () {
            self.network.clear();
        };
    }

    function addTranslates() {
        Lampa.Lang.add({
            kphim_title: {
                en: 'KPHim',
                vi: 'KPHim'
            },
            phim_bo: {
                en: 'TV Series',
                vi: 'Phim bộ'
            },
            phim_le: {
                en: 'Movies',
                vi: 'Phim lẻ'
            },
            tv_show: {
                en: 'TV Shows',
                vi: 'TV Shows'
            },
            hoathinh: {
                en: 'Animation',
                vi: 'Hoạt hình'
            },
            phim_chieu_rap: {
                en: 'Now Showing',
                vi: 'Phim chiếu rạp'
            }
        });
    }

    function startPlugin() {
        if (window.kphim_plugin) return;
        window.kphim_plugin = true;

        var CAT_NAME = Lampa.Storage.get('kphim_settings_cat_name', SOURCE_NAME);

        if (Lampa.Storage.field('start_page') === SOURCE_NAME) {
            window.start_deep_link = {
                component: 'category',
                page: 1,
                url: '',
                source: SOURCE_NAME,
                title: CAT_NAME
            };
        }

        var values = Lampa.Params.values.start_page;
        values[SOURCE_NAME] = CAT_NAME;

        Lampa.SettingsApi.addComponent({
            component: 'kphim_settings',
            name: CAT_NAME,
            icon: ICON
        });

        Lampa.SettingsApi.addParam({
            component: 'kphim_settings',
            param: {
                name: 'kphim_settings_cat_name',
                type: 'input',
                placeholder: '',
                values: '',
                default: CAT_NAME
            },
            field: {
                name: Lampa.Lang.translate('kphim_title'),
                description: 'Nhập tên hiển thị cho plugin'
            },
            onChange: function (value) {
                CAT_NAME = value;
                $('.kphim_cat_text').text(value);
                Lampa.Settings.update();
            }
        });

        for (var key in DISPLAY_OPTIONS) {
            (function(catKey, catTitle) {
                var settingName = 'kphim_settings_' + catKey + '_visible';
                var visible = Lampa.Storage.get(settingName, "true").toString() === "true";
                DISPLAY_OPTIONS[catKey].visible = visible;

                Lampa.SettingsApi.addParam({
                    component: "kphim_settings",
                    param: {
                        name: settingName,
                        type: "trigger",
                        default: visible
                    },
                    field: {
                        name: catTitle,
                        description: 'Hiển thị danh mục này'
                    },
                    onChange: function(value) {
                        DISPLAY_OPTIONS[catKey].visible = value === "true";
                    }
                });
            })(key, DISPLAY_OPTIONS[key].title);
        }

        var kphimApi = new KPHimApiService();
        Lampa.Api.sources.kphim = kphimApi;
        Object.defineProperty(Lampa.Api.sources, SOURCE_NAME, {
            get: function () { return kphimApi; }
        });

        var menuItem = $('<li data-action="kphim" class="menu__item selector"><div class="menu__ico">' + ICON + '</div><div class="menu__text kphim_cat_text">' + CAT_NAME + '</div></li>');
        $('.menu .menu__list').eq(0).append(menuItem);
        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                title: CAT_NAME,
                component: 'category',
                source: SOURCE_NAME,
                page: 1
            });
        });
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                startPlugin();
            }
        });
    }
})();