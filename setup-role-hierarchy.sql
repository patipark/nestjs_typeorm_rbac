-- setup-role-hierarchy.sql
-- Script to set up roles and role hierarchy from scratch

-- Create roles if they don't exist
INSERT IGNORE INTO `roles` (`name`, `description`, `capabilities`) 
VALUES 
('user', 'Basic user with limited access', '[]'),
('editor', 'Can edit content', '[]'),
('manager', 'Can manage content and users', '[]'),
('admin', 'Full access to the system', '[]');

-- Get the role IDs (this handles cases where the roles already exist with different IDs)
SET @userRoleId := (SELECT `id` FROM `roles` WHERE `name` = 'user' LIMIT 1);
SET @editorRoleId := (SELECT `id` FROM `roles` WHERE `name` = 'editor' LIMIT 1);
SET @managerRoleId := (SELECT `id` FROM `roles` WHERE `name` = 'manager' LIMIT 1);
SET @adminRoleId := (SELECT `id` FROM `roles` WHERE `name` = 'admin' LIMIT 1);

-- Clear existing hierarchy relationships to avoid duplicates
DELETE FROM `role_hierarchy` 
WHERE (`parentRoleId` = @userRoleId AND `childRoleId` = @editorRoleId)
   OR (`parentRoleId` = @editorRoleId AND `childRoleId` = @managerRoleId)
   OR (`parentRoleId` = @managerRoleId AND `childRoleId` = @adminRoleId);

-- Setup hierarchy: user -> editor -> manager -> admin
INSERT INTO `role_hierarchy` (`parentRoleId`, `childRoleId`)
VALUES 
(@userRoleId, @editorRoleId),
(@editorRoleId, @managerRoleId),
(@managerRoleId, @adminRoleId);

-- Output confirmation
SELECT 'Role hierarchy setup completed!' AS message;
SELECT r.name AS role_name, pr.name AS parent_role
FROM `roles` r
LEFT JOIN `role_hierarchy` rh ON r.id = rh.childRoleId
LEFT JOIN `roles` pr ON rh.parentRoleId = pr.id
ORDER BY r.name;
