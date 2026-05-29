import * as Icons from "lucide-react";

export type ImageToolCategory = "modify" | "convert" | "editor";

export interface ImageTool {
  slug: string;
  title: string;
  description: string;
  category: ImageToolCategory;
  iconName: keyof typeof Icons;
  colorClass: string;
  badge?: string;
}

export const IMAGE_CATEGORIES: { id: ImageToolCategory; name: string; desc: string }[] = [
  {
    id: "modify",
    name: "Modify Image",
    desc: "Compress, resize, crop, and rotate images with ease",
  },
  {
    id: "convert",
    name: "Convert Image",
    desc: "Convert in bulk to or from JPG format",
  },
  {
    id: "editor",
    name: "Creative Tools",
    desc: "Photo editor, background removal, watermarks, memes, face blurring, and upscaling",
  },
];

export const IMAGE_TOOLS: ImageTool[] = [
  {
    slug: "compress-image",
    title: "Compress IMAGE",
    description: "Compress JPG, PNG, SVG, and GIFs while saving space and maintaining quality.",
    category: "modify",
    iconName: "Minimize2",
    colorClass: "from-blue-500 to-cyan-600",
  },
  {
    slug: "resize-image",
    title: "Resize IMAGE",
    description: "Define your dimensions, by percent or pixel, and resize your JPG, PNG, SVG, and GIF images.",
    category: "modify",
    iconName: "Maximize2",
    colorClass: "from-cyan-500 to-teal-600",
  },
  {
    slug: "crop-image",
    title: "Crop IMAGE",
    description: "Crop JPG, PNG, or GIFs with ease; choose pixels to define your rectangle or use our visual editor.",
    category: "modify",
    iconName: "Crop",
    colorClass: "from-teal-500 to-emerald-600",
  },
  {
    slug: "convert-to-jpg",
    title: "Convert to JPG",
    description: "Turn PNG, GIF, TIF, PSD, SVG, WEBP, HEIC, or RAW format images to JPG in bulk with ease.",
    category: "convert",
    iconName: "FileImage",
    colorClass: "from-indigo-500 to-blue-600",
  },
  {
    slug: "convert-from-jpg",
    title: "Convert from JPG",
    description: "Turn JPG images to PNG and GIF. Choose several JPGs to create an animated GIF in seconds!",
    category: "convert",
    iconName: "ImageDown",
    colorClass: "from-violet-500 to-purple-600",
  },
  {
    slug: "photo-editor",
    title: "Photo editor",
    description: "Spice up your pictures with text, effects, frames or stickers. Simple editing tools for your image needs.",
    category: "editor",
    iconName: "Sliders",
    colorClass: "from-pink-500 to-rose-600",
  },
  {
    slug: "upscale-image",
    title: "Upscale Image",
    description: "Enlarge your images with high resolution. Easily increase the size of your JPG and PNG images while maintaining visual quality.",
    category: "editor",
    iconName: "Sparkles",
    colorClass: "from-purple-600 to-indigo-600",
    badge: "New",
  },
  {
    slug: "remove-background",
    title: "Remove background",
    description: "Quickly remove image backgrounds with high accuracy. Instantly detect objects and cut out backgrounds with ease.",
    category: "editor",
    iconName: "Eraser",
    colorClass: "from-emerald-500 to-teal-600",
    badge: "New",
  },
  {
    slug: "watermark-image",
    title: "Watermark IMAGE",
    description: "Stamp an image or text over your images in seconds. Choose the typography, transparency and position.",
    category: "editor",
    iconName: "Stamp",
    colorClass: "from-rose-500 to-pink-600",
  },
  {
    slug: "meme-generator",
    title: "Meme generator",
    description: "Create your memes online with ease. Caption meme images or upload your pictures to make custom memes.",
    category: "editor",
    iconName: "Smile",
    colorClass: "from-orange-500 to-red-600",
  },
  {
    slug: "rotate-image",
    title: "Rotate IMAGE",
    description: "Rotate many images JPG, PNG or GIF at same time. Choose to rotate only landscape or portrait images!",
    category: "modify",
    iconName: "RotateCw",
    colorClass: "from-yellow-500 to-amber-600",
  },
  {
    slug: "html-to-image",
    title: "HTML to IMAGE",
    description: "Convert webpages in HTML to JPG or SVG. Copy and paste the URL of the page you want and convert it to IMAGE with a click.",
    category: "convert",
    iconName: "Globe",
    colorClass: "from-pink-600 to-rose-700",
  },
  {
    slug: "blur-face",
    title: "Blur face",
    description: "Easily blur out faces in photos. You can also blur licence plates and other objects to hide private information.",
    category: "editor",
    iconName: "EyeOff",
    colorClass: "from-blue-600 to-sky-500",
    badge: "New",
  },
];
