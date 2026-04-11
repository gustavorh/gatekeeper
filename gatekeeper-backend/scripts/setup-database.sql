-- Script para configurar la base de datos MySQL para Gatekeeper
-- Ejecutar como usuario con permisos de administrador

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS gatekeeper
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Crear usuario específico para la aplicación (opcional)
-- CREATE USER IF NOT EXISTS 'gatekeeper_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
-- GRANT ALL PRIVILEGES ON gatekeeper.* TO 'gatekeeper_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Usar la base de datos
USE gatekeeper;

-- Verificar que la base de datos está creada
SELECT DATABASE(); 