import bcrypt from 'bcrypt';
import { pool } from './db.ts';

export interface User {
  id: number;
  username: string;
  password: string;
  created_at: Date;
}

export async function getAllUsers(): Promise<User[]> {
  const result = await pool.query<User>('SELECT id, username, password, created_at FROM users ORDER BY created_at DESC;');
  return result.rows;
}

export async function addUser(username: string, password: string, vulnerable: boolean): Promise<void> {
  // ranjivost uključena: lozinka ide u bazu kao plain text
  // ranjivost isključena: bcrypt hash (jednosmjeran, sa saltom ugrađenim u rezultat)
  // 10 -> cost factor; bcrypt radi 2^10 rundi - dovoljno sporo da otežava brute force, a dovoljno brzo za prijavu
  const stored = vulnerable ? password : await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (username, password) VALUES ($1, $2);', [username, stored]);
}