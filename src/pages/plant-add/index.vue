<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { useRoomStore } from '@/store/room';
import { DEFAULT_CARE_INTERVALS, CARE_TYPE_LABEL } from '@/utils/constants';
import type { IPlant, ICareConfig } from '@/interface';

const familyStore = useFamilyStore();
const roomStore = useRoomStore();
const submitting = ref(false);
const loading = ref(false);
const editId = ref('');
const isEdit = ref(false);

const displayCareTypes = ['water', 'fertilize', 'prune', 'repot', 'pesticide'] as const;

function initCareConfigs(): Record<string, { enabled: boolean; intervalDays: number }> {
  const waterSetting = uni.getStorageSync('remindWater');
  const fertilizeSetting = uni.getStorageSync('remindFertilize');
  return {
    water: { enabled: waterSetting !== false, intervalDays: DEFAULT_CARE_INTERVALS.water },
    fertilize: { enabled: fertilizeSetting !== false, intervalDays: DEFAULT_CARE_INTERVALS.fertilize },
    prune: { enabled: false, intervalDays: DEFAULT_CARE_INTERVALS.prune },
    repot: { enabled: false, intervalDays: DEFAULT_CARE_INTERVALS.repot },
    pesticide: { enabled: false, intervalDays: DEFAULT_CARE_INTERVALS.pesticide },
  };
}

const form = reactive({
  name: '',
  species: '',
  photo: '',
  roomId: '',
  roomName: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  note: '',
  careConfigs: initCareConfigs(),
});

async function chooseImage() {
  const res = await uni.chooseImage({ count: 1 });
  const filePath = res.tempFilePaths[0];
  uni.showLoading({ title: '上传中...' });
  const cloudRes = await uni.cloud.uploadFile({
    cloudPath: `plants/${Date.now()}.jpg`,
    filePath,
  });
  form.photo = cloudRes.fileID;
  uni.hideLoading();
}

function onRoomChange(e: any) {
  const room = roomStore.rooms[e.detail.value];
  form.roomId = room._id;
  form.roomName = room.name;
}

function onDateChange(e: any) {
  form.purchaseDate = e.detail.value;
}

function onCareToggle(type: string, e: any) {
  form.careConfigs[type].enabled = e.detail.value;
}

async function submit() {
  if (submitting.value) return;
  if (!form.name) {
    uni.showToast({ title: '请输入植物名称', icon: 'none' });
    return;
  }
  if (!form.roomId) {
    uni.showToast({ title: '请选择房间', icon: 'none' });
    return;
  }

  const configs = Object.entries(form.careConfigs)
    .filter(([, cfg]) => cfg.enabled)
    .map(([type, cfg]) => ({
      type,
      intervalDays: cfg.intervalDays,
    }));

  submitting.value = true;
  uni.showLoading({ title: '保存中...', mask: true });
  try {
    const action = isEdit.value ? 'update' : 'create';
    const params: Record<string, any> = {
      action,
      familyId: familyStore.currentFamilyId,
      data: {
        name: form.name,
        species: form.species,
        photo: form.photo,
        roomId: form.roomId,
        purchaseDate: form.purchaseDate,
        note: form.note,
        careConfigs: configs,
      },
    };
    if (isEdit.value) params.plantId = editId.value;

    const res = await callFunction('plant', params);
    if (res.code === 0) {
      uni.showToast({ title: isEdit.value ? '修改成功' : '添加成功' });
      setTimeout(() => uni.navigateBack(), 1500);
    } else {
      uni.showToast({ title: res.msg || '保存失败', icon: 'none' });
    }
  } catch (e: any) {
    const msg = e?.errMsg || e?.message || JSON.stringify(e);
    uni.showToast({ title: '调用失败: ' + msg, icon: 'none', duration: 4000 });
  } finally {
    uni.hideLoading();
    submitting.value = false;
  }
}

async function loadPlantData() {
  loading.value = true;
  uni.showLoading({ title: '加载中...' });
  try {
    const [plantRes, configRes] = await Promise.all([
      callFunction<IPlant>('plant', { action: 'get', plantId: editId.value }),
      callFunction<ICareConfig[]>('care', { action: 'getConfigs', plantId: editId.value }),
    ]);
    if (plantRes.code === 0 && plantRes.data) {
      const p = plantRes.data;
      form.name = p.name || '';
      form.species = p.species || '';
      form.photo = p.photo || '';
      form.roomId = p.roomId || '';
      form.purchaseDate = p.purchaseDate || '';
      form.note = p.note || '';
      if (p.roomId && roomStore.rooms.length > 0) {
        const room = roomStore.rooms.find((r) => r._id === p.roomId);
        if (room) form.roomName = room.name;
      }
    }
    if (configRes.code === 0 && configRes.data) {
      for (const cfg of configRes.data) {
        if (form.careConfigs[cfg.type]) {
          form.careConfigs[cfg.type].enabled = cfg.enabled;
          form.careConfigs[cfg.type].intervalDays = cfg.intervalDays;
        }
      }
    }
  } catch (e: any) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    uni.hideLoading();
    loading.value = false;
  }
}

onLoad((opt) => {
  if (opt?.id) {
    editId.value = opt.id as string;
    isEdit.value = true;
    uni.setNavigationBarTitle({ title: '修改植物' });
  }
});

onShow(async () => {
  if (!familyStore.currentFamilyId) return;
  if (roomStore.rooms.length === 0) await roomStore.loadRooms();
  if (isEdit.value && !form.name && editId.value) {
    loadPlantData();
  }
});
</script>

<template>
  <view class="page">
    <view class="form card">
      <!-- 照片上传 -->
      <view class="photo-upload" @tap="chooseImage">
        <image v-if="form.photo" :src="form.photo" class="preview" mode="aspectFill" />
        <view v-else class="placeholder">
          <text class="plus">+</text>
          <text class="hint">添加照片</text>
        </view>
      </view>

      <view class="field">
        <text class="label">名称 *</text>
        <input v-model="form.name" placeholder="植物名称" class="input" maxlength="20" />
      </view>
      <view class="field">
        <text class="label">品种</text>
        <input v-model="form.species" placeholder="如：龟背竹" class="input" />
      </view>
      <view class="field">
        <text class="label">房间</text>
        <picker @change="onRoomChange" :range="roomStore.rooms.map((r) => r.name)">
          <text class="value-text">{{ form.roomName || '选择房间' }}</text>
        </picker>
      </view>
      <view class="field">
        <text class="label">购入日期</text>
        <picker mode="date" @change="onDateChange">
          <text class="value-text">{{ form.purchaseDate || '选择日期' }}</text>
        </picker>
      </view>
    </view>

    <view class="section-title">养护周期（选填，可后续修改）</view>
    <view class="care-configs card">
      <view
        v-for="ct in displayCareTypes"
        :key="ct"
        class="care-config-item"
      >
        <view class="care-label-row">
          <switch
            :checked="form.careConfigs[ct].enabled"
            @change="onCareToggle(ct, $event)"
            color="#07c160"
          />
          <text class="care-label">{{ CARE_TYPE_LABEL[ct] }}</text>
        </view>
        <view class="care-input-group">
          <text>每</text>
          <input
            v-model.number="form.careConfigs[ct].intervalDays"
            type="number"
            class="num-input"
          />
          <text>天</text>
        </view>
      </view>
    </view>

    <view class="field card note-field">
      <textarea
        v-model="form.note"
        placeholder="备注（选填）"
        class="note-input"
        maxlength="200"
      />
    </view>

    <button class="submit-btn btn-primary" :disabled="submitting" @tap="submit">
      {{ submitting ? '保存中...' : (isEdit ? '更新' : '保存') }}
    </button>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
