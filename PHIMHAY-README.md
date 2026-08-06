# PhimHay Parser - Plugin Lampa MX

Plugin parser phim tiếng Việt cho **Lampa MX** - một trong những launcher xem phim phổ biến nhất trên Smart TV, Android TV Box, Web và điện thoại.

## ✨ Tính năng

- ✅ **Tìm kiếm** phim theo tên tiếng Việt/Anh
- ✅ **Danh mục** đa dạng: Phim mới, Phim lẻ, Phim bộ, Hoạt hình, Chiếu rạp...
- ✅ **Lọc nâng cao**: thể loại, quốc gia, năm, sắp xếp
- ✅ **Cache thông minh**: tăng tốc độ tải, giảm request server
- ✅ **Hỗ trợ cả API và scrape HTML** (dễ tùy chỉnh cho nhiều nguồn)
- ✅ **Tương thích mọi nền tảng**: Web, Android TV, Tizen (Samsung), WebOS (LG)
- ✅ **Tích hợp vào trang chi tiết** tự động - chỉ cần bấm là xem
- ✅ **Giao diện tiếng Việt** toàn bộ

## 📦 Cài đặt

### Bước 1: Tùy chỉnh nguồn phim

Mở file `phimhay-parser.js`, tìm phần **CẤU HÌNH NGUỒN PHIM** và chỉnh:

```javascript
var BASE_URL = 'https://your-domain.com';  // ← Đổi thành domain của bạn

var API = {
    search: '/api/search?keyword={q}&page={p}',
    detail: '/api/movie/{slug}',
    list:   '/api/danh-sach/{cat}?page={p}'
};

var CATEGORY_MAP = {
    'phim-moi': { name: 'Phim Mới', slug: 'phim-moi' },
    // ... thêm/bớt theo nguồn của bạn
};
```

**Hai chế độ hoạt động:**

1. **API JSON** (khuyến nghị, nhanh hơn): Plugin sẽ gọi API endpoints bạn cung cấp.
2. **Scrape HTML** (mặc định, không cần API): Plugin tự phân tích HTML. Chỉ cần chỉnh `SELECTORS` cho khớp với cấu trúc HTML của trang.

### Bước 2: Deploy lên GitHub Pages

1. **Tạo repo GitHub mới** với tên bất kỳ (VD: `phimhay-parser`).

2. **Upload file** `phimhay-parser.js` lên repo.

3. **Bật GitHub Pages**:
   - Vào repo → **Settings** → **Pages**
   - Source: chọn `main` branch, `/ (root)`
   - Bấm Save
   - Đợi 1-2 phút, GitHub sẽ cho bạn URL kiểu: `https://username.github.io/phimhay-parser/phimhay-parser.js`

### Bước 3: Cài vào Lampa

1. Mở **Lampa MX**.
2. Vào **Cài đặt** → **Plugin** (hoặc **Plugins**).
3. Bấm **"Thêm plugin từ URL"**.
4. Dán URL của bạn: `https://username.github.io/phimhay-parser/phimhay-parser.js`
5. Bấm **OK** → Plugin sẽ tự load.

### Bước 4 (tùy chọn): Tự khởi động cùng Lampa

Nếu bạn muốn plugin tự load mỗi khi Lampa mở, thêm URL vào Lampa Settings:
- **Cài đặt → Chung → Plugin URL tự động**

## 🔧 Tuỳ chỉnh nâng cao

### Chỉnh selector cho scrape HTML

```javascript
var SELECTORS = {
    listItem:  '.ml-item',                              // Class của mỗi phim trong danh sách
    listLink:  'a[href]',                                // Link chi tiết
    listTitle: '.film-name',                             // Tên phim
    listImg:   'img',                                    // Ảnh poster
    listYear:  '.film-year',                             // Năm
    detailTitle:'.film-title',                           // Tiêu đề trang chi tiết
    detailImg:  '.film-poster img',                      // Ảnh poster
    detailDesc: '.film-description',                     // Mô tả
    detailServer:'.server-item',                         // Khối server
    detailServerName:'.server-name',                     // Tên server
    detailEpisode:'.ep-item',                            // Mỗi tập
    detailEpisodeLink:'a[href], a'                       // Link tập
};
```

### Thay đổi URL nguồn lúc runtime

Mở **DevTools (F12)** trong Lampa Web, gõ:

```javascript
window.__phimhay_parser.setBaseUrl('https://new-source.com');
window.__phimhay_parser.clearCache();
```

### Tích hợp với plugin khác

```javascript
// Tìm phim
window.__phimhay_parser.search('Avengers', 1, function(items){
    console.log(items);
});

// Lấy chi tiết + tập
window.__phimhay_parser.detail('avengers-endgame', function(detail){
    console.log(detail.episodes);
});

// Phát trực tiếp
window.__phimhay_parser.play('Tập 1', 'https://example.com/video.m3u8', card);
```

## 🐛 Xử lý lỗi thường gặp

### Plugin không load
- Kiểm tra URL có đúng `.js` và truy cập được không.
- Mở DevTools (F12) → tab **Console** xem lỗi.
- Nếu thấy `CORS`, nghĩa là nguồn phim chặn CORS. Cần dùng proxy hoặc API thay vì scrape.

### Tìm kiếm không ra kết quả
- Mở DevTools → Network, tìm request đến trang của bạn xem có gọi đi không.
- Nếu 404 → sai BASE_URL hoặc sai API endpoint.
- Nếu 200 nhưng items rỗng → sai selector HTML.

### Không có tập nào
- Kiểm tra `detailServer`, `detailEpisode` selector có khớp với HTML thật không.
- Mở trang chi tiết 1 phim trên nguồn, view source, tìm class/id của từng tập.

### Trên TV không click được
- Plugin đã hỗ trợ sự kiện `hover:enter` (điều khiển từ xa) và touch.
- Nếu TV vẫn không phản hồi, thêm CSS để button có class `selector` (đã có sẵn).

## 📝 License

MIT - Tự do sử dụng, sửa đổi, phân phối.

## 🤝 Đóng góp

Nếu bạn tạo plugin cho nguồn phim mới hay có cải tiến, hãy share để cộng đồng Lampa thêm phong phú!
