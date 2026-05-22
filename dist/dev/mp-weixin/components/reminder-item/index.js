"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_date = require("../../utils/date.js");
const utils_constants = require("../../utils/constants.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  props: {
    item: {}
  },
  emits: ["done", "delay"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const isOverdue = common_vendor.computed(() => {
      if (props.item.isDelayed)
        return utils_date.isOverdue(props.item.nextTime);
      return false;
    });
    const daysSinceLast = common_vendor.computed(() => {
      if (!props.item.lastTime)
        return "-";
      return Math.floor(
        (Date.now() - new Date(props.item.lastTime).getTime()) / 864e5
      );
    });
    const doneLabel = common_vendor.computed(() => {
      const labels = {
        water: "已浇",
        fertilize: "已施",
        prune: "已剪",
        pesticide: "已杀虫"
      };
      return labels[props.item.type] || "已完成";
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(_ctx.item.plantName),
        b: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_ICON)[_ctx.item.type]),
        c: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_LABEL)[_ctx.item.type]),
        d: _ctx.item.lastTime
      }, _ctx.item.lastTime ? {
        e: common_vendor.t(daysSinceLast.value)
      } : {}, {
        f: _ctx.item.isDelayed
      }, _ctx.item.isDelayed ? {} : {}, {
        g: common_vendor.t(doneLabel.value),
        h: common_vendor.o(($event) => emit("done", _ctx.item), "dc"),
        i: common_vendor.o(($event) => emit("delay", _ctx.item), "12"),
        j: isOverdue.value ? 1 : "",
        k: _ctx.item.isDelayed ? 1 : ""
      });
    };
  }
});
wx.createComponent(_sfc_main);
