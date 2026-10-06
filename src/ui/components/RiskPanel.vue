<script setup lang="ts">
import { computed } from 'vue';
import { formatWeight, planWeightSummary } from '../../core/weight';
import type { PackingPlan, Risk, Suitcase } from '../../core/models';
const props = defineProps<{ risks: Risk[]; plan: PackingPlan; suitcase: Suitcase }>();
const weight = computed(() => planWeightSummary(props.plan, props.suitcase));
</script>

<template>
  <aside class="risk-panel">
    <div class="section-title"><div><span>RISK SCAN</span><h2>装箱风险</h2></div><b>{{ risks.filter(r => r.severity !== 'info').length }}</b></div>
    <div class="weight-board" :class="{ over: weight.boxOverLimit || weight.remainingWeight < 0 }">
      <span data-testid="risk-weight-items"><i>物品重量</i><b>{{ formatWeight(weight.itemWeight) }}</b></span>
      <span data-testid="risk-weight-empty"><i>空箱重量</i><b>{{ formatWeight(weight.emptyWeight) }}</b></span>
      <span data-testid="risk-weight-gross"><i>整箱总重</i><b>{{ formatWeight(weight.grossWeight) }}</b><em>/{{ formatWeight(weight.weightLimit) }} kg</em></span>
      <span data-testid="risk-weight-remaining"><i>剩余量</i><b>{{ formatWeight(weight.remainingWeight) }}</b></span>
      <small>{{ weight.grossLimited ? '整箱总重口径（物品 + 空箱，对比出行总限额）' : '箱体承重口径（仅物品；未填写总重上限）' }}</small>
    </div>
    <article v-for="risk in risks" :key="risk.id" :class="['risk-row', risk.severity]"><i>{{ risk.severity === 'critical' ? '!' : risk.severity === 'warning' ? '△' : '✓' }}</i><div><strong>{{ risk.title }}</strong><p>{{ risk.message }}</p></div></article>
  </aside>
</template>
