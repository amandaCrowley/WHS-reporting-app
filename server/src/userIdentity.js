// This helper keeps the app's user identity rules consistent.
// Firebase UID is treated as the canonical external identifier for users,
// while Mongo ObjectId is reserved for internal database references only.
// This avoids mixing two identity styles in the same API contract.

import { ObjectId } from 'mongodb';

// Converts a user identifier into the appropriate Mongo query object.
// If the value looks like a Mongo ObjectId, we query by _id.
// Otherwise, the value is treated as a Firebase UID.
export function resolveUserLookup(identifier) {
  if (identifier === undefined || identifier === null) {
    return {};
  }

  const value = String(identifier).trim();
  if (!value) {
    return {};
  }

  if (ObjectId.isValid(value) && value.length === 24) {
    return { _id: new ObjectId(value) };
  }

  return { firebaseUid: value };
}

// Finds the matching user record using whichever identity format was supplied.
// This keeps the backend logic centralized and reduces repeated "user lookup" logic.
export async function findUserByIdentity(db, identifier) {
  const lookup = resolveUserLookup(identifier);

  if (!lookup || Object.keys(lookup).length === 0) {
    return null;
  }

  return db.collection('User').findOne(lookup);
}
