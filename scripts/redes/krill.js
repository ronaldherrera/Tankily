// Krill, la mascota de Tankily: un krill acuarista que sabe mucho y sufre como cualquiera. Dibujado en canvas
// (vectorial, sin imágenes) para poder animarlo: boca al hablar, parpadeo, patitas y antenas.
// krill(g, x, y, tam, { expresion, boca, t, mirar }) — x, y: centro; tam: ancho aproximado en px;
// expresion: 'normal' | 'sorpresa' | 'harto' | 'feliz' | 'pensando'; boca: 0–1 (apertura al hablar); t: segundos.
(function () {
  const COL = { cuerpo: '#ff8f7e', cuerpo2: '#ff6f6a', borde: '#b8435a', vientre: '#ffd0c4', ojo: '#14202e', brillo: '#ffffff', agua: '#9fe7f5', ola: '#5aa8ff' };
  const OLA = new Path2D('M14 26c5-4.2 10-4.2 15 0s10 4.2 15 0');

  function segmento(g, x, y, rx, ry, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    const gr = g.createLinearGradient(0, -ry, 0, ry);
    gr.addColorStop(0, COL.cuerpo); gr.addColorStop(0.75, COL.cuerpo2); gr.addColorStop(1, COL.vientre);
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.lineWidth = 4; g.strokeStyle = COL.borde; g.stroke();
    g.restore();
  }

  function ojo(g, x, y, r, exp, parpado, mirar) {
    g.save(); g.translate(x, y);
    // Pedúnculo
    g.strokeStyle = COL.borde; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(r * 0.3, r * 1.4); g.lineTo(0, r * 0.4); g.stroke();
    if (exp === 'feliz') {
      // Ojos cerrados de felicidad: arco ^ sobre el globo del ojo
      g.fillStyle = '#fff6f2'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
      g.lineWidth = 4; g.strokeStyle = COL.borde; g.stroke();
      g.lineWidth = 7; g.strokeStyle = COL.ojo;
      g.beginPath(); g.arc(0, r * 0.45, r * 0.6, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      g.restore(); return;
    }
    const rr = exp === 'sorpresa' ? r * 1.18 : r;
    g.fillStyle = '#fff6f2'; g.beginPath(); g.arc(0, 0, rr, 0, Math.PI * 2); g.fill();
    g.lineWidth = 4; g.strokeStyle = COL.borde; g.stroke();
    // Pupila grande (estilo dibujo) con brillo
    const px = (mirar || 0) * rr * 0.25;
    g.fillStyle = COL.ojo; g.beginPath(); g.arc(px - rr * 0.08, rr * 0.05, rr * 0.66, 0, Math.PI * 2); g.fill();
    g.fillStyle = COL.brillo; g.beginPath(); g.arc(px - rr * 0.3, -rr * 0.22, rr * 0.22, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(px + rr * 0.15, rr * 0.25, rr * 0.09, 0, Math.PI * 2); g.fill();
    // Párpado: parpadeo y cara de «harto»
    const cierre = Math.max(parpado, exp === 'harto' ? 0.55 : exp === 'pensando' ? 0.25 : 0);
    if (cierre > 0) {
      g.save(); g.beginPath(); g.arc(0, 0, rr + 2, 0, Math.PI * 2); g.clip();
      g.fillStyle = COL.cuerpo; g.fillRect(-rr - 4, -rr - 4, rr * 2 + 8, (rr * 2 + 8) * cierre);
      g.strokeStyle = COL.borde; g.lineWidth = 4; g.beginPath(); g.moveTo(-rr - 4, -rr - 4 + (rr * 2 + 8) * cierre); g.lineTo(rr + 4, -rr - 4 + (rr * 2 + 8) * cierre); g.stroke();
      g.restore();
    }
    g.restore();
  }

  window.krill = function (g, x, y, tam, o = {}) {
    const exp = o.expresion || 'normal', t = o.t || 0, boca = Math.max(0, Math.min(1, o.boca || 0));
    const s = tam / 420;
    g.save(); g.translate(x, y); g.scale(s, s);
    // Flotar suave
    g.translate(0, Math.sin(t * 2.2) * 6); g.rotate(Math.sin(t * 1.3) * 0.03);

    // Antenas (detrás), con un poco de vaivén
    const va = Math.sin(t * 2.6) * 10;
    g.lineCap = 'round'; g.strokeStyle = COL.borde; g.lineWidth = 5;
    g.beginPath(); g.moveTo(-150, -20); g.quadraticCurveTo(-230, -150 + va, -90, -215 + va); g.stroke();
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(-140, -10); g.quadraticCurveTo(-260, -110 - va, -170, -200 - va * 0.6); g.stroke();

    // Cola en abanico
    g.save(); g.translate(168, 66); g.rotate(0.9 + Math.sin(t * 3) * 0.08);
    for (const a of [-0.55, 0, 0.55]) {
      g.save(); g.rotate(a); g.fillStyle = COL.cuerpo2; g.beginPath(); g.ellipse(32, 0, 34, 13, 0, 0, Math.PI * 2); g.fill();
      g.lineWidth = 4; g.strokeStyle = COL.borde; g.stroke(); g.restore();
    }
    g.restore();

    // Patitas (nadadoras) que se mueven
    g.strokeStyle = COL.borde; g.lineWidth = 5;
    for (let i = 0; i < 5; i++) {
      const lx = -70 + i * 38, ly = 40 + i * i * 2.2, fase = Math.sin(t * 9 + i * 0.9) * 10;
      g.beginPath(); g.moveTo(lx, ly); g.quadraticCurveTo(lx - 6 + fase * 0.4, ly + 22, lx - 12 + fase, ly + 42); g.stroke();
    }

    // Cuerpo: segmentos de la cola hacia la cabeza
    // Curvado hacia abajo, como un krill de verdad
    const segs = [[146, 40, 38, 32, 0.6], [112, 22, 44, 38, 0.4], [72, 8, 50, 44, 0.2], [26, 0, 57, 51, 0.06], [-30, -4, 66, 58, -0.04]];
    for (const [sx, sy, rx, ry, rot] of segs) segmento(g, sx, sy, rx, ry, rot);
    // Caparazón / cabeza
    segmento(g, -105, -6, 92, 70, -0.08);
    // La ola de la marca en el lomo
    g.save(); g.translate(-4, -64); g.scale(2.3, 2.3); g.translate(-29, -26);
    const og = g.createLinearGradient(14, 0, 44, 0); og.addColorStop(0, COL.agua); og.addColorStop(1, COL.ola);
    g.lineCap = 'round'; g.lineWidth = 6; g.strokeStyle = og; g.stroke(OLA); g.restore();

    // Ojos (el de atrás un poco más pequeño)
    const parpadeo = (o.parpadeo ?? ((t % 4.2) > 4.05 ? 1 : 0));
    ojo(g, -118, -82, 25, exp, parpadeo, o.mirar);
    ojo(g, -165, -74, 30, exp, parpadeo, o.mirar);

    // Mejilla
    g.fillStyle = 'rgba(255,120,140,0.45)'; g.beginPath(); g.ellipse(-150, -12, 16, 9, 0, 0, Math.PI * 2); g.fill();

    // Boca
    g.save(); g.translate(-178, 8);
    g.strokeStyle = COL.ojo; g.fillStyle = '#5a1f2c'; g.lineWidth = 5; g.lineCap = 'round';
    if (boca > 0.05 || exp === 'sorpresa') {
      const ab = exp === 'sorpresa' ? Math.max(boca, 0.7) : boca;
      g.beginPath(); g.ellipse(0, 4, 13 + ab * 3, 4 + ab * 14, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    } else if (exp === 'harto') {
      g.beginPath(); g.moveTo(-14, 6); g.lineTo(12, 4); g.stroke();
    } else if (exp === 'pensando') {
      g.beginPath(); g.moveTo(-12, 8); g.quadraticCurveTo(0, 2, 12, 6); g.stroke();
    } else {
      const ancho = exp === 'feliz' ? 18 : 13;
      g.beginPath(); g.arc(0, -2, ancho, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    }
    g.restore();
    g.restore();
  };
})();
