/* KKPhim Torrent Extension v2.5.2 */
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
      'torrserver_url':'torrserver_host','torrserver_pass':'torrserver_password',
      'torrentio_config':'torrentio_config','aio_url':'aio_url',
      'torrent_engine':'torrent_engine','jackett_url':'jackett_url',
      'jackett_key':'jackett_key','jackett_sort':'jackett_sort'
    };
    return ls[map[k]||k]||'';
  }catch(e){}
  return'';
}
function sv(k,v){
  try{Lampa.Storage.set(STG+k,v);}catch(e){}
  /* Đồng bộ sang kkphim_settings để buildSettings đọc được */
  try{
    var ls=JSON.parse(localStorage.getItem('kkphim_settings')||'{}');
    var map={
      'torrserver_url':'torrserver_host','torrserver_pass':'torrserver_password',
      'torrentio_config':'torrentio_config','aio_url':'aio_url',
      'torrent_engine':'torrent_engine','jackett_url':'jackett_url',
      'jackett_key':'jackett_key','jackett_sort':'jackett_sort'
    };
    if(map[k])ls[map[k]]=v;
    localStorage.setItem('kkphim_settings',JSON.stringify(ls));
  }catch(e){}
}

function getTsUrl(){
  var u=gs('torrserver_url');if(!u)return null;
  u=u.replace(/\/+$/,'');
  if(!/^https?:\/\//i.test(u))u='http://'+u;
  return u;
}
function getTsPass()  {return gs('torrserver_pass');}
function getAioUrl()  {return gs('aio_url').replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');}
function getEngine()  {return gs('torrent_engine')||'torrentio';}
function getJacUrl()  {
  var u=gs('jackett_url');if(!u)return'';
  u=u.replace(/\/+$/,'');
  if(!/^https?:\/\//i.test(u))u='https://'+u;
  return u;
}
function getJacKey()  {return gs('jackett_key');}
function getJacSort() {return gs('jackett_sort')||'seeds';}
function getTioConf() {return parseTioConf(gs('torrentio_config'));}

function parseTioConf(raw){
  if(!raw)return'';
  raw=String(raw).trim();
  var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);if(m)return m[1];
  m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);if(m)return m[1];
  if(raw.indexOf('torrentio.strem.fun')>-1){
    raw=raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i,'')
           .replace(/\/(manifest\.json|stream\/.*)?$/i,'').replace(/^\/+|\/+$/g,'');
    return(raw.indexOf('=')>-1)?raw.replace(/\|/g,'%7C'):'';
  }
  raw=raw.replace(/^\/+|\/+$/g,'').replace(/\|/g,'%7C');
  return raw.indexOf('=')===-1?'':raw;
}

var TIO_BASE='https://torrentio.strem.fun';
var TMDB_KEY='4ef0d7355d9ffb5151e987764708ce96';

/* TMDB CACHE */
var _tmdbCache={};
function getTmdbOriginal(tmdbId,mediaType,cb){
  if(!tmdbId){cb('');return;}
  if(_tmdbCache[tmdbId]){cb(_tmdbCache[tmdbId]);return;}
  var type=mediaType==='tv'?'tv':'movie';
  fetch('https://api.themoviedb.org/3/'+type+'/'+tmdbId+'?api_key='+TMDB_KEY+'&language=en-US')
    .then(function(r){return r.json();})
    .then(function(d){
      var orig=d.original_title||d.original_name||d.title||d.name||'';
      var year=(d.release_date||d.first_air_date||'').slice(0,4);
      _tmdbCache[tmdbId]={orig:orig,year:year};
      cb(_tmdbCache[tmdbId]);
    }).catch(function(){cb('');});
}

/* HELPERS */
function pad(n){return(n<10?'0':'')+n;}
function fmtBytes(b){
  b=parseInt(b)||0;
  if(b>=1e12)return(b/1e12).toFixed(2)+' TB';
  if(b>=1e9) return(b/1e9).toFixed(2)+' GB';
  if(b>=1e6) return(b/1e6).toFixed(0)+' MB';
  return b?b+' B':'';
}
function parseSize(str){
  if(!str)return 0;
  var m=String(str).match(/([\d.,]+)\s*(TB|GB|GiB|MB|MiB|KB)/i);
  if(!m)return 0;
  var n=parseFloat(m[1].replace(',','.'));
  switch(m[2].toUpperCase()){
    case'TB':return n*1e12;
    case'GB':case'GIB':return n*1e9;
    case'MB':case'MIB':return n*1e6;
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
function extractHash(magnetUri,linkUrl,guid){
  var sources=[magnetUri||'',linkUrl||'',guid||''];
  for(var i=0;i<sources.length;i++){
    var s=sources[i];if(!s)continue;
    var m=s.match(/urn:btih:([a-fA-F0-9]{32,40})/i);if(m)return m[1].toLowerCase();
    m=s.match(/[\/=]([a-fA-F0-9]{40})(?:[&\/?#]|$)/i);if(m)return m[1].toLowerCase();
    m=s.match(/urn:btih:([A-Z2-7]{32})/i);
    if(m){
      try{
        var b32=m[1].toUpperCase(),alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',bits='',hex='';
        for(var j=0;j<b32.length;j++){var val=alphabet.indexOf(b32[j]);if(val<0)break;bits+=('00000'+val.toString(2)).slice(-5);}
        for(var j=0;j<bits.length-7;j+=8)hex+=('0'+parseInt(bits.slice(j,j+8),2).toString(16)).slice(-2);
        if(hex.length>=32)return hex.toLowerCase();
      }catch(ex){}
    }
  }
  return'';
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
function reguest(url,onOk,onFail){
  var net=new Lampa.Reguest();net.timeout(15000);
  net.silent(url,
    function(data){onOk(data);},
    function(a,b){var code=(a&&a.status)?a.status:0;(onFail||function(){})(code?'HTTP '+code:(b||'Error'));}
  );
}

/* ================================================================
   TORRSERVER
================================================================ */
function tsHeaders(){
  var h={'Content-Type':'application/json'};
  var p=getTsPass();if(p)h['Authorization']='Basic '+btoa('admin:'+p);
  return h;
}
function tsAdd(link,movieTitle,onDone,onFail){
  var tsUrl=getTsUrl();
  if(!tsUrl){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
  $.ajax({
    url:tsUrl+'/torrents',type:'POST',headers:tsHeaders(),
    data:JSON.stringify({action:'add',link:link,title:movieTitle,save_to_db:false}),
    dataType:'json',timeout:15000,
    success:function(data){onDone((data&&data.hash)||'');},
    error:function(){if(onFail)onFail();}
  });
}
function tsGetFiles(hash,onDone){
  var tsUrl=getTsUrl();
  $.ajax({
    url:tsUrl+'/torrents',type:'POST',headers:tsHeaders(),
    data:JSON.stringify({action:'get',hash:hash}),
    dataType:'json',timeout:15000,
    success:function(data){
      var files=((data&&data.file_stats)||[])
        .filter(function(f){return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|webm|ts|m2ts|wmv|flv)$/);})
        .sort(function(a,b){return(a.path||'').localeCompare(b.path||'',undefined,{numeric:true});});
      onDone(files,data);
    },
    error:function(){onDone([],null);}
  });
}
function tsPlayFile(hash,fileId,movieTitle,card){
  var tsUrl=getTsUrl();
  var url=tsUrl+'/stream/'+encodeURIComponent(movieTitle||'video')+'?link='+hash+'&index='+fileId+'&play';
  Lampa.Player.play({title:movieTitle,url:url,movie:card||{}});
}
function tsAddAndPlay(linkOrMagnet,hash,movieTitle,card,fileIdx){
  var tsUrl=getTsUrl();
  if(!tsUrl){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
  if(!linkOrMagnet){Lampa.Noty.show('Không có magnet hoặc link!');return;}
  Lampa.Noty.show('Đang thêm vào TorrServer...');
  tsAdd(linkOrMagnet,movieTitle,function(returnedHash){
    var h=returnedHash||hash;
    if(!h){Lampa.Noty.show('Không lấy được hash!');return;}
    if(fileIdx!==null&&fileIdx!==undefined&&fileIdx>=0){tsPlayFile(h,fileIdx,movieTitle,card);return;}
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
      var fname=parts[parts.length-1]||'File';
      return{title:fname,subtitle:f.length?fmtBytes(f.length):'',file:f};
    }),
    onSelect:function(item){tsPlayFile(hash,item.file.id||0,movieTitle,card);},
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}

/* ================================================================
   PARSE STREAM v2.5.2
   FIX: fileName gộp vào 1 dòng subtitle, không xuống dòng
================================================================ */
function parseStream(st){
  var rn=String(st.name||'');
  var rd=String(st.description||st.title||'');
  var bh=st.behaviorHints||{};
  var nl=rn.split(/[\n\r]+/);
  var dl=rd.split(/[\n\r]+/);
  var allText=rn+' '+rd;

  /* PROVIDER */
  var provider=(nl[0]||'').replace(/^\[[^\]]*\]\s*/,'').trim()||'Stream';

  /* TÊN FILE */
  var fileName='';
  var fm=rd.match(/📁\s*([^\n\r]+)/);
  if(fm)fileName=fm[1].trim();
  if(!fileName){
    for(var i=0;i<dl.length;i++){
      var dc=dl[i].replace(/^[📁\s]+/,'').trim();
      if(/\.(mkv|mp4|avi|ts|m2ts|mov)\b/i.test(dc)){fileName=dc;break;}
    }
  }
  if(!fileName){
    for(var i=1;i<nl.length;i++){
      var nc=nl[i].trim();
      if(/\.(mkv|mp4|avi|ts)\b/i.test(nc)||(/S\d+E\d+/i.test(nc)&&nc.length>10)){fileName=nc;break;}
    }
  }

  /* TRACKER */
  var tracker='';
  var trm=rd.match(/🔗\s*([^\n\r]+)/);if(trm)tracker=trm[1].trim();
  if(!tracker){var sm2=rd.match(/⚙️\s*([^\n\r]+)/);if(sm2)tracker=sm2[1].trim();}
  if(!tracker&&dl.length>1){
    var last=dl[dl.length-1].trim();
    if(last&&last.length>1&&last.length<40&&!/[👤💾📁🔗⚙️]/.test(last)&&!/^\d/.test(last))tracker=last;
  }

  /* SIZE */
  var size='';
  var szm=rd.match(/💾\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i);
  if(szm)size=szm[1].trim();
  if(!size){szm=allText.match(/\b([\d.,]+)\s*(GB|GiB|MB|MiB|TB)\b/i);if(szm)size=szm[1]+' '+szm[2];}
  if(!size&&bh.videoSize)size=fmtBytes(bh.videoSize);

  /* SEEDS */
  var seeds=0;
  var sdm=rd.match(/👤\s*(\d+)/);if(sdm)seeds=parseInt(sdm[1]);
  if(!seeds){sdm=allText.match(/[Ss]eeds?:?\s*(\d+)/);if(sdm)seeds=parseInt(sdm[1]);}

  /* QUALITY */
  var searchText=allText+' '+(fileName||'');
  var qm=searchText.match(/\b(2160p|4K UHD|4K|UHD|1080p|1080i|720p|480p|360p)\b/i);
  var quality=qm?qm[1].toUpperCase():'';
  if(quality==='4K'||quality==='UHD'||quality==='4K UHD')quality='2160P';

  /* CODEC */
  var cm=searchText.match(/\b(HEVC|H\.?265|x265|H\.?264|x264|AVC|AV1)\b/i);
  var codec=cm?cm[1].toUpperCase()
    .replace(/H\.?265/i,'HEVC').replace(/X265/i,'HEVC')
    .replace(/H\.?264/i,'AVC').replace(/X264/i,'AVC'):'';

  /* AUDIO */
  var am=searchText.match(/\b(Atmos|TrueHD|DTS-HD|DTS|EAC3|AC3|AAC|FLAC)\b/i);
  var audio=am?am[1].toUpperCase():'';

  /* SOURCE */
  var slm=searchText.match(/\b(BluRay|Blu-Ray|WEB-?DL|WEBRip|HDRip|HDTV|BRRip)\b/i);
  var srcLbl=slm?slm[1].replace(/blu.?ray/i,'BluRay').replace(/web.?dl/i,'WEB-DL'):'';

  /* displayName */
  var badges=[];
  if(quality)badges.push(quality);
  if(codec)  badges.push(codec);
  if(audio)  badges.push(audio);
  if(srcLbl) badges.push(srcLbl);
  var displayName=provider+(badges.length?' ['+badges.join('|')+']':'');
  if(tracker&&tracker.toLowerCase()!==provider.toLowerCase()&&tracker.length<35)
    displayName+=' • '+tracker;

  return{
    displayName:displayName,provider:provider,
    fileName:fileName,tracker:tracker,
    infoHash:(st.infoHash||'').toLowerCase(),
    fileIdx:(typeof st.fileIdx==='number')?st.fileIdx:null,
    url:st.url||'',size:size,sizeNum:parseSize(size),
    seeds:seeds,quality:quality,
    magnet:st.infoHash?makeMagnet(st.infoHash,displayName):''
  };
}

/* ================================================================
   SHOW TIO MENU v2.5.2
   FIX: subtitle 1 dòng — gộp seeds + size + fileName
   fileName rút gọn, tất cả trên 1 dòng không xuống dòng
================================================================ */
function showTioMenu(streams,movieTitle,card){
  if(!streams||!streams.length){Lampa.Noty.show('Không tìm thấy stream!');return;}
  var tsUrl=getTsUrl();
  var label=getEngine()==='aio'?'AIOStreams':'Torrentio';
  var parsed=streams.map(parseStream)
    .filter(function(s){return s.infoHash||s.url;})
    .sort(function(a,b){
      if(b.seeds!==a.seeds)return b.seeds-a.seeds;
      return b.sizeNum-a.sizeNum;
    });
  if(!parsed.length){Lampa.Noty.show('Không có stream hợp lệ!');return;}

  Lampa.Select.show({
    title:'🧲 '+label+': '+movieTitle+' ('+parsed.length+')',
    items:parsed.map(function(s){
      /* ===================================================
         FIX: TẤT CẢ trên 1 dòng subtitle, không \n
         Format: 👤 50  💾 16 GB  📁 Filename.S01E01...mkv
      =================================================== */
      var sub='';
      if(s.seeds) sub+='👤 '+s.seeds+'  ';
      if(s.size)  sub+='💾 '+s.size;
      if(s.fileName){
        /* Rút ngắn fileName: chỉ lấy phần cuối sau / hoặc \ */
        var fn=s.fileName.split(/[\/\\]/).pop()||s.fileName;
        /* Cắt extension nếu quá dài */
        var maxLen=28;
        if(fn.length>maxLen)fn=fn.slice(0,maxLen-1)+'…';
        if(sub)sub+='  ';
        sub+='📁 '+fn;
      }
      return{title:s.displayName, subtitle:sub.trim(), s:s};
    }),
    onSelect:function(item){
      var s=item.s;
      if(!tsUrl){
        if(s.url)Lampa.Player.play({title:movieTitle,url:s.url,movie:card});
        else Lampa.Noty.show('Chưa cấu hình TorrServer!');
        return;
      }
      if(s.infoHash)tsAddAndPlay(s.magnet,s.infoHash,movieTitle,card,s.fileIdx);
      else if(s.url)Lampa.Player.play({title:movieTitle,url:s.url,movie:card});
      else Lampa.Noty.show('Không có link!');
    },
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}

/* ================================================================
   TORRENTIO / AIO
================================================================ */
function buildTioUrl(type,imdbId,season,episode){
  var sType=type==='series'?'series':'movie';
  var id=imdbId;
  if(type==='series'&&season&&episode)id=imdbId+':'+season+':'+episode;
  if(getEngine()==='aio'){
    var base=getAioUrl();
    return base?base+'/stream/'+sType+'/'+id+'.json':null;
  }
  var cfg=getTioConf();
  return TIO_BASE+(cfg?'/'+cfg:'')+'/stream/'+sType+'/'+id+'.json';
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
    reguest(url,
      function(data){showTioMenu((data&&data.streams)||[],movieTitle,card);},
      function(e){Lampa.Noty.show('Lỗi: '+e);}
    );
  }
  if(imdbId){run(imdbId);return;}
  reguest(
    'https://api.themoviedb.org/3/'+(type==='series'?'tv':'movie')+'/'+card.id+'/external_ids?api_key='+TMDB_KEY,
    function(d){var id=d&&d.imdb_id;if(id){card.imdb_id=id;run(id);}else Lampa.Noty.show('Không tìm thấy IMDB ID');},
    function(){Lampa.Noty.show('Lỗi lấy IMDB ID');}
  );
}
function searchTioTV(card){
  var total=card.number_of_seasons||1;
  function pickEp(s){
    var totalEps=getSeasonEpCount(card,s);
    var items=[];
    for(var e=1;e<=totalEps;e++)items.push({title:'S'+pad(s)+'E'+pad(e),s:s,e:e});
    Lampa.Select.show({
      title:'Season '+s+' — Chọn tập',items:items,
      onSelect:function(item){searchTio(card,item.s,item.e);},
      onBack:function(){Lampa.Controller.toggle('full');}
    });
  }
  if(total===1){pickEp(1);return;}
  var ss=[];
  for(var s=1;s<=total;s++)ss.push({title:'Season '+s+' ('+getSeasonEpCount(card,s)+' tập)',s:s});
  Lampa.Select.show({
    title:'Chọn Season',items:ss,
    onSelect:function(item){pickEp(item.s);},
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}
function getSeasonEpCount(card,season){
  if(card.seasons){var s=card.seasons.filter(function(x){return x.season_number===season;})[0];if(s&&s.episode_count)return s.episode_count;}
  return 50;
}

/* ================================================================
   JACKETT SORT
   Sắp xếp theo: seeds | size | quality | tracker
================================================================ */
var QUALITY_ORDER={'2160P':4,'2160p':4,'4K':4,'UHD':4,'1080P':3,'1080p':3,'720P':2,'720p':2,'480P':1,'480p':1};
function qualityScore(q){return QUALITY_ORDER[(q||'').toUpperCase().replace('P','p').replace('p','P')]||0;}

function sortJackett(results){
  var sort=getJacSort();
  return results.slice().sort(function(a,b){
    switch(sort){
      case'size':
        return b.sizeNum!==a.sizeNum?b.sizeNum-a.sizeNum:b.seeds-a.seeds;
      case'quality':
        var qs=qualityScore(b.quality)-qualityScore(a.quality);
        return qs!==0?qs:(b.seeds-a.seeds);
      case'tracker':
        var tc=(a.tracker||'').localeCompare(b.tracker||'');
        return tc!==0?tc:b.seeds-a.seeds;
      case'seeds':
      default:
        return b.seeds!==a.seeds?b.seeds-a.seeds:b.sizeNum-a.sizeNum;
    }
  });
}

/* ================================================================
   JACKETT FETCH + SEARCH
================================================================ */
function fetchJackett(query,cb){
  var url=getJacUrl(),key=getJacKey();
  if(!url){Lampa.Noty.show('Chưa cấu hình Jackett URL!');cb([]);return;}
  if(!key){Lampa.Noty.show('Chưa nhập Jackett API Key!');cb([]);return;}
  var apiUrl=url+'/api/v2.0/indexers/all/results'
    +'?apikey='+encodeURIComponent(key)
    +'&Query='+encodeURIComponent(query)
    +'&Category[]=2000&Category[]=5000';
  reguest(apiUrl,
    function(data){
      var d=typeof data==='string'?JSON.parse(data):data;
      var results=((d&&d.Results)||[]).map(function(r){
        var magnetUri=r.MagnetUri||'',linkUrl=r.Link||'',guid=r.Guid||r.Url||'';
        var hash=extractHash(magnetUri,linkUrl,guid);
        var magnet=magnetUri||(hash?makeMagnet(hash,r.Title||''):'');
        var torrentLink=(!magnet&&linkUrl)?linkUrl:'';
        if(!magnet&&!torrentLink)return null;
        var qm=(r.Title||'').match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);
        return{
          title:r.Title||'',seeds:parseInt(r.Seeders)||0,peers:parseInt(r.Peers)||0,
          size:fmtBytes(parseInt(r.Size)||0),sizeNum:parseInt(r.Size)||0,
          tracker:r.Tracker||r.TrackerId||'Jackett',
          quality:qm?qm[1].toUpperCase():'',
          hash:hash,magnet:magnet,torrentLink:torrentLink
        };
      }).filter(Boolean);
      cb(sortJackett(results));
    },
    function(e){Lampa.Noty.show('Jackett lỗi: '+e);cb([]);}
  );
}

function searchJackett(card){
  var displayTitle=card.title||card.name||'';
  var tmdbId=card.id||card.tmdb_id;
  var mediaType=getMediaType(card)==='series'?'tv':'movie';
  var origFromCard=card.original_title||card.original_name||'';
  if(origFromCard){doJackettSearch(origFromCard,displayTitle,card);}
  else if(tmdbId){
    Lampa.Noty.show('Jackett: đang lấy tên gốc...');
    getTmdbOriginal(tmdbId,mediaType,function(info){
      doJackettSearch((info&&info.orig)||displayTitle,displayTitle,card);
    });
  }else{doJackettSearch(displayTitle,displayTitle,card);}
}
function doJackettSearch(orig,displayTitle,card){
  var year=card.year||(card.release_date||card.first_air_date||'').slice(0,4)||'';
  if(!year&&_tmdbCache[card.id||card.tmdb_id])year=_tmdbCache[card.id||card.tmdb_id].year||'';
  Lampa.Noty.show('Jackett: tìm "'+orig+'"...');
  fetchJackett(orig+(year?' '+year:''),function(r1){
    if(r1.length){showPackMenu(r1,displayTitle,'Jackett',card);return;}
    if(year)fetchJackett(orig,function(r2){showPackMenu(r2,displayTitle,'Jackett',card);});
    else showPackMenu([],displayTitle,'Jackett',card);
  });
}

/* ================================================================
   PACK MENU (Jackett)
   Hiển thị sort hiện tại trong title
================================================================ */
function showPackMenu(results,movieTitle,label,card){
  if(!results||!results.length){Lampa.Noty.show(label+': Không tìm thấy!');return;}
  var sortLabel={seeds:'👤 Seeds',size:'💾 Size',quality:'🎬 Quality',tracker:'🔗 Tracker'};
  var tsUrl=getTsUrl();

  Lampa.Select.show({
    title:'🔍 '+label+' ['+( sortLabel[getJacSort()]||'Seeds')+'] '+movieTitle+' ('+results.length+')',
    items:results.map(function(r){
      var icon=r.magnet?'🧲':(r.torrentLink?'📄':'❌');
      /* Rút ngắn title torrent */
      var t2=r.title.length>44?r.title.slice(0,41)+'…':r.title;
      return{
        title:icon+' ['+r.tracker+']'+(r.quality?' '+r.quality:'')+' — '+t2,
        subtitle:'👤 '+r.seeds+(r.peers?'/'+r.peers:'')+'  💾 '+r.size,
        r:r
      };
    }),
    onSelect:function(item){
      var r=item.r;
      if(!tsUrl){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
      if(r.magnet)tsAddAndPlay(r.magnet,r.hash,movieTitle,card,null);
      else if(r.torrentLink){
        Lampa.Noty.show('Đang thêm torrent file...');
        tsAddAndPlay(r.torrentLink,'',movieTitle,card,null);
      }else Lampa.Noty.show('Không có magnet hoặc link torrent!');
    },
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}

/* ================================================================
   SOURCE MENU
================================================================ */
function showSourceMenu(card){
  var isSeries=getMediaType(card)==='series';
  var tioLabel=getEngine()==='aio'?'AIOStreams':'Torrentio';
  Lampa.Select.show({
    title:'🎬 '+(card.title||card.name||''),
    items:[
      {title:'🧲 '+tioLabel+(getTsUrl()?' → TS':''),subtitle:'Stream qua IMDB ID',value:'tio'},
      {title:'🔍 Jackett'+(getTsUrl()?' → TS':''),subtitle:'Tìm theo tên gốc (sort: '+getJacSort()+')',value:'jackett'}
    ],
    onSelect:function(item){
      if(item.value==='tio'){if(isSeries)searchTioTV(card);else searchTio(card,null,null);}
      else if(item.value==='jackett')searchJackett(card);
    },
    onBack:function(){Lampa.Controller.toggle('full');}
  });
}

/* ================================================================
   SETTINGS
   Thêm: Jackett Sort Order
================================================================ */
function initSettings(){
  if(!Lampa.SettingsApi||!Lampa.SettingsApi.addComponent)return;
  Lampa.SettingsApi.addComponent({
    component:'kktorrent',name:'KKTorrent',
    icon:'<svg viewBox="0 0 24 24" fill="none" width="24" height="24">'
        +'<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>'
        +'<polyline points="8 12 12 16 16 12" stroke="currentColor" stroke-width="1.5"/>'
        +'<line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="1.5"/>'
        +'</svg>'
  });
  setTimeout(function(){
    /* --- TorrServer --- */
    addParam('torrserver_url','input','TorrServer URL','VD: 192.168.1.100:8090');
    addParam('torrserver_pass','input','TorrServer Password','Để trống nếu không có');
    addBtn('test_ts','🧪 Test TorrServer','',function(){
      var u=getTsUrl();if(!u){Lampa.Noty.show('Chưa nhập URL!');return;}
      $.ajax({url:u+'/echo',type:'GET',timeout:5000,
        success:function(){Lampa.Noty.show('✅ TorrServer OK!');},
        error:function(xhr){Lampa.Noty.show('❌ HTTP '+(xhr.status||'timeout'));}
      });
    });

    /* --- Engine --- */
    addSel('torrent_engine','Torrent Engine','Chọn nguồn stream',
      {torrentio:'Torrentio',aio:'AIOStreams'});
    addParam('torrentio_config','input','Torrentio Config','URL từ torrentio.strem.fun/configure');
    addParam('aio_url','input','AIOStreams URL','VD: https://aio.yourdomain.com');

    /* --- Jackett --- */
    addParam('jackett_url','input','Jackett URL','VD: https://jac.maxvol.pro');
    addParam('jackett_key','input','Jackett API Key','Từ Jackett Dashboard → Settings');

    /* === MỚI: Jackett Sort Order === */
    addSel('jackett_sort','Jackett — Sắp xếp kết quả',
      'Ưu tiên hiển thị kết quả theo tiêu chí nào',
      {
        seeds  :'👤 Seeders (nhiều seed nhất)',
        size   :'💾 Dung lượng (lớn nhất)',
        quality:'🎬 Chất lượng (4K → 1080p → ...)',
        tracker:'🔗 Tracker (A→Z)'
      }
    );

    addBtn('test_jac','🧪 Test Jackett','',function(){
      var u=getJacUrl(),k=getJacKey();
      if(!u||!k){Lampa.Noty.show('Chưa nhập URL hoặc Key!');return;}
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
    param:{name:STG+key,type:'select',values:values,default:Object.keys(values)[0]},
    field:{name:name,description:desc||''},
    onChange:function(v){sv(key,v);Lampa.Noty.show('Đã lưu: '+name);}
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
        +'.kk-btn--tor{background:linear-gradient(135deg,rgba(220,38,38,.18),rgba(220,38,38,.06))!important;border:1px solid rgba(220,38,38,.4)!important;}'
        +'.kk-btn--tor.focus,.kk-btn--tor.selected{border-color:rgba(220,38,38,.9)!important;background:rgba(220,38,38,.22)!important;}'
        +'</style>');
    }
    if(tid)getTmdbOriginal(tid,mt==='tv'?'tv':'movie',function(info){
      console.log('[KKTorrent] Preloaded orig="'+(info&&info.orig||'')+'" id='+tid);
    });
    var card={id:tid,title:title,name:title,poster:poster,imdb_id:imdb,type:mt==='tv'?'tv':'movie'};
    var btn=$('<div class="kk-src-btn kk-btn--tor selector" style="width:100%">'
      +'<div class="kk-sb-main">🧲 Torrent</div>'
      +'<div class="kk-sb-sub">Torrentio / Jackett</div>'
      +'</div>');
    var sx=0,sy=0,mv=false,tc=false;
    btn.on('touchstart',function(e){var t2=((e.originalEvent||e).touches||[])[0];if(t2){sx=t2.clientX;sy=t2.clientY;mv=false;}});
    btn.on('touchmove', function(e){var t2=((e.originalEvent||e).touches||[])[0];if(t2&&(Math.abs(t2.clientX-sx)>10||Math.abs(t2.clientY-sy)>10))mv=true;});
    btn.on('touchend', function(e){if(mv)return;tc=true;e.preventDefault();e.stopPropagation();setTimeout(function(){showSourceMenu(card);},150);setTimeout(function(){tc=false;},500);});
    btn.on('click',    function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();showSourceMenu(card);});
    return $('<div style="width:100%"></div>').append(btn);
  },

  buildJackettBtn:function(){return$('');},

  buildSettings:function(w,mg,mo,mi,si2,comp){
    var s={};try{s=JSON.parse(localStorage.getItem('kkphim_settings')||'{}');}catch(e){}
    var gTS=mg('TorrServer');
    gTS.append(mi('Host','',s.torrserver_host||'(chưa)','TorrServer Host','torrserver_host',s));
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
    var gT=mg('Torrentio');gT.append(mi('Config','',s.torrentio_config||'(chưa)','Torrentio Config','torrentio_config',s));w.append(gT);
    var gA=mg('AIOStreams');gA.append(mi('URL','',s.aio_url||'(chưa)','AIOStreams URL','aio_url',s));w.append(gA);
    var gJ=mg('Jackett');
    gJ.append(mi('URL','',s.jackett_url||'(chưa)','Jackett URL','jackett_url',s));
    gJ.append(mi('API Key','',s.jackett_key?'••••':'(chưa)','Jackett API Key','jackett_key',s));
    /* Sort option trong buildSettings (legacy UI) */
    var sortNames={seeds:'Seeders',size:'Size',quality:'Quality',tracker:'Tracker'};
    var curSort=s.jackett_sort||'seeds';
    [{k:'seeds',n:'👤 Seeders'},{k:'size',n:'💾 Size'},{k:'quality',n:'🎬 Quality'},{k:'tracker',n:'🔗 Tracker'}].forEach(function(o){
      gJ.append(mo('Sort: '+o.n,'Jackett sort order',curSort===o.k,function(){
        var c2=JSON.parse(localStorage.getItem('kkphim_settings')||'{}');
        c2.jackett_sort=o.k;localStorage.setItem('kkphim_settings',JSON.stringify(c2));
        try{Lampa.Storage.set(STG+'jackett_sort',o.k);}catch(e){}
        Lampa.Noty.show('Jackett sort: '+o.n);comp.create();
      }));
    });
    w.append(gJ);
  },

  playEpTorrent:function(imdbId,sNum,eNum,title,poster){
    searchTio({id:0,title:title,name:title,poster:poster,imdb_id:imdbId,type:'tv'},sNum,eNum);
  },
  showSourceMenu:showSourceMenu,
  getTsUrl:getTsUrl
};

/* Hook full card */
Lampa.Listener.follow('full',function(e){
  if(e.type!=='complite')return;
  var card=e.data&&e.data.movie?e.data.movie:(e.object&&e.object.card);
  if(!card)return;
  var $ctx=e.object&&e.object.activity?e.object.activity.render():(e.object&&e.object.render?e.object.render():null);
  if(!$ctx)return;
  if($ctx.find('.view--kktorrent').length)return;
  var $tor=$('<div class="full-start__button selector view--kktorrent">'
    +'<svg viewBox="0 0 24 24" fill="none" width="44" height="44" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
    +'<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>'
    +'<span>Torrent</span></div>');
  $tor.on('hover:enter',function(){showSourceMenu(card);});
  var $anchor=$ctx.find('.view--torrent');
  if($anchor.length)$anchor.after($tor);
  else $ctx.find('.full-start__buttons').append($tor);
});

function start(){
  initSettings();
  console.log('[KKTorrent] v2.5.2 | engine='+getEngine()+' | sort='+getJacSort()+' | ts='+getTsUrl());
}
if(window.appready)start();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')start();});

}
})();