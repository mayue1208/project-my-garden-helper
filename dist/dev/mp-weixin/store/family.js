"use strict";
const common_vendor = require("../common/vendor.js");
const utils_cloud = require("../utils/cloud.js");
const useFamilyStore = common_vendor.defineStore("family", {
  state: () => ({
    families: [],
    currentFamilyId: "",
    currentFamilyName: "",
    members: []
  }),
  getters: {
    currentFamily: (state) => state.families.find((f) => f._id === state.currentFamilyId) || null
  },
  actions: {
    async loadFamilies() {
      const res = await utils_cloud.callFunction("family", { action: "list" });
      if (res.code === 0) {
        this.families = res.data;
        if (!this.currentFamilyId && res.data.length > 0) {
          const adminFamily = res.data.find((f) => f.role === "admin");
          const target = adminFamily || res.data[0];
          this.setCurrentFamily(target._id, target.name);
        }
      }
    },
    setCurrentFamily(id, name) {
      this.currentFamilyId = id;
      this.currentFamilyName = name;
      common_vendor.index.setStorageSync("currentFamilyId", id);
      common_vendor.index.setStorageSync("currentFamilyName", name);
    },
    async createFamily(name) {
      const res = await utils_cloud.callFunction("family", { action: "create", name });
      if (res.code === 0) {
        await this.loadFamilies();
        this.setCurrentFamily(res.data._id, res.data.name);
      }
      return res;
    },
    async joinFamily(inviteCode) {
      const res = await utils_cloud.callFunction("family", { action: "join", inviteCode });
      if (res.code === 0)
        await this.loadFamilies();
      return res;
    },
    async loadMembers(familyId) {
      const res = await utils_cloud.callFunction("family", {
        action: "members",
        familyId
      });
      if (res.code === 0)
        this.members = res.data;
    }
  }
});
exports.useFamilyStore = useFamilyStore;
