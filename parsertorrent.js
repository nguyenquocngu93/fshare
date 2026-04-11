/* KKPhim Torrent Extension v1.2 - Fixed Stream Parsing + Jackett */
(function(){
'use strict';
if(window.__kkphim_torrent_started)return;
window.__kkphim_torrent_started=true;

function waitForCore(cb){
  var t=0;
  var iv=setInterval(function(){
    t++;
    if(window.__kkphim_ui_started){
      clearInterval(iv);
      cb();
    }
    if(t>100){
      clearInterval(iv);
      console.warn('[KKTorrent] Timeout waiting for core UI');
    }
  },100);
}

waitForCore(function(){ init(); });

function init(){

/* ---- HELPERS ---- */
function ls(){try{return JSON.parse(localStorage.getItem('kkphim_settings'))||{};}catch(e){return{};}}
function ss(o){try{var c=ls();Object.keys(o).forEach(function(k){c[k]=o[k];});localStorage.setItem('kkphim_settings',JSON.stringify(c));}catch(e){}}
function tsHost(){return ls().torrserver_host||'';}
function tsPass(){return ls().torrserver_password||'';}
function tioConf(){return ls().torrentio_config||'';}
function aioUrl(){return ls().aio_url||'';}
function jackettUrl(){return ls().jackett_url||'https://jac.maxvol.pro';}
function jackettKey(){return ls().jackett_key||'';}
function tEngine(){return ls().torrent_engine||'torrentio';}

var TIO_BASE='https://torrentio.strem.fun';
var TMDB_TOKEN='eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';

/* ---- UTILS ---- */
function dly(ms){return new Promise(function(r){setTimeout(r,ms);});}
function pd(n){return(n<10?'0':'')+n;}
function E(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ---- TORRENTIO CONFIG PARSER ---- */
function cTio(raw){
  if(!raw)return'';
  raw=String(raw).trim();
  if(!raw)return'';
  var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);
  if(m)return m[1];
  m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);
  if(m)return m[1];
  if(raw.indexOf('torrentio.strem.fun')>-1){
    raw=raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i,'')
           .replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i,'')
           .replace(/^\/+|\/+$/g,'');
    if(raw&&raw.indexOf('=')>-1)return raw.replace(/\|/g,'%7C');
    return'';
  }
  raw=raw.replace(/^\/+|\/+$/g,'').replace(/\|/g,'%7C');
  return raw.indexOf('=') === -1 ? '' : raw;
}

function cAio(raw){
  if(!raw)return'';
  return String(raw).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');
}

/* ================================================================
   STREAM PARSE - FIXED v1.2
   
   Torrentio format:
     name:  "Torrentio\n1080p"  hoặc  "[RD+] Torrentio\n4K"
     description: "👤 1080 💾 1.74 GB ⚙️ Torrentio\nFilename.mkv"
                  "👤 4 💾 4.47 GB ⚙️ Torrentio\nFilename.mkv"
   
   AIOStreams format:
     name: "AIOStreams\n[Prowlarr|RD] 1080p"
     description: "Size: 17.9 GB\nSeeds: 1080\nFilename.mkv"
     OR
     name: "Torrentio\n1080p"
     description: "👤 1080 💾 1.74 GB ⚙️ Torrentio\n..."
   ================================================================ */

function parseSize(str){
  /* Match: 1.74 GB | 363.47 MB | 4.47GB | 17.9 GB */
  var m = str.match(/(\d+(?:[.,]\d+)?)\s*(TB|GB|GiB|MB|MiB)/i);
  if(!m) return '';
  var num = m[1].replace(',','.');
  var unit = m[2].toUpperCase().replace('GIB','GB').replace('MIB','MB');
  return num + ' ' + unit;
}

function parseSeeds(str){
  /* Torrentio emoji format: 👤 4 💾 ... */
  var m = str.match(/👤\s*(\d+)/);
  if(m) return m[1];
  /* AIOStreams text format: Seeds: 42 */
  m = str.match(/[Ss]eeds?:?\s*(\d+)/);
  if(m) return m[1];
  /* Generic: Seeders: 42 */
  m = str.match(/[Ss]eeders?:?\s*(\d+)/);
  if(m) return m[1];
  return '';
}

function parseQuality(str){
  var m = str.match(/\b(2160p|4K|UHD|1080p|1080i|720p|480p|360p)\b/i);
  if(m) return m[1].toUpperCase();
  m = str.match(/\b(HDR10\+|HDR10|HDR|DV|Dolby.?Vision)\b/i);
  if(m) return m[1].toUpperCase();
  m = str.match(/\b(BluRay|BDRip|WEB-?DL|WEBRip|HDTV|CAM|TS)\b/i);
  if(m) return m[1].toUpperCase();
  return '';
}

function parseCodec(str){
  var m = str.match(/\b(H\.?265|HEVC|H\.?264|AVC|AV1|x265|x264)\b/i);
  if(m) return m[1].toUpperCase();
  return '';
}

function parseAudio(str){
  var m = str.match(/\b(Atmos|TrueHD|DTS-?HD|DTS|DD\+|EAC3|AC3|AAC|MP3)\b/i);
  if(m) return m[1].toUpperCase();
  return '';
}

function parseSource(str){
  /* Extract tracker/source name from description line ending ⚙️ Source */
  var m = str.match(/⚙️\s*([^\n\r]+)/);
  if(m) return m[1].trim();
  return '';
}

function pStream(st){
  var rawName    = String(st.name        || '');
  var rawDesc    = String(st.description || '');
  var rawTitle   = String(st.title       || '');

  /* --- Name: first line = provider, second line = quality label --- */
  var nameLines  = rawName.split(/\n/);
  var providerRaw = nameLines[0].trim();   /* e.g. "Torrentio", "[RD+] Torrentio", "AIOStreams" */
  var qualLabel   = (nameLines[1]||'').trim(); /* e.g. "1080p", "4K", "[Prowlarr|RD] 1080p" */

  /* Clean provider name - remove prefix badges like [RD+], [+], etc. */
  var provider = providerRaw.replace(/^\[[^\]]*\]\s*/,'').trim() || 'Stream';

  /* --- Description lines --- */
  var descLines = rawDesc.split(/\n/);

  /* --- Size --- */
  var size = '';
  /* Try description first (has 💾 emoji or "Size:") */
  for(var i=0;i<descLines.length;i++){
    size = parseSize(descLines[i]);
    if(size) break;
  }
  /* Fallback to name lines */
  if(!size) size = parseSize(rawName);
  /* Fallback to behaviorHints */
  if(!size && st.behaviorHints && st.behaviorHints.videoSize){
    var bytes = Number(st.behaviorHints.videoSize);
    if(!isNaN(bytes) && bytes > 0){
      if(bytes >= 1099511627776)      size = (bytes/1099511627776).toFixed(2)+' TB';
      else if(bytes >= 1073741824)    size = (bytes/1073741824).toFixed(2)+' GB';
      else if(bytes >= 1048576)       size = (bytes/1048576).toFixed(0)+' MB';
    }
  }

  /* --- Seeds --- */
  var seeds = '';
  for(var j=0;j<descLines.length;j++){
    seeds = parseSeeds(descLines[j]);
    if(seeds) break;
  }
  if(!seeds) seeds = parseSeeds(rawName);

  /* --- Quality --- */
  /* Priority: qualLabel > descLines > rawName > rawTitle */
  var quality = parseQuality(qualLabel);
  if(!quality){
    for(var k=0;k<descLines.length;k++){
      quality = parseQuality(descLines[k]);
      if(quality) break;
    }
  }
  if(!quality) quality = parseQuality(rawName+' '+rawTitle);

  /* --- Codec + Audio (bonus info) --- */
  var allText = rawName + '\n' + rawDesc + '\n' + rawTitle;
  var codec   = parseCodec(allText);
  var audio   = parseAudio(allText);

  /* --- Source tracker (from ⚙️) --- */
  var source = parseSource(rawDesc) || parseSource(rawName);

  /* --- Filename (last non-empty line of description usually) --- */
  var filename = '';
  for(var fi2=descLines.length-1;fi2>=0;fi2--){
    var dl = descLines[fi2].trim();
    /* Filename line: ends with video extension, no emojis, no "Seeds:" */
    if(dl && dl.match(/\.(mkv|mp4|avi|mov|ts|m2ts|webm)$/i) && !dl.match(/👤|💾|⚙️|Seeds?:/i)){
      filename = dl;
      break;
    }
  }

  /* --- Build display name --- */
  /* Format: "Provider [Quality] [Codec] [Audio]" */
  var displayName = provider;
  var badges = [];
  if(quality)  badges.push(quality);
  if(codec)    badges.push(codec);
  if(audio)    badges.push(audio);
  if(source && source !== provider) badges.push(source);
  if(badges.length) displayName += ' [' + badges.join('|') + ']';

  return {
    name:        displayName,
    rawName:     rawName,
    rawDesc:     rawDesc,
    provider:    provider,
    infoHash:    st.infoHash || '',
    fileIdx:     st.fileIdx,
    url:         st.url || '',
    size:        size,
    seeds:       seeds,
    quality:     quality,
    codec:       codec,
    audio:       audio,
    source:      source,
    filename:    filename
  };
}

function fmtStream(s){
  var line1 = s.name; /* Already has quality/codec/audio embedded */
  var meta = [];
  if(s.size)  meta.push('📦 ' + s.size);
  if(s.seeds) meta.push('🌱 ' + s.seeds);
  var line2 = meta.join('  ');
  /* Optional: show truncated filename */
  var line3 = '';
  if(s.filename){
    var fn = s.filename;
    if(fn.length > 50) fn = fn.substring(0,47)+'...';
    line3 = fn;
  }
  var parts = [line1];
  if(line2) parts.push(line2);
  if(line3) parts.push(line3);
  return parts.join('\n');
}

/* ---- TMDB IMDB LOOKUP ---- */
async function tFetch(path){
  var r=await fetch('https://api.themoviedb.org/3'+path,{
    headers:{'Authorization':'Bearer '+TMDB_TOKEN,'Content-Type':'application/json'}
  });
  if(!r.ok)throw new Error('TMDB '+r.status);
  return await r.json();
}

async function gImdb(type,id){
  if(!id)return null;
  try{return(await tFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}
  catch(e){return null;}
}

async function gSeasons(id){
  try{
    var r=await tFetch('/tv/'+id+'?language=vi-VN');
    if(r&&r.seasons)return r.seasons.filter(function(s){return s.season_number>0;}).map(function(s){
      return{
        season_number:s.season_number,
        name:s.name||('Season '+s.season_number),
        episode_count:s.episode_count||0,
        poster_path:s.poster_path||'',
        overview:s.overview||'',
        air_date:s.air_date||''
      };
    });
  }catch(e){}
  return[];
}

/* ---- TORRSERVER ---- */
function tsU(p){
  var h=tsHost();
  if(!h)return'';
  h=h.replace(/\/+$/,'');
  if(h.indexOf('http')!==0)h='http://'+h;
  return h+p;
}

function tsH(){
  var h={'Content-Type':'application/json'};
  var pw=tsPass();
  if(pw)h['Authorization']='Basic '+btoa('admin:'+pw);
  return h;
}

function bMag(h){
  var m='magnet:?xt=urn:btih:'+h;
  ['udp://tracker.opentrackr.org:1337/announce',
   'udp://open.stealth.si:80/announce',
   'udp://tracker.torrent.eu.org:451/announce'
  ].forEach(function(t){m+='&tr='+encodeURIComponent(t);});
  return m;
}

async function playTS(stream,title,poster,fi){
  if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
  Lampa.Noty.show('Đang gửi TorrServer...');
  try{
    var u=tsU('/torrents');
    var link = stream.infoHash ? bMag(stream.infoHash) : stream.url;
    var r=await fetch(u,{
      method:'POST',
      headers:tsH(),
      body:JSON.stringify({
        action:'add',
        link:link,
        title:title||'',
        poster:poster||'',
        save_to_db:false
      })
    });
    if(!r.ok)throw new Error('TS:'+r.status);
    var td=await r.json();
    var hash=td.hash||stream.infoHash;

    await dly(2000);

    var info=null;
    var rt=0;
    while(rt<3){
      try{
        var r2=await fetch(u,{
          method:'POST',
          headers:tsH(),
          body:JSON.stringify({action:'get',hash:hash})
        });
        info=await r2.json();
        if(info&&info.file_stats&&info.file_stats.length)break;
      }catch(e){}
      rt++;
      await dly(1500);
    }

    var files=[];
    if(info&&info.file_stats){
      files=info.file_stats.filter(function(f){
        return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);
      }).sort(function(a,b){return(a.id||0)-(b.id||0);});
    }

    var playFile=function(fileUrl){Lampa.Player.play({title:title,url:fileUrl});};

    if(!files.length){
      playFile(tsU('/stream/fname?link='+hash+'&index=0&play'));
    }else if(files.length===1){
      playFile(tsU('/stream/fname?link='+hash+'&index='+(files[0].id||0)+'&play'));
    }else if(fi!==undefined&&fi!==null&&fi>=0&&files[fi]){
      playFile(tsU('/stream/fname?link='+hash+'&index='+(files[fi].id||fi)+'&play'));
    }else{
      Lampa.Select.show({
        title:'Chọn file',
        items:files.map(function(f){
          return{
            title:(f.path||'').split('/').pop()+(f.length?' ('+(f.length/1048576).toFixed(0)+' MB)':''),
            value:f
          };
        }),
        onSelect:function(a){
          playFile(tsU('/stream/fname?link='+hash+'&index='+a.value.id+'&play'));
        },
        onBack:function(){Lampa.Controller.toggle('content');}
      });
    }
  }catch(e){Lampa.Noty.show('Lỗi TorrServer: '+(e.message||''));}
}

/* ---- URL BUILDERS ---- */
function tioU(type,imdb,s,e){
  var t=type==='tv'?'series':'movie';
  var id=imdb;
  if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;
  var c=cTio(tioConf());
  return TIO_BASE+(c?'/'+c:'')+'/stream/'+t+'/'+id+'.json';
}

function aioU(type,imdb,s,e){
  var base=cAio(aioUrl());
  if(!base)return'';
  var t=type==='tv'?'series':'movie';
  var id=imdb;
  if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;
  return base+'/stream/'+t+'/'+id+'.json';
}

/* ---- JACKETT SEARCH ---- */
async function searchJackett(query, cat){
  var base = jackettUrl().replace(/\/+$/,'');
  var key  = jackettKey();
  /* cat: 2000=Movies, 5000=TV */
  var url  = base + '/api/v2.0/indexers/all/results?apikey=' + encodeURIComponent(key)
           + '&Query=' + encodeURIComponent(query)
           + '&Category[]=' + (cat||2000);
  var r = await fetch(url);
  if(!r.ok) throw new Error('Jackett ' + r.status);
  var d = await r.json();
  var results = (d.Results || []);
  return results.map(function(item){
    var seeders = String(item.Seeders || 0);
    var sizebytes = item.Size || 0;
    var size = '';
    if(sizebytes >= 1099511627776)     size = (sizebytes/1099511627776).toFixed(2)+' TB';
    else if(sizebytes >= 1073741824)   size = (sizebytes/1073741824).toFixed(2)+' GB';
    else if(sizebytes >= 1048576)      size = (sizebytes/1048576).toFixed(0)+' MB';

    var title = item.Title || '';
    var quality = parseQuality(title);
    var codec   = parseCodec(title);
    var audio   = parseAudio(title);
    var tracker = item.Tracker || 'Jackett';

    var displayName = tracker;
    var badges = [];
    if(quality) badges.push(quality);
    if(codec)   badges.push(codec);
    if(audio)   badges.push(audio);
    if(badges.length) displayName += ' [' + badges.join('|') + ']';

    var magnet  = item.MagnetUri  || '';
    var infoHash = '';
    if(magnet){
      var hm = magnet.match(/urn:btih:([a-fA-F0-9]{40}|[A-Z2-7]{32})/i);
      if(hm) infoHash = hm[1].toLowerCase();
    }

    return {
      name:     displayName,
      rawName:  title,
      rawDesc:  '',
      provider: tracker,
      infoHash: infoHash,
      fileIdx:  undefined,
      url:      item.Link || magnet || '',
      size:     size,
      seeds:    seeders,
      quality:  quality,
      codec:    codec,
      audio:    audio,
      source:   tracker,
      filename: title
    };
  }).filter(function(s){ return s.infoHash || s.url; });
}

/* ---- FETCH STREAMS ---- */
async function fStreams(type,imdb,s,e){
  var eng=tEngine();
  if(eng === 'jackett'){
    /* Jackett: need to build search query */
    throw new Error('jackett-needs-query');
  }
  var url;
  if(eng==='aio'){
    url=aioU(type,imdb,s,e);
    if(!url)throw new Error('Chưa cấu hình AIOStreams URL');
  }else{
    url=tioU(type,imdb,s,e);
  }
  var r=await fetch(url);
  if(!r.ok)throw new Error((eng==='aio'?'AIOStreams':'Torrentio')+' HTTP '+r.status);
  var d=await r.json();
  return(d.streams||[]).map(pStream);
}

async function fStreamsWithTitle(type,imdb,s,e,title){
  var eng=tEngine();
  if(eng === 'jackett'){
    var cat = type==='tv' ? 5000 : 2000;
    var q   = title;
    if(type==='tv' && s && e) q += ' S'+pd(s)+'E'+pd(e);
    return await searchJackett(q, cat);
  }
  return await fStreams(type,imdb,s,e);
}

/* ---- MENU CSS ---- */
function injectTorrentMenuCSS(){
  var id='kk-torrent-menu-css';
  if($('#'+id).length)return;
  $('head').append(
    '<style id="'+id+'">'
    +'.selectbox .selectbox-item__title{'
    +'white-space:pre-wrap!important;'
    +'overflow:visible!important;'
    +'text-overflow:unset!important;'
    +'display:block!important;}'
    +'.selectbox .selectbox-item{'
    +'height:auto!important;'
    +'max-height:none!important;'
    +'min-height:60px!important;}'
    +'</style>'
  );
}

/* ---- SHOW STREAM LIST ---- */
function showStr(streams,title,poster){
  injectTorrentMenuCSS();
  var ts  = !!tsHost();
  var eng = tEngine();
  var engLabel = eng==='aio' ? 'AIOStreams' : eng==='jackett' ? 'Jackett' : 'Torrentio';

  if(!streams.length){
    Lampa.Noty.show('Không tìm thấy stream nào');
    return;
  }

  /* Sort: seeds desc */
  streams = streams.slice().sort(function(a,b){
    return (parseInt(b.seeds)||0) - (parseInt(a.seeds)||0);
  });

  Lampa.Select.show({
    title: engLabel + ': ' + title + ' (' + streams.length + ')' + (ts?' → TS':''),
    items: streams.slice(0,50).map(function(s){
      return{title:fmtStream(s), value:s};
    }),
    onSelect:function(a){
      var s=a.value;
      if(ts && (s.infoHash || s.url)){
        playTS(s,title,poster,s.fileIdx);
      }else if(s.url){
        Lampa.Player.play({title:title,url:s.url});
      }else{
        Lampa.Noty.show(s.infoHash ? 'Chưa cấu hình TorrServer!' : 'Không có link phát');
      }
    },
    onBack:function(){Lampa.Controller.toggle('content');}
  });
}

/* ---- MOVIE TORRENT ---- */
async function oTorMov(tid,title,poster,imdb){
  Lampa.Noty.show('Đang tìm torrent...');
  try{
    var id = imdb || await gImdb('movie',tid);
    if(!id && tEngine()!=='jackett'){
      Lampa.Noty.show('Không có IMDB ID');
      return;
    }
    var st = await fStreamsWithTitle('movie', id, null, null, title);
    if(!st.length){Lampa.Noty.show('Không có stream nào');return;}
    showStr(st,title,poster);
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}

/* ---- TV TORRENT ---- */
async function oTorTV(tid,title,poster,imdb){
  Lampa.Noty.show('Đang tải season...');
  try{
    var id = imdb || await gImdb('tv',tid);
    if(!id && tEngine()!=='jackett'){
      Lampa.Noty.show('Không có IMDB ID');
      return;
    }
    var sn = await gSeasons(tid);
    if(sn.length>1){
      Lampa.Select.show({
        title:'Chọn Season',
        items:sn.map(function(s){
          return{
            title:s.name+(s.episode_count?' ('+s.episode_count+' tập)':''),
            value:s
          };
        }),
        onSelect:function(a){pTorEp(a.value,id,title,poster);},
        onBack:function(){Lampa.Controller.toggle('content');}
      });
    }else if(sn.length===1){
      pTorEp(sn[0],id,title,poster);
    }else{
      var st = await fStreamsWithTitle('tv',id,1,1,title+' S01E01');
      if(st.length) showStr(st,title+' S01E01',poster);
      else Lampa.Noty.show('Không tìm thấy stream');
    }
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}

/* ---- EPISODE PICKER ---- */
function pTorEp(season,imdb,title,poster){
  var items=[];
  for(var i=1;i<=(season.episode_count||24);i++){
    items.push({
      title:'S'+pd(season.season_number)+'E'+pd(i),
      value:{s:season.season_number,e:i}
    });
  }
  Lampa.Select.show({
    title:season.name,
    items:items,
    onSelect:async function(a){
      var lb = title+' S'+pd(a.value.s)+'E'+pd(a.value.e);
      Lampa.Noty.show('Đang tìm '+lb+'...');
      try{
        var st = await fStreamsWithTitle('tv',imdb,a.value.s,a.value.e,lb);
        if(!st.length){Lampa.Noty.show('Không có stream');return;}
        showStr(st,lb,poster);
      }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
    },
    onBack:function(){Lampa.Controller.toggle('content');}
  });
}

/* ---- PLAY EPISODE DIRECT ---- */
async function playEpTorrent(imdbId,seasonNum,epNum,title,poster){
  var lb = title+' S'+pd(seasonNum)+'E'+pd(epNum);
  Lampa.Noty.show('Đang tìm torrent '+lb+'...');
  try{
    var st = await fStreamsWithTitle('tv',imdbId,seasonNum,epNum,lb);
    if(!st.length){Lampa.Noty.show('Không có stream');return;}
    showStr(st,lb,poster);
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}

/* ---- CSS ---- */
function injectTorrentCSS(){
  var id='kk-torrent-ext-css';
  if($('#'+id).length)return;
  $('head').append(
    '<style id="'+id+'">'
    +'.kk-src-btn--torrent{'
    +'background:linear-gradient(135deg,rgba(220,38,38,0.15),rgba(220,38,38,0.05))!important;'
    +'border:1px solid rgba(220,38,38,0.3)!important;}'
    +'.kk-src-btn--torrent:hover,.kk-src-btn--torrent.focus,.kk-src-btn--torrent.selected{'
    +'background:linear-gradient(135deg,rgba(220,38,38,0.3),rgba(220,38,38,0.1))!important;'
    +'border-color:rgba(220,38,38,0.6)!important;}'
    +'.kk-src-btn--aio{'
    +'background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(124,58,237,0.05))!important;'
    +'border:1px solid rgba(124,58,237,0.3)!important;}'
    +'.kk-src-btn--aio:hover,.kk-src-btn--aio.focus,.kk-src-btn--aio.selected{'
    +'background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(124,58,237,0.1))!important;'
    +'border-color:rgba(124,58,237,0.6)!important;}'
    +'.kk-src-btn--jackett{'
    +'background:linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))!important;'
    +'border:1px solid rgba(16,185,129,0.3)!important;}'
    +'.kk-src-btn--jackett:hover,.kk-src-btn--jackett.focus,.kk-src-btn--jackett.selected{'
    +'background:linear-gradient(135deg,rgba(16,185,129,0.3),rgba(16,185,129,0.1))!important;'
    +'border-color:rgba(16,185,129,0.6)!important;}'
    +'</style>'
  );
}

/* ---- BUTTON EVENT HELPER ---- */
function bE(el,fn){
  var sx=0,sy=0,mv=false,tc=false;
  el.on('touchstart',function(e){
    var t=((e.originalEvent||e).touches||[])[0];
    if(t){sx=t.clientX;sy=t.clientY;mv=false;}
  });
  el.on('touchmove',function(e){
    var t=((e.originalEvent||e).touches||[])[0];
    if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))mv=true;
  });
  el.on('touchend',function(e){
    if(mv)return;
    tc=true;
    e.preventDefault();
    e.stopPropagation();
    setTimeout(function(){fn.call(el[0],e);},100);
    setTimeout(function(){tc=false;},350);
  });
  el.on('click',function(e){
    if(tc||mv)return;
    e.preventDefault();
    e.stopPropagation();
    fn.call(this,e);
  });
}

/* ---- BUILD TORRENT BUTTON ---- */
function buildTorrentBtn(mt,tid,title,poster,imdb){
  var eng=tEngine();
  var label, css;
  if(eng==='aio'){
    label='AIOStreams'; css='kk-src-btn--aio';
  }else if(eng==='jackett'){
    label='Jackett'; css='kk-src-btn--jackett';
  }else{
    label='Torrentio'; css='kk-src-btn--torrent';
  }
  if(tsHost()) label += ' → TS';

  var btn=$('<div class="kk-src-btn '+css+' selector" style="width:100%">'
    +'<div class="kk-sb-main">'+label+'</div>'
    +'<div class="kk-sb-sub">Phát qua torrent</div>'
    +'</div>');

  var resolvedImdb = imdb || (window._kkphim_detCtx && window._kkphim_detCtx.imdbId) || null;

  if(mt==='movie'){
    bE(btn,function(){oTorMov(tid,title,poster,resolvedImdb);});
  }else{
    bE(btn,function(){oTorTV(tid,title,poster,resolvedImdb);});
  }
  return $('<div style="width:100%"></div>').append(btn);
}

/* ---- BUILD SETTINGS ---- */
function buildSettings(w, mg, mo, mi, si2, comp){
  var s = {};
  try{ s = JSON.parse(localStorage.getItem('kkphim_settings'))||{}; }catch(e){}

  /* Engine selector */
  var gEng = mg('Torrent Engine');
  var eng = s.torrent_engine||'torrentio';
  [
    {k:'torrentio', n:'Torrentio'},
    {k:'aio',       n:'AIOStreams'},
    {k:'jackett',   n:'Jackett (jac.maxvol.pro)'}
  ].forEach(function(o){
    gEng.append(mo(o.n,'',eng===o.k,function(){
      ss({torrent_engine:o.k});
      Lampa.Noty.show('Engine: '+o.n);
      comp.create();
    }));
  });
  w.append(gEng);

  /* Torrentio config */
  var gTio = mg('Torrentio Config');
  gTio.append(mi(
    'Torrentio Config URL',
    'Dán URL manifest hoặc chuỗi config từ torrentio.strem.fun/configure',
    s.torrentio_config||'(chưa cấu hình)',
    'Torrentio Config URL',
    'torrentio_config', s
  ));
  w.append(gTio);

  /* AIOStreams URL */
  var gAio = mg('AIOStreams URL');
  gAio.append(mi(
    'AIOStreams Base URL',
    'VD: https://aiostreams.example.com',
    s.aio_url||'(chưa cấu hình)',
    'AIOStreams Base URL',
    'aio_url', s
  ));
  w.append(gAio);

  /* Jackett */
  var gJac = mg('Jackett (jac.maxvol.pro)');
  gJac.append(mi(
    'Jackett URL',
    'Mặc định: https://jac.maxvol.pro',
    s.jackett_url||'https://jac.maxvol.pro',
    'Jackett URL',
    'jackett_url', s
  ));
  gJac.append(mi(
    'Jackett API Key',
    'API Key từ Jackett dashboard',
    s.jackett_key ? '••••••' : '(chưa nhập)',
    'Jackett API Key',
    'jackett_key', s
  ));

  /* Test Jackett button */
  var testJac = si2('Test Jackett','Kiểm tra kết nối Jackett','Thử');
  bE(testJac, function(){
    var base = jackettUrl();
    var key  = jackettKey();
    if(!key){Lampa.Noty.show('Chưa nhập Jackett API Key!');return;}
    Lampa.Noty.show('Đang kiểm tra Jackett...');
    fetch(base.replace(/\/+$/,'')+'/api/v2.0/indexers/all/results?apikey='+encodeURIComponent(key)+'&Query=test&Category[]=2000')
      .then(function(r){
        if(r.ok) Lampa.Noty.show('Jackett OK!');
        else     Lampa.Noty.show('Jackett lỗi: HTTP '+r.status);
      })
      .catch(function(e){Lampa.Noty.show('Không kết nối Jackett: '+(e.message||''));});
  });
  gJac.append(testJac);
  w.append(gJac);

  /* TorrServer */
  var gTS = mg('TorrServer');
  gTS.append(mi(
    'TorrServer Host',
    'VD: http://192.168.1.100:8090',
    s.torrserver_host||'(chưa cấu hình)',
    'TorrServer Host (bao gồm http://)',
    'torrserver_host', s
  ));
  gTS.append(mi(
    'TorrServer Password',
    'Để trống nếu không có password',
    s.torrserver_password ? '••••••' : '(không có)',
    'TorrServer Password',
    'torrserver_password', s
  ));

  /* Test TorrServer */
  var testTS = si2('Test TorrServer','Kiểm tra kết nối TorrServer','Thử');
  bE(testTS, function(){
    var host = tsHost();
    if(!host){Lampa.Noty.show('Chưa nhập TorrServer host!');return;}
    Lampa.Noty.show('Đang kiểm tra TorrServer...');
    fetch(tsU('/echo'),{method:'GET',headers:tsH()})
      .then(function(r){
        if(r.ok) Lampa.Noty.show('TorrServer OK! ✓');
        else     Lampa.Noty.show('Lỗi: HTTP '+r.status);
      })
      .catch(function(e){Lampa.Noty.show('Không kết nối được: '+(e.message||''));});
  });
  gTS.append(testTS);
  w.append(gTS);
}

/* ---- EXPOSE API ---- */
window.__kkphim_torrent = {
  buildTorrentBtn: buildTorrentBtn,
  buildSettings:   buildSettings,
  playEpTorrent:   playEpTorrent,
  oTorMov:         oTorMov,
  oTorTV:          oTorTV,
  fStreams:         fStreams,
  showStr:          showStr,
  tsHost:           tsHost,
  playTS:           playTS
};

/* ---- PATCH detCtx ---- */
function patchDetCtx(){
  try{
    Lampa.Listener.follow('activity',function(e){
      if(e.type==='start'||e.type==='push'){
        setTimeout(function(){
          try{
            var act = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
            if(act && act.component==='kkphim_tmdb_detail'){
              window._kkphim_detCtx = {imdbId: act.imdb_id||null};
            }
          }catch(e2){}
        },500);
      }
    });
  }catch(e){}
}

/* ---- STARTUP ---- */
injectTorrentMenuCSS();
injectTorrentCSS();
patchDetCtx();
console.log('[KKTorrent] v1.2 OK - Fixed stream parsing + Jackett support');

} /* end init() */
})();