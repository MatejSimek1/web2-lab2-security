import { pool } from './db.ts';

export interface Comment {
  id: number;
  content: string;
  created_at: Date;
}

export async function getAllComments(): Promise<Comment[]> {
  const result = await pool.query<Comment>('SELECT id, content, created_at FROM comments ORDER BY created_at DESC;');
  return result.rows;
}

// sprema sadržaj sirov, bez obzira na prekidač -> obrana od xss-a je escapeanje pri ispisu
export async function addComment(content: string): Promise<void> {
  await pool.query('INSERT INTO comments (content) VALUES ($1);', [content]);    // parametrizirani upit -> sprječava sql injection
}

export async function deleteAllComments(): Promise<void> {
  await pool.query('DELETE FROM comments;');
}