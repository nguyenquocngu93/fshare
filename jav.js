(function() {
    'use strict';
    
    if(window.__kkphim_plugin_loaded) return;
    window.__kkphim_plugin_loaded = true;

    var KKPhim = {
        name: 'KKPhim',
        api: 'https://phimapi.com',
        img: 'https://phimimg.com',

        request: function(url, cb) {
            var full = url.indexOf('http') === 0 ? url : this.api + url;
            new Lampa.Reguest().silent(full, function(data){
                if(typeof data === 'string'){
                    try{ data = JSON.parse(data) }catch(e){}
                }
                cb(data || {});
            }, function(){
                cb({});
            });
        },

        imgUrl: function(url){
            if(!url) return '';
            return url.indexOf('http')===0 ? url : this.img + '/' + url.replace(/^\//,'');
        },

        // Chuyển data KKphim -> format Lampa
        card: function(item){
            return {
                source: 'kkphim',
                id: item.slug || item._id,
                title: item.name || '',
                original_title: item.origin_name || '',
                year: item.year,
                poster: this.imgUrl(item.poster_url || item.thumb_url),
                background: this.imgUrl(item.thumb_url || item.poster_url),
                kp_rating: item.tmdb ? item.tmdb.vote_average : 0,
                vote_average: item.tmdb ? item.tmdb.vote_average : 0,
                overview: item.content || '',
                slug: item.slug,
                quality: item.quality,
                lang: item.lang,
                episode_current: item.episode_current
            }
        }
    };

    // ===== MAIN PAGE =====
    function KKPhimMain(){
        var html = $('<div class="kkphim-main"></div>');
        var scroll = new Lampa.Scroll({mask:true, over:true});
        html.append(scroll.render());
        
        var cats = [
            {title:'🔥 Mới Cập Nhật', url:'/danh-sach/phim-moi-cap-nhat'},
            {title:'🎬 Phim Lẻ', url:'/v1/api/danh-sach/phim-le'},
            {title:'📺 Phim Bộ', url:'/v1/api/danh-sach/phim-bo'},
            {title:'🎨 Hoạt Hình', url:'/v1/api/danh-sach/hoat-hinh'}
        ];

        this.create = function(){
            this.activity.loader(true);
            
            cats.forEach(function(cat){
                KKPhim.request(cat.url + '?page=1', function(data){
                    var items = data.items || (data.data && data.data.items) || [];
                    if(!items.length) return;

                    var items_cards = items.slice(0,20).map(function(it){
                        return KKPhim.card(it);
                    });

                    var line = new Lampa.Category({
                        title: cat.title,
                        items: items_cards,
                        card_class: Lampa.Card,
                        onMore: function(){}
                    });

                    line.onEnter = function(card){
                        Detail.open(card.slug);
                    };

                    line.create();
                    scroll.append(line.render());
                });
            });

            setTimeout(function(){
                this.activity.loader(false);
                this.activity.toggle();
            }.bind(this), 800);
        };

        this.render = function(){ return html };
        this.destroy = function(){ scroll.destroy(); html.remove() };
        this.start = function(){ Lampa.Controller.add('content',{toggle:function(){Lampa.Controller.collectionSet(scroll.render())},back:this.back}); Lampa.Controller.toggle('content') };
        this.pause = function(){};
        this.stop = function(){};
        this.back = function(){ Lampa.Activity.backward() };
    }

    // ===== DETAIL PAGE (backdrop card) =====
    var Detail = {
        open: function(slug){
            Lampa.Loading.start();
            KKPhim.request('/phim/'+slug, function(data){
                Lampa.Loading.stop();
                if(!data.movie) return Lampa.Noty.show('Không tải được phim');

                var m = data.movie;
                var eps = data.episodes || [];

                // Dùng Full component của Lampa + custom backdrop
                var movie = {
                    source: 'kkphim',
                    title: m.name,
                    original_title: m.origin_name,
                    poster: KKPhim.imgUrl(m.poster_url),
                    background: KKPhim.imgUrl(m.thumb_url || m.poster_url),
                    background_image: KKPhim.imgUrl(m.thumb_url || m.poster_url),
                    overview: (m.content||'').replace(/<[^>]*>/g,''),
                    year: m.year,
                    genres: (m.category||[]).map(function(c){return {name:c.name}}),
                    vote_average: m.tmdb ? m.tmdb.vote_average : 0,
                    countries: (m.country||[]).map(function(c){return {name:c.name}}),
                    actors: (m.actor||[]).map(function(a){return {name:a}}),
                    director: (m.director||[]).join(', '),
                    quality: m.quality,
                    slug: m.slug
                };

                // Tạo player từ episodes
                var playlist = [];
                eps.forEach(function(server){
                    (server.server_data||[]).forEach(function(ep){
                        var url = ep.link_m3u8 || ep.link_embed;
                        if(url){
                            playlist.push({
                                title: ep.name || ep.slug,
                                url: url
                            });
                        }
                    });
                });

                if(playlist.length){
                    Lampa.Player.play({
                        playlist: playlist,
                        title: movie.title,
                        poster: movie.poster
                    });
                } else {
                    Lampa.Activity.push({
                        url: '',
                        component: 'full',
                        id: m.slug,
                        method: 'movie',
                        card: movie,
                        source: 'kkphim'
                    });
                }
            });
        }
    };

    // ===== REGISTER SOURCE =====
    Lampa.Api.add({
        component: 'kkphim',
        name: 'KKPhim'
    });

    Lampa.Search.add({
        component: 'kkphim',
        name: 'KKPhim',
        search: function(query, ready){
            KKPhim.request('/v1/api/tim-kiem?keyword='+encodeURIComponent(query)+'&limit=20', function(data){
                var items = (data.data && data.data.items) || [];
                ready(items.map(function(it){ return KKPhim.card(it) }));
            });
        }
    });

    // ===== MENU =====
    function addMenu(){
        var item = $('<li class="menu__item selector" data-action="kkphim">\
            <div class="menu__ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg></div>\
            <div class="menu__text">KKPhim</div>\
        </li>');
        
        item.on('hover:enter', function(){
            Lampa.Activity.push({
                url: '',
                title: 'KKPhim',
                component: 'kkphim_main'
            });
        });
        
        $('.menu .menu__list').eq(0).append(item);
    }

    // ===== STYLES (backdrop effect) =====
    function addStyle(){
        var css = `
        .kkphim-main {padding: 1em 0;}
        .card--kkphim .card__view {border-radius: 0.8em; overflow:hidden;}
        .card--kkphim .card__img {aspect-ratio:2/3; object-fit:cover; transition:transform .3s;}
        .card--kkphim.focus .card__img {transform:scale(1.05);}
        .card--kkphim .card__title {font-weight:600;}
        `;
        if(!$('#kkphim_css').length) $('head').append('<style id="kkphim_css">'+css+'</style>');
    }

    // ===== INIT =====
    Lampa.Component.add('kkphim_main', KKPhimMain);

    Lampa.Listener.follow('app', function(e){
        if(e.type == 'ready'){
            setTimeout(function(){
                addMenu();
                addStyle();
                Lampa.Noty.show('KKPhim đã sẵn sàng');
            }, 1000);
        }
    });

})();