"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cloud = require("../../utils/cloud.js");
const store_family = require("../../store/family.js");
const utils_constants = require("../../utils/constants.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const familyStore = store_family.useFamilyStore();
    const submitting = common_vendor.ref(false);
    const plantId = common_vendor.ref("");
    const photos = common_vendor.ref([]);
    const eventType = common_vendor.ref("repot");
    const eventDate = common_vendor.ref((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    const description = common_vendor.ref("");
    const typeLabels = utils_constants.EVENT_TYPES.map((t) => utils_constants.EVENT_TYPE_LABEL[t]);
    const selectedTypeLabel = common_vendor.ref(utils_constants.EVENT_TYPE_LABEL.repot);
    async function chooseImages() {
      const count = 9 - photos.value.length;
      if (count <= 0)
        return;
      const res = await common_vendor.index.chooseImage({ count });
      common_vendor.index.showLoading({ title: "上传中..." });
      for (const path of res.tempFilePaths) {
        const cloudRes = await common_vendor.index.cloud.uploadFile({
          cloudPath: `events/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
          filePath: path
        });
        photos.value.push(cloudRes.fileID);
      }
      common_vendor.index.hideLoading();
    }
    function removePhoto(index) {
      photos.value.splice(index, 1);
    }
    function onTypeChange(e) {
      eventType.value = utils_constants.EVENT_TYPES[e.detail.value];
      selectedTypeLabel.value = typeLabels[e.detail.value];
    }
    function onDateChange(e) {
      eventDate.value = e.detail.value;
    }
    async function submit() {
      if (submitting.value)
        return;
      submitting.value = true;
      common_vendor.index.showLoading({ title: "保存中...", mask: true });
      try {
        await utils_cloud.callFunction("event", {
          action: "create",
          plantId: plantId.value,
          familyId: familyStore.currentFamilyId,
          data: {
            type: eventType.value,
            eventDate: eventDate.value,
            description: description.value,
            photos: photos.value
          }
        });
        common_vendor.index.showToast({ title: "已记录" });
        setTimeout(() => common_vendor.index.navigateBack(), 1500);
      } finally {
        common_vendor.index.hideLoading();
        submitting.value = false;
      }
    }
    common_vendor.onLoad((opt) => {
      plantId.value = opt.plantId;
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(photos.value, (img, i, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => removePhoto(i), i),
            c: i
          };
        }),
        b: photos.value.length < 9
      }, photos.value.length < 9 ? {
        c: common_vendor.o(chooseImages, "36")
      } : {}, {
        d: common_vendor.t(selectedTypeLabel.value),
        e: common_vendor.o(onTypeChange, "58"),
        f: common_vendor.unref(typeLabels),
        g: common_vendor.t(eventDate.value || "今天"),
        h: common_vendor.o(onDateChange, "d0"),
        i: description.value,
        j: common_vendor.o(($event) => description.value = $event.detail.value, "50"),
        k: common_vendor.t(submitting.value ? "保存中..." : "保存"),
        l: submitting.value,
        m: common_vendor.o(submit, "75")
      });
    };
  }
});
wx.createPage(_sfc_main);
