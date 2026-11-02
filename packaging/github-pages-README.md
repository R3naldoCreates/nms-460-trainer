# NMS 460 Trainer — GitHub Pages package

This folder is the complete static site. It has no build step, no framework and no CDN dependencies.

## Publish on GitHub Pages

1. Create a repository (for example `nms460-trainer`).
2. Upload the **contents of this folder** so that `index.html` sits at the repository root. Do not upload the parent folder as an extra level.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, then select your branch (usually `main`) and the `/ (root)` folder.
5. Wait for the Pages build, then open `https://<your-user>.github.io/<repo>/`.

All paths are relative, so the site also works from a project subpath such as `/nms460-trainer/`.

> `.nojekyll` is included to stop GitHub's Jekyll processor from touching the static files. It is not required by the simulator, but keep it if your upload method preserves dotfiles. If your drag-and-drop upload ignores it, add an empty `.nojekyll` file at the repository root manually.

## Test locally first

- Double-click `index.html`, or
- Double-click `serve.cmd` and open <http://localhost:8080/>.

The site works from `file://` as well, but a local server avoids browser restrictions on some features.

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

The body SVG is drawn on a **400 × 600** viewBox. The live LCD, cable, LED, wheel tick ring and ALGIAMED footer are overlaid by the simulator, so leave those areas free when you redraw it. To use a PNG/WebP photograph instead, set `device.art.enabled: true` and `device.art.src` in `assets/js/config.js`; keep a 2:3 aspect ratio and leave the LCD area transparent or dark.

After editing CSS or JS, bump the `?v=` number on the matching `<link>` / `<script>` tags in `index.html` so browsers fetch the new files.

See `assets/README.md` for the full artwork checklist and overlay coordinates.
