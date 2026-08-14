# TorrShelf 1.6.6 — Stremio meta / hero tune

Bản này **giữ nguyên layout v1.6.5 của bạn**:

- header hiện tại;
- tỷ lệ backdrop `32 / 20.69`;
- vị trí content bắt đầu dưới header;
- hiệu ứng backdrop/logo thu nhỏ và header reveal khi cuộn.

Các thay đổi ở trang movie detail:

1. Dòng metadata: `thời lượng · năm · điểm · IMDb`, cùng nút thích và yêu thích.
2. Backdrop dùng mask + fade nhiều tầng bắt đầu muộn hơn để giữ lại chi tiết backdrop, không tạo đường cắt ngang ở đáy hero.
3. Logo vẫn đi theo toàn bộ hero/nội dung khi trang cuộn. Chỉ khi logo thật chạm header, nó mới fade/merge sang logo nhỏ trên header.
4. Khung bình thường dùng crop giữa `16:11` theo hai vạch đỏ. Khi zoom-out hoàn tất, hero thu về aspect ratio tự nhiên Cinemeta (ảnh full, thường là `16:9`) để backdrop hiển thị đủ 100%, không crop, letterbox, mask hoặc letterbox.

Trong **Library** có hai tab: **Đã thêm** (thư viện đồng bộ) và **Đã thích** (lưu cục bộ). Tab Đã thích có thêm hàng gợi ý **“Vì bạn đã thích …”** từ TMDB.

## Cài trên Termux

Dùng file `install-torr-shelf-v1.6.6-stremio-info-proportions.sh`. Script chỉ ghi đè mã TorrShelf, giữ `.env` và `data/sync.json` hiện có.

```bash
bash install-torr-shelf-v1.6.6-stremio-info-proportions.sh
cd ~/torr-shelf
npm start
```

Hoặc giải nén `torr-shelf.zip`:

```bash
unzip -o torr-shelf.zip -d ~/torr-shelf
cd ~/torr-shelf
npm test
npm start
```

Mã nguồn giải nén nằm trong [`torr-shelf/`](./torr-shelf/).

## Guide chọn mức backdrop

Sau khi cài, mở đường dẫn sau trên máy chạy TorrShelf để xem **đúng ảnh từ Cinemeta/Stremio**, không chỉnh brightness:

```text
http://127.0.0.1:8787/avengers-infinity-war-cinemeta-guide.html
```

Guide vẽ các cặp gạch dọc cho crop ở mức `1.00`, `1.05`, `1.10`, `1.15`; bấm từng mốc hoặc kéo slider rồi gửi lại mốc bạn muốn dùng.

## Layout ngang

Từ `640px` ở chiều ngang, trang detail dùng stage mô phỏng Stremio web: backdrop phủ ngang, poster ở trái, logo/copy nằm trong vùng gradient an toàn, metadata được canh theo cột thông tin và bottom dock được ẩn. Hiệu ứng zoom của điện thoại được tắt ở layout ngang để hero ổn định khi cuộn hoặc xoay màn hình.

Ở landscape, detail được tách hai cột thật: **nội dung/meta/genre ở trái** và **Link phát / Streams ở phải**. Cột links sticky khi cuộn; Cast/Crew/Related nằm hàng dưới cả hai cột.

## Links và chữ giao diện

Ở màn dọc, genre và nguồn được ngăn bằng divider mỏng; tiêu đề `Link phát` chỉ hiện ở landscape. Tab nguồn active tự canh giữa thanh cuộn. Nút ⚙ cạnh tab nguồn mở thẳng **Stremio Addons** trong Settings. Settings được render lại với hệ chữ Inter và cỡ heading/label/body đồng đều.
