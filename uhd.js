/* UHDMovies Parser v1.0 - Standalone addon for KKPhim Plugin */
(function(){
'use strict';
if(window.__uhdmovies_parser)return;
window.__uhdmovies_parser=true;

// ══════════════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════════════
var BASE='https://uhdmovies.ink';
var CORS_PROXIES=[
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
];
var STG_KEY='uhdmovies_stg';

function ls(){try{return JSON.parse(localStorage.getItem(STG_KEY))||{};}catch(e){return{};}}
function ss(o){try{var c=ls();for(var k in o)c[k]=o[k];localStorage.setItem(STG_KEY,JSON.stringify(c));}catch(e){}}
function gProxy(){return ls().proxy||CORS_PROXIES[0];}
function customProxy(){return ls().custom_proxy||'';}

// ══════════════════════════════════════════════════════════════
// FETCH WITH CORS PROXY
// ══════════════════════════════════════════════════════════════
async function pFetch(url,retries){
    retries=retries||0;
    var cp=customProxy();
    var proxies=cp?[cp].concat(CORS_PROXIES):CORS_PROXIES;
    
    // Try direct first
    try{
        var r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}});
        if(r.ok)return await r.text();
    }catch(e){}
    
    // Try proxies
    for(var i=0;i<proxies.length;i++){
        try{
            var r2=await fetch(proxies[i]+encodeURIComponent(url));
            if(r2.ok)return await r2.text();
        }catch(e){}
    }
    throw new Error('Không thể truy cập: '+url);
}

// ══════════════════════════════════════════════════════════════
// HTML PARSER HELPERS
// ══════════════════════════════════════════════════════════════
function parseHTML(html){
    var doc=new DOMParser().parseFromString(html,'text/html');
    return doc;
}

function qAll(doc,sel){return Array.from(doc.querySelectorAll(sel));}
function q(doc,sel){return doc.querySelector(sel);}
function attr(el,name){return el?el.getAttribute(name)||'':'';}
function txt(el){return el?el.textContent.trim():'';}

// ══════════════════════════════════════════════════════════════
// PARSE HOMEPAGE / CATEGORY
// ══════════════════════════════════════════════════════════════
async function fetchList(path,page){
    var url=BASE+(path||'')+'/page/'+(page||1)+'/';
    var html=await pFetch(url);
    var doc=parseHTML(html);
    var items=[];
    
    // UHDMovies uses article/post cards
    var articles=qAll(doc,'article.post-item, .blog-items .post-item, .gridlove-posts .entry-item, article');
    if(!articles.length)articles=qAll(doc,'.entry, .post, .item');
    
    articles.forEach(function(art){
        var item=parseArticle(art);
        if(item)items.push(item);
    });
    
    // Check pagination
    var hasNext=false;
    var nextLink=q(doc,'.next.page-numbers, a.next, .nav-next a, .pagination .next');
    if(nextLink)hasNext=true;
    
    return{items:items,hasNext:hasNext};
}

function parseArticle(art){
    var link=q(art,'a[href]');
    if(!link)return null;
    var href=attr(link,'href')||'';
    if(!href||href.indexOf(BASE)===-1)return null;
    
    var img=q(art,'img');
    var poster=attr(img,'data-lazy-src')||attr(img,'data-src')||attr(img,'src')||'';
    
    var titleEl=q(art,'h2, h3, .entry-title, .post-title');
    var title=txt(titleEl)||txt(link)||'';
    
    // Extract info from title
    var info=parseTitle(title);
    
    return{
        url:href,
        slug:href.replace(BASE,'').replace(/^\/|\/$/g,''),
        title:title,
        name:info.name,
        year:info.year,
        quality:info.quality,
        poster:poster,
        type:info.type
    };
}

function parseTitle(title){
    var name=title,year='',quality='',type='movie';
    
    // Extract year
    var ym=title.match(/\((\d{4})\)/);
    if(ym){year=ym[1];name=name.replace(ym[0],'').trim();}
    else{ym=title.match(/\b(19|20)\d{2}\b/);if(ym)year=ym[0];}
    
    // Extract quality
    var qm=title.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?\+?|BluRay|WEB-?DL|WEBRip|REMUX)\b/gi);
    if(qm)quality=qm.join(' ');
    
    // Clean name
    name=name.replace(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?\+?|BluRay|WEB-?DL|WEBRip|REMUX|Download|Free|Full|Movie|Series)\b/gi,'')
        .replace(/[\[\](){}|–—-]+/g,' ')
        .replace(/\s+/g,' ').trim();
    
    // Detect type
    if(title.match(/\b(S\d{1,2}|Season|Complete|Episode|Series|TV)\b/i))type='tv';
    
    return{name:name,year:year,quality:quality,type:type};
}

// ══════════════════════════════════════════════════════════════
// PARSE DETAIL PAGE - Extract download links
// ══════════════════════════════════════════════════════════════
async function fetchDetail(url){
    var html=await pFetch(url);
    var doc=parseHTML(html);
    
    var result={
        title:txt(q(doc,'h1, .entry-title, .post-title'))||'',
        poster:'',
        content:'',
        links:[],    // {label, url, quality, size, type}
        info:{}
    };
    
    // Poster
    var mainImg=q(doc,'.entry-content img, .post-content img, article img');
    if(mainImg)result.poster=attr(mainImg,'data-lazy-src')||attr(mainImg,'data-src')||attr(mainImg,'src')||'';
    
    // Content/description
    var content=q(doc,'.entry-content, .post-content, article .content');
    if(content)result.content=txt(content).substring(0,500);
    
    // Parse info box
    var infoText=result.content;
    var im;
    if((im=infoText.match(/IMDb[:\s]*([\d.]+)/i)))result.info.imdb_rating=im[1];
    if((im=infoText.match(/Genre[s]?[:\s]*([^\n]+)/i)))result.info.genres=im[1].trim();
    if((im=infoText.match(/Director[s]?[:\s]*([^\n]+)/i)))result.info.director=im[1].trim();
    if((im=infoText.match(/Star[s]?[:\s]*([^\n]+)/i)))result.info.stars=im[1].trim();
    if((im=infoText.match(/Runtime[:\s]*([^\n]+)/i)))result.info.runtime=im[1].trim();
    
    // ── Extract download links ──
    // UHDMovies typically has links in buttons, tables, or formatted sections
    result.links=extractLinks(doc,content);
    
    return result;
}

function extractLinks(doc,contentEl){
    var links=[];
    var seen={};
    
    if(!contentEl)return links;
    
    // Method 1: Links with specific classes/patterns
    var allLinks=qAll(contentEl,'a[href]');
    
    allLinks.forEach(function(a){
        var href=attr(a,'href');
        var text=txt(a);
        if(!href||seen[href])return;
        
        // Filter: only download/drive/streaming links
        if(!isDownloadLink(href))return;
        
        seen[href]=true;
        var info=parseLinkContext(a,text,href);
        links.push(info);
    });
    
    // Method 2: Buttons
    var buttons=qAll(contentEl,'button[onclick], .btn[onclick], [class*="button"] a');
    buttons.forEach(function(btn){
        var onclick=attr(btn,'onclick')||'';
        var m=onclick.match(/window\.open\(['"]([^'"]+)['"]/)||onclick.match(/location\.href=['"]([^'"]+)['"]/);
        if(m&&!seen[m[1]]){
            seen[m[1]]=true;
            links.push(parseLinkContext(btn,txt(btn),m[1]));
        }
    });
    
    // Method 3: Look for grouped sections (quality headers)
    var headings=qAll(contentEl,'h2, h3, h4, strong, b, p');
    var currentGroup='';
    headings.forEach(function(h){
        var t=txt(h);
        // Check if it's a quality header
        if(t.match(/\b(2160p|4K|1080p|720p|480p|UHD|BluRay|WEB-?DL|REMUX|HDR)\b/i)){
            currentGroup=t;
        }
        // Check links right after/inside
        var nextLinks=qAll(h,'a[href]');
        if(!nextLinks.length){
            var next=h.nextElementSibling;
            while(next&&(next.tagName==='P'||next.tagName==='DIV'||next.tagName==='A')){
                if(next.tagName==='A')nextLinks.push(next);
                else nextLinks=nextLinks.concat(qAll(next,'a[href]'));
                next=next.nextElementSibling;
                if(next&&next.tagName.match(/^H[2-4]$/))break;
            }
        }
        nextLinks.forEach(function(a2){
            var href2=attr(a2,'href');
            if(href2&&!seen[href2]&&isDownloadLink(href2)){
                seen[href2]=true;
                var info2=parseLinkContext(a2,txt(a2),href2);
                if(currentGroup&&!info2.quality){
                    var qm2=currentGroup.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?\+?|BluRay|WEB-?DL|REMUX)\b/gi);
                    if(qm2)info2.quality=qm2.join(' ');
                }
                if(currentGroup)info2.group=currentGroup;
                links.push(info2);
            }
        });
    });
    
    return links;
}

function isDownloadLink(href){
    if(!href)return false;
    // Include: drive, hub, shorteners, direct downloads
    var dominated=[
        /drive\.google/i,/gdrive/i,/gdtot/i,/gdflix/i,
        /hubcloud/i,/hubdrive/i,
        /filepress/i,/filebox/i,
        /1fichier/i,/uptobox/i,/rapidgator/i,
        /mega\.nz/i,/mediafire/i,
        /workers\.dev/i,/index\.php/i,
        /pixeldrain/i,/gofile/i,/streamtape/i,
        /instant-link/i,/link\.mkvcage/i,
        /shorte/i,/bit\.ly/i,/ouo\.io/i,
        /howblogs/i,/driveseed/i,/kolop/i
    ];
    for(var i=0;i<dominated.length;i++){
        if(dominated[i].test(href))return true;
    }
    // Exclude: same site, social, images
    if(href.match(/\.(jpg|jpeg|png|gif|svg|webp)(\?|$)/i))return false;
    if(href.indexOf(BASE)===0)return false;
    if(href.match(/(facebook|twitter|telegram|instagram|t\.me)\./i))return false;
    // If external link with some download keywords
    if(href.match(/download|dl|direct|link|get/i))return true;
    return false;
}

function parseLinkContext(el,text,href){
    var quality='',size='',label=text||'Download';
    
    // Extract quality from text or nearby
    var qm=label.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?\+?|BluRay|WEB-?DL|REMUX)\b/gi);
    if(qm)quality=qm.join(' ');
    
    // Extract size
    var sm=label.match(/\b([\d.]+)\s*(GB|MB|TB)\b/i);
    if(sm)size=sm[1]+' '+sm[2].toUpperCase();
    
    // Try parent context for more info
    var parent=el.parentElement;
    if(parent){
        var pt=txt(parent);
        if(!quality){var qm2=pt.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?\+?|BluRay|WEB-?DL|REMUX)\b/gi);if(qm2)quality=qm2.join(' ');}
        if(!size){var sm2=pt.match(/\b([\d.]+)\s*(GB|MB|TB)\b/i);if(sm2)size=sm2[1]+' '+sm2[2].toUpperCase();}
    }
    
    // Detect link type
    var type='unknown';
    if(href.match(/drive\.google|gdrive|gdtot|gdflix|driveseed/i))type='gdrive';
    else if(href.match(/hubcloud|hubdrive/i))type='hubcloud';
    else if(href.match(/mega\.nz/i))type='mega';
    else if(href.match(/mediafire/i))type='mediafire';
    else if(href.match(/pixeldrain/i))type='pixeldrain';
    else if(href.match(/instant|howblogs|kolop/i))type='shortener';
    else if(href.match(/workers\.dev|index/i))type='direct';
    
    // Clean label
    label=label.replace(/\s+/g,' ').trim();
    if(!label||label.length>100)label=(quality||'Download')+' '+(size||'');
    
    return{
        label:label.trim(),
        url:href,
        quality:quality,
        size:size,
        type:type,
        group:''
    };
}

// ══════════════════════════════════════════════════════════════
// SHORTENER/REDIRECT RESOLVER (basic)
// ══════════════════════════════════════════════════════════════
async function resolveLink(url){
    // Try to follow redirects via proxy
    try{
        var html=await pFetch(url);
        var doc=parseHTML(html);
        
        // Common patterns
        // 1. Meta refresh
        var meta=q(doc,'meta[http-equiv="refresh"]');
        if(meta){var cm=attr(meta,'content').match(/url=(.+)/i);if(cm)return cm[1].trim();}
        
        // 2. JS redirect
        var scripts=qAll(doc,'script');
        for(var i=0;i<scripts.length;i++){
            var st=txt(scripts[i]);
            var m=st.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/)||
                st.match(/window\.open\(['"]([^'"]+)['"]/)||
                st.match(/location\.replace\(['"]([^'"]+)['"]/);
            if(m)return m[1];
        }
        
        // 3. Direct link on page
        var directLink=q(doc,'a[href*="drive.google"], a[href*="workers.dev"], a[href*="pixeldrain"], a.btn[href], a.download[href]');
        if(directLink)return attr(directLink,'href');
        
        // 4. Form action
        var form=q(doc,'form[action]');
        if(form){
            var action=attr(form,'action');
            if(action&&action.indexOf('http')===0)return action;
        }
        
    }catch(e){}
    return url; // Return original if can't resolve
}

// ══════════════════════════════════════════════════════════════
// SEARCH
// ══════════════════════════════════════════════════════════════
async function searchUHD(keyword,page){
    var url=BASE+'/?s='+encodeURIComponent(keyword)+(page>1?'&paged='+page:'');
    var html=await pFetch(url);
    var doc=parseHTML(html);
    var items=[];
    
    var articles=qAll(doc,'article, .post-item, .entry, .search-item');
    articles.forEach(function(art){
        var item=parseArticle(art);
        if(item)items.push(item);
    });
    
    var hasNext=!!q(doc,'.next.page-numbers, a.next');
    return{items:items,hasNext:hasNext};
}

// ══════════════════════════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════════════════════════
var CATS=[
    {name:'🎬 Movies',path:'/movies'},
    {name:'📺 TV Shows',path:'/tv-shows'},
    {name:'🎥 Dual Audio',path:'/dual-audio-movies'},
    {name:'📀 4K UHD',path:'/2160p-movies'},
    {name:'💿 1080p',path:'/1080p-movies'},
    {name:'🎞️ Bollywood',path:'/bollywood-movies'},
    {name:'🌏 Hollywood',path:'/hollywood-movies'},
    {name:'🇰🇷 Korean',path:'/korean-movies'},
    {name:'🎭 Anime',path:'/anime'}
];

// ══════════════════════════════════════════════════════════════
// LAMPA COMPONENTS
// ══════════════════════════════════════════════════════════════
var E=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};

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

// ── Card ──
function mkUC(item){
    var h='<div class="kk-card-h selector"><div class="kk-card-h-img">'
        +(item.poster?'<img src="'+item.poster+'" loading="lazy">':'<div class="kk-card-h-noposter">UHD</div>')
        +(item.quality?'<div class="kk-card-q">'+E(item.quality)+'</div>':'')
        +'<div class="kk-card-ep kk-card-ep--type">'+(item.type==='tv'?'TV':'Film')+'</div>'
        +'</div><div class="kk-card-h-body">'
        +'<div class="kk-card-name">'+E(item.name||item.title)+'</div>'
        +(item.year?'<div class="kk-card-meta"><span class="kk-card-year">'+item.year+'</span></div>':'')
        +'</div></div>';
    var c=$(h);
    bE(c,function(){
        Lampa.Activity.push({
            url:'',title:item.name||item.title||'',
            component:'uhd_detail',
            uhd_url:item.url,
            uhd_item:item,page:1
        });
    });
    return c;
}

// ── Main page ──
Lampa.Component.add('uhd_main',function(){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    this.create=function(){
        comp.activity.loader(true);cS(sc);
        var tb=$('<div class="kk-topbar"><div class="kk-topbar-title" style="color:#e50914">UHDMovies</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');
        bE($(tb.find('.kk-btn')[0]),function(){
            try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm UHDMovies',value:'',free:true},function(kw){kw=(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'🔍 '+kw,component:'uhd_search',keyword:kw,page_num:1});});return;}}catch(e){}
            var kw=window.prompt('Tìm UHDMovies:');if(kw)Lampa.Activity.push({url:'',title:'🔍 '+kw,component:'uhd_search',keyword:kw,page_num:1});
        });
        bE($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'UHD Settings',component:'uhd_stg'});});
        sc.append(tb);

        // Category buttons
        var catBar=$('<div class="kk-srcbar"></div>');
        CATS.forEach(function(cat){
            var btn=$('<div class="kk-srcbtn selector kk-srcbtn--off">'+E(cat.name)+'</div>');
            bE(btn,function(){Lampa.Activity.push({url:'',title:cat.name,component:'uhd_list',cat_path:cat.path,page_num:1});});
            catBar.append(btn);
        });
        sc.append(catBar);

        // Load homepage
        var loaded=0,total=3;
        function chk(){loaded++;if(loaded>=total){comp.activity.loader(false);comp.start();}}
        
        // Latest
        fetchList('',1).then(function(res){
            if(res.items.length){
                var row=$('<div class="kk-row"></div>');
                var mr=$('<div class="kk-row-more selector">Thêm</div>');
                bE(mr,function(){Lampa.Activity.push({url:'',title:'Latest',component:'uhd_list',cat_path:'',page_num:1});});
                row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">🆕 Mới nhất</div>').append(mr));
                var rl=$('<div class="kk-row-list"></div>');
                res.items.slice(0,20).forEach(function(i){rl.append(mkUC(i));});
                row.append(rl);sc.append(row);
            }chk();
        }).catch(function(){chk();});

        // 4K
        fetchList('/2160p-movies',1).then(function(res){
            if(res.items.length){
                var row=$('<div class="kk-row"></div>');
                var mr=$('<div class="kk-row-more selector">Thêm</div>');
                bE(mr,function(){Lampa.Activity.push({url:'',title:'4K UHD',component:'uhd_list',cat_path:'/2160p-movies',page_num:1});});
                row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">📀 4K UHD</div>').append(mr));
                var rl=$('<div class="kk-row-list"></div>');
                res.items.slice(0,20).forEach(function(i){rl.append(mkUC(i));});
                row.append(rl);sc.append(row);
            }chk();
        }).catch(function(){chk();});

        // TV Shows
        fetchList('/tv-shows',1).then(function(res){
            if(res.items.length){
                var row=$('<div class="kk-row"></div>');
                var mr=$('<div class="kk-row-more selector">Thêm</div>');
                bE(mr,function(){Lampa.Activity.push({url:'',title:'TV Shows',component:'uhd_list',cat_path:'/tv-shows',page_num:1});});
                row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">📺 TV Shows</div>').append(mr));
                var rl=$('<div class="kk-row-list"></div>');
                res.items.slice(0,20).forEach(function(i){rl.append(mkUC(i));});
                row.append(rl);sc.append(row);
            }chk();
        }).catch(function(){chk();});
    };
    this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
});

// ── Category list (infinite scroll) ──
Lampa.Component.add('uhd_list',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    var pg=obj.page_num||1,ld=false,dn=false;
    var grid=$('<div class="kk-grid kk-grid--cat-h"></div>');
    var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
    var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');
    
    this.create=function(){
        comp.activity.loader(true);cS(sc);
        sc.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(obj.title||'UHDMovies')+'</div>').append(grid).append(sp).append(em));
        sc.render().find('.scroll__body').on('scroll',function(){if(ld||dn)return;if(this.scrollTop+this.clientHeight>=this.scrollHeight-400)doL();});
        doL();
    };
    function doL(){
        ld=true;sp.show();
        fetchList(obj.cat_path||'',pg).then(function(res){
            sp.hide();
            if(!res.items.length){dn=true;em.show();ld=false;comp.activity.loader(false);comp.start();return;}
            res.items.forEach(function(i){grid.append(mkUC(i).addClass('kk-card--grid'));});
            if(!res.hasNext)dn=true;
            pg++;ld=false;comp.activity.loader(false);comp.start();
        }).catch(function(e){ld=false;sp.hide();em.show().text('Lỗi: '+e.message);comp.activity.loader(false);comp.start();});
    }
    this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
});

// ── Search ──
Lampa.Component.add('uhd_search',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    var pg=obj.page_num||1,ld=false,dn=false;
    var grid=$('<div class="kk-grid kk-grid--cat-h"></div>');
    var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
    var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');
    
    this.create=function(){
        comp.activity.loader(true);cS(sc);
        sc.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">🔍 '+E(obj.keyword||'')+'</div>').append(grid).append(sp).append(em));
        sc.render().find('.scroll__body').on('scroll',function(){if(ld||dn)return;if(this.scrollTop+this.clientHeight>=this.scrollHeight-400)doL();});
        doL();
    };
    function doL(){
        ld=true;sp.show();
        searchUHD(obj.keyword,pg).then(function(res){
            sp.hide();
            if(!res.items.length){dn=true;em.show().text(pg===1?'Không có kết quả':'Đã hết');ld=false;comp.activity.loader(false);comp.start();return;}
            res.items.forEach(function(i){grid.append(mkUC(i).addClass('kk-card--grid'));});
            if(!res.hasNext)dn=true;
            pg++;ld=false;comp.activity.loader(false);comp.start();
        }).catch(function(e){ld=false;sp.hide();em.show().text('Lỗi: '+e.message);comp.activity.loader(false);comp.start();});
    }
    this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
});

// ── Detail page ──
Lampa.Component.add('uhd_detail',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    
    this.create=function(){
        comp.activity.loader(true);cS(sc);
        var url=obj.uhd_url;
        if(!url){comp.activity.loader(false);comp.start();return;}
        
        fetchDetail(url).then(function(det){
            var item=obj.uhd_item||{};
            var info=parseTitle(det.title);
            var w=$('<div class="kk-detail-wrap"></div>');
            
            // Hero
            var poster=det.poster||item.poster||'';
            w.append('<div class="kk-hero"><div class="kk-hero-backdrop">'+(poster?'<img src="'+poster+'" loading="lazy">':'')+'</div><div class="kk-hero-card"><div class="kk-hero-poster-wrap"><div class="kk-hero-poster">'+(poster?'<img src="'+poster+'" loading="lazy">':'')+'</div></div><div class="kk-hero-meta"><div class="kk-title">'+E(info.name||det.title)+'</div><div class="kk-hm-badges">'+(info.quality?'<span class="kk-hm-badge">'+E(info.quality)+'</span>':'')+(info.year?'<span class="kk-hm-badge">'+E(info.year)+'</span>':'')+(det.info.imdb_rating?'<span class="kk-hm-vote">⭐ '+E(det.info.imdb_rating)+'</span>':'')+'</div>'+(det.info.runtime?'<div class="kk-hm-rtg"><span class="kk-hm-rt">'+E(det.info.runtime)+'</span></div>':'')+'</div></div></div>');
            
            // Info
            var body=$('<div class="kk-body"></div>');
            if(det.info.genres)body.append('<div class="kk-body-genres"><span class="kk-genre">'+E(det.info.genres)+'</span></div>');
            if(det.info.director)body.append('<div class="kk-crew"><div class="kk-crew-info"><span class="kk-crew-label">Director</span><span class="kk-crew-name">'+E(det.info.director)+'</span></div></div>');
            if(det.info.stars)body.append('<div class="kk-body-desc"><span class="kk-body-desc-label">Stars</span><div class="kk-body-desc-text">'+E(det.info.stars)+'</div></div>');
            
            // Download links
            if(det.links.length){
                var act=$('<div class="kk-actions"></div>');
                act.append('<div class="kk-block-title" style="width:100%;margin-bottom:0.5em">📥 Download Links ('+det.links.length+')</div>');
                
                // Group by quality
                var groups={};
                det.links.forEach(function(lk){
                    var key=lk.group||lk.quality||'Other';
                    if(!groups[key])groups[key]=[];
                    groups[key].push(lk);
                });
                
                Object.keys(groups).forEach(function(gk){
                    var gLinks=groups[gk];
                    if(Object.keys(groups).length>1){
                        act.append('<div class="kk-sv-hd" style="width:100%">'+E(gk)+' ('+gLinks.length+')</div>');
                    }
                    
                    var chips=$('<div class="kk-ep-chips" style="width:100%"></div>');
                    gLinks.forEach(function(lk){
                        var label=lk.label||'Download';
                        if(lk.size)label+=' ('+lk.size+')';
                        var typeIcon='🔗';
                        if(lk.type==='gdrive')typeIcon='📁';
                        else if(lk.type==='direct')typeIcon='⬇️';
                        else if(lk.type==='mega')typeIcon='☁️';
                        
                        var chip=$('<div class="kk-ep-c selector">'+typeIcon+' '+E(label)+'</div>');
                        bE(chip,async function(){
                            Lampa.Noty.show('Resolving link...');
                            try{
                                var resolved=await resolveLink(lk.url);
                                // Try to open or play
                                if(resolved.match(/\.(mp4|mkv|avi|webm)(\?|$)/i)){
                                    Lampa.Player.play({title:info.name||det.title,url:resolved});
                                }else{
                                    // Show link for user to open
                                    Lampa.Select.show({
                                        title:'Link',
                                        items:[
                                            {title:'🔗 Mở link: '+resolved.substring(0,60)+'...',value:'open'},
                                            {title:'📋 Copy link',value:'copy'}
                                        ],
                                        onSelect:function(a){
                                            if(a.value==='open'){
                                                try{window.open(resolved,'_blank');}catch(e){Lampa.Noty.show(resolved);}
                                            }else{
                                                try{navigator.clipboard.writeText(resolved);Lampa.Noty.show('Đã copy!');}catch(e){Lampa.Noty.show(resolved);}
                                            }
                                        },
                                        onBack:function(){Lampa.Controller.toggle('content');}
                                    });
                                }
                            }catch(e){
                                // Fallback: open original
                                try{window.open(lk.url,'_blank');}catch(e2){Lampa.Noty.show(lk.url);}
                            }
                        });
                        chips.append(chip);
                    });
                    act.append(chips);
                });
                
                body.append(act);
            }else{
                body.append('<div class="kk-ep-er" style="margin-top:1em">❌ Không tìm thấy link download</div>');
            }
            
            // Try to find on TMDB (bridge to main plugin)
            if(window.__kkp){
                var tmdbBtn=$('<div class="kk-src-btn kk-src-btn--torrent selector" style="width:100%;margin-top:1em"><div class="kk-sb-main">🔍 Tìm trên KKPhim/TMDB</div><div class="kk-sb-sub">Mở trang chi tiết TMDB</div></div>');
                bE(tmdbBtn,function(){
                    // Search TMDB via main plugin
                    Lampa.Activity.push({
                        url:'',title:info.name||'',
                        component:'kk_search',
                        keyword:info.name||det.title,page_num:1
                    });
                });
                body.append(tmdbBtn);
            }
            
            w.append(body);sc.append(w);
            comp.activity.loader(false);comp.start();
        }).catch(function(e){
            sc.append($('<div class="kk-detail-wrap"><div class="kk-ep-er">❌ '+E(e.message||'Lỗi tải trang')+'</div></div>'));
            comp.activity.loader(false);comp.start();
        });
    };
    this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
});

// ── Settings ──
Lampa.Component.add('uhd_stg',function(){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    this.create=function(){
        cS(sc);var s=ls(),w=$('<div class="kk-stg-wrap"></div>');
        w.append('<div class="kk-stg-title">⚙️ UHDMovies Settings</div>');
        
        function si(n,d,v){return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">'+E(n)+'</div>'+(d?'<div class="kk-stg-label-desc">'+E(d)+'</div>':'')+'</div><div class="kk-stg-value">'+E(v)+'</div></div>');}
        function mo(n,d,on,cb){var it=si(n,d,on?'✅':'○');if(on)it.find('.kk-stg-value').css('color','#4ade80');bE(it,cb);return it;}
        
        // Proxy selection
        var g1=$('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">🌐 CORS Proxy</div>');
        var cp=s.proxy||CORS_PROXIES[0];
        CORS_PROXIES.forEach(function(px){
            g1.append(mo(px.replace('https://','').split('/')[0],'',cp===px,function(){ss({proxy:px});comp.create();}));
        });
        w.append(g1);
        
        // Custom proxy
        var g2=$('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">🔧 Custom Proxy</div>');
        var cpx=si('Custom proxy URL','Để trống = dùng mặc định',s.custom_proxy||'Không');
        bE(cpx,function(){
            try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Custom Proxy URL',value:s.custom_proxy||'',free:true,nosave:true},function(v){v=(v||'').trim();ss({custom_proxy:v});s.custom_proxy=v;cpx.find('.kk-stg-value').text(v||'Không');});return;}}catch(e){}
            var v=window.prompt('Custom Proxy:',s.custom_proxy||'');if(v!==null){v=v.trim();ss({custom_proxy:v});cpx.find('.kk-stg-value').text(v||'Không');}
        });
        g2.append(cpx);
        
        // Test
        var stTest=$('<div class="kk-stg-status" style="display:none"></div>');
        var tBtn=si('🧪 Test Connection','Thử truy cập UHDMovies','Test');
        bE(tBtn,async function(){
            stTest.show().html('<span>⏳ Đang thử...</span>');
            try{
                var html=await pFetch(BASE);
                if(html&&html.length>100)stTest.attr('class','kk-stg-status kk-stg-status--ok').html('<span>✅ OK! ('+html.length+' bytes)</span>');
                else stTest.attr('class','kk-stg-status kk-stg-status--err').html('<span>❌ Response quá ngắn</span>');
            }catch(e){stTest.attr('class','kk-stg-status kk-stg-status--err').html('<span>❌ '+E(e.message)+'</span>');}
        });
        g2.append(tBtn).append(stTest);
        w.append(g2);
        
        w.append('<div class="kk-stg-ver">UHDMovies Parser v1.0</div>');
        sc.append(w);comp.start();
    };
    this.start=function(){aC(sc);eSc(sc);};this.pause=function(){};this.stop=function(){};this.render=function(){return sc.render();};this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// BOOT - Add menu item
// ══════════════════════════════════════════════════════════════
function boot(){
    setTimeout(function(){
        if($('.menu__item[data-action="uhdmovies"]').length)return;
        var m=$('<li class="menu__item selector" data-action="uhdmovies"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg></div><div class="menu__text">UHDMovies</div></li>');
        bE(m,function(){Lampa.Activity.push({url:'',title:'UHDMovies',component:'uhd_main',page:1});});
        // Insert after KKPhim menu if exists, otherwise append
        var kkMenu=$('.menu__item[data-action="kkphim"]');
        if(kkMenu.length)kkMenu.after(m);
        else $('.menu .menu__list').first().append(m);
    },600);
}
if(window.appready)boot();else Lampa.Listener.follow('app',function(e){if(e.type==='ready')boot();});

})();