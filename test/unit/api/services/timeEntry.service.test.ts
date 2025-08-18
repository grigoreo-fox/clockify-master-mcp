import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ClockifyApiClient } from '../../../../src/api/client.js';
import { TimeEntryService } from '../../../../src/api/services/timeEntry.service.js';
import { mockClockifyApi } from '../../../helpers/nockHelpers.js';
import { mockTimeEntry } from '../../../helpers/mockData.js';

describe('TimeEntryService', () => {
  let timeEntryService: TimeEntryService;
  let mockApi: ReturnType<typeof mockClockifyApi>;

  beforeEach(() => {
    const client = new ClockifyApiClient('test-api-key-12345678');
    timeEntryService = new TimeEntryService(client);
    mockApi = mockClockifyApi();
  });

  afterEach(() => {
    mockApi.cleanAll();
  });

  describe('createTimeEntry', () => {
    it('should create a time entry', async () => {
      mockApi.mockCreateTimeEntry('workspace-123');
      
      const entry = await timeEntryService.createTimeEntry('workspace-123', {
        start: '2025-01-18T09:00:00Z',
        description: 'Test work',
        projectId: 'project-123'
      });
      
      expect(entry).toEqual(mockTimeEntry);
    });
  });

  describe('getTimeEntriesForUser', () => {
    it('should get time entries for user', async () => {
      mockApi.mockGetTimeEntries('workspace-123', 'user-123');
      
      const entries = await timeEntryService.getTimeEntriesForUser('workspace-123', 'user-123');
      
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual(mockTimeEntry);
    });

    it('should support filter options', async () => {
      mockApi.scope
        .get('/api/v1/workspaces/workspace-123/user/user-123/time-entries')
        .matchHeader('X-Api-Key', /.+/)
        .query({
          start: '2025-01-18T00:00:00Z',
          end: '2025-01-18T23:59:59Z',
          project: 'project-123',
          description: 'test'
        })
        .reply(200, [mockTimeEntry]);
      
      const entries = await timeEntryService.getTimeEntriesForUser('workspace-123', 'user-123', {
        start: '2025-01-18T00:00:00Z',
        end: '2025-01-18T23:59:59Z',
        project: 'project-123',
        description: 'test'
      });
      
      expect(entries).toHaveLength(1);
    });
  });

  describe('getTimeEntryById', () => {
    it('should get time entry by ID', async () => {
      mockApi.scope
        .get('/api/v1/workspaces/workspace-123/time-entries/entry-123')
        .matchHeader('X-Api-Key', /.+/)
        .reply(200, mockTimeEntry);
      
      const entry = await timeEntryService.getTimeEntryById('workspace-123', 'entry-123');
      
      expect(entry).toEqual(mockTimeEntry);
    });
  });

  describe('updateTimeEntry', () => {
    it('should update time entry', async () => {
      const updatedEntry = { ...mockTimeEntry, description: 'Updated work' };
      
      mockApi.mockUpdateTimeEntry('workspace-123', 'entry-123');
      
      const entry = await timeEntryService.updateTimeEntry('workspace-123', 'entry-123', {
        description: 'Updated work'
      });
      
      expect(entry).toEqual(mockTimeEntry);
    });
  });

  describe('deleteTimeEntry', () => {
    it('should delete time entry', async () => {
      mockApi.mockDeleteTimeEntry('workspace-123', 'entry-123');
      
      await expect(timeEntryService.deleteTimeEntry('workspace-123', 'entry-123'))
        .resolves.not.toThrow();
    });
  });

  describe('stopRunningTimer', () => {
    it('should stop running timer', async () => {
      mockApi.scope
        .patch('/api/v1/workspaces/workspace-123/user/user-123/time-entries')
        .matchHeader('X-Api-Key', /.+/)
        .reply(200, { ...mockTimeEntry, timeInterval: { ...mockTimeEntry.timeInterval, end: '2025-01-18T10:30:00Z' } });
      
      const entry = await timeEntryService.stopRunningTimer('workspace-123', 'user-123', {
        end: '2025-01-18T10:30:00Z'
      });
      
      expect(entry.timeInterval.end).toBe('2025-01-18T10:30:00Z');
    });
  });

  describe('getRunningTimeEntry', () => {
    it('should get running time entry', async () => {
      const runningEntry = { ...mockTimeEntry, timeInterval: { ...mockTimeEntry.timeInterval, end: undefined } };
      
      mockApi.scope
        .get('/api/v1/workspaces/workspace-123/user/user-123/time-entries')
        .query(true)
        .reply(200, [runningEntry]);
      
      const entry = await timeEntryService.getRunningTimeEntry('workspace-123', 'user-123');
      
      expect(entry).toEqual(runningEntry);
      expect(entry?.timeInterval.end).toBeUndefined();
    });

    it('should return null if no running timer', async () => {
      mockApi.scope
        .get('/api/v1/workspaces/workspace-123/user/user-123/time-entries')
        .query(true)
        .reply(200, [mockTimeEntry]); // Entry with end time
      
      const entry = await timeEntryService.getRunningTimeEntry('workspace-123', 'user-123');
      
      expect(entry).toBeNull();
    });
  });

  describe('bulk operations', () => {
    it('should bulk edit time entries', async () => {
      mockApi.scope
        .patch('/api/v1/workspaces/workspace-123/time-entries/bulk')
        .reply(200, { success: true });
      
      const result = await timeEntryService.bulkEditTimeEntries('workspace-123', ['entry-123', 'entry-456'], {
        billable: true,
        projectId: 'project-123'
      });
      
      expect(result).toEqual({ success: true });
    });

    it('should bulk delete time entries', async () => {
      mockApi.scope
        .post('/api/v1/workspaces/workspace-123/time-entries/delete')
        .reply(204);
      
      await expect(timeEntryService.bulkDeleteTimeEntries('workspace-123', ['entry-123', 'entry-456']))
        .resolves.not.toThrow();
    });
  });

  describe('duplicateTimeEntry', () => {
    it('should duplicate time entry', async () => {
      mockApi.scope
        .get('/api/v1/workspaces/workspace-123/time-entries/entry-123')
        .reply(200, mockTimeEntry);
      
      mockApi.mockCreateTimeEntry('workspace-123');
      
      const duplicated = await timeEntryService.duplicateTimeEntry('workspace-123', 'entry-123');
      
      expect(duplicated.description).toBe(mockTimeEntry.description);
      expect(duplicated.projectId).toBe(mockTimeEntry.projectId);
    });
  });

  describe('date range helpers', () => {
    it('should get today time entries', async () => {
      mockApi.scope
        .get('/api/v1/workspaces/workspace-123/user/user-123/time-entries')
        .query(query => {
          // Check that start and end are for today
          const start = new Date(query.start as string);
          const end = new Date(query.end as string);
          const today = new Date();
          
          return start.toDateString() === today.toDateString() &&
                 end.toDateString() === new Date(today.getTime() + 24*60*60*1000).toDateString();
        })
        .reply(200, [mockTimeEntry]);
      
      const entries = await timeEntryService.getTodayTimeEntries('workspace-123', 'user-123');
      
      expect(entries).toHaveLength(1);
    });

    it('should get week time entries', async () => {
      mockApi.scope
        .get('/api/v1/workspaces/workspace-123/user/user-123/time-entries')
        .query(query => {
          // Verify we're getting a week range
          const start = new Date(query.start as string);
          const end = new Date(query.end as string);
          const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          
          return diffDays === 7;
        })
        .reply(200, [mockTimeEntry]);
      
      const entries = await timeEntryService.getWeekTimeEntries('workspace-123', 'user-123');
      
      expect(entries).toHaveLength(1);
    });

    it('should get month time entries', async () => {
      mockApi.scope
        .get('/api/v1/workspaces/workspace-123/user/user-123/time-entries')
        .query(query => {
          // Verify we're getting a month range
          const start = new Date(query.start as string);
          const end = new Date(query.end as string);
          
          return start.getDate() === 1 && // First day of month
                 end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate(); // Last day of month
        })
        .reply(200, [mockTimeEntry]);
      
      const entries = await timeEntryService.getMonthTimeEntries('workspace-123', 'user-123');
      
      expect(entries).toHaveLength(1);
    });
  });
});