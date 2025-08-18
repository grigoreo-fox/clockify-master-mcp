import { ClockifyUser, ClockifyWorkspace, ClockifyProject, ClockifyClient, ClockifyTimeEntry, ClockifyTag, ClockifyTask } from '../../src/types/index.js';

export const mockUser: ClockifyUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  activeWorkspace: 'workspace-123',
  defaultWorkspace: 'workspace-123',
  status: 'ACTIVE',
  settings: {
    weekStart: 'MONDAY',
    timeZone: 'UTC',
    timeFormat: 'HOUR24',
    dateFormat: 'DD/MM/YYYY'
  }
};

export const mockWorkspace: ClockifyWorkspace = {
  id: 'workspace-123',
  name: 'Test Workspace',
  hourlyRate: {
    amount: 50,
    currency: 'USD'
  },
  workspaceSettings: {
    timeRoundingInReports: false,
    onlyAdminsSeeBillableRates: false,
    onlyAdminsCreateProject: false,
    onlyAdminsSeeDashboard: false,
    defaultBillableProjects: true
  }
};

export const mockProject: ClockifyProject = {
  id: 'project-123',
  name: 'Test Project',
  workspaceId: 'workspace-123',
  billable: true,
  color: '#0000FF',
  archived: false,
  template: false,
  public: true,
  clientId: 'client-123',
  hourlyRate: {
    amount: 75,
    currency: 'USD'
  }
};

export const mockRestrictedProject: ClockifyProject = {
  id: 'project-restricted',
  name: 'Restricted Project',
  workspaceId: 'workspace-123',
  billable: true,
  color: '#FF0000',
  archived: false,
  template: false,
  public: false
};

export const mockClient: ClockifyClient = {
  id: 'client-123',
  name: 'Test Client',
  workspaceId: 'workspace-123',
  archived: false,
  email: 'client@example.com',
  address: '123 Test St'
};

export const mockTimeEntry: ClockifyTimeEntry = {
  id: 'entry-123',
  description: 'Test work',
  userId: 'user-123',
  billable: true,
  projectId: 'project-123',
  timeInterval: {
    start: '2025-01-18T09:00:00Z',
    end: '2025-01-18T10:30:00Z',
    duration: 'PT1H30M'
  },
  workspaceId: 'workspace-123',
  isLocked: false,
  tagIds: ['tag-123']
};

export const mockTag: ClockifyTag = {
  id: 'tag-123',
  name: 'Development',
  workspaceId: 'workspace-123',
  archived: false
};

export const mockTask: ClockifyTask = {
  id: 'task-123',
  name: 'Test Task',
  projectId: 'project-123',
  status: 'ACTIVE',
  assigneeIds: ['user-123'],
  estimate: 'PT8H',
  billable: true
};

export const mockApiResponses = {
  user: mockUser,
  workspaces: [mockWorkspace],
  projects: [mockProject, mockRestrictedProject],
  clients: [mockClient],
  timeEntries: [mockTimeEntry],
  tags: [mockTag],
  tasks: [mockTask]
};

export const mockApiKey = 'test-api-key-12345678';