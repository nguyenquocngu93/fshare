(function() {
    'use strict';

    Lampa.Platform.tv(); // Khởi tạo platform TV

    /********** Component hiển thị danh sách phim KKPhim **********/
    Lampa.Component.add('kkphim_category', {
        render: function() {
            this.page = 1;
            this.loading = false;
            this.cards = [];

            this.activity.append('<div class="cards"></div>');
            this.container = this.activity.find('.cards');

            this.loadPage(this.page);
        },

        loadPage: function(page) {
            if(this.loading) return;
            this.loading = true;

            let self = this;
            $.getJSON(`https://api.kkphim.io/list?page=${page}`, function(res) {
                if(res && res.data) {
                    res.data.forEach(function(item) {
                        let $card = $(
                            '<div class="card" data-id="'+item.id+'">' +
                            '<img src="'+item.image+'" />' +
                            '<div class="card__title">'+item.title+'</div>' +
                            '</div>'
                        );
                        $card.on('hover:enter', function() {
                            Lampa.Activity.push({
                                url: 'https://api.kkphim.io/detail/'+item.id,
                                title: item.title,
                                component: 'kkphim_detail',
                                source: 'kkphim',
                                card_type: true
                            });
                        });
                        self.container.append($card);
                        self.cards.push($card);
                    });
                }

                self.loading = false;
            });
        }
    });

    /********** Component hiển thị chi tiết phim + chọn tập **********/
    Lampa.Component.add('kkphim_detail', {
        render: function() {
            let self = this;
            this.activity.append('<div class="detail">Đang tải phim...</div>');
            $.getJSON(this.source.url, function(res) {
                self.activity.find('.detail').html(
                    '<h2>'+res.title+'</h2><img src="'+res.image+'" /><p>'+res.description+'</p>'
                );

                let $eps = $('<div class="episodes"></div>');
                res.episodes.forEach(function(ep){
                    let $btn = $('<div class="episode">Tập '+ep.number+'</div>');
                    $btn.on('hover:enter', function(){
                        alert('Bạn chọn Tập '+ep.number); // Thay bằng play video
                    });
                    $eps.append($btn);
                });
                self.activity.append($eps);
            });
        }
    });

    /********** Tạo menu trái **********/
    function createMenu() {
        const $menuItem = $(
            '<li class="menu__item selector" data-action="kkphim_menu">' +
            '<div class="menu__ico">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512">' +
            '<path fill="currentColor" fill-rule="evenodd" d="M368 214l-102 187c40 71 73 97 138 94 63-2 136-89 95-163L397 150c-3 12-25 55-28 63z"/>' +
            '</svg>' +
            '</div>' +
            '<div class="menu__text">KKPhim</div>' +
            '</li>'
        );

        $menuItem.on('hover:enter', function() {
            Lampa.Activity.push({
                url: 'https://api.kkphim.io/list',
                title: 'KKPhim',
                component: 'kkphim_category',
                source: 'kkphim',
                card_type: true,
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append($menuItem);
    }

    /********** Row ngang category trên homepage **********/
    function createCategoryRow() {
        const categories = ['Hành Động','Anime','Tình Cảm','Hài'];
        categories.forEach(function(cat){
            let $row = $('<div class="category-row"><h3>'+cat+'</h3><div class="cards"></div><div class="load-more">Xem thêm</div></div>');
            $('body').append($row);

            let page = 1;
            let loading = false;
            function loadCategory(){
                if(loading) return;
                loading = true;
                $.getJSON('https://api.kkphim.io/list?category='+cat+'&page='+page, function(res){
                    res.data.forEach(function(item){
                        let $card = $('<div class="card" data-id="'+item.id+'">' +
                            '<img src="'+item.image+'" />' +
                            '<div class="card__title">'+item.title+'</div>' +
                            '</div>');
                        $card.on('hover:enter', function() {
                            Lampa.Activity.push({
                                url: 'https://api.kkphim.io/detail/'+item.id,
                                title: item.title,
                                component: 'kkphim_detail',
                                source: 'kkphim',
                                card_type: true
                            });
                        });
                        $row.find('.cards').append($card);
                    });
                    loading = false;
                });
            }

            $row.find('.load-more').on('hover:enter', function(){
                page++;
                loadCategory();
            });

            loadCategory();
        });
    }

    // Khởi tạo menu + category row khi app ready
    if(window.appready) {
        createMenu();
        createCategoryRow();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if(e.type === 'ready') {
                createMenu();
                createCategoryRow();
            }
        });
    }

})();