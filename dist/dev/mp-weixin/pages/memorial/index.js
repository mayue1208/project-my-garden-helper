"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cloud = require("../../utils/cloud.js");
const store_family = require("../../store/family.js");
const store_user = require("../../store/user.js");
if (!Math) {
  FamilySwitcher();
}
const FamilySwitcher = () => "../../components/family-switcher/index.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const familyStore = store_family.useFamilyStore();
    const memorials = common_vendor.ref([]);
    const stats = common_vendor.ref(null);
    const deadList = common_vendor.computed(() => memorials.value.filter((m) => m.type === "dead"));
    const givenList = common_vendor.computed(() => memorials.value.filter((m) => m.type === "given"));
    const userStore = store_user.useUserStore();
    async function loadData() {
      if (!userStore.isLoggedIn)
        return;
      if (!familyStore.currentFamilyId)
        return;
      const res = await utils_cloud.callFunction("memorial", {
        action: "list",
        familyId: familyStore.currentFamilyId
      });
      if (res.code === 0) {
        memorials.value = res.data;
        stats.value = res.stats;
      }
    }
    function goAdd() {
      common_vendor.index.navigateTo({ url: "/pages/memorial-add/index" });
    }
    function goToProfile() {
      common_vendor.index.switchTab({ url: "/pages/profile/index" });
    }
    common_vendor.onShow(() => loadData());
    common_vendor.onMounted(() => common_vendor.index.$on("familyChanged", loadData));
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !common_vendor.unref(userStore).isLoggedIn
      }, !common_vendor.unref(userStore).isLoggedIn ? {
        b: common_vendor.o(goToProfile, "8b")
      } : {}, {
        c: common_vendor.unref(userStore).isLoggedIn
      }, common_vendor.unref(userStore).isLoggedIn ? common_vendor.e({
        d: stats.value
      }, stats.value ? {
        e: common_vendor.t(stats.value.survived),
        f: common_vendor.t(stats.value.total),
        g: common_vendor.t(stats.value.total > 0 ? Math.round(stats.value.survived / stats.value.total * 100) : 0)
      } : {}, {
        h: memorials.value.length === 0
      }, memorials.value.length === 0 ? {} : {}, {
        i: deadList.value.length > 0
      }, deadList.value.length > 0 ? {
        j: common_vendor.t(deadList.value.length),
        k: common_vendor.f(deadList.value, (m, k0, i0) => {
          return common_vendor.e({
            a: m.plantPhoto
          }, m.plantPhoto ? {
            b: m.plantPhoto
          } : {}, {
            c: common_vendor.t(m.plantName),
            d: common_vendor.t(m.reason || "未知原因"),
            e: m.farewell
          }, m.farewell ? {
            f: common_vendor.t(m.farewell)
          } : {}, {
            g: m._id
          });
        })
      } : {}, {
        l: givenList.value.length > 0
      }, givenList.value.length > 0 ? {
        m: common_vendor.t(givenList.value.length),
        n: common_vendor.f(givenList.value, (m, k0, i0) => {
          return common_vendor.e({
            a: m.plantPhoto
          }, m.plantPhoto ? {
            b: m.plantPhoto
          } : {}, {
            c: common_vendor.t(m.plantName),
            d: common_vendor.t(m.recipient || "他人"),
            e: m._id
          });
        })
      } : {}, {
        o: common_vendor.o(goAdd, "0c")
      }) : {});
    };
  }
});
wx.createPage(_sfc_main);
