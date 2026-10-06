import { createSampleSnapshot } from '../core/sample-data';
import type { PackingSnapshot } from '../core/models';
import type { LoadResult, PlannerRepository } from '../ports/planner-repository.port';

const KEY = 'c2c-004.planner';

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** 兼容旧快照：未称量空箱重量与未填写总重上限一律按 0 处理 */
function normalize(snapshot: PackingSnapshot): PackingSnapshot {
  const suitcase = { ...snapshot.suitcase };
  suitcase.emptyWeight = Math.max(0, finiteNumber(suitcase.emptyWeight) ?? 0);
  suitcase.weightLimit = Math.max(0, finiteNumber(suitcase.weightLimit) ?? 0);
  return { ...snapshot, suitcase };
}

export class LocalPlannerRepository implements PlannerRepository {
  constructor(private readonly storage: Storage) {}

  load(): LoadResult<PackingSnapshot> {
    const raw = this.storage.getItem(KEY);
    if (!raw) return { value: createSampleSnapshot() };
    try {
      return { value: normalize(JSON.parse(raw) as PackingSnapshot) };
    } catch {
      return { value: createSampleSnapshot(), warning: '本地数据无法读取，已恢复示例。' };
    }
  }

  save(snapshot: PackingSnapshot): void {
    this.storage.setItem(KEY, JSON.stringify(snapshot));
  }
}
