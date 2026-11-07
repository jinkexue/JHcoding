import test from 'node:test';
import assert from 'node:assert/strict';

import { getSectionForType, getVisibleContentItems } from './contentRules.js';

test('content type maps to the correct section', () => {
  assert.equal(getSectionForType('text'), 'reading');
  assert.equal(getSectionForType('video'), 'video');
  assert.equal(getSectionForType('image'), 'album');
  assert.equal(getSectionForType('audio'), 'listening');
});

test('admins can still see hidden items, but regular users cannot', () => {
  const items = [
    { id: 'hidden-1', type: 'text', visible: false },
    { id: 'visible-1', type: 'text', visible: true },
  ];

  assert.deepEqual(getVisibleContentItems('reading', items, { isAdmin: false }).map((item) => item.id), ['visible-1']);
  assert.deepEqual(getVisibleContentItems('reading', items, { isAdmin: true }).map((item) => item.id), ['hidden-1', 'visible-1']);
});
