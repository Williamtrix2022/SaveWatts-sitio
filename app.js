/* SaveWatts · sitio de presentación. Sin dependencias. */
(() => {
  'use strict';

  const APP_URL = 'https://savewatts.onrender.com';

  // 1. Despertar la app en segundo plano: el plan gratuito de Render se duerme tras 15 min sin uso.
  try {
    fetch(`${APP_URL}/api/ping`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
  } catch { /* sin red: no pasa nada */ }

  // 2. Semáforo interactivo. Mismas reglas que el servidor (rounding a 1 decimal antes de colorear).
  const BUDGET_DAILY_KWH = 9; // 300 kWh del mes pasado - 10 % = 270 kWh al mes / 30 días
  const YELLOW_PCT = 70;
  const RED_PCT = 100;

  /** Devuelve estado, porcentaje y ritmo diario para una potencia en vatios. */
  function evaluate(watts) {
    const daily = (watts / 1000) * 24;
    const pct = Math.round((daily / BUDGET_DAILY_KWH) * 1000) / 10;
    const state = pct > RED_PCT ? 'red' : pct >= YELLOW_PCT ? 'yellow' : 'green';
    return { daily, pct, state };
  }

  const TEXTS = {
    green: ['Vas bien', 'Estás lejos de tu límite.'],
    yellow: ['Cuidado, te acercas a tu límite', 'Apaga lo que no estés usando.'],
    red: ['Pasaste tu límite', 'Desconecta primero lo que más gasta: plancha, calentador o aire.'],
  };

  const fmt = (n, d = 1) => n.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

  const slider = document.getElementById('watts');
  if (slider) {
    const out = document.getElementById('watts-out');
    const result = document.getElementById('lab-result');
    const title = document.getElementById('lab-title');
    const msg = document.getElementById('lab-msg');
    const daily = document.getElementById('lab-daily');
    const pctEl = document.getElementById('lab-pct');
    const dot = document.getElementById('lab-dot');
    let current = '';

    const render = () => {
      const watts = Number(slider.value);
      const r = evaluate(watts);
      out.textContent = `${watts} W`;
      daily.textContent = `${fmt(r.daily)} kWh`;
      pctEl.textContent = `${fmt(r.pct, 0)} %`;
      // La barra va de 0 a 130 %: 70 % + 30 % + 30 % (ver estilos del medidor).
      dot.style.left = `${Math.min(r.pct, 130) / 130 * 100}%`;
      slider.setAttribute('aria-valuetext', `${watts} vatios, ${fmt(r.pct, 0)} por ciento del presupuesto: ${TEXTS[r.state][0]}`);
      if (r.state !== current) {
        current = r.state;
        result.dataset.state = r.state;
        title.textContent = TEXTS[r.state][0];
        msg.textContent = TEXTS[r.state][1];
      }
    };

    slider.addEventListener('input', render);
    document.querySelectorAll('.presets [data-w]').forEach((b) => {
      b.addEventListener('click', () => {
        slider.value = b.dataset.w;
        render();
      });
    });
    render();
  }

  // 3. Navegación: punto activo y teclado para presentar.
  const slides = [...document.querySelectorAll('.slide')];
  const links = [...document.querySelectorAll('.dots a')];

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${e.target.id}`)));
      });
    }, { threshold: 0.55 });
    slides.forEach((s) => io.observe(s));
  }

  const currentIndex = () => {
    const mid = window.innerHeight / 2;
    const i = slides.findIndex((s) => { const b = s.getBoundingClientRect(); return b.top <= mid && b.bottom > mid; });
    return i < 0 ? 0 : i;
  };
  const go = (delta) => {
    const next = Math.min(slides.length - 1, Math.max(0, currentIndex() + delta));
    slides[next].scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return; // la barra usa las flechas
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); slides[0].scrollIntoView(); }
    else if (e.key === 'End') { e.preventDefault(); slides[slides.length - 1].scrollIntoView(); }
    else if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    }
  });
})();
