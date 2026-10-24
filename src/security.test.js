import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSessionLockTimeoutMs,
  isSessionIdleExpired,
  shouldLockForVisibilityChange,
  clearAuthSessionState,
} from './security.js';

test('idle timeout is configured to 10 minutes', () => {
  assert.equal(getSessionLockTimeoutMs(), 10 * 60 * 1000);
});

test('visibility hidden requires a lock', () => {
  assert.equal(shouldLockForVisibilityChange(true), true);
  assert.equal(shouldLockForVisibilityChange(false), false);
});

test('idle detection clears auth state after threshold', () => {
  const now = Date.now();
  assert.equal(isSessionIdleExpired(now - 11 * 60 * 1000, now), true);
  assert.equal(isSessionIdleExpired(now - 5 * 60 * 1000, now), false);
});

test('auth state cleanup removes stored login data', () => {
  const store = new Map([['family-portal-role-v2', 'admin']]);
  const next = clearAuthSessionState(store);
  assert.equal(next.has('family-portal-role-v2'), false);
});
