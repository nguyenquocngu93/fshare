(function () {
    'use strict';

    var vi = {
        // ===== MENU CHÍNH =====
        'Settings': 'Cài đặt',
        'Search': 'Tìm kiếm',
        'Movie': 'Phim lẻ',
        'Serial': 'Phim bộ',
        'Anime': 'Anime',
        'Catalog': 'Danh mục',
        'Bookmarks': 'Yêu thích',
        'History': 'Lịch sử',
        'Timeline': 'Dòng thời gian',
        'Collections': 'Bộ sưu tập',
        'Recomend': 'Đề xuất',
        'Feed': 'Tin tức',

        // ===== THÔNG TIN PHIM =====
        'Watch': 'Xem phim',
        'Trailer': 'Trailer',
        'Similar': 'Phim tương tự',
        'Related': 'Liên quan',
        'Cast': 'Diễn viên',
        'Crew': 'Đoàn làm phim',
        'Director': 'Đạo diễn',
        'Producer': 'Nhà sản xuất',
        'Writer': 'Biên kịch',
        'Genre': 'Thể loại',
        'Year': 'Năm',
        'Rating': 'Đánh giá',
        'Description': 'Mô tả',
        'Season': 'Phần',
        'Episode': 'Tập',
        'Episodes': 'Danh sách tập',
        'Runtime': 'Thời lượng',
        'Country': 'Quốc gia',
        'Budget': 'Kinh phí',
        'Revenue': 'Doanh thu',
        'Tagline': 'Khẩu hiệu',
        'Status': 'Trạng thái',
        'Released': 'Đã phát hành',
        'In production': 'Đang sản xuất',
        'Ended': 'Đã kết thúc',
        'Returning Series': 'Đang tiếp tục',
        'Canceled': 'Đã hủy',
        'Planned': 'Đang lên kế hoạch',

        // ===== PLAYER =====
        'Play': 'Phát',
        'Pause': 'Tạm dừng',
        'Stop': 'Dừng',
        'Quality': 'Chất lượng',
        'Subtitle': 'Phụ đề',
        'Subtitles': 'Phụ đề',
        'Audio': 'Âm thanh',
        'Speed': 'Tốc độ',
        'Next episode': 'Tập tiếp theo',
        'Prev episode': 'Tập trước',
        'Next': 'Tiếp theo',
        'Prev': 'Trước',
        'No subtitles': 'Không có phụ đề',
        'No audio': 'Không có âm thanh',
        'Select source': 'Chọn nguồn phim',
        'Failed to play': 'Không thể phát',
        'Retry': 'Thử lại',
        'Continue watching': 'Xem tiếp',
        'Start over': 'Xem lại từ đầu',
        'Watched': 'Đã xem',
        'Watch later': 'Xem sau',
        'Mark as watched': 'Đánh dấu đã xem',

        // ===== CÀI ĐẶT =====
        'Interface': 'Giao diện',
        'Language': 'Ngôn ngữ',
        'Theme': 'Chủ đề',
        'Background': 'Hình nền',
        'Parser': 'Nguồn phim',
        'Plugins': 'Plugin',
        'Network': 'Mạng',
        'Accounts': 'Tài khoản',
        'About': 'Thông tin',
        'Advanced': 'Nâng cao',
        'General': 'Chung',
        'Video': 'Video',
        'Appearance': 'Giao diện',
        'Notify': 'Thông báo',
        'Cache': 'Bộ nhớ đệm',
        'Clear cache': 'Xóa bộ nhớ đệm',
        'Reset': 'Đặt lại',
        'Reset settings': 'Đặt lại cài đặt',

        // ===== THÔNG BÁO / TRẠNG THÁI =====
        'Loading...': 'Đang tải...',
        'Loading': 'Đang tải',
        'Not found': 'Không tìm thấy',
        'Error': 'Lỗi',
        'Success': 'Thành công',
        'Save': 'Lưu',
        'Cancel': 'Hủy',
        'Close': 'Đóng',
        'Back': 'Quay lại',
        'Yes': 'Có',
        'No': 'Không',
        'OK': 'Đồng ý',
        'Clear': 'Xóa sạch',
        'Delete': 'Xóa',
        'Add': 'Thêm',
        'Edit': 'Chỉnh sửa',
        'Update': 'Cập nhật',
        'Refresh': 'Làm mới',
        'Apply': 'Áp dụng',
        'Confirm': 'Xác nhận',
        'Done': 'Xong',
        'Empty': 'Trống',
        'More': 'Xem thêm',
        'Less': 'Thu gọn',
        'Show': 'Hiển thị',
        'Hide': 'Ẩn',
        'Enable': 'Bật',
        'Disable': 'Tắt',
        'On': 'Bật',
        'Off': 'Tắt',
        'Auto': 'Tự động',
        'Default': 'Mặc định',
        'Custom': 'Tùy chỉnh',
        'None': 'Không có',
        'All': 'Tất cả',
        'Select': 'Chọn',
        'Selected': 'Đã chọn',
        'Installed': 'Đã cài đặt',
        'Install': 'Cài đặt',
        'Uninstall': 'Gỡ cài đặt',

        // ===== BOOKMARK / YÊU THÍCH =====
        'Add to bookmarks': 'Thêm vào yêu thích',
        'Remove from bookmarks': 'Xóa khỏi yêu thích',
        'Bookmarks is empty': 'Chưa có phim yêu thích',
        'History is empty': 'Chưa có lịch sử xem',
        'Add to collection': 'Thêm vào bộ sưu tập',
        'Remove from collection': 'Xóa khỏi bộ sưu tập',
        'Create collection': 'Tạo bộ sưu tập',
        'Collection name': 'Tên bộ sưu tập',

        // ===== TÌM KIẾM =====
        'Enter search query': 'Nhập từ khóa tìm kiếm',
        'Search results': 'Kết quả tìm kiếm',
        'Nothing found': 'Không tìm thấy kết quả',
        'Search history': 'Lịch sử tìm kiếm',
        'Clear history': 'Xóa lịch sử',
        'Popular queries': 'Từ khóa phổ biến',

        // ===== LỌC / SẮP XẾP =====
        'Filter': 'Lọc',
        'Sort': 'Sắp xếp',
        'By rating': 'Theo đánh giá',
        'By year': 'Theo năm',
        'By name': 'Theo tên',
        'Popular': 'Phổ biến',
        'New': 'Mới nhất',
        'Top': 'Hàng đầu',
        'Upcoming': 'Sắp chiếu',
        'Now playing': 'Đang chiếu',
        'Airing today': 'Chiếu hôm nay',
        'On the air': 'Đang phát sóng',

        // ===== THỂ LOẠI =====
        'Action': 'Hành động',
        'Comedy': 'Hài hước',
        'Drama': 'Tâm lý',
        'Horror': 'Kinh dị',
        'Romance': 'Lãng mạn',
        'Thriller': 'Ly kỳ',
        'Fantasy': 'Thần thoại',
        'Science Fiction': 'Khoa học viễn tưởng',
        'Animation': 'Hoạt hình',
        'Documentary': 'Tài liệu',
        'Adventure': 'Phiêu lưu',
        'Crime': 'Tội phạm',
        'Family': 'Gia đình',
        'Mystery': 'Bí ẩn',
        'Biography': 'Tiểu sử',
        'Music': 'Âm nhạc',
        'Sport': 'Thể thao',
        'War': 'Chiến tranh',
        'Western': 'Cao bồi',
        'Sci-Fi': 'Khoa học viễn tưởng',
        'Kids': 'Thiếu nhi',
        'News': 'Tin tức',
        'Reality': 'Thực tế',
        'Soap': 'Phim dài tập',
        'Talk': 'Trò chuyện',

        // ===== TÀI KHOẢN =====
        'Login': 'Đăng nhập',
        'Logout': 'Đăng xuất',
        'Register': 'Đăng ký',
        'Username': 'Tên người dùng',
        'Password': 'Mật khẩu',
        'Email': 'Email',
        'Profile': 'Hồ sơ',
        'Account': 'Tài khoản',
        'Sync': 'Đồng bộ',
        'Syncing...': 'Đang đồng bộ...',
        'Synced': 'Đã đồng bộ',

        // ===== PLUGIN =====
        'Plugin url': 'Địa chỉ plugin',
        'Add plugin': 'Thêm plugin',
        'Plugin added': 'Đã thêm plugin',
        'Plugin removed': 'Đã xóa plugin',
        'Plugin error': 'Lỗi plugin',
        'No plugins': 'Chưa có plugin',
        'Plugin list': 'Danh sách plugin',

        // ===== MẠNG =====
        'Proxy': 'Proxy',
        'Proxy url': 'Địa chỉ proxy',
        'No connection': 'Không có kết nối mạng',
        'Connection error': 'Lỗi kết nối',
        'Timeout': 'Hết thời gian chờ',
        'Server error': 'Lỗi máy chủ',

        // ===== THỜI GIAN =====
        'Today': 'Hôm nay',
        'Yesterday': 'Hôm qua',
        'minutes': 'phút',
        'hours': 'giờ',
        'days': 'ngày',
        'weeks': 'tuần',
        'months': 'tháng',
        'years': 'năm',
        'ago': 'trước',
        'min': 'ph',
        'h': 'g',

        // ===== KHÁC =====
        'Share': 'Chia sẻ',
        'Copy link': 'Sao chép liên kết',
        'Open in browser': 'Mở trong trình duyệt',
        'Report': 'Báo lỗi',
        'Version': 'Phiên bản',
        'Author': 'Tác giả',
        'Website': 'Trang web',
        'Donate': 'Ủng hộ',
        'Support': 'Hỗ trợ',
        'Feedback': 'Phản hồi',
        'Rate': 'Đánh giá',
        'Stars': 'Sao',
        'Views': 'Lượt xem',
        'Downloads': 'Lượt tải',
        'Size': 'Kích thước',
        'Format': 'Định dạng',
        'Resolution': 'Độ phân giải',
        'Bitrate': 'Tốc độ bit',
        'Frame rate': 'Tốc độ khung hình',
        'Codec': 'Codec',
        'Container': 'Định dạng',
        'Channels': 'Kênh',
        'Sample rate': 'Tần số mẫu',
    };

    // ================================================
    //  HÀM DỊCH CHÍNH
    // ================================================
    function applyVietnamese() {
        if (!window.Lampa || !Lampa.Lang) {
            console.warn('[VI] Lampa.Lang chưa sẵn sàng, thử lại...');
            return false;
        }

        try {
            // Lưu hàm dịch gốc
            var originalTranslate = Lampa.Lang.translate.bind(Lampa.Lang);

            // Ghi đè hàm dịch
            Lampa.Lang.translate = function (key) {
                // Ưu tiên bản dịch tiếng Việt
                if (vi[key]) return vi[key];

                // Fallback về hàm gốc
                return originalTranslate(key);
            };

            // Thêm ngôn ngữ vào Lampa nếu có hàm add
            if (typeof Lampa.Lang.add === 'function') {
                Lampa.Lang.add({ vi: vi });
            }

            console.log('%c[VI Plugin] ✅ Việt hóa thành công!', 'color: #4CAF50; font-weight: bold;');
            return true;

        } catch (err) {
            console.error('[VI Plugin] ❌ Lỗi:', err);
            return false;
        }
    }

    // ================================================
    //  KHỞI ĐỘNG PLUGIN
    // ================================================
    function init() {
        // Thử áp dụng ngay
        if (applyVietnamese()) return;

        // Nếu chưa được, chờ Lampa sẵn sàng
        var attempts = 0;
        var maxAttempts = 20; // Tối đa 10 giây

        var timer = setInterval(function () {
            attempts++;

            if (applyVietnamese()) {
                clearInterval(timer);
                return;
            }

            if (attempts >= maxAttempts) {
                clearInterval(timer);
                console.error('[VI Plugin] ❌ Không thể kết nối Lampa sau ' + maxAttempts + ' lần thử!');
            }
        }, 500);
    }

    // ================================================
    //  CHẠY KHI DOM SẴN SÀNG
    // ================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();