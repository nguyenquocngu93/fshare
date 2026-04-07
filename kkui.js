(function () {
  "use strict";

  // ============================================================
  // CONFIGURATION
  // ============================================================
  var PLUGIN_NAME = "KKPhim";
  var PLUGIN_VERSION = "2.0.0";
  var KKPHIM_API = "https://phimapi.com";
  var TMDB_API_KEY = "6979c8ec101ed849f44d197c86582644";
  var TMDB_BASE = "https://api.themoviedb.org/3";
  var TMDB_IMG = "https://image.tmdb.org/t/p/";
  var CACHE = {};
  var CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ============================================================
  // INJECT CSS
  // ============================================================
  var CSS = `
    /* ===== KKPhim Plugin CSS ===== */
    .kkphim-wrap {
      padding: 0;
      background: transparent;
    }

    /* Hero Banner */
    .kkphim-hero {
      position: relative;
      width: 100%;
      height: 56vw;
      max-height: 680px;
      min-height: 320px;
      overflow: hidden;
      border-radius: 0 0 2em 2em;
      margin-bottom: 2em;
      background: #0a0a0f;
    }
    .kkphim-hero__bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center top;
      filter: brightness(0.45) saturate(1.2);
      transition: all 0.8s ease;
      transform: scale(1.05);
    }
    .kkphim-hero__gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(10,10,20,0.1) 0%,
        rgba(10,10,20,0.3) 40%,
        rgba(10,10,20,0.85) 75%,
        rgba(10,10,20,1) 100%
      );
    }
    .kkphim-hero__content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 2em 2.5em;
      display: flex;
      align-items: flex-end;
      gap: 1.8em;
    }
    .kkphim-hero__poster {
      width: 120px;
      min-width: 120px;
      height: 180px;
      border-radius: 1em;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.7);
      border: 2px solid rgba(255,255,255,0.15);
      flex-shrink: 0;
    }
    .kkphim-hero__poster img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .kkphim-hero__info {
      flex: 1;
      min-width: 0;
    }
    .kkphim-hero__badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      background: linear-gradient(135deg, #e50914, #b00710);
      color: #fff;
      font-size: 0.75em;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 0.3em 0.8em;
      border-radius: 0.4em;
      margin-bottom: 0.6em;
    }
    .kkphim-hero__title {
      font-size: clamp(1.4em, 4vw, 2.4em);
      font-weight: 800;
      color: #fff;
      line-height: 1.2;
      margin: 0 0 0.3em;
      text-shadow: 0 2px 12px rgba(0,0,0,0.6);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .kkphim-hero__subtitle {
      font-size: clamp(0.85em, 2vw, 1em);
      color: rgba(255,255,255,0.65);
      margin: 0 0 0.7em;
      font-style: italic;
    }
    .kkphim-hero__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6em;
      margin-bottom: 1em;
    }
    .kkphim-hero__tag {
      display: inline-flex;
      align-items: center;
      gap: 0.3em;
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.18);
      color: rgba(255,255,255,0.9);
      font-size: clamp(0.78em, 2vw, 0.88em);
      padding: 0.28em 0.7em;
      border-radius: 2em;
    }
    .kkphim-hero__tag.quality {
      background: linear-gradient(135deg, #f5a623, #e8880a);
      border-color: transparent;
      color: #fff;
      font-weight: 700;
    }
    .kkphim-hero__tag.rating {
      background: linear-gradient(135deg, #27ae60, #1e8449);
      border-color: transparent;
      color: #fff;
      font-weight: 700;
    }
    .kkphim-hero__actions {
      display: flex;
      gap: 0.8em;
    }
    .kkphim-hero__btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.7em 1.5em;
      border-radius: 0.6em;
      font-size: clamp(0.85em, 2.2vw, 1em);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      outline: none;
    }
    .kkphim-hero__btn--play {
      background: linear-gradient(135deg, #e50914, #c0050f);
      color: #fff;
      box-shadow: 0 4px 20px rgba(229,9,20,0.5);
    }
    .kkphim-hero__btn--play:hover,
    .kkphim-hero__btn--play.focus {
      background: linear-gradient(135deg, #ff1a25, #e50914);
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(229,9,20,0.7);
    }
    .kkphim-hero__btn--info {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(8px);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .kkphim-hero__btn--info:hover,
    .kkphim-hero__btn--info.focus {
      background: rgba(255,255,255,0.25);
      transform: translateY(-2px);
    }

    /* Search Bar */
    .kkphim-search-wrap {
      padding: 0 1.5em 1.5em;
    }
    .kkphim-search {
      display: flex;
      align-items: center;
      gap: 0.8em;
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(255,255,255,0.15);
      border-radius: 1em;
      padding: 0.7em 1.2em;
      transition: all 0.3s ease;
    }
    .kkphim-search.focus {
      background: rgba(255,255,255,0.12);
      border-color: rgba(229,9,20,0.6);
      box-shadow: 0 0 0 3px rgba(229,9,20,0.15);
    }
    .kkphim-search__icon {
      font-size: 1.2em;
      color: rgba(255,255,255,0.5);
      flex-shrink: 0;
    }
    .kkphim-search__input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      font-size: clamp(0.9em, 2.5vw, 1.1em);
      caret-color: #e50914;
    }
    .kkphim-search__input::placeholder {
      color: rgba(255,255,255,0.35);
    }

    /* Section / Row */
    .kkphim-section {
      margin-bottom: 2.5em;
    }
    .kkphim-section__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5em 1em;
    }
    .kkphim-section__title {
      display: flex;
      align-items: center;
      gap: 0.5em;
      font-size: clamp(1em, 3vw, 1.25em);
      font-weight: 800;
      color: #fff;
      letter-spacing: 0.02em;
    }
    .kkphim-section__title::before {
      content: '';
      display: block;
      width: 4px;
      height: 1.2em;
      background: linear-gradient(to bottom, #e50914, #ff6b6b);
      border-radius: 2px;
    }
    .kkphim-section__icon {
      font-size: 1.1em;
    }
    .kkphim-section__more {
      font-size: clamp(0.78em, 2vw, 0.88em);
      color: rgba(255,255,255,0.5);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.3em;
      padding: 0.4em 0.8em;
      border-radius: 0.5em;
      transition: all 0.2s;
    }
    .kkphim-section__more:hover,
    .kkphim-section__more.focus {
      color: #e50914;
      background: rgba(229,9,20,0.1);
    }

    /* Category chips */
    .kkphim-cats {
      display: flex;
      gap: 0.7em;
      padding: 0 1.5em 1.2em;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .kkphim-cats::-webkit-scrollbar { display: none; }
    .kkphim-cat {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      white-space: nowrap;
      padding: 0.5em 1.1em;
      border-radius: 2em;
      font-size: clamp(0.8em, 2.2vw, 0.95em);
      font-weight: 600;
      cursor: pointer;
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.75);
      transition: all 0.25s ease;
      user-select: none;
    }
    .kkphim-cat:hover,
    .kkphim-cat.focus {
      background: rgba(229,9,20,0.2);
      border-color: rgba(229,9,20,0.5);
      color: #fff;
      transform: translateY(-2px);
    }
    .kkphim-cat.active {
      background: linear-gradient(135deg, #e50914, #c0050f);
      border-color: transparent;
      color: #fff;
      box-shadow: 0 4px 16px rgba(229,9,20,0.4);
    }

    /* Cards Scroll Row */
    .kkphim-row {
      display: flex;
      gap: 1em;
      padding: 0.3em 1.5em 1em;
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(229,9,20,0.5) transparent;
    }
    .kkphim-row::-webkit-scrollbar {
      height: 4px;
    }
    .kkphim-row::-webkit-scrollbar-track {
      background: transparent;
    }
    .kkphim-row::-webkit-scrollbar-thumb {
      background: rgba(229,9,20,0.5);
      border-radius: 2px;
    }

    /* Movie Card */
    .kkphim-card {
      flex-shrink: 0;
      width: clamp(130px, 22vw, 180px);
      cursor: pointer;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
    }
    .kkphim-card:hover,
    .kkphim-card.focus {
      transform: translateY(-8px) scale(1.03);
      z-index: 10;
    }
    .kkphim-card__poster {
      width: 100%;
      aspect-ratio: 2/3;
      border-radius: 0.8em;
      overflow: hidden;
      position: relative;
      background: rgba(255,255,255,0.05);
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .kkphim-card.focus .kkphim-card__poster {
      box-shadow: 0 0 0 3px #e50914, 0 8px 32px rgba(229,9,20,0.4);
    }
    .kkphim-card__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .kkphim-card:hover .kkphim-card__img {
      transform: scale(1.08);
    }
    .kkphim-card__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgba(0,0,0,0.85) 0%,
        rgba(0,0,0,0.2) 50%,
        transparent 100%
      );
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kkphim-card:hover .kkphim-card__overlay,
    .kkphim-card.focus .kkphim-card__overlay {
      opacity: 1;
    }
    .kkphim-card__play-btn {
      width: 2.8em;
      height: 2.8em;
      background: rgba(229,9,20,0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(229,9,20,0.6);
      backdrop-filter: blur(4px);
    }
    .kkphim-card__play-btn svg {
      width: 1em;
      height: 1em;
      fill: #fff;
      margin-left: 0.15em;
    }
    .kkphim-card__badges {
      position: absolute;
      top: 0.5em;
      left: 0.5em;
      right: 0.5em;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .kkphim-card__badge {
      font-size: 0.65em;
      font-weight: 700;
      padding: 0.25em 0.55em;
      border-radius: 0.4em;
      backdrop-filter: blur(8px);
      letter-spacing: 0.05em;
    }
    .kkphim-card__badge--quality {
      background: rgba(245,166,35,0.9);
      color: #fff;
    }
    .kkphim-card__badge--ep {
      background: rgba(229,9,20,0.85);
      color: #fff;
    }
    .kkphim-card__badge--rating {
      background: rgba(39,174,96,0.85);
      color: #fff;
    }
    .kkphim-card__info {
      padding: 0.6em 0.2em 0;
    }
    .kkphim-card__name {
      font-size: clamp(0.82em, 2.2vw, 0.92em);
      font-weight: 700;
      color: #fff;
      line-height: 1.3;
      margin: 0 0 0.25em;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .kkphim-card__meta {
      display: flex;
      align-items: center;
      gap: 0.4em;
      flex-wrap: wrap;
    }
    .kkphim-card__year,
    .kkphim-card__type {
      font-size: clamp(0.7em, 1.8vw, 0.78em);
      color: rgba(255,255,255,0.5);
    }
    .kkphim-card__dot {
      width: 3px;
      height: 3px;
      background: rgba(255,255,255,0.3);
      border-radius: 50%;
    }

    /* Grid view */
    .kkphim-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(clamp(130px, 22vw, 180px), 1fr));
      gap: 1.2em;
      padding: 0.5em 1.5em 1em;
    }
    .kkphim-grid .kkphim-card {
      width: 100%;
    }

    /* Info Modal / Detail Page */
    .kkphim-detail {
      background: #0a0a0f;
      min-height: 100vh;
      color: #fff;
    }
    .kkphim-detail__hero {
      position: relative;
      height: 55vw;
      max-height: 580px;
      min-height: 280px;
      overflow: hidden;
    }
    .kkphim-detail__bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center 20%;
      filter: brightness(0.4) saturate(1.1);
    }
    .kkphim-detail__gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(10,10,20,0) 0%,
        rgba(10,10,20,0.95) 80%,
        rgba(10,10,20,1) 100%
      );
    }
    .kkphim-detail__back {
      position: absolute;
      top: 1.2em;
      left: 1.2em;
      width: 2.4em;
      height: 2.4em;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 1px solid rgba(255,255,255,0.2);
      color: #fff;
      font-size: 1.2em;
      transition: all 0.2s;
      z-index: 10;
    }
    .kkphim-detail__back:hover,
    .kkphim-detail__back.focus {
      background: rgba(229,9,20,0.7);
      border-color: transparent;
      transform: scale(1.1);
    }
    .kkphim-detail__body {
      padding: 0 1.5em 3em;
      margin-top: -3em;
      position: relative;
    }
    .kkphim-detail__main {
      display: flex;
      gap: 1.5em;
      align-items: flex-start;
    }
    .kkphim-detail__poster {
      width: clamp(100px, 25vw, 160px);
      flex-shrink: 0;
    }
    .kkphim-detail__poster img {
      width: 100%;
      aspect-ratio: 2/3;
      object-fit: cover;
      border-radius: 0.8em;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      border: 2px solid rgba(255,255,255,0.1);
    }
    .kkphim-detail__right {
      flex: 1;
      min-width: 0;
      padding-top: 0.5em;
    }
    .kkphim-detail__quality {
      display: inline-block;
      background: linear-gradient(135deg, #f5a623, #e8880a);
      color: #fff;
      font-size: 0.72em;
      font-weight: 700;
      padding: 0.3em 0.8em;
      border-radius: 0.4em;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 0.6em;
    }
    .kkphim-detail__title {
      font-size: clamp(1.2em, 4vw, 2em);
      font-weight: 900;
      line-height: 1.2;
      margin: 0 0 0.2em;
    }
    .kkphim-detail__subtitle {
      font-size: clamp(0.82em, 2vw, 0.95em);
      color: rgba(255,255,255,0.55);
      margin: 0 0 0.8em;
      font-style: italic;
    }
    .kkphim-detail__stats {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6em;
      margin-bottom: 1em;
    }
    .kkphim-detail__stat {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      font-size: clamp(0.78em, 2vw, 0.88em);
      color: rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.08);
      padding: 0.3em 0.7em;
      border-radius: 0.5em;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .kkphim-detail__stat.star { color: #f5a623; }
    .kkphim-detail__stat.green { color: #2ecc71; }

    /* Ratings row */
    .kkphim-ratings {
      display: flex;
      gap: 1em;
      margin-bottom: 1.2em;
      flex-wrap: wrap;
    }
    .kkphim-rating-box {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.8em;
      padding: 0.6em 1em;
      display: flex;
      align-items: center;
      gap: 0.5em;
    }
    .kkphim-rating-box__icon {
      font-size: 1.4em;
    }
    .kkphim-rating-box__val {
      font-size: 1.1em;
      font-weight: 800;
    }
    .kkphim-rating-box__src {
      font-size: 0.72em;
      color: rgba(255,255,255,0.5);
    }
    .kkphim-rating-box.imdb { border-color: rgba(245,197,24,0.3); }
    .kkphim-rating-box.imdb .kkphim-rating-box__val { color: #f5c518; }
    .kkphim-rating-box.tmdb { border-color: rgba(1,180,228,0.3); }
    .kkphim-rating-box.tmdb .kkphim-rating-box__val { color: #01b4e4; }

    /* Actions */
    .kkphim-detail__actions {
      display: flex;
      gap: 0.8em;
      flex-wrap: wrap;
      margin-top: 1.2em;
    }
    .kkphim-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.75em 1.6em;
      border-radius: 0.6em;
      font-size: clamp(0.88em, 2.5vw, 1.05em);
      font-weight: 700;
      cursor: pointer;
      border: none;
      outline: none;
      transition: all 0.25s ease;
      user-select: none;
    }
    .kkphim-btn--primary {
      background: linear-gradient(135deg, #e50914, #c0050f);
      color: #fff;
      box-shadow: 0 4px 16px rgba(229,9,20,0.4);
    }
    .kkphim-btn--primary:hover,
    .kkphim-btn--primary.focus {
      box-shadow: 0 6px 24px rgba(229,9,20,0.6);
      transform: translateY(-2px);
    }
    .kkphim-btn--secondary {
      background: rgba(255,255,255,0.1);
      color: #fff;
      border: 1.5px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(8px);
    }
    .kkphim-btn--secondary:hover,
    .kkphim-btn--secondary.focus {
      background: rgba(255,255,255,0.18);
      transform: translateY(-2px);
    }
    .kkphim-btn--trailer {
      background: rgba(229,9,20,0.15);
      color: #e50914;
      border: 1.5px solid rgba(229,9,20,0.35);
    }
    .kkphim-btn--trailer:hover,
    .kkphim-btn--trailer.focus {
      background: rgba(229,9,20,0.25);
    }

    /* Description */
    .kkphim-detail__desc-wrap {
      margin-top: 1.5em;
    }
    .kkphim-detail__desc-title {
      font-size: clamp(0.9em, 2.5vw, 1em);
      font-weight: 700;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.6em;
    }
    .kkphim-detail__desc {
      font-size: clamp(0.88em, 2.4vw, 1em);
      color: rgba(255,255,255,0.8);
      line-height: 1.7;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: all 0.3s;
    }
    .kkphim-detail__desc.expanded {
      -webkit-line-clamp: unset;
    }
    .kkphim-detail__desc-toggle {
      color: #e50914;
      font-size: 0.88em;
      cursor: pointer;
      margin-top: 0.4em;
      display: inline-block;
    }

    /* Meta table */
    .kkphim-detail__meta-table {
      margin-top: 1.5em;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.5em 1em;
    }
    .kkphim-detail__meta-key {
      font-size: clamp(0.78em, 2vw, 0.88em);
      color: rgba(255,255,255,0.45);
      font-weight: 600;
      white-space: nowrap;
    }
    .kkphim-detail__meta-val {
      font-size: clamp(0.82em, 2.2vw, 0.92em);
      color: rgba(255,255,255,0.85);
    }
    .kkphim-detail__meta-val a {
      color: #e50914;
      text-decoration: none;
    }

    /* Genre chips */
    .kkphim-genres {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5em;
      margin-top: 1.5em;
    }
    .kkphim-genre {
      font-size: clamp(0.75em, 2vw, 0.85em);
      padding: 0.3em 0.8em;
      background: rgba(229,9,20,0.12);
      border: 1px solid rgba(229,9,20,0.3);
      color: rgba(255,255,255,0.85);
      border-radius: 2em;
      cursor: pointer;
      transition: all 0.2s;
    }
    .kkphim-genre:hover,
    .kkphim-genre.focus {
      background: rgba(229,9,20,0.3);
      color: #fff;
    }

    /* Episode list */
    .kkphim-episodes {
      margin-top: 2em;
    }
    .kkphim-episodes__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1em;
    }
    .kkphim-episodes__title {
      font-size: clamp(1em, 3vw, 1.15em);
      font-weight: 800;
    }
    .kkphim-episodes__count {
      font-size: 0.82em;
      color: rgba(255,255,255,0.5);
    }
    .kkphim-server-tabs {
      display: flex;
      gap: 0.6em;
      margin-bottom: 1em;
      overflow-x: auto;
      scrollbar-width: none;
      padding-bottom: 0.3em;
    }
    .kkphim-server-tab {
      white-space: nowrap;
      padding: 0.5em 1.1em;
      border-radius: 0.5em;
      font-size: clamp(0.78em, 2vw, 0.88em);
      font-weight: 600;
      cursor: pointer;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.7);
      transition: all 0.2s;
    }
    .kkphim-server-tab.active,
    .kkphim-server-tab.focus {
      background: rgba(229,9,20,0.85);
      border-color: transparent;
      color: #fff;
    }
    .kkphim-ep-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(clamp(56px, 14vw, 80px), 1fr));
      gap: 0.6em;
    }
    .kkphim-ep {
      aspect-ratio: 1.6;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.5em;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(0.78em, 2vw, 0.9em);
      font-weight: 700;
      color: rgba(255,255,255,0.75);
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }
    .kkphim-ep:hover,
    .kkphim-ep.focus {
      background: rgba(229,9,20,0.85);
      border-color: transparent;
      color: #fff;
      transform: scale(1.05);
    }
    .kkphim-ep.current {
      background: #e50914;
      border-color: transparent;
      color: #fff;
      box-shadow: 0 2px 12px rgba(229,9,20,0.5);
    }

    /* Cast section */
    .kkphim-cast {
      margin-top: 2em;
    }
    .kkphim-cast__row {
      display: flex;
      gap: 1em;
      overflow-x: auto;
      padding: 0.5em 0 1em;
      scrollbar-width: none;
    }
    .kkphim-cast__row::-webkit-scrollbar { display: none; }
    .kkphim-cast-card {
      flex-shrink: 0;
      width: clamp(80px, 16vw, 110px);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .kkphim-cast-card:hover { transform: translateY(-4px); }
    .kkphim-cast-card__img {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 50%;
      object-fit: cover;
      background: rgba(255,255,255,0.08);
      border: 2px solid rgba(255,255,255,0.1);
    }
    .kkphim-cast-card__name {
      font-size: clamp(0.7em, 1.8vw, 0.78em);
      color: rgba(255,255,255,0.8);
      text-align: center;
      margin-top: 0.4em;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .kkphim-cast-card__role {
      font-size: clamp(0.62em, 1.6vw, 0.7em);
      color: rgba(255,255,255,0.45);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Similar */
    .kkphim-similar {
      margin-top: 2em;
    }

    /* Loading & empty */
    .kkphim-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3em;
      gap: 1em;
      color: rgba(255,255,255,0.5);
    }
    .kkphim-spinner {
      width: 2.5em;
      height: 2.5em;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #e50914;
      border-radius: 50%;
      animation: kkphim-spin 0.8s linear infinite;
    }
    @keyframes kkphim-spin {
      to { transform: rotate(360deg); }
    }
    .kkphim-empty {
      text-align: center;
      padding: 3em 1.5em;
      color: rgba(255,255,255,0.4);
    }
    .kkphim-empty__icon { font-size: 3em; margin-bottom: 0.3em; }
    .kkphim-empty__text { font-size: clamp(0.9em, 2.5vw, 1.05em); }

    /* Pagination */
    .kkphim-pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5em;
      padding: 1.5em;
    }
    .kkphim-page-btn {
      width: 2.5em;
      height: 2.5em;
      border-radius: 0.5em;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(0.82em, 2vw, 0.92em);
      font-weight: 700;
      cursor: pointer;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.7);
      transition: all 0.2s;
      user-select: none;
    }
    .kkphim-page-btn:hover,
    .kkphim-page-btn.focus { background: rgba(229,9,20,0.85); color: #fff; }
    .kkphim-page-btn.active { background: #e50914; color: #fff; border-color: transparent; }
    .kkphim-page-btn:disabled { opacity: 0.3; cursor: default; }

    /* Scrollbar mobile friendly */
    @media (max-width: 600px) {
      .kkphim-hero { height: 72vw; }
      .kkphim-hero__content { padding: 1.2em; gap: 1em; }
      .kkphim-hero__poster { width: 80px; min-width: 80px; height: 120px; }
      .kkphim-detail__main { flex-direction: column; align-items: center; }
      .kkphim-detail__poster { width: 140px; }
      .kkphim-detail__right { width: 100%; padding-top: 0; text-align: center; }
      .kkphim-detail__stats { justify-content: center; }
      .kkphim-detail__actions { justify-content: center; }
      .kkphim-ratings { justify-content: center; }
      .kkphim-genres { justify-content: center; }
    }

    /* Scrollbar for all rows */
    .kkphim-row::-webkit-scrollbar-thumb {
      background: rgba(229,9,20,0.4);
      border-radius: 4px;
    }

    /* Fade-in animation */
    @keyframes kkphim-fadein {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .kkphim-fadein {
      animation: kkphim-fadein 0.4s ease forwards;
    }
  `;

  // ============================================================
  // UTILS
  // ============================================================
  function injectStyle() {
    if (document.getElementById("kkphim-style")) return;
    var s = document.createElement("style");
    s.id = "kkphim-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function cacheGet(key) {
    var e = CACHE[key];
    if (e && Date.now() - e.t < CACHE_TTL) return e.d;
    return null;
  }
  function cacheSet(key, data) {
    CACHE[key] = { d: data, t: Date.now() };
  }

  function fetchJSON(url, cb) {
    var cached = cacheGet(url);
    if (cached) return cb(null, cached);
    Lampa.Network.timeout = 10000;
    Lampa.Network.request(url, function (data) {
      try {
        var d = typeof data === "string" ? JSON.parse(data) : data;
        cacheSet(url, d);
        cb(null, d);
      } catch (e) {
        cb(e, null);
      }
    }, function (err) {
      cb(err || "Network error", null);
    });
  }

  function stripHtml(str) {
    if (!str) return "";
    return str.replace(/<[^>]*>/g, "");
  }

  function imgProxy(url) {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return "https://phimimg.com/" + url;
  }

  function tmdbPoster(path, size) {
    if (!path) return "";
    return TMDB_IMG + (size || "w342") + path;
  }

  function tmdbBackdrop(path, size) {
    if (!path) return "";
    return TMDB_IMG + (size || "w1280") + path;
  }

  function tmdbProfile(path) {
    if (!path) return "";
    return TMDB_IMG + "w185" + path;
  }

  function formatRuntime(mins) {
    if (!mins) return "";
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return (h > 0 ? h + "h " : "") + m + "m";
  }

  function svg(path) {
    return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="' + path + '"/></svg>';
  }

  // SVG icons
  var ICONS = {
    play: "M8 5v14l11-7z",
    info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
    back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
    star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
    time: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L11 13.5V7h1.5v5.75l4.5 2.67-1.26 2.08z",
    ep: "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z",
    search: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    grid: "M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z",
    list: "M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 16h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2z",
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    film: "M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z",
    trend: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",
    new: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-9 3h2v4h-2V7zm0 6h2v2h-2v-2z",
    close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    chev_right: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
    chev_down: "M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z",
    youtube: "M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z",
    person: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    bookmark: "M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z",
    share: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"
  };

  function icon(name, cls) {
    var d = ICONS[name] || "";
    var c = cls || "";
    return '<svg class="' + c + '" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:1em;height:1em;display:inline-block;vertical-align:middle"><path d="' + d + '"/></svg>';
  }

  // ============================================================
  // API LAYER
  // ============================================================
  var API = {
    // Get homepage movies
    getHome: function (cb) {
      var url = KKPHIM_API + "/danh-sach/phim-moi-cap-nhat?page=1";
      fetchJSON(url, cb);
    },

    // Get list by type
    getList: function (type, page, cb) {
      // type: phim-bo, phim-le, hoat-hinh, tv-shows, phim-vietsub, phim-thuyet-minh
      var url = KKPHIM_API + "/v1/api/danh-sach/" + type + "?page=" + (page || 1) + "&limit=24";
      fetchJSON(url, cb);
    },

    // Get by category
    getByCategory: function (slug, page, cb) {
      var url = KKPHIM_API + "/v1/api/the-loai/" + slug + "?page=" + (page || 1) + "&limit=24";
      fetchJSON(url, cb);
    },

    // Get by country
    getByCountry: function (slug, page, cb) {
      var url = KKPHIM_API + "/v1/api/quoc-gia/" + slug + "?page=" + (page || 1) + "&limit=24";
      fetchJSON(url, cb);
    },

    // Search
    search: function (q, page, cb) {
      var url = KKPHIM_API + "/v1/api/tim-kiem?keyword=" + encodeURIComponent(q) + "&page=" + (page || 1);
      fetchJSON(url, cb);
    },

    // Movie detail
    getDetail: function (slug, cb) {
      var url = KKPHIM_API + "/phim/" + slug;
      fetchJSON(url, cb);
    },

    // Categories list
    getCategories: function (cb) {
      var url = KKPHIM_API + "/the-loai";
      fetchJSON(url, cb);
    },

    // TMDB search (for poster/backdrop/rating enrichment)
    tmdbSearch: function (title, year, cb) {
      var q = encodeURIComponent(title);
      var url = TMDB_BASE + "/search/multi?api_key=" + TMDB_API_KEY + "&query=" + q + "&language=vi-VN" + (year ? "&year=" + year : "");
      fetchJSON(url, function (err, data) {
        if (err || !data || !data.results || !data.results.length) {
          cb(null, null);
          return;
        }
        cb(null, data.results[0]);
      });
    },

    // TMDB detail (movie or tv)
    tmdbDetail: function (id, type, cb) {
      // type: movie or tv
      var url = TMDB_BASE + "/" + type + "/" + id + "?api_key=" + TMDB_API_KEY + "&language=vi-VN&append_to_response=credits,videos,recommendations,images";
      fetchJSON(url, cb);
    },

    // TMDB trending
    tmdbTrending: function (cb) {
      var url = TMDB_BASE + "/trending/all/week?api_key=" + TMDB_API_KEY + "&language=vi-VN";
      fetchJSON(url, cb);
    }
  };

  // ============================================================
  // CATEGORIES DEFINITION
  // ============================================================
  var CATEGORIES = [
    { slug: "phim-moi", name: "🆕 Phim Mới", type: "list" },
    { slug: "phim-bo", name: "📺 Phim Bộ", type: "list" },
    { slug: "phim-le", name: "🎬 Phim Lẻ", type: "list" },
    { slug: "hoat-hinh", name: "🎠 Hoạt Hình", type: "list" },
    { slug: "tv-shows", name: "📡 TV Shows", type: "list" },
    { slug: "hanh-dong", name: "💥 Hành Động", type: "cat" },
    { slug: "tinh-cam", name: "💕 Tình Cảm", type: "cat" },
    { slug: "hai-huoc", name: "😂 Hài Hước", type: "cat" },
    { slug: "kinh-di", name: "👻 Kinh Dị", type: "cat" },
    { slug: "vien-tuong", name: "🚀 Viễn Tưởng", type: "cat" },
    { slug: "chien-tranh", name: "⚔️ Chiến Tranh", type: "cat" },
    { slug: "co-trang", name: "🏯 Cổ Trang", type: "cat" },
    { slug: "tam-ly", name: "🧠 Tâm Lý", type: "cat" },
    { slug: "hinh-su", name: "🔍 Hình Sự", type: "cat" },
    { slug: "the-thao", name: "⚽ Thể Thao", type: "cat" },
    { slug: "am-nhac", name: "🎵 Âm Nhạc", type: "cat" },
    { slug: "gia-dinh", name: "👨‍👩‍👧 Gia Đình", type: "cat" },
    { slug: "phieu-luu", name: "🗺️ Phiêu Lưu", type: "cat" },
    { slug: "bi-an", name: "🔮 Bí Ẩn", type: "cat" }
  ];

  var COUNTRIES = [
    { slug: "trung-quoc", name: "🇨🇳 Trung Quốc" },
    { slug: "han-quoc", name: "🇰🇷 Hàn Quốc" },
    { slug: "nhat-ban", name: "🇯🇵 Nhật Bản" },
    { slug: "my", name: "🇺🇸 Mỹ" },
    { slug: "viet-nam", name: "🇻🇳 Việt Nam" },
    { slug: "thai-lan", name: "🇹🇭 Thái Lan" },
    { slug: "hong-kong", name: "🇭🇰 Hồng Kông" },
    { slug: "anh", name: "🇬🇧 Anh" }
  ];

  // ============================================================
  // COMPONENT: Movie Card
  // ============================================================
  function buildCard(movie, opts) {
    opts = opts || {};
    var poster = imgProxy(movie.poster_url || movie.thumb_url || "");
    var name = movie.name || movie.title || "";
    var originName = movie.origin_name || "";
    var year = movie.year || "";
    var quality = movie.quality || "";
    var epCurrent = movie.episode_current || "";
    var type = movie.type === "series" ? "Phim Bộ" : movie.type === "single" ? "Phim Lẻ" : "";
    var slug = movie.slug || "";
    var vote = movie._tmdbVote || "";

    var badgesHtml = "";
    if (quality) {
      badgesHtml += '<span class="kkphim-card__badge kkphim-card__badge--quality">' + quality + "</span>";
    }
    var rightBadge = "";
    if (vote) {
      rightBadge = '<span class="kkphim-card__badge kkphim-card__badge--rating">⭐ ' + vote + "</span>";
    } else if (epCurrent && movie.type === "series") {
      rightBadge = '<span class="kkphim-card__badge kkphim-card__badge--ep">' + epCurrent + "</span>";
    }

    var html = '<div class="kkphim-card" data-slug="' + slug + '" tabindex="0">'
      + '<div class="kkphim-card__poster">'
      +   '<img class="kkphim-card__img" src="' + poster + '" alt="' + name + '" loading="lazy" onerror="this.src=\'\'"/>'
      +   '<div class="kkphim-card__badges">'
      +     badgesHtml
      +     rightBadge
      +   "</div>"
      +   '<div class="kkphim-card__overlay">'
      +     '<div class="kkphim-card__play-btn">'
      +       '<svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>'
      +     "</div>"
      +   "</div>"
      + "</div>"
      + '<div class="kkphim-card__info">'
      +   '<div class="kkphim-card__name">' + name + "</div>"
      +   '<div class="kkphim-card__meta">'
      +     (year ? '<span class="kkphim-card__year">' + year + "</span>" : "")
      +     (year && type ? '<span class="kkphim-card__dot"></span>' : "")
      +     (type ? '<span class="kkphim-card__type">' + type + "</span>" : "")
      +   "</div>"
      + "</div>"
      + "</div>";

    return html;
  }

  // ============================================================
  // COMPONENT: Loading & Empty
  // ============================================================
  function buildLoading() {
    return '<div class="kkphim-loading"><div class="kkphim-spinner"></div><span>Đang tải...</span></div>';
  }

  function buildEmpty(msg) {
    return '<div class="kkphim-empty"><div class="kkphim-empty__icon">🎬</div><div class="kkphim-empty__text">' + (msg || "Không tìm thấy kết quả") + "</div></div>";
  }

  // ============================================================
  // COMPONENT: Section Header
  // ============================================================
  function buildSection(icon_name, title, moreHtml) {
    return '<div class="kkphim-section__head">'
      + '<div class="kkphim-section__title">'
      +   icon(icon_name, "kkphim-section__icon")
      +   " " + title
      + "</div>"
      + (moreHtml || "")
      + "</div>";
  }

  // ============================================================
  // MAIN PLUGIN COMPONENT
  // ============================================================
  function KKPhimPlugin() {
    var self = this;
    self.name = PLUGIN_NAME;
    self.component = null;
    self.current_movie = null;
    self.current_page = 1;
    self.current_cat = CATEGORIES[0];
    self.search_timer = null;
    self.search_query = "";

    self.create = function () {
      injectStyle();
      self.component = $("<div class='kkphim-wrap kkphim-fadein'></div>");
      self.renderHome();
      return self.component;
    };

    // ============================================================
    // RENDER HOME
    // ============================================================
    self.renderHome = function () {
      self.component.html(buildLoading());

      // Build home layout
      var html = '<div class="kkphim-home">';

      // Hero placeholder
      html += '<div class="kkphim-hero" id="kkphim-hero">'
        + '<div class="kkphim-hero__bg" id="kkphim-hero-bg"></div>'
        + '<div class="kkphim-hero__gradient"></div>'
        + '<div class="kkphim-hero__content" id="kkphim-hero-content">'
        +   '<div class="kkphim-hero__info"><div class="kkphim-spinner"></div></div>'
        + "</div>"
        + "</div>";

      // Search
      html += '<div class="kkphim-search-wrap">'
        + '<div class="kkphim-search" id="kkphim-search">'
        +   '<span class="kkphim-search__icon">' + icon("search") + "</span>"
        +   '<input class="kkphim-search__input" id="kkphim-search-input" type="text" placeholder="Tìm kiếm phim..." />'
        + "</div>"
        + "</div>";

      // Category chips
      html += '<div class="kkphim-section">'
        + buildSection("grid", "Thể Loại", "")
        + '<div class="kkphim-cats" id="kkphim-cats">';

      CATEGORIES.forEach(function (cat, i) {
        html += '<div class="kkphim-cat' + (i === 0 ? " active" : "") + '" data-index="' + i + '" data-slug="' + cat.slug + '" data-type="' + cat.type + '">' + cat.name + "</div>";
      });
      html += "</div></div>";

      // Quốc gia
      html += '<div class="kkphim-section">'
        + buildSection("home", "Quốc Gia", "")
        + '<div class="kkphim-cats" id="kkphim-countries">';
      COUNTRIES.forEach(function (c) {
        html += '<div class="kkphim-cat" data-slug="' + c.slug + '" data-country="1">' + c.name + "</div>";
      });
      html += "</div></div>";

      // Rows placeholder
      html += '<div id="kkphim-rows"><div class="kkphim-section">' + buildSection("trend", "Đang Tải...", "") + '<div class="kkphim-row">' + buildLoading() + "</div></div></div>";

      html += "</div>";

      self.component.html(html);

      // Bind search
      var searchInput = self.component.find("#kkphim-search-input");
      searchInput.on("input", function () {
        var q = $(this).val().trim();
        clearTimeout(self.search_timer);
        self.search_timer = setTimeout(function () {
          if (q.length >= 2) {
            self.renderSearchResults(q);
          } else if (q.length === 0) {
            self.loadHomeRows();
          }
        }, 500);
      });
      searchInput.on("focus", function () {
        self.component.find("#kkphim-search").addClass("focus");
      });
      searchInput.on("blur", function () {
        self.component.find("#kkphim-search").removeClass("focus");
      });

      // Bind category chips
      self.component.on("click", ".kkphim-cat[data-index]", function () {
        var idx = parseInt($(this).data("index"));
        self.component.find(".kkphim-cat[data-index]").removeClass("active");
        $(this).addClass("active");
        self.current_cat = CATEGORIES[idx];
        self.current_page = 1;
        self.loadCategoryRows(self.current_cat, 1);
      });

      // Bind country chips
      self.component.on("click", ".kkphim-cat[data-country]", function () {
        var slug = $(this).data("slug");
        self.component.find(".kkphim-cat[data-country]").removeClass("active");
        $(this).addClass("active");
        self.loadCountryRows(slug, 1);
      });

      // Bind movie card click
      self.component.on("click", ".kkphim-card", function () {
        var slug = $(this).data("slug");
        if (slug) self.openDetail(slug);
      });

      // Load data
      self.loadHero();
      self.loadHomeRows();
    };

    // ============================================================
    // HERO
    // ============================================================
    self.loadHero = function () {
      API.getList("phim-le", 1, function (err, data) {
        if (err || !data) return;
        var items = [];
        if (data.data && data.data.items) {
          items = data.data.items;
        } else if (data.items) {
          items = data.items;
        }
        if (!items.length) return;

        var hero = items[Math.floor(Math.random() * Math.min(items.length, 8))];
        self.renderHero(hero);
      });
    };

    self.renderHero = function (movie) {
      var bg = imgProxy(movie.thumb_url || movie.poster_url || "");
      var poster = imgProxy(movie.poster_url || movie.thumb_url || "");
      var name = movie.name || "";
      var originName = movie.origin_name || "";
      var quality = movie.quality || "";
      var year = movie.year || "";
      var slug = movie.slug || "";
      var epCurrent = movie.episode_current || "";
      var lang = movie.lang || "";

      // Try TMDB enrichment
      API.tmdbSearch(originName || name, year, function (err, tmdb) {
        var backdrop = bg;
        var vote = "";
        var overview = movie.content || "";
        var genres = "";

        if (tmdb) {
          if (tmdb.backdrop_path) backdrop = tmdbBackdrop(tmdb.backdrop_path);
          if (tmdb.vote_average) vote = tmdb.vote_average.toFixed(1);
          if (tmdb.overview && !overview) overview = tmdb.overview;
        }

        var heroEl = self.component.find("#kkphim-hero-bg");
        var heroContent = self.component.find("#kkphim-hero-content");

        heroEl.css("background-image", "url(" + backdrop + ")");

        var tagsHtml = "";
        if (quality) tagsHtml += '<span class="kkphim-hero__tag quality">' + quality + "</span>";
        if (year) tagsHtml += '<span class="kkphim-hero__tag">' + icon("time") + " " + year + "</span>";
        if (vote) tagsHtml += '<span class="kkphim-hero__tag rating">⭐ " + vote + "</span>";
        if (lang) tagsHtml += '<span class="kkphim-hero__tag">' + lang + "</span>";
        if (epCurrent && movie.type === "series") {
          tagsHtml += '<span class="kkphim-hero__tag">' + icon("ep") + " " + epCurrent + "</span>";
        }

        heroContent.html(
          '<div class="kkphim-hero__poster"><img src="' + poster + '" alt="" loading="lazy"/></div>'
          + '<div class="kkphim-hero__info">'
          +   '<div class="kkphim-hero__badge">' + icon("film") + " Nổi Bật Hôm Nay</div>"
          +   '<div class="kkphim-hero__title">' + name + "</div>"
          +   (originName ? '<div class="kkphim-hero__subtitle">' + originName + "</div>" : "")
          +   '<div class="kkphim-hero__meta">' + tagsHtml + "</div>"
          +   '<div class="kkphim-hero__actions">'
          +     '<button class="kkphim-hero__btn kkphim-hero__btn--play" data-slug="' + slug + '">'
          +       icon("play") + " Xem Ngay"
          +     "</button>"
          +     '<button class="kkphim-hero__btn kkphim-hero__btn--info" data-slug="' + slug + '" data-info="1">'
          +       icon("info") + " Chi Tiết"
          +     "</button>"
          +   "</div>"
          + "</div>"
        );

        // Bind hero buttons
        heroContent.find(".kkphim-hero__btn--play").on("click", function () {
          self.openDetail($(this).data("slug"), true);
        });
        heroContent.find("[data-info]").on("click", function () {
          self.openDetail($(this).data("slug"), false);
        });
      });
    };

    // ============================================================
    // LOAD HOME ROWS
    // ============================================================
    self.loadHomeRows = function () {
      var rowsEl = self.component.find("#kkphim-rows");
      rowsEl.html('<div class="kkphim-section">' + buildSection("trend", "Đang Tải...", "") + buildLoading() + "</div>");

      var rowsDef = [
        { type: "phim-bo", title: "📺 Phim Bộ Mới Nhất", icon: "film" },
        { type: "phim-le", title: "🎬 Phim Lẻ Mới Nhất", icon: "film" },
        { type: "hoat-hinh", title: "🎠 Hoạt Hình", icon: "film" },
        { type: "tv-shows", title: "📡 TV Shows", icon: "film" }
      ];

      var html = "";
      var loaded = 0;

      // First load trending from TMDB
      html += '<div class="kkphim-section kkphim-fadein" id="kkphim-tmdb-trending">'
        + buildSection("trend", "🔥 Xu Hướng TMDB", '<span class="kkphim-section__more">Xem thêm ' + icon("chev_right") + "</span>")
        + '<div class="kkphim-row" id="kkphim-tmdb-row">' + buildLoading() + "</div>"
        + "</div>";

      rowsDef.forEach(function (rd) {
        html += '<div class="kkphim-section kkphim-fadein" id="kkphim-row-' + rd.type + '">'
          + buildSection(rd.icon, rd.title, '<span class="kkphim-section__more" data-type="' + rd.type + '">Xem thêm ' + icon("chev_right") + "</span>")
          + '<div class="kkphim-row" id="kkphim-row-items-' + rd.type + '">' + buildLoading() + "</div>"
          + "</div>";
      });

      html += '<div class="kkphim-section kkphim-fadein">'
        + buildSection("grid", "🌏 Phim Theo Quốc Gia", "")
        + "</div>";

      rowsEl.html(html);

      // Load TMDB trending
      API.tmdbTrending(function (err, data) {
        var tmdbRow = rowsEl.find("#kkphim-tmdb-row");
        if (err || !data || !data.results) {
          tmdbRow.html(buildEmpty("Không tải được"));
          return;
        }
        var cardsHtml = "";
        data.results.slice(0, 20).forEach(function (item) {
          var fakeMovie = {
            name: item.title || item.name || "",
            origin_name: item.original_title || item.original_name || "",
            year: (item.release_date || item.first_air_date || "").substr(0, 4),
            poster_url: tmdbPoster(item.poster_path),
            thumb_url: tmdbPoster(item.poster_path),
            slug: item.id + "_tmdb_" + (item.media_type || "movie"),
            quality: "HD",
            type: item.media_type === "tv" ? "series" : "single",
            _tmdbVote: item.vote_average ? item.vote_average.toFixed(1) : ""
          };
          cardsHtml += buildCard(fakeMovie);
        });
        tmdbRow.html(cardsHtml || buildEmpty());
      });

      // Load each kkphim row
      rowsDef.forEach(function (rd) {
        API.getList(rd.type, 1, function (err, data) {
          var rowEl = rowsEl.find("#kkphim-row-items-" + rd.type);
          if (err || !data) {
            rowEl.html(buildEmpty());
            return;
          }
          var items = [];
          if (data.data && data.data.items) items = data.data.items;
          else if (data.items) items = data.items;

          var cardsHtml = "";
          items.slice(0, 20).forEach(function (movie) {
            cardsHtml += buildCard(movie);
          });
          rowEl.html(cardsHtml || buildEmpty());
        });
      });

      // Bind "Xem thêm"
      rowsEl.on("click", ".kkphim-section__more[data-type]", function () {
        var type = $(this).data("type");
        self.openListPage(type);
      });
    };

    // ============================================================
    // LOAD CATEGORY ROWS
    // ============================================================
    self.loadCategoryRows = function (cat, page) {
      var rowsEl = self.component.find("#kkphim-rows");
      rowsEl.html('<div class="kkphim-section">' + buildSection("grid", cat.name, "") + buildLoading() + "</div>");

      var fetchFn = cat.type === "list"
        ? function (cb) { API.getList(cat.slug, page, cb); }
        : function (cb) { API.getByCategory(cat.slug, page, cb); };

      fetchFn(function (err, data) {
        if (err || !data) {
          rowsEl.html(buildEmpty("Không tải được dữ liệu"));
          return;
        }
        var items = [];
        var totalPages = 1;
        if (data.data && data.data.items) {
          items = data.data.items;
          if (data.data.params && data.data.params.pagination) {
            totalPages = data.data.params.pagination.totalPages || 1;
          }
        } else if (data.items) {
          items = data.items;
          totalPages = data.totalPages || 1;
        }

        var html = '<div class="kkphim-section kkphim-fadein">'
          + buildSection("grid", cat.name, "")
          + '<div class="kkphim-grid">';
        items.forEach(function (m) { html += buildCard(m); });
        html += "</div>";
        html += buildPagination(page, totalPages, "cat");
        html += "</div>";

        rowsEl.html(html);

        rowsEl.on("click", ".kkphim-page-btn[data-page]", function () {
          var p = parseInt($(this).data("page"));
          self.current_page = p;
          self.loadCategoryRows(self.current_cat, p);
        });
      });
    };

    // ============================================================
    // LOAD COUNTRY ROWS
    // ============================================================
    self.loadCountryRows = function (slug, page) {
      var rowsEl = self.component.find("#kkphim-rows");
      var country = COUNTRIES.find(function (c) { return c.slug === slug; }) || { name: slug };
      rowsEl.html('<div class="kkphim-section">' + buildSection("home", country.name, "") + buildLoading() + "</div>");

      API.getByCountry(slug, page, function (err, data) {
        if (err || !data) {
          rowsEl.html(buildEmpty());
          return;
        }
        var items = [];
        var totalPages = 1;
        if (data.data && data.data.items) {
          items = data.data.items;
          if (data.data.params && data.data.params.pagination) {
            totalPages = data.data.params.pagination.totalPages || 1;
          }
        } else if (data.items) {
          items = data.items;
        }

        var html = '<div class="kkphim-section kkphim-fadein">'
          + buildSection("home", country.name, "")
          + '<div class="kkphim-grid">';
        items.forEach(function (m) { html += buildCard(m); });
        html += "</div>";
        html += buildPagination(page, totalPages, "country_" + slug);
        html += "</div>";

        rowsEl.html(html);
      });
    };

    // ============================================================
    // SEARCH RESULTS
    // ============================================================
    self.renderSearchResults = function (q) {
      var rowsEl = self.component.find("#kkphim-rows");
      rowsEl.html('<div class="kkphim-section">'
        + buildSection("search", 'Tìm kiếm: "' + q + '"', "")
        + buildLoading()
        + "</div>");

      API.search(q, 1, function (err, data) {
        if (err || !data) {
          rowsEl.html(buildEmpty("Không tìm được kết quả cho: " + q));
          return;
        }
        var items = [];
        if (data.data && data.data.items) items = data.data.items;
        else if (data.items) items = data.items;

        if (!items.length) {
          rowsEl.html(buildEmpty('Không tìm được kết quả cho "' + q + '"'));
          return;
        }

        var html = '<div class="kkphim-section kkphim-fadein">'
          + buildSection("search", 'Kết quả: "' + q + '" (' + items.length + " phim)", "")
          + '<div class="kkphim-grid">';
        items.forEach(function (m) { html += buildCard(m); });
        html += "</div></div>";

        rowsEl.html(html);
      });
    };

    // ============================================================
    // OPEN LIST PAGE (full page)
    // ============================================================
    self.openListPage = function (type) {
      var title = CATEGORIES.find(function (c) { return c.slug === type; });
      title = title ? title.name : type;

      var oldContent = self.component.html();
      self.component.html(buildLoading());

      API.getList(type, 1, function (err, data) {
        if (err || !data) {
          self.component.html(buildEmpty());
          return;
        }
        var items = [];
        var totalPages = 1;
        if (data.data && data.data.items) {
          items = data.data.items;
          if (data.data.params && data.data.params.pagination) {
            totalPages = data.data.params.pagination.totalPages || 1;
          }
        } else if (data.items) {
          items = data.items;
          totalPages = data.totalPages || 1;
        }

        var html = '<div class="kkphim-fadein" style="padding:1em">';
        html += '<div style="display:flex;align-items:center;gap:0.8em;margin-bottom:1.2em;">'
          + '<div class="kkphim-detail__back" id="kkphim-list-back">' + icon("back") + "</div>"
          + '<h2 style="margin:0;font-size:clamp(1em,3vw,1.4em);">' + title + "</h2>"
          + "</div>";
        html += '<div class="kkphim-grid">';
        items.forEach(function (m) { html += buildCard(m); });
        html += "</div>";
        html += buildPagination(1, totalPages, "list_" + type);
        html += "</div>";

        self.component.html(html);

        self.component.find("#kkphim-list-back").on("click", function () {
          self.component.html(oldContent);
          self.bindEvents();
        });

        // Paginate
        self.component.on("click", ".kkphim-page-btn[data-page]", function () {
          var p = parseInt($(this).data("page"));
          self.component.html(buildLoading());
          API.getList(type, p, function (err2, data2) {
            // re-render same structure
            self.openListPage(type);
          });
        });
      });
    };

    // ============================================================
    // OPEN DETAIL
    // ============================================================
    self.openDetail = function (slug, autoPlay) {
      // Handle TMDB-only items
      if (slug.indexOf("_tmdb_") !== -1) {
        var parts = slug.split("_tmdb_");
        var tmdbId = parts[0];
        var mediaType = parts[1] || "movie";
        self.openTmdbDetail(tmdbId, mediaType);
        return;
      }

      var oldContent = self.component.html();
      self.component.html(buildLoading());

      API.getDetail(slug, function (err, data) {
        if (err || !data) {
          self.component.html(buildEmpty("Không tải được thông tin phim"));
          return;
        }

        var movie = data.movie || data;
        var episodes = data.episodes || [];

        // Enrich with TMDB
        API.tmdbSearch(movie.origin_name || movie.name, movie.year, function (terr, tmdb) {
          if (tmdb && tmdb.id) {
            var mtype = tmdb.media_type || "movie";
            API.tmdbDetail(tmdb.id, mtype, function (err2, td) {
              self.renderDetail(movie, episodes, td, oldContent, autoPlay);
            });
          } else {
            self.renderDetail(movie, episodes, null, oldContent, autoPlay);
          }
        });
      });
    };

    self.openTmdbDetail = function (tmdbId, mediaType) {
      var oldContent = self.component.html();
      self.component.html(buildLoading());

      API.tmdbDetail(tmdbId, mediaType, function (err, td) {
        if (err || !td) {
          self.component.html(buildEmpty());
          return;
        }
        var movie = {
          name: td.title || td.name || "",
          origin_name: td.original_title || td.original_name || "",
          year: (td.release_date || td.first_air_date || "").substr(0, 4),
          poster_url: tmdbPoster(td.poster_path, "w500"),
          thumb_url: tmdbBackdrop(td.backdrop_path, "w1280"),
          quality: "HD",
          content: td.overview || "",
          type: mediaType === "tv" ? "series" : "single",
          time: formatRuntime(td.runtime),
          lang: "Phụ đề",
          status: "Hoàn Tất"
        };
        self.renderDetail(movie, [], td, oldContent, false);
      });
    };

    self.renderDetail = function (movie, episodes, tmdb, oldContent, autoPlay) {
      var name = movie.name || "";
      var originName = movie.origin_name || "";
      var year = movie.year || "";
      var quality = movie.quality || "";
      var status = movie.status || "";
      var time = movie.time || "";
      var lang = movie.lang || "";
      var content = stripHtml(movie.content || "");
      var type = movie.type || "";
      var categories = movie.category || [];
      var countries = movie.country || [];
      var actors = movie.actor || [];
      var director = movie.director || [];

      var poster = imgProxy(movie.poster_url || "");
      var backdrop = imgProxy(movie.thumb_url || movie.poster_url || "");

      // TMDB data
      var tmdbVote = "";
      var tmdbGenres = [];
      var tmdbCast = [];
      var tmdbTrailer = "";
      var tmdbRecommendations = [];
      var imdbVote = "";

      if (tmdb) {
        if (tmdb.backdrop_path) backdrop = tmdbBackdrop(tmdb.backdrop_path, "w1280");
        if (tmdb.poster_path && !movie.poster_url) poster = tmdbPoster(tmdb.poster_path, "w500");
        if (tmdb.vote_average) tmdbVote = tmdb.vote_average.toFixed(1);
        if (tmdb.genres) tmdbGenres = tmdb.genres;
        if (tmdb.credits && tmdb.credits.cast) tmdbCast = tmdb.credits.cast.slice(0, 15);
        if (tmdb.videos && tmdb.videos.results) {
          var trailer = tmdb.videos.results.find(function (v) { return v.type === "Trailer" && v.site === "YouTube"; });
          if (trailer) tmdbTrailer = "https://www.youtube.com/watch?v=" + trailer.key;
        }
        if (tmdb.recommendations && tmdb.recommendations.results) {
          tmdbRecommendations = tmdb.recommendations.results.slice(0, 12);
        }
        if (tmdb.imdb_id) {
          // We'd need another call for IMDB rating, use tmdb for now
        }
        if (tmdb.external_ids && tmdb.external_ids.imdb_id) {
          // placeholder
        }
      }

      // Build HTML
      var html = '<div class="kkphim-detail kkphim-fadein">';

      // Hero
      html += '<div class="kkphim-detail__hero">'
        + '<div class="kkphim-detail__bg" style="background-image:url(' + backdrop + ')"></div>'
        + '<div class="kkphim-detail__gradient"></div>'
        + '<div class="kkphim-detail__back" id="kkphim-detail-back">' + icon("back") + "</div>"
        + "</div>";

      // Body
      html += '<div class="kkphim-detail__body">';

      // Main info
      html += '<div class="kkphim-detail__main">';

      // Poster
      html += '<div class="kkphim-detail__poster">'
        + '<img src="' + poster + '" alt="' + name + '" loading="lazy" />'
        + "</div>";

      // Right
      html += '<div class="kkphim-detail__right">';
      if (quality) html += '<span class="kkphim-detail__quality">' + quality + "</span>";
      html += '<h1 class="kkphim-detail__title">' + name + "</h1>";
      if (originName) html += '<p class="kkphim-detail__subtitle">' + originName + "</p>";

      // Stats row
      html += '<div class="kkphim-detail__stats">';
      if (year) html += '<span class="kkphim-detail__stat">' + icon("time") + " " + year + "</span>";
      if (time) html += '<span class="kkphim-detail__stat">' + icon("time") + " " + time + "</span>";
      if (lang) html += '<span class="kkphim-detail__stat">' + lang + "</span>";
      if (status) html += '<span class="kkphim-detail__stat green">✓ " + status + "</span>";
      if (type === "series") html += '<span class="kkphim-detail__stat">' + icon("ep") + " Phim Bộ</span>";
      else if (type === "single") html += '<span class="kkphim-detail__stat">' + icon("film") + " Phim Lẻ</span>";
      html += "</div>";

      // Ratings
      if (tmdbVote || imdbVote) {
        html += '<div class="kkphim-ratings">';
        if (tmdbVote) {
          html += '<div class="kkphim-rating-box tmdb">'
            + '<span class="kkphim-rating-box__icon">🎬</span>'
            + '<div><div class="kkphim-rating-box__val">⭐ ' + tmdbVote + "</div>"
            + '<div class="kkphim-rating-box__src">TMDB</div></div>'
            + "</div>";
        }
        html += "</div>";
      }

      // Actions
      html += '<div class="kkphim-detail__actions">';
      if (episodes.length) {
        html += '<button class="kkphim-btn kkphim-btn--primary" id="kkphim-watch-btn">'
          + icon("play") + " Xem Phim"
          + "</button>";
      }
      html += '<button class="kkphim-btn kkphim-btn--secondary" id="kkphim-bookmark-btn">'
        + icon("bookmark") + " Lưu"
        + "</button>";
      if (tmdbTrailer) {
        html += '<a href="' + tmdbTrailer + '" target="_blank" class="kkphim-btn kkphim-btn--trailer" id="kkphim-trailer-btn">'
          + icon("youtube") + " Trailer"
          + "</a>";
      }
      html += "</div>"; // actions

      html += "</div>"; // right
      html += "</div>"; // main

      // Description
      if (content) {
        html += '<div class="kkphim-detail__desc-wrap">'
          + '<div class="kkphim-detail__desc-title">Nội Dung</div>'
          + '<div class="kkphim-detail__desc" id="kkphim-desc">' + content + "</div>"
          + '<span class="kkphim-detail__desc-toggle" id="kkphim-desc-toggle">Xem thêm ▾</span>'
          + "</div>";
      }

      // Meta table
      html += '<div class="kkphim-detail__meta-table">';
      if (director && director.length) {
        html += '<div class="kkphim-detail__meta-key">Đạo diễn</div>'
          + '<div class="kkphim-detail__meta-val">' + (Array.isArray(director) ? director.join(", ") : director) + "</div>";
      }
      if (actors && actors.length) {
        var actorsStr = Array.isArray(actors) ? actors.slice(0, 6).join(", ") : actors;
        html += '<div class="kkphim-detail__meta-key">Diễn viên</div>'
          + '<div class="kkphim-detail__meta-val">' + actorsStr + "</div>";
      }
      if (countries && countries.length) {
        var countryStr = countries.map(function (c) { return c.name || c; }).join(", ");
        html += '<div class="kkphim-detail__meta-key">Quốc gia</div>'
          + '<div class="kkphim-detail__meta-val">' + countryStr + "</div>";
      }
      if (categories && categories.length) {
        var catStr = categories.map(function (c) { return c.name || c; }).join(", ");
        html += '<div class="kkphim-detail__meta-key">Thể loại</div>'
          + '<div class="kkphim-detail__meta-val">' + catStr + "</div>";
      }
      html += "</div>";

      // Genres from TMDB
      if (tmdbGenres.length) {
        html += '<div class="kkphim-genres">';
        tmdbGenres.forEach(function (g) {
          html += '<span class="kkphim-genre">' + g.name + "</span>";
        });
        html += "</div>";
      }

      // Episodes
      if (episodes.length) {
        html += self.buildEpisodes(episodes);
      }

      // Cast from TMDB
      if (tmdbCast.length) {
        html += '<div class="kkphim-cast">';
        html += buildSection("person", "Diễn Viên", "");
        html += '<div class="kkphim-cast__row">';
        tmdbCast.forEach(function (c) {
          var img = c.profile_path ? tmdbProfile(c.profile_path) : "";
          html += '<div class="kkphim-cast-card">'
            + '<img class="kkphim-cast-card__img" src="' + img + '" alt="' + c.name + '" loading="lazy" onerror="this.src=\'\'"/>'
            + '<div class="kkphim-cast-card__name">' + c.name + "</div>"
            + '<div class="kkphim-cast-card__role">' + (c.character || "") + "</div>"
            + "</div>";
        });
        html += "</div></div>";
      }

      // Recommendations
      if (tmdbRecommendations.length) {
        html += '<div class="kkphim-similar">';
        html += buildSection("film", "Có Thể Bạn Thích", "");
        html += '<div class="kkphim-row">';
        tmdbRecommendations.forEach(function (item) {
          var fakeMovie = {
            name: item.title || item.name || "",
            poster_url: tmdbPoster(item.poster_path),
            year: (item.release_date || item.first_air_date || "").substr(0, 4),
            slug: item.id + "_tmdb_" + (item.media_type || "movie"),
            quality: "HD",
            type: item.media_type === "tv" ? "series" : "single",
            _tmdbVote: item.vote_average ? item.vote_average.toFixed(1) : ""
          };
          html += buildCard(fakeMovie);
        });
        html += "</div></div>";
      }

      html += "</div>"; // body
      html += "</div>"; // detail

      self.component.html(html);

      // Back button
      self.component.find("#kkphim-detail-back").on("click", function () {
        self.component.html(oldContent);
        self.bindEvents();
      });

      // Description toggle
      self.component.find("#kkphim-desc-toggle").on("click", function () {
        var desc = self.component.find("#kkphim-desc");
        var isExpanded = desc.hasClass("expanded");
        desc.toggleClass("expanded");
        $(this).text(isExpanded ? "Xem thêm ▾" : "Thu gọn ▴");
      });

      // Watch button -> scroll to episodes
      self.component.find("#kkphim-watch-btn").on("click", function () {
        var epsEl = self.component.find(".kkphim-episodes");
        if (epsEl.length) {
          $("html, body").animate({ scrollTop: epsEl.offset().top - 20 }, 400);
        }
      });

      // Bind episode click
      self.component.on("click", ".kkphim-ep", function () {
        self.component.find(".kkphim-ep").removeClass("current");
        $(this).addClass("current");
        var url = $(this).data("url");
        var name = $(this).data("name");
        if (url) self.playEpisode(url, name, movie);
      });

      // Bind server tabs
      self.component.on("click", ".kkphim-server-tab", function () {
        self.component.find(".kkphim-server-tab").removeClass("active");
        $(this).addClass("active");
        var serverIdx = parseInt($(this).data("server"));
        self.component.find(".kkphim-ep-panel").hide();
        self.component.find(".kkphim-ep-panel[data-server='" + serverIdx + "']").show();
      });

      // Similar / recommendations card click
      self.component.on("click", ".kkphim-card", function () {
        var slug = $(this).data("slug");
        if (slug) self.openDetail(slug, false);
      });

      // Auto play first ep
      if (autoPlay && episodes.length) {
        var firstEp = self.component.find(".kkphim-ep").first();
        if (firstEp.length) {
          setTimeout(function () { firstEp.trigger("click"); }, 500);
        }
      }
    };

    // ============================================================
    // BUILD EPISODES
    // ============================================================
    self.buildEpisodes = function (episodes) {
      if (!episodes.length) return "";

      var html = '<div class="kkphim-episodes">';
      html += '<div class="kkphim-episodes__header">';
      html += '<div class="kkphim-episodes__title">' + icon("ep") + " Danh Sách Tập</div>";
      var totalEps = 0;
      episodes.forEach(function (s) { totalEps += (s.server_data || []).length; });
      html += '<div class="kkphim-episodes__count">' + totalEps + " tập</div>";
      html += "</div>";

      if (episodes.length > 1) {
        html += '<div class="kkphim-server-tabs">';
        episodes.forEach(function (server, i) {
          html += '<div class="kkphim-server-tab' + (i === 0 ? " active" : "") + '" data-server="' + i + '">'
            + (server.server_name || ("Server " + (i + 1)))
            + "</div>";
        });
        html += "</div>";
      }

      episodes.forEach(function (server, si) {
        var eps = server.server_data || [];
        html += '<div class="kkphim-ep-panel" data-server="' + si + '" style="' + (si > 0 ? "display:none" : "") + '">';
        html += '<div class="kkphim-ep-grid">';
        eps.forEach(function (ep) {
          var url = ep.link_m3u8 || ep.link_embed || "";
          var epName = ep.name || ep.slug || "";
          html += '<div class="kkphim-ep" data-url="' + url + '" data-name="' + epName + '">' + epName + "</div>";
        });
        html += "</div></div>";
      });

      html += "</div>";
      return html;
    };

    // ============================================================
    // PLAY EPISODE
    // ============================================================
    self.playEpisode = function (url, epName, movie) {
      if (!url) {
        Lampa.Noty.show("Không tìm thấy link phát");
        return;
      }

      // Use Lampa player
      if (typeof Lampa.Player !== "undefined") {
        Lampa.Player.play({
          url: url,
          title: (movie.name || "") + (epName ? " - Tập " + epName : ""),
          poster: imgProxy(movie.poster_url || movie.thumb_url || "")
        });
      } else {
        // Fallback: open in new tab
        window.open(url, "_blank");
      }
    };

    // ============================================================
    // PAGINATION
    // ============================================================
    function buildPagination(current, total, ctx) {
      if (total <= 1) return "";
      var html = '<div class="kkphim-pagination">';

      if (current > 1) {
        html += '<div class="kkphim-page-btn" data-page="' + (current - 1) + '" data-ctx="' + ctx + '">‹</div>';
      }

      var startPage = Math.max(1, current - 2);
      var endPage = Math.min(total, current + 2);

      if (startPage > 1) {
        html += '<div class="kkphim-page-btn" data-page="1" data-ctx="' + ctx + '">1</div>';
        if (startPage > 2) html += '<span style="color:rgba(255,255,255,0.3);padding:0 0.3em;">···</span>';
      }

      for (var p = startPage; p <= endPage; p++) {
        html += '<div class="kkphim-page-btn' + (p === current ? " active" : "") + '" data-page="' + p + '" data-ctx="' + ctx + '">' + p + "</div>";
      }

      if (endPage < total) {
        if (endPage < total - 1) html += '<span style="color:rgba(255,255,255,0.3);padding:0 0.3em;">···</span>';
        html += '<div class="kkphim-page-btn" data-page="' + total + '" data-ctx="' + ctx + '">' + total + "</div>";
      }

      if (current < total) {
        html += '<div class="kkphim-page-btn" data-page="' + (current + 1) + '" data-ctx="' + ctx + '">›</div>';
      }

      html += "</div>";
      return html;
    }

    // ============================================================
    // RE-BIND EVENTS after restoring content
    // ============================================================
    self.bindEvents = function () {
      self.component.off("click");

      self.component.on("click", ".kkphim-card", function () {
        var slug = $(this).data("slug");
        if (slug) self.openDetail(slug, false);
      });

      self.component.on("click", ".kkphim-cat[data-index]", function () {
        var idx = parseInt($(this).data("index"));
        self.component.find(".kkphim-cat[data-index]").removeClass("active");
        $(this).addClass("active");
        self.current_cat = CATEGORIES[idx];
        self.loadCategoryRows(self.current_cat, 1);
      });

      self.component.on("click", ".kkphim-cat[data-country]", function () {
        var slug = $(this).data("slug");
        self.component.find(".kkphim-cat[data-country]").removeClass("active");
        $(this).addClass("active");
        self.loadCountryRows(slug, 1);
      });

      self.component.on("click", ".kkphim-section__more[data-type]", function () {
        self.openListPage($(this).data("type"));
      });

      var searchInput = self.component.find("#kkphim-search-input");
      searchInput.off("input").on("input", function () {
        var q = $(this).val().trim();
        clearTimeout(self.search_timer);
        self.search_timer = setTimeout(function () {
          if (q.length >= 2) self.renderSearchResults(q);
          else if (q.length === 0) self.loadHomeRows();
        }, 500);
      });
    };
  }

  // ============================================================
  // REGISTER LAMPA PLUGIN
  // ============================================================
  function registerPlugin() {
    if (typeof Lampa === "undefined") {
      console.warn("[KKPhim] Lampa is not defined");
      return;
    }

    // Register as a menu item / component
    Lampa.Component.add("kkphim_home", {
      create: function () {
        var plugin = new KKPhimPlugin();
        this.html = plugin.create();
      },
      start: function () {},
      pause: function () {},
      stop: function () {},
      destroy: function () {}
    });

    // Add to main menu
    Lampa.Template.add("kkphim_menu", "<li class=\"menu__item selector\" data-action=\"kkphim_home\"><div class=\"menu__ico\">🎬</div><div class=\"menu__text\">KKPhim</div></li>");

    Lampa.Listener.follow("app", function (e) {
      if (e.type === "ready") {
        try {
          // Add menu button
          var menuItem = document.createElement("li");
          menuItem.className = "menu__item selector";
          menuItem.setAttribute("data-action", "kkphim_home");
          menuItem.innerHTML = '<div class="menu__ico">'
            + '<svg viewBox="0 0 24 24" fill="currentColor" style="width:1.4em;height:1.4em"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>'
            + '</div><div class="menu__text">KKPhim</div>';

          menuItem.addEventListener("click", function () {
            Lampa.Activity.push({
              url: "",
              title: "KKPhim",
              component: "kkphim_home",
              page: 1
            });
          });

          var menu = document.querySelector(".menu__list");
          if (menu) {
            menu.appendChild(menuItem);
            Lampa.Controller.toggle("menu");
          }
        } catch (ex) {
          console.warn("[KKPhim] Menu inject error:", ex);
        }

        Lampa.Noty.show("🎬 KKPhim Plugin v" + PLUGIN_VERSION + " đã sẵn sàng!");
      }
    });
  }

  // ============================================================
  // LAMPA ACTIVITY COMPONENT
  // ============================================================
  (function () {
    var defined = false;

    function define() {
      if (defined) return;
      defined = true;

      Lampa.Component.add("kkphim_home", {
        create: function () {
          var self = this;
          self.plugin = new KKPhimPlugin();
          self.html = $("<div></div>");
          var content = self.plugin.create();
          self.html.append(content);
          return self.html;
        },
        start: function () {},
        pause: function () {},
        stop: function () {},
        destroy: function () {}
      });
    }

    if (window.Lampa) {
      define();
      registerPlugin();
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        if (window.Lampa) {
          define();
          registerPlugin();
        } else {
          // Wait for Lampa
          var check = setInterval(function () {
            if (window.Lampa) {
              clearInterval(check);
              define();
              registerPlugin();
            }
          }, 200);
          setTimeout(function () { clearInterval(check); }, 15000);
        }
      });
    }
  })();

  // ============================================================
  // MANIFEST
  // ============================================================
  if (window.Lampa && Lampa.Manifest) {
    Lampa.Manifest.plugins = Lampa.Manifest.plugins || [];
    Lampa.Manifest.plugins.push({
      name: PLUGIN_NAME,
      version: PLUGIN_VERSION,
      description: "Plugin xem phim KKPhim với giao diện đẹp và TMDB integration",
      author: "KKPhim Plugin",
      icon: "🎬"
    });
  }

})();