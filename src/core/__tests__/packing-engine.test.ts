import { describe, expect, it } from 'vitest';
import { packItems, validateSuitcase } from '../packing-engine';
import { weightCeilings, type PackingItem, type Suitcase } from '../models';

const suitcase = (overrides: Partial<Suitcase> = {}): Suitcase => ({ length: 10, width: 8, height: 6, maxWeight: 10, emptyWeight: 0, weightLimit: 0, ...overrides });
const item = (id: string, overrides: Partial<PackingItem> = {}): PackingItem => ({
  id, name: id, category: '衣物', length: 3, width: 2, height: 1, weight: 1, priority: 2, mustHave: false, ...overrides,
});

describe('validateSuitcase', () => {
  it('rejects each non-positive capacity', () => {
    expect(validateSuitcase(suitcase({ height: 0 }))).toContain('行李箱高度必须大于 0');
    expect(validateSuitcase(suitcase({ maxWeight: -1 }))).toContain('承重必须大于 0');
  });

  it('rejects a negative empty box weight or total weight limit', () => {
    expect(validateSuitcase(suitcase({ emptyWeight: -0.1 }))).toContain('空箱重量不能为负');
    expect(validateSuitcase(suitcase({ weightLimit: -1 }))).toContain('整箱总重上限不能为负');
  });
});

describe('weightCeilings', () => {
  it('uses the smaller of bearing capacity and total limit minus empty weight', () => {
    expect(weightCeilings(suitcase({ maxWeight: 10, emptyWeight: 2, weightLimit: 8 }), 1)).toMatchObject({ itemWeightLimit: 6, weightLimitBound: true });
    expect(weightCeilings(suitcase({ maxWeight: 7, emptyWeight: 2, weightLimit: 12 }), 1)).toMatchObject({ itemWeightLimit: 7, weightLimitBound: false });
  });

  it('falls back to the bearing rule when the total limit is unset or zero', () => {
    expect(weightCeilings(suitcase({ maxWeight: 10, emptyWeight: 3 }), 1)).toMatchObject({ itemWeightLimit: 10, grossWeightLimit: 13, weightLimitBound: false });
  });
});

describe('packItems', () => {
  it('allows total weight exactly at the suitcase limit', () => {
    const plan = packItems(suitcase({ maxWeight: 2 }), [item('a'), item('b')], 'comfort');
    expect(plan.placements).toHaveLength(2);
    expect(plan.totalWeight).toBe(2);
  });

  it('limits packed items by gross limit minus empty box weight', () => {
    const plan = packItems(suitcase({ maxWeight: 10, emptyWeight: 3, weightLimit: 5 }), [item('a'), item('b'), item('c')], 'comfort');
    expect(plan.totalWeight).toBeLessThanOrEqual(2);
    expect(plan.grossWeight).toBe(plan.totalWeight + 3);
    expect(plan.grossWeight).toBeLessThanOrEqual(5);
    expect(plan.unplaced[0]?.reason).toContain('整箱总重');
  });

  it('allows gross weight exactly at the total limit', () => {
    const plan = packItems(suitcase({ emptyWeight: 2, weightLimit: 4 }), [item('a'), item('b')], 'comfort');
    expect(plan.placements).toHaveLength(2);
    expect(plan.grossWeight).toBe(4);
    expect(plan.remainingWeight).toBe(0);
  });

  it('packs nothing when the empty box alone exceeds the total limit', () => {
    const plan = packItems(suitcase({ emptyWeight: 6, weightLimit: 5 }), [item('a')], 'comfort');
    expect(plan.placements).toHaveLength(0);
    expect(plan.remainingWeight).toBeLessThan(0);
  });

  it('reports all weight calibers for the generated plan', () => {
    const plan = packItems(suitcase({ emptyWeight: 2, weightLimit: 9 }), [item('a'), item('b')], 'comfort');
    expect(plan.emptyWeight).toBe(2);
    expect(plan.grossWeight).toBe(4);
    expect(plan.grossWeightLimit).toBe(9);
    expect(plan.remainingWeight).toBe(5);
  });

  it('uses rotation when the original orientation does not fit', () => {
    const plan = packItems(suitcase({ length: 4, width: 3, height: 2 }), [item('rotated', { length: 2, width: 4, height: 3 })], 'comfort');
    expect(plan.placements[0]?.dimensions).toEqual({ length: 4, width: 3, height: 2 });
  });

  it('keeps placements inside bounds and non-overlapping', () => {
    const plan = packItems(suitcase(), [item('a'), item('b'), item('c')], 'comfort');
    expect(plan.placements.every((p) => p.x + p.dimensions.length <= 10 && p.y + p.dimensions.width <= 8 && p.z + p.dimensions.height <= 6)).toBe(true);
    expect(new Set(plan.placements.map((p) => `${p.x}:${p.y}:${p.z}`)).size).toBe(3);
  });

  it('returns deterministic coordinates and an unplaced reason', () => {
    const inputs = [item('a'), item('huge', { length: 30 })];
    expect(packItems(suitcase(), inputs, 'comfort')).toEqual(packItems(suitcase(), inputs, 'comfort'));
    expect(packItems(suitcase(), inputs, 'comfort').unplaced[0]?.reason).toContain('空间');
  });
});
