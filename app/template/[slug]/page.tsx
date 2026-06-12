"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs"; // 1. Import Auth Hook dari Clerk
import { ArrowLeft, Download, Eye, Clock, CheckCircle2, Share2, Film, Lock, Pencil } from "lucide-react";
import { templates } from "@/data/data";

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  // 2. Gunakan status isSignedIn dari Clerk
  const { isSignedIn } = useAuth();

  // Mencari data template berdasarkan slug yang ada di URL
  const template = templates.find((t) => t.slug === params.slug);

  // Jika data template tidak ditemukan
  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6">Maaf, halaman template yang kamu cari tidak tersedia.</p>
        <Link href="/" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2">
          <ArrowLeft size={18} /> Kembali ke Galeri
        </Link>
      </div>
    );
  }

  // Fungsi download file langsung
  const handleDownload = async () => {
    // 3. Validasi ketat di sisi Client sebelum memulai download
    if (!isSignedIn) {
      alert("Kamu harus login terlebih dahulu untuk mengunduh template!");
      router.push("/sign-in"); // Mengarahkan ke halaman sign-in Clerk
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(template.videoSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.slug}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal mengunduh video:", error);
      window.open(template.videoSrc, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  // Rekomendasi template lain yang setema
  const relatedTemplates = templates.filter((t) => t.category === template.category && t.id !== template.id).slice(0, 4);

  return (
    <main className="min-h-screen bg-gray-50 pt-10 pb-16 w-full overflow-x-hidden">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 max-w-none">
        {/* Tombol Kembali */}
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition mb-6 font-semibold text-sm group">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Kembali ke Galeri
        </button>

        {/* Grid Konten Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 xl:gap-8 items-start w-full">
          {/* KOLOM KIRI: VIDEO PREVIEW */}
          <div className="lg:col-span-3 space-y-6 w-full">
            <div className="bg-gray-950 rounded-2xl overflow-hidden shadow-md relative border border-gray-200 w-full aspect-video lg:h-auto lg:max-h-[70vh]">
              <video src={template.videoSrc} poster={template.poster || "/posters/coming-soon.png"} controls autoPlay loop playsInline className="w-full h-full lg:max-h-[70vh] object-contain mx-auto" />
            </div>

            {/* Judul & Deskripsi */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">{template.category}</span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4 tracking-tight">{template.title}</h1>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-5xl">
                Optimalkan projek videomu dengan template premium <span className="font-semibold text-gray-800">{template.title}</span>. Berada di bawah kategori <span className="text-purple-600 font-semibold">{template.category}</span>,
                aset motion graphic ini dirancang profesional agar mudah diedit dan siap meningkatkan estetika visual konten kreasimu.
              </p>
            </div>
          </div>

          {/* KOLOM KANAN: PANEL DETAIL & ACTION DOWNLOAD */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 space-y-6 w-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Informasi Template</h3>

              {/* Statistik Angka */}
              <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 p-3.5 rounded-xl border border-gray-100" suppressHydrationWarning>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 flex items-center justify-center gap-1 mb-1">
                    <Clock size={12} /> Durasi
                  </p>
                  <p className="font-bold text-gray-800 text-sm font-mono">{template.duration}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 flex items-center justify-center gap-1 mb-1">
                    <Eye size={12} /> Lihat
                  </p>
                  <p className="font-bold text-gray-800 text-sm">{template.views.toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 flex items-center justify-center gap-1 mb-1">
                    <Download size={12} /> Unduh
                  </p>
                  <p className="font-bold text-gray-800 text-sm">{template.downloads.toLocaleString("id-ID")}</p>
                </div>
              </div>

              {/* Lisensi Check List */}
              <div className="space-y-3.5 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  <span className="font-medium">Siap pakai (Format MP4)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  <span className="font-medium">Kualitas High Definition (HD)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  <span className="font-medium">Lisensi Komersial Atribusi Gratis</span>
                </div>
              </div>

              {/* Tombol Aksi Download Dinamis Terkunci */}
              <div className="space-y-3 pt-2">
                {/* TOMBOL EDIT & CUSTOMIZE */}
                <Link href={`/editor/${template.slug}`} className="w-full border border-purple-200 hover:bg-purple-50 text-purple-700 py-3 px-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm shadow-sm">
                  <Pencil size={16} />
                  Edit & Customize
                </Link>

                {isSignedIn ? (
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:bg-orange-300 text-white py-3.5 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10"
                  >
                    <Download size={18} />
                    {isDownloading ? "Mengunduh..." : "Download Template"}
                  </button>
                ) : (
                  <button onClick={handleDownload} className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg">
                    <Lock size={18} className="text-orange-400" />
                    Login untuk Download
                  </button>
                )}

                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link halaman berhasil disalin!");
                    }
                  }}
                  className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <Share2 size={16} />
                  Bagikan Template
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* REKOMENDASI SETEMA */}
        {relatedTemplates.length > 0 && (
          <div className="mt-16 pt-10 border-t border-gray-200 w-full">
            <div className="flex items-center gap-2 mb-6 text-gray-900">
              <Film size={22} className="text-purple-600" />
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Template Setema Lainnya</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedTemplates.map((item) => (
                <Link key={item.id} href={`/template/${item.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group block">
                  <div className="aspect-video bg-gray-950 relative overflow-hidden">
                    <img src={item.poster || "/posters/coming-soon.png"} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded">{item.duration}</div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-purple-600 transition">{item.title}</h4>
                    <p className="text-xs text-purple-600 font-medium mt-1">{item.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
