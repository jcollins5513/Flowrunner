import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('server-only', () => ({}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => {
  return {
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
  return {
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }
})

// Mock window.innerWidth for responsive tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
})

