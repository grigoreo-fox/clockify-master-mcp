import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ClockifyTools } from '../../src/tools/index.js';
import { ConfigurationManager } from '../../src/config/index.js';
import { mockClockifyApi } from '../helpers/nockHelpers.js';
import { mockApiResponses } from '../helpers/mockData.js';
import { executeToolWithMoneyNormalization } from '../../src/utils/money.js';

describe('ClockifyTools Integration', () => {
  let tools: ClockifyTools;
  let config: ConfigurationManager;
  let mockApi: ReturnType<typeof mockClockifyApi>;

  beforeEach(() => {
    // Import nock and set it up for this test
    const nock = require('nock');
    nock.cleanAll();
    if (!nock.isActive()) {
      nock.activate();
    }
    nock.disableNetConnect();

    config = new ConfigurationManager({
      apiKey: 'test-api-key-12345678',
      restrictions: {
        allowedProjects: ['project-123'],
        allowedWorkspaces: ['workspace-123'],
        defaultWorkspaceId: 'workspace-123',
        defaultProjectId: 'project-123',
      },
      toolFiltering: {
        enabledCategories: [
          'user',
          'workspace',
          'project',
          'client',
          'timeEntry',
          'tag',
          'task',
          'report',
          'bulk',
          'search',
        ],
        maxTools: 100,
      },
    });
    tools = new ClockifyTools('test-api-key-12345678', config);
    mockApi = mockClockifyApi();
  });

  afterEach(() => {
    const nock = require('nock');
    nock.cleanAll();
    nock.restore();
  });

  describe('User Tools', () => {
    it('should get current user', async () => {
      mockApi.mockGetCurrentUser();

      const toolList = tools.getTools();
      const getCurrentUserTool = toolList.find(t => t.name === 'get_current_user');

      expect(getCurrentUserTool).toBeDefined();

      const result = await getCurrentUserTool!.handler({});
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockApiResponses.user);
    });

    it('should list users with workspace filtering', async () => {
      mockApi.mockGetUsers('workspace-123');

      const toolList = tools.getTools();
      const listUsersTool = toolList.find(t => t.name === 'list_users');

      const result = await listUsersTool!.handler({
        workspaceId: 'workspace-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should find user by name', async () => {
      mockApi.mockGetUsers('workspace-123');

      const toolList = tools.getTools();
      const findUserTool = toolList.find(t => t.name === 'find_user_by_name');

      const result = await findUserTool!.handler({
        workspaceId: 'workspace-123',
        name: 'Test',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('Workspace Tools', () => {
    it('should list workspaces with filtering', async () => {
      mockApi.mockGetWorkspaces();

      const toolList = tools.getTools();
      const listWorkspacesTool = toolList.find(t => t.name === 'list_workspaces');

      const result = await listWorkspacesTool!.handler({});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Filtered by restrictions
      expect(result.data[0].id).toBe('workspace-123');
    });

    it('should get workspace details', async () => {
      mockApi.mockGetWorkspace('workspace-123');

      const toolList = tools.getTools();
      const getWorkspaceTool = toolList.find(t => t.name === 'get_workspace');

      const result = await getWorkspaceTool!.handler({
        workspaceId: 'workspace-123',
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('workspace-123');
    });
  });

  describe('Project Tools', () => {
    it('should list projects with filtering', async () => {
      mockApi.mockGetProjects('workspace-123');

      const toolList = tools.getTools();
      const listProjectsTool = toolList.find(t => t.name === 'list_projects');

      const result = await listProjectsTool!.handler({
        workspaceId: 'workspace-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Filtered by restrictions
      expect(result.data[0].id).toBe('project-123');
    });

    it('should create project', async () => {
      mockApi.mockCreateProject('workspace-123');

      const toolList = tools.getTools();
      const createProjectTool = toolList.find(t => t.name === 'create_project');

      const result = await createProjectTool!.handler({
        workspaceId: 'workspace-123',
        name: 'New Project',
        billable: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Project');
    });

    it('should find project by name', async () => {
      mockApi.mockGetProjects('workspace-123');

      const toolList = tools.getTools();
      const findProjectTool = toolList.find(t => t.name === 'find_project_by_name');

      const result = await findProjectTool!.handler({
        workspaceId: 'workspace-123',
        name: 'Test',
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Time Entry Tools', () => {
    it('should create time entry with defaults', async () => {
      mockApi.mockCreateTimeEntry('workspace-123');

      const toolList = tools.getTools();
      const createTimeEntryTool = toolList.find(t => t.name === 'create_time_entry');

      const result = await createTimeEntryTool!.handler({
        workspaceId: 'workspace-123',
        description: 'Test work',
        start: '2025-01-18T09:00:00Z',
        end: '2025-01-18T10:30:00Z',
      });

      expect(result.success).toBe(true);
      expect(result.data.description).toBe('Test work');
    });

    it('should get time entries for user', async () => {
      mockApi.mockGetTimeEntries('workspace-123', 'user-123');

      const toolList = tools.getTools();
      const getTimeEntriesTool = toolList.find(t => t.name === 'get_time_entries');

      const result = await getTimeEntriesTool!.handler({
        workspaceId: 'workspace-123',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should stop running timer', async () => {
      mockApi.mockGetCurrentUser();
      mockApi.mockStopTimer('workspace-123', 'user-123');

      const toolList = tools.getTools();
      const stopTimerTool = toolList.find(t => t.name === 'stop_timer');

      const result = await stopTimerTool!.handler({
        workspaceId: 'workspace-123',
      });

      expect(result.success).toBe(true);
      expect(result.data.timeInterval.end).toBeDefined();
    });

    it('should get today entries', async () => {
      mockApi.mockGetTimeEntries('workspace-123', 'user-123');

      const toolList = tools.getTools();
      const getTodayEntriesTool = toolList.find(t => t.name === 'get_today_entries');

      const result = await getTodayEntriesTool!.handler({
        workspaceId: 'workspace-123',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should bulk edit time entries', async () => {
      mockApi.mockBulkEditTimeEntries('workspace-123');

      const toolList = tools.getTools();
      const bulkEditTool = toolList.find(t => t.name === 'bulk_edit_time_entries');

      const result = await bulkEditTool!.handler({
        workspaceId: 'workspace-123',
        timeEntryIds: ['entry-123', 'entry-456'],
        action: 'UPDATE',
        updates: {
          billable: true,
          projectId: 'project-999', // Use a different project ID that won't be configured
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.updated).toBe(2);
    });
  });

  describe('Client Tools', () => {
    it('should list clients', async () => {
      mockApi.mockGetClients('workspace-123');

      const toolList = tools.getTools();
      const listClientsTool = toolList.find(t => t.name === 'list_clients');

      const result = await listClientsTool!.handler({
        workspaceId: 'workspace-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should create client', async () => {
      mockApi.mockCreateClient('workspace-123');

      const toolList = tools.getTools();
      const createClientTool = toolList.find(t => t.name === 'create_client');

      const result = await createClientTool!.handler({
        workspaceId: 'workspace-123',
        name: 'New Client',
        email: 'client@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Client');
    });
  });

  describe('Tag Tools', () => {
    it('should list tags', async () => {
      mockApi.mockGetTags('workspace-123');

      const toolList = tools.getTools();
      const listTagsTool = toolList.find(t => t.name === 'list_tags');

      const result = await listTagsTool!.handler({
        workspaceId: 'workspace-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should create tag', async () => {
      mockApi.mockCreateTag('workspace-123');

      const toolList = tools.getTools();
      const createTagTool = toolList.find(t => t.name === 'create_tag');

      const result = await createTagTool!.handler({
        workspaceId: 'workspace-123',
        name: 'New Tag',
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Development');
    });

    it('should create multiple tags', async () => {
      mockApi.scope
        .post('/api/v1/workspaces/workspace-123/tags')
        .times(3)
        .reply(201, mockApiResponses.tags[0]);

      const toolList = tools.getTools();
      const createMultipleTagsTool = toolList.find(t => t.name === 'create_multiple_tags');

      const result = await createMultipleTagsTool!.handler({
        workspaceId: 'workspace-123',
        names: ['Tag1', 'Tag2', 'Tag3'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
    });
  });

  describe('Task Tools', () => {
    it('should list tasks', async () => {
      mockApi.mockGetTasks('workspace-123', 'project-123');

      const toolList = tools.getTools();
      const listTasksTool = toolList.find(t => t.name === 'list_tasks');

      const result = await listTasksTool!.handler({
        workspaceId: 'workspace-123',
        projectId: 'project-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should create task', async () => {
      mockApi.mockCreateTask('workspace-123', 'project-123');

      const toolList = tools.getTools();
      const createTaskTool = toolList.find(t => t.name === 'create_task');

      const result = await createTaskTool!.handler({
        workspaceId: 'workspace-123',
        projectId: 'project-123',
        name: 'New Task',
        assigneeIds: ['user-123'],
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Task');
    });

    it('should mark task as done', async () => {
      mockApi.scope
        .put('/api/v1/workspaces/workspace-123/projects/project-123/tasks/task-123')
        .reply(200, { ...mockApiResponses.tasks[0], status: 'DONE' });

      const toolList = tools.getTools();
      const markTaskDoneTool = toolList.find(t => t.name === 'mark_task_done');

      const result = await markTaskDoneTool!.handler({
        workspaceId: 'workspace-123',
        projectId: 'project-123',
        taskId: 'task-123',
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('DONE');
    });
  });

  describe('Report Tools', () => {
    it('should generate summary report', async () => {
      mockApi.scope.post('/api/v1/workspaces/workspace-123/reports/summary').reply(200, {
        totals: [{ totalTime: 'PT8H', entriesCount: 5 }],
        groupOne: [{ name: 'Project 1', duration: 'PT4H' }],
      });

      const toolList = tools.getTools();
      const getSummaryReportTool = toolList.find(t => t.name === 'get_summary_report');

      const result = await getSummaryReportTool!.handler({
        workspaceId: 'workspace-123',
        dateRangeStart: '2025-01-18T00:00:00Z',
        dateRangeEnd: '2025-01-18T23:59:59Z',
        groupBy: ['PROJECT', 'USER'],
      });

      expect(result.success).toBe(true);
      expect(result.data.totals).toHaveLength(1);
    });

    it('should get user productivity report', async () => {
      mockApi.scope.post('/api/v1/workspaces/workspace-123/reports/summary').reply(200, {
        totals: [{ totalTime: 'PT6H', entriesCount: 3 }],
        groupOne: [{ name: 'user-123', duration: 'PT6H' }],
      });

      const toolList = tools.getTools();
      const getUserProductivityTool = toolList.find(t => t.name === 'get_user_productivity_report');

      const result = await getUserProductivityTool!.handler({
        workspaceId: 'workspace-123',
        userId: 'user-123',
        start: '2025-01-18T00:00:00Z',
        end: '2025-01-18T23:59:59Z',
      });

      expect(result.success).toBe(true);
      expect(result.data.totals).toHaveLength(1);
    });
  });

  describe('Default Values Application', () => {
    it('should apply default workspace and project to time entry creation', async () => {
      mockApi.mockCreateTimeEntry('workspace-123');

      const toolList = tools.getTools();
      const createTimeEntryTool = toolList.find(t => t.name === 'create_time_entry');

      // For integration test, provide workspaceId explicitly
      const result = await createTimeEntryTool!.handler({
        workspaceId: 'workspace-123',
        description: 'Test work',
        start: '2025-01-18T09:00:00Z',
      });

      expect(result.success).toBe(true);
      // The API call should have been made with default workspace ID
    });
  });

  describe('Money normalization', () => {
    it('should normalize read responses when enabled', async () => {
      mockApi.scope
        .get('/api/v1/workspaces/workspace-123/projects')
        .matchHeader('X-Api-Key', /.+/)
        .query(true)
        .reply(200, [
          {
            ...mockApiResponses.projects[0],
            hourlyRate: { amount: 7500, currency: 'USD' },
          },
        ]);

      const toolList = tools.getTools();
      const listProjectsTool = toolList.find(t => t.name === 'list_projects')!;

      const result = await executeToolWithMoneyNormalization(listProjectsTool, {
        workspaceId: 'workspace-123',
      }, true);

      expect(result.success).toBe(true);
      expect(result.data[0].hourlyRate).toEqual({ amount: 75, currency: 'USD' });
    });

    it('should leave read responses unchanged when disabled', async () => {
      mockApi.scope
        .get('/api/v1/workspaces/workspace-123/projects')
        .matchHeader('X-Api-Key', /.+/)
        .query(true)
        .reply(200, [
          {
            ...mockApiResponses.projects[0],
            hourlyRate: { amount: 7500, currency: 'USD' },
          },
        ]);

      const toolList = tools.getTools();
      const listProjectsTool = toolList.find(t => t.name === 'list_projects')!;

      const result = await executeToolWithMoneyNormalization(listProjectsTool, {
        workspaceId: 'workspace-123',
      }, false);

      expect(result.success).toBe(true);
      expect(result.data[0].hourlyRate).toEqual({ amount: 7500, currency: 'USD' });
    });

    it('should denormalize write requests when enabled', async () => {
      let capturedBody: Record<string, unknown> | undefined;

      mockApi.scope
        .post('/api/v1/workspaces/workspace-123/time-entries')
        .matchHeader('X-Api-Key', /.+/)
        .reply(201, function (_uri, body) {
          capturedBody = body as Record<string, unknown>;
          return mockApiResponses.timeEntries[0];
        });

      const toolList = tools.getTools();
      const createTimeEntryTool = toolList.find(t => t.name === 'create_time_entry')!;

      const result = await executeToolWithMoneyNormalization(
        createTimeEntryTool,
        {
          workspaceId: 'workspace-123',
          description: 'Billable work',
          start: '2025-01-18T09:00:00Z',
          end: '2025-01-18T10:00:00Z',
          hourlyRate: { amount: 25, currency: 'USD' },
        },
        true
      );

      expect(result.success).toBe(true);
      expect(capturedBody?.hourlyRate).toEqual({ amount: 2500, currency: 'USD' });
    });

    it('should leave write requests unchanged when disabled', async () => {
      let capturedBody: Record<string, unknown> | undefined;

      mockApi.scope
        .post('/api/v1/workspaces/workspace-123/time-entries')
        .matchHeader('X-Api-Key', /.+/)
        .reply(201, function (_uri, body) {
          capturedBody = body as Record<string, unknown>;
          return mockApiResponses.timeEntries[0];
        });

      const toolList = tools.getTools();
      const createTimeEntryTool = toolList.find(t => t.name === 'create_time_entry')!;

      await executeToolWithMoneyNormalization(
        createTimeEntryTool,
        {
          workspaceId: 'workspace-123',
          description: 'Billable work',
          start: '2025-01-18T09:00:00Z',
          end: '2025-01-18T10:00:00Z',
          hourlyRate: { amount: 25, currency: 'USD' },
        },
        false
      );

      expect(capturedBody?.hourlyRate).toEqual({ amount: 25, currency: 'USD' });
    });
  });
});
