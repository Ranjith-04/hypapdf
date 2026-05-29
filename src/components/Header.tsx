"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Image as ImageIcon, Menu, X, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMode } from "@/context/ModeContext";
import { cn } from "@/lib/utils";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mode, toggleMode } = useMode();

  const isPdf = mode === "pdf";

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors duration-300",
      isPdf ? "border-slate-800/80 bg-slate-950/80" : "border-cyan-950/80 bg-slate-950/80"
    )}>
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-90">
            <div className={cn(
              "flex items-center justify-center rounded-lg p-2 shadow-lg transition-all duration-300",
              isPdf 
                ? "bg-gradient-to-r from-rose-500 to-orange-600 shadow-rose-500/20" 
                : "bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-cyan-500/20"
            )}>
              {isPdf ? (
                <FileText className="size-5 text-white animate-in zoom-in duration-300" />
              ) : (
                <ImageIcon className="size-5 text-white animate-in zoom-in duration-300" />
              )}
            </div>
            <span>
              Hypa
              <span className={cn(
                "bg-clip-text text-transparent bg-gradient-to-r transition-all duration-300",
                isPdf ? "from-rose-400 to-orange-500" : "from-cyan-400 to-indigo-500"
              )}>
                {isPdf ? "PDF" : "Image"}
              </span>
            </span>
          </Link>
          <div className={cn(
            "hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium md:flex transition-all duration-300",
            isPdf 
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300" 
              : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
          )}>
            <Sparkles className="size-3" />
            Pro Edition
          </div>
        </div>

        {/* Dynamic Mode Switcher (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full p-1 shadow-inner">
          <button
            onClick={() => { if (mode !== "pdf") toggleMode(); }}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              isPdf 
                ? "bg-gradient-to-r from-rose-500 to-orange-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <FileText className="size-3.5" /> PDF Suite
          </button>
          <button
            onClick={() => { if (mode !== "image") toggleMode(); }}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              !isPdf 
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <ImageIcon className="size-3.5" /> Image Suite
          </button>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-6 md:flex">
          {isPdf ? (
            <>
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
            </>
          ) : (
            <>
              <Link href="/#modify" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">
                Modify
              </Link>
              <Link href="/#convert" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">
                Convert
              </Link>
              <Link href="/#editor" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">
                Creative Tools
              </Link>
            </>
          )}
        </nav>

        {/* Action Button Section */}
        <div className="hidden items-center gap-4 md:flex">
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition-colors",
            isPdf ? "text-emerald-400" : "text-cyan-400"
          )}>
            <span className="relative flex size-2">
              <span className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                isPdf ? "bg-emerald-400" : "bg-cyan-400"
              )}></span>
              <span className={cn(
                "relative inline-flex size-2 rounded-full",
                isPdf ? "bg-emerald-500" : "bg-cyan-500"
              )}></span>
            </span>
            Local Engine Active
          </div>
          <Link href="/">
            <Button 
              size="sm" 
              className={cn(
                "rounded-full font-medium text-white shadow-lg border-0 transition-all duration-300",
                isPdf 
                  ? "bg-gradient-to-r from-rose-500 to-orange-600 shadow-rose-500/20 hover:opacity-90" 
                  : "bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-cyan-500/20 hover:opacity-90"
              )}
            >
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-3">
          {/* Quick toggle mode for mobile */}
          <button
            onClick={toggleMode}
            className="p-2 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <RefreshCw className="size-4" />
          </button>
          
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-950 px-4 py-4 md:hidden flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-900/60 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Active Suite:</span>
            <span className={cn(
              "font-bold uppercase tracking-wider",
              isPdf ? "text-rose-400" : "text-cyan-400"
            )}>
              {isPdf ? "PDF Engine" : "Image Engine"}
            </span>
          </div>

          {isPdf ? (
            <>
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
            </>
          ) : (
            <>
              <Link
                href="/#modify"
                className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Modify
              </Link>
              <Link
                href="/#convert"
                className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Convert
              </Link>
              <Link
                href="/#editor"
                className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Creative Tools
              </Link>
            </>
          )}

          <div className="h-px bg-slate-800 my-2"></div>
          
          <Link href="/" className="w-full">
            <Button 
              className={cn(
                "w-full rounded-full text-white",
                isPdf ? "bg-gradient-to-r from-rose-500 to-orange-600" : "bg-gradient-to-r from-cyan-500 to-indigo-600"
              )} 
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
