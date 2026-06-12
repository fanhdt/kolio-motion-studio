/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pindahkan 'turbopack' langsung ke root objek konfigurasi, bukan di dalam experimental
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        // Header COOP/COEP untuk semua halaman (wajib untuk ffmpeg.wasm)
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
      {
        // Izinkan video di-load oleh halaman dengan COEP
        source: "/videos/:path*",
        headers: [{ key: "Cross-Origin-Resource-Policy", value: "same-origin" }],
      },
      {
        // Izinkan poster/gambar juga
        source: "/posters/:path*",
        headers: [{ key: "Cross-Origin-Resource-Policy", value: "same-origin" }],
      },
    ];
  },
};

module.exports = nextConfig;
