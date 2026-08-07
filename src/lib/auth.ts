import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { readDB, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'envol-africa-super-secret-jwt-2026-change-me';
const COOKIE_NAME = 'eam_token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getCurrentUserFromCookie(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const decoded = verifyToken(token);
    if (!decoded) return null;
    const db = readDB();
    const user = db.users.find(u => u.id === decoded.id);
    return user || null;
  } catch {
    return null;
  }
}

export function getCurrentUserFromToken(token?: string): User | null {
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const db = readDB();
  return db.users.find(u => u.id === decoded.id) || null;
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30*24*60*60,
  path: '/',
};

export { COOKIE_NAME, JWT_SECRET };
