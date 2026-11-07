import test from 'node:test';
import assert from 'node:assert/strict';

import { getImageCompressionPlan } from './mediaCompression.js';

test('mobile files above 1MB are compressed aggressively', () => {
  const plan = getImageCompressionPlan(3 * 1024 * 1024, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
  assert.equal(plan.shouldCompress, true);
  assert.equal(plan.maxWidth, 1400);
  assert.equal(plan.quality, 0.72);
});

test('tablet and desktop keep larger dimensions before compression', () => {
  const tablet = getImageCompressionPlan(2 * 1024 * 1024, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
  assert.equal(tablet.shouldCompress, true);
  assert.equal(tablet.maxWidth, 2000);
  assert.equal(tablet.quality, 0.84);

  const small = getImageCompressionPlan(512 * 1024, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
  assert.equal(small.shouldCompress, false);
});
