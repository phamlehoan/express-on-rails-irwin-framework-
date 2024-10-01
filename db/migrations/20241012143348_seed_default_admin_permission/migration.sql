-- This is a migration to seed default ADMIN permission.
-- Feature
INSERT INTO features (id, code, name, description)
SELECT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))), 'AM', 'Admin', 'The Admin feature allows you to create and control users, permissions and other things.';

-- Permission
INSERT INTO permissions (id, code, name, description, feature_id)
SELECT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))), 'READ', 'Read', 'Read data', features.id
FROM features WHERE code = 'AM';

INSERT INTO permissions (id, code, name, description, feature_id)
SELECT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))), 'CREATE', 'Create', 'Create data', features.id
FROM features WHERE code = 'AM';

INSERT INTO permissions (id, code, name, description, feature_id)
SELECT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))), 'UPDATE', 'Update', 'Update data', features.id
FROM features WHERE code = 'AM';

INSERT INTO permissions (id, code, name, description, feature_id)
SELECT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))), 'DELETE', 'Delete', 'Delete data', features.id
FROM features WHERE code = 'AM';

-- Role
INSERT INTO roles (id, code, name, description, is_read_only)
SELECT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))), 'ADMIN', 'Administrator', 'A group of people who are allowed to manage all users, access rights and other things.', true;

-- Assign Role to Permission
INSERT INTO role_to_permission (role_id, permission_id) 
SELECT roles.id, permissions.id 
FROM roles
CROSS JOIN permissions
LEFT JOIN features ON features.id = permissions.feature_id
WHERE roles.code = 'ADMIN' AND features.code = 'AM';
