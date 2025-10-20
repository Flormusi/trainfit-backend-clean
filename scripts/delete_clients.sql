-- Eliminar registros relacionados primero para mantener la integridad referencial
DELETE FROM "Progress" WHERE "userId" IN (SELECT id FROM "User" WHERE role = 'CLIENT');
DELETE FROM "ClientNote" WHERE "clientId" IN (SELECT id FROM "User" WHERE role = 'CLIENT');
DELETE FROM "Routine" WHERE "clientId" IN (SELECT id FROM "User" WHERE role = 'CLIENT');
DELETE FROM "ClientProfile" WHERE "userId" IN (SELECT id FROM "User" WHERE role = 'CLIENT');
-- Finalmente, eliminar los usuarios con rol CLIENT
DELETE FROM "User" WHERE role = 'CLIENT';