import { createHmac } from "node:crypto";

export function createDeidentifiedUid(firebaseUid) {
  const secret = process.env.PRIVACY_UID_HASH_SECRET;

  if (!secret) {
    throw new Error("PRIVACY_UID_HASH_SECRET is not configured");
  }

  const digest = createHmac("sha256", secret)
    .update(firebaseUid)
    .digest("hex");

  return `deidentified_uid_${digest}`;
}
