# NMS 460 Trainer

A browser-based, fully interactive training simulator for the **Algiamed NMS 460** peripheral nerve stimulator. It reproduces the device's screen, setup menus, adjustment wheel, stimulation workflow and a simulated patient response so clinicians can rehearse before touching a real unit.

> **Not a medical device.** This is an educational model. No electrical output is generated and nothing here is for diagnosis or treatment. Always follow the current Instructions for Use and your local protocols with real equipment.

## Run it

No build step, no dependencies, no CDN.

- **Quickest:** double-click `index.html`.
- **Local server (recommended):** double-click `serve.cmd`, or run one of:
  ```bash
  python -m http.server 8080
  npx serve .
  ```
  then open <http://localhost:8080>.

The site works from `file://` as well — all assets are local.

## What you can practise

- **Power and boot** — hold the power button, watch the boot sequence and firmware screen.
- **Setup menu** — language, stimulation mode, pulse width, frequency, countdown, speaker volume, backlight and two-line user information, including the YES / NO confirmation screens.
- **Treatment workflow** — insert the cable, place the reference electrode, apply gel, place the probe, set 0.1 ms / 2 Hz, start and pause.
- **Wheel and buttons** — drag around the wheel (20° per 1 mA), tap the upper/right half to increase, lower/left to decrease; short-press Menu to toggle pulse width, hold Menu for the setup menu; short-press Enter to cycle frequency; hold play for 2 s to reset the timer.
- **Patient response** — a simulated comfort meter with a randomised ceiling (15.0–30.0 in 0.1 steps at 0.1 ms), fasciculation onset, skin impedance, accommodation and delivered-current mismatch.
- **Guided tutorial** — 15 state-checked steps with progress saved in `localStorage`. Switch to the **Session** tab to ignore the tutorial and play freely.
- **Reference** — device layout, screen map, menu tree, treatment workflow, nerve landmarks and motor responses, warnings, troubleshooting, safety and specifications.

## Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Power on/off | Hold power ~0.7 s | `P` not bound; use the button |
| Setup menu | Hold Menu ~0.7 s | — |
| Pulse width | Short-press Menu | `M` |
| Frequency | Short-press Enter / Hz | `F` |
| Start / pause | Centre of wheel | `Space` |
| Reset countdown | Hold play > 2 s | — |
| Adjust current | Drag / tap the wheel | `↑` `↓` `←` `→` |
| Back / close menu | — | `Esc` |

On a phone the layout switches to three panels — **Device**, **Patient**, **Coach** — using the bottom bar.

## Project layout

```
index.html
manifest.webmanifest
serve.cmd
package.ps1                    builds the two dist packages
packaging/                     package-specific READMEs
assets/
  css/
    base.css                   tokens, shell, cards, buttons, modal, toasts
    device.css                 LCD, device overlays, menus, wheel, hit areas
    panels.css                 patient, procedure, comfort gauge, tabs, guide
    responsive.css             desktop / tablet / phone breakpoints
  img/
    icon.svg                   app icon / manifest icon
  svg/
    device-body.svg            editable 400 × 600 device body
    wave-hybrid.svg            LCD hybrid waveform icon
    wave-square.svg            LCD square-wave icon
    speaker-on.svg             LCD speaker icons
    speaker-off.svg
    warn.svg                   LCD warning triangle
    play.svg                   wheel centre icons
    pause.svg
  js/
    config.js                  branding + session defaults + raster artwork switch
    core.js                    helpers, event bus, storage, toasts
    audio.js                   WebAudio UI / stimulus sounds
    patient.js                 comfort, fasciculation, impedance models
    device.js                  device state machine, LCD and menus
    wheel.js                   rotary drag + tap interaction
    tutorial.js                guided step engine
    guide.js                   reference content
    app.js                     wiring, meters, tabs, mobile nav, main loop
```

## Change the branding

Everything user-visible is in `assets/js/config.js`:

```js
NMS.config.brand = {
  name: 'ALGIAMED',
  model: 'NMS 460',
  product: 'STIMPOD',
  deviceFooter: 'ALGIAMED',
  deviceFooterSub: 'TECHNOLOGIES',
  modalEyebrow: 'ALGIAMED NMS 460'
};
```

Elements marked `data-brand="..."` in `index.html` update automatically.

## Edit or replace the device artwork

The default body is an editable SVG at `assets/svg/device-body.svg`, drawn at a **400 × 600** viewBox. The live LCD, cable, LED, wheel tick ring and ALGIAMED footer are overlaid on top by the simulator. Open the SVG in a vector editor and change the shell, colours, buttons, printed labels or wordmark directly.

To use a photograph or high-fidelity render instead:

1. Put a **2:3 portrait** image in `assets/img/` — PNG or WebP, ideally 800 × 1200 px or larger.
2. Leave the LCD area empty, dark or transparent so the live screen reads clearly.
3. In `assets/js/config.js` set:
   ```js
   device: {
     art: { enabled: true, src: 'assets/img/device-front.png' }
   }
   ```
4. Reload. The raster sits under the live overlays; the wheel and buttons keep working.

If the file is missing, the simulator falls back to `assets/svg/device-body.svg`, then to the inline fallback, and shows a warning. The LCD icons are separate editable SVGs in `assets/svg/` too — see `assets/README.md`.

The interactive hit areas and wheel do **not** move — they stay at the coordinates below. If your artwork has different proportions, either crop it to the same 400 × 600 frame or adjust the percentages in `assets/css/device.css`:

| Control | Centre (viewBox) | CSS position |
| --- | --- | --- |
| LCD | 96, 62 → 208 × 144 | `left:24% top:10.3333% width:52% height:24%` |
| Menu | 124, 300 | `left:31% top:50%` |
| Enter | 276, 300 | `left:69% top:50%` |
| Wheel | 200, 356 | `left:50% top:59.3333%` |
| Power | 200, 464 | `left:50% top:77.3333%` |
| Cable socket | 200, 18 | `left:50% top:3%` |

See `assets/README.md` for the full artwork checklist, icon notes and overlay coordinates.

## Build the deployable packages

```powershell
powershell -ExecutionPolicy Bypass -File .\package.ps1
```

This produces:

```
dist/
  github-pages/                  upload these contents to your Pages repository
    .nojekyll
  bootstrap-studio/              import/preview this folder in Bootstrap Studio
  NMS460-GitHub-Pages.zip
  NMS460-Bootstrap-Studio.zip
```

Both folders are complete static sites with relative paths, artwork and the local `serve.cmd` helper. Upload the **contents** so `index.html` sits at the site root; the GitHub Pages copy includes `.nojekyll`. Each package has its own `README.md` with step-by-step deployment notes. Re-run the script after editing source files so the packages pick up the changes.

## Simulation notes

- **Comfort ceiling** is randomised 15.0–30.0 in 0.1 steps and represents the load tolerated at 0.1 ms. Load = current × (0.2 ms ? 2 : 1), so switching to 0.2 ms halves the current at which the ceiling is reached.
- **Comfort index** = 100 − 62 × stress for stress ≤ 1, then 38 − 76 × (stress − 1); it is clamped to 0–100 with a small random walk. The therapeutic band used by the tutorial is 40–59.
- **Fasciculation** begins at a randomised threshold of 3.0–8.0 load units and escalates through Mild → Moderate → Strong → Maximal.
- **Impedance** is 1.6–4.4 kΩ with gel; without gel it adds 11.2 kΩ, crossing the 13 kΩ warning threshold and reducing delivered current.
- **Accommodation** builds over about three minutes of continuous stimulation and slowly recovers when stopped. The 1× / 5× / 20× trainer speed accelerates the countdown and accommodation only.

## Browser support

Current Chrome, Edge, Safari and Firefox. Uses CSS container queries for the LCD, `dvh` units, pointer events and WebAudio. `prefers-reduced-motion` is respected.

## Credits

Built from the Algiamed NMS 460 Instructions for Use (XM400-31A04), Quick Start Guide, treatment playbook and training module artwork. Branding and naming are configurable. This project is not affiliated with or endorsed by Algiamed Technologies.
