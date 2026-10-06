<script setup lang="ts">
import type { Suitcase } from '../../core/models';
defineProps<{ suitcase: Suitcase; errors: string[] }>();
const emit = defineEmits<{ update: [patch: Partial<Suitcase>] }>();
</script>

<template>
  <section class="panel suitcase-form">
    <div class="section-title"><div><span>01 / SUITCASE</span><h2>行李箱配置</h2></div><b>内部尺寸</b></div>
    <div class="dimension-grid">
      <label>长度 <span>CM</span><input aria-label="行李箱长度" type="number" min="1" :value="suitcase.length" @input="emit('update', { length: Number(($event.target as HTMLInputElement).value) })" /></label>
      <i>×</i>
      <label>宽度 <span>CM</span><input aria-label="行李箱宽度" type="number" min="1" :value="suitcase.width" @input="emit('update', { width: Number(($event.target as HTMLInputElement).value) })" /></label>
      <i>×</i>
      <label>高度 <span>CM</span><input aria-label="行李箱高度" type="number" min="1" :value="suitcase.height" @input="emit('update', { height: Number(($event.target as HTMLInputElement).value) })" /></label>
    </div>
    <label class="weight-field">最大承重（箱体） <span>{{ suitcase.maxWeight }} kg</span><input type="range" min="1" max="35" step="0.5" :value="suitcase.maxWeight" @input="emit('update', { maxWeight: Number(($event.target as HTMLInputElement).value) })" /></label>
    <div class="weight-input-grid">
      <label>空箱重量 <span>KG · 0 为未称量</span>
        <input aria-label="空箱重量" type="number" min="0" step="0.1" :value="suitcase.emptyWeight" @input="emit('update', { emptyWeight: Number(($event.target as HTMLInputElement).value) })" />
      </label>
      <label>整箱总重上限 <span>KG · 0 为不限</span>
        <input aria-label="整箱总重上限" type="number" min="0" step="0.5" :value="suitcase.grossWeightLimit" @input="emit('update', { grossWeightLimit: Number(($event.target as HTMLInputElement).value) })" />
      </label>
    </div>
    <p class="weight-hint">可用物品重量取「箱体承重」与「总重上限 − 空箱」的较小值；空箱重量为 0 时按未称量的旧数据处理，总重上限留空（0）时只按承重规则。</p>
    <p v-for="error in errors" :key="error" class="field-error">{{ error }}</p>
  </section>
</template>
