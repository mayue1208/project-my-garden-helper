import { defineStore } from 'pinia';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { useRoomStore } from '@/store/room';
import type { UserInfo } from '@/interface';

interface UserState {
  userInfo: UserInfo | null;
  isLoggedIn: boolean;
  ready: boolean;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userInfo: null,
    isLoggedIn: false,
    ready: false,
  }),
  actions: {
    async checkLogin() {
      try {
        const { result } = await uni.cloud.callFunction({ name: 'login', data: { action: 'check' } });
        if (result && result.code === 0) {
          this.userInfo = result.data as UserInfo;
          this.isLoggedIn = true;
        }
      } catch (_e) {
        // not logged in
      }
      this.ready = true;
    },
    async login(nickName: string, avatarUrl: string) {
      const res = await callFunction<UserInfo>('login', { nickName, avatarUrl });
      if (res.code === 0) {
        this.userInfo = res.data;
        this.isLoggedIn = true;
      }
      return res;
    },
    async updateProfile(nickName?: string, avatarUrl?: string) {
      const res = await callFunction<UserInfo>('login', {
        action: 'updateProfile',
        nickName,
        avatarUrl,
      });
      if (res.code === 0 && res.data) {
        this.userInfo = res.data;
      }
      return res;
    },
    logout() {
      this.userInfo = null;
      this.isLoggedIn = false;
      this.ready = false;
      // 清除家庭状态
      const familyStore = useFamilyStore();
      familyStore.$reset();
      uni.removeStorageSync('currentFamilyId');
      uni.removeStorageSync('currentFamilyName');
      // 清除房间状态
      const roomStore = useRoomStore();
      roomStore.clear();
    },
  },
});
