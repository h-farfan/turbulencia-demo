// === Utilidades ===
function getCss(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim() }

// Colores desde CSS variables
const blue   = getCss('--blue');
const brown  = getCss('--brown');
const violet = getCss('--violet');
const orange = getCss('--orange');

// === Geometría de espirales ===
/**
 * Dibuja una espiral (Arquímedes) y la envuelve en un <g> .swirl
 * para poder rotarla suavemente con CSS. Usa la custom prop --d.
 */
function addSpiral(root, {cx, cy, turns=3, spacing=6, stroke="#000", width=4, duration=6, delay=0}) {
  const pts = [];
  const totalTheta = turns * Math.PI * 2;
  const step = 0.05;
  const a = 0;
  for (let t = 0; t <= totalTheta; t += step) {
    const r = a + spacing * t;
    const x = cx + r * Math.cos(t);
    const y = cy + r * Math.sin(t);
    pts.push([x, y]);
  }
  let d = "";
  pts.forEach((p, i) => d += (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2) + " ");
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "swirl");
  g.style.setProperty('--d', duration + 's');
  g.style.animationDelay = delay + "s";
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d.trim());
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", stroke);
  path.setAttribute("stroke-width", width);
  path.setAttribute("stroke-linecap","round");
  path.setAttribute("stroke-linejoin","round");
  g.appendChild(path);
  root.appendChild(g);
  return g;
}

// === Parámetros globales ===
const bigCenters = [ {cx:400, cy:225}, {cx:800, cy:225} ];

const base = {            // nivel 0 (remolinos grandes)
  spacing: 5.5,           // <— CAMBIA AQUÍ y afecta remolinos y flechas
  turns:   3,
  width:   12
};

const factors = {         // reducción por nivel
  spacing: 0.7,
  turns:   0.9,
  width:   0.7
};

const gaps = {            // distancias verticales entre niveles (centro a centro)
  bigToMid:   220,
  midToSmall: 170,
  smallToMic: 150
};

/* === Config de flechas === */
const arrow = {
  k: 0.75,          // grosor flecha = k * width del remolino del nivel
  startOffset: 8,   // separación desde el borde INFERIOR de la espiral superior
  endOffset:   8,   // separación desde el borde SUPERIOR de la espiral inferior
  lengthScale: { L0toL1: 1.00, L1toL2: 0.90, L2toL3: 0.80 },
  align:       { L0toL1: 0,    L1toL2: 0,    L2toL3: 0    },
  head:        { scale: 1, useStrokeUnits: true }
};
const MARKER_K = 3.5 * arrow.head.scale;

// === Helpers compartidos ===
const level = (n)=>({     // n: 0=grande, 1=medio, 2=pequeño, 3=micro
  spacing: base.spacing * Math.pow(factors.spacing, n),
  turns:   base.turns   * Math.pow(factors.turns,   n),
  width:   Math.max(1, base.width * Math.pow(factors.width, n))
});

function rMax(spacing, turns){
  return spacing * (turns * 2 * Math.PI);
}

function arrowSpan(yTopBound, yBottomBound, {startOffset, endOffset, lengthScale=1, align=0}){
  const top = yTopBound + startOffset;
  const bottom = yBottomBound - endOffset;
  const avail = Math.max(0, bottom - top);
  const len = Math.max(0, avail * lengthScale);
  const t = (align + 1) / 2; // -1..+1  ⇒  0..1
  const y1 = top + (avail - len) * t;
  const y2 = y1 + len;
  return {y1, y2};
}

function addArrow(root, {x, y1, y2, stroke="#000", width=6}) {
  const yTop = Math.min(y1, y2);
  const yBottom = Math.max(y1, y2);

  const inset = 0.52 * width * MARKER_K;  // <- clave (0.45–0.60 según gusto)
  const yBottomCut = yBottom - inset;

  const path = document.createElementNS("http://www.w3.org/2000/svg","path");
  path.setAttribute("d", `M ${x} ${yTop} L ${x} ${yBottomCut}`);
  path.setAttribute("fill","none");
  path.setAttribute("stroke", stroke);
  path.setAttribute("stroke-width", width);
  path.setAttribute("stroke-linecap","butt");
  path.setAttribute("marker-end","url(#arrowHead)");
  // nota: con fill="context-stroke" en el marker no hace falta path.style.color
  root.appendChild(path);
}

// Ajusta el marker (punta) según la config
(function tuneMarker(){
  const m = document.getElementById('arrowHead');
  if(!m) return;
  if (arrow.head.useStrokeUnits) m.setAttribute('markerUnits','strokeWidth');
  m.setAttribute('markerWidth',  MARKER_K);
  m.setAttribute('markerHeight', MARKER_K);
})();

// === Composición jerárquica (remolinos) ===
const gBig   = document.getElementById("layer-big");
const gMid   = document.getElementById("layer-mid");
const gSmall = document.getElementById("layer-small");
const gMicro = document.getElementById("layer-micro");

bigCenters.forEach(({cx, cy})=>{
  // Nivel 0: grandes
  const L0 = level(0);
  addSpiral(gBig, {cx, cy, turns:L0.turns, spacing:L0.spacing, stroke:blue,   width:L0.width, duration:9});

  // Nivel 1: medianos (2 por grande)
  const L1 = level(1);
  const midY = cy + gaps.bigToMid;
  [-80, +80].forEach(dx=>{
    const midCx = cx + dx;
    addSpiral(gMid, {cx:midCx, cy:midY, turns:L1.turns, spacing:L1.spacing, stroke:brown, width:L1.width, duration:6});

    // Nivel 2: pequeños (2 por mediano)
    const L2 = level(2);
    const smallY = midY + gaps.midToSmall;
    [-40, +40].forEach(dx2=>{
      const smallCx = midCx + dx2;
      addSpiral(gSmall, {cx:smallCx, cy:smallY, turns:L2.turns, spacing:L2.spacing, stroke:violet, width:L2.width, duration:5});

      // Nivel 3: micro (2 por pequeño)
      const L3 = level(3);
      const microY = smallY + gaps.smallToMic;
      [-20, +20].forEach(dx3=>{
        addSpiral(gMicro, {cx:smallCx+dx3, cy:microY, turns:L3.turns, spacing:L3.spacing, stroke:orange, width:L3.width, duration:4});
      });
    });
  });
});

// === Flechas dinámicas ===
const gArrows = document.getElementById("layer-arrows");

function drawArrows(){
  gArrows.innerHTML = ""; // limpia si se vuelve a dibujar

  bigCenters.forEach(({cx, cy})=>{
    const L0 = level(0), L1 = level(1), L2 = level(2), L3 = level(3);

    // Grande → Mediano
    {
      const yTopBound    = cy + rMax(L0.spacing, L0.turns);
      const yBottomBound = (cy + gaps.bigToMid) - rMax(L1.spacing, L1.turns);
      const span = arrowSpan(yTopBound, yBottomBound, {
        startOffset: arrow.startOffset,
        endOffset:   arrow.endOffset,
        lengthScale: arrow.lengthScale.L0toL1,
        align:       arrow.align.L0toL1
      });
      addArrow(gArrows, {
        x: cx, y1: span.y1, y2: span.y2,
        stroke: "#5b4b8a",
        width: L0.width * arrow.k
      });
    }

    // Medianos (2 por grande)
    const midY = cy + gaps.bigToMid;
    [-80, +80].forEach(dx=>{
      const midCx = cx + dx;

      // Mediano → Pequeño
      {
        const yTopBound    = midY + rMax(L1.spacing, L1.turns);
        const yBottomBound = (midY + gaps.midToSmall) - rMax(L2.spacing, L2.turns);
        const span = arrowSpan(yTopBound, yBottomBound, {
          startOffset: arrow.startOffset,
          endOffset:   arrow.endOffset,
          lengthScale: arrow.lengthScale.L1toL2,
          align:       arrow.align.L1toL2
        });
        addArrow(gArrows, {
          x: midCx, y1: span.y1, y2: span.y2,
          stroke: "#cf5682",
          width: L1.width * arrow.k
        });
      }

      // Pequeños (2 por mediano)
      const smallY = midY + gaps.midToSmall;
      [-40, +40].forEach(dx2=>{
        const smallCx = midCx + dx2;

        // Pequeño → Micro
        {
          const yTopBound    = smallY + rMax(L2.spacing, L2.turns);
          const yBottomBound = (smallY + gaps.smallToMic) - rMax(L3.spacing, L3.turns);
          const span = arrowSpan(yTopBound, yBottomBound, {
            startOffset: arrow.startOffset,
            endOffset:   arrow.endOffset,
            lengthScale: arrow.lengthScale.L2toL3,
            align:       arrow.align.L2toL3
          });
          addArrow(gArrows, {
            x: smallCx, y1: span.y1, y2: span.y2,
            stroke: "#a4752b",
            width: L2.width * arrow.k
          });
        }
      });
    });
  });
}

drawArrows(); // dibuja una vez

// === Controles ===
const toggleBtn = document.getElementById('toggleBtn');
const speed = document.getElementById('speed');
const speedVal = document.getElementById('speedVal');
const motionHint = document.getElementById('motionHint');

function setPlayState(running){
  document.documentElement.style.setProperty('--play', running ? 'running' : 'paused');
  toggleBtn.setAttribute('aria-pressed', String(!running));
  toggleBtn.textContent = running ? '⏯️ Pausa' : '▶️ Reanuda';
}

function setSpeed(mult){
  speedVal.textContent = mult.toFixed(2).replace(/\.00$/, '') + '×';
  document.querySelectorAll('.swirl').forEach(el=>{
    const base = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 6;
    el.style.setProperty('--d', (base / mult) + 's');
  });
}

toggleBtn.addEventListener('click', ()=>{
  const isPaused = getComputedStyle(document.documentElement).getPropertyValue('--play').trim() === 'paused';
  setPlayState(isPaused);
});

speed.addEventListener('input', (e)=> setSpeed(parseFloat(e.target.value)) );

// Mensaje si el usuario prefiere menos movimiento
const mq = matchMedia('(prefers-reduced-motion: reduce)');
function updateMotionHint(){
  motionHint.textContent = mq.matches ? 'Movimiento reducido activo por preferencia del sistema.' : '';
}
mq.addEventListener?.('change', updateMotionHint);
updateMotionHint();

// === Exportación ===
function serializeSvg(){
  const svg = document.getElementById('cascade');
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');

  // Inyecta estilos críticos dentro del propio SVG
  const style = document.createElementNS('http://www.w3.org/2000/svg','style');
  style.textContent = `
    .t-lg{ font:700 28px/1.2 ui-sans-serif,system-ui }
    .t-md{ font:700 18px/1.2 ui-sans-serif,system-ui }
    .t-sm{ font:600 15px/1.2 ui-sans-serif,system-ui }
    .green{ fill:${getCss('--green')} }
    .blue{ fill:${getCss('--blue')} }
    .red{ fill:${getCss('--red')} }
    .dashed{ stroke-dasharray:10 10 }
    rect.tag{ fill:rgba(128,128,128,0.4); stroke:#8ecaff; stroke-width:2; rx:10; ry:10 }
    .bigArrow{ stroke:${getCss('--arrow')}; stroke-width:7; fill:none; stroke-linecap:round; stroke-linejoin:round }
    .bigArrowLabel{ fill:${getCss('--arrow')}; font:700 16px/1 ui-sans-serif,system-ui }
    .cascadeArrow{ stroke:#5b4b8a }
    .subArrow{ stroke:#cf5682 }
    .fallArrow{ stroke:#a4752b }
    .swirl{ transform-box:fill-box; transform-origin:center; animation: spin var(--d,6s) linear infinite }
    @keyframes spin{ from{ transform: rotate(0deg) } to{ transform: rotate(360deg) } }
  `;
  clone.insertBefore(style, clone.firstChild);
  return new XMLSerializer().serializeToString(clone);
}

function download(name, mime, data){
  const blob = new Blob([data], {type: mime});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  requestAnimationFrame(()=>{ URL.revokeObjectURL(a.href); a.remove() });
}

document.getElementById('exportSvg').addEventListener('click', ()=>{
  download('cascada-energia.svg','image/svg+xml;charset=utf-8', serializeSvg());
});

document.getElementById('exportPng').addEventListener('click', async ()=>{
  const str = serializeSvg();
  const url = URL.createObjectURL(new Blob([str], {type:'image/svg+xml;charset=utf-8'}));
  const img = new Image();
  img.decoding = 'async';
  img.onload = ()=>{
    const canvas = document.createElement('canvas');
    canvas.width = 1600;  // ajustable
    canvas.height = 1200; // ajustable
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob=>{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cascada-energia.png';
      document.body.appendChild(a); a.click();
      requestAnimationFrame(()=>{ URL.revokeObjectURL(a.href); a.remove() });
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.onerror = ()=>{ alert('No se pudo renderizar el PNG en este navegador.'); URL.revokeObjectURL(url) };
  img.src = url;
});
