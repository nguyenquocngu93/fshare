(function () {
  'use strict';
  if (window.plugin_kkphim_parser_ready) return;
  window.plugin_kkphim_parser_ready = true;

  var SOURCES = {
    kkphim: { name: 'KKPhim', api: 'https://phimapi.com/' },
    ophim: { name: 'OPhim', api: 'https://ophim1.com/' }
  };

  var TORRENTIO_BASE = 'https://torrentio.strem.fun';
  var TMDB_API_KEY = '4ef0d7355d9ffb5151e987764708ce96';
  var STG_PREFIX = 'kkparser_';
  var KNABEN_BASE_URL = 'https://knaben.org/search/';
  var MAGNETZ_BASE_URL = 'https://magnetz.eu/search';

  /* ---- STORAGE ---- */
  function getSetting(key) { return Lampa.Storage.get(STG_PREFIX + key, ''); }
  function setSetting(key, val) { Lampa.Storage.set(STG_PREFIX + key, val); }
  function getTsUrl() {
    var url = getSetting('torrserver_url') || '';
    if (!url) return null;
    url = url.replace(/\/$/, '');
    if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
    return url;
  }
  function getTsPass() { return getSetting('torrserver_pass') || ''; }
  function getTioConfig() { return parseTioConfig(getSetting('torrentio_config') || ''); }
  function getJacredUrl() {
    var url = getSetting('jacred_url') || '';
    if (!url) return '';
    url = url.replace(/\/$/, '');
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    return url;
  }

  function parseTioConfig(raw) {
    if (!raw) return '';
    raw = String(raw).trim();
    var m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);
    if (m) return m[1];
    m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);
    if (m) return m[1];
    if (raw.indexOf('torrentio.strem.fun') > -1) {
      raw = raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i, '')
        .replace(/\/(manifest\.json|stream\/.*)?$/i, '')
        .replace(/^\/+|\/+$/g, '');
      return (raw.indexOf('=') > -1) ? raw.replace(/\|/g, '%7C') : '';
    }
    raw = raw.replace(/^\/+|\/+$/g, '').replace(/\|/g, '%7C');
    return raw.indexOf('=') === -1 ? '' : raw;
  }

  /* ---- HELPERS ---- */
  function normalizeStr(s) {
    return String(s || '').toLowerCase().trim()
      .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '')
      .replace(/\s+/g, ' ');
  }
  function padZero(n) { return (n < 10 ? '0' : '') + n; }
  function makeMagnet(hash, name) {
    return 'magnet:?xt=urn:btih:' + hash.toLowerCase() +
      '&dn=' + encodeURIComponent(name || '') +
      '&tr=' + encodeURIComponent('udp://tracker.opentrackr.org:1337/announce') +
      '&tr=' + encodeURIComponent('udp://open.stealth.si:80/announce') +
      '&tr=' + encodeURIComponent('udp://tracker.torrent.eu.org:451/announce') +
      '&tr=' + encodeURIComponent('udp://tracker.tiny-vps.com:6969/announce') +
      '&tr=' + encodeURIComponent('udp://exodus.desync.com:6969/announce');
  }

  function parseSize(str) {
    if (!str) return 0;
    var m = String(str).match(/([\d.,]+)\s*(TB|GB|MB|KB|B)/i);
    if (!m) return 0;
    var n = parseFloat(m[1].replace(',', '.'));
    switch (m[2].toUpperCase()) {
      case 'TB': return n * 1e12;
      case 'GB': return n * 1e9;
      case 'MB': return n * 1e6;
      case 'KB': return n * 1e3;
    }
    return n;
  }

  function fmtBytes(b) {
    b = parseInt(b) || 0;
    if (b >= 1e12) return (b / 1e12).toFixed(2) + ' TB';
    if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB';
    if (b >= 1e6) return (b / 1e6).toFixed(0) + ' MB';
    if (b >= 1e3) return (b / 1e3).toFixed(0) + ' KB';
    return b + ' B';
  }

  function getQuality(title) {
    var m = (title || '').match(/\b(2160p|4K|UHD|1080p|1080i|720p|480p|BluRay|BDRip|BRRip|WEB-?DL|WEBRip|HDRip|REMUX|HDTV|DVDRip)\b/i);
    return m ? m[1].toUpperCase() : '';
  }

  function getMediaType(card) {
    if (card.number_of_seasons || card.first_air_date || card.type === 'tv' || card.type === 'series') return 'series';
    return 'movie';
  }

  function getImdbId(card) {
    var id = card.imdb_id || (card.ids && card.ids.imdb) || (card.external_ids && card.external_ids.imdb_id) || '';
    if (id && !/^tt/i.test(String(id))) id = 'tt' + id;
    return id || null;
  }

  function reguest(url, onOk, onFail) {
    var net = new Lampa.Reguest();
    net.timeout(20000);
    net.silent(url,
      function (data) { onOk(data); },
      function (a, b) {
        var code = (a && a.status) ? a.status : 0;
        (onFail || function () {})(code ? 'HTTP ' + code : (b || 'Error'));
      }
    );
  }

  /* ============================================================
     NORMALIZE TORRENT RESULT
     ============================================================ */
  function normResult(obj) {
    var hash = (obj.hash || '').toLowerCase().replace(/^urn:btih:/i, '').replace(/[^a-f0-9]/g, '');
    if (hash.length !== 40 && hash.length !== 32) return null;
    if (!obj.title || !String(obj.title).trim()) return null;
    var sizeNum = parseInt(obj.sizeNum) || parseSize(obj.size || '');
    return {
      title: String(obj.title).trim(),
      seeds: parseInt(obj.seeds) || 0,
      peers: parseInt(obj.peers) || 0,
      size: obj.size || (sizeNum ? fmtBytes(sizeNum) : ''),
      sizeNum: sizeNum,
      tracker: obj.tracker || '?',
      quality: getQuality(obj.title),
      hash: hash,
      magnet: obj.magnet || makeMagnet(hash, obj.title)
    };
  }

  /* ============================================================
     PLAY HELPER
     ============================================================ */
  function doPlay(params) {
    var card = params.card || {};
    var url = params.url || '';
    var title = params.title || card.title || card.name || '';
    var episode = params.episode || null;
    if (!url) { Lampa.Noty.show('Không có link phát'); return; }
    var obj = { title: title, url: url, poster: card.poster || card.img || '', movie: card };
    if (episode) { obj.season = episode.season; obj.episode = episode.episode; }
    Lampa.Player.play(obj);
    try { if (Lampa.Timeline && Lampa.Timeline.update) Lampa.Timeline.update(card, { percent: 0 }); } catch(e) {}
    try { if (Lampa.Favorite && Lampa.Favorite.add) Lampa.Favorite.add('history', Object.assign({}, card)); } catch(e) {}
  }

  /* ============================================================
     TORRSERVER
     ============================================================ */
  function tsHeaders() {
    var h = { 'Content-Type': 'application/json' };
    var p = getTsPass();
    if (p) h['Authorization'] = 'Basic ' + btoa('admin:' + p);
    return h;
  }

  function tsAdd(magnet, title, onDone, onFail) {
    var tsUrl = getTsUrl();
    if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
    $.ajax({
      url: tsUrl + '/torrents', type: 'POST', headers: tsHeaders(),
      data: JSON.stringify({ action: 'add', link: magnet, title: title || '', save_to_db: false }),
      dataType: 'json', timeout: 15000,
      success: function (data) { onDone((data && data.hash) || ''); },
      error: function () { onFail && onFail(); }
    });
  }

  function tsGetFiles(hash, onDone) {
    var tsUrl = getTsUrl();
    $.ajax({
      url: tsUrl + '/torrents', type: 'POST', headers: tsHeaders(),
      data: JSON.stringify({ action: 'get', hash: hash }),
      dataType: 'json', timeout: 15000,
      success: function (data) {
        var files = ((data && data.file_stats) || [])
          .filter(function (f) { return (f.path || '').toLowerCase().match(/\.(mp4|mkv|avi|mov|webm|ts|m2ts|wmv|flv)$/); })
          .sort(function (a, b) { return (a.path || '').localeCompare(b.path || '', undefined, { numeric: true }); });
        onDone(files, data);
      },
      error: function () { onDone([], null); }
    });
  }

  function tsPlayFile(hash, fileId, title, card) {
    var tsUrl = getTsUrl();
    var name = encodeURIComponent(title || 'video');
    var url = tsUrl + '/stream/' + name + '?link=' + hash + '&index=' + fileId + '&play';
    doPlay({ url: url, title: title, card: card });
  }

  function tsAddAndPickFile(magnet, hash, torrentTitle, playTitle, card) {
    var tsUrl = getTsUrl();
    if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
    Lampa.Noty.show('Đang thêm vào TorrServer...');
    tsAdd(magnet, torrentTitle, function (returnedHash) {
      var h = returnedHash || hash;
      if (!h) { Lampa.Noty.show('Không lấy được hash từ TorrServer'); return; }
      Lampa.Noty.show('Đang tải danh sách file...');
      var tries = 0;
      function tryGetFiles() {
        tries++;
        tsGetFiles(h, function (files) {
          if (!files.length && tries < 5) { setTimeout(tryGetFiles, 2000); return; }
          if (!files.length) { tsPlayFile(h, 0, playTitle, card); return; }
          if (files.length === 1) { tsPlayFile(h, files[0].id || 0, playTitle, card); return; }
          showFileList(files, h, playTitle, card);
        });
      }
      setTimeout(tryGetFiles, 2000);
    }, function () {
      Lampa.Noty.show('TorrServer lỗi, thử phát trực tiếp...');
      if (hash) tsPlayFile(hash, 0, playTitle, card);
    });
  }

  function showFileList(files, hash, playTitle, card) {
    Lampa.Select.show({
      title: '📂 Chọn file — ' + playTitle,
      items: files.map(function (f) {
        var parts = (f.path || '').split('/');
        var filename = parts[parts.length - 1] || f.path || 'File';
        var size = f.length ? ' — ' + fmtBytes(f.length) : '';
        var epMatch = filename.match(/[Ee](\d+)|[Сс](\d+)|\b(\d{2,3})\b/);
        var epLabel = epMatch ? ' [Ep ' + (epMatch[1]||epMatch[2]||epMatch[3]) + ']' : '';
        return { title: filename + epLabel, subtitle: size.trim(), file: f };
      }),
      onSelect: function (item) {
        var f = item.file;
        tsPlayFile(hash, f.id || 0, playTitle + ' — ' + (f.path || '').split('/').pop(), card);
      },
      onBack: function () { Lampa.Controller.toggle('full'); }
    });
  }

  /* ============================================================
     KKPHIM / OPHIM
     ============================================================ */
  function extractSeasonNumber(name, slug) {
    var text = (name || '') + ' ' + (slug || '');
    var patterns = [/[Ss]eason[\s\-._]*(\d+)/i, /[Pp]h[aầ]n[\s\-._]*(\d+)/i, /[Mm][uù]a[\s\-._]*(\d+)/i, /\bS(\d+)\b/];
    for (var i = 0; i < patterns.length; i++) {
      var m = text.match(patterns[i]);
      if (m) return parseInt(m[1]);
    }
    return 1;
  }

  function getBaseSlug(slug) {
    if (!slug) return '';
    return slug.replace(/-?season-?\d+/gi, '').replace(/-?phan-?\d+/gi, '')
      .replace(/-?mua-?\d+/gi, '').replace(/-?s\d+$/gi, '')
      .replace(/^-+|-+$/g, '').replace(/-+/g, '-');
  }

  function getBaseName(name) {
    if (!name) return '';
    return name
      .replace(/[\s\-]*[\(\[]?\s*[Ss]eason\s*\d+\s*[\)\]]?/gi, '')
      .replace(/[\s\-]*[\(\[]?\s*[Pp]h[aầ]n\s*\d+\s*[\)\]]?/gi, '')
      .replace(/[\s\-]*[\(\[]?\s*[Mm][uù]a\s*\d+\s*[\)\]]?/gi, '')
      .replace(/[\s\-]*\bS\d+\b/g, '').trim();
  }

  function searchSource(source, keyword, cb) {
    reguest(
      source.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&limit=30',
      function (data) {
        var items = [];
        if (data && data.status === 'success' && data.data && data.data.items) items = data.data.items;
        else if (data && data.data && data.data.items) items = data.data.items;
        else if (data && data.items) items = data.items;
        cb(items);
      },
      function () { cb([]); }
    );
  }

  function fetchDetail(source, slug, cb) {
    reguest(source.api + 'v1/api/phim/' + slug,
      function (data) {
        if (data && data.status === 'success' && data.data) {
          var item = data.data.item || data.data;
          cb({ movie: item, episodes: data.data.episodes || item.episodes || [] });
        } else {
          reguest(source.api + 'phim/' + slug,
            function (d2) { cb({ movie: d2.movie || d2.item || d2 || {}, episodes: d2.episodes || [] }); },
            function () { cb({ movie: {}, episodes: [] }); }
          );
        }
      },
      function () {
        reguest(source.api + 'phim/' + slug,
          function (d2) { cb({ movie: d2.movie || d2.item || d2 || {}, episodes: d2.episodes || [] }); },
          function () { cb({ movie: {}, episodes: [] }); }
        );
      }
    );
  }

  function matchScore(item, title, orig, year) {
    var score = 0;
    var nT = normalizeStr(title), nO = normalizeStr(orig);
    var n1 = normalizeStr(item.name || ''), n2 = normalizeStr(item.origin_name || '');
    var nT_base = normalizeStr(getBaseName(title)), nO_base = normalizeStr(getBaseName(orig));
    var n1_base = normalizeStr(getBaseName(item.name || '')), n2_base = normalizeStr(getBaseName(item.origin_name || ''));
    if (nT && (n1 === nT || n2 === nT)) score += 100;
    else if (nO && (n1 === nO || n2 === nO)) score += 100;
    else if (nT_base && (n1_base === nT_base || n2_base === nT_base)) score += 90;
    else if (nO_base && (n1_base === nO_base || n2_base === nO_base)) score += 90;
    else if (nT && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1)) score += 50;
    else if (nO && (n2.indexOf(nO) > -1 || nO.indexOf(n2) > -1)) score += 50;
    else if (nT_base && (n1_base.indexOf(nT_base) > -1 || nT_base.indexOf(n1_base) > -1)) score += 40;
    else if (nO_base && (n2_base.indexOf(nO_base) > -1 || nO_base.indexOf(n2_base) > -1)) score += 40;
    if (year && item.year) {
      var iy = parseInt(item.year), ty = parseInt(year);
      if (iy === ty) score += 30;
      else if (Math.abs(iy - ty) <= 1) score += 15;
    }
    return score;
  }

  function findAllSeasons(source, keyword, title, orig, year, cb) {
    var terms = [];
    var baseOrig = getBaseName(orig), baseTitle = getBaseName(title), baseKw = getBaseName(keyword);
    if (baseOrig) terms.push(baseOrig);
    if (baseTitle && terms.indexOf(baseTitle) === -1) terms.push(baseTitle);
    if (baseKw && terms.indexOf(baseKw) === -1) terms.push(baseKw);
    if (orig && terms.indexOf(orig) === -1) terms.push(orig);
    if (title && terms.indexOf(title) === -1) terms.push(title);
    if (!terms.length) terms.push(keyword);
    var allResults = [], searchIdx = 0;
    function doSearch() {
      if (searchIdx >= terms.length) { processResults(allResults); return; }
      var term = terms[searchIdx++];
      searchSource(source, term, function (items) {
        for (var i = 0; i < items.length; i++) {
          var exists = false;
          for (var j = 0; j < allResults.length; j++) {
            if (allResults[j].slug === items[i].slug) { exists = true; break; }
          }
          if (!exists) allResults.push(items[i]);
        }
        doSearch();
      });
    }
    function processResults(results) {
      if (!results.length) { cb(null); return; }
      var groups = {};
      for (var i = 0; i < results.length; i++) {
        var item = results[i], base = getBaseSlug(item.slug || '');
        var seasonNum = extractSeasonNumber(item.name, item.slug);
        if (!groups[base]) groups[base] = [];
        var dup = false;
        for (var d = 0; d < groups[base].length; d++) {
          if (groups[base][d].season_num === seasonNum && groups[base][d].slug === item.slug) { dup = true; break; }
        }
        if (!dup) groups[base].push({ season_num: seasonNum, slug: item.slug, name: item.name || '', origin_name: item.origin_name || '', year: item.year || '', type: item.type || '' });
      }
      var targetSlug = getBaseSlug(normalizeStr(orig || title || keyword).replace(/[^\w\s]/g, '').replace(/\s+/g, '-'));
      var bestGroup = null, bestScore = -1;
      for (var base in groups) {
        if (!groups.hasOwnProperty(base)) continue;
        var score = 0, seasons = groups[base];
        if (base === targetSlug) score = 100;
        else if (base.indexOf(targetSlug) > -1 || targetSlug.indexOf(base) > -1) score = 70;
        else {
          var bw = base.split('-').filter(Boolean), tw = targetSlug.split('-').filter(Boolean), common = 0;
          for (var w = 0; w < tw.length; w++) { if (bw.indexOf(tw[w]) > -1) common++; }
          if (common > 0) score = (common / Math.max(bw.length, tw.length)) * 60;
        }
        for (var s = 0; s < seasons.length; s++) { var ms = matchScore(seasons[s], title, orig, year); if (ms > 0) score = Math.max(score, ms); }
        if (seasons.length > 1) score += 5;
        if (year) { for (var y = 0; y < seasons.length; y++) { if (String(seasons[y].year) === String(year)) { score += 10; break; } } }
        if (score > bestScore) { bestScore = score; bestGroup = { base: base, seasons: seasons }; }
      }
      if (!bestGroup || bestScore < 10) {
        var first = results[0];
        cb({ movie_name: getBaseName(first.origin_name || first.name || ''), seasons: [{ season_num: 1, slug: first.slug, name: first.name || '', origin_name: first.origin_name || '', year: first.year || '', type: first.type || '' }] });
        return;
      }
      bestGroup.seasons.sort(function (a, b) { return a.season_num - b.season_num; });
      var unique = [], seenNums = {};
      for (var u = 0; u < bestGroup.seasons.length; u++) {
        var sn = bestGroup.seasons[u].season_num;
        if (!seenNums[sn]) { seenNums[sn] = true; unique.push(bestGroup.seasons[u]); }
      }
      var movieName = unique.length > 0 ? getBaseName(unique[0].origin_name || unique[0].name || '') : '';
      if (!movieName) movieName = title || keyword;
      cb({ movie_name: movieName, seasons: unique });
    }
    doSearch();
  }

  function cleanName(name) { return (name || '').replace(/^#+\s*/, '').trim(); }

  function searchAndPlay(sourceKey, card) {
    var source = SOURCES[sourceKey];
    if (!source) return;
    var title = card.title || card.name || '';
    var orig = card.original_title || card.original_name || '';
    var year = (card.release_date || card.first_air_date || '').slice(0, 4);
    Lampa.Noty.show(source.name + ': đang tìm...');
    findAllSeasons(source, title, title, orig, year, function (result) {
      if (!result || !result.seasons || !result.seasons.length) {
        var searchTerm = orig || title;
        searchSource(source, searchTerm, function (items) {
          if (!items.length && orig && title !== orig) {
            searchSource(source, title, function (items2) { showManualSelect(source, items2, card); });
          } else {
            showManualSelect(source, items, card);
          }
        });
        return;
      }
      showSeasonMenu(source, result, card);
    });
  }

  function showSeasonMenu(source, result, card) {
    var seasons = result.seasons, movieName = result.movie_name;
    var title = card.title || card.name || movieName;
    if (seasons.length === 1) {
      loadSeasonEpisodes(source, seasons[0], card, title);
      return;
    }
    Lampa.Select.show({
      title: '📺 ' + movieName,
      items: seasons.map(function (s, idx) {
        return { title: 'Season ' + s.season_num + ': ' + s.name, subtitle: s.year ? 'Năm: ' + s.year : '', season: s, index: idx };
      }),
      onSelect: function (item) { loadSeasonEpisodes(source, item.season, card, title); },
      onBack: function () { Lampa.Controller.toggle('full'); }
    });
  }

  function loadSeasonEpisodes(source, season, card, movieTitle) {
    fetchDetail(source, season.slug, function (data) {
      var eps = data.episodes || [];
      if (!eps.length) { Lampa.Noty.show('Không có tập phim'); return; }
      playEpisode(card, eps, season.season_num, movieTitle, season.name);
    });
  }

  function playEpisode(card, episodes, seasonNum, movieTitle, seasonName) {
    var displayTitle = seasonName || movieTitle || card.title || card.name || '';
    var servers = (episodes || []).filter(function (srv) { return srv.server_data && srv.server_data.length > 0; });
    if (!servers.length) { Lampa.Noty.show('Không có tập phim'); return; }
    if (servers.length === 1) { showEpisodeMenu(displayTitle, servers[0], card, seasonNum); return; }
    Lampa.Select.show({
      title: displayTitle + ' — Chọn phiên bản',
      items: servers.map(function (srv, idx) {
        var name = cleanName(srv.server_name) || ('Phiên bản ' + (idx + 1));
        return { title: name, subtitle: (srv.server_data || []).length + ' tập', srv: srv };
      }),
      onSelect: function (item) { showEpisodeMenu(displayTitle, item.srv, card, seasonNum); },
      onBack: function () { Lampa.Controller.toggle('full'); }
    });
  }

  function showEpisodeMenu(title, serverData, card, seasonNum) {
    var eps = serverData.server_data || [], sNum = seasonNum || 1;
    var srvName = cleanName(serverData.server_name);
    var menuTitle = title + (srvName ? ' · ' + srvName : '');
    if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }
    var playlist = eps.map(function (ep, idx) {
      return { title: menuTitle + ' — ' + (ep.name || ('Tập ' + (idx + 1))), url: ep.link_m3u8 || ep.link_embed || '', movie: card, season: sNum, episode: idx + 1 };
    });
    Lampa.Select.show({
      title: '🎬 ' + menuTitle + ' (' + eps.length + ' tập)',
      items: eps.map(function (ep, idx) {
        var link = ep.link_m3u8 || ep.link_embed || '';
        return { title: ep.name || ('Tập ' + (idx + 1)), subtitle: !link ? '⚠ Không có link' : (link.indexOf('.m3u8') > -1 ? '🎬 M3U8' : '🌐 Embed'), ep: ep, idx: idx };
      }),
      onSelect: function (item) {
        var link = item.ep.link_m3u8 || item.ep.link_embed || '';
        if (!link) { Lampa.Noty.show('Không có link phát'); return; }
        doPlay({ url: link, title: menuTitle + ' — ' + (item.ep.name || ('Tập ' + (item.idx + 1))), card: card, episode: { season: sNum, episode: item.idx + 1 } });
        try { Lampa.Player.playlist(playlist, item.idx); } catch(e) {}
      },
      onBack: function () { Lampa.Controller.toggle('full'); }
    });
  }

  function showManualSelect(source, items, card) {
    if (!items || !items.length) { Lampa.Noty.show('Không tìm thấy trên ' + source.name); return; }
    Lampa.Select.show({
      title: source.name + ' — Kết quả',
      items: items.map(function (it) {
        var sn = extractSeasonNumber(it.name, it.slug);
        return {
          title: (it.name || '') + (it.origin_name ? ' (' + it.origin_name + ')' : '') + (sn > 1 ? ' [S' + sn + ']' : '') + (it.year ? ' [' + it.year + ']' : ''),
          subtitle: 'Slug: ' + it.slug, slug: it.slug, item: it
        };
      }),
      onSelect: function (sel) {
        if (!sel.slug) return;
        var sNum = extractSeasonNumber(sel.item.name, sel.item.slug);
        fetchDetail(source, sel.slug, function (data) {
          var eps = data.episodes || [];
          if (!eps.length) { Lampa.Noty.show('Không có tập phim'); return; }
          playEpisode(card, eps, sNum, card.title || card.name, sel.item.name);
        });
      },
      onBack: function () { Lampa.Controller.toggle('full'); }
    });
  }

  /* ============================================================
     KNABEN - Parser thủ công
     ============================================================ */
  function parseKnabenHTML(html) {
    var results = [];
    // Tìm tất cả các row trong table: <tr>...</tr>
    var rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    var rows = html.match(rowPattern) || [];
    
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      
      // Lấy magnet link
      var magnetMatch = row.match(/href="(magnet:\?xt=urn:btih:[a-fA-F0-9]{40}[^"]*)"/i);
      if (!magnetMatch) continue;
      var magnet = magnetMatch[1].replace(/&amp;/g, '&');
      
      // Lấy hash
      var hashMatch = magnet.match(/btih:([a-fA-F0-9]{40})/i);
      if (!hashMatch) continue;
      var hash = hashMatch[1];
      
      // Lấy tất cả <td>
      var tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      var cells = row.match(tdPattern) || [];
      if (cells.length < 6) continue;
      
      // Cell 1: Title
      var titleMatch = cells[1].match(/>([^<]+)</);
      var title = titleMatch ? titleMatch[1].trim() : '';
      if (!title) continue;
      
      // Cell 2: Size
      var sizeMatch = cells[2].match(/>([^<]+)</);
      var sizeStr = sizeMatch ? sizeMatch[1].trim() : '';
      
      // Cell 4: Seeds
      var seedsMatch = cells[4].match(/>(\d+)</);
      var seeds = seedsMatch ? parseInt(seedsMatch[1]) : 0;
      
      results.push({
        title: title,
        hash: hash,
        seeds: seeds,
        peers: 0,
        size: sizeStr,
        sizeNum: parseSize(sizeStr),
        tracker: 'Knaben',
        magnet: magnet
      });
    }
    
    return results;
  }

  function fetchKnaben(query, cb) {
    var url = KNABEN_BASE_URL + encodeURIComponent(query) + '/0/1/bytes';
    reguest(url, function (html) {
      var parsed = parseKnabenHTML(html);
      var normalized = [];
      for (var i = 0; i < parsed.length; i++) {
        var norm = normResult(parsed[i]);
        if (norm) normalized.push(norm);
      }
      cb(normalized);
    }, function () { cb([]); });
  }

  function searchKnaben(card) {
    var title = card.title || card.name || '';
    var orig = card.original_title || card.original_name || '';
    var year = (card.release_date || card.first_air_date || '').slice(0, 4);
    var q = (orig || title) + (year ? ' ' + year : '');
    var q2 = (orig && orig !== title) ? title + (year ? ' ' + year : '') : '';
    Lampa.Noty.show('Knaben: đang tìm...');
    fetchKnaben(q, function (r) {
      if (!r.length && q2) {
        fetchKnaben(q2, function (r2) { showPackMenu(r2, title, 'Knaben', card); });
      } else {
        showPackMenu(r, title, 'Knaben', card);
      }
    });
  }

  /* ============================================================
     MAGNETZ - Parser thủ công
     ============================================================ */
  function parseMagnetzHTML(html) {
    var results = [];
    // Tìm các article.result-card
    var cardPattern = /<article[^>]*class="[^"]*result-card[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    var cards = html.match(cardPattern) || [];
    
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      
      // Lấy title từ <a class="result-card__name">
      var titleMatch = card.match(/<a[^>]*class="[^"]*result-card__name[^"]*"[^>]*>([^<]+)<\/a>/i);
      var title = titleMatch ? titleMatch[1].trim() : '';
      if (!title) continue;
      
      // Lấy magnet từ button data-magnet
      var magnetMatch = card.match(/data-magnet="([^"]+)"/i);
      if (!magnetMatch) continue;
      var magnet = magnetMatch[1].replace(/&amp;/g, '&');
      
      // Lấy hash
      var hashMatch = magnet.match(/btih:([a-fA-F0-9]{40})/i);
      if (!hashMatch) continue;
      var hash = hashMatch[1];
      
      // Lấy size từ text content
      var sizeMatch = card.match(/([\d.]+)\s*(GB|MB|TB|KB)/i);
      var sizeStr = sizeMatch ? sizeMatch[0] : '';
      
      // Lấy seeds
      var seedMatch = card.match(/([\d,]+)\s*(?:seed|seeder)/i);
      var seeds = seedMatch ? parseInt(seedMatch[1].replace(/,/g, '')) : 0;
      
      results.push({
        title: title,
        hash: hash,
        seeds: seeds,
        peers: 0,
        size: sizeStr,
        sizeNum: parseSize(sizeStr),
        tracker: 'Magnetz',
        magnet: magnet
      });
    }
    
    return results;
  }

  function fetchMagnetz(query, cb) {
    var url = MAGNETZ_BASE_URL + '?query=' + encodeURIComponent(query) + '&sort=size';
    reguest(url, function (html) {
      var parsed = parseMagnetzHTML(html);
      var normalized = [];
      for (var i = 0; i < parsed.length; i++) {
        var norm = normResult(parsed[i]);
        if (norm) normalized.push(norm);
      }
      cb(normalized);
    }, function () { cb([]); });
  }

  function searchMagnetz(card) {
    var title = card.title || card.name || '';
    var orig = card.original_title || card.original_name || '';
    var year = (card.release_date || card.first_air_date || '').slice(0, 4);
    var q1 = (orig || title) + (year ? ' ' + year : '');
    var q2 = (orig && orig !== title) ? title + (year ? ' ' + year : '') : '';
    Lampa.Noty.show('Magnetz: đang tìm...');
    fetchMagnetz(q1, function (r) {
      if (!r.length && q2) {
        fetchMagnetz(q2, function (r2) {
          if (!r2.length) {
            fetchMagnetz(orig || title, function (r3) { showPackMenu(r3, title, 'Magnetz', card); });
          } else {
            showPackMenu(r2, title, 'Magnetz', card);
          }
        });
      } else {
        showPackMenu(r, title, 'Magnetz', card);
      }
    });
  }

  /* ============================================================
     PACK MENU
     ============================================================ */
  var QUALITY_ORDER = ['2160P','4K','UHD','REMUX','1080P','1080I','720P','480P'];
  function showPackMenu(results, movieTitle, label, card) {
    if (!results || !results.length) {
      Lampa.Noty.show(label + ': Không tìm thấy');
      return;
    }
    var tsUrl = getTsUrl();
    var byQ = {}, allQ = [];
    results.forEach(function (r) {
      var q = r.quality || 'OTHER';
      if (!byQ[q]) { byQ[q] = []; allQ.push(q); }
      byQ[q].push(r);
    });
    allQ.sort(function (a, b) {
      var ia = QUALITY_ORDER.indexOf(a), ib = QUALITY_ORDER.indexOf(b);
      if (ia === -1) ia = 99;
      if (ib === -1) ib = 99;
      return ia - ib;
    });
    var items = [];
    allQ.forEach(function (q) {
      var group = byQ[q];
      items.push({ title: '── ' + q + ' · ' + group.length + ' ──', separator: true });
      group.slice(0, 20).forEach(function (r) {
        var name = r.title.length > 60 ? r.title.slice(0, 57) + '…' : r.title;
        var seedTxt = r.seeds > 0 ? '👤 ' + r.seeds : '⚠ 0 seed';
        var peerTxt = r.peers > 0 ? '/' + r.peers : '';
        var sizeTxt = r.size ? ' 💾 ' + r.size : '';
        items.push({
          title: '🧲 [' + r.tracker + '] ' + name,
          subtitle: seedTxt + peerTxt + sizeTxt,
          r: r
        });
      });
    });
    Lampa.Select.show({
      title: '🔍 ' + label + ': ' + movieTitle + ' (' + results.length + ')',
      items: items,
      onSelect: function (item) {
        if (item.separator) return;
        var r = item.r;
        if (!tsUrl) {
          Lampa.Noty.show('Chưa cấu hình TorrServer! Vào Settings → KKPhim Parser.');
          return;
        }
        if (!r.magnet && !r.hash) { Lampa.Noty.show('Không có magnet link'); return; }
        var magnet = r.magnet || makeMagnet(r.hash, r.title);
        tsAddAndPickFile(magnet, r.hash, r.title, movieTitle, card);
      },
      onBack: function () { Lampa.Controller.toggle('full'); }
    });
  }

  /* ============================================================
     TORRENTIO
     ============================================================ */
  function buildStreamUrl(type, imdbId, season, episode) {
    var sType = type === 'series' ? 'series' : 'movie';
    var id = imdbId;
    if (type === 'series' && season && episode) id = imdbId + ':' + season + ':' + episode;
    var cfg = getTioConfig();
    return TORRENTIO_BASE + (cfg ? '/' + cfg : '') + '/stream/' + sType + '/' + id + '.json';
  }

  function fetchStreams(url, cb) {
    reguest(url,
      function (data) { cb((data && data.streams) || []); },
      function (e) { Lampa.Noty.show('Lỗi torrent: ' + e); cb([]); }
    );
  }

  function parseStream(st) {
    var lines = (st.title || '').split('\n');
    var name = lines[0] || String(st.name || '').split('\n')[0] || '?';
    var info = lines[1] || '';
    var sizeM = info.match(/💾\s*([\d.,]+\s*[GMKBT]+)/i);
    var seedM = info.match(/👤\s*(\d+)/);
    var srcM = info.match(/⚙️\s*(\S+)/);
    var sz = sizeM ? sizeM[1].trim() : '';
    return {
      title: name,
      hash: (st.infoHash || '').toLowerCase(),
      fileIdx: typeof st.fileIdx === 'number' ? st.fileIdx : 0,
      url: st.url || '',
      size: sz,
      sizeNum: parseSize(sz),
      seeds: seedM ? parseInt(seedM[1]) : 0,
      tracker: srcM ? srcM[1] : 'Torrentio',
      magnet: st.infoHash ? makeMagnet(st.infoHash, name) : ''
    };
  }

  function showStreamsMenu(streams, movieTitle, card, season, episode) {
    if (!streams || !streams.length) { Lampa.Noty.show('Không tìm thấy torrent'); return; }
    var tsUrl = getTsUrl();
    var parsed = streams.map(parseStream).filter(function (s) { return s.hash; })
      .sort(function (a, b) { return b.sizeNum - a.sizeNum; });
    Lampa.Select.show({
      title: '🧲 Torrentio: ' + movieTitle + ' (' + parsed.length + ')',
      items: parsed.map(function (s) {
        return {
          title: '[' + s.tracker + '] ' + s.title,
          subtitle: (s.seeds ? '👤 ' + s.seeds + ' ' : '') + (s.size ? '💾 ' + s.size : ''),
          s: s
        };
      }),
      onSelect: function (item) {
        var s = item.s;
        if (tsUrl && s.hash) {
          var name = encodeURIComponent(movieTitle);
          tsAdd(s.magnet, movieTitle, function (hash) {
            var h = hash || s.hash;
            var url = tsUrl + '/stream/' + name + '?link=' + h + '&index=' + s.fileIdx + '&play';
            doPlay({ url: url, title: movieTitle, card: card, episode: (season && episode) ? { season: season, episode: episode } : null });
          }, function () {
            var url = tsUrl + '/stream/' + encodeURIComponent(movieTitle) + '?link=' + s.hash + '&index=' + s.fileIdx + '&play';
            doPlay({ url: url, title: movieTitle, card: card });
          });
        } else if (s.url) {
          doPlay({ url: s.url, title: movieTitle, card: card, episode: (season && episode) ? { season: season, episode: episode } : null });
        } else {
          Lampa.Noty.show(s.hash ? 'Chưa cấu hình TorrServer!' : 'Không có link');
        }
      },
      onBack: function () { Lampa.Controller.toggle('full'); }
    });
  }

  function searchTorrent(card, season, episode) {
    var title = card.title || card.name || '';
    var type = getMediaType(card);
    var imdbId = getImdbId(card);
    Lampa.Noty.show('Đang tìm torrent...');
    function run(id) {
      var url = buildStreamUrl(type, id, season, episode);
      if (!url) { Lampa.Noty.show('Lỗi config Torrentio'); return; }
      fetchStreams(url, function (streams) {
        var epLabel = (season && episode) ? ' S' + padZero(season) + 'E' + padZero(episode) : '';
        showStreamsMenu(streams, title + epLabel, card, season, episode);
      });
    }
    if (imdbId) { run(imdbId); return; }
    reguest(
      'https://api.themoviedb.org/3/' + (type === 'series' ? 'tv' : 'movie') + '/' + card.id + '/external_ids?api_key=' + TMDB_API_KEY,
      function (d) {
        var id = d && d.imdb_id;
        if (id) { card.imdb_id = id; run(id); }
        else Lampa.Noty.show('Không tìm thấy IMDB ID');
      },
      function () { Lampa.Noty.show('Lỗi lấy IMDB ID'); }
    );
  }

  function getSeasonEpCount(card, season) {
    if (card.seasons) {
      var s = card.seasons.filter(function (x) { return x.season_number === season; })[0];
      if (s && s.episode_count) return s.episode_count;
    }
    return 50;
  }

  function askTorrentTV(card) {
    var total = card.number_of_seasons || 1;
    function pickEp(s) {
      var totalEps = getSeasonEpCount(card, s);
      var ee = [];
      for (var e = 1; e <= totalEps; e++) ee.push({ title: 'S' + padZero(s) + 'E' + padZero(e), s: s, e: e });
      Lampa.Select.show({
        title: 'Season ' + s + ' — Chọn tập', items: ee,
        onSelect: function (item) { searchTorrent(card, item.s, item.e); },
        onBack: function () { Lampa.Controller.toggle('full'); }
      });
    }
    if (total === 1) { pickEp(1); return; }
    var ss = [];
    for (var s = 1; s <= total; s++) ss.push({ title: 'Season ' + s + ' (' + getSeasonEpCount(card, s) + ' tập)', s: s });
    Lampa.Select.show({
      title: 'Chọn Season', items: ss,
      onSelect: function (item) { pickEp(item.s); },
      onBack: function () { Lampa.Controller.toggle('full'); }
    });
  }

  /* ============================================================
     SETTINGS
     ============================================================ */
  function initSettings() {
    if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;
    Lampa.SettingsApi.addComponent({
      component: 'kkparser',
      name: 'KKPhim Parser',
      icon: '<svg viewBox="0 0 24 24" fill="none" width="24" height="24">' +
        '<rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/>' +
        '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>'
    });
    setTimeout(buildSettings, 100);
  }

  function addParam(cfg) {
    Lampa.SettingsApi.addParam({
      component: 'kkparser',
      param: { name: STG_PREFIX + cfg.key, type: cfg.type, values: cfg.values || '', default: cfg.def || '' },
      field: { name: cfg.name, description: cfg.desc || '' },
      onChange: cfg.onChange || function (v) { Lampa.Storage.set(STG_PREFIX + cfg.key, v); }
    });
  }

  function buildSettings() {
    if (!Lampa.SettingsApi) return;
    addParam({ key: 'torrserver_url', type: 'input', name: 'Địa chỉ TorrServer', desc: 'VD: 192.168.1.100:8090' });
    addParam({ key: 'torrserver_pass', type: 'input', name: 'Mật khẩu TorrServer', desc: 'Để trống nếu không có' });
    addParam({
      key: 'test_torrserver', type: 'button', name: '🧪 Test TorrServer', desc: 'Kiểm tra kết nối',
      onChange: function () {
        var url = getTsUrl();
        if (!url) { Lampa.Noty.show('Chưa nhập địa chỉ!'); return; }
        Lampa.Noty.show('Đang test...');
        $.ajax({ url: url + '/echo', type: 'GET', timeout: 5000,
          success: function () { Lampa.Noty.show('✅ TorrServer OK!'); },
          error: function (xhr) { Lampa.Noty.show(xhr.status === 200 ? '✅ OK!' : '❌ HTTP ' + (xhr.status || 'timeout')); }
        });
      }
    });
    addParam({ key: 'torrentio_config', type: 'input', name: 'Torrentio Config', desc: 'Link manifest hoặc để trống' });
    addParam({ key: 'jacred_url', type: 'input', name: 'Jacred URL', desc: 'VD: https://jac.red/api/v1.0/torrents' });
    addParam({
      key: 'test_jacred', type: 'button', name: '🧪 Test Jacred', desc: 'Kiểm tra kết nối',
      onChange: function () {
        var url = getJacredUrl();
        if (!url) { Lampa.Noty.show('Chưa nhập URL!'); return; }
        Lampa.Noty.show('Đang test...');
        reguest(url + '?search=test',
          function () { Lampa.Noty.show('✅ Jacred OK!'); },
          function (e) { Lampa.Noty.show('❌ Lỗi: ' + e); }
        );
      }
    });
  }

  /* ============================================================
     HOOK UI
     ============================================================ */
  Lampa.Listener.follow('full', function (e) {
    if (e.type !== 'complite') return;
    var card = (e.data && e.data.movie) ? e.data.movie : (e.object && e.object.card);
    if (!card) return;
    var $ctx;
    if (e.object && e.object.activity) $ctx = e.object.activity.render();
    else if (e.object && e.object.render) $ctx = e.object.render();
    else $ctx = $('body');
    if ($ctx.find('.view--kkphim').length) return;
    var isSeries = getMediaType(card) === 'series';
    function mkBtn(cls, inner, label, fn) {
      var $b = $(
        '<div class="full-start__button selector ' + cls + '">' +
        '<svg viewBox="0 0 24 24" fill="none" width="44" height="44" ' +
        'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        inner + '</svg><span>' + label + '</span></div>'
      );
      $b.on('hover:enter', fn);
      return $b;
    }
    var $kk = mkBtn('view--kkphim',
      '<rect x="2" y="2" width="20" height="20" rx="3"/>' +
      '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
      'KKPhim', function () { searchAndPlay('kkphim', card); }
    );
    var $op = mkBtn('view--ophim',
      '<circle cx="12" cy="12" r="10"/>' +
      '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
      'OPhim', function () { searchAndPlay('ophim', card); }
    );
    var $tr = mkBtn('view--kkparser-torrent',
      '<circle cx="12" cy="12" r="10"/>' +
      '<polyline points="8 12 12 16 16 12"/>' +
      '<line x1="12" y1="8" x2="12" y2="16"/>',
      'Torrentio',
      function () { if (isSeries) askTorrentTV(card); else searchTorrent(card, null, null); }
    );
    var $kn = mkBtn('view--kkparser-knaben',
      '<path d="M12 2L2 7l10 5 10-5-10-5z"/>' +
      '<path d="M2 17l10 5 10-5"/>' +
      '<path d="M2 12l10 5 10-5"/>',
      'Knaben', function () { searchKnaben(card); }
    );
    var $mg = mkBtn('view--kkparser-magnetz',
      '<circle cx="11" cy="11" r="8"/>' +
      '<line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
      '<path d="M11 8v6M8 11h6"/>',
      'Magnetz', function () { searchMagnetz(card); }
    );

    var $anchor = $ctx.find('.view--torrent');
    if ($anchor.length) {
      $anchor.after($mg).after($kn).after($tr).after($op).after($kk);
    } else {
      $ctx.find('.full-start__buttons').append($kk).append($op).append($tr).append($kn).append($mg);
    }
  });

  /* ============================================================
     START
     ============================================================ */
  function start() {
    initSettings();
    console.log('[KKPhim Parser] v2.1 — Knaben ✅ | Magnetz ✅ | Jacred URL ✅ | Parser thủ công ✅');
  }
  if (window.appready) start();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();