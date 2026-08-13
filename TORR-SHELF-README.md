# TorrShelf 1.6.6 — Stremio movie-info proportions

Bản phát hành này chỉnh riêng trang **Movie / Series detail** theo bố cục Stremio trong ảnh tham chiếu:

- Hero backdrop full-bleed trên mobile với chiều cao linh hoạt `clamp(248px, 74vw, 360px)`.
- Logo/tên phim nằm sát phần fade cuối backdrop; không còn khoảng trống lớn trước metadata.
- Runtime, năm, điểm TMDB và badge IMDb nằm trên một hàng, kèm nút thích và yêu thích ở mép phải.
- Thể loại và Director / Cast / Writer hiển thị thành pill, trước danh sách cast đầy đủ.
- Header chung trở nên trong suốt ở đầu trang detail trên điện thoại; khi cuộn, header nhận diện phim hiện lại như hiệu ứng reveal.
- Bổ sung trường `writers` từ TMDB và lưu trạng thái “thích” cục bộ (`torrshelf:liked-media`). Thư viện vẫn đồng bộ như cũ.

## Cài trên Termux

Tải và chạy file `install-torr-shelf-v1.6.6-stremio-info-proportions.sh`. Script giải nén vào `~/torr-shelf`, giữ nguyên `.env` và `data/sync.json` hiện có, sau đó dừng server cũ.

```bash
cd ~/torr-shelf
npm start
```

Hoặc dùng `torr-shelf.zip` trực tiếp:

```bash
unzip -o torr-shelf.zip -d ~/torr-shelf
cd ~/torr-shelf
npm test
npm start
```

## Mã nguồn và kiểm thử

Mã nguồn giải nén nằm trong thư mục [`torr-shelf/`](./torr-shelf/). Chạy kiểm thử từ thư mục đó:

```bash
npm test
```
