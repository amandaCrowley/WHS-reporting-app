import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeIssueStatus,
  normalizeAndValidateIssueStatus,
  validateAdminEligibility,
  VALID_ISSUE_STATUSES,
} from '../src/issueStatus.js';

test('resolved is normalized to closed in the canonical lifecycle', () => {
  assert.equal(normalizeIssueStatus('Resolved'), 'Closed');
  assert.equal(normalizeIssueStatus('closed'), 'Closed');
});

test('status validation normalizes alternate lifecycle values before update', () => {
  assert.deepEqual(normalizeAndValidateIssueStatus('in-progress'), {
    valid: true,
    normalizedStatus: 'In Progress',
    error: null,
  });

  assert.deepEqual(normalizeAndValidateIssueStatus('Resolved'), {
    valid: true,
    normalizedStatus: 'Closed',
    error: null,
  });
});

test('only staff users can be granted administrator access', () => {
  assert.deepEqual(validateAdminEligibility({ routeRole: 'Student', requestIsAdmin: true }), {
    valid: false,
    error: 'Only Staff users can be granted administrator access.',
  });

  assert.deepEqual(validateAdminEligibility({ routeRole: 'Staff', requestIsAdmin: true }), {
    valid: true,
    error: null,
  });
});

test('canonical status list contains the supported lifecycle states', () => {
  assert.deepEqual(VALID_ISSUE_STATUSES, ['Open', 'In Progress', 'Closed']);
});
