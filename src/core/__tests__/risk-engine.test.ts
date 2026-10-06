import { describe, expect, it } from 'vitest';
import { detectRisks } from '../risk-engine';
import type { PackingItem, PackingPlan, Suitcase } from '../models';

const suitcase: Suitcase = { length: 10, width: 8, height: 6, maxWeight: 10, emptyWeight: 0, weightLimit: 0 };
const item = (id: string, overrides: Partial<PackingItem> = {}): PackingItem => ({ id, name: id, category: '其他', length: 2, width: 2, height: 2, weight: 1, priority: 2, mustHave: false, ...overrides });
const basePlan = (): PackingPlan => ({
  id: 'comfort', name: '舒适版', placements: [], unplaced: [],
  totalWeight: 0, emptyWeight: 0, grossWeight: 0, itemWeightLimit: 10, grossWeightLimit: 10, weightLimitBound: false, remainingWeight: 10,
  usedVolume: 0, capacityRatio: 0,
});

describe('detectRisks', () => {
  it('reports overweight and high volume', () => {
    const plan = { ...basePlan(), totalWeight: 11, grossWeight: 11, remainingWeight: -1, usedVolume: 460, capacityRatio: 0.96 };
    expect(detectRisks(plan, suitcase, []).map((risk) => risk.id)).toEqual(expect.arrayContaining(['overweight', 'high-volume']));
  });

  it('reports an oversized unplaced item', () => {
    const huge = item('huge', { length: 11 });
    const plan = { ...basePlan(), unplaced: [{ item: huge, reason: '没有可用的连续空间' }] };
    expect(detectRisks(plan, suitcase, [huge]).some((risk) => risk.id === 'oversized-huge')).toBe(true);
  });

  it('reports fragile items with a box stacked above', () => {
    const glass = item('glass', { fragile: true });
    const top = item('top');
    const plan = { ...basePlan(), placements: [
      { itemId: 'glass', x: 0, y: 0, z: 0, dimensions: { length: 2, width: 2, height: 2 } },
      { itemId: 'top', x: 0, y: 0, z: 2, dimensions: { length: 2, width: 2, height: 2 } },
    ] };
    expect(detectRisks(plan, suitcase, [glass, top]).some((risk) => risk.id === 'fragile-glass')).toBe(true);
  });

  it('reports heavy items placed high', () => {
    const heavy = item('heavy', { weight: 4 });
    const plan = { ...basePlan(), placements: [{ itemId: 'heavy', x: 0, y: 0, z: 4, dimensions: { length: 2, width: 2, height: 2 } }] };
    expect(detectRisks(plan, suitcase, [heavy]).some((risk) => risk.id === 'high-heavy')).toBe(true);
  });

  it('marks an omitted must-have item as critical', () => {
    const required = item('passport', { mustHave: true });
    const plan = { ...basePlan(), unplaced: [{ item: required, reason: '空间不足' }] };
    expect(detectRisks(plan, suitcase, [required])).toContainEqual(expect.objectContaining({ id: 'missing-passport', severity: 'critical' }));
  });

  it('flags gross weight over the total limit including the empty box', () => {
    const box: Suitcase = { ...suitcase, emptyWeight: 2.5, weightLimit: 8 };
    const plan = { ...basePlan(), emptyWeight: 2.5, totalWeight: 6, grossWeight: 8.5, grossWeightLimit: 8, itemWeightLimit: 5.5, weightLimitBound: true, remainingWeight: -0.5 };
    const risks = detectRisks(plan, box, []);
    expect(risks).toContainEqual(expect.objectContaining({ id: 'overweight-gross', severity: 'critical' }));
    expect(risks.some((risk) => risk.id === 'overweight')).toBe(false);
  });

  it('alerts box-over-limit even when no items are packed', () => {
    const box: Suitcase = { ...suitcase, emptyWeight: 11, weightLimit: 10 };
    const plan = { ...basePlan(), emptyWeight: 11, grossWeight: 11, grossWeightLimit: 10, itemWeightLimit: -1, weightLimitBound: true, remainingWeight: -1 };
    const risks = detectRisks(plan, box, []);
    expect(risks[0]).toMatchObject({ id: 'box-over-limit', severity: 'critical' });
    expect(risks.some((risk) => risk.id === 'all-clear')).toBe(false);
  });

  it('allows gross weight exactly at the limit', () => {
    const box: Suitcase = { ...suitcase, emptyWeight: 2, weightLimit: 8 };
    const plan = { ...basePlan(), emptyWeight: 2, totalWeight: 6, grossWeight: 8, grossWeightLimit: 8, itemWeightLimit: 6, weightLimitBound: true, remainingWeight: 0 };
    const ids = detectRisks(plan, box, []).map((risk) => risk.id);
    expect(ids).not.toContain('overweight-gross');
    expect(ids).not.toContain('near-gross');
  });

  it('always exposes the weight breakdown with item, empty, gross and remaining figures', () => {
    const box: Suitcase = { ...suitcase, emptyWeight: 2.5, weightLimit: 9 };
    const plan = { ...basePlan(), emptyWeight: 2.5, totalWeight: 4, grossWeight: 6.5, grossWeightLimit: 9, itemWeightLimit: 6.5, weightLimitBound: true, remainingWeight: 2.5 };
    const breakdown = detectRisks(plan, box, []).find((risk) => risk.id === 'weight-breakdown');
    expect(breakdown?.message).toContain('物品 4.0 kg');
    expect(breakdown?.message).toContain('空箱 2.5 kg');
    expect(breakdown?.message).toContain('整箱总重 6.5 kg');
    expect(breakdown?.message).toContain('剩余 2.5 kg');
  });
});
