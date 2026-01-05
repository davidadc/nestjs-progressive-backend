// Set test environment before any modules load
process.env.NODE_ENV = 'test';

// Mock uuid module for E2E tests
jest.mock('uuid', () => ({
  v4: () =>
    `test-uuid-${Date.now()}-${Math.random().toString(36).substring(7)}`,
}));
