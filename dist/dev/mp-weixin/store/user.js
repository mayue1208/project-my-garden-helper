"use strict";
const common_vendor = require("../common/vendor.js");
const utils_cloud = require("../utils/cloud.js");
const store_family = require("./family.js");
const store_room = require("./room.js");
const useUserStore = common_vendor.defineStore("user", {
  state: () => ({
    userInfo: null,
    isLoggedIn: false,
    ready: false
  }),
  actions: {
    async checkLogin() {
      try {
        const { result } = await common_vendor.index.cloud.callFunction({ name: "login", data: { action: "check" } });
        if (result && result.code === 0) {
          this.userInfo = result.data;
          this.isLoggedIn = true;
        }
      } catch (_e) {
      }
      this.ready = true;
    },
    async login(nickName, avatarUrl) {
      const res = await utils_cloud.callFunction("login", { nickName, avatarUrl });
      if (res.code === 0) {
        this.userInfo = res.data;
        this.isLoggedIn = true;
      }
      return res;
    },
    async updateProfile(nickName, avatarUrl) {
      const res = await utils_cloud.callFunction("login", {
        action: "updateProfile",
        nickName,
        avatarUrl
      });
      if (res.code === 0 && res.data) {
        this.userInfo = res.data;
      }
      return res;
    },
    logout() {
      this.userInfo = null;
      this.isLoggedIn = false;
      this.ready = false;
      const familyStore = store_family.useFamilyStore();
      familyStore.$reset();
      common_vendor.index.removeStorageSync("currentFamilyId");
      common_vendor.index.removeStorageSync("currentFamilyName");
      const roomStore = store_room.useRoomStore();
      roomStore.clear();
    }
  }
});
exports.useUserStore = useUserStore;
