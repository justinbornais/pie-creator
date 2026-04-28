import { jsPDF } from 'jspdf';
import type { ExportFormat } from '../types';

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
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg',
  filename: string
): void {
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  const dataUrl = canvas.toDataURL(mimeType, 0.95);
  triggerDownload(dataUrl, `${filename}.${ext}`);
}

function exportPdf(canvas: HTMLCanvasElement, filename: string): void {
  const imgData = canvas.toDataURL('image/png');
  const w = canvas.width;
  const h = canvas.height;
  const orientation = w >= h ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [w, h],
  });
  pdf.addImage(imgData, 'PNG', 0, 0, w, h);
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
