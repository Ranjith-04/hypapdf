"use client";

import { useEffect, useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Loader2, RotateCw, Trash2, GripHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Configure pdfjs worker using unpkg CDN matching the package.json version 5.7.284
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs";

interface PDFPageRendererProps {
  fileBuffer: ArrayBuffer;
  mode: "view" | "rotate" | "organize" | "sign";
  // Organize mode state updates
  pageOrder?: number[];
  setPageOrder?: (order: number[]) => void;
  // Rotate mode state updates
  pageRotations?: Record<number, number>;
  setPageRotations?: (rotations: Record<number, number>) => void;
  // Sign mode placement helper
  onSignPlacement?: (pageIndex: number, clientX: number, clientY: number, containerRect: DOMRect) => void;
  signaturePreview?: string | null;
}

export default function PDFPageRenderer({
  fileBuffer,
  mode,
  pageOrder,
  setPageOrder,
  pageRotations,
  setPageRotations,
  onSignPlacement,
  signaturePreview,
}: PDFPageRendererProps) {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<string[]>([]); // Data URLs of rendered page previews
  const [numPages, setNumPages] = useState(0);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Load PDF and render all pages as images for fluid React manipulation
  useEffect(() => {
    async function loadPDF() {
      try {
        setLoading(true);
        // Create copy of buffer to avoid locking issues
        const bufferCopy = fileBuffer.slice(0);
        const loadingTask = pdfjsLib.getDocument({ data: bufferCopy });
        const pdf = await loadingTask.promise;
        pdfRef.current = pdf;
        const total = pdf.numPages;
        setNumPages(total);

        // Initialize page order if in organize mode
        if (mode === "organize" && setPageOrder && (!pageOrder || pageOrder.length === 0)) {
          setPageOrder(Array.from({ length: total }, (_, i) => i));
        }

        // Render each page to an image URL
        const renderedUrls: string[] = [];
        for (let i = 1; i <= total; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.8 }); // balanced scale for thumbnails
          
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          }).promise;

          renderedUrls.push(canvas.toDataURL("image/png"));
        }
        setPages(renderedUrls);
        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF pages:", err);
        setLoading(false);
      }
    }

    loadPDF();
  }, [fileBuffer]);

  // Handle visual rotation (Rotate mode)
  const handleRotatePage = (index: number) => {
    if (!pageRotations || !setPageRotations) return;
    const current = pageRotations[index] || 0;
    setPageRotations({
      ...pageRotations,
      [index]: (current + 90) % 360,
    });
  };

  // Handle page deletion (Organize mode)
  const handleDeletePage = (index: number) => {
    if (!pageOrder || !setPageOrder) return;
    setPageOrder(pageOrder.filter((i) => i !== index));
  };

  // Drag and drop sorting for Organize PDF (simplified client-side sort helper)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    if (mode !== "organize") return;
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (mode !== "organize" || draggedIndex === null || draggedIndex === targetIdx || !pageOrder || !setPageOrder) return;

    const newOrder = [...pageOrder];
    // Swap positions
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIdx, 0, draggedItem);
    
    setDraggedIndex(targetIdx);
    setPageOrder(newOrder);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px] gap-3">
        <Loader2 className="size-8 text-rose-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium animate-pulse">Rendering high-fidelity page thumbnails...</p>
      </div>
    );
  }

  // Render thumbnails for Rotate/Organize/Sign modes
  const visiblePagesIndices = mode === "organize" && pageOrder ? pageOrder : Array.from({ length: numPages }, (_, i) => i);

  return (
    <div className="w-full max-h-[70vh] overflow-y-auto pr-2">
      {visiblePagesIndices.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
          All pages deleted. Use the reset or add more files.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 p-4">
          {visiblePagesIndices.map((originalIndex, orderIndex) => {
            const pageUrl = pages[originalIndex];
            const rotation = pageRotations ? pageRotations[originalIndex] || 0 : 0;

            return (
              <div
                key={`${originalIndex}-${orderIndex}`}
                draggable={mode === "organize"}
                onDragStart={() => handleDragStart(orderIndex)}
                onDragOver={(e) => handleDragOver(e, orderIndex)}
                onDragEnd={() => setDraggedIndex(null)}
                className={`relative group bg-slate-900/40 rounded-xl p-3 border border-slate-800 flex flex-col items-center gap-3 transition-all ${
                  mode === "organize" ? "cursor-grab active:cursor-grabbing" : ""
                } ${draggedIndex === orderIndex ? "opacity-30 border-rose-500" : "hover:border-slate-700 hover:bg-slate-900/80"}`}
              >
                {/* Page Number Badge */}
                <span className="absolute top-2 left-2 size-6 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 z-10">
                  {orderIndex + 1}
                </span>

                {/* Handle for drag and drop */}
                {mode === "organize" && (
                  <span className="absolute top-2 right-2 text-slate-500 group-hover:text-slate-300 pointer-events-none">
                    <GripHorizontal className="size-4" />
                  </span>
                )}

                {/* Image Preview Container */}
                <div
                  className="w-full aspect-[1/1.4] bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-md relative"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: "transform 0.2s ease-in-out",
                  }}
                  onClick={(e) => {
                    if (mode === "sign" && onSignPlacement && signaturePreview) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      onSignPlacement(originalIndex, e.clientX, e.clientY, rect);
                    }
                  }}
                >
                  {pageUrl && (
                    <img
                      src={pageUrl}
                      alt={`Page ${originalIndex + 1}`}
                      className="max-w-full max-h-full object-contain pointer-events-none select-none"
                    />
                  )}
                  {/* Cursor preview in Sign mode */}
                  {mode === "sign" && signaturePreview && (
                    <div className="absolute inset-0 bg-rose-500/10 opacity-0 hover:opacity-100 flex items-center justify-center cursor-crosshair transition-opacity duration-200">
                      <div className="bg-rose-500/80 text-white rounded-lg px-2 py-1 text-[9px] font-semibold flex items-center gap-1 shadow-lg shadow-rose-500/30">
                        <Plus className="size-3" /> Click to Place
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions overlay */}
                <div className="flex gap-2 w-full justify-center">
                  {mode === "rotate" && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-8 rounded-full border border-slate-800 bg-slate-950/80 hover:bg-slate-900 text-slate-300"
                      onClick={() => handleRotatePage(originalIndex)}
                    >
                      <RotateCw className="size-3.5" />
                    </Button>
                  )}
                  {mode === "organize" && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="size-8 rounded-full bg-red-950/30 border border-red-500/30 hover:bg-red-500 text-red-300"
                      onClick={() => handleDeletePage(originalIndex)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
