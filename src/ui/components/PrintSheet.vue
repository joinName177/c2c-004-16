<script setup lang="ts">
import { computed } from 'vue';
import { formatWeight, planWeightSummary } from '../../core/weight';
import type { PackingItem, PackingPlan, Risk, Suitcase } from '../../core/models';
const props = defineProps<{ suitcase: Suitcase; items: PackingItem[]; plan: PackingPlan; risks: Risk[] }>();
const weight = computed(() => planWeightSummary(props.plan, props.suitcase));
</script>

<template>
  <section class="print-sheet">
    <h1>行李箱空间规划单</h1>
    <p>{{ suitcase.length }} × {{ suitcase.width }} × {{ suitcase.height }} cm · 箱体承重 {{ suitcase.maxWeight }} kg · 空箱 {{ formatWeight(weight.emptyWeight) }} kg</p>
    <h2>{{ plan.name }}</h2>
    <table class="print-weight">
      <tbody>
        <tr><td>物品重量</td><td data-testid="print-weight-items">{{ formatWeight(weight.itemWeight) }} kg</td></tr>
        <tr><td>空箱重量</td><td data-testid="print-weight-empty">{{ formatWeight(weight.emptyWeight) }} kg</td></tr>
        <tr><td>整箱总重</td><td data-testid="print-weight-gross">{{ formatWeight(weight.grossWeight) }} / {{ formatWeight(weight.weightLimit) }} kg</td></tr>
        <tr><td>剩余量</td><td data-testid="print-weight-remaining">{{ formatWeight(weight.remainingWeight) }} kg</td></tr>
      </tbody>
    </table>
    <p class="print-weight-note">{{ weight.grossLimited ? '重量按整箱总重口径核对（物品 + 空箱对比出行总限额）；可用物品重量取承重与总重扣除空箱后的较小值。' : '未填写整箱总重上限，仅按箱体承重口径核对物品重量。' }}</p>
    <h3>装箱清单</h3>
    <ol><li v-for="item in items" :key="item.id">{{ plan.placements.some(p => p.itemId === item.id) ? '□' : '×' }} {{ item.name }} — {{ item.weight }} kg</li></ol>
    <h3>风险提示</h3>
    <p v-for="risk in risks" :key="risk.id">{{ risk.title }}：{{ risk.message }}</p>
  </section>
</template>
