<script setup lang="ts">
import { formatWeight, type PackingItem, type PackingPlan, type Risk, type Suitcase } from '../../core/models';
defineProps<{ suitcase: Suitcase; items: PackingItem[]; plan: PackingPlan; risks: Risk[] }>();
</script>

<template><section class="print-sheet"><h1>行李箱空间规划单</h1>
  <p>{{ suitcase.length }} × {{ suitcase.width }} × {{ suitcase.height }} cm · 箱体承重 {{ formatWeight(suitcase.maxWeight) }} kg{{ suitcase.weightLimit > 0 ? ` · 整箱总重上限 ${formatWeight(suitcase.weightLimit)} kg` : '' }}</p>
  <h2>{{ plan.name }}</h2>
  <h3>重量核算</h3>
  <table class="print-weight">
    <tbody>
      <tr><td>物品重量</td><td>{{ formatWeight(plan.totalWeight) }} kg</td></tr>
      <tr><td>空箱重量</td><td>{{ formatWeight(plan.emptyWeight) }} kg</td></tr>
      <tr><td>整箱总重</td><td>{{ formatWeight(plan.grossWeight) }} / {{ formatWeight(plan.grossWeightLimit) }} kg</td></tr>
      <tr><td>剩余重量</td><td>{{ formatWeight(plan.remainingWeight) }} kg</td></tr>
    </tbody>
  </table>
  <h3>装箱清单</h3>
  <ol><li v-for="item in items" :key="item.id">{{ plan.placements.some(p => p.itemId === item.id) ? '□' : '×' }} {{ item.name }} — {{ item.weight }} kg</li></ol>
  <h3>风险提示</h3><p v-for="risk in risks" :key="risk.id">{{ risk.title }}：{{ risk.message }}</p></section></template>
