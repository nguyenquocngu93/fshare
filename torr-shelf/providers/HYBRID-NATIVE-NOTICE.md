# Hybrid native provider notice

The native provider logic in `hybrid-native.mjs` is an adapted, dependency-free port of the functional search/configuration behavior from:

- https://github.com/nguyenquocngu93/Hybr089
- Source reviewed: `index.js`, main branch, 2026-08-10
- Upstream `package.json` declares the MIT license.

TorrShelf intentionally does not copy upstream `node_modules`, logs, generated patch files, the standalone configuration page, or the embedded TMDB credential. TorrShelf uses its existing Node 20 fetch runtime, its configured TMDB credential, its existing Magnetz/Knaben API clients, and its own Settings UI.

Important behavioral preservation:

- Jacred is queried by both exact IMDb ID and the Russian title from TMDB (`ru-RU`).
- Jacred series results are treated as packs and are not filtered by requested episode during search.
- The requested episode is selected from TorrServer `file_stats` only when playback is resolved.
