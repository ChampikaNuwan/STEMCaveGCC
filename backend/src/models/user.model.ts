import { query, execute } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../types';

export const UserModel = {
  async findById(id: string): Promise<User | null> {
    const rows = await query<any[]>('SELECT * FROM users WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const rows = await query<any[]>('SELECT * FROM users WHERE email = ?', [email]);
    return rows.length ? rows[0] : null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const rows = await query<any[]>('SELECT * FROM users WHERE username = ?', [username]);
    return rows.length ? rows[0] : null;
  },

  async findByEmailOrUsername(login: string): Promise<User | null> {
    const rows = await query<any[]>(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [login, login]
    );
    return rows.length ? rows[0] : null;
  },

  async create(data: {
    username: string;
    email: string;
    password: string;
    role: UserRole;
    createdBy?: string | null;
  }): Promise<string> {
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, 12);

    await execute(
      `INSERT INTO users (id, username, email, password_hash, role, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.username, data.email, passwordHash, data.role, data.createdBy || null]
    );

    return id;
  },

  async getAll(role?: UserRole, limit: number = 50, offset: number = 0): Promise<User[]> {
    if (role) {
      return query<any[]>('SELECT * FROM users WHERE role = ? LIMIT ? OFFSET ?', [role, limit, offset]);
    }
    return query<any[]>('SELECT * FROM users LIMIT ? OFFSET ?', [limit, offset]);
  },

  async update(id: string, data: Partial<Pick<User, 'username' | 'email' | 'role'>>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.username !== undefined) { fields.push('username = ?'); values.push(data.username); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }

    if (fields.length) {
      values.push(id);
      await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM users WHERE id = ?', [id]);
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  },
};
