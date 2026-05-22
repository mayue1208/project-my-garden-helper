"use strict";
const common_vendor = require("../common/vendor.js");
const utils_cloud = require("../utils/cloud.js");
const store_family = require("./family.js");
const useRoomStore = common_vendor.defineStore("room", () => {
  const rooms = common_vendor.ref([]);
  const loading = common_vendor.ref(false);
  const roomOptions = common_vendor.computed(() => ["全部房间", ...rooms.value.map((r) => r.name)]);
  const roomMap = common_vendor.computed(() => {
    const map = {};
    rooms.value.forEach((r) => {
      map[r._id] = r;
    });
    return map;
  });
  async function loadRooms() {
    const familyStore = store_family.useFamilyStore();
    if (!familyStore.currentFamilyId)
      return;
    loading.value = true;
    const res = await utils_cloud.callFunction("room", {
      action: "list",
      familyId: familyStore.currentFamilyId
    });
    if (res.code === 0)
      rooms.value = res.data;
    loading.value = false;
  }
  async function addRoom(name) {
    const familyStore = store_family.useFamilyStore();
    const res = await utils_cloud.callFunction("room", {
      action: "create",
      familyId: familyStore.currentFamilyId,
      name,
      sortOrder: rooms.value.length
    });
    if (res.code === 0)
      await loadRooms();
    return res;
  }
  async function renameRoom(roomId, name) {
    const res = await utils_cloud.callFunction("room", { action: "rename", roomId, name });
    if (res.code === 0)
      await loadRooms();
    return res;
  }
  async function deleteRoom(roomId) {
    const res = await utils_cloud.callFunction("room", { action: "delete", roomId });
    if (res.code === 0)
      await loadRooms();
    return res;
  }
  function clear() {
    rooms.value = [];
  }
  return { rooms, loading, roomOptions, roomMap, loadRooms, addRoom, renameRoom, deleteRoom, clear };
});
exports.useRoomStore = useRoomStore;
