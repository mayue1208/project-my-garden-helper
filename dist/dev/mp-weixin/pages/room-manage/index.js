"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cloud = require("../../utils/cloud.js");
const store_family = require("../../store/family.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const familyStore = store_family.useFamilyStore();
    const rooms = common_vendor.ref([]);
    async function loadRooms() {
      if (!familyStore.currentFamilyId)
        return;
      const res = await utils_cloud.callFunction("room", {
        action: "list",
        familyId: familyStore.currentFamilyId
      });
      if (res.code === 0)
        rooms.value = res.data;
    }
    function editRoom(room) {
      common_vendor.index.showModal({
        title: "重命名",
        editable: true,
        content: room.name,
        success: async ({ confirm, content }) => {
          if (confirm && content) {
            await utils_cloud.callFunction("room", { action: "rename", roomId: room._id, name: content });
            await loadRooms();
          }
        }
      });
    }
    function deleteRoom(room) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: `删除房间「${room.name}」，该房间的植物将移至未分类`,
        success: async ({ confirm }) => {
          if (confirm) {
            await utils_cloud.callFunction("room", { action: "delete", roomId: room._id });
            await loadRooms();
          }
        }
      });
    }
    function addRoom() {
      common_vendor.index.showModal({
        title: "添加房间",
        editable: true,
        content: "",
        placeholderText: "输入房间名称",
        success: async ({ confirm, content }) => {
          if (confirm && content) {
            await utils_cloud.callFunction("room", {
              action: "create",
              familyId: familyStore.currentFamilyId,
              name: content,
              sortOrder: rooms.value.length
            });
            await loadRooms();
          }
        }
      });
    }
    common_vendor.onShow(() => loadRooms());
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(rooms.value, (room, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(room.name),
            b: room.isDefault
          }, room.isDefault ? {} : {}, {
            c: common_vendor.o(($event) => editRoom(room), room._id),
            d: !room.isDefault
          }, !room.isDefault ? {
            e: common_vendor.o(($event) => deleteRoom(room), room._id)
          } : {}, {
            f: room._id
          });
        }),
        b: common_vendor.o(addRoom, "05")
      };
    };
  }
});
wx.createPage(_sfc_main);
