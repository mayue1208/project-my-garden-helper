"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_constants = require("../../utils/constants.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  props: {
    plant: {}
  },
  setup(__props) {
    const props = __props;
    const statusLabel = common_vendor.computed(() => utils_constants.PLANT_STATUS_LABEL[props.plant.status] || "");
    const waterDays = common_vendor.computed(() => {
      var _a;
      const record = (_a = props.plant.recentRecords) == null ? void 0 : _a.find((r) => r.type === "water");
      if (!record)
        return null;
      const now = /* @__PURE__ */ new Date();
      const recordDate = new Date(record.createdAt);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
      return Math.floor((today.getTime() - recordDay.getTime()) / 864e5);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: _ctx.plant.photo
      }, _ctx.plant.photo ? {
        b: _ctx.plant.photo
      } : {}, {
        c: common_vendor.t(_ctx.plant.nickname || _ctx.plant.name),
        d: common_vendor.t(statusLabel.value),
        e: common_vendor.n(_ctx.plant.status),
        f: common_vendor.t(_ctx.plant.species || ""),
        g: waterDays.value !== null
      }, waterDays.value !== null ? {
        h: common_vendor.t(waterDays.value === 0 ? "今天浇过" : waterDays.value === 1 ? "昨天浇过" : `${waterDays.value}天前`)
      } : {});
    };
  }
});
wx.createComponent(_sfc_main);
