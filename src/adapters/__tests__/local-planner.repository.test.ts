import { beforeEach, describe, expect, it } from 'vitest';
import { LocalPlannerRepository } from '../local-planner.repository';
import { createSampleSnapshot } from '../../core/sample-data';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

describe('LocalPlannerRepository', () => {
  const storage = new MemoryStorage();
  beforeEach(() => storage.clear());

  it('round trips a planning snapshot', () => {
    const repo = new LocalPlannerRepository(storage);
    const sample = createSampleSnapshot();
    const snapshot = { ...sample, suitcase: { ...sample.suitcase, length: 61 } };
    repo.save(snapshot);
    expect(repo.load().value.suitcase.length).toBe(61);
  });

  it('returns sample data when storage is empty', () => {
    const result = new LocalPlannerRepository(storage).load();
    expect(result.value.items.length).toBeGreaterThan(0);
    expect(result.warning).toBeUndefined();
  });

  it('returns sample data and a warning for malformed JSON', () => {
    storage.setItem('c2c-004.planner', '{bad');
    const result = new LocalPlannerRepository(storage).load();
    expect(result.value.items.length).toBeGreaterThan(0);
    expect(result.warning).toContain('已恢复示例');
  });

  it('migrates legacy snapshots without empty weight and gross limit fields', () => {
    storage.setItem('c2c-004.planner', JSON.stringify({
      suitcase: { length: 40, width: 25, height: 20, maxWeight: 8 },
      items: [],
      selectedPlan: 'minimal',
    }));
    const result = new LocalPlannerRepository(storage).load();
    expect(result.value.suitcase.length).toBe(40);
    expect(result.value.suitcase.emptyWeight).toBe(0);
    expect(result.value.suitcase.grossWeightLimit).toBe(0);
    expect(result.value.selectedPlan).toBe('minimal');
  });
});
