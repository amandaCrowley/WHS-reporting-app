import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveUserLookup } from '../src/userIdentity.js';

test('firebase uid is treated as the canonical external user identifier', () => {
  const lookup = resolveUserLookup('firebase-abc-123');
  assert.deepEqual(lookup, { firebaseUid: 'firebase-abc-123' });
});

test('mongo object ids are supported only as internal database references', () => {
  const lookup = resolveUserLookup('507f1f77bcf86cd799439011');
  assert.equal(lookup.firebaseUid, undefined);
  assert.equal(lookup._id.toString(), '507f1f77bcf86cd799439011');
});
