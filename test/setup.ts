import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

// Setup global test environment
beforeAll(() => {
  // Set test environment variables
  process.env.CLOCKIFY_API_KEY = 'test-api-key-12345678';
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Clean up
  nock.cleanAll();
});

beforeEach(() => {
  // Reset nock interceptors before each test
  nock.cleanAll();
});

afterEach(() => {
  // Verify all nock interceptors were called
  if (!nock.isDone()) {
    console.error('Pending nock interceptors:', nock.pendingMocks());
    nock.cleanAll();
    throw new Error('Not all nock interceptors were called');
  }
});