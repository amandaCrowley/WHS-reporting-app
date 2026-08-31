// This file centralises the app's approved issue status lifecycle.
// It keeps the UI/backend consistent by translating legacy or alternate values
// (such as "Resolved") into the canonical status model used by the system.

export const VALID_ISSUE_STATUSES = ['Open', 'In Progress', 'Closed'];

// Normalises incoming issue status values to the canonical set.
// This prevents status drift, such as "Resolved" being stored differently
// from "Closed" across different parts of the application.
export function normalizeIssueStatus(status) {
  if (status === undefined || status === null || status === '') {
    return 'Open';
  }

  const normalized = String(status).trim();
  const lower = normalized.toLowerCase();

  if (lower === 'resolved') {
    return 'Closed';
  }

  if (lower === 'closed') {
    return 'Closed';
  }

  if (lower === 'in progress' || lower === 'in-progress') {
    return 'In Progress';
  }

  if (lower === 'open') {
    return 'Open';
  }

  return normalized;
}

export function normalizeAndValidateIssueStatus(status) {
  const normalizedStatus = normalizeIssueStatus(status);

  if (!VALID_ISSUE_STATUSES.includes(normalizedStatus)) {
    return {
      valid: false,
      normalizedStatus,
      error: `Invalid status. Must be one of: ${VALID_ISSUE_STATUSES.join(', ')}`,
    };
  }

  return {
    valid: true,
    normalizedStatus,
    error: null,
  };
}

export function validateAdminEligibility({ routeRole, requestIsAdmin }) {
  if (requestIsAdmin !== true) {
    return {
      valid: true,
      error: null,
    };
  }

  return {
    valid: routeRole === 'Staff',
    error: routeRole === 'Staff' ? null : 'Only Staff users can be granted administrator access.',
  };
}
