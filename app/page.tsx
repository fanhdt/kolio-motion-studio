import React from "react";
import Hero from "@/components/section/Hero";
import Gallery from "@/components/section/Gallery";
import About from "@/components/section/About";
import Footer from "@/components/section/Footer";

export default function page() {
  return (
    <>
      <Hero />
      <Gallery />
      <About />
      <Footer />
    </>
  );
}
