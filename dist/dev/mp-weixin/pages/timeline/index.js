"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cloud = require("../../utils/cloud.js");
const utils_date = require("../../utils/date.js");
const utils_constants = require("../../utils/constants.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const plantId = common_vendor.ref("");
    const plantName = common_vendor.ref("");
    const mode = common_vendor.ref("event");
    const events = common_vendor.ref([]);
    const records = common_vendor.ref([]);
    const startMonth = common_vendor.ref("");
    const endMonth = common_vendor.ref("");
    function getNowMonth() {
      const d = /* @__PURE__ */ new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    function offsetMonth(base, offset) {
      const [y, m] = base.split("-").map(Number);
      const total = y * 12 + (m - 1) + offset;
      const ny = Math.floor(total / 12);
      const nm = total % 12 + 1;
      return `${ny}-${String(nm).padStart(2, "0")}`;
    }
    const filteredEvents = common_vendor.computed(() => {
      if (!startMonth.value || !endMonth.value)
        return events.value;
      return events.value.filter((e) => {
        const d = new Date(e.eventDate);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return m >= startMonth.value && m <= endMonth.value;
      });
    });
    const grouped = common_vendor.computed(() => {
      const groups = {};
      filteredEvents.value.forEach((e) => {
        const key = utils_date.formatDate(e.eventDate).slice(0, 7);
        if (!groups[key])
          groups[key] = [];
        groups[key].push(e);
      });
      return groups;
    });
    const filteredRecords = common_vendor.computed(() => {
      if (!startMonth.value || !endMonth.value)
        return records.value;
      return records.value.filter((r) => {
        const d = new Date(r.createdAt);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return m >= startMonth.value && m <= endMonth.value;
      });
    });
    const groupedRecords = common_vendor.computed(() => {
      const groups = {};
      filteredRecords.value.forEach((r) => {
        const key = utils_date.formatDate(r.createdAt).slice(0, 7);
        if (!groups[key])
          groups[key] = [];
        groups[key].push(r);
      });
      return groups;
    });
    const isCare = common_vendor.computed(() => mode.value === "care");
    function setDefaultRange() {
      const now = getNowMonth();
      if (mode.value === "care") {
        startMonth.value = now;
        endMonth.value = now;
      } else {
        startMonth.value = offsetMonth(now, -2);
        endMonth.value = now;
      }
    }
    function onStartMonthChange(e) {
      startMonth.value = e.detail.value;
    }
    function onEndMonthChange(e) {
      endMonth.value = e.detail.value;
    }
    async function loadData() {
      const plantRes = await utils_cloud.callFunction("plant", { action: "get", plantId: plantId.value });
      if (plantRes.code === 0) {
        plantName.value = plantRes.data.nickname || plantRes.data.name;
      }
      if (mode.value === "care") {
        const recordRes = await utils_cloud.callFunction("care", { action: "records", plantId: plantId.value });
        if (recordRes.code === 0)
          records.value = recordRes.data;
      } else {
        const eventRes = await utils_cloud.callFunction("event", { action: "list", plantId: plantId.value });
        if (eventRes.code === 0)
          events.value = eventRes.data;
      }
    }
    function goAdd() {
      common_vendor.index.navigateTo({ url: `/pages/event-add/index?plantId=${plantId.value}` });
    }
    common_vendor.watch(mode, () => {
      setDefaultRange();
    });
    common_vendor.onLoad((opt) => {
      plantId.value = opt.plantId;
      mode.value = opt.mode || "event";
      setDefaultRange();
      common_vendor.index.setNavigationBarTitle({ title: mode.value === "care" ? "养护记录" : "成长记录" });
    });
    common_vendor.onShow(() => loadData());
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(plantName.value || "植物"),
        b: common_vendor.t(isCare.value ? " 的养护记录" : " 的成长记录"),
        c: !isCare.value
      }, !isCare.value ? {
        d: common_vendor.o(goAdd, "f8")
      } : {}, {
        e: common_vendor.t(startMonth.value),
        f: startMonth.value,
        g: common_vendor.o(onStartMonthChange, "43"),
        h: common_vendor.t(endMonth.value),
        i: endMonth.value,
        j: common_vendor.o(onEndMonthChange, "8c"),
        k: isCare.value
      }, isCare.value ? common_vendor.e({
        l: records.value.length === 0
      }, records.value.length === 0 ? {
        m: common_vendor.t(plantName.value ? "还没有养护记录" : "加载中...")
      } : filteredRecords.value.length === 0 ? {} : {
        o: common_vendor.f(groupedRecords.value, (group, yearMonth, i0) => {
          return {
            a: common_vendor.t(yearMonth),
            b: common_vendor.f(group, (r, k1, i1) => {
              return common_vendor.e({
                a: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_ICON)[r.type]),
                b: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_LABEL)[r.type]),
                c: common_vendor.t(common_vendor.unref(utils_date.formatDateTime)(r.createdAt)),
                d: r.userName
              }, r.userName ? {
                e: common_vendor.t(r.userName)
              } : {}, {
                f: r.note
              }, r.note ? {
                g: common_vendor.t(r.note)
              } : {}, {
                h: r._id
              });
            }),
            c: yearMonth
          };
        })
      }, {
        n: filteredRecords.value.length === 0
      }) : common_vendor.e({
        p: events.value.length === 0
      }, events.value.length === 0 ? {
        q: common_vendor.t(plantName.value ? "还没有记录" : "加载中...")
      } : filteredEvents.value.length === 0 ? {} : {
        s: common_vendor.f(grouped.value, (group, yearMonth, i0) => {
          return {
            a: common_vendor.t(yearMonth),
            b: common_vendor.f(group, (e, k1, i1) => {
              var _a, _b;
              return common_vendor.e({
                a: (_a = e.photos) == null ? void 0 : _a.length
              }, ((_b = e.photos) == null ? void 0 : _b.length) ? {
                b: e.photos[0]
              } : {}, {
                c: common_vendor.t(common_vendor.unref(utils_constants.EVENT_TYPE_LABEL)[e.type]),
                d: common_vendor.t(common_vendor.unref(utils_date.formatDate)(e.eventDate)),
                e: e.description
              }, e.description ? {
                f: common_vendor.t(e.description)
              } : {}, {
                g: e._id
              });
            }),
            c: yearMonth
          };
        })
      }, {
        r: filteredEvents.value.length === 0
      }));
    };
  }
});
wx.createPage(_sfc_main);
