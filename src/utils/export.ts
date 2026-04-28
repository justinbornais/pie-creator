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
  // Use the logical CSS size for the PDF page dimensions
  const cssW = parseFloat(canvas.style.width) || canvas.width;
  const cssH = parseFloat(canvas.style.height) || canvas.height;

  // Embed as JPEG for smaller PDF file size
  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  const pdf = new jsPDF({
    orientation: cssW >= cssH ? 'landscape' : 'portrait',
    unit: 'px',
    format: [cssW, cssH],
  });
  // The high-res canvas image fills the logical page exactly
  pdf.addImage(imgData, 'JPEG', 0, 0, cssW, cssH);
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
