import nock from 'nock';
import { mockApiResponses } from './mockData.js';

// Clear proxy settings for tests
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

// Ensure nock is enabled
nock.restore();
nock.cleanAll();
nock.activate();

// Disable network connections except for nock interceptors
if (!nock.isActive()) {
  nock.activate();
}
nock.disableNetConnect();

const CLOCKIFY_API_BASE = 'https://api.clockify.me:443';

export function mockClockifyApi() {
  const scope = nock(CLOCKIFY_API_BASE);

  return {
    scope,
    
    // Helper methods
    cleanAll: () => {
      nock.cleanAll();
    },
    
    isDone: () => {
      return scope.isDone();
    },
    
    mockGetCurrentUser: () => {
      scope.get('/api/v1/user')
        .reply(200, mockApiResponses.user);
      return scope;
    },
    
    mockGetWorkspaces: () => {
      scope.get('/api/v1/workspaces')
        .reply(200, mockApiResponses.workspaces);
      return scope;
    },
    
    mockGetWorkspace: (workspaceId: string) => {
      scope.get(`/api/v1/workspaces/${workspaceId}`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(200, mockApiResponses.workspaces.find(w => w.id === workspaceId) || mockApiResponses.workspaces[0]);
      return scope;
    },
    
    mockGetProjects: (workspaceId: string) => {
      scope.get(`/api/v1/workspaces/${workspaceId}/projects`)
        .matchHeader('X-Api-Key', /.+/)
        .query(true) // Accept any query parameters
        .reply(200, mockApiResponses.projects);
      return scope;
    },
    
    mockGetProject: (workspaceId: string, projectId: string) => {
      scope.get(`/api/v1/workspaces/${workspaceId}/projects/${projectId}`)
        .matchHeader('X-Api-Key', /.+/)
        .query(true)
        .reply(200, mockApiResponses.projects.find(p => p.id === projectId) || mockApiResponses.projects[0]);
      return scope;
    },
    
    mockCreateProject: (workspaceId: string) => {
      scope.post(`/api/v1/workspaces/${workspaceId}/projects`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(201, mockApiResponses.projects[0]);
      return scope;
    },
    
    mockUpdateProject: (workspaceId: string, projectId: string) => {
      scope.put(`/api/v1/workspaces/${workspaceId}/projects/${projectId}`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(200, mockApiResponses.projects[0]);
      return scope;
    },
    
    mockDeleteProject: (workspaceId: string, projectId: string) => {
      scope.delete(`/api/v1/workspaces/${workspaceId}/projects/${projectId}`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(204);
      return scope;
    },
    
    mockGetClients: (workspaceId: string) => {
      scope.get(`/api/v1/workspaces/${workspaceId}/clients`)
        .matchHeader('X-Api-Key', /.+/)
        .query(true)
        .reply(200, mockApiResponses.clients);
      return scope;
    },
    
    mockCreateClient: (workspaceId: string) => {
      scope.post(`/api/v1/workspaces/${workspaceId}/clients`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(201, mockApiResponses.clients[0]);
      return scope;
    },
    
    mockGetTimeEntries: (workspaceId: string, userId: string) => {
      scope.get(`/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries`)
        .matchHeader('X-Api-Key', /.+/)
        .query(true)
        .reply(200, mockApiResponses.timeEntries);
      return scope;
    },
    
    mockCreateTimeEntry: (workspaceId: string) => {
      scope.post(`/api/v1/workspaces/${workspaceId}/time-entries`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(201, mockApiResponses.timeEntries[0]);
      return scope;
    },
    
    mockUpdateTimeEntry: (workspaceId: string, entryId: string) => {
      scope.put(`/api/v1/workspaces/${workspaceId}/time-entries/${entryId}`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(200, mockApiResponses.timeEntries[0]);
      return scope;
    },
    
    mockDeleteTimeEntry: (workspaceId: string, entryId: string) => {
      scope.delete(`/api/v1/workspaces/${workspaceId}/time-entries/${entryId}`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(204);
      return scope;
    },
    
    mockGetTags: (workspaceId: string) => {
      scope.get(`/api/v1/workspaces/${workspaceId}/tags`)
        .matchHeader('X-Api-Key', /.+/)
        .query(true)
        .reply(200, mockApiResponses.tags);
      return scope;
    },
    
    mockCreateTag: (workspaceId: string) => {
      scope.post(`/api/v1/workspaces/${workspaceId}/tags`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(201, mockApiResponses.tags[0]);
      return scope;
    },
    
    mockGetTasks: (workspaceId: string, projectId: string) => {
      scope.get(`/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks`)
        .matchHeader('X-Api-Key', /.+/)
        .query(true)
        .reply(200, mockApiResponses.tasks);
      return scope;
    },
    
    mockCreateTask: (workspaceId: string, projectId: string) => {
      scope.post(`/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(201, mockApiResponses.tasks[0]);
      return scope;
    },
    
    mockGetUsers: (workspaceId: string) => {
      scope.get(`/api/v1/workspaces/${workspaceId}/users`)
        .matchHeader('X-Api-Key', /.+/)
        .query(true)
        .reply(200, [mockApiResponses.user]);
      return scope;
    },
    
    mockGetTimeEntry: (workspaceId: string, entryId: string) => {
      scope.get(`/api/v1/workspaces/${workspaceId}/time-entries/${entryId}`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(200, mockApiResponses.timeEntries[0]);
      return scope;
    },
    
    mockStopTimer: (workspaceId: string, userId: string) => {
      scope.patch(`/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(200, { ...mockApiResponses.timeEntries[0], timeInterval: { ...mockApiResponses.timeEntries[0].timeInterval, end: new Date().toISOString() } });
      return scope;
    },
    
    mockBulkEditTimeEntries: (workspaceId: string) => {
      scope.patch(`/api/v1/workspaces/${workspaceId}/time-entries/bulk`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(200, { success: true, updated: 2 });
      return scope;
    },
    
    mockBulkDeleteTimeEntries: (workspaceId: string) => {
      scope.delete(`/api/v1/workspaces/${workspaceId}/time-entries`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(204);
      return scope;
    },
    
    mockUpdateTask: (workspaceId: string, projectId: string, taskId: string) => {
      scope.put(`/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(200, mockApiResponses.tasks[0]);
      return scope;
    },
    
    mockGenerateReport: (workspaceId: string) => {
      scope.post(`/api/v1/workspaces/${workspaceId}/reports/summary`)
        .matchHeader('X-Api-Key', /.+/)
        .reply(200, mockApiResponses.report);
      return scope;
    },
    
    mockApiError: (status: number, message: string) => {
      scope.get(/.*/)
        .reply(status, { message });
      return scope;
    },
    
    mockUnauthorized: () => {
      scope.get(/.*/)
        .reply(401, { message: 'Unauthorized' });
      return scope;
    },
    
    mockRateLimit: () => {
      scope.get(/.*/)
        .reply(429, { message: 'Rate limit exceeded' });
      return scope;
    },
    
    mockNotFound: () => {
      scope.get(/.*/)
        .reply(404, { message: 'Not found' });
      return scope;
    }
  };
}