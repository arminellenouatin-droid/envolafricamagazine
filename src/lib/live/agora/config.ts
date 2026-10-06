import "server-only";
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_AGORA_APP_ID: z.string().min(16, "NEXT_PUBLIC_AGORA_APP_ID manquant"),
  AGORA_APP_CERTIFICATE: z.string().min(16, "AGORA_APP_CERTIFICATE manquant"),
  AGORA_NCS_SECRET: z.string().min(8).optional(),
});

let cached: z.infer<typeof schema> | null = null;

export function getAgoraConfig() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      // On ne logge jamais les valeurs, uniquement les noms de variables en défaut.
      const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Configuration Agora invalide : ${missing}`);
    }
    cached = parsed.data;
  }
  return cached;
}
