/* KKPhim UI v4.0 - Components & Interface [MODIFIED] */
(function(){
'use strict';
if(window.__kkphim_ui_started)return;
window.__kkphim_ui_started=true;

var CSS_URL='https://nguyenquocngu93.github.io/fshare/style.css';
var K=window.KK;

// ═══════════════════════════════════════
//  UI HELPERS
// ═══════════════════════════════════════
function applyFontScale(){
    var id='kkphim-font-scale';$('#'+id).remove();var fs=K.fontScale();if(!fs||fs===100)return;
    $('head').append('<style id="'+id+'">.kk-topbar,.kk-row,.kk-grid-wrap,.kk-detail-wrap,.kk-stg-wrap,.kk-person-header,.kk-person-bio,.kk-actions,.kk-section,.kk-card,.kk-card-h,.kk-pfc{font-size:'+fs+'%!important;}</style>');
}

function bE(el,fn){
    var sx=0,sy=0,mv=false,tc=false;
    el.on('touchstart',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;mv=false;}});
    el.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))mv=true;});
    el.on('touchend',function(e){if(mv)return;tc=true;e.preventDefault();e.stopPropagation();setTimeout(function(){fn.call(el[0],e);},80);setTimeout(function(){tc=false;},300);});
    el.on('click',function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();fn.call(this,e);});
    el.on('hover:enter',function(e){fn.call(this,e);});
}

function eScr(scroll){var el=scroll.render();el.css({overflow:'hidden',position:'relative',height:'100%'});var b=el.find('.scroll__body'),p={'transform':'none','overflow-y':'auto','overflow-x':'hidden','-webkit-overflow-scrolling':'touch',height:'100%','padding-bottom':'8em','touch-action':'pan-y'};b.css($.extend({position:'relative'},p));if(b[0])Object.keys(p).forEach(function(k){b[0].style.setProperty(k,p[k],'important');});}
function cScr(scroll){try{scroll.render().find('.scroll__body').empty();}catch(e){}}
function aCtrl(scroll){Lampa.Controller.add('content',{toggle:function(){Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},left:function(){if(Navigator.canmove('left'))Navigator.move('left');else Lampa.Controller.toggle('menu');},right:function(){Navigator.move('right');},up:function(){if(Navigator.canmove('up'))Navigator.move('up');else Lampa.Controller.toggle('head');},down:function(){Navigator.move('down');},back:function(){Lampa.Activity.backward();}});setTimeout(function(){Lampa.Controller.toggle('content');Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},0);}

function oSearch(){function go(kw){kw=String(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'Tìm kiếm',component:'kkphim_search',keyword:kw,page_num:1});}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm phim',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm phim:'));}
function oTSearch(){function go(kw){kw=String(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'TMDB: '+kw,component:'kkphim_tmdb_search',keyword:kw,page_num:1});}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm TMDB',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm TMDB:'));}

// ═══════════════════════════════════════
//  CARD BUILDERS
// ═══════════════════════════════════════
function mkC(item){var n=K.nm(item);if(!n)return $('<div></div>');var p=K.optimizeImgUrl(K.fImg(n.poster_url||n.thumb_url));var badges='';if(n.quality)badges+='<div class="kk-card-q">'+K.E(n.quality)+'</div>';if(n.episode_current)badges+='<div class="kk-card-ep">'+K.E(n.episode_current)+'</div>';var c=$('<div class="kk-card selector"><div class="kk-card-img">'+(p?'<img src="'+p+'" loading="lazy">':'<div class="kk-card-noposter"><span>No Poster</span></div>')+badges+'</div><div class="kk-card-body"><div class="kk-card-name">'+K.E(n.name)+'</div>'+(n.origin_name&&n.origin_name!==n.name?'<div class="kk-card-origin">'+K.E(n.origin_name)+'</div>':'')+'<div class="kk-card-meta">'+(n.year?'<span class="kk-card-year">'+K.E(n.year)+'</span>':'')+'</div></div></div>');bE(c,function(){if(n.slug){K.saveHistory(n);Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});}});return c;}

function mkTC(item){var d=K.tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');var p=K.optimizeImgUrl(d.poster_url||d.backdrop_url);var c=$('<div class="kk-card selector"><div class="kk-card-img">'+(p?'<img src="'+p+'" loading="lazy">':'<div class="kk-card-noposter"><span>No Poster</span></div>')+(d.vote?'<div class="kk-card-q">⭐ '+K.E(d.vote)+'</div>':'')+'<div class="kk-card-ep kk-card-ep--type">'+(d.media_type==='tv'?'TV':'Film')+'</div></div></div><div class="kk-card-body"><div class="kk-card-name">'+K.E(d.name)+'</div><div class="kk-card-meta">'+(d.year?'<span class="kk-card-year">'+K.E(d.year)+'</span>':'')+'</div></div></div>');bE(c,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});return c;}

function mkTCH(item){var d=K.tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');var backdrop=K.optimizeImgUrl(d.backdrop_url||d.poster_url);var c=$('<div class="kk-card-h selector"><div class="kk-card-h-img">'+(backdrop?'<img src="'+backdrop+'" loading="lazy">':'<div class="kk-card-h-noposter"><span>No Image</span></div>')+(d.vote?'<div class="kk-card-q">⭐ '+K.E(d.vote)+'</div>':'')+'<div class="kk-card-ep kk-card-ep--type">'+(d.media_type==='tv'?'TV':'Film')+'</div></div><div class="kk-card-h-body"><div class="kk-card-name">'+K.E(d.name)+'</div><div class="kk-card-meta">'+(d.year?'<span class="kk-card-year">'+K.E(d.year)+'</span>':'')+'</div></div></div>');bE(c,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});return c;}

function mkCH(item){var n=K.nm(item);if(!n)return $('<div></div>');var p=K.optimizeImgUrl(K.fImg(n.thumb_url||n.poster_url));var badges='';if(n.quality)badges+='<div class="kk-card-q">'+K.E(n.quality)+'</div>';if(n.episode_current)badges+='<div class="kk-card-ep">'+K.E(n.episode_current)+'</div>';var c=$('<div class="kk-card-h selector"><div class="kk-card-h-img">'+(p?'<img src="'+p+'" loading="lazy">':'<div class="kk-card-h-noposter"><span>No Image</span></div>')+badges+'</div><div class="kk-card-h-body"><div class="kk-card-name">'+K.E(n.name)+'</div>'+(n.origin_name&&n.origin_name!==n.name?'<div class="kk-card-origin">'+K.E(n.origin_name)+'</div>':'')+'<div class="kk-card-meta">'+(n.year?'<span class="kk-card-year">'+K.E(n.year)+'</span>':'')+'</div></div></div>');bE(c,function(){if(n.slug){K.saveHistory(n);Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});}});return c;}

function mkPFC(item){var n=K.nm(item);if(!n||!n.slug)return $('<div></div>');var bk=K.optimizeImgUrl(K.fImg(n.thumb_url||n.poster_url)),ps=K.optimizeImgUrl(K.fImg(n.poster_url||n.thumb_url));var badges='';if(n.quality)badges+='<div class="kk-pfc-q">'+K.E(n.quality)+'</div>';if(n.episode_current)badges+='<div class="kk-pfc-ep">'+K.E(n.episode_current)+'</div>';var card=$('<div class="kk-pfc selector"><div class="kk-pfc-bg">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-pfc-bg-empty"></div>')+badges+'</div><div class="kk-pfc-overlay"></div><div class="kk-pfc-inner">'+(ps?'<div class="kk-pfc-poster"><img src="'+ps+'" loading="lazy"></div>':'')+'<div class="kk-pfc-info"><div class="kk-pfc-title">'+K.E(n.name)+'</div><div class="kk-pfc-meta">'+(n.year?'<span>'+K.E(n.year)+'</span>':'')+'</div></div></div></div>');bE(card,function(){K.saveHistory(n);Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});});return card;}

function mkTCPF(item){var d=K.tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');var bk=K.optimizeImgUrl(d.backdrop_url||d.poster_url),ps=K.optimizeImgUrl(d.poster_url);var card=$('<div class="kk-pfc selector"><div class="kk-pfc-bg">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-pfc-bg-empty"></div>')+(d.vote?'<div class="kk-pfc-q">⭐ '+d.vote+'</div>':'')+'</div><div class="kk-pfc-overlay"></div><div class="kk-pfc-inner">'+(ps?'<div class="kk-pfc-poster"><img src="'+ps+'" loading="lazy"></div>':'')+'<div class="kk-pfc-info"><div class="kk-pfc-title">'+K.E(d.name)+'</div><div class="kk-pfc-meta">'+(d.year?'<span>'+K.E(d.year)+'</span>':'')+'</div></div></div></div>');bE(card,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});return card;}

function mkCWCard(item){
    var n=K.nm(item);if(!n)return $('<div></div>');
    var p=K.optimizeImgUrl(item.thumb_url||item.poster_url||K.fImg(n.thumb_url||n.poster_url));
    var ep=item.ep_name||item.episode_current||'Tiếp tục xem';var link=item.ep_link||'';
    var prog=null;if(link)prog=K.getProgressFor(link);
    if(!prog&&item.progress_time>0&&item.progress_percent>0)prog={time:item.progress_time,duration:item.progress_duration,percent:item.progress_percent};
    // ✅ MOD: Xoá progress bar, chỉ giữ timeInfo
    var timeInfo='';
    if(prog&&prog.percent>0&&prog.percent<95){timeInfo=K.formatTime(prog.time)+'/'+K.formatTime(prog.duration)+' ('+prog.percent+'%)';}
    // ✅ MOD: Thay text "▶" bằng "📌" và default message
    var subText=timeInfo?'📌 '+timeInfo:'Nhấn để tiếp tục';
    var c=$('<div class="kk-card-h selector"><div class="kk-card-h-img">'+(p?'<img src="'+p+'" loading="lazy">':'<div class="kk-card-h-noposter"><span>No Image</span></div>')+'</div><div class="kk-card-h-body"><div class="kk-card-name">'+K.E(n.name)+'</div><div class="kk-card-meta"><span class="kk-card-time">'+K.E(ep)+'</span></div><div class="kk-card-overview">'+subText+'</div></div></div>');
    bE(c,function(){if(link)K.playWithResume((n.name||'')+' - '+ep,link,item.poster_url,item.thumb_url,item,ep);else if(n.slug)Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});});
    return c;
}

// ═══════════════════════════════════════
//  LIST / ROW BUILDERS
// ═══════════════════════════════════════
function mkRowList(items,isKK){var cm=K.cardMode();var rl=$('<div class="kk-row-list"></div>');if(cm==='poster'){items.forEach(function(i){rl.append(isKK?mkPFC(i):mkTCPF(i));});}else{items.forEach(function(i){rl.append(isKK?mkCH(i):mkTCH(i));});}return rl;}
function mkCWRow(items){var rl=$('<div class="kk-row-list"></div>');items.forEach(function(i){rl.append(mkCWCard(i));});return rl;}

// ✅ MOD: Hàm mkCastList với giới hạn 2 rows + nút "Xem thêm"
function mkCastList(castArr,hasTmdb,showMore=false){
    var list=$('<div class="kk-cast-list"></div>');
    var limit=showMore?8:20; // 2 rows × 4 cards
    castArr.slice(0,limit).forEach(function(c){
        var av=c.profile_path?'<img src="'+K.optimizeImgUrl(K.TMDB_W300+c.profile_path)+'" loading="lazy">':'<div class="kk-cast-empty"></div>';
        var card;
        if(hasTmdb&&c.id){
            card=$('<div class="kk-cast-card selector"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+K.E(c.name||'')+'</div><div class="kk-cast-role">'+K.E(c.character||'')+'</div></div></div>');
            bE(card,function(){Lampa.Activity.push({url:'',title:c.name||'',component:'kkphim_person',person_id:c.id,page:1});});
        }else{
            card=$('<div class="kk-cast-card"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+K.E(c.name||'')+'</div></div></div>');
        }
        list.append(card);
    });
    // Nút "Xem thêm" nếu còn cast và đang ở chế độ showMore
    if(showMore&&castArr.length>limit){
        var moreBtn=$('<div class="kk-cast-more selector">▼ Xem thêm diễn viên</div>');
        bE(moreBtn,function(){
            var section=list.closest('.kk-section');
            section.find('.kk-cast-list').replaceWith(mkCastList(castArr,hasTmdb,false));
            section.find('.kk-cast-more').remove();
        });
        list.append(moreBtn);
    }
    return list;
}

function mkDirHtml(dirs,isTmdb){if(!dirs||!dirs.length)return'';var f=dirs[0];var av=f.profile_path?'<div class="kk-crew-avatar"><img src="'+K.optimizeImgUrl(K.TMDB_W300+f.profile_path)+'" loading="lazy"></div>':'<div class="kk-crew-avatar"><div class="kk-crew-avatar-empty"></div></div>';var n2=(isTmdb&&f.id)?'<span class="kk-crew-name selector" data-pid="'+f.id+'">'+K.E(f.name||'')+'</span>':'<span class="kk-crew-name">'+K.E(f.name||'')+'</span>';return'<div class="kk-crew">'+av+'<div class="kk-crew-info"><span class="kk-crew-label">Đạo diễn</span>'+n2+'</div></div>';}
function bindDirClicks(el){el.find('.kk-crew-name[data-pid]').each(function(){var sp=$(this);bE(sp,function(){var pid=sp.attr('data-pid');if(pid)Lampa.Activity.push({url:'',title:sp.text()||'',component:'kkphim_person',person_id:parseInt(pid),page:1});});});}

function gHtml(genres,isTmdb){if(!genres||!genres.length)return'';var r='';for(var i=0;i<genres.length;i++){var g=genres[i];if(!g)continue;var gn=K.E(g.name||'');if(isTmdb)r+='<span class="kk-genre selector" data-gid="'+(g.id||'')+'" data-gname="'+gn+'">'+gn+'</span>';else r+='<span class="kk-genre selector" data-slug="'+K.E(g.slug||'')+'" data-title="'+K.E(g.name||'')+'">'+gn+'</span>';}return r;}

// ═══════════════════════════════════════
//  DETAIL PAGE BUILDERS
// ═══════════════════════════════════════
function mkHero(bk,ps,logoH,tH,origin,extra){
    extra=extra||{};var ctHtml='';
    if(extra.countries&&extra.countries.length){ctHtml='<span class="kk-country-tags">';extra.countries.slice(0,3).forEach(function(c){var code=c.iso_3166_1||c.name||'';if(code)ctHtml+='<span class="kk-country-tag">'+K.E(code)+'</span>';});ctHtml+='</span>';}
    return $('<div class="kk-hero"><div class="kk-hero-backdrop">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-hero-backdrop-empty"></div>')+'</div><div class="kk-hero-card"><div class="kk-hero-poster-wrap"><div class="kk-hero-poster">'+(ps?'<img src="'+ps+'" loading="lazy">':'')+'</div></div><div class="kk-hero-meta">'+(extra.year||ctHtml?'<div class="kk-hm-yc">'+(extra.year?'<span class="kk-hm-year">'+K.E(extra.year)+'</span>':'')+ctHtml+'</div>':'')+(logoH||tH)+'<div class="kk-hm-badges">'+(extra.vote?'<span class="kk-hm-vote">'+K.E(extra.vote)+' <small>TMDB</small></span>':'')+'</div>'+(extra.runtime||extra.genres?'<div class="kk-hm-rtg">'+(extra.runtime?'<span class="kk-hm-rt">'+K.E(extra.runtime)+'</span>':'')+(extra.genres?'<span class="kk-hm-genres">'+K.E(extra.genres)+'</span>':'')+'</div>':'')+'</div></div></div>');
}

function mkBody(v,y,rt,extra,genreHtml,crewH,desc,isFallback){var dl='Nội dung';if(isFallback)dl+=' <small style="opacity:0.6">(English)</small>';return $('<div class="kk-body"><div class="kk-body-genres">'+genreHtml+'</div>'+crewH+'<div class="kk-body-desc"><span class="kk-body-desc-label">'+dl+'</span><div class="kk-body-desc-text">'+K.fTxt(desc||'Không có mô tả')+'</div></div></div>');}

// ═══════════════════════════════════════
//  SOURCE BUTTONS & EPISODE LIST
// ═══════════════════════════════════════
function mkSB(css,l1,l2){return $('<div class="kk-src-btn '+css+' selector"><div class="kk-sb-main">'+l1+' <span class="kk-arrow">▼</span></div>'+(l2?'<div class="kk-sb-sub">'+l2+'</div>':'')+'</div>');}

function bMovExp(sk,sn,slug,title,css,movieData,posterUrl,backdropUrl){var w=$('<div style="width:100%"></div>'),btn=mkSB(css,'▶ '+K.E(sn),'Bấm để xem'),box=$('<div class="kk-ep-box"></div>');w.append(btn).append(box);var ld=false,op=false;bE(btn,function(){op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);if(op&&!ld){ld=true;box.html('<div class="kk-ep-ld">⏳ Đang tải...</div>');K.fDet(K.SOURCES[sk],slug).then(function(det){if(!det||!det.episodes||!det.episodes.length){box.html('<div class="kk-ep-er">❌ Không có tập</div>');return;}var mData=$.extend({},movieData||{});if(!mData.slug)mData.slug=slug;box.empty();fillE(box,det.episodes,title,mData,posterUrl,backdropUrl);}).catch(function(e){box.html('<div class="kk-ep-er">❌ '+K.E(e.message||'Lỗi')+'</div>');});}});return w;}

function bTVExp(sk,sn,slug,title,orig,css,movieData,posterUrl,backdropUrl){var w=$('<div style="width:100%"></div>'),btn=mkSB(css,'▶ '+K.E(sn),'Chọn season/tập'),box=$('<div class="kk-ep-box"></div>');w.append(btn).append(box);var ld=false,op=false;bE(btn,function(){op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);if(op&&!ld){ld=true;box.html('<div class="kk-ep-ld">⏳ Tìm seasons...</div>');var source=K.SOURCES[sk];K.fSeasonSlugs(source,title,orig).then(function(entries){if(!entries.length&&slug)entries=[{slug:slug,name:title,season:1,source:source}];if(!entries.length){box.html('<div class="kk-ep-er">❌ Không tìm thấy</div>');return;}var sMap={};entries.forEach(function(e2){if(!sMap[e2.season])sMap[e2.season]=[];sMap[e2.season].push(e2);});var sNums=Object.keys(sMap).map(Number).sort(function(a,b){return a-b;});var mData=$.extend({},movieData||{});if(!mData.slug)mData.slug=slug;if(sNums.length===1)ldSn(box,sMap[sNums[0]],title,sNums[0],null,mData,posterUrl,backdropUrl);else shSn(box,sMap,sNums,title,mData,posterUrl,backdropUrl);}).catch(function(e2){box.html('<div class="kk-ep-er">❌ '+K.E(e2.message||'Lỗi')+'</div>');});}});return w;}

function bDetExp(eps,title,sn,css,movieData,posterUrl,backdropUrl){var w=$('<div style="width:100%"></div>'),total=0;(eps||[]).forEach(function(sv){total+=(sv.server_data||[]).length;});var btn=mkSB(css,'▶ '+K.E(sn),total+' tập'),box=$('<div class="kk-ep-box"></div>');w.append(btn).append(box);if(!eps||!eps.length||total===0){btn.removeClass(css).addClass('kk-src-btn--no');btn.html('⚠️ Không có tập');return w;}if(total===1){var ep=K.gEp1(eps);if(ep){var link=ep.link_m3u8||ep.link_embed||'';btn.find('.kk-sb-main').html('▶ '+K.E(sn));btn.find('.kk-sb-sub').text('Phát ngay');btn.find('.kk-arrow').remove();bE(btn,function(){if(link)K.playWithResume(title,link,posterUrl,backdropUrl,movieData,ep.name||'Full');else Lampa.Noty.show('Không có link');});return w;}}fillE(box,eps,title,movieData,posterUrl,backdropUrl);var op=false;bE(btn,function(){op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);});return w;}

function bTorBtn(mt,tid,title,poster,imdb,movieData){var eng=K.tEngine();var label=eng==='aio'?'🌊 AIO':'🧲 Torrent';if(K.tsHost())label+=' → TS';var css=eng==='aio'?'kk-src-btn--aio':'kk-src-btn--torrent';var btn=$('<div class="kk-src-btn '+css+' selector" style="width:100%"><div class="kk-sb-main">'+label+'</div></div>');if(mt==='movie')bE(btn,function(){K.oTorMov(tid,title,poster,imdb,movieData);});else bE(btn,function(){K.oTorTV(tid,title,poster,imdb,movieData);});return $('<div style="width:100%"></div>').append(btn);}

function shSn(c,sMap,sNums,title,movieData,pu,bu){c.empty();sNums.forEach(function(sn){var item=$('<div class="kk-sn-it selector"><span class="kk-sn-nm">📺 Season '+sn+'</span></div>');bE(item,function(){ldSn(c,sMap[sn],title,sn,function(){shSn(c,sMap,sNums,title,movieData,pu,bu);},movieData,pu,bu);});c.append(item);});}

async function ldSn(c,entries,title,sNum,backFn,movieData,pu,bu){c.html('<div class="kk-ep-ld">⏳ Tải S'+K.pd(sNum)+'...</div>');for(var i=0;i<entries.length;i++){try{var det=await K.fDet(entries[i].source,entries[i].slug);if(det&&det.episodes&&det.episodes.length){c.empty();if(backFn){var bk=$('<div class="kk-ep-bk selector">← Quay lại</div>');bE(bk,backFn);c.append(bk);}var mData=$.extend({},movieData||{});if(!mData.slug)mData.slug=entries[i].slug;fillE(c,det.episodes,title+' S'+K.pd(sNum),mData,pu,bu);return;}}catch(e2){}}c.html('<div class="kk-ep-er">❌ Không có tập</div>');}

// ✅ MOD: fillE - xoá progress bar trong episode chips
function fillE(c,eps,title,movieData,posterUrl,backdropUrl){
    eps.forEach(function(sv){
        var sn2=sv.server_name||'Server',cnt=(sv.server_data||[]).length,icon='📺',snl=sn2.toLowerCase();
        if(snl.indexOf('thuyết minh')>-1||snl.indexOf('thuyet minh')>-1)icon='🇻🇳';
        else if(snl.indexOf('vietsub')>-1||snl.indexOf('sub')>-1)icon='📝';
        c.append('<div class="kk-sv-hd">'+icon+' '+K.E(sn2)+' ('+cnt+')</div>');
        var grid=$('<div class="kk-ep-chips"></div>');
        (sv.server_data||[]).forEach(function(ep){
            var link=ep.link_m3u8||ep.link_embed||'';
            // ✅ MOD: Xoá progress bar trong chip
            var chip=$('<div class="kk-ep-c selector'+(link?'':' off')+'">'+K.E(ep.name||'Tập')+'</div>');
            bE(chip,function(){if(link)K.playWithResume(title+' - '+(ep.name||''),link,posterUrl,backdropUrl,movieData,ep.name||'Tập');else Lampa.Noty.show('Không có link');});
            grid.append(chip);
        });
        c.append(grid);
    });
}

// ═══════════════════════════════════════
//  CSS INJECTION - ✅ MOD: CSS tích hợp đầy đủ
// ═══════════════════════════════════════
function inCSS(){
    if($('#kk-css').length)return;
    var l=document.createElement('link');l.id='kk-css';l.rel='stylesheet';l.href=CSS_URL;document.head.appendChild(l);
    $('head').append('<style id="kk-extra-css">'+
        // ✅ MOD: Country tag - nổi bật, không viền, gradient + shadow
        '.kk-country-tags{display:inline-flex;gap:6px;margin-left:8px;vertical-align:middle;}.kk-country-tag{display:inline-block;padding:4px 12px;border-radius:8px;font-size:0.75em;font-weight:800;letter-spacing:0.5px;background:linear-gradient(135deg,#e50914,#ff6b6b);color:#fff;text-transform:uppercase;box-shadow:0 3px 12px rgba(229,9,20,0.5);transition:transform 0.2s;}.kk-country-tag:hover{transform:scale(1.05);}'+
        // ✅ MOD: Cast list - grid 4 cột, 2 rows + nút xem thêm
        '.kk-cast-list{display:grid;grid-template-columns:repeat(4,1fr);gap:0.8em;}.kk-cast-card{background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden;transition:transform 0.2s,box-shadow 0.2s;}.kk-cast-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,0.3);}.kk-cast-img{position:relative;padding-top:140%;background:rgba(0,0,0,0.2);}.kk-cast-img img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;}.kk-cast-empty{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#374151,#1f2937);}.kk-cast-info{padding:0.6em 0.4em;text-align:center;}.kk-cast-name{font-weight:600;font-size:0.85em;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.kk-cast-role{font-size:0.75em;color:rgba(255,255,255,0.6);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.kk-cast-more{grid-column:1/-1;text-align:center;padding:1em;color:#01b4e4;font-weight:700;font-size:0.9em;cursor:pointer;background:rgba(1,180,228,0.1);border-radius:8px;margin-top:0.5em;transition:background 0.2s;}.kk-cast-more:hover{background:rgba(1,180,228,0.2);}'+
        // ✅ MOD: Card styles - bỏ progress bar cũ
        '.kk-card-h-img,.kk-card-img,.kk-pfc-bg{position:relative;overflow:hidden;}.kk-card-h-img img,.kk-card-img img,.kk-pfc-bg img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s;}.kk-card-h:hover .kk-card-h-img img,.kk-card:hover .kk-card-img img{transform:scale(1.05);}'+
        // Badges
        '.kk-card-q,.kk-card-ep{position:absolute;top:8px;padding:3px 10px;border-radius:6px;font-size:0.75em;font-weight:700;z-index:2;text-shadow:0 1px 3px rgba(0,0,0,0.5);}.kk-card-q{left:8px;background:linear-gradient(135deg,#e50914,#ff6b6b);color:#fff;}.kk-card-ep{right:8px;background:rgba(0,0,0,0.85);color:#fff;}.kk-card-ep--type{background:linear-gradient(135deg,#01b4e4,#00d4aa);color:#000;}'+
        '.kk-pfc-q,.kk-pfc-ep{position:absolute;top:10px;padding:4px 12px;border-radius:8px;font-size:0.8em;font-weight:700;z-index:2;text-shadow:0 1px 3px rgba(0,0,0,0.5);}.kk-pfc-q{left:10px;background:linear-gradient(135deg,#e50914,#ff6b6b);color:#fff;}.kk-pfc-ep{right:10px;background:rgba(0,0,0,0.85);color:#fff;}'+
        // Status badges
        '.kk-stg-status{margin:0.5em 1em;padding:0.8em;border-radius:10px;font-size:0.85em;font-weight:500;}.kk-stg-status--loading{background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.3);}.kk-stg-status--ok{background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);}.kk-stg-status--err{background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);}'+
        // Episode chips
        '.kk-ep-c{position:relative;padding:0.6em 0.4em;background:rgba(255,255,255,0.08);border-radius:8px;text-align:center;font-size:0.85em;font-weight:500;color:#fff;cursor:pointer;transition:background 0.2s,transform 0.2s;}.kk-ep-c:hover{background:rgba(255,255,255,0.15);transform:translateY(-2px);}.kk-ep-c.off{opacity:0.5;cursor:not-allowed;background:rgba(255,255,255,0.03);}'+
        // Continue Watching card overrides
        '.kk-card-overview{font-size:0.8em;color:rgba(255,255,255,0.75);margin-top:4px;font-weight:500;}'+
        // Grid layouts
        '.kk-grid{display:grid;gap:1em;}.kk-grid--cat-h{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(200px,1fr);gap:1em;overflow-x:auto;padding-bottom:1em;scrollbar-width:none;-ms-overflow-style:none;}.kk-grid--cat-h::-webkit-scrollbar{display:none;}'+
        // Card grid mode
        '.kk-card--grid{display:flex;flex-direction:column;}.kk-card--grid .kk-card-img{padding-top:150%;}'+
        // Responsive
        '@media(max-width:768px){.kk-cast-list{grid-template-columns:repeat(3,1fr);}.kk-grid{grid-template-columns:repeat(2,1fr)!important;}}'+
        '@media(max-width:480px){.kk-cast-list{grid-template-columns:repeat(2,1fr);}}'+
    '</style>');
}

// ═══════════════════════════════════════
//  MENU
// ═══════════════════════════════════════
function addM(){function ins(){if($('.menu__item[data-action="kkphim"]').length)return;var m=$('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>');bE(m,function(){Lampa.Activity.push({url:'',title:'KKPhim',component:'kkphim_main',page:1});});$('.menu .menu__list').first().append(m);}setTimeout(ins,500);Lampa.Listener.follow('app',function(e){if(e.type==='ready')setTimeout(ins,500);});}

// ═══════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════
function startUI(){
    inCSS();K.initPlayerHook();applyFontScale();addM();

    // ── Settings ──
    Lampa.Component.add('kkphim_settings',function(){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
        this.create=function(){cScr(scroll);var s=K.ls(),w=$('<div class="kk-stg-wrap"></div>');w.append('<div class="kk-stg-title">⚙️ Cài đặt KKPhim</div>');
        var g0=mg('📺 Nguồn phim','');var cur=s.source||'ophim';Object.keys(K.SOURCES).forEach(function(k){var sc=K.SOURCES[k];g0.append(mo(sc.name,sc.api,cur===k,function(){K.ss({source:k});comp.create();}));});w.append(g0);
        var gFont=mg('🔠 Cỡ chữ','');var fs=String(s.font_scale||'100');[{k:'85',n:'Nhỏ'},{k:'100',n:'Mặc định'},{k:'115',n:'Lớn'},{k:'130',n:'Rất lớn'}].forEach(function(o){gFont.append(mo(o.n,'',fs===o.k,function(){K.ss({font_scale:o.k});applyFontScale();comp.create();}));});w.append(gFont);
        var gImg=mg('🖼️ Ảnh','');var iq=s.img_quality||'medium';[{k:'low',n:'Thấp'},{k:'medium',n:'TB'},{k:'high',n:'Cao'}].forEach(function(o){gImg.append(mo(o.n,'',iq===o.k,function(){K.ss({img_quality:o.k});comp.create();}));});w.append(gImg);
        var gCard=mg('🃏 Card','');var cm=s.card_mode||'hgrid';[{k:'hgrid',n:'Ngang'},{k:'poster',n:'Poster'}].forEach(function(o){gCard.append(mo(o.n,'',cm===o.k,function(){K.ss({card_mode:o.k});comp.create();}));});w.append(gCard);
        var gRow=mg('📊 Phim/hàng','');var rc=s.row_count||'20';[{k:'10',n:'10'},{k:'20',n:'20'},{k:'30',n:'30'}].forEach(function(o){gRow.append(mo(o.n,'',rc===o.k,function(){K.ss({row_count:o.k});comp.create();}));});w.append(gRow);
        var gCat=mg('📋 Danh sách','');var ctm=s.cat_mode||'hgrid';[{k:'hgrid',n:'Ngang'},{k:'vgrid',n:'Dọc'}].forEach(function(o){gCat.append(mo(o.n,'',ctm===o.k,function(){K.ss({cat_mode:o.k});comp.create();}));});w.append(gCat);
        var g5=mg('🎨 Cột','');var cg=s.card_style||'3';[{k:'2',n:'2'},{k:'3',n:'3'},{k:'4',n:'4'}].forEach(function(o){g5.append(mo(o.n,'',cg===o.k,function(){K.ss({card_style:o.k});comp.create();}));});w.append(g5);
        var g6=mg('🌐 TMDB','');var cl2=s.tmdb_lang||'vi-VN';[{k:'vi-VN',n:'Tiếng Việt'},{k:'en-US',n:'English'}].forEach(function(o){g6.append(mo(o.n,'',cl2===o.k,function(){K.ss({tmdb_lang:o.k});K.resetGC();comp.create();}));});w.append(g6);
        var gE=mg('🎯 Torrent','');var ce=s.torrent_engine||'torrentio';gE.append(mo('Torrentio','',ce==='torrentio',function(){K.ss({torrent_engine:'torrentio'});comp.create();}));gE.append(mo('AIOStreams','',ce==='aio',function(){K.ss({torrent_engine:'aio'});comp.create();}));w.append(gE);
        var g1=mg('🖥️ TorrServer','');g1.append(mi('Địa chỉ','',s.torrserver_host||'Chưa cài','TS Host','torrserver_host',s));g1.append(mi('Mật khẩu','',s.torrserver_password?'••••':'Không','TS Pass','torrserver_password',s));
        var stTS=$('<div class="kk-stg-status" style="display:none"></div>');var tTS=si2('🧪 Test','','Test');bE(tTS,async function(){var h=K.tsHost();if(!h){stTS.show().attr('class','kk-stg-status kk-stg-status--err').html('❌ Chưa nhập');return;}stTS.show().attr('class','kk-stg-status kk-stg-status--loading').html('⏳...');try{var r=await fetch(K.tsU('/echo'),{method:'GET',headers:K.tsH()});stTS.attr('class','kk-stg-status kk-stg-status--'+(r.ok?'ok':'err')).html(r.ok?'✅ OK!':'❌ '+r.status);}catch(e){stTS.attr('class','kk-stg-status kk-stg-status--err').html('❌ '+K.E(e.message||''));}});g1.append(tTS).append(stTS);w.append(g1);
        var g2=mg('🧲 Torrentio','');g2.append(mi('Config','',s.torrentio_config||'Mặc định','Config','torrentio_config',s));w.append(g2);
        var gA=mg('🌊 AIO','');gA.append(mi('URL','',s.aio_url||'Chưa cài','URL','aio_url',s));w.append(gA);
        var gH=mg('🕘 Dữ liệu','');
        gH.append(si2('Xóa CW',K.getCW().length+'','Xóa')).find('.kk-stg-item:last').each(function(){bE($(this),function(){localStorage.removeItem(K.CW_KEY);Lampa.Noty.show('OK');comp.create();});});
        gH.append(si2('Xóa lịch sử',K.getHist().length+'','Xóa')).find('.kk-stg-item:last').each(function(){bE($(this),function(){localStorage.removeItem(K.HIST_KEY);Lampa.Noty.show('OK');comp.create();});});
        gH.append(si2('Xóa tiến trình',Object.keys(K.getProgress()).length+'','Xóa')).find('.kk-stg-item:last').each(function(){bE($(this),function(){localStorage.removeItem(K.PROG_KEY);Lampa.Noty.show('OK');comp.create();});});
        w.append(gH);
        var g4=$('<div class="kk-stg-group"></div>');var cl=si2('🗑️ Reset','','Reset');cl.find('.kk-stg-value').css('color','#f87171');bE(cl,function(){localStorage.removeItem(K.STG_KEY);localStorage.removeItem(K.CW_KEY);localStorage.removeItem(K.HIST_KEY);localStorage.removeItem(K.PROG_KEY);K.resetGC();applyFontScale();Lampa.Activity.backward();});g4.append(cl);w.append(g4);
        w.append('<div class="kk-stg-ver">KKPhim v4.0</div>');scroll.append(w);comp.start();};
        function mg(t,d){var g=$('<div class="kk-stg-group"></div>');g.append('<div class="kk-stg-group-title">'+t+'</div>');if(d)g.append('<div style="opacity:0.6;font-size:0.85em;margin:-0.3em 1em 0.5em;">'+K.E(d)+'</div>');return g;}
        function si2(n,d,v){return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">'+K.E(n)+'</div>'+(d?'<div class="kk-stg-label-desc">'+K.E(d)+'</div>':'')+'</div><div class="kk-stg-value">'+K.E(v)+'</div></div>');}
        function mo(n,d,on,cb){var it=si2(n,d,on?'✅':'○');if(on)it.find('.kk-stg-value').css('color','#4ade80');bE(it,cb);return it;}
        function mi(n,d,val,prompt,key,s){var it=si2(n,d,val);bE(it,function(){try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:prompt,value:s[key]||'',free:true,nosave:true},function(v){v=(v||'').trim();var o={};o[key]=v;K.ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);});return;}}catch(e){}var v=window.prompt(prompt,s[key]||'');if(v!==null){v=v.trim();var o={};o[key]=v;K.ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);}});return it;}
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
    });

    // ── Person ──
    Lampa.Component.add('kkphim_person',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,pid=obj.person_id;this.create=function(){comp.activity.loader(true);cScr(scroll);if(!pid){comp.activity.loader(false);comp.start();return;}Promise.all([K.tFetch('/person/'+pid+'?language='+K.tmLang()),K.tPersonC(pid)]).then(function(res){var p=res[0],cr=res[1],w=$('<div class="kk-detail-wrap"></div>');var av=p.profile_path?K.optimizeImgUrl(K.TMDB_W500+p.profile_path):'';w.append('<div class="kk-person-header"><div class="kk-person-avatar">'+(av?'<img src="'+av+'" loading="lazy">':'')+'</div><div class="kk-person-info"><div class="kk-person-name">'+K.E(p.name||'')+'</div></div></div>');if(cr&&cr.cast){var mv=cr.cast.filter(function(c){return c.media_type==='movie';}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});var tv=cr.cast.filter(function(c){return c.media_type==='tv';}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});if(mv.length){var r1=$('<div class="kk-row"></div>'),rl=$('<div class="kk-row-list"></div>');mv.slice(0,K.rowCount()).forEach(function(c){rl.append(mkTC(c));});r1.append('<div class="kk-row-head"><div class="kk-row-title">🎬 Phim lẻ</div></div>').append(rl);w.append(r1);}if(tv.length){var r2=$('<div class="kk-row"></div>'),rl2=$('<div class="kk-row-list"></div>');tv.slice(0,K.rowCount()).forEach(function(c){rl2.append(mkTC(c));});r2.append('<div class="kk-row-head"><div class="kk-row-title">📺 Phim bộ</div></div>').append(rl2);w.append(r2);}}scroll.append(w);comp.activity.loader(false);comp.start();}).catch(function(){comp.activity.loader(false);});};this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    // ── Main KKPhim ──
    Lampa.Component.add('kkphim_main',function(){var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,_s='';var cats=[{name:'Phim Mới',api:'danh-sach/phim-moi-cap-nhat'},{name:'Phim Bộ',api:'v1/api/danh-sach/phim-bo'},{name:'Phim Lẻ',api:'v1/api/danh-sach/phim-le'},{name:'Hoạt Hình',api:'v1/api/danh-sach/hoat-hinh'},{name:'TV Shows',api:'v1/api/danh-sach/tv-shows'}];this.create=function(){net.clear();this.activity.loader(true);cScr(scroll);var sc=K.src();_s=sc.key;var tb=$('<div class="kk-topbar"><div class="kk-topbar-title">'+K.E(sc.name)+'</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');bE($(tb.find('.kk-btn')[0]),oSearch);bE($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'Cài đặt',component:'kkphim_settings'});});scroll.append(tb);var sb=$('<div class="kk-srcbar"></div>');Object.keys(K.SOURCES).forEach(function(k){var s2=K.SOURCES[k],on=k===sc.key;var btn=$('<div class="kk-srcbtn selector '+(on?'kk-srcbtn--on':'kk-srcbtn--off')+'">'+K.E(s2.name)+'</div>');bE(btn,function(){if(on)return;K.ss({source:k});comp.create();});sb.append(btn);});var tb2=$('<div class="kk-srcbtn selector kk-srcbtn--off" style="background:rgba(1,180,228,.15);color:#01b4e4">TMDB</div>');bE(tb2,function(){Lampa.Activity.push({url:'',title:'TMDB',component:'kkphim_tmdb_main',page:1});});sb.append(tb2);scroll.append(sb);
        // ✅ MOD: Continue Watching → "🎬 Vì bạn đã xem"
        var cw=K.getCW();if(cw.length){var rowCW=$('<div class="kk-row"></div>');var moreCW=$('<div class="kk-row-more selector">Xóa</div>');bE(moreCW,function(){localStorage.removeItem(K.CW_KEY);comp.create();});rowCW.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">🎬 Vì bạn đã xem</div>').append(moreCW));rowCW.append(mkCWRow(cw.slice(0,K.rowCount())));scroll.append(rowCW);}
        var ld2=0;var cm2=K.cardMode(),cnt=cm2==='poster'?12:K.rowCount();cats.forEach(function(cat){net.silent(K.sApi()+cat.api+'?page=1',function(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(K.nm).filter(function(i){return i&&i.slug;});if(list.length){var row=$('<div class="kk-row"></div>');var mr=$('<div class="kk-row-more selector">Xem thêm</div>');bE(mr,function(){Lampa.Activity.push({url:'',title:cat.name,component:'kkphim_category',cat:cat,page_num:1,mode:'api'});});row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+K.E(cat.name)+'</div>').append(mr));row.append(mkRowList(list.slice(0,cnt),true));scroll.append(row);}ld2++;if(ld2>=cats.length){comp.activity.loader(false);comp.start();}},function(){ld2++;if(ld2>=cats.length){comp.activity.loader(false);comp.start();}});});};this.start=function(){if(_s&&_s!==K.srcKey()){comp.create();return;}aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};});

    // ── TMDB Main ──
    Lampa.Component.add('kkphim_tmdb_main',function(){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;var secs=[{name:'🔥 Xu hướng',lt:'trending_day'},{name:'🎬 Chiếu rạp',lt:'now_playing'},{name:'📅 Sắp chiếu',lt:'upcoming'},{name:'🌟 Phim lẻ',lt:'popular_movies'},{name:'📺 Phim bộ',lt:'popular_tv'},{name:'⭐ Top phim',lt:'top_movies'}];this.create=function(){comp.activity.loader(true);cScr(scroll);var tb=$('<div class="kk-topbar"><div class="kk-topbar-title" style="color:#01b4e4">TMDB</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');bE($(tb.find('.kk-btn')[0]),oTSearch);bE($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'Cài đặt',component:'kkphim_settings'});});scroll.append(tb);var sb=$('<div class="kk-srcbar"></div>');Object.keys(K.SOURCES).forEach(function(k){var s2=K.SOURCES[k];var btn=$('<div class="kk-srcbtn selector kk-srcbtn--off">'+K.E(s2.name)+'</div>');bE(btn,function(){K.ss({source:k});Lampa.Activity.push({url:'',title:'KKPhim',component:'kkphim_main',page:1});});sb.append(btn);});sb.append('<div class="kk-srcbtn kk-srcbtn--on" style="background:rgba(1,180,228,.25);color:#01b4e4">TMDB</div>');scroll.append(sb);
        // ✅ MOD: Continue Watching → "🎬 Vì bạn đã xem"
        var cw=K.getCW();if(cw.length){var rowCW=$('<div class="kk-row"></div>');var moreCW=$('<div class="kk-row-more selector">Xóa</div>');bE(moreCW,function(){localStorage.removeItem(K.CW_KEY);comp.create();});rowCW.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">🎬 Vì bạn đã xem</div>').append(moreCW));rowCW.append(mkCWRow(cw.slice(0,K.rowCount())));scroll.append(rowCW);}
        var cm2=K.cardMode(),cnt=cm2==='poster'?12:K.rowCount();var ld2=0;secs.forEach(function(sec){var fn=K.TFN[sec.lt];if(!fn){ld2++;return;}fn(1).then(function(res){var items=(res.results||[]).filter(function(i){return i.media_type!=='person';});if(items.length){var row=$('<div class="kk-row"></div>'),mr=$('<div class="kk-row-more selector">Xem thêm</div>');bE(mr,function(){Lampa.Activity.push({url:'',title:sec.name,component:'kkphim_tmdb_list',listType:sec.lt,page_num:1});});row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+K.E(sec.name)+'</div>').append(mr));row.append(mkRowList(items.slice(0,cnt),false));scroll.append(row);}ld2++;if(ld2>=secs.length){comp.activity.loader(false);comp.start();}}).catch(function(){ld2++;if(ld2>=secs.length){comp.activity.loader(false);comp.start();}});});};this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    // ── TMDB List ──
    Lampa.Component.add('kkphim_tmdb_list',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,page=obj.page_num||1;var gc=$('<div></div>'),sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>'),em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');var ld=false,done=false,cg=null;this.create=function(){comp.activity.loader(true);cScr(scroll);scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+K.E(obj.title||'TMDB')+'</div>').append(gc).append(sp).append(em));ig();var sb=scroll.render().find('.scroll__body');sb.on('scroll',function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)dl2();});dl2();};function ig(){var cm=K.catMode();if(cm==='hgrid')cg=$('<div class="kk-grid kk-grid--cat-h"></div>');else{cg=$('<div class="kk-grid"></div>');cg.css('grid-template-columns','repeat('+K.cardSt()+',minmax(0,1fr))');}gc.empty().append(cg);}function dl2(){ld=true;sp.show();var fn=K.TFN[obj.listType]||K.TFN.trending;fn(page).then(function(r){var items=(r.results||[]).filter(function(i){return i.media_type!=='person';});sp.hide();if(!items.length){done=true;em.show();}else{var cm=K.catMode();items.forEach(function(i){cg.append((cm==='hgrid'?mkTCH(i):mkTC(i)).addClass('kk-card--grid'));});page++;}ld=false;comp.activity.loader(false);comp.start();}).catch(function(){ld=false;sp.hide();em.show();comp.activity.loader(false);});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    // ── TMDB Search ──
    Lampa.Component.add('kkphim_tmdb_search',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,page=obj.page_num||1,kw=obj.keyword||'';var gc=$('<div></div>'),sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>'),em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');var ld=false,done=false,cg=null;this.create=function(){comp.activity.loader(true);cScr(scroll);ig();scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">🔍 '+K.E(kw)+'</div>').append(gc).append(sp).append(em));var sb=scroll.render().find('.scroll__body');sb.on('scroll',function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)dl2();});dl2();};function ig(){var cm=K.catMode();if(cm==='hgrid')cg=$('<div class="kk-grid kk-grid--cat-h"></div>');else{cg=$('<div class="kk-grid"></div>');cg.css('grid-template-columns','repeat('+K.cardSt()+',minmax(0,1fr))');}gc.empty().append(cg);}function dl2(){ld=true;sp.show();K.tSearchM(kw,page).then(function(r){var items=(r.results||[]).filter(function(i){return i.media_type!=='person';});sp.hide();if(!items.length){done=true;em.show();}else{var cm=K.catMode();items.forEach(function(i){cg.append((cm==='hgrid'?mkTCH(i):mkTC(i)).addClass('kk-card--grid'));});page++;}ld=false;comp.activity.loader(false);comp.start();}).catch(function(){ld=false;sp.hide();em.show();comp.activity.loader(false);});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    // ── TMDB Genre ──
    Lampa.Component.add('kkphim_tmdb_genre',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,cgid=String(obj.genre_id||'');var gc=$('<div></div>'),ld=false,md=false,td=false,mp=1,tp=1,all=[],rs={};var cg=null,sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>'),em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');function ig(){var cm=K.catMode();if(cm==='hgrid')cg=$('<div class="kk-grid kk-grid--cat-h"></div>');else{cg=$('<div class="kk-grid"></div>');cg.css('grid-template-columns','repeat('+K.cardSt()+',minmax(0,1fr))');}gc.empty().append(cg);}this.create=function(){comp.activity.loader(true);cScr(scroll);var gb=$('<div class="kk-genre-bar"></div>');scroll.append(gb);ig();scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+K.E(obj.title||'')+'</div>').append(gc).append(sp).append(em));var sb=scroll.render().find('.scroll__body');sb.on('scroll',function(){if(ld||(md&&td))return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)dl2();});Promise.all([K.lGenres('movie'),K.lGenres('tv')]).then(function(res){var mg2=[],sn={};(res[0]||[]).concat(res[1]||[]).forEach(function(g){if(!sn[g.id]){sn[g.id]=true;mg2.push(g);}});mg2.forEach(function(g){var on=String(g.id)===cgid;var ch=$('<div class="kk-genre-chip selector '+(on?'kk-genre-chip--on':'kk-genre-chip--off')+'">'+K.E(g.name)+'</div>');bE(ch,function(){Lampa.Activity.push({url:'',title:g.name,component:'kkphim_tmdb_genre',genre_id:g.id,page_num:1});});gb.append(ch);});dl2();}).catch(function(){dl2();});};function dl2(){if(ld)return;ld=true;sp.show();var ps=[];if(!md)ps.push(K.tDiscover('movie',cgid,mp).then(function(r){var items=r.results||[];if(!items.length)md=true;else{items.forEach(function(i){i.media_type='movie';});all=all.concat(items);mp++;}}).catch(function(){md=true;}));if(!td)ps.push(K.tDiscover('tv',cgid,tp).then(function(r){var items=r.results||[];if(!items.length)td=true;else{items.forEach(function(i){i.media_type='tv';});all=all.concat(items);tp++;}}).catch(function(){td=true;}));Promise.all(ps).then(function(){all.sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});var cm=K.catMode();for(var i=0;i<all.length;i++){var key=all[i].media_type+'_'+all[i].id;if(!rs[key]){rs[key]=true;cg.append((cm==='hgrid'?mkTCH(all[i]):mkTC(all[i])).addClass('kk-card--grid'));}}sp.hide();if(md&&td)em.show();ld=false;comp.activity.loader(false);comp.start();}).catch(function(){ld=false;sp.hide();comp.activity.loader(false);});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    // ── TMDB Detail ──
    Lampa.Component.add('kkphim_tmdb_detail',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,tid=obj.tmdb_id,mt=obj.media_type||'movie';this.create=function(){comp.activity.loader(true);cScr(scroll);if(!tid){comp.activity.loader(false);comp.start();return;}K.tDetFull(mt,tid).then(async function(tmdb){var logos=null;try{logos=await K.tImgFull(mt,tid);}catch(e){}var t=tmdb.title||tmdb.name||'',o=tmdb.original_title||tmdb.original_name||'',y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);Lampa.Noty.show('Tìm nguồn...');var slugs=await K.fSlugs(t,o,y);bDet(tmdb,logos,slugs);}).catch(function(e){comp.activity.loader(false);Lampa.Noty.show('Lỗi: '+(e.message||''));});};
    async function bDet(tmdb,logos,slugs){cScr(scroll);var bk=tmdb.backdrop_path?K.optimizeImgUrl(K.TMDB_IMG+tmdb.backdrop_path):'';var ps=tmdb.poster_path?K.optimizeImgUrl(K.TMDB_W500+tmdb.poster_path):'';var bkW5=tmdb.backdrop_path?K.optimizeImgUrl(K.TMDB_W500+tmdb.backdrop_path):'';var t=tmdb.title||tmdb.name||'',o2=tmdb.original_title||tmdb.original_name||'';var d=tmdb.overview||'';var isF=tmdb.overview_fallback||false;var v=tmdb.vote_average?Number(tmdb.vote_average).toFixed(1):'N/A',y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);var rt=tmdb.runtime?tmdb.runtime+' phút':'';var gs=(tmdb.genres||[]).slice(0,3).map(function(g){return g.name;}).join(' | ');var logo=K.pLogo(logos||(tmdb.images||{})),logoH='';if(logo&&logo.file_path)logoH='<div class="kk-logo"><img src="'+K.optimizeImgUrl(K.TMDB_W500+logo.file_path)+'" loading="lazy"></div>';var gh=gHtml(tmdb.genres,true),dirsArr=[],castArr=[];if(tmdb.credits){castArr=(tmdb.credits.cast||[]).slice(0,15);dirsArr=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator';}).slice(0,4);}var crewH=mkDirHtml(dirsArr,true),imdb=(tmdb.external_ids&&tmdb.external_ids.imdb_id)||null;var tH=logoH?'':'<div class="kk-title">'+K.E(t)+'</div>';
    var countries=tmdb.production_countries||[];if(!countries.length&&tmdb.origin_country)countries=tmdb.origin_country.map(function(c){return{iso_3166_1:c};});
    var hero=mkHero(bk,ps,logoH,tH,o2,{vote:v,year:y,runtime:rt,genres:gs,countries:countries});
    var body=mkBody(v,y,rt,'',gh,crewH,d,isF);body.find('.kk-genre[data-gid]').each(function(){var g=$(this);bE(g,function(){Lampa.Activity.push({url:'',title:g.attr('data-gname')||'',component:'kkphim_tmdb_genre',genre_id:g.attr('data-gid'),page_num:1});});});bindDirClicks(body);var act=$('<div class="kk-actions"></div>');
    var baseMovieData={name:t,origin_name:o2,slug:'',poster_url:ps,thumb_url:bkW5,year:y,tmdb:{id:tid,type:mt},category:tmdb.genres||[],type:mt==='tv'?'series':'single'};
    if(slugs.kkphim){var kkData=$.extend({},baseMovieData,{slug:slugs.kkphim});if(mt==='movie')act.append(bMovExp('kkphim','KKPhim',slugs.kkphim,t,'kk-src-btn--kkphim',kkData,ps,bkW5));else act.append(bTVExp('kkphim','KKPhim',slugs.kkphim,t,o2,'kk-src-btn--kkphim',kkData,ps,bkW5));}else act.append('<div class="kk-src-btn kk-src-btn--no">KKPhim – N/A</div>');
    if(slugs.ophim){var opData=$.extend({},baseMovieData,{slug:slugs.ophim});if(mt==='movie')act.append(bMovExp('ophim','OPhim',slugs.ophim,t,'kk-src-btn--ophim',opData,ps,bkW5));else act.append(bTVExp('ophim','OPhim',slugs.ophim,t,o2,'kk-src-btn--ophim',opData,ps,bkW5));}else act.append('<div class="kk-src-btn kk-src-btn--no">OPhim – N/A</div>');
    act.append(bTorBtn(mt,tid,t,ps||bkW5,imdb,baseMovieData));
    body.append(act);var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);
    // ✅ MOD: Cast với showMore=true để hiển thị 2 rows + nút "Xem thêm"
    if(castArr.length)dw.append($('<div class="kk-section"><div class="kk-block-title">Diễn viên</div></div>').append(mkCastList(castArr,true,true)));
    var simI=(tmdb.similar&&tmdb.similar.results)?tmdb.similar.results.slice(0,20):[];if(simI.length){var ss2=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">Phim tương tự</div>');var sl=$('<div class="kk-similar-list"></div>');simI.forEach(function(i){if(!i.media_type)i.media_type=mt;sl.append(mkTC(i));});ss2.append(sl);dw.append(ss2);}scroll.append(dw);comp.activity.loader(false);comp.start();}
    this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    // ── Category ──
    Lampa.Component.add('kkphim_category',function(obj){var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;var page=obj.page_num||1,title=obj.title||(obj.cat&&obj.cat.name)||'',mode=obj.mode||'api',apiPath=obj.cat?obj.cat.api:null,catSlug=obj.category_slug||'';var gc=$('<div></div>'),ld=false,done=false,cg=null,sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>'),em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');
    // ✅ MOD: Hàm ig() - Category luôn dùng 2 cột
    function ig(){
        var cm=K.catMode();
        if(cm==='hgrid')cg=$('<div class="kk-grid kk-grid--cat-h"></div>');
        else{
            cg=$('<div class="kk-grid"></div>');
            // ✅ MOD: Category luôn 2 cột cho poster to hơn
            cg.css('grid-template-columns','repeat(2,minmax(0,1fr))');
        }
        gc.empty().append(cg);
    }
    this.create=function(){this.activity.loader(true);cScr(scroll);ig();scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+K.E(title)+'</div>').append(gc).append(sp).append(em));var sb=scroll.render().find('.scroll__body');sb.on('scroll',function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)dl2();});dl2();};function hr(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(K.nm).filter(function(i){return i&&i.slug;});sp.hide();if(!list.length){done=true;em.show();comp.activity.loader(false);ld=false;comp.start();return;}var cm=K.catMode();list.forEach(function(i){cg.append((cm==='hgrid'?mkCH(i):mkC(i)).addClass('kk-card--grid'));});page++;ld=false;comp.activity.loader(false);comp.start();}function dl2(){ld=true;sp.show();var url=(mode==='category'&&catSlug)?K.sApi()+'v1/api/the-loai/'+catSlug+'?page='+page:K.sApi()+apiPath+'?page='+page;net.silent(url,hr,function(){ld=false;sp.hide();em.show();comp.activity.loader(false);});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};});

    // ── Search ──
    Lampa.Component.add('kkphim_search',function(obj){var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;var kw=obj.keyword||'',page=obj.page_num||1;var gc=$('<div></div>'),ld=false,done=false,cg=null,sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>'),em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');function ig(){var cm=K.catMode();if(cm==='hgrid')cg=$('<div class="kk-grid kk-grid--cat-h"></div>');else{cg=$('<div class="kk-grid"></div>');cg.css('grid-template-columns','repeat('+K.cardSt()+',minmax(0,1fr))');}gc.empty().append(cg);}this.create=function(){this.activity.loader(true);cScr(scroll);ig();scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">🔍 '+K.E(kw)+'</div>').append(gc).append(sp).append(em));var sb=scroll.render().find('.scroll__body');sb.on('scroll',function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)dl2();});dl2();};function hr(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(K.nm).filter(function(i){return i&&i.slug;});sp.hide();if(!list.length){done=true;em.show();comp.activity.loader(false);ld=false;comp.start();return;}var cm=K.catMode();list.forEach(function(i){cg.append((cm==='hgrid'?mkCH(i):mkC(i)).addClass('kk-card--grid'));});page++;ld=false;comp.activity.loader(false);comp.start();}function dl2(){ld=true;sp.show();net.silent(K.sApi()+'v1/api/tim-kiem?keyword='+encodeURIComponent(kw)+'&page='+page,hr,function(){net.silent(K.sApi()+'tim-kiem?keyword='+encodeURIComponent(kw)+'&page='+page,hr,function(){ld=false;sp.hide();em.show();comp.activity.loader(false);});});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};});

    // ── KKPhim Detail ──
    Lampa.Component.add('kkphim_detail',function(obj){var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),movie=K.nm(obj.movie),comp=this,rnd=false;this.create=function(){this.activity.loader(true);cScr(scroll);rnd=false;if(!movie||!movie.slug){this.activity.loader(false);comp.start();return;}K.saveHistory(movie);net.silent(K.sApi()+'phim/'+movie.slug,function(res){if(rnd)return;ldAll(K.nm(res.movie||res||{}),res.episodes||[],res.movie||res||{});},function(){comp.activity.loader(false);});};
    async function ldAll(data,eps,rawMovie){if(!data||!data.slug)data=movie;K.saveHistory(data);try{var tid=K.gTid(data),tt=K.dType(data),tmdb=null,logos=null;if(tid){try{tmdb=await K.tFetchWithFallback('/'+tt+'/'+tid+'?language='+K.tmLang()+'&append_to_response=credits,images',true);}catch(e){}try{logos=await K.tFetch('/'+tt+'/'+tid+'/images');}catch(e){}}if(!rnd){bld(data,eps,tmdb,logos,tt,rawMovie);rnd=true;}}catch(e){if(!rnd){bld(data,eps,null,null,K.dType(data),rawMovie);rnd=true;}}comp.activity.loader(false);comp.start();}
    function bld(data,eps,tmdb,logos,tt,rawMovie){cScr(scroll);var bk=K.optimizeImgUrl(K.fImg(data.thumb_url||data.poster_url)),ps=K.optimizeImgUrl(K.fImg(data.poster_url||data.thumb_url));var t=data.name||'',o2=data.origin_name||'',d=K.cDesc(data.content);var v=(data.tmdb&&data.tmdb.vote_average)||'N/A',y=data.year||'',rt=data.time||'';var dirsArr=[],castArr=[],logoH='',gs='',isF=false;
    if(tmdb){if(tmdb.backdrop_path)bk=K.optimizeImgUrl(K.TMDB_IMG+tmdb.backdrop_path);if(tmdb.poster_path)ps=K.optimizeImgUrl(K.TMDB_IMG+tmdb.poster_path);if(tmdb.title||tmdb.name)t=tmdb.title||tmdb.name;if(tmdb.overview){d=tmdb.overview;isF=tmdb.overview_fallback||false;}if(tmdb.vote_average)v=Number(tmdb.vote_average).toFixed(1);if(tmdb.release_date)y=tmdb.release_date.slice(0,4);if(tmdb.runtime)rt=tmdb.runtime+' phút';gs=(tmdb.genres||[]).slice(0,3).map(function(g){return g.name;}).join(' | ');var logo=K.pLogo(logos||tmdb.images);if(logo&&logo.file_path)logoH='<div class="kk-logo"><img src="'+K.optimizeImgUrl(K.TMDB_W500+logo.file_path)+'" loading="lazy"></div>';if(tmdb.credits){castArr=(tmdb.credits.cast||[]).slice(0,15);dirsArr=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator';}).slice(0,4);}}
    if(!dirsArr.length&&data.director){var dn=Array.isArray(data.director)?data.director:[String(data.director)];dirsArr=dn.filter(Boolean).map(function(n){return{name:n,id:null};});}
    if(!gs&&data.category&&data.category.length)gs=data.category.slice(0,3).map(function(c2){return c2.name||'';}).join(' | ');
    var countries=[];if(tmdb){countries=tmdb.production_countries||[];if(!countries.length&&tmdb.origin_country)countries=tmdb.origin_country.map(function(c){return{iso_3166_1:c};});}if(!countries.length&&rawMovie&&rawMovie.country){var rc=rawMovie.country;if(Array.isArray(rc))countries=rc.map(function(c){return{iso_3166_1:(c.slug||'').toUpperCase(),name:c.name||''};});}
    var hasTmdb=!!K.gTid(data),crewH=mkDirHtml(dirsArr,hasTmdb),gh=gHtml(data.category,false);var tH=logoH?'':'<div class="kk-title">'+K.E(t)+'</div>';
    var hero=mkHero(bk,ps,logoH,tH,o2,{vote:v,year:y,runtime:rt,genres:gs,countries:countries});
    var body=mkBody(v,y,rt,'',gh,crewH,d||'Không có mô tả',isF);body.find('.kk-genre[data-slug]').each(function(){var g=$(this);bE(g,function(){var slug=g.attr('data-slug');if(slug)Lampa.Activity.push({url:'',title:g.attr('data-title')||'',component:'kkphim_category',mode:'category',category_slug:slug,page_num:1});});});bindDirClicks(body);
    var act=$('<div class="kk-actions"></div>'),cSrc=K.src(),sCss=cSrc.key==='kkphim'?'kk-src-btn--kkphim':'kk-src-btn--ophim';
    if(eps&&eps.length)act.append(bDetExp(eps,data.name||t,cSrc.name,sCss,data,ps,bk));else act.append('<div class="kk-src-btn kk-src-btn--no">⚠️ Không có tập</div>');
    if(hasTmdb)act.append(bTorBtn(tt,K.gTid(data),data.name||t,ps||bk,null,data));
    body.append(act);var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);
    // ✅ MOD: Cast với showMore=true
    if(castArr.length)dw.append($('<div class="kk-section"><div class="kk-block-title">Diễn viên</div></div>').append(mkCastList(castArr,hasTmdb,true)));
    var pCats=data.category||[];if(pCats.length&&pCats[0]&&pCats[0].slug){var rs2=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">📺 Liên quan</div>');var rl2=$('<div class="kk-similar-list"><div class="kk-ep-ld">⏳</div></rl2>');rs2.append(rl2);dw.append(rs2);fetch(K.sApi()+'v1/api/the-loai/'+pCats[0].slug+'?page=1').then(function(r){return r.json();}).then(function(res){var items=((res&&res.data&&res.data.items)||(res&&res.items)||[]).map(K.nm).filter(function(i){return i&&i.slug&&i.slug!==data.slug;});rl2.empty();if(items.length)items.slice(0,20).forEach(function(i){rl2.append(mkC(i));});else rl2.html('Không có');}).catch(function(){rl2.empty();});}
    if(hasTmdb){var ts2=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">🎬 TMDB gợi ý</div>');var tl=$('<div class="kk-similar-list"><div class="kk-ep-ld">⏳</div></tl>');ts2.append(tl);dw.append(ts2);K.tSimilar(tt,K.gTid(data),1).then(function(res){var items=(res.results||[]).slice(0,20);tl.empty();if(items.length)items.forEach(function(i){if(!i.media_type)i.media_type=tt;tl.append(mkTC(i));});else tl.html('Không có');}).catch(function(){tl.empty();});}
    scroll.append(dw);}
    this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};});
}

// ═══════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════
function boot(){
    if(!window.KK){setTimeout(boot,100);return;}
    startUI();
}

if(window.appready)boot();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')boot();});
})();