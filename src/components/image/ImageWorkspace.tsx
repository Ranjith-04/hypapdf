"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageTool, IMAGE_TOOLS } from "@/lib/image/imageToolsConfig";
import {
  compressImage,
  resizeImage,
  cropImage,
  convertFormat,
  adjustPhoto,
  upscaleImage,
  removeBackground,
  watermarkImage,
  generateMeme,
  rotateImage,
  htmlToImage,
  blurAreas,
  BlurArea,
  fileToImage,
} from "@/lib/image/imageUtils";

interface ImageWorkspaceProps {
  slug: string;
}

export default function ImageWorkspace({ slug }: ImageWorkspaceProps) {
  const router = useRouter();
  const tool = IMAGE_TOOLS.find((t) => t.slug === slug) as ImageTool;

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // App Processing States
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState("");

  // Visual drag & drop state
  const [isDragActive, setIsDragActive] = useState(false);

  // Raw Image Info
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // --- TOOL CONFIGURATION STATES ---
  // 1. Compress
  const [compressionQuality, setCompressionQuality] = useState(0.75);

  // 2. Resize
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [originalAspectRatio, setOriginalAspectRatio] = useState(1);

  // 3. Crop (Visual Overlay percentages)
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 });

  // 4 & 5. Convert
  const [targetConvertFormat, setTargetConvertFormat] = useState<"jpeg" | "png" | "webp">("jpeg");

  // 6. Photo Editor Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [activeFilter, setActiveFilter] = useState<"none" | "grayscale" | "sepia" | "invert" | "blur">("none");

  // 7. Upscale
  const [upscaleFactor, setUpscaleFactor] = useState(2);

  // 8. Remove Background (color chroma-key)
  const [removeColor, setRemoveColor] = useState({ r: 255, g: 255, b: 255 });
  const [colorTolerance, setColorTolerance] = useState(30);

  // 9. Watermark
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [watermarkText, setWatermarkText] = useState("COPYRIGHT");
  const [watermarkFontSize, setWatermarkFontSize] = useState(40);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.4);
  const [watermarkRotation, setWatermarkRotation] = useState(45);
  const [watermarkColorHex, setWatermarkColorHex] = useState("#ffffff");
  const [watermarkImageFile, setWatermarkImageFile] = useState<File | null>(null);
  const [watermarkImageScale, setWatermarkImageScale] = useState(0.3);

  // 10. Meme
  const [memeTopText, setMemeTopText] = useState("");
  const [memeBottomText, setMemeBottomText] = useState("");

  // 11. Rotate
  const [rotationAngle, setRotationAngle] = useState(0);

  // 12. HTML to Image
  const [htmlCode, setHtmlCode] = useState(
    `<div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 40px; border-radius: 12px; text-align: center;">\n  <h1 style="margin: 0; font-size: 32px;">HypaImage</h1>\n  <p style="margin-top: 10px; font-size: 16px; opacity: 0.8;">HTML to Image Conversion Engine</p>\n</div>`
  );
  const [htmlWidth, setHtmlWidth] = useState(600);
  const [htmlHeight, setHtmlHeight] = useState(400);

  // 13. Blur Face / Custom Censoring
  const [blurAreasList, setBlurAreasList] = useState<BlurArea[]>([]);
  const [blurRadius, setBlurRadius] = useState(20);

  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!tool) {
      router.push("/");
    }
  }, [tool, router]);

  // Load natural dimensions once image changes
  useEffect(() => {
    if (previewUrls.length > 0 && activePreviewIndex < previewUrls.length) {
      const img = new Image();
      img.onload = () => {
        setNaturalWidth(img.naturalWidth);
        setNaturalHeight(img.naturalHeight);
        setResizeWidth(img.naturalWidth);
        setResizeHeight(img.naturalHeight);
        setOriginalAspectRatio(img.naturalWidth / img.naturalHeight);
      };
      img.src = previewUrls[activePreviewIndex];
    }
  }, [previewUrls, activePreviewIndex]);

  // Prepopulate if tool is HTML to Image (which doesn't require uploading an initial file)
  useEffect(() => {
    if (slug === "html-to-image") {
      // Mock a dummy file to bypass the "no file selected" state
      const dummyFile = new File(["html-renderer"], "html-template.png", { type: "image/png" });
      setFiles([dummyFile]);
      setPreviewUrls([""]);
    }
  }, [slug]);

  if (!tool) return null;

  const Icon = Icons[tool.iconName] as React.ComponentType<{ className?: string }>;

  // Handle local File loading
  const loadFiles = async (fileList: File[]) => {
    setStatus("uploading");
    setProgress(30);
    try {
      const urls = fileList.map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
      setFiles(fileList);
      setActivePreviewIndex(0);
      setStatus("idle");
      setProgress(0);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error loading selected image file(s).");
      setStatus("failed");
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadFiles(Array.from(e.target.files));
    }
  };

  // Sample color from preview canvas (Background Removal Tool)
  const sampleColorFromCoords = (clientX: number, clientY: number, containerRect: DOMRect) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      // Map browser click to image natural coordinates
      const clickX = ((clientX - containerRect.left) / containerRect.width) * img.naturalWidth;
      const clickY = ((clientY - containerRect.top) / containerRect.height) * img.naturalHeight;

      const pixel = ctx.getImageData(Math.floor(clickX), Math.floor(clickY), 1, 1).data;
      setRemoveColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
    };
    img.src = previewUrls[activePreviewIndex];
  };

  // Add a blur censor box on click (Blur Face Tool)
  const addBlurAreaFromClick = (clientX: number, clientY: number, containerRect: DOMRect) => {
    // Map browser click to image natural coordinates
    const clickX = ((clientX - containerRect.left) / containerRect.width) * naturalWidth;
    const clickY = ((clientY - containerRect.top) / containerRect.height) * naturalHeight;

    const widthPercent = (60 / containerRect.width) * naturalWidth;
    const heightPercent = (60 / containerRect.height) * naturalHeight;

    setBlurAreasList([
      ...blurAreasList,
      {
        x: Math.round(clickX - widthPercent / 2),
        y: Math.round(clickY - heightPercent / 2),
        width: Math.round(widthPercent),
        height: Math.round(heightPercent),
      },
    ]);
  };

  // Main Image Execution Logic
  const handleProcess = async () => {
    if (files.length === 0) return;
    setStatus("processing");
    setProgress(20);
    setErrorMessage("");

    try {
      const activeFile = files[activePreviewIndex];
      let outputBlob: Blob | null = null;
      let finalFilename = "hypaimage-output.jpg";

      if (slug === "compress-image") {
        outputBlob = await compressImage(activeFile, compressionQuality);
        const ext = activeFile.type.includes("png") ? "png" : "jpg";
        finalFilename = `compressed-${activeFile.name.split(".")[0]}.${ext}`;
      } else if (slug === "resize-image") {
        outputBlob = await resizeImage(activeFile, resizeWidth, resizeHeight, activeFile.type);
        const ext = activeFile.type.split("/")[1] || "png";
        finalFilename = `resized-${activeFile.name.split(".")[0]}.${ext}`;
      } else if (slug === "crop-image") {
        const cropX = Math.round((cropBox.x / 100) * naturalWidth);
        const cropY = Math.round((cropBox.y / 100) * naturalHeight);
        const cropWidth = Math.round((cropBox.width / 100) * naturalWidth);
        const cropHeight = Math.round((cropBox.height / 100) * naturalHeight);
        outputBlob = await cropImage(activeFile, { x: cropX, y: cropY, width: cropWidth, height: cropHeight }, activeFile.type);
        const ext = activeFile.type.split("/")[1] || "png";
        finalFilename = `cropped-${activeFile.name.split(".")[0]}.${ext}`;
      } else if (slug === "convert-to-jpg") {
        outputBlob = await convertFormat(activeFile, "jpeg");
        finalFilename = `${activeFile.name.split(".")[0]}-converted.jpg`;
      } else if (slug === "convert-from-jpg") {
        outputBlob = await convertFormat(activeFile, targetConvertFormat);
        finalFilename = `${activeFile.name.split(".")[0]}-converted.${targetConvertFormat}`;
      } else if (slug === "photo-editor") {
        outputBlob = await adjustPhoto(activeFile, {
          brightness,
          contrast,
          saturation,
          filter: activeFilter,
        }, activeFile.type);
        const ext = activeFile.type.split("/")[1] || "png";
        finalFilename = `edited-${activeFile.name.split(".")[0]}.${ext}`;
      } else if (slug === "upscale-image") {
        outputBlob = await upscaleImage(activeFile, upscaleFactor, activeFile.type);
        const ext = activeFile.type.split("/")[1] || "png";
        finalFilename = `upscaled-${activeFile.name.split(".")[0]}.${ext}`;
      } else if (slug === "remove-background") {
        outputBlob = await removeBackground(activeFile, removeColor, colorTolerance);
        finalFilename = `no-bg-${activeFile.name.split(".")[0]}.png`;
      } else if (slug === "watermark-image") {
        outputBlob = await watermarkImage(activeFile, {
          type: watermarkType,
          text: watermarkText,
          textColor: watermarkColorHex,
          fontSize: watermarkFontSize,
          opacity: watermarkOpacity,
          rotation: watermarkRotation,
          watermarkImage: watermarkImageFile || undefined,
          imageScale: watermarkImageScale,
        }, activeFile.type);
        const ext = activeFile.type.split("/")[1] || "png";
        finalFilename = `watermarked-${activeFile.name.split(".")[0]}.${ext}`;
      } else if (slug === "meme-generator") {
        outputBlob = await generateMeme(activeFile, memeTopText, memeBottomText, activeFile.type);
        const ext = activeFile.type.split("/")[1] || "png";
        finalFilename = `meme-${activeFile.name.split(".")[0]}.${ext}`;
      } else if (slug === "rotate-image") {
        outputBlob = await rotateImage(activeFile, rotationAngle, activeFile.type);
        const ext = activeFile.type.split("/")[1] || "png";
        finalFilename = `rotated-${activeFile.name.split(".")[0]}.${ext}`;
      } else if (slug === "html-to-image") {
        outputBlob = await htmlToImage(htmlCode, htmlWidth, htmlHeight);
        finalFilename = `html-render.png`;
      } else if (slug === "blur-face") {
        if (blurAreasList.length === 0) throw new Error("Please click on the preview image to add one or more censoring blur zones.");
        outputBlob = await blurAreas(activeFile, blurAreasList, blurRadius, activeFile.type);
        const ext = activeFile.type.split("/")[1] || "png";
        finalFilename = `blurred-${activeFile.name.split(".")[0]}.${ext}`;
      }

      if (outputBlob) {
        const url = URL.createObjectURL(outputBlob);
        setOutputUrl(url);
        setOutputFilename(finalFilename);
        setStatus("completed");
        setProgress(100);

        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred during image processing.");
      setStatus("failed");
      setProgress(0);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPreviewUrls([]);
    setStatus("idle");
    setProgress(0);
    setErrorMessage("");
    setOutputUrl(null);
    setOutputFilename("");
    setBlurAreasList([]);
    setRotationAngle(0);
    setMemeTopText("");
    setMemeBottomText("");
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setActiveFilter("none");
    setWatermarkImageFile(null);
    setWatermarkText("COPYRIGHT");
  };

  const handleResizeWidthChange = (val: number) => {
    setResizeWidth(val);
    if (lockAspectRatio) {
      setResizeHeight(Math.round(val / originalAspectRatio));
    }
  };

  const handleResizeHeightChange = (val: number) => {
    setResizeHeight(val);
    if (lockAspectRatio) {
      setResizeWidth(Math.round(val * originalAspectRatio));
    }
  };

  const handleSlider = (setter: (val: number) => void) => (val: number | readonly number[]) => {
    setter(Array.isArray(val) ? val[0] : val);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 relative z-10 flex flex-col gap-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
        <Icons.ChevronRight className="size-3" />
        <span className="text-slate-200 font-semibold">{tool.title}</span>
      </div>

      {status === "completed" ? (
        /* COMPLETION SCREEN */
        <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md p-12 text-center flex flex-col items-center gap-6 max-w-2xl mx-auto w-full">
          <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Icons.CheckCheck className="size-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-extrabold text-white">Image processed successfully!</h2>
            <p className="text-sm text-slate-400">Your download is ready. Click the button below to save your files.</p>
          </div>

          <div className="w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between text-left text-xs gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <Icons.FileImage className="size-8 text-cyan-500 shrink-0" />
              <div className="truncate">
                <p className="font-semibold text-slate-200 truncate">{outputFilename}</p>
                <p className="text-slate-500">Ready to save</p>
              </div>
            </div>
            <a href={outputUrl!} download={outputFilename}>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">
                <Icons.Download className="size-4 mr-1.5" /> Download
              </Button>
            </a>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="rounded-full" onClick={handleReset}>
              Process another file
            </Button>
            <Link href="/">
              <Button variant="outline" className="rounded-full border-slate-800 hover:bg-slate-900">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      ) : files.length === 0 ? (
        /* DROPZONE STATE */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex-1 border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-6 min-h-[50vh] transition-all duration-300 ${
            isDragActive
              ? "border-cyan-500 bg-cyan-500/5 shadow-2xl shadow-cyan-500/5 scale-[1.01]"
              : "border-slate-800 bg-slate-900/10 hover:border-slate-700/80 hover:bg-slate-900/20"
          }`}
        >
          <div className={`size-20 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-xl ${tool.colorClass}`}>
            {Icon && <Icon className="size-10 text-white" />}
          </div>

          <div className="flex flex-col gap-2 max-w-md">
            <h2 className="text-2xl font-extrabold text-white">Upload your image for {tool.title}</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Drag and drop an image here, or click to choose from your device.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <label className="cursor-pointer">
              <Button className="rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 font-semibold px-8 py-6 text-white border-0 shadow-lg shadow-cyan-500/20 hover:opacity-95">
                Select Image
              </Button>
              <input
                type="file"
                accept="image/*"
                multiple={slug === "convert-to-jpg" || slug === "convert-from-jpg"}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              PNG, JPG, WEBP, GIF, SVG up to 50MB
            </span>
          </div>
        </div>
      ) : (
        /* WORKSPACE STATE */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* VISUAL PREVIEW WORKSPACE */}
          <Card className="lg:col-span-3 border-slate-800 bg-slate-900/30 backdrop-blur-md overflow-hidden min-h-[55vh] flex flex-col">
            <div className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2 text-slate-200">
                <Icons.FileImage className="size-5 text-cyan-500" />
                <span className="text-sm font-semibold">
                  {slug === "html-to-image" ? "HTML Preview Canvas" : `${files[activePreviewIndex]?.name} (${naturalWidth}x${naturalHeight}px)`}
                </span>
              </div>
              {slug !== "html-to-image" && (
                <Button variant="secondary" size="sm" className="rounded-full size-8 p-0" onClick={handleReset}>
                  <Icons.X className="size-4" />
                </Button>
              )}
            </div>

            <div className="flex-1 p-6 flex flex-col justify-center items-center relative min-h-[400px]">
              {status === "processing" ? (
                <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                  <Icons.Loader2 className="size-10 text-cyan-500 animate-spin" />
                  <div className="w-full flex flex-col gap-2 text-center">
                    <p className="text-sm font-bold text-slate-200">Processing image...</p>
                    <Progress value={progress} className="h-1.5 bg-slate-950" />
                  </div>
                </div>
              ) : status === "failed" ? (
                <div className="text-center p-8 flex flex-col items-center gap-4">
                  <Icons.AlertTriangle className="size-10 text-rose-500" />
                  <h3 className="text-lg font-bold text-slate-200">Image processing failed</h3>
                  <p className="text-xs text-rose-300 max-w-md bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{errorMessage}</p>
                  <Button size="sm" className="rounded-full" onClick={handleReset}>Try again</Button>
                </div>
              ) : (
                /* LIVE WORKSPACE CANVAS/PREVIEW */
                <div ref={previewContainerRef} className="relative max-w-full max-h-[60vh] flex items-center justify-center">
                  {slug === "html-to-image" ? (
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full flex flex-col items-center justify-center gap-3">
                      <Icons.Globe className="size-12 text-slate-500 animate-pulse" />
                      <p className="text-xs text-slate-400">Your custom HTML will compile directly to a downloadable PNG file.</p>
                    </div>
                  ) : (
                    <>
                      <img
                        src={previewUrls[activePreviewIndex]}
                        alt="Preview"
                        className="max-w-full max-h-[55vh] object-contain rounded-lg select-none pointer-events-none"
                        style={{
                          transform: `rotate(${rotationAngle}deg)`,
                          filter:
                            slug === "photo-editor"
                              ? `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${
                                  activeFilter === "none"
                                    ? ""
                                    : activeFilter === "blur"
                                    ? "blur(4px)"
                                    : `${activeFilter}(100%)`
                                }`
                              : "none",
                        }}
                      />

                      {/* 1. CROP OVERLAY */}
                      {slug === "crop-image" && (
                        <div className="absolute inset-0 bg-black/60 rounded-lg">
                          <div
                            className="absolute border-2 border-dashed border-cyan-400 bg-cyan-400/10 cursor-move"
                            style={{
                              left: `${cropBox.x}%`,
                              top: `${cropBox.y}%`,
                              width: `${cropBox.width}%`,
                              height: `${cropBox.height}%`,
                            }}
                          >
                            {/* Draggable bounds helpers */}
                            <div
                              className="absolute -top-1.5 -left-1.5 size-3 bg-cyan-400 rounded-full cursor-nwse-resize"
                              onMouseDown={() => {}}
                            />
                            <div className="absolute -bottom-1.5 -right-1.5 size-3 bg-cyan-400 rounded-full cursor-nwse-resize" />
                          </div>
                        </div>
                      )}

                      {/* 2. REMOVE BACKGROUND SAMPLE TOOL */}
                      {slug === "remove-background" && (
                        <div
                          className="absolute inset-0 bg-transparent cursor-crosshair flex items-center justify-center"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            sampleColorFromCoords(e.clientX, e.clientY, rect);
                          }}
                        >
                          <div className="absolute top-2 left-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full text-[10px] text-slate-300 font-semibold pointer-events-none">
                            Click anywhere on the image background to color-erase it.
                          </div>
                        </div>
                      )}

                      {/* 3. BLUR FACE / CENSORED OVERLAYS */}
                      {slug === "blur-face" && (
                        <div
                          className="absolute inset-0 bg-transparent cursor-cell"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            addBlurAreaFromClick(e.clientX, e.clientY, rect);
                          }}
                        >
                          <div className="absolute top-2 left-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full text-[10px] text-slate-300 font-semibold pointer-events-none">
                            Click anywhere on faces/objects to place a censoring blur block.
                          </div>

                          {/* Render added blur areas visually */}
                          {blurAreasList.map((area, idx) => {
                            // Map natural coordinates back to display percentages
                            const leftPct = (area.x / naturalWidth) * 100;
                            const topPct = (area.y / naturalHeight) * 100;
                            const widthPct = (area.width / naturalWidth) * 100;
                            const heightPct = (area.height / naturalHeight) * 100;

                            return (
                              <div
                                key={idx}
                                className="absolute border border-cyan-400 bg-slate-900/60 backdrop-blur-md flex items-center justify-center"
                                style={{
                                  left: `${leftPct}%`,
                                  top: `${topPct}%`,
                                  width: `${widthPct}%`,
                                  height: `${heightPct}%`,
                                }}
                              >
                                <button
                                  className="size-5 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBlurAreasList(blurAreasList.filter((_, i) => i !== idx));
                                  }}
                                >
                                  <Icons.X className="size-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* SIDEBAR PARAMETERS */}
          <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-slate-200 text-sm">Parameters</h3>
              <p className="text-[11px] text-slate-400">Customize target options below.</p>
            </div>
            <Separator className="bg-slate-800" />

            <div className="flex-1 flex flex-col gap-4">
              {/* 1. COMPRESS */}
              {slug === "compress-image" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Compression Quality ({Math.round(compressionQuality * 100)}%)</Label>
                    <Slider
                      value={[compressionQuality]}
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      onValueChange={handleSlider(setCompressionQuality)}
                    />
                  </div>
                </div>
              )}

              {/* 2. RESIZE */}
              {slug === "resize-image" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="resW" className="text-xs">Width (px)</Label>
                    <Input
                      type="number"
                      id="resW"
                      value={resizeWidth}
                      onChange={(e) => handleResizeWidthChange(parseInt(e.target.value, 10) || 0)}
                      className="bg-slate-950 border-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="resH" className="text-xs">Height (px)</Label>
                    <Input
                      type="number"
                      id="resH"
                      value={resizeHeight}
                      onChange={(e) => handleResizeHeightChange(parseInt(e.target.value, 10) || 0)}
                      className="bg-slate-950 border-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="aspectLock"
                      checked={lockAspectRatio}
                      onCheckedChange={setLockAspectRatio}
                    />
                    <Label htmlFor="aspectLock" className="text-xs">Lock Aspect Ratio</Label>
                  </div>
                </div>
              )}

              {/* 3. CROP */}
              {slug === "crop-image" && (
                <div className="flex flex-col gap-4 text-xs text-slate-400">
                  <p>Drag the crop overlay area on the left to frame your cropped canvas.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Crop X (%)</Label>
                      <Input
                        type="number"
                        value={cropBox.x}
                        onChange={(e) => setCropBox({ ...cropBox, x: parseInt(e.target.value, 10) || 0 })}
                        className="bg-slate-950 border-slate-800 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Crop Y (%)</Label>
                      <Input
                        type="number"
                        value={cropBox.y}
                        onChange={(e) => setCropBox({ ...cropBox, y: parseInt(e.target.value, 10) || 0 })}
                        className="bg-slate-950 border-slate-800 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Width (%)</Label>
                      <Input
                        type="number"
                        value={cropBox.width}
                        onChange={(e) => setCropBox({ ...cropBox, width: parseInt(e.target.value, 10) || 0 })}
                        className="bg-slate-950 border-slate-800 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Height (%)</Label>
                      <Input
                        type="number"
                        value={cropBox.height}
                        onChange={(e) => setCropBox({ ...cropBox, height: parseInt(e.target.value, 10) || 0 })}
                        className="bg-slate-950 border-slate-800 h-8"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4 & 5. CONVERT */}
              {(slug === "convert-to-jpg" || slug === "convert-from-jpg") && (
                <div className="flex flex-col gap-2">
                  <Label className="text-xs">Convert to format</Label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                    value={targetConvertFormat}
                    onChange={(e) => setTargetConvertFormat(e.target.value as any)}
                  >
                    {slug === "convert-to-jpg" ? (
                      <option value="jpeg">JPG (Standard Joint Photographic Group)</option>
                    ) : (
                      <>
                        <option value="png">PNG (Portable Network Graphics)</option>
                        <option value="webp">WEBP (Modern Web Format)</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* 6. PHOTO EDITOR */}
              {slug === "photo-editor" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Brightness ({brightness}%)</Label>
                    <Slider
                      value={[brightness]}
                      min={0}
                      max={200}
                      step={5}
                      onValueChange={handleSlider(setBrightness)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Contrast ({contrast}%)</Label>
                    <Slider
                      value={[contrast]}
                      min={0}
                      max={200}
                      step={5}
                      onValueChange={handleSlider(setContrast)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Saturation ({saturation}%)</Label>
                    <Slider
                      value={[saturation]}
                      min={0}
                      max={200}
                      step={5}
                      onValueChange={handleSlider(setSaturation)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Filters</Label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value as any)}
                    >
                      <option value="none">No Filter</option>
                      <option value="grayscale">Grayscale</option>
                      <option value="sepia">Sepia Vintage</option>
                      <option value="invert">Invert Colors</option>
                      <option value="blur">Censoring Blur</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 7. UPSCALE */}
              {slug === "upscale-image" && (
                <div className="flex flex-col gap-4">
                  <Label className="text-xs">Upscaling Scale Factor</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[2, 4].map((f) => (
                      <button
                        key={f}
                        onClick={() => setUpscaleFactor(f)}
                        className={`p-3 rounded-lg border text-center transition-all text-xs font-semibold cursor-pointer ${
                          upscaleFactor === f
                            ? "border-cyan-500 bg-cyan-500/10 text-white"
                            : "border-slate-800 bg-slate-900 hover:border-slate-700"
                        }`}
                      >
                        {f}x Enlarge ({naturalWidth * f}x{naturalHeight * f}px)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. REMOVE BACKGROUND */}
              {slug === "remove-background" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Tolerance ({colorTolerance})</Label>
                    <Slider
                      value={[colorTolerance]}
                      min={5}
                      max={120}
                      step={2}
                      onValueChange={handleSlider(setColorTolerance)}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Target Erase Color:</span>
                    <div
                      className="size-6 rounded border border-slate-700"
                      style={{
                        backgroundColor: `rgb(${removeColor.r}, ${removeColor.g}, ${removeColor.b})`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 9. WATERMARK */}
              {slug === "watermark-image" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setWatermarkType("text")}
                      className={`py-1.5 rounded font-semibold cursor-pointer ${
                        watermarkType === "text" ? "bg-cyan-500 text-white" : "text-slate-400"
                      }`}
                    >
                      Text
                    </button>
                    <button
                      onClick={() => setWatermarkType("image")}
                      className={`py-1.5 rounded font-semibold cursor-pointer ${
                        watermarkType === "image" ? "bg-cyan-500 text-white" : "text-slate-400"
                      }`}
                    >
                      Image Stamp
                    </button>
                  </div>

                  {watermarkType === "text" ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-slate-400">Watermark Text</Label>
                        <Input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="bg-slate-950 border-slate-800"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-slate-400">Text Color Hex</Label>
                        <Input
                          type="color"
                          value={watermarkColorHex}
                          onChange={(e) => setWatermarkColorHex(e.target.value)}
                          className="bg-slate-950 border-slate-800 h-9 p-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-slate-400">Font Size ({watermarkFontSize}px)</Label>
                        <Slider
                          value={[watermarkFontSize]}
                          min={12}
                          max={120}
                          step={2}
                          onValueChange={handleSlider(setWatermarkFontSize)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-slate-400">Opacity ({Math.round(watermarkOpacity * 100)}%)</Label>
                        <Slider
                          value={[watermarkOpacity]}
                          min={0.1}
                          max={1.0}
                          step={0.05}
                          onValueChange={handleSlider(setWatermarkOpacity)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-slate-400">Rotation Angle ({watermarkRotation}°)</Label>
                        <Slider
                          value={[watermarkRotation]}
                          min={0}
                          max={360}
                          step={5}
                          onValueChange={handleSlider(setWatermarkRotation)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-slate-400">Stamp Image</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setWatermarkImageFile(e.target.files?.[0] || null)}
                          className="bg-slate-950 border-slate-800 file:text-cyan-400 cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-slate-400">Scale Stamp ({Math.round(watermarkImageScale * 100)}%)</Label>
                        <Slider
                          value={[watermarkImageScale]}
                          min={0.1}
                          max={1.0}
                          step={0.05}
                          onValueChange={handleSlider(setWatermarkImageScale)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-slate-400">Opacity ({Math.round(watermarkOpacity * 100)}%)</Label>
                        <Slider
                          value={[watermarkOpacity]}
                          min={0.1}
                          max={1.0}
                          step={0.05}
                          onValueChange={handleSlider(setWatermarkOpacity)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 10. MEME */}
              {slug === "meme-generator" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Top Caption</Label>
                    <Input
                      type="text"
                      placeholder="TOP TEXT CAPTION"
                      value={memeTopText}
                      onChange={(e) => setMemeTopText(e.target.value)}
                      className="bg-slate-950 border-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Bottom Caption</Label>
                    <Input
                      type="text"
                      placeholder="BOTTOM TEXT CAPTION"
                      value={memeBottomText}
                      onChange={(e) => setMemeBottomText(e.target.value)}
                      className="bg-slate-950 border-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* 11. ROTATE */}
              {slug === "rotate-image" && (
                <div className="flex flex-col gap-4 text-center">
                  <Label className="text-xs text-left">Rotation Direction</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="border-slate-800 hover:bg-slate-900"
                      onClick={() => setRotationAngle((rotationAngle - 90) % 360)}
                    >
                      <Icons.RotateCcw className="size-4 mr-2" /> Left 90°
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-800 hover:bg-slate-900"
                      onClick={() => setRotationAngle((rotationAngle + 90) % 360)}
                    >
                      <Icons.RotateCw className="size-4 mr-2" /> Right 90°
                    </Button>
                  </div>
                </div>
              )}

              {/* 12. HTML TO IMAGE */}
              {slug === "html-to-image" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">HTML Code</Label>
                    <textarea
                      rows={6}
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-mono text-slate-200 outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Width (px)</Label>
                      <Input
                        type="number"
                        value={htmlWidth}
                        onChange={(e) => setHtmlWidth(parseInt(e.target.value, 10) || 0)}
                        className="bg-slate-950 border-slate-800 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Height (px)</Label>
                      <Input
                        type="number"
                        value={htmlHeight}
                        onChange={(e) => setHtmlHeight(parseInt(e.target.value, 10) || 0)}
                        className="bg-slate-950 border-slate-800 h-8"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 13. BLUR FACE */}
              {slug === "blur-face" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Blur Intensity / Radius ({blurRadius}px)</Label>
                    <Slider
                      value={[blurRadius]}
                      min={5}
                      max={100}
                      step={5}
                      onValueChange={handleSlider(setBlurRadius)}
                    />
                  </div>
                  {blurAreasList.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs">Placed Censor Zones ({blurAreasList.length})</Label>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-full bg-red-950/30 border border-red-500/30 hover:bg-red-500 text-red-300 w-full"
                        onClick={() => setBlurAreasList([])}
                      >
                        Clear All Zones
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator className="bg-slate-800" />
            <Button
              className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold py-6 text-white border-0 shadow-lg shadow-cyan-500/20 hover:opacity-95"
              onClick={handleProcess}
            >
              <Icons.Zap className="size-4 mr-2" /> Apply Processing
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
