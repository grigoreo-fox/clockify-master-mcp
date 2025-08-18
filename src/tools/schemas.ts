import { z } from "zod";

export const workspaceIdSchema = z.object({
  workspaceId: z.string().describe("The workspace ID")
});

export const userIdSchema = z.object({
  userId: z.string().describe("The user ID")
});

export const projectIdSchema = z.object({
  projectId: z.string().describe("The project ID")
});

export const clientIdSchema = z.object({
  clientId: z.string().describe("The client ID")
});

export const tagIdSchema = z.object({
  tagId: z.string().describe("The tag ID")
});

export const taskIdSchema = z.object({
  taskId: z.string().describe("The task ID")
});

export const timeEntryIdSchema = z.object({
  timeEntryId: z.string().describe("The time entry ID")
});

export const dateRangeSchema = z.object({
  start: z.string().describe("Start date/time in ISO 8601 format"),
  end: z.string().describe("End date/time in ISO 8601 format")
});

export const paginationSchema = z.object({
  page: z.number().optional().describe("Page number (1-based)"),
  pageSize: z.number().optional().describe("Number of items per page")
});

export const createTimeEntrySchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  description: z.string().describe("Description of the time entry"),
  start: z.string().describe("Start time in ISO 8601 format"),
  end: z.string().optional().describe("End time in ISO 8601 format (omit for running timer)"),
  projectId: z.string().optional().describe("Project ID to associate with"),
  taskId: z.string().optional().describe("Task ID to associate with"),
  tagIds: z.array(z.string()).optional().describe("Array of tag IDs"),
  billable: z.boolean().optional().default(false).describe("Whether the time entry is billable")
});

export const updateTimeEntrySchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  timeEntryId: z.string().describe("The time entry ID to update"),
  description: z.string().optional().describe("New description"),
  start: z.string().optional().describe("New start time in ISO 8601 format"),
  end: z.string().optional().describe("New end time in ISO 8601 format"),
  projectId: z.string().optional().describe("New project ID"),
  taskId: z.string().optional().describe("New task ID"),
  tagIds: z.array(z.string()).optional().describe("New array of tag IDs"),
  billable: z.boolean().optional().describe("New billable status")
});

export const createProjectSchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  name: z.string().describe("Project name"),
  clientId: z.string().optional().describe("Client ID to associate with"),
  color: z.string().optional().default("#0000FF").describe("Project color in hex format"),
  billable: z.boolean().optional().default(true).describe("Whether the project is billable"),
  isPublic: z.boolean().optional().default(true).describe("Whether the project is public"),
  note: z.string().optional().describe("Project notes/description")
});

export const updateProjectSchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  projectId: z.string().describe("The project ID to update"),
  name: z.string().optional().describe("New project name"),
  clientId: z.string().optional().describe("New client ID"),
  color: z.string().optional().describe("New color in hex format"),
  billable: z.boolean().optional().describe("New billable status"),
  isPublic: z.boolean().optional().describe("New public status"),
  archived: z.boolean().optional().describe("Archive/unarchive the project"),
  note: z.string().optional().describe("New project notes")
});

export const createClientSchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  name: z.string().describe("Client name"),
  email: z.string().email().optional().describe("Client email"),
  address: z.string().optional().describe("Client address"),
  note: z.string().optional().describe("Client notes")
});

export const createTagSchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  name: z.string().describe("Tag name")
});

export const createTaskSchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  projectId: z.string().describe("The project ID"),
  name: z.string().describe("Task name"),
  assigneeIds: z.array(z.string()).optional().describe("Array of user IDs to assign"),
  estimate: z.string().optional().describe("Time estimate (e.g., 'PT2H30M')"),
  status: z.enum(["ACTIVE", "DONE"]).optional().default("ACTIVE").describe("Task status"),
  billable: z.boolean().optional().describe("Whether the task is billable")
});

export const reportRequestSchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  dateRangeStart: z.string().describe("Report start date in ISO 8601 format"),
  dateRangeEnd: z.string().describe("Report end date in ISO 8601 format"),
  userIds: z.array(z.string()).optional().describe("Filter by user IDs"),
  projectIds: z.array(z.string()).optional().describe("Filter by project IDs"),
  clientIds: z.array(z.string()).optional().describe("Filter by client IDs"),
  tagIds: z.array(z.string()).optional().describe("Filter by tag IDs"),
  billable: z.enum(["BILLABLE", "NON_BILLABLE", "BOTH"]).optional().describe("Filter by billable status"),
  groupBy: z.array(z.enum(["USER", "PROJECT", "CLIENT", "TAG", "DATE", "TASK"])).optional().describe("Group results by these dimensions")
});

export const stopTimerSchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  userId: z.string().optional().describe("The user ID (defaults to current user)")
});

export const searchProjectsSchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  name: z.string().optional().describe("Search by project name"),
  clientId: z.string().optional().describe("Filter by client ID"),
  archived: z.boolean().optional().describe("Include archived projects"),
  page: z.number().optional().describe("Page number"),
  pageSize: z.number().optional().describe("Items per page")
});

export const searchUsersSchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  name: z.string().optional().describe("Search by user name"),
  email: z.string().optional().describe("Search by email"),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING_EMAIL_VERIFICATION"]).optional().describe("Filter by status")
});

export const bulkTimeEntriesSchema = z.object({
  workspaceId: z.string().describe("The workspace ID"),
  timeEntryIds: z.array(z.string()).describe("Array of time entry IDs"),
  action: z.enum(["DELETE", "UPDATE"]).describe("Action to perform"),
  updates: z.object({
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    billable: z.boolean().optional()
  }).optional().describe("Updates to apply (for UPDATE action)")
});