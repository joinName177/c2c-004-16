import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import App from '../App.vue';
import { LocalPlannerRepository } from '../../adapters/local-planner.repository';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

function render() {
  let printCount = 0;
  const wrapper = mount(App, { props: {
    repository: new LocalPlannerRepository(new MemoryStorage()),
    printPort: { print: () => { printCount += 1; } },
  } });
  return { wrapper, getPrintCount: () => printCount };
}

describe('Luggage planner App', () => {
  it('renders sample luggage and catches invalid dimensions', async () => {
    const { wrapper } = render();
    expect(wrapper.text()).toContain('行李箱空间规划师');
    expect(wrapper.text()).toContain('轻薄外套');
    await wrapper.get('[aria-label="行李箱长度"]').setValue('0');
    expect(wrapper.text()).toContain('行李箱长度必须大于 0');
  });

  it('adds and deletes an item', async () => {
    const { wrapper } = render();
    await wrapper.get('[aria-label="物品名称"]').setValue('新物品');
    await wrapper.get('[data-testid="item-editor"]').trigger('submit');
    expect(wrapper.text()).toContain('新物品');
    await wrapper.get('[aria-label="删除 新物品"]').trigger('click');
    expect(wrapper.text()).not.toContain('新物品');
  });

  it('selects a plan and highlights the same item in both projections', async () => {
    const { wrapper } = render();
    await wrapper.get('[data-plan="shopping"]').trigger('click');
    expect(wrapper.get('[data-plan="shopping"]').classes()).toContain('active');
    const jacket = wrapper.findAll('[data-item-id="jacket"]');
    expect(jacket.length).toBe(2);
    await jacket[0].trigger('click');
    expect(wrapper.findAll('[data-item-id="jacket"].selected')).toHaveLength(2);
  });

  it('delegates printing through the print port', async () => {
    const { wrapper, getPrintCount } = render();
    await wrapper.get('[data-testid="print-button"]').trigger('click');
    expect(getPrintCount()).toBe(1);
  });

  it('changes every weight figure together when switching plans', async () => {
    const { wrapper } = render();
    await wrapper.get('[data-plan="shopping"]').trigger('click');
    const shoppingRemaining = wrapper.get('[data-plan="shopping"] [data-testid="weight-remaining"] b').text();
    const shoppingGross = wrapper.get('[data-plan="shopping"] [data-testid="weight-gross"] b').text();
    // 风险面板的口径随当前方案联动
    expect(wrapper.get('[data-testid="risk-weight-remaining"] b').text()).toBe(shoppingRemaining);
    expect(wrapper.get('[data-testid="risk-weight-gross"] b').text()).toBe(shoppingGross);

    await wrapper.get('[data-plan="minimal"]').trigger('click');
    const minimalRemaining = wrapper.get('[data-plan="minimal"] [data-testid="weight-remaining"] b').text();
    expect(wrapper.get('[data-testid="risk-weight-remaining"] b').text()).toBe(minimalRemaining);
    // 示例数据下购物版预留更严，装入物品更少，剩余量与精简版不同
    expect(minimalRemaining).not.toBe(shoppingRemaining);
  });

  it('warns that the empty box is over the gross limit even with no packed items', async () => {
    const { wrapper } = render();
    await wrapper.get('[aria-label="空箱重量"]').setValue('9');
    await wrapper.get('[aria-label="整箱总重上限"]').setValue('8');
    await wrapper.get('.primary').trigger('click');
    expect(wrapper.text()).toContain('空箱已超过整箱总重上限');
    expect(wrapper.text()).not.toContain('装载状态良好');
    // 打印单同样展示四类重量
    expect(wrapper.get('[data-testid="print-weight-empty"]').text()).toContain('9.0');
    expect(wrapper.get('[data-testid="print-weight-gross"]').text()).toContain('9.0 / 8.0');
  });
});
