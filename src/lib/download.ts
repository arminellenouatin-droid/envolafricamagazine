import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'envol-africa-super-secret-jwt-2026-change-me';
const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET || JWT_SECRET + "_download";

export interface DownloadTokenPayload {
  userId: string;
  magazineId?: string;
  articleId?: string;
  type: 'magazine' | 'audio' | 'article_audio';
  format?: string;
  exp: number; // expiry timestamp
}

export function generateDownloadToken(payload: Omit<DownloadTokenPayload, 'exp'>, expiresInHours = 24): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  return jwt.sign({ ...payload, exp }, DOWNLOAD_SECRET);
}

export function verifyDownloadToken(token: string): DownloadTokenPayload | null {
  try {
    const decoded = jwt.verify(token, DOWNLOAD_SECRET) as DownloadTokenPayload;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function generateSecureDownloadUrl(userId: string, magazineId: string, type: 'magazine' | 'audio', format?: string) {
  const token = generateDownloadToken({ userId, magazineId, type, format });
  return `/api/download/${token}`;
}
