import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigurationManager } from '../../src/config/index.js';

describe('ConfigurationManager', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.CLOCKIFY_API_KEY;
    delete process.env.ALLOWED_PROJECTS;
    delete process.env.READ_ONLY;
    delete process.env.NORMALIZE_MONEY;
  });

  describe('constructor', () => {
    it('should create config with required API key', () => {
      const config = new ConfigurationManager({ apiKey: 'test-key' });
      expect(config.getApiKey()).toBe('test-key');
    });

    it('should throw error if API key is missing', () => {
      expect(() => new ConfigurationManager()).toThrow('Configuration validation failed');
    });

    it('should parse environment variables', () => {
      process.env.CLOCKIFY_API_KEY = 'env-key';
      process.env.ALLOWED_PROJECTS = 'proj1,proj2,proj3';
      process.env.READ_ONLY = 'true';

      const config = new ConfigurationManager();

      expect(config.getApiKey()).toBe('env-key');
      expect(config.getRestrictions().allowedProjects).toEqual(['proj1', 'proj2', 'proj3']);
      expect(config.getRestrictions().readOnly).toBe(true);
    });

    it('should merge overrides with environment', () => {
      process.env.CLOCKIFY_API_KEY = 'env-key';

      const config = new ConfigurationManager({
        restrictions: {
          readOnly: true,
          allowedProjects: ['override-project'],
        },
      });

      expect(config.getApiKey()).toBe('env-key');
      expect(config.getRestrictions().readOnly).toBe(true);
      expect(config.getRestrictions().allowedProjects).toEqual(['override-project']);
    });
  });

  describe('project restrictions', () => {
    it('should allow all projects when no restrictions', () => {
      const config = new ConfigurationManager({ apiKey: 'test-key' });
      expect(config.isProjectAllowed('any-project')).toBe(true);
    });

    it('should enforce allowed projects list', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: {
          allowedProjects: ['proj1', 'proj2'],
        },
      });

      expect(config.isProjectAllowed('proj1')).toBe(true);
      expect(config.isProjectAllowed('proj2')).toBe(true);
      expect(config.isProjectAllowed('proj3')).toBe(false);
    });

    it('should enforce denied projects list', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: {
          deniedProjects: ['proj1', 'proj2'],
        },
      });

      expect(config.isProjectAllowed('proj1')).toBe(false);
      expect(config.isProjectAllowed('proj2')).toBe(false);
      expect(config.isProjectAllowed('proj3')).toBe(true);
    });

    it('should prioritize denied list over allowed list', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: {
          allowedProjects: ['proj1', 'proj2'],
          deniedProjects: ['proj1'],
        },
      });

      expect(config.isProjectAllowed('proj1')).toBe(false); // Denied takes priority
      expect(config.isProjectAllowed('proj2')).toBe(true);
    });
  });

  describe('workspace restrictions', () => {
    it('should allow all workspaces when no restrictions', () => {
      const config = new ConfigurationManager({ apiKey: 'test-key' });
      expect(config.isWorkspaceAllowed('any-workspace')).toBe(true);
    });

    it('should enforce allowed workspaces list', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: {
          allowedWorkspaces: ['ws1', 'ws2'],
        },
      });

      expect(config.isWorkspaceAllowed('ws1')).toBe(true);
      expect(config.isWorkspaceAllowed('ws2')).toBe(true);
      expect(config.isWorkspaceAllowed('ws3')).toBe(false);
    });
  });

  describe('operation restrictions', () => {
    it('should allow operations by default', () => {
      const config = new ConfigurationManager({ apiKey: 'test-key' });
      expect(config.canPerformOperation('createTimeEntry')).toBe(true);
      expect(config.canPerformOperation('deleteTimeEntry')).toBe(true);
    });

    it('should restrict all operations in read-only mode', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: { readOnly: true },
      });

      expect(config.canPerformOperation('read')).toBe(true);
      expect(config.canPerformOperation('createTimeEntry')).toBe(false);
      expect(config.canPerformOperation('deleteTimeEntry')).toBe(false);
    });

    it('should respect individual operation restrictions', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: {
          allowTimeEntryCreation: false,
          allowTimeEntryDeletion: true,
          allowProjectManagement: false,
        },
      });

      expect(config.canPerformOperation('createTimeEntry')).toBe(false);
      expect(config.canPerformOperation('deleteTimeEntry')).toBe(true);
      expect(config.canPerformOperation('manageProject')).toBe(false);
    });
  });

  describe('time entry validation', () => {
    it('should allow valid time entries', () => {
      const config = new ConfigurationManager({ apiKey: 'test-key' });
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      const result = config.validateTimeEntry(now, oneHourLater);
      expect(result.valid).toBe(true);
    });

    it('should reject future time entries when not allowed', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: { allowFutureTimeEntries: false },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = config.validateTimeEntry(tomorrow);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Future time entries are not allowed');
    });

    it('should reject entries older than allowed days', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: { allowPastTimeEntriesInDays: 7 },
      });

      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const result = config.validateTimeEntry(tenDaysAgo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('older than 7 days are not allowed');
    });

    it('should reject entries exceeding max duration', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: { maxTimeEntryDuration: 8 },
      });

      const start = new Date();
      const end = new Date(start.getTime() + 10 * 60 * 60 * 1000); // 10 hours

      const result = config.validateTimeEntry(start, end);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum of 8 hours');
    });
  });

  describe('defaults', () => {
    it('should return default project and workspace IDs', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: {
          defaultProjectId: 'default-project',
          defaultWorkspaceId: 'default-workspace',
        },
      });

      expect(config.getDefaultProjectId()).toBe('default-project');
      expect(config.getDefaultWorkspaceId()).toBe('default-workspace');
    });
  });

  describe('money normalization', () => {
    it('should enable normalization by default', () => {
      const config = new ConfigurationManager({ apiKey: 'test-key' });
      expect(config.isMoneyNormalizationEnabled()).toBe(true);
    });

    it('should disable normalization when NORMALIZE_MONEY=false', () => {
      process.env.CLOCKIFY_API_KEY = 'test-key';
      process.env.NORMALIZE_MONEY = 'false';

      const config = new ConfigurationManager();
      expect(config.isMoneyNormalizationEnabled()).toBe(false);
    });

    it('should enable normalization when NORMALIZE_MONEY=true', () => {
      process.env.CLOCKIFY_API_KEY = 'test-key';
      process.env.NORMALIZE_MONEY = 'true';

      const config = new ConfigurationManager();
      expect(config.isMoneyNormalizationEnabled()).toBe(true);
    });
  });
});
