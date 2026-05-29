"use client";

import { FileText, Image as ImageIcon, Shield, Zap, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMode } from "@/context/ModeContext";
import { cn } from "@/lib/utils";

export default function Footer() {
  const { mode } = useMode();
  const isPdf = mode === "pdf";

  return (
    <footer className={cn(
      "border-t transition-colors duration-300",
      isPdf ? "border-slate-900 bg-slate-950 text-slate-400" : "border-cyan-950/40 bg-slate-950 text-slate-400"
    )}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Brand */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center rounded-lg p-2 shadow-lg transition-colors",
                isPdf ? "bg-gradient-to-r from-rose-500 to-orange-600" : "bg-gradient-to-r from-cyan-500 to-indigo-600"
              )}>
                {isPdf ? <FileText className="size-5 text-white" /> : <ImageIcon className="size-5 text-white" />}
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Hypa<span className={cn(
                  "bg-clip-text text-transparent bg-gradient-to-r",
                  isPdf ? "from-rose-400 to-orange-500" : "from-cyan-400 to-indigo-500"
                )}>{isPdf ? "PDF" : "Image"}</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              A premium, full-featured client-side tool suite that runs operations directly in your browser. Blazing fast speeds, absolute data privacy, and clean layouts.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Shield className={cn("size-4", isPdf ? "text-emerald-400" : "text-cyan-400")} />
                <span>Files are processed in-browser. Zero server uploads for client tools.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Zap className={cn("size-4", isPdf ? "text-rose-400" : "text-cyan-400")} />
                <span>No local software installs required. Simply upload and compile.</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">
              Categories
            </h3>
            {isPdf ? (
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/#organize" className="hover:text-rose-400 transition-colors">
                    Organize PDF
                  </Link>
                </li>
                <li>
                  <Link href="/#to-pdf" className="hover:text-rose-400 transition-colors">
                    Convert to PDF
                  </Link>
                </li>
                <li>
                  <Link href="/#from-pdf" className="hover:text-rose-400 transition-colors">
                    Convert from PDF
                  </Link>
                </li>
                <li>
                  <Link href="/#edit" className="hover:text-rose-400 transition-colors">
                    Edit PDF
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/#modify" className="hover:text-cyan-400 transition-colors">
                    Modify Image
                  </Link>
                </li>
                <li>
                  <Link href="/#convert" className="hover:text-cyan-400 transition-colors">
                    Convert Image
                  </Link>
                </li>
                <li>
                  <Link href="/#editor" className="hover:text-cyan-400 transition-colors">
                    Creative Tools
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Security Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">
              Privacy & Security
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-slate-300 font-medium">100% Secure:</span> All processing happens locally on your device. No third-party trackers or servers store your documents.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Hypa{isPdf ? "PDF" : "Image"}. Licensed under MIT.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <span className="flex items-center gap-1 text-slate-400">
              <Sparkles className={cn("size-3", isPdf ? "text-orange-400" : "text-cyan-400")} /> Built for Lance
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
