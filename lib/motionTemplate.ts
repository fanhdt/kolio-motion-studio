export interface MotionConfig {
  mainText: string;
  subText: string;
  colorText: string;
  colorAccent: string;
  fontSize: number;
  textPos: "top" | "center" | "bottom";
  logoImg: HTMLImageElement | null;
  logoPos: "topright" | "topleft" | "bottomright" | "bottomleft" | "center";
  logoSize: number;
}

export interface MotionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumb: (ctx: CanvasRenderingContext2D, t: number) => void;
  render: (ctx: CanvasRenderingContext2D, t: number, W: number, H: number, cfg: MotionConfig) => void;
}

// ─── Utilities ──────────────────────────────────────────────────────────────

export function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Lerp antara dua nilai */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Ease in-out cubic */
function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Clamp t ke 0..1 */
function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

/**
 * Gambar teks stroke (outline) — efek "teks sebagai garis".
 * progress 0→1 = stroke draw dari awal sampai selesai.
 */
function strokeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  progress: number, // 0–1
  lineWidth = 2,
) {
  if (!text || progress <= 0) return;
  ctx.save();
  ctx.font = `900 ${fontSize}px 'Poppins','Arial Black',sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  // Simulasi stroke progresif via clip rect
  const metrics = ctx.measureText(text);
  const totalW = metrics.width;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - totalW / 2, y - fontSize, totalW * progress, fontSize * 2.2);
  ctx.clip();
  ctx.strokeText(text, x, y);
  ctx.restore();
  ctx.restore();
}

/** Gambar teks fill normal dengan backdrop */
function fillTextWithBackdrop(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, color: string, alpha = 1) {
  if (!text) return;
  ctx.save();
  ctx.font = `900 ${fontSize}px 'Poppins','Arial Black',sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const mw = ctx.measureText(text).width;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - mw / 2 - 18, y - fontSize * 0.72, mw + 36, fontSize * 1.44, 8);
  else ctx.rect(x - mw / 2 - 18, y - fontSize * 0.72, mw + 36, fontSize * 1.44);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function getTextY(H: number, pos: string, sz: number) {
  if (pos === "top") return sz + 60;
  if (pos === "bottom") return H - 80;
  return H / 2;
}

function getLogoXY(W: number, H: number, pos: string, lw: number, lh: number): [number, number] {
  const pad = 28;
  if (pos === "topright") return [W - lw - pad, pad];
  if (pos === "topleft") return [pad, pad];
  if (pos === "bottomright") return [W - lw - pad, H - lh - pad];
  if (pos === "bottomleft") return [pad, H - lh - pad];
  return [(W - lw) / 2, (H - lh) / 2];
}

export function drawOverlay(ctx: CanvasRenderingContext2D, W: number, H: number, cfg: MotionConfig) {
  const sz = cfg.fontSize;
  const ty = getTextY(H, cfg.textPos, sz);

  if (cfg.mainText) fillTextWithBackdrop(ctx, cfg.mainText, W / 2, ty, sz, cfg.colorText);
  if (cfg.subText) {
    const subSz = Math.max(16, Math.round(sz * 0.44));
    const offset = cfg.textPos === "top" ? sz + 16 : cfg.textPos === "bottom" ? -(sz + 12) : sz + 16;
    ctx.save();
    ctx.font = `${subSz}px 'Poppins',sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = hexToRgba(cfg.colorText, 0.78);
    ctx.fillText(cfg.subText, W / 2, ty + offset);
    ctx.restore();
  }
  if (cfg.logoImg) {
    const lw = W * (cfg.logoSize / 100);
    const lh = (cfg.logoImg.height / cfg.logoImg.width) * lw;
    const [lx, ly] = getLogoXY(W, H, cfg.logoPos, lw, lh);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.drawImage(cfg.logoImg, lx, ly, lw, lh);
    ctx.restore();
  }
}

// ─── Template 1: Cinematic Pan ──────────────────────────────────────────────
// Kamera dolly + pan horizontal, teks reveal stroke garis dari kiri ke kanan.

const cinematicPan: MotionTemplate = {
  id: "cinematic-pan",
  name: "Cinematic Pan",
  description: "Kamera dolly & pan sinematik. Teks muncul sebagai stroke garis dari kiri.",
  category: "Cinematic",
  thumb(ctx, t) {
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, 160, 90);
    // Garis horizon bergerak
    const pan = Math.sin(t * 0.5) * 20;
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(180,160,255,${0.15 + i * 0.05})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pan + i * 40, 0);
      ctx.lineTo(pan + i * 40 + 60, 90);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.5;
    ctx.font = "bold 9px sans-serif";
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.strokeText("CINEMATIC", 6, 50);
  },
  render(ctx, t, W, H, cfg) {
    // ── Background sinematik ──
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, W, H);

    // Kamera: zoom breathe + pan kiri-kanan
    const camZoom = 1 + 0.04 * Math.sin(t * 0.4);
    const camPanX = Math.sin(t * 0.25) * W * 0.025;
    const camPanY = Math.cos(t * 0.18) * H * 0.012;

    ctx.save();
    ctx.translate(W / 2 + camPanX, H / 2 + camPanY);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-W / 2, -H / 2);

    // Garis diagonal background (depth lines)
    const lineCount = 18;
    for (let i = 0; i < lineCount; i++) {
      const progress = (i / lineCount + t * 0.06) % 1;
      const x = -W * 0.2 + progress * W * 1.4;
      const alpha = 0.04 + 0.06 * Math.sin(t * 1.2 + i);
      ctx.strokeStyle = hexToRgba(cfg.colorAccent, alpha);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H * 0.7, H);
      ctx.stroke();
    }

    // Horizontal rule sinematik
    const ruleY1 = H * 0.12;
    const ruleY2 = H * 0.88;
    ctx.strokeStyle = hexToRgba(cfg.colorAccent, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ruleY1);
    ctx.lineTo(W, ruleY1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, ruleY2);
    ctx.lineTo(W, ruleY2);
    ctx.stroke();

    // Letterbox hitam atas-bawah (efek sinema)
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H * 0.1);
    ctx.fillRect(0, H * 0.9, W, H * 0.1);

    ctx.restore();

    // Vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
    vg.addColorStop(0, "transparent");
    vg.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Teks: stroke reveal (siklus 4 detik: 0–1s reveal, 2–3s hold, 3–4s fade)
    const cycle = t % 5;
    const revealProgress = clamp01(cycle / 1.2);
    const holdAlpha = cycle < 3.5 ? 1 : clamp01(1 - (cycle - 3.5) / 0.8);
    const sz = cfg.fontSize;
    const ty = getTextY(H, cfg.textPos, sz);

    if (cfg.mainText && revealProgress > 0) {
      // Fase 1: stroke draw
      if (cycle < 1.5) {
        strokeText(ctx, cfg.mainText, W / 2, ty, sz, cfg.colorText, easeInOut(revealProgress), 2.5);
      } else {
        // Fase 2: fill muncul
        const fillAlpha = clamp01((cycle - 1.5) / 0.5) * holdAlpha;
        fillTextWithBackdrop(ctx, cfg.mainText, W / 2, ty, sz, cfg.colorText, fillAlpha);
      }
    }

    // Sub teks slide in dari bawah
    if (cfg.subText && cycle > 1.8) {
      const subProgress = clamp01((cycle - 1.8) / 0.6);
      const subSz = Math.max(16, Math.round(sz * 0.42));
      const offset = cfg.textPos === "top" ? sz + 16 : cfg.textPos === "bottom" ? -(sz + 12) : sz + 16;
      ctx.save();
      ctx.font = `${subSz}px 'Poppins',sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = easeInOut(subProgress) * holdAlpha;
      const slideY = ty + offset + (1 - easeInOut(subProgress)) * 20;
      ctx.fillStyle = hexToRgba(cfg.colorText, 0.75);
      ctx.fillText(cfg.subText, W / 2, slideY);
      ctx.restore();
    }

    if (cfg.logoImg) {
      const lw = W * (cfg.logoSize / 100);
      const lh = (cfg.logoImg.height / cfg.logoImg.width) * lw;
      const [lx, ly] = getLogoXY(W, H, cfg.logoPos, lw, lh);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      ctx.drawImage(cfg.logoImg, lx, ly, lw, lh);
      ctx.restore();
    }
  },
};

// ─── Template 2: Line Trace ──────────────────────────────────────────────────
// Teks outline ditrace stroke per stroke. Kamera zoom in perlahan.

const lineTrace: MotionTemplate = {
  id: "line-trace",
  name: "Line Trace",
  description: "Teks outline di-trace satu garis. Kamera zoom in perlahan seperti fokus lensa.",
  category: "Cinematic",
  thumb(ctx, t) {
    ctx.fillStyle = "#f5f5f0";
    ctx.fillRect(0, 0, 160, 90);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1.5;
    const p = (t * 0.25) % 1;
    ctx.beginPath();
    ctx.moveTo(10, 70);
    ctx.lineTo(10 + p * 140, 70);
    ctx.stroke();
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 1;
    ctx.strokeText("LINE TRACE", 8, 50);
  },
  render(ctx, t, W, H, cfg) {
    // Warna bg: terang / minimal
    ctx.fillStyle = "#f4f4ef";
    ctx.fillRect(0, 0, W, H);

    // Kamera zoom in perlahan (0.9x → 1.1x selama 8 detik, lalu kembali)
    const zoomT = (Math.sin(t * 0.4) + 1) / 2; // 0–1 osilasi
    const zoom = lerp(0.97, 1.07, zoomT);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);

    // Grid titik-titik tipis (paper texture effect)
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    const gridStep = 40;
    for (let gx = 0; gx < W; gx += gridStep) {
      for (let gy = 0; gy < H; gy += gridStep) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Garis horizontal tipis bergerak (speed lines)
    const lineSpeed = t * 18;
    for (let i = 0; i < 30; i++) {
      const y = (i * (H / 29) + lineSpeed) % H;
      const alpha = 0.03 + 0.04 * Math.abs(Math.sin(t * 0.8 + i));
      ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.restore();

    // Teks stroke trace — siklus 5 detik
    const cycle = t % 6;
    const traceP = clamp01(easeInOut(cycle / 2));
    const sz = cfg.fontSize;
    const ty = getTextY(H, cfg.textPos, sz);

    if (cfg.mainText) {
      // Shadow tipis di belakang
      ctx.save();
      ctx.font = `900 ${sz}px 'Poppins','Arial Black',sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillText(cfg.mainText, W / 2 + 3, ty + 3);
      ctx.restore();

      // Stroke utama — trace progresif
      strokeText(ctx, cfg.mainText, W / 2, ty, sz, cfg.colorAccent, traceP, 3);

      // Fill muncul setelah trace selesai
      if (cycle > 2.2) {
        const fillP = clamp01((cycle - 2.2) / 0.7);
        ctx.save();
        ctx.font = `900 ${sz}px 'Poppins','Arial Black',sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = easeInOut(fillP);
        ctx.fillStyle = "#111";
        ctx.fillText(cfg.mainText, W / 2, ty);
        ctx.restore();
      }
    }

    // Sub teks: muncul perlahan setelah fill
    if (cfg.subText && cycle > 3) {
      const subP = clamp01((cycle - 3) / 0.8);
      const subSz = Math.max(14, Math.round(sz * 0.38));
      const offset = cfg.textPos === "top" ? sz + 16 : cfg.textPos === "bottom" ? -(sz + 12) : sz + 16;
      ctx.save();
      ctx.font = `400 ${subSz}px 'Poppins',sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = easeInOut(subP);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillText(cfg.subText, W / 2, ty + offset);
      ctx.restore();
    }

    if (cfg.logoImg) {
      const lw = W * (cfg.logoSize / 100);
      const lh = (cfg.logoImg.height / cfg.logoImg.width) * lw;
      const [lx, ly] = getLogoXY(W, H, cfg.logoPos, lw, lh);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 8;
      ctx.drawImage(cfg.logoImg, lx, ly, lw, lh);
      ctx.restore();
    }
  },
};

// ─── Template 3: Parallax Depth ─────────────────────────────────────────────
// 3 layer bergerak dengan kecepatan berbeda. Teks float + kamera shake halus.

const parallaxDepth: MotionTemplate = {
  id: "parallax-depth",
  name: "Parallax Depth",
  description: "3 layer parallax dengan kecepatan berbeda. Teks float, kamera shake sinematik.",
  category: "Cinematic",
  thumb(ctx, t) {
    ctx.fillStyle = "#07101f";
    ctx.fillRect(0, 0, 160, 90);
    [0.08, 0.15, 0.25].forEach((alpha, i) => {
      ctx.fillStyle = `rgba(99,102,241,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(80 + Math.sin(t + i) * 15, 45 + Math.cos(t * 0.7 + i) * 8, 30 + i * 15, 20 + i * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "bold 8px sans-serif";
    ctx.fillText("PARALLAX", 8, 15);
  },
  render(ctx, t, W, H, cfg) {
    ctx.fillStyle = "#050d1f";
    ctx.fillRect(0, 0, W, H);

    // Kamera shake halus
    const shakeX = Math.sin(t * 1.3) * 3 + Math.sin(t * 2.1) * 1.5;
    const shakeY = Math.cos(t * 0.9) * 2 + Math.cos(t * 1.7) * 1;

    // Layer 1 (jauh — lambat)
    ctx.save();
    ctx.translate(shakeX * 0.3, shakeY * 0.3);
    for (let i = 0; i < 12; i++) {
      const x = ((i * (W / 11) + t * 8) % (W + 100)) - 50;
      const y = H * 0.3 + Math.sin(t * 0.3 + i) * H * 0.08;
      ctx.fillStyle = hexToRgba(cfg.colorAccent, 0.04);
      ctx.beginPath();
      ctx.ellipse(x, y, 80, 40, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Layer 2 (tengah — sedang)
    ctx.save();
    ctx.translate(shakeX * 0.7, shakeY * 0.7);
    for (let i = 0; i < 8; i++) {
      const x = ((i * (W / 7) + t * 22) % (W + 200)) - 100;
      const y = H * 0.5 + Math.sin(t * 0.5 + i * 0.8) * H * 0.15;
      const r = 30 + 20 * Math.sin(t * 0.4 + i);
      ctx.strokeStyle = hexToRgba(cfg.colorAccent, 0.12);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Layer 3 (dekat — cepat, teks + elemen besar)
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Garis aksen dekat
    const lineY = H * 0.5 + Math.sin(t * 0.6) * H * 0.05;
    const lineLen = W * (0.3 + 0.1 * Math.sin(t * 0.8));
    ctx.strokeStyle = hexToRgba(cfg.colorAccent, 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - lineLen / 2, lineY + 55);
    ctx.lineTo(W / 2 + lineLen / 2, lineY + 55);
    ctx.stroke();

    ctx.restore();

    // Vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
    vg.addColorStop(0, "transparent");
    vg.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Teks float dengan parallax layer 3
    ctx.save();
    ctx.translate(shakeX * 1.2, shakeY * 1.2);
    const floatY = Math.sin(t * 0.7) * 8;
    const sz = cfg.fontSize;
    const ty = getTextY(H, cfg.textPos, sz) + floatY;

    if (cfg.mainText) {
      // Outline pertama (ghost)
      strokeText(ctx, cfg.mainText, W / 2, ty, sz, hexToRgba(cfg.colorAccent, 0.4), 1, 4);
      // Fill teks
      fillTextWithBackdrop(ctx, cfg.mainText, W / 2, ty, sz, cfg.colorText);
    }

    if (cfg.subText) {
      const subSz = Math.max(14, Math.round(sz * 0.4));
      const offset = cfg.textPos === "top" ? sz + 16 : cfg.textPos === "bottom" ? -(sz + 12) : sz + 16;
      ctx.save();
      ctx.font = `300 ${subSz}px 'Poppins',sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = hexToRgba(cfg.colorText, 0.65);
      ctx.fillText(cfg.subText, W / 2, ty + offset);
      ctx.restore();
    }

    ctx.restore();

    if (cfg.logoImg) {
      const lw = W * (cfg.logoSize / 100);
      const lh = (cfg.logoImg.height / cfg.logoImg.width) * lw;
      const [lx, ly] = getLogoXY(W, H, cfg.logoPos, lw, lh);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      ctx.drawImage(cfg.logoImg, lx, ly, lw, lh);
      ctx.restore();
    }
  },
};

// ─── Template 4: Split Reveal ────────────────────────────────────────────────
// Frame terbagi jadi grid, masing-masing slide masuk. Kamera zoom + rotate micro.

const splitReveal: MotionTemplate = {
  id: "split-reveal",
  name: "Split Reveal",
  description: "Frame grid masuk bergantian dari berbagai arah. Kamera micro-rotate dramatis.",
  category: "Transitions",
  thumb(ctx, t) {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, 160, 90);
    const cols = 4;
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const delay = (r * cols + c) * 0.15;
        const p = clamp01((t % 3) * 0.8 - delay);
        const cw = 160 / cols;
        const ch = 90 / rows;
        ctx.fillStyle = hexToRgba("#7c3aed", 0.1 + p * 0.3);
        ctx.fillRect(c * cw, r * ch + (1 - p) * ch, cw - 1, ch - 1);
      }
    }
  },
  render(ctx, t, W, H, cfg) {
    ctx.fillStyle = "#0d0d1a";
    ctx.fillRect(0, 0, W, H);

    // Micro-rotate kamera
    const rot = Math.sin(t * 0.3) * 0.008;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(rot);
    ctx.translate(-W / 2, -H / 2);

    // Background gradient bergerak
    const bgGrd = ctx.createLinearGradient(W * 0.5 + Math.cos(t * 0.2) * W * 0.3, 0, W * 0.5 - Math.cos(t * 0.2) * W * 0.3, H);
    bgGrd.addColorStop(0, "#0d0d1a");
    bgGrd.addColorStop(0.5, hexToRgba(cfg.colorAccent, 0.08));
    bgGrd.addColorStop(1, "#0d0d1a");
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, W, H);

    // Grid tiles masuk
    const cols = 6;
    const rows = 4;
    const cycle = t % 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const delay = idx * 0.05;
        const p = clamp01(easeInOut(clamp01((cycle - delay) / 0.6)));
        const tileW = W / cols;
        const tileH = H / rows;
        const tx2 = c * tileW;
        const ty2 = r * tileH;

        // Arah masuk berselang-seling
        let offsetX = 0;
        let offsetY = 0;
        if ((r + c) % 4 === 0) offsetY = tileH * (1 - p);
        else if ((r + c) % 4 === 1) offsetY = -tileH * (1 - p);
        else if ((r + c) % 4 === 2) offsetX = tileW * (1 - p);
        else offsetX = -tileW * (1 - p);

        ctx.save();
        ctx.beginPath();
        ctx.rect(tx2, ty2, tileW - 1, tileH - 1);
        ctx.clip();
        ctx.fillStyle = hexToRgba(cfg.colorAccent, 0.06 + 0.04 * Math.sin(t + idx));
        ctx.fillRect(tx2 + offsetX, ty2 + offsetY, tileW, tileH);

        // Garis border tile
        ctx.strokeStyle = hexToRgba(cfg.colorAccent, 0.12 * p);
        ctx.lineWidth = 0.5;
        ctx.strokeRect(tx2, ty2, tileW, tileH);
        ctx.restore();
      }
    }

    ctx.restore();

    // Vignette kuat
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.9);
    vg.addColorStop(0, "transparent");
    vg.addColorStop(1, "rgba(0,0,0,0.8)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Teks masuk setelah grid selesai
    const textCycle = t % 4;
    const textP = clamp01(easeInOut(clamp01((textCycle - 0.8) / 0.8)));
    const sz = cfg.fontSize;
    const ty3 = getTextY(H, cfg.textPos, sz);

    if (cfg.mainText && textP > 0) {
      // Scale reveal dari kecil ke besar
      ctx.save();
      ctx.translate(W / 2, ty3);
      const sc = lerp(0.6, 1, textP);
      ctx.scale(sc, sc);
      ctx.translate(-W / 2, -ty3);
      ctx.globalAlpha = textP;
      fillTextWithBackdrop(ctx, cfg.mainText, W / 2, ty3, sz, cfg.colorText, 1);
      ctx.restore();
    }

    if (cfg.subText && textCycle > 1.8) {
      const subP = clamp01((textCycle - 1.8) / 0.6);
      const subSz = Math.max(14, Math.round(sz * 0.4));
      const offset = cfg.textPos === "top" ? sz + 16 : cfg.textPos === "bottom" ? -(sz + 12) : sz + 16;
      ctx.save();
      ctx.font = `300 ${subSz}px 'Poppins',sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = easeInOut(subP);
      ctx.fillStyle = hexToRgba(cfg.colorText, 0.7);
      ctx.fillText(cfg.subText, W / 2, ty3 + offset);
      ctx.restore();
    }

    if (cfg.logoImg) {
      const lw = W * (cfg.logoSize / 100);
      const lh = (cfg.logoImg.height / cfg.logoImg.width) * lw;
      const [lx, ly] = getLogoXY(W, H, cfg.logoPos, lw, lh);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      ctx.drawImage(cfg.logoImg, lx, ly, lw, lh);
      ctx.restore();
    }
  },
};

// ─── Template 5: Neon Morph ──────────────────────────────────────────────────
// Bentuk geometri berubah (morph), teks sebagai outline tipis berpendar.

const neonMorph: MotionTemplate = {
  id: "neon-morph",
  name: "Neon Morph",
  description: "Bentuk geometri morph dinamis. Teks outline tipis berpendar neon.",
  category: "Abstract",
  thumb(ctx, t) {
    ctx.fillStyle = "#0a0014";
    ctx.fillRect(0, 0, 160, 90);
    ctx.strokeStyle = "#c026d3";
    ctx.lineWidth = 1;
    const pts = 6;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const r = 20 + 8 * Math.sin(t * 2 + i);
      const x = 80 + r * Math.cos(a);
      const y = 45 + r * 0.6 * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.strokeText("NEON MORPH", 6, 80);
  },
  render(ctx, t, W, H, cfg) {
    // Trail effect: fill semi-transparan (motion blur buatan)
    ctx.fillStyle = "rgba(10,0,20,0.18)";
    ctx.fillRect(0, 0, W, H);
    if ((t * 10) % 10 < 1) {
      ctx.fillStyle = "#0a0014";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = "#0a0014";
    ctx.fillRect(0, 0, W, H);

    // Kamera: zoom + slight tilt
    const zoomVal = 1 + 0.03 * Math.sin(t * 0.5);
    const tiltAngle = Math.sin(t * 0.3) * 0.015;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(tiltAngle);
    ctx.scale(zoomVal, zoomVal);
    ctx.translate(-W / 2, -H / 2);

    // Bentuk morph 1 — polygon dinamis besar
    const pts1 = 7;
    ctx.save();
    ctx.shadowColor = cfg.colorAccent;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = hexToRgba(cfg.colorAccent, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= pts1; i++) {
      const a = (i / pts1) * Math.PI * 2 + t * 0.2;
      const r = H * 0.28 + H * 0.08 * Math.sin(t * 1.3 + i * 1.1);
      const x = W / 2 + r * Math.cos(a);
      const y = H / 2 + r * 0.7 * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Bentuk morph 2 — dalam, berputar berlawanan
    const pts2 = 5;
    ctx.save();
    ctx.shadowColor = cfg.colorText;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = hexToRgba(cfg.colorText, 0.2);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= pts2; i++) {
      const a = (i / pts2) * Math.PI * 2 - t * 0.3;
      const r = H * 0.15 + H * 0.05 * Math.sin(t * 1.8 + i);
      const x = W / 2 + r * Math.cos(a);
      const y = H / 2 + r * 0.7 * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Lingkaran pulse
    const pulseSz = H * 0.1 * (1 + 0.3 * Math.sin(t * 3));
    const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, pulseSz);
    grd.addColorStop(0, hexToRgba(cfg.colorAccent, 0.3));
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, pulseSz, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
    vg.addColorStop(0, "transparent");
    vg.addColorStop(1, "rgba(5,0,15,0.8)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Teks neon outline (berdenyut)
    const sz = cfg.fontSize;
    const ty = getTextY(H, cfg.textPos, sz);
    const neonPulse = 0.7 + 0.3 * Math.sin(t * 2);
    if (cfg.mainText) {
      // Glow layer
      ctx.save();
      ctx.shadowColor = cfg.colorAccent;
      ctx.shadowBlur = 20 * neonPulse;
      strokeText(ctx, cfg.mainText, W / 2, ty, sz, hexToRgba(cfg.colorAccent, 0.5), 1, 4);
      ctx.restore();
      // Outline tipis
      strokeText(ctx, cfg.mainText, W / 2, ty, sz, cfg.colorText, 1, 1.5);
    }
    if (cfg.subText) {
      const subSz = Math.max(14, Math.round(sz * 0.38));
      const offset = cfg.textPos === "top" ? sz + 16 : cfg.textPos === "bottom" ? -(sz + 12) : sz + 16;
      ctx.save();
      ctx.font = `300 ${subSz}px 'Poppins',sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = hexToRgba(cfg.colorText, 0.5 + 0.2 * neonPulse);
      ctx.fillText(cfg.subText, W / 2, ty + offset);
      ctx.restore();
    }
    if (cfg.logoImg) {
      const lw = W * (cfg.logoSize / 100);
      const lh = (cfg.logoImg.height / cfg.logoImg.width) * lw;
      const [lx, ly] = getLogoXY(W, H, cfg.logoPos, lw, lh);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      ctx.drawImage(cfg.logoImg, lx, ly, lw, lh);
      ctx.restore();
    }
  },
};

// ─── Template 6: Typewriter Beam ─────────────────────────────────────────────
// Teks ditulis karakter per karakter, cursor berjalan, scan line CRT.

const typewriterBeam: MotionTemplate = {
  id: "typewriter-beam",
  name: "Typewriter Beam",
  description: "Teks ditulis karakter per karakter dengan cursor. Efek scan line CRT retro-modern.",
  category: "Text Animations",
  thumb(ctx, t) {
    ctx.fillStyle = "#060f14";
    ctx.fillRect(0, 0, 160, 90);
    const text = "TYPE_";
    const visible = Math.floor((t * 4) % (text.length + 2));
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 11px monospace";
    ctx.fillText(text.slice(0, visible) + (Math.floor(t * 4) % 2 === 0 ? "█" : ""), 10, 55);
  },
  render(ctx, t, W, H, cfg) {
    ctx.fillStyle = "#040c12";
    ctx.fillRect(0, 0, W, H);

    // Kamera: slight vertical drift
    const driftY = Math.sin(t * 0.25) * H * 0.01;
    ctx.save();
    ctx.translate(0, driftY);

    // Scanlines CRT
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, y, W, 1);
    }

    // Scan beam horizontal bergerak
    const beamY = (t * H * 0.18) % H;
    const beamGrd = ctx.createLinearGradient(0, beamY - 30, 0, beamY + 30);
    beamGrd.addColorStop(0, "transparent");
    beamGrd.addColorStop(0.5, hexToRgba(cfg.colorAccent, 0.06));
    beamGrd.addColorStop(1, "transparent");
    ctx.fillStyle = beamGrd;
    ctx.fillRect(0, beamY - 30, W, 60);

    // Background grid terminal
    ctx.strokeStyle = hexToRgba(cfg.colorAccent, 0.04);
    ctx.lineWidth = 0.5;
    const gridSz = 48;
    for (let gx = 0; gx < W; gx += gridSz) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += gridSz) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    ctx.restore();

    // Vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
    vg.addColorStop(0, "transparent");
    vg.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Teks typewriter
    const sz = cfg.fontSize;
    const ty = getTextY(H, cfg.textPos, sz);
    const text = cfg.mainText || "";
    const charsPerSec = 8;
    const cycleDur = Math.max(3, text.length / charsPerSec + 2.5);
    const cycle = t % cycleDur;
    const charCount = Math.min(text.length, Math.floor(cycle * charsPerSec));
    const visibleText = text.slice(0, charCount);
    const showCursor = Math.floor(t * 2) % 2 === 0 || charCount < text.length;

    if (text) {
      ctx.save();
      ctx.font = `900 ${sz}px 'Courier New',monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Glow
      ctx.shadowColor = cfg.colorAccent;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = hexToRgba(cfg.colorAccent, 0.5);
      ctx.lineWidth = 1;
      ctx.strokeText(visibleText + (showCursor ? "█" : ""), W / 2, ty);

      // Fill
      ctx.shadowBlur = 0;
      ctx.fillStyle = cfg.colorText;
      ctx.fillText(visibleText + (showCursor ? "█" : ""), W / 2, ty);
      ctx.restore();
    }

    // Sub teks — muncul setelah teks utama selesai ditulis
    if (cfg.subText && cycle > text.length / charsPerSec + 0.8) {
      const subP = clamp01((cycle - text.length / charsPerSec - 0.8) / 0.6);
      const subSz = Math.max(14, Math.round(sz * 0.38));
      const offset = cfg.textPos === "top" ? sz + 20 : cfg.textPos === "bottom" ? -(sz + 14) : sz + 20;
      ctx.save();
      ctx.font = `400 ${subSz}px 'Courier New',monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = easeInOut(subP);
      ctx.fillStyle = hexToRgba(cfg.colorAccent, 0.7);
      ctx.fillText(cfg.subText, W / 2, ty + offset);
      ctx.restore();
    }

    if (cfg.logoImg) {
      const lw = W * (cfg.logoSize / 100);
      const lh = (cfg.logoImg.height / cfg.logoImg.width) * lw;
      const [lx, ly] = getLogoXY(W, H, cfg.logoPos, lw, lh);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      ctx.drawImage(cfg.logoImg, lx, ly, lw, lh);
      ctx.restore();
    }
  },
};

// ─── Export ──────────────────────────────────────────────────────────────────

export const motionTemplates: MotionTemplate[] = [cinematicPan, lineTrace, parallaxDepth, splitReveal, neonMorph, typewriterBeam];
