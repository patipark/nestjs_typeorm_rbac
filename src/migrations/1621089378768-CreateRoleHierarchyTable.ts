import { MigrationInterface, QueryRunner, TableColumn, Table, TableForeignKey } from 'typeorm';

export class CreateRoleHierarchyTable1621089378768 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First check if the role_hierarchy table already exists
    const roleHierarchyTableExists = await queryRunner.hasTable('role_hierarchy');
    if (!roleHierarchyTableExists) {
      // Create role_hierarchy table - using TypeORM Table creation for database compatibility
      await queryRunner.createTable(
        new Table({
          name: 'role_hierarchy',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment'
            },
            {
              name: 'parentRoleId',
              type: 'int',
              isNullable: false
            },
            {
              name: 'childRoleId',
              type: 'int',
              isNullable: false
            },
            {
              name: 'createdAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP'
            }
          ],
          indices: [
            {
              name: 'IDX_ROLE_HIERARCHY_PARENT',
              columnNames: ['parentRoleId']
            },
            {
              name: 'IDX_ROLE_HIERARCHY_CHILD',
              columnNames: ['childRoleId']
            }
          ]
        }),
        true
      );

      // Add foreign keys
      await queryRunner.createForeignKey(
        'role_hierarchy',
        new TableForeignKey({
          columnNames: ['parentRoleId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'roles',
          onDelete: 'CASCADE'
        })
      );

      await queryRunner.createForeignKey(
        'role_hierarchy',
        new TableForeignKey({
          columnNames: ['childRoleId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'roles',
          onDelete: 'CASCADE'
        })
      );
    }

    // Check if roles table has capabilities column
    const hasCapabilitiesColumn = await queryRunner.hasColumn('roles', 'capabilities');
    if (!hasCapabilitiesColumn) {
      // Add capabilities column to roles table
      await queryRunner.addColumn(
        'roles',
        new TableColumn({
          name: 'capabilities',
          type: 'text',
          isNullable: true
        })
      );
    }

    // Check if roles table has parentRole column
    const hasParentRoleColumn = await queryRunner.hasColumn('roles', 'parentRole');
    if (hasParentRoleColumn) {
      // Migrate existing parent-child relationships to the new table
      const roles = await queryRunner.query('SELECT id, parentRole FROM roles WHERE parentRole IS NOT NULL');
      
      // Insert relationships into the new hierarchy table
      for (const role of roles) {
        if (role.parentRole) {
          await queryRunner.query(
            `INSERT INTO role_hierarchy (parentRoleId, childRoleId) VALUES (?, ?)`,
            [role.parentRole, role.id]
          );
        }
      }

      // Drop the parentRole column - use different approach based on database
      // First get database type
      const dbType = queryRunner.connection.options.type;
      
      if (dbType === 'sqlite' || dbType === 'better-sqlite3') {
        // For SQLite, we need to recreate the table
        await queryRunner.query(`
          CREATE TABLE "roles_temp" (
            "id" integer PRIMARY KEY AUTOINCREMENT,
            "name" varchar NOT NULL UNIQUE,
            "description" varchar,
            "capabilities" text
          )
        `);
        
        await queryRunner.query(`
          INSERT INTO "roles_temp" ("id", "name", "description", "capabilities")
          SELECT "id", "name", "description", "capabilities" FROM "roles"
        `);
        
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`ALTER TABLE "roles_temp" RENAME TO "roles"`);
      } else {
        // For other databases (MySQL, MariaDB, PostgreSQL), we can drop the column directly
        await queryRunner.dropColumn('roles', 'parentRole');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check database type
    const dbType = queryRunner.connection.options.type;
    
    // Add back the parentRole column
    if (!await queryRunner.hasColumn('roles', 'parentRole')) {
      await queryRunner.addColumn(
        'roles',
        new TableColumn({
          name: 'parentRole',
          type: 'int',
          isNullable: true
        })
      );
      
      // Restore parentRole values from role_hierarchy table
      const relationships = await queryRunner.query(
        `SELECT parentRoleId, childRoleId FROM role_hierarchy`
      );
      
      for (const rel of relationships) {
        await queryRunner.query(
          `UPDATE roles SET parentRole = ? WHERE id = ?`,
          [rel.parentRoleId, rel.childRoleId]
        );
      }
    }
    
    // Drop role_hierarchy table
    if (await queryRunner.hasTable('role_hierarchy')) {
      await queryRunner.dropTable('role_hierarchy');
    }
  }
}
