<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import type { IPlant } from '@/interface';

const familyStore = useFamilyStore();
const submitting = ref(false);
const plants = ref<IPlant[]>([]);
const selectedPlant = ref<IPlant | null>(null);

const plantOptions = computed(() =>
  plants.value.map((p) => p.nickname || p.name),
);

const form = reactive({
  type: 'dead',
  date: '',
  reason: '',
  farewell: '',
  recipient: '',
});
const typeLabel = ref('已死亡');

async function loadPlants() {
  const res = await callFunction<IPlant[]>('plant', {
    action: 'list',
    familyId: familyStore.currentFamilyId,
  });
  if (res.code === 0) plants.value = res.data!;
}

function onPlantChange(e: any) {
  selectedPlant.value = plants.value[e.detail.value];
}

function onTypeChange(e: any) {
  form.type = e.detail.value === 0 ? 'dead' : 'given';
  typeLabel.value = ['已死亡', '已赠出'][e.detail.value];
}

function onDateChange(e: any) {
  form.date = e.detail.value;
}

async function submit() {
  if (submitting.value) return;
  if (!selectedPlant.value) {
    uni.showToast({ title: '请选择植物', icon: 'none' });
    return;
  }
  if (!form.date) {
    uni.showToast({ title: '请选择日期', icon: 'none' });
    return;
  }

  submitting.value = true;
  uni.showLoading({ title: '保存中...', mask: true });
  try {
    await callFunction('memorial', {
      action: 'create',
      plantId: selectedPlant.value._id,
      familyId: familyStore.currentFamilyId,
      data: { ...form, deathDate: form.date },
    });
    uni.showToast({ title: '已记录' });
    setTimeout(() => uni.navigateBack(), 1500);
  } finally {
    uni.hideLoading();
    submitting.value = false;
  }
}

onShow(() => loadPlants());
</script>

<template>
  <view class="page">
    <view class="form card">
      <view class="field">
        <text class="label">选择植物</text>
        <picker @change="onPlantChange" :range="plantOptions">
          <text class="value-text">{{
            selectedPlant
              ? selectedPlant.nickname || selectedPlant.name
              : '请选择'
          }}</text>
        </picker>
      </view>

      <view class="field">
        <text class="label">类型</text>
        <picker @change="onTypeChange" :range="['已死亡', '已赠出']">
          <text class="value-text">{{ typeLabel }}</text>
        </picker>
      </view>

      <view class="field">
        <text class="label">日期</text>
        <picker mode="date" @change="onDateChange">
          <text class="value-text">{{ form.date || '选择日期' }}</text>
        </picker>
      </view>

      <view class="field">
        <text class="label">原因</text>
        <input
          v-model="form.reason"
          placeholder="如：浇水过多烂根"
          class="input"
          maxlength="100"
        />
      </view>

      <view v-if="form.type === 'given'" class="field">
        <text class="label">赠予</text>
        <input
          v-model="form.recipient"
          placeholder="赠予对象"
          class="input"
          maxlength="20"
        />
      </view>

      <view class="field textarea-field">
        <textarea
          v-model="form.farewell"
          placeholder="告别语（选填）"
          class="farewell-input"
          maxlength="200"
        />
      </view>
    </view>

    <button class="submit-btn" :disabled="submitting" @tap="submit">
      {{ submitting ? '保存中...' : '确认移入' }}
    </button>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
