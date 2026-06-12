"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, Eye, Clock, TrendingUp, ChevronDown } from "lucide-react";
import { templates, type MotionTemplate } from "@/data/data";

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Terbaru");
  const [visibleCount, setVisibleCount] = useState(6); // khusus mobile

  const categories = [
    "Semua",
    "Logos",
    "Social Media",
    "Progress Bar",
    "Testimonial",
    "Orbit Cards",
    "Video Titles",
    "Ads",
    "UI Elements",
    "Charts & Infographics",
    "Mobile Screens",
    "Round Logo",
    "Linear Cards",
    "Icons Animation",
    "Buttons & CTA",
    "Text Animations",
    "Backgrounds",
    "Showreels",
    "Transitions",
    "Overlays & Effects",
    "Full Animation",
  ];

  // Fungsi untuk mengganti kategori + reset tampilan mobile ke 6
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setVisibleCount(6);
  };

  // Fungsi untuk mengganti pengurutan + reset tampilan mobile
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setVisibleCount(6);
  };

  // Fungsi trigger download file langsung dari folder public
  const handleDownload = async (e: React.MouseEvent, videoUrl: string, fileName: string) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.toLowerCase().replace(/\s+/g, "-")}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal mengunduh video:", error);
      window.open(videoUrl, "_blank");
    }
  };

  // 1. Filter data berdasarkan kategori yang dipilih
  const baseFiltered = activeCategory === "Semua" ? [...templates] : templates.filter((t) => t.category === activeCategory);

  // 2. Urutkan data berdasarkan opsi dropdown
  const filteredTemplates = baseFiltered.sort((a, b) => {
    if (sortBy === "Terpopuler") {
      return b.views - a.views;
    }
    if (sortBy === "Most Downloaded") {
      return b.downloads - a.downloads;
    }
    return Number(a.id) - Number(b.id);
  });

  // 3. Potong data khusus untuk mobile (load more)
  const displayedTemplates = filteredTemplates.slice(0, visibleCount);

  // Komponen kartu yang sama, agar tidak duplikasi kode
  const TemplateCard = ({ template }: { template: MotionTemplate }) => (
    <Link
      key={template.id}
      href={`/template/${template.slug}`}
      className="group bg-white shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer rounded-xl block"
      onMouseEnter={() => setHoveredCard(template.id)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      {/* Thumbnail dengan video hover-play */}
      <div className="relative aspect-video bg-gray-950 overflow-hidden rounded-t-xl">
        <video
          src={template.videoSrc}
          poster={template.poster}
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hoveredCard === template.id ? "opacity-100" : "opacity-0"}`}
          ref={(el) => {
            if (el) {
              if (hoveredCard === template.id) {
                el.play().catch(() => {});
              } else {
                el.pause();
                el.currentTime = 0;
              }
            }
          }}
        />

        {template.poster && (
          <img
            src={template.poster}
            alt={template.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hoveredCard === template.id ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              e.currentTarget.src = "/posters/coming-soon.png";
            }}
          />
        )}

        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 z-10 ${hoveredCard === template.id ? "opacity-100" : "opacity-0"}`}>
          <span className="bg-white text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-100 transition shadow-md">
            <Eye size={16} />
            Lihat Detail
          </span>
        </div>

        <div className="absolute top-2 left-2 flex gap-2 z-10">
          {template.isNew && <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">New</span>}
          {template.isTrending && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium shadow">
              <TrendingUp size={10} />
              Trending
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-10 font-mono">
          <div className="flex items-center gap-1">
            <Clock size={10} />
            {template.duration}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-1">{template.title}</h3>
        <p className="text-xs text-orange-600 mb-2">{template.category}</p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {template.views.toLocaleString()}
            </span>
            <button onClick={(e) => handleDownload(e, template.videoSrc, template.title)} className="flex items-center gap-1 hover:text-orange-600 transition p-1 rounded" title="Unduh Video">
              <Download size={12} />
              {template.downloads.toLocaleString()}
            </button>
          </div>
          <span className="text-orange-600 group-hover:text-orange-700 transition font-medium">Detail →</span>
        </div>
      </div>
    </Link>
  );

  return (
    <section className="bg-gray-100 py-2 md:py-16 lg:py-20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">Gallery Motion Templates</h2>
          <div className="flex items-center justify-center gap-4 my-4">
            <div className="flex-1 h-px bg-gray-300 max-w-24"></div>
            <span className="text-sm sm:text-base text-gray-500">{filteredTemplates.length} template tersedia</span>
            <div className="flex-1 h-px bg-gray-300 max-w-24"></div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* ========== DROPDOWN KATEGORI (Mobile/Tablet) ========== */}
          <div className="lg:hidden relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
            >
              <span>{activeCategory}</span>
              <ChevronDown size={18} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      handleCategoryChange(category);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${activeCategory === category ? "bg-orange-50 text-orange-500 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========== SIDEBAR KATEGORI (Desktop) ========== */}
          <div className="hidden lg:block lg:w-72 xl:w-80 shrink-0">
            <div className="sticky top-24 bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-gray-800 font-semibold text-lg">Kategori</h3>
                <p className="text-gray-600 text-sm mt-1">Pilih template sesuai kebutuhan</p>
              </div>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`w-full text-left px-4 py-3 transition-all duration-200 flex items-center justify-between ${
                      activeCategory === category ? "bg-orange-50 text-orange-500 border-l-4 border-orange-500 font-medium" : "hover:bg-gray-50 text-gray-700 border-l-4 border-transparent"
                    }`}
                  >
                    <span className="text-sm md:text-base">{category}</span>
                    {activeCategory === category && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========== GRID GALLERY ========== */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Menampilkan <span className="lg:hidden">{displayedTemplates.length}</span>
                <span className="hidden lg:inline">{filteredTemplates.length}</span> template
              </p>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Terbaru">Terbaru</option>
                <option value="Terpopuler">Terpopuler</option>
                <option value="Most Downloaded">Most Downloaded</option>
              </select>
            </div>

            {/* ===== GRID MOBILE (dengan load more) ===== */}
            <div className="lg:hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 pb-4 transition-all duration-300">
                {displayedTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>

              {/* Tombol Tampilkan Lebih Banyak (hanya mobile) */}
              {filteredTemplates.length > visibleCount && (
                <div className="mt-6 text-center">
                  <button onClick={() => setVisibleCount((prev) => prev + 6)} className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition">
                    Tampilkan Lebih Banyak
                  </button>
                </div>
              )}
            </div>

            {/* ===== GRID DESKTOP (scroll area, tampilkan semua) ===== */}
            <div className="hidden lg:block lg:max-h-[75vh] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 pb-4 transition-all duration-300">
                {filteredTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </div>

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500">Tidak ada template dalam kategori ini</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </section>
  );
};

export default Gallery;
