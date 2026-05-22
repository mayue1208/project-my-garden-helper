"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cloud = require("../../utils/cloud.js");
const store_family = require("../../store/family.js");
const store_room = require("../../store/room.js");
const utils_constants = require("../../utils/constants.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const familyStore = store_family.useFamilyStore();
    const roomStore = store_room.useRoomStore();
    const submitting = common_vendor.ref(false);
    const loading = common_vendor.ref(false);
    const editId = common_vendor.ref("");
    const isEdit = common_vendor.ref(false);
    const displayCareTypes = ["water", "fertilize", "prune", "repot", "pesticide"];
    function initCareConfigs() {
      const waterSetting = common_vendor.index.getStorageSync("remindWater");
      const fertilizeSetting = common_vendor.index.getStorageSync("remindFertilize");
      return {
        water: { enabled: waterSetting !== false, intervalDays: utils_constants.DEFAULT_CARE_INTERVALS.water },
        fertilize: { enabled: fertilizeSetting !== false, intervalDays: utils_constants.DEFAULT_CARE_INTERVALS.fertilize },
        prune: { enabled: false, intervalDays: utils_constants.DEFAULT_CARE_INTERVALS.prune },
        repot: { enabled: false, intervalDays: utils_constants.DEFAULT_CARE_INTERVALS.repot },
        pesticide: { enabled: false, intervalDays: utils_constants.DEFAULT_CARE_INTERVALS.pesticide }
      };
    }
    const form = common_vendor.reactive({
      name: "",
      species: "",
      nickname: "",
      photo: "",
      roomId: "",
      roomName: "",
      purchaseDate: "",
      note: "",
      careConfigs: initCareConfigs()
    });
    async function chooseImage() {
      const res = await common_vendor.index.chooseImage({ count: 1 });
      const filePath = res.tempFilePaths[0];
      common_vendor.index.showLoading({ title: "上传中..." });
      const cloudRes = await common_vendor.index.cloud.uploadFile({
        cloudPath: `plants/${Date.now()}.jpg`,
        filePath
      });
      form.photo = cloudRes.fileID;
      common_vendor.index.hideLoading();
    }
    function onRoomChange(e) {
      const room = roomStore.rooms[e.detail.value];
      form.roomId = room._id;
      form.roomName = room.name;
    }
    function onDateChange(e) {
      form.purchaseDate = e.detail.value;
    }
    function onCareToggle(type, e) {
      form.careConfigs[type].enabled = e.detail.value;
    }
    async function submit() {
      if (submitting.value)
        return;
      if (!form.name) {
        common_vendor.index.showToast({ title: "请输入植物名称", icon: "none" });
        return;
      }
      if (!form.roomId) {
        common_vendor.index.showToast({ title: "请选择房间", icon: "none" });
        return;
      }
      const configs = Object.entries(form.careConfigs).filter(([, cfg]) => cfg.enabled).map(([type, cfg]) => ({
        type,
        intervalDays: cfg.intervalDays
      }));
      submitting.value = true;
      common_vendor.index.showLoading({ title: "保存中...", mask: true });
      try {
        const action = isEdit.value ? "update" : "create";
        const params = {
          action,
          familyId: familyStore.currentFamilyId,
          data: {
            name: form.name,
            species: form.species,
            nickname: form.nickname,
            photo: form.photo,
            roomId: form.roomId,
            purchaseDate: form.purchaseDate,
            note: form.note,
            careConfigs: configs
          }
        };
        if (isEdit.value)
          params.plantId = editId.value;
        const res = await utils_cloud.callFunction("plant", params);
        if (res.code === 0) {
          common_vendor.index.showToast({ title: isEdit.value ? "修改成功" : "添加成功" });
          setTimeout(() => common_vendor.index.navigateBack(), 1500);
        } else {
          common_vendor.index.showToast({ title: res.msg || "保存失败", icon: "none" });
        }
      } catch (e) {
        const msg = (e == null ? void 0 : e.errMsg) || (e == null ? void 0 : e.message) || JSON.stringify(e);
        common_vendor.index.showToast({ title: "调用失败: " + msg, icon: "none", duration: 4e3 });
      } finally {
        common_vendor.index.hideLoading();
        submitting.value = false;
      }
    }
    async function loadPlantData() {
      loading.value = true;
      common_vendor.index.showLoading({ title: "加载中..." });
      try {
        const [plantRes, configRes] = await Promise.all([
          utils_cloud.callFunction("plant", { action: "get", plantId: editId.value }),
          utils_cloud.callFunction("care", { action: "getConfigs", plantId: editId.value })
        ]);
        if (plantRes.code === 0 && plantRes.data) {
          const p = plantRes.data;
          form.name = p.name || "";
          form.species = p.species || "";
          form.nickname = p.nickname || "";
          form.photo = p.photo || "";
          form.roomId = p.roomId || "";
          form.purchaseDate = p.purchaseDate || "";
          form.note = p.note || "";
          if (p.roomId && roomStore.rooms.length > 0) {
            const room = roomStore.rooms.find((r) => r._id === p.roomId);
            if (room)
              form.roomName = room.name;
          }
        }
        if (configRes.code === 0 && configRes.data) {
          for (const cfg of configRes.data) {
            if (form.careConfigs[cfg.type]) {
              form.careConfigs[cfg.type].enabled = cfg.enabled;
              form.careConfigs[cfg.type].intervalDays = cfg.intervalDays;
            }
          }
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
        loading.value = false;
      }
    }
    common_vendor.onLoad((opt) => {
      if (opt == null ? void 0 : opt.id) {
        editId.value = opt.id;
        isEdit.value = true;
        common_vendor.index.setNavigationBarTitle({ title: "修改植物" });
      }
    });
    common_vendor.onShow(async () => {
      if (!familyStore.currentFamilyId)
        return;
      if (roomStore.rooms.length === 0)
        await roomStore.loadRooms();
      if (isEdit.value && !form.name && editId.value) {
        loadPlantData();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: form.photo
      }, form.photo ? {
        b: form.photo
      } : {}, {
        c: common_vendor.o(chooseImage, "38"),
        d: form.name,
        e: common_vendor.o(($event) => form.name = $event.detail.value, "4b"),
        f: form.species,
        g: common_vendor.o(($event) => form.species = $event.detail.value, "db"),
        h: form.nickname,
        i: common_vendor.o(($event) => form.nickname = $event.detail.value, "3f"),
        j: common_vendor.t(form.roomName || "选择房间"),
        k: common_vendor.o(onRoomChange, "e4"),
        l: common_vendor.unref(roomStore).rooms.map((r) => r.name),
        m: common_vendor.t(form.purchaseDate || "选择日期"),
        n: common_vendor.o(onDateChange, "ab"),
        o: common_vendor.f(displayCareTypes, (ct, k0, i0) => {
          return {
            a: form.careConfigs[ct].enabled,
            b: common_vendor.o(($event) => onCareToggle(ct, $event), ct),
            c: common_vendor.t(common_vendor.unref(utils_constants.CARE_TYPE_LABEL)[ct]),
            d: form.careConfigs[ct].intervalDays,
            e: common_vendor.o(common_vendor.m(($event) => form.careConfigs[ct].intervalDays = $event.detail.value, {
              number: true
            }), ct),
            f: ct
          };
        }),
        p: form.note,
        q: common_vendor.o(($event) => form.note = $event.detail.value, "56"),
        r: common_vendor.t(submitting.value ? "保存中..." : isEdit.value ? "更新" : "保存"),
        s: submitting.value,
        t: common_vendor.o(submit, "f8")
      });
    };
  }
});
wx.createPage(_sfc_main);
