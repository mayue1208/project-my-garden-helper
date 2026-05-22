"use strict";
const common_vendor = require("../../common/vendor.js");
const store_family = require("../../store/family.js");
const store_room = require("../../store/room.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const familyStore = store_family.useFamilyStore();
    const roomStore = store_room.useRoomStore();
    const showPicker = common_vendor.ref(false);
    function switchFamily(id, name) {
      familyStore.setCurrentFamily(id, name);
      showPicker.value = false;
      roomStore.loadRooms();
      common_vendor.index.$emit("familyChanged");
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(common_vendor.unref(familyStore).currentFamilyName || "选择家庭"),
        b: common_vendor.o(($event) => showPicker.value = !showPicker.value, "a3"),
        c: showPicker.value
      }, showPicker.value ? {
        d: common_vendor.o(($event) => showPicker.value = false, "4c")
      } : {}, {
        e: showPicker.value
      }, showPicker.value ? {
        f: common_vendor.f(common_vendor.unref(familyStore).families, (f, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(f.name),
            b: f._id === common_vendor.unref(familyStore).currentFamilyId
          }, f._id === common_vendor.unref(familyStore).currentFamilyId ? {} : {}, {
            c: f._id,
            d: f._id === common_vendor.unref(familyStore).currentFamilyId ? 1 : "",
            e: common_vendor.o(($event) => switchFamily(f._id, f.name), f._id)
          });
        })
      } : {});
    };
  }
});
wx.createComponent(_sfc_main);
