/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/motionTemplate3D.ts
import * as THREE from "three";
import type { MotionConfig } from "@/lib/motionTemplate";

// ─── Tipe Template 3D ────────────────────────────────────────────────────────

export interface MotionTemplate3D {
  id: string;
  name: string;
  category: string;
  type: "3d";

  /**
   * Dipanggil sekali saat template diaktifkan.
   * Bangun semua object3D, lighting, dan simpan referensi di `state`
   * agar bisa dianimasikan & diupdate di render().
   */
  setup: (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => Record<string, unknown>;

  /**
   * Dipanggil setiap frame.
   * t = waktu dalam detik (0 = awal animasi).
   */
  render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, t: number, cfg: MotionConfig, state: Record<string, any>) => void;

  /**
   * Dipanggil saat template diganti / unmount, untuk dispose geometry/material/texture
   * agar tidak memory leak.
   */
  dispose: (scene: THREE.Scene, state: Record<string, any>) => void;

  /** Thumbnail kecil untuk preview di grid pemilihan template (pakai canvas 2D biasa) */
  thumb: (ctx: CanvasRenderingContext2D, t: number) => void;
}

// ─── Helper: render teks ke CanvasTexture ───────────────────────────────────

function createTextTexture(text: string, color: string, fontSize: number, accent: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Garis aksen kecil di kiri teks
  ctx.fillStyle = accent;
  ctx.fillRect(40, canvas.height / 2 - 40, 8, 80);

  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize * 2}px Poppins, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text || "Brand Anda", 70, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createSubTextTexture(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.font = `500 36px Poppins, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text || "", 70, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// ─── Easing helpers ──────────────────────────────────────────────────────────

function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3;
  return x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// ─── Template 3D: "Orbit Cube Showcase" ─────────────────────────────────────
// Sebuah kubus / kartu 3D dengan logo (jika ada) berputar dan "memantul" masuk,
// dikelilingi partikel orbit, dengan plane teks 3D yang fade-in & sedikit
// terangkat (bukan flat 2D lagi).

export const orbitCubeTemplate: MotionTemplate3D = {
  id: "orbit-cube-3d",
  name: "Orbit Cube 3D",
  category: "3D Showcase",
  type: "3d",

  setup: (scene, camera) => {
    const group = new THREE.Group();
    scene.add(group);

    // ── Lighting ──
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 6, 7);
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0x7c3aed, 2.5, 20);
    rimLight.position.set(-4, -2, 3);
    scene.add(rimLight);

    // ── Kubus / kartu utama (tempat logo bisa ditempel sebagai texture) ──
    const cubeGeo = new THREE.BoxGeometry(2.2, 2.2, 0.25);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.15,
      roughness: 0.35,
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    group.add(cube);

    // ── Plane teks utama (3D, melayang sedikit di depan kubus) ──
    const textTexture = createTextTexture("Brand Anda", "#ffffff", 52, "#7c3aed");
    const textMat = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true });
    const textGeo = new THREE.PlaneGeometry(4, 1);
    const textPlane = new THREE.Mesh(textGeo, textMat);
    textPlane.position.set(0, -1.8, 0.3);
    group.add(textPlane);

    // ── Plane sub-teks ──
    const subTexture = createSubTextTexture("", "#ffffff");
    const subMat = new THREE.MeshBasicMaterial({ map: subTexture, transparent: true });
    const subGeo = new THREE.PlaneGeometry(4, 0.5);
    const subPlane = new THREE.Mesh(subGeo, subMat);
    subPlane.position.set(0, -2.35, 0.3);
    group.add(subPlane);

    // ── Partikel orbit (InstancedMesh agar ringan walau jumlah banyak) ──
    const particleCount = 60;
    const particleGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.8,
    });
    const particles = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    scene.add(particles);

    // Simpan parameter orbit tiap partikel (radius, speed, offset, sumbu)
    const particleParams = Array.from({ length: particleCount }, (_, i) => ({
      radius: 2.6 + Math.random() * 1.6,
      speed: 0.3 + Math.random() * 0.6,
      offset: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 1.2,
      yAmp: 0.5 + Math.random() * 1.5,
    }));

    // ── Logo plane (opsional, di-update saat ada logoImg) ──
    const logoGeo = new THREE.PlaneGeometry(1, 1);
    const logoMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const logoPlane = new THREE.Mesh(logoGeo, logoMat);
    logoPlane.position.set(0, 0, 0.14); // sedikit di depan permukaan kubus
    group.add(logoPlane);

    camera.position.set(0, 0, 7);
    camera.lookAt(0, 0, 0);

    return {
      group,
      cube,
      cubeMat,
      textPlane,
      textMat,
      textTexture,
      subPlane,
      subMat,
      subTexture,
      particles,
      particleParams,
      logoPlane,
      logoMat,
      lastMainText: "",
      lastSubText: "",
      lastColorText: "",
      lastColorAccent: "",
      lastLogoSrc: null as string | null,
    };
  },

  render: (scene, camera, renderer, t, cfg, state) => {
    const { group, cube, cubeMat, textPlane, textMat, subPlane, subMat, particles, particleParams, logoPlane, logoMat } = state;

    // ── Update kubus warna sesuai aksen ──
    cubeMat.color.set(cfg.colorAccent);

    // ── Update texture teks jika konten / warna berubah ──
    if (cfg.mainText !== state.lastMainText || cfg.colorText !== state.lastColorText || cfg.colorAccent !== state.lastColorAccent) {
      state.textTexture.dispose();
      const newTex = createTextTexture(cfg.mainText, cfg.colorText, cfg.fontSize, cfg.colorAccent);
      textMat.map = newTex;
      textMat.needsUpdate = true;
      state.textTexture = newTex;
      state.lastMainText = cfg.mainText;
      state.lastColorText = cfg.colorText;
      state.lastColorAccent = cfg.colorAccent;
    }

    if (cfg.subText !== state.lastSubText || cfg.colorText !== state.lastColorText) {
      state.subTexture.dispose();
      const newTex = createSubTextTexture(cfg.subText, cfg.colorText);
      subMat.map = newTex;
      subMat.needsUpdate = true;
      state.subTexture = newTex;
      state.lastSubText = cfg.subText;
    }

    // ── Update logo texture jika ada logoImg baru ──
    if (cfg.logoImg) {
      const src = cfg.logoImg.src;
      if (src !== state.lastLogoSrc) {
        if (logoMat.map) logoMat.map.dispose();
        const tex = new THREE.Texture(cfg.logoImg);
        tex.needsUpdate = true;
        logoMat.map = tex;
        logoMat.needsUpdate = true;

        // Sesuaikan rasio plane logo dengan aspect ratio gambar asli
        const aspect = cfg.logoImg.width / cfg.logoImg.height;
        const baseSize = (cfg.logoSize / 100) * 2.2; // relatif terhadap ukuran kubus
        logoPlane.scale.set(baseSize * Math.max(aspect, 1), baseSize / Math.max(aspect, 1), 1);

        state.lastLogoSrc = src;
      }
      logoMat.opacity = 1;

      // Posisi logo di permukaan kubus sesuai cfg.logoPos
      const pad = 0.85;
      switch (cfg.logoPos) {
        case "topleft":
          logoPlane.position.set(-pad, pad, 0.14);
          break;
        case "topright":
          logoPlane.position.set(pad, pad, 0.14);
          break;
        case "bottomleft":
          logoPlane.position.set(-pad, -pad, 0.14);
          break;
        case "bottomright":
          logoPlane.position.set(pad, -pad, 0.14);
          break;
        default:
          logoPlane.position.set(0, 0, 0.14);
      }
    } else {
      logoMat.opacity = 0;
    }

    // ── Animasi masuk: kubus "bounce in" dengan elastic easing (0-1.2s) ──
    const introDuration = 1.2;
    const introProgress = clamp01(t / introDuration);
    const scale = easeOutElastic(introProgress);
    group.scale.setScalar(Math.max(scale, 0.001));

    // ── Rotasi dinamis berkelanjutan ──
    group.rotation.y = Math.sin(t * 0.6) * 0.5 + t * 0.25;
    group.rotation.x = Math.sin(t * 0.4) * 0.15;

    // ── Posisi teks: geser & fade-in tergantung textPos ──
    const textIntro = easeOutCubic(clamp01((t - 0.3) / 0.8));
    const targetY = cfg.textPos === "top" ? 2.0 : cfg.textPos === "bottom" ? -1.8 : -1.8;
    textPlane.position.y = THREE.MathUtils.lerp(targetY - 0.5, targetY, textIntro);
    subPlane.position.y = textPlane.position.y - 0.55;
    textMat.opacity = textIntro;
    subMat.opacity = textIntro;

    if (cfg.textPos === "top") {
      textPlane.position.y = THREE.MathUtils.lerp(2.5, 2.0, textIntro);
      subPlane.position.y = textPlane.position.y - 0.55;
    } else if (cfg.textPos === "center") {
      textPlane.position.y = THREE.MathUtils.lerp(0, 0, textIntro); // tetap, fade saja
      subPlane.position.y = textPlane.position.y - 0.55;
    }

    // Pastikan plane teks selalu menghadap kamera (billboard) walau group berotasi
    textPlane.quaternion.copy(camera.quaternion);
    subPlane.quaternion.copy(camera.quaternion);
    // Lawan rotasi group agar billboard efektif
    const invGroupQuat = group.quaternion.clone().invert();
    textPlane.quaternion.premultiply(invGroupQuat);
    subPlane.quaternion.premultiply(invGroupQuat);
    logoPlane.quaternion.copy(camera.quaternion).premultiply(invGroupQuat);

    // ── Partikel orbit ──
    const dummy = new THREE.Object3D();
    for (let i = 0; i < particleParams.length; i++) {
      const p = particleParams[i];
      const angle = t * p.speed + p.offset;
      const x = Math.cos(angle) * p.radius;
      const z = Math.sin(angle) * p.radius * 0.6;
      const y = Math.sin(angle * 1.5 + p.offset) * p.yAmp * 0.5 + Math.sin(p.tilt) * 1.0;

      dummy.position.set(x, y, z);
      const s = 0.6 + 0.4 * Math.sin(t * 2 + p.offset);
      dummy.scale.setScalar(Math.max(s, 0.2));
      dummy.updateMatrix();
      particles.setMatrixAt(i, dummy.matrix);
    }
    particles.instanceMatrix.needsUpdate = true;
    (particles.material as THREE.MeshStandardMaterial).color.set(cfg.colorAccent);
    (particles.material as THREE.MeshStandardMaterial).emissive.set(cfg.colorAccent);

    // ── Kamera sedikit "bernafas" / parallax ──
    camera.position.x = Math.sin(t * 0.25) * 1.0;
    camera.position.y = Math.cos(t * 0.2) * 0.4;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  },

  dispose: (scene, state) => {
    const { group, cube, textPlane, subPlane, particles, textTexture, subTexture, logoMat } = state;

    cube.geometry.dispose();
    (cube.material as THREE.Material).dispose();

    textPlane.geometry.dispose();
    (textPlane.material as THREE.Material).dispose();
    textTexture?.dispose();

    subPlane.geometry.dispose();
    (subPlane.material as THREE.Material).dispose();
    subTexture?.dispose();

    if (logoMat.map) logoMat.map.dispose();
    logoMat.dispose();

    particles.geometry.dispose();
    (particles.material as THREE.Material).dispose();

    scene.remove(group);
    scene.remove(particles);

    // Bersihkan semua lights yang ditambahkan langsung ke scene
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj instanceof THREE.Light) toRemove.push(obj);
    });
    toRemove.forEach((l) => scene.remove(l));
  },

  // Thumbnail preview (canvas 2D sederhana, tanpa Three.js agar grid tetap ringan)
  thumb: (ctx, t) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, w, h);

    // "Kubus" isometrik sederhana yang berputar
    const cx = w / 2;
    const cy = h / 2 - 5;
    const size = 22;
    const angle = t * 0.8;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(angle) * 0.3);

    const grad = ctx.createLinearGradient(-size, -size, size, size);
    grad.addColorStop(0, "#a78bfa");
    grad.addColorStop(1, "#7c3aed");
    ctx.fillStyle = grad;
    ctx.fillRect(-size, -size * 0.7, size * 2, size * 1.4);

    // Highlight tepi
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-size, -size * 0.7, size * 2, size * 1.4);
    ctx.restore();

    // Partikel orbit kecil
    for (let i = 0; i < 8; i++) {
      const a = t * (0.5 + i * 0.1) + i;
      const px = cx + Math.cos(a) * (size + 14 + (i % 3) * 4);
      const py = cy + Math.sin(a) * (size * 0.6 + 6);
      ctx.fillStyle = "#c4b5fd";
      ctx.beginPath();
      ctx.arc(px, py, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Garis teks placeholder di bawah
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(cx - 20, h - 18, 40, 3);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(cx - 14, h - 11, 28, 2);
  },
};

export const motionTemplates3D: MotionTemplate3D[] = [orbitCubeTemplate];
