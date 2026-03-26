(function() {
    var PLUGIN_NAME = 'Torrentio';
    var STORAGE_KEY = 'torrentio_config_id';

    function getConfigId() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function setConfigId(id) {
        if (id && id !== '') {
            localStorage.setItem(STORAGE_KEY, id);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    function promptForConfig(callback) {
        var current = getConfigId() || '';
        var input = prompt('Nhập Config ID của Torrentio:\n(hoặc dán link chứa ID)\nVí dụ: torrentio_xxx...', current);
        if (input !== null) {
            var id = input.trim();
            // Nếu dán full link, tự trích xuất ID
            var match = id.match(/torrentio\.strem\.fun\/([^\/]+)\/manifest\.json/);
            if (match && match[1]) id = match[1];
            if (id) {
                setConfigId(id);
                alert('Đã lưu Config ID: ' + id);
                if (callback) callback(id);
            } else {
                alert('Config ID không hợp lệ');
                if (callback) callback(null);
            }
        }
    }

    function searchTorrentio(imdbId, type, callback) {
        var configId = getConfigId();
        if (!configId) {
            promptForConfig(function(id) {
                if (id) searchTorrentio(imdbId, type, callback);
                else callback('Chưa cấu hình Torrentio', null);
            });
            return;
        }

        var torrentioType = (type === 'tv') ? 'series' : type;
        var url = 'https://torrentio.strem.fun/' + configId + '/stream/' + torrentioType + '/' + imdbId + '.json';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        var results = [];
                        if (data.streams && Array.isArray(data.streams)) {
                            data.streams.forEach(function(stream) {
                                if (stream.url && stream.url.startsWith('magnet:')) {
                                    var title = stream.title || 'Torrent';
                                    var quality = stream.description || (title.match(/\d{3,4}p/i) || ['HD'])[0];
                                    results.push({
                                        title: title,
                                        torrent: stream.url,
                                        quality: quality,
                                        size: 0
                                    });
                                }
                            });
                        }
                        callback(null, results);
                    } catch(e) {
                        callback('Lỗi parse JSON: ' + e.message, null);
                    }
                } else {
                    callback('Lỗi kết nối Torrentio: ' + xhr.status, null);
                }
            }
        };
        xhr.send();
    }

    var module = {
        name: PLUGIN_NAME,
        host: 'https://torrentio.strem.fun',
        search: function(query, type, callback) {
            if (query && query.startsWith('tt')) {
                searchTorrentio(query, type, callback);
            } else {
                callback(null, []);
            }
        },
        settings: function() {
            promptForConfig(function() {});
        }
    };

    if (typeof exports !== 'undefined') {
        exports.module = module;
    } else {
        window.addSearchModule(module);
    }
})();