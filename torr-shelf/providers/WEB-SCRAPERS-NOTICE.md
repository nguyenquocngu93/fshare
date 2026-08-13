# Experimental web scrapers notice

The dependency-free TorrShelf providers `4khdhub.mjs`, `moviesdrive.mjs`, `hdhub4u.mjs`, and `uhdmovies.mjs` are informed by the corresponding provider flows in:

- `tapframe/NuvioStreamsAddon`
- https://github.com/tapframe/NuvioStreamsAddon

The upstream project is distributed under the MIT License:

```text
MIT License

Copyright (c) 2024 tapframe and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

All scrapers/directories are disabled by default. They use runtime domain discovery where available, strict title/year/episode matching, omit archive files, and isolate failures from TorrShelf's other providers. `vadapav.mjs` consumes Vadapav's public Stremio stream endpoint; `hubcloud-search.mjs` consumes HubCloud's public file-search endpoint.
