<script setup lang="ts">
import { ref } from 'vue';
import { useFamilyStore } from '@/store/family';
import { useRoomStore } from '@/store/room';

const familyStore = useFamilyStore();
const roomStore = useRoomStore();
const showPicker = ref(false);

function switchFamily(id: string, name: string) {
  familyStore.setCurrentFamily(id, name);
  showPicker.value = false;
  roomStore.loadRooms();
  uni.$emit('familyChanged');
}
</script>

<template>
  <view class="family-switcher">
    <view class="family-trigger" @tap="showPicker = !showPicker">
      <text class="family-name">{{ familyStore.currentFamilyName || '选择家庭' }}</text>
      <text class="arrow">▼</text>
    </view>

    <view v-if="showPicker" class="overlay" @tap="showPicker = false" />
    <view v-if="showPicker" class="picker-list">
      <view
        v-for="f in familyStore.families"
        :key="f._id"
        class="picker-item"
        :class="{ active: f._id === familyStore.currentFamilyId }"
        @tap="switchFamily(f._id, f.name)"
      >
        <text class="item-name">{{ f.name }}</text>
        <text v-if="f._id === familyStore.currentFamilyId" class="check">✓</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
