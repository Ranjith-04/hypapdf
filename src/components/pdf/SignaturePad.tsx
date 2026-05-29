"use client";

import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Trash2, Edit3, Type, Upload } from "lucide-react";

interface SignaturePadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (signatureDataUrl: string) => void;
}

export default function SignaturePad({ open, onOpenChange, onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [selectedFont, setSelectedFont] = useState("font-serif font-semibold italic");
  const [activeTab, setActiveTab] = useState("draw");

  // Canvas drawing logic
  useEffect(() => {
    if (activeTab !== "draw" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear and draw background lines
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#ffffff"; // draw in white/slate
    
    // Optional placeholder text in background
    ctx.fillStyle = "#334155";
    ctx.font = "14px Inter";
    ctx.fillText("Draw your signature here...", 15, 30);
  }, [open, activeTab]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background placeholder on first stroke
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw initial placeholder
    ctx.fillStyle = "#334155";
    ctx.font = "14px Inter";
    ctx.fillText("Draw your signature here...", 15, 30);
  };

  // Convert canvas drawing to PNG data URL and save
  const handleSaveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas to save in dark blue/black ink color (suitable for signatures)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Draw ink color
    tempCtx.drawImage(canvas, 0, 0);
    // Convert black pixels or white lines into a clean dark blue ink color
    const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imgData.data;

    // If canvas has white strokes, map them to blue ink (e.g. RGB 15, 23, 42 or 30, 41, 59)
    for (let i = 0; i < data.length; i += 4) {
      const isStroke = data[i] > 100 && data[i + 1] > 100 && data[i + 2] > 100;
      if (isStroke) {
        data[i] = 12;      // R
        data[i + 1] = 74;  // G
        data[i + 2] = 96;  // B (deep signature blue)
        data[i + 3] = 255; // opacity
      } else {
        data[i + 3] = 0;   // transparent background
      }
    }
    tempCtx.putImageData(imgData, 0, 0);

    onSave(tempCanvas.toDataURL("image/png"));
    onOpenChange(false);
  };

  // Convert typed text to PNG data URL
  const handleSaveTyped = () => {
    if (!typedText) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply handwriting style
    ctx.fillStyle = "#0c4a60"; // deep signature blue
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let font = "bold italic 48px Georgia";
    if (selectedFont.includes("font-mono")) font = "bold italic 48px Courier New";
    if (selectedFont.includes("sans")) font = "bold italic 48px Arial";

    ctx.font = font;
    ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);

    onSave(canvas.toDataURL("image/png"));
    onOpenChange(false);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onSave(event.target.result as string);
        onOpenChange(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Edit3 className="size-5 text-rose-500" /> Create Your Signature
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a custom signature to stamp on your PDF documents.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 bg-slate-900 border border-slate-800/80 rounded-lg p-1">
            <TabsTrigger value="draw" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
              <Edit3 className="size-4 mr-1.5 inline" /> Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
              <Type className="size-4 mr-1.5 inline" /> Type
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
              <Upload className="size-4 mr-1.5 inline" /> Upload
            </TabsTrigger>
          </TabsList>

          {/* DRAW TAB */}
          <TabsContent value="draw" className="mt-4 flex flex-col gap-4">
            <div className="w-full h-52 bg-slate-900 border border-slate-800/60 rounded-xl relative overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" className="rounded-full" onClick={handleClear}>
                <Trash2 className="size-4 mr-1.5" /> Clear
              </Button>
              <Button size="sm" className="rounded-full bg-rose-500 hover:bg-rose-600" onClick={handleSaveDrawing}>
                Create Signature
              </Button>
            </div>
          </TabsContent>

          {/* TYPE TAB */}
          <TabsContent value="type" className="mt-4 flex flex-col gap-4">
            <Input
              type="text"
              placeholder="Type your name..."
              className="bg-slate-900 border-slate-800 focus-visible:ring-rose-500"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
            />

            {/* Font Picker */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "Elegant", class: "font-serif font-semibold italic text-emerald-400" },
                { name: "Modern", class: "font-sans font-extrabold italic text-sky-400" },
                { name: "Monospace", class: "font-mono font-bold italic text-orange-400" },
              ].map((font) => (
                <button
                  key={font.name}
                  onClick={() => setSelectedFont(font.class)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedFont === font.class
                      ? "border-rose-500 bg-rose-500/10 text-white"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <span className={font.class}>{font.name}</span>
                </button>
              ))}
            </div>

            {/* Live Preview */}
            <div className="w-full h-28 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center">
              {typedText ? (
                <span className={`text-4xl ${selectedFont}`}>{typedText}</span>
              ) : (
                <span className="text-slate-500 text-sm">Preview will appear here...</span>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                className="rounded-full bg-rose-500 hover:bg-rose-600"
                onClick={handleSaveTyped}
                disabled={!typedText}
              >
                Create Signature
              </Button>
            </div>
          </TabsContent>

          {/* UPLOAD TAB */}
          <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
            <div className="w-full h-40 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 gap-3 hover:border-slate-700 transition-colors">
              <Upload className="size-8 text-slate-500" />
              <div className="text-center">
                <span className="text-sm font-semibold text-rose-400 cursor-pointer hover:underline relative">
                  Upload a file
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                  />
                </span>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, or SVG up to 5MB</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
