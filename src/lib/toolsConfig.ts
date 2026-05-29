import * as Icons from "lucide-react";

export type ToolCategory =
  | "organize"
  | "to-pdf"
  | "from-pdf"
  | "edit"
  | "security"
  | "others";

export interface PDFTool {
  slug: string;
  title: string;
  description: string;
  category: ToolCategory;
  iconName: keyof typeof Icons;
  colorClass: string;
  requiresLibreOffice?: boolean;
}

export const CATEGORIES: { id: ToolCategory; name: string; desc: string }[] = [
  {
    id: "organize",
    name: "Organize PDF",
    desc: "Merge, split, visual reordering, and page rotations",
  },
  {
    id: "to-pdf",
    name: "Convert to PDF",
    desc: "Convert Office, images, HTML, and text to PDF",
  },
  {
    id: "from-pdf",
    name: "Convert from PDF",
    desc: "Convert PDF to Word, Excel, PowerPoint, JPG, and Text",
  },
  {
    id: "edit",
    name: "Edit PDF",
    desc: "Add signatures, watermarks, and page numbers",
  },
  {
    id: "security",
    name: "PDF Security",
    desc: "Encrypt or decrypt files with passwords",
  },
  {
    id: "others",
    name: "Other Tools",
    desc: "Compress, repair, or convert to PDF/A archive format",
  },
];

export const TOOLS: PDFTool[] = [
  // Organize
  {
    slug: "merge-pdf",
    title: "Merge PDF",
    description: "Combine multiple PDF documents into one single file, easily and in seconds.",
    category: "organize",
    iconName: "Combine",
    colorClass: "from-red-500 to-rose-600",
  },
  {
    slug: "split-pdf",
    title: "Split PDF",
    description: "Extract specific page ranges or split each page into a separate PDF file.",
    category: "organize",
    iconName: "Scissors",
    colorClass: "from-orange-500 to-amber-600",
  },
  {
    slug: "organize-pdf",
    title: "Organize PDF",
    description: "Visually drag and drop thumbnails to reorder, delete, or duplicate PDF pages.",
    category: "organize",
    iconName: "SlidersHorizontal",
    colorClass: "from-amber-500 to-yellow-600",
  },
  {
    slug: "rotate-pdf",
    title: "Rotate PDF",
    description: "Rotate individual pages or the entire PDF document in any direction.",
    category: "organize",
    iconName: "RotateCw",
    colorClass: "from-yellow-500 to-lime-600",
  },

  // Convert to PDF
  {
    slug: "word-to-pdf",
    title: "Word to PDF",
    description: "Convert DOC and DOCX documents to high-quality PDF files.",
    category: "to-pdf",
    iconName: "FilePlus2",
    colorClass: "from-blue-500 to-indigo-600",
    requiresLibreOffice: true,
  },
  {
    slug: "ppt-to-pdf",
    title: "PowerPoint to PDF",
    description: "Convert PPT and PPTX presentation decks to standard PDF format.",
    category: "to-pdf",
    iconName: "FileUp",
    colorClass: "from-orange-600 to-red-700",
    requiresLibreOffice: true,
  },
  {
    slug: "excel-to-pdf",
    title: "Excel to PDF",
    description: "Convert XLS and XLSX spreadsheets directly to clean PDF files.",
    category: "to-pdf",
    iconName: "FileSpreadsheet",
    colorClass: "from-emerald-500 to-teal-600",
    requiresLibreOffice: true,
  },
  {
    slug: "jpg-to-pdf",
    title: "JPG to PDF",
    description: "Convert JPG, PNG, and WebP images to PDF with margins, scale, and layout options.",
    category: "to-pdf",
    iconName: "FileImage",
    colorClass: "from-purple-500 to-pink-600",
  },
  {
    slug: "html-to-pdf",
    title: "HTML to PDF",
    description: "Convert active web pages or raw HTML files into a static PDF document.",
    category: "to-pdf",
    iconName: "Code2",
    colorClass: "from-pink-500 to-rose-600",
    requiresLibreOffice: true,
  },

  // Convert from PDF
  {
    slug: "pdf-to-word",
    title: "PDF to Word",
    description: "Convert PDF documents back to fully editable DOCX Word files.",
    category: "from-pdf",
    iconName: "FileText",
    colorClass: "from-blue-600 to-sky-500",
    requiresLibreOffice: true,
  },
  {
    slug: "pdf-to-pptx",
    title: "PDF to PowerPoint",
    description: "Convert PDF documents into editable Microsoft PPTX slide presentation files.",
    category: "from-pdf",
    iconName: "Presentation",
    colorClass: "from-red-600 to-orange-500",
    requiresLibreOffice: true,
  },
  {
    slug: "pdf-to-xlsx",
    title: "PDF to Excel",
    description: "Extract data tables from PDF files directly into XLSX Microsoft Excel sheets.",
    category: "from-pdf",
    iconName: "Grid3X3",
    colorClass: "from-emerald-600 to-green-500",
    requiresLibreOffice: true,
  },
  {
    slug: "pdf-to-jpg",
    title: "PDF to JPG",
    description: "Render and extract PDF pages as standard high-quality JPG image files.",
    category: "from-pdf",
    iconName: "ImageDown",
    colorClass: "from-violet-500 to-purple-600",
  },
  {
    slug: "pdf-to-text",
    title: "PDF to Text",
    description: "Extract raw plain text from all pages in a PDF document.",
    category: "from-pdf",
    iconName: "FileOutput",
    colorClass: "from-slate-500 to-slate-600",
  },

  // Edit PDF
  {
    slug: "sign-pdf",
    title: "Sign PDF",
    description: "Draw, type, or upload your signature to place on specific PDF pages and positions.",
    category: "edit",
    iconName: "PenTool",
    colorClass: "from-rose-500 to-pink-600",
  },
  {
    slug: "watermark",
    title: "Watermark",
    description: "Add a customizable text or image watermark overlay onto all pages of your PDF.",
    category: "edit",
    iconName: "BadgeAlert",
    colorClass: "from-pink-600 to-fuchsia-600",
  },
  {
    slug: "page-numbers",
    title: "Page Numbers",
    description: "Stamp customized page numbers with chosen placement, size, and fonts.",
    category: "edit",
    iconName: "Hash",
    colorClass: "from-teal-500 to-cyan-600",
  },

  // Security
  {
    slug: "protect-pdf",
    title: "Protect PDF",
    description: "Encrypt and secure your PDF files with custom user and owner passwords.",
    category: "security",
    iconName: "Lock",
    colorClass: "from-cyan-500 to-blue-600",
  },
  {
    slug: "unlock-pdf",
    title: "Unlock PDF",
    description: "Remove passwords, permissions restrictions, and security from protected PDFs.",
    category: "security",
    iconName: "Unlock",
    colorClass: "from-sky-500 to-teal-600",
  },

  // Others
  {
    slug: "compress-pdf",
    title: "Compress PDF",
    description: "Shrink the file size of your PDF while maintaining optimal visual quality.",
    category: "others",
    iconName: "FileDown",
    colorClass: "from-indigo-500 to-violet-600",
  },
  {
    slug: "pdf-to-pdfa",
    title: "PDF to PDF/A",
    description: "Convert standard PDFs to standardized PDF/A documents for long-term archiving.",
    category: "others",
    iconName: "Archive",
    colorClass: "from-slate-600 to-zinc-700",
    requiresLibreOffice: true,
  },
  {
    slug: "repair-pdf",
    title: "Repair PDF",
    description: "Analyze, reconstruct, and fix damaged or corrupt PDF documents.",
    category: "others",
    iconName: "Wrench",
    colorClass: "from-zinc-500 to-neutral-600",
  },
];
