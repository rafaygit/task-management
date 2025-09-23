# Task Management System

A comprehensive task management application built with **Nx Monorepo**, featuring **NestJS** backend API and **Angular** frontend dashboard with role-based access control (RBAC) and organizational hierarchy.

## 🏗️ Architecture Overview

### Nx Monorepo Structure
```
task-app/
├── apps/
│   ├── api/                 # NestJS Backend API
│   ├── dashboard/           # Angular Frontend Dashboard
│   └── api-e2e/            # End-to-end tests
├── libs/
│   ├── auth/               # Shared authentication utilities
│   └── data/               # Shared data models and types
└── dist/                   # Build outputs
```

### Rationale for Nx Monorepo
- **Code Sharing**: Shared libraries for authentication, data models, and utilities
- **Consistent Tooling**: Unified build, test, and linting across all applications
- **Dependency Management**: Single package.json for all dependencies
- **Type Safety**: Shared TypeScript types between frontend and backend
- **Development Efficiency**: Single repository for full-stack development

### Shared Libraries
- **`@task-app/auth`**: Authentication decorators (`@Roles`), guards (`RolesGuard`), and utilities
- **`@task-app/data`**: Shared enums (`RoleType`) and data models

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v12+)
- npm or yarn

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd task-app
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=task_management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1h

# Application Configuration
NODE_ENV=development
PORT=3000
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb task_management

# The application will automatically create tables and seed data on first run
```

### 4. Run Applications

#### Backend API (Port 3000)
```bash
# Development mode
npx nx serve api

# Production build
npx nx build api
```

#### Frontend Dashboard (Port 4200)
```bash
# Development mode
npx nx serve dashboard

# Production build
npx nx build dashboard
```

#### Run Both Applications
```bash
# Start both backend and frontend
npx nx run-many --target=serve --projects=api,dashboard
```

### 5. Access the Application
- **Frontend Dashboard**: http://localhost:4200
- **Backend API**: http://localhost:3000/api
- **API Documentation**: http://localhost:3000/api

## 📊 Data Model

### Entity Relationship Diagram
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │    Role     │    │Organization │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ username    │    │ name        │    │ name        │
│ password    │    │ (enum)      │    │ parent_id   │
│ role_id (FK)│◄───┤ id          │    │ (self-ref)  │
│ org_id (FK) │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                    │
       │                  │                    │
       │                  ▼                    │
       │            ┌─────────────┐            │
       │            │ Permission  │            │
       │            ├─────────────┤            │
       │            │ id (PK)     │            │
       │            │ action      │            │
       │            │ role_id (FK)│◄───────────┘
       │            │ org_id (FK) │
       │            └─────────────┘
       │
       ▼
┌─────────────┐
│    Task     │
├─────────────┤
│ id (PK)     │
│ title       │
│ description │
│ completed   │
│ assigned_id │
│ org_id (FK) │
└─────────────┘

┌─────────────┐
│  AuditLog   │
├─────────────┤
│ id (PK)     │
│ action      │
│ entityType  │
│ entityId    │
│ performedBy │
│ timestamp   │
└─────────────┘
```

### Core Entities

#### User
- **Primary Key**: `id`
- **Authentication**: `username`, `password` (bcrypt hashed)
- **Relationships**: 
  - Many-to-One with `Role`
  - Many-to-One with `Organization`
  - One-to-Many with `Task` (assigned tasks)

#### Role
- **Types**: `Owner`, `Admin`, `Viewer` (enum)
- **Hierarchy**: Owner > Admin > Viewer (with inheritance)
- **Relationships**: 
  - One-to-Many with `User`
  - One-to-Many with `Permission`

#### Organization
- **Hierarchical Structure**: Self-referencing parent-child relationships
- **Access Control**: Users can access their org + child orgs (if Owner/Admin)
- **Relationships**: 
  - Self-referencing (parent/children)
  - One-to-Many with `User`
  - One-to-Many with `Task`
  - One-to-Many with `Permission`

#### Task
- **Assignment**: Can be assigned to users or left unassigned (nullable)
- **Organization Scoping**: Tasks belong to specific organizations
- **Status**: `completed` boolean field (defaults to false)
- **Relationships**: 
  - Many-to-One with `User` (assignedTo)
  - Many-to-One with `Organization`

#### Permission
- **Action**: String field (e.g., 'CREATE_TASK', 'UPDATE_TASK')
- **Scope**: Can be global (role-based) or organization-specific
- **Relationships**: 
  - Many-to-One with `Role`
  - Many-to-One with `Organization` (nullable)

#### AuditLog
- **Tracking**: Records all system actions
- **Fields**: action, entityType, entityId, performedBy, timestamp
- **Purpose**: Audit trail for compliance and debugging

### Sample Data
The application seeds with the following test data:

**Organizations:**
- Main Organization (parent)
  - Sub Org 1 (child)
  - Sub Org 2 (child)

**Users:**
- `owner1`, `owner2` (Owner role, Main Organization)
- `admin1` (Admin role, Sub Org 1)
- `admin2` (Admin role, Sub Org 2)
- `viewer1` (Viewer role, Sub Org 2)
- `viewer2` (Viewer role, Sub Org 1)

**Default Password:** `pass123` for all test users

## 🔐 Access Control Implementation

### Role-Based Access Control (RBAC)

#### Role Hierarchy with Inheritance
```
Owner (Highest)
├── Full access to their organization
├── Access to all child organizations
├── Can manage users, tasks, and settings
└── Inherits: Owner, Admin, Viewer capabilities

Admin (Middle)
├── Full access to their organization
├── Access to all child organizations
├── Can manage tasks and users (limited)
└── Inherits: Admin, Viewer capabilities

Viewer (Lowest)
├── Read-only access to assigned tasks only
├── Cannot create, edit, or delete tasks
└── Inherits: Viewer capabilities only
```

#### Permission Matrix
| Action                | Owner                | Admin (Limited Scope) | Viewer               |
|-----------------------|----------------------|----------------------|----------------------|
| View Tasks            | ✅ (All accessible)  | ✅ (Their department) | ✅ (Assigned only)   |
| Create Tasks          | ✅                   | ✅                   | ❌                   |
| Edit Tasks            | ✅                   | ✅                   | ❌                   |
| Delete Tasks          | ✅                   | ✅                   | ❌                   |

### JWT Authentication Integration

#### Token Structure
```json
{
  "username": "admin1",
  "sub": 3,
  "role": "Admin",
  "userId": 3,
  "orgId": 2,
  "iat": 1634567890,
  "exp": 1634571490
}
```

#### Authentication Flow
1. **Login**: User provides credentials
2. **Validation**: Backend validates against database
3. **Token Generation**: JWT created with user context
4. **Token Storage**: Frontend stores in localStorage
5. **Request Authorization**: Token sent in `Authorization: Bearer <token>` header
6. **Guard Validation**: JWT verified and user context extracted

#### Guards Implementation
- **`JwtAuthGuard`**: Validates JWT token using Passport JWT strategy
- **`RolesGuard`**: Checks user role permissions with inheritance support
- **`TaskGuard`**: Validates task access permissions based on organization hierarchy

## 📡 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
**Description**: Authenticate user and return JWT token

**Request Body**:
```json
{
  "username": "admin1",
  "password": "pass123"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response** (401):
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Task Management Endpoints

#### GET /api/task
**Description**: Get all accessible tasks for the authenticated user

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": 1,
    "title": "Main Org Task 1",
    "description": "Task for Main Org Owner",
    "completed": false,
    "assignedTo": {
      "id": 1,
      "username": "owner1",
      "role": "Owner"
    },
    "organization": {
      "id": 1,
      "name": "Main Organization"
    }
  }
]
```

#### POST /api/task
**Description**: Create a new task (Owner/Admin only)

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "New Task",
  "description": "Task description",
  "completed": false,
  "assignedToId": 3,
  "organizationId": 1
}
```

**Response**: Created task object

#### PUT /api/task/:id
**Description**: Update an existing task (Owner/Admin only)

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "Updated Task Title",
  "description": "Updated description",
  "completed": true
}
```

#### DELETE /api/task/:id
**Description**: Delete a task (Owner/Admin only)

**Headers**: `Authorization: Bearer <token>`

**Response**: Deleted task object

### User Management Endpoints

#### GET /api/user
**Description**: Get all users (for task assignment dropdown)

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": 1,
    "username": "owner1",
    "role": {
      "name": "Owner"
    },
    "organization": {
      "id": 1,
      "name": "Main Organization"
    }
  }
]
```

### Additional Endpoints
- **GET /api/role**: List all roles
- **GET /api/organization**: List all organizations
- **GET /api/permission**: List all permissions
- **GET /api/audit-log**: List audit logs (Owner/Admin only)


## 🔮 Future Considerations

### Advanced Role Delegation
- **Temporary Permissions**: Time-limited role assignments
- **Delegation Chains**: Multi-level permission delegation
- **Custom Roles**: Dynamic role creation with specific permissions

### Production-Ready Security
- **JWT Refresh Tokens**: Secure token rotation mechanism
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API request throttling
- **Input Validation**: Enhanced data sanitization
- **Audit Logging**: Comprehensive activity tracking

### RBAC Caching
- **Permission Caching**: Redis-based permission cache
- **Role Hierarchy Cache**: Pre-computed access matrices
- **Session Management**: Centralized session storage
- **Performance Optimization**: Reduced database queries

### Scaling Permission Checks Efficiently
- **Microservices**: Split into domain-specific services
- **Database Sharding**: Horizontal data partitioning
- **Caching Layer**: Redis/Memcached integration
- **Load Balancing**: Multiple API instances
- **CDN Integration**: Static asset optimization