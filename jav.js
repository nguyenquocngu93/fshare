(function(){
    'use strict';

    function KKPhim(){
        let api = 'https://phimapi.com';
        let image = 'https://phimimg.com';

        let network = new Lampa.Reguest();
        let scroll  = new Lampa.Scroll({mask:true,over:true});
        let last    = 0;

        let categories = [
            {title:'🔥 Phim Mới Cập Nhật', url:'/danh-sach/phim-moi-cap-nhat?page=1'},
            {title:'🎬 Phim Lẻ', url:'/v1/api/danh-sach/phim-le?page=1'},
            {title:'📺 Phim Bộ', url:'/v1/api/danh-sach/phim-bo?page=1'},
            {title:'🎨 Hoạt Hình', url:'/v1/api/danh-sach/hoat-hinh?page=1'},
            {title:'📡 TV Shows', url:'/v1/api/danh-sach/tv-shows?page=1'}
        ];

        // ==================== COMPONENT ====================
        let component = new Lampa.Component('kkphim');

        component.create = function(){
            component.activity.loader(true);

            scroll.minus();
            component.activity.append(scroll.render());

            component.activity.loader(false);
            component.activity.toggle();

            loadCategories();
        }

        component.toggle = function(){
            Lampa.Activity.active(component.activity);

            scroll.update();
        }

        component.back = function(){
            Lampa.Activity.backward();
        }

        // ==================== LOAD CATEGORIES ====================
        function loadCategories(){
            let loaded = 0;
            let count = Math.min(3, categories.length);

            categories.forEach((cat, index) => {
                network.silent(api + cat.url, (data) => {
                    let items = data.items || (data.data?.items || []);
                    
                    if(items.length){
                        createRow(cat.title, items, index);
                    }

                    loaded++;
                    if(loaded >= count) scroll.update();
                }, () => {
                    loaded++;
                    if(loaded >= count) scroll.update();
                });
            });
        }

        // ==================== CREATE ROW ====================
        function createRow(title, items, index){
            let row = $('<div class="category selector" data-index="'+index+'"></div>');
            let title_block = $('<div class="category__title">'+title+'</div>');
            let content = $('<div class="category__content"></div>');

            row.append(title_block);
            row.append(content);

            items.slice(0,12).forEach((item) => {
                let card = createCard(item);
                content.append(card);
            });

            scroll.append(row);
        }

        // ==================== CREATE CARD ====================
        function createCard(item){
            let card = $('<div class="card selector" data-slug="'+item.slug+'"></div>');
            let img  = $('<img class="card__img" src="'+(item.poster_url || item.thumb_url)+'" onerror="this.src=\'./img/img_broken.svg\'">');
            let name = $('<div class="card__title">'+item.name+'</div>');
            let meta = $('<div class="card__meta">'+(item.quality || '')+' • '+item.year+'</div>');

            card.append(img);
            card.append(name);
            card.append(meta);

            card.on('hover:enter', () => {
                openDetail(item.slug);
            });

            card.on('hover:focus', () => {
                scroll.update(card, true);
            });

            return card;
        }

        // ==================== OPEN DETAIL ====================
        function openDetail(slug){
            let detail = new Lampa.Component('kkphim_detail');
            
            detail.create = function(){
                detail.activity.loader(true);

                scroll.minus();
                detail.activity.append(scroll.render());

                network.silent(api + '/phim/' + slug, (data) => {
                    let movie = data.movie;
                    let episodes = data.episodes || [];

                    renderDetail(movie, episodes);

                    detail.activity.loader(false);
                    detail.activity.toggle();
                }, () => {
                    scroll.append($('<div class="empty">Không thể tải thông tin phim</div>'));
                    detail.activity.loader(false);
                    detail.activity.toggle();
                });
            }

            detail.toggle = function(){
                Lampa.Activity.active(detail.activity);
                scroll.update();
            }

            detail.back = function(){
                Lampa.Activity.backward();
            }

            Lampa.Activity.push({
                url:'',
                title:slug,
                component:'kkphim_detail',
                component_object:detail
            });
        }

        // ==================== RENDER DETAIL ====================
        function renderDetail(movie, episodes){
            let backdrop = $('<div class="backdrop"><img src="'+movie.thumb_url+'" onerror="this.src=\'./img/img_broken.svg\'"></div>');
            let content  = $('<div class="detail__content"></div>');
            let poster   = $('<img class="detail__poster" src="'+movie.poster_url+'" onerror="this.src=\'./img/img_broken.svg\'">');
            let info     = $('<div class="detail__info"></div>');

            info.append($('<h1 class="detail__title">'+movie.name+'</h1>'));
            info.append($('<div class="detail__original">'+movie.origin_name+'</div>'));
            info.append($('<div class="detail__meta">'+movie.year+' • '+movie.quality+' • '+movie.lang+'</div>'));
            info.append($('<div class="detail__desc">'+movie.content+'</div>'));

            if(episodes.length){
                let episodes_block = $('<div class="detail__episodes"></div>');
                episodes.forEach((server) => {
                    let server_title = $('<div class="detail__server">'+server.server_name+'</div>');
                    let server_episodes = $('<div class="detail__episodes-grid"></div>');

                    server.server_data.forEach((ep) => {
                        let ep_btn = $('<div class="detail__ep-btn selector">'+ep.name+'</div>');
                        ep_btn.on('hover:enter', () => {
                            play(ep.link_m3u8 || ep.link_embed, movie.name + ' - ' + ep.name);
                        });
                        server_episodes.append(ep_btn);
                    });

                    episodes_block.append(server_title);
                    episodes_block.append(server_episodes);
                });
                content.append(episodes_block);
            }

            content.append(backdrop);
            content.append(poster);
            content.append(info);

            scroll.append(content);
        }

        // ==================== PLAY VIDEO ====================
        function play(url, title){
            if(url){
                Lampa.Player.play({
                    title:title,
                    url:url,
                    poster:''
                });
            } else {
                Lampa.Noty.show('Không tìm thấy link phát');
            }
        }

        // ==================== ADD MENU ====================
        function addMenu(){
            let menu = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico">🎬</div><div class="menu__text">KKPhim</div></li>');
            
            menu.on('hover:enter', () => {
                Lampa.Activity.push({
                    url:'',
                    title:'KKPhim',
                    component:'kkphim',
                    component_object:component
                });
            });

            $('.menu .menu__list').eq(0).append(menu);
        }

        // ==================== INIT ====================
        addMenu();
    }

    // Wait for Lampa ready
    if(window.appready) KKPhim();
    else document.addEventListener('appready', KKPhim);
})();