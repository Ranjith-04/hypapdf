/**
 * Client-Side Image Processing Utilities for HypaImage
 */

// Helper: Convert File to Image object
export const fileToImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
};

// Helper: Convert Canvas to Blob
export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  format: string = "image/jpeg",
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas conversion failed."));
        }
      },
      format,
      quality
    );
  });
};

// 1. Compress Image
export const compressImage = async (
  file: File,
  quality: number
): Promise<Blob> => {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  // Draw base image
  ctx.drawImage(img, 0, 0);

  // For compression, we output as JPEG (or WEBP if supported)
  const format = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
  return canvasToBlob(canvas, format, quality);
};

// 2. Resize Image
export const resizeImage = async (
  file: File,
  width: number,
  height: number,
  format: string = "image/jpeg"
): Promise<Blob> => {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  // High quality resizing options
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(img, 0, 0, width, height);

  return canvasToBlob(canvas, format, 0.9);
};

// 3. Crop Image
export const cropImage = async (
  file: File,
  cropArea: { x: number; y: number; width: number; height: number },
  format: string = "image/jpeg"
): Promise<Blob> => {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  return canvasToBlob(canvas, format, 0.95);
};

// 4 & 5. Convert Image
export const convertFormat = async (
  file: File,
  targetFormat: "jpeg" | "png" | "webp"
): Promise<Blob> => {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  // If target format is JPEG, draw a white background first to support transparent PNG backgrounds
  if (targetFormat === "jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  const mimeType = `image/${targetFormat}`;
  return canvasToBlob(canvas, mimeType, 0.95);
};

// 6. Photo Editor (Adjustments & Filters)
export interface EditorAdjustments {
  brightness: number; // 0 to 200 (100 is default)
  contrast: number;   // 0 to 200 (100 is default)
  saturation: number; // 0 to 200 (100 is default)
  filter: "none" | "grayscale" | "sepia" | "invert" | "blur";
}

export const adjustPhoto = async (
  file: File,
  adjustments: EditorAdjustments,
  format: string = "image/jpeg"
): Promise<Blob> => {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  // Build the CSS filter string for canvas 2D
  let filterString = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
  if (adjustments.filter !== "none") {
    if (adjustments.filter === "blur") {
      filterString += ` blur(5px)`;
    } else {
      filterString += ` ${adjustments.filter}(100%)`;
    }
  }

  ctx.filter = filterString;
  ctx.drawImage(img, 0, 0);

  return canvasToBlob(canvas, format, 0.95);
};

// 7. Upscale Image (Resize & Apply Sharpening)
export const upscaleImage = async (
  file: File,
  scaleFactor: number, // e.g. 2 or 4
  format: string = "image/jpeg"
): Promise<Blob> => {
  const img = await fileToImage(file);
  const width = img.naturalWidth * scaleFactor;
  const height = img.naturalHeight * scaleFactor;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // Apply a convolution sharpen filter to make it look crisp after upscaling
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const weights = [
      0, -0.2, 0,
      -0.2, 1.8, -0.2,
      0, -0.2, 0
    ];
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    
    const output = ctx.createImageData(width, height);
    const dst = output.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sy = y;
        const sx = x;
        const dstOff = (y * width + x) * 4;
        
        let r = 0, g = 0, b = 0;
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = sy + cy - halfSide;
            const scx = sx + cx - halfSide;
            if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
              const srcOff = (scy * width + scx) * 4;
              const wt = weights[cy * side + cx];
              r += data[srcOff] * wt;
              g += data[srcOff + 1] * wt;
              b += data[srcOff + 2] * wt;
            }
          }
        }
        dst[dstOff] = Math.min(255, Math.max(0, r));
        dst[dstOff + 1] = Math.min(255, Math.max(0, g));
        dst[dstOff + 2] = Math.min(255, Math.max(0, b));
        dst[dstOff + 3] = data[dstOff + 3]; // Preserve alpha
      }
    }
    ctx.putImageData(output, 0, 0);
  } catch (e) {
    console.warn("Sharpening filter failed, falling back to basic upscale:", e);
  }

  return canvasToBlob(canvas, format, 0.95);
};

// 8. Remove Background (Chroma Key/Color Eraser)
export const removeBackground = async (
  file: File,
  targetColor: { r: number; g: number; b: number },
  tolerance: number
): Promise<Blob> => {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate color distance (Euclidean distance in RGB space)
    const distance = Math.sqrt(
      Math.pow(r - targetColor.r, 2) +
      Math.pow(g - targetColor.g, 2) +
      Math.pow(b - targetColor.b, 2)
    );

    if (distance <= tolerance) {
      data[i + 3] = 0; // Make pixel transparent
    }
  }

  ctx.putImageData(imgData, 0, 0);

  return canvasToBlob(canvas, "image/png"); // Must be PNG to support transparency
};

// 9. Watermark Image
export interface WatermarkSettings {
  type: "text" | "image";
  text?: string;
  textColor?: string;
  fontSize?: number;
  opacity?: number;
  rotation?: number; // degrees
  watermarkImage?: File;
  imageScale?: number;
}

export const watermarkImage = async (
  file: File,
  settings: WatermarkSettings,
  format: string = "image/jpeg"
): Promise<Blob> => {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  // Draw base image
  ctx.drawImage(img, 0, 0);

  if (settings.type === "text" && settings.text) {
    ctx.save();
    ctx.font = `bold ${settings.fontSize || 40}px sans-serif`;
    ctx.fillStyle = settings.textColor || "#ffffff";
    ctx.globalAlpha = settings.opacity || 0.5;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw repeating watermarks across canvas
    const spacingX = (settings.fontSize || 40) * 8;
    const spacingY = (settings.fontSize || 40) * 4;

    for (let y = spacingY / 2; y < canvas.height; y += spacingY) {
      for (let x = spacingX / 2; x < canvas.width; x += spacingX) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(((settings.rotation || 45) * Math.PI) / 180);
        ctx.fillText(settings.text, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  } else if (settings.type === "image" && settings.watermarkImage) {
    const wmImg = await fileToImage(settings.watermarkImage);
    ctx.save();
    ctx.globalAlpha = settings.opacity || 0.5;
    
    // Scale watermark relative to the base image
    const wmWidth = wmImg.naturalWidth * (settings.imageScale || 0.5);
    const wmHeight = wmImg.naturalHeight * (settings.imageScale || 0.5);
    
    // Draw at bottom right with padding
    const padding = 20;
    const x = canvas.width - wmWidth - padding;
    const y = canvas.height - wmHeight - padding;
    
    ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
    ctx.restore();
  }

  return canvasToBlob(canvas, format, 0.95);
};

// 10. Meme Generator
export const generateMeme = async (
  file: File,
  topText: string,
  bottomText: string,
  format: string = "image/jpeg"
): Promise<Blob> => {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  // Draw base image
  ctx.drawImage(img, 0, 0);

  // Setup text styling
  ctx.save();
  const fontSize = Math.max(20, Math.floor(canvas.width / 15));
  ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = fontSize / 8;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Top Text
  if (topText) {
    ctx.fillText(topText.toUpperCase(), canvas.width / 2, 20);
    ctx.strokeText(topText.toUpperCase(), canvas.width / 2, 20);
  }

  // Bottom Text
  if (bottomText) {
    ctx.textBaseline = "bottom";
    ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20);
    ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20);
  }

  ctx.restore();
  return canvasToBlob(canvas, format, 0.95);
};

// 11. Rotate Image
export const rotateImage = async (
  file: File,
  degrees: number,
  format: string = "image/jpeg"
): Promise<Blob> => {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");

  // Determine width/height based on rotation angle (e.g. swap width and height for 90 or 270)
  const is90or270 = (degrees / 90) % 2 !== 0;
  canvas.width = is90or270 ? img.naturalHeight : img.naturalWidth;
  canvas.height = is90or270 ? img.naturalWidth : img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();

  return canvasToBlob(canvas, format, 0.95);
};

// 12. HTML to Image (Renders HTML markup on canvas)
export const htmlToImage = async (
  htmlCode: string,
  width: number = 800,
  height: number = 600
): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  // Draw background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Wrap the HTML code inside an SVG foreignObject
  const doc = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
          ${htmlCode}
        </div>
      </foreignObject>
    </svg>
  `;

  const blob = new Blob([doc], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  const loadPromise = new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to render HTML. Please ensure the HTML code contains valid CSS and structure."));
    };
  });
  
  img.src = url;
  await loadPromise;

  return canvasToBlob(canvas, "image/png");
};

// 13. Blur Face / Select Coordinates
export interface BlurArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const blurAreas = async (
  file: File,
  areas: BlurArea[],
  radius: number = 20,
  format: string = "image/jpeg"
): Promise<Blob> => {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  ctx.drawImage(img, 0, 0);

  // Apply a box blur or simple pixelation over the specified regions
  areas.forEach((area) => {
    const x = Math.max(0, area.x);
    const y = Math.max(0, area.y);
    const w = Math.min(canvas.width - x, area.width);
    const h = Math.min(canvas.height - y, area.height);

    if (w <= 0 || h <= 0) return;

    try {
      const areaData = ctx.getImageData(x, y, w, h);
      const pix = areaData.data;

      // Simple pixelation (creates a very clean, retro censor blur effect)
      const size = Math.max(8, radius / 2);
      for (let py = 0; py < h; py += size) {
        for (let px = 0; px < w; px += size) {
          // Find average color in this pixel block
          let r = 0, g = 0, b = 0, count = 0;
          for (let dy = 0; dy < size && py + dy < h; dy++) {
            for (let dx = 0; dx < size && px + dx < w; dx++) {
              const offset = ((py + dy) * w + (px + dx)) * 4;
              r += pix[offset];
              g += pix[offset + 1];
              b += pix[offset + 2];
              count++;
            }
          }
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);

          // Fill this block with the average color
          for (let dy = 0; dy < size && py + dy < h; dy++) {
            for (let dx = 0; dx < size && px + dx < w; dx++) {
              const offset = ((py + dy) * w + (px + dx)) * 4;
              pix[offset] = r;
              pix[offset + 1] = g;
              pix[offset + 2] = b;
            }
          }
        }
      }
      ctx.putImageData(areaData, x, y);
    } catch (e) {
      console.warn("Blur region extraction failed:", e);
    }
  });

  return canvasToBlob(canvas, format, 0.95);
};
