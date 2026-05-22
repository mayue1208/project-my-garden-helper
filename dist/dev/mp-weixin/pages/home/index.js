"use strict";
const common_vendor = require("../../common/vendor.js");
const store_family = require("../../store/family.js");
const store_room = require("../../store/room.js");
const utils_cloud = require("../../utils/cloud.js");
const store_user = require("../../store/user.js");
if (!Math) {
  (FamilySwitcher + PlantCard)();
}
const FamilySwitcher = () => "../../components/family-switcher/index.js";
const PlantCard = () => "../../components/plant-card/index.js";
const pageSize = 10;
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const familyStore = store_family.useFamilyStore();
    const roomStore = store_room.useRoomStore();
    const plants = common_vendor.ref([]);
    const roomIndex = common_vendor.ref(0);
    const loading = common_vendor.ref(false);
    const page = common_vendor.ref(1);
    const hasMore = common_vendor.ref(true);
    const refreshing = common_vendor.ref(false);
    const groupedPlants = common_vendor.computed(() => {
      const groups = {};
      if (roomIndex.value === 0) {
        plants.value.forEach((p) => {
          var _a;
          const room = ((_a = roomStore.roomMap[p.roomId]) == null ? void 0 : _a.name) || "未分类";
          if (!groups[room])
            groups[room] = { room, plants: [] };
          groups[room].plants.push(p);
        });
        return Object.values(groups);
      }
      const selectedRoom = roomStore.rooms[roomIndex.value - 1];
      return [
        {
          room: (selectedRoom == null ? void 0 : selectedRoom.name) || "",
          plants: plants.value.filter((p) => p.roomId === (selectedRoom == null ? void 0 : selectedRoom._id))
        }
      ];
    });
    const plantCount = common_vendor.computed(() => plants.value.length);
    const needWaterCount = common_vendor.computed(() => {
      return plants.value.filter((p) => {
        var _a;
        const water = (_a = p.recentRecords) == null ? void 0 : _a.find((r) => r.type === "water");
        if (!water)
          return true;
        const now = /* @__PURE__ */ new Date();
        const recordDate = new Date(water.createdAt);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
        const days = Math.floor((today.getTime() - recordDay.getTime()) / 864e5);
        return days >= 7;
      }).length;
    });
    const userStore = store_user.useUserStore();
    async function loadData(reset = false) {
      if (!userStore.isLoggedIn)
        return;
      if (!familyStore.currentFamilyId)
        return;
      if (reset) {
        page.value = 1;
        hasMore.value = true;
        plants.value = [];
        loading.value = true;
      }
      if (!hasMore.value && !reset)
        return;
      const plantRes = await utils_cloud.callFunction("plant", {
        action: "list",
        familyId: familyStore.currentFamilyId,
        page: page.value,
        pageSize
      });
      if (plantRes.code === 0) {
        if (reset) {
          plants.value = plantRes.data;
        } else {
          plants.value = [...plants.value, ...plantRes.data || []];
        }
        hasMore.value = plantRes.hasMore ?? false;
      }
      loading.value = false;
      refreshing.value = false;
    }
    function onRefresh() {
      refreshing.value = true;
      loadData(true).then(() => {
        refreshing.value = false;
      });
    }
    function onReachBottom() {
      if (!hasMore.value || loading.value)
        return;
      page.value++;
      loadData();
    }
    function onRoomChange(e) {
      roomIndex.value = Number(e.detail.value);
    }
    function goDetail(id) {
      common_vendor.index.navigateTo({ url: `/pages/plant-detail/index?id=${id}` });
    }
    function goAdd() {
      common_vendor.index.navigateTo({ url: "/pages/plant-add/index" });
    }
    function goToProfile() {
      common_vendor.index.switchTab({ url: "/pages/profile/index" });
    }
    common_vendor.onShow(() => {
      if (userStore.isLoggedIn && familyStore.currentFamilyId) {
        loadData(true);
      }
    });
    common_vendor.onMounted(() => {
      common_vendor.index.$on("familyChanged", () => loadData(true));
      common_vendor.index.$on("appReady", () => loadData(true));
      if (userStore.isLoggedIn && familyStore.currentFamilyId) {
        loadData(true);
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(common_vendor.unref(roomStore).roomOptions[roomIndex.value]),
        b: common_vendor.o(onRoomChange, "21"),
        c: roomIndex.value,
        d: common_vendor.unref(roomStore).roomOptions,
        e: !common_vendor.unref(userStore).isLoggedIn
      }, !common_vendor.unref(userStore).isLoggedIn ? {
        f: common_vendor.o(goToProfile, "b4")
      } : {}, {
        g: common_vendor.unref(userStore).isLoggedIn
      }, common_vendor.unref(userStore).isLoggedIn ? common_vendor.e({
        h: loading.value && plants.value.length === 0
      }, loading.value && plants.value.length === 0 ? {} : !loading.value && plants.value.length === 0 ? {} : {}, {
        i: !loading.value && plants.value.length === 0,
        j: common_vendor.f(groupedPlants.value, (group, k0, i0) => {
          return {
            a: common_vendor.t(group.room),
            b: common_vendor.f(group.plants, (p, k1, i1) => {
              return {
                a: "2453bf46-1-" + i0 + "-" + i1,
                b: common_vendor.p({
                  plant: p
                }),
                c: p._id,
                d: common_vendor.o(($event) => goDetail(p._id), p._id)
              };
            }),
            c: group.room
          };
        }),
        k: plants.value.length > 0
      }, plants.value.length > 0 ? common_vendor.e({
        l: loading.value
      }, loading.value ? {} : !hasMore.value ? {} : {}, {
        m: !hasMore.value
      }) : {}) : {}, {
        n: refreshing.value,
        o: common_vendor.o(onRefresh, "38"),
        p: common_vendor.o(onReachBottom, "d2"),
        q: common_vendor.t(plantCount.value),
        r: common_vendor.t(needWaterCount.value),
        s: common_vendor.o(goAdd, "01")
      });
    };
  }
});
wx.createPage(_sfc_main);
