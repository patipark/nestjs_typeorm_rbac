# Performance Optimization for Role Hierarchy

This document outlines strategies for optimizing performance when working with role hierarchies, particularly for applications with complex role structures or a large number of users.

## Current Implementation

Our current implementation uses a recursive approach to traverse the role hierarchy, which works well for small to medium-sized hierarchies but might face performance issues with:

1. Deep hierarchies (many levels of inheritance)
2. Large numbers of roles
3. Frequent permission checks

## Optimization Strategies

### 1. Caching Role Hierarchies

**Implementation:**
```typescript
// In RolesService
private roleHierarchyCache: Map<number, Role[]> = new Map();

async getCachedRoleHierarchy(roleId: number): Promise<Role[]> {
  if (this.roleHierarchyCache.has(roleId)) {
    return this.roleHierarchyCache.get(roleId);
  }
  
  const hierarchy = await this.buildRoleHierarchy(roleId);
  this.roleHierarchyCache.set(roleId, hierarchy);
  return hierarchy;
}

async buildRoleHierarchy(roleId: number): Promise<Role[]> {
  const hierarchy: Role[] = [];
  let currentRole = await this.findOne(roleId);
  
  while (currentRole) {
    hierarchy.push(currentRole);
    currentRole = currentRole.parentRole;
  }
  
  return hierarchy;
}

// Reset cache when roles are updated
async clearRoleCache() {
  this.roleHierarchyCache.clear();
}
```

**Benefits:**
- Reduces database queries
- Significantly improves performance for repeated checks

**Considerations:**
- Requires cache invalidation on role updates
- Memory usage increases with cache size

### 2. Pre-computing Inherited Capabilities

**Implementation:**
```typescript
// In Role entity
@Column('simple-array')
inheritedCapabilities: string[];

// In RolesService
async updateInheritedCapabilities(roleId: number) {
  const role = await this.findOne(roleId);
  if (!role) return;
  
  // Start with own capabilities
  const allCapabilities = [...role.capabilities];
  
  // Add parent capabilities
  let parentRole = role.parentRole;
  while (parentRole) {
    allCapabilities.push(...parentRole.capabilities);
    parentRole = parentRole.parentRole;
  }
  
  // Remove duplicates
  role.inheritedCapabilities = [...new Set(allCapabilities)];
  await this.rolesRepository.save(role);
  
  // Update child roles
  for (const childRole of role.childRoles) {
    await this.updateInheritedCapabilities(childRole.id);
  }
}
```

**Benefits:**
- Permission checks become O(1) operations
- Eliminates hierarchy traversal during authorization checks

**Considerations:**
- Requires updating inherited capabilities when roles change
- Increases database storage requirements

### 3. Materialized Path for Hierarchies

**Implementation:**
```typescript
// In Role entity
@Column()
path: string; // Format: "1.2.5" where numbers are role IDs

// In RolesService
async updateRolePath(role: Role) {
  if (!role.parentRole) {
    role.path = role.id.toString();
  } else {
    role.path = `${role.parentRole.path}.${role.id}`;
  }
  
  await this.rolesRepository.save(role);
  
  // Update child roles
  for (const childRole of role.childRoles) {
    await this.updateRolePath(childRole);
  }
}

async isInHierarchy(childRoleId: number, parentRoleId: number): Promise<boolean> {
  const parentRole = await this.findOne(parentRoleId);
  const childRole = await this.findOne(childRoleId);
  
  if (!parentRole || !childRole) return false;
  
  // Check if childRole's path contains parentRole's ID
  return childRole.path.includes(`${parentRole.id}.`) || 
         childRole.path.startsWith(`${parentRole.id}.`) ||
         childRole.path === parentRole.id.toString();
}
```

**Benefits:**
- Efficient hierarchy traversal without recursion
- Enables advanced queries against the hierarchy
- Can handle very deep hierarchies efficiently

**Considerations:**
- Requires updating paths when role hierarchy changes
- Additional complexity in implementation

### 4. Database Query Optimization

For PostgreSQL or other advanced databases, you can use Common Table Expressions (CTEs) or recursive queries:

```sql
-- Get all roles in the hierarchy
WITH RECURSIVE role_hierarchy AS (
  SELECT id, name, parent_role_id
  FROM roles
  WHERE id = :startRoleId
  
  UNION ALL
  
  SELECT r.id, r.name, r.parent_role_id
  FROM roles r
  JOIN role_hierarchy rh ON r.parent_role_id = rh.id
)
SELECT * FROM role_hierarchy;
```

**Benefits:**
- Offloads traversal to the database engine
- Can be more efficient for deep hierarchies
- Reduces round trips between application and database

**Implementation:**
```typescript
// In RolesService
async getRoleHierarchy(roleId: number): Promise<Role[]> {
  return this.rolesRepository.query(`
    WITH RECURSIVE role_hierarchy AS (
      SELECT id, name, parent_role_id, capabilities
      FROM roles
      WHERE id = $1
      
      UNION ALL
      
      SELECT r.id, r.name, r.parent_role_id, r.capabilities
      FROM roles r
      JOIN role_hierarchy rh ON r.id = rh.parent_role_id
    )
    SELECT * FROM role_hierarchy;
  `, [roleId]);
}
```

## Recommendation

For our application, the recommended approach is to implement a combination of:

1. **Caching** for most frequent permission checks
2. **Materialized paths** for efficient hierarchy traversal
3. **Database queries** for complex operations

This balanced approach will provide significant performance improvements while maintaining flexibility in the role inheritance system.

## Implementation Plan

1. Add caching to the existing RolesService
2. Implement materialized paths in the Role entity
3. Update role management methods to maintain paths
4. Add utility methods for efficient hierarchy operations
5. Create database indexes to optimize queries
6. Add monitoring to identify performance bottlenecks

These optimizations should be implemented incrementally, with performance testing after each change to measure the impact.
