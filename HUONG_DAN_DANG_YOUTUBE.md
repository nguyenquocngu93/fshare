# 📤 Hướng dẫn xem & đăng video lên YouTube

## 1. File cần lấy

| File | Dùng để làm gì |
|---|---|
| **`ong_chet_YOUTUBE.mp4`** | ⭐ **File chính để upload** (đã chuẩn âm lượng YouTube) |
| `vi_sao_ong_chet.mp4` | Bản gốc trước khi normalize âm thanh |
| `thumbnail_short.jpg` | Ảnh thumbnail (tùy chọn, Shorts thường tự lấy frame) |
| `bee/` | File nguồn: ảnh, giọng đọc, phụ đề `.ass`, script dựng |

**Thông số bản final:**
- 1080×1920 (9:16 dọc) · 55 giây · 30fps
- Video H.264 High profile · Audio AAC 48kHz stereo
- Âm lượng chuẩn **-14 LUFS / -1.5 dBTP** (đúng chuẩn YouTube, không bị YouTube tự hạ volume)
- `+faststart` → phát được ngay khi vừa tải, không cần chờ

---

## 2. Cách TẢI file về máy

**Cách A — từ trình xem file của Arena (dễ nhất)**
Bấm vào file `ong_chet_YOUTUBE.mp4` trong danh sách file → nút **Download / tải xuống**.

**Cách B — từ GitHub**
Nếu đã push lên branch: vào repo → mở file → bấm **Download raw file**.
⚠️ Lưu ý: file 19MB, GitHub không preview video được, phải tải về mới xem.

**Cách C — xem thử ngay không cần tải**
Trình xem file trong Arena phát trực tiếp được MP4, bấm play là xem.

---

## 3. Đăng lên YouTube (dạng Shorts)

### Trên điện thoại (khuyên dùng — dễ nhất)
1. Tải file `.mp4` về điện thoại
2. Mở app **YouTube** → bấm nút **➕** giữa màn hình → chọn **Create a Short**
3. Bấm biểu tượng **thư viện/gallery** ở góc dưới bên trái → chọn video vừa tải
4. Vì video **dài 55s < 60s** và **tỉ lệ 9:16** → YouTube tự nhận là **Shorts** ✅
5. Bấm **Next** → điền tiêu đề → **Upload Short**

### Trên máy tính
1. Vào https://studio.youtube.com
2. Bấm **CREATE (Tạo)** góc trên phải → **Upload videos**
3. Kéo thả file `ong_chet_YOUTUBE.mp4` vào
4. Điền tiêu đề + mô tả (xem gợi ý bên dưới)
5. Ở mục **Audience**: chọn **"No, it's not made for kids"**
6. Bấm **Next** 3 lần → **Public** → **Publish**

> 💡 YouTube tự động phân loại thành **Shorts** khi video ≤ 3 phút VÀ khung hình dọc/vuông. Video này thỏa cả 2 nên chắc chắn vào Shorts feed.

---

## 4. Nội dung gợi ý khi upload (copy-paste được)

### Tiêu đề
```
Vì sao ONG CHẾT sau khi chích người? 🐝 #shorts
```

### Mô tả
```
Ngòi của ong mật có hàng chục chiếc ngạnh nhỏ quay ngược về sau — giống hệt một lưỡi câu.

Khi chích côn trùng khác, lớp vỏ mỏng nên ong rút ngòi ra dễ dàng. Nhưng da người dày và đàn hồi, khiến ngạnh cắm chặt không thể rút ra. Ong càng cố bay đi thì ngòi càng mắc kẹt và bị đứt lìa khỏi cơ thể.

Vết thương quá lớn khiến ong không thể sống sót sau vài phút.

Điều thú vị: chỉ ong mật thợ mới chịu số phận này. Ong vò vẽ và ong bắp cày có ngòi trơn nhẵn nên chích được nhiều lần mà không hề hấn gì.

Nói cách khác, chích người chính là hành động hy sinh của con ong để bảo vệ cả tổ.

#shorts #kienthuc #dongvat #ong #khoahoc #banCoBiet #sinhhoc #thuvi
```

### Tags
```
ong mật, vì sao ong chết, ngòi ong, kiến thức thú vị, khoa học, động vật, bạn có biết, sinh học, shorts
```

---

## 5. Muốn sửa lại video?

Toàn bộ nguồn nằm trong thư mục `bee/`:
- `p1.jpg` … `p7.jpg` — 7 ảnh nền
- `a1.mp3` … `a7.mp3` — 7 đoạn giọng đọc
- `subs.ass` — phụ đề (sửa chữ, cỡ chữ, màu ở đây)
- `build.py` — script dựng lại toàn bộ

Chạy lại: `python3 bee/build.py`

Hoặc cứ nhắn mình, mình sửa cho 😄
