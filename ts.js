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
    log('Search function called');

    if (!window.Lampa || !Lampa.Activity) {
      log('Error: Lampa not ready');
      return;
    }

    var active = Lampa.Activity.active();
    if (!active) {
      log('Error: No active activity');
      return;
    }

    var card = active.card || active.data;
    
    if (!card) {
      log('Error: No card/data found');
      log('Active object keys:', Object.keys(active));
      return;
    }

    var title = card.original_title || card.title || card.name;
    var year = card.release_date ? card.release_date.split('-')[0] : 
               card.year ? card.year : '';

    if (!title) {
      log('Error: No title found in card');
      log('Card keys:', Object.keys(card));
      return;
    }

    log('Searching for:', title, year);

    if (Lampa.Noty) {
      Lampa.Noty.show('Searching torrent for: ' + title);
    }

    searchTorrent(title, year, function(list) {
      log('Search callback with', list.length, 'results');
      openList(list);
    });
  }

  function addButton() {
    if (!window.Lampa || !Lampa.Listener) {
      log('Error: Lampa.Listener not available');
      return;
    }

    // Try multiple event types and selectors
    var selectors = [
      '.full-start__buttons',
      '.full__buttons',
      '.buttons-container',
      '[class*="button"]'
    ];

    function injectButton() {
      // Check if button already exists
      if (document.querySelector('.torrent-btn')) {
        log('Button already exists, skipping');
        return;
      }

      // Try to find container with multiple selectors
      var container = null;
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el && el.offsetParent !== null) { // Check if visible
          container = el;
          log('Found container with selector:', selectors[i]);
          break;
        }
      }

      if (!container) {
        log('Warning: No button container found');
        return;
      }

      var btn = document.createElement('div');
      btn.className = 'full-start__button selector torrent-btn';
      btn.innerHTML = '<span>TORRENT</span>';
      btn.style.cursor = 'pointer';
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        search();
      };

      container.appendChild(btn);
      log('Torrent button injected successfully');
    }

    // Listen to multiple events
    var events = ['full', 'complite', 'complete'];
    events.forEach(function(eventName) {
      Lampa.Listener.follow(eventName, function(e) {
        if (e && e.type) {
          log('Event received:', eventName, e.type);
        }
        
        // Retry with multiple timeouts
        setTimeout(injectButton, 300);
        setTimeout(injectButton, 600);
        setTimeout(injectButton, 1000);
      });
    });

    // Also try direct DOM monitoring
    var observer = new MutationObserver(function(mutations) {
      injectButton();
    });

    // Monitor changes in body
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    log('Button listener initialized');
  }

  function init() {
    log('INIT - Torrent Plugin Loading');

    if (!window.Lampa) {
      log('Error: Lampa not found');
      return;
    }

    addButton();
  }

  // Expose functions for debugging
  window.TorrentPlugin = {
    search: search,
    init: init,
    log: log,
    injectButton: addButton,
    status: function() {
      return {
        lampaAvailable: !!window.Lampa,
        lampaActivity: !!(window.Lampa && Lampa.Activity),
        lampaListener: !!(window.Lampa && Lampa.Listener),
        lampaPlayer: !!(window.Lampa && Lampa.Player),
        lampaSelect: !!(window.Lampa && Lampa.Select),
        lampaNoty: !!(window.Lampa && Lampa.Noty),
        buttonExists: !!document.querySelector('.torrent-btn')
      };
    }
  };

  log('TorrentPlugin exposed to window.TorrentPlugin');

  // Initialize when app is ready
  if (window.appready) {
    log('App already ready, initializing...');
    init();
  } else if (window.Lampa && Lampa.Listener) {
    log('Waiting for app ready event...');
    Lampa.Listener.follow('app', function(e) {
      log('App event:', e);
      init();
    });
  } else {
    log('Error: Cannot initialize - Lampa not available yet');
    // Retry after delay
    setTimeout(function() {
      if (window.Lampa && Lampa.Listener) {
        log('Lampa available now, initializing...');
        init();
      }
    }, 2000);
  }

})();
