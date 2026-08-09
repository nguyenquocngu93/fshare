# TorrShelf — CineWave Cinema Edition

Web local khám phá phim/series TMDB với giao diện chuẩn **CineWave**, tìm kiếm torrent tốc độ cao từ **Magnetz** & **Knaben**, lọc dung lượng/seed thông minh và stream trực tiếp qua **TorrServer**.

TorrShelf sử dụng các API chính thức:
- **TMDB API**: <https://developer.themoviedb.org/>
- **Magnetz API**: <https://magnetz.eu/apis>
- **Knaben API v1**: <https://knaben.org/api/v1/>
- **TorrServer API**: `POST /torrents`

---

## Tính năng nổi bật (CineWave Edition)

- **Giao diện CineWave Streaming Platform**:
  - Tông màu Ultra Dark huyền bí, hiệu ứng ánh sáng ambient neon, card 2:3 kính mờ glassmorphism, badge đánh giá ⭐ và hiệu ứng hover cinema.
  - **Hero Showcase Spotlight Carousel**: Hiển thị slide các phim/series thịnh hành nhất tuần với backdrop 4K, tóm tắt, tag thể loại và nút xem nhanh/trailer.
  - **Discovery Hub**: Lựa chọn phim theo tâm trạng (*Adrenaline, Cozy, Spooky, Emotional, Epic, Happy, Mind-Bending*), theo thể loại hoặc phân loại (*Phim lẻ, Phim bộ, Anime*).
  - **Anime Universe**: Vũ trụ Anime tuyển chọn từ Nhật Bản với bảng xếp hạng thịnh hành, anime kinh điển, movie chiếu rạp và thể loại Shonen/Romance.
  - **Trang chi tiết phim đầy đủ**: Backdrop full-bleed, poster, chứng nhận độ tuổi (PG-13, TV-MA), thời lượng, dàn diễn viên (Top Cast) với avatar tròn, đạo diễn, hãng sản xuất, trailer YouTube trong app và gợi ý phim tương tự (Related Content).
  - **Netflix-style TV Season & Episodes**: Chọn mùa, xem ảnh chụp tập phim, thời lượng, điểm đánh giá, tóm tắt tập và nút **"Tìm tập này"** một chạm (ví dụ: `Silo S01E03`).
  - **Xem tiếp (Continue Watching)**: Tự động lưu tiến độ xem trong trình duyệt, hiển thị thanh thời gian và cho phép tiếp tục xem từ giây dừng lại.
  - **Trung tâm điều khiển (Control Center & Preferences)**: Quản lý trạng thái TMDB, TorrServer, tùy biến 4 chủ đề giao diện (*Ultra Dark CineWave, Midnight Slate, Cyberpunk Neon, OLED Pure Black*).

- **Công cụ tìm kiếm Torrent chuyên sâu (Magnetz + Knaben)**:
  - Gộp kết quả trùng lặp theo `info-hash` và tối ưu hoá tracker.
  - Tìm kiếm đồng thời với bộ lọc dung lượng người dùng tự chọn, seed tối thiểu và lọc nội dung người lớn.
  - Một chạm **Gửi TorrServer** với lưu trữ database (`save_to_db: true`).

- **Quản lý & Stream TorrServer Telemetry**:
  - Telemetry cập nhật liên tục: tốc độ tải (MB/s), peer kết nối, seed hoạt động, thanh tiến độ preload buffer.
  - Duyệt cây file trong torrent nhiều tập (Season pack), chọn từng tập để phát hoặc preload.
  - Trình phát video HTML5 tích hợp, hỗ trợ mở trực tiếp qua **VLC** (`vlc://`) hoặc copy link HTTP Range.

---

## Cài đặt & Khởi động

### Cách 1: Chạy trực tiếp bằng Node.js (Khuyên dùng)

Yêu cầu Node.js 20 trở lên và TorrServer đang chạy tại `127.0.0.1:8090`.

1. Lấy **API Read Access Token** tại <https://www.themoviedb.org/settings/api>.
2. Tạo file `.env`:
   ```bash
   cp .env.example .env
   # Mở file .env và điền:
   # TMDB_API_TOKEN=eyJhbGciOiJIUzI1NiJ9...
   ```
3. Khởi động ứng dụng:
   ```bash
   npm start
   ```
4. Mở trình duyệt:
   ```text
   http://127.0.0.1:8787
   ```

### Chạy trên Android với Termux

```bash
pkg update
pkg install nodejs-lts curl unzip
unzip -o torr-shelf.zip -d ~/torr-shelf
cd ~/torr-shelf
cp .env.example .env
# Điền TMDB_API_TOKEN vào .env
npm start
```

Mở trên điện thoại: `http://127.0.0.1:8787`.

### Cách 2: Chạy bằng Docker Compose

```bash
cp .env.docker.example .env
docker compose up -d --build
```

Mở <http://127.0.0.1:8787>.

---

## Cấu hình Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `HOST` | `127.0.0.1` | Địa chỉ IP TorrShelf lắng nghe |
| `PORT` | `8787` | Cổng web TorrShelf |
| `TMDB_API_TOKEN` | *(trống)* | API Read Access Token từ TMDB |
| `TMDB_API_KEY` | *(trống)* | API Key v3 từ TMDB (fallback nếu có) |
| `TMDB_LANGUAGE` | `vi-VN` | Ngôn ngữ ưu tiên metadata |
| `TMDB_REGION` | `VN` | Khu vực phát hành rạp |
| `TORRSERVER_URL` | `http://127.0.0.1:8090` | Địa chỉ backend kết nối TorrServer |
| `TORRSERVER_PUBLIC_URL` | `http://127.0.0.1:8090` | Địa chỉ mở stream trên trình duyệt/VLC |

---

## Kiểm thử tự động

```bash
npm test
```

---

## Bản quyền & TMDB Attribution

Ứng dụng sử dụng TMDB API để lấy thông tin phim và hình ảnh. Bản quyền thuộc về TMDB và các nhà sáng tạo nội dung.
Chỉ sử dụng với nội dung bạn có quyền truy cập và chia sẻ hợp pháp.
