# NMS 460 Trainer — Bootstrap Studio package

This folder is a plain static site: `index.html`, `assets/` and a local test helper. It does **not** require Bootstrap, jQuery or a build step.

## Open it in Bootstrap Studio

Bootstrap Studio works with its own design files. Use whichever route matches your version:

1. **Import the site into a design** — create or open a design, then bring `index.html` and the `assets` folder into the design's Files panel. Keep the folder structure exactly as shipped (`assets/css`, `assets/js`, `assets/img`, `assets/svg`).
2. **Preview from the folder** — if your edition supports importing a static website, point the import at this folder. Keep relative paths intact.
3. **Quick visual check** — double-click `index.html`, or run `serve.cmd`, then open <http://localhost:8080/>. This is the same output Bootstrap Studio's preview pane will render.

Do not flatten `assets/`; the HTML references those paths directly. If Bootstrap Studio adds its own Bootstrap CSS, the simulator's own CSS still wins for its components because the stylesheets are scoped by class, but the BSS page background may differ. Prefer importing this design without adding a Bootstrap theme.

## Edit the artwork

| What | File |
| --- | --- |
| Device body, buttons, wheel, printed labels | `assets/svg/device-body.svg` |
| Hybrid waveform icon | `assets/svg/wave-hybrid.svg` |
| Square waveform icon | `assets/svg/wave-square.svg` |
| Speaker on / off | `assets/svg/speaker-on.svg`, `speaker-off.svg` |
| Warning triangle | `assets/svg/warn.svg` |
| Play / pause | `assets/svg/play.svg`, `pause.svg` |
| Branding and session defaults | `assets/js/config.js` |

The body SVG uses a **400 × 600** viewBox. The live LCD, cable, LED, wheel tick ring and ALGIAMED footer are overlaid by the simulator — leave those regions free if you redraw the body. To drop in a PNG/WebP photograph, set `device.art.enabled: true` and `device.art.src` in `assets/js/config.js`; use a 2:3 image with an empty/transparent LCD area.

After editing CSS or JS, bump the `?v=` number in `index.html` so the BSS preview reloads the changed files. See `assets/README.md` for overlay coordinates and the full checklist.

## Deploying the result

Bootstrap Studio's own export/publish produces a static folder. The contents of this package are already in that shape, so they can also be uploaded to any static host, including GitHub Pages, Netlify or an internal web server.
