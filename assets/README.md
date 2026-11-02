# Artwork, icons and drop-in device images

Everything visual is editable. The device body and every LCD/wheel icon are separate files, and a raster photograph can replace the body without changing the interaction code.

## How the device is layered

Back to front:

1. device body artwork — `assets/svg/device-body.svg` or a raster image;
2. the LCD screen — HTML overlay, scaled with CSS container queries;
3. the live cable, LED and cable socket;
4. the ALGIAMED footer wordmark;
5. the rotating wheel tick ring and the play/pause hit layer.

`index.html` loads `assets/svg/device-body.svg` into an SVG `<image id="deviceBodyArt">`. When it loads, `.device.has-art` hides the inline fallback shell (`.device-static`) but **keeps** the live screen, cable, LED, wheel ring and branding on top.

## Files you can edit

| File | What it controls |
| --- | --- |
| `assets/svg/device-body.svg` | Body shell, bezel, printed STIMPOD wordmark, MENU/ENTER labels, button and wheel bases, printed model number |
| `assets/svg/wave-hybrid.svg` | Hybrid RF waveform icon on the LCD |
| `assets/svg/wave-square.svg` | Square-wave icon on the LCD |
| `assets/svg/speaker-on.svg` / `speaker-off.svg` | Speaker icons |
| `assets/svg/warn.svg` | Warning triangle used in LCD messages |
| `assets/svg/play.svg` / `pause.svg` | Centre-of-wheel icons |
| `assets/css/device.css` | Overlay placement, LCD scale, wheel ring, hit areas |
| `assets/js/config.js` | Branding, defaults and the raster body switch |

## Edit the body SVG

Open `assets/svg/device-body.svg` in any vector editor (Illustrator, Inkscape, Affinity, Figma, or a text editor). The viewBox is **400 × 600**, and the simulator's overlays are positioned as percentages of that box. Keep it at 400 × 600, or update the CSS percentages below if you deliberately change the proportions.

Leave these regions recognisable/free if you redraw the shell:

- the LCD recess (the live screen draws over it);
- the top edge where the cable socket straddles (y ≈ 53);
- the MENU and ENTER buttons, and the gap between them for the LED;
- the wheel centre;
- the power button;
- the space under the power button for the live ALGIAMED footer (y ≈ 534, on the dark inlay — the footer is drawn in a lighter grey when the artwork is loaded).

XML comments cannot contain a double hyphen (`--`); use single dashes in your notes. The file is validated as XML so an invalid comment stops the whole SVG loading.

## Use a photograph or raster render instead

1. Put a 2:3 portrait image in `assets/img/` — PNG or WebP, ideally 800 × 1200 px or larger. Straight-on, no perspective, with the LCD area empty, dark or transparent.
2. In `assets/js/config.js` set:
   ```js
   device: {
     art: {
       enabled: true,
       src: 'assets/img/device-front.png'
     }
   }
   ```
3. Reload. The raster is drawn at the same 400 × 600 position; the live LCD, cable, LED, wheel ring and footer stay on top. The wheel and buttons keep working in the same places.

If the image is missing the simulator falls back to `assets/svg/device-body.svg`, then to the inline fallback, and shows a warning. Recommended file size is under ~500 KB (WebP quality 85 is usually enough).

## Overlay coordinates

The device stage is a 400 × 600 viewBox. Interactive overlays are positioned by percentage, so your artwork must align with these boxes. The figures below are measured from the **current** `device-body.svg`:

| Element | Centre / box (400 × 600) | CSS |
| --- | --- | --- |
| LCD screen | x 73.2, y 91.0, 253.6 × 129.6 | `left:18.3%; top:15.1667%; width:63.4%; height:21.6%` |
| Menu button | 128, 297 · Ø 47.2 | `left:32%; top:49.5%` |
| Enter / Hz button | 272, 297 · Ø 47.2 | `left:68%; top:49.5%` |
| Wheel | 200, 371.6 · outer Ø 120.2 | `left:50%; top:61.9333%; width:30%` |
| Play / pause | 200, 371.6 | centre of wheel, 46 % of wheel |
| Power button | 200, 485.3 · Ø 50.9 | `left:50%; top:80.8833%` |
| Cable socket | 200, 52 (straddles the top edge at y 53) | inline SVG in `index.html` |
| LED | 200, 288 (between MENU and ENTER) | inline SVG `rect` in `index.html` |
| Wheel tick ring | 200, 371.6, radius 45 | inline SVG `#wheelRing`, origin in `wheel.js` |
| ALGIAMED footer | 200, 534 | inline SVG `text` in `index.html` |

If you move elements in the body artwork, adjust the matching CSS percentages in `assets/css/device.css` (and the inline coordinates listed above). The LCD itself uses CSS container queries (`cqw`), so its text scales with the screen box. **Keep the screen close to its current 253.6 × 129.6 (1.96:1)** — the LCD type is sized in `cqw`, so a very different aspect squashes the readout. If you change the screen size again, scale every `cqw` value inside the LCD section by `(newHeight / newWidth) / (129.6 / 253.6)`.

## Icons

The LCD icons are loaded with `<img src="assets/svg/...">` from `device.js`. They use the LCD ink colour `#0d1a19` directly, because an external SVG loaded as an image cannot inherit `currentColor`. If you change the LCD colour theme, update the `fill` / `stroke` values in those files as well. The play/pause icons use `#f6e9f1`.

The battery icon is generated in `device.js` (`batteryIcon()`) because its bars change with charge.

## After editing

- CSS/JS changes: bump `?v=` on the matching `<link>` / `<script>` in `index.html` so browsers and Bootstrap Studio previews do not keep an old copy.
- SVG/image changes usually need only a normal reload, but a hard refresh clears aggressive caches.
- Test at 360 px, 768 px, 1024 px and 1440 px wide after swapping artwork.

The packaging script copies this file into both `dist` packages automatically.
