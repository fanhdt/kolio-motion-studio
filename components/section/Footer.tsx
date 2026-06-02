// components/Footer.tsx
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-gray-100">
      {/* Garis hitam tetap pakai tinggi tetap */}
      <div className="w-full h-px bg-gray-200" />

      <div
        className="w-full px-[5vw] py-[4vw] md:py-[3vw]"
        /* Padding horizontal dan vertikal proporsional terhadap lebar viewport */
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-[6vw] md:gap-[4vw]">
          {/* Bagian Kiri */}
          <div className="flex flex-col gap-[3vw]">
            <div>
              <h2 className="font-semibold tracking-wide text-xl">Kolio motion</h2>
              <nav className="flex flex-col mt-[2vw] gap-[1.5vw]" style={{ fontSize: "clamp(0.875rem, 1.4vw, 1.125rem)" }}>
                {["Home", "Produk", "Tentang", "Bisnis"].map((item) => (
                  <Link key={item} href="#" className="hover:translate-x-1 transition-transform duration-200 inline-block">
                    {item}
                  </Link>
                ))}
              </nav>
            </div>
            <p className="text-black" style={{ fontSize: "clamp(0.75rem, 1.2vw, 0.9rem)" }}>
              Copyright © 2013 - {new Date().getFullYear()} kolio motion. All Rights Reserved.
            </p>
          </div>

          {/* Bagian Kanan */}
          <div className="flex flex-col items-start md:items-end gap-[2vw]">
            <h1 className="font-bold tracking-tight leading-none" style={{ fontSize: "clamp(2rem, 8vw, 5rem)" }}>
              Kolio Motion
            </h1>
            <div className="flex items-center gap-[3vw] md:gap-[2vw] mt-[1vw]">
              {/* YouTube */}
              <Link href="#" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                <Image src="/logo/youtube.svg" alt="YouTube" width={20} height={20} className="w-[4vw] h-[4vw] md:w-[2.5vw] md:h-[2.5vw] max-w-6 max-h-6" />
              </Link>
              {/* Instagram */}
              <Link href="#" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                <Image src="/logo/instagram.svg" alt="Instagram" width={20} height={20} className="w-[4vw] h-[4vw] md:w-[2.5vw] md:h-[2.5vw] max-w-6 max-h-6" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
