import { describe, it, expect, beforeEach } from 'vitest';
import { ClockifyTools } from '../../src/tools/index.js';
import { ConfigurationManager } from '../../src/config/index.js';
import { mockClockifyApi } from '../helpers/nockHelpers.js';
import { mockApiResponses } from '../helpers/mockData.js';

describe('ClockifyTools Integration', () => {
  let tools: ClockifyTools;
  let config: ConfigurationManager;
  let mockApi: ReturnType<typeof mockClockifyApi>;

  beforeEach(() => {
    config = new ConfigurationManager({
      apiKey: 'test-api-key-12345678',
      restrictions: {
        allowedProjects: ['project-123'],
        allowedWorkspaces: ['workspace-123'],
        defaultWorkspaceId: 'workspace-123',
        defaultProjectId: 'project-123'
      }
    });
    tools = new ClockifyTools('test-api-key-12345678', config);
    mockApi = mockClockifyApi();
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
      mockApi.scope
        .get('/workspaces/workspace-123/users')
        .reply(200, [mockApiResponses.user]);
      
      const toolList = tools.getTools();
      const listUsersTool = toolList.find(t => t.name === 'list_users');
      
      const result = await listUsersTool!.handler({
        workspaceId: 'workspace-123'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should find user by name', async () => {
      mockApi.scope
        .get('/workspaces/workspace-123/users')
        .reply(200, [mockApiResponses.user]);
      
      const toolList = tools.getTools();
      const findUserTool = toolList.find(t => t.name === 'find_user_by_name');
      
      const result = await findUserTool!.handler({
        workspaceId: 'workspace-123',
        name: 'Test'
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
        workspaceId: 'workspace-123'
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
        workspaceId: 'workspace-123'
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
        billable: true
      });
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Project');
    });

    it('should find project by name', async () => {
      mockApi.scope
        .get('/workspaces/workspace-123/projects')
        .query({ name: 'Test' })
        .reply(200, [mockApiResponses.projects[0]]);
      
      const toolList = tools.getTools();
      const findProjectTool = toolList.find(t => t.name === 'find_project_by_name');
      
      const result = await findProjectTool!.handler({
        workspaceId: 'workspace-123',
        name: 'Test'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('Time Entry Tools', () => {
    it('should create time entry with defaults', async () => {
      mockApi.mockCreateTimeEntry('workspace-123');
      
      const toolList = tools.getTools();
      const createTimeEntryTool = toolList.find(t => t.name === 'create_time_entry');
      
      const result = await createTimeEntryTool!.handler({
        description: 'Test work',
        start: '2025-01-18T09:00:00Z',
        end: '2025-01-18T10:30:00Z'
        // workspaceId and projectId should be applied from defaults
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
        userId: 'user-123'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should stop running timer', async () => {
      mockApi.mockGetCurrentUser();
      mockApi.scope
        .patch('/workspaces/workspace-123/user/user-123/time-entries')
        .reply(200, { ...mockApiResponses.timeEntries[0], timeInterval: { ...mockApiResponses.timeEntries[0].timeInterval, end: '2025-01-18T10:30:00Z' } });
      
      const toolList = tools.getTools();
      const stopTimerTool = toolList.find(t => t.name === 'stop_timer');
      
      const result = await stopTimerTool!.handler({
        workspaceId: 'workspace-123'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.timeInterval.end).toBeDefined();
    });

    it('should get today entries', async () => {
      mockApi.scope
        .get('/workspaces/workspace-123/user/user-123/time-entries')
        .query(true)
        .reply(200, [mockApiResponses.timeEntries[0]]);
      
      const toolList = tools.getTools();
      const getTodayEntriesTool = toolList.find(t => t.name === 'get_today_entries');
      
      const result = await getTodayEntriesTool!.handler({
        workspaceId: 'workspace-123',
        userId: 'user-123'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should bulk edit time entries', async () => {
      mockApi.scope
        .patch('/workspaces/workspace-123/time-entries/bulk')
        .reply(200, { success: true, updated: 2 });
      
      const toolList = tools.getTools();
      const bulkEditTool = toolList.find(t => t.name === 'bulk_edit_time_entries');
      
      const result = await bulkEditTool!.handler({
        workspaceId: 'workspace-123',
        timeEntryIds: ['entry-123', 'entry-456'],
        action: 'UPDATE',
        updates: {
          billable: true,
          projectId: 'project-123'
        }
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
        workspaceId: 'workspace-123'
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
        email: 'client@example.com'
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
        workspaceId: 'workspace-123'
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
        name: 'New Tag'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Development');
    });

    it('should create multiple tags', async () => {
      mockApi.scope
        .post('/workspaces/workspace-123/tags')
        .times(3)
        .reply(201, mockApiResponses.tags[0]);
      
      const toolList = tools.getTools();
      const createMultipleTagsTool = toolList.find(t => t.name === 'create_multiple_tags');
      
      const result = await createMultipleTagsTool!.handler({
        workspaceId: 'workspace-123',
        names: ['Tag1', 'Tag2', 'Tag3']
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
        projectId: 'project-123'
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
        assigneeIds: ['user-123']
      });
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Task');
    });

    it('should mark task as done', async () => {
      mockApi.scope
        .put('/workspaces/workspace-123/projects/project-123/tasks/task-123')
        .reply(200, { ...mockApiResponses.tasks[0], status: 'DONE' });
      
      const toolList = tools.getTools();
      const markTaskDoneTool = toolList.find(t => t.name === 'mark_task_done');
      
      const result = await markTaskDoneTool!.handler({
        workspaceId: 'workspace-123',
        projectId: 'project-123',
        taskId: 'task-123'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('DONE');
    });
  });

  describe('Report Tools', () => {
    it('should generate summary report', async () => {
      mockApi.scope
        .post('/workspaces/workspace-123/reports/summary')
        .reply(200, {
          totals: [{ totalTime: 'PT8H', entriesCount: 5 }],
          groupOne: [{ name: 'Project 1', duration: 'PT4H' }]
        });
      
      const toolList = tools.getTools();
      const getSummaryReportTool = toolList.find(t => t.name === 'get_summary_report');
      
      const result = await getSummaryReportTool!.handler({
        workspaceId: 'workspace-123',
        dateRangeStart: '2025-01-18T00:00:00Z',
        dateRangeEnd: '2025-01-18T23:59:59Z',
        groupBy: ['PROJECT', 'USER']
      });
      
      expect(result.success).toBe(true);
      expect(result.data.totals).toHaveLength(1);
    });

    it('should get user productivity report', async () => {
      mockApi.scope
        .post('/workspaces/workspace-123/reports/summary')
        .reply(200, {
          totals: [{ totalTime: 'PT6H', entriesCount: 3 }],
          groupOne: [{ name: 'user-123', duration: 'PT6H' }]
        });
      
      const toolList = tools.getTools();
      const getUserProductivityTool = toolList.find(t => t.name === 'get_user_productivity_report');
      
      const result = await getUserProductivityTool!.handler({
        workspaceId: 'workspace-123',
        userId: 'user-123',
        start: '2025-01-18T00:00:00Z',
        end: '2025-01-18T23:59:59Z'
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
      
      // Don't provide workspaceId or projectId - should use defaults
      const result = await createTimeEntryTool!.handler({
        description: 'Test work',
        start: '2025-01-18T09:00:00Z'
      });
      
      expect(result.success).toBe(true);
      // The API call should have been made with default workspace ID
    });
  });
});