import { rotationsOf } from './geometry';
import { formatWeight, weightCeilings, type PackingItem, type PackingPlan, type Risk, type Suitcase } from './models';

export function detectRisks(plan: PackingPlan, suitcase: Suitcase, items: PackingItem[]): Risk[] {
  const risks: Risk[] = [];
  const byId = new Map(items.map((item) => [item.id, item]));
  const emptyWeight = suitcase.emptyWeight || 0;
  const ceilings = weightCeilings(suitcase, 1);
  const itemWeightLimit = plan.itemWeightLimit ?? ceilings.itemWeightLimit;
  const grossWeightLimit = plan.grossWeightLimit ?? ceilings.grossWeightLimit;
  const weightLimitBound = plan.weightLimitBound ?? ceilings.weightLimitBound;
  const grossWeight = plan.grossWeight ?? plan.totalWeight + emptyWeight;

  // 空箱自身已超过整箱总重上限：物理事实，移除物品无法消除，必须最先提示
  const boxOverLimit = suitcase.weightLimit > 0 && emptyWeight > suitcase.weightLimit;
  if (boxOverLimit) {
    risks.push({
      id: 'box-over-limit',
      severity: 'critical',
      title: '箱体超限',
      message: `空箱重量 ${formatWeight(emptyWeight)} kg 已超过整箱总重上限 ${formatWeight(suitcase.weightLimit)} kg，即使不装任何物品也无法合规出行，请更换更轻的箱体或确认限额。`,
    });
  } else if (suitcase.weightLimit > 0 && grossWeight > grossWeightLimit) {
    risks.push({
      id: 'overweight-gross',
      severity: 'critical',
      title: '整箱总重超限',
      message: `整箱总重 ${formatWeight(grossWeight)} kg，超出 ${formatWeight(grossWeight - grossWeightLimit)} kg（上限 ${formatWeight(grossWeightLimit)} kg），请移除重物。`,
    });
  }

  if (!weightLimitBound && plan.totalWeight > itemWeightLimit) {
    risks.push({ id: 'overweight', severity: 'critical', title: '行李超重', message: `物品重量超出承重 ${formatWeight(plan.totalWeight - itemWeightLimit)} kg，请移除重物。` });
  } else if (!weightLimitBound && plan.totalWeight < itemWeightLimit && plan.totalWeight / itemWeightLimit > 0.9) {
    risks.push({ id: 'near-weight', severity: 'warning', title: '接近承重上限', message: '建议预留至少 10% 承重余量。' });
  }
  if (suitcase.weightLimit > 0 && !boxOverLimit && grossWeight < grossWeightLimit && grossWeight / grossWeightLimit > 0.9) {
    risks.push({ id: 'near-gross', severity: 'warning', title: '接近整箱总重上限', message: '建议预留至少 10% 的整箱总重余量，避免出行时超重。' });
  }
  if (plan.capacityRatio > 0.9) risks.push({ id: 'high-volume', severity: 'warning', title: '空间接近满载', message: '空间利用率超过 90%，返程新增物品可能无法装入。' });

  for (const { item } of plan.unplaced) {
    const oversized = rotationsOf(item).every((d) => d.length > suitcase.length || d.width > suitcase.width || d.height > suitcase.height);
    if (oversized) risks.push({ id: `oversized-${item.id}`, severity: 'critical', title: `${item.name} 尺寸越界`, message: '任意旋转方向都无法放入当前行李箱。', itemId: item.id });
    if (item.mustHave) risks.push({ id: `missing-${item.id}`, severity: 'critical', title: `必需品未装入：${item.name}`, message: '请调整清单或改用更大行李箱。', itemId: item.id });
  }

  for (const placement of plan.placements) {
    const item = byId.get(placement.itemId);
    if (!item) continue;
    if (item.weight >= suitcase.maxWeight * 0.25 && placement.z > suitcase.height * 0.5) {
      risks.push({ id: `high-${item.id}`, severity: 'warning', title: `${item.name} 重心偏高`, message: '将重物移到箱体底部，降低翻倒和挤压风险。', itemId: item.id });
    }
    if (item.fragile) {
      const hasLoadAbove = plan.placements.some((other) => other.itemId !== item.id
        && other.z >= placement.z + placement.dimensions.height
        && other.x < placement.x + placement.dimensions.length && other.x + other.dimensions.length > placement.x
        && other.y < placement.y + placement.dimensions.width && other.y + other.dimensions.width > placement.y);
      if (hasLoadAbove) risks.push({ id: `fragile-${item.id}`, severity: 'warning', title: `${item.name} 受到上方挤压`, message: '请移到上层或增加缓冲保护。', itemId: item.id });
    }
  }

  const remaining = plan.remainingWeight ?? grossWeightLimit - grossWeight;
  risks.push({
    id: 'weight-breakdown',
    severity: 'info',
    title: '重量明细',
    message: `物品 ${formatWeight(plan.totalWeight)} kg · 空箱 ${formatWeight(emptyWeight)} kg · 整箱总重 ${formatWeight(grossWeight)} kg · 剩余 ${formatWeight(remaining)} kg（${suitcase.weightLimit > 0 ? '整箱总重口径' : '承重口径'} ${formatWeight(grossWeightLimit)} kg）`,
  });
  if (!risks.some((risk) => risk.severity !== 'info')) risks.push({ id: 'all-clear', severity: 'info', title: '装载状态良好', message: '重量、空间和摆放风险均在合理范围内。' });
  return risks;
}
