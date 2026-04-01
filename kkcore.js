/* KKPhim Core v5.0 - Modular Architecture */
(function(){
'use strict';
if(window.KK)return;

// ══════════════════════════════════════════════════════════════
// CORE FRAMEWORK
// ══════════════════════════════════════════════════════════════
var KK=window.KK={
    version:'5.0',
    parsers:{},      // Registered parsers
    settings:{},     // Settings cache
    cache:{},        // General cache
    
    // Constants
    TMDB_TOKEN:'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0',
    TMDB_IMG:'https://image.tmdb.org/t/p/',
    STG_KEY:'kkphim_v5',
    HIST_KEY:'kkphim_hist',
    CSS_URL:'https://nguyenquocngu93.github.io/fshare/style.css'
};

// ══════════════════════════════════════════════════════════════
// PARSER REGISTRATION
// ══════════════════════════════════════════════════════════════
KK.register=function(parser){
    if(!parser||!parser.id){console.error('[KK] Invalid parser');return;}
    KK.parsers[parser.id]=parser;
    console.log('[KK] Registered:',parser.id,parser.name||'');
    
    // Save enabled state if new
    var key='p_'+parser.id;
    if(KK.get(key)===undefined)KK.set(key,parser.enabled!==false);
};

KK.getParser=function(id){return KK.parsers[id];};

KK.getEnabledParsers=function(type){
    var result=[];
    for(var id in KK.parsers){
        var p=KK.parsers[id];
        if(KK.get('p_'+id)===false)continue;
        if(type&&p.type!==type)continue;
        result.push(p);
    }
    // Sort by priority
    result.sort(function(a,b){return(b.priority||0)-(a.priority||0);});
    return result;
};

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
KK.loadSettings=function(){
    try{KK.settings=JSON.parse(localStorage.getItem(KK.STG_KEY))||{};}
    catch(e){KK.settings={};}
};
KK.get=function(k,d){KK.loadSettings();return KK.settings[k]!==undefined?KK.settings[k]:d;};
KK.set=function(k,v){KK.loadSettings();KK.settings[k]=v;try{localStorage.setItem(KK.STG_KEY,JSON.stringify(KK.settings));}catch(e){}};

// ══════════════════════════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════════════════════════
KK.getHist=function(){try{return JSON.parse(localStorage.getItem(KK.HIST_KEY))||[];}catch(e){return[];}};
KK.saveHist=function(item){
    if(!item||!item.tmdb_id)return;
    var a=KK.getHist(),id='t_'+item.tmdb_id+'_'+item.mt;
    a=a.filter(function(x){return x.id!==id;});
    a.unshift({id:id,tmdb_id:item.tmdb_id,mt:item.mt,name:item.name||'',poster:item.poster||'',year:item.year||'',time:Date.now()});
    if(a.length>50)a.length=50;
    try{localStorage.setItem(KK.HIST_KEY,JSON.stringify(a));}catch(e){}
};

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════
KK.E=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
KK.ns=function(s){return String(s||'').toLowerCase().trim().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'').replace(/\s+/g,' ');};
KK.pd=function(n){return(n<10?'0':'')+n;};
KK.W5=KK.TMDB_IMG+'w500';
KK.OI=KK.TMDB_IMG+'original';

KK.bE=function(el,fn){
    var sx=0,sy=0,mv=false,tc=false;
    el.on('touchstart',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;mv=false;}});
    el.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))mv=true;});
    el.on('touchend',function(e){if(mv)return;tc=true;e.preventDefault();e.stopPropagation();setTimeout(function(){fn.call(el[0],e);},100);setTimeout(function(){tc=false;},350);});
    el.on('click',function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();fn.call(this,e);});
    el.on('hover:enter',function(e){fn.call(this,e);});
};

KK.eSc=function(sc){
    var el=sc.render();el.css({overflow:'hidden',position:'relative',height:'100%'});
    var b=el.find('.scroll__body'),p={'transform':'none','overflow-y':'auto','overflow-x':'hidden','-webkit-overflow-scrolling':'touch',height:'100%','padding-bottom':'8em','touch-action':'pan-y'};
    b.css($.extend({position:'relative'},p));
    if(b[0])for(var k in p)b[0].style.setProperty(k,p[k],'important');
};

KK.cS=function(sc){try{sc.render().find('.scroll__body').empty();}catch(e){}};

KK.aC=function(sc){
    Lampa.Controller.add('content',{
        toggle:function(){Lampa.Controller.collectionSet(sc.render());Lampa.Controller.collectionFocus(false,sc.render());},
        left:function(){if(Navigator.canmove('left'))Navigator.move('left');else Lampa.Controller.toggle('menu');},
        right:function(){Navigator.move('right');},
        up:function(){if(Navigator.canmove('up'))Navigator.move('up');else Lampa.Controller.toggle('head');},
        down:function(){Navigator.move('down');},
        back:function(){Lampa.Activity.backward();}
    });
    setTimeout(function(){Lampa.Controller.toggle('content');Lampa.Controller.collectionSet(sc.render());Lampa.Controller.collectionFocus(false,sc.render());},0);
};

// ══════════════════════════════════════════════════════════════
// TMDB API
// ══════════════════════════════════════════════════════════════
KK.lang=function(){return KK.get('lang','vi-VN');};

KK.tmdb=async function(path){
    var r=await fetch('https://api.themoviedb.org/3'+path,{
        headers:{Authorization:'Bearer '+KK.TMDB_TOKEN,'Content-Type':'application/json'}
    });
    if(!r.ok)throw new Error('TMDB '+r.status);
    return r.json();
};

KK.tmdbSearch=async function(q,p){return KK.tmdb('/search/multi?language='+KK.lang()+'&query='+encodeURIComponent(q)+'&page='+(p||1));};
KK.tmdbDetail=async function(t,id){return KK.tmdb('/'+t+'/'+id+'?language='+KK.lang()+'&append_to_response=credits,images,similar,external_ids');};
KK.tmdbImages=async function(t,id){return KK.tmdb('/'+t+'/'+id+'/images');};
KK.tmdbSeasons=async function(id){
    try{var r=await KK.tmdb('/tv/'+id+'?language='+KK.lang());
    return(r.seasons||[]).filter(function(s){return s.season_number>0;}).map(function(s){return{sn:s.season_number,name:s.name||'Season '+s.season_number,ec:s.episode_count||0};});}
    catch(e){return[];}
};
KK.tmdbImdb=async function(t,id){try{return(await KK.tmdb('/'+t+'/'+id+'/external_ids')).imdb_id||null;}catch(e){return null;}};
KK.tmdbRec=async function(t,id,p){return KK.tmdb('/'+t+'/'+id+'/recommendations?language='+KK.lang()+'&page='+(p||1));};
KK.tmdbRand=async function(t){return KK.tmdb('/'+t+'/popular?language='+KK.lang()+'&page='+(Math.floor(Math.random()*10)+1));};
KK.tmdbPerson=async function(pid){return KK.tmdb('/person/'+pid+'/combined_credits?language='+KK.lang());};

KK.TFN={
    td:function(p){return KK.tmdb('/trending/all/day?language='+KK.lang()+'&page='+p);},
    tw:function(p){return KK.tmdb('/trending/all/week?language='+KK.lang()+'&page='+p);},
    pm:function(p){return KK.tmdb('/movie/popular?language='+KK.lang()+'&page='+p);},
    pt:function(p){return KK.tmdb('/tv/popular?language='+KK.lang()+'&page='+p);},
    tm:function(p){return KK.tmdb('/movie/top_rated?language='+KK.lang()+'&page='+p);},
    tt:function(p){return KK.tmdb('/tv/top_rated?language='+KK.lang()+'&page='+p);},
    np:function(p){return KK.tmdb('/movie/now_playing?language='+KK.lang()+'&page='+p);},
    uc:function(p){return KK.tmdb('/movie/upcoming?language='+KK.lang()+'&page='+p);},
    oa:function(p){return KK.tmdb('/tv/on_the_air?language='+KK.lang()+'&page='+p);}
};

KK.tNorm=function(i){
    if(!i)return null;
    var mt=i.media_type||(i.first_air_date?'tv':'movie');
    return{tmdb_id:i.id,mt:mt,name:i.title||i.name||'',orig:i.original_title||i.original_name||'',
        poster:i.poster_path?KK.W5+i.poster_path:'',bk:i.backdrop_path?KK.W5+i.backdrop_path:'',
        year:(i.release_date||i.first_air_date||'').slice(0,4),vote:i.vote_average?Number(i.vote_average).toFixed(1):''};
};

// ══════════════════════════════════════════════════════════════
// UI COMPONENTS
// ══════════════════════════════════════════════════════════════
KK.mkCard=function(item,mode){
    var d=KK.tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');
    var tl=d.mt==='tv'?'TV':'Film',c;
    if(mode==='h'){
        var bg=d.bk||d.poster;
        c=$('<div class="kk-card-h selector"><div class="kk-card-h-img">'+(bg?'<img src="'+bg+'" loading="lazy">':'<div class="kk-card-h-noposter">No Image</div>')+(d.vote?'<div class="kk-card-q">⭐ '+d.vote+'</div>':'')+'<div class="kk-card-ep kk-card-ep--type">'+tl+'</div></div><div class="kk-card-h-body"><div class="kk-card-name">'+KK.E(d.name)+'</div>'+(d.orig&&d.orig!==d.name?'<div class="kk-card-origin">'+KK.E(d.orig)+'</div>':'')+(d.year?'<div class="kk-card-meta"><span class="kk-card-year">'+d.year+'</span></div>':'')+'</div></div>');
    }else{
        c=$('<div class="kk-card selector"><div class="kk-card-img">'+(d.poster?'<img src="'+d.poster+'" loading="lazy">':'<div class="kk-card-noposter">No Poster</div>')+(d.vote?'<div class="kk-card-q">⭐ '+d.vote+'</div>':'')+'<div class="kk-card-ep kk-card-ep--type">'+tl+'</div></div><div class="kk-card-body"><div class="kk-card-name">'+KK.E(d.name)+'</div>'+(d.orig&&d.orig!==d.name?'<div class="kk-card-origin">'+KK.E(d.orig)+'</div>':'')+(d.year?'<div class="kk-card-meta"><span class="kk-card-year">'+d.year+'</span></div>':'')+'</div></div>');
    }
    KK.bE(c,function(){
        KK.saveHist(d);
        Lampa.Activity.push({url:'',title:d.name,component:'kk_detail',tmdb_id:d.tmdb_id,mt:d.mt,page:1});
    });
    return c;
};

KK.mkRow=function(items,title,more){
    var row=$('<div class="kk-row"></div>');
    var head=$('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+KK.E(title)+'</div>');
    if(more){
        var mr=$('<div class="kk-row-more selector">Thêm</div>');
        KK.bE(mr,more);
        head.append(mr);
    }
    row.append(head);
    var rl=$('<div class="kk-row-list"></div>');
    var cm=KK.get('cm','hgrid');
    items.forEach(function(i){rl.append(KK.mkCard(i,cm==='poster'?'v':'h'));});
    row.append(rl);
    return row;
};

KK.mkSrcBtn=function(parser,onClick){
    var css='kk-src-btn--'+parser.id;
    var btn=$('<div class="kk-src-btn '+css+' selector"><div class="kk-sb-main">▶ '+KK.E(parser.name)+'</div><div class="kk-sb-sub">'+KK.E(parser.description||'')+'</div></div>');
    var box=$('<div class="kk-ep-box"></div>');
    var wrap=$('<div style="width:100%"></div>').append(btn).append(box);
    var open=false;
    KK.bE(btn,function(){
        open=!open;
        btn.toggleClass('kk-open',open);
        box.toggleClass('kk-show',open);
        if(open&&onClick)onClick(box,btn);
    });
    return wrap;
};

// ══════════════════════════════════════════════════════════════
// STREAM DISPLAY
// ══════════════════════════════════════════════════════════════
KK.showStreams=function(streams,title,poster){
    if(!streams||!streams.length){Lampa.Noty.show('Không có link');return;}
    Lampa.Select.show({
        title:title+' ('+streams.length+')',
        items:streams.slice(0,50).map(function(s){
            var label=s.title||s.name||'Stream';
            if(s.quality)label+=' ['+s.quality+']';
            if(s.size)label+=' '+s.size;
            return{title:label,value:s};
        }),
        onSelect:async function(a){
            var s=a.value;
            // Resolve if needed
            if(s.resolve&&s.parser&&KK.parsers[s.parser]&&KK.parsers[s.parser].resolve){
                Lampa.Noty.show('Resolving...');
                try{s.url=await KK.parsers[s.parser].resolve(s.url);}catch(e){}
            }
            // Play or show
            if(s.url&&s.url.match(/\.(mp4|mkv|avi|webm|m3u8)(\?|$)/i)){
                Lampa.Player.play({title:title,url:s.url});
            }else if(s.url){
                KK.showLink(s.url);
            }else{
                Lampa.Noty.show('Không có link');
            }
        },
        onBack:function(){Lampa.Controller.toggle('content');}
    });
};

KK.showLink=function(url){
    Lampa.Select.show({
        title:'Link',
        items:[
            {title:'🔗 Mở: '+url.substring(0,50)+'...',value:'open'},
            {title:'📋 Copy',value:'copy'}
        ],
        onSelect:function(a){
            if(a.value==='open'){try{window.open(url,'_blank');}catch(e){Lampa.Noty.show(url);}}
            else{try{navigator.clipboard.writeText(url);Lampa.Noty.show('Copied!');}catch(e){Lampa.Noty.show(url);}}
        },
        onBack:function(){Lampa.Controller.toggle('content');}
    });
};

// ══════════════════════════════════════════════════════════════
// EPISODE UI
// ══════════════════════════════════════════════════════════════
KK.fillEpisodes=function(container,episodes,title){
    episodes.forEach(function(sv){
        var sn=sv.server_name||'Server',cnt=(sv.server_data||[]).length;
        var icon='📺',sl=sn.toLowerCase();
        if(sl.indexOf('thuyết minh')>-1||sl.indexOf('thuyet minh')>-1)icon='🇻🇳';
        else if(sl.indexOf('vietsub')>-1||sl.indexOf('sub')>-1)icon='📝';
        
        container.append('<div class="kk-sv-hd">'+icon+' '+KK.E(sn)+' ('+cnt+')</div>');
        var chips=$('<div class="kk-ep-chips"></div>');
        
        (sv.server_data||[]).forEach(function(ep){
            var lk=ep.link_m3u8||ep.link_embed||'';
            var chip=$('<div class="kk-ep-c selector'+(lk?'':' off')+'">'+KK.E(ep.name||'Tập')+'</div>');
            KK.bE(chip,function(){
                if(lk)Lampa.Player.play({title:title+' - '+(ep.name||''),url:lk});
                else Lampa.Noty.show('Không có link');
            });
            chips.append(chip);
        });
        container.append(chips);
    });
};

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kk_main',function(){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    var tSecs=[
        {n:'🔥 Xu hướng',lt:'td'},{n:'🌟 Tuần này',lt:'tw'},
        {n:'🎬 Chiếu rạp',lt:'np'},{n:'📅 Sắp chiếu',lt:'uc'},
        {n:'🌟 Phim lẻ hot',lt:'pm'},{n:'📺 Phim bộ hot',lt:'pt'},
        {n:'📺 Đang phát',lt:'oa'},{n:'⭐ Top phim',lt:'tm'},{n:'⭐ Top bộ',lt:'tt'}
    ];
    
    this.create=function(){
        comp.activity.loader(true);KK.cS(sc);
        
        // Topbar
        var tb=$('<div class="kk-topbar"><div class="kk-topbar-title" style="color:#01b4e4">KKPhim</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');
        KK.bE($(tb.find('.kk-btn')[0]),function(){
            try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm phim',value:'',free:true},function(kw){kw=(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'🔍 '+kw,component:'kk_search',keyword:kw,page_num:1});});return;}}catch(e){}
            var kw=window.prompt('Tìm phim:');if(kw)Lampa.Activity.push({url:'',title:'🔍 '+kw,component:'kk_search',keyword:kw,page_num:1});
        });
        KK.bE($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'Cài đặt',component:'kk_settings'});});
        sc.append(tb);
        
        // Parser buttons bar
        var parsers=KK.getEnabledParsers('vod');
        if(parsers.length){
            var pbar=$('<div class="kk-srcbar"></div>');
            parsers.forEach(function(p){
                var btn=$('<div class="kk-srcbtn selector kk-srcbtn--off">'+KK.E(p.name)+'</div>');
                if(p.homepage){
                    KK.bE(btn,function(){Lampa.Activity.push({url:'',title:p.name,component:'kk_parser_home',parser_id:p.id,page_num:1});});
                }
                pbar.append(btn);
            });
            sc.append(pbar);
        }
        
        var cnt=parseInt(KK.get('rc','20')),total=0,loaded=0;
        function chk(){loaded++;if(loaded>=total){comp.activity.loader(false);comp.start();}}
        
        // Recommendation from history
        var hist=KK.getHist();
        if(hist.length&&hist[0].tmdb_id){
            KK.tmdbRec(hist[0].mt||'movie',hist[0].tmdb_id,1).then(function(res){
                var items=(res.results||[]).slice(0,cnt);
                if(items.length){
                    items.forEach(function(i){if(!i.media_type)i.media_type=hist[0].mt||'movie';});
                    var row=KK.mkRow(items,'💡 Vì bạn xem "'+hist[0].name+'"');
                    sc.render().find('.kk-topbar').after(row);
                }
            }).catch(function(){});
        }
        
        // Random row
        var rr=$('<div class="kk-row"></div>');
        rr.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">🎲 Ngẫu nhiên</div>'));
        var rc=$('<div></div>');rr.append(rc);sc.append(rr);
        Promise.all([KK.tmdbRand('movie'),KK.tmdbRand('tv')]).then(function(res){
            var items=[];
            (res[0].results||[]).forEach(function(i){i.media_type='movie';items.push(i);});
            (res[1].results||[]).forEach(function(i){i.media_type='tv';items.push(i);});
            for(var i=items.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=items[i];items[i]=items[j];items[j]=t;}
            var rl=$('<div class="kk-row-list"></div>');
            var cm=KK.get('cm','hgrid');
            items.slice(0,cnt).forEach(function(x){rl.append(KK.mkCard(x,cm==='poster'?'v':'h'));});
            rc.replaceWith(rl);
        }).catch(function(){});
        
        // VOD Parser rows (if they have getHome)
        parsers.forEach(function(p){
            if(!p.getHome)return;
            total++;
            p.getHome(1).then(function(res){
                if(res&&res.items&&res.items.length){
                    // Convert to TMDB-like items or show as-is
                    var row=$('<div class="kk-row"></div>');
                    var mr=$('<div class="kk-row-more selector">Thêm</div>');
                    KK.bE(mr,function(){Lampa.Activity.push({url:'',title:p.name,component:'kk_parser_home',parser_id:p.id,page_num:1});});
                    row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+KK.E(p.icon||'📺')+' '+KK.E(p.name)+'</div>').append(mr));
                    var rl=$('<div class="kk-row-list"></div>');
                    res.items.slice(0,cnt).forEach(function(item){
                        var card=KK.mkParserCard(item,p);
                        rl.append(card);
                    });
                    row.append(rl);sc.append(row);
                }
                chk();
            }).catch(function(){chk();});
        });
        
        // TMDB rows
        tSecs.forEach(function(sec){
            total++;
            var fn=KK.TFN[sec.lt];if(!fn){chk();return;}
            fn(1).then(function(res){
                var items=(res.results||[]).filter(function(i){return i.media_type!=='person';});
                if(items.length){
                    var row=KK.mkRow(items.slice(0,cnt),sec.n,function(){
                        Lampa.Activity.push({url:'',title:sec.n,component:'kk_tmdb_list',lt:sec.lt,page_num:1});
                    });
                    sc.append(row);
                }
                chk();
            }).catch(function(){chk();});
        });
        
        if(total===0){comp.activity.loader(false);comp.start();}
    };
    this.start=function(){KK.aC(sc);KK.eSc(sc);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// Parser card (for VOD parsers that return their own items)
KK.mkParserCard=function(item,parser){
    var poster=item.poster||item.poster_url||item.thumb_url||'';
    if(poster&&poster.indexOf('http')!==0&&parser.imgBase)poster=parser.imgBase+poster;
    
    var c=$('<div class="kk-card-h selector"><div class="kk-card-h-img">'+(poster?'<img src="'+poster+'" loading="lazy">':'<div class="kk-card-h-noposter">'+KK.E(parser.name)+'</div>')+(item.quality?'<div class="kk-card-q">'+KK.E(item.quality)+'</div>':'')+'</div><div class="kk-card-h-body"><div class="kk-card-name">'+KK.E(item.name||item.title||'')+'</div>'+(item.year?'<div class="kk-card-meta"><span class="kk-card-year">'+item.year+'</span></div>':'')+'</div></div>');
    
    KK.bE(c,async function(){
        // Try to find on TMDB first
        Lampa.Noty.show('Tìm TMDB...');
        var tid=await KK.findTmdbId(item.name||item.title,item.origin_name,item.year,item.type);
        if(tid){
            Lampa.Activity.push({url:'',title:item.name||item.title||'',component:'kk_detail',tmdb_id:tid.id,mt:tid.mt,page:1});
        }else{
            Lampa.Noty.show('Không tìm thấy trên TMDB');
            // Could open parser detail directly if implemented
        }
    });
    return c;
};

// Find TMDB ID from title
KK.findTmdbId=async function(title,orig,year,type){
    var q=orig||title;
    try{
        var res=await KK.tmdbSearch(q,1);
        var items=(res.results||[]).filter(function(r){return r.media_type!=='person';});
        var nT=KK.ns(title),nO=KK.ns(orig||'');
        
        for(var i=0;i<items.length;i++){
            var r=items[i],rn=KK.ns(r.title||r.name||''),ro=KK.ns(r.original_title||r.original_name||'');
            var ry=(r.release_date||r.first_air_date||'').slice(0,4);
            if((nT&&(rn===nT||ro===nT))||(nO&&(rn===nO||ro===nO))){
                if(!year||!ry||year===ry||Math.abs(parseInt(year)-parseInt(ry))<=1){
                    return{id:r.id,mt:r.media_type||(r.first_air_date?'tv':'movie')};
                }
            }
        }
        if(items.length)return{id:items[0].id,mt:items[0].media_type||(items[0].first_air_date?'tv':'movie')};
    }catch(e){}
    return null;
};

// ══════════════════════════════════════════════════════════════
// SEARCH
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kk_search',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this,pg=obj.page_num||1;
    var grid=$('<div class="kk-grid kk-grid--cat-h"></div>'),ld=false,dn=false;
    var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
    var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');
    
    this.create=function(){
        comp.activity.loader(true);KK.cS(sc);
        sc.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">🔍 '+KK.E(obj.keyword||'')+'</div>').append(grid).append(sp).append(em));
        sc.render().find('.scroll__body').on('scroll',function(){if(ld||dn)return;if(this.scrollTop+this.clientHeight>=this.scrollHeight-400)doL();});
        doL();
    };
    function doL(){
        ld=true;sp.show();
        KK.tmdbSearch(obj.keyword,pg).then(function(res){
            sp.hide();
            var items=(res.results||[]).filter(function(i){return i.media_type!=='person';});
            if(!items.length){dn=true;em.show().text(pg===1?'Không có':'Đã hết');ld=false;comp.activity.loader(false);comp.start();return;}
            var cm=KK.get('ctm','hgrid');
            items.forEach(function(i){grid.append(KK.mkCard(i,cm==='hgrid'?'h':'v').addClass('kk-card--grid'));});
            pg++;ld=false;comp.activity.loader(false);comp.start();
        }).catch(function(){ld=false;sp.hide();em.show().text('Lỗi');comp.activity.loader(false);});
    }
    this.start=function(){KK.aC(sc);KK.eSc(sc);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// TMDB LIST (infinite)
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kk_tmdb_list',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this,pg=obj.page_num||1;
    var grid=$('<div class="kk-grid kk-grid--cat-h"></div>'),ld=false,dn=false;
    var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
    var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');
    
    this.create=function(){
        comp.activity.loader(true);KK.cS(sc);
        sc.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+KK.E(obj.title||'')+'</div>').append(grid).append(sp).append(em));
        sc.render().find('.scroll__body').on('scroll',function(){if(ld||dn)return;if(this.scrollTop+this.clientHeight>=this.scrollHeight-400)doL();});
        doL();
    };
    function doL(){
        ld=true;sp.show();
        var fn=KK.TFN[obj.lt]||KK.TFN.tw;
        fn(pg).then(function(res){
            sp.hide();
            var items=(res.results||[]).filter(function(i){return i.media_type!=='person';});
            if(!items.length){dn=true;em.show();ld=false;comp.activity.loader(false);comp.start();return;}
            var cm=KK.get('ctm','hgrid');
            items.forEach(function(i){grid.append(KK.mkCard(i,cm==='hgrid'?'h':'v').addClass('kk-card--grid'));});
            pg++;ld=false;comp.activity.loader(false);comp.start();
        }).catch(function(){ld=false;sp.hide();em.show().text('Lỗi');comp.activity.loader(false);});
    }
    this.start=function(){KK.aC(sc);KK.eSc(sc);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// DETAIL PAGE
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kk_detail',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this,tid=obj.tmdb_id,mt=obj.mt||'movie';
    
    this.create=function(){
        comp.activity.loader(true);KK.cS(sc);
        if(!tid){comp.activity.loader(false);comp.start();return;}
        
        KK.tmdbDetail(mt,tid).then(async function(tmdb){
            var logos=null;try{logos=await KK.tmdbImages(mt,tid);}catch(e){}
            var t=tmdb.title||tmdb.name||'',o=tmdb.original_title||tmdb.original_name||'';
            var y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);
            
            KK.saveHist({tmdb_id:tid,mt:mt,name:t,poster:tmdb.poster_path?KK.W5+tmdb.poster_path:'',year:y});
            
            // Get TMDB seasons for TV
            var tSn=mt==='tv'?await KK.tmdbSeasons(tid):null;
            var imdb=(tmdb.external_ids&&tmdb.external_ids.imdb_id)||null;
            
            buildDetail(tmdb,logos,t,o,y,tSn,imdb);
        }).catch(function(e){comp.activity.loader(false);Lampa.Noty.show('Lỗi: '+e.message);});
    };
    
    function buildDetail(tmdb,logos,t,o,y,tSn,imdb){
        KK.cS(sc);
        var bk=tmdb.backdrop_path?KK.OI+tmdb.backdrop_path:'',ps=tmdb.poster_path?KK.W5+tmdb.poster_path:'';
        var d=tmdb.overview||'Không có mô tả';
        var v=tmdb.vote_average?Number(tmdb.vote_average).toFixed(1):'N/A';
        var rt=tmdb.runtime?tmdb.runtime+' phút':'';
        var cn='';if(tmdb.production_countries&&tmdb.production_countries.length)cn=tmdb.production_countries.map(function(c){return c.iso_3166_1;}).join(', ');
        var gs=(tmdb.genres||[]).slice(0,3).map(function(g){return g.name;}).join(' | ');
        
        // Logo
        var logo=null;
        if(logos&&logos.logos&&logos.logos.length){
            logo=logos.logos.find(function(l){return l.iso_639_1==='vi';})||logos.logos.find(function(l){return l.iso_639_1==='en';})||logos.logos[0];
        }
        var logoH=logo&&logo.file_path?'<div class="kk-logo"><img src="'+KK.W5+logo.file_path+'"></div>':'';
        
        // Directors, Cast
        var dirs=[],cast=[];
        if(tmdb.credits){
            cast=(tmdb.credits.cast||[]).slice(0,15);
            dirs=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator';}).slice(0,5);
        }
        
        // Build HTML
        var tH=logoH||'<div class="kk-title">'+KK.E(t)+'</div>';
        var hero=$('<div class="kk-hero"><div class="kk-hero-backdrop">'+(bk?'<img src="'+bk+'" loading="lazy">':'')+'</div><div class="kk-hero-card"><div class="kk-hero-poster-wrap"><div class="kk-hero-poster">'+(ps?'<img src="'+ps+'" loading="lazy">':'')+'</div></div><div class="kk-hero-meta">'+(y||cn?'<div class="kk-hm-yc">'+(y?'<span class="kk-hm-year">'+y+'</span>':'')+(cn?'<span class="kk-hm-country">'+cn+'</span>':'')+'</div>':'')+tH+'<div class="kk-hm-badges"><span class="kk-hm-vote">'+v+' TMDB</span></div>'+(rt||gs?'<div class="kk-hm-rtg">'+(rt?'<span class="kk-hm-rt">'+KK.E(rt)+'</span>':'')+(gs?'<span class="kk-hm-genres">'+KK.E(gs)+'</span>':'')+'</div>':'')+'</div></div></div>');
        
        var body=$('<div class="kk-body"><div class="kk-body-desc"><span class="kk-body-desc-label">Nội dung</span><div class="kk-body-desc-text">'+KK.E(d).replace(/\n/g,'<br>')+'</div></div></div>');
        
        // === SOURCE BUTTONS ===
        var act=$('<div class="kk-actions"></div>');
        
        // Get all enabled parsers for this type
        var vodParsers=KK.getEnabledParsers('vod');
        var torParsers=KK.getEnabledParsers('torrent');
        
        // VOD Parsers (KKPhim, OPhim, etc)
        vodParsers.forEach(function(parser){
            var wrap=KK.mkSrcBtn(parser,async function(box,btn){
                box.html('<div class="kk-ep-ld">⏳ Đang tìm...</div>');
                try{
                    var result=await parser.getStreams(t,o,y,mt,tid,tSn);
                    if(!result||!result.length){
                        // Try search
                        if(parser.search){
                            var found=await parser.search(t,o,y);
                            if(found&&found.slug){
                                result=await parser.getEpisodes(found.slug,mt,tSn);
                            }
                        }
                    }
                    if(!result||!result.length){
                        box.html('<div class="kk-ep-er">❌ Không tìm thấy</div>');
                        return;
                    }
                    box.empty();
                    // result is episodes array
                    KK.fillEpisodes(box,result,t);
                }catch(e){
                    box.html('<div class="kk-ep-er">❌ '+KK.E(e.message||'Lỗi')+'</div>');
                }
            });
            act.append(wrap);
        });
        
        // Torrent Parsers
        torParsers.forEach(function(parser){
            var wrap=KK.mkSrcBtn(parser,async function(box,btn){
                box.html('<div class="kk-ep-ld">⏳ Tìm torrent...</div>');
                try{
                    var id=imdb||await KK.tmdbImdb(mt,tid);
                    if(!id){box.html('<div class="kk-ep-er">❌ Không có IMDB</div>');return;}
                    
                    if(mt==='movie'){
                        var streams=await parser.getStreams('movie',id);
                        if(!streams||!streams.length){box.html('<div class="kk-ep-er">❌ Không có</div>');return;}
                        box.empty();
                        var chips=$('<div class="kk-ep-chips"></div>');
                        streams.slice(0,30).forEach(function(s){
                            var label=(s.quality||'')+(s.size?' '+s.size:'');
                            var chip=$('<div class="kk-ep-c selector">'+KK.E(label||s.title||'Stream')+'</div>');
                            KK.bE(chip,function(){parser.play(s,t,ps);});
                            chips.append(chip);
                        });
                        box.append(chips);
                    }else{
                        // TV: show season picker
                        var sn=tSn||await KK.tmdbSeasons(tid);
                        if(sn.length>1){
                            box.empty();
                            sn.forEach(function(s){
                                var si=$('<div class="kk-sn-it selector"><span class="kk-sn-nm">📺 Season '+s.sn+'</span><span class="kk-sn-bd">'+s.ec+'</span></div>');
                                KK.bE(si,function(){showTorEps(box,parser,id,s,t,ps);});
                                box.append(si);
                            });
                        }else if(sn.length===1){
                            showTorEps(box,parser,id,sn[0],t,ps);
                        }
                    }
                }catch(e){box.html('<div class="kk-ep-er">❌ '+KK.E(e.message||'Lỗi')+'</div>');}
            });
            act.append(wrap);
        });
        
        body.append(act);
        
        var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);
        
        // Cast
        if(cast.length){
            var cs=$('<div class="kk-section"><div class="kk-block-title">Diễn viên</div></div>');
            var cl=$('<div class="kk-cast-list"></div>');
            cast.forEach(function(c){
                var av=c.profile_path?'<img src="'+KK.W5+c.profile_path+'" loading="lazy">':'';
                var cd=$('<div class="kk-cast-card selector"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+KK.E(c.name)+'</div><div class="kk-cast-role">'+KK.E(c.character||'')+'</div></div></div>');
                KK.bE(cd,function(){Lampa.Activity.push({url:'',title:c.name,component:'kk_person',pid:c.id,page:1});});
                cl.append(cd);
            });
            cs.append(cl);dw.append(cs);
        }
        
        // Similar
        var simI=(tmdb.similar&&tmdb.similar.results||[]).slice(0,20);
        if(simI.length){
            var ss=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">Tương tự</div>');
            var sl=$('<div class="kk-similar-list"></div>');
            simI.forEach(function(i){if(!i.media_type)i.media_type=mt;sl.append(KK.mkCard(i,'v'));});
            ss.append(sl);dw.append(ss);
        }
        
        sc.append(dw);comp.activity.loader(false);comp.start();
    }
    
    function showTorEps(box,parser,imdb,season,title,poster){
        box.html('<div class="kk-ep-ld">⏳ S'+season.sn+'...</div>');
        var chips=$('<div class="kk-ep-chips"></div>');
        for(var i=1;i<=season.ec;i++){
            (function(ep){
                var chip=$('<div class="kk-ep-c selector">E'+KK.pd(ep)+'</div>');
                KK.bE(chip,async function(){
                    Lampa.Noty.show('S'+KK.pd(season.sn)+'E'+KK.pd(ep)+'...');
                    try{
                        var streams=await parser.getStreams('tv',imdb,season.sn,ep);
                        if(!streams||!streams.length){Lampa.Noty.show('Không có');return;}
                        KK.showStreams(streams,title+' S'+KK.pd(season.sn)+'E'+KK.pd(ep),poster);
                    }catch(e){Lampa.Noty.show('Lỗi');}
                });
                chips.append(chip);
            })(i);
        }
        box.empty();
        box.append('<div class="kk-sv-hd">📺 Season '+season.sn+' ('+season.ec+' tập)</div>');
        box.append(chips);
    }
    
    this.start=function(){KK.aC(sc);KK.eSc(sc);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// PERSON
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kk_person',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this,pid=obj.pid;
    this.create=function(){
        comp.activity.loader(true);KK.cS(sc);if(!pid){comp.activity.loader(false);comp.start();return;}
        Promise.all([KK.tmdb('/person/'+pid+'?language='+KK.lang()),KK.tmdbPerson(pid)]).then(function(res){
            var p=res[0],cr=res[1],w=$('<div class="kk-detail-wrap"></div>');
            var av=p.profile_path?KK.W5+p.profile_path:'';
            w.append('<div class="kk-person-header"><div class="kk-person-avatar">'+(av?'<img src="'+av+'">':'')+'</div><div class="kk-person-info"><div class="kk-person-name">'+KK.E(p.name||'')+'</div>'+(p.birthday?'<div class="kk-person-meta">🎂 '+KK.E(p.birthday)+'</div>':'')+'</div></div>');
            if(cr&&cr.cast){var cnt=parseInt(KK.get('rc','20'));
                ['movie','tv'].forEach(function(mt2){
                    var items=cr.cast.filter(function(c){return c.media_type===mt2;}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});
                    if(items.length){
                        var row=KK.mkRow(items.slice(0,cnt),mt2==='movie'?'🎬 Phim lẻ':'📺 Phim bộ');
                        w.append(row);
                    }
                });
            }
            sc.append(w);comp.activity.loader(false);comp.start();
        }).catch(function(){comp.activity.loader(false);});
    };
    this.start=function(){KK.aC(sc);KK.eSc(sc);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kk_settings',function(){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    this.create=function(){
        KK.cS(sc);var w=$('<div class="kk-stg-wrap"></div>');
        w.append('<div class="kk-stg-title">⚙️ Cài đặt KKPhim</div>');
        
        function mg(t){return $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">'+t+'</div>');}
        function si(n,d,v){return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">'+KK.E(n)+'</div>'+(d?'<div class="kk-stg-label-desc">'+KK.E(d)+'</div>':'')+'</div><div class="kk-stg-value">'+KK.E(v)+'</div></div>');}
        function mo(n,d,on,cb){var it=si(n,d,on?'✅':'○');if(on)it.find('.kk-stg-value').css('color','#4ade80');KK.bE(it,cb);return it;}
        
        // Parsers on/off
        var g1=mg('📺 Nguồn phim');
        for(var id in KK.parsers){
            (function(p){
                var on=KK.get('p_'+p.id)!==false;
                g1.append(mo(p.name,p.description||p.type,on,function(){
                    KK.set('p_'+p.id,!on);
                    comp.create();
                }));
            })(KK.parsers[id]);
        }
        w.append(g1);
        
        // Card mode
        var g2=mg('🃏 Kiểu card');var cm=KK.get('cm','hgrid');
        [{k:'hgrid',n:'Ngang'},{k:'poster',n:'Poster'}].forEach(function(o){
            g2.append(mo(o.n,'',cm===o.k,function(){KK.set('cm',o.k);comp.create();}));
        });
        w.append(g2);
        
        // Row count
        var g3=mg('📊 Số phim/row');var rc=KK.get('rc','20');
        ['10','15','20','30'].forEach(function(v){
            g3.append(mo(v+' phim','',rc===v,function(){KK.set('rc',v);comp.create();}));
        });
        w.append(g3);
        
        // Language
        var g4=mg('🌐 Ngôn ngữ TMDB');var cl=KK.get('lang','vi-VN');
        [{k:'vi-VN',n:'Tiếng Việt'},{k:'en-US',n:'English'}].forEach(function(o){
            g4.append(mo(o.n,o.k,cl===o.k,function(){KK.set('lang',o.k);comp.create();}));
        });
        w.append(g4);
        
        // Parser-specific settings
        for(var pid in KK.parsers){
            var p=KK.parsers[pid];
            if(p.settings){
                var gp=mg('⚙️ '+p.name);
                p.settings.forEach(function(s){
                    var val=KK.get(s.key,s.default||'');
                    var it=si(s.name,s.description||'',val||'Chưa cài');
                    KK.bE(it,function(){
                        try{if(Lampa.Input&&Lampa.Input.edit){
                            Lampa.Input.edit({title:s.name,value:val,free:true,nosave:true},function(v){
                                v=(v||'').trim();KK.set(s.key,v);
                                it.find('.kk-stg-value').text(v||'Chưa cài');
                            });return;
                        }}catch(e){}
                        var v=window.prompt(s.name,val);
                        if(v!==null){KK.set(s.key,v.trim());it.find('.kk-stg-value').text(v.trim()||'Chưa cài');}
                    });
                    gp.append(it);
                });
                w.append(gp);
            }
        }
        
        // Clear
        var g5=mg('🗑️ Dữ liệu');
        var clr=si('Xóa toàn bộ','Khôi phục mặc định','Xóa');
        clr.find('.kk-stg-value').css('color','#f87171');
        KK.bE(clr,function(){
            localStorage.removeItem(KK.STG_KEY);
            localStorage.removeItem(KK.HIST_KEY);
            Lampa.Activity.backward();
        });
        g5.append(clr);w.append(g5);
        
        w.append('<div class="kk-stg-ver">KKPhim Core v'+KK.version+'</div>');
        sc.append(w);comp.start();
    };
    this.start=function(){KK.aC(sc);KK.eSc(sc);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════════════════
function boot(){
    // CSS
    if(!$('#kk-css').length){
        var l=document.createElement('link');l.id='kk-css';l.rel='stylesheet';l.href=KK.CSS_URL;
        document.head.appendChild(l);
    }
    // Menu
    setTimeout(function(){
        if($('.menu__item[data-action="kkphim"]').length)return;
        var m=$('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>');
        KK.bE(m,function(){Lampa.Activity.push({url:'',title:'KKPhim',component:'kk_main',page:1});});
        $('.menu .menu__list').first().append(m);
    },500);
    
    console.log('[KK] Core v'+KK.version+' loaded, parsers:',Object.keys(KK.parsers).join(', ')||'none');
}

if(window.appready)boot();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')boot();});

})();