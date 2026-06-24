(function () {

  // ── Theme (light / dark) ──────────────────────────────
  // Apply the saved preference ASAP so chrome renders in the right theme.
  // Default = dark (no class). Persisted in localStorage under 'theme'.
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
  }
  window._toggleTheme = function () {
    const isLight = document.body.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    render();   // re-render footer so the toggle icon/label updates
    if (window._redrawCanvases) window._redrawCanvases();   // repaint graphs in new theme
  };

  // ── Auth guard (disabled) ─────────────────────────────
  // Chapter pages are publicly accessible — no authentication required.

  // ── Decode username / role from token ───────────────────────
  function getUsername() {
    try {
      const token = sessionStorage.getItem('access_token');
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.username || payload.sub || '—';
    } catch { return '—'; }
  }

  function isAdmin() {
    try {
      const token = sessionStorage.getItem('access_token');
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.role === 'ADMIN';
    } catch { return false; }
  }

  // True only when a non-expired access token is present
  function isAuthenticated() {
    try {
      const token = sessionStorage.getItem('access_token');
      if (!token) return false;
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp && payload.exp * 1000 < Date.now()) return false;
      return true;
    } catch { return false; }
  }

  // ── Logout ───────────────────────────────────────────
  window._sbLogout = async function () {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    sessionStorage.clear();
    window.location.replace('/login.html');
  };

  // ── Chapter data ─────────────────────────────────────
  const CHAPTERS = [
    {
      num: 1, roman: 'I', title: 'Functions', sub: 'and Their Graphs', file: 'ch1.html',
      sections: [
        { id: 'overview',    label: 'ภาพรวม' },
        { id: 'definition',  label: '1.1 นิยามฟังก์ชัน' },
        { id: 'graphs',      label: '1.2 กราฟของฟังก์ชัน' },
        { id: 'combining',   label: '1.2 Combining & Transformations' },
        { id: 'trig',        label: '1.3 Trigonometric Functions' },
        { id: 'types',       label: 'ประเภทของฟังก์ชัน' },
        { id: 'plotter',     label: 'เครื่องมือ Plotter' },
        { id: 'quiz',        label: 'แบบฝึกหัด' },
      ]
    },
    {
      num: 2, roman: 'II', title: 'Limits and Continuity', sub: 'Limit Laws · Squeeze Theorem · IVT', file: 'ch2.html',
      sections: [
        { id: 'overview',    label: 'ภาพรวม' },
        { id: 'rates',       label: '2.1 อัตราการเปลี่ยนแปลง' },
        { id: 'limit',       label: '2.2 Limit ของฟังก์ชัน' },
        { id: 'laws',        label: '2.3 กฎของ Limit' },
        { id: 'onesided',    label: '2.4 One-Sided Limits' },
        { id: 'continuity',  label: '2.5 ความต่อเนื่อง' },
        { id: 'infinity',    label: '2.6 Limits at Infinity' },
        { id: 'quiz',        label: 'แบบฝึกหัด' },
      ]
    },
    {
      num: 3, roman: 'III', title: 'Derivatives', sub: 'Rules · Chain Rule · Implicit Diff', file: 'ch3.html',
      sections: [
        { id: 'overview',   label: 'ภาพรวม' },
        { id: 'tangent',    label: '3.1 Tangent Lines' },
        { id: 'rules',      label: '3.2 กฎ Derivative' },
        { id: 'trig',       label: '3.3 Trig Derivatives' },
        { id: 'chain',      label: '3.4 Chain Rule' },
        { id: 'implicit',   label: '3.5 Implicit Diff' },
        { id: 'calculator', label: 'Derivative Calculator' },
        { id: 'quiz',       label: 'แบบฝึกหัด' },
      ]
    },
    {
      num: 4, roman: 'IV', title: 'Applications of Derivatives', sub: 'Max/Min · L\'Hôpital · Newton\'s Method', file: 'ch4.html',
      sections: [
        { id: 'overview',  label: 'ภาพรวม' },
        { id: 'extreme',   label: '4.1 Extreme Values' },
        { id: 'mvt',       label: '4.2 Mean Value Theorem' },
        { id: 'monotonic', label: '4.3 First Derivative Test' },
        { id: 'concavity', label: '4.4 Concavity & Sketching' },
        { id: 'lhopital',  label: "4.5 L'Hôpital's Rule" },
        { id: 'newton',    label: '4.6 Newton\'s Method' },
        { id: 'quiz',      label: 'แบบฝึกหัด' },
      ]
    },
    {
      num: 5, roman: 'V', title: 'Integrals', sub: 'Riemann Sum · FTC · Substitution', file: 'ch5.html',
      sections: [
        { id: 'overview',       label: 'ภาพรวม' },
        { id: 'antiderivative', label: '5.1 Antiderivatives' },
        { id: 'riemann',        label: '5.2 Riemann Sums' },
        { id: 'definite',       label: '5.3 Definite Integrals' },
        { id: 'ftc',            label: '5.4 Fundamental Theorem' },
        { id: 'substitution',   label: '5.5 U-Substitution' },
        { id: 'calculator',     label: 'Integral Calculator' },
        { id: 'quiz',           label: 'แบบฝึกหัด' },
      ]
    },
    {
      num: 6, roman: 'VI', title: 'Applications of Integrals', sub: 'Area · Volume · Arc Length', file: 'ch6.html',
      sections: [
        { id: 'overview',  label: 'ภาพรวม' },
        { id: 'area',      label: '6.1 Area Between Curves' },
        { id: 'disk',      label: '6.2 Disk & Washer Method' },
        { id: 'shell',     label: '6.3 Shell Method' },
        { id: 'arclength', label: '6.4 Arc Length' },
        { id: 'surface',   label: '6.5 Surface Area' },
        { id: 'quiz',      label: 'แบบฝึกหัด' },
      ]
    },
    {
      num: 7, roman: 'VII', title: 'Transcendental Functions', sub: 'ln · exp · Inverse Trig', file: 'ch7.html',
      sections: [
        { id: 'overview',    label: 'ภาพรวม' },
        { id: 'natural',     label: '7.1 ln & Exponential' },
        { id: 'expgrowth',   label: '7.2 Exponential Growth & Decay' },
        { id: 'inversetrig', label: '7.3 Inverse Trig Functions' },
        { id: 'integrals',   label: '7.4 Integration Formulas' },
        { id: 'hyperbolic',  label: '7.5 Hyperbolic Functions' },
        { id: 'quiz',        label: 'แบบฝึกหัด' },
      ]
    },
    {
      num: 8, roman: 'VIII', title: 'Techniques of Integration', sub: 'Parts · Partial Fractions · Improper', file: 'ch8.html',
      sections: [
        { id: 'overview',  label: 'ภาพรวม' },
        { id: 'parts',     label: '8.1 Integration by Parts' },
        { id: 'trig',      label: '8.2 Trig Integrals' },
        { id: 'trigsub',   label: '8.3 Trig Substitution' },
        { id: 'partial',   label: '8.4 Partial Fractions' },
        { id: 'improper',  label: '8.5 Improper Integrals' },
        { id: 'quiz',      label: 'แบบฝึกหัด' },
      ]
    },
    {
      num: 9, roman: 'IX', title: 'Infinite Sequences & Series', sub: 'Convergence · Power Series · Taylor', file: 'ch9.html',
      sections: [
        { id: 'overview',    label: 'ภาพรวม' },
        { id: 'sequences',   label: '9.1 Sequences' },
        { id: 'series',      label: '9.2 Infinite Series' },
        { id: 'tests',       label: '9.3 Convergence Tests' },
        { id: 'powerseries', label: '9.4 Power Series' },
        { id: 'taylor',      label: '9.5 Taylor & Maclaurin' },
        { id: 'quiz',        label: 'แบบฝึกหัด' },
      ]
    },
    { num: 10, roman: 'X',     title: 'Parametric & Polar',              sub: 'Parametric Curves · Polar Coords · Conics',   file: 'ch10.html' },
    { num: 11, roman: 'XI',    title: 'Vectors & Geometry of Space',     sub: 'Dot/Cross Product · Lines · Planes',          file: 'ch11.html' },
    { num: 12, roman: 'XII',   title: 'Vector-Valued Functions',         sub: 'Curves · Curvature · Motion in Space',        file: 'ch12.html' },
    { num: 13, roman: 'XIII',  title: 'Partial Derivatives',             sub: 'Gradient · Chain Rule · Lagrange',            file: 'ch13.html' },
    { num: 14, roman: 'XIV',   title: 'Multiple Integrals',              sub: 'Double · Triple · Change of Variables',       file: 'ch14.html' },
    { num: 15, roman: 'XV',    title: 'Integrals in Vector Fields',      sub: 'Green · Stokes · Divergence Theorem',         file: 'ch15.html' },
  ];

  // ── render ──────────────────────────────────────────
  function render() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const cur = window.CURRENT_CH || 1;
    const curSec = window.CURRENT_SEC || 'overview';

    let html = `
      <div class="sb-brand">
        <div class="book">Thomas Calculus · 14th Ed.</div>
        <div class="title"><span class="hl">Calculus</span> Woranidtha</div>
      </div>
      <nav class="sb-nav">`;

    CHAPTERS.forEach(ch => {
      const isActive = ch.num === cur;
      const hasContent = ch.num <= 9;
      html += `<div class="ch-item${isActive ? ' active' : ''}" onclick="window._navCh(${ch.num})">
        <div class="ch-num">${ch.roman}</div>
        <div class="ch-meta">
          <div class="ch-name">${ch.title}</div>
          <div class="ch-sub">${ch.sub}</div>
        </div>
        ${!hasContent ? `<div class="ch-lock"><svg width="11" height="13" viewBox="0 0 11 13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="5.5" width="8" height="7" rx="1.5"/><path d="M3.5 5.5 V3.5 Q3.5 1.5 5.5 1.5 Q7.5 1.5 7.5 3.5 V5.5"/></svg></div>` : ''}
      </div>`;

      if (isActive && ch.sections) {
        html += '<div class="sec-list">';
        ch.sections.forEach(s => {
          html += `<div class="sec-item${s.id === curSec ? ' active' : ''}" id="sbsec-${s.id}" onclick="window._navSec('${s.id}')">${s.label}</div>`;
        });
        html += '</div>';
      }
    });

    const light = document.body.classList.contains('light');
    html += `</nav>
      <div class="sb-footer">
        <button onclick="window._toggleTheme()" title="สลับโหมดสว่าง/มืด"
          style="display:flex;align-items:center;justify-content:center;gap:.45rem;width:100%;margin-bottom:.55rem;padding:.4rem .6rem;border-radius:6px;background:var(--accent);border:1px solid var(--border);color:var(--text);font-size:.72rem;font-weight:600;cursor:pointer;transition:background .15s">
          ${light
            ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> โหมดมืด`
            : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg> โหมดสว่าง`}
        </button>
        ${isAdmin() ? `<a href="/usermanagement.html" style="display:flex;align-items:center;gap:.45rem;padding:.38rem .6rem;margin-bottom:.5rem;border-radius:6px;background:#0f1e10;border:1px solid #00d4aa33;color:#00d4aa;font-size:.72rem;font-weight:600;text-decoration:none;transition:background .15s" onmouseover="this.style.background='#1a3020'" onmouseout="this.style.background='#0f1e10'">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          User Management
        </a>` : ''}
        ${isAuthenticated() ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:.4rem;margin-bottom:.45rem">
          <div style="display:flex;align-items:center;gap:.4rem;min-width:0">
            <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#4cc9f0,#00d4aa);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.62rem;font-weight:700;color:#000">${getUsername().charAt(0).toUpperCase()}</div>
            <span style="font-size:.73rem;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${getUsername()}</span>
          </div>
          <button onclick="window._sbLogout()"
            style="background:transparent;border:1px solid #e9456055;border-radius:5px;color:#e94560;font-size:.65rem;padding:.2rem .55rem;cursor:pointer;flex-shrink:0;transition:all .15s"
            onmouseover="this.style.background='#e94560';this.style.color='#fff'"
            onmouseout="this.style.background='transparent';this.style.color='#e94560'">
            Logout
          </button>
        </div>` : `<div style="margin-bottom:.45rem">
          <a href="/login.html"
            style="display:flex;align-items:center;justify-content:center;gap:.4rem;padding:.4rem .6rem;border-radius:5px;background:transparent;border:1px solid #4cc9f055;color:#4cc9f0;font-size:.7rem;font-weight:600;text-decoration:none;transition:all .15s"
            onmouseover="this.style.background='#4cc9f0';this.style.color='#000'"
            onmouseout="this.style.background='transparent';this.style.color='#4cc9f0'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
            Login
          </a>
        </div>`}
        <div style="font-size:.62rem;color:#253850">← → บท &nbsp;·&nbsp; S sidebar &nbsp;·&nbsp; F fullscreen</div>
      </div>`;

    sidebar.innerHTML = html;
  }

  // ── navigation helpers ───────────────────────────────
  window._navCh = function (num) {
    const cur = window.CURRENT_CH || 1;
    if (num === cur) {
      if (window.showSec) window.showSec('overview');
      return;
    }
    const ch = CHAPTERS.find(c => c.num === num);
    if (ch) window.location.href = ch.file;
  };

  window._navSec = function (id) {
    if (window.showSec) window.showSec(id);
  };

  window.setSidebarSec = function (id) {
    document.querySelectorAll('.sec-item').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('sbsec-' + id);
    if (el) el.classList.add('active');
  };

  // ── sidebar toggle ───────────────────────────────────
  window.toggleSidebar = function () {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.body.classList.toggle('sb-open');
  };

  // ── keyboard ────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 's' || e.key === 'S') window.toggleSidebar();
    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen();
    }
    if (e.key === 'ArrowLeft')  _arrowNav(-1);
    if (e.key === 'ArrowRight') _arrowNav(1);
  });

  function _arrowNav(dir) {
    const cur = window.CURRENT_CH || 1;
    const chSecs = cur === 1 ? window._ch1Sections : cur === 2 ? window._ch2Sections : cur === 4 ? window._ch4Sections : cur === 5 ? window._ch5Sections : cur === 6 ? window._ch6Sections : cur === 7 ? window._ch7Sections : cur === 8 ? window._ch8Sections : cur === 9 ? window._ch9Sections : null;
    if (chSecs) {
      const idx = chSecs.indexOf(window.CURRENT_SEC || 'overview');
      const next = idx + dir;
      if (next >= 0 && next < chSecs.length && window.showSec) {
        window.showSec(chSecs[next]);
        return;
      }
    }
    const next = cur + dir;
    if (next >= 1 && next <= CHAPTERS.length) {
      window.location.href = CHAPTERS[next - 1].file;
    }
  }

  // ── init ────────────────────────────────────────────
  render();

  // ── Copyright footer ─────────────────────────────────
  (function injectFooter() {
    const footer = document.createElement('footer');
    footer.style.cssText = 'text-align:center;padding:1.2rem;font-size:.75rem;color:#64748b;border-top:1px solid #1e2d45;margin-top:2rem;';
    footer.textContent = '© 2026 Dr.Woranidtha Krungseanmuang';
    const main = document.getElementById('main');
    (main || document.body).appendChild(footer);
  })();
})();
