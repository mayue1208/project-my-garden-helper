"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cloud = require("../../utils/cloud.js");
const store_family = require("../../store/family.js");
const utils_constants = require("../../utils/constants.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  props: {
    visible: { type: Boolean }
  },
  emits: ["update:visible"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const familyStore = store_family.useFamilyStore();
    const submitting = common_vendor.ref(false);
    const plants = common_vendor.ref([]);
    const selectedPlant = common_vendor.ref(null);
    const recordType = common_vendor.ref("water");
    const note = common_vendor.ref("");
    async function open() {
      const res = await utils_cloud.callFunction("plant", {
        action: "list",
        familyId: familyStore.currentFamilyId
      });
      if (res.code === 0)
        plants.value = res.data;
    }
    function close() {
      selectedPlant.value = null;
      recordType.value = "water";
      note.value = "";
      emit("update:visible", false);
    }
    common_vendor.watch(() => props.visible, (v) => {
      if (v)
        open();
    });
    function onPlantChange(e) {
      selectedPlant.value = plants.value[e.detail.value];
    }
    async function submit() {
      if (submitting.value)
        return;
      if (!selectedPlant.value) {
        common_vendor.index.showToast({ title: "请选择植物", icon: "none" });
        return;
      }
      submitting.value = true;
      common_vendor.index.showLoading({ title: "记录中...", mask: true });
      try {
        await utils_cloud.callFunction("care", {
          action: "record",
          plantId: selectedPlant.value._id,
          familyId: familyStore.currentFamilyId,
          type: recordType.value,
          note: note.value
        });
        common_vendor.index.showToast({ title: "已记录" });
        close();
      } finally {
        common_vendor.index.hideLoading();
        submitting.value = false;
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: props.visible
      }, props.visible ? {
        b: common_vendor.o(close, "9d")
      } : {}, {
        c: props.visible
      }, props.visible ? {
        d: common_vendor.t(selectedPlant.value ? selectedPlant.value.nickname || selectedPlant.value.name : "请选择"),
        e: common_vendor.o(onPlantChange, "3b"),
        f: plants.value.map((p) => p.nickname || p.name),
        g: common_vendor.f(common_vendor.unref(utils_constants.CARE_TYPES), (ct, k0, i0) => {
          return {
            a: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_ICON)[ct]),
            b: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_LABEL)[ct]),
            c: ct,
            d: recordType.value === ct ? 1 : "",
            e: common_vendor.o(($event) => recordType.value = ct, ct)
          };
        }),
        h: note.value,
        i: common_vendor.o(($event) => note.value = $event.detail.value, "d6"),
        j: common_vendor.o(close, "aa"),
        k: common_vendor.t(submitting.value ? "记录中..." : "记录"),
        l: submitting.value,
        m: common_vendor.o(submit, "9c")
      } : {});
    };
  }
});
wx.createComponent(_sfc_main);
