# Using Role Inheritance in NestJS RBAC

This guide demonstrates how to use the role inheritance feature in the application. The role inheritance is now implemented using a separate `role_hierarchy` table for better flexibility and performance.

## Setting Up

First, install the dependencies:

```bash
npm install
```

Then, set up the database by updating the `.env` file with your database credentials.

## Seeding the Database

To populate the database with a role hierarchy and demo users, run:

```bash
npm run seed
```

This will create:

1. Roles with inheritance:
   - `user` (base role)
   - `editor` (inherits from user)
   - `manager` (inherits from editor)
   - `admin` (inherits from manager)

See the complete [Role Hierarchy Table](ROLE_HIERARCHY_TABLE.md) for details on role relationships.

## Understanding the New Role Hierarchy Structure

Our updated implementation uses a junction table (`role_hierarchy`) to manage role relationships instead of direct parent-child references in the Role entity. This provides several benefits:

1. **More flexible relationships**: A role can potentially have multiple parents
2. **Better separation of concerns**: Role data is separate from relationship data
3. **Easier maintenance**: Adding or removing relationships doesn't require modifying role entities
4. **Better query performance**: Relationships can be queried directly

### Database Schema

The database now has these key tables:

- `roles`: Contains basic role information (name, description, capabilities)
- `role_hierarchy`: Junction table linking parent and child roles
- `users`: User information
- `user_roles`: Junction table linking users to their assigned roles

### Creating Role Hierarchies

You can create role hierarchies through:

1. The API:
```http
POST /roles/hierarchy
{
  "parentRoleId": 1,
  "childRoleId": 2
}
```

2. Via the service:
```typescript
await rolesService.createHierarchyRelationship(parentRoleId, childRoleId);
```

3. During role creation:
```typescript
await rolesService.create({
  name: "editor",
  description: "Content editor",
  parentRoleId: 1 // Will automatically create the hierarchy relationship
});
```

2. Demo users:
   - `admin@example.com` (password: admin123)
   - `manager@example.com` (password: manager123)
   - `editor@example.com` (password: editor123)
   - `user@example.com` (password: user123)

## Testing Role Inheritance

### 1. Start the Application

```bash
npm run start:dev
```

### 2. Login with Different Users

Use the following cURL commands or a tool like Postman:

```bash
# Login as admin
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"username": "admin", "password": "admin123"}'

# Login as manager
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"username": "manager", "password": "manager123"}'

# Login as editor
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"username": "editor", "password": "editor123"}'

# Login as regular user
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"username": "user", "password": "user123"}'
```

Each login response will include a JWT token that can be used for authenticated requests.

### 3. Access Protected Routes

Use the JWT token from the login response to access protected routes:

```bash
# Replace YOUR_JWT_TOKEN with the token from the login response
curl -X GET http://localhost:3000/users -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Testing Role Inheritance

1. The `/users` endpoint is protected with the `admin` role. Try accessing it with different user tokens.
   - Admin token should work
   - Manager token should work (inherits from admin)
   - Editor token should NOT work
   - User token should NOT work

2. Try the `/roles` endpoint (also requires `admin` role)

3. Check role capabilities:

```bash
curl -X GET http://localhost:3000/roles/3/check-capability?roleName=user -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

This checks if role with ID 3 has the capabilities of the "user" role.

## Using Role Inheritance Programmatically

In your controllers or services, you can check for role capabilities:

```typescript
// Inject the RolesService
constructor(private rolesService: RolesService) {}

// Check if a role has a capability
async someMethod(roleId: number) {
  const hasUserCapability = await this.rolesService.hasCapability(roleId, 'user');
  
  if (hasUserCapability) {
    // User has the capability
  } else {
    // User doesn't have the capability
  }
}
```

## Managing Role Hierarchy

### Create a Role with a Parent

```http
POST /roles
{
  "name": "custom-role",
  "description": "Custom role description",
  "parentRoleId": 1
}
```

### Update a Role's Parent

```http
PATCH /roles/5
{
  "parentRoleId": 2
}
```

### Remove a Parent Relationship

```http
PATCH /roles/5
{
  "parentRoleId": null
}
```

### View Role Children

```http
GET /roles/1/children
```
