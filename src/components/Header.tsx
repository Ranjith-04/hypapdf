"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Menu, X, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-90">
            <div className="flex items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-orange-600 p-2 shadow-lg shadow-rose-500/20">
              <FileText className="size-5 text-white" />
            </div>
            <span>
              Hypa<span className="bg-gradient-to-r from-rose-400 to-orange-500 bg-clip-text text-transparent">PDF</span>
            </span>
          </Link>
          <div className="hidden items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300 md:flex">
            <Sparkles className="size-3" />
            Pro Edition
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/#organize" className="text-sm font-medium text-slate-300 hover:text-rose-400 transition-colors">
            Organize
          </Link>
          <Link href="/#to-pdf" className="text-sm font-medium text-slate-300 hover:text-rose-400 transition-colors">
            Convert to PDF
          </Link>
          <Link href="/#from-pdf" className="text-sm font-medium text-slate-300 hover:text-rose-400 transition-colors">
            Convert from PDF
          </Link>
          <Link href="/#edit" className="text-sm font-medium text-slate-300 hover:text-rose-400 transition-colors">
            Edit
          </Link>
          <Link href="/#security" className="text-sm font-medium text-slate-300 hover:text-rose-400 transition-colors">
            Security
          </Link>
        </nav>

        {/* CTA */}
        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            Local Processing Enabled
          </div>
          <Link href="/">
            <Button size="sm" className="rounded-full bg-gradient-to-r from-rose-500 to-orange-600 font-medium text-white shadow-lg shadow-rose-500/20 hover:opacity-90 border-0">
              Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-950 px-4 py-4 md:hidden flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href="/#organize"
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            Organize
          </Link>
          <Link
            href="/#to-pdf"
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            Convert to PDF
          </Link>
          <Link
            href="/#from-pdf"
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            Convert from PDF
          </Link>
          <Link
            href="/#edit"
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            Edit PDF
          </Link>
          <Link
            href="/#security"
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            Security
          </Link>
          <div className="h-px bg-slate-800 my-2"></div>
          <div className="flex items-center justify-between px-3 py-1 text-xs text-emerald-400 font-medium">
            <span>Local Processing</span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <Link href="/" className="w-full">
            <Button className="w-full rounded-full bg-gradient-to-r from-rose-500 to-orange-600 text-white" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
