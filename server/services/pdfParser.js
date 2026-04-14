/**
 * PDF Parser Service
 * Extracts text content from uploaded PDF files
 */
import { PDFParse } from 'pdf-parse';

export async function extractText(pdfBuffer) {
  const parser = new PDFParse({ data: pdfBuffer });
  try {
    const result = await parser.getText();
    let text = result.text || '';

    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.split('\n').map(line => line.trim()).join('\n');
    text = text.trim();

    return text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  } finally {
    await parser.destroy();
  }
}

export async function getMetadata(pdfBuffer) {
  const parser = new PDFParse({ data: pdfBuffer });
  try {
    const [infoResult, textResult] = await Promise.all([
      parser.getInfo(),
      parser.getText(),
    ]);

    return {
      pages: infoResult.total,
      info: infoResult.info,
      textLength: (textResult.text || '').length,
    };
  } catch (error) {
    console.error('PDF metadata error:', error);
    throw new Error('Failed to read PDF metadata: ' + error.message);
  } finally {
    await parser.destroy();
  }
}

export default {
  extractText,
  getMetadata
};
