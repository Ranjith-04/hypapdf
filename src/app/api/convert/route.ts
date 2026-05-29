import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// Helper to run shell commands as a promise
const execPromise = (command: string): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

export async function POST(req: NextRequest) {
  let tempDir = "";
  let inputFilePath = "";
  let outputFilePath = "";

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const toFormat = formData.get("to") as string; // 'pdf', 'docx', 'pptx', 'xlsx', 'pdfa'

    if (!file || !toFormat) {
      return NextResponse.json(
        { error: "Missing file or target format ('to')." },
        { status: 400 }
      );
    }

    // Sanitize target format
    const validFormats = ["pdf", "docx", "pptx", "xlsx", "pdfa"];
    if (!validFormats.includes(toFormat)) {
      return NextResponse.json(
        { error: "Invalid target format." },
        { status: 400 }
      );
    }

    // Get file extension from original name
    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();

    // Create a temporary directory unique to this request
    const systemTempDir = os.tmpdir();
    tempDir = await fs.mkdtemp(path.join(systemTempDir, "hypapdf-"));

    // Generate a secure random filename to prevent command injection
    const randomId = Math.random().toString(36).substring(2, 15);
    const inputFileName = `${randomId}${ext}`;
    inputFilePath = path.join(tempDir, inputFileName);

    // Save uploaded file to temp path
    const fileBytes = await file.arrayBuffer();
    const buffer = Buffer.from(fileBytes);
    await fs.writeFile(inputFilePath, buffer);

    // Build the command line
    let command = "";
    let expectedOutputName = "";

    if (toFormat === "pdf") {
      // Office -> PDF
      command = `soffice --headless --convert-to pdf --outdir "${tempDir}" "${inputFilePath}"`;
      expectedOutputName = `${randomId}.pdf`;
    } else if (toFormat === "pdfa") {
      // PDF -> PDF/A
      command = `soffice --headless --convert-to pdf:writer_pdf_Export --outdir "${tempDir}" "${inputFilePath}"`;
      expectedOutputName = `${randomId}.pdf`;
    } else {
      // PDF -> Office (docx, pptx, xlsx)
      let inFilter = "";
      if (toFormat === "docx") inFilter = "writer_pdf_import";
      if (toFormat === "pptx") inFilter = "impress_pdf_import";
      if (toFormat === "xlsx") inFilter = "calc_pdf_import";

      command = `soffice --headless --infilter="${inFilter}" --convert-to ${toFormat} --outdir "${tempDir}" "${inputFilePath}"`;
      expectedOutputName = `${randomId}.${toFormat}`;
    }

    // Execute LibreOffice command
    try {
      await execPromise(command);
    } catch (err: any) {
      console.error("LibreOffice execution error:", err);
      return NextResponse.json(
        {
          error: "LibreOffice conversion failed. Please ensure LibreOffice (soffice) is installed and available in the server's PATH.",
          details: err.message,
        },
        { status: 500 }
      );
    }

    outputFilePath = path.join(tempDir, expectedOutputName);

    // Check if output file was created
    try {
      await fs.access(outputFilePath);
    } catch {
      return NextResponse.json(
        { error: "Converted output file was not found. Conversion might have failed." },
        { status: 500 }
      );
    }

    // Read the converted file bytes
    const convertedFileBuffer = await fs.readFile(outputFilePath);

    // Map content types
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      pdfa: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    // Clean up files in background
    cleanup(tempDir).catch(console.error);

    // Generate output filename
    const originalBase = path.basename(originalName, ext);
    const downloadExt = toFormat === "pdfa" ? "pdf" : toFormat;
    const finalFilename = `${originalBase}-converted.${downloadExt}`;

    return new NextResponse(convertedFileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentTypes[toFormat] || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(finalFilename)}"`,
      },
    });

  } catch (error: any) {
    console.error("Convert API Error:", error);
    // Cleanup if folders were created
    if (tempDir) {
      cleanup(tempDir).catch(console.error);
    }
    return NextResponse.json(
      { error: "Internal server error during conversion.", details: error.message },
      { status: 500 }
    );
  }
}

// Helper to remove directory and its contents
async function cleanup(dirPath: string) {
  try {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      await fs.unlink(path.join(dirPath, file));
    }
    await fs.rmdir(dirPath);
  } catch (err) {
    console.error(`Failed to clean up directory ${dirPath}:`, err);
  }
}
