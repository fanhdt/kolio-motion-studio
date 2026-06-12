/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as THREE from "three";
import { ArrowLeft, Download, Loader2, Type, Image as ImageIcon, Play, Pause, RotateCcw, CheckCircle2, Palette, Layers, Video } from "lucide-react";
import { templates } from "@/data/data";
import { motionTemplates, type MotionConfig, type MotionTemplate } from "@/lib/motionTemplate";
import { motionTemplates3D, type MotionTemplate3D } from "@/lib/motionTemplate3D";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";

// ─── Konstanta ───────────────────────────────────────────────────────────────
// Dinaikkan ke Full HD untuk kualitas export 1080p.
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const FPS = 30;

// ─── Gabungan daftar template (2D lama + 3D baru) ───────────────────────────
// Setiap entri ditandai `type` agar VideoEditor tahu jalur render mana yang dipakai.

type CombinedTemplate = (MotionTemplate & { type: "2d" }) | MotionTemplate3D;

const allTemplates: CombinedTemplate[] = [...motionTemplates.map((t) => ({ ...t, type: "2d" as const })), ...motionTemplates3D];

// ─── Komponen Preview thumbnail animasi kecil ────────────────────────────────
// Thumbnail tetap pakai canvas 2D ringan (baik untuk template 2D maupun 3D,
// karena MotionTemplate3D menyediakan fungsi thumb() sendiri berbasis canvas 2D).

function TemplateThumbnail({ tpl, isActive, onClick }: { tpl: CombinedTemplate; isActive: boolean; onClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const t = (now - startRef.current) / 1000;
      tpl.thumb(ctx, t);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [tpl]);

  return (
    <button
      onClick={onClick}
      className={`
        group relative rounded-xl overflow-hidden border-2 transition-all duration-200
        ${isActive ? "border-purple-500 shadow-lg shadow-purple-500/20" : "border-gray-200 hover:border-purple-300"}
      `}
    >
      <canvas ref={canvasRef} width={160} height={90} className="w-full aspect-video block bg-gray-950" />
      <div className="p-2 bg-white border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-800 truncate">{tpl.name}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[10px] text-purple-600 truncate">{tpl.category}</p>
          {tpl.type === "3d" && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold shrink-0 ml-1">3D</span>}
        </div>
      </div>
      {isActive && <div className="absolute top-2 right-2 bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">AKTIF</div>}
    </button>
  );
}

// ─── Komponen Panel form dengan judul collapsible ───────────────────────────

function PanelSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
        <span className="text-purple-600">{icon}</span>
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

// ─── VideoEditor utama ───────────────────────────────────────────────────────

export default function VideoEditor() {
  const params = useParams();
  const router = useRouter();

  // Hook export
  const { recordingState, progress, startRecording, stopRecording } = useMediaRecorder();

  // Refs canvas & animasi
  // Dua canvas terpisah: satu untuk template 2D (context "2d"), satu untuk
  // template 3D (context "webgl"). Satu elemen <canvas> tidak bisa berpindah
  // antara context "2d" dan "webgl" setelah salah satunya diambil, jadi kita
  // pakai elemen berbeda dan tampilkan sesuai tipe template aktif.
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  // Ref untuk melacak frame urutan saat eksport (deterministik / anti-lag)
  const currentExportFrameRef = useRef<number>(0);

  // ── Three.js refs (hanya diinisialisasi saat template 3D aktif) ──
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const tpl3DStateRef = useRef<Record<string, any> | null>(null);
  const active3DTplRef = useRef<MotionTemplate3D | null>(null);

  // Cari template dari data.ts berdasarkan slug URL
  const pageTemplate = templates.find((t) => t.slug === params.slug);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTplIdx, setActiveTplIdx] = useState(0);
  const [exportDuration, setExportDuration] = useState(5);
  const [isExportingMode, setIsExportingMode] = useState(false); // Membedakan mode render preview vs export
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoImgEl, setLogoImgEl] = useState<HTMLImageElement | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Config overlay
  const [cfg, setCfg] = useState<Omit<MotionConfig, "logoImg">>({
    mainText: "",
    subText: "",
    colorText: "#ffffff",
    colorAccent: "#7c3aed",
    fontSize: 52,
    textPos: "center",
    logoPos: "topright",
    logoSize: 20,
  });

  // Helper update satu field config
  const updateCfg = <K extends keyof typeof cfg>(key: K, val: (typeof cfg)[K]) => {
    setCfg((prev) => ({ ...prev, [key]: val }));
    startTimeRef.current = 0;
  };

  // Config lengkap yang dikirim ke render
  const fullCfg: MotionConfig = { ...cfg, logoImg: logoImgEl };

  const activeTpl = allTemplates[activeTplIdx];

  // ─── Setup / teardown Three.js saat template 3D aktif berubah ──────────────

  const setupThreeJS = useCallback(() => {
    const canvas = canvas3DRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true, // perlu agar captureStream() konsisten saat export
    });
    renderer.setPixelRatio(1); // kunci resolusi output = CANVAS_W x CANVAS_H (Full HD), bukan terkali devicePixelRatio
    renderer.setSize(CANVAS_W, CANVAS_H, false);
    renderer.shadowMap.enabled = false; // matikan shadow map demi performa

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, CANVAS_W / CANVAS_H, 0.1, 1000);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
  }, []);

  const teardownThreeJS = useCallback(() => {
    const scene = sceneRef.current;
    const tpl = active3DTplRef.current;
    const state = tpl3DStateRef.current;

    if (scene && tpl && state) {
      tpl.dispose(scene, state);
    }

    rendererRef.current?.dispose();
    rendererRef.current = null;
    sceneRef.current = null;
    cameraRef.current = null;
    tpl3DStateRef.current = null;
    active3DTplRef.current = null;
  }, []);

  // ─── Playback controls (Dideklarasikan di atas renderFrame agar aman dari TDZ) ───

  const pausePlay = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  // ─── Loop animasi ────────────────────────────────────────────────────────

  const renderFrame = useCallback(() => {
    let t = 0;

    if (isExportingMode) {
      // Jalur Perekaman: Waktu berjalan konstan & matematis (anti-freeze / anti-pause)
      const totalFrames = exportDuration * FPS;

      if (currentExportFrameRef.current < totalFrames) {
        t = currentExportFrameRef.current / FPS;
        currentExportFrameRef.current++;
      } else {
        // Stop jika seluruh frame durasi terpenuhi
        stopRecording();
        setIsExportingMode(false);
        pausePlay();
        return;
      }
    } else {
      // Jalur Preview Normal: Menggunakan waktu nyata (real-time)
      if (!startTimeRef.current) startTimeRef.current = performance.now();
      t = (performance.now() - startTimeRef.current) / 1000;
    }

    if (activeTpl.type === "3d") {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const state = tpl3DStateRef.current;
      if (renderer && scene && camera && state) {
        activeTpl.render(scene, camera, renderer, t, fullCfg, state);
      }
    } else {
      const canvas = canvas2DRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      activeTpl.render(ctx, t, CANVAS_W, CANVAS_H, fullCfg);
    }

    animFrameRef.current = requestAnimationFrame(renderFrame);
  }, [activeTpl, fullCfg, isExportingMode, exportDuration, stopRecording, pausePlay]);

  const startPlay = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    animFrameRef.current = requestAnimationFrame(renderFrame);
  }, [renderFrame]);

  const restartPlay = useCallback(() => {
    startTimeRef.current = 0;
    if (!isPlayingRef.current) startPlay();
  }, [startPlay]);

  // Start otomatis saat mount
  useEffect(() => {
    startPlay();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      isPlayingRef.current = false;
      teardownThreeJS();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-setup saat ganti template (terutama transisi 2D <-> 3D, atau ganti antar template 3D)
  useEffect(() => {
    startTimeRef.current = 0;

    // Bersihkan setup 3D sebelumnya (jika ada)
    teardownThreeJS();

    if (activeTpl.type === "3d") {
      setupThreeJS();
      const scene = sceneRef.current!;
      const camera = cameraRef.current!;
      const state = activeTpl.setup(scene, camera);
      tpl3DStateRef.current = state;
      active3DTplRef.current = activeTpl;
    }

    if (isPlayingRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(renderFrame);
    }
  }, [activeTplIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Logo upload ─────────────────────────────────────────────────────────

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setLogoImgEl(img);
      setLogoPreview(url);
      setLogoFile(file);
    };
    img.src = url;
  };

  const removeLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoImgEl(null);
    setLogoPreview(null);
    setLogoFile(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Export ──────────────────────────────────────────────────────────────

  const handleExport = () => {
    const canvas = activeTpl.type === "3d" ? canvas3DRef.current : canvas2DRef.current;
    if (!canvas || recordingState !== "idle") return;

    // Bersihkan sisa animasi preview terdahulu
    cancelAnimationFrame(animFrameRef.current);
    isPlayingRef.current = false;

    // Set parameter awal ke mode eksport deterministik
    currentExportFrameRef.current = 0;
    startTimeRef.current = 0;
    setIsExportingMode(true);

    // Jalankan siklus render khusus export
    isPlayingRef.current = true;
    setIsPlaying(true);
    animFrameRef.current = requestAnimationFrame(renderFrame);

    // Mulai perekaman canvas stream.
    // Canvas sudah berukuran 1920x1080 (Full HD) -> startRecording akan
    // capture stream pada resolusi tersebut.
    startRecording(canvas, exportDuration * 1000);
  };

  // ─── Guard: template tidak ditemukan ────────────────────────────────────

  if (!pageTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6">Template yang kamu cari tidak tersedia.</p>
        <Link href="/" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2">
          <ArrowLeft size={18} /> Kembali ke Galeri
        </Link>
      </div>
    );
  }

  const isExporting = recordingState !== "idle";

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition font-medium text-sm group">
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">{pageTemplate.title}</h1>
            <p className="text-xs text-purple-600 font-medium">{pageTemplate.category}</p>
          </div>
          <button
            onClick={() => {
              setCfg({
                mainText: "",
                subText: "",
                colorText: "#ffffff",
                colorAccent: "#7c3aed",
                fontSize: 52,
                textPos: "center",
                logoPos: "topright",
                logoSize: 20,
              });
              removeLogo();
              setActiveTplIdx(0);
              startTimeRef.current = 0;
              setIsExportingMode(false);
            }}
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition font-medium"
          >
            <RotateCcw size={12} />
            Reset semua
          </button>
        </div>

        {/* ── Layout utama: canvas kiri, panel kanan ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
          {/* ── Kolom kiri: canvas + kontrol ── */}
          <div className="space-y-4">
            {/* Canvas preview */}
            <div className="bg-gray-950 rounded-2xl overflow-hidden shadow-xl border border-gray-800 relative">
              <canvas ref={canvas2DRef} width={CANVAS_W} height={CANVAS_H} className="w-full aspect-video block" style={{ imageRendering: "auto", display: activeTpl.type === "2d" ? "block" : "none" }} />
              <canvas ref={canvas3DRef} width={CANVAS_W} height={CANVAS_H} className="w-full aspect-video block" style={{ imageRendering: "auto", display: activeTpl.type === "3d" ? "block" : "none" }} />

              {/* Badge resolusi */}
              <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-mono px-2.5 py-1 rounded-full">1920×1080 · {activeTpl.type === "3d" ? "3D" : "2D"}</div>

              {/* Badge REC */}
              {isExporting && recordingState === "recording" && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full" />
                  REC
                </div>
              )}
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={isPlaying ? pausePlay : startPlay}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                {isPlaying ? "Jeda" : "Play"}
              </button>
              <button
                onClick={restartPlay}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
              >
                <RotateCcw size={15} />
                Restart
              </button>
            </div>

            {/* Progress export */}
            {isExporting && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin text-purple-600" />
                    <span className="text-sm font-semibold text-gray-700">{recordingState === "recording" ? "Merekam animasi..." : "Memproses file..."}</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-600 h-2 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-400">Jangan tutup tab — semua proses berjalan di browser kamu.</p>
                <button
                  onClick={() => {
                    stopRecording();
                    setIsExportingMode(false);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 transition font-medium"
                >
                  Batalkan rekaman
                </button>
              </div>
            )}

            {/* Grid pilih template animasi */}
            <PanelSection icon={<Layers size={15} />} title="Pilih Template Animasi">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allTemplates.map((tpl, i) => (
                  <TemplateThumbnail
                    key={tpl.id}
                    tpl={tpl}
                    isActive={activeTplIdx === i}
                    onClick={() => {
                      setActiveTplIdx(i);
                      startTimeRef.current = 0;
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Klik template untuk langsung preview animasi di canvas atas. Template bertanda 3D dirender dengan WebGL.</p>
            </PanelSection>
          </div>

          {/* ── Kolom kanan: semua panel kontrol ── */}
          <div className="space-y-4">
            {/* Teks & Brand */}
            <PanelSection icon={<Type size={15} />} title="Teks & Brand">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Teks utama</label>
                <input
                  type="text"
                  value={cfg.mainText}
                  onChange={(e) => updateCfg("mainText", e.target.value)}
                  placeholder="Nama brand / headline"
                  maxLength={40}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{cfg.mainText.length}/40</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Teks sub / tagline</label>
                <input
                  type="text"
                  value={cfg.subText}
                  onChange={(e) => updateCfg("subText", e.target.value)}
                  placeholder="Tagline / keterangan singkat"
                  maxLength={60}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Posisi teks</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["top", "center", "bottom"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateCfg("textPos", pos)}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize transition border ${cfg.textPos === pos ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {pos === "top" ? "Atas" : pos === "center" ? "Tengah" : "Bawah"}
                    </button>
                  ))}
                </div>
              </div>
            </PanelSection>

            {/* Warna & Tipografi */}
            <PanelSection icon={<Palette size={15} />} title="Warna & Ukuran">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Warna teks</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5">
                    <input type="color" value={cfg.colorText} onChange={(e) => updateCfg("colorText", e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                    <span className="text-xs text-gray-500 font-mono">{cfg.colorText}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Warna aksen</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5">
                    <input type="color" value={cfg.colorAccent} onChange={(e) => updateCfg("colorAccent", e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                    <span className="text-xs text-gray-500 font-mono">{cfg.colorAccent}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex justify-between">
                  <span>Ukuran teks utama</span>
                  <span className="text-purple-600 font-bold">{cfg.fontSize}px</span>
                </label>
                <input type="range" min={20} max={90} step={1} value={cfg.fontSize} onChange={(e) => updateCfg("fontSize", parseInt(e.target.value))} className="w-full accent-purple-600" />
              </div>
            </PanelSection>

            {/* Logo */}
            <PanelSection icon={<ImageIcon size={15} />} title="Logo / Watermark">
              {!logoFile ? (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) handleLogoFile(f);
                  }}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition group"
                >
                  <ImageIcon size={22} className="mx-auto mb-2 text-gray-400 group-hover:text-purple-500 transition" />
                  <p className="text-xs font-medium text-gray-500 group-hover:text-purple-600 transition">Klik atau drag logo ke sini</p>
                  <p className="text-xs text-gray-400 mt-0.5">PNG / SVG / WebP — transparan lebih baik</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {logoPreview && <img src={logoPreview} alt="Logo preview" className="w-14 h-14 object-contain rounded-lg border border-gray-200 bg-white p-1" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{logoFile.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{(logoFile.size / 1024).toFixed(0)} KB</p>
                    <button onClick={removeLogo} className="text-xs text-red-500 hover:text-red-700 transition font-medium mt-1">
                      Hapus logo
                    </button>
                  </div>
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/webp,image/jpeg"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLogoFile(f);
                }}
                className="hidden"
              />
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Posisi logo</label>
                  <select
                    value={cfg.logoPos}
                    onChange={(e) => updateCfg("logoPos", e.target.value as MotionConfig["logoPos"])}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  >
                    <option value="topright">Kanan atas</option>
                    <option value="topleft">Kiri atas</option>
                    <option value="bottomright">Kanan bawah</option>
                    <option value="bottomleft">Kiri bawah</option>
                    <option value="center">Tengah</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex justify-between">
                    <span>Ukuran</span>
                    <span className="text-purple-600 font-bold">{cfg.logoSize}%</span>
                  </label>
                  <input type="range" min={8} max={45} step={1} value={cfg.logoSize} onChange={(e) => updateCfg("logoSize", parseInt(e.target.value))} className="w-full accent-purple-600 mt-2.5" />
                </div>
              </div>
            </PanelSection>

            {/* Export */}
            <PanelSection icon={<Video size={15} />} title="Export Video">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex justify-between">
                  <span>Durasi rekaman</span>
                  <span className="text-purple-600 font-bold">{exportDuration}s</span>
                </label>
                <input type="range" min={2} max={15} step={1} value={exportDuration} onChange={(e) => setExportDuration(parseInt(e.target.value))} className="w-full accent-purple-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>2s</span>
                  <span>15s</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 space-y-1.5">
                <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  Format output: WebM (VP9) · Full HD 1920×1080
                </p>
                <p className="text-xs text-blue-600 leading-relaxed">File WebM bisa langsung diupload ke YouTube, Instagram (via edit), atau dikonversi ke MP4 gratis di HandBrake / CloudConvert.</p>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:bg-orange-300 disabled:cursor-not-allowed text-white py-3.5 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/15"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    {recordingState === "recording" ? `Merekam... ${progress}%` : "Memproses..."}
                  </>
                ) : (
                  <>
                    <Download size={17} />
                    Export & Download
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center leading-relaxed">🔒 Semua proses di browser kamu. Tidak ada data yang dikirim ke server.</p>
            </PanelSection>
          </div>
        </div>
      </div>
    </main>
  );
}
