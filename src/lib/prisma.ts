// Prisma Client - works on Vercel (with DATABASE_URL) and gracefully falls back in sandbox where engine can't download
let _prisma: any = null;

function getPrisma() {
  if (_prisma) return _prisma;
  try {
    // Dynamic require to avoid TS error when client not generated (sandbox without internet)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    const globalForPrisma = globalThis as unknown as { prisma: any };
    _prisma =
      (globalForPrisma as any).prisma ||
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    if (process.env.NODE_ENV !== 'production') (globalForPrisma as any).prisma = _prisma;
  } catch (e) {
    console.warn("Prisma client not available (sandbox without engine), using fallback null. On Vercel it will work after generate.");
    _prisma = {
      user: { findMany: async () => [], findUnique: async () => null, findFirst: async () => null },
      article: { findMany: async () => [], findUnique: async () => null, findFirst: async () => null },
      magazine: { findMany: async () => [], findUnique: async () => null },
      order: { findMany: async () => [], findUnique: async () => null },
      affiliateEarning: { findMany: async () => [], findUnique: async () => null },
    };
  }
  return _prisma;
}

export const prisma = new Proxy({} as any, {
  get: (_target, prop) => {
    const client = getPrisma();
    return client[prop];
  },
});

export function isPrismaConfigured() {
  return !!process.env.DATABASE_URL;
}
