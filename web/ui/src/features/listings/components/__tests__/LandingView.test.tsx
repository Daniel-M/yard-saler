import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LandingView from '../LandingView';

// Mock translation hook according to Workflow B guidelines
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'landing.eventDetails.host' && options?.host) {
        return `Hosted by: ${options.host}`;
      }
      if (key === 'landing.eventDetails.time' && options?.time) {
        return `Time: ${options.time}`;
      }
      if (key === 'landing.eventDetails.address' && options?.address) {
        return `Address: ${options.address}`;
      }
      if (key === 'landing.carousel.imageCounter' && options?.current) {
        return `Image ${options.current} of ${options.total}`;
      }
      return key;
    },
    i18n: { changeLanguage: () => Promise.resolve() },
  }),
}));

describe('LandingView Component', () => {
  it('renders landing page title and search options', () => {
    render(<LandingView />);
    
    // Check main title placeholder key
    expect(screen.getByText('landing.title')).toBeInTheDocument();
    
    // Check search inputs are rendered
    expect(screen.getByPlaceholderText('landing.search.placeholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('landing.search.filterHost')).toBeInTheDocument();
  });

  it('filters listings by location search query', () => {
    render(<LandingView />);
    
    const searchInput = screen.getByPlaceholderText('landing.search.placeholder');
    
    // Initially, multiple cards should be visible
    expect(screen.getByText('Vintage Furniture & Electronics Sale')).toBeInTheDocument();
    expect(screen.getByText('Multi-Family Clothing & Toy Yard Sale')).toBeInTheDocument();
    
    // Search for "Portland"
    fireEvent.change(searchInput, { target: { value: 'Portland' } });
    
    expect(screen.queryByText('Vintage Furniture & Electronics Sale')).not.toBeInTheDocument();
    expect(screen.getByText('Multi-Family Clothing & Toy Yard Sale')).toBeInTheDocument();
  });

  it('filters listings by host filter query', () => {
    render(<LandingView />);
    
    const hostInput = screen.getByPlaceholderText('landing.search.filterHost');
    
    // Search for host "Robert"
    fireEvent.change(hostInput, { target: { value: 'Robert' } });
    
    expect(screen.queryByText('Vintage Furniture & Electronics Sale')).not.toBeInTheDocument();
    expect(screen.getByText('Tools, Books, and Collectibles Estate Sale')).toBeInTheDocument();
  });

  it('navigates the image carousel when clicking prev/next buttons', () => {
    render(<LandingView />);
    
    // Let's grab the carousel buttons on the first listing card
    // First card: images count: 3
    const nextButtons = screen.getAllByRole('button', { name: 'landing.carousel.next' });
    const prevButtons = screen.getAllByRole('button', { name: 'landing.carousel.prev' });
    
    // Get image indicators for the first card
    const statusText = screen.getAllByText(/Image \d+ of \d+/)[0];
    expect(statusText.textContent).toBe('Image 1 of 3');
    
    // Click next
    fireEvent.click(nextButtons[0]);
    expect(statusText.textContent).toBe('Image 2 of 3');
    
    // Click next again
    fireEvent.click(nextButtons[0]);
    expect(statusText.textContent).toBe('Image 3 of 3');
    
    // Click prev
    fireEvent.click(prevButtons[0]);
    expect(statusText.textContent).toBe('Image 2 of 3');
  });
});
