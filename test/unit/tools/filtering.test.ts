import { describe, it, expect, beforeEach } from 'vitest';
import { ClockifyTools } from '../../../src/tools/index.js';
import { ConfigurationManager } from '../../../src/config/index.js';

describe('Tool Filtering', () => {
  describe('Category Filtering', () => {
    it('should filter tools by enabled categories', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        toolFiltering: {
          enabledCategories: ['user', 'workspace'],
          maxTools: 50,
        },
      });

      const tools = new ClockifyTools('test-key', config);
      const toolList = tools.getTools();

      // Should only include user and workspace tools
      expect(toolList.length).toBeGreaterThan(0);
      expect(toolList.length).toBeLessThanOrEqual(10); // Reasonable number for these categories

      // Check that we have user tools
      const userTools = toolList.filter(
        t => t.name.includes('user') || t.name === 'get_current_user'
      );
      expect(userTools.length).toBeGreaterThan(0);

      // Check that we have workspace tools
      const workspaceTools = toolList.filter(t => t.name.includes('workspace'));
      expect(workspaceTools.length).toBeGreaterThan(0);
    });

    it('should use default categories when none specified', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
      });

      const tools = new ClockifyTools('test-key', config);
      const toolList = tools.getTools();

      // Should include default categories: user, workspace, project, timeEntry, report
      expect(toolList.length).toBeGreaterThan(10);
      expect(toolList.length).toBeLessThanOrEqual(50); // Default max
    });

    it('should filter to minimal set for time tracking', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        toolFiltering: {
          enabledCategories: ['timeEntry'],
          maxTools: 10,
        },
      });

      const tools = new ClockifyTools('test-key', config);
      const toolList = tools.getTools();

      expect(toolList.length).toBeLessThanOrEqual(10);

      // Should include time entry tools
      const timeEntryTools = toolList.filter(
        t => t.name.includes('time_entry') || t.name.includes('timer') || t.name.includes('entries')
      );
      expect(timeEntryTools.length).toBeGreaterThan(0);
    });
  });

  describe('Specific Tool Filtering', () => {
    it('should only include enabled tools when specified', () => {
      const enabledTools = ['get_current_user', 'list_workspaces', 'create_time_entry'];
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        toolFiltering: {
          enabledTools,
          maxTools: 50,
        },
      });

      const tools = new ClockifyTools('test-key', config);
      const toolList = tools.getTools();

      expect(toolList.length).toBe(enabledTools.length);

      const toolNames = toolList.map(t => t.name);
      enabledTools.forEach(toolName => {
        expect(toolNames).toContain(toolName);
      });
    });

    it('should exclude disabled tools', () => {
      const disabledTools = ['delete_time_entry', 'bulk_edit_time_entries'];
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        toolFiltering: {
          enabledCategories: ['user', 'workspace', 'timeEntry', 'bulk'],
          disabledTools,
          maxTools: 50,
        },
      });

      const tools = new ClockifyTools('test-key', config);
      const toolList = tools.getTools();

      const toolNames = toolList.map(t => t.name);
      disabledTools.forEach(toolName => {
        expect(toolNames).not.toContain(toolName);
      });
    });
  });

  describe('Max Tools Limiting', () => {
    it('should respect max tools limit', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        toolFiltering: {
          enabledCategories: [
            'user',
            'workspace',
            'project',
            'timeEntry',
            'report',
            'client',
            'tag',
            'task',
          ],
          maxTools: 5,
        },
      });

      const tools = new ClockifyTools('test-key', config);
      const toolList = tools.getTools();

      expect(toolList.length).toBeLessThanOrEqual(5);
    });

    it('should prioritize tools correctly', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        toolFiltering: {
          enabledCategories: ['user', 'workspace', 'timeEntry'],
          maxTools: 3,
        },
      });

      const tools = new ClockifyTools('test-key', config);
      const toolList = tools.getTools();

      expect(toolList.length).toBe(3);

      // Should include high-priority tools
      const toolNames = toolList.map(t => t.name);
      expect(toolNames).toContain('get_current_user'); // High priority user tool
    });
  });

  describe('Helper Methods', () => {
    let tools: ClockifyTools;

    beforeEach(() => {
      const config = new ConfigurationManager({ apiKey: 'test-key' });
      tools = new ClockifyTools('test-key', config);
    });

    it('should return all available categories', () => {
      const categories = tools.getToolCategories();

      expect(categories).toContain('user');
      expect(categories).toContain('workspace');
      expect(categories).toContain('project');
      expect(categories).toContain('timeEntry');
      expect(categories).toContain('report');
      expect(categories.length).toBeGreaterThan(5);
    });

    it('should return all available tool names', () => {
      const toolNames = tools.getAvailableToolNames();

      expect(toolNames).toContain('get_current_user');
      expect(toolNames).toContain('list_workspaces');
      expect(toolNames).toContain('create_time_entry');
      expect(toolNames.length).toBeGreaterThan(20);
    });

    it('should return tools by category', () => {
      const userTools = tools.getToolsByCategory('user');
      const timeEntryTools = tools.getToolsByCategory('timeEntry');

      expect(userTools).toContain('get_current_user');
      expect(userTools).toContain('list_users');

      expect(timeEntryTools).toContain('create_time_entry');
      expect(timeEntryTools).toContain('get_time_entries');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should configure minimal time tracking setup', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        toolFiltering: {
          enabledTools: [
            'get_current_user',
            'list_workspaces',
            'create_time_entry',
            'stop_timer',
            'get_today_entries',
          ],
          maxTools: 5,
        },
      });

      const tools = new ClockifyTools('test-key', config);
      const toolList = tools.getTools();

      expect(toolList.length).toBe(5);

      const toolNames = toolList.map(t => t.name);
      expect(toolNames).toContain('get_current_user');
      expect(toolNames).toContain('list_workspaces');
      expect(toolNames).toContain('create_time_entry');
      expect(toolNames).toContain('stop_timer');
      expect(toolNames).toContain('get_today_entries');
    });

    it('should configure reporting-only setup', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        toolFiltering: {
          enabledCategories: ['user', 'workspace', 'project', 'report'],
          maxTools: 12,
        },
        restrictions: {
          readOnly: true,
        },
      });

      const tools = new ClockifyTools('test-key', config);
      const toolList = tools.getTools();

      expect(toolList.length).toBeLessThanOrEqual(12);

      const toolNames = toolList.map(t => t.name);

      // Should have reporting tools
      const hasReportingTools = toolNames.some(name => name.includes('report'));
      expect(hasReportingTools).toBe(true);

      // Should not have delete/create tools (due to category filtering)
      expect(toolNames).not.toContain('delete_time_entry');
      expect(toolNames).not.toContain('create_time_entry');
    });

    it('should configure team management setup', () => {
      const config = new ConfigurationManager({
        apiKey: 'test-key',
        toolFiltering: {
          enabledCategories: ['user', 'workspace', 'project', 'timeEntry', 'report'],
          disabledTools: ['delete_time_entry', 'bulk_edit_time_entries'],
          maxTools: 20,
        },
      });

      const tools = new ClockifyTools('test-key', config);
      const toolList = tools.getTools();

      expect(toolList.length).toBeLessThanOrEqual(20);

      const toolNames = toolList.map(t => t.name);

      // Should exclude dangerous operations
      expect(toolNames).not.toContain('delete_time_entry');
      expect(toolNames).not.toContain('bulk_edit_time_entries');

      // Should include core functionality
      expect(toolNames).toContain('get_current_user');
      expect(toolNames).toContain('create_time_entry');
      expect(toolNames).toContain('list_projects');
    });
  });
});
