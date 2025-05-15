# Fixing Role Hierarchy Migration Issue

If you're encountering the error `1054 - Unknown column 'r2.parentRole' in 'WHERE'`, follow these steps to properly set up the role hierarchy:

## Step 1: Create the role_hierarchy table and update roles table

Run the modified migration script that handles the case where the `parentRole` column might not exist:

```bash
mysql -h localhost -P 3306 -u root -p nestjs_typeorm_rbac < role-hierarchy-migration.sql
```

This script will:
1. Create the `role_hierarchy` table if it doesn't exist
2. Add the `capabilities` column to the `roles` table if it doesn't exist
3. Safely attempt to migrate existing parent-child relationships (if possible)
4. Drop the `parentRole` column if it exists

## Step 2: Set up the roles and hierarchy relationships

Since the original hierarchy relationships might have been lost when the `parentRole` column was dropped, you can re-establish them using the setup script:

```bash
.\setup-roles.ps1
```

Alternatively, you can run the SQL script directly:

```bash
mysql -h localhost -P 3306 -u root -p nestjs_typeorm_rbac < setup-role-hierarchy.sql
```

This script will:
1. Create the basic roles if they don't exist (user, editor, manager, admin)
2. Set up the hierarchy relationships between them: user → editor → manager → admin
3. Display a confirmation of the role hierarchy structure

## Step 3: Test the role hierarchy

Once the roles and hierarchy relationships are set up, you can test the implementation:

```bash
.\test-role-hierarchy.ps1
```

This script will:
1. Log in as an admin user
2. Query the role hierarchy structure
3. Test capabilities and permissions based on role inheritance
4. Display a summary of the results

## Database Authentication Issues

If you're experiencing authentication issues with your MariaDB/MySQL server, try these solutions:

1. Add the `authPlugin` parameter to your database configuration:
   ```typescript
   {
     type: 'mariadb',
     // other config...
     extra: {
       authPlugin: 'mysql_native_password'
     }
   }
   ```

2. Update the user authentication in your MariaDB/MySQL server:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
   FLUSH PRIVILEGES;
   ```

3. Check if your MariaDB/MySQL server is running and accessible:
   ```bash
   mysql -h localhost -P 3306 -u root -p
   ```

## Verifying the Migration

After running the setup scripts, you can verify the role hierarchy with:

```sql
SELECT r.name AS role_name, pr.name AS parent_role
FROM roles r
LEFT JOIN role_hierarchy rh ON r.id = rh.childRoleId
LEFT JOIN roles pr ON rh.parentRoleId = pr.id
ORDER BY r.name;
```

This should show the hierarchy relationships between the roles.
