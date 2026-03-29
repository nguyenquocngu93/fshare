// ============================================
// THÊM VÀO ĐẦU FILE, sau khai báo SETTINGS_KEY
// ============================================

// External Players hỗ trợ
var EXT_PLAYERS = {
    vlc: {
        name: 'VLC',
        icon: '🟠',
        schemes: {
            android: 'vlc://',
            ios: 'vlc-x-callback://x-callback-url/stream?url=',
            web: 'vlc://'
        },
        subtitleParam: function(videoUrl, subUrl) {
            // VLC Android intent
            return 'intent:' + videoUrl + 
                '#Intent;package=org.videolan.vlc;' +
                'type=video/*;' +
                (subUrl ? 'S.subtitles_location=' + encodeURIComponent(subUrl) + ';' : '') +
                'end';
        }
    },
    mx: {
        name: 'MX Player',
        icon: '🔵',
        schemes: {
            android: 'intent:'
        },
        subtitleParam: function(videoUrl, subUrl, title) {
            return 'intent:' + videoUrl + 
                '#Intent;package=com.mxtech.videoplayer.ad;' +
                'type=video/*;' +
                (title ? 'S.title=' + encodeURIComponent(title) + ';' : '') +
                (subUrl ? 'S.subs=' + encodeURIComponent(subUrl) + ';' +
                          'S.subs.name=' + encodeURIComponent('Subtitle') + ';' +
                          'S.subs.enable=' + encodeURIComponent(subUrl) + ';' : '') +
                'end';
        }
    },
    mxpro: {
        name: 'MX Player Pro',
        icon: '🔷',
        schemes: {
            android: 'intent:'
        },
        subtitleParam: function(videoUrl, subUrl, title) {
            return 'intent:' + videoUrl + 
                '#Intent;package=com.mxtech.videoplayer.pro;' +
                'type=video/*;' +
                (title ? 'S.title=' + encodeURIComponent(title) + ';' : '') +
                (subUrl ? 'S.subs=' + encodeURIComponent(subUrl) + ';' +
                          'S.subs.name=' + encodeURIComponent('Subtitle') + ';' +
                          'S.subs.enable=' + encodeURIComponent(subUrl) + ';' : '') +
                'end';
        }
    },
    nplayer: {
        name: 'nPlayer',
        icon: '🟢',
        schemes: {
            ios: 'nplayer-',
            android: 'intent:'
        },
        subtitleParam: function(videoUrl, subUrl) {
            return 'nplayer-' + videoUrl;
        }
    },
    infuse: {
        name: 'Infuse',
        icon: '🟡',
        schemes: {
            ios: 'infuse://x-callback-url/play?url=',
            tvos: 'infuse://x-callback-url/play?url='
        },
        subtitleParam: function(videoUrl, subUrl) {
            var u = 'infuse://x-callback-url/play?url=' + encodeURIComponent(videoUrl);
            if (subUrl) u += '&sub=' + encodeURIComponent(subUrl);
            return u;
        }
    },
    vimu: {
        name: 'Vimu Player',
        icon: '🟣',
        schemes: {
            android: 'intent:'
        },
        subtitleParam: function(videoUrl, subUrl, title) {
            return 'intent:' + videoUrl + 
                '#Intent;package=com.vimu.player;' +
                'type=video/*;' +
                (title ? 'S.title=' + encodeURIComponent(title) + ';' : '') +
                'end';
        }
    },
    justplayer: {
        name: 'Just Player',
        icon: '⚫',
        schemes: {
            android: 'intent:'
        },
        subtitleParam: function(videoUrl, subUrl, title) {
            return 'intent:' + videoUrl + 
                '#Intent;package=com.brouken.player;' +
                'type=video/*;' +
                (title ? 'S.title=' + encodeURIComponent(title) + ';' : '') +
                (subUrl ? 'S.subs=' + encodeURIComponent(subUrl) + ';' : '') +
                'end';
        }
    },
    kodi: {
        name: 'Kodi',
        icon: '🔶',
        schemes: {
            android: 'intent:'
        },
        subtitleParam: function(videoUrl, subUrl, title) {
            return 'intent:' + videoUrl + 
                '#Intent;package=org.xbmc.kodi;' +
                'type=video/*;' +
                'end';
        }
    }
};

function getSelectedPlayer() {
    return loadSettings().ext_player || 'internal';
}

function getPlatform() {
    var ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Apple TV|tvOS/.test(ua)) return 'tvos';
    if (/Tizen/i.test(ua)) return 'tizen';
    if (/Web0S|webOS/i.test(ua)) return 'webos';
    return 'web';
}

// ============================================
// THAY THẾ hàm playWithSubTrack cũ bằng hàm mới
// ============================================

function playWithSubTrack(videoUrl, title, subUrl, subLabel) {
    var playerKey = getSelectedPlayer();
    
    // Nếu chọn internal hoặc không có player ngoài
    if (playerKey === 'internal') {
        playInternal(videoUrl, title, subUrl, subLabel);
        return;
    }
    
    // External player
    playExternal(playerKey, videoUrl, title, subUrl, subLabel);
}

function playInternal(videoUrl, title, subUrl, subLabel) {
    Lampa.Player.play({ title: title, url: videoUrl });
    if (!subUrl) return;

    var attempts = 0;
    var injectSub = setInterval(function () {
        attempts++;
        if (attempts > 40) { clearInterval(injectSub); return; }

        var video = document.querySelector('video');
        if (!video || !video.src) return;

        clearInterval(injectSub);

        Array.from(video.querySelectorAll('track[data-kkphim]')).forEach(function (t) { 
            t.remove(); 
        });

        var track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = subLabel || 'Subtitle';
        track.srclang = 'vi';
        track.src = subUrl;
        track.setAttribute('data-kkphim', '1');
        track.default = true;
        video.appendChild(track);

        track.addEventListener('load', function () {
            try {
                for (var i = 0; i < video.textTracks.length; i++) {
                    video.textTracks[i].mode = 
                        video.textTracks[i].label === (subLabel || 'Subtitle') 
                            ? 'showing' : 'disabled';
                }
            } catch (e) {}
        });

        setTimeout(function () {
            try {
                for (var i = 0; i < video.textTracks.length; i++) {
                    if (video.textTracks[i].label === (subLabel || 'Subtitle')) {
                        video.textTracks[i].mode = 'showing';
                    }
                }
            } catch (e) {}
        }, 800);

        Lampa.Noty.show('📝 ' + (subLabel || 'Subtitle'));
    }, 500);
}

function playExternal(playerKey, videoUrl, title, subUrl, subLabel) {
    var player = EXT_PLAYERS[playerKey];
    if (!player) {
        Lampa.Noty.show('Player không hỗ trợ');
        playInternal(videoUrl, title, subUrl, subLabel);
        return;
    }

    var platform = getPlatform();
    
    try {
        var intentUrl = '';
        
        if (platform === 'android') {
            // Android Intent
            intentUrl = player.subtitleParam(videoUrl, subUrl, title);
            
            // Thử mở bằng intent
            if (intentUrl.indexOf('intent:') === 0) {
                window.location.href = intentUrl;
                Lampa.Noty.show('Đang mở ' + player.name + '...');
            } else {
                window.open(intentUrl, '_blank');
            }
            
        } else if (platform === 'ios' || platform === 'tvos') {
            var scheme = player.schemes[platform] || player.schemes.ios;
            if (scheme) {
                if (player.subtitleParam) {
                    intentUrl = player.subtitleParam(videoUrl, subUrl, title);
                } else {
                    intentUrl = scheme + encodeURIComponent(videoUrl);
                }
                window.location.href = intentUrl;
                Lampa.Noty.show('Đang mở ' + player.name + '...');
            } else {
                Lampa.Noty.show(player.name + ' không hỗ trợ ' + platform);
                playInternal(videoUrl, title, subUrl, subLabel);
            }
            
        } else {
            // Web/TV - thử scheme chung
            var scheme = player.schemes.web || player.schemes.android;
            if (scheme && scheme.indexOf('intent:') !== 0) {
                window.open(scheme + encodeURIComponent(videoUrl), '_blank');
            } else {
                Lampa.Noty.show(player.name + ' không hỗ trợ nền tảng này');
                playInternal(videoUrl, title, subUrl, subLabel);
            }
        }
        
    } catch (e) {
        console.log('[KKPhim] External player error:', e);
        Lampa.Noty.show('Lỗi mở ' + player.name + ': ' + (e.message || ''));
        playInternal(videoUrl, title, subUrl, subLabel);
    }
    
    // Fallback: nếu sau 3 giây không mở được, hỏi dùng internal
    setTimeout(function() {
        if (document.hasFocus && document.hasFocus()) {
            // Vẫn ở trong app = chưa mở được player ngoài
            // Không làm gì, user có thể đã chuyển app
        }
    }, 3000);
}

// Hàm copy link để user tự mở
function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
            return true;
        }
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
    } catch (e) {
        return false;
    }
}