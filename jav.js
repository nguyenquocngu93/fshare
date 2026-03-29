// Trong kkphim_settings, khi chọn source:
bindEnter(item, function () {
    if (curSrc === key) return; // đã chọn rồi
    saveSettings({ source: key });
    Lampa.Noty.show('Đã chọn ' + src.name);
    
    // Force reload trang chủ khi quay lại
    saveSettings({ _source_changed: Date.now() });
    
    comp.create(); // refresh settings page
});

// Trong kkphim_main, thêm vào start():
this.start = function () {
    // Check nếu source đã thay đổi → reload
    var lastSource = this._loadedSource || '';
    var currentSource = (loadSettings().source || 'ophim');
    
    if (lastSource && lastSource !== currentSource) {
        this.create(); // reload toàn bộ
        return;
    }
    
    applyController(scroll);
    enableNativeScroll(scroll);
};