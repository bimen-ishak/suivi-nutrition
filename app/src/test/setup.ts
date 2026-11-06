import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IndexedDB for tests
Object.defineProperty(globalThis, 'indexedDB', {
  value: undefined,
  writable: true
})

// Mock navigator.storage for tests
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: vi.fn().mockResolvedValue({ quota: 100000000, usage: 0 })
  },
  writable: true
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})