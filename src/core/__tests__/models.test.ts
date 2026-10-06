import { describe, expect, it } from 'vitest';
import { itemVolume, normalizeSnapshot, suitcaseVolume, type PackingItem, type Suitcase } from '../models';

describe('volume helpers', () => {
  it('multiplies an item dimensions in centimeters', () => {
    const item = { length: 10, width: 4, height: 3 } as PackingItem;
    expect(itemVolume(item)).toBe(120);
  });

  it('multiplies suitcase internal dimensions', () => {
    const suitcase = { length: 50, width: 30, height: 20 } as Suitcase;
    expect(suitcaseVolume(suitcase)).toBe(30_000);
  });
});

describe('normalizeSnapshot', () => {
  it('fills empty weight and gross limit with 0 for legacy snapshots', () => {
    const snapshot = normalizeSnapshot({ suitcase: { length: 52, width: 35, height: 23, maxWeight: 10 } as Suitcase, items: [] });
    expect(snapshot.suitcase.emptyWeight).toBe(0);
    expect(snapshot.suitcase.grossWeightLimit).toBe(0);
    expect(snapshot.selectedPlan).toBe('comfort');
  });

  it('keeps valid new weight fields and guards against invalid input', () => {
    const snapshot = normalizeSnapshot({ suitcase: { length: 1, width: 1, height: 1, maxWeight: 1, emptyWeight: -3, grossWeightLimit: 9 }, items: [] });
    expect(snapshot.suitcase.emptyWeight).toBe(0);
    expect(snapshot.suitcase.grossWeightLimit).toBe(9);
  });
});
