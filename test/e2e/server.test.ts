import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { mockClockifyApi } from '../helpers/nockHelpers.js';

// Mock the server creation process
vi.mock('../../src/config/index.js', () => ({
  ConfigurationManager: vi.fn().mockImplementation(() => ({
    getApiKey: () => 'test-api-key-12345678',
    getApiUrl: () => 'https://api.clockify.me/api/v1',
    getRestrictions: () => ({
      allowedProjects: ['project-123'],
      allowedWorkspaces: ['workspace-123'],
      readOnly: false
    }),
    isProjectAllowed: (id: string) => id === 'project-123',
    isWorkspaceAllowed: (id: string) => id === 'workspace-123',
    canPerformOperation: () => true,
    validateTimeEntry: () => ({ valid: true }),
    getDefaultProjectId: () => 'project-123',
    getDefaultWorkspaceId: () => 'workspace-123'
  }))
}));

vi.mock('../../src/middleware/restrictions.js', () => ({
  RestrictionMiddleware: vi.fn().mockImplementation(() => ({
    applyDefaults: (params: any) => ({ ...params, workspaceId: params.workspaceId || 'workspace-123' }),
    validateToolAccess: () => {},
    filterProjects: (projects: any[]) => projects.filter(p => p.id === 'project-123'),
    filterWorkspaces: (workspaces: any[]) => workspaces.filter(w => w.id === 'workspace-123')
  }))
}));

describe('MCP Server E2E', () => {
  let server: Server;
  let mockApi: ReturnType<typeof mockClockifyApi>;

  beforeEach(async () => {
    mockApi = mockClockifyApi();
    
    // Dynamically import the module after mocks are set up
    const { ClockifyTools } = await import('../../src/tools/index.js');
    const { ConfigurationManager } = await import('../../src/config/index.js');
    
    const config = new ConfigurationManager();
    const tools = new ClockifyTools('test-api-key-12345678', config);
    
    server = new Server(
      { name: 'test-clockify-server', version: '1.0.0' },
      { capabilities: { tools: {}, resources: {}, prompts: {} } }
    );
    
    const toolList = tools.getTools();
    
    // Set up list tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: toolList.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: { type: 'object', properties: {}, required: [] }
      }))
    }));
    
    // Set up call tool handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = toolList.find(t => t.name === request.params.name);
      if (!tool) throw new Error(`Tool ${request.params.name} not found`);
      
      const result = await tool.handler(request.params.arguments || {});
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });
    
    // Set up resources handlers
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'clockify://workspaces',
          name: 'Workspaces',
          description: 'List of workspaces',
          mimeType: 'application/json'
        },
        {
          uri: 'clockify://current-user',
          name: 'Current User',
          description: 'Current user information',
          mimeType: 'application/json'
        }
      ]
    }));
    
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      if (request.params.uri === 'clockify://workspaces') {
        mockApi.mockGetWorkspaces();
        const tool = toolList.find(t => t.name === 'list_workspaces');
        const result = await tool!.handler({});
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } else if (request.params.uri === 'clockify://current-user') {
        mockApi.mockGetCurrentUser();
        const tool = toolList.find(t => t.name === 'get_current_user');
        const result = await tool!.handler({});
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
      throw new Error(`Unknown resource: ${request.params.uri}`);
    });
  });

  describe('Server Capabilities', () => {
    it('should list available tools', async () => {
      const response = await server.request(
        { method: 'tools/list' },
        ListToolsRequestSchema
      );
      
      expect(response.tools).toBeDefined();
      expect(response.tools.length).toBeGreaterThan(0);
      
      // Check for key tools
      const toolNames = response.tools.map(t => t.name);
      expect(toolNames).toContain('get_current_user');
      expect(toolNames).toContain('list_workspaces');
      expect(toolNames).toContain('list_projects');
      expect(toolNames).toContain('create_time_entry');
      expect(toolNames).toContain('get_summary_report');
    });

    it('should list available resources', async () => {
      const response = await server.request(
        { method: 'resources/list' },
        ListResourcesRequestSchema
      );
      
      expect(response.resources).toBeDefined();
      expect(response.resources.length).toBe(2);
      expect(response.resources[0].uri).toBe('clockify://workspaces');
      expect(response.resources[1].uri).toBe('clockify://current-user');
    });
  });

  describe('Tool Execution', () => {
    it('should execute get_current_user tool', async () => {
      mockApi.mockGetCurrentUser();
      
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'get_current_user',
            arguments: {}
          }
        },
        CallToolRequestSchema
      );
      
      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe('text');
      
      const result = JSON.parse(response.content[0].text!);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('user-123');
    });

    it('should execute list_workspaces tool with filtering', async () => {
      mockApi.mockGetWorkspaces();
      
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'list_workspaces',
            arguments: {}
          }
        },
        CallToolRequestSchema
      );
      
      const result = JSON.parse(response.content[0].text!);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Filtered by restrictions
      expect(result.data[0].id).toBe('workspace-123');
    });

    it('should execute create_time_entry tool with defaults', async () => {
      mockApi.mockCreateTimeEntry('workspace-123');
      
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'create_time_entry',
            arguments: {
              description: 'Test work',
              start: '2025-01-18T09:00:00Z',
              end: '2025-01-18T10:30:00Z'
            }
          }
        },
        CallToolRequestSchema
      );
      
      const result = JSON.parse(response.content[0].text!);
      expect(result.success).toBe(true);
      expect(result.data.description).toBe('Test work');
    });

    it('should handle tool not found error', async () => {
      await expect(server.request(
        {
          method: 'tools/call',
          params: {
            name: 'nonexistent_tool',
            arguments: {}
          }
        },
        CallToolRequestSchema
      )).rejects.toThrow('Tool nonexistent_tool not found');
    });

    it('should execute list_projects with restrictions', async () => {
      mockApi.mockGetProjects('workspace-123');
      
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'list_projects',
            arguments: {
              workspaceId: 'workspace-123'
            }
          }
        },
        CallToolRequestSchema
      );
      
      const result = JSON.parse(response.content[0].text!);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Filtered by restrictions
      expect(result.data[0].id).toBe('project-123');
    });
  });

  describe('Resource Access', () => {
    it('should read workspaces resource', async () => {
      const response = await server.request(
        {
          method: 'resources/read',
          params: {
            uri: 'clockify://workspaces'
          }
        },
        ReadResourceRequestSchema
      );
      
      expect(response.contents).toBeDefined();
      expect(response.contents[0].uri).toBe('clockify://workspaces');
      expect(response.contents[0].mimeType).toBe('application/json');
      
      const result = JSON.parse(response.contents[0].text!);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should read current-user resource', async () => {
      const response = await server.request(
        {
          method: 'resources/read',
          params: {
            uri: 'clockify://current-user'
          }
        },
        ReadResourceRequestSchema
      );
      
      expect(response.contents).toBeDefined();
      expect(response.contents[0].uri).toBe('clockify://current-user');
      
      const result = JSON.parse(response.contents[0].text!);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('user-123');
    });

    it('should handle unknown resource error', async () => {
      await expect(server.request(
        {
          method: 'resources/read',
          params: {
            uri: 'clockify://unknown'
          }
        },
        ReadResourceRequestSchema
      )).rejects.toThrow('Unknown resource: clockify://unknown');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockApi.mockUnauthorized();
      
      await expect(server.request(
        {
          method: 'tools/call',
          params: {
            name: 'get_current_user',
            arguments: {}
          }
        },
        CallToolRequestSchema
      )).rejects.toThrow();
    });

    it('should handle rate limit errors', async () => {
      mockApi.mockRateLimit();
      
      await expect(server.request(
        {
          method: 'tools/call',
          params: {
            name: 'get_current_user',
            arguments: {}
          }
        },
        CallToolRequestSchema
      )).rejects.toThrow();
    });

    it('should handle not found errors', async () => {
      mockApi.mockNotFound();
      
      await expect(server.request(
        {
          method: 'tools/call',
          params: {
            name: 'get_current_user',
            arguments: {}
          }
        },
        CallToolRequestSchema
      )).rejects.toThrow();
    });
  });

  describe('Complex Workflows', () => {
    it('should support time tracking workflow', async () => {
      // 1. Get current user
      mockApi.mockGetCurrentUser();
      const userResponse = await server.request(
        {
          method: 'tools/call',
          params: { name: 'get_current_user', arguments: {} }
        },
        CallToolRequestSchema
      );
      
      const userResult = JSON.parse(userResponse.content[0].text!);
      expect(userResult.success).toBe(true);
      
      // 2. List projects
      mockApi.mockGetProjects('workspace-123');
      const projectsResponse = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'list_projects',
            arguments: { workspaceId: 'workspace-123' }
          }
        },
        CallToolRequestSchema
      );
      
      const projectsResult = JSON.parse(projectsResponse.content[0].text!);
      expect(projectsResult.success).toBe(true);
      expect(projectsResult.data).toHaveLength(1);
      
      // 3. Create time entry
      mockApi.mockCreateTimeEntry('workspace-123');
      const timeEntryResponse = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'create_time_entry',
            arguments: {
              description: 'Working on project',
              start: '2025-01-18T09:00:00Z',
              end: '2025-01-18T10:30:00Z',
              projectId: 'project-123'
            }
          }
        },
        CallToolRequestSchema
      );
      
      const timeEntryResult = JSON.parse(timeEntryResponse.content[0].text!);
      expect(timeEntryResult.success).toBe(true);
    });

    it('should support reporting workflow', async () => {
      // 1. Generate summary report
      mockApi.scope
        .post('/workspaces/workspace-123/reports/summary')
        .reply(200, {
          totals: [{ totalTime: 'PT8H', entriesCount: 5 }]
        });
      
      const reportResponse = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'get_summary_report',
            arguments: {
              workspaceId: 'workspace-123',
              dateRangeStart: '2025-01-18T00:00:00Z',
              dateRangeEnd: '2025-01-18T23:59:59Z',
              groupBy: ['PROJECT']
            }
          }
        },
        CallToolRequestSchema
      );
      
      const reportResult = JSON.parse(reportResponse.content[0].text!);
      expect(reportResult.success).toBe(true);
      expect(reportResult.data.totals).toHaveLength(1);
    });
  });
});