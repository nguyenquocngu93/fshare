(function () {
  'use strict';

  var TORRSERVER = 'http://gren439e.tsarea.tv:8880';

  function log() {
    console.log('TORRENT_PLUGIN:', ...arguments);
  }

  function sizeToGB(size) {
    if (!size) return 0;
    size = String(size).toUpperCase().trim();

    if (size.includes('GB')) return parseFloat(size);
    if (size.includes('MB')) return parseFloat(size) / 1024;
    if (size.includes('KB')) return parseFloat(size) / (1024 * 1024);

    return 0;
  }

  function sortBySize(list) {
    return list.sort(function (a, b) {
      return sizeToGB(b.size) - sizeToGB(a.size);
    });
  }

  function searchTorrent(title, year, callback) {
    if (!title) {
      callback([]);
      return;
    }

    // Encode title for URL
    var encodedTitle = encodeURIComponent(title.replace(/[^a-zA-Z0-9\s]/g, ''));
    var url = 'https://torrentio.strem.fun/sort=size%7Cqualityfilter=480p,scr,cam/stream/movie/' +
      encodedTitle + '.json';

    log('Searching:', url);

    fetch(url)
      .then(function(r) {
        if (!r.ok) throw new Error('Network response was not ok');
        return r.json();
      })
      .then(function(data) {
        var torrents = [];

        if (data && data.streams && Array.isArray(data.streams)) {
          data.streams.forEach(function(t) {
            if (t.infoHash) {
              // Extract size from title
              var sizeMatch = t.title.match(/(\d+(?:\.\d+)?)\s*(GB|MB|KB)/i);
              var size = sizeMatch ? sizeMatch[0] : 'Unknown';

              torrents.push({
                title: t.title,
                hash: t.infoHash,
                size: size,
                seeders: t.seeders || 0
              });
            }
          });
        }

        log('Found torrents:', torrents.length);
        callback(sortBySize(torrents));
      })
      .catch(function(error) {
        log('Error searching torrents:', error);
        callback([]);
      });
  }

  function playTorrent(hash) {
    if (!hash) {
      log('Error: Invalid hash');
      return;
    }

    var stream = TORRSERVER + '/stream?link=' + hash + '&index=1&play';

    log('Playing:', stream);

    if (window.Lampa && Lampa.Player) {
      Lampa.Player.play(stream);
    } else {
      log('Error: Lampa.Player not available');
    }
  }

  function openList(list) {
    if (!list || list.length === 0) {
      if (window.Lampa && Lampa.Noty) {
        Lampa.Noty.show('No torrent found');
      }
      return;
    }

    var items = list.map(function(t) {
      return {
        title: t.title + ' (' + t.size + ')',
        subtitle: 'Seeders: ' + t.seeders,
        onSelect: function() {
          playTorrent(t.hash);
        }
      };
    });

    if (window.Lampa && Lampa.Select) {
      Lampa.Select.show({
        title: 'Torrentio',
        items: items
      });
    } else {
      log('Error: Lampa.Select not available');
    }
  }

  function search() {
    if (!window.Lampa || !Lampa.Activity) {
      log('Error: Lampa not ready');
      return;
    }

    var active = Lampa.Activity.active();
    if (!active || !active.card) {
      log('Error: No active card');
      return;
    }

    var card = active.card;
    var title = card.original_title || card.title;
    var year = card.release_date ? card.release_date.split('-')[0] : '';

    if (!title) {
      log('Error: No title found');
      return;
    }

    if (Lampa.Noty) {
      Lampa.Noty.show('Searching torrent...');
    }

    searchTorrent(title, year, function(list) {
      openList(list);
    });
  }

  function addButton() {
    if (!window.Lampa || !Lampa.Listener) {
      log('Error: Lampa.Listener not available');
      return;
    }

    Lampa.Listener.follow('full', function(e) {
      if (e.type !== 'complete') return; // FIXED: was 'complite'

      setTimeout(function() {
        var container = document.querySelector('.full-start__buttons');

        if (!container) return;
        if (document.querySelector('.torrent-btn')) return; // Prevent duplicates

        var btn = document.createElement('div');
        btn.className = 'full-start__button selector torrent-btn';
        btn.innerHTML = '<span>TORRENT</span>';
        btn.onclick = search;

        container.appendChild(btn);
      }, 500);
    });
  }

  function init() {
    log('INIT - Torrent Plugin Loading');

    if (!window.Lampa) {
      log('Error: Lampa not found');
      return;
    }

    addButton();
  }

  // Initialize when app is ready
  if (window.appready) {
    init();
  } else if (window.Lampa && Lampa.Listener) {
    Lampa.Listener.follow('app', init);
  } else {
    log('Error: Cannot initialize - Lampa not available');
  }

})();
