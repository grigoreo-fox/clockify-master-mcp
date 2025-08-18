import { z } from 'zod';
import {
  ClockifyApiClient,
  UserService,
  WorkspaceService,
  ProjectService,
  ClientService,
  TimeEntryService,
  TagService,
  TaskService,
  ReportService,
} from '../api/services/index.js';
import * as schemas from './schemas.js';
import { ConfigurationManager } from '../config/index.js';
import { RestrictionMiddleware } from '../middleware/restrictions.js';

interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  inputSchema: z.ZodSchema;
  handler: (args: any) => Promise<any>;
  priority?: number; // Lower number = higher priority when filtering
}

export class ClockifyTools {
  private userService: UserService;
  private workspaceService: WorkspaceService;
  private projectService: ProjectService;
  private clientService: ClientService;
  private timeEntryService: TimeEntryService;
  private tagService: TagService;
  private taskService: TaskService;
  private reportService: ReportService;
  private restrictionMiddleware: RestrictionMiddleware;
  private config: ConfigurationManager;

  constructor(apiKey: string, config: ConfigurationManager) {
    const client = new ClockifyApiClient(apiKey, config.getApiUrl());
    this.userService = new UserService(client);
    this.workspaceService = new WorkspaceService(client);
    this.projectService = new ProjectService(client);
    this.clientService = new ClientService(client);
    this.timeEntryService = new TimeEntryService(client);
    this.tagService = new TagService(client);
    this.taskService = new TaskService(client);
    this.reportService = new ReportService(client);
    this.restrictionMiddleware = new RestrictionMiddleware(config);
    this.config = config;
  }

  private getAllTools(): ToolDefinition[] {
    return [
      // User Tools
      {
        name: 'get_current_user',
        description: 'Get information about the currently authenticated user',
        category: 'user',
        priority: 1,
        inputSchema: z.object({}),
        handler: async () => {
          const user = await this.userService.getCurrentUser();
          return { success: true, data: user };
        },
      },
      {
        name: 'get_user',
        description: 'Get information about a specific user',
        category: 'user',
        priority: 3,
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: z.string().describe('The user ID'),
        }),
        handler: async (
          input: z.infer<typeof schemas.workspaceIdSchema & typeof schemas.userIdSchema>
        ) => {
          const user = await this.userService.getUserById(input.workspaceId, input.userId);
          return { success: true, data: user };
        },
      },
      {
        name: 'list_users',
        description: 'List all users in a workspace',
        category: 'user',
        priority: 2,
        inputSchema: schemas.workspaceIdSchema.extend(schemas.searchUsersSchema.shape),
        handler: async (input: any) => {
          const users = await this.userService.getAllUsers(input.workspaceId, input);
          return { success: true, data: users };
        },
      },
      {
        name: 'find_user_by_name',
        description: 'Find users by name (partial match)',
        category: 'search',
        priority: 5,
        inputSchema: schemas.workspaceIdSchema.extend({
          name: z.string().describe('Name to search for (partial match)'),
        }),
        handler: async (input: any) => {
          const users = await this.userService.findUserByName(input.workspaceId, input.name);
          return { success: true, data: users };
        },
      },

      // Workspace Tools
      {
        name: 'list_workspaces',
        description: 'List all workspaces accessible to the user (filtered by restrictions)',
        category: 'workspace',
        priority: 1,
        inputSchema: z.object({}),
        handler: async () => {
          const workspaces = await this.workspaceService.getAllWorkspaces();
          const filteredWorkspaces = this.restrictionMiddleware.filterWorkspaces(workspaces);
          return { success: true, data: filteredWorkspaces };
        },
      },
      {
        name: 'get_workspace',
        category: 'workspace',
        priority: 2,
        description: 'Get details of a specific workspace',
        inputSchema: schemas.workspaceIdSchema,
        handler: async (input: z.infer<typeof schemas.workspaceIdSchema>) => {
          const workspace = await this.workspaceService.getWorkspaceById(input.workspaceId);
          return { success: true, data: workspace };
        },
      },

      // Project Tools
      {
        name: 'list_projects',
        category: 'project',
        priority: 1,
        description: 'List all projects in a workspace (filtered by restrictions)',
        inputSchema: schemas.searchProjectsSchema,
        handler: async (input: z.infer<typeof schemas.searchProjectsSchema>) => {
          const projects = await this.projectService.getAllProjects(input.workspaceId, input);
          const filteredProjects = this.restrictionMiddleware.filterProjects(projects);
          return { success: true, data: filteredProjects };
        },
      },
      {
        name: 'get_project',
        category: 'project',
        priority: 2,
        description: 'Get details of a specific project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: z.string().describe('The project ID'),
        }),
        handler: async (input: any) => {
          const project = await this.projectService.getProjectById(
            input.workspaceId,
            input.projectId
          );
          return { success: true, data: project };
        },
      },
      {
        name: 'create_project',
        category: 'project',
        priority: 3,
        description: 'Create a new project',
        inputSchema: schemas.createProjectSchema,
        handler: async (input: z.infer<typeof schemas.createProjectSchema>) => {
          const project = await this.projectService.createProject(input.workspaceId, input);
          return { success: true, data: project };
        },
      },
      {
        name: 'update_project',
        category: 'project',
        priority: 4,
        description: 'Update an existing project',
        inputSchema: schemas.updateProjectSchema,
        handler: async (input: z.infer<typeof schemas.updateProjectSchema>) => {
          const { workspaceId, projectId, ...data } = input;
          const project = await this.projectService.updateProject(workspaceId, projectId, data);
          return { success: true, data: project };
        },
      },
      {
        name: 'archive_project',
        category: 'project',
        priority: 5,
        description: 'Archive a project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: z.string().describe('The project ID to archive'),
        }),
        handler: async (input: any) => {
          const project = await this.projectService.archiveProject(
            input.workspaceId,
            input.projectId
          );
          return { success: true, data: project };
        },
      },
      {
        name: 'find_project_by_name',
        category: 'search',
        priority: 2,
        description: 'Find projects by name',
        inputSchema: schemas.workspaceIdSchema.extend({
          name: z.string().describe('Project name to search for'),
        }),
        handler: async (input: any) => {
          const projects = await this.projectService.findProjectByName(
            input.workspaceId,
            input.name
          );
          return { success: true, data: projects };
        },
      },

      // Client Tools
      {
        name: 'list_clients',
        category: 'client',
        priority: 1,
        description: 'List all clients in a workspace',
        inputSchema: schemas.workspaceIdSchema.extend({
          archived: z.boolean().optional().describe('Include archived clients'),
        }),
        handler: async (input: any) => {
          const clients = await this.clientService.getAllClients(input.workspaceId, input);
          return { success: true, data: clients };
        },
      },
      {
        name: 'get_client',
        category: 'client',
        priority: 2,
        description: 'Get details of a specific client',
        inputSchema: schemas.workspaceIdSchema.extend({
          clientId: z.string().describe('The client ID'),
        }),
        handler: async (input: any) => {
          const client = await this.clientService.getClientById(input.workspaceId, input.clientId);
          return { success: true, data: client };
        },
      },
      {
        name: 'create_client',
        category: 'client',
        priority: 3,
        description: 'Create a new client',
        inputSchema: schemas.createClientSchema,
        handler: async (input: z.infer<typeof schemas.createClientSchema>) => {
          const { workspaceId, ...data } = input;
          const client = await this.clientService.createClient(workspaceId, data);
          return { success: true, data: client };
        },
      },
      {
        name: 'update_client',
        category: 'client',
        priority: 4,
        description: 'Update an existing client',
        inputSchema: schemas.workspaceIdSchema.extend({
          clientId: z.string().describe('The client ID'),
          name: z.string().optional(),
          email: z.string().email().optional(),
          address: z.string().optional(),
          note: z.string().optional(),
          archived: z.boolean().optional(),
        }),
        handler: async (input: any) => {
          const { workspaceId, clientId, ...data } = input;
          const client = await this.clientService.updateClient(workspaceId, clientId, data);
          return { success: true, data: client };
        },
      },

      // Time Entry Tools
      {
        name: 'create_time_entry',
        category: 'timeEntry',
        priority: 1,
        description: 'Create a new time entry (start tracking time)',
        inputSchema: schemas.createTimeEntrySchema,
        handler: async (input: z.infer<typeof schemas.createTimeEntrySchema>) => {
          const { workspaceId, ...data } = input;
          const entry = await this.timeEntryService.createTimeEntry(workspaceId, data);
          return { success: true, data: entry };
        },
      },
      {
        name: 'update_time_entry',
        category: 'timeEntry',
        priority: 3,
        description: 'Update an existing time entry',
        inputSchema: schemas.updateTimeEntrySchema,
        handler: async (input: z.infer<typeof schemas.updateTimeEntrySchema>) => {
          const { workspaceId, timeEntryId, ...data } = input;
          const entry = await this.timeEntryService.updateTimeEntry(workspaceId, timeEntryId, data);
          return { success: true, data: entry };
        },
      },
      {
        name: 'delete_time_entry',
        category: 'timeEntry',
        priority: 4,
        description: 'Delete a time entry',
        inputSchema: schemas.workspaceIdSchema.extend({
          timeEntryId: z.string().describe('The time entry ID to delete'),
        }),
        handler: async (input: any) => {
          await this.timeEntryService.deleteTimeEntry(input.workspaceId, input.timeEntryId);
          return { success: true, message: 'Time entry deleted successfully' };
        },
      },
      {
        name: 'get_time_entries',
        category: 'timeEntry',
        priority: 2,
        description: 'Get time entries for a user',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: z.string().describe('The user ID'),
          start: z.string().optional().describe('Start date in ISO format'),
          end: z.string().optional().describe('End date in ISO format'),
          projectId: z.string().optional().describe('Filter by project ID'),
          description: z.string().optional().describe('Filter by description'),
        }),
        handler: async (input: any) => {
          const { workspaceId, userId, projectId, ...options } = input;
          const entries = await this.timeEntryService.getTimeEntriesForUser(
            workspaceId,
            userId,
            projectId ? { ...options, project: projectId } : options
          );
          return { success: true, data: entries };
        },
      },
      {
        name: 'get_running_timer',
        category: 'timeEntry',
        priority: 5,
        description: 'Get the currently running timer for a user',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: z.string().describe('The user ID'),
        }),
        handler: async (input: any) => {
          const entry = await this.timeEntryService.getRunningTimeEntry(
            input.workspaceId,
            input.userId
          );
          return { success: true, data: entry };
        },
      },
      {
        name: 'stop_timer',
        category: 'timeEntry',
        priority: 6,
        description: 'Stop the currently running timer',
        inputSchema: schemas.stopTimerSchema,
        handler: async (input: z.infer<typeof schemas.stopTimerSchema>) => {
          const userId = input.userId || (await this.userService.getCurrentUser()).id;
          const entry = await this.timeEntryService.stopRunningTimer(input.workspaceId, userId, {
            end: new Date().toISOString(),
          });
          return { success: true, data: entry };
        },
      },
      {
        name: 'get_today_entries',
        category: 'timeEntry',
        priority: 7,
        description: 'Get all time entries for today',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: z.string().describe('The user ID'),
        }),
        handler: async (input: any) => {
          const entries = await this.timeEntryService.getTodayTimeEntries(
            input.workspaceId,
            input.userId
          );
          return { success: true, data: entries };
        },
      },
      {
        name: 'get_week_entries',
        category: 'timeEntry',
        priority: 8,
        description: 'Get all time entries for the current week',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: z.string().describe('The user ID'),
        }),
        handler: async (input: any) => {
          const entries = await this.timeEntryService.getWeekTimeEntries(
            input.workspaceId,
            input.userId
          );
          return { success: true, data: entries };
        },
      },
      {
        name: 'get_month_entries',
        category: 'timeEntry',
        priority: 9,
        description: 'Get all time entries for a specific month',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: z.string().describe('The user ID'),
          year: z.number().optional().describe('Year (defaults to current year)'),
          month: z.number().optional().describe('Month (0-11, defaults to current month)'),
        }),
        handler: async (input: any) => {
          const entries = await this.timeEntryService.getMonthTimeEntries(
            input.workspaceId,
            input.userId,
            input.year,
            input.month
          );
          return { success: true, data: entries };
        },
      },
      {
        name: 'bulk_edit_time_entries',
        category: 'bulk',
        priority: 1,
        description: 'Bulk edit multiple time entries',
        inputSchema: schemas.bulkTimeEntriesSchema,
        handler: async (input: z.infer<typeof schemas.bulkTimeEntriesSchema>) => {
          const { workspaceId, timeEntryIds, action, updates } = input;
          if (action === 'DELETE') {
            await this.timeEntryService.bulkDeleteTimeEntries(workspaceId, timeEntryIds);
            return { success: true, message: 'Time entries deleted successfully' };
          } else {
            const result = await this.timeEntryService.bulkEditTimeEntries(
              workspaceId,
              timeEntryIds,
              updates || {}
            );
            return { success: true, data: result };
          }
        },
      },

      // Tag Tools
      {
        name: 'list_tags',
        category: 'tag',
        priority: 1,
        description: 'List all tags in a workspace',
        inputSchema: schemas.workspaceIdSchema.extend({
          archived: z.boolean().optional().describe('Include archived tags'),
        }),
        handler: async (input: any) => {
          const tags = await this.tagService.getAllTags(input.workspaceId, input);
          return { success: true, data: tags };
        },
      },
      {
        name: 'create_tag',
        category: 'tag',
        priority: 2,
        description: 'Create a new tag',
        inputSchema: schemas.createTagSchema,
        handler: async (input: z.infer<typeof schemas.createTagSchema>) => {
          const { workspaceId, ...data } = input;
          const tag = await this.tagService.createTag(workspaceId, data);
          return { success: true, data: tag };
        },
      },
      {
        name: 'create_multiple_tags',
        category: 'tag',
        priority: 3,
        description: 'Create multiple tags at once',
        inputSchema: schemas.workspaceIdSchema.extend({
          names: z.array(z.string()).describe('Array of tag names to create'),
        }),
        handler: async (input: any) => {
          const tags = await this.tagService.createMultipleTags(input.workspaceId, input.names);
          return { success: true, data: tags };
        },
      },

      // Task Tools
      {
        name: 'list_tasks',
        category: 'task',
        priority: 1,
        description: 'List all tasks in a project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: z.string().describe('The project ID'),
          isActive: z.boolean().optional().describe('Filter by active status'),
        }),
        handler: async (input: any) => {
          const tasks = await this.taskService.getAllTasks(
            input.workspaceId,
            input.projectId,
            input
          );
          return { success: true, data: tasks };
        },
      },
      {
        name: 'create_task',
        category: 'task',
        priority: 2,
        description: 'Create a new task in a project',
        inputSchema: schemas.createTaskSchema,
        handler: async (input: z.infer<typeof schemas.createTaskSchema>) => {
          const { workspaceId, projectId, ...data } = input;
          const task = await this.taskService.createTask(workspaceId, projectId, data);
          return { success: true, data: task };
        },
      },
      {
        name: 'update_task',
        category: 'task',
        priority: 3,
        description: 'Update an existing task',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: z.string().describe('The project ID'),
          taskId: z.string().describe('The task ID'),
          name: z.string().optional(),
          assigneeIds: z.array(z.string()).optional(),
          estimate: z.string().optional(),
          status: z.enum(['ACTIVE', 'DONE']).optional(),
          billable: z.boolean().optional(),
        }),
        handler: async (input: any) => {
          const { workspaceId, projectId, taskId, ...data } = input;
          const task = await this.taskService.updateTask(workspaceId, projectId, taskId, data);
          return { success: true, data: task };
        },
      },
      {
        name: 'mark_task_done',
        category: 'task',
        priority: 4,
        description: 'Mark a task as done',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: z.string().describe('The project ID'),
          taskId: z.string().describe('The task ID'),
        }),
        handler: async (input: any) => {
          const task = await this.taskService.markTaskAsDone(
            input.workspaceId,
            input.projectId,
            input.taskId
          );
          return { success: true, data: task };
        },
      },

      // Report Tools
      {
        name: 'get_summary_report',
        category: 'report',
        priority: 1,
        description: 'Generate a summary report',
        inputSchema: schemas.reportRequestSchema,
        handler: async (input: z.infer<typeof schemas.reportRequestSchema>) => {
          const { workspaceId, userIds, projectIds, clientIds, tagIds, groupBy, ...request } =
            input;
          const reportRequest: any = {
            dateRangeStart: request.dateRangeStart,
            dateRangeEnd: request.dateRangeEnd,
            billable: request.billable,
          };

          if (userIds) reportRequest.users = { ids: userIds, contains: 'CONTAINS' };
          if (projectIds) reportRequest.projects = { ids: projectIds, contains: 'CONTAINS' };
          if (clientIds) reportRequest.clients = { ids: clientIds, contains: 'CONTAINS' };
          if (tagIds) reportRequest.tags = { ids: tagIds, contains: 'CONTAINS' };
          if (groupBy) reportRequest.summaryFilter = { groups: groupBy };

          const report = await this.reportService.getSummaryReport(workspaceId, reportRequest);
          return { success: true, data: report };
        },
      },
      {
        name: 'get_user_productivity_report',
        category: 'report',
        priority: 2,
        description: 'Get productivity report for a specific user',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: z.string().describe('The user ID'),
          start: z.string().describe('Start date in ISO format'),
          end: z.string().describe('End date in ISO format'),
        }),
        handler: async (input: any) => {
          const report = await this.reportService.getUserProductivityReport(
            input.workspaceId,
            input.userId,
            { start: input.start, end: input.end }
          );
          return { success: true, data: report };
        },
      },
      {
        name: 'get_project_progress_report',
        category: 'report',
        priority: 3,
        description: 'Get progress report for a specific project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: z.string().describe('The project ID'),
          start: z.string().describe('Start date in ISO format'),
          end: z.string().describe('End date in ISO format'),
        }),
        handler: async (input: any) => {
          const report = await this.reportService.getProjectProgressReport(
            input.workspaceId,
            input.projectId,
            { start: input.start, end: input.end }
          );
          return { success: true, data: report };
        },
      },
      {
        name: 'get_team_utilization_report',
        category: 'report',
        priority: 4,
        description: 'Get team utilization report',
        inputSchema: schemas.workspaceIdSchema.extend({
          start: z.string().describe('Start date in ISO format'),
          end: z.string().describe('End date in ISO format'),
        }),
        handler: async (input: any) => {
          const report = await this.reportService.getTeamUtilizationReport(input.workspaceId, {
            start: input.start,
            end: input.end,
          });
          return { success: true, data: report };
        },
      },
      {
        name: 'export_report',
        category: 'report',
        priority: 5,
        description: 'Export a report in various formats',
        inputSchema: schemas.reportRequestSchema.extend({
          format: z.enum(['CSV', 'PDF', 'EXCEL']).describe('Export format'),
        }),
        handler: async (input: any) => {
          const {
            workspaceId,
            format,
            userIds,
            projectIds,
            clientIds,
            tagIds,
            groupBy,
            ...request
          } = input;
          const reportRequest: any = {
            dateRangeStart: request.dateRangeStart,
            dateRangeEnd: request.dateRangeEnd,
            billable: request.billable,
          };

          if (userIds) reportRequest.users = { ids: userIds, contains: 'CONTAINS' };
          if (projectIds) reportRequest.projects = { ids: projectIds, contains: 'CONTAINS' };
          if (clientIds) reportRequest.clients = { ids: clientIds, contains: 'CONTAINS' };
          if (tagIds) reportRequest.tags = { ids: tagIds, contains: 'CONTAINS' };
          if (groupBy) reportRequest.summaryFilter = { groups: groupBy };

          const report = await this.reportService.exportReport(workspaceId, format, reportRequest);
          return { success: true, data: report };
        },
      },
    ];
  }

  private filterTools(allTools: ToolDefinition[]): ToolDefinition[] {
    const filtering = this.config.getToolFiltering();

    // If specific tools are enabled, only include those
    if (filtering.enabledTools && filtering.enabledTools.length > 0) {
      const enabledSet = new Set(filtering.enabledTools);
      return allTools.filter(tool => enabledSet.has(tool.name)).slice(0, filtering.maxTools);
    }

    // Filter by categories
    const enabledCategories = new Set(filtering.enabledCategories);
    let filteredTools = allTools.filter(tool => enabledCategories.has(tool.category as any));

    // Remove disabled tools
    if (filtering.disabledTools && filtering.disabledTools.length > 0) {
      const disabledSet = new Set(filtering.disabledTools);
      filteredTools = filteredTools.filter(tool => !disabledSet.has(tool.name));
    }

    // Sort by priority (lower number = higher priority)
    filteredTools.sort((a, b) => (a.priority || 99) - (b.priority || 99));

    // Limit to max tools
    return filteredTools.slice(0, filtering.maxTools);
  }

  getTools() {
    const allTools = this.getAllTools();
    const filteredTools = this.filterTools(allTools);

    return filteredTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handler: tool.handler,
    }));
  }

  getToolCategories(): string[] {
    return [
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
    ];
  }

  getAvailableToolNames(): string[] {
    return this.getAllTools().map(tool => tool.name);
  }

  getToolsByCategory(category: string): string[] {
    return this.getAllTools()
      .filter(tool => tool.category === category)
      .map(tool => tool.name);
  }
}
