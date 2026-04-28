import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PieCreator from '../components/PieCreator';

// Mock canvas methods since jsdom doesn't support canvas
const mockGetContext = vi.fn(() => ({
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  fillRect: vi.fn(),
  roundRect: vi.fn(),
  setLineDash: vi.fn(),
  toDataURL: vi.fn(() => 'data:image/png;base64,'),
  canvas: { width: 500, height: 500 },
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  textBaseline: '',
  globalAlpha: 1,
}));

HTMLCanvasElement.prototype.getContext = mockGetContext as unknown as typeof HTMLCanvasElement.prototype.getContext;

describe('PieCreator', () => {
  it('renders settings panel', () => {
    render(<PieCreator />);
    expect(screen.getByText('Pie Chart Settings')).toBeInTheDocument();
  });

  it('renders default segments in the table', () => {
    render(<PieCreator />);
    expect(screen.getByDisplayValue('Category A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Category B')).toBeInTheDocument();
  });

  it('adds a new segment when clicking add button', () => {
    render(<PieCreator />);
    const addBtn = screen.getByText('+ Add Segment');
    fireEvent.click(addBtn);
    expect(screen.getByDisplayValue('Segment 6')).toBeInTheDocument();
  });

  it('removes a segment when clicking the remove button', () => {
    render(<PieCreator />);
    expect(screen.getByDisplayValue('Category E')).toBeInTheDocument();

    const removeButtons = screen.getAllByTitle('Remove');
    fireEvent.click(removeButtons[removeButtons.length - 1]); // remove last
    expect(screen.queryByDisplayValue('Category E')).not.toBeInTheDocument();
  });

  it('changes shape when clicking shape buttons', () => {
    render(<PieCreator />);
    const squareBtn = screen.getByText('Square');
    fireEvent.click(squareBtn);
    expect(squareBtn.classList.contains('active')).toBe(true);
  });

  it('changes display mode', () => {
    render(<PieCreator />);
    const bwBtn = screen.getByText('B&W');
    fireEvent.click(bwBtn);
    expect(bwBtn.classList.contains('active')).toBe(true);
  });

  it('toggles labels checkbox', () => {
    render(<PieCreator />);
    const labelsCheckbox = screen.getByLabelText('Show Labels');
    expect(labelsCheckbox).toBeChecked();
    fireEvent.click(labelsCheckbox);
    expect(labelsCheckbox).not.toBeChecked();
  });

  it('toggles legend checkbox', () => {
    render(<PieCreator />);
    const legendCheckbox = screen.getByLabelText('Show Legend');
    expect(legendCheckbox).toBeChecked();
    fireEvent.click(legendCheckbox);
    expect(legendCheckbox).not.toBeChecked();
  });

  it('renders export buttons', () => {
    render(<PieCreator />);
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('JPEG')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });
});
