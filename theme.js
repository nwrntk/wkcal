// ── Canvas palette source (shared by all chapters) ───────────────────────────
// Single source of truth for graph colors in dark vs light mode.
// Loaded in each chapter's <head>, so window.CanvasTheme is available before the
// chapter's inline palette script runs in <body>.
//
// Dark values are byte-identical to the original hardcoded constants, so dark
// mode is unchanged. Light values match the warm page theme (style.css body.light):
//   chrome  → cream / tan / brown
//   curves  → harmonized warm-earthy set, kept distinct so overlapping curves read
window.CanvasTheme = {
  dark: {
    BG:'#080c14', GRID:'#182030', AXIS:'#253850', MUTED:'#4a5a70',
    BLUE:'#4cc9f0', GREEN:'#00d4aa', YELLOW:'#ffd166', RED:'#e94560',
    PURPLE:'#b5179e', ORANGE:'#f97316',
    // secondary on-canvas panels (filled boxes drawn inside a canvas)
    SURFACE:'#0d1520', ON_SURFACE:'#e2e8f0'
  },
  light: {
    BG:'#F8EFE4', GRID:'#DCC3AA', AXIS:'#9C6B57', MUTED:'#9C6B57',
    BLUE:'#810B38',   // wine (primary)
    GREEN:'#2F6E4F',  // pine
    YELLOW:'#8A6D1F', // ochre
    RED:'#C24E2C',    // terracotta
    PURPLE:'#6B3FA0', // violet
    ORANGE:'#B5651D', // amber
    SURFACE:'#EAD9C6', ON_SURFACE:'#541A1A'
  },
  // Read the saved preference, not the DOM class: chapter palette scripts run
  // mid-<body>, before sidebar.js adds body.light at the end of <body>, so the
  // class isn't reliable yet on first paint. localStorage is the source of truth.
  isLight() {
    try { return localStorage.getItem('theme') === 'light'; }
    catch (e) { return document.body.classList.contains('light'); }
  },
  get() { return this.isLight() ? this.light : this.dark; }
};
