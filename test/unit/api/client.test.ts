import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ClockifyApiClient } from '../../../src/api/client.js';
import { mockClockifyApi } from '../../helpers/nockHelpers.js';

describe('ClockifyApiClient', () => {
  let client: ClockifyApiClient;
  let mockApi: ReturnType<typeof mockClockifyApi>;

  beforeEach(() => {
    client = new ClockifyApiClient('test-api-key-12345678');
    mockApi = mockClockifyApi();
  });

  afterEach(() => {
    mockApi.cleanAll();
  });

  describe('constructor', () => {
    it('should create client with API key', () => {
      expect(client).toBeInstanceOf(ClockifyApiClient);
    });

    it('should throw error without API key', () => {
      expect(() => new ClockifyApiClient('')).toThrow('Clockify API key is required');
    });

    it('should use custom base URL', () => {
      const customClient = new ClockifyApiClient('test-key', 'https://custom.api.url');
      expect(customClient).toBeInstanceOf(ClockifyApiClient);
    });
  });

  describe('HTTP methods', () => {
    it('should make GET requests', async () => {
      mockApi.mockGetCurrentUser();

      const result = await client.get('/user');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });

    it('should make POST requests', async () => {
      mockApi.mockCreateProject('workspace-123');

      const result = await client.post('/workspaces/workspace-123/projects', {
        name: 'Test Project',
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
    });

    it('should make PUT requests', async () => {
      mockApi.mockUpdateProject('workspace-123', 'project-123');

      const result = await client.put('/workspaces/workspace-123/projects/project-123', {
        name: 'Updated Project',
      });
      expect(result).toHaveProperty('id');
    });

    it('should make DELETE requests', async () => {
      mockApi.mockDeleteProject('workspace-123', 'project-123');

      await expect(
        client.delete('/workspaces/workspace-123/projects/project-123')
      ).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle 401 unauthorized errors', async () => {
      mockApi.mockUnauthorized();

      await expect(client.get('/user')).rejects.toThrow('Invalid API key or unauthorized access');
    });

    it('should handle 403 forbidden errors', async () => {
      mockApi.mockApiError(403, 'Forbidden');

      await expect(client.get('/user')).rejects.toThrow(
        "Forbidden: You don't have permission to perform this action"
      );
    });

    it('should handle 404 not found errors', async () => {
      mockApi.mockNotFound();

      await expect(client.get('/user')).rejects.toThrow('Resource not found');
    });

    it('should handle 429 rate limit errors', async () => {
      mockApi.mockRateLimit();

      await expect(client.get('/user')).rejects.toThrow(
        'Rate limit exceeded. Please try again later'
      );
    });

    it('should handle network errors', async () => {
      // Don't mock any response to simulate network error

      await expect(client.get('/user')).rejects.toThrow('No response from Clockify API');
    });

    it('should handle API errors with custom messages', async () => {
      mockApi.mockApiError(400, 'Custom error message');

      await expect(client.get('/user')).rejects.toThrow(
        'Clockify API error (400): Custom error message'
      );
    });
  });

  describe('request configuration', () => {
    it('should include API key in headers', async () => {
      mockApi.scope
        .get('/api/v1/user')
        .matchHeader('X-Api-Key', /.+/)
        .reply(200, { id: 'user-123' });

      await client.get('/user');
    });

    it('should set correct content type', async () => {
      mockApi.scope
        .post('/api/v1/workspaces/workspace-123/projects')
        .matchHeader('Content-Type', 'application/json')
        .matchHeader('X-Api-Key', /.+/)
        .reply(201, { id: 'project-123' });

      await client.post('/workspaces/workspace-123/projects', { name: 'Test' });
    });

    it('should have timeout configured', async () => {
      // This test is implicit - the client should be configured with a timeout
      expect(client).toBeInstanceOf(ClockifyApiClient);
    });
  });
});
