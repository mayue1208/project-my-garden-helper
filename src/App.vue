<script setup lang="ts">
import { ref } from 'vue';
import { onLaunch } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';
import { useFamilyStore } from '@/store/family';
import { useRoomStore } from '@/store/room';

const appReady = ref(false);

onLaunch(async () => {
  const userStore = useUserStore();
  await userStore.checkLogin();
  if (userStore.isLoggedIn) {
    const familyStore = useFamilyStore();
    await familyStore.loadFamilies();
    if (familyStore.currentFamilyId) {
      const roomStore = useRoomStore();
      await roomStore.loadRooms();
    }
  }
  appReady.value = true;
  uni.$emit('appReady');
});
</script>

<template>
  <view v-if="!appReady" class="loading-page">
    <text>加载中...</text>
  </view>
</template>

<style lang="scss">
@import '@/styles/global.scss';

.loading-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>
