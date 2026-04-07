(function() {
'use strict';

var PLUGIN_ID   = 'kkphim';
var PLUGIN_VER  = '1.0.0';
var KK_API      = 'https://phimapi.com';
var TMDB_KEY    = '6979c8ec101ed849f44d197c86582644';
var TMDB_API    = 'https://api.themoviedb.org/3';
var TMDB_IMG    = 'https://image.tmdb.org/t/p/';
var cache       = {};

// ─── UTILS ───────────────────────────────────────────────
function cacheGet(k) {
    var e = cache[k];
    if (e && Date.now() - e.t < 300000) return e.d;
    return null;
}
function cacheSet(k, d) {
    cache[k] = { d: d, t: Date.now() };
}

function request(url, ok, fail) {
    var cached = cacheGet(url);
    if (cached) { ok(cached); return; }
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        timeout: 10000,
        success: function(data) {
            cacheSet(url, data);
            ok(data);
        },
        error: function() {
            if (fail) fail();
        }
    });
}

function imgUrl(url) {
    if (!url) return '';
    if (url.indexOf('http') === 0) return url;
    return 'https://phimimg.com/' + url;
}

function tmdbImg(path, size) {
    if (!path) return '';
    return TMDB_IMG + (size || 'w300') + path;
}

function stripTags(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
}

// ─── CSS ─────────────────────────────────────────────────
var CSS = [
'.kkp-wrap { background: #0d0d14; min-height: 100vh; color: #fff; font-family: sans-serif; }',

// Hero
'.kkp-hero { position: relative; width: 100%; height: 55vw; max-height: 620px; min-height: 300px; overflow: hidden; margin-bottom: 30px; }',
'.kkp-hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; filter: brightness(.4); transition: background .6s; }',
'.kkp-hero-grad { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 20%, rgba(13,13,20,.7) 60%, #0d0d14 100%); }',
'.kkp-hero-body { position: absolute; bottom: 0; left: 0; right: 0; padding: 24px 28px; display: flex; align-items: flex-end; gap: 20px; }',
'.kkp-hero-poster { width: 110px; min-width: 110px; height: 165px; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,.7); border: 2px solid rgba(255,255,255,.15); flex-shrink: 0; }',
'.kkp-hero-poster img { width: 100%; height: 100%; object-fit: cover; }',
'.kkp-hero-info { flex: 1; min-width: 0; }',
'.kkp-hero-badge { display: inline-block; background: #e50914; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 3px 10px; border-radius: 4px; margin-bottom: 8px; }',
'.kkp-hero-title { font-size: clamp(18px,4vw,34px); font-weight: 900; color: #fff; margin: 0 0 4px; line-height: 1.2; text-shadow: 0 2px 10px rgba(0,0,0,.5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
'.kkp-hero-orig { font-size: clamp(12px,2vw,15px); color: rgba(255,255,255,.55); margin: 0 0 10px; font-style: italic; }',
'.kkp-hero-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }',
'.kkp-hero-tag { font-size: clamp(11px,1.8vw,13px); background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); color: rgba(255,255,255,.9); padding: 3px 10px; border-radius: 20px; }',
'.kkp-hero-tag.ql { background: rgba(245,166,35,.85); border-color: transparent; font-weight: 700; }',
'.kkp-hero-tag.rt { background: rgba(39,174,96,.85); border-color: transparent; font-weight: 700; }',
'.kkp-hero-btns { display: flex; gap: 10px; flex-wrap: wrap; }',
'.kkp-hero-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px; font-size: clamp(13px,2vw,15px); font-weight: 700; cursor: pointer; border: none; outline: none; transition: all .2s; }',
'.kkp-hero-btn.primary { background: #e50914; color: #fff; box-shadow: 0 4px 16px rgba(229,9,20,.5); }',
'.kkp-hero-btn.primary:hover { background: #ff1f2a; transform: translateY(-2px); }',
'.kkp-hero-btn.secondary { background: rgba(255,255,255,.15); color: #fff; border: 1px solid rgba(255,255,255,.3); backdrop-filter: blur(6px); }',
'.kkp-hero-btn.secondary:hover { background: rgba(255,255,255,.25); transform: translateY(-2px); }',

// Search
'.kkp-search-wrap { padding: 0 16px 16px; }',
'.kkp-search-box { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.12); border-radius: 12px; padding: 10px 16px; transition: all .3s; }',
'.kkp-search-box:focus-within { border-color: rgba(229,9,20,.6); background: rgba(255,255,255,.1); box-shadow: 0 0 0 3px rgba(229,9,20,.12); }',
'.kkp-search-box svg { width: 18px; height: 18px; fill: rgba(255,255,255,.4); flex-shrink: 0; }',
'.kkp-search-input { flex: 1; background: none; border: none; outline: none; color: #fff; font-size: clamp(13px,2.5vw,16px); caret-color: #e50914; }',
'.kkp-search-input::placeholder { color: rgba(255,255,255,.3); }',

// Tabs / cats
'.kkp-cats-wrap { padding: 0 16px 16px; }',
'.kkp-cats { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }',
'.kkp-cats::-webkit-scrollbar { display: none; }',
'.kkp-cat { white-space: nowrap; padding: 7px 16px; border-radius: 20px; font-size: clamp(12px,2vw,14px); font-weight: 600; cursor: pointer; background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.1); color: rgba(255,255,255,.7); transition: all .2s; user-select: none; }',
'.kkp-cat:hover { background: rgba(229,9,20,.2); border-color: rgba(229,9,20,.4); color: #fff; }',
'.kkp-cat.on { background: #e50914; border-color: transparent; color: #fff; box-shadow: 0 4px 14px rgba(229,9,20,.4); }',

// Section
'.kkp-section { margin-bottom: 28px; }',
'.kkp-sec-head { display: flex; align-items: center; justify-content: space-between; padding: 0 16px 12px; }',
'.kkp-sec-title { display: flex; align-items: center; gap: 8px; font-size: clamp(14px,3vw,18px); font-weight: 800; color: #fff; }',
'.kkp-sec-bar { width: 4px; height: 20px; background: linear-gradient(#e50914,#ff6b6b); border-radius: 2px; flex-shrink: 0; }',
'.kkp-sec-more { font-size: 13px; color: rgba(255,255,255,.45); cursor: pointer; padding: 4px 10px; border-radius: 6px; transition: all .2s; }',
'.kkp-sec-more:hover { color: #e50914; background: rgba(229,9,20,.1); }',

// Row (horizontal scroll)
'.kkp-row { display: flex; gap: 12px; padding: 4px 16px 8px; overflow-x: auto; scrollbar-width: thin; scrollbar-color: rgba(229,9,20,.4) transparent; }',
'.kkp-row::-webkit-scrollbar { height: 3px; }',
'.kkp-row::-webkit-scrollbar-thumb { background: rgba(229,9,20,.4); border-radius: 2px; }',

// Grid
'.kkp-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(clamp(120px,20vw,170px),1fr)); gap: 14px; padding: 4px 16px 8px; }',

// Card
'.kkp-card { flex-shrink: 0; width: clamp(120px,20vw,170px); cursor: pointer; transition: transform .3s cubic-bezier(.34,1.56,.64,1); }',
'.kkp-grid .kkp-card { width: 100%; }',
'.kkp-card:hover { transform: translateY(-8px) scale(1.03); z-index: 5; }',
'.kkp-card-poster { width: 100%; aspect-ratio: 2/3; border-radius: 10px; overflow: hidden; position: relative; background: rgba(255,255,255,.05); box-shadow: 0 4px 16px rgba(0,0,0,.4); }',
'.kkp-card:hover .kkp-card-poster,.kkp-card.sel .kkp-card-poster { box-shadow: 0 0 0 3px #e50914, 0 8px 24px rgba(229,9,20,.4); }',
'.kkp-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; display: block; }',
'.kkp-card:hover .kkp-card-img { transform: scale(1.08); }',
'.kkp-card-overlay { position: absolute; inset: 0; background: linear-gradient(to top,rgba(0,0,0,.8) 0%,transparent 60%); opacity: 0; transition: opacity .3s; display: flex; align-items: center; justify-content: center; }',
'.kkp-card:hover .kkp-card-overlay { opacity: 1; }',
'.kkp-card-play { width: 42px; height: 42px; background: rgba(229,9,20,.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; }',
'.kkp-card-play svg { width: 18px; height: 18px; fill: #fff; margin-left: 2px; }',
'.kkp-card-bgs { position: absolute; top: 6px; left: 6px; right: 6px; display: flex; justify-content: space-between; pointer-events: none; }',
'.kkp-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; backdrop-filter: blur(6px); }',
'.kkp-badge.ql { background: rgba(245,166,35,.9); color: #fff; }',
'.kkp-badge.ep { background: rgba(229,9,20,.85); color: #fff; }',
'.kkp-badge.rt { background: rgba(39,174,96,.85); color: #fff; }',
'.kkp-card-name { font-size: clamp(12px,2.2vw,14px); font-weight: 700; color: #fff; margin: 8px 0 3px; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }',
'.kkp-card-sub { font-size: clamp(10px,1.8vw,12px); color: rgba(255,255,255,.45); display: flex; align-items: center; gap: 4px; }',
'.kkp-card-dot { width: 3px; height: 3px; background: rgba(255,255,255,.3); border-radius: 50%; }',

// Detail page
'.kkp-detail { background: #0d0d14; min-height: 100vh; }',
'.kkp-det-hero { position: relative; height: 52vw; max-height: 560px; min-height: 260px; overflow: hidden; }',
'.kkp-det-bg { position: absolute; inset: 0; background-size: cover; background-position: center 20%; filter: brightness(.35); }',
'.kkp-det-grad { position: absolute; inset: 0; background: linear-gradient(180deg,transparent 0%,rgba(13,13,20,.9) 75%,#0d0d14 100%); }',
'.kkp-det-back { position: absolute; top: 14px; left: 14px; width: 38px; height: 38px; background: rgba(0,0,0,.55); backdrop-filter: blur(8px); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(255,255,255,.2); color: #fff; z-index: 10; transition: all .2s; }',
'.kkp-det-back:hover { background: rgba(229,9,20,.7); border-color: transparent; }',
'.kkp-det-back svg { width: 20px; height: 20px; fill: currentColor; }',
'.kkp-det-body { padding: 0 16px 40px; margin-top: -40px; position: relative; }',
'.kkp-det-main { display: flex; gap: 18px; align-items: flex-start; margin-bottom: 20px; }',
'.kkp-det-poster { width: clamp(90px,22vw,150px); flex-shrink: 0; }',
'.kkp-det-poster img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,.6); border: 2px solid rgba(255,255,255,.1); }',
'.kkp-det-info { flex: 1; min-width: 0; padding-top: 6px; }',
'.kkp-det-ql { display: inline-block; background: linear-gradient(135deg,#f5a623,#e07b00); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 4px; margin-bottom: 8px; }',
'.kkp-det-title { font-size: clamp(16px,4vw,28px); font-weight: 900; color: #fff; margin: 0 0 4px; line-height: 1.2; }',
'.kkp-det-orig { font-size: clamp(11px,2vw,13px); color: rgba(255,255,255,.5); margin: 0 0 12px; font-style: italic; }',
'.kkp-det-stats { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }',
'.kkp-det-stat { display: inline-flex; align-items: center; gap: 4px; font-size: clamp(11px,1.8vw,13px); color: rgba(255,255,255,.8); background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.1); padding: 4px 10px; border-radius: 6px; }',
'.kkp-det-stat.grn { color: #2ecc71; }',
'.kkp-det-stat.ylw { color: #f5c518; }',
'.kkp-rating-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }',
'.kkp-rating-box { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 8px 14px; }',
'.kkp-rating-box.tmdb { border-color: rgba(1,180,228,.3); }',
'.kkp-rating-box.imdb { border-color: rgba(245,197,24,.3); }',
'.kkp-rating-icon { font-size: 20px; }',
'.kkp-rating-val { font-size: 16px; font-weight: 800; }',
'.kkp-rating-src { font-size: 11px; color: rgba(255,255,255,.45); }',
'.kkp-rating-box.tmdb .kkp-rating-val { color: #01b4e4; }',
'.kkp-rating-box.imdb .kkp-rating-val { color: #f5c518; }',
'.kkp-det-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }',
'.kkp-btn { display: inline-flex; align-items: center; gap: 6px; padding: 11px 22px; border-radius: 8px; font-size: clamp(13px,2.5vw,15px); font-weight: 700; cursor: pointer; border: none; outline: none; transition: all .25s; user-select: none; }',
'.kkp-btn.red { background: #e50914; color: #fff; box-shadow: 0 4px 14px rgba(229,9,20,.4); }',
'.kkp-btn.red:hover { box-shadow: 0 6px 20px rgba(229,9,20,.6); transform: translateY(-2px); }',
'.kkp-btn.ghost { background: rgba(255,255,255,.1); color: #fff; border: 1.5px solid rgba(255,255,255,.2); }',
'.kkp-btn.ghost:hover { background: rgba(255,255,255,.18); transform: translateY(-2px); }',
'.kkp-btn.yt { background: rgba(255,0,0,.15); color: #ff4444; border: 1.5px solid rgba(255,0,0,.3); }',
'.kkp-btn.yt:hover { background: rgba(255,0,0,.25); }',
'.kkp-btn svg { width: 18px; height: 18px; fill: currentColor; }',

// Description
'.kkp-desc-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,.5); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }',
'.kkp-desc-text { font-size: clamp(13px,2.2vw,15px); color: rgba(255,255,255,.8); line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }',
'.kkp-desc-text.exp { -webkit-line-clamp: unset; }',
'.kkp-desc-more { color: #e50914; font-size: 13px; cursor: pointer; margin-top: 5px; display: inline-block; }',

// Meta
'.kkp-meta { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 16px 0; }',
'.kkp-meta-k { font-size: clamp(11px,1.8vw,13px); color: rgba(255,255,255,.4); font-weight: 600; white-space: nowrap; }',
'.kkp-meta-v { font-size: clamp(12px,2vw,14px); color: rgba(255,255,255,.85); }',

// Genres
'.kkp-genres { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0; }',
'.kkp-genre { font-size: clamp(11px,1.8vw,13px); padding: 4px 12px; background: rgba(229,9,20,.1); border: 1px solid rgba(229,9,20,.3); color: rgba(255,255,255,.85); border-radius: 20px; cursor: pointer; transition: all .2s; }',
'.kkp-genre:hover { background: rgba(229,9,20,.3); color: #fff; }',

// Episodes
'.kkp-eps { margin: 22px 0; }',
'.kkp-eps-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }',
'.kkp-eps-title { font-size: clamp(14px,2.5vw,17px); font-weight: 800; display: flex; align-items: center; gap: 6px; }',
'.kkp-eps-count { font-size: 13px; color: rgba(255,255,255,.45); }',
'.kkp-svr-tabs { display: flex; gap: 8px; margin-bottom: 12px; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }',
'.kkp-svr-tabs::-webkit-scrollbar { display: none; }',
'.kkp-svr-tab { white-space: nowrap; padding: 6px 14px; border-radius: 6px; font-size: clamp(12px,2vw,13px); font-weight: 600; cursor: pointer; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.65); transition: all .2s; }',
'.kkp-svr-tab.on,.kkp-svr-tab:hover { background: rgba(229,9,20,.8); border-color: transparent; color: #fff; }',
'.kkp-ep-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(clamp(52px,12vw,72px),1fr)); gap: 6px; }',
'.kkp-ep { aspect-ratio: 1.6; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: clamp(11px,2vw,13px); font-weight: 700; color: rgba(255,255,255,.7); cursor: pointer; transition: all .2s; user-select: none; }',
'.kkp-ep:hover { background: rgba(229,9,20,.8); border-color: transparent; color: #fff; transform: scale(1.05); }',
'.kkp-ep.on { background: #e50914; border-color: transparent; color: #fff; box-shadow: 0 2px 10px rgba(229,9,20,.5); }',
'.kkp-ep-panel { display: none; }',
'.kkp-ep-panel.on { display: block; }',

// Cast
'.kkp-cast-row { display: flex; gap: 12px; overflow-x: auto; padding: 4px 0 10px; scrollbar-width: none; }',
'.kkp-cast-row::-webkit-scrollbar { display: none; }',
'.kkp-cast-card { flex-shrink: 0; width: clamp(72px,14vw,100px); cursor: pointer; transition: transform .2s; text-align: center; }',
'.kkp-cast-card:hover { transform: translateY(-4px); }',
'.kkp-cast-img { width: 100%; aspect-ratio: 1; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,.08); border: 2px solid rgba(255,255,255,.1); display: block; }',
'.kkp-cast-name { font-size: clamp(10px,1.8vw,12px); color: rgba(255,255,255,.8); margin-top: 5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
'.kkp-cast-role { font-size: clamp(9px,1.6vw,11px); color: rgba(255,255,255,.4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',

// Loading / empty
'.kkp-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; gap: 12px; color: rgba(255,255,255,.4); font-size: 14px; }',
'.kkp-spin { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,.1); border-top-color: #e50914; border-radius: 50%; animation: kkp-spin .8s linear infinite; }',
'@keyframes kkp-spin { to { transform: rotate(360deg); } }',
'.kkp-empty { text-align: center; padding: 50px 20px; color: rgba(255,255,255,.35); }',
'.kkp-empty-icon { font-size: 48px; margin-bottom: 10px; }',
'.kkp-empty-txt { font-size: clamp(13px,2.5vw,15px); }',

// Pagination
'.kkp-pages { display: flex; justify-content: center; align-items: center; gap: 6px; padding: 20px; flex-wrap: wrap; }',
'.kkp-page { width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: clamp(12px,2vw,14px); font-weight: 700; cursor: pointer; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.65); transition: all .2s; user-select: none; }',
'.kkp-page:hover { background: rgba(229,9,20,.8); color: #fff; border-color: transparent; }',
'.kkp-page.on { background: #e50914; color: #fff; border-color: transparent; }',
'.kkp-page.wide { width: auto; padding: 0 12px; }',

// Divider
'.kkp-divider { height: 1px; background: rgba(255,255,255,.07); margin: 20px 16px; }',

// Fade anim
'@keyframes kkp-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }',
'.kkp-in { animation: kkp-in .35s ease forwards; }',

// Mobile
'@media (max-width: 500px) {',
'.kkp-hero { height: 75vw; }',
'.kkp-hero-body { padding: 14px; gap: 12px; }',
'.kkp-hero-poster { width: 75px; min-width: 75px; height: 112px; }',
'.kkp-det-main { flex-direction: column; align-items: center; }',
'.kkp-det-info { width: 100%; text-align: center; }',
'.kkp-det-stats { justify-content: center; }',
'.kkp-det-actions { justify-content: center; }',
'.kkp-rating-row { justify-content: center; }',
'.kkp-genres { justify-content: center; }',
'}'
].join('\n');

function injectCSS() {
    if (document.getElementById('kkp-style')) return;
    var s = document.createElement('style');
    s.id = 'kkp-style';
    s.textContent = CSS;
    document.head.appendChild(s);
}

// ─── SVG ICONS ───────────────────────────────────────────
var IC = {
    play:   'M8 5v14l11-7z',
    back:   'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    film:   'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z',
    ep:     'M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zm-5-6l-8 4.5v-9z',
    star:   'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    clock:  'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L11 13.5V7h1.5v5.75l4.5 2.67-1.26 2.08z',
    heart:  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    yt:     'M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z',
    person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    fire:   'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
    trend:  'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z'
};

function ic(name, cls) {
    var d = IC[name] || '';
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="currentColor"><path d="' + d + '"/></svg>';
}

// ─── API ─────────────────────────────────────────────────
var API = {
    list: function(type, page, cb) {
        var url = KK_API + '/v1/api/danh-sach/' + type + '?page=' + (page || 1) + '&limit=24&sort_field=modified.time&sort_type=desc';
        request(url, function(d) {
            var items = (d.data && d.data.items) ? d.data.items : (d.items || []);
            var total = 1;
            if (d.data && d.data.params && d.data.params.pagination) {
                total = d.data.params.pagination.totalPages || 1;
            }
            cb(null, items, total);
        }, function() { cb('error', [], 1); });
    },

    category: function(slug, page, cb) {
        var url = KK_API + '/v1/api/the-loai/' + slug + '?page=' + (page || 1) + '&limit=24';
        request(url, function(d) {
            var items = (d.data && d.data.items) ? d.data.items : (d.items || []);
            var total = 1;
            if (d.data && d.data.params && d.data.params.pagination) {
                total = d.data.params.pagination.totalPages || 1;
            }
            cb(null, items, total);
        }, function() { cb('error', [], 1); });
    },

    country: function(slug, page, cb) {
        var url = KK_API + '/v1/api/quoc-gia/' + slug + '?page=' + (page || 1) + '&limit=24';
        request(url, function(d) {
            var items = (d.data && d.data.items) ? d.data.items : (d.items || []);
            var total = 1;
            if (d.data && d.data.params && d.data.params.pagination) {
                total = d.data.params.pagination.totalPages || 1;
            }
            cb(null, items, total);
        }, function() { cb('error', [], 1); });
    },

    search: function(q, page, cb) {
        var url = KK_API + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(q) + '&page=' + (page || 1);
        request(url, function(d) {
            var items = (d.data && d.data.items) ? d.data.items : (d.items || []);
            cb(null, items);
        }, function() { cb('error', []); });
    },

    detail: function(slug, cb) {
        var url = KK_API + '/phim/' + slug;
        request(url, function(d) { cb(null, d); }, function() { cb('error', null); });
    },

    tmdbSearch: function(title, year, cb) {
        var url = TMDB_API + '/search/multi?api_key=' + TMDB_KEY + '&query=' + encodeURIComponent(title) + '&language=vi-VN' + (year ? '&year=' + year : '');
        request(url, function(d) {
            var r = (d.results && d.results.length) ? d.results[0] : null;
            cb(null, r);
        }, function() { cb(null, null); });
    },

    tmdbDetail: function(id, type, cb) {
        var url = TMDB_API + '/' + type + '/' + id + '?api_key=' + TMDB_KEY + '&language=vi-VN&append_to_response=credits,videos,recommendations';
        request(url, function(d) { cb(null, d); }, function() { cb(null, null); });
    },

    tmdbTrending: function(cb) {
        var url = TMDB_API + '/trending/all/week?api_key=' + TMDB_KEY + '&language=vi-VN';
        request(url, function(d) {
            cb(null, d.results || []);
        }, function() { cb(null, []); });
    }
};

// ─── BUILD HELPERS ────────────────────────────────────────
function loading() {
    return '<div class="kkp-loading"><div class="kkp-spin"></div><span>Đang tải...</span></div>';
}

function empty(msg) {
    return '<div class="kkp-empty"><div class="kkp-empty-icon">🎬</div><div class="kkp-empty-txt">' + (msg || 'Không có dữ liệu') + '</div></div>';
}

function secHead(iconName, title, more) {
    return '<div class="kkp-sec-head">'
        + '<div class="kkp-sec-title"><div class="kkp-sec-bar"></div>' + ic(iconName) + ' ' + title + '</div>'
        + (more ? '<div class="kkp-sec-more" ' + more + '>Xem thêm ›</div>' : '')
        + '</div>';
}

function buildCard(m, isTmdb) {
    var poster  = isTmdb ? tmdbImg(m.poster_path, 'w300') : imgUrl(m.poster_url || m.thumb_url);
    var name    = m.name || m.title || '';
    var year    = m.year || (m.release_date ? m.release_date.substr(0,4) : '') || (m.first_air_date ? m.first_air_date.substr(0,4) : '');
    var quality = m.quality || 'HD';
    var ep      = m.episode_current || '';
    var slug    = isTmdb ? ('__tmdb__' + (m.media_type || 'movie') + '__' + m.id) : (m.slug || '');
    var vote    = m._vote || (m.vote_average ? m.vote_average.toFixed(1) : '');
    var type    = m.type === 'series' ? 'Phim Bộ' : m.type === 'single' ? 'Phim Lẻ' : (m.media_type === 'tv' ? 'TV' : 'Phim');

    var leftB = quality ? '<span class="kkp-badge ql">' + quality + '</span>' : '';
    var rightB = vote ? '<span class="kkp-badge rt">⭐' + vote + '</span>'
                 : (ep && m.type === 'series') ? '<span class="kkp-badge ep">' + ep + '</span>' : '';

    return '<div class="kkp-card" data-slug="' + slug + '">'
        + '<div class="kkp-card-poster">'
        +   '<img class="kkp-card-img" src="' + poster + '" alt="" loading="lazy" onerror="this.src=\'\'">'
        +   '<div class="kkp-card-bgs">' + leftB + rightB + '</div>'
        +   '<div class="kkp-card-overlay"><div class="kkp-card-play">' + ic('play') + '</div></div>'
        + '</div>'
        + '<div class="kkp-card-name">' + name + '</div>'
        + '<div class="kkp-card-sub">'
        +   (year ? '<span>' + year + '</span>' : '')
        +   (year && type ? '<span class="kkp-card-dot"></span>' : '')
        +   (type ? '<span>' + type + '</span>' : '')
        + '</div>'
        + '</div>';
}

function buildPages(cur, total) {
    if (total <= 1) return '';
    var h = '<div class="kkp-pages">';
    if (cur > 1) h += '<div class="kkp-page wide" data-p="' + (cur-1) + '">‹ Trước</div>';
    var s = Math.max(1, cur - 2), e = Math.min(total, cur + 2);
    if (s > 1) { h += '<div class="kkp-page" data-p="1">1</div>'; if (s > 2) h += '<span style="color:rgba(255,255,255,.3);padding:0 4px">…</span>'; }
    for (var p = s; p <= e; p++) {
        h += '<div class="kkp-page' + (p === cur ? ' on' : '') + '" data-p="' + p + '">' + p + '</div>';
    }
    if (e < total) { if (e < total-1) h += '<span style="color:rgba(255,255,255,.3);padding:0 4px">…</span>'; h += '<div class="kkp-page" data-p="' + total + '">' + total + '</div>'; }
    if (cur < total) h += '<div class="kkp-page wide" data-p="' + (cur+1) + '">Sau ›</div>';
    h += '</div>';
    return h;
}

// ─── CATS / COUNTRIES DATA ────────────────────────────────
var CATS = [
    { slug: 'phim-bo',    name: '📺 Phim Bộ',     api: 'list' },
    { slug: 'phim-le',    name: '🎬 Phim Lẻ',     api: 'list' },
    { slug: 'hoat-hinh',  name: '🎠 Hoạt Hình',   api: 'list' },
    { slug: 'tv-shows',   name: '📡 TV Shows',     api: 'list' },
    { slug: 'hanh-dong',  name: '💥 Hành Động',   api: 'cat'  },
    { slug: 'tinh-cam',   name: '💕 Tình Cảm',    api: 'cat'  },
    { slug: 'hai-huoc',   name: '😂 Hài Hước',    api: 'cat'  },
    { slug: 'kinh-di',    name: '👻 Kinh Dị',     api: 'cat'  },
    { slug: 'vien-tuong', name: '🚀 Viễn Tưởng',  api: 'cat'  },
    { slug: 'co-trang',   name: '🏯 Cổ Trang',    api: 'cat'  },
    { slug: 'tam-ly',     name: '🧠 Tâm Lý',      api: 'cat'  },
    { slug: 'hinh-su',    name: '🔍 Hình Sự',     api: 'cat'  },
    { slug: 'bi-an',      name: '🔮 Bí Ẩn',       api: 'cat'  },
    { slug: 'phieu-luu',  name: '🗺️ Phiêu Lưu',  api: 'cat'  },
    { slug: 'gia-dinh',   name: '👨‍👩‍👧 Gia Đình',  api: 'cat'  }
];

var COUNTRIES = [
    { slug: 'trung-quoc', name: '🇨🇳 Trung Quốc' },
    { slug: 'han-quoc',   name: '🇰🇷 Hàn Quốc'   },
    { slug: 'nhat-ban',   name: '🇯🇵 Nhật Bản'   },
    { slug: 'my',         name: '🇺🇸 Mỹ'          },
    { slug: 'viet-nam',   name: '🇻🇳 Việt Nam'    },
    { slug: 'thai-lan',   name: '🇹🇭 Thái Lan'    },
    { slug: 'hong-kong',  name: '🇭🇰 Hồng Kông'   },
    { slug: 'anh',        name: '🇬🇧 Anh'         }
];

// ─── MAIN COMPONENT ──────────────────────────────────────
function KKPhim() {
    var self     = this;
    var $wrap    = $('<div class="kkp-wrap kkp-in"></div>');
    var $home    = null;     // saved home html when going to detail
    var stimer   = null;     // search debounce

    // ── PUBLIC ──
    self.create = function() {
        injectCSS();
        buildHome();
        return $wrap;
    };

    // ── HOME ────────────────────────────────────────────
    function buildHome() {
        var html = ''
            // Hero placeholder
            + '<div id="kkp-hero" class="kkp-hero">'
            +   '<div id="kkp-hero-bg" class="kkp-hero-bg"></div>'
            +   '<div class="kkp-hero-grad"></div>'
            +   '<div id="kkp-hero-body" class="kkp-hero-body">' + loading() + '</div>'
            + '</div>'

            // Search
            + '<div class="kkp-search-wrap">'
            +   '<div class="kkp-search-box">'
            +     ic('search')
            +     '<input id="kkp-sinput" class="kkp-search-input" type="text" placeholder="Tìm kiếm phim, series...">'
            +   '</div>'
            + '</div>'

            // Category chips
            + '<div class="kkp-cats-wrap">'
            +   '<div class="kkp-sec-head">' + '<div class="kkp-sec-title"><div class="kkp-sec-bar"></div>' + ic('film') + ' Thể Loại</div>' + '</div>'
            +   '<div class="kkp-cats" id="kkp-cats">'
            +   CATS.map(function(c, i) { return '<div class="kkp-cat' + (i===0?' on':'') + '" data-ci="' + i + '">' + c.name + '</div>'; }).join('')
            +   '</div>'
            + '</div>'

            // Country chips
            + '<div class="kkp-cats-wrap">'
            +   '<div class="kkp-sec-head">' + '<div class="kkp-sec-title"><div class="kkp-sec-bar"></div>🌏 Quốc Gia</div>' + '</div>'
            +   '<div class="kkp-cats" id="kkp-countries">'
            +   COUNTRIES.map(function(c) { return '<div class="kkp-cat" data-cn="' + c.slug + '">' + c.name + '</div>'; }).join('')
            +   '</div>'
            + '</div>'

            // Content rows
            + '<div id="kkp-content">' + loading() + '</div>';

        $wrap.html(html);

        // Bind search
        $wrap.find('#kkp-sinput').on('input', function() {
            var q = $(this).val().trim();
            clearTimeout(stimer);
            if (q.length >= 2) {
                stimer = setTimeout(function() { showSearch(q); }, 480);
            } else if (q.length === 0) {
                showRows(CATS[0], 1);
            }
        });

        // Bind cat chips
        $wrap.on('click', '.kkp-cat[data-ci]', function() {
            $wrap.find('.kkp-cat[data-ci]').removeClass('on');
            $(this).addClass('on');
            var idx = parseInt($(this).attr('data-ci'));
            showRows(CATS[idx], 1);
        });

        // Bind country chips
        $wrap.on('click', '.kkp-cat[data-cn]', function() {
            $wrap.find('.kkp-cat[data-cn]').removeClass('on');
            $(this).addClass('on');
            var slug = $(this).attr('data-cn');
            showCountry(slug, 1);
        });

        // Bind card click
        $wrap.on('click', '.kkp-card[data-slug]', function() {
            openDetail($(this).attr('data-slug'));
        });

        // Load hero and first rows
        loadHero();
        showRows(CATS[0], 1);
    }

    // ── HERO ────────────────────────────────────────────
    function loadHero() {
        API.tmdbTrending(function(err, results) {
            if (!results || !results.length) {
                // fallback to kkphim
                API.list('phim-le', 1, function(e, items) {
                    if (items && items.length) renderHeroKK(items[Math.floor(Math.random() * Math.min(items.length, 8))]);
                });
                return;
            }
            var item = results[Math.floor(Math.random() * Math.min(results.length, 8))];
            renderHeroTMDB(item);
        });
    }

    function renderHeroTMDB(item) {
        var bg    = item.backdrop_path ? (TMDB_IMG + 'w1280' + item.backdrop_path) : '';
        var poster= item.poster_path   ? (TMDB_IMG + 'w500'  + item.poster_path)   : '';
        var name  = item.title || item.name || '';
        var orig  = item.original_title || item.original_name || '';
        var year  = (item.release_date || item.first_air_date || '').substr(0, 4);
        var vote  = item.vote_average ? item.vote_average.toFixed(1) : '';
        var type  = item.media_type === 'tv' ? 'TV Series' : 'Phim';
        var slug  = '__tmdb__' + (item.media_type || 'movie') + '__' + item.id;

        $wrap.find('#kkp-hero-bg').css('background-image', 'url(' + bg + ')');
        $wrap.find('#kkp-hero-body').html(
            '<div class="kkp-hero-poster"><img src="' + poster + '" alt="" loading="lazy"></div>'
            + '<div class="kkp-hero-info">'
            +   '<div class="kkp-hero-badge">' + ic('fire') + ' Xu Hướng Tuần Này</div>'
            +   '<div class="kkp-hero-title">' + name + '</div>'
            +   (orig && orig !== name ? '<div class="kkp-hero-orig">' + orig + '</div>' : '')
            +   '<div class="kkp-hero-tags">'
            +     (year  ? '<span class="kkp-hero-tag">' + ic('clock') + ' ' + year + '</span>' : '')
            +     (vote  ? '<span class="kkp-hero-tag rt">⭐ ' + vote + '</span>' : '')
            +     '<span class="kkp-hero-tag">' + type + '</span>'
            +   '</div>'
            +   '<div class="kkp-hero-btns">'
            +     '<button class="kkp-hero-btn primary" data-slug="' + slug + '" data-play="1">' + ic('play') + ' Xem Ngay</button>'
            +     '<button class="kkp-hero-btn secondary" data-slug="' + slug + '">' + ic('film') + ' Chi Tiết</button>'
            +   '</div>'
            + '</div>'
        );

        $wrap.find('.kkp-hero-btn').on('click', function() {
            openDetail($(this).attr('data-slug'));
        });
    }

    function renderHeroKK(m) {
        var bg    = imgUrl(m.thumb_url || m.poster_url);
        var poster= imgUrl(m.poster_url || m.thumb_url);
        var name  = m.name || '';
        var orig  = m.origin_name || '';
        var year  = m.year || '';
        var ql    = m.quality || '';
        var slug  = m.slug || '';

        $wrap.find('#kkp-hero-bg').css('background-image', 'url(' + bg + ')');
        $wrap.find('#kkp-hero-body').html(
            '<div class="kkp-hero-poster"><img src="' + poster + '" alt="" loading="lazy"></div>'
            + '<div class="kkp-hero-info">'
            +   '<div class="kkp-hero-badge">' + ic('fire') + ' Nổi Bật Hôm Nay</div>'
            +   '<div class="kkp-hero-title">' + name + '</div>'
            +   (orig ? '<div class="kkp-hero-orig">' + orig + '</div>' : '')
            +   '<div class="kkp-hero-tags">'
            +     (ql   ? '<span class="kkp-hero-tag ql">' + ql + '</span>' : '')
            +     (year ? '<span class="kkp-hero-tag">' + ic('clock') + ' ' + year + '</span>' : '')
            +   '</div>'
            +   '<div class="kkp-hero-btns">'
            +     '<button class="kkp-hero-btn primary" data-slug="' + slug + '">' + ic('play') + ' Xem Ngay</button>'
            +     '<button class="kkp-hero-btn secondary" data-slug="' + slug + '">' + ic('film') + ' Chi Tiết</button>'
            +   '</div>'
            + '</div>'
        );
        $wrap.find('.kkp-hero-btn').on('click', function() {
            openDetail($(this).attr('data-slug'));
        });
    }

    // ── HOME ROWS ────────────────────────────────────────
    var HOME_ROWS = [
        { type: 'phim-le',   title: '🎬 Phim Lẻ Mới',     icon: 'film',  api: 'list' },
        { type: 'phim-bo',   title: '📺 Phim Bộ Mới',     icon: 'ep',    api: 'list' },
        { type: 'hoat-hinh', title: '🎠 Hoạt Hình',        icon: 'star',  api: 'list' },
        { type: 'tv-shows',  title: '📡 TV Shows',          icon: 'trend', api: 'list' }
    ];

    function showHomeRows() {
        var $c = $wrap.find('#kkp-content');
        var html = '';

        // TMDB Trending row
        html += '<div class="kkp-section kkp-in">'
            + secHead('fire', '🔥 Xu Hướng TMDB', '')
            + '<div id="kkp-tmdb-row" class="kkp-row">' + loading() + '</div>'
            + '</div>';

        HOME_ROWS.forEach(function(r) {
            html += '<div class="kkp-section kkp-in">'
                + secHead(r.icon, r.title, 'data-more="' + r.type + '"')
                + '<div id="kkp-row-' + r.type + '" class="kkp-row">' + loading() + '</div>'
                + '</div>';
        });

        $c.html(html);

        // Load TMDB
        API.tmdbTrending(function(e, results) {
            var html2 = '';
            (results || []).slice(0, 20).forEach(function(item) {
                item._vote = item.vote_average ? item.vote_average.toFixed(1) : '';
                html2 += buildCard(item, true);
            });
            $c.find('#kkp-tmdb-row').html(html2 || empty());
        });

        // Load KK rows
        HOME_ROWS.forEach(function(r) {
            API.list(r.type, 1, function(e, items) {
                var h = '';
                (items || []).slice(0, 20).forEach(function(m) { h += buildCard(m, false); });
                $c.find('#kkp-row-' + r.type).html(h || empty());
            });
        });

        // More button
        $c.off('click.more').on('click.more', '[data-more]', function() {
            var type = $(this).attr('data-more');
            openListPage(type);
        });
    }

    // ── ROWS for a selected cat ──────────────────────────
    function showRows(cat, page) {
        var $c = $wrap.find('#kkp-content');

        if (!cat) { showHomeRows(); return; }

        $c.html(loading());

        var fn = cat.api === 'list'
            ? function(cb) { API.list(cat.slug, page, cb); }
            : function(cb) { API.category(cat.slug, page, cb); };

        fn(function(e, items, total) {
            var h = '<div class="kkp-section kkp-in">'
                + secHead('film', cat.name, '')
                + '<div class="kkp-grid">';
            (items || []).forEach(function(m) { h += buildCard(m, false); });
            h += '</div>' + buildPages(page, total) + '</div>';
            $c.html(h);

            $c.off('click.page').on('click.page', '.kkp-page[data-p]', function() {
                showRows(cat, parseInt($(this).attr('data-p')));
            });
        });
    }

    // ── COUNTRY rows ──────────────────────────────────────
    function showCountry(slug, page) {
        var $c = $wrap.find('#kkp-content');
        var cname = '';
        COUNTRIES.forEach(function(c) { if (c.slug === slug) cname = c.name; });

        $c.html(loading());
        API.country(slug, page, function(e, items, total) {
            var h = '<div class="kkp-section kkp-in">'
                + secHead('film', cname || slug, '')
                + '<div class="kkp-grid">';
            (items || []).forEach(function(m) { h += buildCard(m, false); });
            h += '</div>' + buildPages(page, total) + '</div>';
            $c.html(h);

            $c.off('click.page').on('click.page', '.kkp-page[data-p]', function() {
                showCountry(slug, parseInt($(this).attr('data-p')));
            });
        });
    }

    // ── SEARCH ───────────────────────────────────────────
    function showSearch(q) {
        var $c = $wrap.find('#kkp-content');
        $c.html(loading());
        API.search(q, 1, function(e, items) {
            if (!items || !items.length) { $c.html(empty('Không tìm thấy: ' + q)); return; }
            var h = '<div class="kkp-section kkp-in">'
                + secHead('search', 'Kết quả: "' + q + '" (' + items.length + ')', '')
                + '<div class="kkp-grid">';
            items.forEach(function(m) { h += buildCard(m, false); });
            h += '</div></div>';
            $c.html(h);
        });
    }

    // ── LIST PAGE (full) ─────────────────────────────────
    function openListPage(type, page) {
        page = page || 1;
        var cat = null;
        CATS.forEach(function(c) { if (c.slug === type) cat = c; });
        var title = cat ? cat.name : type;

        $home = $wrap.html();
        $wrap.html(loading());

        API.list(type, page, function(e, items, total) {
            var h = '<div class="kkp-in" style="padding:14px">'
                + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">'
                +   '<div class="kkp-det-back" id="kkp-list-back">' + ic('back') + '</div>'
                +   '<span style="font-size:clamp(15px,3vw,20px);font-weight:800">' + title + '</span>'
                + '</div>'
                + '<div class="kkp-grid">';
            (items || []).forEach(function(m) { h += buildCard(m, false); });
            h += '</div>' + buildPages(page, total) + '</div>';
            $wrap.html(h);

            $wrap.find('#kkp-list-back').on('click', function() {
                $wrap.html($home);
                $home = null;
                rebindHome();
            });

            $wrap.on('click', '.kkp-page[data-p]', function() {
                openListPage(type, parseInt($(this).attr('data-p')));
            });

            $wrap.on('click', '.kkp-card[data-slug]', function() {
                openDetail($(this).attr('data-slug'));
            });
        });
    }

    // ── DETAIL ───────────────────────────────────────────
    function openDetail(slug) {
        var saved = $wrap.html();
        $wrap.html(loading());

        if (slug.indexOf('__tmdb__') === 0) {
            // Format: __tmdb__movie__123 or __tmdb__tv__123
            var parts = slug.replace('__tmdb__', '').split('__');
            var mtype = parts[0] || 'movie';
            var mid   = parts[1] || '';
            API.tmdbDetail(mid, mtype, function(e, td) {
                if (!td) { $wrap.html(empty()); return; }
                renderDetail(null, [], td, null, saved);
            });
            return;
        }

        API.detail(slug, function(e, data) {
            if (e || !data) { $wrap.html(empty('Không tải được thông tin phim')); return; }
            var movie    = data.movie || data;
            var episodes = data.episodes || [];

            // Enrich with TMDB
            var qTitle = movie.origin_name || movie.name || '';
            API.tmdbSearch(qTitle, movie.year, function(te, tmdb) {
                if (tmdb && tmdb.id) {
                    var mtype2 = tmdb.media_type || 'movie';
                    API.tmdbDetail(tmdb.id, mtype2, function(e2, td) {
                        renderDetail(movie, episodes, td, tmdb, saved);
                    });
                } else {
                    renderDetail(movie, episodes, null, null, saved);
                }
            });
        });
    }

    function renderDetail(movie, episodes, tmdb, tmdbBase, saved) {
        // Prefer tmdb data for backdrop
        var name     = (movie && movie.name) || (tmdb && (tmdb.title || tmdb.name)) || '';
        var orig     = (movie && movie.origin_name) || (tmdb && (tmdb.original_title || tmdb.original_name)) || '';
        var year     = (movie && movie.year) || (tmdb && ((tmdb.release_date || tmdb.first_air_date || '').substr(0,4))) || '';
        var quality  = (movie && movie.quality) || 'HD';
        var status   = (movie && movie.status) || '';
        var time     = (movie && movie.time) || (tmdb && tmdb.runtime ? (Math.floor(tmdb.runtime/60) + 'h ' + (tmdb.runtime%60) + 'm') : '') || '';
        var lang     = (movie && movie.lang) || '';
        var content  = stripTags((movie && movie.content) || (tmdb && tmdb.overview) || '');
        var type     = (movie && movie.type) || '';
        var actorArr = (movie && movie.actor) || [];
        var dirArr   = (movie && movie.director) || [];
        var catArr   = (movie && movie.category) || [];
        var cntArr   = (movie && movie.country) || [];

        var poster   = (tmdb && tmdb.poster_path) ? tmdbImg(tmdb.poster_path, 'w500')
                     : imgUrl((movie && (movie.poster_url || movie.thumb_url)) || '');
        var backdrop = (tmdb && tmdb.backdrop_path) ? (TMDB_IMG + 'w1280' + tmdb.backdrop_path)
                     : imgUrl((movie && (movie.thumb_url || movie.poster_url)) || '');

        var tmdbVote   = (tmdb && tmdb.vote_average) ? tmdb.vote_average.toFixed(1) : '';
        var tmdbGenres = (tmdb && tmdb.genres) || [];
        var cast       = (tmdb && tmdb.credits && tmdb.credits.cast) ? tmdb.credits.cast.slice(0,15) : [];
        var trailer    = '';
        if (tmdb && tmdb.videos && tmdb.videos.results) {
            var tv = tmdb.videos.results.find(function(v) { return v.type === 'Trailer' && v.site === 'YouTube'; });
            if (tv) trailer = 'https://www.youtube.com/watch?v=' + tv.key;
        }
        var recs = (tmdb && tmdb.recommendations && tmdb.recommendations.results) ? tmdb.recommendations.results.slice(0,12) : [];

        // ── Build HTML ───────────────────────────────────
        var h = '<div class="kkp-detail kkp-in">';

        // Hero
        h += '<div class="kkp-det-hero">'
            + '<div class="kkp-det-bg" style="background-image:url(' + backdrop + ')"></div>'
            + '<div class="kkp-det-grad"></div>'
            + '<div class="kkp-det-back" id="kkp-det-back">' + ic('back') + '</div>'
            + '</div>';

        // Body
        h += '<div class="kkp-det-body">';
        h += '<div class="kkp-det-main">';

        // Poster
        h += '<div class="kkp-det-poster"><img src="' + poster + '" alt="" loading="lazy" onerror="this.src=\'\'"></div>';

        // Info
        h += '<div class="kkp-det-info">';
        if (quality) h += '<span class="kkp-det-ql">' + quality + '</span>';
        h += '<h1 class="kkp-det-title">' + name + '</h1>';
        if (orig && orig !== name) h += '<p class="kkp-det-orig">' + orig + '</p>';

        // Stats
        h += '<div class="kkp-det-stats">';
        if (year)   h += '<span class="kkp-det-stat">' + ic('clock') + ' ' + year + '</span>';
        if (time)   h += '<span class="kkp-det-stat">' + ic('clock') + ' ' + time + '</span>';
        if (lang)   h += '<span class="kkp-det-stat">' + lang + '</span>';
        if (status) h += '<span class="kkp-det-stat grn">✓ ' + status + '</span>';
        if (type === 'series') h += '<span class="kkp-det-stat">' + ic('ep') + ' Phim Bộ</span>';
        else if (type === 'single') h += '<span class="kkp-det-stat">' + ic('film') + ' Phim Lẻ</span>';
        h += '</div>';

        // Ratings
        if (tmdbVote) {
            h += '<div class="kkp-rating-row">'
                + '<div class="kkp-rating-box tmdb">'
                +   '<span class="kkp-rating-icon">🎬</span>'
                +   '<div><div class="kkp-rating-val">⭐ ' + tmdbVote + '</div><div class="kkp-rating-src">TMDB</div></div>'
                + '</div></div>';
        }

        // Actions
        h += '<div class="kkp-det-actions">';
        if (episodes.length) {
            h += '<button class="kkp-btn red" id="kkp-watch-btn">' + ic('play') + ' Xem Phim</button>';
        }
        h += '<button class="kkp-btn ghost" id="kkp-save-btn">' + ic('heart') + ' Lưu</button>';
        if (trailer) {
            h += '<a href="' + trailer + '" target="_blank" class="kkp-btn yt">' + ic('yt') + ' Trailer</a>';
        }
        h += '</div>';
        h += '</div>'; // info
        h += '</div>'; // main

        // Description
        if (content) {
            h += '<div class="kkp-desc-title">Nội Dung</div>'
                + '<div class="kkp-desc-text" id="kkp-desc">' + content + '</div>'
                + '<span class="kkp-desc-more" id="kkp-desc-btn">Xem thêm ▾</span>';
        }

        // Genres
        if (tmdbGenres.length) {
            h += '<div class="kkp-genres">';
            tmdbGenres.forEach(function(g) { h += '<span class="kkp-genre">' + g.name + '</span>'; });
            h += '</div>';
        }

        // Meta
        h += '<div class="kkp-meta">';
        if (dirArr.length) {
            h += '<div class="kkp-meta-k">Đạo diễn</div><div class="kkp-meta-v">' + (Array.isArray(dirArr) ? dirArr.join(', ') : dirArr) + '</div>';
        }
        if (actorArr.length) {
            var actStr = Array.isArray(actorArr) ? actorArr.slice(0,6).join(', ') : actorArr;
            h += '<div class="kkp-meta-k">Diễn viên</div><div class="kkp-meta-v">' + actStr + '</div>';
        }
        if (cntArr.length) {
            h += '<div class="kkp-meta-k">Quốc gia</div><div class="kkp-meta-v">' + cntArr.map(function(c) { return c.name || c; }).join(', ') + '</div>';
        }
        if (catArr.length) {
            h += '<div class="kkp-meta-k">Thể loại</div><div class="kkp-meta-v">' + catArr.map(function(c) { return c.name || c; }).join(', ') + '</div>';
        }
        h += '</div>';

        // Divider
        h += '<div class="kkp-divider"></div>';

        // Episodes
        if (episodes.length) {
            h += buildEpisodeHTML(episodes);
        }

        // Cast
        if (cast.length) {
            h += '<div class="kkp-section">'
                + secHead('person', 'Diễn Viên', '')
                + '<div class="kkp-cast-row">';
            cast.forEach(function(c) {
                var img = c.profile_path ? tmdbImg(c.profile_path, 'w185') : '';
                h += '<div class="kkp-cast-card">'
                    + '<img class="kkp-cast-img" src="' + img + '" alt="" loading="lazy" onerror="this.src=\'\'">'
                    + '<div class="kkp-cast-name">' + (c.name || '') + '</div>'
                    + '<div class="kkp-cast-role">' + (c.character || '') + '</div>'
                    + '</div>';
            });
            h += '</div></div>';
        }

        // Recommendations
        if (recs.length) {
            h += '<div class="kkp-section">'
                + secHead('film', '👍 Có Thể Bạn Thích', '')
                + '<div class="kkp-row">';
            recs.forEach(function(item) {
                item._vote = item.vote_average ? item.vote_average.toFixed(1) : '';
                h += buildCard(item, true);
            });
            h += '</div></div>';
        }

        h += '</div>'; // body
        h += '</div>'; // detail

        $wrap.html(h);

        // Back
        $wrap.find('#kkp-det-back').on('click', function() {
            $wrap.html(saved);
            rebindHome();
        });

        // Desc toggle
        $wrap.find('#kkp-desc-btn').on('click', function() {
            var $d = $wrap.find('#kkp-desc');
            var exp = $d.hasClass('exp');
            $d.toggleClass('exp');
            $(this).text(exp ? 'Xem thêm ▾' : 'Thu gọn ▴');
        });

        // Watch scroll
        $wrap.find('#kkp-watch-btn').on('click', function() {
            var $e = $wrap.find('.kkp-eps');
            if ($e.length) $('html,body').animate({ scrollTop: $e.offset().top - 10 }, 350);
        });

        // Save
        $wrap.find('#kkp-save-btn').on('click', function() {
            if (typeof Lampa !== 'undefined' && Lampa.Favorite) {
                Lampa.Favorite.toggle({
                    id: (movie && movie.slug) || '',
                    title: name,
                    poster: poster
                });
            }
            Lampa && Lampa.Noty && Lampa.Noty.show('Đã lưu: ' + name);
        });

        // Server tabs
        $wrap.on('click', '.kkp-svr-tab', function() {
            var si = $(this).attr('data-si');
            $wrap.find('.kkp-svr-tab').removeClass('on');
            $(this).addClass('on');
            $wrap.find('.kkp-ep-panel').removeClass('on');
            $wrap.find('.kkp-ep-panel[data-si="' + si + '"]').addClass('on');
        });

        // Episode click
        $wrap.on('click', '.kkp-ep[data-url]', function() {
            $wrap.find('.kkp-ep').removeClass('on');
            $(this).addClass('on');
            var url  = $(this).attr('data-url');
            var enm  = $(this).attr('data-en');
            playEpisode(url, name + (enm ? ' - Tập ' + enm : ''), poster);
        });

        // Rec card click
        $wrap.on('click', '.kkp-card[data-slug]', function() {
            openDetail($(this).attr('data-slug'));
        });
    }

    // ── EPISODES ─────────────────────────────────────────
    function buildEpisodeHTML(episodes) {
        var total = 0;
        episodes.forEach(function(s) { total += (s.server_data || []).length; });

        var h = '<div class="kkp-eps">'
            + '<div class="kkp-eps-head">'
            +   '<div class="kkp-eps-title">' + ic('ep') + ' Danh Sách Tập</div>'
            +   '<div class="kkp-eps-count">' + total + ' tập</div>'
            + '</div>';

        if (episodes.length > 1) {
            h += '<div class="kkp-svr-tabs">';
            episodes.forEach(function(s, i) {
                h += '<div class="kkp-svr-tab' + (i===0?' on':'') + '" data-si="' + i + '">' + (s.server_name || 'Server ' + (i+1)) + '</div>';
            });
            h += '</div>';
        }

        episodes.forEach(function(s, si) {
            var eps = s.server_data || [];
            h += '<div class="kkp-ep-panel' + (si===0?' on':'') + '" data-si="' + si + '">';
            h += '<div class="kkp-ep-grid">';
            eps.forEach(function(ep) {
                var url = ep.link_m3u8 || ep.link_embed || '';
                var en  = ep.name || ep.slug || '';
                h += '<div class="kkp-ep" data-url="' + url + '" data-en="' + en + '">' + en + '</div>';
            });
            h += '</div></div>';
        });

        h += '</div>';
        return h;
    }

    // ── PLAY ─────────────────────────────────────────────
    function playEpisode(url, title, poster) {
        if (!url) { if (window.Lampa) Lampa.Noty.show('Không tìm thấy link phát'); return; }
        try {
            if (window.Lampa && Lampa.Player) {
                Lampa.Player.play({ url: url, title: title, poster: poster });
            } else {
                window.open(url, '_blank');
            }
        } catch(ex) {
            window.open(url, '_blank');
        }
    }

    // ── REBIND after back ─────────────────────────────────
    function rebindHome() {
        $wrap.off('click');

        $wrap.on('click', '.kkp-cat[data-ci]', function() {
            $wrap.find('.kkp-cat[data-ci]').removeClass('on');
            $(this).addClass('on');
            showRows(CATS[parseInt($(this).attr('data-ci'))], 1);
        });

        $wrap.on('click', '.kkp-cat[data-cn]', function() {
            $wrap.find('.kkp-cat[data-cn]').removeClass('on');
            $(this).addClass('on');
            showCountry($(this).attr('data-cn'), 1);
        });

        $wrap.on('click', '.kkp-card[data-slug]', function() {
            openDetail($(this).attr('data-slug'));
        });

        $wrap.on('click', '[data-more]', function() {
            openListPage($(this).attr('data-more'));
        });

        $wrap.find('#kkp-sinput').off('input').on('input', function() {
            var q = $(this).val().trim();
            clearTimeout(stimer);
            if (q.length >= 2) {
                stimer = setTimeout(function() { showSearch(q); }, 480);
            } else if (q.length === 0) {
                showHomeRows();
            }
        });
    }

    // expose
    return self;
}

// ─── LAMPA REGISTRATION ──────────────────────────────────
function register() {
    if (typeof Lampa === 'undefined') return;

    Lampa.Component.add('kkphim_main', {
        create: function() {
            var plugin = new KKPhim();
            this.html  = plugin.create();
        },
        start:   function() {},
        pause:   function() {},
        stop:    function() {},
        destroy: function() {}
    });

    Lampa.Listener.follow('app', function(e) {
        if (e.type !== 'ready') return;

        // inject menu item
        try {
            var li = document.createElement('li');
            li.className = 'menu__item selector';
            li.innerHTML =
                '<div class="menu__ico" style="font-size:22px">🎬</div>'
                + '<div class="menu__text">KKPhim</div>';

            li.addEventListener('click', function() {
                Lampa.Activity.push({
                    url: '', title: 'KKPhim',
                    component: 'kkphim_main',
                    page: 1
                });
            });

            var ul = document.querySelector('.menu__list');
            if (ul) ul.appendChild(li);
        } catch(ex) {}

        Lampa.Noty.show('🎬 KKPhim đã sẵn sàng!');
    });
}

// ─── BOOT ────────────────────────────────────────────────
if (window.Lampa) {
    register();
} else {
    var _boot = setInterval(function() {
        if (window.Lampa) {
            clearInterval(_boot);
            register();
        }
    }, 300);
    setTimeout(function() { clearInterval(_boot); }, 20000);
}

})();