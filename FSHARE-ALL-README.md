# FShare All-in-One Parser v1.0.0

Plugin Lampa MX tổng hợp **4 nguồn phim**: **KKPhim** + **OPhim** + **Torrentio** + **Magnetz** trong 1 file duy nhất. Bật/tắt từng nguồn trong Settings.

## ✨ Tính năng đầy đủ

| Tính năng | Mô tả |
|----------|-------|
| 🔍 Tìm kiếm | Tìm tự động trên tất cả nguồn đang bật, chấm điểm match thông minh |
| 📂 Danh mục | Phim mới, lẻ, bộ, hoạt hình, chiếu rạp, theo quốc gia |
| ❤ Yêu thích | Lưu phim yêu thích (tối đa 200) |
| 🕘 Lịch sử | Tự động lưu khi xem (tối đa 100) |
| ▶ Tiếp tục xem | Nhớ tập đang xem dở, mở lại đúng vị trí |
| ⚙️ Settings | Bật/tắt nguồn, cấu hình TorrServer/Torrentio/Magnetz |
| 🧲 Torrentio | Hỗ trợ cấu hình từ torrentio.strem.fun/configure |
| 🧲 Magnetz | Tìm kiếm theo tên (cần API key) |
| 🖥 TorrServer | Tự động add magnet vào TS, chọn file nếu nhiều |
| 🌐 Đa nền tảng | Web, Android TV, Tizen, WebOS |

## 📦 Cài đặt

### 1. Deploy lên GitHub Pages

Upload file `fshare-all.js` lên GitHub repo (VD: `yourname/lampa-plugins`), bật GitHub Pages ở branch `main`, root. URL sẽ là:
```
https://yourname.github.io/lampa-plugins/fshare-all.js
```

### 2. Cài vào Lampa

Mở Lampa → **Cài đặt** → **Plugin** → **Thêm từ URL** → dán URL trên.

### 3. Cấu hình (lần đầu)

Mở Lampa → **Menu chính** → **FShare All** → **⚙️ Cài đặt**:
- ✅ Bật/tắt từng nguồn (KKPhim/OPhim bật sẵn, Magnetz cần API key)
- 🌐 Nhập **TorrServer URL** nếu muốn stream trực tiếp torrent
- 🔧 Nhập **Torrentio config** (từ torrentio.strem.fun/configure)
- 🔑 Nhập **Magnetz API key** (từ magnetz.io) - nếu dùng

## 🎮 Sử dụng

### Mở plugin
- **Cách 1**: Menu Lampa → **FShare All**
- **Cách 2**: Trong trang chi tiết phim → nút **🎬 FShare** (ở cạnh các nút khác)

### Tìm phim
- Menu → **🔍 Tìm kiếm** → gõ tên phim
- Kết quả từ tất cả nguồn sẽ hiện cùng lúc, có tag nguồn ở góc

### Xem phim
- Click vào phim → chọn **server** → chọn **tập** → xem
- Phim sẽ tự lưu vào **lịch sử** + **tiếp tục xem**

### Torrentio
- Trong trang phim (đã mở từ FShare) → bấm **▶ Torrentio**
- Hoặc bấm nút **🎬 FShare** trên trang chi tiết TMDB → chọn **🧲 Torrentio**
- Kết quả đã sort theo seeds, bấm để play
- Có TorrServer → tự động stream trong app
- Không có TorrServer → mở magnet qua app torrent

## ⚙️ Cấu hình TorrServer

Nếu bạn có **TorrServer** chạy local (192.168.x.x:8090):
1. Vào Settings → nhập URL (VD: `192.168.1.100:8090`)
2. Nhập password nếu có
3. Bấm **🧪 Test TorrServer** để kiểm tra
4. Khi play torrent, plugin sẽ tự add magnet vào TS

## 🔑 Cấu hình Magnetz

1. Đăng ký tài khoản tại **magnetz.io**
2. Lấy API key
3. Vào Settings → bật Magnetz → nhập key → Save

## 📝 Cấu trúc file

```
fshare-all.js (1482 dòng)
├── SOURCES - 4 nguồn cấu hình
├── Storage - cache, fav, history, continue
├── HTTP client - gọi API/scrap
├── KKPhim/OPhim handlers
├── Torrentio parser (parse quality, codec, audio, seeds...)
├── Magnetz search
├── TorrServer integration
├── UI - cards, episodes, settings
├── Hooks - inject vào menu + trang chi tiết
└── Public API - dùng từ console/plugin khác
```

## 🐛 Troubleshooting

### Plugin không hiện trong menu
- Plugin tự thêm mục **"FShare All"** vào cuối menu chính (sidebar trái) ngay khi Lampa ready.
- Nếu không thấy: mở DevTools (F12) → Console xem log `[FShare All]` — phải thấy `[FShare All] v1.0.0 ready` và `Đã thêm mục menu "FShare All"`.
- Sau khi cập nhật file trên GitHub, **xoá plugin cũ trong Settings → Plugin rồi thêm lại URL** (Lampa có cache plugin, không tự lấy bản mới).
- Nếu dùng Lampa bản mới, plugin cũng hiện trong danh sách Extensions/Plugin đã cài.

### KKPhim/OPhim không có kết quả
- API có thể đã đổi URL. Mở https://phimapi.com/ kiểm tra
- Hoặc CORS block - cần dùng proxy

### Torrentio trả về 0 stream
- Cần config. Vào torrentio.strem.fun/configure, copy URL sau dấu `/`
- VD: URL `https://torrentio.strem.fun/sort=...|providers=.../manifest.json` thì config là `sort=...|providers=...`

### Magnetz không hoạt động
- Cần API key. Kiểm tra tại magnetz.io
- Key sai sẽ trả 401/403

### Trên TV không dùng được remote
- Plugin đã hỗ trợ `hover:enter` event cho remote
- Bấm OK trên remote để chọn

## 🛠 API cho dev

```javascript
// Mở home
window.__fshare_all.openHome();

// Tìm
window.__fshare_all.search('Avengers', 1);

// Lấy yêu thích
window.__fshare_all.getFav();

// Toggle yêu thích
window.__fshare_all.toggleFav({
  id: 'avengers-2019',
  title: 'Avengers Endgame',
  slug: 'avengers-endgame'
});

// Save tiếp tục xem
window.__fshare_all.saveProgress(
  'avengers-2019',  // mediaId
  'kkphim',          // source
  'avengers-endgame',// slug
  1, 3,              // season, episode
  'Avengers Endgame' // title
);

// Lấy config
var cfg = window.__fshare_all.config.get();
console.log(cfg.torrserver_url);

// Thêm custom source
window.__fshare_all.addSource('mysource', {
  name: 'My Source',
  type: 'api',
  api: 'https://mysite.com/api/',
  endpoints: { search: 'search?q={q}', detail: 'movie/{slug}' }
});

// Xoá cache
window.__fshare_all.clearCache();
```

## 📜 License

MIT
