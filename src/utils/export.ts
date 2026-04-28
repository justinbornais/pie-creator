import { jsPDF } from 'jspdf';
import type { ExportFormat } from '../types';

/** Fixed export scale relative to the logical canvas size, independent of display DPR */
const EXPORT_SCALE = 2;

/**
 * Build an off-screen canvas at EXPORT_SCALE × the logical CSS size of the source,
 * then copy the source into it. This ensures consistent, crisp exports regardless
 * of the display's devicePixelRatio.
 */
function buildExportCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const cssW = parseFloat(source.style.width) || source.width;
  const cssH = parseFloat(source.style.height) || source.height;
  const offscreen = document.createElement('canvas');
  offscreen.width = cssW * EXPORT_SCALE;
  offscreen.height = cssH * EXPORT_SCALE;
  const ctx = offscreen.getContext('2d')!;
  ctx.drawImage(source, 0, 0, offscreen.width, offscreen.height);
  return offscreen;
}

/** Export a canvas element to the given format and trigger a download */
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
  source: HTMLCanvasElement,
  format: 'png' | 'jpeg',
  filename: string
): void {
  const exportCanvas = buildExportCanvas(source);
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  // JPEG quality 0.88 balances sharpness and file size; quality param is ignored for PNG
  const dataUrl = exportCanvas.toDataURL(mimeType, 0.88);
  triggerDownload(dataUrl, `${filename}.${ext}`);
}

function exportPdf(source: HTMLCanvasElement, filename: string): void {
  // Use the logical CSS dimensions for the PDF page so it has a reasonable physical size
  const cssW = parseFloat(source.style.width) || source.width;
  const cssH = parseFloat(source.style.height) || source.height;

  // Render at 2× into an offscreen canvas and embed as JPEG for smaller PDF files
  const exportCanvas = buildExportCanvas(source);
  const imgData = exportCanvas.toDataURL('image/jpeg', 0.92);

  const pdf = new jsPDF({
    orientation: cssW >= cssH ? 'landscape' : 'portrait',
    unit: 'px',
    format: [cssW, cssH],
  });
  // Place the high-res image scaled to fill the logical page dimensions
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
