import { FileText, Shield, Zap, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Brand */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-orange-600 p-2 shadow-lg">
                <FileText className="size-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Hypa<span className="bg-gradient-to-r from-rose-400 to-orange-500 bg-clip-text text-transparent">PDF</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              A premium, full-featured iLovePDF clone that runs most operations directly in your browser. Blazing fast speeds, absolute data privacy, and clean layouts.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Shield className="size-4 text-emerald-400" />
                <span>Files are processed in-browser. Zero server uploads for client tools.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Zap className="size-4 text-rose-400" />
                <span>Powered by LibreOffice CLI for high-fidelity office conversions.</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">
              Categories
            </h3>
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
          </div>

          {/* Security Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">
              Privacy & Security
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-slate-300 font-medium">100% Secure:</span> All processing happens client-side using WebAssembly or in secure local server sandboxes.
              </li>
              <li className="mt-2 text-xs text-slate-400">
                No third-party trackers or servers store your documents. Your files remain exclusively yours.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 HypaPDF. Open Source. Licensed under MIT.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <span className="flex items-center gap-1 text-slate-400">
              <Sparkles className="size-3 text-orange-400" /> Built for lance
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
