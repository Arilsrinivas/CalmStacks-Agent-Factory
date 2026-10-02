import { DatabaseSync } from 'node:sqlite';
import { DDL_SCHEMA } from './schema.js';
import { seedDatabase } from './seed.js';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(dbPath: string = ':memory:'): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbPath);
    // Execute DDL
    dbInstance.exec(DDL_SCHEMA);
    // Seed initial data
    seedDatabase(dbInstance);
  }
  return dbInstance;
}

export function resetDatabase(dbPath: string = ':memory:'): DatabaseSync {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
  return getDatabase(dbPath);
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
}
