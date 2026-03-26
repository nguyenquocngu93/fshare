(function() {
    'use strict';

    const API_BASE_URL = 'https://phimapi.com/api';
    const PLUGIN_NAME = 'KKPhim';
    const PLUGIN_ID = 'kkphim';

    // ============ THÊM CSS ============
    function addStyles() {
        const styleId = 'kkphim-styles';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .kkphim-container {
                padding: 20px;
                color: #fff;
                min-height: 100vh;
            }
            .kkphim-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                flex-wrap: wrap;
                gap: 10px;
            }
            .kkphim-header h2 {
                margin: 0;
                font-size: 24px;
                background: linear-gradient(135deg, #f3d900, #ff6b6b);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .kkphim-categories {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            .kkphim-categories button {
                background: rgba(255,255,255,0.1);
                border: none;
                color: #fff;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            }
            .kkphim-categories button:hover,
            .kkphim-categories button.active {
                background: #f3d900;
                color: #000;
            }
            .kkphim-movies-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            .kkphim-card {
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                background: #1a1a1a;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .kkphim-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 20px rgba(0,0,0,0.5);
            }
            .kkphim-card img {
                width: 100%;
                aspect-ratio: 2 / 3;
                object-fit: cover;
                display: block;
            }
            .kkphim-card-info {
                padding: 10px;
            }
            .kkphim-card-info .title {
                font-weight: bold;
                font-size: 14px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 4px;
            }
            .kkphim-card-info .year {
                font-size: 12px;
                color: #aaa;
            }
            .kkphim-card-info .quality {
                font-size: 10px;
                background: rgba(243,217,0,0.2);
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                margin-top: 6px;
                color: #f3d900;
            }
            .kkphim-pagination {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-top: 30px;
                flex-wrap: wrap;
            }
            .kkphim-pagination button {
                background: rgba(255,255,255,0.1);
                border: none;
                color: #fff;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                min-width: 36px;
            }
            .kkphim-pagination button:hover,
            .kkphim-pagination button.active {
                background: #f3d900;
                color: #000;
            }
            .kkphim-loading, .kkphim-error {
                text-align: center;
                padding: 50px;
                font-size: 16px;
                color: #aaa;
            }
            .kkphim-error {
                color: #ff6b6b;
            }
            @media (max-width: 768px) {
                .kkphim-movies-grid {
                    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                    gap: 12px;
                }
                .kkphim-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ============ COMPONENT CHÍNH ============
    class KkphimComponent {
        constructor() {
            this.name = PLUGIN_NAME;
            this.id = PLUGIN_ID;
            this.currentCategory = 'phim-le';
            this.currentPage = 1;
            this.totalPages = 1;
            this.container = null;
        }

        onLoad() {
            addStyles();
            this.render();
            this.loadMovies(this.currentCategory, this.currentPage);
        }

        render() {
            const contentArea = document.querySelector('.lampa-content') || 
                                document.querySelector('#app .content') ||
                                document.querySelector('.content');
            
            if (!contentArea) {
                console.error('[KKPhim] Không tìm thấy vùng nội dung');
                return;
            }

            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = 'kkphim-container';
                this.container.innerHTML = `
                    <div class="kkphim-header">
                        <h2>🎬 ${PLUGIN_NAME}</h2>
                        <div class="kkphim-categories">
                            <button data-cat="phim-le">📽️ Phim lẻ</button>
                            <button data-cat="phim-bo">📺 Phim bộ</button>
                            <button data-cat="hoat-hinh">🐉 Hoạt hình</button>
                            <button data-cat="tv-shows">📡 TV Shows</button>
                        </div>
                    </div>
                    <div class="kkphim-movies-grid"></div>
                    <div class="kkphim-pagination"></div>
                `;

                // Gán sự kiện cho các nút thể loại
                const categoryBtns = this.container.querySelectorAll('[data-cat]');
                categoryBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const cat = btn.getAttribute('data-cat');
                        this.currentCategory = cat;
                        this.currentPage = 1;
                        this.loadMovies(cat, 1);
                        categoryBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    });
                });
            }

            contentArea.innerHTML = '';
            contentArea.appendChild(this.container);
        }

        async loadMovies(category, page) {
            const grid = this.container.querySelector('.kkphim-movies-grid');
            grid.innerHTML = '<div class="kkphim-loading">⏳ Đang tải phim...</div>';

            try {
                let url = `${API_BASE_URL}/categories/${category}/films?page=${page}`;
                const response = await fetch(url);
                const data = await response.json();

                if (!data || !data.items || data.items.length === 0) {
                    grid.innerHTML = '<div class="kkphim-error">😢 Không tìm thấy phim</div>';
                    return;
                }

                const movies = data.items;
                this.totalPages = data.pagination?.totalPages || 1;

                grid.innerHTML = '';
                movies.forEach(movie => {
                    const card = this.createMovieCard(movie);
                    grid.appendChild(card);
                });

                this.renderPagination();
            } catch (error) {
                console.error('[KKPhim] Lỗi tải phim:', error);
                grid.innerHTML = '<div class="kkphim-error">❌ Lỗi kết nối API. Vui lòng thử lại sau.</div>';
            }
        }

        createMovieCard(movie) {
            const card = document.createElement('div');
            card.className = 'kkphim-card';
            const posterUrl = movie.poster_url || movie.thumb_url || '';
            const year = movie.year || '';
            const quality = movie.quality || 'HD';
            const title = movie.name || 'Không có tiêu đề';

            card.innerHTML = `
                <img src="${posterUrl}" alt="${title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
                <div class="kkphim-card-info">
                    <div class="title">${title}</div>
                    <div class="year">${year}</div>
                    <div class="quality">${quality}</div>
                </div>
            `;

            card.addEventListener('click', () => this.showDetail(movie._id));
            return card;
        }

        renderPagination() {
            const paginationDiv = this.container.querySelector('.kkphim-pagination');
            paginationDiv.innerHTML = '';

            if (this.totalPages <= 1) return;

            const maxVisible = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

            if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }

            if (this.currentPage > 1) {
                const firstBtn = document.createElement('button');
                firstBtn.textContent = '«';
                firstBtn.addEventListener('click', () => this.goToPage(1));
                paginationDiv.appendChild(firstBtn);

                const prevBtn = document.createElement('button');
                prevBtn.textContent = '‹';
                prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
                paginationDiv.appendChild(prevBtn);
            }

            for (let i = startPage; i <= endPage; i++) {
                const btn = document.createElement('button');
                btn.textContent = i;
                btn.classList.toggle('active', i === this.currentPage);
                btn.addEventListener('click', () => this.goToPage(i));
                paginationDiv.appendChild(btn);
            }

            if (this.currentPage < this.totalPages) {
                const nextBtn = document.createElement('button');
                nextBtn.textContent = '›';
                nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
                paginationDiv.appendChild(nextBtn);

                const lastBtn = document.createElement('button');
                lastBtn.textContent = '»';
                lastBtn.addEventListener('click', () => this.goToPage(this.totalPages));
                paginationDiv.appendChild(lastBtn);
            }
        }

        goToPage(page) {
            if (page === this.currentPage) return;
            this.currentPage = page;
            this.loadMovies(this.currentCategory, page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        async showDetail(id) {
            try {
                const url = `${API_BASE_URL}/films/${id}`;
                const response = await fetch(url);
                const movie = await response.json();

                if (!movie || !movie._id) {
                    alert('Không thể tải chi tiết phim');
                    return;
                }

                const message = `🎬 ${movie.name}\n📅 Năm: ${movie.year || 'N/A'}\n⭐ Điểm: ${movie.tmdb?.vote_average || 'N/A'}\n\n📝 Nội dung: ${movie.content?.substring(0, 200) || 'Không có mô tả'}...`;
                alert(message);
            } catch (error) {
                console.error('[KKPhim] Lỗi chi tiết phim:', error);
                alert('Lỗi khi tải chi tiết phim');
            }
        }
    }

    // ============ ĐĂNG KÝ MENU BẰNG API CỦA LAMPA ============
    function registerMenu() {
        // Đợi Lampa.Menu có sẵn
        if (!Lampa.Menu || !Lampa.Menu.list) {
            setTimeout(registerMenu, 500);
            return;
        }

        // Kiểm tra xem đã có menu chưa
        const exists = Lampa.Menu.list.some(item => item.id === PLUGIN_ID);
        if (exists) {
            console.log('[KKPhim] Menu đã tồn tại');
            return;
        }

        // Thêm menu mới
        Lampa.Menu.list.push({
            id: PLUGIN_ID,
            name: PLUGIN_NAME,
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4V6zm0 4h16v2H4v-2zm0 4h10v2H4v-2zm13 0h3v2h-3v-2zm-3-4h6v2h-6v-2z"/></svg>',
            onSelect: function() {
                if (!window.kkphimComponent) {
                    window.kkphimComponent = new KkphimComponent();
                }
                window.kkphimComponent.onLoad();
            }
        });

        // Làm mới menu nếu có hàm update
        if (typeof Lampa.Menu.update === 'function') {
            Lampa.Menu.update();
        }

        console.log('[KKPhim] Đã đăng ký menu thành công');
    }

    // ============ KHỞI CHẠY ============
    function init() {
        if (typeof Lampa === 'undefined') {
            Lampa.Listener.follow('app', function(e) {
                if (e.type === 'ready') {
                    registerMenu();
                }
            });
        } else {
            registerMenu();
        }
    }

    init();
})();