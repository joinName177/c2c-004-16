export type Dimensions = Readonly<{ length: number; width: number; height: number }>;
export type PlanMode = 'minimal' | 'comfort' | 'shopping';
export type RiskSeverity = 'critical' | 'warning' | 'info';

export interface Suitcase extends Dimensions {
  maxWeight: number;
  /** 空箱自重；0 表示未称量（旧数据兼容） */
  emptyWeight: number;
  /** 整箱（含空箱）总重上限；0 表示未填写，只按承重规则 */
  grossWeightLimit: number;
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
  totalWeight: number;
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

/** 归一化行李箱配置：旧数据可能没有空箱重量与整箱总重上限，缺省按 0（未称量/未填写）处理 */
export function normalizeSuitcase(suitcase: Partial<Suitcase> | null | undefined): Suitcase {
  const source = suitcase ?? {};
  const emptyWeight = Number.isFinite(source.emptyWeight) && (source.emptyWeight as number) >= 0 ? source.emptyWeight as number : 0;
  const grossWeightLimit = Number.isFinite(source.grossWeightLimit) && (source.grossWeightLimit as number) >= 0 ? source.grossWeightLimit as number : 0;
  return {
    length: source.length ?? 0,
    width: source.width ?? 0,
    height: source.height ?? 0,
    maxWeight: source.maxWeight ?? 0,
    emptyWeight,
    grossWeightLimit,
  };
}

/** 归一化整个快照，保证核心层始终拿到完整的重量字段 */
export function normalizeSnapshot(snapshot: Partial<PackingSnapshot> | null | undefined): PackingSnapshot {
  const source = snapshot ?? {};
  return {
    suitcase: normalizeSuitcase(source.suitcase),
    items: Array.isArray(source.items) ? source.items : [],
    selectedPlan: source.selectedPlan === 'minimal' || source.selectedPlan === 'shopping' ? source.selectedPlan : 'comfort',
  };
}
