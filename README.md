# site-kit

Small, dependency-free pieces [Steadfast Code](https://steadfastcode.tech) reuses across the
websites it builds. Each piece is plain HTML, CSS and a little JavaScript, so it works on an Astro
site, a WordPress theme or a hand-written page, and each one is tested in a real browser.

## Photo viewer

A full-screen viewer for a set of photo links: previous and next on buttons, arrow keys and swipe;
Esc, the close button or a click outside the photo to close; a "2 of 7" count; the neighbouring
photos load ahead. The links stay ordinary links to the full-size image, so with JavaScript off, or
on a ctrl/cmd/middle click, the photo opens the way it always would. About 2 KB of script, inlined.

**Astro**

```astro
---
import PhotoViewer from '@steadfastcode/site-kit/photo-viewer';
---
<div class="photos">
  <figure><a href="/photos/porch-2000.webp"><img src="/photos/porch-800.webp" width="800" height="600" alt="Rebuilt porch steps"></a>
    <figcaption>Rebuilt porch steps</figcaption></figure>
  …
</div>
<PhotoViewer links=".photos a" />
```

Props: `links` (selector, required), `countFormat` (`"{n} of {total}"`), `label`, `closeLabel`,
`prevLabel`, `nextLabel`.

**Anything else:** link `photo-viewer.css`, load `photo-viewer.js`, and write the `<dialog>` from
[`examples/plain.html`](examples/plain.html). Several viewers can share a page, each with its own
`data-links`.

Each photo's alt text comes from the link's `data-alt` or its `<img>`; its caption from the link's
`data-caption` or the `<figcaption>` of the `<figure>` around it. Theme it with the `--pv-*` custom
properties on `.pv` (background, text, buttons, corner radius).

## Justified rows

The Google Photos layout in CSS only: every photo in a row shares one height, landscape photos get
the width they need, and rows fill the width. Give each item its aspect ratio as `--r`:

```html
<div class="justified-rows">
  <figure style="--r:1.7778"><a href="full.webp"><img src="thumb.webp" width="800" height="450" alt="…"></a></figure>
</div>
```

Import `@steadfastcode/site-kit/justified-rows.css`. Tune `--row` (row height) and `--gap`.

## Installing

```sh
yarn add @steadfastcode/site-kit@github:SteadfastCode/site-kit#v0.1.0
```

Pin a tag; `main` moves.

## Tests

`yarn test` drives `examples/plain.html` in Chromium with a mouse, the keyboard and real touch
events. It needs Playwright and its Chromium; the script looks for a global install. Open
`examples/plain.html` through any static server to try it by hand.

## License

MIT
