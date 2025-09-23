import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

// Add Jasmine globals
declare global {
  var jasmine: any;
  var spyOn: any;
}

// Mock jasmine if not available
if (typeof jasmine === 'undefined') {
  global.jasmine = {
    createSpyObj: (name: string, methods: string[], properties?: any) => {
      const spyObj: any = {};
      methods.forEach(method => {
        spyObj[method] = jest.fn();
      });
      if (properties) {
        Object.assign(spyObj, properties);
      }
      return spyObj;
    }
  };
}

// Mock spyOn if not available
if (typeof spyOn === 'undefined') {
  global.spyOn = jest.spyOn;
}

// Mock window.matchMedia for ThemeService tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)' ? false : false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
