"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cloud = require("../../utils/cloud.js");
const store_family = require("../../store/family.js");
const utils_date = require("../../utils/date.js");
const utils_constants = require("../../utils/constants.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const familyStore = store_family.useFamilyStore();
    const plantId = common_vendor.ref("");
    const plant = common_vendor.ref({});
    const configs = common_vendor.ref([]);
    const rooms = common_vendor.ref([]);
    const recentRecords = common_vendor.ref([]);
    const recentEvents = common_vendor.ref([]);
    const roomName = common_vendor.computed(() => {
      const room = rooms.value.find((r) => r._id === plant.value.roomId);
      return (room == null ? void 0 : room.name) || "未分类";
    });
    async function loadData() {
      const [plantRes, configRes, recordRes, eventRes, roomRes] = await Promise.all([
        utils_cloud.callFunction("plant", { action: "get", plantId: plantId.value }),
        utils_cloud.callFunction("care", { action: "getConfigs", plantId: plantId.value }),
        utils_cloud.callFunction("care", { action: "records", plantId: plantId.value, limit: 1 }),
        utils_cloud.callFunction("event", { action: "list", plantId: plantId.value, limit: 3 }),
        utils_cloud.callFunction("room", { action: "list", familyId: familyStore.currentFamilyId })
      ]);
      if (plantRes.code === 0)
        plant.value = plantRes.data;
      if (configRes.code === 0)
        configs.value = configRes.data.filter((c) => utils_constants.CARE_TYPES.includes(c.type));
      if (recordRes.code === 0)
        recentRecords.value = recordRes.data;
      if (eventRes.code === 0)
        recentEvents.value = eventRes.data.slice(0, 3);
      if (roomRes.code === 0)
        rooms.value = roomRes.data;
    }
    function toggleConfig(configId, e) {
      utils_cloud.callFunction("care", { action: "toggleConfig", configId, enabled: e.detail.value });
    }
    function goTimeline(mode = "event") {
      common_vendor.index.navigateTo({ url: `/pages/timeline/index?plantId=${plantId.value}&mode=${mode}` });
    }
    function goEdit() {
      common_vendor.index.navigateTo({ url: `/pages/plant-add/index?id=${plantId.value}` });
    }
    function moveToMemorial() {
      common_vendor.index.navigateTo({ url: `/pages/memorial-add/index?plantId=${plantId.value}` });
    }
    common_vendor.onLoad((opt) => {
      plantId.value = opt.id;
      loadData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: plant.value.photo
      }, plant.value.photo ? {
        b: plant.value.photo
      } : {}, {
        c: common_vendor.t(plant.value.nickname || plant.value.name),
        d: common_vendor.t(plant.value.species),
        e: common_vendor.t(roomName.value),
        f: common_vendor.t(plant.value.purchaseDate || "未知"),
        g: common_vendor.f(configs.value, (cfg, k0, i0) => {
          return {
            a: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_ICON)[cfg.type]),
            b: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_LABEL)[cfg.type]),
            c: cfg.enabled,
            d: common_vendor.o(($event) => toggleConfig(cfg._id, $event), cfg._id),
            e: common_vendor.t(cfg.intervalDays),
            f: common_vendor.t(cfg.lastTime ? common_vendor.unref(utils_date.formatDate)(cfg.lastTime) : "暂无"),
            g: cfg._id
          };
        }),
        h: configs.value.length === 0
      }, configs.value.length === 0 ? {} : {}, {
        i: common_vendor.o(($event) => goTimeline("care"), "1b"),
        j: common_vendor.f(recentRecords.value, (r, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_ICON)[r.type]),
            b: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_LABEL)[r.type]),
            c: common_vendor.t(common_vendor.unref(utils_date.formatDateTime)(r.createdAt)),
            d: r.userName
          }, r.userName ? {
            e: common_vendor.t(r.userName)
          } : {}, {
            f: r._id
          });
        }),
        k: recentRecords.value.length === 0
      }, recentRecords.value.length === 0 ? {} : {}, {
        l: common_vendor.o(($event) => goTimeline("event"), "22"),
        m: common_vendor.f(recentEvents.value, (e, k0, i0) => {
          var _a, _b;
          return common_vendor.e({
            a: (_a = e.photos) == null ? void 0 : _a.length
          }, ((_b = e.photos) == null ? void 0 : _b.length) ? {
            b: e.photos[0]
          } : {}, {
            c: common_vendor.t(common_vendor.unref(utils_constants.EVENT_TYPE_LABEL)[e.type]),
            d: common_vendor.t(common_vendor.unref(utils_date.formatDate)(e.eventDate)),
            e: e._id
          });
        }),
        n: recentEvents.value.length === 0
      }, recentEvents.value.length === 0 ? {} : {}, {
        o: common_vendor.o(goEdit, "b9"),
        p: common_vendor.o(moveToMemorial, "00")
      });
    };
  }
});
wx.createPage(_sfc_main);
