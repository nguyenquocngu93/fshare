/* KKPhim Torrent Extension v2.2 - Fixed Jackett search language */
(function(){
'use strict';
if(window.__kkphim_torrent_started)return;
window.__kkphim_torrent_started=true;

function waitForCore(cb){
  var t=0;
  var iv=setInterval(function(){
    t++;
    if(window.__kkphim_ui_started){clearInterval(iv);cb();}
    if(t>100){clearInterval(iv);}
  },100);
}
waitForCore(init);

function init(){

var STG='kktorrent_';
function gs(k){
  try{var v=Lampa.Storage.get(STG+k,'');if(v)return v;}catch(e){}
  try{
    var ls=JSON.parse(localStorage.getItem('kkphim_settings')||'{}');
    var map={
      'torrserver_url':'torrserver_host',
      'torrserver_pass':'torrserver_password',
      'torrentio_config':'torrentio_config',
      'aio_url':'aio_url',
      'torrent_engine':'torrent_engine',
      'jackett_url':'jackett_url',
      'jackett_key':'jackett_key'
    };
    return ls[map[k]||k]||'';
  }catch(e){}
  return'';
}
function sv(k,v){try{Lampa.Storage.set(STG+k,v);}catch(e){}}

function getTsUrl(){
  var u=gs('torrserver_url');if(!u)return null;
  u=u.replace(/\/+$/,'');
  if(!/^https?:\/\//i.test(u))u='http://'+u;
  return u;
}
function getTsPass()  {return gs('torrserver_pass');}
function getTioConf() {return parseTioConf(gs('torrentio_config'));}
function getAioUrl()  {return gs('aio_url').replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');}
function getEngine()  {return gs('torrent_engine')||'torrentio';}
function getJacUrl()  {
  var u=gs('jackett_url');if(!u)return'';
  u=u.replace(/\/+$/,'');
  if(!/^https?:\/\//i.test(u))u='https://'+u;
  return u;
}
function getJacKey(){return gs('jackett_key');}

function parseTioConf(raw){
  if(!raw)return'';
  raw=String(raw).trim();
  var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);if(m)return m[1];
  m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);if(m)return m[1];
  if(raw.indexOf('torrentio.strem.fun')>-1){
    raw=raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i,'')
           .replace(/\/(manifest\.json|stream\/.*)?$/i,'')
           .replace(/^\/+|\/+$/g,'');
    return(raw.indexOf('=')>-1)?raw.replace(/\|/g,'%7C'):'';
  }
  raw=raw.replace(/^\/+|\/+$/g,'').replace(/\|/g,'%7C');
  return raw.indexOf('=')===-1?'':raw;
}

var TIO_BASE='https://torrentio.strem.fun';
var TMDB_KEY='4ef0d7355d9ffb5151e987764708ce96';

function pad(n){return(n<10?'0':'')+n;}

function fmtBytes(b){
  b=parseInt(b)||0;
  if(b>=1e12)return(b/1e12).toFixed(2)+' TB';
  if(b>=1e9) return(b/1e9).toFixed(2)+' GB';
  if(b>=1e6) return(b/1e6).toFixed(0)+' MB';
  return b?' B':'';
}

function parseSize(str){
  if(!str)return 0;
  var m=String(str).match(/([\d.,]+)\s*(TB|GB|MB|KB)/i);
  if(!m)return 0;
  var n=parseFloat(m[1].replace(',','.'));
  switch(m[2].toUpperCase()){
    case'TB':return n*1e12;
    case'GB':return n*1e9;
    case'MB':return n*1e6;
    case'KB':return n*1e3;
  }
  return n;
}

function makeMagnet(hash,name){
  return'magnet:?xt=urn:btih:'+hash.toLowerCase()
    +'&dn='+encodeURIComponent(name||'')
    +'&tr='+encodeURIComponent('udp://tracker.opentrackr.org:1337/announce')
    +'&tr='+encodeURIComponent('udp://open.stealth.si:80/announce')
    +'&tr='+encodeURIComponent('udp://tracker.torrent.eu.org:451/announce');
}

function getMediaType(card){
  if(card.number_of_seasons||card.first_air_date||
     card.type==='tv'||card.type==='series')return'series';
  return'movie';
}

function getImdbId(card){
  var id=card.imdb_id
    ||(card.ids&&card.ids.imdb)
    ||(card.external_ids&&card.external_ids.imdb_id)||'';
  if(id&&!/^tt/i.test(String(id)))id='tt'+id;
  return id||null;
}

function reguest(url,onOk,onFail){
  var net=new Lampa.Reguest();
  net.timeout(15000);
  net.silent(url,
    function(data){onOk(data);},
    function(a,b){
      var code=(a&&a.status)?a.status:0;
      (onFail||function(){})(code?'HTTP '+code:(b||'Error'));
    }
  );
}

/* ================================================================
   TORRSERVER
================================================================ */
function tsHeaders(){
  var h={'Content-Type':'application/json'};
  var p=getTsPass();
  if(p)h['Authorization']='Basic '+btoa('admin:'+p);
  return h;
}

function tsAdd(magnet,movieTitle,onDone,onFail){
  var tsUrl=getTsUrl();
  if(!tsUrl){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
  console.log('[KKTorrent] tsAdd title='+movieTitle);
  $.ajax({
    url:tsUrl+'/torrents',
    type:'POST',
    headers:tsHeaders(),
    data:JSON.stringify({
      action:'add',
      link:magnet,
      title:movieTitle,
      save_to_db:false
    }),
    dataType:'json',
    timeout:15000,
    success:function(data){
      var hash=(data&&data.hash)||'';
      console.log('[KKTorrent] tsAdd ok hash='+hash);
      onDone(hash);
    },
    error:function(xhr){
      console.log('[KKTorrent] tsAdd error HTTP'+xhr.status);
      if(onFail)onFail();
    }
  });
}

function tsGetFiles(hash,onDone){
  var tsUrl=getTsUrl();
  $.ajax({
    url:tsUrl+'/torrents',
    type:'POST',
    headers:tsHeaders(),
    data:JSON.stringify({action:'get',hash:hash}),
    dataType:'json',
    timeout:15000,
    success:function(data){
      var all=(data&&data.file_stats)||[];
      var files=all.filter(function(f){
        return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|webm|ts|m2ts|wmv|flv)$/);
      }).sort(function(a,b){
        return(a.path||'').localeCompare(b.path||'',undefined,{numeric:true});
      });
      console.log('[KKTorrent] tsGetFiles all='+all.length+' video='+files.length);
      onDone(files,data);
    },
    error:function(){onDone([],null);}
  });
}

function tsPlayFile(hash,fileId,movieTitle,card){
  var tsUrl=getTsUrl();
  var encodedTitle=encodeURIComponent(movieTitle||'video');
  var url=tsUrl+'/stream/'+encodedTitle+'?link='+hash+'&index='+fileId+'&play';
  console.log('[KKTorrent] Play:',url);
  Lampa.Player.play({title:movieTitle,url:url,movie:card||{}});
}

function tsAddAndPlay(magnet,hash,movieTitle,card,fileIdx){
  var tsUrl=getTsUrl();
  if(!tsUrl){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}

  Lampa.Noty.show('Đang thêm vào TorrServer...');

  tsAdd(magnet,movieTitle,function(returnedHash){
    var h=returnedHash||hash;
    if(!h){Lampa.Noty.show('Không lấy được hash!');return;}

    /* Torrentio có fileIdx → play luôn */
    if(fileIdx!==null&&fileIdx!==undefined&&fileIdx>=0){
      console.log('[KKTorrent] Direct play fileIdx='+fileIdx);
      tsPlayFile(h,fileIdx,movieTitle,card);
      return;
    }

    /* Jackett → đợi file list */
    Lampa.Noty.show('Đang tải danh sách file...');
    var tries=0;
    function tryGet(){
      tries++;
      tsGetFiles(h,function(files){
        if(!files.length&&tries<5){setTimeout(tryGet,2000);return;}
        if(!files.length){tsPlayFile(h,0,movieTitle,card);return;}
        if(files.length===1){tsPlayFile(h,files[0].id||0,movieTitle,card);return;}
        showFilePicker(files,h,movieTitle,card);
      });
    }
    setTimeout(tryGet,2000);

  },function(){
    if(hash)tsPlayFile(hash,0,movieTitle,card);
    else Lampa.Noty.show('TorrServer lỗi!');
  });
}

function showFilePicker(files,hash,movieTitle,card){
  Lampa.Select.show({
    title:'📂 Chọn file — '+movieTitle,
    items:files.map(function(f){
      var parts=(f.path||'').split('/');
      var fname=parts[parts.length-1]||f.path||'File';
      var sz=f.length?' — '+fmtBytes(f.length):'';
      var epM=fname.match(/[Ee](\d+)|[Сс](\d+)|\b(\d{2,3})\b/);
      var epLabel=epM?' [Ep '+(epM[1]||epM[2]||epM[3])+']':'';
      return{title:fname+epLabel,subtitle:sz.trim(),file:f};
    }),
    onSelect:function(item){
      tsPlayFile(hash,item.file.id||0,movieTitle,card);
    },
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}

/* ================================================================
   PARSE STREAM
================================================================ */
function parseStream(st){
  var rawName=String(st.name||'');
  var rawDesc=String(st.description||st.title||'');
  var nameLines=rawName.split(/[\n\r]+/);
  var provider=(nameLines[0]||'').replace(/^\[[^\]]*\]\s*/,'').trim()||'Stream';
  var qualLine=(nameLines[1]||'').replace(/^\[[^\]]*\]\s*/,'').trim();

  var size='';
  var sm=rawDesc.match(/💾\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i);
  if(sm)size=sm[1].trim();
  if(!size){sm=rawDesc.match(/[Ss]ize:?\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i);if(sm)size=sm[1].trim();}
  if(!size){sm=(rawName+' '+rawDesc).match(/\b([\d.,]+)\s*(TB|GB|GiB|MB|MiB)\b/i);if(sm)size=sm[1]+' '+sm[2];}
  if(!size&&st.behaviorHints&&st.behaviorHints.videoSize)size=fmtBytes(st.behaviorHints.videoSize);

  var seeds=0;
  var sdm=rawDesc.match(/👤\s*(\d+)/);
  if(sdm)seeds=parseInt(sdm[1]);
  if(!seeds){sdm=rawDesc.match(/[Ss]eeds?:?\s*(\d+)/);if(sdm)seeds=parseInt(sdm[1]);}

  var srcM=rawDesc.match(/⚙️\s*([^\n\r]+)/);
  var source=srcM?srcM[1].trim():'';

  var allText=rawName+' '+rawDesc;
  var qm=(qualLine+' '+allText).match(/\b(2160p|4K UHD|4K|UHD|1080p|1080i|720p|480p|360p)\b/i);
  var quality=qm?qm[1].toUpperCase():'';
  if(quality==='4K'||quality==='UHD'||quality==='4K UHD')quality='2160P';

  var cm=allText.match(/\b(HEVC|H\.?265|x265|H\.?264|x264|AVC|AV1)\b/i);
  var codec=cm?cm[1].toUpperCase()
    .replace('H.265','HEVC').replace('H265','HEVC')
    .replace('H.264','AVC').replace('H264','AVC'):'';

  var am=allText.match(/\b(Atmos|TrueHD|DTS-HD|DTS|EAC3|AC3|AAC)\b/i);
  var audio=am?am[1].toUpperCase():'';

  var badges=[];
  if(quality)badges.push(quality);
  if(codec)  badges.push(codec);
  if(audio)  badges.push(audio);
  if(source&&source!==provider&&source.length<20)badges.push(source);
  var displayName=provider+(badges.length?' ['+badges.join('|')+']':'');

  return{
    displayName:displayName,
    provider:provider,
    infoHash:(st.infoHash||'').toLowerCase(),
    fileIdx:(typeof st.fileIdx==='number')?st.fileIdx:null,
    url:st.url||'',
    size:size,
    sizeNum:parseSize(size),
    seeds:seeds,
    quality:quality,
    magnet:st.infoHash?makeMagnet(st.infoHash,displayName):''
  };
}

/* ================================================================
   TORRENTIO / AIOSTREAMS
================================================================ */
function buildTioUrl(type,imdbId,season,episode){
  var sType=type==='series'?'series':'movie';
  var id=imdbId;
  if(type==='series'&&season&&episode)id=imdbId+':'+season+':'+episode;
  var engine=getEngine();
  if(engine==='aio'){
    var base=getAioUrl();
    return base?base+'/stream/'+sType+'/'+id+'.json':null;
  }
  var cfg=getTioConf();
  return TIO_BASE+(cfg?'/'+cfg:'')+'/stream/'+sType+'/'+id+'.json';
}

function fetchTioStreams(url,cb){
  reguest(url,
    function(data){cb((data&&data.streams)||[]);},
    function(e){Lampa.Noty.show('Lỗi fetch stream: '+e);cb([]);}
  );
}

function showTioMenu(streams,movieTitle,card,season,episode){
  if(!streams||!streams.length){Lampa.Noty.show('Không tìm thấy stream!');return;}
  var tsUrl=getTsUrl();
  var label=getEngine()==='aio'?'AIOStreams':'Torrentio';
  var parsed=streams
    .map(parseStream)
    .filter(function(s){return s.infoHash||s.url;})
    .sort(function(a,b){return b.sizeNum-a.sizeNum;});
  if(!parsed.length){Lampa.Noty.show('Không có stream hợp lệ!');return;}
  Lampa.Select.show({
    title:'🧲 '+label+': '+movieTitle+' ('+parsed.length+')',
    items:parsed.map(function(s){
      return{
        title:s.displayName,
        subtitle:(s.seeds?'👤 '+s.seeds+'  ':'')+( s.size?'💾 '+s.size:''),
        s:s
      };
    }),
    onSelect:function(item){
      var s=item.s;
      if(!tsUrl){
        if(s.url)Lampa.Player.play({title:movieTitle,url:s.url,movie:card});
        else Lampa.Noty.show('Chưa cấu hình TorrServer!');
        return;
      }
      if(s.infoHash){
        tsAddAndPlay(s.magnet,s.infoHash,movieTitle,card,s.fileIdx);
      }else if(s.url){
        Lampa.Player.play({title:movieTitle,url:s.url,movie:card});
      }else{
        Lampa.Noty.show('Không có link!');
      }
    },
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}

function searchTio(card,season,episode){
  var title=card.title||card.name||'';
  var type=getMediaType(card);
  var imdbId=getImdbId(card);
  var label=getEngine()==='aio'?'AIOStreams':'Torrentio';
  var epLabel=(season&&episode)?' S'+pad(season)+'E'+pad(episode):'';
  var movieTitle=title+epLabel;

  Lampa.Noty.show(label+': đang tìm...');

  function run(id){
    var url=buildTioUrl(type,id,season,episode);
    if(!url){Lampa.Noty.show('Chưa cấu hình '+label+'!');return;}
    console.log('[KKTorrent] Tio URL:',url);
    fetchTioStreams(url,function(streams){
      showTioMenu(streams,movieTitle,card,season,episode);
    });
  }

  if(imdbId){run(imdbId);return;}

  reguest(
    'https://api.themoviedb.org/3/'+(type==='series'?'tv':'movie')+'/'+card.id
    +'/external_ids?api_key='+TMDB_KEY,
    function(d){
      var id=d&&d.imdb_id;
      if(id){card.imdb_id=id;run(id);}
      else Lampa.Noty.show('Không tìm thấy IMDB ID');
    },
    function(){Lampa.Noty.show('Lỗi lấy IMDB ID');}
  );
}

function searchTioTV(card){
  var total=card.number_of_seasons||1;
  function pickEp(s){
    var totalEps=getSeasonEpCount(card,s);
    var items=[];
    for(var e=1;e<=totalEps;e++)
      items.push({title:'S'+pad(s)+'E'+pad(e),s:s,e:e});
    Lampa.Select.show({
      title:'Season '+s+' — Chọn tập',items:items,
      onSelect:function(item){searchTio(card,item.s,item.e);},
      onBack:function(){Lampa.Controller.toggle('full');}
    });
  }
  if(total===1){pickEp(1);return;}
  var ss=[];
  for(var s=1;s<=total;s++)
    ss.push({title:'Season '+s+' ('+getSeasonEpCount(card,s)+' tập)',s:s});
  Lampa.Select.show({
    title:'Chọn Season',items:ss,
    onSelect:function(item){pickEp(item.s);},
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}

function getSeasonEpCount(card,season){
  if(card.seasons){
    var s=card.seasons.filter(function(x){return x.season_number===season;})[0];
    if(s&&s.episode_count)return s.episode_count;
  }
  return 50;
}

/* ================================================================
   JACKETT - v2.2 FIX: luôn dùng original_title (English) trước
================================================================ */
function fetchJackett(query,cb){
  var url=getJacUrl(),key=getJacKey();
  if(!url){Lampa.Noty.show('Chưa cấu hình Jackett URL!');cb([]);return;}
  if(!key){Lampa.Noty.show('Chưa nhập Jackett API Key!');cb([]);return;}

  var apiUrl=url+'/api/v2.0/indexers/all/results'
    +'?apikey='+encodeURIComponent(key)
    +'&Query='+encodeURIComponent(query)
    +'&Category[]=2000&Category[]=5000';

  console.log('[KKTorrent] Jackett query="'+query+'" url='+apiUrl);

  reguest(apiUrl,
    function(data){
      var d=typeof data==='string'?JSON.parse(data):data;
      var raw=(d&&d.Results)||[];
      console.log('[KKTorrent] Jackett raw='+raw.length);

      var results=raw.map(function(r){
        var magnet=r.MagnetUri||'';
        var link=r.Link||'';
        var hash='';
        if(magnet){
          var hm=magnet.match(/urn:btih:([a-fA-F0-9]{32,40})/i);
          if(hm)hash=hm[1].toLowerCase();
        }
        if(!magnet&&hash)magnet=makeMagnet(hash,r.Title||'');
        if(!magnet&&!link)return null;

        var qm=(r.Title||'').match(/\b(2160p|4K|UHD|1080p|720p|480p|BluRay|WEB-?DL|HDRip|HEVC|x265)\b/i);
        return{
          title:   r.Title||'',
          seeds:   parseInt(r.Seeders)||0,
          peers:   parseInt(r.Peers)||0,
          size:    fmtBytes(parseInt(r.Size)||0),
          sizeNum: parseInt(r.Size)||0,
          tracker: r.Tracker||r.TrackerId||'Jackett',
          quality: qm?qm[1]:'',
          hash:    hash,
          magnet:  magnet||makeMagnet(hash,r.Title||''),
          link:    link
        };
      }).filter(Boolean);

      results.sort(function(a,b){
        if(b.seeds!==a.seeds)return b.seeds-a.seeds;
        return b.sizeNum-a.sizeNum;
      });

      console.log('[KKTorrent] Jackett valid='+results.length);
      cb(results);
    },
    function(e){
      console.log('[KKTorrent] Jackett error:',e);
      Lampa.Noty.show('Jackett lỗi: '+e);
      cb([]);
    }
  );
}

function searchJackett(card){
  /* 
   * FIX v2.2: Jackett cần tên tiếng Anh (original)
   * card.original_title / card.original_name = "Fantastic Four"
   * card.title / card.name = "Bộ Tứ Siêu Đẳng" ← KHÔNG dùng cái này
   */
  var title = card.title || card.name || '';
  var orig  = card.original_title || card.original_name || '';
  var year  = (card.release_date || card.first_air_date || '').slice(0,4);

  /* Xác định query ưu tiên: original_title (English) */
  var primaryQuery = orig || title;

  console.log('[KKTorrent] Jackett search:'
    +' orig="'+orig+'"'
    +' title="'+title+'"'
    +' year='+year
    +' → using "'+primaryQuery+'"'
  );

  /* Attempt 1: original + year */
  var q1 = primaryQuery + (year ? ' ' + year : '');
  Lampa.Noty.show('Jackett: tìm "' + primaryQuery + '"...');

  fetchJackett(q1, function(r1){
    if(r1.length){
      showPackMenu(r1, title, 'Jackett', card);
      return;
    }

    /* Attempt 2: original không có year */
    if(year){
      fetchJackett(primaryQuery, function(r2){
        if(r2.length){
          showPackMenu(r2, title, 'Jackett', card);
          return;
        }

        /* Attempt 3: nếu orig khác title → thử title tiếng Việt (last resort) */
        if(orig && orig !== title){
          var q3 = title + (year ? ' ' + year : '');
          console.log('[KKTorrent] Jackett fallback to Vietnamese: "'+q3+'"');
          fetchJackett(q3, function(r3){
            showPackMenu(r3, title, 'Jackett', card);
          });
        } else {
          showPackMenu([], title, 'Jackett', card);
        }
      });
    } else {
      /* Không có year, thử title nếu khác orig */
      if(orig && orig !== title){
        var q3b = title + (year ? ' ' + year : '');
        fetchJackett(q3b, function(r3b){
          showPackMenu(r3b, title, 'Jackett', card);
        });
      } else {
        showPackMenu([], title, 'Jackett', card);
      }
    }
  });
}

/* ================================================================
   PACK MENU
================================================================ */
function showPackMenu(results,movieTitle,label,card){
  if(!results||!results.length){
    Lampa.Noty.show(label+': Không tìm thấy kết quả!');
    return;
  }
  var tsUrl=getTsUrl();
  Lampa.Select.show({
    title:'🔍 '+label+': '+movieTitle+' ('+results.length+')',
    items:results.map(function(r){
      var info='['+r.tracker+']'+(r.quality?' '+r.quality:'');
      var t2=r.title.length>50?r.title.slice(0,47)+'...':r.title;
      return{
        title:    info+' — '+t2,
        subtitle: '👤 '+r.seeds+(r.peers?'/'+r.peers:'')+'  💾 '+r.size,
        r:r
      };
    }),
    onSelect:function(item){
      var r=item.r;
      if(!tsUrl){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
      if(!r.magnet&&!r.hash){Lampa.Noty.show('Không có magnet link!');return;}
      var magnet=r.magnet||makeMagnet(r.hash,r.title);
      tsAddAndPlay(magnet,r.hash,movieTitle,card,null);
    },
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}

/* ================================================================
   SOURCE MENU
================================================================ */
function showSourceMenu(card){
  var isSeries=getMediaType(card)==='series';
  var engine=getEngine();
  var tioLabel=engine==='aio'?'AIOStreams':'Torrentio';
  var tsUrl=getTsUrl();
  var tsSuffix=tsUrl?' → TS':'';

  Lampa.Select.show({
    title:'🎬 Chọn nguồn — '+(card.title||card.name||''),
    items:[
      {
        title:   '🧲 '+tioLabel+tsSuffix,
        subtitle:'Stream qua IMDB ID · nhanh & chính xác',
        value:   'tio'
      },
      {
        title:   '🔍 Jackett'+tsSuffix,
        subtitle:'Tìm theo tên gốc (English) trên Jackett',
        value:   'jackett'
      }
    ],
    onSelect:function(item){
      if(item.value==='tio'){
        if(isSeries)searchTioTV(card);
        else searchTio(card,null,null);
      }else if(item.value==='jackett'){
        searchJackett(card);
      }
    },
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}

/* ================================================================
   SETTINGS
================================================================ */
function initSettings(){
  if(!Lampa.SettingsApi||!Lampa.SettingsApi.addComponent)return;
  Lampa.SettingsApi.addComponent({
    component:'kktorrent',
    name:'KKTorrent',
    icon:'<svg viewBox="0 0 24 24" fill="none" width="24" height="24">'
        +'<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>'
        +'<polyline points="8 12 12 16 16 12" stroke="currentColor" stroke-width="1.5"/>'
        +'<line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="1.5"/>'
        +'</svg>'
  });
  setTimeout(function(){
    addParam('torrserver_url','input','TorrServer URL','VD: 192.168.1.100:8090');
    addParam('torrserver_pass','input','TorrServer Password','Để trống nếu không có');
    addBtn('test_ts','🧪 Test TorrServer','Kiểm tra kết nối',function(){
      var u=getTsUrl();
      if(!u){Lampa.Noty.show('Chưa nhập URL!');return;}
      Lampa.Noty.show('Đang test...');
      $.ajax({
        url:u+'/echo',type:'GET',timeout:5000,
        success:function(){Lampa.Noty.show('✅ TorrServer OK!');},
        error:function(xhr){Lampa.Noty.show(xhr.status===200?'✅ OK!':'❌ HTTP '+(xhr.status||'timeout'));}
      });
    });
    addSel('torrent_engine','Torrent Engine','',{torrentio:'Torrentio',aio:'AIOStreams'});
    addParam('torrentio_config','input','Torrentio Config','URL manifest từ torrentio.strem.fun/configure');
    addParam('aio_url','input','AIOStreams URL','VD: https://aio.yourdomain.com/manifest.json');
    addParam('jackett_url','input','Jackett URL','VD: https://jac.maxvol.pro');
    addParam('jackett_key','input','Jackett API Key','Từ Jackett Dashboard → Settings');
    addBtn('test_jac','🧪 Test Jackett','Kiểm tra kết nối',function(){
      var u=getJacUrl(),k=getJacKey();
      if(!u){Lampa.Noty.show('Chưa nhập URL!');return;}
      if(!k){Lampa.Noty.show('Chưa nhập Key!');return;}
      Lampa.Noty.show('Đang test...');
      reguest(u+'/api/v2.0/indexers/all/results?apikey='+k+'&Query=test&Category[]=2000',
        function(){Lampa.Noty.show('✅ Jackett OK!');},
        function(e){Lampa.Noty.show('❌ '+e);}
      );
    });
  },200);
}

function addParam(key,type,name,desc){
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+key,type:type,values:'',default:''},
    field:{name:name,description:desc||''},
    onChange:function(v){sv(key,v);}
  });
}
function addSel(key,name,desc,values){
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+key,type:'select',values:values,default:'torrentio'},
    field:{name:name,description:desc||''},
    onChange:function(v){sv(key,v);}
  });
}
function addBtn(key,name,desc,fn){
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+key,type:'button',default:''},
    field:{name:name,description:desc||''},
    onChange:fn
  });
}

/* ================================================================
   EXPOSE API
================================================================ */
window.__kkphim_torrent={
  buildTorrentBtn:function(mt,tid,title,poster,imdb){
    if(!$('#kkt-btn-css').length){
      $('head').append('<style id="kkt-btn-css">'
        +'.kk-btn--tor{background:linear-gradient(135deg,rgba(220,38,38,.18),rgba(220,38,38,.06))!important;'
        +'border:1px solid rgba(220,38,38,.4)!important;}'
        +'.kk-btn--tor.focus,.kk-btn--tor.selected{'
        +'border-color:rgba(220,38,38,.9)!important;background:rgba(220,38,38,.22)!important;}'
        +'</style>');
    }
    var card={id:tid,title:title,name:title,poster:poster,imdb_id:imdb,type:mt==='tv'?'tv':'movie'};
    var btn=$('<div class="kk-src-btn kk-btn--tor selector" style="width:100%">'
      +'<div class="kk-sb-main">🧲 Torrent</div>'
      +'<div class="kk-sb-sub">Torrentio / Jackett</div>'
      +'</div>');
    var sx=0,sy=0,mv=false,tc=false;
    btn.on('touchstart',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;mv=false;}});
    btn.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>10||Math.abs(t.clientY-sy)>10))mv=true;});
    btn.on('touchend',function(e){if(mv)return;tc=true;e.preventDefault();e.stopPropagation();setTimeout(function(){showSourceMenu(card);},150);setTimeout(function(){tc=false;},500);});
    btn.on('click',function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();showSourceMenu(card);});
    return $('<div style="width:100%"></div>').append(btn);
  },

  buildJackettBtn:function(){return$('');},

  buildSettings:function(w,mg,mo,mi,si2,comp){
    var s={};
    try{s=JSON.parse(localStorage.getItem('kkphim_settings')||'{}');}catch(e){}
    var gTS=mg('TorrServer');
    gTS.append(mi('Host','VD: http://192.168.1.100:8090',s.torrserver_host||'(chưa)','TorrServer Host','torrserver_host',s));
    gTS.append(mi('Password','',s.torrserver_password?'••••':'(không có)','Password','torrserver_password',s));
    w.append(gTS);
    var gE=mg('Engine');
    [{k:'torrentio',n:'Torrentio'},{k:'aio',n:'AIOStreams'}].forEach(function(o){
      var eng=s.torrent_engine||'torrentio';
      gE.append(mo(o.n,'',eng===o.k,function(){
        var c2=JSON.parse(localStorage.getItem('kkphim_settings')||'{}');
        c2.torrent_engine=o.k;localStorage.setItem('kkphim_settings',JSON.stringify(c2));
        Lampa.Noty.show('Engine: '+o.n);comp.create();
      }));
    });
    w.append(gE);
    var gT=mg('Torrentio');
    gT.append(mi('Config','',s.torrentio_config||'(chưa)','Torrentio Config','torrentio_config',s));
    w.append(gT);
    var gA=mg('AIOStreams');
    gA.append(mi('URL','',s.aio_url||'(chưa)','AIOStreams URL','aio_url',s));
    w.append(gA);
    var gJ=mg('Jackett');
    gJ.append(mi('URL','VD: https://jac.maxvol.pro',s.jackett_url||'(chưa)','Jackett URL','jackett_url',s));
    gJ.append(mi('API Key','',s.jackett_key?'••••':'(chưa)','Jackett API Key','jackett_key',s));
    w.append(gJ);
  },

  playEpTorrent:function(imdbId,sNum,eNum,title,poster){
    var card={id:0,title:title,name:title,poster:poster,imdb_id:imdbId,type:'tv'};
    searchTio(card,sNum,eNum);
  },

  showSourceMenu:showSourceMenu,
  getTsUrl:getTsUrl
};

/* ================================================================
   HOOK full card
================================================================ */
Lampa.Listener.follow('full',function(e){
  if(e.type!=='complite')return;
  var card=e.data&&e.data.movie?e.data.movie:(e.object&&e.object.card);
  if(!card)return;
  var $ctx=e.object&&e.object.activity
    ?e.object.activity.render()
    :(e.object&&e.object.render?e.object.render():null);
  if(!$ctx)return;
  if($ctx.find('.view--kktorrent').length)return;

  var isSeries=getMediaType(card)==='series';

  function mkBtn(cls,svgInner,label,fn){
    var $b=$(
      '<div class="full-start__button selector '+cls+'">'
      +'<svg viewBox="0 0 24 24" fill="none" width="44" height="44" '
      +'stroke="currentColor" stroke-width="1.5" '
      +'stroke-linecap="round" stroke-linejoin="round">'
      +svgInner+'</svg>'
      +'<span>'+label+'</span>'
      +'</div>'
    );
    $b.on('hover:enter',fn);
    return $b;
  }

  var $tor=mkBtn('view--kktorrent',
    '<circle cx="12" cy="12" r="10"/>'
    +'<polyline points="8 12 12 16 16 12"/>'
    +'<line x1="12" y1="8" x2="12" y2="16"/>',
    'Torrent',
    function(){showSourceMenu(card);}
  );

  var $anchor=$ctx.find('.view--torrent');
  if($anchor.length)$anchor.after($tor);
  else $ctx.find('.full-start__buttons').append($tor);
});

/* ================================================================
   START
================================================================ */
function start(){
  initSettings();
  console.log('[KKTorrent] v2.2 loaded | engine='+getEngine()+' | ts='+getTsUrl());
}

if(window.appready)start();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')start();});

}/* end init */
})();