import { describe, it, expect, beforeEach } from 'vitest';
import { ClockifyApiClient } from '../../../../src/api/client.js';
import { UserService } from '../../../../src/api/services/user.service.js';
import { mockClockifyApi } from '../../../helpers/nockHelpers.js';
import { mockUser } from '../../../helpers/mockData.js';

describe('UserService', () => {
  let userService: UserService;
  let mockApi: ReturnType<typeof mockClockifyApi>;

  beforeEach(() => {
    const client = new ClockifyApiClient('test-api-key-12345678');
    userService = new UserService(client);
    mockApi = mockClockifyApi();
  });

  describe('getCurrentUser', () => {
    it('should get current user', async () => {
      mockApi.mockGetCurrentUser();
      
      const user = await userService.getCurrentUser();
      
      expect(user).toEqual(mockUser);
      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('getUserById', () => {
    it('should get user by ID', async () => {
      mockApi.scope
        .get('/workspaces/workspace-123/users/user-123')
        .reply(200, mockUser);
      
      const user = await userService.getUserById('workspace-123', 'user-123');
      
      expect(user).toEqual(mockUser);
    });
  });

  describe('getAllUsers', () => {
    it('should get all users in workspace', async () => {
      mockApi.scope
        .get('/workspaces/workspace-123/users')
        .reply(200, [mockUser]);
      
      const users = await userService.getAllUsers('workspace-123');
      
      expect(users).toHaveLength(1);
      expect(users[0]).toEqual(mockUser);
    });

    it('should support query options', async () => {
      mockApi.scope
        .get('/workspaces/workspace-123/users')
        .query({
          email: 'test@example.com',
          status: 'ACTIVE',
          page: '1'
        })
        .reply(200, [mockUser]);
      
      const users = await userService.getAllUsers('workspace-123', {
        email: 'test@example.com',
        status: 'ACTIVE',
        page: 1
      });
      
      expect(users).toHaveLength(1);
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      mockApi.scope
        .get('/workspaces/workspace-123/users')
        .query({ email: 'test@example.com' })
        .reply(200, [mockUser]);
      
      const user = await userService.findUserByEmail('workspace-123', 'test@example.com');
      
      expect(user).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockApi.scope
        .get('/workspaces/workspace-123/users')
        .query({ email: 'notfound@example.com' })
        .reply(200, []);
      
      const user = await userService.findUserByEmail('workspace-123', 'notfound@example.com');
      
      expect(user).toBeNull();
    });
  });

  describe('findUserByName', () => {
    it('should find users by name partial match', async () => {
      mockApi.scope
        .get('/workspaces/workspace-123/users')
        .reply(200, [
          mockUser,
          { ...mockUser, id: 'user-456', name: 'Another Test User' },
          { ...mockUser, id: 'user-789', name: 'Different Name' }
        ]);
      
      const users = await userService.findUserByName('workspace-123', 'test');
      
      expect(users).toHaveLength(2);
      expect(users.every(u => u.name.toLowerCase().includes('test'))).toBe(true);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      
      mockApi.scope
        .put('/workspaces/workspace-123/users/user-123')
        .reply(200, updatedUser);
      
      const result = await userService.updateUser('workspace-123', 'user-123', {
        name: 'Updated Name'
      });
      
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('workspace user management', () => {
    it('should add user to workspace', async () => {
      mockApi.scope
        .post('/workspaces/workspace-123/users')
        .reply(201, mockUser);
      
      const user = await userService.addUserToWorkspace('workspace-123', 'test@example.com');
      
      expect(user).toEqual(mockUser);
    });

    it('should remove user from workspace', async () => {
      mockApi.scope
        .delete('/workspaces/workspace-123/users/user-123')
        .reply(204);
      
      await expect(userService.removeUserFromWorkspace('workspace-123', 'user-123'))
        .resolves.not.toThrow();
    });

    it('should set user active status', async () => {
      mockApi.scope
        .put('/workspaces/workspace-123/users/user-123/status')
        .reply(200, { ...mockUser, status: 'INACTIVE' });
      
      const user = await userService.setUserActiveStatus('workspace-123', 'user-123', false);
      
      expect(user.status).toBe('INACTIVE');
    });
  });
});