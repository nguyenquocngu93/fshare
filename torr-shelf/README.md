# TorrShelf

Web local để khám phá phim/series qua **TMDB**, tìm torrent từ **Magnetz** và **Knaben**, lọc theo dung lượng/seed rồi gửi một chạm sang TorrServer.

TorrShelf ưu tiên API chính thức cho các nguồn chính:

- TMDB API: <https://developer.themoviedb.org/>
- Magnetz API: <https://magnetz.eu/apis>
- Knaben API v1: <https://knaben.org/api/v1/>
- TorrServer API: `POST /torrents`

Web scraper/open directory thử nghiệm được tách riêng, mặc định tắt và chỉ chạy khi người dùng bật trong Settings. Hiện hỗ trợ **4KHDHub**, **MoviesDrive**, **HDHub4u**, **Vadapav**, **UHDMovies** và **HubCloud Search** với luồng HTTP trực tiếp.

> Chỉ sử dụng với nội dung bạn có quyền tải và chia sẻ.

## Tính năng

- Trang chủ TMDB với ô tìm phim, series, diễn viên và nhà làm phim.
- Nút **Xem thêm** ở từng hàng, trang danh mục dạng grid và phân trang đầy đủ.
- Trang chi tiết có logo phim, backdrop/poster, thể loại, tag, chứng nhận, nội dung, đạo diễn, diễn viên, hãng sản xuất, trailer và thông tin mùa/tập.
- Thể loại, tag, hãng, diễn viên và đạo diễn đều mở page nội bộ; không đẩy người dùng ra website TMDB.
- Profile người có tiểu sử và filmography tách hai tab **Phim lẻ / Phim bộ**, phân trang trong app.
- Phim bộ có season selector và danh sách tập kiểu Netflix; bấm tập tìm `Tên phim S01E03`, bấm mùa tìm `Tên phim Season 1`.
- Metadata, biography và synopsis tập ưu tiên tiếng Việt rồi tự fallback sang tiếng Anh.
- Router dùng History API nên nút Back của Android/Chrome khôi phục đúng phim, season, người hoặc kết quả trước đó.
- UI được viết lại từ stylesheet trắng: header tối giản, dock kính 3 tab, hero cinematic, search nổi và poster rail có metadata overlay.
- Bấm **Tìm bản torrent** để tự tìm bằng tên gốc và năm phát hành.
- Tab **Quản lý** dạng danh sách file đơn giản: kích hoạt, preload, đóng, xóa, mở tab mới hoặc mở player.
- Telemetry live mỗi 2,5 giây: tốc độ tải, peer active/tổng, seed kết nối và tiến độ loaded/preload.
- Player HTML5 nội bộ phát trực tiếp URL `/play/{hash}/{fileId}`; có nút chuyển sang VLC cho MKV/HEVC/DTS.
- TorrServer chỉ còn chạy ẩn như engine preload/cache/HTTP Range.
- Bộ lọc dung lượng hoàn toàn do người dùng chọn và được ghi nhớ; để trống là không giới hạn.
- TMDB token chỉ nằm ở backend, không xuất hiện trong HTML hoặc JSON trả về trình duyệt.
- Native Hybrid gồm Torrentio, Jacred, Knaben và Magnetz.
- Các nguồn HTTP thử nghiệm 4KHDHub, MoviesDrive, HDHub4u, Vadapav, UHDMovies và HubCloud Search có công tắc độc lập trong Settings, mặc định tắt; lỗi từng nguồn được cô lập khỏi provider khác.
- Tìm đồng thời Magnetz + Knaben trong tab torrent thủ công.
- Gộp kết quả trùng theo info-hash.
- Lọc seed tối thiểu, dung lượng tùy chọn và sắp theo seed/ngày/dung lượng; lựa chọn sort được gửi thẳng tới Knaben nên pack nặng không bị mất khỏi trang đầu.
- Knaben luôn bật `hide_unsafe`; có tùy chọn ẩn danh mục XXX.
- Một chạm gửi `magnet`/link Knaben sang TorrServer với `save_to_db: true`.
- Xem thư viện torrent hiện có trong TorrServer.
- Hỗ trợ TorrServer Basic Auth qua biến môi trường.
- Không lưu lịch sử tìm kiếm hoặc magnet vào ổ đĩa.

Lưu ý: thao tác “Gửi TorrServer” thêm torrent vào cơ sở dữ liệu TorrServer. TorrServer chỉ bắt đầu preload dữ liệu video khi bạn mở/phát một file, đúng theo cơ chế stream của TorrServer.

## Cách 1: chạy trực tiếp bằng Node.js

Yêu cầu Node.js 20 trở lên và TorrServer đang chạy tại `127.0.0.1:8090`.

1. Đăng nhập <https://www.themoviedb.org/settings/api> và lấy **API Read Access Token**.
2. Tạo cấu hình:

```bash
cp .env.example .env
# Mở .env và điền:
# TMDB_API_TOKEN=eyJhbGciOiJIUzI1NiJ9...
```

3. Khởi động:

```bash
npm start
```

`server.mjs` tự đọc file `.env`, không cần cài package `dotenv`. Nếu không cấu hình TMDB, tab tìm torrent vẫn hoạt động bình thường.

Mở:

```text
http://127.0.0.1:8787
```

Đổi địa chỉ TorrServer:

```bash
TORRSERVER_URL=http://192.168.1.20:8090 \
TORRSERVER_PUBLIC_URL=http://192.168.1.20:8090 \
npm start
```

Nếu TorrServer bật Basic Auth:

```bash
TORRSERVER_USERNAME=myuser \
TORRSERVER_PASSWORD='strong-password' \
npm start
```

## Chạy trên Android bằng Termux

Nên cài Termux từ F-Droid hoặc GitHub chính thức. Trong Termux:

```bash
pkg update
pkg install nodejs-lts curl unzip nano
termux-setup-storage
```

Nếu kho Termux không có `nodejs-lts`, dùng:

```bash
pkg install nodejs
```

Giả sử bạn tải `torr-shelf.zip` vào thư mục Download:

```bash
cd ~
unzip -o ~/storage/downloads/torr-shelf.zip -d ~/torr-shelf
cd ~/torr-shelf
cp .env.example .env
nano .env   # điền TMDB_API_TOKEN
npm start
```

Mở trên điện thoại:

```text
http://127.0.0.1:8787
```

Kiểm tra Termux có nhìn thấy TorrServer Android trên cùng máy:

```bash
curl http://127.0.0.1:8090/echo
```

Kết quả hợp lệ có dạng `MatriX.142.2`. Nếu báo `Connection refused`, hãy mở app TorrServer, khởi động server và kiểm tra lại cổng `8090`.

Để Android hạn chế giết tiến trình khi tắt màn hình:

```bash
termux-wake-lock
cd ~/torr-shelf
npm start
```

Đồng thời đặt pin của **Termux** và **TorrServer** thành `Unrestricted/Không hạn chế` trong cài đặt Android.

Chạy nền:

```bash
cd ~/torr-shelf
nohup npm start > ~/torr-shelf.log 2>&1 &
```

Dừng tiến trình chạy nền:

```bash
pkill -f 'node server.mjs'
```

Mặc định TorrShelf chỉ mở trên chính điện thoại. Nếu muốn truy cập từ TV/máy tính trong cùng Wi-Fi:

```bash
cd ~/torr-shelf
HOST=0.0.0.0 \
TORRSERVER_URL=http://127.0.0.1:8090 \
TORRSERVER_PUBLIC_URL=http://IP_CUA_DIEN_THOAI:8090 \
npm start
```

Sau đó mở `http://IP_CUA_DIEN_THOAI:8787`. Không port-forward cổng `8787` ra Internet vì TorrShelf chưa có lớp đăng nhập riêng.

## Cách 2: chạy bằng Docker Compose

```bash
cp .env.docker.example .env
# Chỉnh .env nếu cần
docker compose up -d --build
```

Mở <http://127.0.0.1:8787>.

Compose dùng `host.docker.internal` để container gọi TorrServer trên máy host. Dòng `extra_hosts: host-gateway` giúp cấu hình này chạy cả trên Linux.

Dừng tool:

```bash
docker compose down
```

## Cấu hình

| Biến | Mặc định khi chạy Node | Ý nghĩa |
|---|---|---|
| `HOST` | `127.0.0.1` | Địa chỉ TorrShelf lắng nghe |
| `PORT` | `8787` | Cổng web TorrShelf |
| `TMDB_API_TOKEN` | trống | API Read Access Token, khuyên dùng |
| `TMDB_API_KEY` | trống | API Key v3, dùng thay token nếu muốn |
| `TMDB_LANGUAGE` | `vi-VN` | Ngôn ngữ metadata |
| `TMDB_REGION` | `VN` | Khu vực lịch phát hành |
| `DNS_RESULT_ORDER` | `ipv4first` | Ưu tiên IPv4, hữu ích trên Android/Termux |
| `TORRSERVER_URL` | `http://127.0.0.1:8090` | URL backend dùng để gọi TorrServer |
| `TORRSERVER_PUBLIC_URL` | `http://127.0.0.1:8090` | URL mở trong trình duyệt |
| `TORRSERVER_USERNAME` | trống | Username Basic Auth |
| `TORRSERVER_PASSWORD` | trống | Password Basic Auth |

## Kiểm thử

```bash
npm test
```

## Xử lý lỗi

### Termux in `TorrServer: http://host.docker.internal:8090`

Đây là cấu hình Docker, không dùng được khi chạy Node trực tiếp trong Termux. Từ bản `0.2.3`, TorrShelf tự nhận biết runtime không phải Docker và đổi `host.docker.internal` thành `127.0.0.1`. Bạn vẫn nên sửa `.env`:

```env
TORRSERVER_URL=http://127.0.0.1:8090
TORRSERVER_PUBLIC_URL=http://127.0.0.1:8090
```

Kiểm tra trước khi chạy TorrShelf:

```bash
curl http://127.0.0.1:8090/echo
```

### Trang Khám phá yêu cầu TMDB token

Đảm bảo file `.env` nằm cùng cấp với `server.mjs`:

```env
TMDB_API_TOKEN=eyJhbGciOiJIUzI1NiJ9...
TMDB_LANGUAGE=vi-VN
TMDB_REGION=VN
```

Chỉ cần điền **một** trong hai loại credential. Nếu lỡ điền cả hai, từ bản `0.2.4` TorrShelf thử Read Access Token trước và tự fallback sang API Key v3 khi token bị TMDB từ chối. Sau đó dừng và chạy lại `npm start`. Không thêm dấu cách quanh dấu `=`.

### TMDB báo `fetch failed` / `tmdb_unreachable`

Đây là lỗi mạng trước bước xác thực, không phải API key. Bản `0.2.5` mặc định ưu tiên IPv4 trên Android/Termux:

```env
DNS_RESULT_ORDER=ipv4first
```

Kiểm tra kết nối riêng IPv4 và IPv6:

```bash
curl -4 -sS -o /dev/null -w 'IPv4 HTTP %{http_code}\n' https://api.themoviedb.org/3/configuration
curl -6 -sS -o /dev/null -w 'IPv6 HTTP %{http_code}\n' https://api.themoviedb.org/3/configuration
```

HTTP `401` ở lệnh không kèm key là bình thường và chứng minh kết nối mạng hoạt động. Nếu IPv4 cũng không kết nối được, hãy thử đổi Android Private DNS sang `one.one.one.one` hoặc dùng VPN/WARP rồi chạy lại.

### Giao diện báo TorrServer offline

Kiểm tra:

```bash
curl http://127.0.0.1:8090/echo
```

Kết quả hợp lệ có dạng `MatriX.142.2`.

Nếu TorrShelf chạy trong Docker, không đặt `TORRSERVER_URL=http://127.0.0.1:8090`; địa chỉ đó sẽ trỏ vào chính container TorrShelf. Hãy dùng:

```env
TORRSERVER_URL=http://host.docker.internal:8090
```

### Chỉ một nguồn có kết quả

TorrShelf trả kết quả một phần nếu Magnetz hoặc Knaben tạm lỗi. Cảnh báo của nguồn lỗi sẽ xuất hiện phía trên danh sách.

### Bấm gửi nhưng chờ lâu

Magnet chưa có metadata hoặc không có peer có thể khiến TorrServer chờ đến timeout. Thử kết quả có nhiều seed hơn.

## TMDB attribution

Trang Khám phá hiển thị logo TMDB chính thức và thông báo bắt buộc:

> This product uses the TMDB API but is not endorsed or certified by TMDB.

TMDB cho phép API miễn phí cho mục đích phi thương mại khi có attribution. Nếu dùng thương mại, hãy kiểm tra điều khoản và giấy phép TMDB hiện hành.

## Bảo mật

Mặc định app chạy trên loopback và Docker chỉ publish `127.0.0.1:8787`, vì vậy máy khác trong mạng không truy cập được. Nếu đổi `HOST=0.0.0.0` hoặc publish ra LAN/Internet, nên thêm reverse proxy có xác thực. Không commit `.env` chứa TMDB token hoặc mật khẩu TorrServer.


## Ghi chú giao diện 1.6.6

Bản này giữ nguyên header và tỉ lệ backdrop của v1.6.5, đồng thời:

- backdrop dùng mask/fade nhiều tầng muộn hơn để giữ chi tiết ảnh theo video Stremio tham chiếu;
- khi zoom-out hoàn tất, hero dùng đúng aspect ratio tự nhiên của ảnh Cinemeta để ảnh fill đủ 100%, không crop, viền hoặc dark overlay; logo vẫn merge sang header khi chạm vùng header;
- làm lại dòng metadata: thời lượng · năm · điểm · IMDb;
- tách Library thành **Đã thêm** và **Đã thích**, kèm hàng TMDB **Vì bạn đã thích …** cho video đã thích.

### Guide chọn crop Cinemeta

Mở `http://127.0.0.1:8787/avengers-infinity-war-cinemeta-guide.html` để xem backdrop Avengers: Infinity War trực tiếp từ Cinemeta, cùng các gạch dọc crop cho `1.00` đến `1.15`. Guide không áp brightness, filter hoặc overlay lên ảnh.
