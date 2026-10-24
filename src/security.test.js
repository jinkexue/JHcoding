import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSessionLockTimeoutMs,
  getTimePartsInTimeZone,
  isSessionIdleExpired,
  isWeekendInTimeZone,
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

test('Shanghai timezone resolves Saturday correctly for the reported time', () => {
  const now = new Date('2026-10-23T20:00:00-06:00');
  const parts = getTimePartsInTimeZone(now, 'Asia/Shanghai');
  assert.equal(parts.weekday, 'Sat');
  assert.equal(parts.day, 24);
  assert.equal(isWeekendInTimeZone(now, 'Asia/Shanghai'), true);
});
