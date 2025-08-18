import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigurationManager } from '../../../src/config/index.js';
import { RestrictionMiddleware } from '../../../src/middleware/restrictions.js';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

describe('RestrictionMiddleware', () => {
  let config: ConfigurationManager;
  let middleware: RestrictionMiddleware;

  beforeEach(() => {
    config = new ConfigurationManager({
      apiKey: 'test-key',
      restrictions: {
        allowedProjects: ['proj1', 'proj2'],
        deniedProjects: ['proj3'],
        allowedWorkspaces: ['ws1', 'ws2'],
        defaultProjectId: 'default-proj',
        defaultWorkspaceId: 'default-ws',
        readOnly: false,
        allowTimeEntryCreation: true,
        allowTimeEntryDeletion: true,
        allowProjectManagement: true,
        allowClientManagement: true,
        allowUserManagement: false,
        maxTimeEntryDuration: 8,
        allowFutureTimeEntries: false,
        allowPastTimeEntriesInDays: 30,
      },
    });
    middleware = new RestrictionMiddleware(config);
  });

  describe('checkProjectAccess', () => {
    it('should allow access to permitted projects', () => {
      expect(() => middleware.checkProjectAccess('proj1')).not.toThrow();
    });

    it('should deny access to restricted projects', () => {
      expect(() => middleware.checkProjectAccess('proj3')).toThrow(McpError);
    });

    it('should deny access to non-allowed projects', () => {
      expect(() => middleware.checkProjectAccess('proj999')).toThrow(McpError);
    });

    it('should allow undefined project ID', () => {
      expect(() => middleware.checkProjectAccess(undefined)).not.toThrow();
    });
  });

  describe('checkWorkspaceAccess', () => {
    it('should allow access to permitted workspaces', () => {
      expect(() => middleware.checkWorkspaceAccess('ws1')).not.toThrow();
    });

    it('should deny access to non-allowed workspaces', () => {
      expect(() => middleware.checkWorkspaceAccess('ws999')).toThrow(McpError);
    });

    it('should allow undefined workspace ID', () => {
      expect(() => middleware.checkWorkspaceAccess(undefined)).not.toThrow();
    });
  });

  describe('checkOperation', () => {
    it('should allow permitted operations', () => {
      expect(() => middleware.checkOperation('createTimeEntry')).not.toThrow();
      expect(() => middleware.checkOperation('deleteTimeEntry')).not.toThrow();
      expect(() => middleware.checkOperation('manageProject')).not.toThrow();
    });

    it('should deny restricted operations', () => {
      expect(() => middleware.checkOperation('manageUser')).toThrow(McpError);
    });

    it('should allow unknown operations by default', () => {
      expect(() => middleware.checkOperation('unknownOperation')).not.toThrow();
    });
  });

  describe('checkOperation with read-only mode', () => {
    beforeEach(() => {
      config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: { readOnly: true },
      });
      middleware = new RestrictionMiddleware(config);
    });

    it('should allow read operations', () => {
      expect(() => middleware.checkOperation('read')).not.toThrow();
    });

    it('should deny write operations', () => {
      expect(() => middleware.checkOperation('createTimeEntry')).toThrow(McpError);
    });
  });

  describe('checkTimeEntryDates', () => {
    it('should allow valid dates', () => {
      const now = new Date().toISOString();
      const later = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours later

      expect(() => middleware.checkTimeEntryDates(now, later)).not.toThrow();
    });

    it('should reject future dates when not allowed', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      expect(() => middleware.checkTimeEntryDates(tomorrow)).toThrow(McpError);
    });

    it('should reject dates exceeding max duration', () => {
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(); // 10 hours later

      expect(() => middleware.checkTimeEntryDates(start, end)).toThrow(McpError);
    });

    it('should reject dates too far in the past', () => {
      const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(); // 35 days ago

      expect(() => middleware.checkTimeEntryDates(oldDate)).toThrow(McpError);
    });
  });

  describe('applyDefaults', () => {
    it('should apply default workspace ID', () => {
      const params = { projectId: 'some-project' };
      const result = middleware.applyDefaults(params);

      expect(result.workspaceId).toBe('default-ws');
      expect(result.projectId).toBe('some-project');
    });

    it('should apply default project ID', () => {
      const params = { workspaceId: 'some-workspace' };
      const result = middleware.applyDefaults(params);

      expect(result.workspaceId).toBe('some-workspace');
      expect(result.projectId).toBe('default-proj');
    });

    it('should not override existing values', () => {
      const params = { workspaceId: 'existing-ws', projectId: 'existing-proj' };
      const result = middleware.applyDefaults(params);

      expect(result.workspaceId).toBe('existing-ws');
      expect(result.projectId).toBe('existing-proj');
    });
  });

  describe('filterProjects', () => {
    const projects = [
      { id: 'proj1', name: 'Project 1' },
      { id: 'proj2', name: 'Project 2' },
      { id: 'proj3', name: 'Project 3' },
      { id: 'proj4', name: 'Project 4' },
    ];

    it('should filter projects based on restrictions', () => {
      const filtered = middleware.filterProjects(projects);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(p => p.id)).toEqual(['proj1', 'proj2']);
    });
  });

  describe('filterWorkspaces', () => {
    const workspaces = [
      { id: 'ws1', name: 'Workspace 1' },
      { id: 'ws2', name: 'Workspace 2' },
      { id: 'ws3', name: 'Workspace 3' },
    ];

    it('should filter workspaces based on restrictions', () => {
      const filtered = middleware.filterWorkspaces(workspaces);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(w => w.id)).toEqual(['ws1', 'ws2']);
    });
  });

  describe('validateToolAccess', () => {
    it('should validate workspace and project access', () => {
      const params = { workspaceId: 'ws1', projectId: 'proj1' };

      expect(() => middleware.validateToolAccess('get_project', params)).not.toThrow();
    });

    it('should reject invalid workspace access', () => {
      const params = { workspaceId: 'ws999', projectId: 'proj1' };

      expect(() => middleware.validateToolAccess('get_project', params)).toThrow(McpError);
    });

    it('should check read-only mode for write operations', () => {
      config = new ConfigurationManager({
        apiKey: 'test-key',
        restrictions: { readOnly: true },
      });
      middleware = new RestrictionMiddleware(config);

      expect(() => middleware.validateToolAccess('create_time_entry', {})).toThrow(McpError);
    });

    it('should validate time entry dates for create operations', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const params = { start: tomorrow };

      expect(() => middleware.validateToolAccess('create_time_entry', params)).toThrow(McpError);
    });

    it('should check specific operation permissions', () => {
      const params = {};

      expect(() => middleware.validateToolAccess('create_project', params)).not.toThrow();
      expect(() => middleware.validateToolAccess('update_user', params)).toThrow(McpError);
    });
  });
});
