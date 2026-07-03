# Clockify Master MCP

**The Ultimate Clockify Integration for Claude Desktop**

Transform how you track time by bringing Clockify's powerful time management capabilities directly into your Claude conversations. Start timers, create projects, generate reports, and manage your entire workflow without switching apps.

---

## 🚀 Quick Start

### 1. Get Your API Key

Visit [Clockify Settings](https://app.clockify.me/user/settings) → **API** section → Copy your **API Key**

### 2. Install & Configure

Add this to your Claude Desktop MCP settings (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "clockify": {
      "command": "npx",
      "args": ["@hongkongkiwi/clockify-master-mcp"],
      "env": {
        "CLOCKIFY_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

That's it! You can now ask Claude to track time, create projects, generate reports, and more.

---

## ✨ What You Can Do

### 📊 **Time Tracking Made Simple**

- **"Start tracking time for project setup"** - Instantly begin time tracking
- **"What's my running timer?"** - Check active timers
- **"Stop my current timer"** - End time tracking
- **"Show me today's time entries"** - Review your daily activity

### 📈 **Project & Client Management**

- **"Create a new project called 'Website Redesign'"** - Set up projects quickly
- **"List all my active projects"** - See your project portfolio
- **"Add a client named 'Acme Corp'"** - Manage client relationships
- **"Archive the old marketing project"** - Keep workspace organized

### 📋 **Task Organization**

- **"Create tasks for the mobile app project"** - Break down work into tasks
- **"Mark the design task as complete"** - Track progress
- **"Show tasks assigned to John"** - Monitor team assignments

### 📊 **Powerful Reporting**

- **"Generate a weekly time report"** - Get detailed summaries
- **"Show team productivity for last month"** - Analyze team performance
- **"Export project report as CSV"** - Share insights with stakeholders
- **"How much time did I spend on client work?"** - Track billable hours

### 🏷️ **Smart Organization**

- **"Tag this entry as 'meeting'"** - Categorize activities
- **"Create tags for different project phases"** - Organize workflows
- **"Find all entries tagged 'research'"** - Locate specific work

---

## 🎯 Popular Use Cases

### **Freelancers & Consultants**

```json
{
  "mcpServers": {
    "clockify-freelancer": {
      "command": "npx",
      "args": ["@hongkongkiwi/clockify-master-mcp"],
      "env": {
        "CLOCKIFY_API_KEY": "your_api_key_here",
        "ENABLED_TOOL_CATEGORIES": "user,workspace,project,client,timeEntry,report",
        "MAX_TOOLS": "20"
      }
    }
  }
}
```

**Perfect for:** Client billing, project tracking, detailed reporting

### **Team Managers**

```json
{
  "mcpServers": {
    "clockify-team": {
      "command": "npx",
      "args": ["@hongkongkiwi/clockify-master-mcp"],
      "env": {
        "CLOCKIFY_API_KEY": "your_api_key_here",
        "ALLOWED_PROJECTS": "proj-123,proj-456",
        "ENABLED_TOOL_CATEGORIES": "user,workspace,project,timeEntry,task,report",
        "READ_ONLY": "false",
        "MAX_TOOLS": "25"
      }
    }
  }
}
```

**Perfect for:** Team oversight, project management, productivity analysis

### **Simple Time Tracking**

```json
{
  "mcpServers": {
    "clockify-simple": {
      "command": "npx",
      "args": ["@hongkongkiwi/clockify-master-mcp"],
      "env": {
        "CLOCKIFY_API_KEY": "your_api_key_here",
        "ENABLED_TOOLS": "get_current_user,create_time_entry,stop_timer,get_today_entries,get_summary_report",
        "MAX_TOOLS": "5"
      }
    }
  }
}
```

**Perfect for:** Personal productivity, basic time tracking, minimal setup

### **Analytics & Reporting Only**

```json
{
  "mcpServers": {
    "clockify-reports": {
      "command": "npx",
      "args": ["@hongkongkiwi/clockify-master-mcp"],
      "env": {
        "CLOCKIFY_API_KEY": "your_api_key_here",
        "ENABLED_TOOL_CATEGORIES": "user,workspace,project,report",
        "READ_ONLY": "true",
        "MAX_TOOLS": "12"
      }
    }
  }
}
```

**Perfect for:** Executives, analysts, report generation without data modification

---

## 🔧 Customization Options

### **Choose Your Tools**

Control which features are available to avoid overwhelming Claude:

- **All Features (38 tools)**: Complete Clockify integration
- **Time Tracking Focus (12 tools)**: Essential time management
- **Project Management (18 tools)**: Full project control
- **Reporting Only (10 tools)**: Analytics and insights
- **Minimal Setup (5 tools)**: Just the basics

### **Set Boundaries**

Restrict access to specific projects or workspaces:

```env
# Only work with specific projects
ALLOWED_PROJECTS=website-redesign,mobile-app,marketing-campaign

# Default workspace for all operations
DEFAULT_WORKSPACE_ID=your-main-workspace-id

# Prevent accidental deletions
READ_ONLY=false
ALLOW_TIME_ENTRY_DELETION=false
```

### **Smart Filtering**

```env
# Focus on essential categories
ENABLED_TOOL_CATEGORIES=user,workspace,timeEntry,report

# Exclude specific tools you don't need
DISABLED_TOOLS=bulk_edit_time_entries,delete_time_entry

# Limit total tools (helps with Claude's tool limits)
MAX_TOOLS=15
```

### **🛡️ Project Configuration Protections**

When you configure specific projects (using `DEFAULT_PROJECT_ID` or `ALLOWED_PROJECTS`), the system automatically protects these projects from accidental damage:

#### **🚫 Blocked Operations**

These operations are completely prevented when they would affect your configured projects:

- **`delete_project`** - Cannot delete configured projects
- **`archive_project`** - Cannot archive configured projects
- **`remove_user_from_project`** - Cannot remove users from configured projects
- **`delete_client`** - Cannot delete clients that configured projects depend on
- **`delete_task`** - Cannot delete tasks from configured projects
- **`delete_workspace`** - Cannot delete workspaces containing configured projects
- **`bulk_edit_time_entries`** - Cannot bulk-assign time entries TO configured projects

#### **⚠️ Protected Operations with Warnings**

These operations are allowed but generate warnings:

- **`update_project`** - Warns when changing critical fields (name, client)
- **`update_workspace`** - Warns about settings that could affect project functionality
- **`delete_tag`** - Warns when deleting tags from workspaces with configured projects
- **`bulk_edit_time_entries`** - Warns when bulk operations might affect configured projects

#### **✅ Enhanced Operations**

These operations are automatically improved:

- **`update_time_entry`** - Automatically preserves existing project assignments to prevent validation errors

#### **Configuration Examples**

**Protect a specific default project:**

```json
{
  "env": {
    "CLOCKIFY_API_KEY": "your_api_key_here",
    "DEFAULT_PROJECT_ID": "project-12345",
    "DEFAULT_WORKSPACE_ID": "workspace-67890"
  }
}
```

**Restrict to only specific projects:**

```json
{
  "env": {
    "CLOCKIFY_API_KEY": "your_api_key_here",
    "ALLOWED_PROJECTS": "proj-123,proj-456,proj-789"
  }
}
```

#### **Error Messages You Might See**

- `"Cannot delete the configured default project. Please update your configuration first."`
- `"Cannot remove users from a configured project. This could break access to required project functionality."`
- `"Cannot delete client: The following configured projects depend on this client: Website Project, Mobile App."`

These protections ensure your critical project configurations remain intact while still allowing full functionality for non-configured projects.

---

## 💡 Real Usage Examples

### Starting Your Day

**You:** "Start tracking time for the morning standup meeting"

**Claude:** Using Clockify, I'll start tracking time for your standup meeting...
✅ Timer started for "Morning standup meeting"
⏰ Started at 9:00 AM
📁 Project: Team Management

### Checking Progress

**You:** "What did I work on yesterday and for how long?"

**Claude:** Here's your time summary for yesterday:

- **Website Development**: 6.5 hours
  - Frontend updates: 3.5h
  - Bug fixes: 2h
  - Code review: 1h
- **Client Meetings**: 1.5 hours
- **Admin Tasks**: 0.5 hours
  **Total**: 8.5 hours

### Project Planning

**You:** "Create a new project for the Q2 marketing campaign with tasks for planning, design, and execution"

**Claude:** I've created your Q2 marketing campaign project with these tasks:
✅ **Project Created**: "Q2 Marketing Campaign"
📋 **Tasks Added**:

- Campaign Planning (assigned to you)
- Creative Design (ready for assignment)
- Campaign Execution (ready for assignment)

### Weekly Reporting

**You:** "Generate a weekly report showing time by project and export it as CSV"

**Claude:** Here's your weekly time report:

- **Total Hours**: 42.5
- **Most Active Project**: Website Development (28h)
- **Billable Hours**: 38.5h
- **Non-billable**: 4h

📊 **CSV export ready** - Contains detailed breakdown by day and project

---

## 🛠️ Installation Methods

### Option 1: NPX (Recommended)

```json
{
  "command": "npx",
  "args": ["@hongkongkiwi/clockify-master-mcp"]
}
```

✅ Always latest version  
✅ No local installation needed  
✅ Automatic updates

### Option 2: Local Installation

```bash
npm install -g @hongkongkiwi/clockify-master-mcp
```

```json
{
  "command": "clockify-master-mcp"
}
```

✅ Faster startup  
✅ Works offline  
✅ Version control

### Option 3: Development Setup

```bash
git clone https://github.com/hongkongkiwi/mcp-clockify.git
cd mcp-clockify
npm install
npm run build
```

```json
{
  "command": "node",
  "args": ["path/to/mcp-clockify/dist/index.js"]
}
```

✅ Latest features  
✅ Customizable  
✅ Contribute back

---

## 🎨 Tool Categories Explained

### 🙋 **User Tools** (4 total)

Get information about yourself and team members

- Who am I? What's my current workspace?
- List team members and find colleagues
- Get user details and contact information

### 🏢 **Workspace Tools** (2 total)

Manage your Clockify workspaces

- Switch between workspaces
- View workspace settings and details
- See available workspaces

### 📁 **Project Tools** (6 total)

Complete project lifecycle management

- Create, update, and organize projects
- Archive completed projects
- Search and filter project lists
- Associate projects with clients

### 👥 **Client Tools** (4 total)

Manage your client relationships

- Add new clients with contact details
- Update client information
- Track which projects belong to which clients
- Archive inactive clients

### ⏱️ **Time Entry Tools** (9 total)

Full-featured time tracking

- Start/stop timers with descriptions
- Create historical time entries
- Edit and delete existing entries
- Get entries by day, week, or month
- Bulk operations for efficiency

### 📋 **Task Tools** (4 total)

Break down projects into manageable tasks

- Create tasks within projects
- Assign tasks to team members
- Track task completion
- Set time estimates

### 🏷️ **Tag Tools** (3 total)

Organize and categorize your work

- Create custom tags for activities
- Apply tags to time entries
- Bulk create multiple tags
- Filter and search by tags

### 📊 **Report Tools** (5 total)

Powerful analytics and insights

- Generate summary reports
- Track user and team productivity
- Monitor project progress
- Export data in multiple formats
- Customizable date ranges and filters

### ⚡ **Bulk Tools** (1 total)

Efficient mass operations

- Edit multiple time entries at once
- Delete multiple entries
- Update project assignments in bulk

### 🔍 **Search Tools** (2 total)

Find anything quickly

- Search projects by name
- Find users by name or role
- Filter results efficiently

---

## 🚨 Troubleshooting

### **Claude can't see Clockify tools**

1. Check your `claude_desktop_config.json` file location
2. Restart Claude Desktop completely
3. Verify your API key is correct
4. Check that the MCP server name doesn't conflict with others

### **"Invalid API key" errors**

1. Generate a new API key at [Clockify Settings](https://app.clockify.me/user/settings)
2. Make sure there are no extra spaces in your API key
3. Check that your account has the necessary permissions

### **"Too many tools" warning**

Use tool filtering to reduce the number of exposed tools:

```env
"ENABLED_TOOL_CATEGORIES": "user,workspace,timeEntry"
"MAX_TOOLS": "10"
```

### **"Access denied" to projects/workspaces**

You might have restrictions configured. Check for these settings:

```env
ALLOWED_PROJECTS=project-id-1,project-id-2
ALLOWED_WORKSPACES=workspace-id
```

### **Time entries not showing up**

1. Check if you're looking in the correct workspace
2. Verify date ranges (some tools filter by date)
3. Ensure you have access to the specific project

### **"Cannot delete/archive configured project" errors**

These are protection features working as intended. When you configure specific projects (`DEFAULT_PROJECT_ID` or `ALLOWED_PROJECTS`), the system prevents accidental damage:

- **To delete a configured project**: Remove it from your environment configuration first
- **To archive a configured project**: Update your configuration to remove the restriction
- **To delete clients/tasks**: Check if they're used by configured projects

Example fix:

```json
{
  "env": {
    "CLOCKIFY_API_KEY": "your_api_key_here"
    // Remove or change this line to allow deletion:
    // "DEFAULT_PROJECT_ID": "project-12345"
  }
}
```

---

## 💰 Money Amounts

Clockify's API stores monetary values in **minor units** (cents, kopecks, etc.). For example, 2,500 RUB is sent as `250000`.

By default, this MCP server **normalizes** money fields to **major currency units** so tools and resources return human-readable amounts (`2500` RUB instead of `250000`). Write tools (`create_time_entry`, `update_time_entry`, `create_project`, `update_project`, `add_user_to_project`) expect major units in the same way.

Set `NORMALIZE_MONEY=false` to pass through raw API values unchanged (useful if you integrate directly with Clockify's wire format).

**Affected fields:** `amount`, `rate`, `earnedRate`, `costRate`, `earnedAmount`, `costAmount`, `totalAmount`, `value`, and `{ amount, currency }` pairs such as `hourlyRate` and `costRate`.

**Not transformed:** durations (`duration`, `totalTime`), pagination, counts, IDs, and `budgetEstimate.estimate` (time budget, not currency).

---

## 📋 Environment Variables Reference

### **Required**

- **`CLOCKIFY_API_KEY`** - Your Clockify API key (required)

### **Regional Settings**

- **`CLOCKIFY_REGION`** - API region (`global`, `eu`, `us`) - default: `global`
- **`CLOCKIFY_API_URL`** - Custom API URL (overrides region setting)

### **Project Protection Settings**

- **`DEFAULT_PROJECT_ID`** - Default project ID (enables protection for this project)
- **`DEFAULT_WORKSPACE_ID`** - Default workspace ID (enables protection for this workspace)
- **`ALLOWED_PROJECTS`** - Comma-separated list of allowed project IDs (enables protection)
- **`ALLOWED_WORKSPACES`** - Comma-separated list of allowed workspace IDs

### **Tool Filtering**

- **`ENABLED_TOOL_CATEGORIES`** - Comma-separated categories: `user,workspace,project,client,timeEntry,tag,task,report,bulk,search,customField`
- **`ENABLED_TOOLS`** - Comma-separated specific tool names
- **`DISABLED_TOOLS`** - Comma-separated tools to exclude
- **`MAX_TOOLS`** - Maximum number of tools to expose (default: unlimited)

### **Operation Restrictions**

- **`READ_ONLY`** - Set to `true` to prevent all write operations
- **`ALLOW_TIME_ENTRY_CREATION`** - Allow creating time entries (default: `true`)
- **`ALLOW_TIME_ENTRY_DELETION`** - Allow deleting time entries (default: `true`)
- **`ALLOW_PROJECT_MANAGEMENT`** - Allow project operations (default: `true`)
- **`ALLOW_CLIENT_MANAGEMENT`** - Allow client operations (default: `true`)
- **`ALLOW_USER_MANAGEMENT`** - Allow user operations (default: `false`)

### **Time Entry Restrictions**

- **`ALLOW_FUTURE_TIME_ENTRIES`** - Allow future time entries (default: `false`)
- **`ALLOW_PAST_TIME_ENTRIES_IN_DAYS`** - Days back to allow time entries (default: `30`)
- **`MAX_TIME_ENTRY_DURATION`** - Maximum hours per time entry

### **Performance & Caching**

- **`CACHE_ENABLED`** - Enable response caching (default: `false`)
- **`CACHE_TTL`** - Cache time-to-live in seconds
- **`RATE_LIMIT`** - Requests per minute limit
- **`LOG_LEVEL`** - Logging level (`debug`, `info`, `warn`, `error`)

### **Money Normalization**

- **`NORMALIZE_MONEY`** - Convert money fields between API minor units and major currency units (default: `true`; set to `false` to disable)

### **Complete Example**

```json
{
  "env": {
    "CLOCKIFY_API_KEY": "your_api_key_here",
    "CLOCKIFY_REGION": "eu",
    "DEFAULT_PROJECT_ID": "project-12345",
    "DEFAULT_WORKSPACE_ID": "workspace-67890",
    "ENABLED_TOOL_CATEGORIES": "user,workspace,timeEntry,project,report",
    "MAX_TOOLS": "20",
    "ALLOW_PAST_TIME_ENTRIES_IN_DAYS": "90",
    "CACHE_ENABLED": "true",
    "NORMALIZE_MONEY": "true",
    "LOG_LEVEL": "info"
  }
}
```

---

## 🤝 Support & Community

- **Issues & Bugs**: [GitHub Issues](https://github.com/hongkongkiwi/mcp-clockify/issues)
- **Feature Requests**: Open a GitHub issue with the "enhancement" label
- **Questions**: Use GitHub Discussions
- **Clockify API**: [Official Documentation](https://docs.clockify.me/)

---

## 📄 License

MIT License - Feel free to use, modify, and distribute.

---

**Ready to supercharge your time tracking?** Add Clockify Master MCP to Claude Desktop and start managing your time more efficiently today! 🚀

---

## 🔄 Publishing Status

This package is published to both NPM and JSR registries:

- **NPM**: `@hongkongkiwi/clockify-master-mcp`
- **JSR**: `@hongkongkiwi/clockify-master-mcp`

[![NPM Version](https://img.shields.io/npm/v/@hongkongkiwi/clockify-master-mcp)](https://www.npmjs.com/package/@hongkongkiwi/clockify-master-mcp)
[![JSR](https://jsr.io/badges/@hongkongkiwi/clockify-master-mcp)](https://jsr.io/@hongkongkiwi/clockify-master-mcp)
[![CI](https://github.com/hongkongkiwi/mcp-clockify/workflows/CI/badge.svg)](https://github.com/hongkongkiwi/mcp-clockify/actions)
[![Security](https://github.com/hongkongkiwi/mcp-clockify/workflows/Security/badge.svg)](https://github.com/hongkongkiwi/mcp-clockify/actions)
