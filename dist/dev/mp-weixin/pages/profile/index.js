"use strict";
const common_vendor = require("../../common/vendor.js");
const store_family = require("../../store/family.js");
const store_user = require("../../store/user.js");
const utils_cloud = require("../../utils/cloud.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const familyStore = store_family.useFamilyStore();
    const userStore = store_user.useUserStore();
    const stats = common_vendor.ref({ total: 0, survived: 0, lost: 0 });
    const inviteCode = common_vendor.ref("");
    const newFamilyName = common_vendor.ref("");
    const showJoinPopup = common_vendor.ref(false);
    const showCreatePopup = common_vendor.ref(false);
    const showAuthPopup = common_vendor.ref(false);
    const showEditPopup = common_vendor.ref(false);
    const tempAvatar = common_vendor.ref("");
    const tempNickName = common_vendor.ref("");
    const loggingIn = common_vendor.ref(false);
    async function loadStats() {
      if (!familyStore.currentFamilyId)
        return;
      const res = await utils_cloud.callFunction("memorial", {
        action: "list",
        familyId: familyStore.currentFamilyId
      });
      if (res.code === 0 && res.stats)
        stats.value = res.stats;
    }
    function goFamilyManage(familyId) {
      common_vendor.index.navigateTo({ url: `/pages/family-manage/index?familyId=${familyId}` });
    }
    function showJoin() {
      showJoinPopup.value = true;
    }
    function showCreate() {
      showCreatePopup.value = true;
    }
    async function joinFamily() {
      if (loggingIn.value || !inviteCode.value)
        return;
      loggingIn.value = true;
      common_vendor.index.showLoading({ title: "加入中...", mask: true });
      try {
        const res = await familyStore.joinFamily(inviteCode.value);
        if (res.code === 0) {
          common_vendor.index.showToast({ title: "加入成功" });
          showJoinPopup.value = false;
          inviteCode.value = "";
        } else {
          common_vendor.index.showToast({ title: res.msg || "加入失败", icon: "none" });
        }
      } finally {
        common_vendor.index.hideLoading();
        loggingIn.value = false;
      }
    }
    async function createFamily() {
      if (loggingIn.value || !newFamilyName.value)
        return;
      loggingIn.value = true;
      common_vendor.index.showLoading({ title: "创建中...", mask: true });
      try {
        await familyStore.createFamily(newFamilyName.value);
        common_vendor.index.showToast({ title: "创建成功" });
        showCreatePopup.value = false;
        newFamilyName.value = "";
      } finally {
        common_vendor.index.hideLoading();
        loggingIn.value = false;
      }
    }
    function goSettings() {
      common_vendor.index.navigateTo({ url: "/pages/settings/index" });
    }
    function handleAvatarTap() {
      console.log("handleAvatarTap userStore", userStore);
      if (userStore.isLoggedIn)
        return;
      openAuth();
    }
    function openAuth() {
      tempAvatar.value = "";
      tempNickName.value = "";
      showAuthPopup.value = true;
    }
    function openEdit() {
      var _a, _b;
      tempAvatar.value = ((_a = userStore.userInfo) == null ? void 0 : _a.avatarUrl) || "";
      tempNickName.value = ((_b = userStore.userInfo) == null ? void 0 : _b.nickName) || "";
      showEditPopup.value = true;
    }
    function onChooseAvatar(e) {
      tempAvatar.value = e.detail.avatarUrl;
    }
    function onNickInput(e) {
      tempNickName.value = e.detail.value;
    }
    async function confirmAuth() {
      if (loggingIn.value)
        return;
      loggingIn.value = true;
      common_vendor.index.showLoading({ title: "登录中..." });
      try {
        await common_vendor.index.login({ provider: "weixin" });
        const res = await userStore.login(tempNickName.value, tempAvatar.value);
        common_vendor.index.hideLoading();
        if (res.code === 0) {
          common_vendor.index.showToast({ title: "登录成功" });
          showAuthPopup.value = false;
          await familyStore.loadFamilies();
          await loadStats();
        } else {
          common_vendor.index.showToast({ title: res.msg || "登录失败", icon: "none" });
        }
      } catch (_e2) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "登录失败，请重试", icon: "none" });
      }
      loggingIn.value = false;
    }
    async function confirmEdit() {
      if (loggingIn.value)
        return;
      loggingIn.value = true;
      common_vendor.index.showLoading({ title: "保存中..." });
      try {
        const res = await userStore.updateProfile(tempNickName.value, tempAvatar.value);
        common_vendor.index.hideLoading();
        if (res.code === 0) {
          common_vendor.index.showToast({ title: "修改成功" });
          showEditPopup.value = false;
        } else {
          common_vendor.index.showToast({ title: res.msg || "修改失败", icon: "none" });
        }
      } catch (_e2) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "修改失败，请重试", icon: "none" });
      }
      loggingIn.value = false;
    }
    common_vendor.onShow(async () => {
      await userStore.checkLogin();
      await familyStore.loadFamilies();
      await loadStats();
    });
    return (_ctx, _cache) => {
      var _a, _b, _c;
      return common_vendor.e({
        a: common_vendor.unref(userStore).isLoggedIn && ((_a = common_vendor.unref(userStore).userInfo) == null ? void 0 : _a.avatarUrl)
      }, common_vendor.unref(userStore).isLoggedIn && ((_b = common_vendor.unref(userStore).userInfo) == null ? void 0 : _b.avatarUrl) ? {
        b: common_vendor.unref(userStore).userInfo.avatarUrl
      } : {}, {
        c: common_vendor.t(common_vendor.unref(userStore).isLoggedIn ? ((_c = common_vendor.unref(userStore).userInfo) == null ? void 0 : _c.nickName) || "微信用户" : "点击登录"),
        d: common_vendor.o(handleAvatarTap, "30"),
        e: common_vendor.unref(userStore).isLoggedIn
      }, common_vendor.unref(userStore).isLoggedIn ? {
        f: common_vendor.o(openEdit, "3c")
      } : {}, {
        g: common_vendor.unref(userStore).isLoggedIn
      }, common_vendor.unref(userStore).isLoggedIn ? {
        h: common_vendor.f(common_vendor.unref(familyStore).families, (f, k0, i0) => {
          return {
            a: common_vendor.t(f.name),
            b: common_vendor.t(f.role === "admin" ? "管理员" : "成员"),
            c: f._id,
            d: f._id === common_vendor.unref(familyStore).currentFamilyId ? 1 : "",
            e: common_vendor.o(($event) => goFamilyManage(f._id), f._id)
          };
        }),
        i: common_vendor.o(showJoin, "5f"),
        j: common_vendor.o(showCreate, "25"),
        k: common_vendor.t(stats.value.total),
        l: common_vendor.t(stats.value.survived),
        m: common_vendor.t(stats.value.lost)
      } : {}, {
        n: common_vendor.o(goSettings, "de"),
        o: showAuthPopup.value
      }, showAuthPopup.value ? {
        p: common_vendor.o(($event) => showAuthPopup.value = false, "bb")
      } : {}, {
        q: showAuthPopup.value
      }, showAuthPopup.value ? common_vendor.e({
        r: tempAvatar.value
      }, tempAvatar.value ? {
        s: tempAvatar.value
      } : {}, {
        t: common_vendor.o(onChooseAvatar, "e6"),
        v: tempNickName.value,
        w: common_vendor.o(onNickInput, "f6"),
        x: common_vendor.o(($event) => showAuthPopup.value = false, "82"),
        y: common_vendor.t(loggingIn.value ? "登录中..." : "确认授权"),
        z: common_vendor.o(confirmAuth, "37"),
        A: loggingIn.value
      }) : {}, {
        B: showEditPopup.value
      }, showEditPopup.value ? {
        C: common_vendor.o(($event) => showEditPopup.value = false, "e6")
      } : {}, {
        D: showEditPopup.value
      }, showEditPopup.value ? common_vendor.e({
        E: tempAvatar.value
      }, tempAvatar.value ? {
        F: tempAvatar.value
      } : {}, {
        G: common_vendor.o(onChooseAvatar, "51"),
        H: tempNickName.value,
        I: common_vendor.o(onNickInput, "b2"),
        J: common_vendor.o(($event) => showEditPopup.value = false, "2f"),
        K: common_vendor.t(loggingIn.value ? "保存中..." : "保存修改"),
        L: common_vendor.o(confirmEdit, "45"),
        M: loggingIn.value
      }) : {}, {
        N: showJoinPopup.value
      }, showJoinPopup.value ? {
        O: common_vendor.o(($event) => showJoinPopup.value = false, "10")
      } : {}, {
        P: showJoinPopup.value
      }, showJoinPopup.value ? {
        Q: inviteCode.value,
        R: common_vendor.o(($event) => inviteCode.value = $event.detail.value, "53"),
        S: common_vendor.o(($event) => showJoinPopup.value = false, "10"),
        T: common_vendor.t(loggingIn.value ? "加入中..." : "确认"),
        U: loggingIn.value,
        V: common_vendor.o(joinFamily, "4a")
      } : {}, {
        W: showCreatePopup.value
      }, showCreatePopup.value ? {
        X: common_vendor.o(($event) => showCreatePopup.value = false, "c2")
      } : {}, {
        Y: showCreatePopup.value
      }, showCreatePopup.value ? {
        Z: newFamilyName.value,
        aa: common_vendor.o(($event) => newFamilyName.value = $event.detail.value, "46"),
        ab: common_vendor.o(($event) => showCreatePopup.value = false, "5a"),
        ac: common_vendor.t(loggingIn.value ? "创建中..." : "创建"),
        ad: loggingIn.value,
        ae: common_vendor.o(createFamily, "6b")
      } : {});
    };
  }
});
wx.createPage(_sfc_main);
