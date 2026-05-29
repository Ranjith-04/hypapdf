"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TOOLS, CATEGORIES, PDFTool, ToolCategory } from "@/lib/toolsConfig";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | "all">("all");
  const [isPending, startTransition] = useTransition();

  // Filter tools based on search and category
  const filteredTools = TOOLS.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-50 antialiased overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Dynamic Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] size-[500px] rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] size-[600px] rounded-full bg-orange-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] size-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Shared Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-6 mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
            <Icons.Zap className="size-3 text-orange-400" />
            100% Client-Side & Local Conversion Engine
          </div>
          <h1 className="text-4xl font-extrabold sm:text-6xl tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Every PDF Tool You Need
          </h1>
          <p className="max-w-2xl text-lg text-slate-400">
            Split, merge, compress, protect, unlock, sign, and convert PDF documents in your browser. Blazing fast, 100% free, and completely secure.
          </p>

          {/* Search Bar Container */}
          <div className="w-full max-w-lg mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Icons.Search className="size-5 text-slate-500" />
            </div>
            <Input
              type="text"
              placeholder="Search for tools (e.g., Merge, Split, Word, Sign...)"
              className="pl-11 pr-4 py-6 w-full rounded-full border-slate-800 bg-slate-900/60 text-white placeholder-slate-500 focus-visible:ring-rose-500/50 shadow-inner backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Category Tabs */}
        <section className="mb-12">
          <div className="flex flex-wrap gap-2 justify-center border-b border-slate-900 pb-4">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer border",
                selectedCategory === "all"
                  ? "bg-gradient-to-r from-rose-500 to-orange-600 text-white border-transparent shadow-lg shadow-rose-500/20"
                  : "bg-slate-900/40 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:bg-slate-900/80"
              )}
            >
              All Tools
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer border",
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-rose-500 to-orange-600 text-white border-transparent shadow-lg shadow-rose-500/20"
                    : "bg-slate-900/40 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:bg-slate-900/80"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Tools Grid Section */}
        <section>
          {filteredTools.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
              <Icons.FileQuestion className="size-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300">No tools match your query</h3>
              <p className="text-sm text-slate-500 mt-1">Try searching for other terms like &quot;merge&quot; or &quot;excel&quot;.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredTools.map((tool) => {
                const Icon = Icons[tool.iconName] as React.ComponentType<{ className?: string }>;
                return (
                  <Link href={`/tool/${tool.slug}`} key={tool.slug} className="group">
                    <Card className="h-full border-slate-800/60 bg-slate-900/30 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-700/80 hover:bg-slate-900/60 relative overflow-hidden">
                      {/* Top Accent Gradient Border */}
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-rose-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <CardHeader className="flex flex-col gap-4 p-6">
                        {/* Icon Container with color coding */}
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md group-hover:scale-110 transition-transform duration-300",
                          tool.colorClass
                        )}>
                          {Icon && <Icon className="size-6 text-white" />}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <CardTitle className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors duration-300 flex items-center gap-1.5 justify-between">
                            {tool.title}
                            {tool.requiresLibreOffice && (
                              <Badge variant="outline" className="text-[9px] border-amber-500/30 bg-amber-500/10 text-amber-300 px-1 py-0 font-normal">
                                Server API
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-400 leading-relaxed font-normal group-hover:text-slate-300 transition-colors duration-300">
                            {tool.description}
                          </CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
