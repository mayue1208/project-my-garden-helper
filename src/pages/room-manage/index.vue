<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import type { IRoom } from '@/interface';

const familyStore = useFamilyStore();
const rooms = ref<IRoom[]>([]);

async function loadRooms() {
  if (!familyStore.currentFamilyId) return;
  const res = await callFunction<IRoom[]>('room', {
    action: 'list',
    familyId: familyStore.currentFamilyId,
  });
  if (res.code === 0) rooms.value = res.data!;
}

function editRoom(room: IRoom) {
  uni.showModal({
    title: '重命名',
    editable: true,
    content: room.name,
    success: async ({ confirm, content }) => {
      if (confirm && content) {
        await callFunction('room', { action: 'rename', roomId: room._id, name: content });
        await loadRooms();
      }
    },
  });
}

function deleteRoom(room: IRoom) {
  uni.showModal({
    title: '确认删除',
    content: `删除房间「${room.name}」，该房间的植物将移至未分类`,
    success: async ({ confirm }) => {
      if (confirm) {
        await callFunction('room', { action: 'delete', roomId: room._id });
        await loadRooms();
      }
    },
  });
}

function addRoom() {
  uni.showModal({
    title: '添加房间',
    editable: true,
    content: '',
    placeholderText: '输入房间名称',
    success: async ({ confirm, content }) => {
      if (confirm && content) {
        await callFunction('room', {
          action: 'create',
          familyId: familyStore.currentFamilyId,
          name: content,
          sortOrder: rooms.value.length,
        });
        await loadRooms();
      }
    },
  });
}

onShow(() => loadRooms());
</script>

<template>
  <view class="page">
    <view class="room-list">
      <view
        v-for="room in rooms"
        :key="room._id"
        class="room-item card"
      >
        <view class="room-info">
          <text class="room-icon">🏠</text>
          <text class="room-name">{{ room.name }}</text>
          <text v-if="room.isDefault" class="default-tag">默认</text>
        </view>
        <view class="actions">
          <text class="action-btn" @tap="editRoom(room)">编辑</text>
          <text
            v-if="!room.isDefault"
            class="action-btn danger"
            @tap="deleteRoom(room)"
          >删除</text>
        </view>
      </view>
    </view>

    <button class="add-btn btn-primary" @tap="addRoom">+ 添加房间</button>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
