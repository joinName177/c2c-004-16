<script setup lang="ts">
import { formatWeight, type PackingPlan, type PlanMode, type Suitcase } from '../../core/models';
defineProps<{ plans: Record<PlanMode, PackingPlan>; selected: PlanMode; suitcase: Suitcase }>();
const emit = defineEmits<{ select: [mode: PlanMode] }>();
</script>

<template>
  <div class="plan-tabs">
    <button v-for="plan in plans" :key="plan.id" type="button" :data-plan="plan.id" :class="{ active: plan.id === selected }" @click="emit('select', plan.id)">
      <span>{{ plan.id === 'minimal' ? 'LIGHT' : plan.id === 'comfort' ? 'BALANCED' : 'RESERVE' }}</span>
      <strong>{{ plan.name }}</strong>
      <small>{{ plan.placements.length }} 件 · {{ Math.round(plan.capacityRatio * 100) }}% 空间</small>
      <small class="weight-line">物品 <b>{{ formatWeight(plan.totalWeight) }}</b> · 空箱 <b>{{ formatWeight(plan.emptyWeight) }}</b></small>
      <small class="weight-line">整箱 <b>{{ formatWeight(plan.grossWeight) }}</b>/{{ formatWeight(plan.grossWeightLimit) }} kg · <b :class="{ over: plan.remainingWeight < 0 }">剩余 {{ formatWeight(plan.remainingWeight) }}</b></small>
    </button>
  </div>
</template>
