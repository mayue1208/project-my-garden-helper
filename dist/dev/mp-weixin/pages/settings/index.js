"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
require("../../utils/cloud.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = store_user.useUserStore();
    const remindTime = common_vendor.ref("09:00");
    const remindWater = common_vendor.ref(true);
    const remindFertilize = common_vendor.ref(true);
    const remindOverdue = common_vendor.ref(true);
    function initSettings() {
      const water = common_vendor.index.getStorageSync("remindWater");
      const fertilize = common_vendor.index.getStorageSync("remindFertilize");
      const overdue = common_vendor.index.getStorageSync("remindOverdue");
      const savedTime = common_vendor.index.getStorageSync("remindTime");
      if (water !== "" && water !== void 0)
        remindWater.value = !!water;
      if (fertilize !== "" && fertilize !== void 0)
        remindFertilize.value = !!fertilize;
      if (overdue !== "" && overdue !== void 0)
        remindOverdue.value = !!overdue;
      if (savedTime)
        remindTime.value = savedTime;
    }
    initSettings();
    function onTimeChange(e) {
      remindTime.value = e.detail.value;
      common_vendor.index.setStorageSync("remindTime", remindTime.value);
      common_vendor.index.showToast({ title: "已设置" });
    }
    function onRemindWaterChange(e) {
      remindWater.value = e.detail.value;
      common_vendor.index.setStorageSync("remindWater", remindWater.value);
    }
    function onRemindFertilizeChange(e) {
      remindFertilize.value = e.detail.value;
      common_vendor.index.setStorageSync("remindFertilize", remindFertilize.value);
    }
    function onRemindOverdueChange(e) {
      remindOverdue.value = e.detail.value;
      common_vendor.index.setStorageSync("remindOverdue", remindOverdue.value);
    }
    function handleLogout() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success(res) {
          if (res.confirm) {
            userStore.logout();
            common_vendor.index.showToast({ title: "已退出" });
            setTimeout(() => {
              common_vendor.index.reLaunch({ url: "/pages/home/index" });
            }, 1e3);
          }
        }
      });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(remindTime.value),
        b: remindTime.value,
        c: common_vendor.o(onTimeChange, "14"),
        d: remindWater.value,
        e: common_vendor.o(onRemindWaterChange, "b6"),
        f: remindFertilize.value,
        g: common_vendor.o(onRemindFertilizeChange, "0b"),
        h: remindOverdue.value,
        i: common_vendor.o(onRemindOverdueChange, "b1"),
        j: common_vendor.o(handleLogout, "6d")
      };
    };
  }
});
wx.createPage(_sfc_main);
