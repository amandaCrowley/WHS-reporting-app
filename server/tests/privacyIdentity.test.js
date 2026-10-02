import test from "node:test";
import assert from "node:assert/strict";

import { createDeidentifiedUid } from "../src/privacyIdentity.js";

test("creates a stable non-reversible UID reference", () => {
  const previousSecret = process.env.PRIVACY_UID_HASH_SECRET;
  process.env.PRIVACY_UID_HASH_SECRET = "test-only-secret";

  try {
    const first = createDeidentifiedUid("firebase-user-123");
    const second = createDeidentifiedUid("firebase-user-123");

    assert.equal(first, second);
    assert.match(first, /^deidentified_uid_[a-f0-9]{64}$/);
    assert.notEqual(first, "firebase-user-123");
  } finally {
    if (previousSecret === undefined) {
      delete process.env.PRIVACY_UID_HASH_SECRET;
    } else {
      process.env.PRIVACY_UID_HASH_SECRET = previousSecret;
    }
  }
});
