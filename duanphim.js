(function () {
  "use strict";

  if (window.__kkphim_parser_loaded) return;
  window.__kkphim_parser_loaded = true;

  // ===================================================================
  // CẤU HÌNH
  // ===================================================================
  var SOURCES = {
    kkphim: {
      key: "kkphim",
      name: "KKPhim",
      api: "https://phimapi.com/",
      img: "https://phimimg.com/",
    },
    ophim: {
      key: "ophim",
      name: "OPhim",
      api: "https://ophim1.com/",
      img: "https://img.ophim.live/uploads/movies/",
    },
  };

  var TMDB_TOKEN =
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0";
  var TMDB_BASE = "https://api.themoviedb.org/3";
  var TIO_BASE = "https://torrentio.strem.fun";
  var STG_KEY = "kkphim_parser_settings";

  // ===================================================================
  // SETTINGS
  // ===================================================================
  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STG_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveSettings(obj) {
    try {
      var current = getSettings();
      Object.keys(obj).forEach(function (k) {
        current[k] = obj[k];
      });
      localStorage.setItem(STG_KEY, JSON.stringify(current));
    } catch (e) {}
  }

  function tsHost() {
    return getSettings().torrserver_host || "";
  }
  function tsPass() {
    return getSettings().torrserver_password || "";
  }
  function tioConf() {
    return getSettings().torrentio_config || "";
  }

  // ===================================================================
  // UTILITIES
  // ===================================================================
  function normalizeStr(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, "")
      .replace(/\s+/g, " ");
  }

  function padZero(n) {
    return (n < 10 ? "0" : "") + n;
  }

  // ===================================================================
  // TMDB HELPERS
  // ===================================================================
  function tmdbFetch(path) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: TMDB_BASE + path,
        type: "GET",
        headers: { Authorization: "Bearer " + TMDB_TOKEN },
        success: resolve,
        error: function (xhr) {
          reject(new Error("TMDB " + xhr.status));
        },
      });
    });
  }

  function getImdbId(type, id) {
    return tmdbFetch("/" + type + "/" + id + "/external_ids")
      .then(function (r) {
        return r.imdb_id || null;
      })
      .catch(function () {
        return null;
      });
  }

  function getTMDBSeasons(tvId) {
    return tmdbFetch("/tv/" + tvId + "?language=vi-VN")
      .then(function (r) {
        if (r && r.seasons) {
          return r.seasons.filter(function (s) {
            return s.season_number > 0;
          });
        }
        return [];
      })
      .catch(function () {
        return [];
      });
  }

  // ===================================================================
  // SOURCE API - Tìm kiếm & lấy chi tiết từ KKPhim/OPhim
  // ===================================================================
  function searchSource(source, keyword) {
    return new Promise(function (resolve) {
      $.ajax({
        url:
          source.api +
          "v1/api/tim-kiem?keyword=" +
          encodeURIComponent(keyword) +
          "&page=1",
        type: "GET",
        timeout: 8000,
        success: function (data) {
          var items =
            (data && data.data && data.data.items) ||
            (data && data.items) ||
            [];
          resolve(items);
        },
        error: function () {
          resolve([]);
        },
      });
    });
  }

  function fetchSourceDetail(source, slug) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: source.api + "phim/" + slug,
        type: "GET",
        timeout: 10000,
        success: function (data) {
          resolve({
            movie: data.movie || data || {},
            episodes: data.episodes || [],
          });
        },
        error: reject,
      });
    });
  }

  // ===================================================================
  // MATCH - Tìm phim phù hợp nhất
  // ===================================================================
  function matchScore(item, title, orig, year) {
    var score = 0;
    var nT = normalizeStr(title),
      nO = normalizeStr(orig);
    var n1 = normalizeStr(item.name || "");
    var n2 = normalizeStr(item.origin_name || "");

    if (nT && (n1 === nT || n2 === nT)) score += 100;
    else if (nO && (n1 === nO || n2 === nO)) score += 100;
    else if (nT && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1)) score += 50;
    else if (nO && (n2.indexOf(nO) > -1 || nO.indexOf(n2) > -1)) score += 50;

    if (year && item.year) {
      var iy = parseInt(item.year),
        ty = parseInt(year);
      if (iy === ty) score += 30;
      else if (Math.abs(iy - ty) <= 1) score += 15;
    }

    return score;
  }

  function findBestMatch(items, title, orig, year) {
    if (!items || !items.length) return null;

    var scored = items
      .map(function (it) {
        return { item: it, score: matchScore(it, title, orig, year) };
      })
      .filter(function (x) {
        return x.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      });

    return scored.length ? scored[0].item : null;
  }

  function findSlugsAllSources(title, orig, year) {
    return new Promise(function (resolve) {
      var result = {};
      var terms = [title];
      if (orig && orig !== title) terms.push(orig);

      var promises = [];

      Object.keys(SOURCES).forEach(function (key) {
        var source = SOURCES[key];

        var p = (async function () {
          for (var i = 0; i < terms.length; i++) {
            if (result[key]) break;
            var items = await searchSource(source, terms[i]);
            var best = findBestMatch(items, title, orig, year);
            if (best && best.slug) {
              result[key] = { slug: best.slug, item: best };
              break;
            }
          }
        })();

        promises.push(p);
      });

      Promise.all(promises)
        .then(function () {
          resolve(result);
        })
        .catch(function () {
          resolve(result);
        });
    });
  }

  // ===================================================================
  // PLAY EPISODE - Phát từ KKPhim/OPhim
  // ===================================================================
  function playEpisode(card, episodes) {
    var title = card.title || card.name || "";
    var poster = card.poster_path
      ? "https://image.tmdb.org/t/p/w500" + card.poster_path
      : card.img || card.poster || "";

    if (!episodes || !episodes.length) {
      Lampa.Noty.show("Không có tập phim");
      return;
    }

    var totalEps = 0;
    episodes.forEach(function (srv) {
      totalEps += (srv.server_data || []).length;
    });

    if (totalEps === 0) {
      Lampa.Noty.show("Không có tập phim");
      return;
    }

    // 1 tập duy nhất -> phát luôn
    if (totalEps === 1) {
      var ep = null;
      for (var i = 0; i < episodes.length; i++) {
        if (episodes[i].server_data && episodes[i].server_data.length) {
          ep = episodes[i].server_data[0];
          break;
        }
      }
      if (ep) {
        var link = ep.link_m3u8 || ep.link_embed || "";
        if (link) {
          Lampa.Player.play({ title: title, url: link, poster: poster });
        } else {
          Lampa.Noty.show("Không có link phát");
        }
      }
      return;
    }

    // 1 server -> danh sách tập
    if (episodes.length === 1 && episodes[0].server_data) {
      showEpisodeList(card, episodes[0], poster);
      return;
    }

    // Nhiều server -> chọn server
    showServerSelect(card, episodes, poster);
  }

  function showServerSelect(card, episodes, poster) {
    var title = card.title || card.name || "";

    Lampa.Select.show({
      title: "Chọn Server - " + title,
      items: episodes.map(function (srv, idx) {
        var count = (srv.server_data || []).length;
        return {
          title:
            (srv.server_name || "Server " + (idx + 1)) +
            " (" +
            count +
            " tập)",
          value: srv,
        };
      }),
      onSelect: function (item) {
        showEpisodeList(card, item.value, poster);
      },
      onBack: function () {
        Lampa.Controller.toggle("content");
      },
    });
  }

  function showEpisodeList(card, serverData, poster) {
    var title = card.title || card.name || "";
    poster =
      poster ||
      (card.poster_path
        ? "https://image.tmdb.org/t/p/w500" + card.poster_path
        : card.img || card.poster || "");
    var eps = serverData.server_data || [];

    if (!eps.length) {
      Lampa.Noty.show("Không có tập");
      return;
    }

    var playlist = eps.map(function (ep) {
      return {
        title: title + " - " + (ep.name || ""),
        url: ep.link_m3u8 || ep.link_embed || "",
        poster: poster,
      };
    });

    Lampa.Select.show({
      title: (serverData.server_name || "Server") + " - " + title,
      items: eps.map(function (ep, idx) {
        var link = ep.link_m3u8 || ep.link_embed || "";
        return {
          title: (ep.name || "Tập " + (idx + 1)) + (!link ? " [N/A]" : ""),
          value: ep,
          index: idx,
        };
      }),
      onSelect: function (item) {
        var ep = item.value;
        var link = ep.link_m3u8 || ep.link_embed || "";

        if (!link) {
          Lampa.Noty.show("Không có link phát");
          return;
        }

        Lampa.Player.play({
          title: title + " - " + (ep.name || ""),
          url: link,
          poster: poster,
        });

        Lampa.Player.playlist(playlist, item.index);
      },
      onBack: function () {
        Lampa.Controller.toggle("content");
      },
    });
  }

  // ===================================================================
  // TORRENT HELPERS
  // ===================================================================
  function getTorrentioConfig() {
    var raw = tioConf();
    if (!raw) return "";
    raw = String(raw).trim();

    var m = raw.match(
      /torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i
    );
    if (m) return m[1];

    m = raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);
    if (m) return m[1].replace(/\/+$/, "");

    m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);
    if (m) return m[1];

    if (raw.indexOf("torrentio.strem.fun") > -1) {
      raw = raw
        .replace(/^https?:\/\/torrentio\.strem\.fun\/?/i, "")
        .replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i, "")
        .replace(/^\/+|\/+$/g, "");
      if (raw && raw.indexOf("=") > -1) return raw.replace(/\|/g, "%7C");
      return "";
    }

    raw = raw.replace(/^\/+|\/+$/g, "").replace(/\|/g, "%7C");
    return raw.indexOf("=") === -1 ? "" : raw;
  }

  function buildTorrentioUrl(type, imdbId, season, episode) {
    var streamType = type === "tv" ? "series" : "movie";
    var id = imdbId;

    if (type === "tv" && season && episode) {
      id = imdbId + ":" + season + ":" + episode;
    }

    var config = getTorrentioConfig();
    var base = TIO_BASE + (config ? "/" + config : "");

    return base + "/stream/" + streamType + "/" + id + ".json";
  }

  function fetchTorrentStreams(url) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: url,
        type: "GET",
        timeout: 10000,
        success: function (data) {
          resolve(data.streams || []);
        },
        error: reject,
      });
    });
  }

  function parseStream(st) {
    var rawName = String(st.name || "");
    var rawDesc = String(st.description || "");
    var rawTitle = String(st.title || "");
    var rawAll = rawName + "\n" + rawDesc + "\n" + rawTitle;

    var name =
      rawName.split("\n")[0].trim() || rawTitle.split("\n")[0].trim() || "?";

    var qual = "";
    var qm = rawAll.match(
      /\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i
    );
    if (qm) qual = qm[1].toUpperCase();

    var size = "";
    var sizePatterns = [
      /💾\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i,
      /\b([\d.,]+)\s*(TB)\b/i,
      /\b([\d.,]+)\s*(GB|GiB)\b/i,
      /\b([\d.,]+)\s*(MB|MiB)\b/i,
    ];
    for (var i = 0; i < sizePatterns.length; i++) {
      var sm = rawAll.match(sizePatterns[i]);
      if (sm) {
        size = sm[2] ? sm[1] + " " + sm[2] : sm[1].trim();
        break;
      }
    }

    var seeds = "";
    var seedP = [
      /👤\s*(?:Seeders?:?\s*)?(\d+)/i,
      /Seeders?:?\s*(\d+)/i,
      /(\d+)\s*seed/i,
    ];
    for (var j = 0; j < seedP.length; j++) {
      var se = rawAll.match(seedP[j]);
      if (se) {
        seeds = se[1];
        break;
      }
    }

    var source = "";
    var srcP = [
      /🔗\s*(?:Source:?\s*)?([\w\.\-]+)/i,
      /Source:?\s*([\w\.\-]+)/i,
      /\[([A-Z0-9\-]+)\]/,
    ];
    for (var k = 0; k < srcP.length; k++) {
      var srm = rawAll.match(srcP[k]);
      if (srm) {
        source = srm[1];
        break;
      }
    }

    return {
      name: name,
      infoHash: st.infoHash || "",
      fileIdx: st.fileIdx,
      url: st.url || "",
      size: size,
      seeds: seeds,
      quality: qual,
      source: source,
    };
  }

  function formatStream(s) {
    var parts = [];
    var line1 = s.name;
    if (s.quality && line1.toUpperCase().indexOf(s.quality) === -1) {
      line1 += " [" + s.quality + "]";
    }
    parts.push(line1);

    var meta = [];
    if (s.size) meta.push("💾 " + s.size);
    if (s.seeds) meta.push("👤 " + s.seeds);
    if (s.source) meta.push("🔗 " + s.source);
    if (meta.length) parts.push(meta.join("  "));

    return parts.join("\n");
  }

  // ===================================================================
  // TORRSERVER
  // ===================================================================
  function getTorrServerUrl(path) {
    var host = tsHost();
    if (!host) return "";
    host = host.replace(/\/+$/, "");
    if (host.indexOf("http") !== 0) host = "http://" + host;
    return host + path;
  }

  function getTorrServerHeaders() {
    var headers = { "Content-Type": "application/json" };
    var pass = tsPass();
    if (pass) headers["Authorization"] = "Basic " + btoa("admin:" + pass);
    return headers;
  }

  function buildMagnet(infoHash) {
    var magnet = "magnet:?xt=urn:btih:" + infoHash;
    var trackers = [
      "udp://tracker.opentrackr.org:1337/announce",
      "udp://open.stealth.si:80/announce",
      "udp://tracker.torrent.eu.org:451/announce",
    ];
    trackers.forEach(function (t) {
      magnet += "&tr=" + encodeURIComponent(t);
    });
    return magnet;
  }

  function playTorrServer(stream, title, poster) {
    if (!tsHost()) {
      Lampa.Noty.show("Chưa cấu hình TorrServer!");
      return;
    }

    Lampa.Noty.show("Đang gửi lên TorrServer...");

    var url = getTorrServerUrl("/torrents");
    var headers = getTorrServerHeaders();

    fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        action: "add",
        link: buildMagnet(stream.infoHash),
        title: title || "",
        poster: poster || "",
        save_to_db: false,
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("TorrServer: " + r.status);
        return r.json();
      })
      .then(function (data) {
        var hash = data.hash || stream.infoHash;
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve(hash);
          }, 2000);
        });
      })
      .then(function (hash) {
        return fetch(url, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ action: "get", hash: hash }),
        })
          .then(function (r) {
            return r.json();
          })
          .then(function (info) {
            return { hash: hash, info: info };
          });
      })
      .then(function (result) {
        var hash = result.hash;
        var info = result.info;

        var files = [];
        if (info && info.file_stats) {
          files = info.file_stats
            .filter(function (f) {
              return (f.path || "")
                .toLowerCase()
                .match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);
            })
            .sort(function (a, b) {
              return (a.id || 0) - (b.id || 0);
            });
        }

        var playFile = function (fileUrl) {
          Lampa.Player.play({ title: title, url: fileUrl, poster: poster });
        };

        if (!files.length) {
          playFile(
            getTorrServerUrl(
              "/stream/fname?link=" + hash + "&index=0&play"
            )
          );
          return;
        }

        if (files.length === 1) {
          playFile(
            getTorrServerUrl(
              "/stream/fname?link=" +
                hash +
                "&index=" +
                (files[0].id || 0) +
                "&play"
            )
          );
          return;
        }

        if (
          stream.fileIdx !== undefined &&
          stream.fileIdx !== null &&
          stream.fileIdx >= 0
        ) {
          var idx = files[stream.fileIdx]
            ? files[stream.fileIdx].id
            : stream.fileIdx;
          playFile(
            getTorrServerUrl(
              "/stream/fname?link=" + hash + "&index=" + idx + "&play"
            )
          );
          return;
        }

        Lampa.Select.show({
          title: "Chọn file",
          items: files.map(function (f) {
            var filename = (f.path || "").split("/").pop();
            var sz = f.length
              ? " (" + (f.length / 1048576).toFixed(0) + " MB)"
              : "";
            return { title: filename + sz, value: f };
          }),
          onSelect: function (item) {
            playFile(
              getTorrServerUrl(
                "/stream/fname?link=" +
                  hash +
                  "&index=" +
                  item.value.id +
                  "&play"
              )
            );
          },
          onBack: function () {
            Lampa.Controller.toggle("content");
          },
        });
      })
      .catch(function (e) {
        Lampa.Noty.show("Lỗi TorrServer: " + (e.message || ""));
      });
  }

  // ===================================================================
  // SHOW TORRENT STREAMS MENU
  // ===================================================================
  function showTorrentStreamsMenu(streams, title, poster) {
    if (!streams || !streams.length) {
      Lampa.Noty.show("Không tìm thấy torrent");
      return;
    }

    var hasTorrServer = !!tsHost();
    var parsed = streams.slice(0, 40).map(parseStream);

    Lampa.Select.show({
      title:
        "Torrent: " +
        title +
        " (" +
        parsed.length +
        ")" +
        (hasTorrServer ? " → TS" : ""),
      items: parsed.map(function (s) {
        return { title: formatStream(s), value: s };
      }),
      onSelect: function (item) {
        var s = item.value;

        if (hasTorrServer && s.infoHash) {
          playTorrServer(s, title, poster);
        } else if (s.url) {
          Lampa.Player.play({ title: title, url: s.url, poster: poster });
        } else {
          Lampa.Noty.show(
            s.infoHash
              ? "Chưa cấu hình TorrServer!"
              : "Không có link phát"
          );
        }
      },
      onBack: function () {
        Lampa.Controller.toggle("content");
      },
    });
  }

  // ===================================================================
  // PLAY TORRENT MOVIE
  // ===================================================================
  function playTorrentMovie(card) {
    var title = card.title || card.name || "";
    var poster = card.poster_path
      ? "https://image.tmdb.org/t/p/w500" + card.poster_path
      : card.img || card.poster || "";
    var imdbId =
      card.imdb_id ||
      (card.external_ids && card.external_ids.imdb_id) ||
      "";
    var tmdbId = card.id;

    if (!imdbId && tmdbId) {
      Lampa.Noty.show("Đang lấy IMDB ID...");
      getImdbId("movie", tmdbId).then(function (id) {
        if (!id) {
          Lampa.Noty.show("Không tìm thấy IMDB ID");
          return;
        }
        card.imdb_id = id;
        playTorrentMovie(card);
      });
      return;
    }

    if (!imdbId) {
      Lampa.Noty.show("Không có IMDB ID");
      return;
    }

    Lampa.Noty.show("Đang tìm torrent...");

    var url = buildTorrentioUrl("movie", imdbId);

    fetchTorrentStreams(url)
      .then(function (streams) {
        if (!streams.length) {
          Lampa.Noty.show("Không tìm thấy torrent");
          return;
        }
        showTorrentStreamsMenu(streams, title, poster);
      })
      .catch(function (e) {
        Lampa.Noty.show("Lỗi: " + (e.message || "Không thể tải torrent"));
      });
  }

  // ===================================================================
  // PLAY TORRENT TV
  // ===================================================================
  function playTorrentTV(card) {
    var title = card.title || card.name || "";
    var poster = card.poster_path
      ? "https://image.tmdb.org/t/p/w500" + card.poster_path
      : card.img || card.poster || "";
    var imdbId =
      card.imdb_id ||
      (card.external_ids && card.external_ids.imdb_id) ||
      "";
    var tmdbId = card.id;

    if (!imdbId && tmdbId) {
      Lampa.Noty.show("Đang lấy IMDB ID...");
      getImdbId("tv", tmdbId).then(function (id) {
        if (!id) {
          Lampa.Noty.show("Không tìm thấy IMDB ID");
          return;
        }
        card.imdb_id = id;
        playTorrentTV(card);
      });
      return;
    }

    if (!imdbId) {
      Lampa.Noty.show("Không có IMDB ID");
      return;
    }

    Lampa.Noty.show("Đang tải seasons...");

    getTMDBSeasons(tmdbId)
      .then(function (seasons) {
        if (!seasons.length) {
          Lampa.Noty.show("Không tìm thấy seasons");
          return;
        }

        if (seasons.length === 1) {
          selectTorrentEpisode(seasons[0], imdbId, title, poster);
          return;
        }

        Lampa.Select.show({
          title: "Chọn Season",
          items: seasons.map(function (s) {
            var count = s.episode_count
              ? " (" + s.episode_count + " tập)"
              : "";
            return { title: s.name + count, value: s };
          }),
          onSelect: function (item) {
            selectTorrentEpisode(item.value, imdbId, title, poster);
          },
          onBack: function () {
            Lampa.Controller.toggle("content");
          },
        });
      })
      .catch(function () {
        Lampa.Noty.show("Lỗi tải seasons");
      });
  }

  function selectTorrentEpisode(season, imdbId, title, poster) {
    var items = [];
    var epCount = season.episode_count || 10;

    for (var i = 1; i <= epCount; i++) {
      items.push({
        title:
          "S" + padZero(season.season_number) + "E" + padZero(i),
        value: { s: season.season_number, e: i },
      });
    }

    Lampa.Select.show({
      title: season.name,
      items: items,
      onSelect: function (item) {
        var s = item.value.s;
        var e = item.value.e;
        var epTitle = title + " S" + padZero(s) + "E" + padZero(e);

        Lampa.Noty.show("Đang tìm " + epTitle + "...");

        var url = buildTorrentioUrl("tv", imdbId, s, e);

        fetchTorrentStreams(url)
          .then(function (streams) {
            if (!streams.length) {
              Lampa.Noty.show("Không tìm thấy");
              return;
            }
            showTorrentStreamsMenu(streams, epTitle, poster);
          })
          .catch(function (e) {
            Lampa.Noty.show("Lỗi: " + (e.message || ""));
          });
      },
      onBack: function () {
        Lampa.Controller.toggle("content");
      },
    });
  }

  // ===================================================================
  // MAIN: SHOW PLAY OPTIONS - Menu chính khi nhấn nút "Tìm phim"
  // ===================================================================
  function showPlayOptions(card) {
    var title = card.title || card.name || card.original_title || card.original_name || "";
    var origTitle = card.original_title || card.original_name || "";
    var year = (card.release_date || card.first_air_date || "").substring(0, 4);
    var isTV =
      card.number_of_seasons > 0 ||
      (card.first_air_date && !card.release_date) ||
      card.media_type === "tv";
    var poster = card.poster_path
      ? "https://image.tmdb.org/t/p/w500" + card.poster_path
      : card.img || card.poster || "";

    var menuItems = [];

    // Option 1: KKPhim
    menuItems.push({
      title: "🎬 KKPhim - Tìm: " + title,
      value: "kkphim",
    });

    // Option 2: OPhim
    menuItems.push({
      title: "🎬 OPhim - Tìm: " + title,
      value: "ophim",
    });

    // Option 3: Torrent (Torrentio)
    menuItems.push({
      title: "🧲 Torrent" + (tsHost() ? " → TorrServer" : ""),
      value: "torrent",
    });

    Lampa.Select.show({
      title: "Tìm phim: " + title,
      items: menuItems,
      onSelect: function (item) {
        if (item.value === "torrent") {
          // Torrent
          if (isTV) {
            playTorrentTV(card);
          } else {
            playTorrentMovie(card);
          }
        } else {
          // KKPhim hoặc OPhim
          var source = SOURCES[item.value];
          if (!source) return;

          Lampa.Noty.show("Đang tìm trên " + source.name + "...");

          var searchTerms = [origTitle || title];
          if (origTitle && title !== origTitle) searchTerms.push(title);

          (async function () {
            var foundSlug = null;

            for (var i = 0; i < searchTerms.length; i++) {
              if (foundSlug) break;
              var items = await searchSource(source, searchTerms[i]);
              var best = findBestMatch(items, title, origTitle, year);
              if (best && best.slug) {
                foundSlug = best.slug;
              }
            }

            if (!foundSlug) {
              Lampa.Noty.show(
                "Không tìm thấy trên " + source.name
              );

              // Hiện kết quả tìm kiếm để user tự chọn
              var allItems = await searchSource(source, title);
              if (!allItems.length && origTitle) {
                allItems = await searchSource(source, origTitle);
              }

              if (allItems.length) {
                Lampa.Select.show({
                  title: "Kết quả từ " + source.name,
                  items: allItems.map(function (it) {
                    return {
                      title:
                        (it.name || "") +
                        (it.origin_name
                          ? " (" + it.origin_name + ")"
                          : "") +
                        (it.year ? " [" + it.year + "]" : ""),
                      value: it,
                    };
                  }),
                  onSelect: function (sel) {
                    if (sel.value && sel.value.slug) {
                      loadAndPlay(source, sel.value.slug, card);
                    }
                  },
                  onBack: function () {
                    Lampa.Controller.toggle("content");
                  },
                });
              }
              return;
            }

            loadAndPlay(source, foundSlug, card);
          })();
        }
      },
      onBack: function () {
        Lampa.Controller.toggle("content");
      },
    });
  }

  function loadAndPlay(source, slug, card) {
    Lampa.Noty.show("Đang tải phim...");

    fetchSourceDetail(source, slug)
      .then(function (data) {
        var episodes = data.episodes || [];

        if (!episodes.length) {
          Lampa.Noty.show("Không có tập phim");
          return;
        }

        playEpisode(card, episodes);
      })
      .catch(function () {
        Lampa.Noty.show("Lỗi tải phim");
      });
  }

  // ===================================================================
  // ĐĂNG KÝ NÚT VÀO CARD INFO CỦA LAMPA
  // ===================================================================
  function registerButton() {
    // Inject CSS cho selectbox
    if (!document.getElementById("kkphim-parser-css")) {
      var style = document.createElement("style");
      style.id = "kkphim-parser-css";
      style.textContent = [
        ".selectbox .selectbox-item__title {",
        "  white-space: pre-wrap !important;",
        "  overflow: visible !important;",
        "  text-overflow: unset !important;",
        "  -webkit-line-clamp: unset !important;",
        "  display: block !important;",
        "}",
        ".selectbox .selectbox-item {",
        "  height: auto !important;",
        "  max-height: none !important;",
        "  padding: 0.8em 1.5em !important;",
        "}",
      ].join("\n");
      document.head.appendChild(style);
    }

    // Theo dõi sự kiện 'full' (trang chi tiết phim) của Lampa
    Lampa.Listener.follow("full", function (e) {
      if (e.type === "complite") {
        var render = e.object.activity.render();
        if (!render || !render.length) return;

        var buttonsContainer = render.find(".full-start__buttons");
        if (!buttonsContainer.length) return;

        // Tránh duplicate
        if (buttonsContainer.find(".kkphim-parser-btn").length) return;

        var card = e.object.activity.card || {};

        // Tạo nút "Tìm phim"
        var btn = $(
          '<div class="full-start__button selector kkphim-parser-btn">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="22" height="22">' +
            '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/>' +
            "</svg>" +
            "<span>Tìm phim</span>" +
            "</div>"
        );

        btn.on("hover:enter", function () {
          showPlayOptions(card);
        });

        // Chèn nút vào đầu danh sách buttons
        buttonsContainer.prepend(btn);

        console.log(
          "[KKPhim Parser] Button added for:",
          card.title || card.name
        );
      }
    });
  }

  // ===================================================================
  // KHỞI ĐỘNG
  // ===================================================================
  function start() {
    console.log("[KKPhim Parser] Starting...");
    registerButton();
    console.log("[KKPhim Parser] Ready ✅");
  }

  if (window.appready) {
    start();
  } else {
    Lampa.Listener.follow("app", function (e) {
      if (e.type === "ready") {
        start();
      }
    });
  }
})();