"use client"; // wajib agar dynamic + ssr:false bisa dipakai

// app/editor/[slug]/page.tsx

import dynamic from "next/dynamic";

const VideoEditor = dynamic(() => import("@/components/editor/VideoEditor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 font-medium">Memuat editor...</p>
      </div>
    </div>
  ),
});

export default function EditorPage() {
  return <VideoEditor />;
}
