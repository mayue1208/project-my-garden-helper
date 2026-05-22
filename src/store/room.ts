import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import type { IRoom } from '@/interface';

export const useRoomStore = defineStore('room', () => {
  const rooms = ref<IRoom[]>([]);
  const loading = ref(false);

  const roomOptions = computed(() => ['全部房间', ...rooms.value.map((r) => r.name)]);

  const roomMap = computed(() => {
    const map: Record<string, IRoom> = {};
    rooms.value.forEach((r) => { map[r._id] = r; });
    return map;
  });

  async function loadRooms() {
    const familyStore = useFamilyStore();
    if (!familyStore.currentFamilyId) return;
    loading.value = true;
    const res = await callFunction<IRoom[]>('room', {
      action: 'list',
      familyId: familyStore.currentFamilyId,
    });
    if (res.code === 0) rooms.value = res.data!;
    loading.value = false;
  }

  async function addRoom(name: string) {
    const familyStore = useFamilyStore();
    const res = await callFunction<IRoom>('room', {
      action: 'create',
      familyId: familyStore.currentFamilyId,
      name,
      sortOrder: rooms.value.length,
    });
    if (res.code === 0) await loadRooms();
    return res;
  }

  async function renameRoom(roomId: string, name: string) {
    const res = await callFunction('room', { action: 'rename', roomId, name });
    if (res.code === 0) await loadRooms();
    return res;
  }

  async function deleteRoom(roomId: string) {
    const res = await callFunction('room', { action: 'delete', roomId });
    if (res.code === 0) await loadRooms();
    return res;
  }

  function clear() {
    rooms.value = [];
  }

  return { rooms, loading, roomOptions, roomMap, loadRooms, addRoom, renameRoom, deleteRoom, clear };
});
