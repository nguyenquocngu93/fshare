/* KKPhim Plugin v4.0 - Compact */
(function(){
'use strict';
if(window.__kkp)return;window.__kkp=true;

var S={
    kk:{n:'KKPhim',a:'https://phimapi.com/',i:'https://phimimg.com/'},
    op:{n:'OPhim',a:'https://ophim1.com/',i:'https://img.ophim.live/uploads/movies/'}
};
var TK='eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
var TI='https://image.tmdb.org/t/p/',TIO='https://torrentio.strem.fun',SK='kkphim_stg',HK='kkphim_hist',CU='https://nguyenquocngu93.github.io/fshare/style.css';
var _gc={};

// ── Settings ──
function ls(){try{return JSON.parse(localStorage.getItem(SK))||{};}catch(e){return{};}}
function ss(o){try{var c=ls();for(var k in o)c[k]=o[k];localStorage.setItem(SK,JSON.stringify(c));}catch(e){}}
function g(k,d){return ls()[k]||d;}
function srcOn(k){var v=ls()['s_'+k];return v===undefined?true:!!v;}
function eSrc(){var r={};for(var k in S)if(srcOn(k))r[k]=S[k];return r;}

// ── History ──
function gH(){try{return JSON.parse(localStorage.getItem(HK))||[];}catch(e){return[];}}
function sH(item){
    if(!item||!item.tmdb_id)return;
    var a=gH(),id='t_'+item.tmdb_id+'_'+item.mt;
    a=a.filter(function(x){return x.id!==id;});
    a.unshift({id:id,tmdb_id:item.tmdb_id,mt:item.mt,name:item.name||'',poster:item.poster||'',year:item.year||'',time:Date.now()});
    if(a.length>50)a.length=50;
    try{localStorage.setItem(HK,JSON.stringify(a));}catch(e){}
}

// ── Utils ──
var E=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
var W5=TI+'w500',OI=TI+'original';
function ns(s){return String(s||'').toLowerCase().trim().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'').replace(/\s+/g,' ');}
function pd(n){return(n<10?'0':'')+n;}
function fI(u,s){if(!u)return'';if(u.indexOf('http')===0)return u;return(s?s.i:S.kk.i)+u;}
function ft(s){return E(s||'').replace(/\n/g,'<br>');}

function bE(el,fn){
    var sx=0,sy=0,mv=false,tc=false;
    el.on('touchstart',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;mv=false;}});
    el.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))mv=true;});
    el.on('touchend',function(e){if(mv)return;tc=true;e.preventDefault();e.stopPropagation();setTimeout(function(){fn.call(el[0],e);},100);setTimeout(function(){tc=false;},350);});
    el.on('click',function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();fn.call(this,e);});
    el.on('hover:enter',function(e){fn.call(this,e);});
}
function eSc(sc){var el=sc.render();el.css({overflow:'hidden',position:'relative',height:'100%'});var b=el.find('.scroll__body'),p={'transform':'none','overflow-y':'auto','overflow-x':'hidden','-webkit-overflow-scrolling':'touch',height:'100%','padding-bottom':'8em','touch-action':'pan-y'};b.css($.extend({position:'relative'},p));if(b[0])for(var k in p)b[0].style.setProperty(k,p[k],'important');}
function cS(sc){try{sc.render().find('.scroll__body').empty();}catch(e){}}
function aC(sc){
    Lampa.Controller.add('content',{
        toggle:function(){Lampa.Controller.collectionSet(sc.render());Lampa.Controller.collectionFocus(false,sc.render());},
        left:function(){if(Navigator.canmove('left'))Navigator.move('left');else Lampa.Controller.toggle('menu');},
        right:function(){Navigator.move('right');},up:function(){if(Navigator.canmove('up'))Navigator.move('up');else Lampa.Controller.toggle('head');},
        down:function(){Navigator.move('down');},back:function(){Lampa.Activity.backward();}
    });
    setTimeout(function(){Lampa.Controller.toggle('content');Lampa.Controller.collectionSet(sc.render());Lampa.Controller.collectionFocus(false,sc.render());},0);
}

// ── TMDB API ──
async function tF(p){var r=await fetch('https://api.themoviedb.org/3'+p,{headers:{Authorization:'Bearer '+TK,'Content-Type':'application/json'}});if(!r.ok)throw new Error('TMDB '+r.status);return r.json();}
var lang=function(){return g('lang','vi-VN');};
async function gImdb(t,id){if(!id)return null;try{return(await tF('/'+t+'/'+id+'/external_ids')).imdb_id||null;}catch(e){return null;}}
async function gSn(id){try{var r=await tF('/tv/'+id+'?language='+lang());return(r.seasons||[]).filter(function(s){return s.season_number>0;}).map(function(s){return{sn:s.season_number,name:s.name||'Season '+s.season_number,ec:s.episode_count||0};});}catch(e){return[];}}
async function tPC(pid){try{return await tF('/person/'+pid+'/combined_credits?language='+lang());}catch(e){return null;}}

var TFN={
    td:function(p){return tF('/trending/all/day?language='+lang()+'&page='+p);},
    tw:function(p){return tF('/trending/all/week?language='+lang()+'&page='+p);},
    pm:function(p){return tF('/movie/popular?language='+lang()+'&page='+p);},
    pt:function(p){return tF('/tv/popular?language='+lang()+'&page='+p);},
    tm:function(p){return tF('/movie/top_rated?language='+lang()+'&page='+p);},
    tt:function(p){return tF('/tv/top_rated?language='+lang()+'&page='+p);},
    np:function(p){return tF('/movie/now_playing?language='+lang()+'&page='+p);},
    uc:function(p){return tF('/movie/upcoming?language='+lang()+'&page='+p);},
    oa:function(p){return tF('/tv/on_the_air?language='+lang()+'&page='+p);}
};
async function tSM(q,p){return tF('/search/multi?language='+lang()+'&query='+encodeURIComponent(q)+'&page='+(p||1));}
async function tDF(t,id){return tF('/'+t+'/'+id+'?language='+lang()+'&append_to_response=credits,images,similar,external_ids');}
async function tIG(t,id){return tF('/'+t+'/'+id+'/images');}
async function tDis(t,gid,p){return tF('/discover/'+t+'?language='+lang()+'&sort_by=popularity.desc&with_genres='+gid+'&page='+(p||1));}
async function tSim(t,id,p){return tF('/'+t+'/'+id+'/similar?language='+lang()+'&page='+(p||1));}
async function tRec(t,id,p){return tF('/'+t+'/'+id+'/recommendations?language='+lang()+'&page='+(p||1));}
async function tRnd(t){return tF('/'+t+'/popular?language='+lang()+'&page='+(Math.floor(Math.random()*10)+1));}

function tN(i){if(!i)return null;var mt=i.media_type||(i.first_air_date?'tv':'movie');return{tmdb_id:i.id,mt:mt,name:i.title||i.name||'',orig:i.original_title||i.original_name||'',poster:i.poster_path?W5+i.poster_path:'',bk:i.backdrop_path?W5+i.backdrop_path:'',year:(i.release_date||i.first_air_date||'').slice(0,4),vote:i.vote_average?Number(i.vote_average).toFixed(1):''};}

// ── Source search ──
async function sS(src,kw){try{var r=await fetch(src.a+'v1/api/tim-kiem?keyword='+encodeURIComponent(kw)+'&page=1');if(!r.ok)return[];var d=await r.json();return(d&&d.data&&d.data.items)||(d&&d.items)||[];}catch(e){return[];}}
function mSc(it,t,o,y){
    var sc=0,nT=ns(t),nO=ns(o),n1=ns(it.name||it.title||''),n2=ns(it.origin_name||it.original_name||'');
    if(nT&&(n1===nT||n2===nT))sc+=100;else if(nO&&(n1===nO||n2===nO))sc+=100;
    else if(nT&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1))sc+=50;
    else if(nO&&(n2.indexOf(nO)>-1||nO.indexOf(n2)>-1))sc+=50;
    if(y&&it.year&&parseInt(it.year)===parseInt(y))sc+=30;
    else if(y&&it.year&&Math.abs(parseInt(it.year)-parseInt(y))<=1)sc+=15;
    return sc;
}
function mB(items,t,o,y){
    if(!items||!items.length)return null;
    var best=null,bs=0;
    for(var i=0;i<items.length;i++){var sc=mSc(items[i],t,o,y);if(sc>bs){bs=sc;best=items[i];}}
    return bs>0?best:null;
}
async function fSl(t,o,y){
    var r={},es=eSrc(),terms=[t];
    if(o&&o!==t)terms.push(o);
    if(y){terms.push(t+' '+y);if(o&&o!==t)terms.push(o+' '+y);}
    var ct=t.replace(/[:\-–—]/g,' ').trim();if(ct!==t)terms.push(ct);
    for(var i=0;i<terms.length;i++){
        for(var k in es){if(!r[k]){var f=mB(await sS(es[k],terms[i]),t,o,y);if(f&&f.slug)r[k]=f.slug;}}
        var done=true;for(var k2 in es)if(!r[k2])done=false;
        if(done)break;
    }
    return r;
}
async function fDt(src,slug){try{var r=await fetch(src.a+'phim/'+slug);if(!r.ok)return null;var d=await r.json();return{movie:d.movie||d||{},episodes:d.episodes||[]};}catch(e){return null;}}
function exSn(n,s){var ps=[/season\s*(\d+)/i,/ph[aầ]n\s*(\d+)/i,/m[uù]a\s*(\d+)/i,/s(\d+)(?:\s|$|e)/i,/-season-(\d+)/i,/-phan-(\d+)/i];for(var i=0;i<ps.length;i++){var m=(n+' '+s).match(ps[i]);if(m)return parseInt(m[1]);}var nm=n.match(/(\d+)$/)||s.match(/-(\d+)$/);if(nm){var v=parseInt(nm[1]);if(v>=2&&v<=30)return v;}return 1;}
async function fSS(src,t,o){
    var r=[],terms=[t];if(o&&o!==t)terms.push(o);
    var all=[],seen={};
    for(var i=0;i<terms.length;i++){var items=await sS(src,terms[i]);for(var j=0;j<items.length;j++){if(items[j].slug&&!seen[items[j].slug]){seen[items[j].slug]=true;all.push(items[j]);}}}
    var nT=ns(t),nO=ns(o);
    for(var k=0;k<all.length;k++){
        var it=all[k],n1=ns(it.name||''),n2=ns(it.origin_name||''),ok=false;
        if(nT&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1))ok=true;
        if(nO&&(n2.indexOf(nO)>-1||nO.indexOf(n2)>-1))ok=true;
        if(!ok&&r.length&&(ns(it.slug).indexOf(ns(r[0].slug))>-1||ns(r[0].slug).indexOf(ns(it.slug))>-1))ok=true;
        if(ok)r.push({slug:it.slug,name:it.name||'',sn:exSn(it.name||'',it.slug||''),src:src});
    }
    r.sort(function(a,b){return a.sn-b.sn;});
    return r;
}
async function findTid(item){
    if(item.tmdb&&item.tmdb.id)return{id:item.tmdb.id,mt:item.tmdb.type||'movie'};
    var t=item.name||item.title||'',o=item.origin_name||item.original_name||'';
    try{
        var res=await tF('/search/multi?language='+lang()+'&query='+encodeURIComponent(o||t)+'&page=1');
        var rs=(res.results||[]).filter(function(r){return r.media_type!=='person';});
        var nT=ns(t),nO=ns(o),y=item.year||'';
        for(var i=0;i<rs.length;i++){
            var r=rs[i],rn=ns(r.title||r.name||''),ro=ns(r.original_title||r.original_name||''),ry=(r.release_date||r.first_air_date||'').slice(0,4);
            if((nT&&(rn===nT||ro===nT))||(nO&&(rn===nO||ro===nO))){if(!y||!ry||y===ry||Math.abs(parseInt(y)-parseInt(ry))<=1)return{id:r.id,mt:r.media_type||(r.first_air_date?'tv':'movie')};}}
        if(rs.length)return{id:rs[0].id,mt:rs[0].media_type||(rs[0].first_air_date?'tv':'movie')};
    }catch(e){}
    return null;
}

// ── Torrent ──
function tsU(p){var h=g('ts_host','');if(!h)return'';h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;return h+p;}
function tsH(){var h={'Content-Type':'application/json'},pw=g('ts_pw','');if(pw)h.Authorization='Basic '+btoa('admin:'+pw);return h;}
function cTio(r){if(!r)return'';r=String(r).trim();var m=r.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest/i);if(m)return m[1];m=r.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream/i);if(m)return m[1];return'';}
function cAio(r){return r?String(r).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,''):'';}

function pSt(st){
    var rn=String(st.name||''),rd=String(st.description||''),ra=rn+'\n'+rd;
    var name=rn.split('\n')[0].trim()||'?';
    var q='',qm=ra.match(/\b(2160p|4K|1080p|720p|480p|HDR|BluRay|WEB-?DL)\b/i);if(qm)q=qm[1].toUpperCase();
    var sz='',sm=ra.match(/💾\s*([\d.,]+\s*(?:TB|GB|MB))/i)||ra.match(/\b([\d.,]+)\s*(GB|MB)\b/i);if(sm)sz=sm[2]?sm[1]+' '+sm[2]:sm[1];
    var sd='',se=ra.match(/👤\s*(\d+)/i)||ra.match(/(\d+)\s*seed/i);if(se)sd=se[1];
    if(!q&&st.behaviorHints){var fn=st.behaviorHints.filename||'';var fq=fn.match(/\b(2160p|4K|1080p|720p|480p)\b/i);if(fq)q=fq[1].toUpperCase();if(!sz&&st.behaviorHints.videoSize){var b=Number(st.behaviorHints.videoSize);if(b>1073741824)sz=(b/1073741824).toFixed(1)+' GB';else if(b>1048576)sz=(b/1048576).toFixed(0)+' MB';}}
    return{name:name,hash:st.infoHash||'',fi:st.fileIdx,url:st.url||'',sz:sz,sd:sd,q:q};
}
function fmS(s){var l=s.name;if(s.q)l+=' ['+s.q+']';var m=[];if(s.sz)m.push('💾 '+s.sz);if(s.sd)m.push('👤 '+s.sd);return m.length?l+'\n'+m.join('  '):l;}

async function fStr(t,imdb,s,e){
    var eng=g('t_eng','torrentio'),base,tp=t==='tv'?'series':'movie',id=imdb;
    if(t==='tv'&&s&&e)id=imdb+':'+s+':'+e;
    if(eng==='aio'){base=cAio(g('aio_url',''));if(!base)throw new Error('No AIO');}
    else{var c=cTio(g('tio_cfg',''));base=TIO+(c?'/'+c:'');}
    var r=await fetch(base+'/stream/'+tp+'/'+id+'.json');if(!r.ok)throw new Error(eng+' '+r.status);
    var d=await r.json();return(d.streams||[]).map(pSt);
}
function shS(streams,title,poster){
    var ts=!!g('ts_host','');
    Lampa.Select.show({title:'Torrent: '+title+' ('+streams.length+')',items:streams.slice(0,40).map(function(s){return{title:fmS(s),value:s};}),onSelect:async function(a){
        var s=a.value;
        if(ts&&s.hash){
            Lampa.Noty.show('Gửi TS...');
            try{
                var mag='magnet:?xt=urn:btih:'+s.hash+'&tr='+encodeURIComponent('udp://tracker.opentrackr.org:1337/announce');
                var r=await fetch(tsU('/torrents'),{method:'POST',headers:tsH(),body:JSON.stringify({action:'add',link:mag,title:title,poster:poster||'',save_to_db:false})});
                var td=await r.json();var h=td.hash||s.hash;
                await new Promise(function(r){setTimeout(r,2000);});
                Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+h+'&index='+(s.fi||0)+'&play')});
            }catch(e){Lampa.Noty.show('TS lỗi');}
        }else if(s.url)Lampa.Player.play({title:title,url:s.url});
        else Lampa.Noty.show('No link');
    },onBack:function(){Lampa.Controller.toggle('content');}});
}
async function oTor(mt,tid,t,ps,imdb){
    Lampa.Noty.show('Tìm torrent...');
    try{
        var id=imdb||await gImdb(mt,tid);if(!id){Lampa.Noty.show('No IMDB');return;}
        if(mt==='movie'){var st=await fStr('movie',id);if(!st.length){Lampa.Noty.show('Không có');return;}shS(st,t,ps);}
        else{var sn=await gSn(tid);
            if(sn.length>1){Lampa.Select.show({title:'Season',items:sn.map(function(s){return{title:s.name+' ('+s.ec+')',value:s};}),onSelect:function(a){pTE(a.value,id,t,ps);},onBack:function(){Lampa.Controller.toggle('content');}});}
            else if(sn.length===1)pTE(sn[0],id,t,ps);
        }
    }catch(e){Lampa.Noty.show('Lỗi: '+e.message);}
}
function pTE(sn,imdb,t,ps){
    var its=[];for(var i=1;i<=sn.ec;i++)its.push({title:'S'+pd(sn.sn)+'E'+pd(i),value:{s:sn.sn,e:i}});
    Lampa.Select.show({title:sn.name,items:its,onSelect:async function(a){
        var lb=t+' S'+pd(a.value.s)+'E'+pd(a.value.e);Lampa.Noty.show(lb+'...');
        try{var st=await fStr('tv',imdb,a.value.s,a.value.e);if(!st.length){Lampa.Noty.show('Không có');return;}shS(st,lb,ps);}catch(e){Lampa.Noty.show('Lỗi');}
    },onBack:function(){Lampa.Controller.toggle('content');}});
}

// ── Cards (single type) ──
function goTmdb(d){sH(d);Lampa.Activity.push({url:'',title:d.name,component:'kk_det',tmdb_id:d.tmdb_id,mt:d.mt,page:1});}
function mkC(item,mode){
    var d=tN(item);if(!d||!d.tmdb_id)return $('<div></div>');
    var tl=d.mt==='tv'?'TV':'Film',c;
    if(mode==='h'){
        var bg=d.bk||d.poster;
        c=$('<div class="kk-card-h selector"><div class="kk-card-h-img">'+(bg?'<img src="'+bg+'" loading="lazy">':'<div class="kk-card-h-noposter">No Image</div>')+(d.vote?'<div class="kk-card-q">⭐ '+d.vote+'</div>':'')+'<div class="kk-card-ep kk-card-ep--type">'+tl+'</div></div><div class="kk-card-h-body"><div class="kk-card-name">'+E(d.name)+'</div>'+(d.orig&&d.orig!==d.name?'<div class="kk-card-origin">'+E(d.orig)+'</div>':'')+(d.year?'<div class="kk-card-meta"><span class="kk-card-year">'+d.year+'</span></div>':'')+'</div></div>');
    }else if(mode==='pf'){
        c=$('<div class="kk-pfc selector"><div class="kk-pfc-bg">'+(d.bk?'<img src="'+d.bk+'" loading="lazy">':'<div class="kk-pfc-bg-empty"></div>')+'</div><div class="kk-pfc-overlay"></div><div class="kk-pfc-inner">'+(d.poster?'<div class="kk-pfc-poster"><img src="'+d.poster+'" loading="lazy"></div>':'<div class="kk-pfc-poster kk-pfc-poster--empty"></div>')+'<div class="kk-pfc-info"><div class="kk-pfc-badge">'+tl+'</div><div class="kk-pfc-title">'+E(d.name)+'</div>'+(d.orig&&d.orig!==d.name?'<div class="kk-pfc-origin">'+E(d.orig)+'</div>':'')+'<div class="kk-pfc-meta">'+(d.year?'<span class="kk-pfc-year">'+d.year+'</span>':'')+(d.vote?'<span class="kk-pfc-vote">⭐ '+d.vote+'</span>':'')+'</div></div></div></div>');
    }else{
        c=$('<div class="kk-card selector"><div class="kk-card-img">'+(d.poster?'<img src="'+d.poster+'" loading="lazy">':'<div class="kk-card-noposter">No Poster</div>')+(d.vote?'<div class="kk-card-q">⭐ '+d.vote+'</div>':'')+'<div class="kk-card-ep kk-card-ep--type">'+tl+'</div></div><div class="kk-card-body"><div class="kk-card-name">'+E(d.name)+'</div>'+(d.orig&&d.orig!==d.name?'<div class="kk-card-origin">'+E(d.orig)+'</div>':'')+(d.year?'<div class="kk-card-meta"><span class="kk-card-year">'+d.year+'</span></div>':'')+'</div></div>');
    }
    bE(c,function(){goTmdb(d);});
    return c;
}
// Source item → find TMDB → same detail page
function mkSC(item,src,mode){
    var p=fI(mode==='h'?(item.thumb_url||item.poster_url):(item.poster_url||item.thumb_url),src);
    var tl=item.type==='series'||item.type==='tvshows'?'TV':'Film';
    var c;
    if(mode==='h'){
        c=$('<div class="kk-card-h selector" data-ld="0"><div class="kk-card-h-img">'+(p?'<img src="'+p+'" loading="lazy">':'<div class="kk-card-h-noposter">No Image</div>')+(item.quality?'<div class="kk-card-q">'+E(item.quality)+'</div>':'')+'<div class="kk-card-ep kk-card-ep--type">'+tl+'</div></div><div class="kk-card-h-body"><div class="kk-card-name">'+E(item.name||item.title||'')+'</div>'+(item.origin_name&&item.origin_name!==(item.name||item.title)?'<div class="kk-card-origin">'+E(item.origin_name)+'</div>':'')+(item.year?'<div class="kk-card-meta"><span class="kk-card-year">'+item.year+'</span></div>':'')+'</div></div>');
    }else{
        c=$('<div class="kk-card selector" data-ld="0"><div class="kk-card-img">'+(p?'<img src="'+p+'" loading="lazy">':'<div class="kk-card-noposter">No Poster</div>')+(item.quality?'<div class="kk-card-q">'+E(item.quality)+'</div>':'')+'<div class="kk-card-ep kk-card-ep--type">'+tl+'</div></div><div class="kk-card-body"><div class="kk-card-name">'+E(item.name||item.title||'')+'</div>'+(item.origin_name?'<div class="kk-card-origin">'+E(item.origin_name)+'</div>':'')+(item.year?'<div class="kk-card-meta"><span class="kk-card-year">'+item.year+'</span></div>':'')+'</div></div>');
    }
    bE(c,async function(){
        if(c.attr('data-ld')==='1')return;c.attr('data-ld','1');
        Lampa.Noty.show('Tìm TMDB...');
        var r=await findTid(item);
        if(r)Lampa.Activity.push({url:'',title:item.name||'',component:'kk_det',tmdb_id:r.id,mt:r.mt,page:1});
        else Lampa.Noty.show('Không tìm thấy');
        c.attr('data-ld','0');
    });
    return c;
}
function mkRL(items,tmdb,src){
    var cm=g('cm','hgrid'),rl=$('<div class="kk-row-list"></div>');
    items.forEach(function(i){rl.append(tmdb?mkC(i,cm==='poster'?'pf':'h'):mkSC(i,src,cm==='poster'?'v':'h'));});
    return rl;
}

// ── Episode UI ──
function fillE(c,eps,t){
    eps.forEach(function(sv){
        var sn=sv.server_name||'Server',cnt=(sv.server_data||[]).length,icon='📺',sl=sn.toLowerCase();
        if(sl.indexOf('thuyết minh')>-1||sl.indexOf('thuyet minh')>-1)icon='🇻🇳';else if(sl.indexOf('vietsub')>-1||sl.indexOf('sub')>-1)icon='📝';
        c.append('<div class="kk-sv-hd">'+icon+' '+E(sn)+' ('+cnt+')</div>');
        var gr=$('<div class="kk-ep-chips"></div>');
        (sv.server_data||[]).forEach(function(ep){
            var lk=ep.link_m3u8||ep.link_embed||'';
            var ch=$('<div class="kk-ep-c selector'+(lk?'':' off')+'">'+E(ep.name||'Tập')+'</div>');
            bE(ch,function(){if(lk)Lampa.Player.play({title:t+' - '+(ep.name||''),url:lk});else Lampa.Noty.show('No link');});
            gr.append(ch);
        });c.append(gr);
    });
}
function mkSB(css,l1,l2){return $('<div class="kk-src-btn '+css+' selector"><div class="kk-sb-main">'+l1+' <span class="kk-arrow">▼</span></div>'+(l2?'<div class="kk-sb-sub">'+l2+'</div>':'')+'</div>');}

function bSrcBtn(sk,sn,slug,t,o,mt,css,tSn){
    var w=$('<div style="width:100%"></div>'),isTV=mt==='tv';
    var btn=mkSB(css,'▶ '+E(sn),isTV?'Chọn season/tập':'Bấm để xem');
    var box=$('<div class="kk-ep-box"></div>');
    w.append(btn).append(box);
    var ld=false,op=false;
    bE(btn,function(){
        op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);
        if(op&&!ld){
            ld=true;box.html('<div class="kk-ep-ld">⏳ Đang tải...</div>');
            if(isTV){
                fSS(S[sk],t,o).then(function(entries){
                    if(!entries.length&&slug)entries=[{slug:slug,name:t,sn:1,src:S[sk]}];
                    if(!entries.length){box.html('<div class="kk-ep-er">❌ Không tìm thấy</div>');return;}
                    var sMap={};entries.forEach(function(e){if(!sMap[e.sn])sMap[e.sn]=[];sMap[e.sn].push(e);});
                    var sNums=Object.keys(sMap).map(Number).sort(function(a,b){return a-b;});
                    if(tSn&&tSn.length){tSn.forEach(function(ts){if(!sMap[ts.sn]){sMap[ts.sn]=[{slug:null,name:ts.name,sn:ts.sn,src:S[sk],na:true}];sNums.push(ts.sn);}});sNums.sort(function(a,b){return a-b;});}
                    if(sNums.length===1)ldS(box,sMap[sNums[0]],t,sNums[0],null);
                    else shSnUI(box,sMap,sNums,t);
                }).catch(function(e){box.html('<div class="kk-ep-er">❌ '+E(e.message||'Lỗi')+'</div>');});
            }else{
                fDt(S[sk],slug).then(function(det){
                    if(!det||!det.episodes||!det.episodes.length){box.html('<div class="kk-ep-er">❌ Không có tập</div>');return;}
                    box.empty();
                    var total=0;det.episodes.forEach(function(sv){total+=(sv.server_data||[]).length;});
                    if(total===1){var ep=(det.episodes[0].server_data||[])[0];if(ep){var lk=ep.link_m3u8||ep.link_embed||'';if(lk){Lampa.Player.play({title:t,url:lk});return;}}}
                    fillE(box,det.episodes,t);
                }).catch(function(e){box.html('<div class="kk-ep-er">❌ '+E(e.message||'Lỗi')+'</div>');});
            }
        }
    });
    return w;
}
function shSnUI(c,sMap,sNums,t){
    c.empty();sNums.forEach(function(sn){
        var es=sMap[sn],na=es.length===1&&es[0].na;
        var it=$('<div class="kk-sn-it selector'+(na?' kk-sn-notfound':'')+'"><span class="kk-sn-nm">📺 Season '+sn+'</span><span class="kk-sn-bd">'+(na?'N/A':es.length)+'</span></div>');
        if(!na)bE(it,function(){ldS(c,es,t,sn,function(){shSnUI(c,sMap,sNums,t);});});
        c.append(it);
    });
}
async function ldS(c,entries,t,sn,backFn){
    c.html('<div class="kk-ep-ld">⏳ S'+sn+'...</div>');
    for(var i=0;i<entries.length;i++){
        if(entries[i].na)continue;
        try{var det=await fDt(entries[i].src,entries[i].slug);
            if(det&&det.episodes&&det.episodes.length){c.empty();if(backFn){var bk=$('<div class="kk-ep-bk selector">← Quay lại</div>');bE(bk,backFn);c.append(bk);}fillE(c,det.episodes,t+' S'+pd(sn));return;}}catch(e){}
    }c.html('<div class="kk-ep-er">❌ Không có tập</div>');
}

// ── Infinite grid factory ──
function mkGI(name,fetchFn,titleFn){
    Lampa.Component.add(name,function(obj){
        var sc=new Lampa.Scroll({mask:true,over:true}),comp=this,pg=obj.page_num||1;
        var gC=$('<div></div>'),cur=null,ld=false,dn=false;
        var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
        var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');
        function iG(){var cm=g('ctm','hgrid');cur=cm==='hgrid'?$('<div class="kk-grid kk-grid--cat-h"></div>'):$('<div class="kk-grid"></div>').css('grid-template-columns','repeat('+g('cs','3')+',minmax(0,1fr))');gC.empty().append(cur);}
        this.create=function(){comp.activity.loader(true);cS(sc);iG();
            sc.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(titleFn(obj))+'</div>').append(gC).append(sp).append(em));
            sc.render().find('.scroll__body').on('scroll',function(){if(ld||dn)return;var el=this;if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)doL();});doL();};
        function doL(){ld=true;sp.show();
            fetchFn(obj,pg).then(function(items){sp.hide();if(!items.length){dn=true;em.show();} else{var cm=g('ctm','hgrid');items.forEach(function(i){cur.append(mkC(i,cm==='hgrid'?'h':'v').addClass('kk-card--grid'));});pg++;}ld=false;comp.activity.loader(false);comp.start();
            }).catch(function(){ld=false;sp.hide();em.show().text('Lỗi');comp.activity.loader(false);});}
        this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
    });
}

// ── Open search ──
function oS(){function go(kw){kw=String(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'🔍 '+kw,component:'kk_search',keyword:kw,page_num:1});}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm phim',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm phim:'));}

// ── Register components ──
mkGI('kk_tlist',function(obj,pg){var fn=TFN[obj.lt]||TFN.tw;return fn(pg).then(function(r){return(r.results||[]).filter(function(i){return i.media_type!=='person';});});},function(obj){return obj.title||'TMDB';});
mkGI('kk_search',function(obj,pg){return tSM(obj.keyword||'',pg).then(function(r){return(r.results||[]).filter(function(i){return i.media_type!=='person';});});},function(obj){return'🔍 '+(obj.keyword||'');});

// ── Source list (infinite) ──
Lampa.Component.add('kk_slist',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this,src=S[obj.sk]||S.op,pg=1;
    var gC=$('<div></div>'),cur=null,ld=false,dn=false;
    var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
    var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');
    function iG(){var cm=g('ctm','hgrid');cur=cm==='hgrid'?$('<div class="kk-grid kk-grid--cat-h"></div>'):$('<div class="kk-grid"></div>').css('grid-template-columns','repeat('+g('cs','3')+',minmax(0,1fr))');gC.empty().append(cur);}
    this.create=function(){comp.activity.loader(true);cS(sc);iG();
        sc.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(obj.title||'')+'</div>').append(gC).append(sp).append(em));
        sc.render().find('.scroll__body').on('scroll',function(){if(ld||dn)return;if(this.scrollTop+this.clientHeight>=this.scrollHeight-400)doL();});doL();};
    function doL(){ld=true;sp.show();
        fetch(src.a+obj.api+'?page='+pg).then(function(r){return r.json();}).then(function(res){
            var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).filter(function(i){return i&&i.slug;});
            sp.hide();if(!list.length){dn=true;em.show();ld=false;comp.activity.loader(false);comp.start();return;}
            var cm=g('ctm','hgrid');list.forEach(function(i){cur.append(mkSC(i,src,cm==='hgrid'?'h':'v').addClass('kk-card--grid'));});
            pg++;ld=false;comp.activity.loader(false);comp.start();
        }).catch(function(){ld=false;sp.hide();em.show().text('Lỗi');comp.activity.loader(false);});}
    this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
});

// ── Genre ──
Lampa.Component.add('kk_genre',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this,cg=String(obj.gid||'');
    var gC=$('<div></div>'),cur=null,ld=false,md=false,td=false,mp=1,tp=1,all=[],rs={};
    var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
    var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');
    function iG(){var cm=g('ctm','hgrid');cur=cm==='hgrid'?$('<div class="kk-grid kk-grid--cat-h"></div>'):$('<div class="kk-grid"></div>').css('grid-template-columns','repeat('+g('cs','3')+',minmax(0,1fr))');gC.empty().append(cur);}
    this.create=function(){comp.activity.loader(true);cS(sc);
        var gb=$('<div class="kk-genre-bar"></div>');sc.append(gb);iG();
        sc.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title" id="kk-gt">'+E(obj.title||'')+'</div>').append(gC).append(sp).append(em));
        sc.render().find('.scroll__body').on('scroll',function(){if(ld||(md&&td))return;if(this.scrollTop+this.clientHeight>=this.scrollHeight-400)doL();});
        Promise.all([tF('/genre/movie/list?language='+lang()),tF('/genre/tv/list?language='+lang())]).then(function(res){
            var mg=[],sn={};(res[0].genres||[]).concat(res[1].genres||[]).forEach(function(g2){if(!sn[g2.id]){sn[g2.id]=true;mg.push(g2);}});
            mg.sort(function(a,b){return(a.name||'').localeCompare(b.name||'');});
            mg.forEach(function(g2){var on=String(g2.id)===cg;var ch=$('<div class="kk-genre-chip selector '+(on?'kk-genre-chip--on':'kk-genre-chip--off')+'">'+E(g2.name)+'</div>');bE(ch,function(){Lampa.Activity.push({url:'',title:g2.name,component:'kk_genre',gid:g2.id,page_num:1});});gb.append(ch);});
            var cur2=mg.find(function(g2){return String(g2.id)===cg;});if(cur2)sc.render().find('#kk-gt').text(cur2.name);doL();
        }).catch(function(){doL();});};
    function doL(){if(ld)return;ld=true;sp.show();var ps=[];
        if(!md)ps.push(tDis('movie',cg,mp).then(function(r){var i=r.results||[];if(!i.length)md=true;else{i.forEach(function(x){x.media_type='movie';});all=all.concat(i);mp++;}}).catch(function(){md=true;}));
        if(!td)ps.push(tDis('tv',cg,tp).then(function(r){var i=r.results||[];if(!i.length)td=true;else{i.forEach(function(x){x.media_type='tv';});all=all.concat(i);tp++;}}).catch(function(){td=true;}));
        Promise.all(ps).then(function(){all.sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});var cm=g('ctm','hgrid');
            for(var i=0;i<all.length;i++){var k=all[i].media_type+'_'+all[i].id;if(!rs[k]){rs[k]=true;cur.append(mkC(all[i],cm==='hgrid'?'h':'v').addClass('kk-card--grid'));}}
            sp.hide();if(md&&td)em.show();ld=false;comp.activity.loader(false);comp.start();
        }).catch(function(){ld=false;sp.hide();comp.activity.loader(false);});}
    this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
});

// ── Person ──
Lampa.Component.add('kk_person',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this,pid=obj.pid;
    this.create=function(){comp.activity.loader(true);cS(sc);if(!pid){comp.activity.loader(false);comp.start();return;}
        Promise.all([tF('/person/'+pid+'?language='+lang()),tPC(pid)]).then(function(res){
            var p=res[0],cr=res[1],w=$('<div class="kk-detail-wrap"></div>');
            var av=p.profile_path?W5+p.profile_path:'';
            w.append('<div class="kk-person-header"><div class="kk-person-avatar">'+(av?'<img src="'+av+'">':'')+'</div><div class="kk-person-info"><div class="kk-person-name">'+E(p.name||'')+'</div>'+(p.birthday?'<div class="kk-person-meta">🎂 '+E(p.birthday)+'</div>':'')+'</div></div>');
            if(p.biography)w.append('<div class="kk-person-bio">'+ft((p.biography||'').substring(0,600))+'</div>');
            if(cr&&cr.cast){var cnt=parseInt(g('rc','20'));
                ['movie','tv'].forEach(function(mt){
                    var items=cr.cast.filter(function(c){return c.media_type===mt;}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});
                    if(items.length){var r=$('<div class="kk-row"></div>'),rl=$('<div class="kk-row-list"></div>');items.slice(0,cnt).forEach(function(c){rl.append(mkC(c,'h'));});r.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+(mt==='movie'?'🎬 Phim lẻ':'📺 Phim bộ')+'</div>')).append(rl);w.append(r);}
                });}
            sc.append(w);comp.activity.loader(false);comp.start();
        }).catch(function(){comp.activity.loader(false);});};
    this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// MAIN - Single tab
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kkphim_main',function(){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    var srcCats=[
        {n:'🎬 Phim Mới',api:'danh-sach/phim-moi-cap-nhat'},
        {n:'🎥 Phim Lẻ',api:'v1/api/danh-sach/phim-le'},
        {n:'📺 Phim Bộ',api:'v1/api/danh-sach/phim-bo'},
        {n:'🎭 Hoạt Hình',api:'v1/api/danh-sach/hoat-hinh'}
    ];
    var tSecs=[
        {n:'🔥 Xu hướng',lt:'td'},{n:'🌟 Tuần này',lt:'tw'},
        {n:'🎬 Chiếu rạp',lt:'np'},{n:'📅 Sắp chiếu',lt:'uc'},
        {n:'🌟 Phim lẻ hot',lt:'pm'},{n:'📺 Phim bộ hot',lt:'pt'},
        {n:'📺 Đang phát',lt:'oa'},{n:'⭐ Top phim',lt:'tm'},{n:'⭐ Top bộ',lt:'tt'}
    ];
    this.create=function(){
        comp.activity.loader(true);cS(sc);
        var tb=$('<div class="kk-topbar"><div class="kk-topbar-title" style="color:#01b4e4">KKPhim</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');
        bE($(tb.find('.kk-btn')[0]),oS);
        bE($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'Cài đặt',component:'kk_stg'});});
        sc.append(tb);
        var cm=g('cm','hgrid'),cnt=cm==='poster'?12:parseInt(g('rc','20'));
        var total=0,loaded=0;
        function chk(){loaded++;if(loaded>=total){comp.activity.loader(false);comp.start();}}

        // Recommendation from history
        var hist=gH();
        if(hist.length&&hist[0].tmdb_id){
            tRec(hist[0].mt||'movie',hist[0].tmdb_id,1).then(function(res){
                var items=(res.results||[]).slice(0,cnt);
                if(items.length){items.forEach(function(i){if(!i.media_type)i.media_type=hist[0].mt||'movie';});
                    var row=$('<div class="kk-row"></div>');
                    row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">💡 Vì bạn xem "'+E(hist[0].name)+'"</div>'));
                    row.append(mkRL(items,true));
                    sc.render().find('.kk-topbar').after(row);}
            }).catch(function(){});
        }

        // Random
        var rr=$('<div class="kk-row"></div>');
        rr.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">🎲 Ngẫu nhiên</div>'));
        var rc=$('<div></div>');rr.append(rc);sc.append(rr);
        Promise.all([tRnd('movie'),tRnd('tv')]).then(function(res){
            var items=[];(res[0].results||[]).forEach(function(i){i.media_type='movie';items.push(i);});(res[1].results||[]).forEach(function(i){i.media_type='tv';items.push(i);});
            for(var i=items.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=items[i];items[i]=items[j];items[j]=t;}
            rc.replaceWith(mkRL(items.slice(0,cnt),true));
        }).catch(function(){});

        // Source rows
        var es=eSrc();
        for(var sk in es){(function(sk2,src){
            srcCats.forEach(function(cat){
                total++;
                fetch(src.a+cat.api+'?page=1').then(function(r){return r.json();}).then(function(res){
                    var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).filter(function(i){return i&&i.slug;});
                    if(list.length){
                        var row=$('<div class="kk-row"></div>'),title=cat.n+' ('+src.n+')';
                        var mr=$('<div class="kk-row-more selector">Thêm</div>');
                        bE(mr,function(){Lampa.Activity.push({url:'',title:title,component:'kk_slist',sk:sk2,api:cat.api,page_num:1});});
                        row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+E(title)+'</div>').append(mr));
                        row.append(mkRL(list.slice(0,cnt),false,src));sc.append(row);}
                    chk();
                }).catch(function(){chk();});
            });
        })(sk,es[sk]);}

        // TMDB rows
        tSecs.forEach(function(sec){total++;var fn=TFN[sec.lt];if(!fn){chk();return;}
            fn(1).then(function(res){
                var items=(res.results||[]).filter(function(i){return i.media_type!=='person';});
                if(items.length){var row=$('<div class="kk-row"></div>'),mr=$('<div class="kk-row-more selector">Thêm</div>');
                    bE(mr,function(){Lampa.Activity.push({url:'',title:sec.n,component:'kk_tlist',lt:sec.lt,page_num:1});});
                    row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+E(sec.n)+'</div>').append(mr));
                    row.append(mkRL(items.slice(0,cnt),true));sc.append(row);}
                chk();
            }).catch(function(){chk();});
        });
        if(total===0){comp.activity.loader(false);comp.start();}
    };
    this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// DETAIL
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kk_det',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this,tid=obj.tmdb_id,mt=obj.mt||'movie';
    this.create=function(){
        comp.activity.loader(true);cS(sc);if(!tid){comp.activity.loader(false);comp.start();return;}
        tDF(mt,tid).then(async function(tmdb){
            var logos=null;try{logos=await tIG(mt,tid);}catch(e){}
            var t=tmdb.title||tmdb.name||'',o=tmdb.original_title||tmdb.original_name||'',y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);
            sH({tmdb_id:tid,mt:mt,name:t,poster:tmdb.poster_path?W5+tmdb.poster_path:'',year:y});
            Lampa.Noty.show('Tìm nguồn...');
            var slugs=await fSl(t,o,y);
            var tSn=mt==='tv'?await gSn(tid):null;
            bD(tmdb,logos,slugs,tSn);
        }).catch(function(e){comp.activity.loader(false);Lampa.Noty.show('Lỗi: '+e.message);});
    };
    async function bD(tmdb,logos,slugs,tSn){
        cS(sc);
        var bk=tmdb.backdrop_path?OI+tmdb.backdrop_path:'',ps=tmdb.poster_path?W5+tmdb.poster_path:'';
        var t=tmdb.title||tmdb.name||'',o=tmdb.original_title||tmdb.original_name||'',d=tmdb.overview||'Không có mô tả';
        var v=tmdb.vote_average?Number(tmdb.vote_average).toFixed(1):'N/A',y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);
        var rt=tmdb.runtime?tmdb.runtime+' phút':'';if(!rt&&tmdb.episode_run_time&&tmdb.episode_run_time.length)rt=tmdb.episode_run_time[0]+' phút/tập';
        var epX='';if(tmdb.number_of_episodes)epX=tmdb.number_of_episodes+' tập';if(tmdb.number_of_seasons)epX+=(epX?' | ':'')+tmdb.number_of_seasons+' season';
        var cn='';if(tmdb.production_countries&&tmdb.production_countries.length)cn=tmdb.production_countries.map(function(c){return c.iso_3166_1;}).join(', ');
        var gs=(tmdb.genres||[]).slice(0,3).map(function(g2){return g2.name;}).join(' | ');
        var logo=function(imgs){if(!imgs||!imgs.logos||!imgs.logos.length)return null;return imgs.logos.find(function(l){return l.iso_639_1==='vi';})||imgs.logos.find(function(l){return l.iso_639_1==='en';})||imgs.logos[0];}(logos||(tmdb.images||{}));
        var logoH=logo&&logo.file_path?'<div class="kk-logo"><img src="'+W5+logo.file_path+'"></div>':'';
        var dirs=[],cast=[];
        if(tmdb.credits){cast=(tmdb.credits.cast||[]).slice(0,15);dirs=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator'||c.job==='Series Director';}).filter(function(p,i,a){return a.findIndex(function(x){return x.name===p.name;})===i;}).slice(0,5);}
        var imdb=(tmdb.external_ids&&tmdb.external_ids.imdb_id)||null;
        var tH=logoH||'<div class="kk-title">'+E(t)+'</div>';
        // Genre HTML
        var gH2='';(tmdb.genres||[]).forEach(function(g2){gH2+='<span class="kk-genre selector" data-gid="'+g2.id+'" data-gn="'+E(g2.name)+'">'+E(g2.name)+'</span>';});
        // Director HTML
        var dH='';
        if(dirs.length){var f=dirs[0];dH='<div class="kk-crew">'+(f.profile_path?'<div class="kk-crew-avatar"><img src="'+W5+f.profile_path+'" loading="lazy"></div>':'')+'<div class="kk-crew-info"><span class="kk-crew-label">Đạo diễn</span><span class="kk-crew-name selector" data-pid="'+f.id+'">'+E(f.name)+'</span></div></div>';}

        // Build page
        var hero=$('<div class="kk-hero"><div class="kk-hero-backdrop">'+(bk?'<img src="'+bk+'" loading="lazy">':'')+'</div><div class="kk-hero-card"><div class="kk-hero-poster-wrap"><div class="kk-hero-poster">'+(ps?'<img src="'+ps+'" loading="lazy">':'')+'</div></div><div class="kk-hero-meta">'+(y||cn?'<div class="kk-hm-yc">'+(y?'<span class="kk-hm-year">'+y+'</span>':'')+(cn?'<span class="kk-hm-country">'+cn+'</span>':'')+'</div>':'')+tH+(tmdb.tagline?'<div class="kk-hm-tagline">'+E(tmdb.tagline)+'</div>':'')+'<div class="kk-hm-badges"><span class="kk-hm-vote">'+v+' <small>TMDB</small></span>'+(tmdb.status?'<span class="kk-hm-badge">'+E(tmdb.status)+'</span>':'')+'</div>'+(rt||gs?'<div class="kk-hm-rtg">'+(rt?'<span class="kk-hm-rt">'+E(rt+(epX?' · '+epX:''))+'</span>':'')+(gs?'<span class="kk-hm-genres">'+E(gs)+'</span>':'')+'</div>':'')+'</div></div></div>');
        var body=$('<div class="kk-body"><div class="kk-body-genres">'+gH2+'</div>'+dH+'<div class="kk-body-desc"><span class="kk-body-desc-label">Nội dung</span><div class="kk-body-desc-text">'+ft(d)+'</div></div></div>');
        // Bind genre clicks
        body.find('.kk-genre[data-gid]').each(function(){var g2=$(this);bE(g2,function(){Lampa.Activity.push({url:'',title:g2.attr('data-gn'),component:'kk_genre',gid:g2.attr('data-gid'),page_num:1});});});
        // Bind director clicks
        body.find('.kk-crew-name[data-pid]').each(function(){var sp=$(this);bE(sp,function(){Lampa.Activity.push({url:'',title:sp.text(),component:'kk_person',pid:parseInt(sp.attr('data-pid')),page:1});});});

        // Actions
        var act=$('<div class="kk-actions"></div>'),es=eSrc();
        for(var sk in es){var sn=es[sk].n,css=sk==='kk'?'kk-src-btn--kkphim':'kk-src-btn--ophim';
            if(slugs[sk])act.append(bSrcBtn(sk,sn,slugs[sk],t,o,mt,css,tSn));
            else{var na=$('<div class="kk-src-btn kk-src-btn--no selector" style="width:100%"><div class="kk-sb-main">'+E(sn)+' – N/A</div><div class="kk-sb-sub">Bấm thử lại</div></div>');
                (function(sk2,na2){bE(na2,async function(){Lampa.Noty.show('Tìm lại...');var terms=[t,o,t+' '+((tmdb.release_date||tmdb.first_air_date||'').slice(0,4))];for(var i=0;i<terms.length;i++){if(!terms[i])continue;var f=mB(await sS(es[sk2],terms[i]),t,o,(tmdb.release_date||tmdb.first_air_date||'').slice(0,4));if(f&&f.slug){slugs[sk2]=f.slug;Lampa.Noty.show('OK!');bD(tmdb,logos,slugs,tSn);return;}}Lampa.Noty.show('Không tìm thấy');});})(sk,$('<div style="width:100%"></div>').append(na));
                act.append($('<div style="width:100%"></div>').append(na));
            }
        }
        // Torrent
        var tl=g('t_eng','torrentio')==='aio'?'🌊 AIO':'🧲 Torrent';if(g('ts_host',''))tl+=' → TS';
        var tBtn=$('<div class="kk-src-btn kk-src-btn--torrent selector" style="width:100%"><div class="kk-sb-main">'+tl+'</div><div class="kk-sb-sub">Phát qua torrent</div></div>');
        bE(tBtn,function(){oTor(mt,tid,t,ps,imdb);});
        act.append($('<div style="width:100%"></div>').append(tBtn));
        body.append(act);

        var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);
        // Cast
        if(cast.length){var cs=$('<div class="kk-section"><div class="kk-block-title">Diễn viên</div></div>'),cl=$('<div class="kk-cast-list"></div>');
            cast.forEach(function(c){var av=c.profile_path?'<img src="'+W5+c.profile_path+'" loading="lazy">':'';
                var cd=$('<div class="kk-cast-card selector"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+E(c.name)+'</div><div class="kk-cast-role">'+E(c.character||'')+'</div></div></div>');
                bE(cd,function(){Lampa.Activity.push({url:'',title:c.name,component:'kk_person',pid:c.id,page:1});});cl.append(cd);});
            cs.append(cl);dw.append(cs);}
        // Similar
        var simI=(tmdb.similar&&tmdb.similar.results||[]).slice(0,20);
        if(simI.length){var ss2=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">Tương tự</div>'),sl=$('<div class="kk-similar-list"></div>');simI.forEach(function(i){if(!i.media_type)i.media_type=mt;sl.append(mkC(i,'v'));});ss2.append(sl);dw.append(ss2);}
        // Recommendations
        try{var rd=await tRec(mt,tid,1);var ri=(rd.results||[]).slice(0,20);
            if(ri.length){var rs2=$('<div class="kk-section kk-similar kk-section--last"></div>').append('<div class="kk-block-title">🎲 Gợi ý</div>'),rl=$('<div class="kk-similar-list"></div>');ri.forEach(function(i){if(!i.media_type)i.media_type=mt;rl.append(mkC(i,'v'));});rs2.append(rl);dw.append(rs2);}
        }catch(e){}
        sc.append(dw);comp.activity.loader(false);comp.start();
    }
    this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kk_stg',function(){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    this.create=function(){
        cS(sc);var s=ls(),w=$('<div class="kk-stg-wrap"></div>');
        w.append('<div class="kk-stg-title">⚙️ Cài đặt</div>');
        function mg(t){return $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">'+t+'</div>');}
        function si(n,d,v){return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">'+E(n)+'</div>'+(d?'<div class="kk-stg-label-desc">'+E(d)+'</div>':'')+'</div><div class="kk-stg-value">'+E(v)+'</div></div>');}
        function mo(n,d,on,cb){var it=si(n,d,on?'✅':'○');if(on)it.find('.kk-stg-value').css('color','#4ade80');bE(it,cb);return it;}
        function mi(n,d,val,pr,key){var it=si(n,d,val);bE(it,function(){try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:pr,value:s[key]||'',free:true,nosave:true},function(v){v=(v||'').trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);});return;}}catch(e){}var v=window.prompt(pr,s[key]||'');if(v!==null){v=v.trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);}});return it;}

        // Sources on/off
        var g1=mg('📺 Nguồn phim');
        for(var k in S)(function(k2){g1.append(mo(S[k2].n,S[k2].a,srcOn(k2),function(){ss({['s_'+k2]:!srcOn(k2)});Lampa.Noty.show(S[k2].n+': '+(srcOn(k2)?'Tắt':'Bật'));comp.create();}));})(k);
        w.append(g1);

        // Card mode
        var g2=mg('🃏 Kiểu card');var cm=s.cm||'hgrid';
        [{k:'hgrid',n:'Ngang'},{k:'poster',n:'Poster lớn'}].forEach(function(o){g2.append(mo(o.n,'',cm===o.k,function(){ss({cm:o.k});comp.create();}));});
        w.append(g2);

        // Cat mode
        var g3=mg('📋 Danh sách');var ctm=s.ctm||'hgrid';
        [{k:'hgrid',n:'Ngang 2 cột'},{k:'vgrid',n:'Dọc tùy chỉnh'}].forEach(function(o){g3.append(mo(o.n,'',ctm===o.k,function(){ss({ctm:o.k});comp.create();}));});
        w.append(g3);

        // Columns
        var g4=mg('🎨 Số cột dọc');var cs=s.cs||'3';
        ['2','3','4'].forEach(function(v){g4.append(mo(v+' cột','',cs===v,function(){ss({cs:v});comp.create();}));});
        w.append(g4);

        // Row count
        var g5=mg('📊 Số phim/row');var rc=s.rc||'20';
        ['10','15','20','30','50'].forEach(function(v){g5.append(mo(v+' phim','',rc===v,function(){ss({rc:v});comp.create();}));});
        w.append(g5);

        // Language
        var g6=mg('🌐 Ngôn ngữ TMDB');var cl=s.lang||'vi-VN';
        [{k:'vi-VN',n:'Tiếng Việt'},{k:'en-US',n:'English'},{k:'ja-JP',n:'日本語'},{k:'ko-KR',n:'한국어'}].forEach(function(o){g6.append(mo(o.n,o.k,cl===o.k,function(){ss({lang:o.k});_gc={};comp.create();}));});
        w.append(g6);

        // Torrent engine
        var g7=mg('🎯 Torrent');var ce=s.t_eng||'torrentio';
        g7.append(mo('Torrentio','',ce==='torrentio',function(){ss({t_eng:'torrentio'});comp.create();}));
        g7.append(mo('AIOStreams','',ce==='aio',function(){ss({t_eng:'aio'});comp.create();}));
        w.append(g7);

        // TorrServer
        var g8=mg('🖥️ TorrServer');
        g8.append(mi('Địa chỉ','IP:Port',s.ts_host||'Chưa cài','Địa chỉ TS','ts_host'));
        g8.append(mi('Mật khẩu','',s.ts_pw?'••••':'Không','Mật khẩu','ts_pw'));
        w.append(g8);

        // Torrentio config
        var g9=mg('🧲 Torrentio');
        g9.append(mi('Config','Dán link',s.tio_cfg?'Có':'Mặc định','Config','tio_cfg'));
        w.append(g9);

        // AIO
        var g10=mg('🌊 AIO');
        g10.append(mi('URL','manifest.json URL',s.aio_url||'Chưa cài','AIO URL','aio_url'));
        w.append(g10);

        // Clear
        var g11=mg('🗑️ Dữ liệu');
        var clr=si('Xóa toàn bộ','Khôi phục mặc định','Xóa');clr.find('.kk-stg-value').css('color','#f87171');
        bE(clr,function(){localStorage.removeItem(SK);localStorage.removeItem(HK);_gc={};Lampa.Activity.backward();});
        g11.append(clr);w.append(g11);

        w.append('<div class="kk-stg-ver">KKPhim v4.0</div>');
        sc.append(w);comp.start();
    };
    this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════════════════
function boot(){
    if(!$('#kk-css').length){var l=document.createElement('link');l.id='kk-css';l.rel='stylesheet';l.href=CU;document.head.appendChild(l);}
    // Font scale
    var fs=parseInt(g('fs','100'));
    if(fs&&fs!==100){$('#kk-fs').remove();$('head').append('<style id="kk-fs">.kk-topbar,.kk-row,.kk-grid-wrap,.kk-detail-wrap,.kk-stg-wrap,.kk-card,.kk-card-h,.kk-pfc{font-size:'+fs+'%!important;}</style>');}
    // Menu
    setTimeout(function(){
        if($('.menu__item[data-action="kkphim"]').length)return;
        var m=$('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>');
        bE(m,function(){Lampa.Activity.push({url:'',title:'KKPhim',component:'kkphim_main',page:1});});
        $('.menu .menu__list').first().append(m);
    },500);
}
if(window.appready)boot();else Lampa.Listener.follow('app',function(e){if(e.type==='ready')boot();});
})();