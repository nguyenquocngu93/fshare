/* KKPhim Torrent Extension v2.0 - Based on working reference */
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

/* ================================================================
   STORAGE - dùng Lampa.Storage như reference
================================================================ */
var STG='kktorrent_';
function gs(k){return Lampa.Storage.get(STG+k,'')||'';}
function ss2(k,v){Lampa.Storage.set(STG+k,v);}

function getTsUrl(){
  var u=gs('torrserver_url');if(!u)return null;
  u=u.replace(/\/+$/,'');
  if(!/^https?:\/\//i.test(u))u='http://'+u;
  return u;
}
function getTsPass()   {return gs('torrserver_pass');}
function getTioConf()  {return parseTioConf(gs('torrentio_config'));}
function getAioUrl()   {return gs('aio_url').replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');}
function getEngine()   {return gs('torrent_engine')||'torrentio';}
function getJacUrl()   {
  var u=gs('jackett_url');if(!u)return'';
  u=u.replace(/\/+$/,'');
  if(!/^https?:\/\//i.test(u))u='https://'+u;
  return u;
}
function getJacKey()   {return gs('jackett_key');}

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

/* ================================================================
   HELPERS
================================================================ */
function pad(n){return(n<10?'0':'')+n;}

function fmtBytes(b){
  b=parseInt(b)||0;
  if(b>=1e12)return(b/1e12).toFixed(2)+' TB';
  if(b>=1e9) return(b/1e9).toFixed(2)+' GB';
  if(b>=1e6) return(b/1e6).toFixed(0)+' MB';
  return b+' B';
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
  if(card.number_of_seasons||card.first_air_date||card.type==='tv'||card.type==='series')return'series';
  return'movie';
}

function getImdbId(card){
  var id=card.imdb_id||(card.ids&&card.ids.imdb)||(card.external_ids&&card.external_ids.imdb_id)||'';
  if(id&&!/^tt/i.test(String(id)))id='tt'+id;
  return id||null;
}

/* Lampa.Reguest wrapper */
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
   TORRSERVER - copy từ reference, đã hoạt động
================================================================ */
function tsHeaders(){
  var h={'Content-Type':'application/json'};
  var p=getTsPass();if(p)h['Authorization']='Basic '+btoa('admin:'+p);
  return h;
}

function tsAdd(magnet,title,onDone,onFail){
  var tsUrl=getTsUrl();
  if(!tsUrl){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
  $.ajax({
    url:tsUrl+'/torrents',
    type:'POST',
    headers:tsHeaders(),
    data:JSON.stringify({action:'add',link:magnet,title:title||'',save_to_db:false}),
    dataType:'json',
    timeout:15000,
    success:function(data){onDone((data&&data.hash)||'');},
    error:function(){if(onFail)onFail();}
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
      var files=((data&&data.file_stats)||[])
        .filter(function(f){return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|webm|ts|m2ts|wmv|flv)$/);})
        .sort(function(a,b){return(a.path||'').localeCompare(b.path||'',undefined,{numeric:true});});
      onDone(files,data);
    },
    error:function(){onDone([],null);}
  });
}

function tsPlayFile(hash,fileId,title,card){
  var tsUrl=getTsUrl();
  var name=encodeURIComponent(title||'video');
  var url=tsUrl+'/stream/'+name+'?link='+hash+'&index='+fileId+'&play';
  console.log('[KKTorrent] Play:',url);
  Lampa.Player.play({title:title,url:url,movie:card});
}

function tsAddAndPlay(magnet,hash,torTitle,playTitle,card,fileIdx){
  var tsUrl=getTsUrl();
  if(!tsUrl){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}

  Lampa.Noty.show('Đang thêm vào TorrServer...');

  tsAdd(magnet,torTitle,function(returnedHash){
    var h=returnedHash||hash;
    if(!h){Lampa.Noty.show('Không lấy được hash!');return;}

    /* Nếu có fileIdx cụ thể (từ Torrentio) → play luôn */
    if(fileIdx!==undefined&&fileIdx!==null){
      tsPlayFile(h,fileIdx,playTitle,card);
      return;
    }

    Lampa.Noty.show('Đang tải danh sách file...');
    var tries=0;
    function tryGet(){
      tries++;
      tsGetFiles(h,function(files){
        if(!files.length&&tries<5){setTimeout(tryGet,2000);return;}
        if(!files.length){tsPlayFile(h,0,playTitle,card);return;}
        if(files.length===1){tsPlayFile(h,files[0].id||0,playTitle,card);return;}
        showFilePicker(files,h,playTitle,card);
      });
    }
    setTimeout(tryGet,2000);

  },function(){
    /* Fallback: play trực tiếp với hash gốc */
    if(hash){tsPlayFile(hash,0,playTitle,card);}
    else Lampa.Noty.show('TorrServer lỗi!');
  });
}

function showFilePicker(files,hash,playTitle,card){
  Lampa.Select.show({
    title:'📂 Chọn file — '+playTitle,
    items:files.map(function(f){
      var parts=( f.path||'').split('/');
      var fname=parts[parts.length-1]||f.path||'File';
      var sz=f.length?' — '+fmtBytes(f.length):'';
      return{title:fname,subtitle:sz.trim(),file:f};
    }),
    onSelect:function(item){
      var f=item.file;
      tsPlayFile(hash,f.id||0,playTitle+' — '+(f.path||'').split('/').pop(),card);
    },
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}

/* ================================================================
   PARSE TORRENTIO/AIO STREAM
   Confirmed format từ console log:
   name = "Torrentio\n1080p" | "AIOStreams\n[badge] 1080p"
   description = "👤 42 💾 1.74 GB ⚙️ YTS\nFilename.mkv"
              OR "Size: 56.4 GB\nSeeds: 15\nMovie.mkv"
================================================================ */
function parseStream(st){
  var rawName=String(st.name||'');
  var rawDesc=String(st.description||st.title||'');

  /* Provider = dòng 1 của name */
  var nameLines=rawName.split(/[\n\r]+/);
  var provider=(nameLines[0]||'').replace(/^\[[^\]]*\]\s*/,'').trim()||'Stream';

  /* Quality line = dòng 2 của name */
  var qualLine=(nameLines[1]||'').replace(/^\[[^\]]*\]\s*/,'').trim();

  /* SIZE - từ 💾 emoji hoặc "Size:" text */
  var size='';
  var sm=rawDesc.match(/💾\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i);
  if(sm)size=sm[1].trim();
  if(!size){sm=rawDesc.match(/[Ss]ize:?\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i);if(sm)size=sm[1].trim();}
  if(!size){sm=(rawName+' '+rawDesc).match(/\b([\d.,]+)\s*(TB|GB|GiB|MB|MiB)\b/i);if(sm)size=sm[1]+' '+sm[2];}
  if(!size&&st.behaviorHints&&st.behaviorHints.videoSize)size=fmtBytes(st.behaviorHints.videoSize);

  /* SEEDS - từ 👤 emoji hoặc "Seeds:" text */
  var seeds=0;
  var sdm=rawDesc.match(/👤\s*(\d+)/);
  if(sdm)seeds=parseInt(sdm[1]);
  if(!seeds){sdm=rawDesc.match(/[Ss]eeds?:?\s*(\d+)/);if(sdm)seeds=parseInt(sdm[1]);}

  /* SOURCE - từ ⚙️ */
  var srcM=rawDesc.match(/⚙️\s*([^\n\r]+)/);
  var source=srcM?srcM[1].trim():'';

  /* QUALITY */
  var allText=rawName+' '+rawDesc;
  var qm=( qualLine+' '+allText).match(/\b(2160p|4K UHD|4K|UHD|1080p|1080i|720p|480p|360p)\b/i);
  var quality=qm?qm[1].toUpperCase():'';
  if(quality==='4K'||quality==='UHD'||quality==='4K UHD')quality='2160P';

  /* CODEC */
  var cm=allText.match(/\b(HEVC|H\.?265|x265|H\.?264|x264|AVC|AV1)\b/i);
  var codec=cm?cm[1].toUpperCase().replace('H.265','HEVC').replace('H265','HEVC').replace('H.264','AVC').replace('H264','AVC'):'';

  /* AUDIO */
  var am=allText.match(/\b(Atmos|TrueHD|DTS-HD|DTS|EAC3|AC3|AAC)\b/i);
  var audio=am?am[1].toUpperCase():'';

  /* Display name */
  var badges=[];
  if(quality)badges.push(quality);
  if(codec)  badges.push(codec);
  if(audio)  badges.push(audio);
  if(source&&source!==provider&&source.length<25)badges.push(source);
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
    codec:codec,
    audio:audio,
    source:source,
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
  if(!streams||!streams.length){Lampa.Noty.show('Không tìm thấy stream nào!');return;}

  var tsUrl=getTsUrl();
  var label=getEngine()==='aio'?'AIOStreams':'Torrentio';

  /* Parse + sort by size */
  var parsed=streams
    .map(parseStream)
    .filter(function(s){return s.infoHash||s.url;})
    .sort(function(a,b){return b.sizeNum-a.sizeNum;});

  Lampa.Select.show({
    title:'🧲 '+label+': '+movieTitle+' ('+parsed.length+')',
    items:parsed.map(function(s){
      return{
        title:    s.displayName,
        subtitle: (s.seeds?'👤 '+s.seeds+'  ':'')+( s.size?'💾 '+s.size:''),
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
        /* Có fileIdx → dùng luôn, không cần picker */
        tsAddAndPlay(s.magnet,s.infoHash,s.displayName,movieTitle,card,s.fileIdx);
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

  Lampa.Noty.show(label+': đang tìm...');

  function run(id){
    var url=buildTioUrl(type,id,season,episode);
    if(!url){Lampa.Noty.show('Chưa cấu hình '+label+'!');return;}
    fetchTioStreams(url,function(streams){
      var epLabel=(season&&episode)?' S'+pad(season)+'E'+pad(episode):'';
      showTioMenu(streams,title+epLabel,card,season,episode);
    });
  }

  if(imdbId){run(imdbId);return;}

  /* Lấy IMDB ID từ TMDB */
  reguest(
    'https://api.themoviedb.org/3/'+(type==='series'?'tv':'movie')+'/'+card.id+'/external_ids?api_key='+TMDB_KEY,
    function(d){
      var id=d&&d.imdb_id;
      if(id){card.imdb_id=id;run(id);}
      else Lampa.Noty.show('Không tìm thấy IMDB ID');
    },
    function(){Lampa.Noty.show('Lỗi lấy IMDB ID');}
  );
}

/* TV: chọn season → episode */
function searchTioTV(card){
  var total=card.number_of_seasons||1;

  function pickEp(s){
    var totalEps=getSeasonEpCount(card,s);
    var items=[];
    for(var e=1;e<=totalEps;e++)items.push({title:'S'+pad(s)+'E'+pad(e),s:s,e:e});
    Lampa.Select.show({
      title:'Season '+s+' — Chọn tập',
      items:items,
      onSelect:function(item){searchTio(card,item.s,item.e);},
      onBack:function(){Lampa.Controller.toggle('full');}
    });
  }

  if(total===1){pickEp(1);return;}

  var ss=[];
  for(var s=1;s<=total;s++)ss.push({title:'Season '+s+' ('+getSeasonEpCount(card,s)+' tập)',s:s});
  Lampa.Select.show({
    title:'Chọn Season',
    items:ss,
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
   JACKETT
================================================================ */
function fetchJackett(query,cb){
  var url=getJacUrl(),key=getJacKey();
  if(!url){Lampa.Noty.show('Chưa cấu hình Jackett!');cb([]);return;}
  if(!key){Lampa.Noty.show('Chưa nhập Jackett API Key!');cb([]);return;}

  reguest(
    url+'/api/v2.0/indexers/all/results?apikey='+encodeURIComponent(key)
      +'&Query='+encodeURIComponent(query)
      +'&Category[]=2000&Category[]=5000',
    function(data){
      var d=typeof data==='string'?JSON.parse(data):data;
      var results=((d&&d.Results)||[]).map(function(r){
        var link=r.MagnetUri||r.Link||'';
        if(!link)return null;
        var hm=link.match(/btih:([a-f0-9]+)/i);
        var qm=(r.Title||'').match(/\b(2160p|4K|1080p|720p|480p|BluRay|WEB-?DL|HDRip)\b/i);
        return{
          title:   r.Title||'',
          seeds:   parseInt(r.Seeders)||0,
          size:    fmtBytes(parseInt(r.Size)||0),
          sizeNum: parseInt(r.Size)||0,
          tracker: r.Tracker||'Jackett',
          quality: qm?qm[1]:'',
          hash:    hm?hm[1].toLowerCase():'',
          magnet:  link
        };
      }).filter(Boolean).sort(function(a,b){return b.sizeNum-a.sizeNum;});
      cb(results);
    },
    function(e){Lampa.Noty.show('Jackett lỗi: '+e);cb([]);}
  );
}

function searchJackett(card){
  var title=card.title||card.name||'';
  var orig=card.original_title||card.original_name||'';
  var year=(card.release_date||card.first_air_date||'').slice(0,4);
  var q=(orig||title)+(year?' '+year:'');

  Lampa.Noty.show('Jackett: đang tìm...');
  fetchJackett(q,function(r){
    if(!r.length&&orig&&orig!==title){
      fetchJackett(title+(year?' '+year:''),function(r2){
        showPackMenu(r2,title,'Jackett',card);
      });
    }else{
      showPackMenu(r,title,'Jackett',card);
    }
  });
}

/* ================================================================
   KNABEN
================================================================ */
function fetchKnaben(query,isTV,cb){
  var cat=isTV?'300000':'200000';
  var url='https://knaben.eu/api/v1/?search='+encodeURIComponent(query)
        +'&categories[]='+cat+'&orderBy=seeders&sort=desc&size=30';

  reguest(url,function(data){
    var d=typeof data==='string'?JSON.parse(data):data;
    var raw=[];
    if(Array.isArray(d))                                raw=d;
    else if(d&&Array.isArray(d.hits))                   raw=d.hits;
    else if(d&&d.hits&&Array.isArray(d.hits.hits))      raw=d.hits.hits;
    else if(d&&Array.isArray(d.data))                   raw=d.data;
    else if(d&&Array.isArray(d.results))                raw=d.results;

    var results=raw.map(function(r){
      var src=r._source||r;
      var hash=(src.infoHash||src.info_hash||src.hash||'').toLowerCase();
      var t2=src.title||src.name||'';
      var seeds=parseInt(src.seeders||src.seeds||0);
      var size=parseInt(src.size||src.contentLength||src.bytes||0);
      var tracker=src.indexer||src.tracker||src.source||'Knaben';
      var magnet=src.magnetUrl||src.magnet||'';
      if(!magnet&&hash)magnet=makeMagnet(hash,t2);
      if(!magnet)return null;
      var qm=t2.match(/\b(2160p|4K|UHD|1080p|720p|480p|BluRay|WEB-?DL|HDRip|HDTV)\b/i);
      return{
        title:t2,seeds:seeds,size:fmtBytes(size),sizeNum:size,
        tracker:tracker,quality:qm?qm[1]:'',hash:hash,magnet:magnet
      };
    }).filter(Boolean).sort(function(a,b){return b.sizeNum-a.sizeNum;});
    cb(results);
  },function(e){Lampa.Noty.show('Knaben lỗi: '+e);cb([]);});
}

function searchKnaben(card){
  var title=card.title||card.name||'';
  var orig=card.original_title||card.original_name||'';
  var year=(card.release_date||card.first_air_date||'').slice(0,4);
  var isTV=getMediaType(card)==='series';
  var q1=(orig||title)+(year?' '+year:'');
  var q2=(orig&&orig!==title)?title+(year?' '+year:''):'';

  Lampa.Noty.show('Knaben: đang tìm...');
  fetchKnaben(q1,isTV,function(r){
    if(!r.length&&q2){
      fetchKnaben(q2,isTV,function(r2){showPackMenu(r2,title,'Knaben',card);});
    }else{
      showPackMenu(r,title,'Knaben',card);
    }
  });
}

/* ================================================================
   PACK MENU - dùng chung cho Jackett + Knaben
================================================================ */
function showPackMenu(results,movieTitle,label,card){
  if(!results||!results.length){Lampa.Noty.show(label+': Không tìm thấy!');return;}
  var tsUrl=getTsUrl();

  Lampa.Select.show({
    title:'🧲 '+label+': '+movieTitle+' ('+results.length+')',
    items:results.map(function(r){
      var line1='['+( r.tracker||label)+']'+(r.quality?' '+r.quality:'');
      var line2=r.title.length>55?r.title.slice(0,52)+'...':r.title;
      return{
        title:    line1+' — '+line2,
        subtitle: '👤 '+r.seeds+'  💾 '+r.size,
        r:r
      };
    }),
    onSelect:function(item){
      var r=item.r;
      if(!tsUrl){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
      if(!r.magnet&&!r.hash){Lampa.Noty.show('Không có magnet!');return;}
      var magnet=r.magnet||makeMagnet(r.hash,r.title);
      /* Jackett/Knaben: luôn hiện file picker */
      tsAddAndPlay(magnet,r.hash,r.title,movieTitle,card,undefined);
    },
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}

/* ================================================================
   3-SOURCE MENU - Bấm nút Torrent → hiện menu chọn nguồn
================================================================ */
function showSourceMenu(card){
  var isSeries=getMediaType(card)==='series';
  var engine=getEngine();
  var tioLabel=engine==='aio'?'AIOStreams':'Torrentio';
  var tsUrl=getTsUrl();
  var tsSuffix=tsUrl?' → TS':'';

  Lampa.Select.show({
    title:'🎬 Chọn nguồn torrent',
    items:[
      {
        title:   '🧲 '+tioLabel+tsSuffix,
        subtitle:'Torrent qua IMDB ID (nhanh, chính xác)',
        value:   'tio'
      },
      {
        title:   '🔍 Jackett'+tsSuffix,
        subtitle:'Tìm qua Jackett server của bạn',
        value:   'jackett'
      },
      {
        title:   '🌐 Knaben'+tsSuffix,
        subtitle:'Tìm qua Knaben public index',
        value:   'knaben'
      }
    ],
    onSelect:function(item){
      if(item.value==='tio'){
        if(isSeries)searchTioTV(card);
        else searchTio(card,null,null);
      }else if(item.value==='jackett'){
        searchJackett(card);
      }else if(item.value==='knaben'){
        searchKnaben(card);
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

  setTimeout(buildSettingsParams,100);
}

function buildSettingsParams(){
  if(!Lampa.SettingsApi)return;

  /* TorrServer */
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+'torrserver_url',type:'input',values:'',default:''},
    field:{name:'TorrServer URL',description:'VD: 192.168.1.100:8090'},
    onChange:function(v){ss2('torrserver_url',v);}
  });
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+'torrserver_pass',type:'input',values:'',default:''},
    field:{name:'TorrServer Password',description:'Để trống nếu không có'},
    onChange:function(v){ss2('torrserver_pass',v);}
  });
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+'test_ts',type:'button',default:''},
    field:{name:'🧪 Test TorrServer',description:'Kiểm tra kết nối'},
    onChange:function(){
      var url=getTsUrl();
      if(!url){Lampa.Noty.show('Chưa nhập URL!');return;}
      Lampa.Noty.show('Đang test...');
      $.ajax({
        url:url+'/echo',type:'GET',timeout:5000,
        success:function(){Lampa.Noty.show('✅ TorrServer OK!');},
        error:function(xhr){Lampa.Noty.show(xhr.status===200?'✅ OK!':'❌ HTTP '+(xhr.status||'timeout'));}
      });
    }
  });

  /* Engine */
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+'torrent_engine',type:'select',values:{torrentio:'Torrentio',aio:'AIOStreams'},default:'torrentio'},
    field:{name:'Torrent Engine',description:'Torrentio hoặc AIOStreams'},
    onChange:function(v){ss2('torrent_engine',v);}
  });
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+'torrentio_config',type:'input',values:'',default:''},
    field:{name:'Torrentio Config',description:'URL manifest từ torrentio.strem.fun/configure'},
    onChange:function(v){ss2('torrentio_config',v);}
  });
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+'aio_url',type:'input',values:'',default:''},
    field:{name:'AIOStreams URL',description:'VD: https://aio.yourdomain.com'},
    onChange:function(v){ss2('aio_url',v);}
  });

  /* Jackett */
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+'jackett_url',type:'input',values:'',default:''},
    field:{name:'Jackett URL',description:'VD: https://jac.maxvol.pro'},
    onChange:function(v){ss2('jackett_url',v);}
  });
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+'jackett_key',type:'input',values:'',default:''},
    field:{name:'Jackett API Key',description:'Từ Jackett → Settings'},
    onChange:function(v){ss2('jackett_key',v);}
  });
  Lampa.SettingsApi.addParam({
    component:'kktorrent',
    param:{name:STG+'test_jac',type:'button',default:''},
    field:{name:'🧪 Test Jackett',description:'Kiểm tra kết nối'},
    onChange:function(){
      var url=getJacUrl(),key=getJacKey();
      if(!url){Lampa.Noty.show('Chưa nhập URL!');return;}
      if(!key){Lampa.Noty.show('Chưa nhập Key!');return;}
      Lampa.Noty.show('Đang test...');
      reguest(url+'/api/v2.0/indexers/all/results?apikey='+key+'&Query=test&Category[]=2000',
        function(){Lampa.Noty.show('✅ Jackett OK!');},
        function(e){Lampa.Noty.show('❌ '+e);}
      );
    }
  });
}

/* ================================================================
   HOOK - expose để file UI chính gọi
================================================================ */
window.__kkphim_torrent={
  /* File UI chính gọi buildTorrentBtn → ta redirect sang showSourceMenu */
  buildTorrentBtn:function(mt,tid,title,poster,imdb){
    /* Build button mở source menu */
    var btn=$('<div class="kk-src-btn kk-btn--tor selector" style="width:100%">'
      +'<div class="kk-sb-main">🧲 Torrent</div>'
      +'<div class="kk-sb-sub">Torrentio / Jackett / Knaben</div>'
      +'</div>');

    /* Inject CSS */
    if(!$('#kkt-btn-css').length){
      $('head').append('<style id="kkt-btn-css">'
        +'.kk-btn--tor{background:linear-gradient(135deg,rgba(220,38,38,.18),rgba(220,38,38,.06))!important;'
        +'border:1px solid rgba(220,38,38,.4)!important;}'
        +'.kk-btn--tor.focus,.kk-btn--tor.selected{'
        +'border-color:rgba(220,38,38,.9)!important;background:rgba(220,38,38,.22)!important;}'
        +'</style>');
    }

    /* Build card object cho source menu */
    var card={
      id:tid,
      title:title,
      name:title,
      poster:poster,
      imdb_id:imdb,
      type:mt==='tv'?'tv':'movie'
    };

    function onTap(){showSourceMenu(card);}

    var sx=0,sy=0,mv=false,tc=false;
    btn.on('touchstart',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;mv=false;}});
    btn.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>10||Math.abs(t.clientY-sy)>10))mv=true;});
    btn.on('touchend',function(e){if(mv)return;tc=true;e.preventDefault();e.stopPropagation();setTimeout(onTap,150);setTimeout(function(){tc=false;},500);});
    btn.on('click',function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();onTap();});

    return $('<div style="width:100%"></div>').append(btn);
  },

  buildJackettBtn:function(mt,tid,title,poster){
    /* Không cần nút riêng nữa vì đã có trong source menu */
    return $('');
  },

  buildSettings:function(w,mg,mo,mi,si2,comp){
    /* Legacy support - settings giờ dùng SettingsApi */
    var s={};
    try{s=JSON.parse(localStorage.getItem('kkphim_settings'))||{};}catch(e){}

    var gTS=mg('TorrServer');
    gTS.append(mi('Host','VD: http://192.168.1.100:8090',s.torrserver_host||'(chưa cấu hình)','TorrServer Host','torrserver_host',s));
    gTS.append(mi('Password','',s.torrserver_password?'••••':'(không có)','TorrServer Password','torrserver_password',s));
    w.append(gTS);

    var gEng=mg('Torrent Engine');
    [{k:'torrentio',n:'Torrentio'},{k:'aio',n:'AIOStreams'}].forEach(function(o){
      var eng=s.torrent_engine||'torrentio';
      gEng.append(mo(o.n,'',eng===o.k,function(){
        var c2=JSON.parse(localStorage.getItem('kkphim_settings')||'{}');
        c2.torrent_engine=o.k;
        localStorage.setItem('kkphim_settings',JSON.stringify(c2));
        Lampa.Noty.show('Engine: '+o.n);comp.create();
      }));
    });
    w.append(gEng);

    var gTio=mg('Torrentio');
    gTio.append(mi('Config URL','',s.torrentio_config||'(chưa cấu hình)','Torrentio Config','torrentio_config',s));
    w.append(gTio);

    var gAio=mg('AIOStreams');
    gAio.append(mi('Base URL','',s.aio_url||'(chưa cấu hình)','AIOStreams URL','aio_url',s));
    w.append(gAio);

    var gJac=mg('Jackett');
    gJac.append(mi('URL','VD: https://jac.maxvol.pro',s.jackett_url||'(chưa cấu hình)','Jackett URL','jackett_url',s));
    gJac.append(mi('API Key','',s.jackett_key?'••••':'(chưa nhập)','Jackett API Key','jackett_key',s));
    w.append(gJac);
  },

  playEpTorrent:function(imdbId,sNum,eNum,title,poster){
    var card={id:0,title:title,name:title,poster:poster,imdb_id:imdbId,type:'tv'};
    searchTio(card,sNum,eNum);
  },

  showSourceMenu:showSourceMenu,
  searchTio:searchTio,
  searchJackett:searchJackett,
  searchKnaben:searchKnaben,
  tsHost:getTsUrl
};

/* Listener hook cho full card - thêm nút trực tiếp như reference */
Lampa.Listener.follow('full',function(e){
  if(e.type!=='complite')return;
  var card=e.data&&e.data.movie?e.data.movie:(e.object&&e.object.card);
  if(!card)return;
  var $ctx=e.object&&e.object.activity?e.object.activity.render():(e.object&&e.object.render?e.object.render():null);
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

  /* Nút Torrent → mở source menu */
  var $tor=mkBtn('view--kktorrent',
    '<circle cx="12" cy="12" r="10"/>'
    +'<polyline points="8 12 12 16 16 12"/>'
    +'<line x1="12" y1="8" x2="12" y2="16"/>',
    '🧲 Torrent',
    function(){showSourceMenu(card);}
  );

  var $anchor=$ctx.find('.view--torrent');
  if($anchor.length){$anchor.after($tor);}
  else{$ctx.find('.full-start__buttons').append($tor);}
});

/* Start */
function start(){
  initSettings();
  console.log('[KKTorrent] v2.0 loaded');
}

if(window.appready)start();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')start();});

}/* end init */
})();