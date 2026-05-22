"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cloud = require("../../utils/cloud.js");
const utils_date = require("../../utils/date.js");
const utils_constants = require("../../utils/constants.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const ops = common_vendor.ref([]);
    const userInfo = common_vendor.ref(null);
    const groupedOps = common_vendor.computed(() => {
      const groups = {};
      ops.value.forEach((op) => {
        const key = utils_date.formatDate(op.createdAt);
        if (!groups[key])
          groups[key] = [];
        groups[key].push(op);
      });
      return groups;
    });
    common_vendor.onLoad(async (opt) => {
      const { familyId, userId } = opt;
      const opRes = await utils_cloud.callFunction("family", {
        action: "memberOps",
        familyId,
        memberId: userId
      });
      if (opRes.code === 0)
        ops.value = opRes.data;
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.t(((_a = userInfo.value) == null ? void 0 : _a.nickName) || "家人"),
        b: common_vendor.t(ops.value.length),
        c: Object.keys(groupedOps.value).length === 0
      }, Object.keys(groupedOps.value).length === 0 ? {} : {}, {
        d: common_vendor.f(groupedOps.value, (group, date, i0) => {
          return {
            a: common_vendor.t(date),
            b: common_vendor.f(group, (op, k1, i1) => {
              var _a2;
              return {
                a: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_ICON)[op.type]),
                b: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_LABEL)[op.type] || op.type),
                c: common_vendor.t(((_a2 = op.plants) == null ? void 0 : _a2.join("、")) || ""),
                d: op._id
              };
            }),
            c: date
          };
        })
      });
    };
  }
});
wx.createPage(_sfc_main);
