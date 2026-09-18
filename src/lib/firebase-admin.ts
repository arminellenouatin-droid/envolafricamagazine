import { cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const FIREBASE_ADMIN_APP_NAME = "envol-africa-fcm";

function normalizePrivateKey(value: string | undefined): string | undefined {
  return value?.replace(/\\n/g, "\n").trim();
}

function serviceAccountFromEnvironment(): ServiceAccount | null {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (encoded || rawJson) {
    try {
      const json = encoded
        ? Buffer.from(encoded, "base64").toString("utf8")
        : rawJson!;
      const parsed = JSON.parse(json) as { project_id?: string; client_email?: string; private_key?: string };
      const privateKey = normalizePrivateKey(parsed.private_key);
      if (parsed.project_id && parsed.client_email && privateKey) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey,
        };
      }
    } catch (err) {
      console.error("[firebase-admin] Échec du parsing du compte de service :", err);
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "envolafrica-8d361";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

function getFirebaseAdminApp(): App | null {
  const existing = getApps().find((app) => app.name === FIREBASE_ADMIN_APP_NAME);
  if (existing) return getApp(FIREBASE_ADMIN_APP_NAME);

  const serviceAccount = serviceAccountFromEnvironment();
  if (!serviceAccount) return null;

  try {
    return initializeApp(
      {
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId,
      },
      FIREBASE_ADMIN_APP_NAME
    );
  } catch (err) {
    console.error("[firebase-admin] Erreur d'initialisation de l'application Firebase Admin :", err);
    return null;
  }
}

export function getFirebaseAdminMessaging() {
  const app = getFirebaseAdminApp();
  return app ? getMessaging(app) : null;
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(serviceAccountFromEnvironment());
}
