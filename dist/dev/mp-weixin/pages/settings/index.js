"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const utils_cloud = require("../../utils/cloud.js");
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
      if (water !== "" && water !== void 0)
        remindWater.value = !!water;
      if (fertilize !== "" && fertilize !== void 0)
        remindFertilize.value = !!fertilize;
      if (overdue !== "" && overdue !== void 0)
        remindOverdue.value = !!overdue;
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
    function handleClearDB() {
      common_vendor.index.showModal({
        title: "危险操作",
        content: "确认要清空所有数据库数据吗？此操作不可恢复！",
        success(res1) {
          if (!res1.confirm)
            return;
          common_vendor.index.showModal({
            title: "再次确认",
            content: "所有用户、家庭、植物、养护记录等数据将被永久删除，确认继续？",
            success(res2) {
              if (!res2.confirm)
                return;
              common_vendor.index.showLoading({ title: "清空中..." });
              utils_cloud.callFunction("clearDB").then((res) => {
                common_vendor.index.hideLoading();
                if (res.code === 0) {
                  common_vendor.index.showToast({ title: "已清空" });
                } else {
                  common_vendor.index.showToast({ title: res.msg || "清空失败", icon: "none" });
                }
              }).catch(() => {
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({ title: "清空失败", icon: "none" });
              });
            }
          });
        }
      });
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
        j: common_vendor.o(handleClearDB, "31"),
        k: common_vendor.o(handleLogout, "a0")
      };
    };
  }
});
wx.createPage(_sfc_main);
