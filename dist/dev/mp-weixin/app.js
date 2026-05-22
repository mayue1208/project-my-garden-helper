"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const store_user = require("./store/user.js");
const store_family = require("./store/family.js");
const store_room = require("./store/room.js");
if (!Math) {
  "./pages/home/index.js";
  "./pages/plant-detail/index.js";
  "./pages/plant-add/index.js";
  "./pages/reminder/index.js";
  "./pages/memorial/index.js";
  "./pages/memorial-add/index.js";
  "./pages/profile/index.js";
  "./pages/family-manage/index.js";
  "./pages/member-detail/index.js";
  "./pages/timeline/index.js";
  "./pages/event-add/index.js";
  "./pages/room-manage/index.js";
  "./pages/settings/index.js";
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "App",
  setup(__props) {
    const appReady = common_vendor.ref(false);
    common_vendor.onLaunch(async () => {
      const userStore = store_user.useUserStore();
      await userStore.checkLogin();
      if (userStore.isLoggedIn) {
        const familyStore = store_family.useFamilyStore();
        await familyStore.loadFamilies();
        if (familyStore.currentFamilyId) {
          const roomStore = store_room.useRoomStore();
          await roomStore.loadRooms();
        }
      }
      appReady.value = true;
      common_vendor.index.$emit("appReady");
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !appReady.value
      }, !appReady.value ? {} : {});
    };
  }
});
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  app.use(common_vendor.createPinia());
  return { app };
}
createApp().app.mount("#app");
exports.createApp = createApp;
