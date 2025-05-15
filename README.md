# NestJS TypeORM RBAC with Role Inheritance

A Role-Based Access Control (RBAC) implementation using NestJS, TypeORM, and JWT authentication, featuring hierarchical role inheritance.

## Features

- User authentication with JWT
- Role-based access control (RBAC)
- **Role inheritance (hierarchical roles)**
- TypeORM integration with MariaDB
- Entity relationships (Many-to-Many, One-to-Many)
- RESTful API endpoints
- Comprehensive testing and documentation

## Hierarchical Role Structure

This application implements a hierarchical role system where higher-level roles inherit all permissions from lower-level roles:

```plaintext
admin (top level)
   ↑
manager
   ↑
editor
   ↑
user (base level)
```

For example, a user with the 'manager' role automatically has all permissions granted to 'editor' and 'user' roles.

## Project Structure

```plaintext
src/
  auth/             # Authentication module
  config/           # Configuration files
  roles/            # Role management
  users/            # User management
  test-access/      # Test endpoints for role access
  app.module.ts     # Main application module
docs/
  ROLE_INHERITANCE_GUIDE.md          # Documentation for role inheritance
  ROLE_INHERITANCE_TEST_RESULTS.md   # Test results for role inheritance
  ROLE_INHERITANCE_OPTIMIZATION.md   # Performance optimization strategies
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MariaDB/MySQL

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure your database in `.env`:

```properties
PORT=3000
NODE_ENV="development"
API_VERSION="0.0.1"

DB_DIALECT="mariadb"
DB_HOST="your-db-host"
DB_NAME="nestjs_typeorm_rbac"
DB_USER="your-db-user"
DB_PASS="your-db-password"
DB_PORT="3306"
```

4. Start the application:

```bash
npm run start:dev
```

## Role Inheritance

This application implements hierarchical role inheritance, allowing roles to inherit permissions from parent roles:

```plaintext
Admin
  └── Manager
       └── Editor
            └── User
```

With this structure, a user with the "Manager" role automatically has all permissions granted to "Editor" and "User" roles.

### Using Role Inheritance

1. Create roles with parent-child relationships:

```http
POST /roles
{
  "name": "editor",
  "description": "Content editor",
  "parentRoleId": 1  // ID of the parent role (e.g., "user")
}
```

2. Check role capabilities:

```http
GET /roles/2/check-capability?roleName=user
```

For more details, see the following documentation:
- [Role Inheritance Guide](docs/ROLE_INHERITANCE_GUIDE.md)
- [Role Inheritance Test Results](docs/ROLE_INHERITANCE_TEST_RESULTS.md)
- [Performance Optimization Strategies](docs/ROLE_INHERITANCE_OPTIMIZATION.md)

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT token

### Users

- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get a specific user
- `POST /users` - Create a new user (admin only)
- `PATCH /users/:id` - Update a user
- `DELETE /users/:id` - Delete a user (admin only)
- `POST /users/:id/roles/:roleName` - Assign a role to a user
- `DELETE /users/:id/roles/:roleName` - Remove a role from a user

### Roles

- `GET /roles` - Get all roles (admin only)
- `GET /roles/:id` - Get a specific role
- `GET /roles/:id/children` - Get child roles
- `GET /roles/:id/check-capability` - Check if a role has a specific capability
- `POST /roles` - Create a new role (admin only)
- `PATCH /roles/:id` - Update a role (admin only)
- `DELETE /roles/:id` - Delete a role (admin only)

### Test Endpoints

- `GET /test-access/public` - Public access (authenticated users)
- `GET /test-access/user` - Requires user role
- `GET /test-access/editor` - Requires editor role
- `GET /test-access/manager` - Requires manager role
- `GET /test-access/admin` - Requires admin role

## Testing

```bash
npm run test            # Run unit tests
npm run test:e2e        # Run e2e tests
npm run test:cov        # Run test coverage
```

## License

This project is licensed under the MIT License.

