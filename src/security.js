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

export function getTimePartsInTimeZone(date = new Date(), timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  });

  const hour = Number(map.hour || '0');
  const minute = Number(map.minute || '0');
  const day = Number(map.day || '1');
  const month = Number(map.month || '1');
  const year = Number(map.year || '1970');
  const weekday = String(map.weekday || 'Mon');

  return {
    year,
    month,
    day,
    hour,
    minute,
    second: Number(map.second || '0'),
    weekday,
    minutes: hour * 60 + minute,
    dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday),
  };
}

export function isWeekendInTimeZone(date = new Date(), timeZone) {
  const { dayOfWeek } = getTimePartsInTimeZone(date, timeZone);
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function clearAuthSessionState(store = new Map()) {
  if (store instanceof Map) {
    const next = new Map(store);
    next.delete('family-portal-role-v2');
    next.delete('family-portal-auth-token-v2');
    return next;
  }

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('family-portal-role-v2');
    window.localStorage.removeItem('family-portal-auth-token-v2');
    if (window.sessionStorage) {
      window.sessionStorage.clear();
    }
  }

  return store;
}
