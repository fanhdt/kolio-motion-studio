// components/About.tsx

import React from "react";
import { FolderOpen, Video, Info } from "lucide-react";

export default function About() {
  return (
    <section className="bg-gray-100 py-12 md:py-16 lg:py-20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Layout sama seperti Gallery */}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Spacer kiri */}
          <div className="hidden lg:block lg:w-72 xl:w-80 shrink-0" />

          {/* Konten kanan */}
          <div className="flex-1 min-w-0">
            <div className="space-y-14">
              {/* Bagian 1 */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">Apa itu motion grafis?</h2>

                <div className="text-gray-700 text-sm md:text-base leading-relaxed space-y-4">
                  <p>Motion graphics adalah bentuk desain visual yang menggabungkan elemen grafis dengan animasi untuk menciptakan tampilan yang hidup dan dinamis.</p>

                  <p>Motion graphics digunakan untuk kebutuhan komunikasi visual seperti video promosi, konten media sosial, opening title, hingga presentasi digital.</p>

                  <p className="italic text-gray-800">Motion graphics menjadi alat yang efektif karena mampu menggabungkan desain dan gerakan menjadi visual yang komunikatif dan engaging.</p>
                </div>
              </div>

              {/* Bagian 2 */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">Bagaimana cara menggunakan?</h2>

                <div className="space-y-5 text-gray-700 text-sm md:text-base leading-relaxed">
                  <p>Pilih aset motion grafis yang Anda inginkan lalu unduh file template yang tersedia.</p>

                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Video size={18} className="text-gray-500 mt-0.5 shrink-0" />

                      <span>
                        <strong>Video MP4</strong> — siap pakai langsung.
                      </span>
                    </li>

                    <li className="flex items-start gap-3">
                      <FolderOpen size={18} className="text-gray-500 mt-0.5 shrink-0" />

                      <span>
                        <strong>Template After Effects</strong> — file <code className="bg-gray-100 px-1 py-0.5 rounded">.aep</code>
                      </span>
                    </li>
                  </ul>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 md:p-6">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-800 uppercase tracking-wide text-sm mb-4">
                      <Info size={15} />
                      Langkah-langkah
                    </h3>

                    <ol className="space-y-2 text-sm md:text-base text-gray-700 list-decimal list-inside">
                      <li>Ekstrak file ZIP.</li>
                      <li>Buka file project.aep.</li>
                      <li>Edit teks dan warna.</li>
                      <li>Render menjadi video MP4.</li>
                      <li>Gunakan untuk proyek Anda.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* End content */}
        </div>
      </div>
    </section>
  );
}
