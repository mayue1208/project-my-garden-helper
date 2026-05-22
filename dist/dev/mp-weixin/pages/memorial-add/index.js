"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cloud = require("../../utils/cloud.js");
const store_family = require("../../store/family.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const familyStore = store_family.useFamilyStore();
    const submitting = common_vendor.ref(false);
    const plants = common_vendor.ref([]);
    const selectedPlant = common_vendor.ref(null);
    const plantOptions = common_vendor.computed(
      () => plants.value.map((p) => p.nickname || p.name)
    );
    const form = common_vendor.reactive({
      type: "dead",
      date: "",
      reason: "",
      farewell: "",
      recipient: ""
    });
    const typeLabel = common_vendor.ref("已死亡");
    async function loadPlants() {
      const res = await utils_cloud.callFunction("plant", {
        action: "list",
        familyId: familyStore.currentFamilyId
      });
      if (res.code === 0)
        plants.value = res.data;
    }
    function onPlantChange(e) {
      selectedPlant.value = plants.value[e.detail.value];
    }
    function onTypeChange(e) {
      form.type = e.detail.value === 0 ? "dead" : "given";
      typeLabel.value = ["已死亡", "已赠出"][e.detail.value];
    }
    function onDateChange(e) {
      form.date = e.detail.value;
    }
    async function submit() {
      if (submitting.value)
        return;
      if (!selectedPlant.value) {
        common_vendor.index.showToast({ title: "请选择植物", icon: "none" });
        return;
      }
      if (!form.date) {
        common_vendor.index.showToast({ title: "请选择日期", icon: "none" });
        return;
      }
      submitting.value = true;
      common_vendor.index.showLoading({ title: "保存中...", mask: true });
      try {
        await utils_cloud.callFunction("memorial", {
          action: "create",
          plantId: selectedPlant.value._id,
          familyId: familyStore.currentFamilyId,
          data: { ...form, deathDate: form.date }
        });
        common_vendor.index.showToast({ title: "已记录" });
        setTimeout(() => common_vendor.index.navigateBack(), 1500);
      } finally {
        common_vendor.index.hideLoading();
        submitting.value = false;
      }
    }
    common_vendor.onShow(() => loadPlants());
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(selectedPlant.value ? selectedPlant.value.nickname || selectedPlant.value.name : "请选择"),
        b: common_vendor.o(onPlantChange, "c8"),
        c: plantOptions.value,
        d: common_vendor.t(typeLabel.value),
        e: common_vendor.o(onTypeChange, "a9"),
        f: ["已死亡", "已赠出"],
        g: common_vendor.t(form.date || "选择日期"),
        h: common_vendor.o(onDateChange, "f2"),
        i: form.reason,
        j: common_vendor.o(($event) => form.reason = $event.detail.value, "5f"),
        k: form.type === "given"
      }, form.type === "given" ? {
        l: form.recipient,
        m: common_vendor.o(($event) => form.recipient = $event.detail.value, "c7")
      } : {}, {
        n: form.farewell,
        o: common_vendor.o(($event) => form.farewell = $event.detail.value, "db"),
        p: common_vendor.t(submitting.value ? "保存中..." : "确认移入"),
        q: submitting.value,
        r: common_vendor.o(submit, "44")
      });
    };
  }
});
wx.createPage(_sfc_main);
