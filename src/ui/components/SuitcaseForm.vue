<script setup lang="ts">
import type { Suitcase } from '../../core/models';
defineProps<{ suitcase: Suitcase; errors: string[] }>();
const emit = defineEmits<{ update: [patch: Partial<Suitcase>] }>();

const numberValue = (event: Event) => Number((event.target as HTMLInputElement).value);
</script>

<template>
  <section class="panel suitcase-form">
    <div class="section-title"><div><span>01 / SUITCASE</span><h2>行李箱配置</h2></div><b>内部尺寸</b></div>
    <div class="dimension-grid">
      <label>长度 <span>CM</span><input aria-label="行李箱长度" type="number" min="1" :value="suitcase.length" @input="emit('update', { length: numberValue($event) })" /></label>
      <i>×</i>
      <label>宽度 <span>CM</span><input aria-label="行李箱宽度" type="number" min="1" :value="suitcase.width" @input="emit('update', { width: numberValue($event) })" /></label>
      <i>×</i>
      <label>高度 <span>CM</span><input aria-label="行李箱高度" type="number" min="1" :value="suitcase.height" @input="emit('update', { height: numberValue($event) })" /></label>
    </div>
    <label class="weight-field">最大承重 <span>{{ suitcase.maxWeight }} kg</span><input type="range" min="1" max="35" step="0.5" :value="suitcase.maxWeight" @input="emit('update', { maxWeight: numberValue($event) })" /></label>
    <div class="weight-grid">
      <label>空箱重量 <span>KG</span><input aria-label="空箱重量" type="number" min="0" step="0.1" :value="suitcase.emptyWeight" @input="emit('update', { emptyWeight: numberValue($event) })" /></label>
      <label>整箱总重上限 <span>KG · 选填</span><input aria-label="整箱总重上限" type="number" min="0" step="0.1" placeholder="未填写" :value="suitcase.weightLimit || ''" @input="emit('update', { weightLimit: numberValue($event) })" /></label>
    </div>
    <p class="field-hint">空箱重量填 0 表示未称量；整箱总重上限留空时仅按最大承重判断。</p>
    <p v-for="error in errors" :key="error" class="field-error">{{ error }}</p>
  </section>
</template>
