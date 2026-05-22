<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import FamilySwitcher from '@/components/family-switcher/index.vue';
import type { IMemorial } from '@/interface';
import { useUserStore } from '@/store/user';

const familyStore = useFamilyStore();
const memorials = ref<IMemorial[]>([]);
const stats = ref<{ total: number; lost: number; survived: number } | null>(null);

const deadList = computed(() => memorials.value.filter((m) => m.type === 'dead'));
const givenList = computed(() => memorials.value.filter((m) => m.type === 'given'));

const userStore = useUserStore();

async function loadData() {
  if (!userStore.isLoggedIn) return;
  if (!familyStore.currentFamilyId) return;
  const res = await callFunction<IMemorial[]>('memorial', {
    action: 'list',
    familyId: familyStore.currentFamilyId,
  });
  if (res.code === 0) {
    memorials.value = res.data!;
    stats.value = res.stats;
  }
}

function goAdd() {
  uni.navigateTo({ url: '/pages/memorial-add/index' });
}

function goToProfile() {
  uni.switchTab({ url: '/pages/profile/index' });
}

onShow(() => loadData());
onMounted(() => uni.$on('familyChanged', loadData));
</script>

<template>
  <view class="page">
    <family-switcher />

    <view v-if="!userStore.isLoggedIn" class="empty-state" @tap="goToProfile">
      <text class="empty-icon">👤</text>
      <text>请先登录</text>
      <text class="sub">点击前往个人页授权登录</text>
    </view>

    <template v-if="userStore.isLoggedIn">
      <view v-if="stats" class="stats-bar card">
        <text class="stats-text">
          存活率 {{ stats.survived }}/{{ stats.total }}
          = {{ stats.total > 0 ? Math.round((stats.survived / stats.total) * 100) : 0 }}%
        </text>
      </view>

      <view v-if="memorials.length === 0" class="empty-state">
        <text>还没有植物离开</text>
      </view>

      <view v-if="deadList.length > 0" class="section">
        <text class="section-title">已故 ({{ deadList.length }})</text>
        <view v-for="m in deadList" :key="m._id" class="memorial-card card">
          <image
            v-if="m.plantPhoto"
            :src="m.plantPhoto"
            class="thumb"
            mode="aspectFill"
          />
          <view v-else class="thumb placeholder">🌱</view>
          <view class="info">
            <text class="name">{{ m.plantName }}</text>
            <text class="reason">⚰️ {{ m.reason || '未知原因' }}</text>
            <text v-if="m.farewell" class="farewell">"{{ m.farewell }}"</text>
          </view>
        </view>
      </view>

      <view v-if="givenList.length > 0" class="section">
        <text class="section-title">已赠出 ({{ givenList.length }})</text>
        <view v-for="m in givenList" :key="m._id" class="memorial-card card">
          <image
            v-if="m.plantPhoto"
            :src="m.plantPhoto"
            class="thumb"
            mode="aspectFill"
          />
          <view v-else class="thumb placeholder">🌱</view>
          <view class="info">
            <text class="name">{{ m.plantName }}</text>
            <text class="reason">🎁 赠予 {{ m.recipient || '他人' }}</text>
          </view>
        </view>
      </view>

      <view class="fab" @tap="goAdd">+</view>
    </template>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
