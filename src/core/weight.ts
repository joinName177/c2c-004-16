import type { PackingPlan, Suitcase } from './models';

/**
 * 重量口径：
 * - 空箱重量（emptyWeight）为 0 时表示未称量的旧数据。
 * - 整箱总重上限（grossWeightLimit）为 0 时表示未填写，此时只按箱体承重规则。
 * - 装箱可用的物品重量 = 箱体承重与「总重上限扣除空箱」中的较小值。
 * - 恰好达到上限允许装入（边界用 > 判定）。
 */

/** 空箱重量，非有限数或缺省时按 0（未称量）处理 */
export function emptyWeightOf(suitcase: Pick<Suitcase, 'emptyWeight'>): number {
  return Number.isFinite(suitcase.emptyWeight) && suitcase.emptyWeight > 0 ? suitcase.emptyWeight : 0;
}

/** 是否填写了整箱总重上限 */
export function hasGrossLimit(suitcase: Pick<Suitcase, 'grossWeightLimit'>): boolean {
  return Number.isFinite(suitcase.grossWeightLimit) && suitcase.grossWeightLimit > 0;
}

/**
 * 可装入物品的有效重量上限（硬限额，不含方案预留系数）。
 * 未填写总重上限时就是箱体承重；填写后取承重与（总重上限 − 空箱）的较小值，
 * 可能为 0 甚至负数（空箱本身已超限）。
 */
export function effectivePayload(suitcase: Suitcase): number {
  const payload = suitcase.maxWeight;
  if (!hasGrossLimit(suitcase)) return payload;
  return Math.min(payload, suitcase.grossWeightLimit - emptyWeightOf(suitcase));
}

/** 空箱本身已超过整箱总重上限：此时移除全部物品也不允许显示安全 */
export function boxExceedsGrossLimit(suitcase: Suitcase): boolean {
  return hasGrossLimit(suitcase) && emptyWeightOf(suitcase) > suitcase.grossWeightLimit;
}

/** 用于展示与风险判定的重量汇总，随方案切换整体变化 */
export interface PackWeightSummary {
  /** 已装物品重量 */
  itemWeight: number;
  /** 空箱重量（0 表示未称量） */
  emptyWeight: number;
  /** 整箱总重 = 物品 + 空箱 */
  grossWeight: number;
  /** 整箱总重口径的限额；未填写总重上限时回退为箱体承重 */
  weightLimit: number;
  /** 是否按整箱总重口径计算（未填写总重上限时为 false） */
  grossLimited: boolean;
  /** 剩余量：限额 − 整箱总重（总重口径）或承重 − 物品重量（承重口径），可为负 */
  remainingWeight: number;
  /** 空箱本身已超限 */
  boxOverLimit: boolean;
}

export function planWeightSummary(plan: Pick<PackingPlan, 'totalWeight'>, suitcase: Suitcase): PackWeightSummary {
  const emptyWeight = emptyWeightOf(suitcase);
  const grossLimited = hasGrossLimit(suitcase);
  const weightLimit = grossLimited ? suitcase.grossWeightLimit : suitcase.maxWeight;
  const grossWeight = plan.totalWeight + emptyWeight;
  return {
    itemWeight: plan.totalWeight,
    emptyWeight,
    grossWeight,
    weightLimit,
    grossLimited,
    remainingWeight: grossLimited ? weightLimit - grossWeight : suitcase.maxWeight - plan.totalWeight,
    boxOverLimit: boxExceedsGrossLimit(suitcase),
  };
}

/** 重量展示：保留一位小数 */
export function formatWeight(value: number): string {
  return value.toFixed(1);
}
