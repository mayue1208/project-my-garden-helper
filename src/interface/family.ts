import type { MemberRole } from '@/utils/constants';

export interface IFamily {
  _id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  role?: MemberRole;
  createdAt: Date;
}

export interface IFamilyMember {
  _id: string;
  familyId: string;
  userId: string;
  role: MemberRole;
  joinedAt: Date;
  userInfo?: { nickName: string; avatarUrl: string };
}

export interface IRecentOp {
  _id: string;
  plantId: string;
  type: string;
  recordedBy: string;
  createdAt: Date;
  userInfo?: { nickName: string; avatarUrl: string };
  plants?: string[];
}
