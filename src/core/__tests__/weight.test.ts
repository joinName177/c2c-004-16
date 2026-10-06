import { describe, expect, it } from 'vitest';
import { effectivePayload, emptyWeightOf, hasGrossLimit, boxExceedsGrossLimit, planWeightSummary } from '../weight';
import type { PackingPlan, Suitcase } from '../models';

const suitcase = (overrides: Partial<Suitcase> = {}): Suitcase => ({
  length: 52, width: 35, height: 23, maxWeight: 10, emptyWeight: 0, grossWeightLimit: 0, ...overrides,
});
const plan = (totalWeight: number): Pick<PackingPlan, 'totalWeight'> => ({ totalWeight });

describe('emptyWeightOf', () => {
  it('treats missing, zero or invalid empty weight as 0 (unweighed legacy data)', () => {
    expect(emptyWeightOf({} as Suitcase)).toBe(0);
    expect(emptyWeightOf(suitcase({ emptyWeight: 0 }))).toBe(0);
    expect(emptyWeightOf({ emptyWeight: Number.NaN } as Suitcase)).toBe(0);
    expect(emptyWeightOf(suitcase({ emptyWeight: 2.7 }))).toBe(2.7);
  });
});

describe('hasGrossLimit', () => {
  it('is false when the gross limit is absent or 0 (load-bearing rule only)', () => {
    expect(hasGrossLimit(suitcase())).toBe(false);
    expect(hasGrossLimit(suitcase({ grossWeightLimit: 0 }))).toBe(false);
    expect(hasGrossLimit(suitcase({ grossWeightLimit: 8 }))).toBe(true);
  });
});

describe('effectivePayload', () => {
  it('equals the suitcase load-bearing capacity without a gross limit', () => {
    expect(effectivePayload(suitcase({ maxWeight: 12 }))).toBe(12);
  });

  it('takes the smaller of load-bearing capacity and gross limit minus empty weight', () => {
    // 总重 7.5 − 空箱 2.7 = 4.8 < 承重 10
    expect(effectivePayload(suitcase({ maxWeight: 10, emptyWeight: 2.7, grossWeightLimit: 7.5 }))).toBeCloseTo(4.8);
    // 承重 4 更小
    expect(effectivePayload(suitcase({ maxWeight: 4, emptyWeight: 2.7, grossWeightLimit: 7.5 }))).toBe(4);
    // 空箱重量为 0（未称量）时按总重上限本身计算
    expect(effectivePayload(suitcase({ maxWeight: 10, emptyWeight: 0, grossWeightLimit: 8 }))).toBe(8);
  });

  it('goes negative when the empty box alone already exceeds the gross limit', () => {
    expect(effectivePayload(suitcase({ maxWeight: 10, emptyWeight: 9, grossWeightLimit: 8 }))).toBe(-1);
  });
});

describe('boxExceedsGrossLimit', () => {
  it('flags the empty box only when it strictly exceeds the gross limit', () => {
    expect(boxExceedsGrossLimit(suitcase({ emptyWeight: 8, grossWeightLimit: 8 }))).toBe(false);
    expect(boxExceedsGrossLimit(suitcase({ emptyWeight: 8.1, grossWeightLimit: 8 }))).toBe(true);
    expect(boxExceedsGrossLimit(suitcase({ emptyWeight: 30 }))).toBe(false);
  });
});

describe('planWeightSummary', () => {
  it('sums item and empty weight into gross weight and derives the remaining allowance', () => {
    const summary = planWeightSummary(plan(3), suitcase({ maxWeight: 10, emptyWeight: 2.7, grossWeightLimit: 7.5 }));
    expect(summary.itemWeight).toBe(3);
    expect(summary.emptyWeight).toBe(2.7);
    expect(summary.grossWeight).toBeCloseTo(5.7);
    expect(summary.weightLimit).toBe(7.5);
    expect(summary.grossLimited).toBe(true);
    expect(summary.remainingWeight).toBeCloseTo(1.8);
    expect(summary.boxOverLimit).toBe(false);
  });

  it('falls back to the load-bearing rule when no gross limit is set', () => {
    const summary = planWeightSummary(plan(3), suitcase({ maxWeight: 10, emptyWeight: 2.7 }));
    expect(summary.grossLimited).toBe(false);
    expect(summary.weightLimit).toBe(10);
    expect(summary.grossWeight).toBeCloseTo(5.7);
    // 承重口径下剩余量只按物品重量计算
    expect(summary.remainingWeight).toBe(7);
  });

  it('allows weight exactly at the limit (zero remaining is not an overflow)', () => {
    const atLimit = planWeightSummary(plan(4.8), suitcase({ maxWeight: 10, emptyWeight: 2.7, grossWeightLimit: 7.5 }));
    expect(atLimit.remainingWeight).toBeCloseTo(0);
    expect(atLimit.boxOverLimit).toBe(false);
  });

  it('reports negative remaining and box-over-limit for an over-limit empty box', () => {
    const summary = planWeightSummary(plan(0), suitcase({ maxWeight: 10, emptyWeight: 9, grossWeightLimit: 8 }));
    expect(summary.boxOverLimit).toBe(true);
    expect(summary.remainingWeight).toBe(-1);
  });
});
