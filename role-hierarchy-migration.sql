-- Migration: Create Role Hierarchy Structure
-- Filename: d:\MyWebApps\NestJS\nestjs_typeorm_rbac\role-hierarchy-migration.sql

-- Create role_hierarchy table if it doesn't exist
CREATE TABLE IF NOT EXISTS `role_hierarchy` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parentRoleId` int(11) NOT NULL,
  `childRoleId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_ROLE_HIERARCHY_PARENT` (`parentRoleId`),
  KEY `IDX_ROLE_HIERARCHY_CHILD` (`childRoleId`),
  CONSTRAINT `FK_role_hierarchy_parent` FOREIGN KEY (`parentRoleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_role_hierarchy_child` FOREIGN KEY (`childRoleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Check if roles table has capabilities column and add it if not
-- (MariaDB syntax for adding column if not exists)
SET @exist := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_NAME = 'roles' AND COLUMN_NAME = 'capabilities' AND TABLE_SCHEMA = DATABASE()
);

SET @query := IF(
  @exist = 0,
  'ALTER TABLE `roles` ADD COLUMN `capabilities` TEXT NULL',
  'SELECT \'Column capabilities already exists\' AS message'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrate existing parent-child relationships to the new hierarchy table
-- First check if the parentRole column exists to avoid errors
SET @parentRoleExists := (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_NAME = 'roles' AND COLUMN_NAME = 'parentRole' AND TABLE_SCHEMA = DATABASE()
);

-- Only attempt migration if the parentRole column exists
SET @migrationQuery := IF(
  @parentRoleExists > 0,
  'INSERT INTO `role_hierarchy` (`parentRoleId`, `childRoleId`)
   SELECT r1.`id`, r2.`id`
   FROM `roles` r1
   JOIN `roles` r2 ON r2.`parentRole` = r1.`id`
   WHERE r2.`parentRole` IS NOT NULL',
  'SELECT ''Skipping relationship migration - parentRole column does not exist'' AS message'
);

PREPARE migrationStmt FROM @migrationQuery;
EXECUTE migrationStmt;
DEALLOCATE PREPARE migrationStmt;

-- Check if roles table has parentRole column and drop it if exists
SET @exist := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_NAME = 'roles' AND COLUMN_NAME = 'parentRole' AND TABLE_SCHEMA = DATABASE()
);

SET @query := IF(
  @exist > 0,
  'ALTER TABLE `roles` DROP COLUMN `parentRole`',
  'SELECT \'Column parentRole does not exist\' AS message'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Output completion message
SELECT 'Role hierarchy migration completed successfully!' AS message;
