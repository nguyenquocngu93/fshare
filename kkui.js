(function() {
    'use strict';

    function debug() {
        console.log('=== LAMPA DEBUG ===');
        
        // 1. Kiểm tra Lampa
        if (!window.Lampa) {
            console.error('❌ Lampa không tồn tại!');
            return;
        }
        console.log('✅ Lampa tồn tại');

        // 2. Kiểm tra Lang
        if (!Lampa.Lang) {
            console.error('❌ Lampa.Lang không tồn tại!');
            return;
        }
        console.log('✅ Lampa.Lang tồn tại');

        // 3. In ra tất cả methods và properties
        console.log('📋 Lampa.Lang keys:', Object.keys(Lampa.Lang));

        // 4. Thử từng method phổ biến
        var methods = ['translate', 'get', 'say', 'add', 'set', 'init', 'use'];
        methods.forEach(function(m) {
            if (typeof Lampa.Lang[m] === 'function') {
                console.log('✅ Lampa.Lang.' + m + '() tồn tại');
                console.log('   Code:', Lampa.Lang[m].toString().substring(0, 200));
            } else {
                console.log('❌ Lampa.Lang.' + m + ' không có');
            }
        });

        // 5. Xem toàn bộ Lang object
        console.log('📦 Lampa.Lang đầy đủ:', Lampa.Lang);

        // 6. Thử dịch thử
        try {
            var test = Lampa.Lang.translate('Settings');
            console.log('🔤 Dịch "Settings" ra:', test);
        } catch(e) {
            console.error('❌ Lỗi khi dịch:', e);
        }

        console.log('=== END DEBUG ===');
    }

    // Chạy debug
    if (window.Lampa) {
        debug();
    } else {
        var t = setInterval(function() {
            if (window.Lampa && Lampa.Lang) {
                clearInterval(t);
                debug();
            }
        }, 500);
    }

})();