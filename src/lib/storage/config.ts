import "server-only";
import { z } from "zod";

const r2ConfigSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(10, "R2_ACCOUNT_ID manquant"),
  R2_ACCESS_KEY_ID: z.string().min(10, "R2_ACCESS_KEY_ID manquant"),
  R2_SECRET_ACCESS_KEY: z.string().min(16, "R2_SECRET_ACCESS_KEY manquant"),
  R2_BUCKET_PUBLIC: z.string().default("envol-public"),
  R2_BUCKET_PRIVATE: z.string().default("envol-private"),
  R2_PUBLIC_BASE_URL: z.string().url("R2_PUBLIC_BASE_URL invalide"),
  R2_KEY_PREFIX: z.string().default(""),
  R2_SOFT_LIMIT_BYTES: z.coerce.number().default(9_663_676_416), // 9 Go par défaut
});

export type R2Config = z.infer<typeof r2ConfigSchema>;

let cachedConfig: R2Config | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_PUBLIC_BASE_URL
  );
}

export function getR2Config(): R2Config {
  if (!cachedConfig) {
    const parsed = r2ConfigSchema.safeParse(process.env);
    if (!parsed.success) {
      const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Configuration Cloudflare R2 invalide : ${missing}`);
    }
    cachedConfig = parsed.data;
  }
  return cachedConfig;
}
