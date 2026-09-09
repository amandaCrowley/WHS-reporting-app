import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeIncidentDateTime,
  isIncidentDateTimeValid,
} from '../src/incidentDateTime.js';

test('datetime-local values are normalized to a valid JavaScript date', () => {
  const date = normalizeIncidentDateTime('2026-09-09T14:30');
  assert.equal(date instanceof Date, true);
  assert.equal(Number.isNaN(date.getTime()), false);
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 8);
  assert.equal(date.getDate(), 9);
});

test('blank values fall back to the current time', () => {
  const fallback = new Date('2026-01-01T12:00:00Z');
  const date = normalizeIncidentDateTime('', fallback);
  assert.equal(date.getTime(), fallback.getTime());
});

test('incident time cannot be later than the report time', () => {
  const reportTime = new Date(2026, 8, 9, 12, 0, 0);
  assert.equal(isIncidentDateTimeValid('2026-09-09T12:30', reportTime), false);
  assert.equal(isIncidentDateTimeValid('2026-09-09T11:30', reportTime), true);
});
