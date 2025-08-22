import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './db';
import {PoolClient} from "pg";

export async function initializeDatabase(): Promise<void> {
  await runMigrations();
  await runConstraints();
  await runSeedData();
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  
  try {
    const tablesExist = await checkTablesExist(client);
    
    if (!tablesExist) {
      console.log('Database tables not found. Applying schema...');
      await applySchema(client);
      console.log('Schema applied successfully.');
    } else {
      console.log('Database schema already exists.');
    }
    
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function runConstraints(): Promise<void> {
  const client = await pool.connect();
  
  try {
    const constraintExists = await checkConstraintExists(client);
    
    if (!constraintExists) {
      console.log('Database constraints not found. Applying constraints...');
      await applyConstraints(client);
      console.log('Database constraints applied successfully.');
    } else {
      console.log('Database constraints already exist.');
    }
    
  } catch (error) {
    console.error('Database constraint application failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function runSeedData(): Promise<void> {
  const client = await pool.connect();
  
  try {
    const hasData = await checkHasData(client);
    
    if (!hasData) {
      console.log('No data found. Applying seed data...');
      await applySeedData(client);
      console.log('Seed data applied successfully.');
    } else {
      console.log('Database already has data.');
    }
    
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function checkTablesExist(client: PoolClient): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    ) AND EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'teams'
    ) AND EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'team_members'
    ) as tables_exist
  `;
  
  const result = await client.query(query);
  return result.rows[0].tables_exist;
}

async function checkHasData(client: PoolClient): Promise<boolean> {
  const query = `
    SELECT EXISTS (SELECT 1 FROM users LIMIT 1) as has_users,
           EXISTS (SELECT 1 FROM teams LIMIT 1) as has_teams
  `;
  
  const result = await client.query(query);
  return result.rows[0].has_users && result.rows[0].has_teams;
}

async function applySchema(client: PoolClient): Promise<void> {
  const migrationPath = join(process.cwd(), 'database', 'schema.sql');
  const migration = readFileSync(migrationPath, 'utf8');
  
  await client.query(migration);
}

async function checkConstraintExists(client: PoolClient): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.triggers 
      WHERE event_object_schema = 'public' 
      AND event_object_table = 'teams'
      AND trigger_name = 'check_team_circular_reference'
    ) as constraint_exists
  `;
  
  const result = await client.query(query);
  return result.rows[0].constraint_exists;
}

async function applyConstraints(client: PoolClient): Promise<void> {
  const constraintPath = join(process.cwd(), 'database', 'add_circular_reference_constraint.sql');
  const constraints = readFileSync(constraintPath, 'utf8');
  
  await client.query(constraints);
}

async function applySeedData(client: PoolClient): Promise<void> {
  const seedPath = join(process.cwd(), 'database', 'seed.sql');
  const seed = readFileSync(seedPath, 'utf8');
  
  await client.query(seed);
}