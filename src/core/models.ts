export type Dimensions = Readonly<{ length: number; width: number; height: number }>;
export type PlanMode = 'minimal' | 'comfort' | 'shopping';
export type RiskSeverity = 'critical' | 'warning' | 'info';

export interface Suitcase extends Dimensions {
  maxWeight: number;
  /** 空箱自重；0 表示旧数据未称量 */
  emptyWeight: number;
  /** 整箱总重上限（出行限额）；0 表示未填写，仅按承重规则 */
  weightLimit: number;
}

export interface PackingItem extends Dimensions {
  id: string;
  name: string;
  category: string;
  weight: number;
  priority: 1 | 2 | 3;
  mustHave: boolean;
  fragile?: boolean;
}

export interface Placement {
  itemId: string;
  x: number;
  y: number;
  z: number;
  dimensions: Dimensions;
}

export interface PackingPlan {
  id: PlanMode;
  name: string;
  placements: Placement[];
  unplaced: Array<{ item: PackingItem; reason: string }>;
  /** 已装物品重量 */
  totalWeight: number;
  /** 空箱自重 */
  emptyWeight: number;
  /** 整箱总重（物品 + 空箱） */
  grossWeight: number;
  /** 本方案物品重量口径（承重预留与总重扣空箱后的较小值） */
  itemWeightLimit: number;
  /** 本方案整箱总重口径 */
  grossWeightLimit: number;
  /** 是否由整箱总重上限决定物品口径 */
  weightLimitBound: boolean;
  /** 相对整箱总重口径的剩余量 */
  remainingWeight: number;
  usedVolume: number;
  capacityRatio: number;
}

export interface Risk {
  id: string;
  severity: RiskSeverity;
  title: string;
  message: string;
  itemId?: string;
}

export interface PackingSnapshot {
  suitcase: Suitcase;
  items: PackingItem[];
  selectedPlan: PlanMode;
}

export function itemVolume(item: Dimensions): number {
  return item.length * item.width * item.height;
}

export function suitcaseVolume(suitcase: Dimensions): number {
  return suitcase.length * suitcase.width * suitcase.height;
}

/** 某一方案预留系数下的重量口径：承重口径与整箱总重口径（未填写总重上限时仅按承重） */
export interface WeightCeilings {
  /** 物品重量上限：承重预留与总重扣空箱后的较小值 */
  itemWeightLimit: number;
  /** 整箱总重上限（含空箱） */
  grossWeightLimit: number;
  /** 物品口径是否由整箱总重上限决定 */
  weightLimitBound: boolean;
}

export function weightCeilings(suitcase: Suitcase, reserve: number): WeightCeilings {
  const bearing = suitcase.maxWeight * reserve;
  const empty = suitcase.emptyWeight || 0;
  if (suitcase.weightLimit > 0) {
    const grossLimit = suitcase.weightLimit * reserve;
    const fromTotal = grossLimit - empty;
    if (fromTotal < bearing) {
      return { itemWeightLimit: fromTotal, grossWeightLimit: grossLimit, weightLimitBound: true };
    }
  }
  return { itemWeightLimit: bearing, grossWeightLimit: bearing + empty, weightLimitBound: false };
}

/** 重量展示统一保留一位小数 */
export function formatWeight(value: number): string {
  return value.toFixed(1);
}
