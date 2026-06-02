"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Menu, User } from "lucide-react";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";

const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { isSignedIn } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { name: "Produk", href: "#", icon: null },
    { name: "Tentang", href: "#", icon: null },
    { name: "Bisnis", href: "#", icon: null },
  ];

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50 w-full 
          transition-all duration-300 ease-in-out
          ${scrolled ? "bg-[#2e2e2e]/95 backdrop-blur-md shadow-lg" : "bg-[#2e2e2e] shadow-md"}
        `}
      >
        <div className="px-4 sm:px-6 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between mx-auto">
            {/* Logo */}
            <div className="flex items-center shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[#F2F2F2] cursor-pointer whitespace-nowrap">Kolio Motion</h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-[#B1B1B1] font-medium">
              {menuItems.map((item, index) => (
                <Link key={index} href={item.href} className="relative hover:text-white transition duration-200 group">
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search */}
              <div ref={searchRef} className="relative flex items-center">
                <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-700 transition z-10" aria-label="Search">
                  <Search size={18} className="text-white sm:size-5" />
                </button>

                {isSearchOpen && (
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2">
                    <div className="flex items-center bg-white rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-right-2 duration-200">
                      <input type="text" placeholder="Search products..." className="outline-none text-sm py-1.5 sm:py-2 px-3 sm:px-4 w-48 sm:w-64" autoFocus />
                      <button onClick={() => setIsSearchOpen(false)} className="px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 transition">
                        <X size={16} className="text-gray-600 sm:size-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ========== AUTH AREA (DESKTOP) ========== */}
              <div className="hidden sm:block">
                {!isSignedIn ? (
                  <Link href="/sign-in">
                    <button className="bg-black text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg hover:bg-gray-800 transition text-sm sm:text-base">Login</button>
                  </Link>
                ) : (
                  <div className="flex items-center pt-1">
                    <UserButton />
                  </div>
                )}
              </div>

              {/* ========== AUTH AREA (MOBILE) ========== */}
              <div className="sm:hidden flex items-center">
                {!isSignedIn ? (
                  <Link href="/sign-in">
                    <button className="p-1.5 rounded-lg hover:bg-gray-700 transition" aria-label="Login">
                      <User size={18} className="text-white" />
                    </button>
                  </Link>
                ) : (
                  <div className="p-0.5">
                    <UserButton />
                  </div>
                )}
              </div>

              {/* Hamburger Menu */}
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-700 transition" aria-label="Menu">
                <Menu size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Slide from right */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 w-64 bg-[#2e2e2e] shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-white font-bold">Menu</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-700 transition">
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Mobile Menu Items */}
          <div className="flex-1 py-4">
            {menuItems.map((item, index) => (
              <Link key={index} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="block text-[#B1B1B1] hover:text-white hover:bg-gray-700 transition px-4 py-3">
                {item.name}
              </Link>
            ))}
          </div>

          {/* ========== MOBILE DRAWER FOOTER AUTH ========== */}
          <div className="p-4 border-t border-gray-700">
            {!isSignedIn ? (
              <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">Login</button>
              </Link>
            ) : (
              <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                <span className="text-sm text-gray-300 font-medium">Akun Saya</span>
                <UserButton />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden animate-in fade-in duration-200" onClick={() => setIsMobileMenuOpen(false)} />}
    </>
  );
};

export default Navbar;
