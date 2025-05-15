# Role Inheritance in NestJS TypeORM RBAC

## Overview

This project now supports role inheritance, allowing roles to inherit permissions from parent roles. This feature enables creating hierarchical role structures, such as:

```
Admin
  └── Manager
       └── Editor
            └── User
```

With this structure, a user with the "Manager" role automatically has all permissions granted to "Editor" and "User" roles.

## Database Structure

The `Role` entity has been updated with self-referential relationships:

- `parentRole`: A reference to the parent role (ManyToOne)
- `childRoles`: A collection of child roles (OneToMany)

## Usage Examples

### Creating Roles with Inheritance

```typescript
// Create a base User role
const userRole = await rolesService.create({ 
  name: 'user', 
  description: 'Basic user with limited access' 
});

// Create Editor role inheriting from User
const editorRole = await rolesService.create({ 
  name: 'editor', 
  description: 'Can edit content', 
  parentRoleId: userRole.id 
});

// Create Manager role inheriting from Editor
const managerRole = await rolesService.create({ 
  name: 'manager', 
  description: 'Can manage content and users', 
  parentRoleId: editorRole.id 
});

// Create Admin role inheriting from Manager
const adminRole = await rolesService.create({ 
  name: 'admin', 
  description: 'Full access to the system', 
  parentRoleId: managerRole.id 
});
```

### Checking Role Capabilities

```typescript
// Check if a role has a specific capability through inheritance
const hasCapability = await rolesService.hasCapability(managerRole.id, 'editor');
// Returns true since 'manager' inherits from 'editor'
```

### API Endpoints

#### Create a Role with a Parent

```http
POST /roles
{
  "name": "editor",
  "description": "Can edit content",
  "parentRoleId": 1  // ID of the parent role
}
```

#### Update a Role's Parent

```http
PATCH /roles/2
{
  "parentRoleId": 3  // Change the parent role
}
```

#### Remove a Role's Parent

```http
PATCH /roles/2
{
  "parentRoleId": null  // Remove the parent relationship
}
```

#### Get a Role's Children

```http
GET /roles/1/children
```

#### Check if a Role has a Capability

```http
GET /roles/2/check-capability?roleName=user
```

## Authentication and Authorization

The role checking in guards has been enhanced to:

1. Check direct role assignment first (for performance)
2. If no direct match, recursively check parent roles
3. Return true if any role in the hierarchy matches the required role

This allows you to protect routes with a higher-level role and automatically grant access to users with roles higher in the hierarchy:

```typescript
@Get()
@Roles('editor')  // Users with 'editor', 'manager', or 'admin' roles can access
findAll() {
  // ...
}
```

## Circular Dependency Prevention

The system includes validation to prevent circular role dependencies, such as:

- Role A → Role B → Role C → Role A

Attempting to create such a circular dependency will result in a `BadRequestException`.
