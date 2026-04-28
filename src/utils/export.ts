import { jsPDF } from 'jspdf';
import type { ExportFormat } from '../types';

/**
 * Export a canvas that was already rendered at the desired resolution.
 * The caller is responsible for providing a high-DPR canvas (e.g. drawn at 3×)
 * so no scaling is applied here — avoiding any blurriness from drawImage upsampling.
 */
export function exportCanvas(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  filename: string
): void {
  if (format === 'pdf') {
    exportPdf(canvas, filename);
  } else {
    exportImage(canvas, format, filename);
  }
}

function exportImage(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg',
  filename: string
): void {
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  // PNG is lossless; JPEG at 0.92 balances sharpness and file size
  const dataUrl = canvas.toDataURL(mimeType, 0.92);
  triggerDownload(dataUrl, `${filename}.${ext}`);
}

function exportPdf(canvas: HTMLCanvasElement, filename: string): void {
  // Embed as JPEG for smaller PDF file size
  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  // Letter page: 8.5" × 11" in points (1 pt = 1/72 in)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  });

  // Page dimensions in inches
  const pageW = 8.5;
  const pageH = 11;
  const margin = 0.75;

  // Scale the image to fit within the margins, preserving aspect ratio
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const imgW = canvas.width;
  const imgH = canvas.height;
  const scale = Math.min(maxW / imgW, maxH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  // Center on the page
  const x = (pageW - drawW) / 2;
  const y = (pageH - drawH) / 2;

  pdf.addImage(imgData, 'JPEG', x, y, drawW, drawH);
  pdf.save(`${filename}.pdf`);
}

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
