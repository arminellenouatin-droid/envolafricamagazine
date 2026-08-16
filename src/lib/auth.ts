import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { User } from './db';
import { findUserById } from './core-db';

const JWT_SECRET = process.env.JWT_SECRET || "";
const COOKIE_NAME = 'eam_token';

function getJwtSecret() {
  if (!JWT_SECRET && process.env.NODE_ENV === "production") throw new Error("JWT_SECRET manquant en production");
  return JWT_SECRET || "local-only-jwt-secret";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, getJwtSecret());
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
    if (!decoded || typeof decoded !== "object" || !("id" in decoded) || typeof decoded.id !== "string") return null;
    return await findUserById(decoded.id);
  } catch {
    return null;
  }
}

export async function getCurrentUserFromToken(token?: string): Promise<User | null> {
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || typeof decoded !== "object" || !("id" in decoded) || typeof decoded.id !== "string") return null;
  return await findUserById(decoded.id);
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30*24*60*60,
  path: '/',
};

export { COOKIE_NAME, JWT_SECRET };
