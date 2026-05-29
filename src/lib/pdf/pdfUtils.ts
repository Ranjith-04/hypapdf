import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt-lite";
import { decryptPDF } from "@pdfsmaller/pdf-decrypt";

/**
 * Merge multiple PDFs into a single PDF
 */
export async function mergePDFs(files: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  for (const fileBuffer of files) {
    const pdf = await PDFDocument.load(fileBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return await mergedPdf.save();
}

/**
 * Split a PDF into ranges or extract individual pages
 */
export async function splitPDF(
  file: ArrayBuffer,
  ranges: { start: number; end: number }[]
): Promise<{ filename: string; fileBytes: Uint8Array }[]> {
  const sourcePdf = await PDFDocument.load(file);
  const totalPages = sourcePdf.getPageCount();
  const results: { filename: string; fileBytes: Uint8Array }[] = [];

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const newPdf = await PDFDocument.create();
    
    // Page ranges are 1-indexed, pdf-lib is 0-indexed
    const pageIndices: number[] = [];
    const start = Math.max(1, Math.min(range.start, totalPages));
    const end = Math.max(start, Math.min(range.end, totalPages));
    
    for (let p = start - 1; p < end; p++) {
      pageIndices.push(p);
    }
    
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));
    
    const bytes = await newPdf.save();
    results.push({
      filename: `split-pages-${start}-to-${end}.pdf`,
      fileBytes: bytes,
    });
  }

  return results;
}

/**
 * Rotate pages of a PDF by degrees (90, 180, 270)
 */
export async function rotatePDF(
  file: ArrayBuffer,
  pageRotations: Record<number, number> // 0-indexed page index -> rotation in degrees
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(file);
  
  Object.entries(pageRotations).forEach(([indexStr, rotation]) => {
    const index = parseInt(indexStr, 10);
    const page = pdf.getPage(index);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotation) % 360));
  });

  return await pdf.save();
}

/**
 * Add a text watermark to all pages of a PDF
 */
export async function addTextWatermark(
  file: ArrayBuffer,
  text: string,
  options: {
    fontSize?: number;
    opacity?: number;
    angle?: number;
    colorHex?: string; // hex color e.g., '#FF0000'
  } = {}
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(file);
  const helveticaFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  
  const fontSize = options.fontSize || 50;
  const opacity = options.opacity !== undefined ? options.opacity : 0.4;
  const angle = options.angle !== undefined ? options.angle : 45;
  
  // Parse color hex
  const hex = (options.colorHex || "#FF0000").replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

  const pages = pdf.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    
    // Draw in the center of the page
    page.drawText(text, {
      x: width / 4,
      y: height / 2,
      size: fontSize,
      font: helveticaFont,
      color: rgb(r, g, b),
      rotate: degrees(angle),
      opacity: opacity,
    });
  }

  return await pdf.save();
}

/**
 * Add image watermark to all pages of a PDF
 */
export async function addImageWatermark(
  file: ArrayBuffer,
  imageBuffer: ArrayBuffer,
  imageType: "png" | "jpeg",
  options: {
    scale?: number;
    opacity?: number;
    angle?: number;
  } = {}
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(file);
  
  let embeddedImage;
  if (imageType === "png") {
    embeddedImage = await pdf.embedPng(imageBuffer);
  } else {
    embeddedImage = await pdf.embedJpg(imageBuffer);
  }

  const scale = options.scale || 0.5;
  const opacity = options.opacity !== undefined ? options.opacity : 0.4;
  const angle = options.angle !== undefined ? options.angle : 0;

  const pages = pdf.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    const dims = embeddedImage.scale(scale);
    
    page.drawImage(embeddedImage, {
      x: (width - dims.width) / 2,
      y: (height - dims.height) / 2,
      width: dims.width,
      height: dims.height,
      rotate: degrees(angle),
      opacity: opacity,
    });
  }

  return await pdf.save();
}

/**
 * Add Page Numbers to PDF
 */
export async function addPageNumbers(
  file: ArrayBuffer,
  options: {
    format?: string; // e.g. "Page {n} of {total}" or just "{n}"
    position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
    fontSize?: number;
    colorHex?: string;
  } = {}
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(file);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  const format = options.format || "{n}";
  const position = options.position || "bottom-center";
  const fontSize = options.fontSize || 10;
  
  const hex = (options.colorHex || "#000000").replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

  const pages = pdf.getPages();
  const total = pages.length;

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    
    // Page index is 0-indexed, human page number is 1-indexed
    const pageNumText = format
      .replace("{n}", (i + 1).toString())
      .replace("{total}", total.toString());

    // Calculate coordinate placement
    let x = width / 2;
    let y = 30; // default footer margin
    const textWidth = font.widthOfTextAtSize(pageNumText, fontSize);

    // X coordinate calculation
    if (position.endsWith("left")) {
      x = 30;
    } else if (position.endsWith("right")) {
      x = width - textWidth - 30;
    } else { // center
      x = (width - textWidth) / 2;
    }

    // Y coordinate calculation
    if (position.startsWith("top")) {
      y = height - 40;
    } else { // bottom
      y = 30;
    }

    page.drawText(pageNumText, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(r, g, b),
    });
  }

  return await pdf.save();
}

/**
 * Visual PDF Organizer: reorder, delete, and duplicate pages
 */
export async function organizePDF(
  file: ArrayBuffer,
  pageOrder: number[] // array of original page indices (0-indexed) to keep in this specific order
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(file);
  const newPdf = await PDFDocument.create();
  
  const copiedPages = await newPdf.copyPages(sourcePdf, pageOrder);
  copiedPages.forEach((page) => newPdf.addPage(page));
  
  return await newPdf.save();
}

/**
 * Sign a PDF with an image overlay on specific page and coordinates
 */
export async function signPDF(
  file: ArrayBuffer,
  signatureImageBuffer: ArrayBuffer,
  imageType: "png" | "jpeg",
  signatures: {
    pageIndex: number;
    x: number; // percentage (0-100) or absolute px
    y: number; // percentage (0-100) or absolute px
    width: number;
    height: number;
  }[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(file);
  
  let embeddedImage;
  if (imageType === "png") {
    embeddedImage = await pdf.embedPng(signatureImageBuffer);
  } else {
    embeddedImage = await pdf.embedJpg(signatureImageBuffer);
  }

  signatures.forEach((sig) => {
    const page = pdf.getPage(sig.pageIndex);
    const { width: pageWidth, height: pageHeight } = page.getSize();
    
    // Calculate coordinates (scaling inputs, which are typically based on viewer coordinates)
    const x = sig.x;
    const y = sig.y;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: sig.width,
      height: sig.height,
    });
  });

  return await pdf.save();
}

/**
 * Convert a list of images into a single PDF
 */
export async function imagesToPDF(
  images: { buffer: ArrayBuffer; type: "png" | "jpeg" }[],
  options: {
    pageSize?: "A4" | "LETTER";
    orientation?: "portrait" | "landscape";
    margin?: number; // margin in pt (0, 20, 40)
  } = {}
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create(); // clean slate
  const margin = options.margin !== undefined ? options.margin : 20;
  const isA4 = options.pageSize !== "LETTER";
  
  // Page Sizes in points: A4 is 595.27 x 841.89, Letter is 612 x 792
  let targetWidth = isA4 ? 595.27 : 612;
  let targetHeight = isA4 ? 841.89 : 792;
  
  if (options.orientation === "landscape") {
    const temp = targetWidth;
    targetWidth = targetHeight;
    targetHeight = temp;
  }

  for (const img of images) {
    const page = pdf.addPage([targetWidth, targetHeight]);
    
    let embeddedImg;
    if (img.type === "png") {
      embeddedImg = await pdf.embedPng(img.buffer);
    } else {
      embeddedImg = await pdf.embedJpg(img.buffer);
    }

    const { width: imgWidth, height: imgHeight } = embeddedImg;
    
    // Fit image inside available width and height (accounting for margins)
    const availWidth = targetWidth - margin * 2;
    const availHeight = targetHeight - margin * 2;
    
    const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;
    
    // Center the image
    const x = margin + (availWidth - drawWidth) / 2;
    const y = margin + (availHeight - drawHeight) / 2;

    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdf.save();
}

/**
 * Protect a PDF with a password
 */
export async function protectPDF(
  file: ArrayBuffer,
  password: string
): Promise<Uint8Array> {
  const fileBytes = new Uint8Array(file);
  const encryptedBytes = await encryptPDF(fileBytes, password, password);
  return encryptedBytes;
}

/**
 * Unlock a PDF using a password
 */
export async function unlockPDF(
  file: ArrayBuffer,
  password: string
): Promise<Uint8Array> {
  const fileBytes = new Uint8Array(file);
  const decryptedBytes = await decryptPDF(fileBytes, password);
  return decryptedBytes;
}

/**
 * Compress PDF client-side by re-saving it with options
 */
export async function compressPDF(
  file: ArrayBuffer
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(file);
  // pdf-lib compressions can use object streams and compact saves
  return await pdf.save({
    useObjectStreams: true,
  });
}
