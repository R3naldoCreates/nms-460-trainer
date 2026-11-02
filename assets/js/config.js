/* ============================================================
   config.js — single place to rename things
   ============================================================ */
window.NMS = window.NMS || {};

NMS.config = {
  brand: {
    name:            'ALGIAMED',       // top-left wordmark
    model:           'NMS 460',        // model badge next to the brand
    product:         'STIMPOD',        // wordmark printed on the device body
    deviceFooter:    'ALGIAMED',       // printed under the power button
    deviceFooterSub: 'TECHNOLOGIES',
    modalEyebrow:    'ALGIAMED NMS 460',
    legal:           'Algiamed Technologies'
  },

  device: {
    model: 'NMS460',
    firmware: 'V4.02',
    // set enabled:true and drop your artwork at this path to replace the
    // built-in SVG body. Control hit-areas stay where they are — see
    // assets/README.md for how to line them up.
    art: {
      enabled: false,
      src: 'assets/img/device-front.png'
    }
  },

  session: {
    defaultCountdown: 600,   // seconds (10:00)
    defaultCurrent: 0,
    // The unit boots at the *unsafe* settings on purpose: the first lesson is
    // to bring it down to 0.1 ms and 2 Hz before touching the patient.
    defaultPulseWidth: 0.2,
    defaultFrequency: 10,
    autoShutdown: 600,       // 10 min of no interaction
    currentMax: 30,
    pulseWidths: [0.1, 0.2],
    frequencies: [1, 2, 5, 10]
  }
};
