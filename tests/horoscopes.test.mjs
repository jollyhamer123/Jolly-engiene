import test from 'node:test';
import assert from 'node:assert/strict';
import '../horoscopes.js';
const { signs, reading } = globalThis.JollyHoroscopes;

test('all twelve Chinese zodiac signs have distinct daily readings', () => {
  assert.equal(signs.length, 12);
  const readings = signs.map(sign => reading(sign, new Date('2026-10-22T10:00:00Z')));
  assert.equal(new Set(readings.map(item => item.text)).size, 12);
  assert(readings.every(item => item.traits && item.focus && item.date === '2026-10-22'));
});
test('a reading stays the same throughout a UTC day', () => {
  assert.deepEqual(reading('Dragon', new Date('2026-10-22T00:00:00Z')), reading('Dragon', new Date('2026-10-22T23:59:59Z')));
});
test('every sign gets a different focus at midnight, including year rollover', () => {
  for (const sign of signs) {
    const before = reading(sign, new Date('2026-12-31T23:59:59Z'));
    const after = reading(sign, new Date('2027-01-01T00:00:00Z'));
    assert.notEqual(before.focus, after.focus);
    assert.notEqual(before.text, after.text);
    assert.equal(after.date, '2027-01-01');
  }
});
test('rejects unknown signs and invalid dates', () => {
  assert.throws(() => reading('Unknown'));
  assert.throws(() => reading('Rat', new Date('invalid')));
});
