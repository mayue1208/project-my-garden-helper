import { callFunction } from '@/utils/cloud';
import type { IFamily, IFamilyMember, IRecentOp } from '@/interface';

export function getFamilyList() {
  return callFunction<IFamily[]>('family', { action: 'list' });
}

export function createFamily(name: string) {
  return callFunction<IFamily>('family', { action: 'create', name });
}

export function joinFamily(inviteCode: string) {
  return callFunction<IFamily>('family', { action: 'join', inviteCode });
}

export function getFamilyMembers(familyId: string) {
  return callFunction<IFamilyMember[]>('family', { action: 'members', familyId });
}

export function getRecentOps(familyId: string) {
  return callFunction<IRecentOp[]>('family', { action: 'recentOps', familyId });
}

export function getMemberOps(familyId: string, memberId: string) {
  return callFunction<IRecentOp[]>('family', { action: 'memberOps', familyId, memberId });
}
