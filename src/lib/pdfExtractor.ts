import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 8000; // Characters to send to API

export interface PDFExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
}

export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: 'File size exceeds 10MB limit. Please upload a smaller PDF.',
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    let hasExtractableText = false;

    for (let i = 1; i <= pdf.numPages; i++) {
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

      if (pageText.trim()) {
        hasExtractableText = true;
        fullText += pageText + '\n\n';
      }
    }

    if (!hasExtractableText) {
      return {
        success: false,
        error: 'This PDF appears to be scanned images - text extraction not yet supported.',
      };
    }

    // Trim to max length
    const trimmedText = fullText.trim().slice(0, MAX_TEXT_LENGTH);

    return {
      success: true,
      text: trimmedText,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      success: false,
      error: 'Could not read this PDF. Please try a different file.',
    };
  }
}
