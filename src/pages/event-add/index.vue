<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { EVENT_TYPE_LABEL, EVENT_TYPES } from '@/utils/constants';
import type { EventType } from '@/utils/constants';

const familyStore = useFamilyStore();
const submitting = ref(false);
const plantId = ref('');
const photos = ref<string[]>([]);
const eventType = ref<EventType>('repot');
const eventDate = ref(new Date().toISOString().split('T')[0]);
const description = ref('');

const typeLabels = EVENT_TYPES.map((t) => EVENT_TYPE_LABEL[t]);
const selectedTypeLabel = ref(EVENT_TYPE_LABEL.repot);

async function chooseImages() {
  const count = 9 - photos.value.length;
  if (count <= 0) return;
  const res = await uni.chooseImage({ count });
  uni.showLoading({ title: '上传中...' });

  for (const path of res.tempFilePaths) {
    const cloudRes = await uni.cloud.uploadFile({
      cloudPath: `events/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
      filePath: path,
    });
    photos.value.push(cloudRes.fileID);
  }
  uni.hideLoading();
}

function removePhoto(index: number) {
  photos.value.splice(index, 1);
}

function onTypeChange(e: any) {
  eventType.value = EVENT_TYPES[e.detail.value] as EventType;
  selectedTypeLabel.value = typeLabels[e.detail.value];
}

function onDateChange(e: any) {
  eventDate.value = e.detail.value;
}

async function submit() {
  if (submitting.value) return;
  submitting.value = true;
  uni.showLoading({ title: '保存中...', mask: true });
  try {
    await callFunction('event', {
      action: 'create',
      plantId: plantId.value,
      familyId: familyStore.currentFamilyId,
      data: {
        type: eventType.value,
        eventDate: eventDate.value,
        description: description.value,
        photos: photos.value,
      },
    });
    uni.showToast({ title: '已记录' });
    setTimeout(() => uni.navigateBack(), 1500);
  } finally {
    uni.hideLoading();
    submitting.value = false;
  }
}

onLoad((opt) => {
  plantId.value = opt!.plantId as string;
});
</script>

<template>
  <view class="page">
    <view class="form card">
      <view class="photo-section">
        <text class="form-label">照片</text>
        <view class="photo-grid">
          <view
            v-for="(img, i) in photos"
            :key="i"
            class="photo-item"
          >
            <image :src="img" mode="aspectFill" />
            <text class="del-btn" @tap="removePhoto(i)">✕</text>
          </view>
          <view
            v-if="photos.length < 9"
            class="add-photo"
            @tap="chooseImages"
          >
            <text class="plus">+</text>
          </view>
        </view>
      </view>

      <view class="field">
        <text class="form-label">事件类型</text>
        <picker @change="onTypeChange" :range="typeLabels">
          <text class="value-text">{{ selectedTypeLabel }}</text>
        </picker>
      </view>

      <view class="field">
        <text class="form-label">日期</text>
        <picker mode="date" @change="onDateChange">
          <text class="value-text">{{ eventDate || '今天' }}</text>
        </picker>
      </view>

      <view class="field textarea-field">
        <textarea
          v-model="description"
          placeholder="描述一下（选填）"
          class="desc-input"
          maxlength="200"
        />
      </view>
    </view>

    <button class="submit-btn btn-primary" :disabled="submitting" @tap="submit">
      {{ submitting ? '保存中...' : '保存' }}
    </button>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
