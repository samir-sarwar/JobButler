/**
 * PDF Parser Service
 * Extracts text content from uploaded PDF files
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extract text from a PDF buffer
 * @param {Buffer} pdfBuffer - The PDF file as a buffer
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractText(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    let text = data.text || '';

    // Clean up the extracted text
    // Normalize whitespace (multiple spaces/newlines to single)
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');

    // Trim each line
    text = text.split('\n').map(line => line.trim()).join('\n');

    // Remove empty lines at start/end
    text = text.trim();

    return text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
}

/**
 * Get PDF metadata
 * @param {Buffer} pdfBuffer - The PDF file as a buffer
 * @returns {Promise<Object>} - PDF metadata
 */
export async function getMetadata(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);

    return {
      pages: data.numpages,
      info: data.info,
      textLength: (data.text || '').length,
    };
  } catch (error) {
    console.error('PDF metadata error:', error);
    throw new Error('Failed to read PDF metadata: ' + error.message);
  }
}

export default {
  extractText,
  getMetadata
};
