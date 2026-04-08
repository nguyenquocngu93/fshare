(function() {
'use strict';

var KK_API   = 'https://phimapi.com';
var TMDB_KEY = '6979c8ec101ed849f44d197c86582644';
var TMDB_API = 'https://api.themoviedb.org/3';
var TMDB_IMG = 'https://image.tmdb.org/t/p/';
var _cache   = {};
var _stimer  = null;

// ─── CACHE & REQUEST ─────────────────────────────────────
function cGet(k) {
    var e = _cache[k];
    if (e && (Date.now() - e.t < 300000)) return e.d;
    return null;
}
function cSet(k, d) { _cache[k] = { d: d, t: Date.now() }; }

function req(url, ok, fail) {
    var c = cGet(url);
    if (c) { ok(c); return; }
    $.ajax({
        url: url, type: 'GET', dataType: 'json', timeout: 12000,
        success: function(d) { cSet(url, d); ok(d); },
        error:   function() { if (fail) fail(); }
    });
}

function imgUrl(u) {
    if (!u) return '';
    if (u.indexOf('http') === 0) return u;
    return 'https://phimimg.com/' + u;
}
function tImg(path, sz) {
    if (!path) return '';
    return TMDB_IMG + (sz || 'w300') + path;
}
function strip(s) { return s ? s.replace(/<[^>]*>/g, '') : ''; }

// ─── CSS ─────────────────────────────────────────────────
function injectCSS() {
    if (document.getElementById('kkp-css')) return;
    var css = '.kkp{background:#0d0d14;color:#fff;font-family:sans-serif;padding-bottom:40px}'
+'.kkp-hero{position:relative;width:100%;height:52vw;max-height:580px;min-height:260px;overflow:hidden;margin-bottom:20px}'
+'.kkp-hbg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.35)}'
+'.kkp-hgrad{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 10%,rgba(13,13,20,.8) 60%,#0d0d14 100%)}'
+'.kkp-hbody{position:absolute;bottom:0;left:0;right:0;padding:18px 20px;display:flex;align-items:flex-end;gap:14px}'
+'.kkp-hposter{width:95px;min-width:95px;height:142px;border-radius:10px;overflow:hidden;box-shadow:0 6px 22px rgba(0,0,0,.7);border:2px solid rgba(255,255,255,.15);flex-shrink:0}'
+'.kkp-hposter img{width:100%;height:100%;object-fit:cover;display:block}'
+'.kkp-hinfo{flex:1;min-width:0}'
+'.kkp-hbadge{display:inline-block;background:#e50914;color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 9px;border-radius:4px;margin-bottom:6px}'
+'.kkp-htitle{font-size:clamp(15px,3.8vw,30px);font-weight:900;color:#fff;margin:0 0 3px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
+'.kkp-horig{font-size:clamp(11px,1.8vw,13px);color:rgba(255,255,255,.5);margin:0 0 8px;font-style:italic}'
+'.kkp-htags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}'
+'.kkp-htag{font-size:clamp(11px,1.6vw,12px);background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.9);padding:2px 9px;border-radius:20px}'
+'.kkp-htag.ql{background:rgba(245,166,35,.85);border-color:transparent;font-weight:700}'
+'.kkp-htag.rt{background:rgba(39,174,96,.85);border-color:transparent;font-weight:700}'
+'.kkp-hbtns{display:flex;gap:7px;flex-wrap:wrap}'
+'.kkp-hbtn{display:inline-flex;align-items:center;gap:5px;padding:8px 16px;border-radius:7px;font-size:clamp(12px,1.8vw,14px);font-weight:700;cursor:pointer;border:none;outline:none;transition:all .2s}'
+'.kkp-hbtn.r{background:#e50914;color:#fff;box-shadow:0 4px 12px rgba(229,9,20,.45)}'
+'.kkp-hbtn.r:hover{background:#ff2030;transform:translateY(-2px)}'
+'.kkp-hbtn.g{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.28)}'
+'.kkp-hbtn.g:hover{background:rgba(255,255,255,.22);transform:translateY(-2px)}'
+'.kkp-sbox{margin:0 12px 14px;display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.12);border-radius:12px;padding:9px 14px;transition:all .3s}'
+'.kkp-sbox:focus-within{border-color:rgba(229,9,20,.6);background:rgba(255,255,255,.1);box-shadow:0 0 0 3px rgba(229,9,20,.12)}'
+'.kkp-sbox svg{width:17px;height:17px;fill:rgba(255,255,255,.4);flex-shrink:0}'
+'.kkp-sinput{flex:1;background:none;border:none;outline:none;color:#fff;font-size:clamp(13px,2.2vw,15px);caret-color:#e50914}'
+'.kkp-sinput::placeholder{color:rgba(255,255,255,.3)}'
+'.kkp-chips{display:flex;gap:7px;overflow-x:auto;padding:0 12px 10px;scrollbar-width:none}'
+'.kkp-chips::-webkit-scrollbar{display:none}'
+'.kkp-chip{white-space:nowrap;padding:6px 14px;border-radius:20px;font-size:clamp(11px,1.8vw,13px);font-weight:600;cursor:pointer;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);transition:all .2s;user-select:none;flex-shrink:0}'
+'.kkp-chip:hover{background:rgba(229,9,20,.2);border-color:rgba(229,9,20,.4);color:#fff}'
+'.kkp-chip.on{background:#e50914;border-color:transparent;color:#fff;box-shadow:0 3px 10px rgba(229,9,20,.4)}'
+'.kkp-sh{display:flex;align-items:center;justify-content:space-between;padding:2px 12px 8px}'
+'.kkp-stitle{display:flex;align-items:center;gap:7px;font-size:clamp(13px,2.8vw,17px);font-weight:800;color:#fff}'
+'.kkp-sbar{width:4px;height:18px;background:linear-gradient(#e50914,#ff6b6b);border-radius:2px;flex-shrink:0}'
+'.kkp-smore{font-size:12px;color:rgba(255,255,255,.45);cursor:pointer;padding:3px 9px;border-radius:5px;transition:all .2s}'
+'.kkp-smore:hover{color:#e50914;background:rgba(229,9,20,.1)}'
+'.kkp-row{display:flex;gap:11px;padding:3px 12px 6px;overflow-x:auto;scrollbar-width:thin;scrollbar-color:rgba(229,9,20,.4) transparent}'
+'.kkp-row::-webkit-scrollbar{height:3px}'
+'.kkp-row::-webkit-scrollbar-thumb{background:rgba(229,9,20,.4);border-radius:2px}'
+'.kkp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(105px,18vw,155px),1fr));gap:12px;padding:3px 12px 6px}'
+'.kkp-card{flex-shrink:0;width:clamp(105px,18vw,155px);cursor:pointer;transition:transform .3s cubic-bezier(.34,1.56,.64,1)}'
+'.kkp-grid .kkp-card{width:100%}'
+'.kkp-card:hover{transform:translateY(-7px) scale(1.03);z-index:5}'
+'.kkp-cp{width:100%;aspect-ratio:2/3;border-radius:9px;overflow:hidden;position:relative;background:rgba(255,255,255,.05);box-shadow:0 3px 12px rgba(0,0,0,.4)}'
+'.kkp-card:hover .kkp-cp{box-shadow:0 0 0 3px #e50914,0 7px 20px rgba(229,9,20,.35)}'
+'.kkp-ci{width:100%;height:100%;object-fit:cover;transition:transform .4s;display:block}'
+'.kkp-card:hover .kkp-ci{transform:scale(1.08)}'
+'.kkp-cov{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.8) 0%,transparent 60%);opacity:0;transition:opacity .3s;display:flex;align-items:center;justify-content:center}'
+'.kkp-card:hover .kkp-cov{opacity:1}'
+'.kkp-cpb{width:38px;height:38px;background:rgba(229,9,20,.9);border-radius:50%;display:flex;align-items:center;justify-content:center}'
+'.kkp-cpb svg{width:16px;height:16px;fill:#fff;margin-left:2px}'
+'.kkp-cbs{position:absolute;top:5px;left:5px;right:5px;display:flex;justify-content:space-between;pointer-events:none}'
+'.kkp-b{font-size:9px;font-weight:700;padding:2px 5px;border-radius:3px;backdrop-filter:blur(6px)}'
+'.kkp-b.ql{background:rgba(245,166,35,.9);color:#fff}'
+'.kkp-b.ep{background:rgba(229,9,20,.85);color:#fff}'
+'.kkp-b.rt{background:rgba(39,174,96,.85);color:#fff}'
+'.kkp-cn{font-size:clamp(11px,2vw,13px);font-weight:700;color:#fff;margin:6px 0 2px;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}'
+'.kkp-cm{font-size:clamp(10px,1.6vw,11px);color:rgba(255,255,255,.45);display:flex;align-items:center;gap:3px}'
+'.kkp-cdot{width:2px;height:2px;background:rgba(255,255,255,.3);border-radius:50%}'
+'.kkp-det{background:#0d0d14}'
+'.kkp-dhero{position:relative;height:48vw;max-height:520px;min-height:240px;overflow:hidden}'
+'.kkp-dbg{position:absolute;inset:0;background-size:cover;background-position:center 20%;filter:brightness(.32)}'
+'.kkp-dgrad{position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,rgba(13,13,20,.9) 70%,#0d0d14 100%)}'
+'.kkp-dback{position:absolute;top:12px;left:12px;width:36px;height:36px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(255,255,255,.2);color:#fff;z-index:10;transition:all .2s}'
+'.kkp-dback:hover{background:rgba(229,9,20,.7);border-color:transparent}'
+'.kkp-dback svg{width:20px;height:20px;fill:currentColor}'
+'.kkp-dbody{padding:0 12px 40px;margin-top:-32px;position:relative}'
+'.kkp-dmain{display:flex;gap:14px;align-items:flex-start;margin-bottom:16px}'
+'.kkp-dposter{width:clamp(80px,20vw,140px);flex-shrink:0}'
+'.kkp-dposter img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:9px;box-shadow:0 5px 20px rgba(0,0,0,.6);border:2px solid rgba(255,255,255,.1);display:block}'
+'.kkp-dinfo{flex:1;min-width:0;padding-top:3px}'
+'.kkp-dql{display:inline-block;background:linear-gradient(135deg,#f5a623,#e07b00);color:#fff;font-size:10px;font-weight:700;padding:2px 9px;border-radius:4px;margin-bottom:7px}'
+'.kkp-dtitle{font-size:clamp(14px,3.8vw,24px);font-weight:900;color:#fff;margin:0 0 3px;line-height:1.2}'
+'.kkp-dorig{font-size:clamp(10px,1.8vw,12px);color:rgba(255,255,255,.5);margin:0 0 10px;font-style:italic}'
+'.kkp-dstats{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}'
+'.kkp-dst{display:inline-flex;align-items:center;gap:3px;font-size:clamp(10px,1.6vw,12px);color:rgba(255,255,255,.8);background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);padding:3px 9px;border-radius:5px}'
+'.kkp-dst.grn{color:#2ecc71}'
+'.kkp-rtrow{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}'
+'.kkp-rtbox{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:7px 12px}'
+'.kkp-rtbox.tm{border-color:rgba(1,180,228,.3)}'
+'.kkp-rtval{font-size:15px;font-weight:800}'
+'.kkp-rtbox.tm .kkp-rtval{color:#01b4e4}'
+'.kkp-rtsrc{font-size:10px;color:rgba(255,255,255,.4)}'
+'.kkp-dacts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}'
+'.kkp-btn{display:inline-flex;align-items:center;gap:5px;padding:10px 20px;border-radius:7px;font-size:clamp(12px,2.2vw,14px);font-weight:700;cursor:pointer;border:none;outline:none;transition:all .25s;user-select:none}'
+'.kkp-btn svg{width:16px;height:16px;fill:currentColor}'
+'.kkp-btn.r{background:#e50914;color:#fff;box-shadow:0 3px 12px rgba(229,9,20,.4)}'
+'.kkp-btn.r:hover{box-shadow:0 5px 18px rgba(229,9,20,.6);transform:translateY(-2px)}'
+'.kkp-btn.g{background:rgba(255,255,255,.1);color:#fff;border:1.5px solid rgba(255,255,255,.2)}'
+'.kkp-btn.g:hover{background:rgba(255,255,255,.17);transform:translateY(-2px)}'
+'.kkp-btn.y{background:rgba(255,0,0,.1);color:#ff4444;border:1.5px solid rgba(255,0,0,.22)}'
+'.kkp-dtit{font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}'
+'.kkp-desc{font-size:clamp(12px,2vw,14px);color:rgba(255,255,255,.8);line-height:1.7;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}'
+'.kkp-desc.exp{-webkit-line-clamp:unset}'
+'.kkp-dmore{color:#e50914;font-size:12px;cursor:pointer;margin-top:4px;display:inline-block}'
+'.kkp-meta{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:12px 0}'
+'.kkp-mk{font-size:clamp(10px,1.6vw,12px);color:rgba(255,255,255,.4);font-weight:600;white-space:nowrap}'
+'.kkp-mv{font-size:clamp(11px,1.8vw,13px);color:rgba(255,255,255,.85)}'
+'.kkp-genres{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0}'
+'.kkp-genre{font-size:clamp(10px,1.6vw,12px);padding:3px 10px;background:rgba(229,9,20,.1);border:1px solid rgba(229,9,20,.25);color:rgba(255,255,255,.85);border-radius:20px;cursor:pointer;transition:all .2s}'
+'.kkp-genre:hover{background:rgba(229,9,20,.25);color:#fff}'
+'.kkp-div{height:1px;background:rgba(255,255,255,.07);margin:16px 0}'
+'.kkp-eps{margin:0 0 20px}'
+'.kkp-epsh{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}'
+'.kkp-epst{font-size:clamp(13px,2.3vw,16px);font-weight:800;display:flex;align-items:center;gap:5px}'
+'.kkp-epsc{font-size:12px;color:rgba(255,255,255,.4)}'
+'.kkp-svrtabs{display:flex;gap:7px;margin-bottom:10px;overflow-x:auto;scrollbar-width:none;padding-bottom:3px}'
+'.kkp-svrtabs::-webkit-scrollbar{display:none}'
+'.kkp-svrtab{white-space:nowrap;padding:5px 12px;border-radius:5px;font-size:clamp(11px,1.8vw,12px);font-weight:600;cursor:pointer;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.65);transition:all .2s}'
+'.kkp-svrtab.on,.kkp-svrtab:hover{background:rgba(229,9,20,.8);border-color:transparent;color:#fff}'
+'.kkp-epgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(46px,10vw,65px),1fr));gap:5px}'
+'.kkp-ep{aspect-ratio:1.6;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:clamp(10px,1.8vw,12px);font-weight:700;color:rgba(255,255,255,.7);cursor:pointer;transition:all .2s;user-select:none}'
+'.kkp-ep:hover{background:rgba(229,9,20,.8);border-color:transparent;color:#fff;transform:scale(1.05)}'
+'.kkp-ep.on{background:#e50914;border-color:transparent;color:#fff;box-shadow:0 2px 8px rgba(229,9,20,.5)}'
+'.kkp-eppanel{display:none}'
+'.kkp-eppanel.on{display:block}'
+'.kkp-castrow{display:flex;gap:10px;overflow-x:auto;padding:3px 0 8px;scrollbar-width:none}'
+'.kkp-castrow::-webkit-scrollbar{display:none}'
+'.kkp-castcard{flex-shrink:0;width:clamp(65px,12vw,90px);cursor:pointer;transition:transform .2s;text-align:center}'
+'.kkp-castcard:hover{transform:translateY(-3px)}'
+'.kkp-castimg{width:100%;aspect-ratio:1;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.1);display:block}'
+'.kkp-castn{font-size:clamp(9px,1.6vw,11px);color:rgba(255,255,255,.8);margin-top:4px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
+'.kkp-castr{font-size:clamp(8px,1.4vw,10px);color:rgba(255,255,255,.4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
+'.kkp-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:50px 20px;gap:10px;color:rgba(255,255,255,.4);font-size:13px}'
+'.kkp-spin{width:34px;height:34px;border:3px solid rgba(255,255,255,.1);border-top-color:#e50914;border-radius:50%;animation:kkpsp .8s linear infinite}'
+'@keyframes kkpsp{to{transform:rotate(360deg)}}'
+'.kkp-empty{text-align:center;padding:50px 20px;color:rgba(255,255,255,.35)}'
+'.kkp-empty-ico{font-size:44px;margin-bottom:8px}'
+'.kkp-empty-txt{font-size:clamp(12px,2.2vw,14px)}'
+'.kkp-pages{display:flex;justify-content:center;align-items:center;gap:5px;padding:18px 12px;flex-wrap:wrap}'
+'.kkp-pg{min-width:34px;height:34px;padding:0 5px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:clamp(11px,1.8vw,13px);font-weight:700;cursor:pointer;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.65);transition:all .2s;user-select:none}'
+'.kkp-pg:hover{background:rgba(229,9,20,.8);color:#fff;border-color:transparent}'
+'.kkp-pg.on{background:#e50914;color:#fff;border-color:transparent}'
+'@keyframes kkpin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'
+'.kkp-in{animation:kkpin .3s ease forwards}'
+'@media(max-width:480px){'
+'.kkp-hero{height:70vw}'
+'.kkp-hbody{padding:10px 12px;gap:10px}'
+'.kkp-hposter{width:68px;min-width:68px;height:102px}'
+'.kkp-dmain{flex-direction:column;align-items:center}'
+'.kkp-dinfo{width:100%;text-align:center}'
+'.kkp-dstats,.kkp-dacts,.kkp-rtrow,.kkp-genres{justify-content:center}'
+'}';
    var s = document.createElement('style');
    s.id = 'kkp-css';
    s.textContent = css;
    document.head.appendChild(s);
}

// ─── ICONS ───────────────────────────────────────────────
var IC = {
    play:   'M8 5v14l11-7z',
    back:   'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    film:   'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z',
    ep:     'M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zm-5-6l-8 4.5v-9z',
    clock:  'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L11 13.5V7h1.5v5.75l4.5 2.67-1.26 2.08z',
    heart:  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    yt:     'M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z',
    person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    fire:   'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
    trend:  'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
    star:   'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'
};
function ic(n) {
    return '<svg viewBox="0 0 24 24" fill="currentColor" style="width:1em;height:1em;display:inline-block;vertical-align:middle;flex-shrink:0"><path d="'+(IC[n]||'')+'"/></svg>';
}

// ─── API ─────────────────────────────────────────────────
function apiList(type, page, cb) {
    req(KK_API+'/v1/api/danh-sach/'+type+'?page='+(page||1)+'&limit=24',
        function(d){
            var it  = (d.data&&d.data.items) ? d.data.items : (d.items||[]);
            var tot = (d.data&&d.data.params&&d.data.params.pagination&&d.data.params.pagination.totalPages)||1;
            cb(it,tot);
        }, function(){ cb([],1); });
}
function apiCat(slug, page, cb) {
    req(KK_API+'/v1/api/the-loai/'+slug+'?page='+(page||1)+'&limit=24',
        function(d){
            var it  = (d.data&&d.data.items) ? d.data.items : (d.items||[]);
            var tot = (d.data&&d.data.params&&d.data.params.pagination&&d.data.params.pagination.totalPages)||1;
            cb(it,tot);
        }, function(){ cb([],1); });
}
function apiCountry(slug, page, cb) {
    req(KK_API+'/v1/api/quoc-gia/'+slug+'?page='+(page||1)+'&limit=24',
        function(d){
            var it  = (d.data&&d.data.items) ? d.data.items : (d.items||[]);
            var tot = (d.data&&d.data.params&&d.data.params.pagination&&d.data.params.pagination.totalPages)||1;
            cb(it,tot);
        }, function(){ cb([],1); });
}
function apiSearch(q, cb) {
    req(KK_API+'/v1/api/tim-kiem?keyword='+encodeURIComponent(q)+'&page=1',
        function(d){ cb((d.data&&d.data.items)||(d.items)||[]); },
        function(){ cb([]); });
}
function apiDetail(slug, cb) {
    req(KK_API+'/phim/'+slug, function(d){ cb(d); }, function(){ cb(null); });
}
function tmdbSearch(title, year, cb) {
    req(TMDB_API+'/search/multi?api_key='+TMDB_KEY+'&query='+encodeURIComponent(title)+'&language=vi-VN'+(year?'&year='+year:''),
        function(d){ cb((d.results&&d.results[0])||null); },
        function(){ cb(null); });
}
function tmdbDetail(id, type, cb) {
    req(TMDB_API+'/'+type+'/'+id+'?api_key='+TMDB_KEY+'&language=vi-VN&append_to_response=credits,videos,recommendations',
        function(d){ cb(d); }, function(){ cb(null); });
}
function tmdbTrending(cb) {
    req(TMDB_API+'/trending/all/week?api_key='+TMDB_KEY+'&language=vi-VN',
        function(d){ cb(d.results||[]); }, function(){ cb([]); });
}

// ─── BUILD ───────────────────────────────────────────────
function ld() { return '<div class="kkp-loading"><div class="kkp-spin"></div><span>Đang tải...</span></div>'; }
function em(msg) { return '<div class="kkp-empty"><div class="kkp-empty-ico">🎬</div><div class="kkp-empty-txt">'+(msg||'Không có dữ liệu')+'</div></div>'; }

function sh(icn, title, moreAttr) {
    return '<div class="kkp-sh"><div class="kkp-stitle"><div class="kkp-sbar"></div>'+ic(icn)+' '+title+'</div>'+(moreAttr?'<div class="kkp-smore" '+moreAttr+'>Xem thêm ›</div>':'')+'</div>';
}

function mkCard(m, isTmdb) {
    var poster = isTmdb ? tImg(m.poster_path,'w300') : imgUrl(m.poster_url||m.thumb_url);
    var name   = m.name||m.title||'';
    var year   = m.year||(m.release_date?m.release_date.substr(0,4):'')|| (m.first_air_date?m.first_air_date.substr(0,4):'');
    var ql     = m.quality||(isTmdb?'HD':'');
    var ep     = (!isTmdb&&m.type==='series')?(m.episode_current||''):'';
    var vote   = m._vote||(m.vote_average?parseFloat(m.vote_average).toFixed(1):'');
    var typeStr= m.type==='series'?'Phim Bộ':m.type==='single'?'Phim Lẻ':(m.media_type==='tv'?'TV':'Phim');
    var slug   = isTmdb?('__t__'+(m.media_type||'movie')+'__'+m.id):(m.slug||'');
    var lb = ql?'<span class="kkp-b ql">'+ql+'</span>':'';
    var rb = vote?'<span class="kkp-b rt">⭐'+vote+'</span>':(ep?'<span class="kkp-b ep">'+ep+'</span>':'');
    return '<div class="kkp-card" data-slug="'+slug+'">'
        +'<div class="kkp-cp">'
        +'<img class="kkp-ci" src="'+poster+'" alt="" loading="lazy" onerror="this.src=\'\'">'
        +'<div class="kkp-cbs">'+lb+rb+'</div>'
        +'<div class="kkp-cov"><div class="kkp-cpb">'+ic('play')+'</div></div>'
        +'</div>'
        +'<div class="kkp-cn">'+name+'</div>'
        +'<div class="kkp-cm">'+(year?'<span>'+year+'</span>':'')+(year&&typeStr?'<span class="kkp-cdot"></span>':'')+(typeStr?'<span>'+typeStr+'</span>':'')+'</div>'
        +'</div>';
}

function mkPages(cur, tot) {
    if (tot<=1) return '';
    var h='<div class="kkp-pages">';
    if (cur>1) h+='<div class="kkp-pg" data-p="'+(cur-1)+'">‹</div>';
    var s=Math.max(1,cur-2),e=Math.min(tot,cur+2);
    if (s>1){h+='<div class="kkp-pg" data-p="1">1</div>';if(s>2)h+='<span style="color:rgba(255,255,255,.3);padding:0 3px">…</span>';}
    for(var p=s;p<=e;p++) h+='<div class="kkp-pg'+(p===cur?' on':'')+'" data-p="'+p+'">'+p+'</div>';
    if(e<tot){if(e<tot-1)h+='<span style="color:rgba(255,255,255,.3);padding:0 3px">…</span>';h+='<div class="kkp-pg" data-p="'+tot+'">'+tot+'</div>';}
    if(cur<tot) h+='<div class="kkp-pg" data-p="'+(cur+1)+'">›</div>';
    h+='</div>';
    return h;
}

var CATS = [
    {slug:'phim-bo',    name:'📺 Phim Bộ',    api:'list'},
    {slug:'phim-le',    name:'🎬 Phim Lẻ',    api:'list'},
    {slug:'hoat-hinh',  name:'🎠 Hoạt Hình',  api:'list'},
    {slug:'tv-shows',   name:'📡 TV Shows',   api:'list'},
    {slug:'hanh-dong',  name:'💥 Hành Động',  api:'cat'},
    {slug:'tinh-cam',   name:'💕 Tình Cảm',   api:'cat'},
    {slug:'hai-huoc',   name:'😂 Hài Hước',   api:'cat'},
    {slug:'kinh-di',    name:'👻 Kinh Dị',    api:'cat'},
    {slug:'vien-tuong', name:'🚀 Viễn Tưởng', api:'cat'},
    {slug:'co-trang',   name:'🏯 Cổ Trang',   api:'cat'},
    {slug:'tam-ly',     name:'🧠 Tâm Lý',     api:'cat'},
    {slug:'hinh-su',    name:'🔍 Hình Sự',    api:'cat'},
    {slug:'bi-an',      name:'🔮 Bí Ẩn',      api:'cat'},
    {slug:'phieu-luu',  name:'🗺️ Phiêu Lưu', api:'cat'},
    {slug:'gia-dinh',   name:'👨‍👩‍👧 Gia Đình', api:'cat'}
];
var COUNTRIES = [
    {slug:'trung-quoc',name:'🇨🇳 Trung Quốc'},
    {slug:'han-quoc',  name:'🇰🇷 Hàn Quốc'},
    {slug:'nhat-ban',  name:'🇯🇵 Nhật Bản'},
    {slug:'my',        name:'🇺🇸 Mỹ'},
    {slug:'viet-nam',  name:'🇻🇳 Việt Nam'},
    {slug:'thai-lan',  name:'🇹🇭 Thái Lan'},
    {slug:'hong-kong', name:'🇭🇰 Hồng Kông'},
    {slug:'anh',       name:'🇬🇧 Anh'}
];
var HOME_ROWS = [
    {type:'phim-le',   title:'🎬 Phim Lẻ Mới', icon:'film'},
    {type:'phim-bo',   title:'📺 Phim Bộ Mới', icon:'ep'},
    {type:'hoat-hinh', title:'🎠 Hoạt Hình',    icon:'star'},
    {type:'tv-shows',  title:'📡 TV Shows',      icon:'trend'}
];

// ════════════════════════════════════════════════════════════
//  COMPONENT – theo đúng chuẩn Lampa
// ════════════════════════════════════════════════════════════
var component = {
    // Lampa gọi create() và lấy this.render để hiển thị
    create: function() {
        injectCSS();
        var self = this;
        self.render = $('<div class="kkp kkp-in"></div>');
        self._snap  = null;

        // ── HÀM NỘI BỘ ───────────────────────────────
        var $el = self.render;

        function showLd() { $el.html(ld()); }

        function heroTMDB(item) {
            var bg     = item.backdrop_path?(TMDB_IMG+'w1280'+item.backdrop_path):'';
            var poster = item.poster_path  ?(TMDB_IMG+'w500' +item.poster_path)  :'';
            var name   = item.title||item.name||'';
            var orig   = item.original_title||item.original_name||'';
            var year   = (item.release_date||item.first_air_date||'').substr(0,4);
            var vote   = item.vote_average?parseFloat(item.vote_average).toFixed(1):'';
            var mtype  = item.media_type||'movie';
            var slug   = '__t__'+mtype+'__'+item.id;
            $el.find('#kkp-hbg').css('background-image','url('+bg+')');
            $el.find('#kkp-hbody').html(
                '<div class="kkp-hposter"><img src="'+poster+'" alt="" loading="lazy"></div>'
                +'<div class="kkp-hinfo">'
                +'<div class="kkp-hbadge">'+ic('fire')+' Xu Hướng</div>'
                +'<div class="kkp-htitle">'+name+'</div>'
                +(orig&&orig!==name?'<div class="kkp-horig">'+orig+'</div>':'')
                +'<div class="kkp-htags">'
                +(year?'<span class="kkp-htag">'+ic('clock')+' '+year+'</span>':'')
                +(vote?'<span class="kkp-htag rt">⭐ '+vote+'</span>':'')
                +'<span class="kkp-htag">'+(mtype==='tv'?'TV Series':'Phim')+'</span>'
                +'</div>'
                +'<div class="kkp-hbtns">'
                +'<button class="kkp-hbtn r" data-slug="'+slug+'">'+ic('play')+' Xem Ngay</button>'
                +'<button class="kkp-hbtn g" data-slug="'+slug+'">'+ic('film')+' Chi Tiết</button>'
                +'</div>'
                +'</div>'
            );
            $el.find('.kkp-hbtn').off('click').on('click',function(){ openDetail($(this).attr('data-slug')); });
        }

        function heroKK(m) {
            var bg=imgUrl(m.thumb_url||m.poster_url), poster=imgUrl(m.poster_url||m.thumb_url);
            $el.find('#kkp-hbg').css('background-image','url('+bg+')');
            $el.find('#kkp-hbody').html(
                '<div class="kkp-hposter"><img src="'+poster+'" alt="" loading="lazy"></div>'
                +'<div class="kkp-hinfo">'
                +'<div class="kkp-hbadge">'+ic('fire')+' Nổi Bật</div>'
                +'<div class="kkp-htitle">'+(m.name||'')+'</div>'
                +(m.origin_name?'<div class="kkp-horig">'+m.origin_name+'</div>':'')
                +'<div class="kkp-htags">'
                +(m.quality?'<span class="kkp-htag ql">'+m.quality+'</span>':'')
                +(m.year?'<span class="kkp-htag">'+ic('clock')+' '+m.year+'</span>':'')
                +'</div>'
                +'<div class="kkp-hbtns">'
                +'<button class="kkp-hbtn r" data-slug="'+(m.slug||'')+'">'+ic('play')+' Xem Ngay</button>'
                +'<button class="kkp-hbtn g" data-slug="'+(m.slug||'')+'">'+ic('film')+' Chi Tiết</button>'
                +'</div>'
                +'</div>'
            );
            $el.find('.kkp-hbtn').off('click').on('click',function(){ openDetail($(this).attr('data-slug')); });
        }

        function loadHero() {
            tmdbTrending(function(res){
                if (res&&res.length) { heroTMDB(res[Math.floor(Math.random()*Math.min(res.length,8))]); return; }
                apiList('phim-le',1,function(items){ if(items&&items.length) heroKK(items[Math.floor(Math.random()*Math.min(items.length,8))]); });
            });
        }

        function loadHomeRows() {
            var $c=$el.find('#kkp-content');
            var h='<div class="kkp-in">'
                +'<div>'+sh('fire','🔥 Xu Hướng TMDB','')+'<div id="kkp-tmdb-row" class="kkp-row">'+ld()+'</div></div>';
            HOME_ROWS.forEach(function(r){
                h+='<div>'+sh(r.icon,r.title,'data-more="'+r.type+'"')+'<div id="kkp-r-'+r.type+'" class="kkp-row">'+ld()+'</div></div>';
            });
            h+='</div>';
            $c.html(h);

            tmdbTrending(function(res){
                var h2='';
                (res||[]).slice(0,20).forEach(function(item){
                    item._vote=item.vote_average?parseFloat(item.vote_average).toFixed(1):'';
                    h2+=mkCard(item,true);
                });
                $c.find('#kkp-tmdb-row').html(h2||em());
            });
            HOME_ROWS.forEach(function(r){
                apiList(r.type,1,function(items){
                    var h3='';
                    (items||[]).slice(0,20).forEach(function(m){ h3+=mkCard(m,false); });
                    $c.find('#kkp-r-'+r.type).html(h3||em());
                });
            });
        }

        function loadCatRows(cat, page) {
            var $c=$el.find('#kkp-content');
            $c.html(ld());
            var fn=cat.api==='list'
                ?function(cb){apiList(cat.slug,page,cb);}
                :function(cb){apiCat(cat.slug,page,cb);};
            fn(function(items,tot){
                var h='<div class="kkp-in">'+sh('film',cat.name,'')+'<div class="kkp-grid">';
                (items||[]).forEach(function(m){h+=mkCard(m,false);});
                h+='</div>'+mkPages(page,tot)+'</div>';
                $c.html(h);
                $c.off('click.pg').on('click.pg','.kkp-pg[data-p]',function(){ loadCatRows(cat,parseInt($(this).attr('data-p'))); });
            });
        }

        function loadCountryRows(slug, page) {
            var $c=$el.find('#kkp-content');
            var cobj=null;
            COUNTRIES.forEach(function(c){if(c.slug===slug)cobj=c;});
            $c.html(ld());
            apiCountry(slug,page,function(items,tot){
                var h='<div class="kkp-in">'+sh('film',cobj?cobj.name:slug,'')+'<div class="kkp-grid">';
                (items||[]).forEach(function(m){h+=mkCard(m,false);});
                h+='</div>'+mkPages(page,tot)+'</div>';
                $c.html(h);
                $c.off('click.pg').on('click.pg','.kkp-pg[data-p]',function(){ loadCountryRows(slug,parseInt($(this).attr('data-p'))); });
            });
        }

        function doSearch(q) {
            var $c=$el.find('#kkp-content');
            $c.html(ld());
            apiSearch(q,function(items){
                if(!items||!items.length){$c.html(em('Không tìm thấy: '+q));return;}
                var h='<div class="kkp-in">'+sh('search','Kết quả: "'+q+'" ('+items.length+')','')+'<div class="kkp-grid">';
                items.forEach(function(m){h+=mkCard(m,false);});
                h+='</div></div>';
                $c.html(h);
            });
        }

        function openFullList(type, page) {
            page=page||1;
            var catobj=null;
            CATS.forEach(function(c){if(c.slug===type)catobj=c;});
            var title=catobj?catobj.name:type;
            self._snap=$el.html();
            $el.html(ld());
            apiList(type,page,function(items,tot){
                var h='<div class="kkp-in" style="padding:10px">'
                    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">'
                    +'<div class="kkp-dback" id="kkp-list-back">'+ic('back')+'</div>'
                    +'<span style="font-size:clamp(13px,2.8vw,19px);font-weight:800">'+title+'</span>'
                    +'</div>'
                    +'<div class="kkp-grid">';
                (items||[]).forEach(function(m){h+=mkCard(m,false);});
                h+='</div>'+mkPages(page,tot)+'</div>';
                $el.html(h);
                $el.find('#kkp-list-back').on('click',function(){
                    $el.html(self._snap); self._snap=null; bindAll();
                });
                $el.on('click','.kkp-pg[data-p]',function(){ openFullList(type,parseInt($(this).attr('data-p'))); });
                $el.on('click','.kkp-card[data-slug]',function(){ openDetail($(this).attr('data-slug')); });
            });
        }

        function openDetail(slug) {
            var saved=$el.html();
            $el.html(ld());
            if (slug.indexOf('__t__')===0) {
                var pts=slug.replace('__t__','').split('__');
                tmdbDetail(pts[1]||'',pts[0]||'movie',function(td){
                    if(!td){$el.html(em());return;}
                    renderDetail(null,[],td,saved);
                });
                return;
            }
            apiDetail(slug,function(data){
                if(!data){$el.html(em('Không tải được'));return;}
                var movie=data.movie||data, eps=data.episodes||[];
                tmdbSearch(movie.origin_name||movie.name||'',movie.year,function(tb){
                    if(tb&&tb.id){
                        tmdbDetail(tb.id,tb.media_type||'movie',function(td){
                            renderDetail(movie,eps,td,saved);
                        });
                    } else {
                        renderDetail(movie,eps,null,saved);
                    }
                });
            });
        }

        function renderDetail(movie,eps,tmdb,saved) {
            var name    =(movie&&movie.name)||(tmdb&&(tmdb.title||tmdb.name))||'';
            var orig    =(movie&&movie.origin_name)||(tmdb&&(tmdb.original_title||tmdb.original_name))||'';
            var year    =(movie&&movie.year)||(tmdb&&((tmdb.release_date||tmdb.first_air_date||'').substr(0,4)))||'';
            var ql      =(movie&&movie.quality)||'HD';
            var status  =(movie&&movie.status)||'';
            var runtime =(movie&&movie.time)||(tmdb&&tmdb.runtime?(Math.floor(tmdb.runtime/60)+'h '+(tmdb.runtime%60)+'m'):'')||'';
            var lang    =(movie&&movie.lang)||'';
            var content =strip((movie&&movie.content)||(tmdb&&tmdb.overview)||'');
            var mtype   =(movie&&movie.type)||'';
            var actors  =(movie&&movie.actor)||[];
            var dirs    =(movie&&movie.director)||[];
            var cats    =(movie&&movie.category)||[];
            var cnts    =(movie&&movie.country)||[];
            var poster  =(tmdb&&tmdb.poster_path)?tImg(tmdb.poster_path,'w500'):imgUrl((movie&&(movie.poster_url||movie.thumb_url))||'');
            var backdrop=(tmdb&&tmdb.backdrop_path)?(TMDB_IMG+'w1280'+tmdb.backdrop_path):imgUrl((movie&&(movie.thumb_url||movie.poster_url))||'');
            var tmdbVote=(tmdb&&tmdb.vote_average)?parseFloat(tmdb.vote_average).toFixed(1):'';
            var tmdbGenres=(tmdb&&tmdb.genres)||[];
            var cast=(tmdb&&tmdb.credits&&tmdb.credits.cast)?tmdb.credits.cast.slice(0,15):[];
            var trailer='';
            if(tmdb&&tmdb.videos&&tmdb.videos.results){
                for(var vi=0;vi<tmdb.videos.results.length;vi++){
                    var v=tmdb.videos.results[vi];
                    if(v.type==='Trailer'&&v.site==='YouTube'){trailer='https://www.youtube.com/watch?v='+v.key;break;}
                }
            }
            var recs=(tmdb&&tmdb.recommendations&&tmdb.recommendations.results)?tmdb.recommendations.results.slice(0,12):[];

            var h='<div class="kkp-det kkp-in">';
            h+='<div class="kkp-dhero"><div class="kkp-dbg" style="background-image:url('+backdrop+')"></div><div class="kkp-dgrad"></div><div class="kkp-dback" id="kkp-dback">'+ic('back')+'</div></div>';
            h+='<div class="kkp-dbody"><div class="kkp-dmain">';
            h+='<div class="kkp-dposter"><img src="'+poster+'" alt="" loading="lazy" onerror="this.src=\'\'"></div>';
            h+='<div class="kkp-dinfo">';
            if(ql)   h+='<span class="kkp-dql">'+ql+'</span>';
            h+='<h1 class="kkp-dtitle">'+name+'</h1>';
            if(orig&&orig!==name) h+='<p class="kkp-dorig">'+orig+'</p>';
            h+='<div class="kkp-dstats">';
            if(year)    h+='<span class="kkp-dst">'+ic('clock')+' '+year+'</span>';
            if(runtime) h+='<span class="kkp-dst">'+ic('clock')+' '+runtime+'</span>';
            if(lang)    h+='<span class="kkp-dst">'+lang+'</span>';
            if(status)  h+='<span class="kkp-dst grn">✓ '+status+'</span>';
            if(mtype==='series')h+='<span class="kkp-dst">'+ic('ep')+' Phim Bộ</span>';
            else if(mtype==='single')h+='<span class="kkp-dst">'+ic('film')+' Phim Lẻ</span>';
            h+='</div>';
            if(tmdbVote) h+='<div class="kkp-rtrow"><div class="kkp-rtbox tm"><span style="font-size:18px">🎬</span><div><div class="kkp-rtval">⭐ '+tmdbVote+'</div><div class="kkp-rtsrc">TMDB</div></div></div></div>';
            h+='<div class="kkp-dacts">';
            if(eps.length) h+='<button class="kkp-btn r" id="kkp-wbtn">'+ic('play')+' Xem Phim</button>';
            h+='<button class="kkp-btn g" id="kkp-sbtn">'+ic('heart')+' Lưu</button>';
            if(trailer) h+='<a href="'+trailer+'" target="_blank" class="kkp-btn y">'+ic('yt')+' Trailer</a>';
            h+='</div>';
            h+='</div></div>';
            if(content) h+='<div class="kkp-dtit">Nội Dung</div><div class="kkp-desc" id="kkp-desc">'+content+'</div><span class="kkp-dmore" id="kkp-dmore">Xem thêm ▾</span>';
            if(tmdbGenres.length){h+='<div class="kkp-genres">';tmdbGenres.forEach(function(g){h+='<span class="kkp-genre">'+g.name+'</span>';});h+='</div>';}
            h+='<div class="kkp-meta">';
            if(dirs.length)   h+='<div class="kkp-mk">Đạo diễn</div><div class="kkp-mv">'+(Array.isArray(dirs)?dirs.join(', '):dirs)+'</div>';
            if(actors.length) h+='<div class="kkp-mk">Diễn viên</div><div class="kkp-mv">'+(Array.isArray(actors)?actors.slice(0,6).join(', '):actors)+'</div>';
            if(cnts.length)   h+='<div class="kkp-mk">Quốc gia</div><div class="kkp-mv">'+cnts.map(function(c){return c.name||c;}).join(', ')+'</div>';
            if(cats.length)   h+='<div class="kkp-mk">Thể loại</div><div class="kkp-mv">'+cats.map(function(c){return c.name||c;}).join(', ')+'</div>';
            h+='</div>';
            h+='<div class="kkp-div"></div>';
            if(eps.length) h+=buildEps(eps);
            if(cast.length){
                h+='<div>'+sh('person','Diễn Viên','')+'<div class="kkp-castrow">';
                cast.forEach(function(c){
                    var img=c.profile_path?tImg(c.profile_path,'w185'):'';
                    h+='<div class="kkp-castcard"><img class="kkp-castimg" src="'+img+'" alt="" loading="lazy" onerror="this.src=\'\'"><div class="kkp-castn">'+(c.name||'')+'</div><div class="kkp-castr">'+(c.character||'')+'</div></div>';
                });
                h+='</div></div>';
            }
            if(recs.length){
                h+='<div>'+sh('film','👍 Có Thể Bạn Thích','')+'<div class="kkp-row">';
                recs.forEach(function(item){
                    item._vote=item.vote_average?parseFloat(item.vote_average).toFixed(1):'';
                    h+=mkCard(item,true);
                });
                h+='</div></div>';
            }
            h+='</div></div>';

            $el.html(h);

            $el.find('#kkp-dback').on('click',function(){ $el.html(saved); bindAll(); });
            $el.find('#kkp-dmore').on('click',function(){
                var $d=$el.find('#kkp-desc'),exp=$d.hasClass('exp');
                $d.toggleClass('exp'); $(this).text(exp?'Xem thêm ▾':'Thu gọn ▴');
            });
            $el.find('#kkp-wbtn').on('click',function(){
                var $e=$el.find('.kkp-eps');
                if($e.length){var sc=$el.closest('.activity__body,.layer__body,body');sc.animate({scrollTop:sc.scrollTop()+$e.position().top-10},350);}
            });
            $el.find('#kkp-sbtn').on('click',function(){ try{Lampa.Noty.show('Đã lưu: '+name);}catch(ex){} });
            $el.on('click','.kkp-svrtab',function(){
                var si=$(this).attr('data-si');
                $el.find('.kkp-svrtab').removeClass('on');$(this).addClass('on');
                $el.find('.kkp-eppanel').removeClass('on');$el.find('.kkp-eppanel[data-si="'+si+'"]').addClass('on');
            });
            $el.on('click','.kkp-ep[data-url]',function(){
                $el.find('.kkp-ep').removeClass('on');$(this).addClass('on');
                playEp($(this).attr('data-url'),name+($(this).attr('data-en')?' - Tập '+$(this).attr('data-en'):''),poster);
            });
            $el.on('click','.kkp-card[data-slug]',function(){ openDetail($(this).attr('data-slug')); });
        }

        function buildEps(episodes) {
            var total=0;
            episodes.forEach(function(s){total+=(s.server_data||[]).length;});
            var h='<div class="kkp-eps"><div class="kkp-epsh"><div class="kkp-epst">'+ic('ep')+' Danh Sách Tập</div><div class="kkp-epsc">'+total+' tập</div></div>';
            if(episodes.length>1){
                h+='<div class="kkp-svrtabs">';
                episodes.forEach(function(s,i){h+='<div class="kkp-svrtab'+(i===0?' on':'')+'" data-si="'+i+'">'+(s.server_name||'Server '+(i+1))+'</div>';});
                h+='</div>';
            }
            episodes.forEach(function(s,si){
                var seps=s.server_data||[];
                h+='<div class="kkp-eppanel'+(si===0?' on':'')+'" data-si="'+si+'"><div class="kkp-epgrid">';
                seps.forEach(function(ep){
                    var url=ep.link_m3u8||ep.link_embed||'', en=ep.name||ep.slug||'';
                    h+='<div class="kkp-ep" data-url="'+url+'" data-en="'+en+'">'+en+'</div>';
                });
                h+='</div></div>';
            });
            h+='</div>';
            return h;
        }

        function playEp(url,title,poster) {
            if(!url) return;
            try{
                if(window.Lampa&&Lampa.Player) Lampa.Player.play({url:url,title:title,poster:poster});
                else window.open(url,'_blank');
            }catch(ex){ window.open(url,'_blank'); }
        }

        function renderHome() {
            var catChips=CATS.map(function(c,i){return '<div class="kkp-chip'+(i===0?' on':'')+'" data-ci="'+i+'">'+c.name+'</div>';}).join('');
            var cntChips=COUNTRIES.map(function(c){return '<div class="kkp-chip" data-cn="'+c.slug+'">'+c.name+'</div>';}).join('');
            $el.html(
                '<div id="kkp-hero" class="kkp-hero">'
                +'<div id="kkp-hbg" class="kkp-hbg"></div>'
                +'<div class="kkp-hgrad"></div>'
                +'<div id="kkp-hbody" class="kkp-hbody">'+ld()+'</div>'
                +'</div>'
                +'<div class="kkp-sbox"><svg viewBox="0 0 24 24"><path d="'+IC.search+'"/></svg><input id="kkp-si" class="kkp-sinput" type="text" placeholder="Tìm kiếm phim..."></div>'
                +'<div style="padding:2px 12px 5px"><div class="kkp-stitle"><div class="kkp-sbar"></div>'+ic('film')+' Thể Loại</div></div>'
                +'<div class="kkp-chips">'+catChips+'</div>'
                +'<div style="padding:2px 12px 5px"><div class="kkp-stitle"><div class="kkp-sbar"></div>🌏 Quốc Gia</div></div>'
                +'<div class="kkp-chips">'+cntChips+'</div>'
                +'<div id="kkp-content">'+ld()+'</div>'
            );
            bindAll();
            loadHero();
            loadHomeRows();
        }

        function bindAll() {
            $el.off();
            $el.find('#kkp-si').on('input',function(){
                var q=$(this).val().trim();
                clearTimeout(_stimer);
                if(q.length>=2){ _stimer=setTimeout(function(){doSearch(q);},480); }
                else if(q.length===0){ loadHomeRows(); }
            });
            $el.on('click','.kkp-chip[data-ci]',function(){
                $el.find('.kkp-chip[data-ci]').removeClass('on');$(this).addClass('on');
                $el.find('.kkp-chip[data-cn]').removeClass('on');
                loadCatRows(CATS[parseInt($(this).attr('data-ci'))],1);
            });
            $el.on('click','.kkp-chip[data-cn]',function(){
                $el.find('.kkp-chip[data-cn]').removeClass('on');$(this).addClass('on');
                $el.find('.kkp-chip[data-ci]').removeClass('on');
                loadCountryRows($(this).attr('data-cn'),1);
            });
            $el.on('click','.kkp-card[data-slug]',function(){ openDetail($(this).attr('data-slug')); });
            $el.on('click','.kkp-smore[data-more]',function(){ openFullList($(this).attr('data-more')); });
        }

        renderHome();
    },

    // Lampa yêu cầu các method này
    start: function() {},
    pause: function() {},
    stop:  function() {},

    destroy: function() {
        if (this.render) this.render.remove();
    },

    // Lampa lấy element qua this.render
    render: function() {
        return this.render;
    }
};

// ════════════════════════════════════════════════════════════
//  ĐĂNG KÝ PLUGIN – đúng cách LNUM
// ════════════════════════════════════════════════════════════
function startPlugin() {
    // Tạo component object factory
    Lampa.Component.add('kkphim', function() {
        // Clone component
        var c = Object.assign({}, component);
        c.create();
        return c;
    });

    // Thêm menu
    var menuAdded = false;
    function addMenu() {
        if (menuAdded) return;
        var ul = document.querySelector('.menu__list');
        if (!ul) return;
        menuAdded = true;

        var li = document.createElement('li');
        li.className = 'menu__item selector';
        li.setAttribute('data-action', 'kkphim');
        li.innerHTML = '<div class="menu__ico" style="font-size:22px">🎬</div>'
                     + '<div class="menu__text">KKPhim</div>';

        li.addEventListener('click', function() {
            Lampa.Activity.push({
                url:       '',
                title:     'KKPhim',
                component: 'kkphim',
                page:      1
            });
        });

        ul.appendChild(li);
    }

    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            addMenu();
            setTimeout(addMenu, 1000);
            try { Lampa.Noty.show('🎬 KKPhim sẵn sàng!'); } catch(ex) {}
        }
    });

    // Fallback thêm menu
    setTimeout(addMenu, 2000);
    setTimeout(addMenu, 5000);
}

// ─── BOOT ────────────────────────────────────────────────
function boot() {
    if (typeof Lampa === 'undefined' || !Lampa.Component || !Lampa.Listener) {
        setTimeout(boot, 300);
        return;
    }

    // Đăng ký đúng cách như LNUM
    Lampa.Component.add('kkphim', {
        create: function() {
            injectCSS();
            var self = this;
            self.render = $('<div class="kkp kkp-in"></div>');

            var $el    = self.render;
            var _snap  = null;

            function heroTMDB(item) {
                var bg=item.backdrop_path?(TMDB_IMG+'w1280'+item.backdrop_path):'';
                var poster=item.poster_path?(TMDB_IMG+'w500'+item.poster_path):'';
                var name=item.title||item.name||'';
                var orig=item.original_title||item.original_name||'';
                var year=(item.release_date||item.first_air_date||'').substr(0,4);
                var vote=item.vote_average?parseFloat(item.vote_average).toFixed(1):'';
                var mtype=item.media_type||'movie';
                var slug='__t__'+mtype+'__'+item.id;
                $el.find('#kkp-hbg').css('background-image','url('+bg+')');
                $el.find('#kkp-hbody').html(
                    '<div class="kkp-hposter"><img src="'+poster+'" alt="" loading="lazy"></div>'
                    +'<div class="kkp-hinfo">'
                    +'<div class="kkp-hbadge">'+ic('fire')+' Xu Hướng</div>'
                    +'<div class="kkp-htitle">'+name+'</div>'
                    +(orig&&orig!==name?'<div class="kkp-horig">'+orig+'</div>':'')
                    +'<div class="kkp-htags">'
                    +(year?'<span class="kkp-htag">'+ic('clock')+' '+year+'</span>':'')
                    +(vote?'<span class="kkp-htag rt">⭐ '+vote+'</span>':'')
                    +'<span class="kkp-htag">'+(mtype==='tv'?'TV Series':'Phim')+'</span>'
                    +'</div>'
                    +'<div class="kkp-hbtns">'
                    +'<button class="kkp-hbtn r" data-slug="'+slug+'">'+ic('play')+' Xem Ngay</button>'
                    +'<button class="kkp-hbtn g" data-slug="'+slug+'">'+ic('film')+' Chi Tiết</button>'
                    +'</div></div>'
                );
                $el.find('.kkp-hbtn').off('click').on('click',function(){ openDetail($(this).attr('data-slug')); });
            }

            function heroKK(m) {
                var bg=imgUrl(m.thumb_url||m.poster_url),poster=imgUrl(m.poster_url||m.thumb_url);
                $el.find('#kkp-hbg').css('background-image','url('+bg+')');
                $el.find('#kkp-hbody').html(
                    '<div class="kkp-hposter"><img src="'+poster+'" alt="" loading="lazy"></div>'
                    +'<div class="kkp-hinfo">'
                    +'<div class="kkp-hbadge">'+ic('fire')+' Nổi Bật</div>'
                    +'<div class="kkp-htitle">'+(m.name||'')+'</div>'
                    +(m.origin_name?'<div class="kkp-horig">'+m.origin_name+'</div>':'')
                    +'<div class="kkp-htags">'
                    +(m.quality?'<span class="kkp-htag ql">'+m.quality+'</span>':'')
                    +(m.year?'<span class="kkp-htag">'+ic('clock')+' '+m.year+'</span>':'')
                    +'</div>'
                    +'<div class="kkp-hbtns">'
                    +'<button class="kkp-hbtn r" data-slug="'+(m.slug||'')+'">'+ic('play')+' Xem Ngay</button>'
                    +'<button class="kkp-hbtn g" data-slug="'+(m.slug||'')+'">'+ic('film')+' Chi Tiết</button>'
                    +'</div></div>'
                );
                $el.find('.kkp-hbtn').off('click').on('click',function(){ openDetail($(this).attr('data-slug')); });
            }

            function loadHero() {
                tmdbTrending(function(res){
                    if(res&&res.length){heroTMDB(res[Math.floor(Math.random()*Math.min(res.length,8))]);return;}
                    apiList('phim-le',1,function(items){if(items&&items.length)heroKK(items[Math.floor(Math.random()*Math.min(items.length,8))]);});
                });
            }

            function loadHomeRows() {
                var $c=$el.find('#kkp-content');
                var h='<div>'+sh('fire','🔥 Xu Hướng TMDB','')+'<div id="kkp-tmdb-row" class="kkp-row">'+ld()+'</div></div>';
                HOME_ROWS.forEach(function(r){
                    h+='<div>'+sh(r.icon,r.title,'data-more="'+r.type+'"')+'<div id="kkp-r-'+r.type+'" class="kkp-row">'+ld()+'</div></div>';
                });
                $c.html(h);
                tmdbTrending(function(res){
                    var h2='';(res||[]).slice(0,20).forEach(function(item){item._vote=item.vote_average?parseFloat(item.vote_average).toFixed(1):'';h2+=mkCard(item,true);});
                    $c.find('#kkp-tmdb-row').html(h2||em());
                });
                HOME_ROWS.forEach(function(r){
                    apiList(r.type,1,function(items){
                        var h3='';(items||[]).slice(0,20).forEach(function(m){h3+=mkCard(m,false);});
                        $c.find('#kkp-r-'+r.type).html(h3||em());
                    });
                });
            }

            function loadCatRows(cat,page) {
                var $c=$el.find('#kkp-content');$c.html(ld());
                var fn=cat.api==='list'?function(cb){apiList(cat.slug,page,cb);}:function(cb){apiCat(cat.slug,page,cb);};
                fn(function(items,tot){
                    var h='<div class="kkp-in">'+sh('film',cat.name,'')+'<div class="kkp-grid">';
                    (items||[]).forEach(function(m){h+=mkCard(m,false);});
                    h+='</div>'+mkPages(page,tot)+'</div>';
                    $c.html(h);
                    $c.off('click.pg').on('click.pg','.kkp-pg[data-p]',function(){loadCatRows(cat,parseInt($(this).attr('data-p')));});
                });
            }

            function loadCountryRows(slug,page) {
                var $c=$el.find('#kkp-content'),cobj=null;
                COUNTRIES.forEach(function(c){if(c.slug===slug)cobj=c;});
                $c.html(ld());
                apiCountry(slug,page,function(items,tot){
                    var h='<div class="kkp-in">'+sh('film',cobj?cobj.name:slug,'')+'<div class="kkp-grid">';
                    (items||[]).forEach(function(m){h+=mkCard(m,false);});
                    h+='</div>'+mkPages(page,tot)+'</div>';
                    $c.html(h);
                    $c.off('click.pg').on('click.pg','.kkp-pg[data-p]',function(){loadCountryRows(slug,parseInt($(this).attr('data-p')));});
                });
            }

            function doSearch(q) {
                var $c=$el.find('#kkp-content');$c.html(ld());
                apiSearch(q,function(items){
                    if(!items||!items.length){$c.html(em('Không tìm thấy: '+q));return;}
                    var h='<div class="kkp-in">'+sh('search','Kết quả: "'+q+'" ('+items.length+')','')+'<div class="kkp-grid">';
                    items.forEach(function(m){h+=mkCard(m,false);});
                    h+='</div></div>';
                    $c.html(h);
                });
            }

            function openFullList(type,page) {
                page=page||1;
                var catobj=null;CATS.forEach(function(c){if(c.slug===type)catobj=c;});
                _snap=$el.html();$el.html(ld());
                apiList(type,page,function(items,tot){
                    var h='<div class="kkp-in" style="padding:10px">'
                        +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div class="kkp-dback" id="kkp-list-back">'+ic('back')+'</div>'
                        +'<span style="font-size:clamp(13px,2.8vw,19px);font-weight:800">'+(catobj?catobj.name:type)+'</span></div>'
                        +'<div class="kkp-grid">';
                    (items||[]).forEach(function(m){h+=mkCard(m,false);});
                    h+='</div>'+mkPages(page,tot)+'</div>';
                    $el.html(h);
                    $el.find('#kkp-list-back').on('click',function(){$el.html(_snap);_snap=null;bindAll();});
                    $el.on('click','.kkp-pg[data-p]',function(){openFullList(type,parseInt($(this).attr('data-p')));});
                    $el.on('click','.kkp-card[data-slug]',function(){openDetail($(this).attr('data-slug'));});
                });
            }

            function openDetail(slug) {
                var saved=$el.html();$el.html(ld());
                if(slug.indexOf('__t__')===0){
                    var pts=slug.replace('__t__','').split('__');
                    tmdbDetail(pts[1]||'',pts[0]||'movie',function(td){if(!td){$el.html(em());return;}renderDetail(null,[],td,saved);});
                    return;
                }
                apiDetail(slug,function(data){
                    if(!data){$el.html(em('Không tải được'));return;}
                    var movie=data.movie||data,eps=data.episodes||[];
                    tmdbSearch(movie.origin_name||movie.name||'',movie.year,function(tb){
                        if(tb&&tb.id){tmdbDetail(tb.id,tb.media_type||'movie',function(td){renderDetail(movie,eps,td,saved);});}
                        else{renderDetail(movie,eps,null,saved);}
                    });
                });
            }

            function renderDetail(movie,eps,tmdb,saved) {
                var name=(movie&&movie.name)||(tmdb&&(tmdb.title||tmdb.name))||'';
                var orig=(movie&&movie.origin_name)||(tmdb&&(tmdb.original_title||tmdb.original_name))||'';
                var year=(movie&&movie.year)||(tmdb&&((tmdb.release_date||tmdb.first_air_date||'').substr(0,4)))||'';
                var ql=(movie&&movie.quality)||'HD';
                var status=(movie&&movie.status)||'';
                var runtime=(movie&&movie.time)||(tmdb&&tmdb.runtime?(Math.floor(tmdb.runtime/60)+'h '+(tmdb.runtime%60)+'m'):'')||'';
                var lang=(movie&&movie.lang)||'';
                var content=strip((movie&&movie.content)||(tmdb&&tmdb.overview)||'');
                var mtype=(movie&&movie.type)||'';
                var actors=(movie&&movie.actor)||[];
                var dirs=(movie&&movie.director)||[];
                var cats=(movie&&movie.category)||[];
                var cnts=(movie&&movie.country)||[];
                var poster=(tmdb&&tmdb.poster_path)?tImg(tmdb.poster_path,'w500'):imgUrl((movie&&(movie.poster_url||movie.thumb_url))||'');
                var backdrop=(tmdb&&tmdb.backdrop_path)?(TMDB_IMG+'w1280'+tmdb.backdrop_path):imgUrl((movie&&(movie.thumb_url||movie.poster_url))||'');
                var tmdbVote=(tmdb&&tmdb.vote_average)?parseFloat(tmdb.vote_average).toFixed(1):'';
                var tmdbGenres=(tmdb&&tmdb.genres)||[];
                var cast=(tmdb&&tmdb.credits&&tmdb.credits.cast)?tmdb.credits.cast.slice(0,15):[];
                var trailer='';
                if(tmdb&&tmdb.videos&&tmdb.videos.results){for(var vi=0;vi<tmdb.videos.results.length;vi++){var v=tmdb.videos.results[vi];if(v.type==='Trailer'&&v.site==='YouTube'){trailer='https://www.youtube.com/watch?v='+v.key;break;}}}
                var recs=(tmdb&&tmdb.recommendations&&tmdb.recommendations.results)?tmdb.recommendations.results.slice(0,12):[];
                var h='<div class="kkp-det kkp-in">';
                h+='<div class="kkp-dhero"><div class="kkp-dbg" style="background-image:url('+backdrop+')"></div><div class="kkp-dgrad"></div><div class="kkp-dback" id="kkp-dback">'+ic('back')+'</div></div>';
                h+='<div class="kkp-dbody"><div class="kkp-dmain">';
                h+='<div class="kkp-dposter"><img src="'+poster+'" alt="" loading="lazy" onerror="this.src=\'\'"></div>';
                h+='<div class="kkp-dinfo">';
                if(ql)h+='<span class="kkp-dql">'+ql+'</span>';
                h+='<h1 class="kkp-dtitle">'+name+'</h1>';
                if(orig&&orig!==name)h+='<p class="kkp-dorig">'+orig+'</p>';
                h+='<div class="kkp-dstats">';
                if(year)h+='<span class="kkp-dst">'+ic('clock')+' '+year+'</span>';
                if(runtime)h+='<span class="kkp-dst">'+ic('clock')+' '+runtime+'</span>';
                if(lang)h+='<span class="kkp-dst">'+lang+'</span>';
                if(status)h+='<span class="kkp-dst grn">✓ '+status+'</span>';
                if(mtype==='series')h+='<span class="kkp-dst">'+ic('ep')+' Phim Bộ</span>';
                else if(mtype==='single')h+='<span class="kkp-dst">'+ic('film')+' Phim Lẻ</span>';
                h+='</div>';
                if(tmdbVote)h+='<div class="kkp-rtrow"><div class="kkp-rtbox tm"><span style="font-size:18px">🎬</span><div><div class="kkp-rtval">⭐ '+tmdbVote+'</div><div class="kkp-rtsrc">TMDB</div></div></div></div>';
                h+='<div class="kkp-dacts">';
                if(eps.length)h+='<button class="kkp-btn r" id="kkp-wbtn">'+ic('play')+' Xem Phim</button>';
                h+='<button class="kkp-btn g" id="kkp-sbtn">'+ic('heart')+' Lưu</button>';
                if(trailer)h+='<a href="'+trailer+'" target="_blank" class="kkp-btn y">'+ic('yt')+' Trailer</a>';
                h+='</div></div></div>';
                if(content)h+='<div class="kkp-dtit">Nội Dung</div><div class="kkp-desc" id="kkp-desc">'+content+'</div><span class="kkp-dmore" id="kkp-dmore">Xem thêm ▾</span>';
                if(tmdbGenres.length){h+='<div class="kkp-genres">';tmdbGenres.forEach(function(g){h+='<span class="kkp-genre">'+g.name+'</span>';});h+='</div>';}
                h+='<div class="kkp-meta">';
                if(dirs.length)h+='<div class="kkp-mk">Đạo diễn</div><div class="kkp-mv">'+(Array.isArray(dirs)?dirs.join(', '):dirs)+'</div>';
                if(actors.length)h+='<div class="kkp-mk">Diễn viên</div><div class="kkp-mv">'+(Array.isArray(actors)?actors.slice(0,6).join(', '):actors)+'</div>';
                if(cnts.length)h+='<div class="kkp-mk">Quốc gia</div><div class="kkp-mv">'+cnts.map(function(c){return c.name||c;}).join(', ')+'</div>';
                if(cats.length)h+='<div class="kkp-mk">Thể loại</div><div class="kkp-mv">'+cats.map(function(c){return c.name||c;}).join(', ')+'</div>';
                h+='</div><div class="kkp-div"></div>';
                if(eps.length){
                    var total=0;eps.forEach(function(s){total+=(s.server_data||[]).length;});
                    h+='<div class="kkp-eps"><div class="kkp-epsh"><div class="kkp-epst">'+ic('ep')+' Danh Sách Tập</div><div class="kkp-epsc">'+total+' tập</div></div>';
                    if(eps.length>1){h+='<div class="kkp-svrtabs">';eps.forEach(function(s,i){h+='<div class="kkp-svrtab'+(i===0?' on':'')+'" data-si="'+i+'">'+(s.server_name||'Server '+(i+1))+'</div>';});h+='</div>';}
                    eps.forEach(function(s,si){var seps=s.server_data||[];h+='<div class="kkp-eppanel'+(si===0?' on':'')+'" data-si="'+si+'"><div class="kkp-epgrid">';seps.forEach(function(ep){var url=ep.link_m3u8||ep.link_embed||'',en=ep.name||ep.slug||'';h+='<div class="kkp-ep" data-url="'+url+'" data-en="'+en+'">'+en+'</div>';});h+='</div></div>';});
                    h+='</div>';
                }
                if(cast.length){h+='<div>'+sh('person','Diễn Viên','')+'<div class="kkp-castrow">';cast.forEach(function(c){var img=c.profile_path?tImg(c.profile_path,'w185'):'';h+='<div class="kkp-castcard"><img class="kkp-castimg" src="'+img+'" alt="" loading="lazy" onerror="this.src=\'\'"><div class="kkp-castn">'+(c.name||'')+'</div><div class="kkp-castr">'+(c.character||'')+'</div></div>';});h+='</div></div>';}
                if(recs.length){h+='<div>'+sh('film','👍 Có Thể Bạn Thích','')+'<div class="kkp-row">';recs.forEach(function(item){item._vote=item.vote_average?parseFloat(item.vote_average).toFixed(1):'';h+=mkCard(item,true);});h+='</div></div>';}
                h+='</div></div>';
                $el.html(h);
                $el.find('#kkp-dback').on('click',function(){$el.html(saved);bindAll();});
                $el.find('#kkp-dmore').on('click',function(){var $d=$el.find('#kkp-desc'),exp=$d.hasClass('exp');$d.toggleClass('exp');$(this).text(exp?'Xem thêm ▾':'Thu gọn ▴');});
                $el.find('#kkp-wbtn').on('click',function(){var $e=$el.find('.kkp-eps');if($e.length){try{var sc=$e.closest('.activity__body');if(sc.length)sc.scrollTop(sc.scrollTop()+$e.position().top-10);}catch(ex){}}});
                $el.find('#kkp-sbtn').on('click',function(){try{Lampa.Noty.show('Đã lưu: '+name);}catch(ex){}});
                $el.on('click','.kkp-svrtab',function(){var si=$(this).attr('data-si');$el.find('.kkp-svrtab').removeClass('on');$(this).addClass('on');$el.find('.kkp-eppanel').removeClass('on');$el.find('.kkp-eppanel[data-si="'+si+'"]').addClass('on');});
                $el.on('click','.kkp-ep[data-url]',function(){$el.find('.kkp-ep').removeClass('on');$(this).addClass('on');var url=$(this).attr('data-url'),en=$(this).attr('data-en');try{if(window.Lampa&&Lampa.Player)Lampa.Player.play({url:url,title:name+(en?' - Tập '+en:''),poster:poster});else window.open(url,'_blank');}catch(ex){window.open(url,'_blank');}});
                $el.on('click','.kkp-card[data-slug]',function(){openDetail($(this).attr('data-slug'));});
            }

            function bindAll() {
                $el.off();
                $el.find('#kkp-si').on('input',function(){
                    var q=$(this).val().trim();clearTimeout(_stimer);
                    if(q.length>=2){_stimer=setTimeout(function(){doSearch(q);},480);}
                    else if(q.length===0){loadHomeRows();}
                });
                $el.on('click','.kkp-chip[data-ci]',function(){
                    $el.find('.kkp-chip[data-ci]').removeClass('on');$(this).addClass('on');
                    $el.find('.kkp-chip[data-cn]').removeClass('on');
                    loadCatRows(CATS[parseInt($(this).attr('data-ci'))],1);
                });
                $el.on('click','.kkp-chip[data-cn]',function(){
                    $el.find('.kkp-chip[data-cn]').removeClass('on');$(this).addClass('on');
                    $el.find('.kkp-chip[data-ci]').removeClass('on');
                    loadCountryRows($(this).attr('data-cn'),1);
                });
                $el.on('click','.kkp-card[data-slug]',function(){openDetail($(this).attr('data-slug'));});
                $el.on('click','.kkp-smore[data-more]',function(){openFullList($(this).attr('data-more'));});
            }

            // Khởi tạo home
            var catChips=CATS.map(function(c,i){return '<div class="kkp-chip'+(i===0?' on':'')+'" data-ci="'+i+'">'+c.name+'</div>';}).join('');
            var cntChips=COUNTRIES.map(function(c){return '<div class="kkp-chip" data-cn="'+c.slug+'">'+c.name+'</div>';}).join('');
            $el.html(
                '<div id="kkp-hero" class="kkp-hero">'
                +'<div id="kkp-hbg" class="kkp-hbg"></div>'
                +'<div class="kkp-hgrad"></div>'
                +'<div id="kkp-hbody" class="kkp-hbody">'+ld()+'</div>'
                +'</div>'
                +'<div class="kkp-sbox"><svg viewBox="0 0 24 24" fill="rgba(255,255,255,.4)" style="width:17px;height:17px;flex-shrink:0"><path d="'+IC.search+'"/></svg><input id="kkp-si" class="kkp-sinput" type="text" placeholder="Tìm kiếm phim..."></div>'
                +'<div style="padding:2px 12px 5px"><div class="kkp-stitle"><div class="kkp-sbar"></div>'+ic('film')+' Thể Loại</div></div>'
                +'<div class="kkp-chips">'+catChips+'</div>'
                +'<div style="padding:2px 12px 5px"><div class="kkp-stitle"><div class="kkp-sbar"></div>🌏 Quốc Gia</div></div>'
                +'<div class="kkp-chips">'+cntChips+'</div>'
                +'<div id="kkp-content">'+ld()+'</div>'
            );
            bindAll();
            loadHero();
            loadHomeRows();
        },

        start:   function() {},
        pause:   function() {},
        stop:    function() {},
        destroy: function() { if(this.render) this.render.remove(); }
    });

    // Thêm menu item
    var _menuDone = false;
    function addMenu() {
        if (_menuDone) return;
        var ul = document.querySelector('.menu__list');
        if (!ul) return;
        _menuDone = true;
        var li = document.createElement('li');
        li.className = 'menu__item selector';
        li.innerHTML = '<div class="menu__ico" style="font-size:20px">🎬</div><div class="menu__text">KKPhim</div>';
        li.addEventListener('click', function() {
            Lampa.Activity.push({
                url: '', title: 'KKPhim', component: 'kkphim', page: 1
            });
        });
        ul.appendChild(li);
    }

    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            addMenu();
            setTimeout(addMenu, 1500);
            try { Lampa.Noty.show('🎬 KKPhim sẵn sàng!'); } catch(ex) {}
        }
    });
    setTimeout(addMenu, 3000);
}

// Start
var _bootInterval = setInterval(function() {
    if (window.Lampa && Lampa.Component && Lampa.Listener && Lampa.Activity) {
        clearInterval(_bootInterval);
        boot();
    }
}, 200);
setTimeout(function(){ clearInterval(_bootInterval); }, 30000);

})();