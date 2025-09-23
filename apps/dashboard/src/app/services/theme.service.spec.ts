import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset document class
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with light mode by default', () => {
    service.isDarkMode$.subscribe(isDark => {
      expect(isDark).toBeFalse();
    });
  });

  it('should load saved theme from localStorage', () => {
    localStorage.setItem('darkMode', 'true');
    
    const newService = new ThemeService();
    
    newService.isDarkMode$.subscribe(isDark => {
      expect(isDark).toBeTrue();
    });
  });

  it('should use system preference when no saved theme', () => {
    // Mock system preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const newService = new ThemeService();
    
    newService.isDarkMode$.subscribe(isDark => {
      expect(isDark).toBeFalse(); // System preference is light
    });
  });

  it('should toggle theme and update localStorage', () => {
    // Clear localStorage before test
    localStorage.clear();
    
    let currentTheme = false;
    service.isDarkMode$.subscribe(isDark => {
      currentTheme = isDark;
    });

    // Initial state should be false
    expect(currentTheme).toBe(false);
    expect(localStorage.getItem('theme')).toBeNull();

    // Toggle to dark mode
    service.toggleTheme();
    
    expect(currentTheme).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle back to light mode
    service.toggleTheme();
    
    expect(currentTheme).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should apply dark class to document when toggling to dark mode', () => {
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    
    service.toggleTheme();
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should remove dark class from document when toggling to light mode', () => {
    // Set initial dark mode
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
    
    const newService = new ThemeService();
    
    newService.toggleTheme();
    
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should handle invalid localStorage values gracefully', () => {
    localStorage.setItem('darkMode', 'invalid');
    
    const newService = new ThemeService();
    
    newService.isDarkMode$.subscribe(isDark => {
      expect(isDark).toBeFalse(); // Should default to false
    });
  });
});
