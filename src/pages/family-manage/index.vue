<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { useRoomStore } from '@/store/room';
import type { IFamily, IFamilyMember } from '@/interface';

const familyStore = useFamilyStore();
const roomStore = useRoomStore();
const submitting = ref(false);
const activeFamilyId = ref('');
const family = ref<IFamily | null>(null);
const members = ref<IFamilyMember[]>([]);
const isAdmin = computed(() => family.value?.role === 'admin');

const families = computed(() => familyStore.families);

async function loadAllData(familyId: string) {
  family.value = families.value.find((f) => f._id === familyId) || null;
  if (!familyId) return;

  const memberRes = await callFunction<IFamilyMember[]>('family', { action: 'members', familyId });
  if (memberRes.code === 0) members.value = memberRes.data!;
  roomStore.loadRooms();
}

function switchFamily(id: string) {
  activeFamilyId.value = id;
  loadAllData(id);
}

async function renameFamily() {
  if (submitting.value || !isAdmin.value || !family.value) return;
  uni.showModal({
    title: '修改家庭名',
    editable: true,
    content: family.value.name,
    success: async ({ confirm, content }) => {
      if (confirm && content) {
        submitting.value = true;
        uni.showLoading({ title: '保存中...', mask: true });
        try {
          const res = await callFunction('family', {
            action: 'rename',
            familyId: activeFamilyId.value,
            name: content,
          });
          if (res.code === 0) {
            uni.showToast({ title: '已修改' });
            await familyStore.loadFamilies();
            family.value = families.value.find((f) => f._id === activeFamilyId.value) || null;
          } else {
            uni.showToast({ title: res.msg || '修改失败', icon: 'none' });
          }
        } finally {
          uni.hideLoading();
          submitting.value = false;
        }
      }
    },
  });
}

function copyCode() {
  if (!family.value) return;
  uni.setClipboardData({ data: family.value.inviteCode });
  uni.showToast({ title: '已复制' });
}

async function addRoom() {
  if (submitting.value) return;
  uni.showModal({
    title: '添加房间',
    editable: true,
    content: '',
    placeholderText: '输入房间名称',
    success: async ({ confirm, content }) => {
      if (confirm && content) {
        submitting.value = true;
        uni.showLoading({ title: '添加中...', mask: true });
        try {
          const res = await roomStore.addRoom(content);
          if (res.code === 0) {
            uni.showToast({ title: '已添加' });
          }
        } finally {
          uni.hideLoading();
          submitting.value = false;
        }
      }
    },
  });
}

async function renameRoom(roomId: string, oldName: string) {
  if (submitting.value) return;
  uni.showModal({
    title: '修改房间名',
    editable: true,
    content: oldName,
    success: async ({ confirm, content }) => {
      if (confirm && content) {
        submitting.value = true;
        uni.showLoading({ title: '保存中...', mask: true });
        try {
          const res = await roomStore.renameRoom(roomId, content);
          if (res.code === 0) {
            uni.showToast({ title: '已修改' });
          } else {
            uni.showToast({ title: '修改失败', icon: 'none' });
          }
        } finally {
          uni.hideLoading();
          submitting.value = false;
        }
      }
    },
  });
}

async function deleteRoom(roomId: string, roomName: string) {
  if (submitting.value) return;
  if (roomStore.rooms.length <= 1) {
    uni.showToast({ title: '至少保留一个房间', icon: 'none' });
    return;
  }
  uni.showModal({
    title: '确认删除',
    content: `删除房间「${roomName}」，该房间的植物将移至未分类`,
    success: async ({ confirm }) => {
      if (confirm) {
        submitting.value = true;
        uni.showLoading({ title: '删除中...', mask: true });
        try {
          const res = await roomStore.deleteRoom(roomId);
          if (res.code === 0) {
            uni.showToast({ title: '已删除' });
          }
        } finally {
          uni.hideLoading();
          submitting.value = false;
        }
      }
    },
  });
}

function goMemberDetail(userId: string) {
  uni.navigateTo({
    url: `/pages/member-detail/index?familyId=${activeFamilyId.value}&userId=${userId}`,
  });
}

onLoad((options: any) => {
  const fid = options?.familyId || familyStore.currentFamilyId;
  activeFamilyId.value = fid;
  loadAllData(fid);
});

onShow(async () => {
  await familyStore.loadFamilies();
  family.value = families.value.find((f) => f._id === activeFamilyId.value) || null;
  if (activeFamilyId.value) loadAllData(activeFamilyId.value);
});
</script>

<template>
  <view class="page">
    <!-- 家庭 Tab 切换栏 -->
    <scroll-view v-if="families.length > 1" scroll-x class="family-tabs">
      <view
        v-for="f in families"
        :key="f._id"
        class="tab-item"
        :class="{ active: f._id === activeFamilyId }"
        @tap="switchFamily(f._id)"
      >
        <text class="tab-text">{{ f.name }}</text>
      </view>
    </scroll-view>

    <!-- 家庭信息 -->
    <view class="section card">
      <view class="field">
        <text class="label">家庭名</text>
        <text class="value">{{ family?.name }}</text>
        <text v-if="isAdmin" class="edit-link" @tap="renameFamily">修改</text>
      </view>
      <view class="field">
        <text class="label">邀请码</text>
        <text class="value">{{ family?.inviteCode }}</text>
        <text class="edit-link" @tap="copyCode">复制</text>
      </view>
    </view>

    <!-- 家人 -->
    <view class="section card">
      <text class="section-title">家人 ({{ members.length }})</text>
      <view v-for="m in members" :key="m._id" class="member-item">
        <view class="member-avatar-circle">
          <text class="avatar-text">{{ m.userInfo?.nickName?.[0] || '?' }}</text>
        </view>
        <view class="member-info">
          <text class="member-name">{{ m.userInfo?.nickName || '未知' }}</text>
          <text class="member-role">{{ m.role === 'admin' ? '管理员' : '成员' }}</text>
        </view>
        <text class="view-link" @tap="goMemberDetail(m.userId)">查看→</text>
      </view>
      <view v-if="members.length === 0" class="empty-hint">
        暂无成员
      </view>
    </view>

    <!-- 房间管理 -->
    <view class="section card">
      <text class="section-title">房间管理 ({{ roomStore.rooms.length }})</text>
      <view v-for="room in roomStore.rooms" :key="room._id" class="room-item">
        <view class="room-info">
          <text class="room-icon">🏠</text>
          <text class="room-name">{{ room.name }}</text>
          <text v-if="room.isDefault" class="default-tag">默认</text>
        </view>
        <view class="room-actions">
          <text class="edit-link" @tap="renameRoom(room._id, room.name)">修改</text>
          <text class="delete-link" @tap="deleteRoom(room._id, room.name)">删除</text>
        </view>
      </view>
      <view v-if="roomStore.rooms.length === 0" class="empty-hint">
        暂无房间
      </view>
      <view class="add-room-btn" @tap="addRoom">
        <text>+ 添加房间</text>
      </view>
    </view>

  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
