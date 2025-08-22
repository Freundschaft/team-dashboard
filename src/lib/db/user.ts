import pool from './pool';
import {
  CreateUserInput,
  User
} from '@/types';
import {DatabaseError} from "pg";


// User queries
export async function getAllUsers(): Promise<User[]> {
  const query = 'SELECT * FROM users ORDER BY name';
  const result = await pool.query(query);
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  }));
}

export async function createUser(userData: CreateUserInput): Promise<User> {
  const query = 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *';
  const values = [userData.name, userData.email];

  try {
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  } catch (error) {
    if (error instanceof DatabaseError && error.code === '23505') {
      throw new Error('A user with this email already exists');
    }
    throw error;
  }
}