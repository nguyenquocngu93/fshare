(function () {
    'use strict';

    if (window.__kkphim_plugin_started) return;
    window.__kkphim_plugin_started = true;

    var SOURCES = {
        kkphim: { key: 'kkphim', name: 'KKPhim', api: 'https://phimapi.com/', img: 'https://phimimg.com/' },
        ophim: { key: 'ophim', name: 'OPhim', api: 'https://ophim1.com/', img: 'https://img.ophim.live/uploads/movies/' }
    };

    var TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
    var TMDB_API_KEY = '6979c8ec101ed849f44d197c86582644';
    var TMDB_IMG = 'https://image.tmdb.org/t/p/original';
    var TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';
    var TORRENTIO_BASE = 'https://torrentio.strem.fun';
    var SUBDL_API_KEY = '';
    var SUBDL_API = 'https://api.subdl.com/api/v1/subtitles';
    var SUBDL_CDN = 'https://dl.subdl.com';
    var SETTINGS_KEY = 'kkphim_settings';

    var TMDB_MOVIE_GENRES = [
        {id:28,name:'Hành Động'},{id:12,name:'Phiêu Lưu'},{id:16,name:'Hoạt Hình'},
        {id:35,name:'Hài'},{id:80,name:'Hình Sự'},{id:99,name:'Tài Liệu'},
        {id:18,name:'Chính Kịch'},{id:10751,name:'Gia Đình'},{id:14,name:'Giả Tưởng'},
        {id:36,name:'Lịch Sử'},{id:27,name:'Kinh Dị'},{id:10402,name:'Âm Nhạc'},
        {id:9648,name:'Bí Ẩn'},{id:10749,name:'Lãng Mạn'},{id:878,name:'Khoa Học VT'},
        {id:53,name:'Giật Gân'},{id:10752,name:'Chiến Tranh'},{id:37,name:'Viễn Tây'}
    ];
    var TMDB_TV_GENRES = [
        {id:10759,name:'Hành Động & Phiêu Lưu'},{id:16,name:'Hoạt Hình'},{id:35,name:'Hài'},
        {id:80,name:'Hình Sự'},{id:99,name:'Tài Liệu'},{id:18,name:'Chính Kịch'},
        {id:10751,name:'Gia Đình'},{id:10762,name:'Trẻ Em'},{id:9648,name:'Bí Ẩn'},
        {id:10765,name:'KH VT & Giả Tưởng'},{id:10768,name:'Chiến Tranh & Chính Trị'}
    ];

    function loadSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY))||{};}catch(e){return {};}}
    function saveSettings(o){try{var c=loadSettings();Object.keys(o).forEach(function(k){c[k]=o[k];});localStorage.setItem(SETTINGS_KEY,JSON.stringify(c));}catch(e){}}
    function getSourceKey(){return loadSettings().source||'ophim';}
    function getSource(){return SOURCES[getSourceKey()]||SOURCES.ophim;}
    function SRC_API(){return getSource().api;}
    function SRC_IMG(){return getSource().img;}
    function getTSHost(){return loadSettings().torrserver_host||'';}
    function getTSPass(){return loadSettings().torrserver_password||'';}
    function getTioConfig(){return loadSettings().torrentio_config||'';}
    function getAioConfig(){return loadSettings().aio_config||'';}
    function getSubMode(){return loadSettings().sub_mode||'ask';}
    function getSubdlKey(){return loadSettings().subdl_api_key||SUBDL_API_KEY;}
    function fullImg(u){if(!u)return '';if(u.indexOf('http')===0)return u;return SRC_IMG()+u;}

    function parseStreamConfig(raw){if(!raw)return null;raw=String(raw).trim().replace(/\s+/g,'');var m;m=raw.match(/^(https?:\/\/[^\/]+)\/(.+?)\/manifest\.json$/i);if(m)return{base:m[1],config:m[2]};m=raw.match(/^(https?:\/\/[^\/]+)\/(.+?)\/stream\//i);if(m)return{base:m[1],config:m[2]};m=raw.match(/^(https?:\/\/[^\/]+)\/configure\/(.+?)$/i);if(m)return{base:m[1],config:m[2].replace(/\/+$/,'')};m=raw.match(/^(https?:\/\/[^\/]+)\/?$/i);if(m)return{base:m[1],config:''};m=raw.match(/^(https?:\/\/[^\/]+)\/([^\/]+)$/i);if(m)return{base:m[1],config:m[2]};if(raw.indexOf('=')!==-1&&raw.indexOf('://')===-1)return{base:TORRENTIO_BASE,config:raw.replace(/\|/g,'%7C')};return null;}
    function getStreamBase(){var a=getAioConfig();if(a){var p=parseStreamConfig(a);if(p&&p.base.indexOf('torrentio.strem.fun')===-1)return{base:p.base,config:p.config,source:'aio'};}var t=getTioConfig();if(t){var p2=parseStreamConfig(t);if(p2)return{base:p2.base,config:p2.config,source:'torrentio'};}return{base:TORRENTIO_BASE,config:'',source:'torrentio'};}
    function buildStreamUrl(type,imdbId,s,e){var cfg=getStreamBase();var mt=type==='tv'?'series':'movie';var id=imdbId;if(type==='tv'&&s&&e)id=imdbId+':'+s+':'+e;return cfg.base+(cfg.config?'/'+cfg.config:'')+'/stream/'+mt+'/'+id+'.json';}

    function tsUrl(p){var h=getTSHost();if(!h)return '';h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;return h+p;}
    function tsHdr(){var h={'Content-Type':'application/json'};var pw=getTSPass();if(pw)h['Authorization']='Basic '+btoa('admin:'+pw);return h;}
    async function tsAdd(mag,title,poster){var u=tsUrl('/torrents');if(!u)throw new Error('TS');var r=await fetch(u,{method:'POST',headers:tsHdr(),body:JSON.stringify({action:'add',link:mag,title:title||'',poster:poster||'',save_to_db:false})});if(!r.ok)throw new Error('TS:'+r.status);return await r.json();}
    async function tsGetFiles(hash){var u=tsUrl('/torrents');if(!u)throw new Error('TS');var r=await fetch(u,{method:'POST',headers:tsHdr(),body:JSON.stringify({action:'get',hash:hash})});if(!r.ok)throw new Error('TS:'+r.status);return await r.json();}
    function buildMag(h){var m='magnet:?xt=urn:btih:'+h;['udp://tracker.opentrackr.org:1337/announce','udp://open.stealth.si:80/announce','udp://tracker.torrent.eu.org:451/announce'].forEach(function(t){m+='&tr='+encodeURIComponent(t);});return m;}

    async function playViaTS(stream,title,poster,fileIdx,movieData,ttype,season,episode){
        if(!getTSHost()){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
        Lampa.Noty.show('Đang gửi TorrServer...');
        try{
            var td=await tsAdd(buildMag(stream.infoHash),title,poster);var hash=td.hash||stream.infoHash;await delay(2000);
            var info=null,rt=0;while(rt<3){try{info=await tsGetFiles(hash);if(info&&info.file_stats&&info.file_stats.length)break;}catch(e){}rt++;await delay(1500);}
            var files=[];if(info&&info.file_stats)files=info.file_stats.filter(function(f){return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);}).sort(function(a,b){return(a.id||0)-(b.id||0);});
            var playUrl;
            if(!files.length)playUrl=tsUrl('/stream/fname?link='+hash+'&index=0&play');
            else if(files.length===1)playUrl=tsUrl('/stream/fname?link='+hash+'&index='+(files[0].id||0)+'&play');
            else if(fileIdx!==undefined&&fileIdx!==null&&fileIdx>=0&&fileIdx<files.length)playUrl=tsUrl('/stream/fname?link='+hash+'&index='+(files[fileIdx].id||fileIdx)+'&play');
            else{Lampa.Select.show({title:'📁 Chọn file ('+files.length+')',items:files.map(function(f,i){var n=(f.path||('File '+i)).split('/').pop();var s=f.length?(f.length/1048576).toFixed(0)+'MB':'';return{title:n+(s?' ('+s+')':''),value:f};}),onSelect:async function(a){await playUrlWithSub(tsUrl('/stream/fname?link='+hash+'&index='+a.value.id+'&play'),title,movieData,ttype,season,episode);},onBack:function(){Lampa.Controller.toggle('content');}});return;}
            await playUrlWithSub(playUrl,title,movieData,ttype,season,episode);
        }catch(e){Lampa.Noty.show('Lỗi TS: '+(e.message||''));}
    }

    var _subCache={};
    function srtToVtt(srt){return 'WEBVTT\n\n'+srt.replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g,'$1.$2');}
    async function loadJSZip(){if(window.JSZip)return;await new Promise(function(ok,fail){var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';s.onload=ok;s.onerror=fail;document.head.appendChild(s);});}
    async function extractSubText(sub){try{if(sub.isZip){await loadJSZip();var r=await fetch(sub.url);var buf=await r.arrayBuffer();var zip=await JSZip.loadAsync(buf);var found=null;zip.forEach(function(p,e){if(!found&&!e.dir&&p.match(/\.(srt|vtt|ass|ssa|sub)$/i))found=e;});return found?await found.async('text'):null;}var r2=await fetch(sub.url);return await r2.text();}catch(e){return null;}}
    async function resolveSubVtt(sub){try{var text=await extractSubText(sub);if(!text)return sub.url;if(text.indexOf('WEBVTT')===-1)text=srtToVtt(text);return URL.createObjectURL(new Blob([text],{type:'text/vtt;charset=utf-8'}));}catch(e){return sub.url;}}

    async function searchSubs(imdbId,tmdbId,type,season,episode,titleEn){
        var ck=(imdbId||tmdbId||titleEn||'')+':'+(season||0)+':'+(episode||0);if(_subCache[ck])return _subCache[ck];
        var apiKey=getSubdlKey();if(!apiKey){_subCache[ck]=[];return[];}
        try{var p=['api_key='+apiKey];if(imdbId)p.push('imdb_id='+imdbId);else if(tmdbId)p.push('tmdb_id='+tmdbId);else if(titleEn)p.push('film_name='+encodeURIComponent(titleEn));else{_subCache[ck]=[];return[];}
        if(type==='tv'&&season&&episode){p.push('season_number='+season);p.push('episode_number='+episode);}p.push('languages=vi,en,zh,ja,ko');p.push('subs_per_page=100');p.push('type='+(type==='tv'?'tv':'movie'));
        var r=await fetch(SUBDL_API+'?'+p.join('&'));if(!r.ok){_subCache[ck]=[];return[];}var d=await r.json();
        if(d.status&&d.subtitles&&d.subtitles.length){var lm={vi:'🇻🇳',vietnamese:'🇻🇳',en:'🇬🇧',english:'🇬🇧',zh:'🇨🇳',ja:'🇯🇵',ko:'🇰🇷'};var results=d.subtitles.map(function(s){var lang=(s.language||'').toLowerCase();var label=(lm[lang]||lang.toUpperCase());if(s.release_name)label+=' '+s.release_name;if(s.author)label+=' ('+s.author+')';return{label:label,url:SUBDL_CDN+s.url,language:lang,isZip:(s.url||'').endsWith('.zip')};});results.sort(function(a,b){var o={vi:0,vietnamese:0,en:1,english:1};return(o[a.language]!==undefined?o[a.language]:2)-(o[b.language]!==undefined?o[b.language]:2);});_subCache[ck]=results;return results;}}catch(e){}
        _subCache[ck]=[];return[];
    }

    var _olActive=false,_olInt=null,_olCues=[];
    function stopSubOL(){_olActive=false;if(_olInt){clearInterval(_olInt);_olInt=null;}var el=document.getElementById('kk-sub-overlay');if(el){el.innerHTML='';el.style.display='none';}}

    function playInternal(url,title,subUrl,subLabel){
        stopSubOL();Lampa.Player.play({title:title,url:url});
        if(!subUrl)return;
        var n=0,t=setInterval(function(){n++;if(n>40){clearInterval(t);return;}var v=document.querySelector('video');if(!v||!v.src)return;clearInterval(t);Array.from(v.querySelectorAll('track[data-kk]')).forEach(function(x){x.remove();});var tk=document.createElement('track');tk.kind='subtitles';tk.label=subLabel||'Sub';tk.srclang='vi';tk.src=subUrl;tk.setAttribute('data-kk','1');tk.default=true;v.appendChild(tk);tk.addEventListener('load',function(){try{for(var i=0;i<v.textTracks.length;i++)v.textTracks[i].mode=v.textTracks[i].label===(subLabel||'Sub')?'showing':'disabled';}catch(e){}});setTimeout(function(){try{for(var i=0;i<v.textTracks.length;i++)if(v.textTracks[i].label===(subLabel||'Sub'))v.textTracks[i].mode='showing';}catch(e){}},800);Lampa.Noty.show('📝 '+(subLabel||'Sub'));},500);
    }

    function showCopyName(movieData,tmdbData){
        var enTitle='',year='';
        if(tmdbData){enTitle=tmdbData.original_title||tmdbData.original_name||tmdbData.title||tmdbData.name||'';if(tmdbData.release_date)year=tmdbData.release_date.slice(0,4);else if(tmdbData.first_air_date)year=tmdbData.first_air_date.slice(0,4);}
        if(!enTitle){enTitle=movieData.origin_name||movieData.name||'';year=movieData.year||'';}
        var items=[{title:'📋 '+enTitle+(year?' '+year:''),value:enTitle+(year?' '+year:'')},{title:'📋 '+enTitle+(year?' ('+year+')':''),value:enTitle+(year?' ('+year+')':'')},{title:'📋 '+enTitle,value:enTitle}];
        if(movieData.name&&movieData.name!==enTitle)items.push({title:'📋 '+movieData.name+' (Việt)',value:movieData.name});
        Lampa.Select.show({title:'🔍 Copy tên',items:items,onSelect:function(a){copyToClipboard(a.value);Lampa.Noty.show('✅ '+a.value);},onBack:function(){Lampa.Controller.toggle('content');}});
    }

    async function showSubMenu(url,title,movieData,ttype,season,episode,tmdbData){
        var tmdbId=getTmdbId(movieData),imdbId=null;if(tmdbId)try{imdbId=await getImdbId(ttype||'movie',tmdbId);}catch(e){}
        var enTitle=tmdbData?(tmdbData.original_title||tmdbData.original_name||tmdbData.title||tmdbData.name||''):(movieData.origin_name||movieData.name||'');
        Lampa.Noty.show('Tìm phụ đề...');var subs=await searchSubs(imdbId,tmdbId,ttype,season,episode,enTitle);
        if(!subs.length){Lampa.Noty.show(getSubdlKey()?'Không có sub':'Cần API key SubDL');Lampa.Player.play({title:title,url:url});return;}
        Lampa.Select.show({title:'📝 Phụ đề ('+subs.length+')',items:[{title:'▶ Không sub',value:null}].concat(subs.slice(0,40).map(function(s){return{title:s.label,value:s};})),onSelect:async function(a){if(!a.value){stopSubOL();Lampa.Player.play({title:title,url:url});return;}Lampa.Noty.show('Tải sub...');var su=await resolveSubVtt(a.value);playInternal(url,title,su,a.value.label);},onBack:function(){stopSubOL();Lampa.Player.play({title:title,url:url});}});
    }

    async function playUrlWithSub(url,title,movieData,ttype,season,episode,tmdbData){
        var mode=getSubMode();if(mode==='off'){stopSubOL();Lampa.Player.play({title:title,url:url});return;}
        var tmdbId=getTmdbId(movieData),imdbId=null;if(tmdbId)try{imdbId=await getImdbId(ttype||'movie',tmdbId);}catch(e){}
        var enTitle=tmdbData?(tmdbData.original_title||tmdbData.original_name||tmdbData.title||tmdbData.name||''):(movieData.origin_name||movieData.name||'');
        if(mode==='auto'){if(!getSubdlKey()){Lampa.Player.play({title:title,url:url});return;}var subs=await searchSubs(imdbId,tmdbId,ttype,season,episode,enTitle);var best=subs.find(function(s){return s.language==='vi'||s.language==='vietnamese';})||subs.find(function(s){return s.language==='en'||s.language==='english';})||subs[0];if(!best){Lampa.Player.play({title:title,url:url});return;}Lampa.Noty.show('Tải sub...');var su=await resolveSubVtt(best);playInternal(url,title,su,best.label);return;}
        await showSubMenu(url,title,movieData,ttype,season,episode,tmdbData);
    }

    function delay(ms){return new Promise(function(r){setTimeout(r,ms);});}

    var _tmdbCache={};
    async function searchTmdbByName(name,originName,year,type){
        if(!name&&!originName)return null;var key=(originName||name)+':'+year+':'+type;if(_tmdbCache[key]!==undefined)return _tmdbCache[key];
        var q=(originName||name).replace(/\(.*?\)/g,'').replace(/\[.*?\]/g,'').trim();var mt=type==='tv'?'tv':'movie';
        try{var url,r,d;url='https://api.themoviedb.org/3/search/'+mt+'?api_key='+TMDB_API_KEY+'&query='+encodeURIComponent(q)+(year?'&year='+year:'')+'&language=vi-VN';r=await fetch(url);if(r.ok){d=await r.json();if(d.results&&d.results.length){_tmdbCache[key]=d.results[0];return d.results[0];}}
        if(year){url='https://api.themoviedb.org/3/search/'+mt+'?api_key='+TMDB_API_KEY+'&query='+encodeURIComponent(q)+'&language=vi-VN';r=await fetch(url);if(r.ok){d=await r.json();if(d.results&&d.results.length){_tmdbCache[key]=d.results[0];return d.results[0];}}}
        url='https://api.themoviedb.org/3/search/multi?api_key='+TMDB_API_KEY+'&query='+encodeURIComponent(q)+'&language=vi-VN';r=await fetch(url);if(r.ok){d=await r.json();if(d.results&&d.results.length){var m=d.results.find(function(i){return i.media_type===mt;});if(m){_tmdbCache[key]=m;return m;}}}}catch(e){}
        _tmdbCache[key]=null;return null;
    }

    async function tmdbFetch(path){var r=await fetch('https://api.themoviedb.org/3'+path,{headers:{'Authorization':'Bearer '+TMDB_TOKEN}});if(!r.ok)throw new Error('TMDB '+r.status);return await r.json();}
    async function getImdbId(type,id){if(!id)return null;try{return(await tmdbFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}catch(e){return null;}}
    async function getTmdbSeasons(id){try{var r=await tmdbFetch('/tv/'+id+'?language=vi-VN');if(r&&r.seasons)return r.seasons.filter(function(s){return s.season_number>0;}).map(function(s){return{season_number:s.season_number,name:s.name||('Season '+s.season_number),episode_count:s.episode_count||0};});}catch(e){}return[];}
    async function tmdbDiscoverByGenre(mt,gid,pg){var r=await fetch('https://api.themoviedb.org/3/discover/'+mt+'?api_key='+TMDB_API_KEY+'&with_genres='+gid+'&sort_by=popularity.desc&page='+(pg||1)+'&language=vi-VN');if(!r.ok)return{results:[],total_pages:0};return await r.json();}
    async function tmdbSearchMulti(q,pg){var r=await fetch('https://api.themoviedb.org/3/search/multi?api_key='+TMDB_API_KEY+'&query='+encodeURIComponent(q)+'&page='+(pg||1)+'&language=vi-VN');if(!r.ok)return{results:[],total_pages:0};return await r.json();}
    async function tmdbTrending(mt,pg){var r=await fetch('https://api.themoviedb.org/3/trending/'+mt+'/week?api_key='+TMDB_API_KEY+'&page='+(pg||1)+'&language=vi-VN');if(!r.ok)return{results:[],total_pages:0};return await r.json();}
    async function tmdbPopular(mt,pg){var r=await fetch('https://api.themoviedb.org/3/'+mt+'/popular?api_key='+TMDB_API_KEY+'&page='+(pg||1)+'&language=vi-VN');if(!r.ok)return{results:[],total_pages:0};return await r.json();}
    async function tmdbTopRated(mt,pg){var r=await fetch('https://api.themoviedb.org/3/'+mt+'/top_rated?api_key='+TMDB_API_KEY+'&page='+(pg||1)+'&language=vi-VN');if(!r.ok)return{results:[],total_pages:0};return await r.json();}

    // ===================== FIND EPISODES ON SOURCES =====================
    async function findOnSource(srcKey,tmdbId,nameVi,nameEn){
        var src=SOURCES[srcKey];if(!src)return null;
        var queries=[];if(nameEn)queries.push(nameEn);if(nameVi&&nameVi!==nameEn)queries.push(nameVi);
        for(var qi=0;qi<queries.length;qi++){
            try{
                var url=src.api+'v1/api/tim-kiem?keyword='+encodeURIComponent(queries[qi])+'&page=1';
                var r=await fetch(url);if(!r.ok)continue;var d=await r.json();
                var items=(d&&d.data&&d.data.items)||(d&&d.items)||[];
                for(var i=0;i<items.length;i++){
                    var it=items[i];if(!it||!it.slug)continue;
                    if(it.tmdb&&it.tmdb.id&&String(it.tmdb.id)===String(tmdbId))
                        return{slug:it.slug,source:srcKey};
                    var iN=(it.origin_name||'').toLowerCase().trim();
                    var iN2=(it.name||'').toLowerCase().trim();
                    var qL=queries[qi].toLowerCase().trim();
                    if(iN===qL||iN2===qL)return{slug:it.slug,source:srcKey};
                }
            }catch(e){}
        }
        return null;
    }

    async function fetchEpisodesFromSource(srcKey,slug){
        var src=SOURCES[srcKey];if(!src||!slug)return null;
        try{
            var r=await fetch(src.api+'phim/'+slug);if(!r.ok)return null;
            var d=await r.json();return d.episodes||[];
        }catch(e){return null;}
    }

    async function findAllSources(tmdbId,ttype,nameVi,nameEn){
        var results=[];
        var keys=Object.keys(SOURCES);
        var promises=keys.map(function(k){
            return findOnSource(k,tmdbId,nameVi,nameEn).then(function(found){
                if(found)return fetchEpisodesFromSource(found.source,found.slug).then(function(eps){
                    if(eps&&eps.length)results.push({source:found.source,sourceName:SOURCES[found.source].name,slug:found.slug,episodes:eps});
                });
            }).catch(function(){});
        });
        await Promise.all(promises);
        return results;
    }

    // ===================== STREAM PARSING =====================
    function parseStreamItem(st){
        var rawTitle=st.title||'',rawName=st.name||'',allText=rawTitle+'\n'+rawName;
        var lines=rawTitle.split('\n').map(function(l){return l.trim();}).filter(Boolean);
        var fileName='',quality='',size='',seeds='',codec='',audio='',langs='',provider='';
        var qMatch=allText.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDRip|BDRip|WEB-?DL|WEB-?Rip|BluRay|BRRip|HDTV|CAM|TS|DVDSCR)\b/i);if(qMatch)quality=qMatch[1].toUpperCase();
        var sizeMatch=allText.match(/💾\s*([\d.]+\s*[GMKT]i?B)/i)||allText.match(/([\d.]+\s*[GMKT]i?B)/i);if(sizeMatch)size=sizeMatch[1];
        var seedMatch=allText.match(/👤\s*(\d+)/);if(seedMatch)seeds=seedMatch[1];
        var codecMatch=allText.match(/\b(x264|x265|H\.?264|H\.?265|HEVC|AV1|VP9)\b/i);if(codecMatch)codec=codecMatch[1].toUpperCase();
        var hdrMatch=allText.match(/\b(HDR10\+?|HDR|DV|Dolby Vision|Atmos)\b/i);var hdr=hdrMatch?hdrMatch[1]:'';
        var audioMatch=allText.match(/\b(DTS-HD|DTS|DD5\.1|AAC|AC3|Atmos|TrueHD|FLAC|EAC3)\b/i);if(audioMatch)audio=audioMatch[1];
        var langMatch=allText.match(/\b(Multi|Dual|Vietnamese|English|Japanese|Korean|Chinese)\b/gi);if(langMatch)langs=langMatch.slice(0,3).join('/');
        var provMatch=allText.match(/⚙️\s*([^\n]+)/);if(provMatch)provider=provMatch[1].trim();if(!provider){var trackerMatch=allText.match(/\[([^\]]+)\]/);if(trackerMatch)provider=trackerMatch[1];}
        if(st.behaviorHints&&st.behaviorHints.filename)fileName=st.behaviorHints.filename;
        else if(lines.length>0){var candidates=lines.filter(function(l){return l.length>15&&(l.indexOf('.')>-1||l.indexOf('-')>-1)&&!l.match(/^[💾👤⚙️🎬🔊]/);});if(candidates.length)fileName=candidates.reduce(function(a,b){return a.length>b.length?a:b;});else if(lines[0]&&lines[0].length>10)fileName=lines[0];}
        fileName=fileName.replace(/\.(mkv|mp4|avi|mov)$/i,'').trim();
        if(!quality&&rawName){var q2=rawName.match(/\b(2160p|4K|1080p|720p|480p)\b/i);if(q2)quality=q2[1].toUpperCase();}
        var addonName='';if(rawName){var an=rawName.replace(/\s*(2160p|4K|1080p|720p|480p|UHD)\s*/gi,'').trim();if(an)addonName=an;}
        var label='';if(quality)label+=quality;if(size)label+=(label?' · ':'')+'💾 '+size;if(seeds)label+=(label?' · ':'')+'👤 '+seeds;
        var tp=[];if(codec)tp.push(codec);if(hdr)tp.push(hdr);if(audio)tp.push(audio);if(tp.length)label+=(label?' · ':'')+tp.join(' ');
        if(langs)label+=(label?' · ':'')+'🌐 '+langs;if(provider)label+=(label?' · ':'')+provider;else if(addonName&&addonName.toLowerCase()!=='aio')label+=(label?' · ':'')+addonName;
        var shortName=fileName;if(shortName.length>60)shortName=shortName.substring(0,57)+'...';if(shortName)label+='\n📄 '+shortName;
        if(st.url&&!st.infoHash)label+=' 🔗';
        return{label:label||rawName||rawTitle||'???',quality:quality,size:size,seeds:seeds?parseInt(seeds):0,infoHash:st.infoHash||'',fileIdx:st.fileIdx,url:st.url||'',behaviorHints:st.behaviorHints||{},hasUrl:!!(st.url)};
    }

    async function fetchStreams(type,imdbId,s,e){
        var url=buildStreamUrl(type,imdbId,s,e);var r=await fetch(url);if(!r.ok)throw new Error('HTTP '+r.status);var d=await r.json();
        var streams=(d.streams||[]).map(parseStreamItem);
        var qOrder={'2160P':0,'4K':0,'UHD':0,'1080P':1,'720P':2,'480P':3};
        streams.sort(function(a,b){if(a.hasUrl&&!b.hasUrl)return-1;if(!a.hasUrl&&b.hasUrl)return 1;var qa=qOrder[a.quality]!==undefined?qOrder[a.quality]:9;var qb=qOrder[b.quality]!==undefined?qOrder[b.quality]:9;if(qa!==qb)return qa-qb;return(b.seeds||0)-(a.seeds||0);});
        return streams;
    }

    function showStreamResults(streams,title,poster,movieData,ttype,season,episode,tmdbData){
        var ts=!!getTSHost();var cfg=getStreamBase();var srcIcon=cfg.source==='aio'?'🌊':'🧲';
        var headerTitle=srcIcon+' '+title+' ('+streams.length+')';if(ts)headerTitle+=' → TS';
        var groups={};streams.forEach(function(s){var q=s.quality||'Khác';if(!groups[q])groups[q]=[];groups[q].push(s);});
        var items=[];var qo=['2160P','4K','UHD','1080P','720P','480P','Khác'];
        qo.forEach(function(q){if(!groups[q]||!groups[q].length)return;items.push({title:'━━━ '+q+' ('+groups[q].length+') ━━━',value:null});groups[q].forEach(function(s){items.push({title:s.label,value:s});});});
        Object.keys(groups).forEach(function(q){if(qo.indexOf(q)!==-1)return;items.push({title:'━━━ '+q+' ('+groups[q].length+') ━━━',value:null});groups[q].forEach(function(s){items.push({title:s.label,value:s});});});
        Lampa.Select.show({title:headerTitle,items:items.map(function(item){if(!item.value)return{title:item.title,disabled:true};return{title:item.title,value:item.value};}),onSelect:function(a){if(!a.value)return;var s=a.value;if(s.url)playUrlWithSub(s.url,title,movieData,ttype,season,episode,tmdbData);else if(ts&&s.infoHash)playViaTS(s,title,poster,s.fileIdx,movieData,ttype,season,episode);else Lampa.Noty.show(s.infoHash?'Cần TorrServer!':'Không có link');},onBack:function(){Lampa.Controller.toggle('content');}});
    }

    async function openStreamSearch(tmdbId,ttype,data,episodes,poster,tmdbData){
        if(ttype==='tv'){tvStreamPicker(tmdbId,data,episodes,poster,tmdbData);return;}
        Lampa.Noty.show('Tìm stream...');
        try{var imdb=await getImdbId(ttype,tmdbId);if(!imdb){Lampa.Noty.show('Không tìm IMDB ID');return;}var streams=await fetchStreams(ttype,imdb);if(!streams.length){Lampa.Noty.show('Không có stream');return;}showStreamResults(streams,data.name||'',poster,data,ttype,null,null,tmdbData);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
    }

    async function tvStreamPicker(tmdbId,data,episodes,poster,tmdbData){
        Lampa.Noty.show('Tải seasons...');var seasons=await getTmdbSeasons(tmdbId);var imdb=await getImdbId('tv',tmdbId);
        if(!imdb){Lampa.Noty.show('Không tìm IMDB ID');return;}
        if(seasons.length>1)pickSeason(seasons,imdb,data,poster,tmdbData);
        else if(seasons.length===1)pickEpFrom(seasons[0],imdb,data,poster,tmdbData);
        else pickEpFB(imdb,data,episodes,poster,tmdbData);
    }
    function pad(n){return(n<10?'0':'')+n;}
    function pickSeason(seasons,imdb,data,poster,td){Lampa.Select.show({title:'📺 Season',items:seasons.map(function(s){return{title:s.name+(s.episode_count?' ('+s.episode_count+' tập)':''),value:s};}),onSelect:function(a){if(a.value.episode_count>0)pickEpFrom(a.value,imdb,data,poster,td);else promptEp(a.value.season_number,imdb,data,poster,td);},onBack:function(){Lampa.Controller.toggle('content');}});}
    function pickEpFrom(season,imdb,data,poster,td){var items=[];for(var i=1;i<=season.episode_count;i++)items.push({title:'S'+pad(season.season_number)+'E'+pad(i),value:{s:season.season_number,e:i}});Lampa.Select.show({title:'📺 '+season.name,items:items,onSelect:function(a){doStreamSearch(imdb,data,a.value.s,a.value.e,poster,td);},onBack:function(){Lampa.Controller.toggle('content');}});}
    function pickEpFB(imdb,data,episodes,poster,td){var eps=[];if(episodes)episodes.forEach(function(sv){(sv.server_data||[]).forEach(function(ep){var n=parseInt((ep.name||'').replace(/[^\d]/g,''))||0;if(n>0&&eps.indexOf(n)===-1)eps.push(n);});});eps.sort(function(a,b){return a-b;});if(!eps.length){promptEp(1,imdb,data,poster,td);return;}Lampa.Select.show({title:'📺 Chọn tập',items:eps.map(function(n){return{title:'S01E'+pad(n),value:{s:1,e:n}};}),onSelect:function(a){doStreamSearch(imdb,data,a.value.s,a.value.e,poster,td);},onBack:function(){Lampa.Controller.toggle('content');}});}
    function promptEp(ds,imdb,data,poster,td){try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Season:Episode',value:ds+':1',free:true},function(v){var p=String(v||ds+':1').split(':');doStreamSearch(imdb,data,parseInt(p[0])||ds,parseInt(p[1])||1,poster,td);});return;}}catch(e){}var v=window.prompt('Season:Episode',ds+':1'),p=String(v||ds+':1').split(':');doStreamSearch(imdb,data,parseInt(p[0])||ds,parseInt(p[1])||1,poster,td);}
    async function doStreamSearch(imdb,data,s,e,poster,td){var label=(data.name||'')+' S'+pad(s)+'E'+pad(e);Lampa.Noty.show('Tìm '+label+'...');try{var streams=await fetchStreams('tv',imdb,s,e);if(!streams.length){Lampa.Noty.show('Không có stream');return;}showStreamResults(streams,label,poster,data,'tv',s,e,td);}catch(err){Lampa.Noty.show('Lỗi: '+(err.message||''));}}

    // ===================== HELPERS =====================
    function copyToClipboard(t){try{if(navigator.clipboard){navigator.clipboard.writeText(t);return;}var a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;left:-9999px';document.body.appendChild(a);a.select();document.execCommand('copy');document.body.removeChild(a);}catch(e){}}
    function detectType(d){if(d&&d.tmdb&&d.tmdb.type==='tv')return 'tv';if(d&&d.tmdb&&d.tmdb.type==='movie')return 'movie';if(d&&(d.type==='series'||d.type==='tvshows'||d.type==='hoathinh'))return 'tv';if(d&&d.episode_total&&d.episode_total!=='1')return 'tv';return 'movie';}
    function getTmdbId(d){return(d&&d.tmdb&&d.tmdb.id)?d.tmdb.id:null;}
    function pickLogo(imgs){if(!imgs||!imgs.logos||!imgs.logos.length)return null;return imgs.logos.find(function(l){return l.iso_639_1==='en';})||imgs.logos[0]||null;}
    function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
    function cleanDesc(s){return String(s||'').replace(/<[^>]+>/g,'').trim()||'Không có mô tả';}
    function fmtTxt(s){return esc(s||'').replace(/\n/g,'<br>');}
    function norm(i){if(!i)return null;return{name:i.name||i.title||'',origin_name:i.origin_name||'',slug:i.slug||'',poster_url:i.poster_url||i.poster||'',thumb_url:i.thumb_url||i.thumb||'',year:i.year||'',quality:i.quality||'',episode_current:i.episode_current||'',tmdb:i.tmdb||{},category:Array.isArray(i.category)?i.category:[],director:i.director||'',content:i.content||'',time:i.time||'',episode_total:i.episode_total||'',type:i.type||''};}
    function getFirstEp(eps){for(var i=0;i<(eps||[]).length;i++)if(eps[i]&&eps[i].server_data&&eps[i].server_data.length)return eps[i].server_data[0];return null;}

    function bindEnter(el,fn){
        var sx=0,sy=0,moved=false,touched=false;
        el.on('touchstart',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;moved=false;}});
        el.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))moved=true;});
        el.on('touchend',function(e){if(moved)return;touched=true;e.preventDefault();e.stopPropagation();setTimeout(function(){fn.call(el[0],e);},100);setTimeout(function(){touched=false;},350);});
        el.on('click',function(e){if(touched||moved)return;e.preventDefault();e.stopPropagation();fn.call(this,e);});
        el.on('hover:enter',function(e){fn.call(this,e);});
    }

    function openSearch(){function go(kw){kw=String(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'Tìm',component:'kkphim_search',keyword:kw,page_num:1});}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm phim',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm phim:'));}
    function enableScroll(scroll){var el=scroll.render();el.css({overflow:'hidden',position:'relative',height:'100%'});var b=el.find('.scroll__body'),p={transform:'none','overflow-y':'auto','overflow-x':'hidden','-webkit-overflow-scrolling':'touch',height:'100%','padding-bottom':'8em','touch-action':'pan-y'};b.css($.extend({position:'relative'},p));if(b[0])Object.keys(p).forEach(function(k){b[0].style.setProperty(k,p[k],'important');});}
    function clearScroll(s){try{s.render().find('.scroll__body').empty();}catch(e){}}
    function applyCtrl(scroll){Lampa.Controller.add('content',{toggle:function(){Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},left:function(){if(Navigator.canmove('left'))Navigator.move('left');else Lampa.Controller.toggle('menu');},right:function(){Navigator.move('right');},up:function(){if(Navigator.canmove('up'))Navigator.move('up');else Lampa.Controller.toggle('head');},down:function(){Navigator.move('down');},back:function(){Lampa.Activity.backward();}});setTimeout(function(){Lampa.Controller.toggle('content');Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},0);}
    function mkPeople(list,key){return(list||[]).map(function(p){var av=p.profile_path?'<img src="'+TMDB_IMG_W500+p.profile_path+'">':'<div class="kk-cast-empty"></div>';return'<div class="kk-cast-card"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-name">'+esc(p.name||'')+'</div><div class="kk-cast-role">'+esc(p[key]||'')+'</div></div>';}).join('');}

    function mkCard(item){var n=norm(item);if(!n)return $('<div></div>');var p=fullImg(n.poster_url||n.thumb_url);var c=$('<div class="kk-card selector"><div class="kk-card-img"><img src="'+p+'">'+(n.quality?'<div class="kk-card-q">'+esc(n.quality)+'</div>':'')+(n.episode_current?'<div class="kk-card-ep">'+esc(n.episode_current)+'</div>':'')+'</div><div class="kk-card-name">'+esc(n.name)+'</div><div class="kk-card-year">'+esc(n.year)+'</div></div>');bindEnter(c,function(){if(!n.slug)return;Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});});return c;}

    function mkTmdbCard(item){
        var isTV=item.media_type==='tv'||!!item.first_air_date;var ttype=isTV?'tv':'movie';
        var title=item.title||item.name||'';var year=(item.release_date||item.first_air_date||'').slice(0,4);
        var poster=item.poster_path?TMDB_IMG_W500+item.poster_path:'';
        var vote=item.vote_average?Number(item.vote_average).toFixed(1):'';
        var c=$('<div class="kk-card selector"><div class="kk-card-img"><img src="'+poster+'">'+(vote?'<div class="kk-card-q">⭐'+vote+'</div>':'')+'</div><div class="kk-card-name">'+esc(title)+'</div><div class="kk-card-year">'+esc(year)+'</div></div>');
        bindEnter(c,function(){
            Lampa.Activity.push({url:'',title:title,component:'kkphim_detail_tmdb',tmdb_id:item.id,tmdb_type:ttype,page:1});
        });
        return c;
    }

    // ===================== CSS =====================
    function injectCSS(){
        if($('#kk-css').length)return;
        $('head').append('<style id="kk-css">'+
'.kk-topbar{display:flex;justify-content:space-between;align-items:center;padding:0 1.5em;margin-bottom:.8em;gap:1em}'+
'.kk-topbar-title{font-size:2em;font-weight:900;color:#fff;flex:1}'+
'.kk-topbar-btns{display:flex;gap:.5em}'+
'.kk-btn{display:inline-flex;align-items:center;padding:.8em 1.1em;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1);color:#fff;font-size:.98em;font-weight:800;cursor:pointer}'+
'.kk-btn.focus{background:#fff;color:#000}'+
'.kk-srcbar{display:flex;gap:.5em;padding:0 1.5em .7em;flex-wrap:wrap}'+
'.kk-srcbtn{padding:.6em 1em;border-radius:.75em;font-size:.95em;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.1)}'+
'.kk-srcbtn--on{background:rgba(99,102,241,.25);border-color:rgba(99,102,241,.5);color:#c4b5fd}'+
'.kk-srcbtn--off{background:rgba(255,255,255,.06);color:rgba(255,255,255,.45)}'+
'.kk-srcbtn--tmdb.kk-srcbtn--on{background:rgba(1,180,228,.2);border-color:rgba(1,180,228,.5);color:#90cef4}'+
'.kk-srcbtn.focus{background:rgba(99,102,241,.4);color:#fff}'+
'.kk-srcbtn--tmdb.focus{background:rgba(1,180,228,.35);color:#fff}'+
'.kk-tsbar{padding:0 1.5em .5em}'+
'.kk-tsbadge{display:inline-flex;align-items:center;gap:.4em;padding:.45em .85em;border-radius:.65em;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.15);font-size:.88em;color:#4ade80;font-weight:700}'+
'.kk-row{margin-bottom:1.9em}'+
'.kk-row-head{display:flex;justify-content:space-between;align-items:center;padding:0 1.5em;margin-bottom:.85em}'+
'.kk-row-title{font-size:1.55em;font-weight:900;color:#fff}'+
'.kk-row-more{font-size:.98em;font-weight:800;padding:.7em 1.1em;border-radius:999px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer}'+
'.kk-row-more.focus{background:#fff;color:#000}'+
'.kk-row-list{display:flex;gap:.9em;overflow-x:auto;overflow-y:hidden;padding:0 1.5em .2em;-webkit-overflow-scrolling:touch}'+
'.kk-row-list::-webkit-scrollbar,.kk-cast-list::-webkit-scrollbar,.kk-similar-list::-webkit-scrollbar{display:none}'+
'.kk-card{flex:0 0 auto;width:9.5em;cursor:pointer}'+
'.kk-card--grid{width:100%}'+
'.kk-card-img{position:relative;width:100%;aspect-ratio:2/3;border-radius:.9em;overflow:hidden;background:#242424}'+
'.kk-card-img img{width:100%;height:100%;object-fit:cover}'+
'.kk-card-q{position:absolute;top:.5em;left:.5em;padding:.2em .5em;border-radius:.4em;font-size:.7em;font-weight:800;background:#f6c344;color:#000}'+
'.kk-card-ep{position:absolute;top:.5em;right:.5em;padding:.2em .5em;border-radius:.4em;font-size:.7em;font-weight:800;background:#e53935;color:#fff}'+
'.kk-card-name{margin-top:.6em;font-size:1em;line-height:1.3;font-weight:700;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'+
'.kk-card-year{margin-top:.18em;font-size:.88em;color:rgba(255,255,255,.5)}'+
'.kk-grid-wrap{padding:0 1.5em}'+
'.kk-grid-title{font-size:1.9em;font-weight:900;color:#fff;margin:0 0 .85em}'+
'.kk-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.9em}'+
'.kk-loadmore{margin-top:1.1em;text-align:center;padding:.9em;border-radius:.9em;background:rgba(255,255,255,.08);color:#fff;font-size:1em;font-weight:800;cursor:pointer}'+
'.kk-loadmore.focus{background:#ff2332}'+
'.kk-detail-wrap{background:#141414;border-radius:1.4em;overflow:hidden;margin:0 0 1em}'+
'.kk-hero{position:relative;overflow:hidden;background:#111}'+
'.kk-hero-bg{position:relative;height:25em}'+
'.kk-hero-bg img{width:100%;height:100%;object-fit:cover}'+
'.kk-hero-mask{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.08),rgba(0,0,0,.16) 24%,rgba(0,0,0,.36) 52%,rgba(14,14,14,.78) 78%,rgba(14,14,14,1))}'+
'.kk-hero-bottom{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:1.4em 1.5em 1.2em}'+
'.kk-hero-flex{display:block}'+
'.kk-hero-poster{display:none}'+
'.kk-hero-info{min-width:0}'+
'.kk-logo{max-width:34em;margin:0 0 1em}'+
'.kk-logo img{max-width:100%;max-height:10em;object-fit:contain;filter:drop-shadow(0 .4em 1.1em rgba(0,0,0,.45))}'+
'.kk-title{font-size:2.5em;line-height:1.05;font-weight:900;color:#fff;margin-bottom:.2em}'+
'.kk-origin{font-size:1.15em;line-height:1.45;color:rgba(255,255,255,.82)}'+
'.kk-body{position:relative;z-index:3;padding:1.4em 1.5em 0;background:#141414}'+
'.kk-metas{display:flex;flex-wrap:wrap;gap:.65em;margin:0 0 1.1em}'+
'.kk-meta{padding:.55em .95em;border-radius:.8em;background:rgba(255,255,255,.08);color:#fff;font-size:1.1em;font-weight:800}'+
'.kk-genres{display:flex;flex-wrap:wrap;gap:.65em;margin:0 0 1.1em}'+
'.kk-genre{padding:.55em .95em;border-radius:.8em;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.95);font-size:1.02em;font-weight:700;cursor:pointer}'+
'.kk-genre.focus{background:rgba(255,255,255,.18)}'+
'.kk-crew{margin:0 0 1.1em}.kk-crew b{font-size:1.2em;font-weight:900;color:#fff;display:block;margin-bottom:.2em}.kk-crew span{font-size:1.08em;color:rgba(255,255,255,.88)}'+
'.kk-desc{font-size:1.2em;line-height:1.75;color:rgba(255,255,255,.93);margin:0 0 1.3em}'+
'.kk-actions{display:flex;flex-wrap:wrap;gap:.7em;padding:.1em 0 .2em}'+
'.kk-act-wrap{width:100%}'+
'.kk-act{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:.95em;border-radius:.95em;font-size:1.15em;font-weight:900;cursor:pointer}'+
'.kk-act--play{background:#ff1730;color:#fff}.kk-act--play.focus{background:#ff3047}'+
'.kk-act--stream{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff}.kk-act--stream.focus{background:linear-gradient(135deg,#818cf8,#a78bfa)}'+
'.kk-act--sub{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:#fff}.kk-act--sub.focus{background:rgba(255,255,255,.18)}'+
'.kk-act--copy{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:#fff}.kk-act--copy.focus{background:rgba(255,255,255,.18)}'+
'.kk-section{padding:1.25em 1.5em 0;background:#141414}'+
'.kk-section+.kk-section{padding-top:1.15em;border-top:1px solid rgba(255,255,255,.04)}'+
'.kk-body+.kk-section{border-top:1px solid rgba(255,255,255,.04)}'+
'.kk-section--last{padding-bottom:1.4em}'+
'.kk-block-title{font-size:1.75em;font-weight:900;color:#fff;margin:0 0 .8em}'+
'.kk-cast-list{display:flex;gap:1em;overflow-x:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x}'+
'.kk-cast-card{flex:0 0 auto;width:7.2em;text-align:center}'+
'.kk-cast-img{width:6.5em;height:6.5em;border-radius:50%;overflow:hidden;background:#2b2b2b;margin:0 auto .65em;border:2px solid rgba(255,255,255,.08)}'+
'.kk-cast-img img{width:100%;height:100%;object-fit:cover}'+
'.kk-cast-empty{width:100%;height:100%;background:#333;border-radius:50%}'+
'.kk-cast-name{font-size:1em;font-weight:800;color:#fff}'+
'.kk-cast-role{font-size:.88em;color:rgba(255,255,255,.6);margin-top:.12em}'+
'.kk-server{font-size:1.12em;font-weight:800;color:#63d471;margin:.95em 0 .65em}'+
'.kk-eps{display:flex;flex-wrap:wrap;gap:.65em}'+
'.kk-ep{min-width:4.2em;text-align:center;padding:.8em 1em;border-radius:.75em;background:rgba(255,255,255,.09);color:#fff;font-size:1em;font-weight:800;cursor:pointer}'+
'.kk-ep.focus{background:#ff2233}'+
'.kk-similar{padding-bottom:1.1em}'+
'.kk-similar-list{display:flex;gap:.9em;overflow-x:auto;-webkit-overflow-scrolling:touch}'+
'.kk-similar-list .kk-card{width:8.5em}'+
'.kk-stg-wrap{padding:1.4em}'+
'.kk-stg-title{font-size:2em;font-weight:900;color:#fff;margin:0 0 1.3em}'+
'.kk-stg-group{margin-bottom:1.7em}'+
'.kk-stg-group-title{font-size:1.3em;font-weight:900;color:#fff;margin:0 0 .8em;display:flex;align-items:center;gap:.5em}'+
'.kk-stg-item{display:flex;align-items:center;gap:.9em;margin-bottom:.7em;padding:1em 1.1em;border-radius:.95em;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.06);cursor:pointer}'+
'.kk-stg-item.focus{background:rgba(99,102,241,.2);border-color:rgba(99,102,241,.45)}'+
'.kk-stg-label{flex:1}.kk-stg-label-name{font-size:1.08em;font-weight:800;color:#fff}.kk-stg-label-desc{font-size:.92em;color:rgba(255,255,255,.45);margin-top:.18em}'+
'.kk-stg-value{font-size:.98em;font-weight:700;color:#a78bfa;max-width:14em;text-align:right;word-break:break-all}'+
'.kk-stg-status{margin-top:.7em;padding:.85em 1.1em;border-radius:.85em;font-size:.98em;font-weight:700}'+
'.kk-stg-status--ok{background:rgba(74,222,128,.12);color:#4ade80}'+
'.kk-stg-status--err{background:rgba(248,113,113,.12);color:#f87171}'+
'.kk-stg-status--loading{background:rgba(255,255,255,.06);color:rgba(255,255,255,.5)}'+
'video::cue{background:rgba(0,0,0,.75);color:#fff;font-size:1.2em;line-height:1.5;padding:.2em .6em;border-radius:.3em}'+
'.kk-genre-tags{display:flex;flex-wrap:wrap;gap:.5em;padding:0 0 .7em}'+
'.kk-genre-tag{padding:.5em .9em;border-radius:.7em;font-size:.9em;font-weight:700;cursor:pointer;border:1px solid rgba(1,180,228,.2);background:rgba(1,180,228,.08);color:#90cef4}'+
'.kk-genre-tag.focus{background:rgba(1,180,228,.25);color:#fff}'+
'.kk-genre-tag--active{background:rgba(1,180,228,.25);border-color:rgba(1,180,228,.5);color:#fff}'+
'.kk-tmdb-notice{padding:.8em 1em;border-radius:.8em;background:rgba(1,180,228,.1);border:1px solid rgba(1,180,228,.2);color:#90cef4;font-size:.95em;font-weight:700;margin:0 0 1em;text-align:center}'+
'.kk-src-badge{display:inline-block;padding:.3em .6em;border-radius:.4em;font-size:.8em;font-weight:800;margin-right:.4em}'+
'.kk-src-badge--kk{background:rgba(99,102,241,.2);color:#a78bfa}'+
'.kk-src-badge--op{background:rgba(74,222,128,.2);color:#4ade80}'+
'.selector,.kk-act,.kk-ep,.kk-row-more,.kk-loadmore,.kk-genre,.kk-card,.kk-btn,.kk-stg-item,.kk-srcbtn,.kk-genre-tag{touch-action:manipulation;-webkit-tap-highlight-color:transparent}'+
'@media(orientation:landscape){.kk-hero-bg{height:28em}.kk-hero-bottom{padding:1.5em 1.8em 1.3em}.kk-hero-flex{display:flex;align-items:flex-end;gap:1.3em}.kk-hero-poster{display:block;width:9.5em;min-width:9.5em}.kk-hero-poster img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:.95em}.kk-hero-info{flex:1;padding-bottom:.2em}.kk-logo{max-width:26em;margin-bottom:.95em}.kk-logo img{max-height:8em}.kk-title{font-size:2.7em}.kk-body{padding:1.3em 1.8em 0}.kk-section{padding:1.2em 1.8em 0}.kk-similar-list .kk-card{width:8.8em}}'+
'@media(max-width:768px){.kk-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:.75em}}'+
'</style>');
    }

    function addMenu(){
        function ins(){if($('.menu__item[data-action="kkphim"]').length)return;var m=$('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>');bindEnter(m,function(){Lampa.Activity.push({url:'',title:'KKPhim',component:'kkphim_main',page:1});});$('.menu .menu__list').first().append(m);}
        setTimeout(ins,500);Lampa.Listener.follow('app',function(e){if(e.type==='ready')setTimeout(ins,500);});
    }

    function startPlugin(){
        injectCSS();addMenu();

        // ========== SETTINGS ==========
        Lampa.Component.add('kkphim_settings',function(){
            var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
            this.create=function(){
                clearScroll(scroll);var s=loadSettings(),w=$('<div class="kk-stg-wrap"></div>');
                w.append('<div class="kk-stg-title">⚙️ Cài đặt</div>');
                var g0=$('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">📺 Nguồn phim</div>');
                var cur=s.source||'ophim';
                Object.keys(SOURCES).forEach(function(k){var src=SOURCES[k],it=si(src.name,src.api,cur===k?'✅':'Chọn');if(cur===k)it.find('.kk-stg-value').css('color','#4ade80');bindEnter(it,function(){saveSettings({source:k});Lampa.Noty.show(src.name);comp.create();});g0.append(it);});
                w.append(g0);
                var g1=$('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">🖥️ TorrServer</div>');
                var hi=si('Địa chỉ','192.168.1.100:8090',s.torrserver_host||'Chưa cài');bindEnter(hi,function(){pi('Địa chỉ TS',s.torrserver_host||'',function(v){v=(v||'').trim();saveSettings({torrserver_host:v});hi.find('.kk-stg-value').text(v||'Chưa cài');});});g1.append(hi);
                var pwi=si('Mật khẩu','',s.torrserver_password?'••••':'Không');bindEnter(pwi,function(){pi('Mật khẩu',s.torrserver_password||'',function(v){v=(v||'').trim();saveSettings({torrserver_password:v});pwi.find('.kk-stg-value').text(v?'••••':'Không');});});g1.append(pwi);
                w.append(g1);
                var g2=$('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">🧲 Stream</div>');
                var tii=si('🧲 Torrentio','manifest URL',s.torrentio_config?'✅ Có':'Mặc định');bindEnter(tii,function(){pi('Torrentio URL',s.torrentio_config||'',function(v){v=(v||'').trim();saveSettings({torrentio_config:v});tii.find('.kk-stg-value').text(v?'✅ Có':'Mặc định');});});g2.append(tii);
                var aii=si('🌊 Aiostreams','manifest URL',s.aio_config?'✅ Có':'Chưa có');bindEnter(aii,function(){pi('Aiostreams URL',s.aio_config||'',function(v){v=(v||'').trim();saveSettings({aio_config:v});aii.find('.kk-stg-value').text(v?'✅ Có':'Chưa có');});});g2.append(aii);
                w.append(g2);
                var g3=$('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">📝 Phụ đề</div>');
                var subdlItem=si('API Key','subdl.com',s.subdl_api_key?'✅':'❌');bindEnter(subdlItem,function(){pi('SubDL API Key',s.subdl_api_key||'',function(v){v=(v||'').trim();saveSettings({subdl_api_key:v});subdlItem.find('.kk-stg-value').text(v?'✅':'❌');});});g3.append(subdlItem);
                var subM=s.sub_mode||'ask';
                [{k:'ask',n:'Hỏi mỗi lần'},{k:'auto',n:'Tự động'},{k:'off',n:'Tắt'}].forEach(function(sm){var it=si(sm.n,'',subM===sm.k?'✅':'Chọn');if(subM===sm.k)it.find('.kk-stg-value').css('color','#4ade80');bindEnter(it,function(){saveSettings({sub_mode:sm.k});Lampa.Noty.show(sm.n);comp.create();});g3.append(it);});
                w.append(g3);
                var g4=$('<div class="kk-stg-group"></div>');
                var cl=si('🗑️ Xóa cài đặt','','Xóa');cl.find('.kk-stg-value').css('color','#f87171');bindEnter(cl,function(){localStorage.removeItem(SETTINGS_KEY);Lampa.Noty.show('Đã xóa');Lampa.Activity.backward();});g4.append(cl);
                w.append(g4);scroll.append(w);comp.start();
            };
            function si(n,d,v){return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">'+esc(n)+'</div>'+(d?'<div class="kk-stg-label-desc">'+esc(d)+'</div>':'')+'</div><div class="kk-stg-value">'+esc(v)+'</div></div>');}
            function pi(t,c,cb){try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:t,value:c||'',free:true,nosave:true},cb);return;}}catch(e){}var v=window.prompt(t,c||'');if(v!==null)cb(v);}
            this.start=function(){applyCtrl(scroll);enableScroll(scroll);};
            this.pause=function(){};this.stop=function(){};
            this.render=function(){return scroll.render();};
            this.destroy=function(){scroll.destroy();};
        });

        // ========== MAIN ==========
        Lampa.Component.add('kkphim_main',function(){
            var network=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,_src='',_tab='';
            var cats=[{name:'Phim Mới',api:'danh-sach/phim-moi-cap-nhat'},{name:'Phim Bộ',api:'v1/api/danh-sach/phim-bo'},{name:'Phim Lẻ',api:'v1/api/danh-sach/phim-le'},{name:'Hoạt Hình',api:'v1/api/danh-sach/hoat-hinh'},{name:'TV Shows',api:'v1/api/danh-sach/tv-shows'}];

            this.create=function(){
                network.clear();this.activity.loader(true);clearScroll(scroll);
                var src=getSource();_src=src.key;_tab=loadSettings()._main_tab||'source';
                var tb=$('<div class="kk-topbar"><div class="kk-topbar-title">'+esc(_tab==='tmdb'?'TMDB':src.name)+'</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');
                bindEnter($(tb.find('.kk-btn')[0]),openSearch);
                bindEnter($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'Cài đặt',component:'kkphim_settings'});});
                scroll.append(tb);
                var sb=$('<div class="kk-srcbar"></div>');
                Object.keys(SOURCES).forEach(function(k){var s=SOURCES[k],on=_tab==='source'&&k===src.key;var btn=$('<div class="kk-srcbtn selector '+(on?'kk-srcbtn--on':'kk-srcbtn--off')+'">'+esc(s.name)+'</div>');bindEnter(btn,function(){if(on)return;saveSettings({source:k,_main_tab:'source'});comp.create();});sb.append(btn);});
                var tmdbOn=_tab==='tmdb';var tmdbBtn=$('<div class="kk-srcbtn kk-srcbtn--tmdb selector '+(tmdbOn?'kk-srcbtn--on':'kk-srcbtn--off')+'">TMDB</div>');
                bindEnter(tmdbBtn,function(){if(tmdbOn)return;saveSettings({_main_tab:'tmdb'});comp.create();});sb.append(tmdbBtn);
                scroll.append(sb);
                var cfg=getStreamBase();var badges=[cfg.source==='aio'?'🌊 AIO':'🧲 TIO'];if(getTSHost())badges.push('🖥️ TS');
                scroll.append($('<div class="kk-tsbar"><div class="kk-tsbadge">'+badges.join(' · ')+'</div></div>'));
                if(_tab==='tmdb')buildTmdbHome();else buildSourceHome();
            };

            function buildSourceHome(){
                var loaded=0;
                cats.forEach(function(cat){
                    network.silent(SRC_API()+cat.api+'?page=1',function(res){
                        var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(norm).filter(function(i){return i&&i.slug;});
                        if(list.length){var row=$('<div class="kk-row"></div>');var more=$('<div class="kk-row-more selector">Xem thêm</div>');var rl=$('<div class="kk-row-list"></div>');bindEnter(more,function(){Lampa.Activity.push({url:'',title:cat.name,component:'kkphim_category',cat:cat,page_num:1});});list.slice(0,12).forEach(function(i){rl.append(mkCard(i));});row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+esc(cat.name)+'</div>').append(more)).append(rl);scroll.append(row);}
                        loaded++;if(loaded>=cats.length){comp.activity.loader(false);comp.start();}
                    },function(){loaded++;if(loaded>=cats.length){comp.activity.loader(false);comp.start();}});
                });
            }

            function buildTmdbHome(){
                var tmdbRows=[
                    {name:'🔥 Xu hướng phim',fn:function(){return tmdbTrending('movie',1);},type:'movie',lt:'trending'},
                    {name:'🔥 Xu hướng TV',fn:function(){return tmdbTrending('tv',1);},type:'tv',lt:'trending'},
                    {name:'⭐ Phim phổ biến',fn:function(){return tmdbPopular('movie',1);},type:'movie',lt:'popular'},
                    {name:'⭐ TV phổ biến',fn:function(){return tmdbPopular('tv',1);},type:'tv',lt:'popular'},
                    {name:'🏆 Phim đánh giá cao',fn:function(){return tmdbTopRated('movie',1);},type:'movie',lt:'top_rated'},
                    {name:'💥 Hành Động',fn:function(){return tmdbDiscoverByGenre('movie',28,1);},type:'movie',lt:'genre',gid:28},
                    {name:'👻 Kinh Dị',fn:function(){return tmdbDiscoverByGenre('movie',27,1);},type:'movie',lt:'genre',gid:27},
                    {name:'🚀 Khoa Học VT',fn:function(){return tmdbDiscoverByGenre('movie',878,1);},type:'movie',lt:'genre',gid:878},
                    {name:'😂 Hài',fn:function(){return tmdbDiscoverByGenre('movie',35,1);},type:'movie',lt:'genre',gid:35},
                    {name:'💕 Lãng Mạn',fn:function(){return tmdbDiscoverByGenre('movie',10749,1);},type:'movie',lt:'genre',gid:10749}
                ];
                var loaded=0;
                tmdbRows.forEach(function(row){
                    row.fn().then(function(res){
                        var list=(res.results||[]).filter(function(i){return i.poster_path;}).slice(0,12);
                        if(list.length){
                            var r=$('<div class="kk-row"></div>');var more=$('<div class="kk-row-more selector">Xem thêm</div>');var rl=$('<div class="kk-row-list"></div>');
                            bindEnter(more,function(){Lampa.Activity.push({url:'',title:row.name,component:'kkphim_tmdb_genre',tmdb_genre_id:row.gid||0,tmdb_media_type:row.type,tmdb_list_type:row.lt,page_num:1});});
                            list.forEach(function(item){item.media_type=item.media_type||row.type;rl.append(mkTmdbCard(item));});
                            r.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+esc(row.name)+'</div>').append(more)).append(rl);scroll.append(r);
                        }
                        loaded++;if(loaded>=tmdbRows.length){comp.activity.loader(false);comp.start();}
                    }).catch(function(){loaded++;if(loaded>=tmdbRows.length){comp.activity.loader(false);comp.start();}});
                });
            }

            this.start=function(){if(_src&&_tab!=='tmdb'&&_src!==getSourceKey()){comp.create();return;}applyCtrl(scroll);enableScroll(scroll);};
            this.pause=function(){};this.stop=function(){};
            this.render=function(){return scroll.render();};
            this.destroy=function(){network.clear();scroll.destroy();};
        });

        // ========== TMDB GENRE ==========
        Lampa.Component.add('kkphim_tmdb_genre',function(obj){
            var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
            var genreId=obj.tmdb_genre_id||0,mediaType=obj.tmdb_media_type||'movie',listType=obj.tmdb_list_type||'genre';
            var page=obj.page_num||1,title=obj.title||'';
            var grid=$('<div class="kk-grid"></div>'),lm=$('<div class="kk-loadmore selector">Tải thêm</div>'),loading=false,hasMore=true;
            this.create=function(){
                this.activity.loader(true);clearScroll(scroll);
                var allGenres=mediaType==='tv'?TMDB_TV_GENRES:TMDB_MOVIE_GENRES;
                var genreTags=$('<div class="kk-genre-tags"></div>');
                var movieTag=$('<div class="kk-genre-tag selector '+(mediaType==='movie'?'kk-genre-tag--active':'')+'">🎬 Phim</div>');
                var tvTag=$('<div class="kk-genre-tag selector '+(mediaType==='tv'?'kk-genre-tag--active':'')+'">📺 TV</div>');
                bindEnter(movieTag,function(){if(mediaType==='movie')return;Lampa.Activity.push({url:'',title:title,component:'kkphim_tmdb_genre',tmdb_genre_id:genreId,tmdb_media_type:'movie',tmdb_list_type:'genre',page_num:1});});
                bindEnter(tvTag,function(){if(mediaType==='tv')return;Lampa.Activity.push({url:'',title:title,component:'kkphim_tmdb_genre',tmdb_genre_id:genreId,tmdb_media_type:'tv',tmdb_list_type:'genre',page_num:1});});
                genreTags.append(movieTag).append(tvTag);
                if(listType==='genre'){allGenres.forEach(function(g){var active=g.id===genreId;var tag=$('<div class="kk-genre-tag selector '+(active?'kk-genre-tag--active':'')+'">'+esc(g.name)+'</div>');bindEnter(tag,function(){if(active)return;Lampa.Activity.push({url:'',title:g.name,component:'kkphim_tmdb_genre',tmdb_genre_id:g.id,tmdb_media_type:mediaType,tmdb_list_type:'genre',page_num:1});});genreTags.append(tag);});}
                scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+esc(title)+'</div>').append(genreTags).append(grid).append(lm));
                bindEnter(lm,function(){if(!loading&&hasMore)doLoad();});doLoad();
            };
            function doLoad(){
                loading=true;lm.text('Đang tải...');
                var p;
                if(listType==='trending')p=tmdbTrending(mediaType,page);
                else if(listType==='top_rated')p=tmdbTopRated(mediaType,page);
                else if(listType==='popular')p=tmdbPopular(mediaType,page);
                else p=tmdbDiscoverByGenre(mediaType,genreId,page);
                p.then(function(res){
                    var list=(res.results||[]).filter(function(i){return i.poster_path;});
                    if(!list.length){hasMore=false;lm.text('Hết');comp.activity.loader(false);loading=false;comp.start();return;}
                    if(page>=(res.total_pages||500))hasMore=false;
                    list.forEach(function(item){item.media_type=item.media_type||mediaType;grid.append(mkTmdbCard(item).addClass('kk-card--grid'));});
                    page++;loading=false;lm.text(hasMore?'Tải thêm':'Hết');comp.activity.loader(false);comp.start();
                }).catch(function(){loading=false;lm.text('Lỗi');comp.activity.loader(false);});
            }
            this.start=function(){applyCtrl(scroll);enableScroll(scroll);};
            this.pause=function(){};this.stop=function(){};
            this.render=function(){return scroll.render();};
            this.destroy=function(){scroll.destroy();};
        });

        // ========== CATEGORY ==========
        Lampa.Component.add('kkphim_category',function(obj){
            var network=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
            var page=obj.page_num||1,title=obj.title||(obj.cat&&obj.cat.name)||'',catSlug=obj.category_slug||'';
            var apiPath=obj.cat?obj.cat.api:null;
            var grid=$('<div class="kk-grid"></div>'),lm=$('<div class="kk-loadmore selector">Tải thêm</div>'),loading=false,hasMore=true;
            this.create=function(){this.activity.loader(true);clearScroll(scroll);scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+esc(title)+'</div>').append(grid).append(lm));bindEnter(lm,function(){if(!loading&&hasMore)doLoad();});doLoad();};
            function hr(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(norm).filter(function(i){return i&&i.slug;});if(!list.length){hasMore=false;lm.text('Hết');comp.activity.loader(false);loading=false;comp.start();return;}list.forEach(function(i){grid.append(mkCard(i).addClass('kk-card--grid'));});page++;loading=false;lm.text('Tải thêm');comp.activity.loader(false);comp.start();}
            function doLoad(){loading=true;lm.text('Đang tải...');var url=catSlug?SRC_API()+'v1/api/the-loai/'+catSlug+'?page='+page:SRC_API()+apiPath+'?page='+page;network.silent(url,hr,function(){loading=false;lm.text('Lỗi');comp.activity.loader(false);});}
            this.start=function(){applyCtrl(scroll);enableScroll(scroll);};
            this.pause=function(){};this.stop=function(){};
            this.render=function(){return scroll.render();};
            this.destroy=function(){network.clear();scroll.destroy();};
        });

        // ========== SEARCH ==========
        Lampa.Component.add('kkphim_search',function(obj){
            var network=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
            var kw=obj.keyword||'',page=obj.page_num||1;
            var grid=$('<div class="kk-grid"></div>'),lm=$('<div class="kk-loadmore selector">Tải thêm</div>'),loading=false,hasMore=true;
            var tmdbDone=false;
            this.create=function(){this.activity.loader(true);clearScroll(scroll);scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">🔍 '+esc(kw)+'</div>').append(grid).append(lm));bindEnter(lm,function(){if(!loading&&hasMore)doLoad();});doLoad();};
            function addTmdb(){
                if(tmdbDone)return;tmdbDone=true;
                tmdbSearchMulti(kw,1).then(function(res){
                    var list=(res.results||[]).filter(function(i){return(i.media_type==='movie'||i.media_type==='tv')&&i.poster_path;});
                    if(!list.length)return;
                    var sec=$('<div style="padding:0 1.5em;margin-top:1.5em"></div>');
                    sec.append($('<div class="kk-tmdb-notice">📡 Không tìm thấy trên '+esc(getSource().name)+'. Kết quả từ TMDB:</div>'));
                    var g2=$('<div class="kk-grid"></div>');list.forEach(function(item){g2.append(mkTmdbCard(item).addClass('kk-card--grid'));});
                    sec.append(g2);scroll.append(sec);comp.start();
                }).catch(function(){});
            }
            function hr(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(norm).filter(function(i){return i&&i.slug;});if(!list.length){hasMore=false;lm.text(page===1?'Không có':'Hết');if(page===1)addTmdb();comp.activity.loader(false);loading=false;comp.start();return;}list.forEach(function(i){grid.append(mkCard(i).addClass('kk-card--grid'));});page++;loading=false;lm.text('Tải thêm');comp.activity.loader(false);comp.start();}
            function doLoad(){loading=true;lm.text('Đang tải...');network.silent(SRC_API()+'v1/api/tim-kiem?keyword='+encodeURIComponent(kw)+'&page='+page,hr,function(){loading=false;lm.text('Lỗi');comp.activity.loader(false);if(page===1)addTmdb();});}
            this.start=function(){applyCtrl(scroll);enableScroll(scroll);};
            this.pause=function(){};this.stop=function(){};
            this.render=function(){return scroll.render();};
            this.destroy=function(){network.clear();scroll.destroy();};
        });

        // ========== DETAIL (kkphim/ophim) ==========
        Lampa.Component.add('kkphim_detail',function(obj){
            var network=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true});
            var movie=norm(obj.movie),comp=this,rendered=false,_tmdb=null;
            this.create=function(){
                this.activity.loader(true);clearScroll(scroll);rendered=false;
                if(!movie||!movie.slug){this.activity.loader(false);scroll.append($('<div class="empty__body"><div class="empty__title">Không có dữ liệu</div></div>'));comp.start();return;}
                network.silent(SRC_API()+'phim/'+movie.slug,function(res){if(rendered)return;loadAll(norm(res.movie||res||{}),res.episodes||[]);},function(){comp.activity.loader(false);Lampa.Noty.show('Lỗi');});
            };
            async function loadAll(data,episodes){
                if(!data||!data.slug)data=movie;
                try{var tid=getTmdbId(data),tt=detectType(data),tmdb=null,logos=null;
                if(!tid){var tr=await searchTmdbByName(data.name,data.origin_name,data.year,tt);if(tr){tid=tr.id;if(!data.tmdb)data.tmdb={};data.tmdb.id=tid;data.tmdb.type=tr.media_type||tt;}}
                if(tid){try{tmdb=await tmdbFetch('/'+tt+'/'+tid+'?language=vi-VN&append_to_response=credits,images');}catch(e){try{tmdb=await tmdbFetch('/'+tt+'/'+tid+'?language=en-US&append_to_response=credits,images');}catch(e2){}}try{logos=await tmdbFetch('/'+tt+'/'+tid+'/images');}catch(e3){}}
                _tmdb=tmdb;if(!rendered){build(data,episodes,tmdb,logos,tt);rendered=true;}}catch(e){if(!rendered){build(data,episodes,null,null,detectType(data));rendered=true;}}
                comp.activity.loader(false);comp.start();
            }
            function build(data,episodes,tmdb,logos,ttype){
                clearScroll(scroll);if(!Array.isArray(data.category))data.category=[];
                var bk=fullImg(data.thumb_url||data.poster_url),ps=fullImg(data.poster_url||data.thumb_url);
                var t=data.name||'',o=data.origin_name||'',d=cleanDesc(data.content);
                var v=(data.tmdb&&data.tmdb.vote_average)||'N/A',y=data.year||'',rt=data.time||'',epCur=data.episode_current||'';
                var ghtml='',castH='',dirH='',crewH='',logoH='',dir='';
                if(tmdb){if(tmdb.backdrop_path)bk=TMDB_IMG+tmdb.backdrop_path;if(tmdb.poster_path)ps=TMDB_IMG+tmdb.poster_path;if(tmdb.title||tmdb.name)t=tmdb.title||tmdb.name;if(tmdb.original_title||tmdb.original_name)o=tmdb.original_title||tmdb.original_name;if(tmdb.overview)d=tmdb.overview;if(tmdb.vote_average)v=Number(tmdb.vote_average).toFixed(1);if(tmdb.release_date)y=tmdb.release_date.slice(0,4);if(!y&&tmdb.first_air_date)y=tmdb.first_air_date.slice(0,4);if(tmdb.runtime)rt=tmdb.runtime+' phút';var logo=pickLogo(logos||tmdb.images);if(logo&&logo.file_path)logoH='<div class="kk-logo"><img src="'+TMDB_IMG_W500+logo.file_path+'"></div>';if(tmdb.credits){castH=mkPeople((tmdb.credits.cast||[]).slice(0,12),'character');var dirs=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator';}).filter(function(p,i,a){return a.findIndex(function(x){return x.name===p.name;})===i;}).slice(0,6);if(dirs.length){dir=dirs.map(function(c){return c.name;}).join(', ');dirH=mkPeople(dirs.map(function(c){return{name:c.name,profile_path:c.profile_path,job:c.job||'Đạo diễn'};}), 'job');}}}
                if(data.category&&data.category.length)ghtml=data.category.map(function(g){if(!g)return '';return '<span class="kk-genre selector" data-slug="'+esc(g.slug||'')+'" data-title="'+esc(g.name||'')+'">'+esc(g.name||'')+'</span>';}).join('');
                else if(tmdb&&tmdb.genres)ghtml=tmdb.genres.map(function(g){return '<span class="kk-genre">'+esc(g.name||'')+'</span>';}).join('');
                if(data.director&&!dir)dir=Array.isArray(data.director)?data.director.join(', '):String(data.director||'');
                if(dir&&!dirH)crewH='<div class="kk-crew"><b>Đạo diễn</b><span>'+esc(dir)+'</span></div>';
                var tH=logoH?'':'<div class="kk-title">'+esc(t)+'</div>';var hasTmdb=!!getTmdbId(data);
                var cfg=getStreamBase();var streamLbl=cfg.source==='aio'?'🌊 Stream (AIO)':'🧲 Stream';if(getTSHost())streamLbl+=' → TS';
                var hero=$('<div class="kk-hero"><div class="kk-hero-bg"><img src="'+bk+'"><div class="kk-hero-mask"></div></div><div class="kk-hero-bottom"><div class="kk-hero-flex"><div class="kk-hero-poster"><img src="'+ps+'"></div><div class="kk-hero-info">'+logoH+tH+'<div class="kk-origin">'+esc(o)+'</div></div></div></div></div>');
                var body=$('<div class="kk-body"><div class="kk-metas"><span class="kk-meta">⭐ '+esc(v)+'</span>'+(y?'<span class="kk-meta">📅 '+esc(y)+'</span>':'')+(rt?'<span class="kk-meta">⏱ '+esc(rt)+'</span>':'')+(epCur?'<span class="kk-meta">🎬 '+esc(epCur)+'</span>':'')+'</div><div class="kk-genres">'+ghtml+'</div>'+crewH+'<div class="kk-desc">'+fmtTxt(d)+'</div><div class="kk-actions"><div class="kk-act-wrap"><div class="kk-act kk-act--play selector">▶ Xem phim</div></div>'+(hasTmdb?'<div class="kk-act-wrap"><div class="kk-act kk-act--stream selector">'+esc(streamLbl)+'</div></div>':'')+'<div class="kk-act-wrap"><div class="kk-act kk-act--sub selector">📝 Phụ đề</div></div><div class="kk-act-wrap"><div class="kk-act kk-act--copy selector">🔍 Copy tên</div></div></div></div>');
                bindEnter(body.find('.kk-act--play'),function(){var f=getFirstEp(episodes);if(!f){Lampa.Noty.show('Không có tập');return;}var link=f.link_m3u8||f.link_embed||'';if(!link){Lampa.Noty.show('Không có link');return;}var epNum=parseInt((f.name||'').replace(/[^\d]/g,''))||null;playUrlWithSub(link,(data.name||'')+' - '+(f.name||''),data,ttype,ttype==='tv'?1:null,epNum,_tmdb);});
                if(hasTmdb)bindEnter(body.find('.kk-act--stream'),function(){openStreamSearch(getTmdbId(data),ttype,data,episodes,ps,_tmdb);});
                bindEnter(body.find('.kk-act--sub'),async function(){var tmdbId=getTmdbId(data),imdb=null;if(tmdbId)try{imdb=await getImdbId(ttype,tmdbId);}catch(e){}var en=_tmdb?(_tmdb.original_title||_tmdb.original_name||_tmdb.title||_tmdb.name||''):(data.origin_name||data.name||'');Lampa.Noty.show('Tìm sub...');var subs=await searchSubs(imdb,tmdbId,ttype,null,null,en);if(!subs.length){Lampa.Noty.show(getSubdlKey()?'Không có':'Cần key');return;}Lampa.Select.show({title:'📝 ('+subs.length+')',items:subs.slice(0,40).map(function(s){return{title:s.label,value:s};}),onSelect:function(a){Lampa.Noty.show('✅ '+a.value.label);Lampa.Controller.toggle('content');},onBack:function(){Lampa.Controller.toggle('content');}});});
                bindEnter(body.find('.kk-act--copy'),function(){showCopyName(data,_tmdb);});
                body.find('.kk-genre[data-slug]').each(function(){var g=$(this);bindEnter(g,function(){var slug=g.attr('data-slug');if(slug)Lampa.Activity.push({url:'',title:g.attr('data-title')||'',component:'kkphim_category',mode:'category',category_slug:slug,page_num:1});});});
                var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);
                if(dirH)dw.append($('<div class="kk-section"><div class="kk-block-title">Đạo diễn</div><div class="kk-cast-list">'+dirH+'</div></div>'));
                if(castH)dw.append($('<div class="kk-section"><div class="kk-block-title">Diễn viên</div><div class="kk-cast-list">'+castH+'</div></div>'));
                if(episodes&&episodes.length){var ew=$('<div class="kk-section"></div>').append('<div class="kk-block-title">Danh sách tập</div>');episodes.forEach(function(sv){ew.append('<div class="kk-server">'+esc(sv.server_name||'')+'</div>');var g=$('<div class="kk-eps"></div>');(sv.server_data||[]).forEach(function(ep){var b=$('<div class="kk-ep selector">'+esc(ep.name||'')+'</div>');bindEnter(b,function(){var link=ep.link_m3u8||ep.link_embed||'';if(!link){Lampa.Noty.show('Không có link');return;}var epNum=parseInt((ep.name||'').replace(/[^\d]/g,''))||null;playUrlWithSub(link,(data.name||'')+' - '+(ep.name||''),data,ttype,ttype==='tv'?1:null,epNum,_tmdb);});g.append(b);});ew.append(g);});dw.append(ew);}
                scroll.append(dw);
                var cats2=data.category||[];
                if(cats2.length&&cats2[0]&&cats2[0].slug){network.silent(SRC_API()+'v1/api/the-loai/'+cats2[0].slug+'?page=1',function(r){var list=((r&&r.items)||(r&&r.data&&r.data.items)||[]).map(norm).filter(function(i){return i&&i.slug&&i.slug!==movie.slug;}).slice(0,12);if(list.length){var row=$('<div class="kk-section kk-section--last kk-similar"></div>').append('<div class="kk-block-title">Phim liên quan</div>');var rl=$('<div class="kk-similar-list"></div>');list.forEach(function(i){rl.append(mkCard(i));});row.append(rl);dw.append(row);}else dw.append($('<div class="kk-section kk-section--last"></div>'));},function(){dw.append($('<div class="kk-section kk-section--last"></div>'));});}else dw.append($('<div class="kk-section kk-section--last"></div>'));
            }
            this.start=function(){applyCtrl(scroll);enableScroll(scroll);};
            this.pause=function(){};this.stop=function(){};
            this.render=function(){return scroll.render();};
            this.destroy=function(){network.clear();scroll.destroy();};
        });

        // ========== DETAIL TMDB ==========
        Lampa.Component.add('kkphim_detail_tmdb',function(obj){
            var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,_tmdb=null;
            var tmdbId=obj.tmdb_id,ttype=obj.tmdb_type||'movie';

            this.create=function(){
                this.activity.loader(true);clearScroll(scroll);
                if(!tmdbId){this.activity.loader(false);scroll.append($('<div class="empty__body"><div class="empty__title">Không có dữ liệu</div></div>'));comp.start();return;}
                doLoad();
            };

            async function doLoad(){
                var tmdb=null,logos=null;
                try{try{tmdb=await tmdbFetch('/'+ttype+'/'+tmdbId+'?language=vi-VN&append_to_response=credits,images,similar,recommendations');}catch(e){try{tmdb=await tmdbFetch('/'+ttype+'/'+tmdbId+'?language=en-US&append_to_response=credits,images,similar,recommendations');}catch(e2){}}}catch(e){}
                try{logos=await tmdbFetch('/'+ttype+'/'+tmdbId+'/images');}catch(e){}
                _tmdb=tmdb;

                var nameVi=tmdb?(tmdb.title||tmdb.name||''):'';
                var nameEn=tmdb?(tmdb.original_title||tmdb.original_name||''):'';
                if(!nameEn)nameEn=nameVi;

                // Find on both sources in parallel
                var allSources=await findAllSources(tmdbId,ttype,nameVi,nameEn);

                buildPage(tmdb,logos,allSources);
                comp.activity.loader(false);comp.start();
            }

            function buildPage(tmdb,logos,allSources){
                clearScroll(scroll);
                var bk='',ps='',t='',o='',d='Không có mô tả',v='N/A',y='',rt='';
                var ghtml='',castH='',dirH='',crewH='',logoH='',dir='';

                if(tmdb){
                    if(tmdb.backdrop_path)bk=TMDB_IMG+tmdb.backdrop_path;
                    if(tmdb.poster_path)ps=TMDB_IMG+tmdb.poster_path;
                    t=tmdb.title||tmdb.name||'';o=tmdb.original_title||tmdb.original_name||'';
                    if(tmdb.overview)d=tmdb.overview;
                    if(tmdb.vote_average)v=Number(tmdb.vote_average).toFixed(1);
                    if(tmdb.release_date)y=tmdb.release_date.slice(0,4);
                    if(!y&&tmdb.first_air_date)y=tmdb.first_air_date.slice(0,4);
                    if(tmdb.runtime)rt=tmdb.runtime+' phút';
                    if(tmdb.number_of_seasons)rt=(rt?rt+' · ':'')+tmdb.number_of_seasons+' mùa';
                    var logo=pickLogo(logos||tmdb.images);if(logo&&logo.file_path)logoH='<div class="kk-logo"><img src="'+TMDB_IMG_W500+logo.file_path+'"></div>';
                    // Genres from TMDB - clickable
                    if(tmdb.genres&&tmdb.genres.length)ghtml=tmdb.genres.map(function(g){return '<span class="kk-genre selector" data-tmdb-gid="'+g.id+'">'+esc(g.name||'')+'</span>';}).join('');
                    if(tmdb.credits){castH=mkPeople((tmdb.credits.cast||[]).slice(0,12),'character');var dirs=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator';}).filter(function(p,i,a){return a.findIndex(function(x){return x.name===p.name;})===i;}).slice(0,6);if(dirs.length){dir=dirs.map(function(c){return c.name;}).join(', ');dirH=mkPeople(dirs.map(function(c){return{name:c.name,profile_path:c.profile_path,job:c.job||'Đạo diễn'};}), 'job');}}
                }
                if(dir&&!dirH)crewH='<div class="kk-crew"><b>Đạo diễn</b><span>'+esc(dir)+'</span></div>';
                var tH=logoH?'':'<div class="kk-title">'+esc(t)+'</div>';
                var movieData={name:t,origin_name:o,slug:'',poster_url:ps,thumb_url:bk,year:y,tmdb:{id:tmdbId,type:ttype,vote_average:v},category:[],content:d,type:ttype==='tv'?'series':'single'};
                var cfg=getStreamBase();var streamLbl=cfg.source==='aio'?'🌊 Stream (AIO)':'🧲 Stream';if(getTSHost())streamLbl+=' → TS';
                var hasSource=allSources.length>0;

                var hero=$('<div class="kk-hero"><div class="kk-hero-bg"><img src="'+bk+'"><div class="kk-hero-mask"></div></div><div class="kk-hero-bottom"><div class="kk-hero-flex"><div class="kk-hero-poster"><img src="'+ps+'"></div><div class="kk-hero-info">'+logoH+tH+'<div class="kk-origin">'+esc(o)+'</div></div></div></div></div>');

                var actionsHtml='<div class="kk-actions">';
                actionsHtml+='<div class="kk-act-wrap"><div class="kk-act kk-act--stream selector">'+esc(streamLbl)+'</div></div>';
                actionsHtml+='<div class="kk-act-wrap"><div class="kk-act kk-act--sub selector">📝 Phụ đề</div></div>';
                actionsHtml+='<div class="kk-act-wrap"><div class="kk-act kk-act--copy selector">🔍 Copy tên</div></div>';
                actionsHtml+='</div>';

                var noticeHtml=hasSource?'':'<div class="kk-tmdb-notice">📡 Không tìm thấy trên KKPhim/OPhim. Chỉ hỗ trợ Torrent.</div>';

                var body=$('<div class="kk-body">'+
                    '<div class="kk-metas"><span class="kk-meta">⭐ '+esc(v)+'</span>'+(y?'<span class="kk-meta">📅 '+esc(y)+'</span>':'')+(rt?'<span class="kk-meta">⏱ '+esc(rt)+'</span>':'')+'</div>'+
                    '<div class="kk-genres">'+ghtml+'</div>'+crewH+
                    '<div class="kk-desc">'+fmtTxt(d)+'</div>'+noticeHtml+actionsHtml+'</div>');

                // Stream button
                bindEnter(body.find('.kk-act--stream'),function(){openStreamSearch(tmdbId,ttype,movieData,null,ps,_tmdb);});
                // Sub button
                bindEnter(body.find('.kk-act--sub'),async function(){var imdb=null;try{imdb=await getImdbId(ttype,tmdbId);}catch(e){}var en=_tmdb?(_tmdb.original_title||_tmdb.original_name||_tmdb.title||_tmdb.name||''):o;Lampa.Noty.show('Tìm sub...');var subs=await searchSubs(imdb,tmdbId,ttype,null,null,en);if(!subs.length){Lampa.Noty.show(getSubdlKey()?'Không có':'Cần key');return;}Lampa.Select.show({title:'📝 ('+subs.length+')',items:subs.slice(0,40).map(function(s){return{title:s.label,value:s};}),onSelect:function(a){Lampa.Noty.show('✅ '+a.value.label);Lampa.Controller.toggle('content');},onBack:function(){Lampa.Controller.toggle('content');}});});
                // Copy button
                bindEnter(body.find('.kk-act--copy'),function(){showCopyName(movieData,_tmdb);});
                // Genre click → TMDB genre page
                body.find('.kk-genre[data-tmdb-gid]').each(function(){var g=$(this);bindEnter(g,function(){var gid=parseInt(g.attr('data-tmdb-gid'));if(gid)Lampa.Activity.push({url:'',title:g.text(),component:'kkphim_tmdb_genre',tmdb_genre_id:gid,tmdb_media_type:ttype,tmdb_list_type:'genre',page_num:1});});});

                var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);
                if(dirH)dw.append($('<div class="kk-section"><div class="kk-block-title">Đạo diễn</div><div class="kk-cast-list">'+dirH+'</div></div>'));
                if(castH)dw.append($('<div class="kk-section"><div class="kk-block-title">Diễn viên</div><div class="kk-cast-list">'+castH+'</div></div>'));

                // Episodes from kkphim/ophim sources
                if(allSources.length){
                    var ew=$('<div class="kk-section"></div>').append('<div class="kk-block-title">Danh sách tập</div>');
                    allSources.forEach(function(src){
                        var badgeClass=src.source==='kkphim'?'kk-src-badge--kk':'kk-src-badge--op';
                        src.episodes.forEach(function(sv){
                            ew.append('<div class="kk-server"><span class="kk-src-badge '+badgeClass+'">'+esc(src.sourceName)+'</span>'+esc(sv.server_name||'')+'</div>');
                            var g=$('<div class="kk-eps"></div>');
                            (sv.server_data||[]).forEach(function(ep){
                                var b=$('<div class="kk-ep selector">'+esc(ep.name||'')+'</div>');
                                bindEnter(b,function(){
                                    var link=ep.link_m3u8||ep.link_embed||'';
                                    if(!link){Lampa.Noty.show('Không có link');return;}
                                    var epNum=parseInt((ep.name||'').replace(/[^\d]/g,''))||null;
                                    playUrlWithSub(link,(t||'')+' - '+(ep.name||''),movieData,ttype,ttype==='tv'?1:null,epNum,_tmdb);
                                });
                                g.append(b);
                            });
                            ew.append(g);
                        });
                    });
                    dw.append(ew);
                }

                // Similar from TMDB
                var similar=[];
                if(tmdb&&tmdb.recommendations&&tmdb.recommendations.results)similar=tmdb.recommendations.results;
                if(!similar.length&&tmdb&&tmdb.similar&&tmdb.similar.results)similar=tmdb.similar.results;
                similar=similar.filter(function(i){return i.poster_path;}).slice(0,12);
                if(similar.length){
                    var simSection=$('<div class="kk-section kk-section--last kk-similar"></div>').append('<div class="kk-block-title">Phim tương tự</div>');
                    var simList=$('<div class="kk-similar-list"></div>');
                    similar.forEach(function(item){item.media_type=item.media_type||ttype;simList.append(mkTmdbCard(item));});
                    simSection.append(simList);dw.append(simSection);
                }else{dw.append($('<div class="kk-section kk-section--last"></div>'));}

                scroll.append(dw);
            }

            this.start=function(){applyCtrl(scroll);enableScroll(scroll);};
            this.pause=function(){};this.stop=function(){};
            this.render=function(){return scroll.render();};
            this.destroy=function(){scroll.destroy();};
        });
    }

    if(window.appready)startPlugin();
    else Lampa.Listener.follow('app',function(e){if(e.type==='ready')startPlugin();});
})();