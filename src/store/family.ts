import { defineStore } from 'pinia';
import { callFunction } from '@/utils/cloud';
import type { IFamily, IFamilyMember } from '@/interface';

interface FamilyState {
  families: IFamily[];
  currentFamilyId: string;
  currentFamilyName: string;
  members: IFamilyMember[];
}

export const useFamilyStore = defineStore('family', {
  state: (): FamilyState => ({
    families: [],
    currentFamilyId: '',
    currentFamilyName: '',
    members: [],
  }),
  getters: {
    currentFamily: (state): IFamily | null =>
      state.families.find((f) => f._id === state.currentFamilyId) || null,
  },
  actions: {
    async loadFamilies() {
      const res = await callFunction<IFamily[]>('family', { action: 'list' });
      if (res.code === 0) {
        this.families = res.data!;
        if (!this.currentFamilyId && res.data!.length > 0) {
          // 优先选自己创建的家庭（role === 'admin'），其次选第一个
          const adminFamily = res.data!.find((f) => f.role === 'admin');
          const target = adminFamily || res.data![0];
          this.setCurrentFamily(target._id, target.name);
        }
      }
    },
    setCurrentFamily(id: string, name: string) {
      this.currentFamilyId = id;
      this.currentFamilyName = name;
      uni.setStorageSync('currentFamilyId', id);
      uni.setStorageSync('currentFamilyName', name);
    },
    async createFamily(name: string) {
      const res = await callFunction<IFamily>('family', { action: 'create', name });
      if (res.code === 0) {
        await this.loadFamilies();
        this.setCurrentFamily(res.data!._id, res.data!.name);
      }
      return res;
    },
    async joinFamily(inviteCode: string) {
      const res = await callFunction<IFamily>('family', { action: 'join', inviteCode });
      if (res.code === 0) await this.loadFamilies();
      return res;
    },
    async loadMembers(familyId: string) {
      const res = await callFunction<IFamilyMember[]>('family', {
        action: 'members',
        familyId,
      });
      if (res.code === 0) this.members = res.data!;
    },
  },
});
