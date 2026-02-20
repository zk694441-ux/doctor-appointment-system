import '@testing-library/jest-dom';
// setupTests.ts or similar Jest setup file
import { TextEncoder, TextDecoder } from 'util';

// Polyfill Node environment with TextEncoder/TextDecoder globally
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  (global as any).TextDecoder = TextDecoder;
}

// Mock fetch globally
global.fetch = jest.fn(); 