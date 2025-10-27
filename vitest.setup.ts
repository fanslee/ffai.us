import '@testing-library/jest-dom'

// Mock Taro APIs used in components
vi.mock('@tarojs/taro', () => ({
  showToast: vi.fn(),
  useLoad: (fn: () => void) => fn(),
  navigateTo: vi.fn(),
  getStorageSync: vi.fn(() => null),
  setStorageSync: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  View: (props: any) => props.children ?? null,
  Text: (props: any) => props.children ?? null,
  Button: (props: any) => props.children ?? null,
  Input: (props: any) => props.children ?? null,
}))
