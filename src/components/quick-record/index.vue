<script setup lang="ts">
import { ref, watch } from 'vue';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { CARE_TYPES, CARE_TYPE_LABEL, CARE_TYPE_ICON } from '@/utils/constants';
import type { IPlant, CareType } from '@/interface';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>();

const familyStore = useFamilyStore();
const submitting = ref(false);
const plants = ref<IPlant[]>([]);
const selectedPlant = ref<IPlant | null>(null);
const recordType = ref<CareType>('water');
const note = ref('');

async function open() {
  const res = await callFunction<IPlant[]>('plant', {
    action: 'list',
    familyId: familyStore.currentFamilyId,
  });
  if (res.code === 0) plants.value = res.data!;
}

function close() {
  selectedPlant.value = null;
  recordType.value = 'water';
  note.value = '';
  emit('update:visible', false);
}

watch(() => props.visible, (v) => {
  if (v) open();
});

function onPlantChange(e: any) {
  selectedPlant.value = plants.value[e.detail.value];
}

async function submit() {
  if (submitting.value) return;
  if (!selectedPlant.value) {
    uni.showToast({ title: '请选择植物', icon: 'none' });
    return;
  }
  submitting.value = true;
  uni.showLoading({ title: '记录中...', mask: true });
  try {
    await callFunction('care', {
      action: 'record',
      plantId: selectedPlant.value._id,
      familyId: familyStore.currentFamilyId,
      type: recordType.value,
      note: note.value,
    });
    uni.showToast({ title: '已记录' });
    close();
  } finally {
    uni.hideLoading();
    submitting.value = false;
  }
}
</script>

<template>
  <view>
    <view v-if="props.visible" class="overlay" @tap="close" />
    <view v-if="props.visible" class="record-panel">
      <text class="title">快速记录</text>

      <view class="field">
        <text class="label">植物</text>
        <picker
          @change="onPlantChange"
          :range="plants.map((p) => p.nickname || p.name)"
        >
          <text class="value-text">{{
            selectedPlant
              ? selectedPlant.nickname || selectedPlant.name
              : '请选择'
          }}</text>
        </picker>
      </view>

      <view class="type-selector">
        <view
          v-for="ct in CARE_TYPES"
          :key="ct"
          class="type-btn"
          :class="{ active: recordType === ct }"
          @tap="recordType = ct"
        >
          <text>{{ CARE_TYPE_ICON[ct] }} {{ CARE_TYPE_LABEL[ct] }}</text>
        </view>
      </view>

      <view class="field">
        <textarea
          v-model="note"
          placeholder="备注（选填）"
          class="note-input"
        />
      </view>

      <view class="btn-row">
        <button class="cancel-btn" @tap="close">取消</button>
        <button class="submit-btn" :disabled="submitting" @tap="submit">
          {{ submitting ? '记录中...' : '记录' }}
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
