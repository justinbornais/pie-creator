import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AngleGuide from '../components/AngleGuide';

// Mock canvas
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

describe('AngleGuide', () => {
  it('renders settings panel', () => {
    render(<AngleGuide />);
    expect(screen.getByText('Angle Guide Settings')).toBeInTheDocument();
  });

  it('renders default angles', () => {
    render(<AngleGuide />);
    // Should have 3 default angles
    const removeButtons = screen.getAllByTitle('Remove');
    expect(removeButtons.length).toBe(3);
  });

  it('adds a new angle', () => {
    render(<AngleGuide />);
    const addBtn = screen.getByText('+ Add Angle');
    fireEvent.click(addBtn);
    const removeButtons = screen.getAllByTitle('Remove');
    expect(removeButtons.length).toBe(4);
  });

  it('removes an angle', () => {
    render(<AngleGuide />);
    const removeButtons = screen.getAllByTitle('Remove');
    fireEvent.click(removeButtons[0]);
    const remainingButtons = screen.getAllByTitle('Remove');
    expect(remainingButtons.length).toBe(2);
  });

  it('toggles background between white and transparent', () => {
    render(<AngleGuide />);
    const transparentBtn = screen.getByText('Transparent');
    fireEvent.click(transparentBtn);
    expect(transparentBtn.classList.contains('active')).toBe(true);
  });

  it('changes shape', () => {
    render(<AngleGuide />);
    const roundedBtn = screen.getByText('Rounded');
    fireEvent.click(roundedBtn);
    expect(roundedBtn.classList.contains('active')).toBe(true);
  });

  it('toggles base label checkbox', () => {
    render(<AngleGuide />);
    const checkbox = screen.getByLabelText('Show Base Label (0°)');
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('renders export buttons', () => {
    render(<AngleGuide />);
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('JPEG')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });
});
