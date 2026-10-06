<script setup lang="ts">
import { computed } from 'vue';
import { planWeightSummary, formatWeight } from '../../core/weight';
import type { PackingPlan, PlanMode, Suitcase } from '../../core/models';
const props = defineProps<{ plans: Record<PlanMode, PackingPlan>; selected: PlanMode; suitcase: Suitcase }>();
const emit = defineEmits<{ select: [mode: PlanMode] }>();

const cards = computed(() => (Object.values(props.plans) as PackingPlan[]).map((plan) => ({
  plan,
  weight: planWeightSummary(plan, props.suitcase),
})));
</script>

<template>
  <div class="plan-tabs">
    <button v-for="{ plan, weight } in cards" :key="plan.id" type="button" :data-plan="plan.id" :class="{ active: plan.id === selected }" @click="emit('select', plan.id)">
      <span>{{ plan.id === 'minimal' ? 'LIGHT' : plan.id === 'comfort' ? 'BALANCED' : 'RESERVE' }}</span>
      <strong>{{ plan.name }}</strong>
      <small>{{ plan.placements.length }} 件 · {{ Math.round(plan.capacityRatio * 100) }}% 空间</small>
      <div class="weight-strip" :class="{ over: weight.boxOverLimit || weight.remainingWeight < 0 }">
        <span data-testid="weight-items"><i>物品</i><b>{{ formatWeight(weight.itemWeight) }}</b></span>
        <span data-testid="weight-empty"><i>空箱</i><b>{{ formatWeight(weight.emptyWeight) }}</b></span>
        <span data-testid="weight-gross"><i>整箱</i><b>{{ formatWeight(weight.grossWeight) }}</b><em>/{{ formatWeight(weight.weightLimit) }}</em></span>
        <span data-testid="weight-remaining"><i>剩余</i><b>{{ formatWeight(weight.remainingWeight) }}</b></span>
      </div>
      <small class="weight-unit">单位 kg · {{ weight.grossLimited ? '整箱总重口径（含空箱）' : '箱体承重口径（仅物品）' }}</small>
    </button>
  </div>
</template>
