"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import JSZip from "jszip";
import confetti from "canvas-confetti";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PDFPageRenderer from "@/components/PDFPageRenderer";
import SignaturePad from "@/components/SignaturePad";
import * as pdfjsLib from "pdfjs-dist";
import { TOOLS, PDFTool } from "@/lib/toolsConfig";

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs";

import {
  mergePDFs,
  splitPDF,
  compressPDF,
  rotatePDF,
  addTextWatermark,
  addImageWatermark,
  addPageNumbers,
  organizePDF,
  signPDF,
  imagesToPDF,
  protectPDF,
  unlockPDF,
} from "@/lib/pdfUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PDFDocument } from "pdf-lib";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ToolPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const slug = resolvedParams.slug;
  const tool = TOOLS.find((t) => t.slug === slug) as PDFTool;

  const [files, setFiles] = useState<File[]>([]);
  const [fileBuffers, setFileBuffers] = useState<ArrayBuffer[]>([]);
  
  // App Processing States
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState("");

  // Visual drag & drop state
  const [isDragActive, setIsDragActive] = useState(false);

  // --- TOOL CONFIGURATION STATES ---
  // Split
  const [splitStart, setSplitStart] = useState(1);
  const [splitEnd, setSplitEnd] = useState(1);
  
  // Rotate
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});

  // Organize
  const [pageOrder, setPageOrder] = useState<number[]>([]);

  // Watermark
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkFontSize, setWatermarkFontSize] = useState(50);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.4);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [watermarkColorHex, setWatermarkColorHex] = useState("#FF0000");
  const [watermarkImageBuffer, setWatermarkImageBuffer] = useState<ArrayBuffer | null>(null);
  const [watermarkImageScale, setWatermarkImageScale] = useState(0.5);
  const [watermarkImageOpacity, setWatermarkImageOpacity] = useState(0.4);
  const [watermarkImageAngle, setWatermarkImageAngle] = useState(0);

  // Page Numbers
  const [pageNumberPosition, setPageNumberPosition] = useState<
    "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
  >("bottom-center");
  const [pageNumberFormat, setPageNumberFormat] = useState("Page {n} of {total}");
  const [pageNumberFontSize, setPageNumberFontSize] = useState(10);
  const [pageNumberColorHex, setPageNumberColorHex] = useState("#000000");

  // Protect / Unlock
  const [password, setPassword] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");

  // JPG to PDF
  const [pageSize, setPageSize] = useState<"A4" | "LETTER">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState(20);

  // Sign PDF
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [placedSignatures, setPlacedSignatures] = useState<
    { pageIndex: number; x: number; y: number; width: number; height: number }[]
  >([]);

  // Go back or Reset file arrays
  useEffect(() => {
    if (!tool) {
      router.push("/");
    }
  }, [tool, router]);

  if (!tool) return null;

  const Icon = Icons[tool.iconName] as React.ComponentType<{ className?: string }>;

  // Handle local File loading to ArrayBuffers
  const loadFiles = async (fileList: File[]) => {
    setStatus("uploading");
    setProgress(20);
    try {
      const buffers: ArrayBuffer[] = [];
      for (const file of fileList) {
        const buffer = await file.arrayBuffer();
        buffers.push(buffer);
      }
      setFileBuffers(buffers);
      setFiles(fileList);
      setStatus("idle");
      setProgress(0);

      // Prepopulate page split bounds if only 1 PDF uploaded
      if (slug === "split-pdf" && buffers.length > 0) {
        const pdf = await PDFDocument.load(buffers[0]);
        setSplitEnd(pdf.getPageCount());
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error parsing selected file(s).");
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
      const droppedFiles = Array.from(e.dataTransfer.files);
      // Validate correct format based on tool
      loadFiles(droppedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadFiles(Array.from(e.target.files));
    }
  };

  // Watermark image selection handler
  const handleWatermarkImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const buffer = await e.target.files[0].arrayBuffer();
      setWatermarkImageBuffer(buffer);
    }
  };

  // Placement handler for signature canvas overlay
  const handleSignPlacement = async (
    pageIndex: number,
    clientX: number,
    clientY: number,
    containerRect: DOMRect
  ) => {
    if (!signaturePreview) return;
    
    // Convert click coordinates to local canvas values
    const clickX = clientX - containerRect.left;
    const clickY = clientY - containerRect.top;
    
    // Scale local click to match pdf-lib page point space
    const pdf = await PDFDocument.load(fileBuffers[0]);
    const page = pdf.getPage(pageIndex);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const scaleX = pageWidth / containerRect.width;
    const scaleY = pageHeight / containerRect.height;

    // Default sizing of signature image in points
    const sigWidth = 120;
    const sigHeight = 50;

    // Convert coordinates: flip Y axis since PDF (0,0) is bottom-left, browser is top-left
    const x = clickX * scaleX - sigWidth / 2;
    const y = (containerRect.height - clickY) * scaleY - sigHeight / 2;

    setPlacedSignatures([
      ...placedSignatures,
      {
        pageIndex,
        x: Math.max(0, Math.min(x, pageWidth - sigWidth)),
        y: Math.max(0, Math.min(y, pageHeight - sigHeight)),
        width: sigWidth,
        height: sigHeight,
      },
    ]);
  };

  // MAIN RUN PROCESSING LOGIC
  const handleProcess = async () => {
    if (fileBuffers.length === 0 && files.length === 0) return;
    setStatus("processing");
    setProgress(20);
    setErrorMessage("");

    try {
      let resultBytes: Uint8Array | null = null;
      let resultBlob: Blob | null = null;
      let finalDownloadName = "";

      // 🛠 Client-Side Assembly Operations
      if (slug === "merge-pdf") {
        resultBytes = await mergePDFs(fileBuffers);
        finalDownloadName = "merged.pdf";
      } else if (slug === "split-pdf") {
        const splitResults = await splitPDF(fileBuffers[0], [{ start: splitStart, end: splitEnd }]);
        if (splitResults.length > 0) {
          resultBytes = splitResults[0].fileBytes;
          finalDownloadName = splitResults[0].filename;
        }
      } else if (slug === "compress-pdf") {
        resultBytes = await compressPDF(fileBuffers[0]);
        finalDownloadName = "compressed.pdf";
      } else if (slug === "rotate-pdf") {
        resultBytes = await rotatePDF(fileBuffers[0], pageRotations);
        finalDownloadName = "rotated.pdf";
      } else if (slug === "organize-pdf") {
        resultBytes = await organizePDF(fileBuffers[0], pageOrder);
        finalDownloadName = "organized.pdf";
      } else if (slug === "page-numbers") {
        resultBytes = await addPageNumbers(fileBuffers[0], {
          format: pageNumberFormat,
          position: pageNumberPosition,
          fontSize: pageNumberFontSize,
          colorHex: pageNumberColorHex,
        });
        finalDownloadName = "numbered.pdf";
      } else if (slug === "watermark") {
        if (watermarkType === "text") {
          resultBytes = await addTextWatermark(fileBuffers[0], watermarkText, {
            fontSize: watermarkFontSize,
            opacity: watermarkOpacity,
            angle: watermarkAngle,
            colorHex: watermarkColorHex,
          });
        } else if (watermarkImageBuffer) {
          resultBytes = await addImageWatermark(fileBuffers[0], watermarkImageBuffer, "png", {
            scale: watermarkImageScale,
            opacity: watermarkImageOpacity,
            angle: watermarkImageAngle,
          });
        } else {
          throw new Error("Please upload a watermark image first.");
        }
        finalDownloadName = "watermarked.pdf";
      } else if (slug === "protect-pdf") {
        resultBytes = await protectPDF(fileBuffers[0], password);
        finalDownloadName = "protected.pdf";
      } else if (slug === "unlock-pdf") {
        resultBytes = await unlockPDF(fileBuffers[0], unlockPassword);
        finalDownloadName = "unlocked.pdf";
      } else if (slug === "jpg-to-pdf") {
        const imgDataList = files.map((file, idx) => ({
          buffer: fileBuffers[idx],
          type: file.type.includes("png") ? ("png" as const) : ("jpeg" as const),
        }));
        resultBytes = await imagesToPDF(imgDataList, {
          pageSize: pageSize,
          orientation: orientation,
          margin: margin,
        });
        finalDownloadName = "images.pdf";
      } else if (slug === "sign-pdf") {
        if (placedSignatures.length === 0) {
          throw new Error("Please select 'Create Signature' and click on a page thumbnail to place it.");
        }
        const response = await fetch(signaturePreview!);
        const signatureImgBuffer = await response.arrayBuffer();
        resultBytes = await signPDF(fileBuffers[0], signatureImgBuffer, "png", placedSignatures);
        finalDownloadName = "signed.pdf";
      }

      // 🛠 Client-Side Extractions
      else if (slug === "pdf-to-text") {
        setProgress(40);
        // Direct read text extraction using dynamically loaded pdfjs
        const loadingTask = pdfjsLib.getDocument({ data: fileBuffers[0].slice(0) });
        const pdf = await loadingTask.promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(" ");
          text += `--- Page ${i} ---\n${pageText}\n\n`;
        }
        resultBlob = new Blob([text], { type: "text/plain;charset=utf-8" });
        finalDownloadName = "extracted-text.txt";
      } else if (slug === "pdf-to-jpg") {
        setProgress(40);
        const loadingTask = pdfjsLib.getDocument({ data: fileBuffers[0].slice(0) });
        const pdf = await loadingTask.promise;
        const zip = new JSZip();
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
          const base64Data = dataUrl.split(",")[1];
          zip.file(`page-${i}.jpg`, base64Data, { base64: true });
        }
        resultBlob = await zip.generateAsync({ type: "blob" });
        finalDownloadName = "pages.zip";
      }

      // 🔄 Server-Side conversions (LibreOffice)
      else {
        let targetFormat = "pdf";
        if (slug === "pdf-to-word") targetFormat = "docx";
        if (slug === "pdf-to-pptx") targetFormat = "pptx";
        if (slug === "pdf-to-xlsx") targetFormat = "xlsx";
        if (slug === "pdf-to-pdfa") targetFormat = "pdfa";

        const apiFormData = new FormData();
        apiFormData.append("file", files[0]);
        apiFormData.append("to", targetFormat);

        setProgress(50);
        const res = await fetch("/api/convert", {
          method: "POST",
          body: apiFormData,
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || "Server-side file conversion failed.");
        }

        resultBlob = await res.blob();
        
        const contentDisposition = res.headers.get("Content-Disposition");
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match) finalDownloadName = decodeURIComponent(match[1]);
        }
        if (!finalDownloadName) {
          const origExt = files[0].name.split(".").pop();
          finalDownloadName = files[0].name.replace(`.${origExt}`, `-converted.${targetFormat === "pdfa" ? "pdf" : targetFormat}`);
        }
      }

      if (resultBytes) {
        resultBlob = new Blob([resultBytes as any], { type: "application/pdf" });
      }

      if (resultBlob) {
        const url = URL.createObjectURL(resultBlob);
        setOutputUrl(url);
        setOutputFilename(finalDownloadName);
        setStatus("completed");
        setProgress(100);
        
        // Trigger completion confetti!
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected error occurred during processing.");
      setStatus("failed");
      setProgress(0);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setFileBuffers([]);
    setStatus("idle");
    setProgress(0);
    setErrorMessage("");
    setOutputUrl(null);
    setOutputFilename("");
    setPageRotations({});
    setPageOrder([]);
    setPlacedSignatures([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 relative selection:bg-rose-500 selection:text-white">
      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-10%] size-[500px] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] size-[500px] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 relative z-10 flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-rose-400 transition-colors">Home</Link>
          <Icons.ChevronRight className="size-3" />
          <span className="text-slate-200 font-semibold">{tool.title}</span>
        </div>

        {/* Workspace Cards */}
        {status === "completed" ? (
          /* COMPLETION SUCCESS SCREEN */
          <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md p-12 text-center flex flex-col items-center gap-6 max-w-2xl mx-auto w-full">
            <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Icons.CheckCheck className="size-8" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-extrabold text-white">Files processed successfully!</h2>
              <p className="text-sm text-slate-400">Your download is ready. Click the button below to save your files.</p>
            </div>

            <div className="w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between text-left text-xs gap-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <Icons.File className="size-8 text-rose-500 shrink-0" />
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
          /* FILE SELECT DROPZONE STATE */
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex-1 border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-6 min-h-[50vh] transition-all duration-300 ${
              isDragActive
                ? "border-rose-500 bg-rose-500/5 shadow-2xl shadow-rose-500/5 scale-[1.01]"
                : "border-slate-800 bg-slate-900/10 hover:border-slate-700/80 hover:bg-slate-900/20"
            }`}
          >
            <div className={`size-20 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-xl ${tool.colorClass}`}>
              {Icon && <Icon className="size-10 text-white" />}
            </div>
            
            <div className="flex flex-col gap-2 max-w-md">
              <h2 className="text-2xl font-extrabold text-white">Upload your files for {tool.title}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Drag and drop files here, or click to choose from your device.
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <label className="cursor-pointer">
                <Button className="rounded-full bg-gradient-to-r from-rose-500 to-orange-600 font-semibold px-8 py-6 text-white border-0 shadow-lg shadow-rose-500/20 hover:opacity-95">
                  Select Files
                </Button>
                <input
                  type="file"
                  multiple={slug === "merge-pdf" || slug === "jpg-to-pdf"}
                  accept={
                    slug === "word-to-pdf"
                      ? ".doc,.docx"
                      : slug === "ppt-to-pdf"
                      ? ".ppt,.pptx"
                      : slug === "excel-to-pdf"
                      ? ".xls,.xlsx"
                      : slug === "jpg-to-pdf"
                      ? "image/*"
                      : slug === "html-to-pdf"
                      ? ".html"
                      : ".pdf"
                  }
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Max file size: 50MB
              </span>
            </div>
          </div>
        ) : (
          /* WORKSPACE CONFIGURATION STATE */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* WORKSPACE PREVIEW (3 cols) */}
            <Card className="lg:col-span-3 border-slate-800 bg-slate-900/30 backdrop-blur-md overflow-hidden min-h-[55vh] flex flex-col">
              <div className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <Icons.FileText className="size-5 text-rose-500" />
                  <span className="text-sm font-semibold text-slate-200">
                    Uploaded File: {files[0].name} ({files.length > 1 ? `+${files.length - 1} more` : ""})
                  </span>
                </div>
                <Button variant="secondary" size="sm" className="rounded-full size-8 p-0" onClick={handleReset}>
                  <Icons.X className="size-4" />
                </Button>
              </div>

              {/* Rendering file contents inside workspace */}
              <div className="flex-1 p-6 flex flex-col justify-center items-center">
                {status === "processing" ? (
                  /* RUNNING LOADER */
                  <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                    <Icons.Loader2 className="size-10 text-rose-500 animate-spin" />
                    <div className="w-full flex flex-col gap-2 text-center">
                      <p className="text-sm font-bold text-slate-200">Processing file...</p>
                      <Progress value={progress} className="h-1.5 bg-slate-950" />
                    </div>
                  </div>
                ) : status === "failed" ? (
                  /* ERROR BOUNDARY SCREEN */
                  <div className="text-center p-8 flex flex-col items-center gap-4">
                    <Icons.AlertTriangle className="size-10 text-rose-500" />
                    <h3 className="text-lg font-bold text-slate-200">File processing failed</h3>
                    <p className="text-xs text-rose-300 max-w-md bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{errorMessage}</p>
                    <Button size="sm" className="rounded-full" onClick={handleReset}>Try again</Button>
                  </div>
                ) : (
                  /* MULTIPAGE CANVAS CONTAINER (Rotate / Organize / Sign modes) */
                  (() => {
                    const isVisualMode = ["rotate-pdf", "organize-pdf", "sign-pdf"].includes(slug);
                    if (isVisualMode) {
                      return (
                        <PDFPageRenderer
                          fileBuffer={fileBuffers[0]}
                          mode={
                            slug === "rotate-pdf"
                              ? "rotate"
                              : slug === "organize-pdf"
                              ? "organize"
                              : "sign"
                          }
                          pageOrder={pageOrder}
                          setPageOrder={setPageOrder}
                          pageRotations={pageRotations}
                          setPageRotations={setPageRotations}
                          onSignPlacement={handleSignPlacement}
                          signaturePreview={signaturePreview}
                        />
                      );
                    }

                    // Basic uploaded list for other files
                    return (
                      <div className="w-full max-w-md flex flex-col gap-3">
                        {files.map((f, i) => (
                          <div
                            key={i}
                            className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between text-left text-xs gap-3"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Icons.File className="size-8 text-rose-500 shrink-0" />
                              <div className="truncate">
                                <p className="font-semibold text-slate-200 truncate">{f.name}</p>
                                <p className="text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </Card>

            {/* SIDEBAR CONFIGURATION CONTROLS (1 col) */}
            <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-slate-200 text-sm">Tool Configurations</h3>
                <p className="text-[11px] text-slate-400">Configure parameters before processing.</p>
              </div>
              <Separator className="bg-slate-800" />

              {/* TOOL OPTIONS INLINE MAPPING */}
              <div className="flex-1 flex flex-col gap-4">
                {/* 1. SPLIT CONFIG */}
                {slug === "split-pdf" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="splitStart" className="text-xs">From Page</Label>
                      <Input
                        type="number"
                        id="splitStart"
                        className="bg-slate-950 border-slate-800"
                        value={splitStart}
                        onChange={(e) => setSplitStart(parseInt(e.target.value, 10))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="splitEnd" className="text-xs">To Page</Label>
                      <Input
                        type="number"
                        id="splitEnd"
                        className="bg-slate-950 border-slate-800"
                        value={splitEnd}
                        onChange={(e) => setSplitEnd(parseInt(e.target.value, 10))}
                      />
                    </div>
                  </div>
                )}

                {/* 2. PROTECT CONFIG */}
                {slug === "protect-pdf" && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pass" className="text-xs">Choose Password</Label>
                    <Input
                      type="password"
                      id="pass"
                      className="bg-slate-950 border-slate-800"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}

                {/* 3. UNLOCK CONFIG */}
                {slug === "unlock-pdf" && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="unlockPass" className="text-xs">PDF Password</Label>
                    <Input
                      type="password"
                      id="unlockPass"
                      className="bg-slate-950 border-slate-800"
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                    />
                  </div>
                )}

                {/* 4. WATERMARK CONFIG */}
                {slug === "watermark" && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                      <button
                        onClick={() => setWatermarkType("text")}
                        className={`py-1.5 rounded font-semibold cursor-pointer ${
                          watermarkType === "text" ? "bg-rose-500 text-white" : "text-slate-400"
                        }`}
                      >
                        Text
                      </button>
                      <button
                        onClick={() => setWatermarkType("image")}
                        className={`py-1.5 rounded font-semibold cursor-pointer ${
                          watermarkType === "image" ? "bg-rose-500 text-white" : "text-slate-400"
                        }`}
                      >
                        Image
                      </button>
                    </div>

                    {watermarkType === "text" ? (
                      <div className="flex flex-col gap-4">
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
                          <Label className="text-[11px] text-slate-400">Opacity ({Math.round(watermarkOpacity * 100)}%)</Label>
                          <Slider
                            value={[watermarkOpacity]}
                            min={0.1}
                            max={1.0}
                            step={0.05}
                            onValueChange={(val) => setWatermarkOpacity(Array.isArray(val) ? val[0] : val)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-[11px] text-slate-400">Angle ({watermarkAngle}°)</Label>
                          <Slider
                            value={[watermarkAngle]}
                            min={0}
                            max={360}
                            step={5}
                            onValueChange={(val) => setWatermarkAngle(Array.isArray(val) ? val[0] : val)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-[11px] text-slate-400">Watermark Image</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleWatermarkImageChange}
                            className="bg-slate-950 border-slate-800 cursor-pointer file:text-rose-400"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-[11px] text-slate-400">Scale ({Math.round(watermarkImageScale * 100)}%)</Label>
                          <Slider
                            value={[watermarkImageScale]}
                            min={0.1}
                            max={2.0}
                            step={0.05}
                            onValueChange={(val) => setWatermarkImageScale(Array.isArray(val) ? val[0] : val)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-[11px] text-slate-400">Opacity ({Math.round(watermarkImageOpacity * 100)}%)</Label>
                          <Slider
                            value={[watermarkImageOpacity]}
                            min={0.1}
                            max={1.0}
                            step={0.05}
                            onValueChange={(val) => setWatermarkImageOpacity(Array.isArray(val) ? val[0] : val)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. PAGE NUMBERS CONFIG */}
                {slug === "page-numbers" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-slate-400">Text Format</Label>
                      <Input
                        type="text"
                        value={pageNumberFormat}
                        onChange={(e) => setPageNumberFormat(e.target.value)}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-slate-400">Text Placement</Label>
                      <select
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                        value={pageNumberPosition}
                        onChange={(e) => setPageNumberPosition(e.target.value as any)}
                      >
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-slate-400">Text Size ({pageNumberFontSize}pt)</Label>
                      <Slider
                        value={[pageNumberFontSize]}
                        min={6}
                        max={24}
                        step={1}
                        onValueChange={(val) => setPageNumberFontSize(Array.isArray(val) ? val[0] : val)}
                      />
                    </div>
                  </div>
                )}

                {/* 6. JPG to PDF CONFIG */}
                {slug === "jpg-to-pdf" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-slate-400">Page Size</Label>
                      <select
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as any)}
                      >
                        <option value="A4">A4 (595 x 842 pt)</option>
                        <option value="LETTER">US Letter (612 x 792 pt)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-slate-400">Orientation</Label>
                      <select
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value as any)}
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-slate-400">Margin ({margin} pt)</Label>
                      <Slider
                        value={[margin]}
                        min={0}
                        max={60}
                        step={5}
                        onValueChange={(val) => setMargin(Array.isArray(val) ? val[0] : val)}
                      />
                    </div>
                  </div>
                )}

                {/* 7. SIGN PDF CONFIG */}
                {slug === "sign-pdf" && (
                  <div className="flex flex-col gap-4">
                    {signaturePreview ? (
                      <div className="flex flex-col gap-3">
                        <Label className="text-[11px] text-slate-400">Active Signature</Label>
                        <div className="w-full bg-white p-3 rounded-lg flex items-center justify-center border border-slate-800/80">
                          <img src={signaturePreview} alt="Signature Preview" className="max-h-16 object-contain" />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-slate-800 hover:bg-slate-900"
                          onClick={() => setSignatureModalOpen(true)}
                        >
                          Change Signature
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold w-full"
                        onClick={() => setSignatureModalOpen(true)}
                      >
                        Create Signature
                      </Button>
                    )}

                    {placedSignatures.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <Label className="text-[11px] text-slate-400">Placed Signatures</Label>
                        <div className="flex flex-col gap-1.5">
                          {placedSignatures.map((sig, idx) => (
                            <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] text-slate-300 flex justify-between items-center">
                              <span>Page {sig.pageIndex + 1} placement</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                onClick={() => setPlacedSignatures(placedSignatures.filter((_, i) => i !== idx))}
                              >
                                <Icons.X className="size-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* fallback text for simple server/client tools */}
                {!["split-pdf", "protect-pdf", "unlock-pdf", "watermark", "page-numbers", "jpg-to-pdf", "sign-pdf"].includes(slug) && (
                  <p className="text-xs text-slate-400 leading-normal">
                    This tool runs with standard parameters. Click below to begin processing.
                  </p>
                )}
              </div>

              <Separator className="bg-slate-800" />
              <Button
                className="w-full rounded-full bg-gradient-to-r from-rose-500 to-orange-600 font-bold py-6 text-white border-0 shadow-lg shadow-rose-500/20 hover:opacity-95"
                onClick={handleProcess}
                disabled={status === "processing"}
              >
                {status === "processing" ? "Processing..." : `Run ${tool.title}`}
              </Button>
            </Card>
          </div>
        )}
      </main>

      {/* Signature creation dialog */}
      <SignaturePad
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        onSave={(dataUrl) => setSignaturePreview(dataUrl)}
      />

      <Footer />
    </div>
  );
}
