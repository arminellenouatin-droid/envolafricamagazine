import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { getR2Config } from "./config";

let s3Instance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!s3Instance) {
    const config = getR2Config();
    s3Instance = new S3Client({
      region: "auto",
      endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID,
        secretAccessKey: config.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Instance;
}
