"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cloud = require("../../utils/cloud.js");
const store_family = require("../../store/family.js");
const utils_date = require("../../utils/date.js");
const utils_constants = require("../../utils/constants.js");
const store_user = require("../../store/user.js");
if (!Math) {
  (FamilySwitcher + ReminderItem + QuickRecord)();
}
const FamilySwitcher = () => "../../components/family-switcher/index.js";
const ReminderItem = () => "../../components/reminder-item/index.js";
const QuickRecord = () => "../../components/quick-record/index.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const familyStore = store_family.useFamilyStore();
    const submitting = common_vendor.ref(false);
    const reminders = common_vendor.ref([]);
    const rooms = common_vendor.ref([]);
    const roomIndex = common_vendor.ref(0);
    const timeTab = common_vendor.ref("today");
    const timeTabDays = {
      today: 1,
      "2days": 2,
      "3days": 3,
      "7days": 7
    };
    const delayTarget = common_vendor.ref(null);
    const showQuickPanel = common_vendor.ref(false);
    const showDelayPanel = common_vendor.ref(false);
    const roomOptions = common_vendor.computed(() => [
      "全部房间",
      ...rooms.value.map((r) => r.name)
    ]);
    const groupedReminders = common_vendor.computed(() => {
      const groups = {};
      const now = /* @__PURE__ */ new Date();
      const today = utils_date.formatDate(now);
      reminders.value.forEach((r) => {
        const key = utils_date.formatDate(r.nextTime);
        if (timeTab.value === "today") {
          if (key <= today) {
            if (!groups[today])
              groups[today] = [];
            groups[today].push(r);
          }
        } else {
          if (!groups[key])
            groups[key] = [];
          groups[key].push(r);
        }
      });
      return groups;
    });
    function dateLabel(dateStr) {
      if (utils_date.isToday(dateStr))
        return "📅 今日";
      return `📅 ${dateStr}`;
    }
    const userStore = store_user.useUserStore();
    async function loadReminders() {
      if (!userStore.isLoggedIn)
        return;
      if (!familyStore.currentFamilyId)
        return;
      const selectedRoom = roomIndex.value > 0 ? rooms.value[roomIndex.value - 1]._id : null;
      const [remindRes, roomRes] = await Promise.all([
        utils_cloud.callFunction("care", {
          action: "reminders",
          familyId: familyStore.currentFamilyId,
          roomId: selectedRoom,
          days: timeTabDays[timeTab.value]
        }),
        utils_cloud.callFunction("room", {
          action: "list",
          familyId: familyStore.currentFamilyId
        })
      ]);
      if (remindRes.code === 0)
        reminders.value = remindRes.data;
      if (roomRes.code === 0)
        rooms.value = roomRes.data;
    }
    async function markDone(item) {
      if (submitting.value)
        return;
      submitting.value = true;
      common_vendor.index.showLoading({ title: "记录中...", mask: true });
      try {
        await utils_cloud.callFunction("care", {
          action: "record",
          plantId: item.plantId,
          familyId: familyStore.currentFamilyId,
          type: item.type
        });
        common_vendor.index.showToast({ title: "已记录", icon: "success" });
        await loadReminders();
      } finally {
        common_vendor.index.hideLoading();
        submitting.value = false;
      }
    }
    function delayReminder(item) {
      delayTarget.value = item;
      showDelayPanel.value = true;
    }
    async function confirmDelay(opt) {
      if (submitting.value || !delayTarget.value)
        return;
      submitting.value = true;
      common_vendor.index.showLoading({ title: "处理中...", mask: true });
      try {
        await utils_cloud.callFunction("delayed_reminders", {
          action: "create",
          plantId: delayTarget.value.plantId,
          familyId: familyStore.currentFamilyId,
          type: delayTarget.value.type,
          remindAt: new Date(opt.getTime()).toISOString()
        });
        common_vendor.index.showToast({ title: "已延后" });
        delayTarget.value = null;
        showDelayPanel.value = false;
        await loadReminders();
      } finally {
        common_vendor.index.hideLoading();
        submitting.value = false;
      }
    }
    function showQuickRecord() {
      showQuickPanel.value = true;
    }
    function onRoomChange(e) {
      roomIndex.value = e.detail.value;
      loadReminders();
    }
    function goToProfile() {
      common_vendor.index.switchTab({ url: "/pages/profile/index" });
    }
    common_vendor.onShow(() => loadReminders());
    common_vendor.onMounted(() => {
      common_vendor.index.$on("familyChanged", loadReminders);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !common_vendor.unref(userStore).isLoggedIn
      }, !common_vendor.unref(userStore).isLoggedIn ? {
        b: common_vendor.o(goToProfile, "8b")
      } : {}, {
        c: common_vendor.unref(userStore).isLoggedIn
      }, common_vendor.unref(userStore).isLoggedIn ? common_vendor.e({
        d: common_vendor.t(roomOptions.value[roomIndex.value]),
        e: common_vendor.o(onRoomChange, "f4"),
        f: roomIndex.value,
        g: roomOptions.value,
        h: timeTab.value === "today" ? 1 : "",
        i: common_vendor.o(($event) => {
          timeTab.value = "today";
          loadReminders();
        }, "a3"),
        j: timeTab.value === "2days" ? 1 : "",
        k: common_vendor.o(($event) => {
          timeTab.value = "2days";
          loadReminders();
        }, "0d"),
        l: timeTab.value === "3days" ? 1 : "",
        m: common_vendor.o(($event) => {
          timeTab.value = "3days";
          loadReminders();
        }, "f5"),
        n: timeTab.value === "7days" ? 1 : "",
        o: common_vendor.o(($event) => {
          timeTab.value = "7days";
          loadReminders();
        }, "9b"),
        p: common_vendor.o(showQuickRecord, "5a"),
        q: Object.keys(groupedReminders.value).length === 0
      }, Object.keys(groupedReminders.value).length === 0 ? {} : {}, {
        r: common_vendor.f(groupedReminders.value, (group, date, i0) => {
          return {
            a: common_vendor.t(dateLabel(date)),
            b: common_vendor.f(group, (item, k1, i1) => {
              return {
                a: `${item.plantId}_${item.type}`,
                b: common_vendor.o(markDone, `${item.plantId}_${item.type}`),
                c: common_vendor.o(delayReminder, `${item.plantId}_${item.type}`),
                d: "1926edce-1-" + i0 + "-" + i1,
                e: common_vendor.p({
                  item
                })
              };
            }),
            c: date
          };
        }),
        s: common_vendor.o(($event) => showQuickPanel.value = $event, "f3"),
        t: common_vendor.p({
          visible: showQuickPanel.value
        }),
        v: showDelayPanel.value
      }, showDelayPanel.value ? {
        w: common_vendor.o(($event) => showDelayPanel.value = false, "f5")
      } : {}, {
        x: showDelayPanel.value
      }, showDelayPanel.value ? {
        y: common_vendor.f(common_vendor.unref(utils_constants.DELAY_OPTIONS), (opt, k0, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: opt.label,
            c: common_vendor.o(($event) => confirmDelay(opt), opt.label)
          };
        }),
        z: common_vendor.o(($event) => showDelayPanel.value = false, "c0")
      } : {}) : {});
    };
  }
});
wx.createPage(_sfc_main);
