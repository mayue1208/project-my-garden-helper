"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cloud = require("../../utils/cloud.js");
const store_family = require("../../store/family.js");
const store_room = require("../../store/room.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const familyStore = store_family.useFamilyStore();
    const roomStore = store_room.useRoomStore();
    const submitting = common_vendor.ref(false);
    const activeFamilyId = common_vendor.ref("");
    const family = common_vendor.ref(null);
    const members = common_vendor.ref([]);
    const isAdmin = common_vendor.computed(() => {
      var _a;
      return ((_a = family.value) == null ? void 0 : _a.role) === "admin";
    });
    const families = common_vendor.computed(() => familyStore.families);
    async function loadAllData(familyId) {
      family.value = families.value.find((f) => f._id === familyId) || null;
      if (!familyId)
        return;
      const memberRes = await utils_cloud.callFunction("family", { action: "members", familyId });
      if (memberRes.code === 0)
        members.value = memberRes.data;
      roomStore.loadRooms();
    }
    function switchFamily(id) {
      activeFamilyId.value = id;
      loadAllData(id);
    }
    async function renameFamily() {
      if (submitting.value || !isAdmin.value || !family.value)
        return;
      common_vendor.index.showModal({
        title: "修改家庭名",
        editable: true,
        content: family.value.name,
        success: async ({ confirm, content }) => {
          if (confirm && content) {
            submitting.value = true;
            common_vendor.index.showLoading({ title: "保存中...", mask: true });
            try {
              const res = await utils_cloud.callFunction("family", {
                action: "rename",
                familyId: activeFamilyId.value,
                name: content
              });
              if (res.code === 0) {
                common_vendor.index.showToast({ title: "已修改" });
                await familyStore.loadFamilies();
                family.value = families.value.find((f) => f._id === activeFamilyId.value) || null;
              } else {
                common_vendor.index.showToast({ title: res.msg || "修改失败", icon: "none" });
              }
            } finally {
              common_vendor.index.hideLoading();
              submitting.value = false;
            }
          }
        }
      });
    }
    function copyCode() {
      if (!family.value)
        return;
      common_vendor.index.setClipboardData({ data: family.value.inviteCode });
      common_vendor.index.showToast({ title: "已复制" });
    }
    async function addRoom() {
      if (submitting.value)
        return;
      common_vendor.index.showModal({
        title: "添加房间",
        editable: true,
        content: "",
        placeholderText: "输入房间名称",
        success: async ({ confirm, content }) => {
          if (confirm && content) {
            submitting.value = true;
            common_vendor.index.showLoading({ title: "添加中...", mask: true });
            try {
              const res = await roomStore.addRoom(content);
              if (res.code === 0) {
                common_vendor.index.showToast({ title: "已添加" });
              }
            } finally {
              common_vendor.index.hideLoading();
              submitting.value = false;
            }
          }
        }
      });
    }
    async function renameRoom(roomId, oldName) {
      if (submitting.value)
        return;
      common_vendor.index.showModal({
        title: "修改房间名",
        editable: true,
        content: oldName,
        success: async ({ confirm, content }) => {
          if (confirm && content) {
            submitting.value = true;
            common_vendor.index.showLoading({ title: "保存中...", mask: true });
            try {
              const res = await roomStore.renameRoom(roomId, content);
              if (res.code === 0) {
                common_vendor.index.showToast({ title: "已修改" });
              } else {
                common_vendor.index.showToast({ title: "修改失败", icon: "none" });
              }
            } finally {
              common_vendor.index.hideLoading();
              submitting.value = false;
            }
          }
        }
      });
    }
    async function deleteRoom(roomId, roomName) {
      if (submitting.value)
        return;
      if (roomStore.rooms.length <= 1) {
        common_vendor.index.showToast({ title: "至少保留一个房间", icon: "none" });
        return;
      }
      common_vendor.index.showModal({
        title: "确认删除",
        content: `删除房间「${roomName}」，该房间的植物将移至未分类`,
        success: async ({ confirm }) => {
          if (confirm) {
            submitting.value = true;
            common_vendor.index.showLoading({ title: "删除中...", mask: true });
            try {
              const res = await roomStore.deleteRoom(roomId);
              if (res.code === 0) {
                common_vendor.index.showToast({ title: "已删除" });
              }
            } finally {
              common_vendor.index.hideLoading();
              submitting.value = false;
            }
          }
        }
      });
    }
    function goMemberDetail(userId) {
      common_vendor.index.navigateTo({
        url: `/pages/member-detail/index?familyId=${activeFamilyId.value}&userId=${userId}`
      });
    }
    common_vendor.onLoad((options) => {
      const fid = (options == null ? void 0 : options.familyId) || familyStore.currentFamilyId;
      activeFamilyId.value = fid;
      loadAllData(fid);
    });
    common_vendor.onShow(async () => {
      await familyStore.loadFamilies();
      family.value = families.value.find((f) => f._id === activeFamilyId.value) || null;
      if (activeFamilyId.value)
        loadAllData(activeFamilyId.value);
    });
    return (_ctx, _cache) => {
      var _a, _b;
      return common_vendor.e({
        a: families.value.length > 1
      }, families.value.length > 1 ? {
        b: common_vendor.f(families.value, (f, k0, i0) => {
          return {
            a: common_vendor.t(f.name),
            b: f._id,
            c: f._id === activeFamilyId.value ? 1 : "",
            d: common_vendor.o(($event) => switchFamily(f._id), f._id)
          };
        })
      } : {}, {
        c: common_vendor.t((_a = family.value) == null ? void 0 : _a.name),
        d: isAdmin.value
      }, isAdmin.value ? {
        e: common_vendor.o(renameFamily, "0a")
      } : {}, {
        f: common_vendor.t((_b = family.value) == null ? void 0 : _b.inviteCode),
        g: common_vendor.o(copyCode, "b1"),
        h: common_vendor.t(members.value.length),
        i: common_vendor.f(members.value, (m, k0, i0) => {
          var _a2, _b2, _c;
          return {
            a: common_vendor.t(((_b2 = (_a2 = m.userInfo) == null ? void 0 : _a2.nickName) == null ? void 0 : _b2[0]) || "?"),
            b: common_vendor.t(((_c = m.userInfo) == null ? void 0 : _c.nickName) || "未知"),
            c: common_vendor.t(m.role === "admin" ? "管理员" : "成员"),
            d: common_vendor.o(($event) => goMemberDetail(m.userId), m._id),
            e: m._id
          };
        }),
        j: members.value.length === 0
      }, members.value.length === 0 ? {} : {}, {
        k: common_vendor.t(common_vendor.unref(roomStore).rooms.length),
        l: common_vendor.f(common_vendor.unref(roomStore).rooms, (room, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(room.name),
            b: room.isDefault
          }, room.isDefault ? {} : {}, {
            c: common_vendor.o(($event) => renameRoom(room._id, room.name), room._id),
            d: common_vendor.o(($event) => deleteRoom(room._id, room.name), room._id),
            e: room._id
          });
        }),
        m: common_vendor.unref(roomStore).rooms.length === 0
      }, common_vendor.unref(roomStore).rooms.length === 0 ? {} : {}, {
        n: common_vendor.o(addRoom, "03")
      });
    };
  }
});
wx.createPage(_sfc_main);
