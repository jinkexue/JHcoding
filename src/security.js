export const SESSION_LOCK_TIMEOUT_MS = 10 * 60 * 1000;

export function getSessionLockTimeoutMs() {
  return SESSION_LOCK_TIMEOUT_MS;
}

export function shouldLockForVisibilityChange(isHidden) {
  return Boolean(isHidden);
}

export function isSessionIdleExpired(lastActivityAt, now = Date.now()) {
  if (!Number.isFinite(lastActivityAt)) {
    return false;
  }
  return now - lastActivityAt > getSessionLockTimeoutMs();
}

export function clearAuthSessionState(store = new Map()) {
  if (store instanceof Map) {
    const next = new Map(store);
    next.delete('family-portal-role-v2');
    return next;
  }

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('family-portal-role-v2');
    if (window.sessionStorage) {
      window.sessionStorage.clear();
    }
  }

  return store;
}
