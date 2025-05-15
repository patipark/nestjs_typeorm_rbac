# Role Hierarchy Table

The hierarchy of roles in our system is now managed through a separate `role_hierarchy` table:

| parent_role_id | child_role_id | created_at         |
|---------------:|-------------:|:-------------------|
|              1 |            2 | 2025-05-15 20:18:56 |
|              2 |            3 | 2025-05-15 20:18:56 |
|              3 |            4 | 2025-05-15 20:18:56 |

This table shows how roles are connected in a hierarchical structure:

1. User role (ID: 1) is the parent of Editor role (ID: 2)
2. Editor role (ID: 2) is the parent of Manager role (ID: 3) 
3. Manager role (ID: 3) is the parent of Admin role (ID: 4)

This creates our complete inheritance chain: User → Editor → Manager → Admin, where each role inherits all permissions from the roles below it in the hierarchy.

## Visual Representation

```
Admin (ID: 4)
   ↑
Manager (ID: 3)
   ↑
Editor (ID: 2)
   ↑
User (ID: 1)
```

## Role Architecture Changes

We've removed the direct parent-child relationship from the `Role` entity and instead use a separate `role_hierarchy` junction table. This provides several benefits:

1. **Cleaner data model**: The Role entity now only contains its own data, not references to other roles
2. **More flexible hierarchy**: Roles can have multiple parents if needed in the future
3. **Better performance**: Hierarchy traversal can be optimized with database queries
4. **Easier maintenance**: Adding or removing hierarchy relationships doesn't require modifying role entities

## API for Managing Role Hierarchies

- `POST /roles/hierarchy` - Create a new parent-child relationship
- `GET /roles/:id/children` - Get all child roles of a given role
- `GET /roles/:id/parent` - Get the parent role of a given role
- `GET /roles/:id/ancestors` - Get all ancestors in the hierarchy
- `GET /roles/hierarchy/visualization` - Get a text representation of the role hierarchy

With this structure, users with higher-level roles automatically inherit all permissions granted to lower-level roles.
