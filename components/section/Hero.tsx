// src/components/sections/Hero.tsx

import React from "react";
import Button from "../ui/Button";

const Hero = () => {
  return (
    <section className="bg-gray-100 text-gray-900 w-full min-h-screen flex flex-col justify-center">
      <div className="mx-auto w-full px-4 sm:px-6 md:px-8 pt-20 sm:pt-28 md:pt-36 lg:pt-44 xl:pt-52">
        <div className="max-w-4xl mx-auto text-center">
          {/* Heading dengan ukuran font responsif bertahap */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold mb-4 sm:mb-5 md:mb-6 leading-tight">Template motion untuk brand anda</h1>

          {/* Paragraf dengan ukuran yang ikut membesar proporsional */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-6 sm:mb-7 md:mb-8 opacity-90 px-2 sm:px-4">Jelajahi dan temukan beragam aset gerak yang dapat Anda gunakan untuk merek Anda.</p>

          <div className="flex gap-3 sm:gap-4 justify-center pt-4">
            <Button variant="primary" size="md">
              Mulai Gratis Sekarang
            </Button>
          </div>
        </div>

        {/* Divider "Terdapat 30+ aset..." */}
        <div className="flex items-center justify-center gap-4 mt-16 sm:mt-24 lg:mt-32 mb-8 sm:mb-10 md:mb-12 max-w-4xl mx-auto">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs sm:text-sm md:text-base text-gray-500 whitespace-nowrap">Terdapat 30+ aset yang bisa anda gunakan</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
