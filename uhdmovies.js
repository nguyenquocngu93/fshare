/* UHDMovies Parser */
(function(){
'use strict';

var BASE='https://uhdmovies.ink';
var PROXIES=[
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?'
];

async function pFetch(url){
    // Try proxies
    for(var i=0;i<PROXIES.length;i++){
        try{
            var r=await fetch(PROXIES[i]+encodeURIComponent(url));
            if(r.ok)return await r.text();
        }catch(e){}
    }
    throw new Error('Cannot fetch');
}

async function search(title,year){
    var kw=title.replace(/[:\-–]/g,' ').trim();
    if(year)kw+=' '+year;
    
    var html=await pFetch(BASE+'/?s='+encodeURIComponent(kw));
    var doc=new DOMParser().parseFromString(html,'text/html');
    var results=[];
    
    doc.querySelectorAll('article, .post-item').forEach(function(art){
        var link=art.querySelector('a[href]');
        var titleEl=art.querySelector('h2, h3, .entry-title');
        if(!link)return;
        var href=link.getAttribute('href')||'';
        var name=(titleEl?titleEl.textContent:link.textContent||'').trim();
        if(href&&name)results.push({url:href,name:name});
    });
    
    return results;
}

async function getLinks(url){
    var html=await pFetch(url);
    var doc=new DOMParser().parseFromString(html,'text/html');
    var links=[],seen={};
    
    var content=doc.querySelector('.entry-content, .post-content, article');
    if(!content)return links;
    
    content.querySelectorAll('a[href]').forEach(function(a){
        var href=a.getAttribute('href')||'';
        var text=(a.textContent||'').trim();
        if(!href||seen[href])return;
        if(!isDownloadLink(href))return;
        seen[href]=true;
        links.push(parseLink(text,href,a));
    });
    
    return links;
}

function isDownloadLink(href){
    var dominated=[/drive\.google/i,/gdrive/i,/gdtot/i,/hubcloud/i,/mega\.nz/i,/mediafire/i,/pixeldrain/i,/workers\.dev/i];
    for(var i=0;i<dominated.length;i++)if(dominated[i].test(href))return true;
    return false;
}

function parseLink(text,href,el){
    var quality='',size='';
    var qm=text.match(/\b(2160p|4K|1080p|720p|480p|HDR|BluRay|WEB-?DL|REMUX)\b/gi);
    if(qm)quality=qm.join(' ');
    var sm=text.match(/\b([\d.]+)\s*(GB|MB|TB)\b/i);
    if(sm)size=sm[1]+' '+sm[2].toUpperCase();
    
    if(el&&el.parentElement){
        var pt=el.parentElement.textContent||'';
        if(!quality){var qm2=pt.match(/\b(2160p|4K|1080p|720p|480p)\b/gi);if(qm2)quality=qm2.join(' ');}
        if(!size){var sm2=pt.match(/\b([\d.]+)\s*(GB|MB|TB)\b/i);if(sm2)size=sm2[1]+' '+sm2[2].toUpperCase();}
    }
    
    var type='link';
    if(href.match(/drive\.google|gdrive|gdtot/i))type='gdrive';
    else if(href.match(/mega\.nz/i))type='mega';
    else if(href.match(/workers\.dev/i))type='direct';
    
    return{label:text.substring(0,80)||'Download',url:href,quality:quality,size:size,type:type};
}

async function resolve(url){
    try{
        var html=await pFetch(url);
        var doc=new DOMParser().parseFromString(html,'text/html');
        
        var meta=doc.querySelector('meta[http-equiv="refresh"]');
        if(meta){var cm=(meta.getAttribute('content')||'').match(/url=(.+)/i);if(cm)return cm[1].trim();}
        
        var scripts=doc.querySelectorAll('script');
        for(var i=0;i<scripts.length;i++){
            var st=scripts[i].textContent||'';
            var m=st.match(/location\.href\s*=\s*['"]([^'"]+)['"]/)||st.match(/window\.open\(['"]([^'"]+)['"]/);
            if(m)return m[1];
        }
        
        var dl=doc.querySelector('a[href*="drive.google"], a[href*="workers.dev"], a.download[href]');
        if(dl)return dl.getAttribute('href');
    }catch(e){}
    return url;
}

async function getLinksFor(title,year,orig){
    var results=await search(title,year);
    if(!results.length&&orig)results=await search(orig,year);
    if(!results.length)return{found:false,links:[]};
    
    var links=await getLinks(results[0].url);
    return{found:true,title:results[0].name,page:results[0].url,links:links};
}

// Register
function register(){
    if(!window.KK){console.warn('[UHD] Core not loaded');return;}
    
    window.KK.register({
        id:'uhdmovies',
        name:'UHDMovies',
        type:'download',
        icon:'📀',
        description:'4K/1080p Downloads',
        priority:3,
        enabled:false, // Disabled by default
        
        search:search,
        getLinks:getLinks,
        resolve:resolve,
        getLinksFor:getLinksFor
    });
    
    console.log('[UHD] Registered');
}

if(window.KK)register();
else{
    var checkCore=setInterval(function(){
        if(window.KK){clearInterval(checkCore);register();}
    },100);
    setTimeout(function(){clearInterval(checkCore);},5000);
}

})();