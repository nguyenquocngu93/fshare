# 👑 Video 4 — "Vị vua bắt tay với một cái cây"
### Series VUA KỲ LẠ — Tập 2

## 1. File

**Link tải trực tiếp:**
```
https://github.com/nguyenquocngu93/fshare/raw/arena/019fb736-fshare/vua2_caycoi_YOUTUBE.mp4
```

| File | Dùng để |
|---|---|
| **`vua2_caycoi_YOUTUBE.mp4`** | ⭐ Upload (16MB) |
| `thumbnail_vua2.jpg` | Thumbnail |
| `vua2/` | Nguồn: 7 ảnh, 7 giọng đọc, phụ đề, script |

**Thông số:** 1080×1920 · **39 giây** · 30fps · -14.1 LUFS · có nhạc nền

---

## 2. ⭐ Thay đổi so với tập 1

**Rút từ 48s → 39s** (giảm 19%)

Lý do: watch time cho thấy tỉ lệ xem hết của clip trước khoảng **28%** (13.6s / 48s). Clip ngắn hơn → tỉ lệ xem hết cao hơn → thuật toán đẩy mạnh hơn.

Cách rút: tăng tốc giọng đọc lên **1.26x** (tập 1 là 1.13x) thay vì cắt bớt nội dung. Vẫn giữ đủ 3 chi tiết hay.

**Đây là phép thử:** nếu view/giờ của tập 2 cao hơn tập 1 → xác nhận nên giữ ~38-40s cho các tập sau.

---

## 3. Copy-paste khi upload

### Tiêu đề
```
Vị vua BẮT TAY với một cái cây 🌳👑 #shorts
```

### Mô tả
```
George III của Anh trị vì gần 60 năm — một trong những vị vua tại vị lâu nhất lịch sử Anh. Nhưng năm 1788, ông bắt đầu cư xử vô cùng kỳ lạ.

🥩 Người hầu bắt gặp vua đang trồng một miếng bít tết xuống đất, tin rằng nó sẽ mọc lên thành "cây thịt bò".

🌳 Rồi trong khuôn viên lâu đài Windsor, ông bước tới một cây sồi, nắm lấy cành và bắt tay thật trịnh trọng — vì tưởng đó là vua Frederick Đại Đế của Phổ.

Trớ trêu thay, vị vua kia đã qua đời từ 2 năm trước đó.

Ngày nay các nhà khoa học cho rằng ông mắc rối loạn lưỡng cực, hoặc bị nhiễm độc thạch tín từ chính thuốc chữa bệnh thời đó.

Tập 2 của series VUA KỲ LẠ TRONG LỊCH SỬ 👑

#shorts #lichsu #bancobiet #vua #kienthuc #chuyenla #georgeiii #thuvi
```

### Tags
```
vua kỳ lạ, George III, vua điên, vua Anh, lịch sử châu Âu, chuyện lạ lịch sử, bạn có biết, kiến thức, vua bắt tay cây, lich su, shorts
```

### Hashtag
```
#shorts #lichsu #bancobiet
```

---

## 4. ⭐ Comment ghim

```
Tập 2 series VUA KỲ LẠ 👑 Bạn đoán tập 3 là vị vua nào? (Gợi ý: có người phong con NGỰA làm quan 🐴)
```

> Câu này vừa nhắc series, vừa **spoil nhẹ tập sau** để người ta tò mò quay lại. Comment là tín hiệu mạnh nhất với Shorts.

---

## 5. Nhật ký số liệu

| Clip | Dài | View | Like | %Like | Sub |
|---|---|---|---|---|---|
| 🐝 Ong | 55s | 1.4K | 27 | 1.9% | 2 |
| 🦟 Muỗi | 46s | 1.4K | 15 | 1.1% | 0 |
| 👑 Vua 1 | 48s | 1.0K | 25 | 2.4% | **+4** |
| 👑 Vua 2 | **39s** | ? | ? | ? | ? |

**Điều đã học được:**
- ✅ Chủ đề **không đoán được đáp án** → tỉ lệ like cao (vua > ong > muỗi)
- ✅ **CTA cuối clip** → sub tăng gấp 3
- ✅ Đừng đánh giá Short trước 24h (clip muỗi tưởng flop, cuối cùng vẫn 1.4K)
- ⏳ Đang thử: clip ngắn hơn có tăng view không?

---

## 6. Kho chủ đề tập sau

| Tập | Nhân vật | Điểm hấp dẫn |
|---|---|---|
| 3 | **Caligula** | Phong con ngựa Incitatus làm quan chấp chính |
| 4 | **Ludwig II của Bavaria** | Xây lâu đài cổ tích tới phá sản, chết bí ẩn |
| 5 | **Nữ hoàng Juana Điên** | Mang quan tài chồng đi khắp Tây Ban Nha |
| 6 | **Ferdinand I của Áo** | "Ta là hoàng đế, ta muốn ăn bánh bao!" |
| 7 | **Vua Lê Long Đĩnh** | Vua Việt — "Ngọa Triều", nằm mà thiết triều |

---

## 7. Dựng lại

```bash
pip install --break-system-packages imageio-ffmpeg pillow numpy
cd vua2
python3 music.py    # tạo bgm.wav
python3 build.py
```

**Chỉnh nhanh trong `build.py`:**
| Muốn | Sửa |
|---|---|
| Video ngắn/dài hơn | `TEMPO=1.26` (tăng = ngắn hơn) |
| Nhạc to/nhỏ | `volume=0.20` |
| Cỡ chữ | `subs.ass` → `Fontsize,100` |
| Vị trí chữ | `subs.ass` → `MarginV,470` |

⚠️ **Lưu ý khi tạo ảnh mới:** tránh ảnh có khung tranh (frame) hoặc vùng sáng ở 1/3 dưới — phụ đề sẽ khó đọc. Thêm "no frame, dark shadows in lower third" vào prompt.
