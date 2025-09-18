// script.js

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     TEMA OSCURO + TOPBAR FIJA
     ========================= */

  // Marca el botón original del header (si existe)
  const originalToggle = document.getElementById("toggle-dark");
  if (originalToggle) originalToggle.setAttribute("data-theme-toggle", "");

  // Crear topbar fija (sin tocar el HTML)
  const titleText =
    document.querySelector("header h1")?.textContent?.trim() ||
    document.title ||
    "Título";

  const topbar = document.createElement("div");
  topbar.className = "topbar";
  topbar.innerHTML = `
    <div class="topbar-inner">
      <span class="topbar-title" role="heading" aria-level="1">${titleText}</span>
      <button type="button" class="theme-toggle" data-theme-toggle aria-pressed="false">🌙 Modo oscuro</button>
    </div>
  `;
  document.body.appendChild(topbar);

  // Colección de todos los toggles de tema (header + topbar)
  const toggles = Array.from(document.querySelectorAll('[data-theme-toggle]'));

  const setToggleUI = (isDark) => {
    toggles.forEach(btn => {
      btn.textContent = isDark ? "☀️ Modo claro" : "🌙 Modo oscuro";
      btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    });
  };

  const applyTheme = (isDark) => {
    document.body.classList.toggle("dark-mode", isDark);
    setToggleUI(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    // Re-tematiza Mermaid si fue expuesto desde el <head>
    if (window.applyMermaidTheme) window.applyMermaidTheme(isDark);
  };

  // Estado inicial desde localStorage
  applyTheme(localStorage.getItem("theme") === "dark");

  // Transición suave solo durante el cambio
  const startThemeTransition = () => {
    document.documentElement.classList.add("is-theming");
    setTimeout(() => {
      document.documentElement.classList.remove("is-theming");
    }, 300);
  };

  // Click en cualquier toggle -> alternar tema
  const onToggle = () => {
    const targetDark = !document.body.classList.contains("dark-mode");
    startThemeTransition();
    applyTheme(targetDark);
  };
  toggles.forEach(btn => btn.addEventListener("click", onToggle));

  // Topbar: mostrar/ocultar según scroll
  let ticking = false;
  const updateTopbar = () => {
    const headerH = (document.querySelector("header")?.offsetHeight || 140) - 16;
    const visible = window.scrollY > headerH;

    topbar.classList.toggle("is-visible", visible);
    // Marca en <html> que la topbar está visible (CSS ajusta sidebar y anclas)
    document.documentElement.classList.toggle("has-topbar", visible);

    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateTopbar);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener("resize", updateTopbar, { passive: true });
  updateTopbar(); // estado inicial


  /* ==========================================
     TOC AUTOMÁTICO (h2/h3) → ANTES del scrollspy
     ========================================== */
  const buildTOC = () => {
    const main = document.querySelector('#content');
    const tocList = document.querySelector('.toc ul');
    if (!main || !tocList) return;

    const headings = main.querySelectorAll('h2, h3');
    tocList.innerHTML = '';

    let currentSublist = null;

    headings.forEach(el => {
      // asigna id si no lo tiene (con normalización de tildes)
      if (!el.id) {
        const slug = el.textContent
          .toLowerCase()
          .trim()
          .normalize('NFD')                 // separa acentos
          .replace(/[\u0300-\u036f]/g, '')  // elimina acentos
          .replace(/\s+/g, '-')             // espacios -> guiones
          .replace(/[^\w\-]+/g, '');        // quita caracteres no válidos
        el.id = slug || 'sec-' + Math.random().toString(36).slice(2, 8);
      }

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + el.id;
      a.textContent = el.textContent;
      li.appendChild(a);

      if (el.tagName.toLowerCase() === 'h2') {
        tocList.appendChild(li);
        currentSublist = document.createElement('ul');
        li.appendChild(currentSublist);
      } else if (el.tagName.toLowerCase() === 'h3') {
        (currentSublist ?? tocList).appendChild(li);
      }
    });
  };
  buildTOC();


  /* ============================
     SCROLLSPY (con aria-current)
     ============================ */
  const initScrollspy = () => {
    const links = Array.from(document.querySelectorAll('.toc a'));
    if (!links.length) return;

    const sections = links
      .map(a => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);

    const onIntersect = (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        const link = document.querySelector(`.toc a[href="${id}"]`);
        if (!link) return;

        links.forEach(l => {
          l.classList.remove('is-active');
          l.removeAttribute('aria-current');
        });
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'true');

        // Actualiza la URL sin saltar
        history.replaceState(null, '', id);
      });
    };

    const observer = new IntersectionObserver(onIntersect, {
      rootMargin: '0px 0px -60% 0px',
      threshold: 0.1
    });

    sections.forEach(s => observer.observe(s));
  };
  initScrollspy();


  /* ===================================
     SIDEBAR: colapsar/expandir en móvil
     =================================== */
  const initSidebarCollapse = () => {
    const sidebar = document.querySelector('.sidebar');
    const toggle = sidebar?.querySelector('.sidebar-toggle');
    if (!sidebar || !toggle) return;

    const setCollapsed = (collapsed) => {
      sidebar.classList.toggle('is-collapsed', collapsed);
      toggle.setAttribute('aria-expanded', String(!collapsed));
    };

    const mq = window.matchMedia('(max-width: 960px)');
    const init = () => setCollapsed(mq.matches);
    init();
    mq.addEventListener('change', init);

    toggle.addEventListener('click', () => {
      const collapsed = !toggle.matches('[aria-expanded="true"]');
      setCollapsed(collapsed);
    });
  };
  initSidebarCollapse();
});