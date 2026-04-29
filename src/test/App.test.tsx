import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { APP_DEFAULTS } from '../config/defaults';

describe('App', () => {
  it('renders the header with app name', () => {
    render(<App />);
    expect(screen.getByText('Angle Creator')).toBeInTheDocument();
  });

  it('renders Pie Chart tab as active by default', () => {
    render(<App />);
    const pieTab = screen.getByText('Pie Chart');
    expect(pieTab.closest('button')).toHaveClass('active');
  });

  it('renders the Pie Chart settings by default', () => {
    render(<App />);
    expect(screen.getByText('Pie Chart Settings')).toBeInTheDocument();
  });

  it('switches to Angle Guide tab when clicked', () => {
    render(<App />);
    const angleTab = screen.getByText('Angle Guide');
    fireEvent.click(angleTab);
    expect(screen.getByText('Angle Guide Settings')).toBeInTheDocument();
  });

  it('switches back to Pie Chart tab', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Angle Guide'));
    expect(screen.getByText('Angle Guide Settings')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Pie Chart'));
    expect(screen.getByText('Pie Chart Settings')).toBeInTheDocument();
  });

  it('toggles the global greyscale setting', () => {
    render(<App />);
    const greyscaleToggle = screen.getByLabelText('Greyscale') as HTMLInputElement;
    expect(greyscaleToggle.checked).toBe(APP_DEFAULTS.greyscale);

    fireEvent.click(greyscaleToggle);
    expect(greyscaleToggle).toBeChecked();
  });
});
