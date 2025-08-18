import nock from 'nock';
import { mockApiResponses } from './mockData.js';

const CLOCKIFY_API_BASE = 'https://api.clockify.me/api/v1';

export function mockClockifyApi() {
  const scope = nock(CLOCKIFY_API_BASE);

  return {
    scope,
    
    mockGetCurrentUser: () => {
      scope.get('/user')
        .matchHeader('X-Api-Key', 'test-api-key-12345678')
        .reply(200, mockApiResponses.user);
      return scope;
    },
    
    mockGetWorkspaces: () => {
      scope.get('/workspaces')
        .reply(200, mockApiResponses.workspaces);
      return scope;
    },
    
    mockGetWorkspace: (workspaceId: string) => {
      scope.get(`/workspaces/${workspaceId}`)
        .reply(200, mockApiResponses.workspaces.find(w => w.id === workspaceId) || mockApiResponses.workspaces[0]);
      return scope;
    },
    
    mockGetProjects: (workspaceId: string) => {
      scope.get(`/workspaces/${workspaceId}/projects`)
        .query(true) // Accept any query parameters
        .reply(200, mockApiResponses.projects);
      return scope;
    },
    
    mockGetProject: (workspaceId: string, projectId: string) => {
      scope.get(`/workspaces/${workspaceId}/projects/${projectId}`)
        .query(true)
        .reply(200, mockApiResponses.projects.find(p => p.id === projectId) || mockApiResponses.projects[0]);
      return scope;
    },
    
    mockCreateProject: (workspaceId: string) => {
      scope.post(`/workspaces/${workspaceId}/projects`)
        .reply(201, mockApiResponses.projects[0]);
      return scope;
    },
    
    mockUpdateProject: (workspaceId: string, projectId: string) => {
      scope.put(`/workspaces/${workspaceId}/projects/${projectId}`)
        .reply(200, mockApiResponses.projects[0]);
      return scope;
    },
    
    mockDeleteProject: (workspaceId: string, projectId: string) => {
      scope.delete(`/workspaces/${workspaceId}/projects/${projectId}`)
        .reply(204);
      return scope;
    },
    
    mockGetClients: (workspaceId: string) => {
      scope.get(`/workspaces/${workspaceId}/clients`)
        .query(true)
        .reply(200, mockApiResponses.clients);
      return scope;
    },
    
    mockCreateClient: (workspaceId: string) => {
      scope.post(`/workspaces/${workspaceId}/clients`)
        .reply(201, mockApiResponses.clients[0]);
      return scope;
    },
    
    mockGetTimeEntries: (workspaceId: string, userId: string) => {
      scope.get(`/workspaces/${workspaceId}/user/${userId}/time-entries`)
        .query(true)
        .reply(200, mockApiResponses.timeEntries);
      return scope;
    },
    
    mockCreateTimeEntry: (workspaceId: string) => {
      scope.post(`/workspaces/${workspaceId}/time-entries`)
        .reply(201, mockApiResponses.timeEntries[0]);
      return scope;
    },
    
    mockUpdateTimeEntry: (workspaceId: string, entryId: string) => {
      scope.put(`/workspaces/${workspaceId}/time-entries/${entryId}`)
        .reply(200, mockApiResponses.timeEntries[0]);
      return scope;
    },
    
    mockDeleteTimeEntry: (workspaceId: string, entryId: string) => {
      scope.delete(`/workspaces/${workspaceId}/time-entries/${entryId}`)
        .reply(204);
      return scope;
    },
    
    mockGetTags: (workspaceId: string) => {
      scope.get(`/workspaces/${workspaceId}/tags`)
        .query(true)
        .reply(200, mockApiResponses.tags);
      return scope;
    },
    
    mockCreateTag: (workspaceId: string) => {
      scope.post(`/workspaces/${workspaceId}/tags`)
        .reply(201, mockApiResponses.tags[0]);
      return scope;
    },
    
    mockGetTasks: (workspaceId: string, projectId: string) => {
      scope.get(`/workspaces/${workspaceId}/projects/${projectId}/tasks`)
        .query(true)
        .reply(200, mockApiResponses.tasks);
      return scope;
    },
    
    mockCreateTask: (workspaceId: string, projectId: string) => {
      scope.post(`/workspaces/${workspaceId}/projects/${projectId}/tasks`)
        .reply(201, mockApiResponses.tasks[0]);
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