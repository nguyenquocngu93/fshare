/* KKPhim Plugin v3.0 */
(function(){
'use strict';
if(window.__kkphim_plugin_started)return;
window.__kkphim_plugin_started=true;

var SOURCES={
    kkphim:{key:'kkphim',name:'KKPhim',api:'https://phimapi.com/',img:'https://phimimg.com/'},
    ophim:{key:'ophim',name:'OPhim',api:'https://ophim1.com/',img:'https://img.ophim.live/uploads/movies/'}
};
var TMDB_TOKEN='eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
var TMDB_IMG='https://image.tmdb.org/t/p/original';
var TMDB_W500='https://image.tmdb.org/t/p/w500';
var TIO_BASE='https://torrentio.strem.fun';
var STG_KEY='kkphim_settings';
var CSS_URL='https://nguyenquocngu93.github.io/fshare/style.css';
var _gc={movie:null,tv:null};

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

function fImg(u){if(!u)return'';if(u.indexOf('http')===0)return u;var b=sImg();return b?b+u:u;}
function dly(ms){return new Promise(function(r){setTimeout(r,ms);});}
function pd(n){return(n<10?'0':'')+n;}
function E(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function cDesc(s){return String(s||'').replace(/<[^>]+>/g,'').trim()||'Không có mô tả';}
function fTxt(s){return E(s||'').replace(/\n/g,'<br>');}
function nStr(s){return String(s||'').toLowerCase().trim().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'').replace(/\s+/g,' ');}

function nm(i){
    if(!i)return null;
    return{name:i.name||i.title||'',origin_name:i.origin_name||'',slug:i.slug||'',
        poster_url:i.poster_url||i.poster||'',thumb_url:i.thumb_url||i.thumb||'',
        year:i.year||'',quality:i.quality||'',episode_current:i.episode_current||'',
        tmdb:i.tmdb||{},category:Array.isArray(i.category)?i.category:[],
        director:i.director||'',content:i.content||'',time:i.time||'',
        episode_total:i.episode_total||'',type:i.type||''};
}
function dType(d){if(d&&d.tmdb&&d.tmdb.type==='tv')return'tv';if(d&&d.tmdb&&d.tmdb.type==='movie')return'movie';if(d&&(d.type==='series'||d.type==='tvshows'||d.type==='hoathinh'))return'tv';if(d&&d.episode_total&&d.episode_total!=='1')return'tv';return'movie';}
function gTid(d){return(d&&d.tmdb&&d.tmdb.id)?d.tmdb.id:null;}
function gEp1(eps){for(var i=0;i<(eps||[]).length;i++)if(eps[i]&&eps[i].server_data&&eps[i].server_data.length)return eps[i].server_data[0];return null;}
function pLogo(imgs){if(!imgs||!imgs.logos||!imgs.logos.length)return null;return imgs.logos.find(function(l){return l.iso_639_1==='vi';})||imgs.logos.find(function(l){return l.iso_639_1==='en';})||imgs.logos[0]||null;}
function cTio(raw){if(!raw)return'';raw=String(raw).trim();if(!raw)return'';var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);if(m)return m[1];m=raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);if(m)return m[1].replace(/\/+$/,'');m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);if(m)return m[1];if(raw.indexOf('torrentio.strem.fun')>-1){raw=raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i,'').replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i,'').replace(/^\/+|\/+$/g,'');if(raw&&raw.indexOf('=')>-1)return raw.replace(/\|/g,'%7C');return'';}raw=raw.replace(/^\/+|\/+$/g,'').replace(/\|/g,'%7C');return raw.indexOf('=')===-1?'':raw;}
function cAio(raw){if(!raw)return'';return String(raw).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');}

function bE(el,fn){
    var sx=0,sy=0,mv=false,tc=false;
    el.on('touchstart',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;mv=false;}});
    el.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))mv=true;});
    el.on('touchend',function(e){if(mv)return;tc=true;e.preventDefault();e.stopPropagation();setTimeout(function(){fn.call(el[0],e);},100);setTimeout(function(){tc=false;},350);});
    el.on('click',function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();fn.call(this,e);});
    el.on('hover:enter',function(e){fn.call(this,e);});
}
function eScr(scroll){var el=scroll.render();el.css({overflow:'hidden',position:'relative',height:'100%'});var b=el.find('.scroll__body'),p={'transform':'none','overflow-y':'auto','overflow-x':'hidden','-webkit-overflow-scrolling':'touch',height:'100%','padding-bottom':'8em','touch-action':'pan-y'};b.css($.extend({position:'relative'},p));if(b[0])Object.keys(p).forEach(function(k){b[0].style.setProperty(k,p[k],'important');});}
function cScr(s){try{s.render().find('.scroll__body').empty();}catch(e){}}
function aCtrl(scroll){
    Lampa.Controller.add('content',{
        toggle:function(){Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},
        left:function(){if(Navigator.canmove('left'))Navigator.move('left');else Lampa.Controller.toggle('menu');},
        right:function(){Navigator.move('right');},
        up:function(){if(Navigator.canmove('up'))Navigator.move('up');else Lampa.Controller.toggle('head');},
        down:function(){Navigator.move('down');},
        back:function(){Lampa.Activity.backward();}
    });
    setTimeout(function(){Lampa.Controller.toggle('content');Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},0);
}
function oSearch(){function go(kw){kw=String(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'Tìm kiếm',component:'kkphim_search',keyword:kw,page_num:1});}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm phim',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm phim:'));}
function oTSearch(){function go(kw){kw=String(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'TMDB: '+kw,component:'kkphim_tmdb_search',keyword:kw,page_num:1});}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm TMDB',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm TMDB:'));}

function pStream(st){
    var rawName=String(st.name||'');var rawDesc=String(st.description||'');var rawTitle=String(st.title||'');var rawAll=rawName+'\n'+rawDesc+'\n'+rawTitle;
    var name=rawName.split('\n')[0].trim()||rawTitle.split('\n')[0].trim()||'?';
    var qual='';var qm=rawAll.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);if(qm)qual=qm[1].toUpperCase();
    var size='';var sP=[/💾\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i,/\b([\d.,]+)\s*(TB)\b/i,/\b([\d.,]+)\s*(GB|GiB)\b/i,/\b([\d.,]+)\s*(MB|MiB)\b/i];
    for(var i=0;i<sP.length;i++){var sm=rawAll.match(sP[i]);if(sm){size=sm[2]?sm[1]+' '+sm[2]:sm[1].trim();break;}}
    var seeds='';var sdP=[/👤\s*(?:Seeders?:?\s*)?(\d+)/i,/Seeders?:?\s*(\d+)/i,/(\d+)\s*seed/i];
    for(var j=0;j<sdP.length;j++){var se=rawAll.match(sdP[j]);if(se){seeds=se[1];break;}}
    var source='';var srP=[/🔗\s*(?:Source:?\s*)?([\w\.\-]+)/i,/Source:?\s*([\w\.\-]+)/i,/\[([A-Z0-9\-]+)\]/];
    for(var k=0;k<srP.length;k++){var srm=rawAll.match(srP[k]);if(srm){source=srm[1];break;}}
    var filename='';var fnm=rawAll.match(/📁\s*(.+)/);if(fnm)filename=fnm[1].trim();
    if(st.behaviorHints&&typeof st.behaviorHints==='object'){
        var bh=st.behaviorHints;
        if(!filename&&bh.filename)filename=String(bh.filename).trim();
        if(!size&&bh.videoSize){var bytes=Number(bh.videoSize);if(!isNaN(bytes)&&bytes>0){if(bytes>=1099511627776)size=(bytes/1099511627776).toFixed(2)+' TB';else if(bytes>=1073741824)size=(bytes/1073741824).toFixed(1)+' GB';else if(bytes>=1048576)size=(bytes/1048576).toFixed(0)+' MB';}}
        if(bh.bingeGroup){var bg=String(bh.bingeGroup);if(!qual){var bqm=bg.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);if(bqm)qual=bqm[1].toUpperCase();}}
        if(!qual&&filename){var fqm=filename.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);if(fqm)qual=fqm[1].toUpperCase();}
    }
    return{name:name,infoHash:st.infoHash||'',fileIdx:st.fileIdx,url:st.url||'',size:size,seeds:seeds,quality:qual,source:source,filename:filename,rawName:rawName,rawDesc:rawDesc,rawTitle:rawTitle};
}
function fmtStream(s){
    var line1=s.name;if(s.quality&&line1.toUpperCase().indexOf(s.quality)===-1)line1+=' ['+s.quality+']';
    var meta=[];if(s.size)meta.push('💾 '+s.size);if(s.seeds)meta.push('👤 '+s.seeds);if(s.source)meta.push('🔗 '+s.source);
    var result=line1;if(meta.length)result+='\n'+meta.join('  ');
    if(s.filename){var fn=s.filename.length>60?s.filename.substring(0,60)+'...':s.filename;result+='\n📁 '+fn;}
    return result;
}

async function tFetch(path){var r=await fetch('https://api.themoviedb.org/3'+path,{headers:{'Authorization':'Bearer '+TMDB_TOKEN,'Content-Type':'application/json'}});if(!r.ok)throw new Error('TMDB '+r.status);return await r.json();}
async function gImdb(type,id){if(!id)return null;try{return(await tFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}catch(e){return null;}}
async function gSeasons(id){try{var r=await tFetch('/tv/'+id+'?language='+tmLang());if(r&&r.seasons)return r.seasons.filter(function(s){return s.season_number>0;}).map(function(s){return{season_number:s.season_number,name:s.name||('Season '+s.season_number),episode_count:s.episode_count||0};});}catch(e){}return[];}
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
async function tDetFull(type,id){return await tFetch('/'+type+'/'+id+'?language='+tmLang()+'&append_to_response=credits,images,similar,external_ids');}
async function tImgFull(type,id){return await tFetch('/'+type+'/'+id+'/images');}
async function tDiscover(type,gid,p){return await tFetch('/discover/'+type+'?language='+tmLang()+'&sort_by=popularity.desc&with_genres='+gid+'&page='+(p||1));}
async function tSimilar(type,id,p){return await tFetch('/'+type+'/'+id+'/similar?language='+tmLang()+'&page='+(p||1));}
async function tRec(type,id,p){return await tFetch('/'+type+'/'+id+'/recommendations?language='+tmLang()+'&page='+(p||1));}
async function tRand(type){return await tFetch('/'+type+'/popular?language='+tmLang()+'&page='+(Math.floor(Math.random()*10)+1));}
function tNorm(item){if(!item)return null;var mt=item.media_type||(item.first_air_date?'tv':'movie');return{tmdb_id:item.id,media_type:mt,name:item.title||item.name||'',poster_url:item.poster_path?TMDB_W500+item.poster_path:'',year:(item.release_date||item.first_air_date||'').slice(0,4),vote:item.vote_average?Number(item.vote_average).toFixed(1):''};}

async function sSrc(source,kw){try{var r=await fetch(source.api+'v1/api/tim-kiem?keyword='+encodeURIComponent(kw)+'&page=1');if(!r.ok)return[];var d=await r.json();return(d&&d.data&&d.data.items)||(d&&d.items)||[];}catch(e){return[];}}
function mBest(items,title,orig,year){if(!items||!items.length)return null;var nT=nStr(title),nO=nStr(orig);for(var i=0;i<items.length;i++){var n1=nStr(items[i].name||items[i].title||''),n2=nStr(items[i].origin_name||items[i].original_name||'');if((nT&&(n1===nT||n2===nT))||(nO&&(n1===nO||n2===nO))){if(!year||!items[i].year||String(items[i].year)===String(year))return items[i];}}for(var j=0;j<items.length;j++){var m1=nStr(items[j].name||items[j].title||''),m2=nStr(items[j].origin_name||items[j].original_name||'');if((nT&&(m1.indexOf(nT)>-1||nT.indexOf(m1)>-1))||(nO&&(m2.indexOf(nO)>-1||nO.indexOf(m2)>-1))){if(!year||!items[j].year||String(items[j].year)===String(year))return items[j];}}return null;}
async function fSlugs(title,orig,year){var r={kkphim:null,ophim:null},terms=[title];if(orig&&orig!==title)terms.push(orig);for(var i=0;i<terms.length;i++){if(!r.kkphim){var f1=mBest(await sSrc(SOURCES.kkphim,terms[i]),title,orig,year);if(f1&&f1.slug)r.kkphim=f1.slug;}if(!r.ophim){var f2=mBest(await sSrc(SOURCES.ophim,terms[i]),title,orig,year);if(f2&&f2.slug)r.ophim=f2.slug;}if(r.kkphim&&r.ophim)break;}return r;}
async function fDet(source,slug){try{var r=await fetch(source.api+'phim/'+slug);if(!r.ok)return null;var d=await r.json();return{movie:d.movie||d||{},episodes:d.episodes||[]};}catch(e){return null;}}
function exSn(name,slug){var m=name.match(/season\s*(\d+)/i)||name.match(/phần\s*(\d+)/i)||slug.match(/season-(\d+)/i)||slug.match(/phan-(\d+)/i)||name.match(/S(\d+)/);if(m)return parseInt(m[1]);var nm2=name.match(/(\d+)$/)||slug.match(/-(\d+)$/);if(nm2){var n=parseInt(nm2[1]);if(n>=2&&n<=30)return n;}return 1;}
async function fSeasonSlugs(source,title,orig){var results=[];try{var items=await sSrc(source,title);if(!items.length&&orig)items=await sSrc(source,orig);var nT=nStr(title),nO=nStr(orig);for(var i=0;i<items.length;i++){var it=items[i];if(!it.slug)continue;var n1=nStr(it.name||it.title||''),n2=nStr(it.origin_name||it.original_name||'');var match=false;if(nT&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1||n1===nT))match=true;if(nO&&(n2.indexOf(nO)>-1||nO.indexOf(n2)>-1||n2===nO))match=true;if(!match&&results.length>0){var bs=nStr(results[0].slug),cs=nStr(it.slug);if(cs.indexOf(bs)>-1||bs.indexOf(cs)>-1)match=true;}if(match)results.push({slug:it.slug,name:it.name||it.title||'',season:exSn(it.name||it.title||'',it.slug||''),source:source});}}catch(e){}return results;}

function tsU(p){var h=tsHost();if(!h)return'';h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;return h+p;}
function tsH(){var h={'Content-Type':'application/json'};var pw=tsPass();if(pw)h['Authorization']='Basic '+btoa('admin:'+pw);return h;}
function bMag(h){var m='magnet:?xt=urn:btih:'+h;['udp://tracker.opentrackr.org:1337/announce','udp://open.stealth.si:80/announce'].forEach(function(t){m+='&tr='+encodeURIComponent(t);});return m;}
async function playTS(stream,title,poster,fi){
    if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TS!');return;}
    Lampa.Noty.show('Gửi TS...');
    try{
        var u=tsU('/torrents');
        var r=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'add',link:bMag(stream.infoHash),title:title||'',poster:poster||'',save_to_db:false})});
        if(!r.ok)throw new Error('TS:'+r.status);
        var td=await r.json();var hash=td.hash||stream.infoHash;
        await dly(2000);
        var info=null,rt=0;
        while(rt<3){try{var r2=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'get',hash:hash})});info=await r2.json();if(info&&info.file_stats&&info.file_stats.length)break;}catch(e){}rt++;await dly(1500);}
        var files=[];
        if(info&&info.file_stats)files=info.file_stats.filter(function(f){return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);}).sort(function(a,b){return(a.id||0)-(b.id||0);});
        if(!files.length)Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index=0&play')});
        else if(files.length===1)Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index='+(files[0].id||0)+'&play')});
        else if(fi!==undefined&&fi!==null&&fi>=0)Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index='+(files[fi].id||fi)+'&play')});
        else{Lampa.Select.show({title:'Chọn file',items:files.map(function(f){return{title:(f.path||'').split('/').pop()+(f.length?' ('+(f.length/1048576).toFixed(0)+'MB)':''),value:f};}),onSelect:function(a){Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index='+a.value.id+'&play')});},onBack:function(){Lampa.Controller.toggle('content');}});}
    }catch(e){Lampa.Noty.show('Lỗi TS: '+(e.message||''));}
}

function tioU(type,imdb,s,e){var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;var c=cTio(tioConf());return TIO_BASE+(c?'/'+c:'')+'/stream/'+t+'/'+id+'.json';}
function aioU(type,imdb,s,e){var base=cAio(aioUrl());if(!base)return'';var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;return base+'/stream/'+t+'/'+id+'.json';}
async function fStreams(type,imdb,s,e){var eng=tEngine(),url;if(eng==='aio'){url=aioU(type,imdb,s,e);if(!url)throw new Error('Chưa cấu hình AIO');}else{url=tioU(type,imdb,s,e);}var r=await fetch(url);if(!r.ok)throw new Error(eng+' '+r.status);var d=await r.json();return(d.streams||[]).map(pStream);}
function showStr(streams,title,poster){
    var ts=!!tsHost(),eng=tEngine()==='aio'?'AIO':'Torrent';
    Lampa.Select.show({title:eng+': '+title+' ('+streams.length+')'+(ts?' → TS':''),items:streams.slice(0,40).map(function(s){return{title:fmtStream(s),value:s};}),onSelect:function(a){var s=a.value;if(ts&&s.infoHash)playTS(s,title,poster,s.fileIdx);else if(s.url)Lampa.Player.play({title:title,url:s.url});else Lampa.Noty.show(s.infoHash?'Chưa cấu hình TS!':'Không có link');},onBack:function(){Lampa.Controller.toggle('content');}});
}
async function oTorMov(tid,title,poster,imdb){Lampa.Noty.show('Tìm torrent...');try{var id=imdb||await gImdb('movie',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var st=await fStreams('movie',id);if(!st.length){Lampa.Noty.show('Không có stream');return;}showStr(st,title,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
async function oTorTV(tid,title,poster,imdb){Lampa.Noty.show('Tải season...');try{var id=imdb||await gImdb('tv',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var sn=await gSeasons(tid);if(sn.length>1){Lampa.Select.show({title:'Chọn Season',items:sn.map(function(s){return{title:s.name+(s.episode_count?' ('+s.episode_count+' tập)':''),value:s};}),onSelect:function(a){pTorEp(a.value,id,title,poster);},onBack:function(){Lampa.Controller.toggle('content');}});}else if(sn.length===1)pTorEp(sn[0],id,title,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
function pTorEp(season,imdb,title,poster){var items=[];for(var i=1;i<=(season.episode_count||1);i++)items.push({title:'S'+pd(season.season_number)+'E'+pd(i),value:{s:season.season_number,e:i}});Lampa.Select.show({title:season.name,items:items,onSelect:async function(a){var lb=title+' S'+pd(a.value.s)+'E'+pd(a.value.e);Lampa.Noty.show('Tìm '+lb+'...');try{var st=await fStreams('tv',imdb,a.value.s,a.value.e);if(!st.length){Lampa.Noty.show('Không có');return;}showStr(st,lb,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}},onBack:function(){Lampa.Controller.toggle('content');}});}

/* ══ CARDS ══ */
function mkC(item){
    var n=nm(item);if(!n)return $('<div></div>');
    var p=fImg(n.poster_url||n.thumb_url);
    var h='<div class="kk-card selector">';
    h+='<div class="kk-card-img">';
    if(p)h+='<img src="'+p+'" loading="lazy">';
    else h+='<div class="kk-card-noposter"><span>No Poster</span></div>';
    if(n.quality)h+='<div class="kk-card-q">'+E(n.quality)+'</div>';
    if(n.episode_current)h+='<div class="kk-card-ep">'+E(n.episode_current)+'</div>';
    h+='</div>';
    h+='<div class="kk-card-body">';
    h+='<div class="kk-card-name">'+E(n.name)+'</div>';
    if(n.origin_name&&n.origin_name!==n.name)h+='<div class="kk-card-origin">'+E(n.origin_name)+'</div>';
    h+='<div class="kk-card-meta">';
    if(n.year)h+='<span class="kk-card-year">'+E(n.year)+'</span>';
    if(n.time)h+='<span class="kk-card-time">'+E(n.time)+'</span>';
    if(n.episode_total&&n.episode_total!=='1')h+='<span class="kk-card-eps">'+E(n.episode_total)+' tập</span>';
    h+='</div>';
    if(n.category&&n.category.length){var cats=n.category.slice(0,2).map(function(c){return E(c.name||'');}).join(' · ');h+='<div class="kk-card-cats">'+cats+'</div>';}
    h+='</div></div>';
    var c=$(h);
    bE(c,function(){if(n.slug)Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});});
    return c;
}

function mkTC(item){
    var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');
    var img=d.poster_url?'<img src="'+d.poster_url+'" loading="lazy">':'<div class="kk-card-noposter"><span>No Poster</span></div>';
    var typeLabel=d.media_type==='tv'?'TV':'Film';
    var lang=item.original_language?item.original_language.toUpperCase():'';
    var origName=item.original_title||item.original_name||'';
    var overview=item.overview?item.overview.substring(0,80)+'…':'';
    var h='<div class="kk-card selector">';
    h+='<div class="kk-card-img">'+img;
    if(d.vote)h+='<div class="kk-card-q">⭐ '+E(d.vote)+'</div>';
    h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div>';
    h+='</div>';
    h+='<div class="kk-card-body">';
    h+='<div class="kk-card-name">'+E(d.name)+'</div>';
    if(origName&&origName!==d.name)h+='<div class="kk-card-origin">'+E(origName)+'</div>';
    h+='<div class="kk-card-meta">';
    if(d.year)h+='<span class="kk-card-year">'+E(d.year)+'</span>';
    if(lang)h+='<span class="kk-card-lang">'+lang+'</span>';
    h+='</div>';
    if(overview)h+='<div class="kk-card-overview">'+E(overview)+'</div>';
    h+='</div></div>';
    var c=$(h);
    bE(c,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});
    return c;
}

function mkTCH(item){
    var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');
    var backdrop=item.backdrop_path?TMDB_W500+item.backdrop_path:(d.poster_url||'');
    var imgH=backdrop?'<img src="'+backdrop+'" loading="lazy">':'<div class="kk-card-h-noposter"><span>No Image</span></div>';
    var typeLabel=d.media_type==='tv'?'TV':'Film';
    var lang=item.original_language?item.original_language.toUpperCase():'';
    var origName=item.original_title||item.original_name||'';
    var overview=item.overview?item.overview.substring(0,60)+'…':'';
    var h='<div class="kk-card-h selector">';
    h+='<div class="kk-card-h-img">'+imgH;
    if(d.vote)h+='<div class="kk-card-q">⭐ '+E(d.vote)+'</div>';
    h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div>';
    h+='</div>';
    h+='<div class="kk-card-h-body">';
    h+='<div class="kk-card-name">'+E(d.name)+'</div>';
    if(origName&&origName!==d.name)h+='<div class="kk-card-origin">'+E(origName)+'</div>';
    h+='<div class="kk-card-meta">';
    if(d.year)h+='<span class="kk-card-year">'+E(d.year)+'</span>';
    if(lang)h+='<span class="kk-card-lang">'+lang+'</span>';
    h+='</div>';
    if(overview)h+='<div class="kk-card-overview">'+E(overview)+'</div>';
    h+='</div></div>';
    var c=$(h);
    bE(c,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});
    return c;
}

function mkCH(item){
    var n=nm(item);if(!n)return $('<div></div>');
    var p=fImg(n.thumb_url||n.poster_url);
    var h='<div class="kk-card-h selector">';
    h+='<div class="kk-card-h-img">';
    if(p)h+='<img src="'+p+'" loading="lazy">';
    else h+='<div class="kk-card-h-noposter"><span>No Image</span></div>';
    if(n.quality)h+='<div class="kk-card-q">'+E(n.quality)+'</div>';
    if(n.episode_current)h+='<div class="kk-card-ep">'+E(n.episode_current)+'</div>';
    h+='</div>';
    h+='<div class="kk-card-h-body">';
    h+='<div class="kk-card-name">'+E(n.name)+'</div>';
    if(n.origin_name&&n.origin_name!==n.name)h+='<div class="kk-card-origin">'+E(n.origin_name)+'</div>';
    h+='<div class="kk-card-meta">';
    if(n.year)h+='<span class="kk-card-year">'+E(n.year)+'</span>';
    if(n.time)h+='<span class="kk-card-time">'+E(n.time)+'</span>';
    if(n.episode_total&&n.episode_total!=='1')h+='<span class="kk-card-eps">'+E(n.episode_total)+' tập</span>';
    h+='</div>';
    if(n.category&&n.category.length){var cats=n.category.slice(0,2).map(function(c){return E(c.name||'');}).join(' · ');h+='<div class="kk-card-overview">'+cats+'</div>';}
    h+='</div></div>';
    var c=$(h);
    bE(c,function(){if(n.slug)Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});});
    return c;
}

function mkPFC(item){
    var n=nm(item);if(!n||!n.slug)return $('<div></div>');
    var bk=fImg(n.thumb_url||n.poster_url);
    var ps=fImg(n.poster_url||n.thumb_url);
    var typeLabel=n.type==='series'||n.type==='tvshows'?'Series':'Phim';
    var card=$('<div class="kk-pfc selector"></div>');
    card.html(
        '<div class="kk-pfc-bg">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-pfc-bg-empty"></div>')+'</div>'+
        '<div class="kk-pfc-overlay"></div>'+
        '<div class="kk-pfc-inner">'+
            (ps?'<div class="kk-pfc-poster"><img src="'+ps+'" loading="lazy"></div>':'<div class="kk-pfc-poster kk-pfc-poster--empty"></div>')+
            '<div class="kk-pfc-info">'+
                '<div class="kk-pfc-badge">'+E(typeLabel)+'</div>'+
                '<div class="kk-pfc-title">'+E(n.name)+'</div>'+
                (n.origin_name&&n.origin_name!==n.name?'<div class="kk-pfc-origin">'+E(n.origin_name)+'</div>':'')+
                '<div class="kk-pfc-meta">'+
                    (n.year?'<span class="kk-pfc-year">'+E(n.year)+'</span>':'')+
                    (n.quality?'<span class="kk-pfc-qual">'+E(n.quality)+'</span>':'')+
                    (n.episode_current?'<span class="kk-pfc-eps">'+E(n.episode_current)+'</span>':'')+
                '</div>'+
                (n.content?'<div class="kk-pfc-desc">'+E(cDesc(n.content).substring(0,100))+'…</div>':'')+
            '</div>'+
        '</div>'
    );
    bE(card,function(){Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});});
    return card;
}

function mkTCPF(item){
    var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');
    var bk=item.backdrop_path?TMDB_W500+item.backdrop_path:(d.poster_url||'');
    var ps=d.poster_url||'';
    var vote=item.vote_average?Number(item.vote_average).toFixed(1):'';
    var vNum=Number(vote);
    var vClass=vNum>=7?'high':vNum>=5?'mid':'low';
    var origName=item.original_title||item.original_name||'';
    var lang=item.original_language?item.original_language.toUpperCase():'';
    var overview=item.overview?item.overview.substring(0,100)+'…':'';
    var typeLabel=d.media_type==='tv'?'TV Series':'Film';
    var card=$('<div class="kk-pfc selector"></div>');
    card.html(
        '<div class="kk-pfc-bg">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-pfc-bg-empty"></div>')+'</div>'+
        '<div class="kk-pfc-overlay"></div>'+
        '<div class="kk-pfc-inner">'+
            (ps?'<div class="kk-pfc-poster"><img src="'+ps+'" loading="lazy"></div>':'<div class="kk-pfc-poster kk-pfc-poster--empty"></div>')+
            '<div class="kk-pfc-info">'+
                '<div class="kk-pfc-badge">'+E(typeLabel)+'</div>'+
                '<div class="kk-pfc-title">'+E(d.name)+'</div>'+
                (origName&&origName!==d.name?'<div class="kk-pfc-origin">'+E(origName)+'</div>':'')+
                '<div class="kk-pfc-meta">'+
                    (d.year?'<span class="kk-pfc-year">'+E(d.year)+'</span>':'')+
                    (lang?'<span class="kk-pfc-lang">'+lang+'</span>':'')+
                    (vote?'<span class="kk-pfc-vote kk-pfc-vote--'+vClass+'">⭐ '+vote+'</span>':'')+
                '</div>'+
                (overview?'<div class="kk-pfc-desc">'+E(overview)+'</div>':'')+
            '</div>'+
        '</div>'
    );
    bE(card,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});
    return card;
}

function mkRowList(items,isKK){
    var cm=cardMode();
    if(cm==='poster'){
        var rl=$('<div class="kk-row-list--poster"></div>');
        items.forEach(function(i){rl.append(isKK?mkPFC(i):mkTCPF(i));});
        return rl;
    } else {
        var rl2=$('<div class="kk-row-list kk-row-list--hgrid"></div>');
        items.forEach(function(i){rl2.append(isKK?mkCH(i):mkTCH(i));});
        return rl2;
    }
}

function mkCastList(castArr,hasTmdb){
    var list=$('<div class="kk-cast-list"></div>');
    castArr.forEach(function(c){
        var av=c.profile_path?'<img src="'+TMDB_W500+c.profile_path+'">':'<div class="kk-cast-empty"></div>';
        var card;
        if(hasTmdb&&c.id){
            card=$('<div class="kk-cast-card selector" data-pid="'+c.id+'"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+E(c.name||'')+'</div><div class="kk-cast-role">'+E(c.character||'')+'</div></div></div>');
            bE(card,function(){Lampa.Activity.push({url:'',title:c.name||'',component:'kkphim_person',person_id:c.id,page:1});});
        }else{
            card=$('<div class="kk-cast-card"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+E(c.name||'')+'</div><div class="kk-cast-role">'+E(c.character||'')+'</div></div></div>');
        }
        list.append(card);
    });
    return list;
}

function mkDirHtml(dirs,isTmdb){
    if(!dirs||!dirs.length)return'';
    var first=dirs[0],rest=dirs.slice(1);
    var avatarH=first.profile_path
        ?'<div class="kk-crew-avatar"><img src="'+TMDB_W500+first.profile_path+'" loading="lazy"></div>'
        :'<div class="kk-crew-avatar"><div class="kk-crew-avatar-empty"></div></div>';
    var nameH=(isTmdb&&first.id)
        ?'<span class="kk-crew-name selector" data-pid="'+first.id+'">'+E(first.name||'')+'</span>'
        :'<span class="kk-crew-name">'+E(first.name||'')+'</span>';
    var restH='';
    if(rest.length){
        var restNames=rest.map(function(c){return(isTmdb&&c.id)?'<span class="kk-crew-rest-name selector" data-pid="'+c.id+'">'+E(c.name||'')+'</span>':'<span class="kk-crew-rest-name">'+E(c.name||'')+'</span>';});
        restH='<div class="kk-crew-rest">'+restNames.join('')+'</div>';
    }
    return'<div class="kk-crew">'+avatarH+'<div class="kk-crew-info"><span class="kk-crew-label">Đạo diễn</span>'+nameH+'<span class="kk-crew-role">'+E(first.job||'Director')+'</span>'+restH+'</div></div>';
}
function bindDirClicks(el){
    el.find('.kk-crew-name[data-pid],.kk-crew-rest-name[data-pid]').each(function(){
        var sp=$(this);
        bE(sp,function(){var pid=sp.attr('data-pid');if(pid)Lampa.Activity.push({url:'',title:sp.text()||'',component:'kkphim_person',person_id:parseInt(pid),page:1});});
    });
}

function gHtml(genres,isTmdb){
    if(!genres||!genres.length)return'';
    var result='';
    for(var i=0;i<genres.length;i++){
        var g=genres[i];if(!g)continue;
        var gname=E(g.name||'');
        if(isTmdb){result+='<span class="kk-genre selector" data-gid="'+(g.id||'')+'" data-gname="'+gname+'">'+gname+'</span>';}
        else{result+='<span class="kk-genre selector" data-slug="'+E(g.slug||'')+'" data-title="'+E(g.name||'')+'">'+gname+'</span>';}
    }
    return result;
}

function mkHero(bk,ps,logoH,tH,origin,extra){
    extra=extra||{};
    var posterH=ps?'<img src="'+ps+'" loading="lazy">':'';
    return $('<div class="kk-hero">'+
        '<div class="kk-hero-backdrop">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-hero-backdrop-empty"></div>')+'</div>'+
        '<div class="kk-hero-card">'+
            '<div class="kk-hero-poster-wrap"><div class="kk-hero-poster">'+posterH+'</div></div>'+
            '<div class="kk-hero-meta">'+
                (extra.year||extra.country?'<div class="kk-hm-yc">'+(extra.year?'<span class="kk-hm-year">'+E(extra.year)+'</span>':'')+(extra.country?'<span class="kk-hm-country">'+E(extra.country)+'</span>':'')+'</div>':'')+
                (logoH||tH)+
                (extra.tagline?'<div class="kk-hm-tagline">'+E(extra.tagline)+'</div>':'')+
                '<div class="kk-hm-badges">'+
                    (extra.vote?'<span class="kk-hm-vote">'+E(extra.vote)+' <small>TMDB</small></span>':'')+
                    (extra.rated?'<span class="kk-hm-badge">'+E(extra.rated)+'</span>':'')+
                    (extra.status?'<span class="kk-hm-badge">'+E(extra.status)+'</span>':'')+
                '</div>'+
                (extra.runtime||extra.genres?'<div class="kk-hm-rtg">'+(extra.runtime?'<span class="kk-hm-rt">'+E(extra.runtime)+'</span>':'')+(extra.runtime&&extra.genres?'<span class="kk-hm-dot">•</span>':'')+(extra.genres?'<span class="kk-hm-genres">'+E(extra.genres)+'</span>':'')+'</div>':'')+
            '</div>'+
        '</div>'+
    '</div>');
}

function mkBody(v,y,rt,extra,genreHtml,crewH,desc){
    return $('<div class="kk-body">'+
        '<div class="kk-body-genres">'+genreHtml+'</div>'+
        crewH+
        '<div class="kk-body-desc">'+
            '<span class="kk-body-desc-label">Nội dung</span>'+
            '<div class="kk-body-desc-text">'+fTxt(desc)+'</div>'+
        '</div>'+
    '</div>');
}

function inCSS(){if($('#kk-css').length)return;var l=document.createElement('link');l.id='kk-css';l.rel='stylesheet';l.href=CSS_URL;document.head.appendChild(l);}
function addM(){
    function ins(){
        if($('.menu__item[data-action="kkphim"]').length)return;
        var m=$('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>');
        bE(m,function(){Lampa.Activity.push({url:'',title:'KKPhim',component:'kkphim_main',page:1});});
        $('.menu .menu__list').first().append(m);
    }
    setTimeout(ins,500);
    Lampa.Listener.follow('app',function(e){if(e.type==='ready')setTimeout(ins,500);});
}

function mkGrid(name,fetchFn,titleFn){
    Lampa.Component.add(name,function(obj){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,page=obj.page_num||1;
        var grid=$('<div class="kk-grid"></div>'),lm=$('<div class="kk-loadmore selector">Tải thêm</div>'),ld=false,hm=true;
        this.create=function(){comp.activity.loader(true);cScr(scroll);grid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(titleFn(obj))+'</div>').append(grid).append(lm));bE(lm,function(){if(!ld&&hm)doL();});doL();};
        function doL(){ld=true;lm.text('Đang tải...');fetchFn(obj,page).then(function(items){if(!items.length){hm=false;lm.text(page<=1?'Không có':'Hết');}else{items.forEach(function(i){grid.append(mkTC(i).addClass('kk-card--grid'));});page++;lm.text('Tải thêm');}ld=false;comp.activity.loader(false);comp.start();}).catch(function(){ld=false;lm.text('Lỗi');comp.activity.loader(false);});}
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
    });
}

function mkSB(css,l1,l2){return $('<div class="kk-src-btn '+css+' selector"><div class="kk-sb-main">'+l1+' <span class="kk-arrow">▼</span></div>'+(l2?'<div class="kk-sb-sub">'+l2+'</div>':'')+'</div>');}
function bMovExp(sk,sn,slug,title,css){var w=$('<div style="width:100%"></div>'),btn=mkSB(css,'▶ '+E(sn),'Bấm để xem'),box=$('<div class="kk-ep-box"></div>');w.append(btn).append(box);var ld=false,op=false;bE(btn,function(){op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);if(op&&!ld){ld=true;box.html('<div class="kk-ep-ld">⏳ Đang tải...</div>');fDet(SOURCES[sk],slug).then(function(det){if(!det||!det.episodes||!det.episodes.length){box.html('<div class="kk-ep-er">❌ Không có tập</div>');return;}box.empty();fillE(box,det.episodes,title);}).catch(function(e){box.html('<div class="kk-ep-er">❌ '+E(e.message||'Lỗi')+'</div>');});}});return w;}
function bTVExp(sk,sn,slug,title,orig,css){var w=$('<div style="width:100%"></div>'),btn=mkSB(css,'▶ '+E(sn),'Chọn season/tập'),box=$('<div class="kk-ep-box"></div>');w.append(btn).append(box);var ld=false,op=false;bE(btn,function(){op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);if(op&&!ld){ld=true;box.html('<div class="kk-ep-ld">⏳ Tìm seasons...</div>');var source=SOURCES[sk];fSeasonSlugs(source,title,orig).then(function(entries){if(!entries.length&&slug)entries=[{slug:slug,name:title,season:1,source:source}];if(!entries.length){box.html('<div class="kk-ep-er">❌ Không tìm thấy</div>');return;}var sMap={};entries.forEach(function(e){if(!sMap[e.season])sMap[e.season]=[];sMap[e.season].push(e);});var sNums=Object.keys(sMap).map(Number).sort(function(a,b){return a-b;});if(sNums.length===1)ldSn(box,sMap[sNums[0]],title,sNums[0],null);else shSn(box,sMap,sNums,title);}).catch(function(e){box.html('<div class="kk-ep-er">❌ '+E(e.message||'Lỗi')+'</div>');});}});return w;}
function bDetExp(eps,title,sn,css){var w=$('<div style="width:100%"></div>'),total=0;(eps||[]).forEach(function(sv){total+=(sv.server_data||[]).length;});var btn=mkSB(css,'▶ '+E(sn),total+' tập'),box=$('<div class="kk-ep-box"></div>');w.append(btn).append(box);if(!eps||!eps.length||total===0){btn.removeClass(css).addClass('kk-src-btn--no');btn.html('⚠️ '+E(sn)+' - Không có tập');return w;}if(total===1){var ep=gEp1(eps);if(ep){var link=ep.link_m3u8||ep.link_embed||'';btn.find('.kk-sb-main').html('▶ '+E(sn));btn.find('.kk-sb-sub').text('Phát ngay');btn.find('.kk-arrow').remove();bE(btn,function(){if(link)Lampa.Player.play({title:title,url:link});else Lampa.Noty.show('Không có link');});return w;}}fillE(box,eps,title);var op=false;bE(btn,function(){op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);});return w;}
function bTorBtn(mt,tid,title,poster,imdb){var eng=tEngine(),label=eng==='aio'?'🌊 AIOStreams':'🧲 Torrent';if(tsHost())label+=' → TS';var css=eng==='aio'?'kk-src-btn--aio':'kk-src-btn--torrent';var btn=$('<div class="kk-src-btn '+css+' selector" style="width:100%"><div class="kk-sb-main">'+label+'</div><div class="kk-sb-sub">Phát qua torrent</div></div>');if(mt==='movie')bE(btn,function(){oTorMov(tid,title,poster,imdb);});else bE(btn,function(){oTorTV(tid,title,poster,imdb);});return $('<div style="width:100%"></div>').append(btn);}
function shSn(c,sMap,sNums,title){c.empty();sNums.forEach(function(sn){var item=$('<div class="kk-sn-it selector"><span class="kk-sn-nm">📺 Season '+sn+'</span><span class="kk-sn-bd">'+sMap[sn].length+'</span></div>');bE(item,function(){ldSn(c,sMap[sn],title,sn,function(){shSn(c,sMap,sNums,title);});});c.append(item);});}
async function ldSn(c,entries,title,sNum,backFn){c.html('<div class="kk-ep-ld">⏳ Tải S'+sNum+'...</div>');for(var i=0;i<entries.length;i++){try{var det=await fDet(entries[i].source,entries[i].slug);if(det&&det.episodes&&det.episodes.length){c.empty();if(backFn){var bk=$('<div class="kk-ep-bk selector">← Quay lại</div>');bE(bk,backFn);c.append(bk);}fillE(c,det.episodes,title+' S'+pd(sNum));return;}}catch(e){}}c.html('<div class="kk-ep-er">❌ Không có tập</div>');}
function fillE(c,eps,title){eps.forEach(function(sv){var sn2=sv.server_name||'Server',cnt=(sv.server_data||[]).length,icon='📺',snl=sn2.toLowerCase();if(snl.indexOf('thuyết minh')>-1||snl.indexOf('thuyet minh')>-1)icon='🇻🇳';else if(snl.indexOf('vietsub')>-1||snl.indexOf('sub')>-1)icon='📝';else if(snl.indexOf('lồng')>-1)icon='🎤';c.append('<div class="kk-sv-hd">'+icon+' '+E(sn2)+' ('+cnt+')</div>');var grid=$('<div class="kk-ep-chips"></div>');(sv.server_data||[]).forEach(function(ep){var link=ep.link_m3u8||ep.link_embed||'';var chip=$('<div class="kk-ep-c selector'+(link?'':' off')+'">'+E(ep.name||'Tập')+'</div>');bE(chip,function(){if(link)Lampa.Player.play({title:title+' - '+(ep.name||''),url:link});else Lampa.Noty.show('Không có link');});grid.append(chip);});c.append(grid);});}

/* ════ COMPONENTS ════ */
function startPlugin(){
    inCSS();addM();

    /* ── SETTINGS ── */
    Lampa.Component.add('kkphim_settings',function(){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
        this.create=function(){
            cScr(scroll);var s=ls(),w=$('<div class="kk-stg-wrap"></div>');
            w.append('<div class="kk-stg-title">⚙️ Cài đặt</div>');

            var g0=mg('📺 Nguồn phim');var cur=s.source||'ophim';
            Object.keys(SOURCES).forEach(function(k){var sc=SOURCES[k];g0.append(mo(sc.name,'API: '+sc.api,cur===k,function(){ss({source:k});Lampa.Noty.show(sc.name);comp.create();}));});
            w.append(g0);

            var gCard=mg('🃏 Kiểu hiển thị phim');
            var cm=s.card_mode||'hgrid';
            [{k:'hgrid',n:'📐 Lưới ngang',d:'2 cột, backdrop ngang - cuộn ngang'},{k:'poster',n:'🖼️ Poster lớn',d:'1 card full màn hình - kéo xuống xem tiếp'}].forEach(function(o){
                gCard.append(mo(o.n,o.d,cm===o.k,function(){ss({card_mode:o.k});comp.create();}));
            });
            w.append(gCard);

            var g5=mg('🎨 Số cột trang danh sách');var cg=s.card_style||'3';
            [{k:'2',n:'2 cột'},{k:'3',n:'3 cột'},{k:'4',n:'4 cột'}].forEach(function(o){g5.append(mo(o.n,'Số cột',cg===o.k,function(){ss({card_style:o.k});comp.create();}));});
            w.append(g5);

            var g6=mg('🌐 Ngôn ngữ TMDB');var cl2=s.tmdb_lang||'vi-VN';
            [{k:'vi-VN',n:'Tiếng Việt'},{k:'en-US',n:'English'},{k:'ja-JP',n:'日本語'},{k:'ko-KR',n:'한국어'},{k:'zh-CN',n:'中文'}].forEach(function(o){g6.append(mo(o.n,o.k,cl2===o.k,function(){ss({tmdb_lang:o.k});_gc={movie:null,tv:null};comp.create();}));});
            w.append(g6);

            var gE=mg('🎯 Nguồn Torrent');var ce=s.torrent_engine||'torrentio';
            gE.append(mo('Torrentio','torrentio.strem.fun',ce==='torrentio',function(){ss({torrent_engine:'torrentio'});comp.create();}));
            gE.append(mo('AIOStreams','Tự host / public',ce==='aio',function(){ss({torrent_engine:'aio'});comp.create();}));
            w.append(gE);

            /* TorrServer */
            var g1=mg('🖥️ TorrServer');
            g1.append(mi('Địa chỉ','192.168.1.100:8090',s.torrserver_host||'Chưa cài','Địa chỉ TS','torrserver_host',s));
            g1.append(mi('Mật khẩu','Để trống nếu không',s.torrserver_password?'••••':'Không','Mật khẩu','torrserver_password',s));

            /* Test TorrServer button */
            var stTS=$('<div class="kk-stg-status" style="display:none"></div>');
            var tTS=si2('🧪 Test TorrServer','Kiểm tra kết nối & xem thông tin','Test');
            bE(tTS,async function(){
                var h=tsHost();
                if(!h){
                    stTS.show().attr('class','kk-stg-status kk-stg-status--err').html('<span class="kk-dbg-err">❌ Chưa nhập địa chỉ TorrServer</span>');
                    return;
                }
                stTS.show().attr('class','kk-stg-status kk-stg-status--loading').html('<span class="kk-dbg-loading">⏳ Đang kết nối...</span>');
                try{
                    /* Thử /echo trước */
                    var echoUrl=tsU('/echo');
                    var r=await fetch(echoUrl,{method:'GET',headers:tsH(),signal:AbortSignal.timeout(5000)});
                    if(r.ok){
                        var txt=await r.text();
                        /* Thử lấy thêm stats từ /stat */
                        var statsHtml='';
                        try{
                            var r2=await fetch(tsU('/stat'),{method:'GET',headers:tsH(),signal:AbortSignal.timeout(3000)});
                            if(r2.ok){
                                var stat=await r2.json();
                                var rows=[
                                    ['Version',stat.version||'—'],
                                    ['Platform',stat.platform||'—'],
                                    ['Torrents',String(stat.torrents_count||0)],
                                    ['Memory',stat.memory_used?(stat.memory_used/1048576).toFixed(1)+' MB':'—']
                                ];
                                statsHtml='<div class="kk-dbg-divider"></div><div class="kk-dbg-section">';
                                rows.forEach(function(row){
                                    statsHtml+='<div class="kk-dbg-row"><span class="kk-dbg-key">'+row[0]+':</span><span class="kk-dbg-val">'+E(String(row[1]))+'</span></div>';
                                });
                                statsHtml+='</div>';
                            }
                        }catch(e2){}
                        stTS.attr('class','kk-stg-status kk-stg-status--ok').html(
                            '<div class="kk-dbg-header">'+
                                '<span class="kk-dbg-total">✅ Kết nối thành công!</span>'+
                                '<span class="kk-dbg-keys">Host: <b>'+E(h)+'</b></span>'+
                            '</div>'+
                            (txt?'<div class="kk-dbg-section"><div class="kk-dbg-row"><span class="kk-dbg-key">Echo:</span><span class="kk-dbg-val">'+E(txt.substring(0,120))+'</span></div></div>':'')+
                            statsHtml
                        );
                    } else if(r.status===401){
                        stTS.attr('class','kk-stg-status kk-stg-status--err').html('<span class="kk-dbg-err">❌ HTTP 401 - Sai mật khẩu</span>');
                    } else {
                        stTS.attr('class','kk-stg-status kk-stg-status--err').html('<span class="kk-dbg-err">❌ HTTP '+r.status+' - Kiểm tra địa chỉ</span>');
                    }
                }catch(e){
                    var msg=e.message||'Lỗi mạng';
                    if(msg.indexOf('abort')>-1||msg.indexOf('timeout')>-1)msg='Timeout - TorrServer không phản hồi';
                    else if(msg.indexOf('Failed to fetch')>-1||msg.indexOf('NetworkError')>-1)msg='Không kết nối được - kiểm tra địa chỉ/mạng';
                    stTS.attr('class','kk-stg-status kk-stg-status--err').html('<span class="kk-dbg-err">❌ '+E(msg)+'</span>');
                }
            });
            g1.append(tTS).append(stTS);
            w.append(g1);

            var g2=mg('🧲 Torrentio');
            g2.append(mi('Config','Dán link manifest',s.torrentio_config?'Có':'Mặc định','Config','torrentio_config',s));
            w.append(g2);

            var gA=mg('🌊 AIOStreams');
            gA.append(mi('URL manifest.json','Dán full URL',s.aio_url||'Chưa cài','AIO URL','aio_url',s));
            var stA=$('<div class="kk-stg-status" style="display:none"></div>');
            var tA=si2('🧪 Debug AIO Stream','Xem raw data của stream[0]','Nhấn');
            bE(tA,async function(){
                var base=cAio(aioUrl());
                if(!base){stA.show().attr('class','kk-stg-status kk-stg-status--err').html('<span class="kk-dbg-err">❌ Chưa nhập URL AIOStreams</span>');return;}
                stA.show().attr('class','kk-stg-status kk-stg-status--loading').html('<span class="kk-dbg-loading">⏳ Đang fetch...</span>');
                try{
                    var r=await fetch(base+'/stream/movie/tt1375666.json');
                    if(!r.ok){stA.attr('class','kk-stg-status kk-stg-status--err').html('<span class="kk-dbg-err">❌ HTTP '+r.status+'</span>');return;}
                    var data=await r.json();
                    if(!data.streams||!data.streams.length){stA.attr('class','kk-stg-status kk-stg-status--err').html('<span class="kk-dbg-err">❌ Không có stream</span>');return;}
                    var s0=data.streams[0],keys=Object.keys(s0),html='';
                    html+='<div class="kk-dbg-header"><span class="kk-dbg-total">Tổng: <b>'+data.streams.length+'</b> streams</span><span class="kk-dbg-keys">Keys: <b>['+keys.join(', ')+']</b></span></div>';
                    if(s0.behaviorHints){var bh=typeof s0.behaviorHints==='object'?JSON.stringify(s0.behaviorHints):String(s0.behaviorHints);html+='<div class="kk-dbg-section"><div class="kk-dbg-row"><span class="kk-dbg-key">behaviorHints:</span><span class="kk-dbg-val">'+bh.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span></div></div>';}
                    html+='<div class="kk-dbg-divider"></div><div class="kk-dbg-section">';
                    keys.forEach(function(k){if(k==='behaviorHints')return;var val=s0[k];if(val===null||val===undefined)val='(null)';else if(typeof val==='object')val=JSON.stringify(val);else val=String(val);var show=val.length>200?val.substring(0,200)+'…':val;show=show.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'↵ ');html+='<div class="kk-dbg-row"><span class="kk-dbg-key">'+k+':</span><span class="kk-dbg-val">'+show+'</span></div>';});
                    html+='</div><div class="kk-dbg-divider"></div>';
                    var parsed=pStream(s0);
                    html+='<div class="kk-dbg-section kk-dbg-parsed"><div class="kk-dbg-parsed-title">Parsed:</div>';
                    [['name',parsed.name||'—'],['quality',parsed.quality||'—'],['size',parsed.size||'—'],['seeds',parsed.seeds||'—'],['source',parsed.source||'—'],['filename',parsed.filename||'—']].forEach(function(row){html+='<div class="kk-dbg-row"><span class="kk-dbg-key kk-dbg-key--parsed">'+row[0]+':</span><span class="kk-dbg-val kk-dbg-val--parsed">'+E(String(row[1]))+'</span></div>';});
                    html+='</div>';
                    stA.attr('class','kk-stg-status kk-stg-status--ok').html(html);
                }catch(e){stA.attr('class','kk-stg-status kk-stg-status--err').html('<span class="kk-dbg-err">❌ '+(e.message||'Lỗi')+'</span>');}
            });
            gA.append(tA).append(stA);w.append(gA);

            var g7=mg('🗃️ Cache');var cc=si2('Xóa cache genres','','Xóa');
            bE(cc,function(){_gc={movie:null,tv:null};Lampa.Noty.show('OK');});g7.append(cc);w.append(g7);

            var g4=$('<div class="kk-stg-group"></div>');var cl=si2('🗑️ Xóa toàn bộ','Khôi phục mặc định','Xóa');
            cl.find('.kk-stg-value').css('color','#f87171');
            bE(cl,function(){localStorage.removeItem(STG_KEY);_gc={movie:null,tv:null};Lampa.Activity.backward();});
            g4.append(cl);w.append(g4);
            w.append('<div class="kk-stg-ver">KKPhim v3.0</div>');
            scroll.append(w);comp.start();
        };
        function mg(t){return $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">'+t+'</div>');}
        function si2(n,d,v){return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">'+E(n)+'</div>'+(d?'<div class="kk-stg-label-desc">'+E(d)+'</div>':'')+'</div><div class="kk-stg-value">'+E(v)+'</div></div>');}
        function mo(n,d,on,cb){var it=si2(n,d,on?'✅':'○');if(on)it.find('.kk-stg-value').css('color','#4ade80');bE(it,cb);return it;}
        function mi(n,d,val,prompt,key,s){var it=si2(n,d,val);bE(it,function(){try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:prompt,value:s[key]||'',free:true,nosave:true},function(v){v=(v||'').trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);});return;}}catch(e){}var v=window.prompt(prompt,s[key]||'');if(v!==null){v=v.trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);}});return it;}
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
    });

    /* ── PERSON ── */
    Lampa.Component.add('kkphim_person',function(obj){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,pid=obj.person_id;
        this.create=function(){
            comp.activity.loader(true);cScr(scroll);
            if(!pid){comp.activity.loader(false);comp.start();return;}
            Promise.all([tFetch('/person/'+pid+'?language='+tmLang()),tPersonC(pid)]).then(function(res){
                var p=res[0],cr=res[1],w=$('<div class="kk-detail-wrap"></div>');
                var av=p.profile_path?TMDB_W500+p.profile_path:'';
                w.append('<div class="kk-person-header"><div class="kk-person-avatar">'+(av?'<img src="'+av+'">':'')+'</div><div class="kk-person-info"><div class="kk-person-name">'+E(p.name||'')+'</div>'+(p.birthday?'<div class="kk-person-meta">🎂 '+E(p.birthday)+'</div>':'')+(p.known_for_department?'<div class="kk-person-meta">🎬 '+E(p.known_for_department)+'</div>':'')+'</div></div>');
                if(p.biography)w.append('<div class="kk-person-bio">'+fTxt((p.biography||'').substring(0,600))+'</div>');
                if(cr&&cr.cast){
                    var mv=cr.cast.filter(function(c){return c.media_type==='movie';}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});
                    var tv=cr.cast.filter(function(c){return c.media_type==='tv';}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});
                    if(mv.length){var r1=$('<div class="kk-row"></div>'),rl=$('<div class="kk-row-list"></div>'),mr=$('<div class="kk-row-more selector">Xem thêm ('+mv.length+')</div>');bE(mr,function(){Lampa.Activity.push({url:'',title:(p.name||'')+' - Phim lẻ',component:'kkphim_person_films',person_id:pid,film_type:'movie'});});mv.slice(0,12).forEach(function(c){rl.append(mkTC(c));});r1.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">🎬 Phim lẻ</div>').append(mr)).append(rl);w.append(r1);}
                    if(tv.length){var r2=$('<div class="kk-row"></div>'),rl2=$('<div class="kk-row-list"></div>'),mr2=$('<div class="kk-row-more selector">Xem thêm ('+tv.length+')</div>');bE(mr2,function(){Lampa.Activity.push({url:'',title:(p.name||'')+' - Phim bộ',component:'kkphim_person_films',person_id:pid,film_type:'tv'});});tv.slice(0,12).forEach(function(c){rl2.append(mkTC(c));});r2.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">📺 Phim bộ</div>').append(mr2)).append(rl2);w.append(r2);}
                }
                scroll.append(w);comp.activity.loader(false);comp.start();
            }).catch(function(){comp.activity.loader(false);});
        };
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
    });

    Lampa.Component.add('kkphim_person_films',function(obj){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,pid=obj.person_id,ft=obj.film_type||'movie';
        var all=[],rd=0,pp=20,grid=$('<div class="kk-grid"></div>'),lm=$('<div class="kk-loadmore selector">Tải thêm</div>');
        this.create=function(){comp.activity.loader(true);cScr(scroll);grid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(obj.title||'')+'</div>').append(grid).append(lm));bE(lm,function(){rMore();});tPersonC(pid).then(function(cr){if(cr&&cr.cast)all=cr.cast.filter(function(c){return c.media_type===ft;}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});rMore();comp.activity.loader(false);comp.start();}).catch(function(){comp.activity.loader(false);});};
        function rMore(){var b=all.slice(rd,rd+pp);if(!b.length){lm.text('Hết');return;}b.forEach(function(c){grid.append(mkTC(c).addClass('kk-card--grid'));});rd+=b.length;lm.text(rd>=all.length?'Hết':'Tải thêm');}
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
    });

    /* ── MAIN ── */
    Lampa.Component.add('kkphim_main',function(){
        var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,_s='';
        var cats=[
            {name:'Phim Mới',api:'danh-sach/phim-moi-cap-nhat'},
            {name:'Phim Bộ',api:'v1/api/danh-sach/phim-bo'},
            {name:'Phim Lẻ',api:'v1/api/danh-sach/phim-le'},
            {name:'Hoạt Hình',api:'v1/api/danh-sach/hoat-hinh'},
            {name:'TV Shows',api:'v1/api/danh-sach/tv-shows'}
        ];
        this.create=function(){
            net.clear();this.activity.loader(true);cScr(scroll);
            var sc=src();_s=sc.key;
            var tb=$('<div class="kk-topbar"><div class="kk-topbar-title">'+E(sc.name)+'</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');
            bE($(tb.find('.kk-btn')[0]),oSearch);
            bE($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'Cài đặt',component:'kkphim_settings'});});
            scroll.append(tb);
            var sb=$('<div class="kk-srcbar"></div>');
            Object.keys(SOURCES).forEach(function(k){var s2=SOURCES[k],on=k===sc.key;var btn=$('<div class="kk-srcbtn selector '+(on?'kk-srcbtn--on':'kk-srcbtn--off')+'">'+E(s2.name)+'</div>');bE(btn,function(){if(on)return;ss({source:k});comp.create();});sb.append(btn);});
            var tb2=$('<div class="kk-srcbtn selector kk-srcbtn--off" style="background:rgba(1,180,228,.15);border-color:rgba(1,180,228,.4);color:#01b4e4">TMDB</div>');
            bE(tb2,function(){Lampa.Activity.push({url:'',title:'TMDB',component:'kkphim_tmdb_main',page:1});});
            sb.append(tb2);scroll.append(sb);
            var ld2=0;
            cats.forEach(function(cat){
                net.silent(sApi()+cat.api+'?page=1',function(res){
                    var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(nm).filter(function(i){return i&&i.slug;});
                    if(list.length){
                        var row=$('<div class="kk-row"></div>');
                        var mr=$('<div class="kk-row-more selector">Xem thêm</div>');
                        bE(mr,function(){Lampa.Activity.push({url:'',title:cat.name,component:'kkphim_category',cat:cat,page_num:1,mode:'api'});});
                        row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+E(cat.name)+'</div>').append(mr));
                        var cm=cardMode();
                        var cnt=cm==='poster'?8:6;
                        row.append(mkRowList(list.slice(0,cnt),true));
                        scroll.append(row);
                    }
                    ld2++;if(ld2>=cats.length){comp.activity.loader(false);comp.start();}
                },function(){ld2++;if(ld2>=cats.length){comp.activity.loader(false);comp.start();}});
            });
        };
        this.start=function(){if(_s&&_s!==srcKey()){comp.create();return;}aCtrl(scroll);eScr(scroll);};
        this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};
    });

    /* ── TMDB MAIN ── */
    Lampa.Component.add('kkphim_tmdb_main',function(){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
        var secs=[
            {name:'🔥 Xu hướng hôm nay',lt:'trending_day'},
            {name:'🌟 Xu hướng tuần',lt:'trending'},
            {name:'🎬 Chiếu rạp',lt:'now_playing'},
            {name:'📅 Sắp chiếu',lt:'upcoming'},
            {name:'🌟 Phim lẻ phổ biến',lt:'popular_movies'},
            {name:'📺 Phim bộ phổ biến',lt:'popular_tv'},
            {name:'📺 Đang phát sóng',lt:'on_the_air'},
            {name:'⭐ Top phim lẻ',lt:'top_movies'},
            {name:'⭐ Top phim bộ',lt:'top_tv'}
        ];
        this.create=function(){
            comp.activity.loader(true);cScr(scroll);
            var tb=$('<div class="kk-topbar"><div class="kk-topbar-title" style="color:#01b4e4">TMDB</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');
            bE($(tb.find('.kk-btn')[0]),oTSearch);
            bE($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'Cài đặt',component:'kkphim_settings'});});
            scroll.append(tb);
            var sb=$('<div class="kk-srcbar"></div>');
            Object.keys(SOURCES).forEach(function(k){var s2=SOURCES[k];var btn=$('<div class="kk-srcbtn selector kk-srcbtn--off">'+E(s2.name)+'</div>');bE(btn,function(){ss({source:k});Lampa.Activity.push({url:'',title:'KKPhim',component:'kkphim_main',page:1});});sb.append(btn);});
            sb.append('<div class="kk-srcbtn kk-srcbtn--on" style="background:rgba(1,180,228,.25);border-color:rgba(1,180,228,.5);color:#01b4e4">TMDB</div>');
            scroll.append(sb);
            var rr=$('<div class="kk-row"></div>'),rm=$('<div class="kk-row-more selector">Thêm</div>'),randItems=[];
            bE(rm,function(){Lampa.Activity.push({url:'',title:'🎲 Ngẫu nhiên',component:'kkphim_tmdb_list',listType:'trending',page_num:Math.floor(Math.random()*5)+2});});
            rr.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">🎲 Ngẫu nhiên</div>').append(rm));
            var randContainer=$('<div></div>');
            rr.append(randContainer);
            scroll.append(rr);
            Promise.all([tRand('movie'),tRand('tv')]).then(function(res){
                var items=[];
                (res[0].results||[]).forEach(function(i){i.media_type='movie';items.push(i);});
                (res[1].results||[]).forEach(function(i){i.media_type='tv';items.push(i);});
                for(var si2=items.length-1;si2>0;si2--){var sj=Math.floor(Math.random()*(si2+1));var st=items[si2];items[si2]=items[sj];items[sj]=st;}
                randItems=items;
                var cm=cardMode(),cnt=cm==='poster'?8:6;
                randContainer.replaceWith(mkRowList(items.slice(0,cnt),false));
            }).catch(function(){});
            var ld2=0;
            secs.forEach(function(sec){
                var fn=TFN[sec.lt];if(!fn){ld2++;return;}
                fn(1).then(function(res){
                    var items=(res.results||[]).filter(function(i){return i.media_type!=='person';});
                    if(items.length){
                        var row=$('<div class="kk-row"></div>'),mr=$('<div class="kk-row-more selector">Thêm</div>');
                        bE(mr,function(){Lampa.Activity.push({url:'',title:sec.name,component:'kkphim_tmdb_list',listType:sec.lt,page_num:1});});
                        row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+E(sec.name)+'</div>').append(mr));
                        var cm=cardMode(),cnt=cm==='poster'?8:6;
                        row.append(mkRowList(items.slice(0,cnt),false));
                        scroll.append(row);
                    }
                    ld2++;if(ld2>=secs.length){comp.activity.loader(false);comp.start();}
                }).catch(function(){ld2++;if(ld2>=secs.length){comp.activity.loader(false);comp.start();}});
            });
        };
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
    });

    mkGrid('kkphim_tmdb_list',function(obj,page){var fn=TFN[obj.listType]||TFN.trending;return fn(page).then(function(r){return(r.results||[]).filter(function(i){return i.media_type!=='person';});});},function(obj){return obj.title||'TMDB';});
    mkGrid('kkphim_tmdb_search',function(obj,page){return tSearchM(obj.keyword||'',page).then(function(r){return(r.results||[]).filter(function(i){return i.media_type!=='person';});});},function(obj){return'🔍 '+(obj.keyword||'');});

    /* ── TMDB GENRE ── */
    Lampa.Component.add('kkphim_tmdb_genre',function(obj){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,cg=String(obj.genre_id||'');
        var grid=$('<div class="kk-grid"></div>'),ld=false,md=false,td=false,mp=1,tp=1,all=[],rs={};
        this.create=function(){
            comp.activity.loader(true);cScr(scroll);
            grid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');
            var gb=$('<div class="kk-genre-bar"></div>');
            scroll.append(gb);
            scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title" id="kk-gtitle">'+E(obj.title||'')+'</div>').append(grid));
            var sb2=scroll.render().find('.scroll__body');
            sb2.on('scroll',function(){if(ld||(md&&td))return;var el=sb2[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)doL();});
            Promise.all([lGenres('movie'),lGenres('tv')]).then(function(res){
                var mg2=[],sn={};
                (res[0]||[]).concat(res[1]||[]).forEach(function(g){if(!sn[g.id]){sn[g.id]=true;mg2.push(g);}});
                mg2.sort(function(a,b){return(a.name||'').localeCompare(b.name||'');});
                mg2.forEach(function(g){
                    var on=String(g.id)===cg;
                    var ch=$('<div class="kk-genre-chip selector '+(on?'kk-genre-chip--on':'kk-genre-chip--off')+'">'+E(g.name)+'</div>');
                    bE(ch,function(){Lampa.Activity.push({url:'',title:g.name,component:'kkphim_tmdb_genre',genre_id:g.id,page_num:1});});
                    gb.append(ch);
                });
                var cur=mg2.find(function(g){return String(g.id)===cg;});
                if(cur)scroll.render().find('#kk-gtitle').text(cur.name);
                doL();
            }).catch(function(){doL();});
        };
        function doL(){if(ld)return;ld=true;var ps=[];
            if(!md)ps.push(tDiscover('movie',cg,mp).then(function(r){var items=r.results||[];if(!items.length)md=true;else{items.forEach(function(i){i.media_type='movie';});all=all.concat(items);mp++;}}).catch(function(){md=true;}));
            if(!td)ps.push(tDiscover('tv',cg,tp).then(function(r){var items=r.results||[];if(!items.length)td=true;else{items.forEach(function(i){i.media_type='tv';});all=all.concat(items);tp++;}}).catch(function(){td=true;}));
            Promise.all(ps).then(function(){all.sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});for(var i=0;i<all.length;i++){var key=all[i].media_type+'_'+all[i].id;if(!rs[key]){rs[key]=true;grid.append(mkTC(all[i]).addClass('kk-card--grid'));}}ld=false;comp.activity.loader(false);comp.start();}).catch(function(){ld=false;comp.activity.loader(false);});
        }
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
    });

    /* ── TMDB DETAIL ── */
    Lampa.Component.add('kkphim_tmdb_detail',function(obj){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,tid=obj.tmdb_id,mt=obj.media_type||'movie';
        this.create=function(){
            comp.activity.loader(true);cScr(scroll);
            if(!tid){comp.activity.loader(false);comp.start();return;}
            tDetFull(mt,tid).then(async function(tmdb){
                var logos=null;try{logos=await tImgFull(mt,tid);}catch(e){}
                var t=tmdb.title||tmdb.name||'',o=tmdb.original_title||tmdb.original_name||'',y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);
                Lampa.Noty.show('Tìm nguồn...');
                var slugs=await fSlugs(t,o,y);
                bDet(tmdb,logos,slugs);
            }).catch(function(e){comp.activity.loader(false);Lampa.Noty.show('Lỗi: '+(e.message||''));});
        };
        async function bDet(tmdb,logos,slugs){
            cScr(scroll);
            var bk=tmdb.backdrop_path?TMDB_IMG+tmdb.backdrop_path:'';
            var ps=tmdb.poster_path?TMDB_W500+tmdb.poster_path:'';
            var t=tmdb.title||tmdb.name||'',o2=tmdb.original_title||tmdb.original_name||'',d=tmdb.overview||'';
            var v=tmdb.vote_average?Number(tmdb.vote_average).toFixed(1):'N/A';
            var y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);
            var rt=tmdb.runtime?tmdb.runtime+' phút':'';
            if(!rt&&tmdb.episode_run_time&&tmdb.episode_run_time.length)rt=tmdb.episode_run_time[0]+' phút/tập';
            var epExtra='';
            if(tmdb.number_of_episodes)epExtra=tmdb.number_of_episodes+' tập';
            if(tmdb.number_of_seasons)epExtra+=(epExtra?' | ':'')+tmdb.number_of_seasons+' season';
            var country='';
            if(tmdb.production_countries&&tmdb.production_countries.length)country=tmdb.production_countries.map(function(c){return c.iso_3166_1;}).join(', ');
            else if(tmdb.origin_country&&tmdb.origin_country.length)country=tmdb.origin_country[0];
            var genreStr=(tmdb.genres||[]).slice(0,3).map(function(g){return g.name;}).join(' | ');
            var status=tmdb.status||'',rated='';
            try{if(tmdb.release_dates&&tmdb.release_dates.results){var usR=tmdb.release_dates.results.find(function(r){return r.iso_3166_1==='US';});if(usR&&usR.release_dates&&usR.release_dates.length)rated=usR.release_dates[0].certification||'';}}catch(e){}
            var tagline=tmdb.tagline||'';
            var logo=pLogo(logos||(tmdb.images||{})),logoH='';
            if(logo&&logo.file_path)logoH='<div class="kk-logo"><img src="'+TMDB_W500+logo.file_path+'"></div>';
            var gh=gHtml(tmdb.genres,true);
            var dirsArr=[],castArr=[];
            if(tmdb.credits){
                castArr=(tmdb.credits.cast||[]).slice(0,15);
                dirsArr=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator'||c.job==='Series Director';}).filter(function(p,i,a){return a.findIndex(function(x){return x.name===p.name;})===i;}).slice(0,8);
            }
            var crewH=mkDirHtml(dirsArr,true);
            var imdb=(tmdb.external_ids&&tmdb.external_ids.imdb_id)||null;
            var tH=logoH?'':'<div class="kk-title">'+E(t)+'</div>';
            var heroExtra={tagline:tagline,vote:v,year:y,runtime:rt+(epExtra?' · '+epExtra:''),country:country,genres:genreStr,status:status,rated:rated};
            var hero=mkHero(bk,ps,logoH,tH,o2,heroExtra);
            var body=mkBody(v,y,rt,epExtra,gh,crewH,d);
            body.find('.kk-genre[data-gid]').each(function(){var g=$(this);bE(g,function(){Lampa.Activity.push({url:'',title:g.attr('data-gname')||'',component:'kkphim_tmdb_genre',genre_id:g.attr('data-gid'),page_num:1});});});
            bindDirClicks(body);
            var act=$('<div class="kk-actions"></div>');
            if(slugs.kkphim){if(mt==='movie')act.append(bMovExp('kkphim','KKPhim',slugs.kkphim,t,'kk-src-btn--kkphim'));else act.append(bTVExp('kkphim','KKPhim',slugs.kkphim,t,o2,'kk-src-btn--kkphim'));}
            else{act.append('<div class="kk-src-btn kk-src-btn--no">KKPhim – N/A</div>');}
            if(slugs.ophim){if(mt==='movie')act.append(bMovExp('ophim','OPhim',slugs.ophim,t,'kk-src-btn--ophim'));else act.append(bTVExp('ophim','OPhim',slugs.ophim,t,o2,'kk-src-btn--ophim'));}
            else{act.append('<div class="kk-src-btn kk-src-btn--no">OPhim – N/A</div>');}
            act.append(bTorBtn(mt,tid,t,ps,imdb));
            body.append(act);
            var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);
            if(castArr.length){var castSec=$('<div class="kk-section"><div class="kk-block-title">Diễn viên</div></div>');castSec.append(mkCastList(castArr,true));dw.append(castSec);}
            var simI=(tmdb.similar&&tmdb.similar.results)?tmdb.similar.results.slice(0,20):[];
            if(simI.length){var ss2=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">Phim tương tự</div>');var sl=$('<div class="kk-similar-list"></div>');simI.forEach(function(i){if(!i.media_type)i.media_type=mt;sl.append(mkTC(i));});ss2.append(sl);dw.append(ss2);}
            try{
                var rd2=await tRec(mt,tid,1);var ri=(rd2.results||[]).slice(0,20);
                if(ri.length){var rs2=$('<div class="kk-section kk-similar kk-section--last"></div>').append('<div class="kk-block-title">🎲 Gợi ý</div>');var rl2=$('<div class="kk-similar-list"></div>');ri.forEach(function(i){if(!i.media_type)i.media_type=mt;rl2.append(mkTC(i));});rs2.append(rl2);dw.append(rs2);}
                else if(simI.length){dw.find('.kk-similar').last().addClass('kk-section--last');}
            }catch(e){if(simI.length)dw.find('.kk-similar').last().addClass('kk-section--last');}
            scroll.append(dw);comp.activity.loader(false);comp.start();
        }
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
    });

    /* ── CATEGORY ── */
    Lampa.Component.add('kkphim_category',function(obj){
        var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
        var page=obj.page_num||1,title=obj.title||(obj.cat&&obj.cat.name)||'',mode=obj.mode||'api',apiPath=obj.cat?obj.cat.api:null,catSlug=obj.category_slug||'';
        var grid=$('<div class="kk-grid"></div>'),lm=$('<div class="kk-loadmore selector">Tải thêm</div>'),ld=false,hm=true;
        this.create=function(){this.activity.loader(true);cScr(scroll);grid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(title)+'</div>').append(grid).append(lm));bE(lm,function(){if(!ld&&hm)doL();});doL();};
        function hr(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(nm).filter(function(i){return i&&i.slug;});if(!list.length){hm=false;lm.text('Hết');comp.activity.loader(false);ld=false;comp.start();return;}list.forEach(function(i){grid.append(mkC(i).addClass('kk-card--grid'));});page++;ld=false;lm.text('Tải thêm');comp.activity.loader(false);comp.start();}
        function doL(){ld=true;lm.text('Đang tải...');var url=(mode==='category'&&catSlug)?sApi()+'v1/api/the-loai/'+catSlug+'?page='+page:sApi()+apiPath+'?page='+page;net.silent(url,hr,function(){ld=false;lm.text('Lỗi');comp.activity.loader(false);});}
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};
    });

    /* ── SEARCH ── */
    Lampa.Component.add('kkphim_search',function(obj){
        var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
        var kw=obj.keyword||'',page=obj.page_num||1;
        var grid=$('<div class="kk-grid"></div>'),lm=$('<div class="kk-loadmore selector">Tải thêm</div>'),ld=false,hm=true;
        this.create=function(){this.activity.loader(true);cScr(scroll);grid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">🔍 '+E(kw)+'</div>').append(grid).append(lm));bE(lm,function(){if(!ld&&hm)doL();});doL();};
        function hr(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(nm).filter(function(i){return i&&i.slug;});if(!list.length){hm=false;lm.text(page===1?'Không có':'Hết');comp.activity.loader(false);ld=false;comp.start();return;}list.forEach(function(i){grid.append(mkC(i).addClass('kk-card--grid'));});page++;ld=false;lm.text('Tải thêm');comp.activity.loader(false);comp.start();}
        function doL(){ld=true;lm.text('Đang tải...');net.silent(sApi()+'v1/api/tim-kiem?keyword='+encodeURIComponent(kw)+'&page='+page,hr,function(){net.silent(sApi()+'tim-kiem?keyword='+encodeURIComponent(kw)+'&page='+page,hr,function(){ld=false;lm.text('Lỗi');comp.activity.loader(false);});});}
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};
    });

    /* ── KKPHIM DETAIL ── */
    Lampa.Component.add('kkphim_detail',function(obj){
        var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),movie=nm(obj.movie),comp=this,rnd=false;
        this.create=function(){this.activity.loader(true);cScr(scroll);rnd=false;if(!movie||!movie.slug){this.activity.loader(false);comp.start();return;}net.silent(sApi()+'phim/'+movie.slug,function(res){if(rnd)return;ldAll(nm(res.movie||res||{}),res.episodes||[]);},function(){comp.activity.loader(false);});};
        async function ldAll(data,eps){
            if(!data||!data.slug)data=movie;
            try{
                var tid=gTid(data),tt=dType(data),tmdb=null,logos=null;
                if(tid){try{tmdb=await tFetch('/'+tt+'/'+tid+'?language='+tmLang()+'&append_to_response=credits,images');}catch(e){}try{logos=await tFetch('/'+tt+'/'+tid+'/images');}catch(e){}}
                if(!rnd){bld(data,eps,tmdb,logos,tt);rnd=true;}
            }catch(e){if(!rnd){bld(data,eps,null,null,dType(data));rnd=true;}}
            comp.activity.loader(false);comp.start();
        }
        function bld(data,eps,tmdb,logos,tt){
            cScr(scroll);if(!Array.isArray(data.category))data.category=[];
            var bk=fImg(data.thumb_url||data.poster_url),ps=fImg(data.poster_url||data.thumb_url);
            var t=data.name||'',o2=data.origin_name||'',d=cDesc(data.content);
            var v=(data.tmdb&&data.tmdb.vote_average)||'N/A',y=data.year||'',rt=data.time||'',epCur=data.episode_current||'';
            var dirsArr=[],castArr=[],logoH='',country='',tagline='',status='',genreStr='';
            if(tmdb){
                if(tmdb.backdrop_path)bk=TMDB_IMG+tmdb.backdrop_path;
                if(tmdb.poster_path)ps=TMDB_IMG+tmdb.poster_path;
                if(tmdb.title||tmdb.name)t=tmdb.title||tmdb.name;
                if(tmdb.original_title||tmdb.original_name)o2=tmdb.original_title||tmdb.original_name;
                if(tmdb.overview)d=tmdb.overview;
                if(tmdb.vote_average)v=Number(tmdb.vote_average).toFixed(1);
                if(tmdb.release_date)y=tmdb.release_date.slice(0,4);
                if(tmdb.runtime)rt=tmdb.runtime+' phút';
                tagline=tmdb.tagline||'';status=tmdb.status||'';
                genreStr=(tmdb.genres||[]).slice(0,3).map(function(g){return g.name;}).join(' | ');
                if(tmdb.production_countries&&tmdb.production_countries.length)country=tmdb.production_countries.map(function(c){return c.iso_3166_1;}).join(', ');
                var logo=pLogo(logos||tmdb.images);
                if(logo&&logo.file_path)logoH='<div class="kk-logo"><img src="'+TMDB_W500+logo.file_path+'"></div>';
                if(tmdb.credits){castArr=(tmdb.credits.cast||[]).slice(0,15);dirsArr=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator';}).filter(function(p,i,a){return a.findIndex(function(x){return x.name===p.name;})===i;}).slice(0,8);}
            }
            if(!dirsArr.length&&data.director){var dn=Array.isArray(data.director)?data.director:[String(data.director)];dirsArr=dn.filter(Boolean).map(function(n){return{name:n,id:null};});}
            if(!genreStr&&data.category&&data.category.length)genreStr=data.category.slice(0,3).map(function(c){return c.name||'';}).join(' | ');
            var hasTmdb=!!gTid(data);
            var crewH=mkDirHtml(dirsArr,hasTmdb);
            var gh=gHtml(data.category,false);
            var tH=logoH?'':'<div class="kk-title">'+E(t)+'</div>';
            var heroExtra={tagline:tagline,vote:v,year:y,runtime:rt+(epCur?' · '+epCur:''),country:country,genres:genreStr,status:status,rated:''};
            var hero=mkHero(bk,ps,logoH,tH,o2,heroExtra);
            var body=mkBody(v,y,rt,epCur,gh,crewH,d);
            body.find('.kk-genre[data-slug]').each(function(){var g=$(this);bE(g,function(){var slug=g.attr('data-slug');if(slug)Lampa.Activity.push({url:'',title:g.attr('data-title')||'',component:'kkphim_category',mode:'category',category_slug:slug,page_num:1});});});
            bindDirClicks(body);
            var act=$('<div class="kk-actions"></div>');
            var cSrc=src(),sCss=cSrc.key==='kkphim'?'kk-src-btn--kkphim':'kk-src-btn--ophim';
            if(eps&&eps.length)act.append(bDetExp(eps,data.name||t,cSrc.name,sCss));
            else act.append('<div class="kk-src-btn kk-src-btn--no">⚠️ Không có tập</div>');
            if(hasTmdb)act.append(bTorBtn(tt,gTid(data),data.name||t,ps,null));
            body.append(act);
            var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);
            if(castArr.length){var castSec=$('<div class="kk-section"><div class="kk-block-title">Diễn viên</div></div>');castSec.append(mkCastList(castArr,hasTmdb));dw.append(castSec);}
            var pCats=data.category||[];
            if(pCats.length&&pCats[0]&&pCats[0].slug){
                var ss2=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">Phim liên quan</div>');
                var sl=$('<div class="kk-similar-list"><div class="kk-ep-ld">⏳</div></div>');
                ss2.append(sl);dw.append(ss2);
                fetch(sApi()+'v1/api/the-loai/'+pCats[0].slug+'?page=1').then(function(r){return r.json();}).then(function(res){var items=((res&&res.data&&res.data.items)||(res&&res.items)||[]).map(nm).filter(function(i){return i&&i.slug&&i.slug!==data.slug;});sl.empty();if(items.length)items.slice(0,20).forEach(function(i){sl.append(mkC(i));});else sl.html('<div class="kk-ep-ld">Không có</div>');}).catch(function(){sl.empty();});
            }
            if(hasTmdb){
                var tid2=gTid(data);
                var ts2=$('<div class="kk-section kk-similar kk-section--last"></div>').append('<div class="kk-block-title">🎬 TMDB liên quan</div>');
                var tl=$('<div class="kk-similar-list"><div class="kk-ep-ld">⏳</div></div>');
                ts2.append(tl);dw.append(ts2);
                tSimilar(tt,tid2,1).then(function(res){var items=(res.results||[]).slice(0,20);tl.empty();if(items.length)items.forEach(function(i){if(!i.media_type)i.media_type=tt;tl.append(mkTC(i));});else tl.html('<div class="kk-ep-ld">Không có</div>');}).catch(function(){tl.empty();});
            }
            scroll.append(dw);
        }
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};
    });
}

if(window.appready)startPlugin();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')startPlugin();});
})();