import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeIssueStatus,
  normalizeAndValidateIssueStatus,
  normalizeIssueArchiveState,
  normalizeAndValidateIssueArchiveState,
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

test('archive state is normalized from common string values to booleans', () => {
  assert.equal(normalizeIssueArchiveState('true'), true);
  assert.equal(normalizeIssueArchiveState('false'), false);
  assert.equal(normalizeIssueArchiveState('yes'), true);
  assert.equal(normalizeIssueArchiveState('no'), false);
});

test('archive state validation rejects non-boolean values', () => {
  assert.deepEqual(normalizeAndValidateIssueArchiveState(true), {
    valid: true,
    normalizedArchived: true,
    error: null,
  });

  assert.deepEqual(normalizeAndValidateIssueArchiveState('false'), {
    valid: true,
    normalizedArchived: false,
    error: null,
  });

  assert.deepEqual(normalizeAndValidateIssueArchiveState('maybe'), {
    valid: false,
    normalizedArchived: 'maybe',
    error: 'Archive state must be a boolean value.',
  });
});

test('canonical status list contains the supported lifecycle states', () => {
  assert.deepEqual(VALID_ISSUE_STATUSES, ['Open', 'In Progress', 'Closed']);
});
