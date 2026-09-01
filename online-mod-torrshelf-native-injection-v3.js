/* TORRSHELF_HTTP_ONLINE_MOD_NATIVE_V3 */
function torrshelf_http(component, _object) {
  var network = new Lampa.Reguest();
  var object = _object;
  var extract = [];
  var select_title = '';
  var choice = { season: 0, voice: 0, voice_name: '', voice_id: 0 };
  var filter_items = { season: [], voice: [] };

  function movieParams() {
    var movie = object.movie || {};
    var date = movie.release_date || movie.first_air_date || movie.date || '';
    var year = String(movie.year || date).match(/\b(?:19|20)\d{2}\b/);
    var isTv = movie.type === 'tv' || movie.media_type === 'tv' || Boolean(movie.name || movie.original_name || movie.first_air_date);
    return {
      title: movie.original_title || movie.title || movie.original_name || movie.name || '',
      year: year ? year[0] : '',
      type: isTv ? 'tv' : 'movie',
      season: Number(movie.season || movie.season_number || 0),
      episode: Number(movie.episode || movie.episode_number || 0),
      imdb: movie.imdb_id || movie.imdb || '',
      max: 12
    };
  }

  function apiUrl() {
    var params = movieParams();
    return 'http://127.0.0.1:8787/api/lampa/streams?' + Object.keys(params).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
  }

  function streamQuality(stream) {
    var match = String(stream.title || stream.name || '').match(/\b(2160|1440|1080|720|576|480|360)p\b/i);
    return match ? match[1] + 'p' : 'Auto';
  }

  function toItems(streams) {
    var known = {};
    return (streams || []).filter(function (stream) {
      if (!stream || !stream.url || known[stream.url]) return false;
      known[stream.url] = true;
      return true;
    }).map(function (stream) {
      var provider = stream.provider || stream.name || 'TorrShelf HTTP';
      return {
        title: provider,
        orig_title: provider,
        info: String(stream.title || provider).replace(/\n+/g, ' · '),
        quality: streamQuality(stream),
        stream: stream.url,
        headers: stream.headers || {},
        source_title: provider
      };
    });
  }

  function filter() {
    filter_items = { season: [], voice: [] };
    component.filter(filter_items, choice);
  }

  function append(items) {
    component.reset();
    var viewed = Lampa.Storage.cache('online_view', 5000, []);
    items.forEach(function (element) {
      var movie = object.movie || {};
      var key = Lampa.Utils.hash([
        movie.id || movie.imdb_id || movie.original_title || movie.original_name || movie.title || movie.name,
        'torrshelf_http',
        element.source_title,
        element.quality
      ].join('|'));
      var view = Lampa.Timeline.view(key);
      var item = Lampa.Template.get('online_mod', element);
      element.timeline = view;
      item.append(Lampa.Timeline.render(view));
      if (Lampa.Timeline.details) item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
      if (viewed.indexOf(key) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');

      function qualityMap() {
        var map = {};
        map[element.quality] = element.stream;
        return map;
      }

      item.on('hover:enter', function () {
        if (movie.id) Lampa.Favorite.add('history', movie, 100);
        var map = qualityMap();
        var first = {
          url: component.getDefaultQuality(map, element.stream),
          quality: component.renameQualityMap(map),
          headers: element.headers,
          timeline: element.timeline,
          title: select_title + ' / ' + element.source_title + ' ' + element.quality,
          isonline: true
        };
        Lampa.Player.play(first);
        Lampa.Player.playlist([first]);
        if (viewed.indexOf(key) === -1) {
          viewed.push(key);
          item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          Lampa.Storage.set('online_view', viewed);
        }
      });

      component.append(item);
      component.contextmenu({
        item: item,
        view: view,
        viewed: viewed,
        hash_file: key,
        element: element,
        file: function (call) {
          call({ file: element.stream, quality: qualityMap() });
        }
      });
    });
    component.loading(false);
    component.start(true);
  }

  this.search = function (_object) {
    object = _object || object;
    select_title = object.search || (object.movie && (object.movie.title || object.movie.name || object.movie.original_title || object.movie.original_name)) || 'TorrShelf HTTP';
    if (!movieParams().title) {
      component.emptyForQuery(select_title);
      return;
    }
    component.loading(true);
    network.clear();
    network.timeout(90000);
    network.silent(apiUrl(), function (data) {
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (error) { data = {}; }
      }
      extract = toItems(data && data.streams);
      if (!extract.length) {
        component.emptyForQuery(select_title);
        return;
      }
      filter();
      append(extract);
    }, function () {
      component.emptyForQuery(select_title);
    });
  };

  this.extendChoice = function (saved) {
    Lampa.Arrays.extend(choice, saved || {}, true);
  };

  this.reset = function () {
    choice = { season: 0, voice: 0, voice_name: '', voice_id: 0 };
    filter();
    append(extract);
    component.saveChoice(choice);
  };

  this.filter = function (type, a, b) {
    if (a && a.stype && b) choice[a.stype] = b.index;
    filter();
    append(extract);
    component.saveChoice(choice);
  };

  this.destroy = function () {
    network.clear();
    extract = [];
  };
}
