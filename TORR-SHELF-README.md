# TorrShelf 1.6.6 — Stremio meta / hero tune

Bản này **giữ nguyên layout v1.6.5 của bạn**:

- header hiện tại;
- tỷ lệ backdrop `32 / 20.69`;
- vị trí content bắt đầu dưới header;
- hiệu ứng backdrop/logo thu nhỏ và header reveal khi cuộn.

Chỉ có ba chỉnh sửa ở trang movie detail:

1. Dòng metadata mới: `thời lượng · năm · điểm · IMDb`, cùng nút thích và yêu thích.
2. Vùng tối của backdrop fade dần từ khoảng 60% ảnh và đen hẳn ở đáy, dựa trên video Stremio `Peter Pan`.
3. Logo nhỏ hơn một chút và hạ từ `40px` xuống `16px` tính từ đáy hero, để nằm đúng vùng fade như Stremio.

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
