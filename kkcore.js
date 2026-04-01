/* KKPhim Core v4.0 - Logic & Data Layer */
(function(){
'use strict';

// ═══════════════════════════════════════
//  CONSTANTS & CONFIG
// ═══════════════════════════════════════
var SOURCES={
    kkphim:{key:'kkphim',name:'KKPhim',api:'https://phimapi.com/',img:'https://phimimg.com/'},
    ophim:{key:'ophim',name:'OPhim',api:'https://ophim1.com/',img:'https://img.ophim.live/uploads/movies/'}
};
var TMDB_TOKEN='eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
var TMDB_IMG='https://image.tmdb.org/t/p/original';
var TMDB_W500='https://image.tmdb.org/t/p/w500';
var TMDB_W300='https://image.tmdb.org/t/p/w300';
var TIO_BASE='https://torrentio.strem.fun';
var STG_KEY='kkphim_settings';
var CW_KEY='kkphim_continue_watching';
var HIST_KEY='kkphim_history';
var PROG_KEY='kkphim_progress';
var _gc={movie:null,tv:null};
var _currentPlayingUrl=null;
var _progressInterval=null;

// ═══════════════════════════════════════
//  SETTINGS / STORAGE
// ═══════════════════════════════════════
function ls(){try{return JSON.parse(localStorage.getItem(STG_KEY))||{};}catch(e){return{};}}
function ss(o){try{var c=ls();Object.keys(o).forEach(function(k){c[k]=o[k];});localStorage.setItem(STG_KEY,JSON.stringify(c));}catch(e){}}
function srcKey(){return ls().source||'ophim';}
function src(){return SOURCES[srcKey()]||SOURCES.ophim;}
function sApi(){return src().api;}
function sImg(){return src().img;}
function tsHost(){return ls().torrserver_host||'';}
function tsPass(){return ls().torrserver_password||'';}
function tioConf(){return ls().torrentio_config||'';}
function aioUrl(){return ls().aio_url||'';}
function tEngine(){return ls().torrent_engine||'torrentio';}
function cardSt(){return ls().card_style||'3';}
function tmLang(){return ls().tmdb_lang||'vi-VN';}
function cardMode(){return ls().card_mode||'hgrid';}
function catMode(){return ls().cat_mode||'hgrid';}
function rowCount(){return parseInt(ls().row_count||'20');}
function fontScale(){return parseInt(ls().font_scale||'100');}
function imgQuality(){return ls().img_quality||'medium';}

// ═══════════════════════════════════════
//  CONTINUE WATCHING / HISTORY
// ═══════════════════════════════════════
function getCW(){try{return JSON.parse(localStorage.getItem(CW_KEY))||[];}catch(e){return[];}}
function setCW(v){try{localStorage.setItem(CW_KEY,JSON.stringify(v||[]));}catch(e){}}
function getHist(){try{return JSON.parse(localStorage.getItem(HIST_KEY))||[];}catch(e){return[];}}
function setHist(v){try{localStorage.setItem(HIST_KEY,JSON.stringify(v||[]));}catch(e){}}

function saveHistory(item){
    try{var n=nm(item);if(!n)return;var arr=getHist();
    var id=(srcKey()||'')+'_'+(n.slug||'')+'_'+((n.tmdb&&n.tmdb.id)||'');
    arr=arr.filter(function(x){return x.id!==id;});
    arr.unshift({id:id,source:srcKey(),slug:n.slug||'',name:n.name||'',origin_name:n.origin_name||'',
        poster_url:n.poster_url||'',thumb_url:n.thumb_url||'',year:n.year||'',quality:n.quality||'',
        episode_current:n.episode_current||'',tmdb:n.tmdb||{},category:n.category||[],type:n.type||'',time:Date.now()});
    if(arr.length>50)arr=arr.slice(0,50);setHist(arr);}catch(e){}
}

function saveContinue(item,epName,link,posterUrl,backdropUrl){
    try{var n=nm(item);if(!n)return;var arr=getCW();
    var nameKey=nStr(n.name||n.origin_name||'');
    var id=nameKey+'_'+(epName||'movie');
    arr=arr.filter(function(x){return x.id!==id;});
    var finalPoster=posterUrl||backdropUrl||n.poster_url||'';
    var finalThumb=backdropUrl||posterUrl||n.thumb_url||'';
    var prog=link?getProgressFor(link):null;
    arr.unshift({id:id,source:srcKey(),slug:n.slug||'',name:n.name||'',origin_name:n.origin_name||'',
        poster_url:finalPoster,thumb_url:finalThumb,year:n.year||'',quality:n.quality||'',
        episode_current:n.episode_current||'',tmdb:n.tmdb||{},category:n.category||[],type:n.type||'',
        ep_name:epName||'',ep_link:link||'',
        progress_time:prog?prog.time:0,progress_duration:prog?prog.duration:0,
        progress_percent:prog?prog.percent:0,time:Date.now()});
    if(arr.length>40)arr=arr.slice(0,40);setCW(arr);}catch(e){}
}

// ═══════════════════════════════════════
//  PROGRESS TRACKING
// ═══════════════════════════════════════
function getProgress(){try{return JSON.parse(localStorage.getItem(PROG_KEY))||{};}catch(e){return{};}}
function setProgress(obj){try{localStorage.setItem(PROG_KEY,JSON.stringify(obj));}catch(e){}}

function normalizeUrl(url){
    if(!url)return'';
    try{return url.trim().replace(/[?#].*$/,'').replace(/\/+$/,'');}catch(e){return url.trim();}
}

function progressKey(url){
    if(!url)return'';var norm=normalizeUrl(url);
    try{return btoa(unescape(encodeURIComponent(norm))).replace(/[^a-zA-Z0-9]/g,'').substring(0,40);}
    catch(e){return norm.substring(norm.length-40);}
}

function saveProgress(url,currentTime,duration){
    if(!url||!currentTime||!duration||currentTime<5)return;
    var prog=getProgress();var key=progressKey(url);
    prog[key]={url:url,time:Math.floor(currentTime),duration:Math.floor(duration),
        percent:Math.floor((currentTime/duration)*100),updated:Date.now()};
    var keys=Object.keys(prog);
    if(keys.length>200){keys.sort(function(a,b){return(prog[a].updated||0)-(prog[b].updated||0);});
    for(var i=0;i<keys.length-200;i++)delete prog[keys[i]];}
    setProgress(prog);
}

function getProgressFor(url){
    if(!url)return null;var prog=getProgress();var key=progressKey(url);var p=prog[key];
    if(!p)return null;
    if(Date.now()-p.updated>30*86400000){delete prog[key];setProgress(prog);return null;}
    return p;
}

function clearProgressFor(url){
    if(!url)return;var prog=getProgress();delete prog[progressKey(url)];setProgress(prog);
}

function startProgressTracking(url){
    stopProgressTracking();_currentPlayingUrl=url;
    _progressInterval=setInterval(function(){
        try{var video=document.querySelector('video');
        if(video&&video.currentTime>0&&video.duration>0){
            saveProgress(_currentPlayingUrl,video.currentTime,video.duration);
            updateCWProgress(_currentPlayingUrl,video.currentTime,video.duration);
        }}catch(e){}
    },3000);
}

function stopProgressTracking(){
    if(_progressInterval){clearInterval(_progressInterval);_progressInterval=null;}
    try{var video=document.querySelector('video');
    if(video&&_currentPlayingUrl&&video.currentTime>0&&video.duration>0){
        saveProgress(_currentPlayingUrl,video.currentTime,video.duration);
        updateCWProgress(_currentPlayingUrl,video.currentTime,video.duration);
    }}catch(e){}
    _currentPlayingUrl=null;
}

function updateCWProgress(url,currentTime,duration){
    if(!url)return;
    try{var arr=getCW();var changed=false;
    for(var i=0;i<arr.length;i++){
        if(arr[i].ep_link===url){
            arr[i].progress_time=Math.floor(currentTime);
            arr[i].progress_duration=Math.floor(duration);
            arr[i].progress_percent=Math.floor((currentTime/duration)*100);
            changed=true;break;
        }
    }
    if(changed)setCW(arr);}catch(e){}
}

function initPlayerHook(){
    Lampa.Listener.follow('player',function(e){
        if(e.type==='destroy'||e.type==='stop')stopProgressTracking();
    });
}

// ═══════════════════════════════════════
//  PLAYER / RESUME
// ═══════════════════════════════════════
function formatTime(s){
    if(!s||isNaN(s))return'0:00';s=Math.floor(s);
    var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss2=s%60;
    if(h>0)return h+':'+pd(m)+':'+pd(ss2);return m+':'+pd(ss2);
}

function resumeVideo(savedTime){
    if(!savedTime||savedTime<5)return;var attempts=0;
    var trySeek=setInterval(function(){
        attempts++;
        try{var video=document.querySelector('video');
        if(video&&video.readyState>=2&&video.duration>0){
            video.currentTime=savedTime;clearInterval(trySeek);
            Lampa.Noty.show('▶ Tiếp tục từ '+formatTime(savedTime));
        }}catch(e){}
        if(attempts>40)clearInterval(trySeek);
    },500);
}

function playWithResume(title,url,posterUrl,backdropUrl,movieData,epName){
    if(!url){Lampa.Noty.show('Không có link');return;}
    var prog=getProgressFor(url);
    if(!prog){var cw=getCW();for(var i=0;i<cw.length;i++){if(cw[i].ep_link===url&&cw[i].progress_time>0){prog={time:cw[i].progress_time,duration:cw[i].progress_duration,percent:cw[i].progress_percent};break;}}}
    if(prog&&prog.time>10&&prog.percent<95){
        Lampa.Select.show({title:'Tiếp tục xem?',items:[
            {title:'▶️ Tiếp tục từ '+formatTime(prog.time)+' / '+formatTime(prog.duration)+' ('+prog.percent+'%)',value:'resume'},
            {title:'🔄 Xem từ đầu',value:'restart'}
        ],onSelect:function(a){if(a.value==='resume')doPlay(title,url,prog.time,posterUrl,backdropUrl,movieData,epName);else{clearProgressFor(url);doPlay(title,url,0,posterUrl,backdropUrl,movieData,epName);}},onBack:function(){Lampa.Controller.toggle('content');}});
    }else doPlay(title,url,0,posterUrl,backdropUrl,movieData,epName);
}

function doPlay(title,url,resumeTime,posterUrl,backdropUrl,movieData,epName){
    if(movieData)saveContinue(movieData,epName||'',url,posterUrl||'',backdropUrl||'');
    startProgressTracking(url);Lampa.Player.play({title:title,url:url});
    if(resumeTime>0)resumeVideo(resumeTime);
}

// ═══════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════
function dly(ms){return new Promise(function(r){setTimeout(r,ms);});}
function pd(n){return(n<10?'0':'')+n;}
function E(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function cDesc(s){return String(s||'').replace(/<[^>]+>/g,'').trim()||'';}
function fTxt(s){return E(s||'').replace(/\n/g,'<br>');}
function nStr(s){return String(s||'').toLowerCase().trim().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'').replace(/\s+/g,' ');}
function fImg(u){if(!u)return'';if(u.indexOf('http')===0)return u;var b=sImg();return b?b+u:u;}

function optimizeImgUrl(url){
    if(!url)return'';var quality=imgQuality();
    if(url.indexOf('image.tmdb.org')>-1){
        if(quality==='low')return url.replace('/original','/w300').replace('/w500','/w300');
        if(quality==='medium')return url.replace('/original','/w500');
    }
    return url;
}

function nm(i){
    if(!i)return null;
    return{name:i.name||i.title||'',origin_name:i.origin_name||'',slug:i.slug||'',
        poster_url:i.poster_url||i.poster||'',thumb_url:i.thumb_url||i.thumb||'',
        year:i.year||'',quality:i.quality||'',episode_current:i.episode_current||'',
        tmdb:i.tmdb||{},category:Array.isArray(i.category)?i.category:[],
        director:i.director||'',content:i.content||'',time:i.time||'',
        episode_total:i.episode_total||'',type:i.type||'',country:i.country||[]};
}

function dType(d){if(d&&d.tmdb&&d.tmdb.type==='tv')return'tv';if(d&&d.tmdb&&d.tmdb.type==='movie')return'movie';if(d&&(d.type==='series'||d.type==='tvshows'||d.type==='hoathinh'))return'tv';if(d&&d.episode_total&&d.episode_total!=='1')return'tv';return'movie';}
function gTid(d){return(d&&d.tmdb&&d.tmdb.id)?d.tmdb.id:null;}
function gEp1(eps){for(var i=0;i<(eps||[]).length;i++)if(eps[i]&&eps[i].server_data&&eps[i].server_data.length)return eps[i].server_data[0];return null;}

// ═══════════════════════════════════════
//  TMDB API
// ═══════════════════════════════════════
async function tFetch(path){var r=await fetch('https://api.themoviedb.org/3'+path,{headers:{'Authorization':'Bearer '+TMDB_TOKEN,'Content-Type':'application/json'}});if(!r.ok)throw new Error('TMDB '+r.status);return await r.json();}

async function tFetchWithFallback(path,needOverview){
    var data=await tFetch(path);
    if(needOverview&&(!data.overview||data.overview.trim()==='')){
        var lang=tmLang();if(lang!=='en-US'){
            try{var enData=await tFetch(path.replace('language='+lang,'language=en-US'));
            if(enData.overview&&enData.overview.trim()!==''){data.overview=enData.overview;data.overview_fallback=true;}}catch(e){}
        }
    }
    return data;
}

async function gImdb(type,id){if(!id)return null;try{return(await tFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}catch(e){return null;}}

async function gSeasons(id){
    try{var r=await tFetch('/tv/'+id+'?language='+tmLang());
    if(r&&r.seasons)return r.seasons.filter(function(s){return s.season_number>0;}).map(function(s){return{season_number:s.season_number,name:s.name||('Season '+s.season_number),episode_count:s.episode_count||0};});
    }catch(e){}return[];
}

async function lGenres(type){if(_gc[type])return _gc[type];try{var r=await tFetch('/genre/'+type+'/list?language='+tmLang());_gc[type]=r.genres||[];return _gc[type];}catch(e){return[];}}
async function tPersonC(pid){try{return await tFetch('/person/'+pid+'/combined_credits?language='+tmLang());}catch(e){return null;}}

var TFN={
    trending:function(p){return tFetch('/trending/all/week?language='+tmLang()+'&page='+p);},
    trending_day:function(p){return tFetch('/trending/all/day?language='+tmLang()+'&page='+p);},
    popular_movies:function(p){return tFetch('/movie/popular?language='+tmLang()+'&page='+p);},
    popular_tv:function(p){return tFetch('/tv/popular?language='+tmLang()+'&page='+p);},
    top_movies:function(p){return tFetch('/movie/top_rated?language='+tmLang()+'&page='+p);},
    top_tv:function(p){return tFetch('/tv/top_rated?language='+tmLang()+'&page='+p);},
    now_playing:function(p){return tFetch('/movie/now_playing?language='+tmLang()+'&page='+p);},
    upcoming:function(p){return tFetch('/movie/upcoming?language='+tmLang()+'&page='+p);},
    airing_today:function(p){return tFetch('/tv/airing_today?language='+tmLang()+'&page='+p);},
    on_the_air:function(p){return tFetch('/tv/on_the_air?language='+tmLang()+'&page='+p);}
};

async function tSearchM(q,p){return await tFetch('/search/multi?language='+tmLang()+'&query='+encodeURIComponent(q)+'&page='+(p||1));}
async function tDetFull(type,id){return await tFetchWithFallback('/'+type+'/'+id+'?language='+tmLang()+'&append_to_response=credits,images,similar,external_ids',true);}
async function tImgFull(type,id){return await tFetch('/'+type+'/'+id+'/images');}
async function tDiscover(type,gid,p){return await tFetch('/discover/'+type+'?language='+tmLang()+'&sort_by=popularity.desc&with_genres='+gid+'&page='+(p||1));}
async function tSimilar(type,id,p){return await tFetch('/'+type+'/'+id+'/similar?language='+tmLang()+'&page='+(p||1));}

function tNorm(item){
    if(!item)return null;var mt=item.media_type||(item.first_air_date?'tv':'movie');
    return{tmdb_id:item.id,media_type:mt,name:item.title||item.name||'',
        poster_url:item.poster_path?TMDB_W300+item.poster_path:'',
        backdrop_url:item.backdrop_path?TMDB_W500+item.backdrop_path:'',
        year:(item.release_date||item.first_air_date||'').slice(0,4),
        vote:item.vote_average?Number(item.vote_average).toFixed(1):''};
}

function pLogo(imgs){if(!imgs||!imgs.logos||!imgs.logos.length)return null;return imgs.logos.find(function(l){return l.iso_639_1==='vi';})||imgs.logos.find(function(l){return l.iso_639_1==='en';})||imgs.logos[0]||null;}

// ═══════════════════════════════════════
//  KKPHIM / OPHIM API
// ═══════════════════════════════════════
async function sSrc(source,kw){
    try{var r=await fetch(source.api+'v1/api/tim-kiem?keyword='+encodeURIComponent(kw)+'&page=1');
    if(!r.ok)return[];var d=await r.json();return(d&&d.data&&d.data.items)||(d&&d.items)||[];
    }catch(e){return[];}
}

function mBest(items,title,orig,year){
    if(!items||!items.length)return null;var nT=nStr(title),nO=nStr(orig);
    for(var i=0;i<items.length;i++){var n1=nStr(items[i].name||items[i].title||''),n2=nStr(items[i].origin_name||items[i].original_name||'');
    if((nT&&(n1===nT||n2===nT))||(nO&&(n1===nO||n2===nO))){if(!year||!items[i].year||String(items[i].year)===String(year))return items[i];}}
    for(var j=0;j<items.length;j++){var m1=nStr(items[j].name||items[j].title||''),m2=nStr(items[j].origin_name||items[j].original_name||'');
    if((nT&&(m1.indexOf(nT)>-1||nT.indexOf(m1)>-1))||(nO&&(m2.indexOf(nO)>-1||nO.indexOf(m2)>-1))){if(!year||!items[j].year||String(items[j].year)===String(year))return items[j];}}
    return null;
}

async function fSlugs(title,orig,year){
    var r={kkphim:null,ophim:null},terms=[title];if(orig&&orig!==title)terms.push(orig);
    for(var i=0;i<terms.length;i++){
        if(!r.kkphim){var f1=mBest(await sSrc(SOURCES.kkphim,terms[i]),title,orig,year);if(f1&&f1.slug)r.kkphim=f1.slug;}
        if(!r.ophim){var f2=mBest(await sSrc(SOURCES.ophim,terms[i]),title,orig,year);if(f2&&f2.slug)r.ophim=f2.slug;}
        if(r.kkphim&&r.ophim)break;
    }
    return r;
}

async function fDet(source,slug){
    try{var r=await fetch(source.api+'phim/'+slug);if(!r.ok)return null;
    var d=await r.json();return{movie:d.movie||d||{},episodes:d.episodes||[]};}catch(e){return null;}
}

function exSn(name,slug){var m=name.match(/season\s*(\d+)/i)||name.match(/phần\s*(\d+)/i)||slug.match(/season-(\d+)/i)||slug.match(/phan-(\d+)/i)||name.match(/S(\d+)/);if(m)return parseInt(m[1]);var nm2=name.match(/(\d+)$/)||slug.match(/-(\d+)$/);if(nm2){var n=parseInt(nm2[1]);if(n>=2&&n<=30)return n;}return 1;}

async function fSeasonSlugs(source,title,orig){
    var results=[];
    try{var items=await sSrc(source,title);if(!items.length&&orig)items=await sSrc(source,orig);
    var nT=nStr(title),nO=nStr(orig);
    for(var i=0;i<items.length;i++){var it=items[i];if(!it.slug)continue;
        var n1=nStr(it.name||it.title||''),n2=nStr(it.origin_name||it.original_name||'');
        var match=false;
        if(nT&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1||n1===nT))match=true;
        if(nO&&(n2.indexOf(nO)>-1||nO.indexOf(n2)>-1||n2===nO))match=true;
        if(match)results.push({slug:it.slug,name:it.name||it.title||'',season:exSn(it.name||it.title||'',it.slug||''),source:source});
    }}catch(e){}return results;
}

// ═══════════════════════════════════════
//  TORRENT: TORRSERVER
// ═══════════════════════════════════════
function cTio(raw){if(!raw)return'';raw=String(raw).trim();if(!raw)return'';var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);if(m)return m[1];m=raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);if(m)return m[1].replace(/\/+$/,'');m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);if(m)return m[1];if(raw.indexOf('torrentio.strem.fun')>-1){raw=raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i,'').replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i,'').replace(/^\/+|\/+$/g,'');if(raw&&raw.indexOf('=')>-1)return raw.replace(/\|/g,'%7C');return'';}raw=raw.replace(/^\/+|\/+$/g,'').replace(/\|/g,'%7C');return raw.indexOf('=')===-1?'':raw;}
function cAio(raw){if(!raw)return'';return String(raw).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');}

function tsU(p){var h=tsHost();if(!h)return'';h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;return h+p;}
function tsH(){var h={'Content-Type':'application/json'};var pw=tsPass();if(pw)h['Authorization']='Basic '+btoa('admin:'+pw);return h;}
function bMag(h){return'magnet:?xt=urn:btih:'+h+'&tr='+encodeURIComponent('udp://tracker.opentrackr.org:1337/announce');}

async function playTS(stream,title,poster,fi,movieData,epName){
    if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TS!');return;}Lampa.Noty.show('Gửi TS...');
    try{var u=tsU('/torrents');var r=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'add',link:bMag(stream.infoHash),title:title||'',poster:poster||'',save_to_db:false})});
    if(!r.ok)throw new Error('TS:'+r.status);var td=await r.json();var hash=td.hash||stream.infoHash;
    await dly(2000);var info=null,rt=0;
    while(rt<3){try{var r2=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'get',hash:hash})});info=await r2.json();if(info&&info.file_stats&&info.file_stats.length)break;}catch(e){}rt++;await dly(1500);}
    var files=[];if(info&&info.file_stats)files=info.file_stats.filter(function(f){return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);}).sort(function(a,b){return(a.id||0)-(b.id||0);});
    var playUrl='';
    if(!files.length)playUrl=tsU('/stream/fname?link='+hash+'&index=0&play');
    else if(files.length===1)playUrl=tsU('/stream/fname?link='+hash+'&index='+(files[0].id||0)+'&play');
    else{Lampa.Select.show({title:'Chọn file',items:files.map(function(f){return{title:(f.path||'').split('/').pop(),value:f};}),onSelect:function(a){var fUrl=tsU('/stream/fname?link='+hash+'&index='+a.value.id+'&play');playWithResume(title,fUrl,poster,'',movieData,epName);},onBack:function(){Lampa.Controller.toggle('content');}});return;}
    if(playUrl)playWithResume(title,playUrl,poster,'',movieData,epName);
    }catch(e){Lampa.Noty.show('Lỗi TS: '+(e.message||''));}
}

// ═══════════════════════════════════════
//  TORRENT: STREAM PARSERS
// ═══════════════════════════════════════
function parseAIOStream(st){
    var rawName=String(st.name||st.title||''),rawDesc=String(st.description||''),rawAll=rawName+'\n'+rawDesc;
    var name='',source='',seeds='',size='',quality='',filename='';
    var nameLines=rawName.split('\n');var firstLine=nameLines[0].trim();
    var trackerMatch=firstLine.match(/^\[([^\]]+)\]\s*(.*)/);
    if(trackerMatch){source=trackerMatch[1].trim();name=trackerMatch[2].trim();}else name=firstLine;
    if(nameLines.length>1){var line2=nameLines[1].trim();var qm2=line2.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);if(qm2)quality=qm2[1].toUpperCase();}
    var descLines=rawDesc.split('\n');
    for(var i=0;i<descLines.length;i++){var dl=descLines[i].trim();if(!dl)continue;
        if(!size){var sm=dl.match(/[📀💾]\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i);if(sm)size=sm[1].trim();}
        if(!source){var srcm=dl.match(/⚙️\s*(.+)/);if(srcm)source=srcm[1].trim();}
        if(!seeds){var sdm=dl.match(/👤\s*(\d+)/);if(sdm)seeds=sdm[1];if(!seeds){var sdm2=dl.match(/[Ss]eed(?:er)?s?[:\s]*(\d+)/);if(sdm2)seeds=sdm2[1];}}
        if(!filename){var fnm=dl.match(/📁\s*(.+)/);if(fnm)filename=fnm[1].trim();}
        if(!quality){var qm=dl.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);if(qm)quality=qm[1].toUpperCase();}
    }
    if(!quality){var qm3=rawAll.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);if(qm3)quality=qm3[1].toUpperCase();}
    if(st.behaviorHints&&typeof st.behaviorHints==='object'){var bh=st.behaviorHints;if(!filename&&bh.filename)filename=String(bh.filename).trim();if(!size&&bh.videoSize){var bytes=Number(bh.videoSize);if(!isNaN(bytes)&&bytes>0){if(bytes>=1099511627776)size=(bytes/1099511627776).toFixed(2)+' TB';else if(bytes>=1073741824)size=(bytes/1073741824).toFixed(1)+' GB';else if(bytes>=1048576)size=(bytes/1048576).toFixed(0)+' MB';}}if(!source&&bh.bingeGroup){var bgm=String(bh.bingeGroup).match(/\|([^|]+)$/);if(bgm)source=bgm[1].trim();}}
    if(!name||name==='?'){if(filename)name=filename.replace(/\.\w{2,4}$/,'').replace(/\./g,' ');}
    return{name:name||'Unknown',infoHash:st.infoHash||'',fileIdx:st.fileIdx,url:st.url||'',size:size,seeds:seeds,quality:quality,source:source,filename:filename};
}

function parseTorrentioStream(st){
    var rawName=String(st.name||st.title||''),rawDesc=String(st.description||''),rawAll=rawName+'\n'+rawDesc;
    var name='',source='',seeds='',size='',quality='',filename='';
    var nameLines=rawName.split('\n');name=nameLines[0].replace(/^[^\w\[({]*/,'').trim();
    if(nameLines.length>1){var qLine=nameLines.slice(1).join(' ');var qm=qLine.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);if(qm)quality=qm[1].toUpperCase();}
    var descLines=rawDesc.split('\n');
    for(var i=0;i<descLines.length;i++){var dl=descLines[i].trim();if(!dl)continue;
        if(!size){var sm=dl.match(/💾\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i);if(sm)size=sm[1].trim();}
        if(!seeds){var sdm=dl.match(/👤\s*(\d+)/);if(sdm)seeds=sdm[1];}
        if(!source){var srcm=dl.match(/[⚙️🔗]\s*([\w\.\-]+)/);if(srcm)source=srcm[1].trim();}
        if(!filename){var fnm=dl.match(/📁\s*(.+)/);if(fnm)filename=fnm[1].trim();}
        if(i===0&&!dl.match(/^[💾👤⚙️🔗📁🎬🎥🔊🌐📀📺]/)&&!source){if(dl.match(/^[\w\.\-]+$/)&&dl.length<30)source=dl;}
    }
    if(!quality){var qm2=rawAll.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);if(qm2)quality=qm2[1].toUpperCase();}
    if(!size){var sm2=rawAll.match(/\b([\d.,]+)\s*(GB|GiB|MB|MiB|TB)\b/i);if(sm2)size=sm2[1]+' '+sm2[2];}
    if(!seeds){var sdm2=rawAll.match(/[Ss]eed(?:er)?s?[:\s]*(\d+)/);if(sdm2)seeds=sdm2[1];}
    if(st.behaviorHints&&typeof st.behaviorHints==='object'){var bh=st.behaviorHints;if(!filename&&bh.filename)filename=String(bh.filename).trim();if(!size&&bh.videoSize){var bytes=Number(bh.videoSize);if(!isNaN(bytes)&&bytes>0){if(bytes>=1099511627776)size=(bytes/1099511627776).toFixed(2)+' TB';else if(bytes>=1073741824)size=(bytes/1073741824).toFixed(1)+' GB';else if(bytes>=1048576)size=(bytes/1048576).toFixed(0)+' MB';}}if(!source&&bh.bingeGroup){var bgm=String(bh.bingeGroup).match(/\|([^|]+)$/);if(bgm)source=bgm[1].trim();}}
    if(!name||name==='?'){if(filename)name=filename.replace(/\.\w{2,4}$/,'').replace(/\./g,' ');}
    return{name:name||'Unknown',infoHash:st.infoHash||'',fileIdx:st.fileIdx,url:st.url||'',size:size,seeds:seeds,quality:quality,source:source,filename:filename};
}

function pStream(st){
    if(!st)return{name:'?',infoHash:'',fileIdx:undefined,url:'',size:'',seeds:'',quality:'',source:'',filename:''};
    var engine=tEngine();if(engine==='aio')return parseAIOStream(st);
    var rawDesc=String(st.description||''),rawName=String(st.name||st.title||'');
    if(rawDesc.match(/⚙️|🎥|🔊|🌐|📺/)||rawName.match(/^\[[\w\-\.]+\]/))return parseAIOStream(st);
    return parseTorrentioStream(st);
}

function fmtStream(s){
    var parts=[];var line1=s.name||'Unknown';
    if(s.quality&&line1.toUpperCase().indexOf(s.quality)===-1)line1+=' ['+s.quality+']';
    parts.push(line1);var meta=[];
    if(s.size)meta.push('💾 '+s.size);if(s.seeds)meta.push('👤 '+s.seeds);if(s.source)meta.push('⚙️ '+s.source);
    if(meta.length)parts.push(meta.join('  '));
    if(s.filename&&s.filename!==s.name){var shortFn=s.filename;if(shortFn.length>60)shortFn=shortFn.substring(0,57)+'...';parts.push('📁 '+shortFn);}
    return parts.join('\n');
}

// ═══════════════════════════════════════
//  TORRENT: FETCH & PLAY
// ═══════════════════════════════════════
function tioU(type,imdb,s,e){var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;var c=cTio(tioConf());return TIO_BASE+(c?'/'+c:'')+'/stream/'+t+'/'+id+'.json';}
function aioU(type,imdb,s,e){var base=cAio(aioUrl());if(!base)return'';var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;return base+'/stream/'+t+'/'+id+'.json';}

async function fStreams(type,imdb,s,e){
    var eng=tEngine(),url;
    if(eng==='aio'){url=aioU(type,imdb,s,e);if(!url)throw new Error('Chưa cấu hình AIO URL');}
    else url=tioU(type,imdb,s,e);
    var r=await fetch(url);if(!r.ok)throw new Error(eng+' HTTP '+r.status);
    var d=await r.json();var streams=d.streams||[];
    if(!streams.length){if(Array.isArray(d))streams=d;else if(d.data&&Array.isArray(d.data))streams=d.data;}
    return streams.map(pStream).filter(function(s2){return s2.infoHash||s2.url;});
}

function showStr(streams,title,poster,movieData,epName){
    var ts=!!tsHost();if(!streams.length){Lampa.Noty.show('Không tìm thấy stream');return;}
    Lampa.Select.show({title:title+' ('+streams.length+')',items:streams.slice(0,50).map(function(s){return{title:fmtStream(s),value:s};}),
    onSelect:function(a){var s=a.value;
        if(ts&&s.infoHash)playTS(s,title,poster,s.fileIdx,movieData,epName);
        else if(s.url)playWithResume(title,s.url,poster,'',movieData,epName);
        else if(s.infoHash&&!ts)Lampa.Noty.show('Cần TorrServer');
        else Lampa.Noty.show('Không có link');
    },onBack:function(){Lampa.Controller.toggle('content');}});
}

async function oTorMov(tid,title,poster,imdb,movieData){Lampa.Noty.show('Tìm torrent...');try{var id=imdb||await gImdb('movie',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var st=await fStreams('movie',id);if(!st.length){Lampa.Noty.show('Không có stream');return;}showStr(st,title,poster,movieData,'Torrent');}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
async function oTorTV(tid,title,poster,imdb,movieData){Lampa.Noty.show('Tải season...');try{var id=imdb||await gImdb('tv',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var sn=await gSeasons(tid);if(sn.length>1){Lampa.Select.show({title:'Chọn Season',items:sn.map(function(s){return{title:s.name+(s.episode_count?' ('+s.episode_count+' tập)':''),value:s};}),onSelect:function(a){pTorEp(a.value,id,title,poster,movieData);},onBack:function(){Lampa.Controller.toggle('content');}});}else if(sn.length===1)pTorEp(sn[0],id,title,poster,movieData);else Lampa.Noty.show('Không có season');}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
function pTorEp(season,imdb,title,poster,movieData){var items=[];for(var i=1;i<=(season.episode_count||1);i++)items.push({title:'S'+pd(season.season_number)+'E'+pd(i),value:{s:season.season_number,e:i}});Lampa.Select.show({title:season.name,items:items,onSelect:async function(a){var lb=title+' S'+pd(a.value.s)+'E'+pd(a.value.e);Lampa.Noty.show('Tìm '+lb+'...');try{var st=await fStreams('tv',imdb,a.value.s,a.value.e);if(!st.length){Lampa.Noty.show('Không có');return;}showStr(st,lb,poster,movieData,'S'+pd(a.value.s)+'E'+pd(a.value.e));}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}},onBack:function(){Lampa.Controller.toggle('content');}});}

// ═══════════════════════════════════════
//  EXPORT to window.KK
// ═══════════════════════════════════════
window.KK={
    // Constants
    SOURCES:SOURCES,TMDB_IMG:TMDB_IMG,TMDB_W500:TMDB_W500,TMDB_W300:TMDB_W300,
    TIO_BASE:TIO_BASE,STG_KEY:STG_KEY,CW_KEY:CW_KEY,HIST_KEY:HIST_KEY,PROG_KEY:PROG_KEY,
    // Settings
    ls:ls,ss:ss,srcKey:srcKey,src:src,sApi:sApi,sImg:sImg,
    tsHost:tsHost,tsPass:tsPass,tioConf:tioConf,aioUrl:aioUrl,tEngine:tEngine,
    cardSt:cardSt,tmLang:tmLang,cardMode:cardMode,catMode:catMode,
    rowCount:rowCount,fontScale:fontScale,imgQuality:imgQuality,
    // Storage
    getCW:getCW,setCW:setCW,getHist:getHist,setHist:setHist,
    saveHistory:saveHistory,saveContinue:saveContinue,
    // Progress
    getProgress:getProgress,setProgress:setProgress,
    getProgressFor:getProgressFor,clearProgressFor:clearProgressFor,
    saveProgress:saveProgress,startProgressTracking:startProgressTracking,
    stopProgressTracking:stopProgressTracking,initPlayerHook:initPlayerHook,
    // Player
    formatTime:formatTime,playWithResume:playWithResume,doPlay:doPlay,
    // Utils
    dly:dly,pd:pd,E:E,cDesc:cDesc,fTxt:fTxt,nStr:nStr,fImg:fImg,
    optimizeImgUrl:optimizeImgUrl,nm:nm,dType:dType,gTid:gTid,gEp1:gEp1,
    // TMDB
    tFetch:tFetch,tFetchWithFallback:tFetchWithFallback,
    gImdb:gImdb,gSeasons:gSeasons,lGenres:lGenres,tPersonC:tPersonC,
    TFN:TFN,tSearchM:tSearchM,tDetFull:tDetFull,tImgFull:tImgFull,
    tDiscover:tDiscover,tSimilar:tSimilar,tNorm:tNorm,pLogo:pLogo,
    // KKPhim/OPhim
    sSrc:sSrc,mBest:mBest,fSlugs:fSlugs,fDet:fDet,
    exSn:exSn,fSeasonSlugs:fSeasonSlugs,
    // Torrent
    cTio:cTio,cAio:cAio,tsU:tsU,tsH:tsH,
    playTS:playTS,pStream:pStream,fmtStream:fmtStream,
    fStreams:fStreams,showStr:showStr,
    oTorMov:oTorMov,oTorTV:oTorTV,pTorEp:pTorEp,
    // Reset genre cache
    resetGC:function(){_gc={movie:null,tv:null};}
};

})();