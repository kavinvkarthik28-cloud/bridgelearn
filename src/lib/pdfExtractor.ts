import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using Vite's ?url import for bundling
// This ensures the worker is bundled with the application
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 8000; // Characters to send to API

export interface PDFExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
}

export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  console.log(`[PDF Extraction] Starting extraction for: ${file.name}`);
  console.log(`[PDF Extraction] pdfjs version: ${pdfjsLib.version}`);
  console.log(`[PDF Extraction] Worker URL set to: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    console.log(`[PDF Extraction] File too large: ${file.size} bytes`);
    return {
      success: false,
      error: 'File size exceeds 10MB limit. Please upload a smaller PDF.',
    };
  }

  try {
    console.log(`[PDF Extraction] Converting file to ArrayBuffer...`);
    const arrayBuffer = await file.arrayBuffer();
    console.log(`[PDF Extraction] File converted to ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`);

    console.log(`[PDF Extraction] Loading PDF document...`);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`[PDF Extraction] PDF document loaded, pages: ${pdf.numPages}`);

    let fullText = '';
    let hasExtractableText = false;
    let pagesExtracted = 0;
    let pagesFailed = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        console.log(`[PDF Extraction] Extracting page ${i}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item: unknown) => {
            if (typeof item === 'object' && item !== null && 'str' in item) {
              return (item as { str: string }).str;
            }
            return '';
          })
          .join(' ');

        const charCount = pageText.trim().length;
        console.log(`[PDF Extraction] Page ${i} extracted, characters: ${charCount}`);

        if (pageText.trim()) {
          hasExtractableText = true;
          fullText += pageText + '\n\n';
          pagesExtracted++;
        }
      } catch (pageError) {
        pagesFailed++;
        console.error(`[PDF Extraction] Failed to extract page ${i}:`, pageError);
        // Continue with other pages even if one fails
      }
    }

    console.log(`[PDF Extraction] Extraction complete: ${pagesExtracted} pages extracted, ${pagesFailed} pages failed`);

    if (!hasExtractableText) {
      console.log(`[PDF Extraction] No extractable text found`);
      return {
        success: false,
        error: 'This PDF appears to be scanned images - text extraction not yet supported.',
      };
    }

    // Trim to max length
    const trimmedText = fullText.trim().slice(0, MAX_TEXT_LENGTH);
    console.log(`[PDF Extraction] Final text length: ${trimmedText.length} characters`);

    return {
      success: true,
      text: trimmedText,
    };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[PDF Extraction] Error (${errorName}):`, errorMessage);
    console.error('[PDF Extraction] Full error:', error);

    return {
      success: false,
      error: `${errorName}: ${errorMessage}`,
    };
  }
}
