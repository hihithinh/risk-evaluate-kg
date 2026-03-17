/**
 * Storage Configuration
 * Định nghĩa các đường dẫn lưu trữ file
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..', '..');

export const STORAGE_CONFIG = {
  // Root storage directory
  ROOT: path.join(PROJECT_ROOT, 'storage'),
  
  // App storage
  APP: path.join(PROJECT_ROOT, 'storage', 'app'),
  
  // Rules storage (custom rules từ Knowledge Management)
  RULES: path.join(PROJECT_ROOT, 'storage', 'app', 'rules'),
  
  // User uploads
  UPLOADS: path.join(PROJECT_ROOT, 'storage', 'app', 'uploads'),
  
  // Temp files
  TEMP: path.join(PROJECT_ROOT, 'storage', 'temp'),
  
  // Logs
  LOGS: path.join(PROJECT_ROOT, 'storage', 'logs'),
  
  // Default rules (read-only)
  DEFAULT_RULES: path.join(PROJECT_ROOT, 'rules'),
};

/**
 * Get user-specific directory
 */
export function getUserDirectory(uid) {
  return path.join(STORAGE_CONFIG.UPLOADS, uid);
}

/**
 * Get user upload path
 */
export function getUserUploadPath(uid, filename) {
  return path.join(getUserDirectory(uid), filename);
}

/**
 * Get user result path
 */
export function getUserResultPath(uid, filename) {
  return path.join(getUserDirectory(uid), `result_${filename}`);
}

/**
 * Get user database path
 */
export function getUserDatabasePath(uid) {
  return path.join(getUserDirectory(uid), 'database.db');
}

/**
 * Get user database path (alias for consistency)
 */
export function getUserDbPath(uid) {
  return getUserDatabasePath(uid);
}

/**
 * Ensure directories exist
 */
export function ensureStorageDirectories() {
  const dirs = [
    STORAGE_CONFIG.ROOT,
    STORAGE_CONFIG.APP,
    STORAGE_CONFIG.UPLOADS,
    STORAGE_CONFIG.RULES,
    STORAGE_CONFIG.TEMP,
    STORAGE_CONFIG.LOGS,
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Ensure user-specific directory exists
 */
export function ensureUserDirectory(uid) {
  const userDir = getUserDirectory(uid);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}
